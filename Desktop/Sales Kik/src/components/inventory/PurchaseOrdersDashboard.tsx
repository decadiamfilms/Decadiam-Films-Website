import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../layout/UniversalNavigation';
import UniversalHeader from '../layout/UniversalHeader';
import ApprovalWorkflowEngine from './ApprovalWorkflowEngine';
import PurchaseOrderAnalytics from './PurchaseOrderAnalytics';
import RealtimeNotificationCenter from './RealtimeNotificationCenter';
import { CopyPurchaseOrderModal } from './CopyPurchaseOrderModal';
import { EmailPurchaseOrderModal } from './EmailPurchaseOrderModal';
import { SearchableSupplierDropdown } from '../common/SearchableSupplierDropdown';
import { SearchableCustomerDropdown } from '../common/SearchableCustomerDropdown';
import { PrintOptionsModal } from './PrintOptionsModal';
import { usePurchaseOrderWebSocket } from '../../services/PurchaseOrderWebSocketService';
import {
  PlusIcon, MagnifyingGlassIcon, XMarkIcon, ChevronDownIcon,
  FunnelIcon, EyeIcon, PencilIcon, ClockIcon, CheckCircleIcon,
  ExclamationTriangleIcon, BellIcon, ChartBarIcon, DocumentTextIcon,
  ShoppingCartIcon, ArrowTrendingUpIcon, FireIcon, CubeIcon, BookmarkIcon,
  TrashIcon, DocumentDuplicateIcon, EnvelopeIcon, PrinterIcon, LockClosedIcon, ArchiveBoxArrowDownIcon
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
  receivedItemCount?: number;
  invoiceRequired: boolean;
  invoiceCreated: boolean;
  dispatchBlocked: boolean;
  approvalRequired: boolean;
  createdBy: string;
  attachmentCount: number;
  notes?: string;
  lastActivity?: string;
  orderSummary?: string;
}

