import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../layout/UniversalNavigation';
import UniversalHeader from '../layout/UniversalHeader';
import ApprovalWorkflowEngine from './ApprovalWorkflowEngine';
import BusinessRuleEngine from './BusinessRuleEngine';
import PurchaseOrderAnalytics from './PurchaseOrderAnalytics';
import GoodsReceiptManager from './GoodsReceiptManager';
import { EmailNotificationStatus } from '../../services/PurchaseOrderEmailService';
import PurchaseOrderStateMachine from '../../services/PurchaseOrderStateMachine';
import PurchaseOrderPermissionService from '../../services/PurchaseOrderPermissionService';
import RealtimeNotificationCenter from './RealtimeNotificationCenter';
import EmailDeliveryDashboard from './EmailDeliveryDashboard';
import AttachmentBundleManager from './AttachmentBundleManager';
import SupplierTimeoutDashboard from './SupplierTimeoutDashboard';
import SupplierTimeoutMonitoringService from '../../services/SupplierTimeoutMonitoringService';
import { usePurchaseOrderWebSocket, WebSocketMessage } from '../../services/PurchaseOrderWebSocketService';
import { 
  PlusIcon, MagnifyingGlassIcon, XMarkIcon, ChevronDownIcon,
  AdjustmentsHorizontalIcon, DocumentTextIcon, ClockIcon,
  ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon,
  BuildingOfficeIcon, TagIcon, CalendarIcon, CubeIcon,
  ShoppingCartIcon, DocumentDuplicateIcon, EyeIcon,
  PencilIcon, TrashIcon, ArrowDownTrayIcon, FunnelIcon,
  BanknotesIcon, TruckIcon, ClipboardDocumentCheckIcon,
  StarIcon, ChartBarIcon, ShieldExclamationIcon, BellIcon,
  EnvelopeIcon, ArchiveBoxIcon
} from '@heroicons/react/24/outline';

// Professional interfaces matching comprehensive schema
interface Supplier {
  id: string;
  supplierName: string;
  supplierCode: string;
  contactPerson?: string;
  emailAddress: string;
  phoneNumber?: string;
  isLocalGlassSupplier: boolean;
  isApprovedSupplier: boolean;
  performanceRating: number;
  totalOrdersCount: number;
}

interface PurchaseOrderLineItem {
  id: string;
  productName: string;
  productSku: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitPrice: number;
  subtotal: number;
  customModuleFlag: boolean;
}

