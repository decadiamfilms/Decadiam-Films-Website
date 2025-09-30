import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon,
  CubeIcon 
} from '@heroicons/react/24/outline';

interface GlassType {
  id: string;
  name: string;
  basePrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function GlassTypesAdmin() {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newGlassType, setNewGlassType] = useState({
    name: '',
    basePrice: '120'
  });

  const queryClient = useQueryClient();

  // Fetch glass types from API
  const { data: glassTypes, isLoading } = useQuery({
    queryKey: ['admin-glass-types'],
    queryFn: async (): Promise<GlassType[]> => {
      const response = await fetch('/api/glass/types', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch glass types');
      const data = await response.json();
      return data.map((type: any) => ({
        id: type.id,
        name: type.name,
        basePrice: type.basePrice,
        isActive: type.isActive,
        createdAt: type.createdAt,
        updatedAt: type.updatedAt
      }));
    }
  });

  // Create glass type mutation
  const createGlassTypeMutation = useMutation({
    mutationFn: async (data: { name: string; basePrice: number }) => {
      const response = await fetch('/api/glass/types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: data.name,
          basePrice: data.basePrice
        })
      });
      if (!response.ok) throw new Error('Failed to create glass type');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-glass-types'] });
      setNewGlassType({ name: '', basePrice: '120' });
      setIsAddingNew(false);
    }
  });

  const handleCreateGlassType = () => {
    if (!newGlassType.name.trim() || !newGlassType.basePrice) return;
    createGlassTypeMutation.mutate({
      name: newGlassType.name.trim(),
      basePrice: parseFloat(newGlassType.basePrice)
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading glass types...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Glass Types Management</h3>
          <p className="text-sm text-gray-600">Configure glass types and base pricing per m²</p>
        </div>
        <button
          onClick={() => setIsAddingNew(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Add Glass Type
        </button>
      </div>

      {/* Add New Form */}
      {isAddingNew && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3">Add New Glass Type</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Glass Type Name</label>
              <input
                type="text"
                value={newGlassType.name}
                onChange={(e) => setNewGlassType(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Tempered Glass"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (per m²)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <input
                  type="number"
                  value={newGlassType.basePrice}
                  onChange={(e) => setNewGlassType(prev => ({ ...prev, basePrice: e.target.value }))}
                  placeholder="120.00"
                  className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                  step="0.01"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreateGlassType}
              disabled={!newGlassType.name.trim() || !newGlassType.basePrice || createGlassTypeMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CheckIcon className="w-4 h-4" />
              {createGlassTypeMutation.isPending ? 'Creating...' : 'Create Glass Type'}
            </button>
            <button
              onClick={() => {
                setIsAddingNew(false);
                setNewGlassType({ name: '', basePrice: '120' });
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
            >
              <XMarkIcon className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Glass Types Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Glass Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Price/m²
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {glassTypes?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <CubeIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No glass types yet</h3>
                    <p className="text-gray-600 mb-4">Create your first glass type to get started</p>
                    <button
                      onClick={() => setIsAddingNew(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Add Glass Type
                    </button>
                  </td>
                </tr>
              ) : (
                glassTypes?.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <CubeIcon className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{type.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-bold">${type.basePrice?.toFixed(2) || '0.00'}</div>
                      <div className="text-xs text-gray-500">per square meter</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        type.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {type.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(type.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button className="text-blue-600 hover:text-blue-900 p-1">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900 p-1">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CubeIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Glass Types</dt>
                <dd className="text-lg font-medium text-gray-900">{glassTypes?.length || 0}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckIcon className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Active Types</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {glassTypes?.filter(type => type.isActive).length || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-2xl">💰</div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Average Price</dt>
                <dd className="text-lg font-medium text-gray-900">
                  ${glassTypes?.length ? 
                    (glassTypes.reduce((sum, type) => sum + (type.basePrice || 0), 0) / glassTypes.length).toFixed(2) :
                    '0.00'
                  }/m²
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}