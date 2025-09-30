import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  PrinterIcon,
  EnvelopeIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BuildingOffice2Icon,
  UserIcon,
  CalendarIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

interface PurchaseOrderDetails {
  id: string;
  po_number: string;
  supplier: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    contact_person: string;
    rating: number;
    payment_terms: string;
  };
  warehouse: {
    id: string;
    name: string;
    address: string;
  };
  status: string;
  priority: string;
  order_date: string;
  expected_delivery_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  currency_code: string;
  terms_conditions: string;
  internal_notes: string;
  supplier_notes: string;
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  sent_at?: string;
  is_auto_generated: boolean;
  auto_generated_reason?: string;
  items: Array<{
    id: string;
    product_id: string;
    product_name: string;
    sku: string;
    quantity_ordered: number;
    quantity_received: number;
    unit_cost: number;
    line_total: number;
    expected_date: string;
    notes: string;
  }>;
  approval_workflow?: Array<{
    id: string;
    approver_name: string;
    approval_level: number;
    status: string;
    decided_at?: string;
    decision_notes?: string;
  }>;
}

interface Props {
  isOpen: boolean;
  poId: string | null;
  onClose: () => void;
  onApprove?: (poId: string) => void;
  onReject?: (poId: string) => void;
  onSend?: (poId: string) => void;
}

