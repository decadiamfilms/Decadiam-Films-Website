import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../layout/UniversalNavigation';
import UniversalHeader from '../layout/UniversalHeader';
import { CreateOrderModal } from './CreateOrderModal';
import ApprovalWorkflowEngine from './ApprovalWorkflowEngine';
import PurchaseOrderAnalytics from './PurchaseOrderAnalytics';
import RealtimeNotificationCenter from './RealtimeNotificationCenter';
import { usePurchaseOrderWebSocket } from '../../services/PurchaseOrderWebSocketService';
import {
  PlusIcon, MagnifyingGlassIcon, XMarkIcon, ChevronDownIcon,
  FunnelIcon, EyeIcon, PencilIcon, ClockIcon, CheckCircleIcon,
  ExclamationTriangleIcon, BellIcon, ChartBarIcon, DocumentTextIcon,
  ShoppingCartIcon, TruckIcon, CubeIcon, BuildingOfficeIcon,
  ArrowTrendingUpIcon, ArrowTrendingDownIcon, FireIcon,
  InformationCircleIcon, CogIcon
} from '@heroicons/react/24/outline';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  customerName?: string;
  customerReference?: string;
  supplierName: string;
  totalAmount: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent_to_supplier' | 'supplier_confirmed' | 'partially_received' | 'fully_received' | 'invoiced' | 'completed' | 'cancelled';
  priority: 'normal' | 'high' | 'urgent';
  orderDate: string;
  expectedDelivery: string;
  lineItemCount: number;
  invoiceRequired: boolean;
  invoiceCreated: boolean;
  dispatchBlocked: boolean;
  approvalRequired: boolean;
  createdBy: string;
  attachmentCount: number;
  notes?: string;
  supplierConfirmedDate?: string;
  lastActivity?: string;
  orderSummary?: string;
}

interface ActivityFeedItem {
  id: string;
  type: 'order_created' | 'supplier_confirmed' | 'approved' | 'goods_received' | 'invoice_created';
  poNumber: string;
  message: string;
  timestamp: string;
  user: string;
}

