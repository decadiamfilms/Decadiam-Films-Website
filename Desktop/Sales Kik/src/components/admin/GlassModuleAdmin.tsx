import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon, PencilIcon, XMarkIcon, ChevronDownIcon, ChevronRightIcon,
  CubeIcon, AdjustmentsHorizontalIcon, UserGroupIcon, ClockIcon
} from '@heroicons/react/24/outline';

interface GlassType {
  id: string;
  name: string;
  basePrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function GlassModuleAdmin() {
  const queryClient = useQueryClient();
  
  // Glass Types Configuration (what varies by type)
  const [glassTypeName, setGlassTypeName] = useState('');
  const [thicknessList, setThicknessList] = useState<{
    thickness: number; 
    price: number;
    canBeToughened: boolean;
    tougheningPercent: number;
    leadTimeDays: number;
  }[]>([]);
  const [newThickness, setNewThickness] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [canToughen, setCanToughen] = useState(true);
  const [leadTime, setLeadTime] = useState('7');
  const [tougheningPercent, setTougheningPercent] = useState('30');
  
  // Processing rates state
  const [processingRates, setProcessingRates] = useState<any>(null);
  const [isLoadingProcessing, setIsLoadingProcessing] = useState(false);
  
  // Suppliers state
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  
  // Section visibility
  const [showProcessing, setShowProcessing] = useState(false);
  const [showCustomers, setShowCustomers] = useState(false);
  
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

  // Load processing options
  const { data: processingOptions } = useQuery({
    queryKey: ['processing-options'],
    queryFn: async () => {
      const response = await fetch('/api/glass/processing-options', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch processing options');
      return response.json();
    },
    onSuccess: (data) => {
      setProcessingRates(data);
    }
  });
  
  // Load suppliers
  const { data: suppliersData } = useQuery({
    queryKey: ['glass-suppliers'],
    queryFn: async () => {
      const response = await fetch('/api/glass/suppliers', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      return response.json();
    },
    onSuccess: (data) => {
      setSuppliers(data);
    }
  });

  // Function to update processing rate
  const updateProcessingRate = async (optionId: string, newRate: number) => {
    try {
      setIsLoadingProcessing(true);
      const response = await fetch(`/api/glass/processing-options/${optionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ baseRate: newRate })
      });
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['processing-options'] });
      }
    } catch (error) {
      console.error('Error updating processing rate:', error);
    } finally {
      setIsLoadingProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500 rounded-lg">
            <CubeIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-xl">Glass Supplier Configuration</h3>
            <p className="text-gray-600">Manage glass types and universal processing rates</p>
          </div>
        </div>
      </div>

      {/* Existing Glass Types */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Current Glass Types</h3>
          <p className="text-sm text-gray-600">Click edit to modify thickness availability and pricing</p>
        </div>
        <div className="p-6">
          {glassTypes?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CubeIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No glass types configured yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {glassTypes?.map(type => (
                <div key={type.id} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{type.name}</h4>
                    <button 
                      onClick={() => {
                        setGlassTypeName(type.name);
                        // Load existing configuration for editing
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-green-600 font-medium">Multiple thicknesses</p>
                  <p className="text-xs text-gray-500">Click to configure</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Glass Type Configuration Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6">
          
          {/* Glass Type Name */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 text-lg mb-3">Glass Type Configuration</h4>
            <div className="max-w-md">
              <label className="block text-base font-medium text-gray-700 mb-2">Glass Type Name</label>
              <input
                type="text"
                value={glassTypeName}
                onChange={(e) => setGlassTypeName(e.target.value)}
                placeholder="e.g., Clear Glass, Ultra Clear, Mirror"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Thickness & Pricing */}
          {glassTypeName && (
            <div className="space-y-6">
              
              {/* Add Thickness */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Available Thicknesses & Pricing</h5>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Thickness</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={newThickness}
                          onChange={(e) => setNewThickness(e.target.value)}
                          placeholder="6, 8, 10, 12, 19"
                          min="3"
                          max="50"
                          step="0.1"
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-3 top-2.5 text-gray-500 text-sm font-medium">mm</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price/m²</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                        <input
                          type="number"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          placeholder="120.00"
                          step="0.01"
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Toughening</label>
                      <select
                        value={canToughen ? 'yes' : 'no'}
                        onChange={(e) => setCanToughen(e.target.value === 'yes')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="yes">Available</option>
                        <option value="no">Not Available</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Toughening %</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={tougheningPercent}
                          onChange={(e) => setTougheningPercent(e.target.value)}
                          placeholder="30"
                          min="0"
                          max="100"
                          disabled={!canToughen}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                        />
                        <span className="absolute right-3 top-2.5 text-gray-500 text-sm">%</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const thickness = parseFloat(newThickness);
                        const price = parseFloat(newPrice);
                        const tougheningPercentage = parseFloat(tougheningPercent);
                        const leadDays = parseInt(leadTime);
                        
                        if (thickness && price && !thicknessList.find(t => t.thickness === thickness)) {
                          setThicknessList(prev => [...prev, { 
                            thickness, 
                            price,
                            canBeToughened: canToughen,
                            tougheningPercent: tougheningPercentage,
                            leadTimeDays: leadDays
                          }].sort((a, b) => a.thickness - b.thickness));
                          setNewThickness('');
                          setNewPrice('');
                          setTougheningPercent('30');
                        }
                      }}
                      disabled={!newThickness || !newPrice}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Current Thicknesses */}
              {thicknessList.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Configured Thicknesses</h5>
                  <div className="space-y-2">
                    {thicknessList.map((item, index) => (
                      <div key={index} className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-6">
                          <span className="font-bold text-blue-900 text-lg">{item.thickness}mm</span>
                          <span className="text-green-600 font-bold">${item.price}/m²</span>
                          <div className="flex gap-2">
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">Annealed</span>
                            {item.canBeToughened && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">+{item.tougheningPercent}% Toughened</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <ClockIcon className="w-4 h-4" />
                            <span className="text-sm">{item.leadTimeDays} days</span>
                          </div>
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
                </div>
              )}

            </div>
          )}

          {/* Save Glass Type */}
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
                  Clear
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
                          thicknesses: thicknessList
                        })
                      });
                      
                      if (response.ok) {
                        alert(`${glassTypeName} created with ${thicknessList.length} thicknesses!`);
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
                  Save Glass Type
                </button>
              </div>
            </div>
          )}
          
        </div>
      </div>

      {/* Universal Processing Rates */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AdjustmentsHorizontalIcon className="w-5 h-5 text-blue-600" />
              Universal Processing Rates
            </h3>
            <p className="text-sm text-gray-600">These rates apply to all glass types (industry standard)</p>
          </div>
          <button
            onClick={() => setShowProcessing(!showProcessing)}
            className="p-2 text-gray-400 hover:text-blue-600"
          >
            {showProcessing ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
          </button>
        </div>
        
        {showProcessing && (
          <div className="p-6 space-y-6">
            
            {/* Edgework - Universal rates */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Edgework (per linear meter)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {processingOptions?.edgework?.map((edge: any, index: number) => (
                  <div key={edge.id || index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-gray-900">{edge.name}</h5>
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-gray-500 text-xs">$</span>
                        <input
                          type="number"
                          defaultValue={edge.baseRate}
                          step="0.01"
                          onBlur={(e) => {
                            const newRate = parseFloat(e.target.value);
                            if (newRate !== edge.baseRate) {
                              updateProcessingRate(edge.id, newRate);
                            }
                          }}
                          className="w-20 pl-6 pr-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Supplier</label>
                      <select 
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        defaultValue=""
                      >
                        <option value="">Select supplier...</option>
                        {suppliers.map(supplier => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-gray-500">{edge.rateType}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Other Processing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Corner Rates */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Corner Finish (per piece)</h4>
                <div className="space-y-2">
                  {processingOptions?.cornerFinish?.map((corner: any, index: number) => (
                    <div key={corner.id || index} className="border border-gray-100 rounded p-2 mb-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">{corner.name}</span>
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-gray-500 text-xs">$</span>
                          <input
                            type="number"
                            defaultValue={corner.baseRate}
                            step="0.01"
                            onBlur={(e) => {
                              const newRate = parseFloat(e.target.value);
                              if (newRate !== corner.baseRate) {
                                updateProcessingRate(corner.id, newRate);
                              }
                            }}
                            className="w-20 pl-6 pr-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Supplier</label>
                        <select 
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          defaultValue=""
                        >
                          <option value="">Select supplier...</option>
                          {suppliers.map(supplier => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hole Rates */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Holes & Cutouts (per piece)</h4>
                <div className="space-y-2">
                  {processingOptions?.holesCutouts?.map((hole: any, index: number) => (
                    <div key={hole.id || index} className="border border-gray-100 rounded p-2 mb-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">{hole.name}</span>
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-gray-500 text-xs">$</span>
                          <input
                            type="number"
                            defaultValue={hole.baseRate}
                            step="0.01"
                            onBlur={(e) => {
                              const newRate = parseFloat(e.target.value);
                              if (newRate !== hole.baseRate) {
                                updateProcessingRate(hole.id, newRate);
                              }
                            }}
                            className="w-20 pl-6 pr-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Supplier</label>
                        <select 
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          defaultValue=""
                        >
                          <option value="">Select supplier...</option>
                          {suppliers.map(supplier => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Rates */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Services</h4>
                <div className="space-y-2">
                  {processingOptions?.services?.map((service: any, index: number) => (
                    <div key={service.id || index} className="border border-gray-100 rounded p-2 mb-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">{service.name}</span>
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-gray-500 text-xs">$</span>
                          <input
                            type="number"
                            defaultValue={service.baseRate}
                            step="0.01"
                            onBlur={(e) => {
                              const newRate = parseFloat(e.target.value);
                              if (newRate !== service.baseRate) {
                                updateProcessingRate(service.id, newRate);
                              }
                            }}
                            className="w-20 pl-6 pr-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Supplier</label>
                        <select 
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          defaultValue=""
                        >
                          <option value="">Select supplier...</option>
                          {suppliers.map(supplier => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Surface Finishes */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Surface Finishes</h4>
                <div className="space-y-2">
                  {processingOptions?.surfaceFinish?.map((finish: any, index: number) => (
                    <div key={finish.id || index} className="border border-gray-100 rounded p-2 mb-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">{finish.name}</span>
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-gray-500 text-xs">$</span>
                          <input
                            type="number"
                            defaultValue={finish.baseRate}
                            step="0.01"
                            onBlur={(e) => {
                              const newRate = parseFloat(e.target.value);
                              if (newRate !== finish.baseRate) {
                                updateProcessingRate(finish.id, newRate);
                              }
                            }}
                            className="w-20 pl-6 pr-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Supplier</label>
                        <select 
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          defaultValue=""
                        >
                          <option value="">Select supplier...</option>
                          {suppliers.map(supplier => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
            </div>

          </div>
        )}
      </div>

      {/* Customer Discount System */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-blue-600" />
              Customer Discount System
            </h3>
            <p className="text-sm text-gray-600">Set overall discount levels that apply to all glass and processing</p>
          </div>
          <button
            onClick={() => setShowCustomers(!showCustomers)}
            className="p-2 text-gray-400 hover:text-blue-600"
          >
            {showCustomers ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
          </button>
        </div>
        
        {showCustomers && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[
                { tier: 'T1', discount: '15%', description: 'Premium customers', color: 'blue' },
                { tier: 'T2', discount: '10%', description: 'Standard customers', color: 'green' },
                { tier: 'T3', discount: '5%', description: 'New customers', color: 'orange' },
                { tier: 'RETAIL', discount: '0%', description: 'Retail pricing', color: 'purple' }
              ].map(tier => (
                <div key={tier.tier} className={`border border-gray-200 rounded-lg p-4 text-center`}>
                  <div className="font-bold text-gray-900">{tier.tier}</div>
                  <div className="text-lg font-bold text-green-600">{tier.discount} off</div>
                  <div className="text-xs text-gray-500">{tier.description}</div>
                </div>
              ))}
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Assign Customer Discounts</h4>
              <div className="flex gap-3 mb-4">
                <select className="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                  <option>Select customer...</option>
                  <option>ABC Construction</option>
                  <option>XYZ Glazing</option>
                </select>
                <select className="px-3 py-2 border border-gray-300 rounded-lg">
                  <option>T1</option>
                  <option>T2</option>
                  <option>T3</option>
                  <option>RETAIL</option>
                </select>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Assign
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}