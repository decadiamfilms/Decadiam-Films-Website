import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GlassDropdown } from '../../glass/GlassDropdown';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon,
  CubeIcon,
  TagIcon 
} from '@heroicons/react/24/outline';

interface GlassProduct {
  id: string;
  glassTypeId: string;
  productType: 'TOUGHENED' | 'NOT_TOUGHENED';
  thickness: number;
  basePrice: number;
  isActive: boolean;
  glassType?: {
    name: string;
  };
}

export function GlassProductsAdmin() {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    glassTypeId: '',
    productType: 'NOT_TOUGHENED' as 'TOUGHENED' | 'NOT_TOUGHENED',
    thickness: '',
    basePrice: ''
  });

  const queryClient = useQueryClient();

  const { data: glassTypes } = useQuery({
    queryKey: ['admin-glass-types'],
    queryFn: async () => {
      // Mock data for now
      return [
        { id: 'glass-type-clear', name: 'Clear Glass' },
        { id: 'glass-type-ultra-clear', name: 'Ultra Clear Glass' },
        { id: 'glass-type-tinted', name: 'Tinted Glass' }
      ];
    }
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-glass-products'],
    queryFn: async (): Promise<GlassProduct[]> => {
      // Mock data matching the seeded data
      return [
        {
          id: '1',
          glassTypeId: 'glass-type-clear',
          productType: 'NOT_TOUGHENED',
          thickness: 4,
          basePrice: 25.50,
          isActive: true,
          glassType: { name: 'Clear Glass' }
        },
        {
          id: '2',
          glassTypeId: 'glass-type-clear',
          productType: 'NOT_TOUGHENED',
          thickness: 6,
          basePrice: 32.00,
          isActive: true,
          glassType: { name: 'Clear Glass' }
        },
        {
          id: '3',
          glassTypeId: 'glass-type-clear',
          productType: 'TOUGHENED',
          thickness: 6,
          basePrice: 52.00,
          isActive: true,
          glassType: { name: 'Clear Glass' }
        },
        {
          id: '4',
          glassTypeId: 'glass-type-clear',
          productType: 'TOUGHENED',
          thickness: 8,
          basePrice: 58.50,
          isActive: true,
          glassType: { name: 'Clear Glass' }
        },
        {
          id: '5',
          glassTypeId: 'glass-type-ultra-clear',
          productType: 'NOT_TOUGHENED',
          thickness: 6,
          basePrice: 36.80,
          isActive: true,
          glassType: { name: 'Ultra Clear Glass' }
        }
      ];
    }
  });

  const addProduct = useMutation({
    mutationFn: async (product: typeof newProduct) => {
      // Mock API call
      const newProd: GlassProduct = {
        id: `product-${Date.now()}`,
        glassTypeId: product.glassTypeId,
        productType: product.productType,
        thickness: parseFloat(product.thickness),
        basePrice: parseFloat(product.basePrice),
        isActive: true,
        glassType: glassTypes?.find(t => t.id === product.glassTypeId)
      };
      return newProd;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-glass-products'] });
      setIsAddingNew(false);
      setNewProduct({ glassTypeId: '', productType: 'NOT_TOUGHENED', thickness: '', basePrice: '' });
    }
  });

  const handleAddProduct = () => {
    if (!newProduct.glassTypeId || !newProduct.thickness || !newProduct.basePrice) return;
    addProduct.mutate(newProduct);
  };

  // Group products by glass type for better organization
  const groupedProducts = products?.reduce((acc: Record<string, GlassProduct[]>, product) => {
    const typeName = product.glassType?.name || 'Unknown Type';
    if (!acc[typeName]) acc[typeName] = [];
    acc[typeName].push(product);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner-lg"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Glass Products & Pricing</h2>
          <p className="text-base text-gray-600 mt-1">
            Configure glass products with thickness specifications and base pricing per square meter
          </p>
        </div>
        <button
          onClick={() => setIsAddingNew(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-medium text-base flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Add New Product Form */}
      {isAddingNew && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-blue-900 mb-4">Add New Glass Product</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <GlassDropdown
              label="Glass Type"
              required
              value={newProduct.glassTypeId}
              placeholder="Select Glass Type"
              options={glassTypes?.map(type => ({
                value: type.id,
                label: type.name
              })) || []}
              onChange={(value) => setNewProduct({...newProduct, glassTypeId: value})}
            />
            
            <GlassDropdown
              label="Product Type"
              required
              value={newProduct.productType}
              placeholder="Select Type"
              options={[
                { value: 'NOT_TOUGHENED', label: 'Not Toughened' },
                { value: 'TOUGHENED', label: 'Toughened' }
              ]}
              onChange={(value) => setNewProduct({...newProduct, productType: value as 'TOUGHENED' | 'NOT_TOUGHENED'})}
            />
            
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Thickness (mm) *</label>
              <input
                type="number"
                step="0.1"
                value={newProduct.thickness}
                onChange={(e) => setNewProduct({...newProduct, thickness: e.target.value})}
                placeholder="e.g. 4, 6, 8, 10, 12"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              />
            </div>
            
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Base Price ($/m²) *</label>
              <input
                type="number"
                step="0.01"
                value={newProduct.basePrice}
                onChange={(e) => setNewProduct({...newProduct, basePrice: e.target.value})}
                placeholder="e.g. 25.50"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAddProduct}
              disabled={!newProduct.glassTypeId || !newProduct.thickness || !newProduct.basePrice}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2"
            >
              <CheckIcon className="w-4 h-4" />
              Add Product
            </button>
            <button
              onClick={() => {
                setIsAddingNew(false);
                setNewProduct({ glassTypeId: '', productType: 'NOT_TOUGHENED', thickness: '', basePrice: '' });
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
            >
              <XMarkIcon className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Products by Glass Type */}
      <div className="space-y-6">
        {Object.entries(groupedProducts || {}).map(([typeName, typeProducts]) => (
          <div key={typeName} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CubeIcon className="w-5 h-5 text-[#6B7FCC]" />
                {typeName} ({typeProducts.length} products)
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Product Type
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Thickness
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Base Price/m²
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {typeProducts.map((product, index) => (
                    <tr key={product.id} className={`hover:bg-blue-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            product.productType === 'TOUGHENED' ? 'bg-green-500' : 'bg-blue-500'
                          }`}></div>
                          <span className="text-base font-medium text-gray-900">
                            {product.productType === 'TOUGHENED' ? 'Toughened' : 'Not Toughened'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold text-gray-900">
                          {product.thickness}mm
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-lg font-bold text-[#6B7FCC]">
                          ${product.basePrice.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingId(product.id)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Edit product"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this product?')) {
                                // Delete logic here
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete product"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!products?.length && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="text-center py-12">
            <TagIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Glass Products</h3>
            <p className="text-base text-gray-600 mb-4">
              Add glass products with different thicknesses and pricing to enable quoting.
            </p>
            <button
              onClick={() => setIsAddingNew(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium text-base flex items-center gap-2 mx-auto"
            >
              <PlusIcon className="w-4 h-4" />
              Add First Product
            </button>
          </div>
        </div>
      )}
    </div>
  );
}