interface PurchaseOrder {
  id: string;
  purchaseOrderNumber: string;
  supplier: Supplier;
  customerId?: string;
  customerName?: string;
  customerReference?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT_TO_SUPPLIER' | 'SUPPLIER_CONFIRMED' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED' | 'INVOICED' | 'COMPLETED' | 'CANCELLED';
  priorityLevel: 'NORMAL' | 'HIGH' | 'URGENT';
  totalAmount: number;
  expectedDeliveryDate?: Date;
  approvalRequired: boolean;
  approvedBy?: string;
  supplierConfirmedDate?: Date;
  invoiceRequired: boolean;
  invoiceCreated: boolean;
  dispatchBlocked: boolean;
  lineItems: PurchaseOrderLineItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Professional status configuration - clean, no emojis
const statusConfig = {
  DRAFT: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
  PENDING_APPROVAL: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Approval' },
  APPROVED: { color: 'bg-green-100 text-green-800', label: 'Approved' },
  SENT_TO_SUPPLIER: { color: 'bg-blue-100 text-blue-800', label: 'Sent to Supplier' },
  CONFIRMATION_PENDING: { color: 'bg-blue-100 text-blue-800', label: 'Confirmation Pending' },
  CONFIRMATION_OVERDUE: { color: 'bg-red-100 text-red-800', label: 'Confirmation Overdue' },
  SUPPLIER_CONFIRMED: { color: 'bg-indigo-100 text-indigo-800', label: 'Supplier Confirmed' },
  PARTIALLY_RECEIVED: { color: 'bg-orange-100 text-orange-800', label: 'Partially Received' },
  FULLY_RECEIVED: { color: 'bg-green-100 text-green-800', label: 'Fully Received' },
  INVOICED: { color: 'bg-purple-100 text-purple-800', label: 'Invoiced' },
  COMPLETED: { color: 'bg-green-100 text-green-800', label: 'Completed' },
  CANCELLED: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
};

const priorityConfig = {
  NORMAL: { color: 'bg-green-100 text-green-800', label: 'Normal' },
  HIGH: { color: 'bg-yellow-100 text-yellow-800', label: 'High' },
  URGENT: { color: 'bg-red-100 text-red-800', label: 'Urgent' }
};

export function PurchaseOrders() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Professional filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal states for advanced features
  const [showApprovalWorkflow, setShowApprovalWorkflow] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showGoodsReceipt, setShowGoodsReceipt] = useState(false);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showEmailDashboard, setShowEmailDashboard] = useState(false);
  const [showAttachmentBundle, setShowAttachmentBundle] = useState(false);
  const [showTimeoutDashboard, setShowTimeoutDashboard] = useState(false);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<PurchaseOrder | null>(null);
  const [ruleViolations, setRuleViolations] = useState<{[orderId: string]: any[]}>({});
  const [userPermissions, setUserPermissions] = useState<any>(null);
  const [realtimeMessages, setRealtimeMessages] = useState<WebSocketMessage[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // WebSocket integration for real-time updates
  const { 
    connectionStatus, 
    messages, 
    sendMessage,
    service: wsService 
  } = usePurchaseOrderWebSocket({
    autoConnect: true,
    filter: {
      eventTypes: [
        'PURCHASE_ORDER_CREATED',
        'PURCHASE_ORDER_UPDATED', 
        'STATUS_CHANGED',
        'APPROVAL_REQUIRED',
        'SUPPLIER_CONFIRMED',
        'GOODS_RECEIVED',
        'INVOICE_CREATED',
        'URGENT_ALERT'
      ]
    },
    onMessage: (message: WebSocketMessage) => {
      handleRealtimeMessage(message);
    },
    onConnectionChange: (connected: boolean) => {
      if (connected) {
        console.log('Real-time updates connected');
        // Refresh data when reconnected
        loadPurchaseOrders();
      } else {
        console.warn('Real-time updates disconnected');
      }
    }
  });

  useEffect(() => {
    loadPurchaseOrders();
    loadUserPermissions();
    initializeTimeoutMonitoring();
  }, []);

  const initializeTimeoutMonitoring = () => {
    // Initialize supplier timeout monitoring
    const timeoutService = SupplierTimeoutMonitoringService.getInstance();
    console.log('Supplier timeout monitoring initialized');
  };

  useEffect(() => {
    applyFilters();
  }, [purchaseOrders, searchTerm, selectedStatus, selectedPriority, startDate, endDate]);

  const loadPurchaseOrders = () => {
    // Load from localStorage or create professional sample data
    const savedOrders = localStorage.getItem('saleskik-purchase-orders');
    if (savedOrders) {
      try {
        const parsedOrders = JSON.parse(savedOrders);
        const ordersWithDates = parsedOrders.map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
          expectedDeliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate) : undefined,
          supplierConfirmedDate: order.supplierConfirmedDate ? new Date(order.supplierConfirmedDate) : undefined
        }));
        setPurchaseOrders(ordersWithDates);
      } catch (error) {
        console.error('Error parsing saved purchase orders:', error);
        createProfessionalSampleData();
      }
    } else {
      createProfessionalSampleData();
    }
    setLoading(false);
  };

  const createProfessionalSampleData = () => {
    const professionalOrders: PurchaseOrder[] = [
      {
        id: '1',
        purchaseOrderNumber: 'PO-2024-001',
        supplier: {
          id: '1',
          supplierName: 'Premium Glass Solutions',
          supplierCode: 'PGS001',
          contactPerson: 'Sarah Mitchell',
          emailAddress: 'orders@premiumglass.com.au',
          phoneNumber: '+61 3 9876 5432',
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
        approvalRequired: true,
        approvedBy: 'user-admin',
        supplierConfirmedDate: new Date('2024-01-13'),
        invoiceRequired: true,
        invoiceCreated: false,
        dispatchBlocked: true,
        lineItems: [
          {
            id: '1',
            productName: '12mm Clear Toughened Glass',
            productSku: '12F-CLEAR-T',
            quantityOrdered: 15,
            quantityReceived: 0,
            unitPrice: 850.00,
            subtotal: 12750.00,
            customModuleFlag: true
          }
        ],
        createdAt: new Date('2024-01-11'),
        updatedAt: new Date('2024-01-13')
      },
      {
        id: '2',
        purchaseOrderNumber: 'PO-2024-002',
        supplier: {
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
            id: '2',
            productName: 'Aluminum Channel 50x25',
            productSku: 'ALU-CH-50x25',
            quantityOrdered: 100,
            quantityReceived: 0,
            unitPrice: 45.50,
            subtotal: 4550.00,
            customModuleFlag: false
          }
        ],
        createdAt: new Date('2024-01-14'),
        updatedAt: new Date('2024-01-14')
      }
    ];

    setPurchaseOrders(professionalOrders);
    localStorage.setItem('saleskik-purchase-orders', JSON.stringify(professionalOrders));
  };

  const applyFilters = () => {
    let filtered = [...purchaseOrders];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.purchaseOrderNumber.toLowerCase().includes(searchLower) ||
        order.supplier.supplierName.toLowerCase().includes(searchLower) ||
        (order.customerName && order.customerName.toLowerCase().includes(searchLower)) ||
        (order.customerReference && order.customerReference.toLowerCase().includes(searchLower))
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    if (selectedPriority) {
      filtered = filtered.filter(order => order.priorityLevel === selectedPriority);
    }

    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(order => order.createdAt >= start);
    }

    if (endDate) {
      const end = new Date(endDate + 'T23:59:59');
      filtered = filtered.filter(order => order.createdAt <= end);
    }

    setFilteredOrders(filtered);
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
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

  const handleApprovalAction = (orderId: string, action: 'approve' | 'reject', comments: string) => {
    const order = purchaseOrders.find(o => o.id === orderId);
    if (!order) return;

    const newStatus = action === 'approve' ? 'APPROVED' : 'CANCELLED';
    
    // Update order status
    const updatedOrders = purchaseOrders.map(o => 
      o.id === orderId 
        ? { 
            ...o, 
            status: newStatus,
            approvedBy: action === 'approve' ? 'current-user' : undefined,
            approvalDate: action === 'approve' ? new Date() : undefined,
            approvalComments: comments
          }
        : o
    );
    setPurchaseOrders(updatedOrders);
    localStorage.setItem('saleskik-purchase-orders', JSON.stringify(updatedOrders));

    // Broadcast approval action to all users
    wsService?.sendMessage({
      type: 'APPROVAL_COMPLETED',
      purchaseOrderId: orderId,
      data: {
        purchaseOrderNumber: order.purchaseOrderNumber,
        action,
        approvedBy: userPermissions?.role || 'current-user',
        comments,
        newStatus
      },
      broadcast: true,
      priority: 'HIGH'
    });
  };

  const loadUserPermissions = () => {
    const permissionService = PurchaseOrderPermissionService.getInstance();
    const permissions = permissionService.getPermissionSummary();
    setUserPermissions(permissions);
  };

  const handleRuleViolation = (orderId: string, violations: any[]) => {
    setRuleViolations(prev => ({ ...prev, [orderId]: violations }));
  };

  const handleRealtimeMessage = (message: WebSocketMessage) => {
    setRealtimeMessages(prev => [...prev, message].slice(-20)); // Keep last 20 messages
    setUnreadNotifications(prev => prev + 1); // Increment unread count
    
    switch (message.type) {
      case 'PURCHASE_ORDER_CREATED':
      case 'PURCHASE_ORDER_UPDATED':
      case 'STATUS_CHANGED':
        // Refresh orders when any order changes
        loadPurchaseOrders();
        break;
      case 'APPROVAL_REQUIRED':
        // Show notification for approval requests
        if (userPermissions?.canApprove) {
          showRealtimeNotification('Approval Required', 
            `${message.data.purchaseOrderNumber} requires your approval`, 'warning');
        }
        break;
      case 'SUPPLIER_CONFIRMED':
        loadPurchaseOrders();
        showRealtimeNotification('Supplier Confirmed', 
          `${message.data.supplierName} confirmed ${message.data.purchaseOrderNumber}`, 'success');
        break;
      case 'GOODS_RECEIVED':
        loadPurchaseOrders();
        showRealtimeNotification('Goods Received', 
          `${message.data.purchaseOrderNumber} ${message.data.receiptType.toLowerCase()} receipt processed`, 'info');
        break;
      case 'INVOICE_CREATED':
        loadPurchaseOrders();
        showRealtimeNotification('Invoice Created', 
          `${message.data.purchaseOrderNumber} invoice created - dispatch unblocked`, 'success');
        break;
      case 'URGENT_ALERT':
        showRealtimeNotification('URGENT ALERT', message.data.message, 'error');
        break;
    }
  };

  const showRealtimeNotification = (title: string, message: string, type: 'success' | 'warning' | 'error' | 'info') => {
    // Create toast notification
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border max-w-sm transform transition-all duration-300 ${
      type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
      type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
      type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
      'bg-blue-50 border-blue-200 text-blue-800'
    }`;
    
    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-1">
          <div class="font-medium">${title}</div>
          <div class="text-sm mt-1">${message}</div>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  };

  const handleOrderAction = async (action: string, order: PurchaseOrder) => {
    const stateMachine = PurchaseOrderStateMachine.getInstance();
    const permissionService = PurchaseOrderPermissionService.getInstance();
    
    // Check permissions
    const permissionResult = permissionService.canPerformAction(action, order);
    if (!permissionResult.allowed) {
      alert(`Permission denied: ${permissionResult.reason}`);
      return;
    }

    setSelectedOrderForAction(order);

    switch (action) {
      case 'send_to_supplier':
        const sendResult = await stateMachine.sendToSupplier(order.id, userPermissions.role);
        if (sendResult.success) {
          // Broadcast status change to all users
          wsService?.notifyStatusChange(order, order.status, 'SENT_TO_SUPPLIER', userPermissions.role);
          alert('Order sent to supplier successfully');
          loadPurchaseOrders();
        } else {
          alert(`Error: ${sendResult.message}`);
        }
        break;
      case 'confirm_receipt':
        setShowGoodsReceipt(true);
        break;
      case 'create_invoice':
        // Invoice matching system temporarily disabled
        alert('Invoice matching system is temporarily disabled during development.');
        break;
      case 'approve':
        setShowApprovalWorkflow(true);
        break;
      case 'manage_attachments':
        setShowAttachmentBundle(true);
        break;
    }
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
        subtitle="Professional procurement management system"
        onMenuToggle={() => setShowSidebar(true)}
      />

      <div className="p-6 max-w-none mx-auto">
        
        {/* Professional Header Stats */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            
            {/* Executive Summary Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{filteredOrders.length}</div>
                <div className="text-sm text-gray-600">Active Orders</div>
                <div className="text-xs text-gray-500 mt-1">
                  ${filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString('en-AU')} total value
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {filteredOrders.filter(o => o.priorityLevel === 'URGENT').length}
                </div>
                <div className="text-sm text-gray-600">Urgent Orders</div>
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

            {/* Real-Time Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                connectionStatus.connected 
                  ? 'bg-green-100 text-green-800' 
                  : connectionStatus.reconnecting 
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus.connected ? 'bg-green-500' :
                  connectionStatus.reconnecting ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500'
                }`} />
                <span className="font-medium">
                  {connectionStatus.connected ? 'Live Updates' :
                   connectionStatus.reconnecting ? 'Reconnecting...' :
                   'Offline Mode'}
                </span>
              </div>
              {connectionStatus.queuedMessages > 0 && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                  {connectionStatus.queuedMessages} queued
                </span>
              )}
            </div>

            {/* Professional Action Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowApprovalWorkflow(true)}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 font-medium transition-colors"
              >
                <ClockIcon className="w-4 h-4" />
                Approvals ({filteredOrders.filter(o => o.status === 'PENDING_APPROVAL').length})
              </button>
              <button
                onClick={() => setShowAnalytics(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium transition-colors"
              >
                <ChartBarIcon className="w-4 h-4" />
                Analytics
              </button>
              <button
                onClick={() => setShowTimeoutDashboard(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-medium transition-colors"
              >
                <ClockIcon className="w-4 h-4" />
                Timeouts ({filteredOrders.filter(o => o.status === 'CONFIRMATION_OVERDUE').length})
              </button>
              <button
                onClick={() => setShowEmailDashboard(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-medium transition-colors"
              >
                <EnvelopeIcon className="w-4 h-4" />
                Email Center
              </button>
              <button
                onClick={() => {
                  setShowNotificationCenter(true);
                  setUnreadNotifications(0); // Mark as read when opened
                }}
                className="relative flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium transition-colors"
              >
                <BellIcon className="w-4 h-4" />
                Notifications
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>
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

        {/* Professional Filtering Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              
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

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                  <option value="APPROVED">Approved</option>
                  <option value="SENT_TO_SUPPLIER">Sent to Supplier</option>
                  <option value="CONFIRMATION_PENDING">Confirmation Pending</option>
                  <option value="CONFIRMATION_OVERDUE">Confirmation Overdue</option>
                  <option value="SUPPLIER_CONFIRMED">Supplier Confirmed</option>
                  <option value="INVOICED">Invoiced</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Priorities</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Professional Purchase Orders Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading purchase orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardDocumentCheckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {purchaseOrders.length === 0 ? 'No Purchase Orders Yet' : 'No Orders Match Your Filters'}
              </h3>
              <p className="text-gray-600 mb-6">
                {purchaseOrders.length === 0 
                  ? 'Create your first purchase order to streamline supplier procurement.'
                  : 'Try adjusting your search criteria or filters.'
                }
              </p>
              <button
                onClick={() => navigate('/inventory/purchase-orders/new')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                Create Purchase Order
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <tr>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-600 uppercase tracking-wider">
                      Purchase Order
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-600 uppercase tracking-wider">
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
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <div className="font-bold text-gray-900">{order.purchaseOrderNumber}</div>
                          <div className="text-sm text-gray-600">
                            {order.lineItems.length} item{order.lineItems.length !== 1 ? 's' : ''}
                            {order.lineItems.some(item => item.customModuleFlag) && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                                Custom Glass
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {order.createdAt.toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <div className="font-medium text-gray-900">{order.supplier.supplierName}</div>
                          <div className="text-sm text-gray-600">{order.supplier.supplierCode}</div>
                          {order.supplier.isLocalGlassSupplier && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-medium mt-1 w-fit">
                              Glass Specialist
                            </span>
                          )}
                          <div className="flex items-center gap-1 mt-1">
                            <StarIcon className="w-3 h-3 text-yellow-500 fill-current" />
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
                            <div className="text-sm text-gray-500 italic">Stock Replenishment</div>
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
                        <div className="flex items-center gap-1">
                          <button 
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          
                          {/* Status-specific actions */}
                          {order.status === 'APPROVED' && userPermissions?.canApproveOrders && (
                            <button 
                              onClick={() => handleOrderAction('send_to_supplier', order)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Send to Supplier"
                            >
                              <TruckIcon className="w-4 h-4" />
                            </button>
                          )}
                          
                          {['SUPPLIER_CONFIRMED', 'PARTIALLY_RECEIVED'].includes(order.status) && (
                            <button 
                              onClick={() => handleOrderAction('confirm_receipt', order)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Confirm Receipt"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                          )}
                          
                          {order.status === 'FULLY_RECEIVED' && order.invoiceRequired && !order.invoiceCreated && (
                            <button 
                              onClick={() => handleOrderAction('create_invoice', order)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Create Invoice"
                            >
                              <BanknotesIcon className="w-4 h-4" />
                            </button>
                          )}
                          
                          {order.status === 'PENDING_APPROVAL' && userPermissions?.canApproveOrders && (
                            <button 
                              onClick={() => handleOrderAction('approve', order)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Approve Order"
                            >
                              <ClockIcon className="w-4 h-4" />
                            </button>
                          )}
                          
                          {['DRAFT', 'PENDING_APPROVAL'].includes(order.status) && (
                            <button 
                              className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Edit Order"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          )}
                          
                          {/* Attachment Bundle Management */}
                          <button 
                            onClick={() => handleOrderAction('manage_attachments', order)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Manage Attachments"
                          >
                            <ArchiveBoxIcon className="w-4 h-4" />
                          </button>

                          {order.status === 'DRAFT' && (
                            <button 
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Draft"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
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

        {/* Business Rule Engine Integration */}
        <BusinessRuleEngine 
          purchaseOrders={purchaseOrders}
          onRuleViolation={handleRuleViolation}
        />

        {/* System Status Components */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <EmailNotificationStatus purchaseOrderId="dashboard" />
          {userPermissions && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-2">Your Permissions</h5>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Role: <span className="font-medium">{userPermissions.role}</span></div>
                {userPermissions.maxOrderValue && (
                  <div>Max Order: <span className="font-medium">${userPermissions.maxOrderValue.toLocaleString()}</span></div>
                )}
                <div className="flex gap-2 mt-2">
                  {userPermissions.canCreate && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Create</span>
                  )}
                  {userPermissions.canApprove && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Approve</span>
                  )}
                  {userPermissions.canViewAnalytics && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">Analytics</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Advanced Feature Modals */}
      <ApprovalWorkflowEngine
        isOpen={showApprovalWorkflow}
        onClose={() => {
          setShowApprovalWorkflow(false);
          setSelectedOrderForAction(null);
        }}
        onApprovalAction={handleApprovalAction}
      />

      <PurchaseOrderAnalytics
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />

      <GoodsReceiptManager
        isOpen={showGoodsReceipt}
        onClose={() => {
          setShowGoodsReceipt(false);
          setSelectedOrderForAction(null);
        }}
        purchaseOrder={selectedOrderForAction}
        onReceiptCompleted={(order) => {
          loadPurchaseOrders();
          setSelectedOrderForAction(null);
        }}
      />



      <RealtimeNotificationCenter
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
      />

      <EmailDeliveryDashboard
        isOpen={showEmailDashboard}
        onClose={() => setShowEmailDashboard(false)}
      />

      <AttachmentBundleManager
        isOpen={showAttachmentBundle}
        onClose={() => {
          setShowAttachmentBundle(false);
          setSelectedOrderForAction(null);
        }}
        purchaseOrderId={selectedOrderForAction?.id || ''}
      />

      <SupplierTimeoutDashboard
        isOpen={showTimeoutDashboard}
        onClose={() => setShowTimeoutDashboard(false)}
      />
    </div>
  );
}

export default PurchaseOrders;