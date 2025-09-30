import React, { useState, useCallback, useEffect } from 'react';

interface DimensionsStepProps {
  glassQuoteData: any;
  onUpdate: (updates: any) => void;
}

export function DimensionsStep({ glassQuoteData, onUpdate }: DimensionsStepProps) {
  const [photoUploading, setPhotoUploading] = useState(false);

  const calculateSquareMeters = useCallback(() => {
    const height = parseFloat(glassQuoteData.heightMm) || 0;
    const width = parseFloat(glassQuoteData.widthMm) || 0;
    const quantity = parseInt(glassQuoteData.quantity) || 0;
    
    if (height > 0 && width > 0) {
      const sqmPerPanel = (height / 1000) * (width / 1000);
      const totalSqm = sqmPerPanel * quantity;
      onUpdate({ squareMeters: totalSqm });
    }
  }, [glassQuoteData.heightMm, glassQuoteData.widthMm, glassQuoteData.quantity, onUpdate]);

  useEffect(() => {
    calculateSquareMeters();
  }, [calculateSquareMeters]);

  const handlePhotoUpload = async (file: File) => {
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/upload/glass-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Photo upload failed');
      }
      
      const { photoUrl } = await response.json();
      onUpdate({ photoFile: file, photoUrl });
    } catch (error) {
      console.error('Photo upload failed:', error);
      // For now, create a temporary URL for preview
      const tempUrl = URL.createObjectURL(file);
      onUpdate({ photoFile: file, photoUrl: tempUrl });
    }
    setPhotoUploading(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Quantity & Dimensions</h2>
      <p className="text-gray-600 mb-6">
        Enter the exact dimensions and quantity needed for your project.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Dimensions */}
        <div className="space-y-6">
          <div>
            <label className="label mb-2 block">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={glassQuoteData.quantity}
              onChange={(e) => onUpdate({ quantity: parseInt(e.target.value) || 1 })}
              className="input"
            />
          </div>
          
          <div>
            <label className="label mb-2 block">
              Height (mm)
            </label>
            <input
              type="number"
              min="1"
              value={glassQuoteData.heightMm}
              onChange={(e) => onUpdate({ heightMm: e.target.value })}
              placeholder="Enter height in millimeters"
              className="input"
            />
          </div>
          
          <div>
            <label className="label mb-2 block">
              Width (mm)
            </label>
            <input
              type="number"
              min="1"
              value={glassQuoteData.widthMm}
              onChange={(e) => onUpdate({ widthMm: e.target.value })}
              placeholder="Enter width in millimeters"
              className="input"
            />
          </div>
          
          <div>
            <label className="label mb-2 block">
              Item/Reference Code (Optional)
            </label>
            <input
              type="text"
              value={glassQuoteData.itemCode}
              onChange={(e) => onUpdate({ itemCode: e.target.value })}
              placeholder="e.g. PANEL-001, PROJECT-ABC"
              className="input"
            />
          </div>
        </div>

        {/* Right Column - Photo & Calculations */}
        <div className="space-y-6">
          <div>
            <label className="label mb-2 block">
              Reference Photo (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              {glassQuoteData.photoUrl ? (
                <div>
                  <img 
                    src={glassQuoteData.photoUrl} 
                    alt="Glass reference" 
                    className="max-w-full h-32 object-cover mx-auto rounded mb-3"
                  />
                  <button
                    onClick={() => onUpdate({ photoUrl: null, photoFile: null })}
                    className="text-red-600 text-sm hover:text-red-800 underline"
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <div>
                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                    className="hidden"
                    id="photo-upload"
                    disabled={photoUploading}
                  />
                  <label 
                    htmlFor="photo-upload" 
                    className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {photoUploading ? 'Uploading...' : 'Click to upload photo'}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Calculation Summary */}
          {glassQuoteData.squareMeters > 0 && (
            <div className="card p-4 bg-[#6B7FCC]/5 border-[#6B7FCC]/20">
              <h4 className="font-semibold text-[#6B7FCC] mb-3">Calculation Summary</h4>
              <div className="text-sm text-gray-700 space-y-2">
                <div className="flex justify-between">
                  <span>Dimensions:</span>
                  <span className="font-mono">{glassQuoteData.heightMm}mm × {glassQuoteData.widthMm}mm</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span className="font-mono">{glassQuoteData.quantity} panel(s)</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total Area:</span>
                  <span className="font-mono">{glassQuoteData.squareMeters.toFixed(2)} m²</span>
                </div>
                {glassQuoteData.selectedProduct && (
                  <div className="pt-2 border-t border-blue-200">
                    <div className="flex justify-between">
                      <span>Price per m²:</span>
                      <span className="font-mono">${glassQuoteData.selectedProduct.basePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Base Cost:</span>
                      <span className="font-mono text-[#6B7FCC]">${(glassQuoteData.squareMeters * glassQuoteData.selectedProduct.basePrice).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick measurement guide */}
          <div className="card p-4 bg-gray-50">
            <h4 className="font-semibold text-gray-900 mb-2">Measurement Tips</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Measure in millimeters for accuracy</li>
              <li>• Double-check dimensions before proceeding</li>
              <li>• Include any tolerances in your measurements</li>
              <li>• Reference photos help ensure accuracy</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}