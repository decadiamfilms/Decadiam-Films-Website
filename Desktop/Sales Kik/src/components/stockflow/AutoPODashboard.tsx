import React, { useState, useEffect } from 'react';
import PurchaseOrderModal from '../inventory/PurchaseOrderModal';
import { generatePurchaseOrderTemplate } from '../inventory/PurchaseOrderTemplate';
import {
  ClockIcon,
  BoltIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface AutoPOStats {
  pending_approval: number;
  generated_today: number;
  total_pending_value: number;
  low_stock_items: number;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier: {
    id: string;
    name: string;
    rating: number;
  };
  items_count: number;
  total_amount: number;
  status: string;
  created_at: string;
  is_auto_generated: boolean;
  pending_approvals: number;
  priority: string;
  expected_delivery: string;
}

export default function AutoPODashboard() {
  const [stats, setStats] = useState<AutoPOStats>({
    pending_approval: 0,
    generated_today: 0,
    total_pending_value: 0,
    low_stock_items: 0
  });

  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [selectedPOs, setSelectedPOs] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showBulkAction, setShowBulkAction] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'approve' | 'reject' | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Purchase Order Modal state
  const [showPOModal, setShowPOModal] = useState(false);
  const [selectedPOForView, setSelectedPOForView] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    loadStats();
    loadPOs();
    setupRealTimeUpdates();
  }, []);

  useEffect(() => {
    loadPOs();
  }, [statusFilter, searchTerm]);

  const loadStats = async () => {
    try {
      // Mock stats - in production would call /api/auto-po/dashboard
      const mockStats = {
        pending_approval: 12,
        generated_today: 3,
        total_pending_value: 15750.00,
        low_stock_items: 23
      };
      
      setStats(mockStats);
      console.log('📊 Auto-PO stats loaded:', mockStats);
    } catch (error) {
      console.error('❌ Error loading auto-PO stats:', error);
    }
  };

  const loadPOs = async () => {
    try {
      setLoading(true);
      
      // Mock PO data - in production would call /api/purchase-orders with filters
      const mockPOs = [
        {
          id: 'po-001',
          po_number: 'AUTO-2024-001',
          supplier: { id: 'hardware-direct', name: 'Hardware Direct', rating: 4.8 },
          items_count: 3,
          total_amount: 2450.00,
          status: 'pending-approval',
          created_at: '2024-12-08T09:15:00Z',
          is_auto_generated: true,
          pending_approvals: 1,
          priority: 'HIGH',
          expected_delivery: '2024-12-11'
        },
        {
          id: 'po-002',
          po_number: 'AUTO-2024-002',
          supplier: { id: 'ausglass-supplies', name: 'AusGlass Supplies', rating: 4.9 },
          items_count: 2,
          total_amount: 650.00,
          status: 'approved',
          created_at: '2024-12-08T10:30:00Z',
          is_auto_generated: true,
          pending_approvals: 0,
          priority: 'CRITICAL',
          expected_delivery: '2024-12-13'
        },
        {
          id: 'po-003',
          po_number: 'AUTO-2024-003',
          supplier: { id: 'pool-pro-equipment', name: 'Pool Pro Equipment', rating: 4.6 },
          items_count: 1,
          total_amount: 8500.00,
          status: 'pending-approval',
          created_at: '2024-12-08T11:00:00Z',
          is_auto_generated: true,
          pending_approvals: 2,
          priority: 'URGENT',
          expected_delivery: '2024-12-15'
        },
        {
          id: 'po-004',
          po_number: 'AUTO-2024-004',
          supplier: { id: 'industrial-solutions', name: 'Industrial Solutions', rating: 4.7 },
          items_count: 5,
          total_amount: 1200.00,
          status: 'sent',
          created_at: '2024-12-07T14:20:00Z',
          is_auto_generated: true,
          pending_approvals: 0,
          priority: 'NORMAL',
          expected_delivery: '2024-12-14'
        }
      ];

      // Apply filters
      let filteredPOs = mockPOs;
      
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending-approval') {
          filteredPOs = filteredPOs.filter(po => po.status === 'pending-approval' || po.pending_approvals > 0);
        } else {
          filteredPOs = filteredPOs.filter(po => po.status === statusFilter);
        }
      }
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredPOs = filteredPOs.filter(po =>
          po.po_number.toLowerCase().includes(term) ||
          po.supplier.name.toLowerCase().includes(term)
        );
      }
      
      setPOs(filteredPOs);
      setLoading(false);
      console.log(`📋 Loaded ${filteredPOs.length} purchase orders`);

    } catch (error) {
      console.error('❌ Error loading purchase orders:', error);
      setLoading(false);
    }
  };

  const runManualGeneration = async () => {
    try {
      setLoading(true);
      console.log('🤖 Running manual auto-PO generation...');
      
      // Call the real API to generate purchase orders
      const response = await fetch('/api/purchase-orders/auto-generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Auto-POs generated successfully:', result);
        
        if (result.success) {
          showNotification('success', `Generated ${result.data.length} automatic purchase orders! Check the main Purchase Orders page to view and approve them.`);
          loadStats();
          loadPOs();
        } else {
          throw new Error('Generation failed');
        }
      } else {
        throw new Error(`API call failed: ${response.status}`);
      }
      
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Error running manual generation:', error);
      showNotification('error', 'Failed to generate purchase orders');
      setLoading(false);
    }
  };

  const quickApprove = async (po: PurchaseOrder) => {
    try {
      console.log(`✅ Quick approving PO ${po.po_number}`);
      
      // Call the real API to approve the purchase order
      const response = await fetch(`/api/purchase-orders/${po.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: 'Approved via Auto-PO Dashboard quick approval'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ PO approved via API:', result);
        
        showNotification('success', `PO ${po.po_number} approved successfully! Total: ${formatCurrency(po.total_amount)}. The purchase order is now available in the main Purchase Orders page.`);
        
        // Update local state
        setPOs(prev => prev.map(p => 
          p.id === po.id 
            ? { ...p, status: 'approved', pending_approvals: 0 }
            : p
        ));
        
        loadStats();
      } else {
        throw new Error(`Approval failed: ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ Error approving PO:', error);
      showNotification('error', 'Failed to approve purchase order via API');
    }
  };

  const bulkApprove = () => {
    if (selectedPOs.length === 0) return;
    setBulkActionType('approve');
    setShowBulkAction(true);
  };

  const bulkReject = () => {
    if (selectedPOs.length === 0) return;
    setBulkActionType('reject');
    setShowBulkAction(true);
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    try {
      console.log(`🔄 Bulk ${action} for ${selectedPOs.length} POs`);
      
      // Mock bulk action - in production would call /api/auto-po/bulk-approve or bulk-reject
      const successful = selectedPOs.length;
      const failed = 0;
      
      showNotification('success', `${successful} purchase orders ${action}d successfully`);
      
      // Update local state
      setPOs(prev => prev.map(po => 
        selectedPOs.includes(po.id) 
          ? { ...po, status: action === 'approve' ? 'approved' : 'rejected', pending_approvals: 0 }
          : po
      ));
      
      setSelectedPOs([]);
      setShowBulkAction(false);
      loadStats();
      
    } catch (error) {
      console.error(`❌ Error during bulk ${action}:`, error);
      showNotification('error', `Failed to ${action} purchase orders`);
    }
  };

  const selectAll = () => {
    if (selectedPOs.length === pos.length) {
      setSelectedPOs([]);
    } else {
      setSelectedPOs(pos.map(po => po.id));
    }
  };

  const canApprove = (po: PurchaseOrder) => {
    return po.status === 'pending-approval' || po.pending_approvals > 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    // Placeholder for notification system
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  const setupRealTimeUpdates = () => {
    // Mock real-time updates - in production would use WebSocket
    console.log('🔄 Setting up real-time updates for auto-PO dashboard');
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const configs = {
      'draft': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      'pending-approval': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Approval' },
      'approved': { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      'sent': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sent' },
      'rejected': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' }
    };
    
    const config = configs[status as keyof typeof configs] || configs.draft;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const SummaryCard = ({ title, value, icon: Icon, color, onClick }: any) => (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className={`text-2xl font-semibold mt-1 ${
            color === 'warning' ? 'text-orange-600' : 
            color === 'danger' ? 'text-red-600' : 
            color === 'info' ? 'text-blue-600' : 
            'text-green-600'
          }`}>
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-full ${
          color === 'warning' ? 'bg-orange-100' : 
          color === 'danger' ? 'bg-red-100' : 
          color === 'info' ? 'bg-blue-100' : 
          'bg-green-100'
        }`}>
          <Icon className={`w-6 h-6 ${
            color === 'warning' ? 'text-orange-600' : 
            color === 'danger' ? 'text-red-600' : 
            color === 'info' ? 'text-blue-600' : 
            'text-green-600'
          }`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automatic Purchase Orders</h1>
          <p className="text-gray-600">AI-powered purchase order generation and approval workflow</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={runManualGeneration}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <BoltIcon className="w-4 h-4 mr-2" />
            {loading ? 'Generating...' : 'Generate Now'}
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          title="Pending Approval"
          value={stats.pending_approval}
          icon={ClockIcon}
          color="warning"
          onClick={() => setStatusFilter('pending-approval')}
        />
        <SummaryCard 
          title="Auto-Generated Today"
          value={stats.generated_today}
          icon={BoltIcon}
          color="info"
        />
        <SummaryCard 
          title="Total Value Pending"
          value={formatCurrency(stats.total_pending_value)}
          icon={CurrencyDollarIcon}
          color="primary"
        />
        <SummaryCard 
          title="Low Stock Items"
          value={stats.low_stock_items}
          icon={ExclamationTriangleIcon}
          color="danger"
          onClick={() => console.log('Navigate to low stock items')}
        />
      </div>

      {/* PO List Container */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* List Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Purchase Orders</h3>
            <div className="flex items-center space-x-4">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending-approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="sent">Sent</option>
              </select>
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search POs..."
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64"
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedPOs.length > 0 && (
          <div className="px-6 py-3 bg-blue-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedPOs.length} selected
              </span>
              <div className="flex space-x-2">
                <button 
                  onClick={bulkApprove}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Bulk Approve
                </button>
                <button 
                  onClick={bulkReject}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Bulk Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PO Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input 
                    type="checkbox" 
                    checked={selectedPOs.length === pos.length && pos.length > 0}
                    onChange={selectAll}
                    className="rounded" 
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-500">Loading purchase orders...</span>
                    </div>
                  </td>
                </tr>
              ) : pos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No purchase orders found
                  </td>
                </tr>
              ) : (
                pos.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50" onClick={(e) => e.preventDefault()}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input 
                        type="checkbox" 
                        checked={selectedPOs.includes(po.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPOs(prev => [...prev, po.id]);
                          } else {
                            setSelectedPOs(prev => prev.filter(id => id !== po.id));
                          }
                        }}
                        className="rounded" 
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">{po.po_number}</span>
                        {po.is_auto_generated && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            AUTO
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{po.supplier.name}</div>
                        <div className="text-sm text-gray-500">Rating: {po.supplier.rating}/5</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {po.items_count} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(po.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={po.status} />
                      {po.pending_approvals > 0 && (
                        <div className="text-xs text-orange-600 mt-1">
                          {po.pending_approvals} pending
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(po.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('📄 Opening PO modal for:', po.po_number);
                            setSelectedPOForView(po);
                            setShowPOModal(true);
                            
                            // Create the PO data in the exact format expected by the template
                            const poOrderData = {
                              poNumber: po.po_number,
                              customer: {
                                customerName: 'Internal Purchase Order',
                                customerReference: po.po_number,
                                email: 'purchasing@company.com',
                                phone: '(02) 1234 5678'
                              },
                              supplier: {
                                supplierName: po.supplier.name,
                                supplierCode: po.supplier.id.toUpperCase(),
                                contactPerson: 'Orders Department',
                                emailAddress: `orders@${po.supplier.name.toLowerCase().replace(/\s+/g, '')}.com.au`,
                                phoneNumber: '(02) 9876 5432',
                                paymentTerms: 'Net 30 days',
                                isLocalGlassSupplier: false,
                                isApprovedSupplier: true,
                                performanceRating: po.supplier.rating,
                                totalOrdersCount: 25,
                                status: 'active',
                                notes: `Preferred supplier - ${po.supplier.rating}/5 rating`
                              },
                              lineItems: [
                                {
                                  id: 'auto-1',
                                  type: 'product',
                                  product: {
                                    name: 'Stainless Steel Bolt M8x50mm',
                                    code: 'HW-BOLT-M8',
                                    description: 'Standard hardware fastener',
                                    category: 'Hardware'
                                  },
                                  quantity: 500,
                                  unitCost: 2.5,
                                  totalCost: 1250,
                                  notes: 'Standard hardware fastener'
                                },
                                {
                                  id: 'auto-2',
                                  type: 'product',
                                  product: {
                                    name: 'Stainless Steel Washer M8',
                                    code: 'HW-WASH-M8',
                                    description: 'Compatible with M8 bolts',
                                    category: 'Hardware'
                                  },
                                  quantity: 1000,
                                  unitCost: 0.5,
                                  totalCost: 500,
                                  notes: 'Compatible with M8 bolts'
                                },
                                {
                                  id: 'auto-3',
                                  type: 'product',
                                  product: {
                                    name: 'Stainless Steel Nut M8',
                                    code: 'HW-NUT-M8',
                                    description: 'Standard M8 thread',
                                    category: 'Hardware'
                                  },
                                  quantity: 1400,
                                  unitCost: 0.5,
                                  totalCost: 700,
                                  notes: 'Standard M8 thread'
                                }
                              ],
                              projectName: `Hardware Replenishment Order`,
                              referenceNumber: po.po_number,
                              priority: po.priority.toLowerCase(),
                              expectedDelivery: po.expected_delivery,
                              specialInstructions: `Please deliver to main warehouse loading dock during business hours (8 AM - 5 PM).\n\nDelivery Requirements:\n• Contact warehouse manager upon arrival: (02) 1234 5678\n• Standard packaging acceptable\n• Please provide delivery notification and tracking information\n• Inspect goods upon delivery\n\nPayment Terms: Net 30 days from delivery\nExpected Delivery Date: ${po.expected_delivery}`,
                              jobName: 'Inventory Replenishment'
                            };

                            // Generate the actual PO template HTML
                            const globalStyling = {
                              primaryColor: '#3B82F6',
                              secondaryColor: '#1E40AF',
                              accentColor: '#F59E0B'
                            };

                            const companyProfile = {
                              companyName: 'Your Company Name',
                              address: '123 Business Street, Sydney NSW 2000',
                              phone: '(02) 1234 5678',
                              email: 'orders@company.com',
                              abn: '12 345 678 901'
                            };

                            const pdfSettings = {
                              includeNotes: true,
                              includeImages: false,
                              pageSize: 'A4'
                            };

                            try {
                              // Use the exact same template generation as manual POs
                              const htmlTemplate = generatePurchaseOrderTemplate(
                                poOrderData,
                                globalStyling,
                                companyProfile,
                                pdfSettings
                              );

                              // Open the PO document in a new window
                              const newWindow = window.open('', '_blank');
                              if (newWindow) {
                                newWindow.document.write(htmlTemplate);
                                newWindow.document.close();
                                console.log('✅ Auto-generated PO document opened successfully');
                              } else {
                                console.error('❌ Failed to open new window - popup blocked?');
                                alert('Please allow popups to view the purchase order document');
                              }
                            } catch (error) {
                              console.error('❌ Error generating PO document:', error);
                              alert('Error generating purchase order document: ' + error.message);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View PO Document"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        {canApprove(po) && (
                          <button 
                            onClick={() => quickApprove(po)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            Approve
                          </button>
                        )}
                        {po.status === 'approved' && (
                          <button 
                            onClick={() => showNotification('info', `Sending PO ${po.po_number} to supplier...`)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          >
                            Send
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Action Modal */}
      {showBulkAction && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-white bg-opacity-90" onClick={() => setShowBulkAction(false)}></div>
          
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-white px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Bulk {bulkActionType === 'approve' ? 'Approve' : 'Reject'} Purchase Orders
              </h3>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to {bulkActionType} {selectedPOs.length} purchase orders?
              </p>
              
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setShowBulkAction(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleBulkAction(bulkActionType!)}
                  className={`px-4 py-2 rounded-lg text-white ${
                    bulkActionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {bulkActionType === 'approve' ? 'Approve All' : 'Reject All'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Order Modal - Shows the actual PO document like manual creation */}
      {showPOModal && selectedPOForView && (
        <PurchaseOrderModal
          isOpen={showPOModal}
          onClose={() => {
            setShowPOModal(false);
            setSelectedPOForView(null);
          }}
          orderData={{
            customer: {
              customerName: 'Stock Replenishment Order',
              customerReference: `AUTO-STOCK-${selectedPOForView.po_number}`,
              email: 'inventory@company.com',
              phone: '(02) 1234 5678'
            },
            supplier: {
              supplierName: selectedPOForView.supplier.name,
              supplierCode: selectedPOForView.supplier.id.toUpperCase(),
              contactPerson: 'Orders Department',
              emailAddress: `orders@${selectedPOForView.supplier.name.toLowerCase().replace(/\s+/g, '')}.com.au`,
              phoneNumber: '(02) 9876 5432',
              paymentTerms: 'Net 30 days',
              isLocalGlassSupplier: false,
              isApprovedSupplier: true,
              performanceRating: selectedPOForView.supplier.rating,
              totalOrdersCount: 25,
              status: 'active',
              notes: `Preferred supplier for automatic stock replenishment. Rating: ${selectedPOForView.supplier.rating}/5`
            },
            lineItems: [
              {
                id: 'auto-1',
                type: 'product',
                code: 'HW-BOLT-M8',
                description: 'Stainless Steel Bolt M8x50mm - Auto-Reorder (Critical Stock Alert)',
                category: 'Hardware',
                subcategoryPath: [{ name: 'Fasteners', color: '#3B82F6' }, { name: 'Bolts', color: '#1E40AF' }],
                quantity: 500,
                unitPrice: 2.50,
                totalPrice: 1250.00,
                notes: `🚨 CRITICAL STOCK ALERT\nCurrent Stock: 15 units\nReorder Point: 200 units\nLead Time: 3 days\nPack Size: 50 units\nRecommended Order: 500 units`
              },
              {
                id: 'auto-2', 
                type: 'product',
                code: 'HW-WASH-M8',
                description: 'Stainless Steel Washer M8 - Pack Optimization Item',
                category: 'Hardware',
                subcategoryPath: [{ name: 'Fasteners', color: '#3B82F6' }, { name: 'Washers', color: '#1E40AF' }],
                quantity: 1000,
                unitPrice: 0.50,
                totalPrice: 500.00,
                notes: `📦 PACK OPTIMIZATION\nCurrent Stock: 25 units\nReorder Point: 500 units\nPack Size: 100 units\nNote: Commonly ordered with M8 bolts`
              },
              {
                id: 'auto-3',
                type: 'product', 
                code: 'HW-NUT-M8',
                description: 'Stainless Steel Nut M8 - Essential Hardware Component',
                category: 'Hardware',
                subcategoryPath: [{ name: 'Fasteners', color: '#3B82F6' }, { name: 'Nuts', color: '#1E40AF' }],
                quantity: 1400,
                unitPrice: 0.50, 
                totalPrice: 700.00,
                notes: `⚠️ LOW STOCK WARNING\nCurrent Stock: 18 units\nReorder Point: 300 units\nPack Size: 200 units\nUsage: Essential for pool fencing projects`
              }
            ],
            projectName: `StockFlow Auto-Replenishment - ${selectedPOForView.po_number}`,
            referenceNumber: selectedPOForView.po_number,
            priority: selectedPOForView.priority.toLowerCase() as 'normal' | 'high' | 'urgent',
            expectedDelivery: selectedPOForView.expected_delivery,
            specialInstructions: `🤖 AUTOMATICALLY GENERATED PURCHASE ORDER\n\nThis purchase order was intelligently generated by the StockFlow Manager AI system based on critical low stock alerts detected in your inventory.\n\nGENERATION DETAILS:\n• Trigger: Low stock detection algorithm\n• Priority Level: ${selectedPOForView.priority}\n• Items Affected: ${selectedPOForView.items_count} critical components\n• Supplier Selection: Preferred supplier based on performance rating\n• Expected Delivery: ${selectedPOForView.expected_delivery} (${selectedPOForView.supplier.rating >= 4.5 ? 'Trusted supplier - expedited delivery possible' : 'Standard delivery timeline'})\n\nACTION REQUIRED:\n• Please review and approve this order\n• Expedited delivery recommended for critical items\n• Contact supplier if delivery date needs adjustment\n\nSTOCK IMPACT:\n• Prevents stockouts on essential items\n• Maintains optimal inventory levels\n• Supports ongoing production requirements`,
            jobName: `Stock Replenishment - ${selectedPOForView.supplier.name}`
          }}
          onOrderCreated={(createdOrder) => {
            console.log('✅ Auto-generated PO finalized:', createdOrder);
            setShowPOModal(false);
            setSelectedPOForView(null);
            loadPOs();
            showNotification('success', `Auto-generated purchase order ${selectedPOForView?.po_number} has been processed and is now available in the main Purchase Orders dashboard`);
          }}
        />
      )}
    </div>
  );
}