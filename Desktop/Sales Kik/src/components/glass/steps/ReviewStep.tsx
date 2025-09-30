import React from 'react';

interface ReviewStepProps {
  glassQuoteData: any;
  onUpdate: (updates: any) => void;
}

export function ReviewStep({ glassQuoteData, onUpdate }: ReviewStepProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Review & Add to Quote</h2>
      <p className="text-gray-600 mb-6">
        Review your glass specifications before adding to the quote.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Glass Specifications */}
        <div className="card p-6 bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Glass Specifications</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium">{glassQuoteData.selectedGlassType?.name || 'Not selected'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Product:</span>
              <span className="font-medium">
                {glassQuoteData.selectedProduct 
                  ? `${glassQuoteData.selectedProduct.thickness}mm ${glassQuoteData.selectedProductType?.toLowerCase().replace('_', ' ')}`
                  : 'Not selected'
                }
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Dimensions:</span>
              <span className="font-medium">
                {glassQuoteData.heightMm && glassQuoteData.widthMm 
                  ? `${glassQuoteData.heightMm}mm × ${glassQuoteData.widthMm}mm`
                  : 'Not specified'
                }
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Quantity:</span>
              <span className="font-medium">{glassQuoteData.quantity} panel(s)</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Total Area:</span>
              <span className="font-medium">{glassQuoteData.squareMeters.toFixed(2)} m²</span>
            </div>
            
            {glassQuoteData.itemCode && (
              <div className="flex justify-between">
                <span className="text-gray-600">Item Code:</span>
                <span className="font-medium">{glassQuoteData.itemCode}</span>
              </div>
            )}
            
            {glassQuoteData.selectedTemplate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Template:</span>
                <span className="font-medium">{glassQuoteData.selectedTemplate.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="card p-6 bg-[#6B7FCC]/5 border-[#6B7FCC]/20">
          <h3 className="text-lg font-semibold text-[#6B7FCC] mb-4">Cost Breakdown</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-700">Base Glass Cost:</span>
              <span className="font-medium text-gray-900">
                ${glassQuoteData.totalBasePrice.toFixed(2)}
              </span>
            </div>
            
            {glassQuoteData.edgeworkCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-700">Edgework:</span>
                <span className="font-medium text-gray-900">${glassQuoteData.edgeworkCost.toFixed(2)}</span>
              </div>
            )}
            
            {glassQuoteData.cornerFinishCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-700">Corner Finish:</span>
                <span className="font-medium text-gray-900">${glassQuoteData.cornerFinishCost.toFixed(2)}</span>
              </div>
            )}
            
            {glassQuoteData.holesCutoutsCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-700">Holes & Cutouts:</span>
                <span className="font-medium text-gray-900">${glassQuoteData.holesCutoutsCost.toFixed(2)}</span>
              </div>
            )}
            
            {glassQuoteData.servicesCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-700">Services:</span>
                <span className="font-medium text-gray-900">${glassQuoteData.servicesCost.toFixed(2)}</span>
              </div>
            )}
            
            {glassQuoteData.surfaceFinishCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-700">Surface Finish:</span>
                <span className="font-medium text-gray-900">${glassQuoteData.surfaceFinishCost.toFixed(2)}</span>
              </div>
            )}
            
            {glassQuoteData.totalProcessingCost > 0 && (
              <div className="flex justify-between pt-2 border-t border-blue-200">
                <span className="text-gray-700">Total Processing:</span>
                <span className="font-medium text-gray-900">${glassQuoteData.totalProcessingCost.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between pt-2 border-t-2 border-[#6B7FCC]/30">
              <span className="text-gray-900 font-semibold text-lg">Total Cost:</span>
              <span className="font-bold text-xl text-[#6B7FCC]">${glassQuoteData.totalCost.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reference Photo */}
      {glassQuoteData.photoUrl && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Reference Photo</h3>
          <div className="max-w-sm">
            <img 
              src={glassQuoteData.photoUrl} 
              alt="Glass reference" 
              className="w-full h-48 object-cover rounded-lg border border-gray-300"
            />
          </div>
        </div>
      )}

      {/* Validation Message */}
      {(!glassQuoteData.selectedGlassType || !glassQuoteData.selectedProduct || !glassQuoteData.heightMm || !glassQuoteData.widthMm) && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex">
            <svg className="w-5 h-5 text-amber-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-amber-800">
              <p className="font-medium">Please complete required fields:</p>
              <ul className="mt-1 text-sm">
                {!glassQuoteData.selectedGlassType && <li>• Glass type selection</li>}
                {!glassQuoteData.selectedProduct && <li>• Product type and thickness</li>}
                {!glassQuoteData.heightMm && <li>• Height dimension</li>}
                {!glassQuoteData.widthMm && <li>• Width dimension</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}