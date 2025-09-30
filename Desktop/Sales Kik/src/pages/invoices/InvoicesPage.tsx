import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import FinalInvoiceModal from '../../components/invoices/FinalInvoiceModal';
import { generateInvoiceTemplate } from '../../components/invoices/InvoiceTemplate';
import { dataService } from '../../services/api.service';
import { 
  MagnifyingGlassIcon, PencilIcon, DocumentDuplicateIcon,
  TrashIcon, EyeIcon, CalendarIcon,
  ChevronDownIcon, FunnelIcon, XMarkIcon, DocumentTextIcon,
  CheckIcon, ChartBarIcon, ClockIcon, PrinterIcon, EnvelopeIcon,
  BellIcon, ChatBubbleLeftIcon, ExclamationTriangleIcon,
  UserGroupIcon, ArrowsUpDownIcon, UserIcon
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
                className="w-full text-left px-4 py-3 hover:bg-lime-50 transition-colors border-b border-gray-100 last:border-b-0"
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

// Invoice interface
interface Invoice {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  invoiceId: string;
  reference: string;
  invoiceDate: Date;
  dueDate: Date;
  amount: number;
  status: string;
  salesRep: string;
  isDeleted: boolean;
  isArchived: boolean;
  notes?: string;
  needsFollowUp?: boolean;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Function to generate unique Invoice ID
const generateUniqueInvoiceId = (existingInvoices: Invoice[]): string => {
  const existingIds = existingInvoices.map(invoice => invoice.invoiceId);
  let newId: string;
  
  do {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    newId = `INV-${randomNum}`;
  } while (existingIds.includes(newId));
  
  return newId;
};

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchCustomer, setSearchCustomer] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchKeywords, setSearchKeywords] = useState('');
  const [searchSalesRep, setSearchSalesRep] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Bulk selection states
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  // Sorting states
  const [sortField, setSortField] = useState<string>('invoiceDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [showSingleDeleteConfirm, setShowSingleDeleteConfirm] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [invoiceToEmail, setInvoiceToEmail] = useState<Invoice | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [invoiceForPDF, setInvoiceForPDF] = useState<Invoice | null>(null);

  // Custom statuses for invoices
  const [customStatuses, setCustomStatuses] = useState([
    { value: 'invoice-created', label: 'Invoice Created', color: '#94a3b8', description: 'Invoice has been created' },
    { value: 'invoice-sent', label: 'Invoice Sent', color: '#3b82f6', description: 'Invoice sent to customer' },
    { value: 'invoice-paid', label: 'Invoice Paid', color: '#10b981', description: 'Invoice has been paid' },
    { value: 'invoice-payment-late', label: 'Invoice Payment Late', color: '#ef4444', description: 'Payment is overdue' }
  ]);

  // Sample sales reps
  const [salesReps] = useState([
    'Adam Smith',
    'Sarah Johnson', 
    'Mike Thompson',
    'Lisa Chen',
    'David Wilson'
  ]);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      // Use same dataService pattern as other pages (API first, localStorage fallback)
      const invoicesData = await dataService.invoices.getAll();
      
      if (invoicesData.length > 0) {
        const parsedInvoices = invoicesData.map((invoice: any) => ({
          ...invoice,
          invoiceDate: new Date(invoice.invoiceDate),
          dueDate: new Date(invoice.dueDate),
          createdAt: new Date(invoice.createdAt),
          updatedAt: new Date(invoice.updatedAt)
        }));
        setInvoices(parsedInvoices);
        console.log('Invoices page: Loaded invoices from API (same as other pages):', parsedInvoices.length, 'invoices');
      } else {
        // Sample data
        const sampleInvoices: Invoice[] = [
          {
            id: '1',
            customerId: 'cust-1',
            customerName: 'ABC Construction Pty Ltd',
            customerEmail: 'orders@abcconstruction.com.au',
            customerPhone: '+61 3 9876 5432',
            invoiceId: '', // Will be set below
            reference: 'WEBSITE-DEV-2024',
            invoiceDate: new Date('2024-08-19'),
            dueDate: new Date('2024-09-18'),
            amount: 7280.00,
            status: 'invoice-sent',
            salesRep: 'Adam Smith',
            isDeleted: false,
            isArchived: false,
            notes: 'Customer is very satisfied with the work',
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
            invoiceId: '', // Will be set below
            reference: 'HARDWARE-SUPPLY-2024',
            invoiceDate: new Date('2024-07-15'),
            dueDate: new Date('2024-08-15'), // Past due date
            amount: 15450.00,
            status: 'invoice-payment-late',
            salesRep: 'Sarah Johnson',
            isDeleted: false,
            isArchived: false,
            notes: 'Follow up required for overdue payment',
            needsFollowUp: true,
            followUpDate: new Date('2024-08-25'),
            createdAt: new Date('2024-07-15'),
            updatedAt: new Date('2024-08-20')
          },
          {
            id: '3',
            customerId: 'cust-3',
            customerName: 'Tech Solutions Inc',
            customerEmail: 'contact@techsolutions.com',
            customerPhone: '+61 2 5555 0123',
            invoiceId: '', // Will be set below
            reference: 'CONSULTING-SERVICES',
            invoiceDate: new Date('2024-08-17'),
            dueDate: new Date('2024-08-24'),
            amount: 3200.00,
            status: 'invoice-paid',
            salesRep: 'Mike Thompson',
            isDeleted: false,
            isArchived: false,
            notes: 'Payment received on time',
            needsFollowUp: false,
            createdAt: new Date('2024-08-17'),
            updatedAt: new Date('2024-08-17')
          },
          {
            id: '4',
            customerId: 'cust-4',
            customerName: 'Global Trading Pty Ltd',
            customerEmail: 'accounts@globaltrading.com.au',
            customerPhone: '+61 2 9999 8888',
            invoiceId: '', // Will be set below
            reference: 'OFFICE-RENOVATION-2024',
            invoiceDate: new Date('2024-06-20'),
            dueDate: new Date('2024-07-20'), // Past due date
            amount: 8750.00,
            status: 'invoice-sent',
            salesRep: 'Lisa Chen',
            isDeleted: false,
            isArchived: false,
            notes: 'Large renovation project - payment overdue',
            needsFollowUp: true,
            followUpDate: new Date('2024-09-25'),
            createdAt: new Date('2024-06-20'),
            updatedAt: new Date('2024-06-20')
          }
        ];
        
        // Generate unique Invoice IDs for sample data
        sampleInvoices.forEach((invoice, index) => {
          invoice.invoiceId = generateUniqueInvoiceId(sampleInvoices.slice(0, index));
        });
        
        setInvoices(sampleInvoices);
        await dataService.invoices.save(sampleInvoices);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statusName: string) => {
    const colorMap: { [key: string]: string } = {
      'invoice-created': '#94a3b8',
      'invoice-sent': '#3b82f6',
      'invoice-paid': '#10b981',
      'invoice-payment-late': '#ef4444'
    };
    
    return colorMap[statusName] || '#94a3b8';
  };

  // Filter and sort invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesCustomer = !searchCustomer || 
      invoice.customerName.toLowerCase().includes(searchCustomer.toLowerCase());
    
    const matchesStatus = !selectedStatus || invoice.status === selectedStatus;
    
    const matchesDateFrom = !dateFrom || 
      new Date(invoice.invoiceDate) >= new Date(dateFrom);
    
    const matchesDateTo = !dateTo || 
      new Date(invoice.invoiceDate) <= new Date(dateTo);
    
    const matchesKeywords = !searchKeywords || 
      invoice.reference.toLowerCase().includes(searchKeywords.toLowerCase()) ||
      invoice.invoiceId.toLowerCase().includes(searchKeywords.toLowerCase());
    
    const matchesSalesRep = !searchSalesRep || 
      invoice.salesRep.toLowerCase().includes(searchSalesRep.toLowerCase());
    
    const matchesDeleted = showDeleted || !invoice.isDeleted;
    
    return matchesCustomer && matchesStatus && matchesDateFrom && 
           matchesDateTo && matchesKeywords && matchesSalesRep && matchesDeleted;
  }).sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'customerName':
        aValue = a.customerName.toLowerCase();
        bValue = b.customerName.toLowerCase();
        break;
      case 'invoiceId':
        aValue = a.invoiceId;
        bValue = b.invoiceId;
        break;
      case 'reference':
        aValue = a.reference.toLowerCase();
        bValue = b.reference.toLowerCase();
        break;
      case 'invoiceDate':
        aValue = new Date(a.invoiceDate).getTime();
        bValue = new Date(b.invoiceDate).getTime();
        break;
      case 'dueDate':
        aValue = new Date(a.dueDate).getTime();
        bValue = new Date(b.dueDate).getTime();
        break;
      case 'amount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'salesRep':
        aValue = a.salesRep.toLowerCase();
        bValue = b.salesRep.toLowerCase();
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusConfig = (status: string) => {
    return customStatuses.find(s => s.value === status) || 
           { value: status, label: status, color: '#94a3b8' };
  };

  const duplicateInvoice = async (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      const newInvoice = {
        ...invoice,
        id: Date.now().toString(),
        invoiceId: generateUniqueInvoiceId(invoices),
        status: 'invoice-created',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const updatedInvoices = [...invoices, newInvoice];
      setInvoices(updatedInvoices);
      await dataService.invoices.save(updatedInvoices);
    }
  };

  const deleteInvoice = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setShowSingleDeleteConfirm(true);
  };

  const confirmDeleteInvoice = async () => {
    if (invoiceToDelete) {
      const updatedInvoices = invoices.map(inv => 
        inv.id === invoiceToDelete.id ? { ...inv, isDeleted: true, updatedAt: new Date() } : inv
      );
      setInvoices(updatedInvoices);
      await dataService.invoices.save(updatedInvoices);
      setShowSingleDeleteConfirm(false);
      setInvoiceToDelete(null);
    }
  };

  // Bulk selection functions
  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedInvoices(
      selectedInvoices.length === filteredInvoices.length 
        ? [] 
        : filteredInvoices.map(inv => inv.id)
    );
  };

  const bulkDeleteInvoices = async () => {
    const updatedInvoices = invoices.map(inv => 
      selectedInvoices.includes(inv.id) ? { ...inv, isDeleted: true, updatedAt: new Date() } : inv
    );
    setInvoices(updatedInvoices);
    await dataService.invoices.save(updatedInvoices);
    setSelectedInvoices([]);
    setShowDeleteConfirm(false);
  };

  // Show bulk actions when invoices are selected
  useEffect(() => {
    setShowBulkActions(selectedInvoices.length > 0);
  }, [selectedInvoices]);

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
  const previewInvoiceHandler = (invoice: Invoice) => {
    setPreviewInvoice(invoice);
    setShowPreviewModal(true);
  };

  const printInvoice = (invoice: Invoice) => {
    // Generate print-friendly HTML and print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${invoice.invoiceId}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .invoice-details { margin-bottom: 20px; }
              .customer-info { margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
              .total { text-align: right; font-size: 18px; font-weight: bold; }
              .status { margin-top: 20px; padding: 10px; background-color: #f5f5f5; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>INVOICE</h1>
              <p>Invoice #${invoice.invoiceId}</p>
            </div>
            
            <div class="invoice-details">
              <p><strong>Invoice Date:</strong> ${invoice.invoiceDate.toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> ${invoice.dueDate.toLocaleDateString()}</p>
              <p><strong>Reference:</strong> ${invoice.reference}</p>
              <p><strong>Sales Rep:</strong> ${invoice.salesRep}</p>
            </div>
            
            <div class="customer-info">
              <h3>Bill To:</h3>
              <p><strong>${invoice.customerName}</strong></p>
              ${invoice.customerEmail ? `<p>${invoice.customerEmail}</p>` : ''}
              ${invoice.customerPhone ? `<p>${invoice.customerPhone}</p>` : ''}
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${invoice.reference}</td>
                  <td style="text-align: right;">$${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="total">
              <p>Total Amount: $${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            
            <div class="status">
              <p><strong>Status:</strong> ${getStatusConfig(invoice.status).label}</p>
              ${isInvoiceOverdue(invoice) ? '<p style="color: red;"><strong>⚠️ This invoice is overdue</strong></p>' : ''}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  const emailInvoice = (invoice: Invoice) => {
    setInvoiceToEmail(invoice);
    setShowEmailModal(true);
  };

  const editInvoice = (invoice: Invoice) => {
    setInvoiceToEdit(invoice);
    setShowEditModal(true);
  };

  // Open invoice PDF
  const viewInvoicePDF = async (invoice: Invoice) => {
    setInvoiceForPDF(invoice);
    setShowPDFModal(true);
  };

  const isInvoiceOverdue = (invoice: Invoice) => {
    if (invoice.status === 'invoice-paid') return false;
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    return dueDate < today;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="invoices" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="Manage Invoices"
        subtitle="View, track, and manage all your business invoices"
        onMenuToggle={() => setShowSidebar(true)}
      />

      <div className="p-8 w-full max-w-none mx-auto">
        {/* Filters Section */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 mb-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-lime-500 to-green-600 rounded-lg">
              <FunnelIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent">
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

            {/* Sales Rep Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sales Rep</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search sales rep..."
                  value={searchSalesRep}
                  onChange={(e) => setSearchSalesRep(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Show Deleted Checkbox */}
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
                className="rounded border-gray-300 text-lime-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Show Deleted</span>
            </label>
          </div>

          {/* Clear Filters */}
          {(searchCustomer || selectedStatus || dateFrom || dateTo || searchKeywords || searchSalesRep || showDeleted) && (
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setSearchCustomer('');
                  setSelectedStatus('');
                  setDateFrom('');
                  setDateTo('');
                  setSearchKeywords('');
                  setSearchSalesRep('');
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

        {/* Invoices Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-lime-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-lime-500 to-green-600 rounded-lg">
                  <DocumentTextIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Your Invoices ({filteredInvoices.length})
                  </h3>
                  <p className="text-sm text-gray-500">
                    Manage and track all your business invoices
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {filteredInvoices.length} of {invoices.length} invoices
                </div>
                <div className="text-xs text-gray-400">
                  Total value: ${invoices.reduce((sum, inv) => !inv.isDeleted ? sum + inv.amount : sum, 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div>
            <table className="w-full table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-lime-600 focus:ring-blue-500"
                    />
                  </th>
                  <th 
                    className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('customerName')}
                  >
                    <div className="flex items-center gap-1">
                      Customer
                      <ArrowsUpDownIcon className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('invoiceId')}
                  >
                    <div className="flex items-center gap-1">
                      ID
                      <ArrowsUpDownIcon className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('reference')}
                  >
                    <div className="flex items-center gap-1">
                      Reference
                      <ArrowsUpDownIcon className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('invoiceDate')}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      <ArrowsUpDownIcon className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('dueDate')}
                  >
                    <div className="flex items-center gap-1">
                      Due
                      <ArrowsUpDownIcon className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Amount
                      <ArrowsUpDownIcon className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('salesRep')}
                  >
                    <div className="flex items-center gap-1">
                      Rep
                      <ArrowsUpDownIcon className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <ArrowsUpDownIcon className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center">
                      <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
                      <p className="text-gray-600 mb-4">
                        {invoices.length === 0 
                          ? "No invoices have been created yet"
                          : "Try adjusting your filters to see more results"
                        }
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice, index) => {
                    const statusConfig = getStatusConfig(invoice.status);
                    const isFirstRow = index === 0;
                    const isOverdue = isInvoiceOverdue(invoice);
                    
                    return (
                      <tr key={invoice.id} className={`transition-all duration-200 group ${
                        selectedInvoices.includes(invoice.id) 
                          ? 'bg-lime-50 border-l-4 border-blue-500' 
                          : 'hover:bg-gradient-to-r hover:from-blue-25 hover:to-purple-25'
                      } ${isOverdue ? 'bg-red-50' : ''}`}>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedInvoices.includes(invoice.id)}
                            onChange={() => toggleInvoiceSelection(invoice.id)}
                            className="rounded border-gray-300 text-lime-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="relative">
                            <div 
                              className="text-sm font-medium text-gray-900 cursor-help hover:text-lime-600 transition-colors truncate"
                              onMouseEnter={(e) => {
                                const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                                if (tooltip) tooltip.style.opacity = '1';
                              }}
                              onMouseLeave={(e) => {
                                const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                                if (tooltip) tooltip.style.opacity = '0';
                              }}
                              title={invoice.customerName}
                            >
                              {invoice.customerName}
                            </div>
                            {/* Hover tooltip */}
                            <div className={`absolute ${isFirstRow ? 'top-full mt-2' : 'bottom-full mb-2'} left-0 px-4 py-3 bg-white border border-gray-200 shadow-xl rounded-lg opacity-0 transition-opacity z-20 whitespace-nowrap pointer-events-none`}>
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-gray-900">Contact Information</div>
                                <div className="text-xs text-gray-600 space-y-1">
                                  <div>Email: {invoice.customerEmail || 'Not provided'}</div>
                                  <div>Phone: {invoice.customerPhone || 'Not provided'}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <button
                            onClick={() => viewInvoicePDF(invoice)}
                            className="text-xs text-lime-600 font-bold bg-lime-50 px-1 py-0.5 rounded hover:bg-lime-100 transition-colors cursor-pointer"
                            title="Click to view PDF"
                          >
                            {invoice.invoiceId}
                          </button>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900 font-medium truncate" title={invoice.reference}>
                            {invoice.reference}
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900">
                            {invoice.invoiceDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className={`text-xs ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                            {invoice.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {isOverdue && (
                              <div className="text-xs text-red-500">OD</div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-right">
                          <div className="text-xs font-bold text-green-600 bg-green-50 px-1 py-0.5 rounded">
                            ${(invoice.amount / 1000).toFixed(0)}k
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900 font-medium truncate" title={invoice.salesRep}>
                            {invoice.salesRep.split(' ')[0]}
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span 
                            className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full shadow-sm"
                            style={{ 
                              backgroundColor: statusConfig.color + '20',
                              color: statusConfig.color,
                              border: `1px solid ${statusConfig.color}40`
                            }}
                            title={statusConfig.label}
                          >
                            {statusConfig.label.split(' ')[0]}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => editInvoice(invoice)}
                              className="p-1 text-lime-600 hover:text-white hover:bg-blue-600 rounded transition-all duration-200"
                              title="Edit this invoice"
                            >
                              <PencilIcon className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => duplicateInvoice(invoice.id)}
                              className="p-1 text-green-600 hover:text-white hover:bg-green-600 rounded transition-all duration-200"
                              title="Create a copy of this invoice"
                            >
                              <DocumentDuplicateIcon className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteInvoice(invoice)}
                              className="p-1 text-red-600 hover:text-white hover:bg-red-600 rounded transition-all duration-200"
                              title="Delete this invoice"
                            >
                              <TrashIcon className="w-3 h-3" />
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
          <div className="bg-gradient-to-r from-gray-50 to-lime-50 px-4 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                  <ChartBarIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Showing {filteredInvoices.length} of {invoices.length} invoices
                  </p>
                  <p className="text-xs text-gray-500">
                    {filteredInvoices.filter(inv => !inv.isDeleted).length} active invoices • {filteredInvoices.filter(inv => !inv.isDeleted && isInvoiceOverdue(inv)).length} overdue
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Invoice Value</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      ${filteredInvoices.reduce((sum, inv) => !inv.isDeleted ? sum + inv.amount : sum, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-600">Total Overdue</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                      ${filteredInvoices.reduce((sum, inv) => !inv.isDeleted && isInvoiceOverdue(inv) ? sum + inv.amount : sum, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions Popup */}
        {showBulkActions && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-lime-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{selectedInvoices.length}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {selectedInvoices.length} invoice{selectedInvoices.length !== 1 ? 's' : ''} selected
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
                  onClick={() => setSelectedInvoices([])}
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Selected Invoices</h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete {selectedInvoices.length} invoice{selectedInvoices.length !== 1 ? 's' : ''}?
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-40 overflow-y-auto">
                  <h4 className="font-semibold text-gray-900 mb-2">Invoices to delete:</h4>
                  {selectedInvoices.map(invoiceId => {
                    const invoice = invoices.find(inv => inv.id === invoiceId);
                    return invoice ? (
                      <div key={invoiceId} className="flex justify-between items-center py-1 text-sm">
                        <span>{invoice.invoiceId}</span>
                        <span className="text-gray-500">{invoice.customerName}</span>
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
                    onClick={bulkDeleteInvoices}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Single Invoice Delete Confirmation Modal */}
        {showSingleDeleteConfirm && invoiceToDelete && (
          <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrashIcon className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Invoice</h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete this invoice? This action cannot be undone.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 mb-2">Invoice Details:</div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div><span className="font-medium">Invoice ID:</span> {invoiceToDelete.invoiceId}</div>
                      <div><span className="font-medium">Customer:</span> {invoiceToDelete.customerName}</div>
                      <div><span className="font-medium">Reference:</span> {invoiceToDelete.reference}</div>
                      <div><span className="font-medium">Amount:</span> ${invoiceToDelete.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowSingleDeleteConfirm(false);
                      setInvoiceToDelete(null);
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteInvoice}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Delete Invoice
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">Send Batch Invoices</h3>
                <p className="text-gray-600 mb-4">
                  Send {selectedInvoices.length} selected invoice{selectedInvoices.length !== 1 ? 's' : ''} to customers
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-40 overflow-y-auto">
                  <h4 className="font-semibold text-gray-900 mb-2">Invoices to send:</h4>
                  {selectedInvoices.map(invoiceId => {
                    const invoice = invoices.find(inv => inv.id === invoiceId);
                    return invoice ? (
                      <div key={invoiceId} className="flex justify-between items-center py-1 text-sm">
                        <span>{invoice.invoiceId}</span>
                        <span className="text-gray-500">{invoice.customerName}</span>
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
                    onClick={async () => {
                      // Batch send invoices to customers
                      const invoicesToSend = selectedInvoices.map(id => 
                        invoices.find(inv => inv.id === id)
                      ).filter(Boolean);
                      
                      const customerEmails = invoicesToSend.map(inv => inv.customerEmail).join(', ');
                      alert(`Batch sending ${selectedInvoices.length} invoices to:\n${customerEmails}\n\nInvoices sent successfully!`);
                      
                      // Update all sent invoices status
                      const updatedInvoices = invoices.map(inv => 
                        selectedInvoices.includes(inv.id) ? { ...inv, status: 'invoice-sent', updatedAt: new Date() } : inv
                      );
                      setInvoices(updatedInvoices);
                      await dataService.invoices.save(updatedInvoices);
                      setShowSendModal(false);
                      setSelectedInvoices([]);
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

        {/* Preview Invoice Modal */}
        {showPreviewModal && previewInvoice && (
          <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Invoice Preview</h3>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="bg-white border border-gray-200 rounded-lg p-8">
                  {/* Invoice Header */}
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
                      <p className="text-gray-600">Invoice #{previewInvoice.invoiceId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Invoice Date</p>
                      <p className="font-semibold">{previewInvoice.invoiceDate.toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600 mt-2">Due Date</p>
                      <p className="font-semibold">{previewInvoice.dueDate.toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Bill To Section */}
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Bill To:</h3>
                      <div className="text-gray-600">
                        <p className="font-semibold">{previewInvoice.customerName}</p>
                        {previewInvoice.customerEmail && <p>{previewInvoice.customerEmail}</p>}
                        {previewInvoice.customerPhone && <p>{previewInvoice.customerPhone}</p>}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Reference:</h3>
                      <p className="text-gray-600">{previewInvoice.reference}</p>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">Sales Rep:</h3>
                      <p className="text-gray-600">{previewInvoice.salesRep}</p>
                    </div>
                  </div>

                  {/* Invoice Items */}
                  <div className="mb-8">
                    <table className="w-full border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">Description</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 border-b">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-4 py-3 border-b">{previewInvoice.reference}</td>
                          <td className="px-4 py-3 text-right border-b">${previewInvoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Total */}
                  <div className="flex justify-end">
                    <div className="w-64">
                      <div className="flex justify-between py-2 border-t border-gray-200">
                        <span className="font-semibold">Total Amount:</span>
                        <span className="font-bold text-xl">${previewInvoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Status:</span>
                      <span 
                        className="inline-flex px-3 py-1 text-sm font-semibold rounded-full"
                        style={{ 
                          backgroundColor: getStatusConfig(previewInvoice.status).color + '20',
                          color: getStatusConfig(previewInvoice.status).color,
                          border: `2px solid ${getStatusConfig(previewInvoice.status).color}40`
                        }}
                      >
                        {getStatusConfig(previewInvoice.status).label}
                      </span>
                    </div>
                    {isInvoiceOverdue(previewInvoice) && (
                      <div className="mt-2 text-sm text-red-600 font-semibold">
                        ⚠️ This invoice is overdue
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    printInvoice(previewInvoice);
                    setShowPreviewModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <PrinterIcon className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={() => {
                    emailInvoice(previewInvoice);
                    setShowPreviewModal(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <EnvelopeIcon className="w-4 h-4" />
                  Email
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Individual Email Invoice Modal */}
        {showEmailModal && invoiceToEmail && (
          <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <EnvelopeIcon className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Email Invoice</h3>
                  <p className="text-gray-600 mb-4">
                    Send invoice {invoiceToEmail.invoiceId} to {invoiceToEmail.customerName}
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                    <div className="space-y-2">
                      <div><span className="font-medium">To:</span> {invoiceToEmail.customerEmail || 'No email on file'}</div>
                      <div><span className="font-medium">Subject:</span> Invoice {invoiceToEmail.invoiceId} from Your Company</div>
                      <div><span className="font-medium">Amount:</span> ${invoiceToEmail.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowEmailModal(false);
                        setInvoiceToEmail(null);
                      }}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (invoiceToEmail.customerEmail) {
                          // Update invoice status to sent
                          const updatedInvoices = invoices.map(inv => 
                            inv.id === invoiceToEmail.id ? { ...inv, status: 'invoice-sent', updatedAt: new Date() } : inv
                          );
                          setInvoices(updatedInvoices);
                          await dataService.invoices.save(updatedInvoices);
                          alert(`Invoice ${invoiceToEmail.invoiceId} sent successfully to ${invoiceToEmail.customerEmail}`);
                        } else {
                          alert('No email address on file for this customer');
                        }
                        setShowEmailModal(false);
                        setInvoiceToEmail(null);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      disabled={!invoiceToEmail.customerEmail}
                    >
                      Send Email
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Invoice Modal */}
        {showEditModal && invoiceToEdit && (
          <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Edit Invoice</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setInvoiceToEdit(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const updatedInvoice = {
                    ...invoiceToEdit,
                    customerName: formData.get('customerName') as string,
                    customerEmail: formData.get('customerEmail') as string,
                    customerPhone: formData.get('customerPhone') as string,
                    reference: formData.get('reference') as string,
                    amount: parseFloat(formData.get('amount') as string),
                    salesRep: formData.get('salesRep') as string,
                    status: formData.get('status') as string,
                    dueDate: new Date(formData.get('dueDate') as string),
                    updatedAt: new Date()
                  };
                  
                  const updatedInvoices = invoices.map(inv => 
                    inv.id === invoiceToEdit.id ? updatedInvoice : inv
                  );
                  setInvoices(updatedInvoices);
                  await dataService.invoices.save(updatedInvoices);
                  setShowEditModal(false);
                  setInvoiceToEdit(null);
                  alert(`Invoice ${updatedInvoice.invoiceId} updated successfully`);
                }}>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                      <input
                        type="text"
                        name="customerName"
                        defaultValue={invoiceToEdit.customerName}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Customer Email</label>
                      <input
                        type="email"
                        name="customerEmail"
                        defaultValue={invoiceToEdit.customerEmail}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Customer Phone</label>
                      <input
                        type="tel"
                        name="customerPhone"
                        defaultValue={invoiceToEdit.customerPhone}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Reference</label>
                      <input
                        type="text"
                        name="reference"
                        defaultValue={invoiceToEdit.reference}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                      <input
                        type="number"
                        name="amount"
                        step="0.01"
                        defaultValue={invoiceToEdit.amount}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sales Rep</label>
                      <select
                        name="salesRep"
                        defaultValue={invoiceToEdit.salesRep}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                      >
                        {salesReps.map(rep => (
                          <option key={rep} value={rep}>{rep}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        name="status"
                        defaultValue={invoiceToEdit.status}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                      >
                        {customStatuses.map(status => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                      <input
                        type="date"
                        name="dueDate"
                        defaultValue={invoiceToEdit.dueDate.toISOString().split('T')[0]}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setInvoiceToEdit(null);
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Final Invoice PDF Modal */}
        {showPDFModal && invoiceForPDF && (
          <FinalInvoiceModal
            isOpen={showPDFModal}
            onClose={() => {
              setShowPDFModal(false);
              setInvoiceForPDF(null);
            }}
            invoiceData={invoiceForPDF}
          />
        )}
      </div>
    </div>
  );
}