export function PurchaseOrdersDashboard() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [pinnedOrders, setPinnedOrders] = useState<Set<string>>(new Set());
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [showOnlyPinned, setShowOnlyPinned] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [poSearch, setPoSearch] = useState('');
  const [showApprovalWorkflow, setShowApprovalWorkflow] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<PurchaseOrder | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<PurchaseOrder | null>(null);
  const [orderToCopy, setOrderToCopy] = useState<PurchaseOrder | null>(null);
  const [orderToEmail, setOrderToEmail] = useState<PurchaseOrder | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [editingComments, setEditingComments] = useState<{[orderId: string]: string}>({});
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [urgentActions, setUrgentActions] = useState<any[]>([]);
  const [editingDueDate, setEditingDueDate] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<{canEditPurchaseOrders: boolean}>({canEditPurchaseOrders: false});
  
  const navigate = useNavigate();
  const { connectionStatus, messages } = usePurchaseOrderWebSocket();

  // Load user permissions
  useEffect(() => {
    const loadUserPermissions = () => {
      try {
        // Check if user is admin or has specific permissions
        const employeeSession = localStorage.getItem('employee-session');
        const accessToken = localStorage.getItem('accessToken');
        
        if (employeeSession) {
          const employee = JSON.parse(employeeSession);
          // Check employee role permissions
          const canEdit = employee.role === 'ADMIN' || employee.permissions?.includes('edit_purchase_orders');
          setUserPermissions({ canEditPurchaseOrders: canEdit });
        } else if (accessToken && !accessToken.startsWith('employee-token-')) {
          // Regular admin login - has all permissions
          setUserPermissions({ canEditPurchaseOrders: true });
        } else {
          // Default to no permissions
          setUserPermissions({ canEditPurchaseOrders: false });
        }
      } catch (error) {
        console.error('Error loading permissions:', error);
        setUserPermissions({ canEditPurchaseOrders: false });
      }
    };

    loadUserPermissions();
  }, []);

  useEffect(() => {
    // Load existing purchase orders from localStorage
    const loadOrdersFromStorage = () => {
      try {
        const savedOrders = localStorage.getItem('saleskik-purchase-orders');
        if (savedOrders) {
          const parsedOrders = JSON.parse(savedOrders);
          return parsedOrders;
        }
      } catch (error) {
        console.error('Error loading purchase orders from storage:', error);
      }
      return [];
    };

    const savedOrders = loadOrdersFromStorage();
    
    const mockOrders: PurchaseOrder[] = [
      {
        id: 'mock-1',
        poNumber: 'PO-2025-00351',
        customerName: 'Apex Constructions',
        customerReference: 'Warehouse Project - Phase 2',
        supplierName: 'Premier Steel & Supplies',
        totalAmount: 4750.00,
        status: 'sent_to_supplier',
        priority: 'urgent',
        orderDate: '2025-09-20',
        expectedDelivery: '2025-09-25',
        lineItemCount: 8,
        receivedItemCount: 0,
        invoiceRequired: true,
        invoiceCreated: false,
        dispatchBlocked: false,
        approvalRequired: false,
        createdBy: 'Emma Rodriguez',
        attachmentCount: 2,
        orderSummary: '12x Heavy Duty Steel Beams 6m, 50x Galvanized Bolts M16, 25x Welding Rods',
        notes: 'Urgent delivery required for construction deadline',
        lastActivity: '30 minutes ago'
      },
      {
        id: 'mock-2',
        poNumber: 'PO-2025-00352',
        customerName: 'Riverside Developments',
        customerReference: 'Unit 15B - Kitchen Renovation',
        supplierName: 'Kitchen Supplies Australia',
        totalAmount: 2890.00,
        status: 'draft',
        priority: 'normal',
        orderDate: '2025-09-21',
        expectedDelivery: '2025-09-28',
        lineItemCount: 5,
        receivedItemCount: 0,
        invoiceRequired: true,
        invoiceCreated: false,
        dispatchBlocked: true,
        approvalRequired: true,
        createdBy: 'James Mitchell',
        attachmentCount: 1,
        orderSummary: '1x Premium Kitchen Sink, 3x Cabinet Hardware Sets, 2x Countertop Brackets',
        notes: 'Customer wants specific finish - check samples before ordering',
        lastActivity: 'Just created'
      },
      {
        id: 'mock-3',
        poNumber: 'PO-2025-00353',
        customerName: 'City Council',
        customerReference: 'Park Maintenance - Q4',
        supplierName: 'Garden & Landscape Co',
        totalAmount: 1650.00,
        status: 'supplier_confirmed',
        priority: 'normal',
        orderDate: '2025-09-18',
        expectedDelivery: '2025-09-23',
        lineItemCount: 12,
        receivedItemCount: 7,
        invoiceRequired: true,
        invoiceCreated: false,
        dispatchBlocked: false,
        approvalRequired: false,
        createdBy: 'Sarah Chen',
        attachmentCount: 4,
        orderSummary: '200x Mulch Bags, 50x Native Plants, 15x Garden Tools, Irrigation Supplies',
        notes: 'Coordinate delivery with park maintenance schedule',
        lastActivity: '3 hours ago'
      },
      {
        id: 'mock-4',
        poNumber: 'PO-2025-00354',
        customerName: 'Industrial Solutions Ltd',
        supplierName: 'Electrical Components Direct',
        totalAmount: 3200.00,
        status: 'completed',
        priority: 'high',
        orderDate: '2025-09-15',
        expectedDelivery: '2025-09-20',
        lineItemCount: 15,
        receivedItemCount: 15,
        invoiceRequired: true,
        invoiceCreated: true,
        dispatchBlocked: false,
        approvalRequired: false,
        createdBy: 'Michael O\'Brien',
        attachmentCount: 3,
        orderSummary: '25x Industrial Switches, 100m Heavy Duty Cable, Safety Isolators, Junction Boxes',
        notes: 'All items delivered and invoiced - project complete',
        lastActivity: '2 days ago'
      },
      {
        id: 'mock-5',
        poNumber: 'PO-2025-00355',
        customerName: 'Coastal Builders',
        customerReference: 'Beachfront Villa - Stage 3',
        supplierName: 'Timber & Frames Australia',
        totalAmount: 5850.00,
        status: 'pending_approval',
        priority: 'high',
        orderDate: '2025-09-21',
        expectedDelivery: '2025-09-26',
        lineItemCount: 6,
        receivedItemCount: 0,
        invoiceRequired: true,
        invoiceCreated: false,
        dispatchBlocked: true,
        approvalRequired: true,
        createdBy: 'Lisa Thompson',
        attachmentCount: 5,
        orderSummary: '20x Treated Pine Beams 4m, 50x Structural Posts, Marine Grade Fixings',
        notes: 'Weather-resistant materials required for coastal environment',
        lastActivity: '1 hour ago'
      }
    ];
    
    // Load urgent actions from goods receipt
    const loadUrgentActions = () => {
      try {
        const savedActions = localStorage.getItem('saleskik-urgent-actions');
        if (savedActions) {
          const actions = JSON.parse(savedActions);
          setUrgentActions(actions.filter((action: any) => action.status === 'pending'));
        }
      } catch (error) {
        console.error('Error loading urgent actions:', error);
      }
    };

    setTimeout(() => {
      // Combine saved orders with mock orders
      const allOrders = [...savedOrders, ...mockOrders];
      setOrders(allOrders);
      loadUrgentActions();
      setLoading(false);
    }, 300);
  }, []);

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
      orderSummary: orderData.lineItems?.map((item: any) => `${item.quantityOrdered}x ${item.productName}`).join(', '),
      lastActivity: 'Just now'
    };
    
    setOrders(prev => [newOrder, ...prev]);
    setUnreadNotifications(prev => prev + 1);
  };

  const handleCopyComplete = (newOrder: any) => {
    setOrders(prev => [newOrder, ...prev]);
    setUnreadNotifications(prev => prev + 1);
    
    // Save to localStorage
    try {
      const existingOrders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
      existingOrders.push(newOrder);
      localStorage.setItem('saleskik-purchase-orders', JSON.stringify(existingOrders));
    } catch (error) {
      console.error('Error saving reorder to storage:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    // Individual search filters
    const matchesSupplier = !supplierSearch || order.supplierName?.toLowerCase().includes(supplierSearch.toLowerCase()) || false;
    const matchesCustomer = !customerSearch || order.customerName?.toLowerCase().includes(customerSearch.toLowerCase()) || false;
    const matchesPO = !poSearch || order.poNumber?.toLowerCase().includes(poSearch.toLowerCase()) || false;

    // Date filtering
    let matchesDateRange = true;
    if (dateFromFilter || dateToFilter) {
      const orderDate = new Date(order.orderDate);
      if (dateFromFilter) {
        const fromDate = new Date(dateFromFilter);
        matchesDateRange = matchesDateRange && orderDate >= fromDate;
      }
      if (dateToFilter) {
        const toDate = new Date(dateToFilter);
        toDate.setHours(23, 59, 59, 999); // Include the entire end date
        matchesDateRange = matchesDateRange && orderDate <= toDate;
      }
    }
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    const matchesPinned = !showOnlyPinned || pinnedOrders.has(order.id);
    
    return matchesSupplier && matchesCustomer && matchesPO && matchesStatus && matchesPriority && matchesPinned && matchesDateRange;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    // Pinned orders always go to top
    const aIsPinned = pinnedOrders.has(a.id);
    const bIsPinned = pinnedOrders.has(b.id);
    
    if (aIsPinned && !bIsPinned) return -1;
    if (bIsPinned && !aIsPinned) return 1;
    
    // Within pinned or unpinned groups, sort by urgency then date, then ID for stability
    if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
    if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
    
    const dateComparison = new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
    if (dateComparison !== 0) return dateComparison;
    
    // Fallback to ID for stable sorting
    return a.id.localeCompare(b.id);
  });

  const handlePrintTable = () => {
    // Create a print-friendly version of the current table
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const tableContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Purchase Orders - ${new Date().toLocaleDateString()}</title>
          <style>
            @page { size: landscape; margin: 0.5in; }
            @media print { body { -webkit-print-color-adjust: exact; } }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 15px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              font-size: 9px; 
              margin-top: 15px;
              table-layout: fixed;
            }
            th, td { 
              border: 1px solid #ccc; 
              padding: 3px; 
              text-align: left; 
              vertical-align: top;
              word-wrap: break-word;
              overflow: hidden;
            }
            th { 
              background-color: #f5f5f5; 
              font-weight: bold; 
              font-size: 8px;
            }
            .print-header { 
              margin-bottom: 10px; 
              border-bottom: 2px solid #333; 
              padding-bottom: 8px; 
            }
            .print-date { 
              color: #666; 
              font-size: 8px; 
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>Purchase Orders Report</h1>
            <div class="print-date">Generated: ${new Date().toLocaleString()}</div>
            <div class="print-date">Total Orders: ${filteredOrders.length}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Due Date</th>
                <th>Quantity</th>
                <th>Description</th>
                <th>Status</th>
                <th>Received</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders.map(order => {
                const receivedCount = order.receivedItemCount || 0;
                const totalCount = order.lineItemCount;
                const receivedFraction = `${receivedCount}/${totalCount}`;
                
                // Parse order summary with visual indicators for clarity
                const parseQuantitiesAndItems = (summary) => {
                  if (!summary) return { quantities: '', items: '' };
                  
                  const items = summary.split(',').map(item => item.trim());
                  const quantities = [];
                  const descriptions = [];
                  
                  items.forEach((item, index) => {
                    const match = item.match(/^(\d+)x\s*(.+)$/);
                    if (match) {
                      // Add bullet point and number for clarity
                      quantities.push('• ' + match[1]);
                      descriptions.push((index + 1) + '. ' + match[2].trim());
                    } else {
                      quantities.push('• 1');
                      descriptions.push((index + 1) + '. ' + item);
                    }
                  });
                  
                  return {
                    quantities: quantities.join('<br>'),
                    items: descriptions.join('<br>')
                  };
                };
                
                const { quantities, items } = parseQuantitiesAndItems(order.orderSummary);
                
                return `
                  <tr style="${pinnedOrders.has(order.id) ? 'background-color: #fef2f2;' : ''}">
                    <td>${order.poNumber}</td>
                    <td>${order.supplierName}</td>
                    <td>${order.customerName || 'N/A'}</td>
                    <td>${order.orderDate}</td>
                    <td>${order.expectedDelivery}</td>
                    <td style="text-align: center;">${quantities}</td>
                    <td>${items}</td>
                    <td>${order.status.replace('_', ' ')}</td>
                    <td>${receivedFraction}</td>
                    <td>$${(order.totalAmount || 0).toLocaleString()}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      printWindow.document.write(tableContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getStatusBadge = (order: PurchaseOrder) => {
    const { status } = order;
    
    switch (status) {
      case 'draft':
        return <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">Purchase Order</span>;
      case 'sent_to_supplier':
        return <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">Purchase Order Sent</span>;
      case 'supplier_confirmed':
        return <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">Purchase Order Accepted</span>;
      case 'viewed':
        return <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">Purchase Order Viewed</span>;
      case 'declined':
        return <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full">Purchase Order Declined</span>;
      case 'completed':
        return <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">Complete</span>;
      default:
        return <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">{status.replace('_', ' ')}</span>;
    }
  };

  const handleStatusEdit = (orderId: string) => {
    if (!userPermissions.canEditPurchaseOrders) {
      alert('You do not have permission to edit purchase order status. Contact your administrator.');
      return;
    }
    setEditingStatus(orderId);
  };

  const urgentCount = orders.filter(o => o.priority === 'urgent' || o.status === 'pending_approval').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="inventory" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="Purchase Orders"
        subtitle="Manage procurement activities and supplier relationships"
        onMenuToggle={() => setShowSidebar(true)}
      />

      <div className="p-8 max-w-full mx-auto">
        
        {/* Clean Header with KPIs */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
              <p className="text-lg text-gray-600 mt-2">Central procurement dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                connectionStatus.connected 
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`} />
                {connectionStatus.connected ? 'Live Updates' : 'Offline'}
              </div>
              
              <button
                onClick={() => setShowNotificationCenter(true)}
                className="relative p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <BellIcon className="w-6 h-6" />
                {(unreadNotifications + pinnedOrders.size) > 0 && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadNotifications + pinnedOrders.size}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setShowPrintModal(true)}
                className="flex items-center gap-3 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors shadow-sm"
              >
                <PrinterIcon className="w-5 h-5" />
                Print Table
              </button>
              <button
                onClick={() => navigate('/inventory/purchase-orders/new')}
                className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm text-lg"
              >
                <PlusIcon className="w-6 h-6" />
                Create New Order
              </button>
            </div>
          </div>

          {/* Interactive KPI Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {/* Total Live Orders */}
            <button
              onClick={() => {
                setStatusFilter('all');
                setShowOnlyPinned(false);
                setSearchTerm('');
              }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:scale-105 hover:border-blue-300 transition-all duration-200 text-left cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Live Orders</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ShoppingCartIcon className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </button>

            {/* Drafts */}
            <button
              onClick={() => {
                setStatusFilter('draft');
                setShowOnlyPinned(false);
                setSearchTerm('');
              }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:scale-105 hover:border-blue-300 transition-all duration-200 text-left cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Drafts</p>
                  <p className="text-3xl font-bold text-gray-600 mt-2">
                    {orders.filter(o => o.status === 'draft').length}
                  </p>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <DocumentTextIcon className="w-8 h-8 text-gray-600" />
                </div>
              </div>
            </button>

            {/* POs Not Emailed */}
            <button
              onClick={() => {
                setStatusFilter('pending_approval');
                setShowOnlyPinned(false);
                setSearchTerm('');
              }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:scale-105 hover:border-blue-300 transition-all duration-200 text-left cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">POs Not Emailed</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {orders.filter(o => ['draft', 'pending_approval'].includes(o.status)).length}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <EnvelopeIcon className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </button>

            {/* Urgent Orders (Pinned) */}
            <button
              onClick={() => {
                // Show only pinned orders
                setStatusFilter('all');
                setShowOnlyPinned(true);
              }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:scale-105 hover:border-blue-300 transition-all duration-200 text-left cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Urgent Orders</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{pinnedOrders.size}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <BookmarkIcon className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </button>

            {/* Urgent Actions Required */}
            <button
              onClick={() => {
                // Scroll to urgent actions section
                const urgentSection = document.querySelector('#urgent-actions');
                urgentSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:scale-105 hover:border-blue-300 transition-all duration-200 text-left cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Urgent Actions</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">
                    {orders.filter(o => o.priority === 'urgent' || o.status === 'pending_approval').length}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </button>

            {/* Archived Orders */}
            <button
              onClick={() => {
                setStatusFilter('completed');
                setShowOnlyPinned(false);
                setSearchTerm('');
              }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:scale-105 hover:border-blue-300 transition-all duration-200 text-left cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Archived Orders</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {orders.filter(o => o.status === 'completed').length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Enhanced Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="space-y-4">
            {/* Search Dropdowns Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search by Supplier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search by Supplier</label>
                <SearchableSupplierDropdown
                  value={supplierSearch}
                  onChange={setSupplierSearch}
                  placeholder="Search suppliers..."
                />
              </div>

              {/* Search by Customer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search by Customer</label>
                <SearchableCustomerDropdown
                  value={customerSearch}
                  onChange={setCustomerSearch}
                  placeholder="Search customers..."
                />
              </div>

              {/* Search by Purchase Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search by Purchase Order</label>
                <div className="relative">
                  <input
                    type="text"
                    value={poSearch}
                    onChange={(e) => setPoSearch(e.target.value)}
                    placeholder="Enter PO number..."
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  />
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute right-3 top-3.5" />
                  {poSearch && (
                    <button
                      onClick={() => setPoSearch('')}
                      className="absolute right-8 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Clear All */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setShowOnlyPinned(false);
                    setDateFromFilter('');
                    setDateToFilter('');
                    setSupplierSearch('');
                    setCustomerSearch('');
                    setPoSearch('');
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            </div>

            {/* Date Range Search */}
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-gray-700">Search by Date Range:</div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">From:</label>
                <input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">To:</label>
                <input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          {/* Filter Summary */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredOrders.length} of {orders.length} orders
            </p>
            {(statusFilter !== 'all' || priorityFilter !== 'all' || supplierSearch || customerSearch || poSearch || showOnlyPinned || dateFromFilter || dateToFilter) && (
              <div className="text-sm text-gray-500">
                Active filters: 
                {statusFilter !== 'all' && <span className="ml-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">{statusFilter}</span>}
                {supplierSearch && <span className="ml-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">supplier: {supplierSearch}</span>}
                {customerSearch && <span className="ml-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">customer: {customerSearch}</span>}
                {poSearch && <span className="ml-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">PO: {poSearch}</span>}
                {showOnlyPinned && <span className="ml-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">pinned only</span>}
                {(dateFromFilter || dateToFilter) && <span className="ml-1 bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">date range</span>}
              </div>
            )}
          </div>
        </div>

        {/* Clean Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg text-gray-600">Loading purchase orders...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-5 text-center text-sm font-semibold text-gray-700">Pin</th>
                      <th className="px-4 py-5 text-left text-sm font-semibold text-gray-700">Purchase Order Number</th>
                      <th className="px-4 py-5 text-left text-sm font-semibold text-gray-700">Supplier</th>
                      <th className="px-4 py-5 text-left text-sm font-semibold text-gray-700">Customer/Customer Ref Number</th>
                      <th className="px-4 py-5 text-left text-sm font-semibold text-gray-700">Order Date</th>
                      <th className="px-4 py-5 text-left text-sm font-semibold text-gray-700">Due Date</th>
                      <th className="px-4 py-5 text-left text-sm font-semibold text-gray-700">Description</th>
                      <th className="px-4 py-5 text-left text-sm font-semibold text-gray-700">Comments</th>
                      <th className="px-4 py-5 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-5 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedOrders.map((order) => {
                      const isPinned = pinnedOrders.has(order.id);
                      return (
                        <tr 
                          key={order.id}
                          className={`transition-colors ${
                            isPinned 
                              ? 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {/* Pin Button */}
                          <td className="px-2 py-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPinnedOrders(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(order.id)) {
                                    newSet.delete(order.id);
                                  } else {
                                    newSet.add(order.id);
                                  }
                                  return newSet;
                                });
                              }}
                              className={`p-1 rounded transition-colors ${
                                isPinned 
                                  ? 'text-red-600 hover:text-red-800 bg-red-100' 
                                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                              }`}
                              title={isPinned ? 'Unpin from top' : 'Pin to top'}
                            >
                              <BookmarkIcon className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
                            </button>
                          </td>

                          {/* Purchase Order Number */}
                          <td className="px-4 py-4">
                            <button
                              onClick={() => setSelectedOrderForAction(order)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {order.poNumber}
                            </button>
                          </td>
                          
                          {/* Supplier */}
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">{order.supplierName}</div>
                          </td>
                          
                          {/* Customer/Customer Ref Number */}
                          <td className="px-4 py-4">
                            <div>
                              <div className="font-medium text-gray-900">{order.customerName || 'N/A'}</div>
                              {order.customerReference && (
                                <div className="text-sm text-gray-600">{order.customerReference}</div>
                              )}
                            </div>
                          </td>
                          
                          {/* Order Date */}
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-900">{order.orderDate}</div>
                          </td>
                          
                          {/* Due Date (Editable) */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              {editingDueDate === order.id ? (
                                <>
                                  <input
                                    type="date"
                                    value={order.expectedDelivery}
                                    onChange={(e) => {
                                      setOrders(prev => prev.map(o => 
                                        o.id === order.id 
                                          ? { ...o, expectedDelivery: e.target.value, lastActivity: 'Due date updated' }
                                          : o
                                      ));
                                    }}
                                    className="text-sm border border-blue-500 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => setEditingDueDate(null)}
                                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                  >
                                    ✓
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span className="text-sm text-gray-900">{order.expectedDelivery}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingDueDate(order.id);
                                    }}
                                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                    title="Edit due date"
                                  >
                                    <PencilIcon className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                          
                          {/* Description */}
                          <td className="px-4 py-4">
                            <div className="max-w-xs">
                              <div className="text-sm text-gray-900 truncate" title={order.orderSummary}>
                                {order.orderSummary?.replace(/\$[\d,]+/g, '').trim()}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {order.lineItemCount} items
                              </div>
                            </div>
                          </td>
                          
                          {/* Comments (Editable) */}
                          <td className="px-4 py-4">
                            <div className="max-w-xs">
                              {editingComments[order.id] !== undefined ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editingComments[order.id]}
                                    onChange={(e) => setEditingComments(prev => ({
                                      ...prev,
                                      [order.id]: e.target.value
                                    }))}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    rows={2}
                                    placeholder="Add comments, reminders, notes..."
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        // Save comment to order
                                        setOrders(prev => prev.map(o => 
                                          o.id === order.id 
                                            ? { ...o, comments: editingComments[order.id] }
                                            : o
                                        ));
                                        // Clear editing state
                                        setEditingComments(prev => {
                                          const newState = { ...prev };
                                          delete newState[order.id];
                                          return newState;
                                        });
                                      }}
                                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingComments(prev => {
                                          const newState = { ...prev };
                                          delete newState[order.id];
                                          return newState;
                                        });
                                      }}
                                      className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  onClick={() => setEditingComments(prev => ({
                                    ...prev,
                                    [order.id]: order.comments || ''
                                  }))}
                                  className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 p-2 rounded min-h-[2rem] border border-transparent hover:border-gray-200"
                                  title="Click to add comments"
                                >
                                  {order.comments || 'Click to add comments...'}
                                </div>
                              )}
                            </div>
                          </td>
                          
                          {/* Status */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              {editingStatus === order.id ? (
                                <select
                                  value={order.status}
                                  onChange={(e) => {
                                    setOrders(prev => prev.map(o => 
                                      o.id === order.id 
                                        ? { ...o, status: e.target.value as any, lastActivity: 'Status updated manually' }
                                        : o
                                    ));
                                    setEditingStatus(null);
                                  }}
                                  className="text-sm border border-gray-300 rounded px-2 py-1"
                                >
                                  <option value="draft">Purchase Order</option>
                                  <option value="sent_to_supplier">Purchase Order Sent</option>
                                  <option value="viewed">Purchase Order Viewed</option>
                                  <option value="supplier_confirmed">Purchase Order Accepted</option>
                                  <option value="declined">Purchase Order Declined</option>
                                  <option value="completed">Complete</option>
                                </select>
                              ) : (
                                <>
                                  {getStatusBadge(order)}
                                  <button
                                    onClick={() => handleStatusEdit(order.id)}
                                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                    title="Edit Status (Admin Only)"
                                  >
                                    <LockClosedIcon className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                          
                          {/* Actions */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  // Open PDF view in new tab
                                  const pdfUrl = `/purchase-order/pdf/${order.id}`;
                                  window.open(pdfUrl, '_blank');
                                }}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                title="View PDF"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setOrderToEdit(order);
                                  setShowEditModal(true);
                                }}
                                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                                title="Edit Purchase Order"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  // Navigate to goods receipt page
                                  navigate(`/inventory/goods-receipt/${order.id}`);
                                }}
                                className="p-2 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded"
                                title="Receive Items"
                              >
                                <ArchiveBoxArrowDownIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setOrderToCopy(order);
                                  setShowCopyModal(true);
                                }}
                                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                                title="Copy/Reorder Items"
                              >
                                <DocumentDuplicateIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setOrderToEmail(order);
                                  setShowEmailModal(true);
                                }}
                                className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded"
                                title="Email Purchase Order"
                              >
                                <EnvelopeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this purchase order?')) {
                                    // Remove from state
                                    setOrders(prev => prev.filter(o => o.id !== order.id));
                                    
                                    // Also remove from localStorage
                                    try {
                                      const savedOrders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
                                      const updatedOrders = savedOrders.filter((o: any) => o.id !== order.id);
                                      localStorage.setItem('saleskik-purchase-orders', JSON.stringify(updatedOrders));
                                    } catch (error) {
                                      console.error('Error updating purchase orders in storage:', error);
                                    }
                                  }
                                }}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                title="Delete Purchase Order"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {filteredOrders.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-lg text-gray-600 mb-4">No purchase orders match your filters.</p>
                  <button
                    onClick={() => {setSearchTerm(''); setStatusFilter('all'); setPriorityFilter('all');}}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear all filters to see all orders
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Urgent Actions from Goods Receipt */}
        {urgentActions.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500 rounded-lg">
                <ExclamationTriangleIcon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-900">Delivery Issues Require Attention</h3>
                <p className="text-red-800 mt-1">
                  {urgentActions.length} items have missing or damaged products
                </p>
              </div>
            </div>

            {/* Urgent Actions List */}
            <div className="space-y-4">
              {urgentActions.map(action => (
                <div key={action.id} className="bg-white rounded-lg border border-red-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          action.type === 'missing' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {action.type.toUpperCase()}
                        </span>
                        <span className="font-semibold text-gray-900">{action.poNumber}</span>
                        <span className="text-sm text-gray-600">{action.supplierName}</span>
                      </div>
                      <div className="text-sm text-gray-900 font-medium mb-1">
                        {action.itemName} ({action.itemType})
                      </div>
                      <div className="text-sm text-gray-700 mb-2">{action.description}</div>
                      <div className="text-xs text-gray-500">
                        Quantity affected: {action.quantity} • Created: {action.createdDate}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          // Navigate to goods receipt page for this PO
                          navigate(`/inventory/goods-receipt/${action.purchaseOrderId}`);
                        }}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Review Receipt
                      </button>
                      <button
                        onClick={() => {
                          // Mark action as resolved
                          const updatedActions = urgentActions.filter(a => a.id !== action.id);
                          setUrgentActions(updatedActions);
                          localStorage.setItem('saleskik-urgent-actions', JSON.stringify(updatedActions));
                        }}
                        className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Urgent Actions Alert */}
        {urgentCount > 0 && (
          <div id="urgent-actions" className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500 rounded-lg">
                <ExclamationTriangleIcon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-900">Urgent Actions Required</h3>
                <p className="text-red-800 mt-1">
                  {urgentCount} orders need immediate attention
                </p>
              </div>
              <button
                onClick={() => setShowApprovalWorkflow(true)}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Review Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}

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
        pinnedOrders={pinnedOrders}
        orders={orders}
      />

      {/* Copy Purchase Order Modal */}
      {orderToCopy && (
        <CopyPurchaseOrderModal
          isOpen={showCopyModal}
          onClose={() => {
            setShowCopyModal(false);
            setOrderToCopy(null);
          }}
          purchaseOrder={orderToCopy}
          onCopyComplete={handleCopyComplete}
        />
      )}

      {/* Email Purchase Order Modal */}
      {orderToEmail && (
        <EmailPurchaseOrderModal
          isOpen={showEmailModal}
          onClose={() => {
            setShowEmailModal(false);
            setOrderToEmail(null);
          }}
          purchaseOrder={orderToEmail}
        />
      )}

      {/* Print Options Modal */}
      <PrintOptionsModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        orders={orders}
        pinnedOrders={pinnedOrders}
      />

      {/* Edit Order Modal */}
      {showEditModal && orderToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit Purchase Order</h2>
                <p className="text-sm text-gray-600 mt-1">{orderToEdit.poNumber}</p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setOrderToEdit(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                    <input
                      type="text"
                      value={orderToEdit.supplierName}
                      disabled
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery</label>
                    <input
                      type="date"
                      value={orderToEdit.expectedDelivery}
                      onChange={(e) => setOrderToEdit({...orderToEdit, expectedDelivery: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={orderToEdit.priority || 'normal'}
                    onChange={(e) => setOrderToEdit({...orderToEdit, priority: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
                  <textarea
                    value={orderToEdit.specialInstructions || ''}
                    onChange={(e) => setOrderToEdit({...orderToEdit, specialInstructions: e.target.value})}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add any special instructions for this order..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order Summary</label>
                  <textarea
                    value={orderToEdit.orderSummary || ''}
                    onChange={(e) => setOrderToEdit({...orderToEdit, orderSummary: e.target.value})}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Update order summary..."
                  />
                </div>
              </div>
            </div>

            <div className="border-t p-6">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setOrderToEdit(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Save the edited order
                    const updatedOrders = orders.map(order => 
                      order.id === orderToEdit.id ? orderToEdit : order
                    );
                    setOrders(updatedOrders);
                    localStorage.setItem('saleskik-purchase-orders', JSON.stringify(updatedOrders));
                    
                    setShowEditModal(false);
                    setOrderToEdit(null);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrderForAction && (
        <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between p-8 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedOrderForAction.poNumber}</h2>
                <p className="text-lg text-gray-600 mt-1">{selectedOrderForAction.customerName}</p>
              </div>
              <button
                onClick={() => setSelectedOrderForAction(null)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <XMarkIcon className="w-8 h-8" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto max-h-96">
              <div className="grid grid-cols-2 gap-6 text-base">
                <div><strong>Status:</strong> {selectedOrderForAction.status}</div>
                <div><strong>Priority:</strong> {selectedOrderForAction.priority}</div>
                <div><strong>Total Amount:</strong> ${selectedOrderForAction.totalAmount.toFixed(2)}</div>
                <div><strong>Line Items:</strong> {selectedOrderForAction.lineItemCount}</div>
                <div><strong>Supplier:</strong> {selectedOrderForAction.supplierName}</div>
                <div><strong>Expected Delivery:</strong> {selectedOrderForAction.expectedDelivery}</div>
                <div className="col-span-2 mt-4">
                  <strong>Order Summary:</strong>
                  <p className="mt-2 text-gray-700 leading-relaxed">{selectedOrderForAction.orderSummary}</p>
                </div>
                {selectedOrderForAction.notes && (
                  <div className="col-span-2 mt-4">
                    <strong>Special Instructions:</strong>
                    <p className="mt-2 text-gray-700 leading-relaxed">{selectedOrderForAction.notes}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t p-8">
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setSelectedOrderForAction(null)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    setOrderToEdit(selectedOrderForAction);
                    setShowEditModal(true);
                    setSelectedOrderForAction(null);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
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