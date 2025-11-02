import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, XMarkIcon, TruckIcon, CubeIcon,
  ExclamationTriangleIcon, ClockIcon, DocumentTextIcon,
  PhotoIcon, CalendarIcon, UserIcon, InformationCircleIcon,
  ClipboardDocumentCheckIcon, ArrowPathIcon, PlusIcon,
  MinusIcon, EyeIcon, PrinterIcon, ShieldCheckIcon
} from '@heroicons/react/24/outline';
import PurchaseOrderStateMachine from '../../services/PurchaseOrderStateMachine';
import PurchaseOrderWebSocketService from '../../services/PurchaseOrderWebSocketService';

interface LineItemReceipt {
  lineItemId: string;
  productName: string;
  productSku: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityToReceive: number;
  unitPrice: number;
  discrepancy: number;
  notes?: string;
  hasDiscrepancy: boolean;
}

interface GoodsReceiptManagerProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: any;
  onReceiptCompleted: (order: any) => void;
}

export default function GoodsReceiptManager({ 
  isOpen, 
  onClose, 
  purchaseOrder, 
  onReceiptCompleted 
}: GoodsReceiptManagerProps) {
  const [lineItemReceipts, setLineItemReceipts] = useState<LineItemReceipt[]>([]);
  const [receiptNotes, setReceiptNotes] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [receivedBy, setReceivedBy] = useState('');
  const [deliveryCondition, setDeliveryCondition] = useState<'GOOD' | 'DAMAGED' | 'PARTIAL'>('GOOD');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showDiscrepancyReport, setShowDiscrepancyReport] = useState(false);

  useEffect(() => {
    if (isOpen && purchaseOrder) {
      initializeReceipts();
    }
  }, [isOpen, purchaseOrder]);

  const initializeReceipts = () => {
    const receipts: LineItemReceipt[] = purchaseOrder.lineItems.map((item: any) => ({
      lineItemId: item.id,
      productName: item.product.name,
      productSku: item.product.sku,
      quantityOrdered: item.quantityOrdered,
      quantityReceived: item.quantityReceived || 0,
      quantityToReceive: item.quantityOrdered - (item.quantityReceived || 0),
      unitPrice: item.unitPrice,
      discrepancy: 0,
      hasDiscrepancy: false,
      notes: ''
    }));

    setLineItemReceipts(receipts);
    setReceivedBy('current-user'); // Replace with actual user name
  };

  const updateReceiptQuantity = (lineItemId: string, quantity: number) => {
    setLineItemReceipts(receipts => 
      receipts.map(receipt => {
        if (receipt.lineItemId === lineItemId) {
          const newQuantityReceived = (receipt.quantityReceived || 0) + quantity;
          const discrepancy = receipt.quantityOrdered - newQuantityReceived;
          return {
            ...receipt,
            quantityToReceive: quantity,
            discrepancy: Math.abs(discrepancy),
            hasDiscrepancy: discrepancy !== 0
          };
        }
        return receipt;
      })
    );
  };

  const updateReceiptNotes = (lineItemId: string, notes: string) => {
    setLineItemReceipts(receipts => 
      receipts.map(receipt => 
        receipt.lineItemId === lineItemId 
          ? { ...receipt, notes }
          : receipt
      )
    );
  };

  const calculateReceiptSummary = () => {
    const totalItems = lineItemReceipts.length;
    const itemsWithDiscrepancies = lineItemReceipts.filter(r => r.hasDiscrepancy).length;
    const fullyReceived = lineItemReceipts.filter(r => 
      (r.quantityReceived + r.quantityToReceive) >= r.quantityOrdered
    ).length;
    const partiallyReceived = totalItems - fullyReceived;

    return {
      totalItems,
      fullyReceived,
      partiallyReceived,
      itemsWithDiscrepancies,
      isCompleteReceipt: fullyReceived === totalItems && itemsWithDiscrepancies === 0
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (fileName: string) => {
    setAttachments(attachments.filter(file => file.name !== fileName));
  };

  const processGoodsReceipt = async () => {
    if (!receivedBy.trim()) {
      alert('Please specify who received the goods');
      return;
    }

    const summary = calculateReceiptSummary();
    
    if (summary.itemsWithDiscrepancies > 0 && !showDiscrepancyReport) {
      setShowDiscrepancyReport(true);
      return;
    }

    try {
      const stateMachine = PurchaseOrderStateMachine.getInstance();
      
      // Prepare receipt data
      const receiptData = lineItemReceipts.map(receipt => ({
        lineItemId: receipt.lineItemId,
        quantityReceived: receipt.quantityToReceive
      }));

      // Execute state transition
      const result = await stateMachine.markAsReceived(
        purchaseOrder.id, 
        receiptData, 
        'WAREHOUSE_STAFF'
      );

      if (result.success) {
        // Log goods receipt
        const receiptLog = {
          id: Date.now().toString(),
          purchaseOrderId: purchaseOrder.id,
          receiptDate: new Date(receiptDate),
          receivedBy,
          deliveryCondition,
          lineItemReceipts,
          receiptNotes,
          attachments: attachments.map(file => ({
            filename: file.name,
            fileSize: file.size,
            fileType: file.type
          })),
          createdAt: new Date(),
          isCompleteReceipt: summary.isCompleteReceipt
        };

        const existingReceipts = JSON.parse(localStorage.getItem('saleskik-goods-receipts') || '[]');
        existingReceipts.push(receiptLog);
        localStorage.setItem('saleskik-goods-receipts', JSON.stringify(existingReceipts));

        // Broadcast goods receipt to all users
        const wsService = PurchaseOrderWebSocketService.getInstance();
        wsService.notifyGoodsReceived(result.order, receiptLog);

        alert(`Goods receipt processed successfully. Order status: ${result.newStatus}`);
        onReceiptCompleted(result.order);
        onClose();
      } else {
        alert(`Error processing receipt: ${result.message}`);
      }
    } catch (error) {
      console.error('Error processing goods receipt:', error);
      alert('Failed to process goods receipt');
    }
  };

  const summary = calculateReceiptSummary();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-600 rounded-lg">
              <TruckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Goods Receipt</h3>
              <p className="text-gray-600">Purchase Order {purchaseOrder?.purchaseOrderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-6">
          
          {/* Receipt Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Date *</label>
              <input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Received By *</label>
              <input
                type="text"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                placeholder="Employee name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Condition</label>
              <select
                value={deliveryCondition}
                onChange={(e) => setDeliveryCondition(e.target.value as 'GOOD' | 'DAMAGED' | 'PARTIAL')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="GOOD">Good Condition</option>
                <option value="DAMAGED">Some Damage</option>
                <option value="PARTIAL">Partial Delivery</option>
              </select>
            </div>
          </div>

          {/* Line Items Receipt */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">Items to Receive</h4>
              <p className="text-sm text-gray-600">Enter quantities received for each item</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Ordered
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Previously Received
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Receiving Now
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lineItemReceipts.map((receipt, index) => (
                    <tr key={receipt.lineItemId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{receipt.productName}</div>
                          <div className="text-sm text-gray-600 font-mono">{receipt.productSku}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-bold text-blue-600">{receipt.quantityOrdered}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-medium text-gray-600">{receipt.quantityReceived}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max={receipt.quantityOrdered - receipt.quantityReceived}
                          value={receipt.quantityToReceive}
                          onChange={(e) => updateReceiptQuantity(receipt.lineItemId, parseInt(e.target.value) || 0)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        {receipt.hasDiscrepancy ? (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            Discrepancy
                          </span>
                        ) : (receipt.quantityReceived + receipt.quantityToReceive) >= receipt.quantityOrdered ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Complete
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            Partial
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="text"
                          value={receipt.notes || ''}
                          onChange={(e) => updateReceiptNotes(receipt.lineItemId, e.target.value)}
                          placeholder="Receipt notes..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Receipt Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3">Receipt Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-900">{summary.totalItems}</div>
                <div className="text-sm text-blue-700">Total Items</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-900">{summary.fullyReceived}</div>
                <div className="text-sm text-green-700">Fully Received</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-900">{summary.partiallyReceived}</div>
                <div className="text-sm text-yellow-700">Partial/Pending</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-900">{summary.itemsWithDiscrepancies}</div>
                <div className="text-sm text-red-700">Discrepancies</div>
              </div>
            </div>
            
            {summary.isCompleteReceipt && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">Complete receipt - ready to process</span>
                </div>
              </div>
            )}
          </div>

          {/* Receipt Notes and Documentation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">General Receipt Notes</label>
              <textarea
                value={receiptNotes}
                onChange={(e) => setReceiptNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Overall condition, delivery notes, any issues..."
              />
            </div>
            
            {/* Photo Documentation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Photo Documentation</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="receipt-photos"
                />
                <label htmlFor="receipt-photos" className="cursor-pointer">
                  <PhotoIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600">Upload photos</span>
                  </p>
                  <p className="text-xs text-gray-500">Delivery condition, packaging, etc.</p>
                </label>
              </div>
              
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      <button
                        onClick={() => removeAttachment(file.name)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Discrepancy Report */}
          {showDiscrepancyReport && summary.itemsWithDiscrepancies > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                <h4 className="font-medium text-red-900">Discrepancy Report Required</h4>
              </div>
              
              <div className="space-y-3">
                {lineItemReceipts.filter(r => r.hasDiscrepancy).map(receipt => (
                  <div key={receipt.lineItemId} className="bg-white border border-red-200 rounded p-3">
                    <div className="font-medium text-gray-900">{receipt.productName}</div>
                    <div className="text-sm text-red-700">
                      Ordered: {receipt.quantityOrdered} • 
                      Receiving: {receipt.quantityToReceive} • 
                      Discrepancy: {receipt.discrepancy}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setShowDiscrepancyReport(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Proceed Anyway
                </button>
                <button
                  onClick={() => setShowDiscrepancyReport(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Review Quantities
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {summary.isCompleteReceipt ? (
                <span className="text-green-600 font-medium">✓ Ready to process complete receipt</span>
              ) : (
                <span className="text-yellow-600 font-medium">⚠ Partial receipt will be processed</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={processGoodsReceipt}
                disabled={!receivedBy.trim()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Process Receipt
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}