export function PurchaseOrdersDashboard() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showApprovalWorkflow, setShowApprovalWorkflow] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<PurchaseOrder | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  
  const navigate = useNavigate();
  const { connectionStatus, messages } = usePurchaseOrderWebSocket();

  useEffect(() => {
    const mockOrders: PurchaseOrder[] = [
      {
        id: '1',
        poNumber: 'PO-2025-00147',
        customerName: 'Johnson Construction',
        customerReference: 'Site Office Glass Project',
        supplierName: 'Sydney Glass Co',
        totalAmount: 2565.00,
        status: 'supplier_confirmed',
        priority: 'high',
        orderDate: '2025-09-14',
        expectedDelivery: '2025-09-19',
        lineItemCount: 2,
        invoiceRequired: true,
        invoiceCreated: false,
        dispatchBlocked: true,
        approvalRequired: true,
        createdBy: 'Sarah Peterson',
        attachmentCount: 3,
        orderSummary: '5x10mm Tempered Glass Panels, 3x12mm Tempered Glass',
        notes: 'Handle with extra care - customer installation',
        supplierConfirmedDate: '2025-09-14T15:45:00',
        lastActivity: '2 hours ago'
      },
      {
        id: '2',
        poNumber: 'PO-2025-00148',
        customerName: 'Metro Building Corp',
        customerReference: 'Tower Project - Floor 15',
        supplierName: 'Hardware Direct',
        totalAmount: 1250.00,
        status: 'pending_approval',
        priority: 'normal',
        orderDate: '2025-09-14',
        expectedDelivery: '2025-09-22',
        lineItemCount: 4,
        invoiceRequired: true,
        invoiceCreated: false,
        dispatchBlocked: true,
        approvalRequired: true,
        createdBy: 'Mike Johnson',
        attachmentCount: 1,
        orderSummary: '20x Steel Brackets, 15x Aluminum Posts, Safety Equipment',
        lastActivity: '1 hour ago'
      },
      {
        id: '3',
        poNumber: 'PO-2025-00149',
        customerName: 'Residential Homes Ltd',
        supplierName: 'Steel Works Ltd.',
        totalAmount: 850.00,
        status: 'completed',
        priority: 'normal',
        orderDate: '2025-09-10',
        expectedDelivery: '2025-09-15',
        lineItemCount: 6,
        invoiceRequired: true,
        invoiceCreated: true,
        dispatchBlocked: false,
        approvalRequired: false,
        createdBy: 'David Wilson',
        attachmentCount: 2,
        orderSummary: '10x Standard Pipes, 25x Fittings, Installation Hardware',
        lastActivity: '1 day ago'
      },
      {
        id: '4',
        poNumber: 'PO-2025-00146',
        customerName: 'City Plaza Development',
        customerReference: 'Lobby Renovation',
        supplierName: 'Premium Glass Solutions',
        totalAmount: 4200.00,
        status: 'invoiced',
        priority: 'urgent',
        orderDate: '2025-09-12',
        expectedDelivery: '2025-09-17',
        lineItemCount: 8,
        invoiceRequired: true,
        invoiceCreated: true,
        dispatchBlocked: false,
        approvalRequired: true,
        createdBy: 'Sarah Peterson',
        attachmentCount: 5,
        orderSummary: '8x Custom Glass Panels, Installation Framework',
        lastActivity: '3 hours ago'
      },
      {
        id: '5',
        poNumber: 'PO-2025-00145',
        customerName: 'Tech Solutions Inc',
        supplierName: 'Office Supplies Direct',
        totalAmount: 320.00,
        status: 'fully_received',
        priority: 'urgent',
        orderDate: '2025-09-13',
        expectedDelivery: '2025-09-16',
        lineItemCount: 12,
        invoiceRequired: true,
        invoiceCreated: false,
        dispatchBlocked: true,
        approvalRequired: false,
        createdBy: 'Emma Thompson',
        attachmentCount: 1,
        orderSummary: '50x Office Chairs, 12x Desk Accessories',
        lastActivity: '30 minutes ago'
      }
    ];
    
    setTimeout(() => {
      setOrders(mockOrders);
      setLoading(false);
    }, 300);

    setActivityFeed([
      {
        id: '1',
        type: 'supplier_confirmed',
        poNumber: 'PO-2025-00147',
        message: 'Sydney Glass Co confirmed order with Thursday delivery',
        timestamp: '2 hours ago',
        user: 'System'
      },
      {
        id: '2',
        type: 'order_created',
        poNumber: 'PO-2025-00148',
        message: 'New order created for Metro Building Corp',
        timestamp: '1 hour ago',
        user: 'Mike Johnson'
      },
      {
        id: '3',
        type: 'goods_received',
        poNumber: 'PO-2025-00145',
        message: 'All items received and verified at warehouse',
        timestamp: '30 minutes ago',
        user: 'Dave (Warehouse)'
      }
    ]);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.type === 'status_update') {
        setUnreadNotifications(prev => prev + 1);
        setOrders(prev => prev.map(order => 
          order.id === latestMessage.orderId 
            ? { ...order, status: latestMessage.newStatus as any }
            : order
        ));
      }
    }
  }, [messages]);

  const handleCreateOrder = (orderData: any) => {
    const newOrder: PurchaseOrder = {
      id: Date.now().toString(),
      poNumber: orderData.poNumber,
      customerName: orderData.customer?.customerName,
      customerReference: orderData.customerReference || orderData.customer?.customerReference,
      supplierName: orderData.supplier?.supplierName || 'To be assigned',
      totalAmount: orderData.totalAmount,
      status: orderData.status,
      priority: orderData.priority,
      orderDate: orderData.orderDate,
      expectedDelivery: orderData.expectedDelivery,
      lineItemCount: orderData.lineItemCount,
      invoiceRequired: orderData.invoiceRequired,
      invoiceCreated: orderData.invoiceCreated,
      dispatchBlocked: orderData.dispatchBlocked,
      approvalRequired: orderData.approvalRequired,
      createdBy: orderData.createdBy,
      attachmentCount: orderData.attachmentCount,
      orderSummary: generateOrderSummary(orderData.lineItems),
      lastActivity: 'Just now'
    };
    
    setOrders(prev => [newOrder, ...prev]);
    setUnreadNotifications(prev => prev + 1);
    
    const newActivity: ActivityFeedItem = {
      id: Date.now().toString(),
      type: 'order_created',
      poNumber: newOrder.poNumber,
      message: `New ${orderData.priority === 'urgent' ? 'URGENT ' : ''}order created for ${newOrder.customerName}`,
      timestamp: 'Just now',
      user: orderData.createdBy
    };
    setActivityFeed(prev => [newActivity, ...prev.slice(0, 9)]);
  };

  const generateOrderSummary = (lineItems: any[]) => {
    if (!lineItems || lineItems.length === 0) return '';
    return lineItems.map(item => `${item.quantityOrdered}x${item.productName}`).join(', ');
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         (order.customerReference?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         (order.orderSummary?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
    if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
    return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
  });

  const getStatusBadge = (order: PurchaseOrder) => {
    const { status, invoiceRequired, invoiceCreated, dispatchBlocked } = order;
    const hasWarning = invoiceRequired && !invoiceCreated && dispatchBlocked;
    
    switch (status) {
      case 'draft':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Draft</span>;
      case 'pending_approval':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending Approval</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Approved</span>;
      case 'sent_to_supplier':
        return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">Awaiting Confirmation</span>;
      case 'supplier_confirmed':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Confirmed</span>;
      case 'partially_received':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Partial</span>;
      case 'fully_received':
        return (
          <div className="flex items-center gap-1">
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Received</span>
            {hasWarning && <span className="px-1 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full" title="Invoice Required">!</span>}
          </div>
        );
      case 'invoiced':
        return <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">Invoiced</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Complete</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Cancelled</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>;
    }
  };
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return (
          <div className="flex items-center gap-1">
            <FireIcon className="w-3 h-3 text-red-500" />
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">URGENT</span>
          </div>
        );
      case 'high':
        return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">HIGH</span>;
      case 'normal':
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Normal</span>;
    }
  };

  const urgentActions = orders.filter(o => 
    o.priority === 'urgent' || 
    o.status === 'pending_approval' ||
    (o.invoiceRequired && !o.invoiceCreated && o.status === 'fully_received')
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="inventory" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="Purchase Orders"
        subtitle="Central command center for all procurement activities"
        onMenuToggle={() => setShowSidebar(true)}
      />

      <div className="flex">
        <div className="flex-1 p-6 pr-0">
          {/* Executive Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Purchase Orders Dashboard</h1>
                <p className="text-gray-600 mt-1">Complete operational visibility and streamlined workflows</p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  connectionStatus.connected 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus.connected 
                      ? 'bg-green-500 animate-pulse'
                      : 'bg-red-500'
                  }`} />
                  <span className="font-medium">{connectionStatus.connected ? 'Live' : 'Offline'}</span>
                </div>
                <button
                  onClick={() => setShowNotificationCenter(true)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Notifications"
                >
                  <BellIcon className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setShowNewOrderModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create New Order
                </button>
              </div>
            </div>
          </div>

          {/* Simplified KPI Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Active</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{orders.length}</p>
                  <div className="flex items-center mt-2 text-xs">
                    <ArrowTrendingUpIcon className="w-3 h-3 text-green-600 mr-1" />
                    <span className="text-green-600 font-medium">+12%</span>
                  </div>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingCartIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending Approval</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{orders.filter(o => o.status === 'pending_approval').length}</p>
                  <div className="flex items-center mt-2 text-xs">
                    <ArrowTrendingDownIcon className="w-3 h-3 text-green-600 mr-1" />
                    <span className="text-green-600 font-medium">-8%</span>
                  </div>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Confirmed</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{orders.filter(o => o.status === 'supplier_confirmed').length}</p>
                  <div className="flex items-center mt-2 text-xs">
                    <ArrowTrendingUpIcon className="w-3 h-3 text-green-600 mr-1" />
                    <span className="text-green-600 font-medium">+23%</span>
                  </div>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Urgent Items</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{orders.filter(o => o.priority === 'urgent').length}</p>
                  <div className="flex items-center mt-2 text-xs">
                    <span className="text-red-600 font-medium">+2 today</span>
                  </div>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Value</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">${orders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}</p>
                  <div className="flex items-center mt-3 text-sm">
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-green-600 font-medium">+15% this month</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <span className="text-2xl font-bold text-gray-600">$</span>
                </div>
              </div>
            </div>
          </div>

          {/* Clean Search & Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Primary Search */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search orders by PO#, customer, supplier..."
                    className="w-full px-6 py-3 pl-12 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <MagnifyingGlassIcon className="w-6 h-6 text-gray-400 absolute left-4 top-3.5" />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Filter Dropdown */}
              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending_approval">⏳ Pending Approval</option>
                  <option value="supplier_confirmed">✅ Confirmed</option>
                  <option value="fully_received">📦 Received</option>
                  <option value="completed">✔️ Completed</option>
                </select>
                
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">🔴 Urgent</option>
                  <option value="high">🟠 High</option>
                  <option value="normal">⚪ Normal</option>
                </select>
                
                {/* Actions Dropdown */}
                <div className="relative">
                  <select
                    onChange={(e) => {
                      const action = e.target.value;
                      if (action === 'analytics') setShowAnalytics(true);
                      if (action === 'approvals') setShowApprovalWorkflow(true);
                      e.target.value = ''; // Reset
                    }}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                  >
                    <option value="">Quick Actions</option>
                    <option value="analytics">📊 View Analytics</option>
                    <option value="approvals">⏳ Manage Approvals</option>
                    <option value="export">📤 Export Data</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Results Summary */}
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredOrders.length} of {orders.length} orders
              {(statusFilter !== 'all' || priorityFilter !== 'all' || searchTerm) && (
                <button
                  onClick={() => {setSearchTerm(''); setStatusFilter('all'); setPriorityFilter('all');}}
                  className="ml-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Main Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading purchase orders...</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO# & Created</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Summary</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedOrders.map((order) => (
                        <tr 
                          key={order.id} 
                          className={`hover:bg-gray-50 transition-colors ${
                            order.priority === 'urgent' ? 'bg-red-50 border-l-4 border-l-red-400' : 
                            order.priority === 'high' ? 'bg-orange-50 border-l-4 border-l-orange-400' : ''
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(order)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <button
                                onClick={() => setSelectedOrderForAction(order)}
                                className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                              >
                                {order.poNumber}
                              </button>
                              <div className="text-xs text-gray-500 mt-1">
                                by {order.createdBy} • {order.orderDate}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">{order.customerName || 'N/A'}</div>
                              {order.customerReference && (
                                <div className="text-sm text-gray-600">{order.customerReference}</div>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                Delivery: {order.expectedDelivery}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">${order.totalAmount.toLocaleString()}</div>
                              <div className="text-sm text-gray-600">{order.lineItemCount} items</div>
                              <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={order.orderSummary}>
                                {order.orderSummary}
                              </div>
                              {order.attachmentCount > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                  <DocumentTextIcon className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">{order.attachmentCount} files</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{order.supplierName}</div>
                            <div className="text-xs text-gray-500">{order.lastActivity}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getPriorityBadge(order.priority)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {order.invoiceRequired ? (
                              order.invoiceCreated ? (
                                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Created</span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Required</span>
                              )
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setSelectedOrderForAction(order)}
                                className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                                title="View Details"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {filteredOrders.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-gray-600">No purchase orders match your current filters.</p>
                    <button
                      onClick={() => {setSearchTerm(''); setStatusFilter('all'); setPriorityFilter('all');}}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 p-6 pl-0">
          <div className="sticky top-6 space-y-6">
            
            {/* Urgent Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-red-50 border-b border-red-100 px-4 py-3">
                <h3 className="font-semibold text-red-900 flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  Urgent Actions ({urgentActions.length})
                </h3>
              </div>
              <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                {urgentActions.slice(0, 5).map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{order.poNumber}</span>
                      {order.priority === 'urgent' && <FireIcon className="w-4 h-4 text-red-500" />}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {order.status === 'pending_approval' ? 'Awaiting approval' :
                       order.invoiceRequired && !order.invoiceCreated ? 'Invoice required for dispatch' :
                       order.priority === 'urgent' ? 'Urgent priority order' : 'Needs attention'}
                    </p>
                    <div className="flex gap-1">
                      {order.status === 'pending_approval' && (
                        <button
                          onClick={() => setShowApprovalWorkflow(true)}
                          className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded hover:bg-orange-200"
                        >
                          Approve
                        </button>
                      )}
                      <button className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200">
                        View
                      </button>
                    </div>
                  </div>
                ))}
                {urgentActions.length === 0 && (
                  <div className="text-center py-6">
                    <CheckCircleIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No urgent actions required!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200 px-4 py-3">
                <h3 className="font-semibold text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                {activityFeed.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex-shrink-0">
                      {activity.type === 'supplier_confirmed' && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                      {activity.type === 'order_created' && <PlusIcon className="w-5 h-5 text-blue-500" />}
                      {activity.type === 'goods_received' && <CubeIcon className="w-5 h-5 text-purple-500" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-blue-600 font-medium">{activity.poNumber}</span>
                        <span className="text-xs text-gray-500">• {activity.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Today's Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Orders Created</span>
                  <span className="text-sm font-semibold text-gray-900">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Response Time</span>
                  <span className="text-sm font-semibold text-gray-900">2.4h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="text-sm font-semibold text-green-600">94%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateOrderModal 
        isOpen={showNewOrderModal}
        onClose={() => setShowNewOrderModal(false)}
        onSubmit={handleCreateOrder}
      />

      <ApprovalWorkflowEngine
        isOpen={showApprovalWorkflow}
        onClose={() => setShowApprovalWorkflow(false)}
      />

      <PurchaseOrderAnalytics
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />

      <RealtimeNotificationCenter
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
      />

      {selectedOrderForAction && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedOrderForAction.poNumber}</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedOrderForAction.customerName}</p>
              </div>
              <button
                onClick={() => setSelectedOrderForAction(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Status:</strong> {selectedOrderForAction.status}</div>
                <div><strong>Priority:</strong> {selectedOrderForAction.priority}</div>
                <div><strong>Total Amount:</strong> ${selectedOrderForAction.totalAmount.toFixed(2)}</div>
                <div><strong>Line Items:</strong> {selectedOrderForAction.lineItemCount}</div>
                <div><strong>Supplier:</strong> {selectedOrderForAction.supplierName}</div>
                <div><strong>Expected Delivery:</strong> {selectedOrderForAction.expectedDelivery}</div>
                <div className="col-span-2"><strong>Order Summary:</strong> {selectedOrderForAction.orderSummary}</div>
                {selectedOrderForAction.notes && (
                  <div className="col-span-2"><strong>Notes:</strong> {selectedOrderForAction.notes}</div>
                )}
              </div>
            </div>
            
            <div className="border-t p-6">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedOrderForAction(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Edit Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PurchaseOrdersDashboard;