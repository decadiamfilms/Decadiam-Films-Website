import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../layout/UniversalNavigation';
import UniversalHeader from '../layout/UniversalHeader';
import { CreateOrderModal } from './CreateOrderModal';
import ApprovalWorkflowEngine from './ApprovalWorkflowEngine';
import BusinessRuleEngine from './BusinessRuleEngine';
import PurchaseOrderAnalytics from './PurchaseOrderAnalytics';
import GoodsReceiptManager from './GoodsReceiptManager';
import RealtimeNotificationCenter from './RealtimeNotificationCenter';
import EmailDeliveryDashboard from './EmailDeliveryDashboard';
import AttachmentBundleManager from './AttachmentBundleManager';
import SupplierTimeoutDashboard from './SupplierTimeoutDashboard';
import { usePurchaseOrderWebSocket } from '../../services/PurchaseOrderWebSocketService';
import PurchaseOrderStateMachine from '../../services/PurchaseOrderStateMachine';
import { 
  PlusIcon, MagnifyingGlassIcon, XMarkIcon, ChevronDownIcon,
  FunnelIcon, EyeIcon, PencilIcon, TrashIcon, 
  ClockIcon, CheckCircleIcon, ExclamationTriangleIcon,
  BellIcon, ChartBarIcon, EnvelopeIcon, DocumentTextIcon,
  CogIcon, ShieldExclamationIcon, TruckIcon, ArchiveBoxIcon,
  ExclamationCircleIcon, InformationCircleIcon
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
}

interface Supplier {
  id: string;
  supplierName: string;
  supplierCode: string;
  emailAddress: string;
  isLocalGlassSupplier: boolean;
  performanceRating: number;
}

interface LineItem {
  id: string;
  productName: string;
  productSku: string;
  quantityOrdered: number;
  unitPrice: number;
  customModuleFlag: boolean;
}

export function PurchaseOrders() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  
  // Enterprise feature modals
  const [showApprovalWorkflow, setShowApprovalWorkflow] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showGoodsReceipt, setShowGoodsReceipt] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showEmailDashboard, setShowEmailDashboard] = useState(false);
  const [showAttachmentManager, setShowAttachmentManager] = useState(false);
  const [showTimeoutDashboard, setShowTimeoutDashboard] = useState(false);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<PurchaseOrder | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  
  const navigate = useNavigate();
  
  // WebSocket for real-time updates
  const { connectionStatus, messages } = usePurchaseOrderWebSocket();

  // Enhanced mock data following the user journey
  useEffect(() => {
    const mockOrders: PurchaseOrder[] = [
      {
        id: '1',
        poNumber: 'PO-2025-00147',
        customerName: 'Johnson Construction',
        customerReference: 'Site Office Glass',
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
        attachmentCount: 3
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
        attachmentCount: 1
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
        attachmentCount: 2
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
        attachmentCount: 5
      }
    ];
    
    setTimeout(() => {
      setOrders(mockOrders);
      setLoading(false);
    }, 500);
  }, []);
  
  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.type === 'status_update') {
        setUnreadNotifications(prev => prev + 1);
        // Update order status in real-time
        setOrders(prev => prev.map(order => 
          order.id === latestMessage.orderId 
            ? { ...order, status: latestMessage.newStatus }
            : order
        ));
      }
    }
  }, [messages]);

  // Handle creating new orders
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
      attachmentCount: orderData.attachmentCount
    };
    
    setOrders(prev => [newOrder, ...prev]);
    setUnreadNotifications(prev => prev + 1);
    
    // Show success notification
    alert(`Purchase Order ${newOrder.poNumber} created successfully! ${orderData.approvalRequired ? 'Sent for manager approval.' : 'Order approved and ready to send to supplier.'}`);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         (order.customerReference?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (order: PurchaseOrder) => {
    const { status, invoiceRequired, invoiceCreated, dispatchBlocked } = order;
    
    // Show warning for invoice required
    const hasWarning = invoiceRequired && !invoiceCreated && dispatchBlocked;
    
    switch (status) {
      case 'draft':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">📝 Draft</span>;
      case 'pending_approval':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">🟡 Pending Approval</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">✅ Approved</span>;
      case 'sent_to_supplier':
        return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">🟡 Awaiting Confirmation</span>;
      case 'supplier_confirmed':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">🟢 Supplier Confirmed</span>;
      case 'partially_received':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">📦 Partially Received</span>;
      case 'fully_received':
        return (
          <div className="flex items-center gap-1">
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">🟢 Received</span>
            {hasWarning && <span className="px-1 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full" title="Invoice Required">⚠️</span>}
          </div>
        );
      case 'invoiced':
        return <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">📄 Invoiced</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">🟢 Complete</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">🔴 Cancelled</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>;
    }
  };
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">🔴 Urgent</span>;
      case 'high':
        return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">🟠 High</span>;
      case 'normal':
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">⚪ Normal</span>;
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
        subtitle="Manage your purchase orders and track deliveries"
        onMenuToggle={() => setShowSidebar(true)}
      />

      <div className="p-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Purchase Orders</h2>
              <p className="text-gray-600 mt-1">{filteredOrders.length} orders total</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search orders..."
                  className="w-64 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showFilters 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FunnelIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowNewOrderModal(true)}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                New Order
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="RECEIVED">Received</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expected Delivery
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{order.poNumber}</div>
                            <div className="text-sm text-gray-500">{order.lineItemCount} items</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.supplierName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">${order.totalAmount.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.expectedDelivery}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="text-blue-600 hover:text-blue-900"
                              title="View"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              className="text-gray-600 hover:text-gray-900"
                              title="Edit"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <TrashIcon className="w-4 h-4" />
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
                  <p className="text-gray-600">No purchase orders found.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status === 'PENDING').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status === 'APPROVED').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Received</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status === 'RECEIVED').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <span className="text-2xl font-bold text-gray-600">$</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${orders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive New Order Modal */}
      <CreateOrderModal 
        isOpen={showNewOrderModal}
        onClose={() => setShowNewOrderModal(false)}
        onSubmit={handleCreateOrder}
      />
    </div>
  );
}

export default PurchaseOrders;