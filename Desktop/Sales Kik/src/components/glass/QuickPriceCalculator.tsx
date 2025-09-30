import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GlassDropdown } from './GlassDropdown';

interface QuickPriceCalculatorProps {
  glassQuoteData: any;
  onQuickUpdate: (updates: any) => void;
  customerId: string | null;
  className?: string;
}

export function QuickPriceCalculator({ glassQuoteData, onQuickUpdate, customerId, className }: QuickPriceCalculatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: glassTypes } = useQuery({
    queryKey: ['glassTypes'],
    queryFn: async () => {
      // Return the seeded glass types
      return [
        { id: 'glass-type-clear', name: 'Clear Glass', description: 'Standard clear float glass for general applications' },
        { id: 'glass-type-ultra-clear', name: 'Ultra Clear Glass', description: 'Low-iron glass with exceptional clarity and minimal green tint' },
        { id: 'glass-type-tinted', name: 'Tinted Glass', description: 'Solar control glass available in bronze, grey, and green tints' }
      ];
    }
  });

  const { data: products } = useQuery({
    queryKey: ['glassProducts', glassQuoteData.selectedGlassType?.id],
    queryFn: async () => {
      if (!glassQuoteData.selectedGlassType?.id) return [];
      
      // Same product data as ProductThicknessStep
      const allProducts = [
        // Clear Glass Products
        { id: '1', glassTypeId: 'glass-type-clear', productType: 'NOT_TOUGHENED', thickness: 4, basePrice: 25.50, isActive: true },
        { id: '2', glassTypeId: 'glass-type-clear', productType: 'NOT_TOUGHENED', thickness: 6, basePrice: 32.00, isActive: true },
        { id: '3', glassTypeId: 'glass-type-clear', productType: 'NOT_TOUGHENED', thickness: 8, basePrice: 38.50, isActive: true },
        { id: '4', glassTypeId: 'glass-type-clear', productType: 'TOUGHENED', thickness: 6, basePrice: 52.00, isActive: true },
        { id: '5', glassTypeId: 'glass-type-clear', productType: 'TOUGHENED', thickness: 8, basePrice: 58.50, isActive: true },
        { id: '6', glassTypeId: 'glass-type-clear', productType: 'TOUGHENED', thickness: 10, basePrice: 65.00, isActive: true },
        
        // Ultra Clear Glass Products (15% premium)
        { id: '7', glassTypeId: 'glass-type-ultra-clear', productType: 'NOT_TOUGHENED', thickness: 4, basePrice: 29.33, isActive: true },
        { id: '8', glassTypeId: 'glass-type-ultra-clear', productType: 'NOT_TOUGHENED', thickness: 6, basePrice: 36.80, isActive: true },
        { id: '9', glassTypeId: 'glass-type-ultra-clear', productType: 'NOT_TOUGHENED', thickness: 8, basePrice: 44.28, isActive: true },
        { id: '10', glassTypeId: 'glass-type-ultra-clear', productType: 'TOUGHENED', thickness: 6, basePrice: 59.80, isActive: true },
        { id: '11', glassTypeId: 'glass-type-ultra-clear', productType: 'TOUGHENED', thickness: 8, basePrice: 67.28, isActive: true },
        { id: '12', glassTypeId: 'glass-type-ultra-clear', productType: 'TOUGHENED', thickness: 10, basePrice: 74.75, isActive: true }
      ];
      
      return allProducts.filter(p => p.glassTypeId === glassQuoteData.selectedGlassType.id);
    },
    enabled: !!glassQuoteData.selectedGlassType
  });

  const quickRecalculate = (changes: any) => {
    const updatedData = { ...glassQuoteData, ...changes };
    onQuickUpdate(updatedData);
  };

  return (
    <div className={className}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-medium text-base flex items-center gap-2 shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span>Quick Calculator</span>
      </button>

      {isOpen && (
        <div className="absolute top-16 right-0 w-96 bg-white rounded-xl border border-gray-200 shadow-xl z-50">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500 rounded-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-blue-900">Quick Price Calculator</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Quick Glass Type Selector */}
            <GlassDropdown
              label="Glass Type"
              value={glassQuoteData.selectedGlassType?.id || ''}
              placeholder="Select Glass Type"
              options={glassTypes?.map((type: any) => ({
                value: type.id,
                label: type.name
              })) || []}
              onChange={(value) => {
                const glassType = glassTypes?.find((t: any) => t.id === value);
                quickRecalculate({ selectedGlassType: glassType, selectedProduct: null });
              }}
            />

            {/* Quick Thickness Selector */}
            <GlassDropdown
              label="Product & Thickness"
              value={glassQuoteData.selectedProduct?.id || ''}
              placeholder="Select Product"
              options={products?.map((product: any) => ({
                value: product.id,
                label: `${product.thickness}mm - $${product.basePrice.toFixed(2)}/m² (${product.productType.toLowerCase().replace('_', ' ')})`
              })) || []}
              onChange={(value) => {
                const product = products?.find((p: any) => p.id === value);
                quickRecalculate({ selectedProduct: product });
              }}
              disabled={!products?.length}
            />

            {/* Quick Dimension Input */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Qty</label>
                <input
                  type="number"
                  min="1"
                  value={glassQuoteData.quantity || 1}
                  onChange={(e) => quickRecalculate({ quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                <input
                  type="number"
                  min="1"
                  value={glassQuoteData.heightMm || ''}
                  onChange={(e) => quickRecalculate({ heightMm: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="mm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
                <input
                  type="number"
                  min="1"
                  value={glassQuoteData.widthMm || ''}
                  onChange={(e) => quickRecalculate({ widthMm: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="mm"
                />
              </div>
            </div>

            {/* Current Total */}
            {glassQuoteData.totalCost > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                  <h4 className="text-base font-bold text-blue-900 mb-3">Price Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Area:</span>
                      <span className="font-mono font-medium">{glassQuoteData.squareMeters.toFixed(2)} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Base Cost:</span>
                      <span className="font-mono font-medium">${glassQuoteData.totalBasePrice.toFixed(2)}</span>
                    </div>
                    {glassQuoteData.totalProcessingCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Processing:</span>
                        <span className="font-mono font-medium">${glassQuoteData.totalProcessingCost.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t border-blue-200 pt-2 mt-3">
                      <span className="text-blue-900">Total:</span>
                      <span className="font-mono text-[#6B7FCC] text-xl">${glassQuoteData.totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 text-center">
              Make changes here to update the main form
            </div>
          </div>
        </div>
      )}
    </div>
  );
}