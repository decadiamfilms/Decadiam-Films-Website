import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon, PencilIcon, CheckIcon, XMarkIcon,
  ChevronDownIcon, ChevronRightIcon
} from '@heroicons/react/24/outline';

interface GlassType {
  id: string;
  name: string;
  basePrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function GlassModuleAdminSimple() {
  const queryClient = useQueryClient();
  
  // Form state - all in one simple form
  const [glassTypeName, setGlassTypeName] = useState('');
  const [thicknessList, setThicknessList] = useState<{thickness: number; price: number}[]>([]);
  const [newThickness, setNewThickness] = useState('');
  const [newPrice, setNewPrice] = useState('');
  
  // Section visibility
  const [showProcessing, setShowProcessing] = useState(false);
  const [showCustomers, setShowCustomers] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  
  const { data: glassTypes } = useQuery<GlassType[]>({
    queryKey: ['admin-glass-types'],
    queryFn: async () => {
      const response = await fetch('/api/glass/types', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch glass types');
      return response.json();
    }
  });

  return (
    <div className="space-y-6">
      
      {/* Simple Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 text-xl mb-2">Glass Configuration</h3>
        <p className="text-gray-600">Create and manage glass product types with complete pricing</p>
      </div>

      {/* Existing Glass Types */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Existing Glass Types</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {glassTypes?.map(type => (
              <div key={type.id} className="border rounded-lg p-4 hover:border-blue-300">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{type.name}</h4>
                    <p className="text-sm text-green-600">${type.basePrice}/m²</p>
                  </div>
                  <button className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Configuration Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 space-y-6">
          
          {/* 1. Glass Type Name */}
          <div>
            <h4 className="font-medium text-gray-900 text-lg mb-3">Glass Type Name</h4>
            <input
              type="text"
              value={glassTypeName}
              onChange={(e) => setGlassTypeName(e.target.value)}
              placeholder="e.g., Ultra Clear Glass"
              className="max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>

          {/* 2. Thicknesses & Individual Pricing */}
          <div>
            <h4 className="font-medium text-gray-900 text-lg mb-3">Thicknesses & Individual Pricing</h4>
            
            {/* Add Thickness */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thickness</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newThickness}
                      onChange={(e) => setNewThickness(e.target.value)}
                      placeholder="e.g. 6, 12, 18, 25"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-4 top-3.5 text-gray-500 font-medium">mm</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per m²</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-gray-500">$</span>
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="120.00"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const thickness = parseFloat(newThickness);
                    const price = parseFloat(newPrice);
                    if (thickness && price) {
                      setThicknessList(prev => [...prev, { thickness, price }].sort((a, b) => a.thickness - b.thickness));
                      setNewThickness('');
                      setNewPrice('');
                    }
                  }}
                  disabled={!newThickness || !newPrice}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  Add
                </button>
              </div>
            </div>
            
            {/* Current Thicknesses */}
            {thicknessList.length > 0 && (
              <div className="space-y-2">
                {thicknessList.map((item, index) => (
                  <div key={index} className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <span className="font-bold text-blue-900">{item.thickness}mm</span>
                      <span className="text-green-600 font-bold ml-4">${item.price}/m²</span>
                    </div>
                    <button
                      onClick={() => setThicknessList(prev => prev.filter((_, i) => i !== index))}
                      className="p-1 text-blue-600 hover:text-red-600"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Processing Options (Collapsible) */}
          {thicknessList.length > 0 && (
            <div>
              <button
                onClick={() => setShowProcessing(!showProcessing)}
                className="flex items-center gap-2 font-medium text-gray-900 text-lg mb-3 hover:text-blue-600"
              >
                {showProcessing ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
                Processing Options (Edgework, Corners, Holes, Services, Finishes)
              </button>
              
              {showProcessing && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <p className="text-sm text-gray-600">Set rates for processing options - these adjust dynamically based on thickness</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="text-center">
                      <h5 className="font-medium text-gray-900 mb-2">Edgework</h5>
                      <div className="text-sm text-gray-600">$8-30/meter</div>
                    </div>
                    <div className="text-center">
                      <h5 className="font-medium text-gray-900 mb-2">Corners</h5>
                      <div className="text-sm text-gray-600">$8-15/piece</div>
                    </div>
                    <div className="text-center">
                      <h5 className="font-medium text-gray-900 mb-2">Holes</h5>
                      <div className="text-sm text-gray-600">$12-35/piece</div>
                    </div>
                    <div className="text-center">
                      <h5 className="font-medium text-gray-900 mb-2">Services</h5>
                      <div className="text-sm text-gray-600">$35-75 fixed</div>
                    </div>
                    <div className="text-center">
                      <h5 className="font-medium text-gray-900 mb-2">Finishes</h5>
                      <div className="text-sm text-gray-600">$12-25/unit</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Customer Pricing (Collapsible) */}
          {thicknessList.length > 0 && (
            <div>
              <button
                onClick={() => setShowCustomers(!showCustomers)}
                className="flex items-center gap-2 font-medium text-gray-900 text-lg mb-3 hover:text-blue-600"
              >
                {showCustomers ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
                Customer Pricing Tiers (T1/T2/T3/Retail)
              </button>
              
              {showCustomers && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="font-medium text-blue-600">T1 Premium</div>
                      <div className="text-sm text-gray-600">15% discount</div>
                    </div>
                    <div>
                      <div className="font-medium text-green-600">T2 Standard</div>
                      <div className="text-sm text-gray-600">10% discount</div>
                    </div>
                    <div>
                      <div className="font-medium text-orange-600">T3 New</div>
                      <div className="text-sm text-gray-600">5% discount</div>
                    </div>
                    <div>
                      <div className="font-medium text-purple-600">Retail</div>
                      <div className="text-sm text-gray-600">Full price</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. Templates (Collapsible) */}
          {thicknessList.length > 0 && (
            <div>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center gap-2 font-medium text-gray-900 text-lg mb-3 hover:text-blue-600"
              >
                {showTemplates ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
                Templates (Optional)
              </button>
              
              {showTemplates && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Pre-defined shapes with automated cost calculations</p>
                  <div className="mt-3 text-center text-gray-500">
                    Templates can be configured after creating the glass type
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Save Button */}
          {glassTypeName && thicknessList.length > 0 && (
            <div className="pt-6 border-t border-gray-200">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setGlassTypeName('');
                    setThicknessList([]);
                    setNewThickness('');
                    setNewPrice('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Clear Form
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/glass/types', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                          name: glassTypeName,
                          thicknessPricing: thicknessList
                        })
                      });
                      
                      if (response.ok) {
                        alert(`Glass type "${glassTypeName}" created with ${thicknessList.length} thicknesses!`);
                        queryClient.invalidateQueries({ queryKey: ['admin-glass-types'] });
                        setGlassTypeName('');
                        setThicknessList([]);
                      }
                    } catch (error) {
                      alert('Error creating glass type');
                    }
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Create Glass Type
                </button>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}