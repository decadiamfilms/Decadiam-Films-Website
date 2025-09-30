import React, { useState } from 'react';
import { XMarkIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface PendingApproval {
  id: string;
  poNumber: string;
  customerName: string;
  supplierName: string;
  totalAmount: number;
  createdBy: string;
  createdDate: string;
  priority: 'normal' | 'high' | 'urgent';
  lineItemCount: number;
  reason: string;
}

interface ApprovalWorkflowEngineProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApprovalWorkflowEngine({ isOpen, onClose }: ApprovalWorkflowEngineProps) {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([
    {
      id: '1',
      poNumber: 'PO-2025-00148',
      customerName: 'Metro Building Corp',
      supplierName: 'Hardware Direct',
      totalAmount: 1250.00,
      createdBy: 'Mike Johnson',
      createdDate: '2025-09-14',
      priority: 'normal',
      lineItemCount: 4,
      reason: 'Order value exceeds $1,000 threshold'
    },
    {
      id: '2', 
      poNumber: 'PO-2025-00150',
      customerName: 'City Plaza Development',
      supplierName: 'Premium Glass Solutions',
      totalAmount: 3200.00,
      createdBy: 'Sarah Peterson',
      createdDate: '2025-09-14',
      priority: 'high',
      lineItemCount: 6,
      reason: 'Order value exceeds $2,000 threshold'
    }
  ]);

  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [approvalComment, setApprovalComment] = useState('');

  const handleApprove = (approval: PendingApproval) => {
    setPendingApprovals(prev => prev.filter(a => a.id !== approval.id));
    setSelectedApproval(null);
    setApprovalComment('');
    alert(`Purchase Order ${approval.poNumber} approved! Order status updated to 'Approved' and ready to send to supplier.`);
  };

  const handleReject = (approval: PendingApproval) => {
    if (!approvalComment.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    setPendingApprovals(prev => prev.filter(a => a.id !== approval.id));
    setSelectedApproval(null);
    setApprovalComment('');
    alert(`Purchase Order ${approval.poNumber} rejected. Creator will be notified.`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Approval Workflow Engine</h2>
            <p className="text-sm text-gray-600 mt-1">Review and approve pending purchase orders - Following your Step 2 workflow</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[70vh]">
          {/* Left Panel - Pending Approvals List */}
          <div className="w-1/2 border-r overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Pending Approvals ({pendingApprovals.length})</h3>
              
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No pending approvals</p>
                  <p className="text-sm text-gray-500">All purchase orders are approved!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map((approval) => (
                    <div
                      key={approval.id}
                      onClick={() => setSelectedApproval(approval)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedApproval?.id === approval.id 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'hover:bg-gray-50'
                      } ${approval.priority === 'urgent' ? 'border-l-4 border-l-red-500' : 
                          approval.priority === 'high' ? 'border-l-4 border-l-orange-500' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-gray-900">{approval.poNumber}</div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-orange-500" />
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            approval.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            approval.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {approval.priority.charAt(0).toUpperCase() + approval.priority.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div><strong>Customer:</strong> {approval.customerName}</div>
                        <div><strong>Supplier:</strong> {approval.supplierName}</div>
                        <div><strong>Amount:</strong> ${approval.totalAmount.toFixed(2)}</div>
                        <div><strong>Created by:</strong> {approval.createdBy}</div>
                        <div><strong>Reason:</strong> {approval.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Approval Details */}
          <div className="w-1/2 overflow-y-auto">
            <div className="p-6">
              {selectedApproval ? (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Review Purchase Order</h3>
                  
                  {/* Order Details Card */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 mb-4">Order Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>PO Number:</strong> {selectedApproval.poNumber}</div>
                      <div><strong>Date Created:</strong> {selectedApproval.createdDate}</div>
                      <div><strong>Customer:</strong> {selectedApproval.customerName}</div>
                      <div><strong>Supplier:</strong> {selectedApproval.supplierName}</div>
                      <div><strong>Total Amount:</strong> ${selectedApproval.totalAmount.toFixed(2)}</div>
                      <div><strong>Line Items:</strong> {selectedApproval.lineItemCount}</div>
                      <div><strong>Priority:</strong> {selectedApproval.priority.charAt(0).toUpperCase() + selectedApproval.priority.slice(1)}</div>
                      <div><strong>Created By:</strong> {selectedApproval.createdBy}</div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                      <strong>Approval Reason:</strong> {selectedApproval.reason}
                    </div>
                  </div>

                  {/* Business Justification */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="font-medium text-blue-900 mb-3">Business Justification</h4>
                    <div className="text-sm text-blue-800 space-y-2">
                      <div>✓ Customer project requirements verified</div>
                      <div>✓ Supplier performance rating: 4.2/5 stars</div>
                      <div>✓ Budget allocation confirmed</div>
                      <div>✓ Delivery timeline acceptable</div>
                    </div>
                  </div>

                  {/* Approval Actions */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Approval Comments (Required for rejection)
                      </label>
                      <textarea
                        value={approvalComment}
                        onChange={(e) => setApprovalComment(e.target.value)}
                        placeholder="Enter your approval or rejection comments..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(selectedApproval)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                        Approve Order
                      </button>
                      <button
                        onClick={() => handleReject(selectedApproval)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                      >
                        <XCircleIcon className="w-5 h-5" />
                        Reject Order
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClockIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600">Select an order to review</p>
                  <p className="text-sm text-gray-500">Choose a pending approval from the left panel</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}