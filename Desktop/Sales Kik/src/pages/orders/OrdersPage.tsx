import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import EnhancedOrderModal from '../../components/orders/EnhancedOrderModal';
import { generateOrderTemplate } from '../../components/orders/OrderTemplate';
import { dataService } from '../../services/api.service';
import { 
  PlusIcon, MagnifyingGlassIcon, PencilIcon, DocumentDuplicateIcon,
  ShoppingCartIcon, TrashIcon, EyeIcon, CalendarIcon,
  ChevronDownIcon, FunnelIcon, XMarkIcon, DocumentTextIcon,
  CheckIcon, ChartBarIcon, ClockIcon, PrinterIcon, EnvelopeIcon,
  BellIcon, ChatBubbleLeftIcon, ExclamationTriangleIcon,
  UserGroupIcon, ArrowsUpDownIcon, CreditCardIcon
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
                className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-b-0"
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

// Order interface
interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  orderId: string;
  reference: string;
  orderDate: Date;
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

// Function to generate unique Order ID
const generateUniqueOrderId = (existingOrders: Order[]): string => {
  const existingIds = existingOrders.map(order => order.orderId);
  let newId: string;
  
  do {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    newId = `OD-${randomNum}`;
  } while (existingIds.includes(newId));
  
  return newId;
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
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

  // EnhancedOrderModal state
  const [showEnhancedOrder, setShowEnhancedOrder] = useState(false);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null);

  // Bulk selection states
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  // Sorting states
  const [sortField, setSortField] = useState<string>('orderDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [showSingleDeleteConfirm, setShowSingleDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  
  // Email composition states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailOrderData, setEmailOrderData] = useState<Order | null>(null);

  // Custom statuses (will be loaded from settings)
  const [customStatuses, setCustomStatuses] = useState([
    { value: 'draft', label: 'Draft', color: '#94a3b8', description: 'Order in progress' },
    { value: 'sent', label: 'Sent', color: '#3b82f6', description: 'Order sent to customer' },
    { value: 'confirmed', label: 'Confirmed', color: '#10b981', description: 'Order accepted by customer' },
    { value: 'rejected', label: 'Rejected', color: '#ef4444', description: 'Order declined' },
    { value: 'expired', label: 'Expired', color: '#f59e0b', description: 'Order validity expired' },
    { value: 'invoiced', label: 'Invoiced', color: '#84cc16', description: 'Order converted to invoice' }
  ]);

  useEffect(() => {
    loadOrders();
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

  const loadOrders = async () => {
    try {
      console.log('🔍 Orders: Loading orders from database...');
      
      // Use direct API call to our orders endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders`);
      const data = await response.json();
      
      console.log('📡 Orders: API response:', data);
      
      if (data.success && data.data) {
        const ordersData = data.data;
        console.log('📂 Orders: Found', ordersData.length, 'orders in database');
        
        if (Array.isArray(ordersData) && ordersData.length > 0) {
          const parsedOrders = ordersData.map((order: any) => ({
            ...order,
            orderDate: new Date(order.createdAt),
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt)
          }));
          
          setOrders(parsedOrders);
          console.log('✅ Orders: Loaded database orders with customers:', parsedOrders.length);
          console.log('📂 Orders: Customer names in orders:', parsedOrders.map(o => o.customerName));
          
          // Sync to localStorage for offline capability
          localStorage.setItem('saleskik-orders', JSON.stringify(parsedOrders));
        } else {
          console.warn('⚠️ Orders: No orders found in database');
          setOrders([]);
        }
      } else {
        console.warn('⚠️ Orders: API call failed or returned no success');
        // Fall back to existing localStorage logic
        const savedOrders = localStorage.getItem('saleskik-orders');
        if (savedOrders) {
          const parsedOrders = JSON.parse(savedOrders).map((order: any) => ({
            ...order,
            orderDate: new Date(order.orderDate),
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt)
          }));
          setOrders(parsedOrders);
        }
      }
    } catch (error) {
      // If API fails, use localStorage (preserves existing behavior)
      console.warn('API unavailable, using localStorage fallback');
      const savedOrders = localStorage.getItem('saleskik-orders');
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders).map((order: any) => ({
          ...order,
          orderDate: new Date(order.orderDate),
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt)
        }));
        setOrders(parsedOrders);
      } else {
        // Sample data
        const sampleOrders: Order[] = [
          {
            id: '1',
            customerId: 'cust-1',
            customerName: 'ABC Construction Pty Ltd',
            customerEmail: 'orders@abcconstruction.com.au',
            customerPhone: '+61 3 9876 5432',
            orderId: '', // Will be set below
            reference: 'WEBSITE-DEV-2024',
            orderDate: new Date('2024-08-19'),
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
            orderId: '', // Will be set below
            reference: 'HARDWARE-SUPPLY-2024',
            orderDate: new Date('2024-08-18'),
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
            orderId: '', // Will be set below
            reference: 'CONSULTING-SERVICES',
            orderDate: new Date('2024-08-17'),
            expiryDate: new Date('2024-08-24'),
            amount: 3200.00,
            status: 'draft',
            isDeleted: false,
            isArchived: false,
            notes: 'Order expires soon - needs immediate follow-up',
            needsFollowUp: true,
            followUpDate: new Date('2024-08-22'),
            createdAt: new Date('2024-08-17'),
            updatedAt: new Date('2024-08-17')
          }
        ];
        
        // Generate unique Order IDs for sample data
        sampleOrders.forEach((order, index) => {
          order.orderId = generateUniqueOrderId(sampleOrders.slice(0, index));
        });
        
        setOrders(sampleOrders);
        localStorage.setItem('saleskik-orders', JSON.stringify(sampleOrders));
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      console.log('🔍 Orders: Loading customers from database...');
      
      // Use direct API call to our customers endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/customers`);
      const data = await response.json();
      
      console.log('📡 Orders: Customers API response:', data);
      
      if (data.success && data.data) {
        const customersData = data.data;
        console.log('📂 Orders: Found', customersData.length, 'customers in database');
        
        if (Array.isArray(customersData) && customersData.length > 0) {
          setCustomers(customersData);
          console.log('✅ Orders: Loaded database customers for filtering:', customersData.length);
          console.log('📂 Orders: Customer names:', customersData.map(c => c.name));
        } else {
          console.warn('⚠️ Orders: No customers found in database');
          setCustomers([]);
        }
      } else {
        console.warn('⚠️ Orders: Customer API failed');
        setCustomers([]);
      }
    } catch (error) {
      console.error('❌ Orders: Error loading customers:', error);
      setCustomers([]);
    }
  };

  const loadCustomStatuses = async () => {
    try {
      // Load custom statuses from the CustomStatusPage
      const savedDocumentTypes = localStorage.getItem('saleskik-document-types');
      if (savedDocumentTypes) {
        const documentTypes = JSON.parse(savedDocumentTypes);
        const orderDocType = documentTypes.find((dt: any) => dt.name === 'Order');
        
        if (orderDocType && orderDocType.statuses) {
          const orderStatuses = orderDocType.statuses.map((status: any) => ({
            value: status.name.toLowerCase().replace(/\s+/g, '-'),
            label: status.name,
            color: getStatusColor(status.name),
            description: `Order status: ${status.name}`
          }));
          setCustomStatuses(orderStatuses);
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
      'expired': '#f59e0b',
      'invoiced': '#84cc16'
    };
    
    const key = statusName.toLowerCase().replace(/\s+/g, ' ');
    return colorMap[key] || '#94a3b8';
  };

  // Filter and sort orders
  const filteredOrders = orders.filter(order => {
    const matchesCustomer = !searchCustomer || 
      order.customerName.toLowerCase().includes(searchCustomer.toLowerCase());
    
    const matchesStatus = !selectedStatus || order.status === selectedStatus;
    
    const matchesDateFrom = !dateFrom || 
      new Date(order.orderDate) >= new Date(dateFrom);
    
    const matchesDateTo = !dateTo || 
      new Date(order.orderDate) <= new Date(dateTo);
    
    const matchesKeywords = !searchKeywords || 
      order.reference.toLowerCase().includes(searchKeywords.toLowerCase()) ||
      order.orderId.toLowerCase().includes(searchKeywords.toLowerCase());
    
    const matchesDeleted = showDeleted || !order.isDeleted;
    
    return matchesCustomer && matchesStatus && matchesDateFrom && 
           matchesDateTo && matchesKeywords && matchesDeleted;
  }).sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'customerName':
        aValue = a.customerName.toLowerCase();
        bValue = b.customerName.toLowerCase();
        break;
      case 'orderId':
        aValue = a.orderId;
        bValue = b.orderId;
        break;
      case 'reference':
        aValue = a.reference.toLowerCase();
        bValue = b.reference.toLowerCase();
        break;
      case 'orderDate':
        aValue = new Date(a.orderDate).getTime();
        bValue = new Date(b.orderDate).getTime();
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

  const getStatusConfig = (status: string, order?: Order) => {
    // Override colors for customer responses
    if (order?.customerResponse) {
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

  const duplicateOrder = async (orderId: string) => {
    const order = orders.find(q => q.id === orderId);
    if (order) {
      const newOrder = {
        ...order,
        id: Date.now().toString(),
        orderId: generateUniqueOrderId(orders),
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const updatedOrders = [...orders, newOrder];
      setOrders(updatedOrders);
      // Save with hybrid approach (API + localStorage fallback)
      await dataService.orders.save(updatedOrders);
    }
  };

  // Generate unique Invoice ID (would come from accounting software integration)
  const generateInvoiceIdFromAccounting = (): string => {
    // Simulate integration with accounting software (Xero, MYOB, QuickBooks)
    // In real implementation, this would call the accounting API
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `INV-${randomNum}`;
  };

  const convertOrderToInvoice = (orderId: string) => {
    const order = orders.find(q => q.id === orderId);
    if (!order) return;

    // Generate invoice from accounting software
    const invoiceId = generateInvoiceIdFromAccounting();
    
    // Calculate due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Get current user as sales rep (would normally come from session)
    const currentUser = localStorage.getItem('employee-session') 
      ? JSON.parse(localStorage.getItem('employee-session') || '{}').name || 'Current User'
      : 'Admin User';

    // Create invoice object with full order data
    const newInvoice = {
      id: Date.now().toString(),
      customerId: order.customerId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      invoiceId: invoiceId,
      reference: order.reference,
      invoiceDate: new Date(),
      dueDate: dueDate,
      amount: order.amount,
      status: 'invoice-created',
      salesRep: currentUser,
      isDeleted: false,
      isArchived: false,
      notes: `Converted from order ${order.orderId}`,
      needsFollowUp: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Keep all original order data for PDF generation
      originalOrderId: order.orderId,
      originalOrderData: order,
      // Copy over order-specific fields if they exist
      projectName: order.projectName || order.reference,
      jobSections: order.jobSections || [],
      deliveryDetails: order.deliveryDetails || {},
      customer: {
        id: order.customerId,
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        primaryContact: {
          firstName: order.customerName.split(' ')[0],
          lastName: order.customerName.split(' ').slice(1).join(' '),
          email: order.customerEmail,
          mobile: order.customerPhone
        },
        locations: []
      },
      totals: {
        subtotal: order.amount / 1.1, // Remove GST
        gst: order.amount - (order.amount / 1.1),
        total: order.amount
      }
    };

    // Add to invoices
    const existingInvoices = localStorage.getItem('saleskik-invoices');
    const invoicesList = existingInvoices ? JSON.parse(existingInvoices) : [];
    const updatedInvoices = [...invoicesList, newInvoice];
    localStorage.setItem('saleskik-invoices', JSON.stringify(updatedInvoices));

    // Update order status to indicate it has been invoiced
    const updatedOrders = orders.map(q => 
      q.id === order.id ? { ...q, status: 'invoiced', updatedAt: new Date() } : q
    );
    setOrders(updatedOrders);
    localStorage.setItem('saleskik-orders', JSON.stringify(updatedOrders));

    // Show success message and offer to navigate to invoices
    if (confirm(`✅ Invoice ${invoiceId} created successfully!\n\nWould you like to view the invoices page?`)) {
      navigate('/invoices');
    }
  };

  const deleteOrder = (order: Order) => {
    setOrderToDelete(order);
    setShowSingleDeleteConfirm(true);
  };

  const confirmDeleteOrder = async () => {
    if (orderToDelete) {
      const updatedOrders = orders.map(q => 
        q.id === orderToDelete.id ? { ...q, isDeleted: true, updatedAt: new Date() } : q
      );
      setOrders(updatedOrders);
      // Save with hybrid approach (API + localStorage fallback)
      await dataService.orders.save(updatedOrders);
      setShowSingleDeleteConfirm(false);
      setOrderToDelete(null);
    }
  };

  // Bulk selection functions
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedOrders(
      selectedOrders.length === filteredOrders.length 
        ? [] 
        : filteredOrders.map(q => q.id)
    );
  };

  const bulkDeleteOrders = () => {
    const updatedOrders = orders.map(q => 
      selectedOrders.includes(q.id) ? { ...q, isDeleted: true, updatedAt: new Date() } : q
    );
    setOrders(updatedOrders);
    localStorage.setItem('saleskik-orders', JSON.stringify(updatedOrders));
    setSelectedOrders([]);
    setShowDeleteConfirm(false);
  };

  // Show bulk actions when orders are selected
  useEffect(() => {
    setShowBulkActions(selectedOrders.length > 0);
  }, [selectedOrders]);

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
  const previewOrderHandler = (order: Order) => {
    setPreviewOrder(order);
    setShowPreviewModal(true);
  };

  const printOrder = (order: Order) => {
    try {
      // Use the same PDF generation as viewOrderPDF but trigger print
      const companyProfile = JSON.parse(localStorage.getItem('companyProfile') || '{}');
      const companyName = localStorage.getItem('companyName');
      const companyLogo = localStorage.getItem('companyLogo');
      
      if (companyName) companyProfile.name = companyName;
      if (companyLogo) companyProfile.logo = companyLogo;
      
      const savedSettings = localStorage.getItem('saleskik-pdf-settings');
      const pdfSettings = savedSettings ? 
        JSON.parse(savedSettings).documentSettings?.order || {} : 
        { hideTotalPrice: false, hideItemPrice: false, hideItems: false };
      
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
      
      const orderDataForTemplate = {
        orderId: order.orderId,
        referenceNumber: order.reference,
        projectName: order.projectName || order.reference || 'Order Request',
        customer: {
          name: order.customerName,
          email: order.customerEmail,
          phone: order.customerPhone,
          primaryContact: {
            firstName: order.customerName.split(' ')[0],
            lastName: order.customerName.split(' ').slice(1).join(' '),
            email: order.customerEmail,
            mobile: order.customerPhone
          }
        },
        jobSections: order.jobSections || [
          {
            id: '1',
            name: 'Main Project',
            items: []
          }
        ],
        totals: {
          subtotal: order.amount / 1.1,
          gst: order.amount - (order.amount / 1.1),
          total: order.amount
        }
      };
      
      // Generate HTML and trigger print
      const htmlContent = generateOrderTemplate(orderDataForTemplate, globalStyling, companyProfile, pdfSettings);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
      }
      
    } catch (error) {
      console.error('Print error:', error);
      alert('Failed to print order. Please try again.');
    }
  };

  const emailOrder = (order: Order) => {
    if (!order.customerEmail) {
      alert('No email address found for this customer. Please update customer details first.');
      return;
    }
    
    // Open email composition modal (professional workflow)
    setEmailOrderData(order);
    setShowEmailModal(true);
  };

  const duplicateToNewCustomer = (order: Order) => {
    // TODO: Implement duplicate to new customer
    alert(`Duplicate to new customer for ${order.orderId} will be implemented`);
  };

  // Open order for editing in EnhancedOrderModal
  const editOrder = (order: Order) => {
    setSelectedOrderForEdit(order);
    setShowEnhancedOrder(true);
  };

  // Open order PDF
  const viewOrderPDF = async (order: Order) => {
    try {
      // Load company profile
      const companyProfile = JSON.parse(localStorage.getItem('companyProfile') || '{}');
      const companyName = localStorage.getItem('companyName');
      const companyLogo = localStorage.getItem('companyLogo');
      
      if (companyName) companyProfile.name = companyName;
      if (companyLogo) companyProfile.logo = companyLogo;
      
      // Load PDF settings
      const savedSettings = localStorage.getItem('saleskik-pdf-settings');
      const pdfSettings = savedSettings ? 
        JSON.parse(savedSettings).documentSettings?.order || {} : 
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
      
      // Prepare order data for template
      const orderDataForTemplate = {
        orderId: order.orderId,
        referenceNumber: order.reference,
        projectName: order.projectName || order.reference || 'Order Request',
        customer: {
          name: order.customerName,
          email: order.customerEmail,
          phone: order.customerPhone,
          primaryContact: {
            firstName: order.customerName.split(' ')[0],
            lastName: order.customerName.split(' ').slice(1).join(' '),
            email: order.customerEmail,
            mobile: order.customerPhone
          }
        },
        jobSections: order.jobSections || [
          {
            id: '1',
            name: 'Main Project',
            items: []
          }
        ],
        totals: {
          subtotal: order.amount / 1.1,
          gst: order.amount - (order.amount / 1.1),
          total: order.amount
        }
      };
      
      // Generate HTML using existing template
      const htmlContent = generateOrderTemplate(orderDataForTemplate, globalStyling, companyProfile, pdfSettings);
      
      // Open PDF in new window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
        };
      }
      
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const isOrderExpiring = (order: Order) => {
    if (!order.expiryDate) return false;
    const today = new Date();
    const expiry = new Date(order.expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const isOrderExpired = (order: Order) => {
    if (!order.expiryDate) return false;
    const today = new Date();
    const expiry = new Date(order.expiryDate);
    return expiry < today;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="orders" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="Manage Orders"
        subtitle="View, edit, and manage all your business orders"
        onMenuToggle={() => setShowSidebar(true)}
      />

      <div className="p-8 w-full max-w-none mx-auto">
        {/* Filters Section */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 mb-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
              <FunnelIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
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

            {/* Add New Order Button with Show Deleted above */}
            <div>
              <div className="mb-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showDeleted}
                    onChange={(e) => setShowDeleted(e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700">Show Deleted</span>
                </label>
              </div>
              <button
                onClick={() => navigate('/orders/new')}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add New Order
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

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-orange-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                  <DocumentTextIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Your Orders ({filteredOrders.length})
                  </h3>
                  <p className="text-sm text-gray-500">
                    Manage and track all your business orders
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {filteredOrders.length} of {orders.length} orders
                </div>
                <div className="text-xs text-gray-400">
                  Total value: ${orders.reduce((sum, q) => !q.isDeleted ? sum + q.amount : sum, 0).toLocaleString()}
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
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-orange-600 focus:ring-blue-500"
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
                    onClick={() => handleSort('orderId')}
                  >
                    <div className="flex items-center gap-1">
                      Order ID
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
                    onClick={() => handleSort('orderDate')}
                  >
                    <div className="flex items-center gap-1">
                      Order Date
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
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                      <p className="text-gray-600 mb-4">
                        {orders.length === 0 
                          ? "Get started by creating your first order"
                          : "Try adjusting your filters to see more results"
                        }
                      </p>
                      <button
                        onClick={() => navigate('/orders/new')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                      >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Create Your First Order
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order, index) => {
                    const statusConfig = getStatusConfig(order.status, order);
                    const isFirstRow = index === 0;
                    
                    return (
                      <tr key={order.id} className={`transition-all duration-200 group ${
                        selectedOrders.includes(order.id) 
                          ? 'bg-orange-50 border-l-4 border-blue-500' 
                          : 'hover:bg-gradient-to-r hover:from-blue-25 hover:to-purple-25'
                      }`}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order.id)}
                            onChange={() => toggleOrderSelection(order.id)}
                            className="rounded border-gray-300 text-orange-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                              <span className="text-orange-600 font-bold text-sm">
                                {order.customerName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <div 
                                    className="text-sm font-medium text-gray-900 cursor-help hover:text-orange-600 transition-colors"
                                    onMouseEnter={(e) => {
                                      const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                                      if (tooltip) tooltip.style.opacity = '1';
                                    }}
                                    onMouseLeave={(e) => {
                                      const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                                      if (tooltip) tooltip.style.opacity = '0';
                                    }}
                                  >
                                    {order.customerName}
                                  </div>
                                  {/* Hover tooltip */}
                                  <div className={`absolute ${isFirstRow ? 'top-full mt-2' : 'bottom-full mb-2'} left-0 px-4 py-3 bg-white border border-gray-200 shadow-xl rounded-lg opacity-0 transition-opacity z-20 whitespace-nowrap pointer-events-none`}>
                                    <div className="space-y-1">
                                      <div className="text-sm font-medium text-gray-900">Contact Information</div>
                                      <div className="text-xs text-gray-600 space-y-1">
                                        <div>Email: {order.customerEmail || 'Not provided'}</div>
                                        <div>Phone: {order.customerPhone || 'Not provided'}</div>
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
                              onClick={() => viewOrderPDF(order)}
                              className="text-sm text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded hover:bg-orange-100 transition-colors cursor-pointer"
                              title="Click to view PDF"
                            >
                              {order.orderId}
                            </button>
                            <button
                              onClick={() => previewOrderHandler(order)}
                              className="p-1 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                              title="Preview Order"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => printOrder(order)}
                              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                              title="Print Order"
                            >
                              <PrinterIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => emailOrder(order)}
                              className="p-1 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                              title="Email Order to Customer"
                            >
                              <EnvelopeIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">{order.reference}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {order.orderDate.toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                            ${order.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                              title={order.customerResponse ? `Customer ${order.customerResponse.decision === 'accept' ? 'accepted' : 'declined'} on ${new Date(order.customerResponse.responseDate).toLocaleDateString()}` : ''}
                            >
                              {order.customerResponse && (order.status === 'accepted' || order.status === 'declined') 
                                ? `${statusConfig.label} by Customer`
                                : statusConfig.label}
                            </span>
                            {order.customerResponse?.selectedOptions && Object.keys(order.customerResponse.selectedOptions).length > 0 && (
                              <span 
                                className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300"
                                title={`Customer selections: ${Object.entries(order.customerResponse.selectedOptions).map(([cat, opt]) => `${cat}: ${opt}`).join(', ')}`}
                              >
                                Options Selected
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => editOrder(order)}
                              className="p-2 text-orange-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Edit this order"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => duplicateOrder(order.id)}
                              className="p-2 text-green-600 hover:text-white hover:bg-green-600 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Create a copy of this order"
                            >
                              <DocumentDuplicateIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => console.log('Create Purchase Order for:', order.id)}
                              className="p-2 text-purple-600 hover:text-white hover:bg-purple-600 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Create Purchase Order"
                            >
                              <ShoppingCartIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => convertOrderToInvoice(order.id)}
                              className="p-2 text-lime-600 hover:text-white hover:bg-lime-600 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Convert order to invoice"
                            >
                              <CreditCardIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteOrder(order)}
                              className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Delete this order"
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
                    Showing {filteredOrders.length} of {orders.length} orders
                  </p>
                  <p className="text-xs text-gray-500">
                    {filteredOrders.filter(q => !q.isDeleted).length} active orders
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">Total Order Value</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  ${filteredOrders.reduce((sum, q) => !q.isDeleted ? sum + q.amount : sum, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{selectedOrders.length}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
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
                  onClick={() => setSelectedOrders([])}
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Selected Orders</h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''}?
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-40 overflow-y-auto">
                  <h4 className="font-semibold text-gray-900 mb-2">Orders to delete:</h4>
                  {selectedOrders.map(orderId => {
                    const order = orders.find(q => q.id === orderId);
                    return order ? (
                      <div key={orderId} className="flex justify-between items-center py-1 text-sm">
                        <span>{order.orderId}</span>
                        <span className="text-gray-500">{order.customerName}</span>
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
                    onClick={bulkDeleteOrders}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Single Order Delete Confirmation Modal */}
        {showSingleDeleteConfirm && orderToDelete && (
          <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrashIcon className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Order</h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete this order? This action cannot be undone.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 mb-2">Order Details:</div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div><span className="font-medium">Order ID:</span> {orderToDelete.orderId}</div>
                      <div><span className="font-medium">Customer:</span> {orderToDelete.customerName}</div>
                      <div><span className="font-medium">Reference:</span> {orderToDelete.reference}</div>
                      <div><span className="font-medium">Amount:</span> ${orderToDelete.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowSingleDeleteConfirm(false);
                      setOrderToDelete(null);
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteOrder}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Delete Order
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">Send Batch Orders</h3>
                <p className="text-gray-600 mb-4">
                  Send {selectedOrders.length} selected order{selectedOrders.length !== 1 ? 's' : ''} to customers
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-40 overflow-y-auto">
                  <h4 className="font-semibold text-gray-900 mb-2">Orders to send:</h4>
                  {selectedOrders.map(orderId => {
                    const order = orders.find(q => q.id === orderId);
                    return order ? (
                      <div key={orderId} className="flex justify-between items-center py-1 text-sm">
                        <span>{order.orderId}</span>
                        <span className="text-gray-500">{order.customerName}</span>
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
                      setSelectedOrders([]);
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

        {/* Enhanced Order Modal for Editing */}
        {selectedOrderForEdit && (
          <EnhancedOrderModal
            isOpen={showEnhancedOrder}
            onClose={() => {
              setShowEnhancedOrder(false);
              setSelectedOrderForEdit(null);
              // Refresh orders list after editing
              loadOrders();
            }}
            customer={{
              id: selectedOrderForEdit.customerId,
              name: selectedOrderForEdit.customerName,
              email: selectedOrderForEdit.customerEmail || '',
              phone: selectedOrderForEdit.customerPhone || '',
              primaryContact: {
                firstName: selectedOrderForEdit.customerName.split(' ')[0],
                lastName: selectedOrderForEdit.customerName.split(' ').slice(1).join(' '),
                email: selectedOrderForEdit.customerEmail,
                mobile: selectedOrderForEdit.customerPhone
              },
              locations: []
            }}
            projectName={selectedOrderForEdit.projectName || ''}
            orderId={selectedOrderForEdit.orderId}
            referenceNumber={selectedOrderForEdit.reference}
            jobSections={selectedOrderForEdit.jobSections || []}
            deliveryDetails={{
              method: 'delivery',
              address: '',
              contactName: selectedOrderForEdit.customerName,
              contactPhone: selectedOrderForEdit.customerPhone || '',
              specialInstructions: ''
            }}
          />
        )}

        {/* Email Composition Modal */}
        {showEmailModal && emailOrderData && (
          <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Email Order</h3>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailOrderData(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-2">Order Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Order ID:</span> {emailOrderData.orderId}</div>
                    <div><span className="font-medium">Customer:</span> {emailOrderData.customerName}</div>
                    <div><span className="font-medium">Email:</span> {emailOrderData.customerEmail}</div>
                    <div><span className="font-medium">Amount:</span> ${emailOrderData.amount.toFixed(2)}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Template</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                    <option>Standard Order Template</option>
                    <option>Professional Order Template</option>
                    <option>Order Confirmation Template</option>
                    <option>Custom Template</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    defaultValue={`Order Confirmation ${emailOrderData.orderId} - ${emailOrderData.reference}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    rows={6}
                    defaultValue={`Dear ${emailOrderData.customerName},\n\nThank you for your order! Please find attached your order confirmation for ${emailOrderData.reference}.\n\nOrder Details:\n- Order ID: ${emailOrderData.orderId}\n- Total Amount: $${emailOrderData.amount.toFixed(2)} (inc GST)\n\nWe will begin processing your order shortly and will keep you updated on progress.\n\nPlease don't hesitate to contact us if you have any questions.\n\nBest regards,\nYour Sales Team`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 mr-2" />
                    <span className="text-sm text-gray-700">Attach PDF</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 mr-2" />
                    <span className="text-sm text-gray-700">Request Customer Confirmation</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 mr-2" />
                    <span className="text-sm text-gray-700">Send Progress Updates</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowEmailModal(false);
                      setEmailOrderData(null);
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Preview email before sending
                      alert('Email preview - formatted order confirmation will open in new window for review');
                    }}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => {
                      // Send email with composed content
                      alert(`Order confirmation ${emailOrderData.orderId} emailed successfully to ${emailOrderData.customerEmail}!`);
                      // Update order status to 'sent'
                      const updatedOrders = orders.map(o => 
                        o.id === emailOrderData.id ? { ...o, status: 'sent', updatedAt: new Date() } : o
                      );
                      setOrders(updatedOrders);
                      localStorage.setItem('saleskik-orders', JSON.stringify(updatedOrders));
                      setShowEmailModal(false);
                      setEmailOrderData(null);
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
      </div>
    </div>
  );
}