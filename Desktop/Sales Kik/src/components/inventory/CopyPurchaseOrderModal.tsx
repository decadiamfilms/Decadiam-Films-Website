import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/outline';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  selected: boolean;
  newQuantity: number;
}

interface CopyPurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: any;
  onCopyComplete: (newOrder: any) => void;
}

export function CopyPurchaseOrderModal({ isOpen, onClose, purchaseOrder, onCopyComplete }: CopyPurchaseOrderModalProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [reason, setReason] = useState('damaged_items');
  const [notes, setNotes] = useState('');
  const [newPoNumber, setNewPoNumber] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');

  useEffect(() => {
    if (purchaseOrder && isOpen) {
      // Mock line items for the original order
      const mockItems: LineItem[] = [
        { id: '1', description: 'Toughened Glass Panel 10mm', quantity: 5, unitPrice: 245.00, total: 1225.00, selected: false, newQuantity: 1 },
        { id: '2', description: 'Window Frame Assembly', quantity: 3, unitPrice: 180.00, total: 540.00, selected: false, newQuantity: 1 },
        { id: '3', description: 'Sealing Kit Premium', quantity: 2, unitPrice: 85.00, total: 170.00, selected: false, newQuantity: 1 },
        { id: '4', description: 'Installation Hardware Set', quantity: 1, unitPrice: 125.00, total: 125.00, selected: false, newQuantity: 1 }
      ];
      
      setLineItems(mockItems);
      setNewPoNumber(`${purchaseOrder.poNumber}-R${Date.now().toString().slice(-3)}`);
      setSelectedSupplier(purchaseOrder.supplierName); // Default to original supplier
    }
  }, [purchaseOrder, isOpen]);

  // Mock supplier list - in production this would come from API
  const availableSuppliers = [
    'Sydney Glass Co',
    'Hardware Direct', 
    'Building Supplies Ltd',
    'Steel Works Ltd.',
    'Custom Cabinet Co',
    'Glass & Glazing Pro',
    'Alternative Glass Solutions',
    'Metro Hardware Supply',
    'Premium Building Materials',
    'Express Trade Supplies'
  ];

  const handleItemToggle = (itemId: string) => {
    setLineItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, selected: !item.selected } : item
    ));
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      setLineItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, newQuantity } : item
      ));
    }
  };

  const selectedItems = lineItems.filter(item => item.selected);
  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.unitPrice * item.newQuantity), 0);

  const handleSubmit = () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to reorder');
      return;
    }

    if (!selectedSupplier) {
      alert('Please select a supplier for the reorder');
      return;
    }

    const newOrder = {
      id: `reorder-${Date.now()}`,
      poNumber: newPoNumber,
      customerName: purchaseOrder.customerName,
      customerReference: `Reorder - ${purchaseOrder.customerReference || purchaseOrder.poNumber}`,
      supplierName: selectedSupplier,
      totalAmount: totalAmount,
      status: 'draft',
      priority: reason === 'damaged_items' ? 'urgent' : 'normal',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lineItemCount: selectedItems.length,
      invoiceRequired: true,
      invoiceCreated: false,
      dispatchBlocked: false,
      approvalRequired: totalAmount > 2000,
      createdBy: 'System (Reorder)',
      attachmentCount: 0,
      orderSummary: selectedItems.map(item => `${item.newQuantity}x ${item.description}`).join(', '),
      lastActivity: 'Just created',
      notes: `Reorder from ${purchaseOrder.poNumber} - Reason: ${reason.replace('_', ' ')}${notes ? ` - Notes: ${notes}` : ''}`,
      originalOrderId: purchaseOrder.id,
      lineItems: selectedItems.map(item => ({
        id: `${item.id}-reorder`,
        description: item.description,
        quantity: item.newQuantity,
        unitPrice: item.unitPrice,
        total: item.unitPrice * item.newQuantity
      }))
    };

    onCopyComplete(newOrder);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Copy Purchase Order</h2>
            <p className="text-sm text-gray-600 mt-1">Select items to reorder from {purchaseOrder.poNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Reason for Reorder */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Reorder
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="damaged_items">Damaged Items Received</option>
              <option value="incorrect_items">Incorrect Items Received</option>
              <option value="missing_items">Missing Items</option>
              <option value="quality_issues">Quality Issues</option>
              <option value="additional_needed">Additional Quantities Needed</option>
              <option value="other">Other Reason</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* New PO Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Purchase Order Number
              </label>
              <input
                type="text"
                value={newPoNumber}
                onChange={(e) => setNewPoNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Supplier Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier
              </label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Supplier</option>
                {availableSuppliers.map(supplier => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </select>
              {selectedSupplier !== purchaseOrder.supplierName && selectedSupplier && (
                <div className="mt-1 text-xs text-orange-600 flex items-center">
                  <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                  Changing from original supplier: {purchaseOrder.supplierName}
                </div>
              )}
            </div>
          </div>

          {/* Items Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Select Items to Reorder</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setLineItems(prev => prev.map(item => ({ ...item, selected: true })))}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
                <button
                  onClick={() => setLineItems(prev => prev.map(item => ({ ...item, selected: false })))}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Select</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Item</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Original Qty</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Reorder Qty</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Unit Price</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lineItems.map((item) => (
                    <tr key={item.id} className={item.selected ? 'bg-blue-50' : ''}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => handleItemToggle(item.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.newQuantity - 1)}
                            disabled={item.newQuantity <= 1}
                            className="p-1 text-gray-600 hover:text-gray-800 disabled:text-gray-300"
                          >
                            <MinusIcon className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.newQuantity}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center"
                          />
                          <button
                            onClick={() => handleQuantityChange(item.id, item.newQuantity + 1)}
                            className="p-1 text-gray-600 hover:text-gray-800"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                        ${item.selected ? (item.unitPrice * item.newQuantity).toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any specific notes about this reorder..."
            />
          </div>

          {/* Summary */}
          {selectedItems.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-2">Reorder Summary</h4>
              <div className="text-sm text-blue-800">
                <div>Items selected: {selectedItems.length}</div>
                <div>Total quantity: {selectedItems.reduce((sum, item) => sum + item.newQuantity, 0)}</div>
                <div className="font-semibold">Total amount: ${totalAmount.toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedItems.length > 0 ? (
              `${selectedItems.length} items selected • $${totalAmount.toFixed(2)} total`
            ) : (
              'No items selected'
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedItems.length === 0 || !selectedSupplier}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
            >
              <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
              Create Reorder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}