export default function PurchaseOrderModal({ isOpen, poId, onClose, onApprove, onReject, onSend }: Props) {
  const [po, setPO] = useState<PurchaseOrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'approval' | 'history'>('details');

  useEffect(() => {
    if (isOpen && poId) {
      loadPODetails();
    }
  }, [isOpen, poId]);

  const loadPODetails = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading PO details for:', poId);
      
      // Mock PO data - in production would call /api/purchase-orders/{poId}
      const mockPO: PurchaseOrderDetails = {
        id: poId!,
        po_number: 'AUTO-2024-001',
        supplier: {
          id: 'hardware-direct',
          name: 'Hardware Direct',
          email: 'orders@hardwaredirect.com.au',
          phone: '(02) 9876 5432',
          address: '123 Industrial Estate, Sydney NSW 2000',
          contact_person: 'John Smith',
          rating: 4.8,
          payment_terms: 'Net 30 days'
        },
        warehouse: {
          id: 'main-warehouse',
          name: 'Main Warehouse',
          address: '456 Storage Street, Sydney NSW 2001'
        },
        status: 'pending-approval',
        priority: 'HIGH',
        order_date: '2024-12-08T09:15:00Z',
        expected_delivery_date: '2024-12-11T00:00:00Z',
        subtotal: 2450.00,
        tax_rate: 10,
        tax_amount: 245.00,
        shipping_cost: 50.00,
        total_amount: 2745.00,
        currency_code: 'AUD',
        terms_conditions: 'Standard terms and conditions apply. Goods to be delivered to main warehouse dock.',
        internal_notes: 'Auto-generated PO based on low stock alerts for critical items. Expedited delivery requested.',
        supplier_notes: 'Please confirm delivery schedule and provide tracking information.',
        created_by: 'Auto-PO System',
        is_auto_generated: true,
        auto_generated_reason: 'Automatic reorder for 3 low stock items detected by StockFlow system',
        items: [
          {
            id: 'item-1',
            product_id: 'steel-bolt-m8',
            product_name: 'Stainless Steel Bolt M8x50',
            sku: 'HW-BOLT-M8',
            quantity_ordered: 500,
            quantity_received: 0,
            unit_cost: 2.50,
            line_total: 1250.00,
            expected_date: '2024-12-11',
            notes: 'Auto-reorder: 15 in stock, reorder point: 200. Critical stock level.'
          },
          {
            id: 'item-2',
            product_id: 'steel-washer-m8',
            product_name: 'Stainless Steel Washer M8',
            sku: 'HW-WASH-M8',
            quantity_ordered: 1000,
            quantity_received: 0,
            unit_cost: 0.50,
            line_total: 500.00,
            expected_date: '2024-12-11',
            notes: 'Auto-reorder: 25 in stock, reorder point: 500. Commonly ordered with bolts.'
          },
          {
            id: 'item-3',
            product_id: 'steel-nut-m8',
            product_name: 'Stainless Steel Nut M8',
            sku: 'HW-NUT-M8',
            quantity_ordered: 1400,
            quantity_received: 0,
            unit_cost: 0.50,
            line_total: 700.00,
            expected_date: '2024-12-11',
            notes: 'Auto-reorder: 18 in stock, reorder point: 300. Essential hardware item.'
          }
        ],
        approval_workflow: [
          {
            id: 'approval-1',
            approver_name: 'John Manager',
            approval_level: 1,
            status: 'pending',
            decision_notes: undefined,
            decided_at: undefined
          }
        ]
      };
      
      setPO(mockPO);
      setLoading(false);
      console.log('✅ PO details loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading PO details:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency = 'AUD') => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAction = async (action: 'approve' | 'reject' | 'send' | 'print' | 'email') => {
    try {
      console.log(`🔄 Performing action: ${action} for PO ${po?.po_number}`);
      
      switch (action) {
        case 'approve':
          if (onApprove && po) {
            onApprove(po.id);
            setPO(prev => prev ? { ...prev, status: 'approved', approved_by: 'Current User', approved_at: new Date().toISOString() } : null);
          }
          break;
        case 'reject':
          if (onReject && po) {
            onReject(po.id);
            setPO(prev => prev ? { ...prev, status: 'rejected' } : null);
          }
          break;
        case 'send':
          if (onSend && po) {
            onSend(po.id);
            setPO(prev => prev ? { ...prev, status: 'sent', sent_at: new Date().toISOString() } : null);
          }
          break;
        case 'print':
          console.log('🖨️ Printing PO...');
          window.print();
          break;
        case 'email':
          console.log('📧 Sending PO via email...');
          alert(`Email sent to ${po?.supplier.email}\n\nPO ${po?.po_number} has been emailed to ${po?.supplier.contact_person} at ${po?.supplier.name}`);
          break;
      }
      
    } catch (error) {
      console.error(`❌ Error performing ${action}:`, error);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      'draft': { bg: 'bg-gray-100', text: 'text-gray-800', icon: ClockIcon },
      'pending-approval': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: ExclamationTriangleIcon },
      'approved': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon },
      'sent': { bg: 'bg-blue-100', text: 'text-blue-800', icon: EnvelopeIcon },
      'rejected': { bg: 'bg-red-100', text: 'text-red-800', icon: XMarkIcon }
    };
    
    const config = configs[status as keyof typeof configs] || configs.draft;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <IconComponent className="w-4 h-4 mr-1" />
        {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const configs = {
      'LOW': { bg: 'bg-gray-100', text: 'text-gray-600' },
      'NORMAL': { bg: 'bg-blue-100', text: 'text-blue-600' },
      'HIGH': { bg: 'bg-orange-100', text: 'text-orange-600' },
      'URGENT': { bg: 'bg-red-100', text: 'text-red-600' }
    };
    
    const config = configs[priority as keyof typeof configs] || configs.NORMAL;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {priority}
      </span>
    );
  };

  if (!isOpen || !po) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-white bg-opacity-90" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading purchase order details...</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{po.po_number}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusBadge(po.status)}
                    {getPriorityBadge(po.priority)}
                    {po.is_auto_generated && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-600">
                        <BoltIcon className="w-3 h-3 mr-1" />
                        AUTO-GENERATED
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Action Buttons */}
                {po.status === 'pending-approval' && (
                  <>
                    <button 
                      onClick={() => handleAction('approve')}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleAction('reject')}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Reject
                    </button>
                  </>
                )}
                
                {po.status === 'approved' && (
                  <button 
                    onClick={() => handleAction('send')}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <EnvelopeIcon className="w-4 h-4 mr-1 inline" />
                    Send to Supplier
                  </button>
                )}
                
                <button 
                  onClick={() => handleAction('print')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <PrinterIcon className="w-4 h-4 mr-1 inline" />
                  Print
                </button>
                
                <button 
                  onClick={() => handleAction('email')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <EnvelopeIcon className="w-4 h-4 mr-1 inline" />
                  Email
                </button>
                
                <button 
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 bg-gray-50">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'details', name: 'Details', icon: DocumentArrowDownIcon },
                  { id: 'items', name: `Items (${po.items.length})`, icon: ArchiveBoxIcon },
                  { id: 'approval', name: 'Approval Workflow', icon: CheckCircleIcon },
                  { id: 'history', name: 'History', icon: ClockIcon }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className={`w-4 h-4 mr-2 ${
                      activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto bg-white">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* PO Summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Supplier Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <BuildingOffice2Icon className="w-5 h-5 mr-2" />
                        Supplier Details
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Name:</span> {po.supplier.name}</div>
                        <div><span className="font-medium">Contact:</span> {po.supplier.contact_person}</div>
                        <div><span className="font-medium">Email:</span> {po.supplier.email}</div>
                        <div><span className="font-medium">Phone:</span> {po.supplier.phone}</div>
                        <div><span className="font-medium">Address:</span> {po.supplier.address}</div>
                        <div><span className="font-medium">Rating:</span> {po.supplier.rating}/5 ⭐</div>
                        <div><span className="font-medium">Payment Terms:</span> {po.supplier.payment_terms}</div>
                      </div>
                    </div>

                    {/* Order Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                        Order Details
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Warehouse:</span> {po.warehouse.name}</div>
                        <div><span className="font-medium">Order Date:</span> {formatDate(po.order_date)}</div>
                        <div><span className="font-medium">Expected Delivery:</span> {formatDate(po.expected_delivery_date)}</div>
                        <div><span className="font-medium">Created By:</span> {po.created_by}</div>
                        {po.approved_by && (
                          <div><span className="font-medium">Approved By:</span> {po.approved_by} on {po.approved_at ? formatDate(po.approved_at) : 'N/A'}</div>
                        )}
                        {po.sent_at && (
                          <div><span className="font-medium">Sent:</span> {formatDate(po.sent_at)}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Auto-Generation Info */}
                  {po.is_auto_generated && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-blue-900 mb-2 flex items-center">
                        <BoltIcon className="w-5 h-5 mr-2" />
                        Auto-Generation Details
                      </h3>
                      <p className="text-blue-800 text-sm">{po.auto_generated_reason}</p>
                    </div>
                  )}

                  {/* Financial Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                      <BanknotesIcon className="w-5 h-5 mr-2" />
                      Financial Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(po.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax ({po.tax_rate}%):</span>
                          <span>{formatCurrency(po.tax_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shipping:</span>
                          <span>{formatCurrency(po.shipping_cost)}</span>
                        </div>
                      </div>
                      <div className="border-l border-gray-300 pl-4">
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total Amount:</span>
                          <span className="text-blue-600">{formatCurrency(po.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {(po.internal_notes || po.supplier_notes || po.terms_conditions) && (
                    <div className="space-y-4">
                      {po.internal_notes && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Internal Notes</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{po.internal_notes}</p>
                        </div>
                      )}
                      {po.supplier_notes && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Supplier Notes</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{po.supplier_notes}</p>
                        </div>
                      )}
                      {po.terms_conditions && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Terms & Conditions</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{po.terms_conditions}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'items' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Line Total</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {po.items.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="font-medium text-gray-900">{item.product_name}</div>
                                <div className="text-sm text-gray-500">{item.sku}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div>Ordered: <span className="font-medium">{item.quantity_ordered.toLocaleString()}</span></div>
                                <div className="text-gray-500">Received: {item.quantity_received.toLocaleString()}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(item.unit_cost)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(item.line_total)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(item.expected_date)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                              <div className="truncate" title={item.notes}>
                                {item.notes}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'approval' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Approval Workflow</h3>
                  {po.approval_workflow && po.approval_workflow.length > 0 ? (
                    <div className="space-y-4">
                      {po.approval_workflow.map((approval) => (
                        <div key={approval.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">Level {approval.approval_level}: {approval.approver_name}</h4>
                              <p className="text-sm text-gray-500">
                                {approval.status === 'pending' ? 'Awaiting approval' : 
                                 approval.status === 'approved' ? `Approved ${approval.decided_at ? `on ${formatDate(approval.decided_at)}` : ''}` :
                                 'Rejected'}
                              </p>
                              {approval.decision_notes && (
                                <p className="text-sm text-gray-600 mt-2">{approval.decision_notes}</p>
                              )}
                            </div>
                            <div>
                              {approval.status === 'pending' && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                                  Pending
                                </span>
                              )}
                              {approval.status === 'approved' && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                  Approved
                                </span>
                              )}
                              {approval.status === 'rejected' && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                  Rejected
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No approval workflow configured</p>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Purchase Order History</h3>
                  <div className="space-y-3">
                    {[
                      { action: 'PO Created', user: 'Auto-PO System', timestamp: po.order_date, details: 'Purchase order automatically generated due to low stock alerts' },
                      po.approved_at ? { action: 'PO Approved', user: po.approved_by || 'Unknown', timestamp: po.approved_at, details: 'Purchase order approved for sending to supplier' } : null,
                      po.sent_at ? { action: 'PO Sent', user: 'System', timestamp: po.sent_at, details: 'Purchase order sent to supplier via email' } : null
                    ].filter(Boolean).map((entry, index) => (
                      <div key={index} className="flex items-start space-x-3 pb-3 border-b border-gray-200 last:border-b-0">
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">{entry?.action}</h4>
                            <span className="text-sm text-gray-500">{entry?.timestamp ? formatDate(entry.timestamp) : ''}</span>
                          </div>
                          <p className="text-sm text-gray-600">{entry?.details}</p>
                          <p className="text-xs text-gray-500">by {entry?.user}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}