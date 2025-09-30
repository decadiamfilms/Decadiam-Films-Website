import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import { 
  PlusIcon, MagnifyingGlassIcon, XMarkIcon, ChevronDownIcon,
  AdjustmentsHorizontalIcon, DocumentTextIcon, ClockIcon,
  ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon,
  BuildingOfficeIcon, TagIcon, CalendarIcon, CubeIcon,
  ShoppingCartIcon, DocumentDuplicateIcon, EyeIcon,
  PencilIcon, TrashIcon, ArrowDownTrayIcon, FunnelIcon,
  BanknotesIcon, TruckIcon, ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

// Interfaces matching the Prisma schema
interface Supplier {
  id: string;
  supplierName: string;
  supplierCode: string;
  contactPerson?: string;
  emailAddress: string;
  phoneNumber?: string;
  paymentTerms?: string;
  isLocalGlassSupplier: boolean;
  isApprovedSupplier: boolean;
  performanceRating: number;
  lastOrderDate?: Date;
  totalOrdersCount: number;
}

interface PurchaseOrderLineItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitPrice: number;
  subtotal: number;
  customModuleType?: string;
  customModuleFlag: boolean;
  specialInstructions?: string;
}

interface PurchaseOrder {
  id: string;
  purchaseOrderNumber: string;
  supplier: Supplier;
  customerId?: string;
  customerName?: string;
  customerReference?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT_TO_SUPPLIER' | 'SUPPLIER_CONFIRMED' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED' | 'INVOICED' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';
  priorityLevel: 'NORMAL' | 'HIGH' | 'URGENT';
  totalAmount: number;
  expectedDeliveryDate?: Date;
  shippingInstructions?: string;
  internalNotes?: string;
  approvalRequired: boolean;
  approvedBy?: string;
  approvalDate?: Date;
  supplierConfirmedDate?: Date;
  invoiceRequired: boolean;
  invoiceCreated: boolean;
  dispatchBlocked: boolean;
  lineItems: PurchaseOrderLineItem[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Status configuration for visual indicators
const statusConfig = {
  DRAFT: { color: 'gray', icon: '📝', label: 'Draft' },
  PENDING_APPROVAL: { color: 'yellow', icon: '⏳', label: 'Pending Approval' },
  APPROVED: { color: 'green', icon: '✅', label: 'Approved' },
  SENT_TO_SUPPLIER: { color: 'blue', icon: '📤', label: 'Sent to Supplier' },
  SUPPLIER_CONFIRMED: { color: 'indigo', icon: '🤝', label: 'Supplier Confirmed' },
  PARTIALLY_RECEIVED: { color: 'orange', icon: '📦', label: 'Partially Received' },
  FULLY_RECEIVED: { color: 'green', icon: '✅', label: 'Fully Received' },
  INVOICED: { color: 'purple', icon: '🧾', label: 'Invoiced' },
  COMPLETED: { color: 'green', icon: '🎉', label: 'Completed' },
  CANCELLED: { color: 'red', icon: '❌', label: 'Cancelled' },
  ON_HOLD: { color: 'gray', icon: '⏸️', label: 'On Hold' }
};

const priorityConfig = {
  NORMAL: { color: 'green', icon: '🟢', label: 'Normal' },
  HIGH: { color: 'yellow', icon: '🟡', label: 'High' },
  URGENT: { color: 'red', icon: '🔴', label: 'Urgent' }
};

// Tooltip Component
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap ${positionClasses[position]}`}>
          {content}
          <div className={`absolute w-2 h-2 bg-gray-900 rotate-45 ${
            position === 'top' ? 'top-full left-1/2 transform -translate-x-1/2 -mt-1' :
            position === 'bottom' ? 'bottom-full left-1/2 transform -translate-x-1/2 -mb-1' :
            position === 'left' ? 'left-full top-1/2 transform -translate-y-1/2 -ml-1' :
            'right-full top-1/2 transform -translate-y-1/2 -mr-1'
          }`}></div>
        </div>
      )}
    </div>
  );
}

// Date Range Picker Component
interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onPresetSelect: (preset: string) => void;
}

function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange, onPresetSelect }: DateRangePickerProps) {
  const presets = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'thisWeek' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last 30 Days', value: 'last30Days' },
    { label: 'All Time', value: 'allTime' }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Date Range</h4>
        <div className="flex gap-2">
          {presets.map(preset => (
            <button
              key={preset.value}
              onClick={() => onPresetSelect(preset.value)}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  const [showPendingApproval, setShowPendingApproval] = useState(false);
  const [showAwaitingInvoice, setShowAwaitingInvoice] = useState(false);

  // Table sorting
  const [sortField, setSortField] = useState<keyof PurchaseOrder>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Selected items for bulk actions
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  useEffect(() => {
    loadPurchaseOrders();
    loadSuppliers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [purchaseOrders, searchTerm, selectedSuppliers, selectedStatuses, selectedPriorities, startDate, endDate, showUrgentOnly, showPendingApproval, showAwaitingInvoice]);

  const loadPurchaseOrders = () => {
    // Load from localStorage initially (replace with API call later)
    const savedOrders = localStorage.getItem('saleskik-purchase-orders');
    if (savedOrders) {
      try {
        const parsedOrders = JSON.parse(savedOrders);
        const ordersWithDates = parsedOrders.map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
          expectedDeliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate) : undefined,
          approvalDate: order.approvalDate ? new Date(order.approvalDate) : undefined,
          supplierConfirmedDate: order.supplierConfirmedDate ? new Date(order.supplierConfirmedDate) : undefined
        }));
        setPurchaseOrders(ordersWithDates);
      } catch (error) {
        console.error('Error parsing saved purchase orders:', error);
        createSampleData();
      }
    } else {
      createSampleData();
    }
    setLoading(false);
  };

  const loadSuppliers = () => {
    // Load suppliers from localStorage
    const savedSuppliers = localStorage.getItem('saleskik-suppliers');
    if (savedSuppliers) {
      try {
        const parsedSuppliers = JSON.parse(savedSuppliers);
        setSuppliers(parsedSuppliers);
      } catch (error) {
        console.error('Error parsing saved suppliers:', error);
        createSampleSuppliers();
      }
    } else {
      createSampleSuppliers();
    }
  };

  const createSampleSuppliers = () => {
    const sampleSuppliers: Supplier[] = [
      {
        id: '1',
        supplierName: 'Premium Glass Solutions',
        supplierCode: 'PGS001',
        contactPerson: 'Sarah Mitchell',
        emailAddress: 'orders@premiumglass.com.au',
        phoneNumber: '+61 3 9876 5432',
        paymentTerms: '30 Days NET',
        isLocalGlassSupplier: true,
        isApprovedSupplier: true,
        performanceRating: 4.8,
        lastOrderDate: new Date('2024-01-15'),
        totalOrdersCount: 156
      },
      {
        id: '2',
        supplierName: 'BuildTech Hardware Supplies',
        supplierCode: 'BTH002',
        contactPerson: 'Mark Johnson',
        emailAddress: 'procurement@buildtech.com.au',
        phoneNumber: '+61 2 8765 4321',
        paymentTerms: '14 Days NET',
        isLocalGlassSupplier: false,
        isApprovedSupplier: true,
        performanceRating: 4.5,
        lastOrderDate: new Date('2024-01-10'),
        totalOrdersCount: 89
      },
      {
        id: '3',
        supplierName: 'Industrial Steel & Components',
        supplierCode: 'ISC003',
        contactPerson: 'David Chen',
        emailAddress: 'sales@industrialsteel.com.au',
        phoneNumber: '+61 7 5432 1098',
        paymentTerms: '45 Days NET',
        isLocalGlassSupplier: false,
        isApprovedSupplier: true,
        performanceRating: 4.2,
        lastOrderDate: new Date('2024-01-08'),
        totalOrdersCount: 203
      }
    ];
    setSuppliers(sampleSuppliers);
    localStorage.setItem('saleskik-suppliers', JSON.stringify(sampleSuppliers));
  };

  const createSampleData = () => {
    const sampleOrders: PurchaseOrder[] = [
      {
        id: '1',
        purchaseOrderNumber: 'PO-2024-001',
        supplier: suppliers[0] || {
          id: '1',
          supplierName: 'Premium Glass Solutions',
          supplierCode: 'PGS001',
          emailAddress: 'orders@premiumglass.com.au',
          isLocalGlassSupplier: true,
          isApprovedSupplier: true,
          performanceRating: 4.8,
          totalOrdersCount: 156
        },
        customerId: 'cust-001',
        customerName: 'ABC Construction',
        customerReference: 'Project Phoenix - Phase 1',
        status: 'SUPPLIER_CONFIRMED',
        priorityLevel: 'HIGH',
        totalAmount: 15750.00,
        expectedDeliveryDate: new Date('2024-02-15'),
        shippingInstructions: 'Deliver to site office, contact John before delivery',
        approvalRequired: true,
        approvedBy: 'user-admin',
        approvalDate: new Date('2024-01-12'),
        supplierConfirmedDate: new Date('2024-01-13'),
        invoiceRequired: true,
        invoiceCreated: false,
        dispatchBlocked: true,
        lineItems: [
          {
            id: '1',
            productId: 'prod-001',
            productName: '12mm Clear Toughened Glass',
            productSku: '12F-CLEAR-T',
            quantityOrdered: 15,
            quantityReceived: 0,
            unitPrice: 850.00,
            subtotal: 12750.00,
            customModuleType: 'custom-glass',
            customModuleFlag: true,
            specialInstructions: 'Custom cutting required'
          },
          {
            id: '2',
            productId: 'prod-002',
            productName: 'Stainless Steel Spigots',
            productSku: 'SS-SPIGOT-50',
            quantityOrdered: 60,
            quantityReceived: 0,
            unitPrice: 50.00,
            subtotal: 3000.00,
            customModuleFlag: false
          }
        ],
        createdBy: 'user-admin',
        createdAt: new Date('2024-01-11'),
        updatedAt: new Date('2024-01-13')
      },
      {
        id: '2',
        purchaseOrderNumber: 'PO-2024-002',
        supplier: suppliers[1] || {
          id: '2',
          supplierName: 'BuildTech Hardware Supplies',
          supplierCode: 'BTH002',
          emailAddress: 'procurement@buildtech.com.au',
          isLocalGlassSupplier: false,
          isApprovedSupplier: true,
          performanceRating: 4.5,
          totalOrdersCount: 89
        },
        customerReference: 'General Stock Replenishment',
        status: 'PENDING_APPROVAL',
        priorityLevel: 'URGENT',
        totalAmount: 8450.00,
        expectedDeliveryDate: new Date('2024-02-10'),
        approvalRequired: true,
        invoiceRequired: true,
        invoiceCreated: false,
        dispatchBlocked: true,
        lineItems: [
          {
            id: '3',
            productId: 'prod-003',
            productName: 'Aluminum Channel 50x25',
            productSku: 'ALU-CH-50x25',
            quantityOrdered: 100,
            quantityReceived: 0,
            unitPrice: 45.50,
            subtotal: 4550.00,
            customModuleFlag: false
          },
          {
            id: '4',
            productId: 'prod-004',
            productName: 'Galvanized Bolts M12x40',
            productSku: 'GALV-BOLT-M12x40',
            quantityOrdered: 500,
            quantityReceived: 0,
            unitPrice: 7.80,
            subtotal: 3900.00,
            customModuleFlag: false
          }
        ],
        createdBy: 'user-admin',
        createdAt: new Date('2024-01-14'),
        updatedAt: new Date('2024-01-14')
      },
      {
        id: '3',
        purchaseOrderNumber: 'PO-2024-003',
        supplier: suppliers[2] || {
          id: '3',
          supplierName: 'Industrial Steel & Components',
          supplierCode: 'ISC003',
          emailAddress: 'sales@industrialsteel.com.au',
          isLocalGlassSupplier: false,
          isApprovedSupplier: true,
          performanceRating: 4.2,
          totalOrdersCount: 203
        },
        status: 'DRAFT',
        priorityLevel: 'NORMAL',
        totalAmount: 2340.00,
        approvalRequired: false,
        invoiceRequired: true,
        invoiceCreated: false,
        dispatchBlocked: true,
        lineItems: [
          {
            id: '5',
            productId: 'prod-005',
            productName: 'Steel Frame Components',
            productSku: 'STEEL-FRAME-STD',
            quantityOrdered: 12,
            quantityReceived: 0,
            unitPrice: 195.00,
            subtotal: 2340.00,
            customModuleFlag: false
          }
        ],
        createdBy: 'user-admin',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      }
    ];

    setPurchaseOrders(sampleOrders);
    localStorage.setItem('saleskik-purchase-orders', JSON.stringify(sampleOrders));
  };

  const applyFilters = () => {
    let filtered = [...purchaseOrders];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.purchaseOrderNumber.toLowerCase().includes(searchLower) ||
        order.supplier.supplierName.toLowerCase().includes(searchLower) ||
        (order.customerName && order.customerName.toLowerCase().includes(searchLower)) ||
        (order.customerReference && order.customerReference.toLowerCase().includes(searchLower))
      );
    }

    // Supplier filter
    if (selectedSuppliers.length > 0) {
      filtered = filtered.filter(order => selectedSuppliers.includes(order.supplier.id));
    }

    // Status filter
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(order => selectedStatuses.includes(order.status));
    }

    // Priority filter
    if (selectedPriorities.length > 0) {
      filtered = filtered.filter(order => selectedPriorities.includes(order.priorityLevel));
    }

    // Date range filter
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(order => order.createdAt >= start);
    }
    if (endDate) {
      const end = new Date(endDate + 'T23:59:59');
      filtered = filtered.filter(order => order.createdAt <= end);
    }

    // Quick filters
    if (showUrgentOnly) {
      filtered = filtered.filter(order => order.priorityLevel === 'URGENT');
    }
    if (showPendingApproval) {
      filtered = filtered.filter(order => order.status === 'PENDING_APPROVAL');
    }
    if (showAwaitingInvoice) {
      filtered = filtered.filter(order => order.invoiceRequired && !order.invoiceCreated);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredOrders(filtered);
  };

  const handleSort = (field: keyof PurchaseOrder) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handlePresetFilter = (preset: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (preset) {
      case 'today':
        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'thisWeek':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        setStartDate(weekStart.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'thisMonth':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(monthStart.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'last30Days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'allTime':
        setStartDate('');
        setEndDate('');
        break;
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
        config.color === 'green' ? 'bg-green-100 text-green-800' :
        config.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
        config.color === 'blue' ? 'bg-blue-100 text-blue-800' :
        config.color === 'orange' ? 'bg-orange-100 text-orange-800' :
        config.color === 'red' ? 'bg-red-100 text-red-800' :
        config.color === 'purple' ? 'bg-purple-100 text-purple-800' :
        config.color === 'indigo' ? 'bg-indigo-100 text-indigo-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        <span>{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        config.color === 'green' ? 'bg-green-100 text-green-800' :
        config.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        <span>{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getInvoiceStatusIndicator = (order: PurchaseOrder) => {
    if (!order.invoiceRequired) {
      return <span className="text-gray-500 text-sm">Not Required</span>;
    }
    
    if (order.invoiceCreated) {
      return (
        <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
          <CheckCircleIcon className="w-4 h-4" />
          Created
        </span>
      );
    }
    
    if (order.dispatchBlocked) {
      return (
        <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
          <ExclamationTriangleIcon className="w-4 h-4" />
          Missing - Blocked
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1 text-yellow-600 text-sm font-medium">
        <ClockIcon className="w-4 h-4" />
        Pending
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="inventory" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="Purchase Orders"
        subtitle="Manage procurement and supplier orders"
        onMenuToggle={() => setShowSidebar(true)}
      />

      <div className="p-6 max-w-none mx-auto">
        
        {/* Header Actions & Stats */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{filteredOrders.length}</div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {filteredOrders.filter(o => o.priorityLevel === 'URGENT').length}
                </div>
                <div className="text-sm text-gray-600">Urgent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredOrders.filter(o => o.status === 'PENDING_APPROVAL').length}
                </div>
                <div className="text-sm text-gray-600">Pending Approval</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {filteredOrders.filter(o => o.invoiceRequired && !o.invoiceCreated).length}
                </div>
                <div className="text-sm text-gray-600">Awaiting Invoice</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  showFilters 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FunnelIcon className="w-4 h-4" />
                Filters
              </button>
              <button
                onClick={() => navigate('/inventory/purchase-orders/new')}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all shadow-sm"
              >
                <PlusIcon className="w-4 h-4" />
                New Purchase Order
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filtering Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Orders</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="PO number, supplier, customer..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Date Range */}
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onPresetSelect={handlePresetFilter}
              />

              {/* Supplier Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Suppliers</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {suppliers.map(supplier => (
                    <label key={supplier.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedSuppliers.includes(supplier.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSuppliers([...selectedSuppliers, supplier.id]);
                          } else {
                            setSelectedSuppliers(selectedSuppliers.filter(id => id !== supplier.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{supplier.supplierName}</span>
                      {supplier.isLocalGlassSupplier && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">Glass</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Quick Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showUrgentOnly}
                      onChange={(e) => setShowUrgentOnly(e.target.checked)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">🔴 Urgent Orders Only</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showPendingApproval}
                      onChange={(e) => setShowPendingApproval(e.target.checked)}
                      className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                    />
                    <span className="text-sm text-gray-700">⏳ Pending Approval</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showAwaitingInvoice}
                      onChange={(e) => setShowAwaitingInvoice(e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">🧾 Awaiting Invoice</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Filter Summary */}
            {(searchTerm || selectedSuppliers.length > 0 || selectedStatuses.length > 0 || startDate || endDate || showUrgentOnly || showPendingApproval || showAwaitingInvoice) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {filteredOrders.length} of {purchaseOrders.length} purchase orders
                  </div>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedSuppliers([]);
                      setSelectedStatuses([]);
                      setSelectedPriorities([]);
                      setStartDate('');
                      setEndDate('');
                      setShowUrgentOnly(false);
                      setShowPendingApproval(false);
                      setShowAwaitingInvoice(false);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Purchase Orders Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading purchase orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {purchaseOrders.length === 0 ? 'No Purchase Orders Yet' : 'No Orders Match Your Filters'}
              </h3>
              <p className="text-gray-600 mb-6">
                {purchaseOrders.length === 0 
                  ? 'Create your first purchase order to get started with supplier management.'
                  : 'Try adjusting your search criteria or filters to find the orders you\'re looking for.'
                }
              </p>
              <button
                onClick={() => navigate('/inventory/purchase-orders/new')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                Create First Purchase Order
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <tr>
                    <th className="px-4 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrders(filteredOrders.map(o => o.id));
                          } else {
                            setSelectedOrders([]);
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th 
                      className="px-4 py-4 text-left text-sm font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => handleSort('purchaseOrderNumber')}
                    >
                      <div className="flex items-center gap-2">
                        Purchase Order
                        {sortField === 'purchaseOrderNumber' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-4 text-left text-sm font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => handleSort('supplier')}
                    >
                      Supplier
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-600 uppercase tracking-wider">
                      Customer & Reference
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-gray-600 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-4 text-right text-sm font-bold text-gray-600 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-gray-600 uppercase tracking-wider">
                      Invoice Status
                    </th>
                    <th 
                      className="px-4 py-4 text-left text-sm font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-2">
                        Created
                        {sortField === 'createdAt' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order, index) => (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      } ${selectedOrders.includes(order.id) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => toggleOrderSelection(order.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <div className="font-bold text-gray-900">{order.purchaseOrderNumber}</div>
                          <div className="text-sm text-gray-600">
                            {order.lineItems.length} item{order.lineItems.length !== 1 ? 's' : ''}
                            {order.lineItems.some(item => item.customModuleFlag) && (
                              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">
                                🪟 Custom Glass
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <div className="font-medium text-gray-900">{order.supplier.supplierName}</div>
                          <div className="text-sm text-gray-600">{order.supplier.supplierCode}</div>
                          {order.supplier.isLocalGlassSupplier && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs mt-1 w-fit">
                              🪟 Glass Supplier
                            </span>
                          )}
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-yellow-600">★</span>
                            <span className="text-xs text-gray-600">{order.supplier.performanceRating.toFixed(1)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          {order.customerName ? (
                            <>
                              <div className="font-medium text-gray-900">{order.customerName}</div>
                              {order.customerReference && (
                                <div className="text-sm text-gray-600">{order.customerReference}</div>
                              )}
                            </>
                          ) : (
                            <div className="text-sm text-gray-500">Stock Replenishment</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {getPriorityBadge(order.priorityLevel)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {getStatusBadge(order.status)}
                        {order.supplierConfirmedDate && (
                          <div className="text-xs text-green-600 mt-1">
                            Confirmed {order.supplierConfirmedDate.toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="font-bold text-green-600 text-lg">
                          ${order.totalAmount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                        </div>
                        {order.expectedDeliveryDate && (
                          <div className="text-sm text-gray-600">
                            Due: {order.expectedDeliveryDate.toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {getInvoiceStatusIndicator(order)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm text-gray-600">
                            {order.createdAt.toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.createdAt.toLocaleTimeString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Tooltip content="View Details">
                            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          </Tooltip>
                          <Tooltip content="Edit Order">
                            <button className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </Tooltip>
                          {order.status === 'DRAFT' && (
                            <Tooltip content="Delete Draft">
                              <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl border border-gray-200 shadow-xl p-4 z-50">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">
                {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
                  Bulk Approve
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors">
                  Send to Suppliers
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
                  Export
                </button>
                <button
                  onClick={() => setSelectedOrders([])}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}