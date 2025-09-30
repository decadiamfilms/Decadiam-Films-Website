import React, { useState, useEffect } from 'react';
import { PlusIcon as Plus, MinusIcon as Minus, PlusCircleIcon as PlusCircle, MinusCircleIcon as MinusCircle, XMarkIcon as X } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { Product, ProductInventory, StockAdjustment } from '@/types/inventory';

interface QuickAdjustmentModalProps {
  product: Product | null;
  warehouseId?: number;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const QuickAdjustmentModal: React.FC<QuickAdjustmentModalProps> = ({
  product,
  warehouseId,
  isOpen,
  onClose,
  onSaved
}) => {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<ProductInventory | null>(null);

  const presetReasons = {
    add: [
      'Stock received',
      'Return from customer',
      'Found during stocktake',
      'Correction',
      'Other'
    ],
    remove: [
      'Damaged',
      'Lost/Missing',
      'Quality issue',
      'Staff purchase',
      'Correction',
      'Other'
    ]
  };

  // Load current inventory when modal opens
  useEffect(() => {
    if (isOpen && product && warehouseId) {
      loadInventory();
    }
  }, [isOpen, product, warehouseId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuantity(1);
      setReason('');
      setNotes('');
      setAdjustmentType('add');
      setInventory(null);
    }
  }, [isOpen]);

  const loadInventory = async () => {
    if (!product || !warehouseId) return;
    
    try {
      const response = await fetch(`/api/inventory/product/${product.id}/warehouse/${warehouseId}`);
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      }
    } catch (error) {
      console.error('Failed to load inventory:', error);
    }
  };

  const handleSubmit = async () => {
    if (!product || !reason || quantity <= 0) return;
    
    setLoading(true);
    try {
      const adjustment: StockAdjustment = {
        product_id: product.id,
        warehouse_id: warehouseId || 1, // Default warehouse if not specified
        movement_type: 'adjustment',
        quantity: adjustmentType === 'add' ? quantity : -quantity,
        reason,
        notes
      };

      const response = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adjustment)
      });

      if (response.ok) {
        onSaved();
        onClose();
      } else {
        throw new Error('Failed to save adjustment');
      }
    } catch (error) {
      console.error('Error saving adjustment:', error);
      alert('Failed to save stock adjustment');
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  const currentStock = inventory?.quantity_available || 0;
  const newStock = currentStock + (adjustmentType === 'add' ? quantity : -quantity);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Stock Adjustment">
      <div className="space-y-6">
        {/* Product Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-lg">{product.name}</h3>
          <p className="text-gray-600">{product.sku}</p>
          <p className="text-sm text-gray-500">Current Stock: {currentStock}</p>
        </div>

        {/* Add/Remove Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setAdjustmentType('add')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-medium transition-colors ${
              adjustmentType === 'add'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <PlusCircle size={20} />
            Add Stock
          </button>
          <button
            onClick={() => setAdjustmentType('remove')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-medium transition-colors ${
              adjustmentType === 'remove'
                ? 'bg-red-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MinusCircle size={20} />
            Remove Stock
          </button>
        </div>

        {/* Quantity Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 p-0"
            >
              <Minus size={16} />
            </Button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 text-center text-2xl font-bold h-14 border rounded-lg px-3"
              min={1}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 p-0"
            >
              <Plus size={16} />
            </Button>
          </div>
          
          {/* Quick Quantity Buttons */}
          <div className="flex gap-2 mt-3">
            {[1, 5, 10, 20, 50].map(num => (
              <Button
                key={num}
                type="button"
                variant={quantity === num ? "primary" : "outline"}
                size="sm"
                onClick={() => setQuantity(num)}
              >
                {num}
              </Button>
            ))}
          </div>
        </div>

        {/* Reason Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason *
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            required
          >
            <option value="">Select a reason...</option>
            {presetReasons[adjustmentType].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional details..."
            rows={3}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* Preview Result */}
        <div className="bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">New Stock Level:</span>
            <span className={`text-xl font-bold ${
              newStock < 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {newStock}
            </span>
          </div>
          {newStock < 0 && (
            <p className="text-sm text-red-600 mt-1">
              Warning: This will result in negative stock
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!reason || quantity <= 0 || loading}
            className="flex-1"
          >
            {loading ? 'Saving...' : `${adjustmentType === 'add' ? 'Add' : 'Remove'} Stock`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default QuickAdjustmentModal;