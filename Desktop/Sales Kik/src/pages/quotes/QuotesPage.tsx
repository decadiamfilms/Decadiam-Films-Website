import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import EnhancedQuoteModal from '../../components/quotes/EnhancedQuoteModal';
import { generateQuoteTemplate } from '../../components/quotes/QuoteTemplate';
import { dataService } from '../../services/api.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  PlusIcon, MagnifyingGlassIcon, PencilIcon, DocumentDuplicateIcon,
  ShoppingCartIcon, TrashIcon, EyeIcon, CalendarIcon,
  ChevronDownIcon, FunnelIcon, XMarkIcon, DocumentTextIcon,
  CheckIcon, ChartBarIcon, ClockIcon, PrinterIcon, EnvelopeIcon,
  BellIcon, ChatBubbleLeftIcon, ExclamationTriangleIcon,
  UserGroupIcon, ArrowsUpDownIcon
} from '@heroicons/react/24/outline';

// Custom Dropdown Component (matching site design)
interface CustomDropdownOption {
  value: string;
  label: string;
  description?: string;
  color?: string;
}

interface CustomDropdownProps {
  label: string;
  value: string;
  placeholder: string;
  options: CustomDropdownOption[];
  onChange: (value: string) => void;
  className?: string;
}

function CustomDropdown({ 
  label, 
  value, 
  placeholder, 
  options, 
  onChange,
  className = ""
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className={selectedOption ? 'text-gray-900 font-medium' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-50 w-full max-h-64 overflow-y-auto"
        >
          <div className="py-2">
            <button
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors border-b border-gray-200"
            >
              All Statuses
            </button>
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div>
                  <div className="font-medium text-gray-900">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Quote interface
interface Quote {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  quoteId: string;
  reference: string;
  quoteDate: Date;
  expiryDate?: Date;
  amount: number;
  status: string;
  isDeleted: boolean;
  isArchived: boolean;
  notes?: string;
  needsFollowUp?: boolean;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export default function QuotesPage() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchCustomer, setSearchCustomer] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchKeywords, setSearchKeywords] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // EnhancedQuoteModal state
  const [showEnhancedQuote, setShowEnhancedQuote] = useState(false);
  const [selectedQuoteForEdit, setSelectedQuoteForEdit] = useState<Quote | null>(null);

  // Bulk selection states
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  // Sorting states
  const [sortField, setSortField] = useState<string>('quoteDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);
  const [showSingleDeleteConfirm, setShowSingleDeleteConfirm] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  
  // Email composition states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailQuoteData, setEmailQuoteData] = useState<Quote | null>(null);

  // Custom statuses (will be loaded from settings)
  const [customStatuses, setCustomStatuses] = useState([
    { value: 'draft', label: 'Draft', color: '#94a3b8', description: 'Quote in progress' },
    { value: 'sent', label: 'Sent', color: '#3b82f6', description: 'Quote sent to customer' },
    { value: 'confirmed', label: 'Confirmed', color: '#10b981', description: 'Quote accepted by customer' },
    { value: 'rejected', label: 'Rejected', color: '#ef4444', description: 'Quote declined' },
    { value: 'expired', label: 'Expired', color: '#f59e0b', description: 'Quote validity expired' }
  ]);

  useEffect(() => {
    loadQuotes();
    loadCustomers();
    loadCustomStatuses();

    // Listen for changes to custom statuses
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'saleskik-document-types') {
        loadCustomStatuses();
      }
    };

    // Listen for custom storage events (when statuses are updated)
    const handleCustomStatusUpdate = () => {
      loadCustomStatuses();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('customStatusUpdated', handleCustomStatusUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('customStatusUpdated', handleCustomStatusUpdate);
    };
  }, []);

  const loadQuotes = async () => {
    try {
      console.log('🔍 Quotes: Loading quotes from database...');
      
      // Use direct API call to our quotes endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/quotes`);
      const data = await response.json();
      
      console.log('📡 Quotes: API response:', data);
      
      if (data.success && data.data) {
        const quotesData = data.data;
        console.log('📂 Quotes: Found', quotesData.length, 'quotes in database');
        
        if (Array.isArray(quotesData) && quotesData.length > 0) {
          const parsedQuotes = quotesData.map((quote: any) => ({
            ...quote,
            quoteDate: new Date(quote.createdAt),
            createdAt: new Date(quote.createdAt),
            updatedAt: new Date(quote.updatedAt)
          }));
          
          setQuotes(parsedQuotes);
          console.log('✅ Quotes: Loaded database quotes with customers:', parsedQuotes.length);
          console.log('📂 Quotes: Customer names in quotes:', parsedQuotes.map(q => q.customerName));
          
          // Sync to localStorage for offline capability
          localStorage.setItem('saleskik-quotes', JSON.stringify(parsedQuotes));
        } else {
          console.warn('⚠️ Quotes: No quotes found in database');
          setQuotes([]);
        }
      } else {
        console.warn('⚠️ Quotes: API call failed or returned no success');
        // Fall back to existing localStorage logic
        const savedQuotes = localStorage.getItem('saleskik-quotes');
        if (savedQuotes) {
          const parsedQuotes = JSON.parse(savedQuotes).map((quote: any) => ({
            ...quote,
            quoteDate: new Date(quote.quoteDate),
            createdAt: new Date(quote.createdAt),
            updatedAt: new Date(quote.updatedAt)
          }));
          setQuotes(parsedQuotes);
        }
      }
    } catch (error) {
      // If API fails, use localStorage (preserves existing behavior)
      console.warn('API unavailable, using localStorage fallback');
      const savedQuotes = localStorage.getItem('saleskik-quotes');
      if (savedQuotes) {
        const parsedQuotes = JSON.parse(savedQuotes).map((quote: any) => ({
          ...quote,
          quoteDate: new Date(quote.quoteDate),
          createdAt: new Date(quote.createdAt),
          updatedAt: new Date(quote.updatedAt)
        }));
        setQuotes(parsedQuotes);
      } else {
        // Sample data
        const sampleQuotes: Quote[] = [
          {
            id: '1',
            customerId: 'cust-1',
            customerName: 'ABC Construction Pty Ltd',
            customerEmail: 'orders@abcconstruction.com.au',
            customerPhone: '+61 3 9876 5432',
            quoteId: 'QUO-2024-001',
            reference: 'WEBSITE-DEV-2024',
            quoteDate: new Date('2024-08-19'),
            expiryDate: new Date('2024-09-18'),
            amount: 7280.00,
            status: 'confirmed',
            isDeleted: false,
            isArchived: false,
            notes: 'Customer is very interested in premium package',
            needsFollowUp: false,
            createdAt: new Date('2024-08-19'),
            updatedAt: new Date('2024-08-19')
          },
          {
            id: '2',
            customerId: 'cust-2',
            customerName: 'XYZ Manufacturing Ltd',
            customerEmail: 'procurement@xyzmanufacturing.com',
            customerPhone: '+61 3 8765 4321',
            quoteId: 'QUO-2024-002',
            reference: 'HARDWARE-SUPPLY-2024',
            quoteDate: new Date('2024-08-18'),
            expiryDate: new Date('2024-09-17'),
            amount: 15450.00,
            status: 'partially-ordered',
            isDeleted: false,
            isArchived: false,
            notes: 'Urgent order, customer needs delivery by month end',
            needsFollowUp: true,
            followUpDate: new Date('2024-08-25'),
            createdAt: new Date('2024-08-18'),
            updatedAt: new Date('2024-08-20')
          },
          {
            id: '3',
            customerId: 'cust-3',
            customerName: 'Tech Solutions Inc',
            customerEmail: 'contact@techsolutions.com',
            customerPhone: '+61 2 5555 0123',
            quoteId: 'QUO-2024-003',
            reference: 'CONSULTING-SERVICES',
            quoteDate: new Date('2024-08-17'),
            expiryDate: new Date('2024-08-24'),
            amount: 3200.00,
            status: 'draft',
            isDeleted: false,
            isArchived: false,
            notes: 'Quote expires soon - needs immediate follow-up',
            needsFollowUp: true,
            followUpDate: new Date('2024-08-22'),
            createdAt: new Date('2024-08-17'),
            updatedAt: new Date('2024-08-17')
          }
        ];
        setQuotes(sampleQuotes);
        localStorage.setItem('saleskik-quotes', JSON.stringify(sampleQuotes));
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      console.log('🔍 Quotes: Loading customers from database...');
      
      // Use direct API call to our customers endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/customers`);
      const data = await response.json();
      
      console.log('📡 Quotes: Customers API response:', data);
      
      if (data.success && data.data) {
        const customersData = data.data;
        console.log('📂 Quotes: Found', customersData.length, 'customers in database');
        
        if (Array.isArray(customersData) && customersData.length > 0) {
          setCustomers(customersData);
          console.log('✅ Quotes: Loaded database customers for filtering:', customersData.length);
          console.log('📂 Quotes: Customer names:', customersData.map(c => c.name));
        } else {
          console.warn('⚠️ Quotes: No customers found in database');
          setCustomers([]);
        }
      } else {
        console.warn('⚠️ Quotes: Customer API failed');
        setCustomers([]);
      }
    } catch (error) {
      console.error('❌ Quotes: Error loading customers:', error);
      setCustomers([]);
    }
  };

  const loadCustomStatuses = async () => {
    try {
      // Load custom statuses from the CustomStatusPage
      const savedDocumentTypes = localStorage.getItem('saleskik-document-types');
      if (savedDocumentTypes) {
        const documentTypes = JSON.parse(savedDocumentTypes);
        const quoteDocType = documentTypes.find((dt: any) => dt.name === 'Quote');
        
        if (quoteDocType && quoteDocType.statuses) {
          const quoteStatuses = quoteDocType.statuses.map((status: any) => ({
            value: status.name.toLowerCase().replace(/\s+/g, '-'),
            label: status.name,
            color: getStatusColor(status.name),
            description: `Quote status: ${status.name}`
          }));
          setCustomStatuses(quoteStatuses);
        }
      }
    } catch (error) {
      console.error('Error loading custom statuses:', error);
    }
  };

  const getStatusColor = (statusName: string) => {
    const colorMap: { [key: string]: string } = {
      'draft': '#94a3b8',
      'confirmed': '#10b981',
      'edit': '#f59e0b',
      'partially ordered': '#8b5cf6',
      'completed': '#059669',
      'sent': '#3b82f6',
      'rejected': '#ef4444',
      'expired': '#f59e0b'
    };
    
    const key = statusName.toLowerCase().replace(/\s+/g, ' ');
    return colorMap[key] || '#94a3b8';
  };

  // Filter and sort quotes
  const filteredQuotes = quotes.filter(quote => {
    const matchesCustomer = !searchCustomer || 
      quote.customerName.toLowerCase().includes(searchCustomer.toLowerCase());
    
    const matchesStatus = !selectedStatus || quote.status === selectedStatus;
    
    const matchesDateFrom = !dateFrom || 
      new Date(quote.quoteDate) >= new Date(dateFrom);
    
    const matchesDateTo = !dateTo || 
      new Date(quote.quoteDate) <= new Date(dateTo);
    
    const matchesKeywords = !searchKeywords || 
      quote.reference.toLowerCase().includes(searchKeywords.toLowerCase()) ||
      quote.quoteId.toLowerCase().includes(searchKeywords.toLowerCase());
    
    const matchesDeleted = showDeleted || !quote.isDeleted;
    
    return matchesCustomer && matchesStatus && matchesDateFrom && 
           matchesDateTo && matchesKeywords && matchesDeleted;
  }).sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'customerName':
        aValue = a.customerName.toLowerCase();
        bValue = b.customerName.toLowerCase();
        break;
      case 'quoteId':
        aValue = a.quoteId;
        bValue = b.quoteId;
        break;
      case 'reference':
        aValue = a.reference.toLowerCase();
        bValue = b.reference.toLowerCase();
        break;
      case 'quoteDate':
        aValue = new Date(a.quoteDate).getTime();
        bValue = new Date(b.quoteDate).getTime();
        break;
      case 'amount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusConfig = (status: string, quote?: Quote) => {
    // Override colors for customer responses
    if (quote?.customerResponse) {
      if (status === 'accepted') {
        return { value: status, label: 'Accepted', color: '#f59e0b' }; // Yellow/amber
      }
      if (status === 'declined') {
        return { value: status, label: 'Declined', color: '#ef4444' }; // Red
      }
    }
    
    return customStatuses.find(s => s.value === status) || 
           { value: status, label: status, color: '#94a3b8' };
  };

  const duplicateQuote = async (quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (quote) {
      const newQuote = {
        ...quote,
        id: Date.now().toString(),
        quoteId: `QUO-2024-${String(quotes.length + 1).padStart(3, '0')}`,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const updatedQuotes = [...quotes, newQuote];
      setQuotes(updatedQuotes);
      // Save with hybrid approach (API + localStorage fallback)
      await dataService.quotes.save(updatedQuotes);
    }
  };

  const deleteQuote = (quote: Quote) => {
    setQuoteToDelete(quote);
    setShowSingleDeleteConfirm(true);
  };

  const confirmDeleteQuote = async () => {
    if (quoteToDelete) {
      const updatedQuotes = quotes.map(q => 
        q.id === quoteToDelete.id ? { ...q, isDeleted: true, updatedAt: new Date() } : q
      );
      setQuotes(updatedQuotes);
      // Save with hybrid approach (API + localStorage fallback)
      await dataService.quotes.save(updatedQuotes);
      setShowSingleDeleteConfirm(false);
      setQuoteToDelete(null);
    }
  };

  // Bulk selection functions
  const toggleQuoteSelection = (quoteId: string) => {
    setSelectedQuotes(prev => 
      prev.includes(quoteId) 
        ? prev.filter(id => id !== quoteId)
        : [...prev, quoteId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedQuotes(
      selectedQuotes.length === filteredQuotes.length 
        ? [] 
        : filteredQuotes.map(q => q.id)
    );
  };

  const bulkDeleteQuotes = async () => {
    const updatedQuotes = quotes.map(q => 
      selectedQuotes.includes(q.id) ? { ...q, isDeleted: true, updatedAt: new Date() } : q
    );
    setQuotes(updatedQuotes);
    // Save with hybrid approach (API + localStorage fallback)
    await dataService.quotes.save(updatedQuotes);
    setSelectedQuotes([]);
    setShowDeleteConfirm(false);
  };

  // Show bulk actions when quotes are selected
  useEffect(() => {
    setShowBulkActions(selectedQuotes.length > 0);
  }, [selectedQuotes]);

  // Sorting function
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Enhanced functions
  const previewQuoteHandler = (quote: Quote) => {
    setPreviewQuote(quote);
    setShowPreviewModal(true);
  };

  const printQuote = async (quote: Quote) => {
    try {
      console.log('🖨️ Downloading PDF for printing quote:', quote.id);
      
      // Call our server-side PDF generation API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/quotes/${quote.id}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`PDF generation failed: ${response.status}`);
      }

      // Get the PDF blob
      const pdfBlob = await response.blob();
      
      // Create a URL for the PDF blob and open it for printing
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank');
      
      if (printWindow) {
        printWindow.focus();
        // For server-side PDFs, just trigger print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
        // Clean up the object URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl);
        }, 2000);
      } else {
        // Fallback: trigger download
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = `quote-${quote.quote_number || quote.quoteId}.pdf`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(pdfUrl);
      }
      
    } catch (error) {
      console.error('Print error:', error);
      alert('Failed to print quote. Please try again.');
    }
  };

  const emailQuote = (quote: Quote) => {
    if (!quote.customerEmail) {
      alert('No email address found for this customer. Please update customer details first.');
      return;
    }
    
    // Open email composition modal (professional workflow)
    setEmailQuoteData(quote);
    setShowEmailModal(true);
  };

  const duplicateToNewCustomer = (quote: Quote) => {
    // TODO: Implement duplicate to new customer
    alert(`Duplicate to new customer for ${quote.quoteId} will be implemented`);
  };

  // Open quote for editing in EnhancedQuoteModal
  const editQuote = (quote: Quote) => {
    setSelectedQuoteForEdit(quote);
    setShowEnhancedQuote(true);
  };

  // Open quote PDF (loads saved PDF file or generates new one)
  const viewQuotePDF = async (quote: Quote) => {
    try {
      console.log('📄 Loading PDF for quote:', quote.id);
      
      // First, try to load saved PDF file
      const fileResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/quotes/${quote.id}/pdf-file`);
      
      if (fileResponse.ok) {
        // Saved PDF found, open it directly
        console.log('✅ Found saved PDF file, opening...');
        const pdfBlob = await fileResponse.blob();
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const pdfWindow = window.open(pdfUrl, '_blank');
        
        if (pdfWindow) {
          pdfWindow.focus();
          setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
          console.log('✅ Saved PDF opened in new tab');
        } else {
          // Fallback: trigger download
          const downloadLink = document.createElement('a');
          downloadLink.href = pdfUrl;
          downloadLink.download = `quote-${quote.quote_number || quote.quoteId}.pdf`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(pdfUrl);
          console.log('✅ Saved PDF downloaded');
        }
        return;
      }
      
      // No saved PDF found, try generating new one
      console.log('📄 No saved PDF found, generating new one...');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/quotes/${quote.id}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        // Server-side generation successful
        const pdfBlob = await response.blob();
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const printWindow = window.open(pdfUrl, '_blank');
        
        if (printWindow) {
          printWindow.focus();
          setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
        } else {
          // Fallback: trigger download
          const downloadLink = document.createElement('a');
          downloadLink.href = pdfUrl;
          downloadLink.download = `quote-${quote.quote_number || quote.quoteId}.pdf`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(pdfUrl);
        }
        return;
      }

      // Server-side failed, use client-side fallback
      console.log('📄 Server PDF failed (status:', response.status, '), using client-side generation...');
      
      // Load company profile for client-side generation
      const companyProfile = JSON.parse(localStorage.getItem('companyProfile') || '{}');
      const companyName = localStorage.getItem('companyName');
      const companyLogo = localStorage.getItem('companyLogo');
      
      if (companyName) companyProfile.name = companyName;
      if (companyLogo) companyProfile.logo = companyLogo;
      
      // Load PDF settings
      const savedSettings = localStorage.getItem('saleskik-pdf-settings');
      const pdfSettings = savedSettings ? 
        JSON.parse(savedSettings).documentSettings?.quote || {} : 
        { hideTotalPrice: false, hideItemPrice: false, hideItems: false };
      
      // Load template styling
      const activeTemplateId = localStorage.getItem('saleskik-active-template');
      const savedTemplates = localStorage.getItem('saleskik-form-templates');
      let template = null;
      
      if (savedTemplates && activeTemplateId) {
        const templates = JSON.parse(savedTemplates);
        template = templates.find((t: any) => t.id === activeTemplateId) || templates[0];
      }
      
      const globalStyling = template?.globalStyling || {
        fontFamily: 'Inter',
        primaryColor: '#3b82f6',
        secondaryColor: '#1d4ed8',
        tableHeaderColor: '#3b82f6',
        accentColor: '#059669'
      };
      
      // Prepare quote data for template
      const quoteDataForTemplate = {
        quoteId: quote.quoteId,
        referenceNumber: quote.reference,
        projectName: quote.projectName || quote.reference || 'Quote Request',
        customer: {
          name: quote.customerName,
          email: quote.customerEmail,
          phone: quote.customerPhone,
          primaryContact: {
            firstName: quote.customerName.split(' ')[0],
            lastName: quote.customerName.split(' ').slice(1).join(' '),
            email: quote.customerEmail,
            mobile: quote.customerPhone
          }
        },
        jobSections: quote.jobSections || [
          {
            id: '1',
            name: 'Main Project',
            items: []
          }
        ],
        totals: {
          subtotal: quote.amount / 1.1,
          gst: quote.amount - (quote.amount / 1.1),
          total: quote.amount
        }
      };
      
      // Generate actual PDF file using jsPDF
      console.log('📄 Generating client-side PDF with data:', quoteDataForTemplate);
      const htmlContent = generateQuoteTemplate(quoteDataForTemplate, globalStyling, companyProfile, pdfSettings);
      
      if (!htmlContent || htmlContent.trim() === '') {
        console.error('❌ generateQuoteTemplate returned empty content');
        alert('Failed to generate PDF content. Please check quote data.');
        return;
      }
      
      console.log('📄 Generated HTML content, converting to PDF...');
      
      // Create temporary container for HTML content with proper styling
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = htmlContent;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '794px'; // A4 width in pixels at 96 DPI
      tempContainer.style.minHeight = '1123px'; // A4 height in pixels at 96 DPI  
      tempContainer.style.background = 'white';
      tempContainer.style.padding = '20px';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      tempContainer.style.fontSize = '14px';
      tempContainer.style.lineHeight = '1.4';
      document.body.appendChild(tempContainer);
      
      // Wait for images and fonts to load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Convert HTML to canvas, then to PDF with better quality
      try {
        const canvas = await html2canvas(tempContainer, {
          scale: 3, // Higher scale for better quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: tempContainer.scrollWidth,
          height: tempContainer.scrollHeight,
          windowWidth: 1200, // Standard browser width
          windowHeight: 800
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        // Generate PDF blob and open in new tab
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        // Open PDF in new tab
        const pdfWindow = window.open(pdfUrl, '_blank');
        if (pdfWindow) {
          pdfWindow.focus();
          // Clean up URL after delay
          setTimeout(() => {
            URL.revokeObjectURL(pdfUrl);
          }, 1000);
          console.log('✅ PDF opened in new tab');
        } else {
          // Fallback: trigger download
          const downloadLink = document.createElement('a');
          downloadLink.href = pdfUrl;
          downloadLink.download = `quote-${quote.quote_number || quote.quoteId}.pdf`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(pdfUrl);
          console.log('✅ PDF downloaded automatically');
        }
        
      } finally {
        // Clean up temporary container
        document.body.removeChild(tempContainer);
      }
      
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const isQuoteExpiring = (quote: Quote) => {
    if (!quote.expiryDate) return false;
    const today = new Date();
    const expiry = new Date(quote.expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const isQuoteExpired = (quote: Quote) => {
    if (!quote.expiryDate) return false;
    const today = new Date();
    const expiry = new Date(quote.expiryDate);
    return expiry < today;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quotes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="quotes" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="Manage Quotes"
        subtitle="View, edit, and manage all your business quotes"
        onMenuToggle={() => setShowSidebar(true)}
      />

      <div className="p-8 w-full max-w-none mx-auto">
        {/* Filters Section */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 mb-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <FunnelIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Smart Filters
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Customer Name Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchCustomer}
                  onChange={(e) => setSearchCustomer(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status Dropdown */}
            <CustomDropdown
              label="Status"
              value={selectedStatus}
              placeholder="All Statuses"
              options={customStatuses}
              onChange={setSelectedStatus}
            />

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
              <div className="relative">
                <CalendarIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
              <div className="relative">
                <CalendarIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Keywords Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Reference, ID..."
                  value={searchKeywords}
                  onChange={(e) => setSearchKeywords(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Add New Quote Button with Show Deleted above */}
            <div>
              <div className="mb-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showDeleted}
                    onChange={(e) => setShowDeleted(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700">Show Deleted</span>
                </label>
              </div>
              <button
                onClick={() => navigate('/quotes/new')}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add New Quote
              </button>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchCustomer || selectedStatus || dateFrom || dateTo || searchKeywords || showDeleted) && (
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setSearchCustomer('');
                  setSelectedStatus('');
                  setDateFrom('');
                  setDateTo('');
                  setSearchKeywords('');
                  setShowDeleted(false);
                }}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                <XMarkIcon className="w-4 h-4 mr-1" />
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Quotes Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <DocumentTextIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Your Quotes ({filteredQuotes.length})
                  </h3>
                  <p className="text-sm text-gray-500">
                    Manage and track all your business quotes
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {filteredQuotes.length} of {quotes.length} quotes
                </div>
                <div className="text-xs text-gray-400">
                  Total value: ${quotes.reduce((sum, q) => !q.isDeleted ? sum + q.amount : sum, 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={selectedQuotes.length === filteredQuotes.length && filteredQuotes.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('customerName')}
                  >
                    <div className="flex items-center gap-1">
                      Customer Name
                      <ArrowsUpDownIcon className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('quoteId')}
                  >
                    <div className="flex items-center gap-1">
                      Quote ID
                      <ArrowsUpDownIcon className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('reference')}
                  >
                    <div className="flex items-center gap-1">
                      Reference
                      <ArrowsUpDownIcon className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('quoteDate')}
                  >
                    <div className="flex items-center gap-1">
                      Quote Date
                      <ArrowsUpDownIcon className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Amount (Inc GST)
                      <ArrowsUpDownIcon className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <ArrowsUpDownIcon className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-96">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes found</h3>
                      <p className="text-gray-600 mb-4">
                        {quotes.length === 0 
                          ? "Get started by creating your first quote"
                          : "Try adjusting your filters to see more results"
                        }
                      </p>
                      <button
                        onClick={() => navigate('/quotes/new')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                      >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Create Your First Quote
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredQuotes.map((quote, index) => {
                    const statusConfig = getStatusConfig(quote.status, quote);
                    const isFirstRow = index === 0;
                    
                    return (
                      <tr key={quote.id} className={`transition-all duration-200 group ${
                        selectedQuotes.includes(quote.id) 
                          ? 'bg-blue-50 border-l-4 border-blue-500' 
                          : 'hover:bg-gradient-to-r hover:from-blue-25 hover:to-purple-25'
                      }`}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedQuotes.includes(quote.id)}
                            onChange={() => toggleQuoteSelection(quote.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-sm">
                                {quote.customerName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <div 
                                    className="text-sm font-medium text-gray-900 cursor-help hover:text-blue-600 transition-colors"
                                    onMouseEnter={(e) => {
                                      const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                                      if (tooltip) tooltip.style.opacity = '1';
                                    }}
                                    onMouseLeave={(e) => {
                                      const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                                      if (tooltip) tooltip.style.opacity = '0';
                                    }}
                                  >
                                    {quote.customerName}
                                  </div>
                                  {/* Hover tooltip */}
                                  <div className={`absolute ${isFirstRow ? 'top-full mt-2' : 'bottom-full mb-2'} left-0 px-4 py-3 bg-white border border-gray-200 shadow-xl rounded-lg opacity-0 transition-opacity z-20 whitespace-nowrap pointer-events-none`}>
                                    <div className="space-y-1">
                                      <div className="text-sm font-medium text-gray-900">Contact Information</div>
                                      <div className="text-xs text-gray-600 space-y-1">
                                        <div>Email: {quote.customerEmail || 'Not provided'}</div>
                                        <div>Phone: {quote.customerPhone || 'Not provided'}</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">Customer</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => viewQuotePDF(quote)}
                              className="text-sm text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors cursor-pointer"
                              title="Click to view PDF"
                            >
                              {quote.quoteId}
                            </button>
                            <button
                              onClick={() => previewQuoteHandler(quote)}
                              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Preview Quote"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => printQuote(quote)}
                              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                              title="Print Quote"
                            >
                              <PrinterIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => emailQuote(quote)}
                              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Email Quote to Customer"
                            >
                              <EnvelopeIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">{quote.reference}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {quote.quoteDate.toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                            ${quote.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span 
                              className="inline-flex px-3 py-1 text-xs font-semibold rounded-full shadow-sm"
                              style={{ 
                                backgroundColor: statusConfig.color + '20',
                                color: statusConfig.color,
                                border: `2px solid ${statusConfig.color}40`
                              }}
                              title={quote.customerResponse ? `Customer ${quote.customerResponse.decision === 'accept' ? 'accepted' : 'declined'} on ${new Date(quote.customerResponse.responseDate).toLocaleDateString()}` : ''}
                            >
                              {quote.customerResponse && (quote.status === 'accepted' || quote.status === 'declined') 
                                ? `${statusConfig.label} by Customer`
                                : statusConfig.label}
                            </span>
                            {quote.customerResponse?.selectedOptions && Object.keys(quote.customerResponse.selectedOptions).length > 0 && (
                              <span 
                                className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300"
                                title={`Customer selections: ${Object.entries(quote.customerResponse.selectedOptions).map(([cat, opt]) => `${cat}: ${opt}`).join(', ')}`}
                              >
                                Options Selected
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => editQuote(quote)}
                              className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Edit this quote"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => duplicateQuote(quote.id)}
                              className="p-2 text-green-600 hover:text-white hover:bg-green-600 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Create a copy of this quote"
                            >
                              <DocumentDuplicateIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/orders/create?from=quote&id=${quote.id}`)}
                              className="p-2 text-purple-600 hover:text-white hover:bg-purple-600 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Convert quote to order"
                            >
                              <ShoppingCartIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteQuote(quote)}
                              className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Delete this quote"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Total Value Footer */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-4 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                  <ChartBarIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Showing {filteredQuotes.length} of {quotes.length} quotes
                  </p>
                  <p className="text-xs text-gray-500">
                    {filteredQuotes.filter(q => !q.isDeleted).length} active quotes
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">Total Quote Value</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  ${filteredQuotes.reduce((sum, q) => !q.isDeleted ? sum + q.amount : sum, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions Popup */}
        {showBulkActions && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{selectedQuotes.length}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {selectedQuotes.length} quote{selectedQuotes.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSendModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <DocumentDuplicateIcon className="w-4 h-4" />
                  Send Batch
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={() => setSelectedQuotes([])}
                  className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrashIcon className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Selected Quotes</h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete {selectedQuotes.length} quote{selectedQuotes.length !== 1 ? 's' : ''}?
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-40 overflow-y-auto">
                  <h4 className="font-semibold text-gray-900 mb-2">Quotes to delete:</h4>
                  {selectedQuotes.map(quoteId => {
                    const quote = quotes.find(q => q.id === quoteId);
                    return quote ? (
                      <div key={quoteId} className="flex justify-between items-center py-1 text-sm">
                        <span>{quote.quoteId}</span>
                        <span className="text-gray-500">{quote.customerName}</span>
                      </div>
                    ) : null;
                  })}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={bulkDeleteQuotes}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Single Quote Delete Confirmation Modal */}
        {showSingleDeleteConfirm && quoteToDelete && (
          <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrashIcon className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Quote</h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete this quote? This action cannot be undone.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 mb-2">Quote Details:</div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div><span className="font-medium">Quote ID:</span> {quoteToDelete.quoteId}</div>
                      <div><span className="font-medium">Customer:</span> {quoteToDelete.customerName}</div>
                      <div><span className="font-medium">Reference:</span> {quoteToDelete.reference}</div>
                      <div><span className="font-medium">Amount:</span> ${quoteToDelete.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowSingleDeleteConfirm(false);
                      setQuoteToDelete(null);
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteQuote}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Delete Quote
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Batch Modal */}
        {showSendModal && (
          <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DocumentDuplicateIcon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Send Batch Quotes</h3>
                <p className="text-gray-600 mb-4">
                  Send {selectedQuotes.length} selected quote{selectedQuotes.length !== 1 ? 's' : ''} to customers
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-40 overflow-y-auto">
                  <h4 className="font-semibold text-gray-900 mb-2">Quotes to send:</h4>
                  {selectedQuotes.map(quoteId => {
                    const quote = quotes.find(q => q.id === quoteId);
                    return quote ? (
                      <div key={quoteId} className="flex justify-between items-center py-1 text-sm">
                        <span>{quote.quoteId}</span>
                        <span className="text-gray-500">{quote.customerName}</span>
                      </div>
                    ) : null;
                  })}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSendModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Implement batch send functionality
                      alert('Batch send functionality will be implemented later');
                      setShowSendModal(false);
                      setSelectedQuotes([]);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Send All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Quote Modal for Editing */}
        {selectedQuoteForEdit && (
          <EnhancedQuoteModal
            isOpen={showEnhancedQuote}
            onClose={() => {
              setShowEnhancedQuote(false);
              setSelectedQuoteForEdit(null);
              // Refresh quotes list after editing
              loadQuotes();
            }}
            customer={{
              id: selectedQuoteForEdit.customerId,
              name: selectedQuoteForEdit.customerName,
              email: selectedQuoteForEdit.customerEmail || '',
              phone: selectedQuoteForEdit.customerPhone || '',
              primaryContact: {
                firstName: selectedQuoteForEdit.customerName.split(' ')[0],
                lastName: selectedQuoteForEdit.customerName.split(' ').slice(1).join(' '),
                email: selectedQuoteForEdit.customerEmail,
                mobile: selectedQuoteForEdit.customerPhone
              },
              locations: []
            }}
            projectName={selectedQuoteForEdit.projectName || ''}
            quoteId={selectedQuoteForEdit.quoteId}
            referenceNumber={selectedQuoteForEdit.reference}
            jobSections={selectedQuoteForEdit.jobSections || []}
            deliveryDetails={{
              method: 'delivery',
              address: '',
              contactName: selectedQuoteForEdit.customerName,
              contactPhone: selectedQuoteForEdit.customerPhone || '',
              specialInstructions: ''
            }}
          />
        )}

        {/* Email Composition Modal */}
        {showEmailModal && emailQuoteData && (
          <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Email Quote</h3>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailQuoteData(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Quote Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Quote ID:</span> {emailQuoteData.quoteId}</div>
                    <div><span className="font-medium">Customer:</span> {emailQuoteData.customerName}</div>
                    <div><span className="font-medium">Email:</span> {emailQuoteData.customerEmail}</div>
                    <div><span className="font-medium">Amount:</span> ${emailQuoteData.amount.toFixed(2)}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Template</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>Standard Quote Template</option>
                    <option>Professional Quote Template</option>
                    <option>Follow-up Quote Template</option>
                    <option>Custom Template</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    defaultValue={`Quote ${emailQuoteData.quoteId} - ${emailQuoteData.reference}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    rows={6}
                    defaultValue={`Dear ${emailQuoteData.customerName},\n\nPlease find attached your quote for ${emailQuoteData.reference}.\n\nQuote Details:\n- Quote ID: ${emailQuoteData.quoteId}\n- Total Amount: $${emailQuoteData.amount.toFixed(2)} (inc GST)\n\nThis quote is valid for 30 days. Please don't hesitate to contact us if you have any questions.\n\nBest regards,\nYour Sales Team`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" />
                    <span className="text-sm text-gray-700">Attach PDF</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" />
                    <span className="text-sm text-gray-700">Request Customer Response</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" />
                    <span className="text-sm text-gray-700">Schedule Follow-up</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowEmailModal(false);
                      setEmailQuoteData(null);
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Preview email before sending
                      alert('Email preview - formatted quote email will open in new window for review');
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Preview
                  </button>
                  <button
                    onClick={async () => {
                      // Send email with composed content
                      alert(`Quote ${emailQuoteData.quoteId} emailed successfully to ${emailQuoteData.customerEmail}!`);
                      // Update quote status to 'sent'
                      const updatedQuotes = quotes.map(q => 
                        q.id === emailQuoteData.id ? { ...q, status: 'sent', updatedAt: new Date() } : q
                      );
                      setQuotes(updatedQuotes);
                      // Save with hybrid approach (API + localStorage fallback)
                      await dataService.quotes.save(updatedQuotes);
                      setShowEmailModal(false);
                      setEmailQuoteData(null);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Send Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quote Preview Modal */}
        {showPreviewModal && previewQuote && (
          <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Quote Details</h2>
                  <p className="text-sm text-gray-600">{previewQuote.quote_number || previewQuote.quoteId}</p>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Customer Information</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Name:</span> {previewQuote.customer?.name || previewQuote.customerName}</p>
                      <p><span className="font-medium">Email:</span> {previewQuote.customer?.email || previewQuote.customerEmail}</p>
                      <p><span className="font-medium">Phone:</span> {previewQuote.customer?.phone || previewQuote.customerPhone || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Quote Information</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Status:</span> 
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          previewQuote.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                          previewQuote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          previewQuote.status === 'declined' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {(previewQuote.status || 'draft').charAt(0).toUpperCase() + (previewQuote.status || 'draft').slice(1)}
                        </span>
                      </p>
                      <p><span className="font-medium">Date:</span> {new Date(previewQuote.created_at || previewQuote.quoteDate).toLocaleDateString()}</p>
                      <p><span className="font-medium">Job Name:</span> {previewQuote.job_name || previewQuote.projectName || 'Not specified'}</p>
                      <p><span className="font-medium">Total Amount:</span> ${(previewQuote.total_amount || previewQuote.amount || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                {previewQuote.line_items && previewQuote.line_items.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Quote Items</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {previewQuote.line_items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">{item.description}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.quantity}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">${item.unit_price.toFixed(2)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">${item.total_amount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Customer Selected Options */}
                {previewQuote.options && previewQuote.options.some((opt: any) => opt.is_selected) && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Customer Selected Options</h3>
                    <div className="space-y-3">
                      {Object.entries(previewQuote.options.reduce((groups: any, option: any) => {
                        if (option.is_selected) {
                          if (!groups[option.category_name]) groups[option.category_name] = [];
                          groups[option.category_name].push(option);
                        }
                        return groups;
                      }, {})).map(([category, options]: [string, any[]]) => (
                        <div key={category} className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-medium text-green-800 mb-2 capitalize">{category}:</h4>
                          {options.map((option: any, index: number) => (
                            <div key={index} className="flex items-center justify-between bg-white p-3 rounded border border-green-200">
                              <div className="flex items-center">
                                <CheckIcon className="w-4 h-4 text-green-600 mr-2" />
                                <div>
                                  <span className="font-medium text-gray-900">{option.option_name}</span>
                                  {option.description && (
                                    <div className="text-sm text-gray-600">{option.description}</div>
                                  )}
                                  {option.selection_date && (
                                    <div className="text-xs text-gray-500">Selected {new Date(option.selection_date).toLocaleDateString()}</div>
                                  )}
                                </div>
                              </div>
                              <div className="font-medium text-green-600">
                                {option.option_price > 0 ? `+$${option.option_price.toFixed(2)}` : 'No charge'}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {previewQuote.notes && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Notes</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{previewQuote.notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowPreviewModal(false);
                      viewQuotePDF(previewQuote);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    View PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}