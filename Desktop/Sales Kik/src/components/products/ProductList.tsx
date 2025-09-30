import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, PlusIcon, FunnelIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { useModuleAccess } from '../../hooks/useModuleAccess';

interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  cost: number;
  sellPrice?: number;
  margin?: number;
  stock?: number;
  unitOfMeasure: string;
  isActive: boolean;
  categories?: Array<{ name: string; level: string }>;
}

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const { targetMarket } = useModuleAccess('product-catalog');

  useEffect(() => {
    // Fetch products based on target market
    fetchProducts();
  }, [searchTerm, selectedCategory, selectedStatus, targetMarket]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        search: searchTerm,
        category: selectedCategory,
        status: selectedStatus,
        targetMarket: targetMarket
      });
      
      const response = await fetch(`/api/products?${queryParams}`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      // Mock data for demonstration
      setProducts([
        {
          id: '1',
          sku: 'GLS-CLR-006',
          name: 'Clear Glass 6mm',
          description: 'High-quality clear glass panel',
          cost: 32.50,
          sellPrice: 45.50,
          margin: 40,
          stock: 47,
          unitOfMeasure: 'sqm',
          isActive: true,
          categories: [{ name: 'Glass', level: 'category' }]
        },
        {
          id: '2',
          sku: 'HDW-HNG-001',
          name: 'Heavy Duty Hinge',
          description: 'Commercial grade door hinge',
          cost: 8.75,
          sellPrice: 12.50,
          margin: 43,
          stock: 124,
          unitOfMeasure: 'each',
          isActive: true,
          categories: [{ name: 'Hardware', level: 'category' }]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    // Navigate to add product form
    console.log('Navigate to add product form');
  };

  const handleBulkUpload = () => {
    // Navigate to bulk upload
    console.log('Navigate to bulk upload');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-600 mt-1">
                {targetMarket === 'TRADIES' 
                  ? 'Manage your simple product list and pricing'
                  : 'Manage your product catalog and pricing'
                }
              </p>
            </div>
            <div className="flex gap-3">
              {targetMarket === 'SME' && (
                <button 
                  onClick={handleBulkUpload}
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                  Bulk Upload
                </button>
              )}
              <button 
                onClick={handleAddProduct}
                className="inline-flex items-center px-4 py-2 bg-amber-500 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-amber-600 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Product
              </button>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-80">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name, SKU, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {targetMarket === 'SME' && (
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="glass">Glass</option>
                <option value="hardware">Hardware</option>
              </select>
            )}
            
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            
            {targetMarket === 'SME' && (
              <button className="inline-flex items-center px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <FunnelIcon className="w-4 h-4 mr-2" />
                More Filters
              </button>
            )}
          </div>
        </div>

        {/* Products Display - Different layouts for different markets */}
        {products.length === 0 ? (
          // Empty state
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 mb-6">
              Get started by adding your first product{targetMarket === 'SME' ? ' or uploading a CSV file' : ''}.
            </p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={handleAddProduct}
                className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Product
              </button>
              {targetMarket === 'SME' && (
                <button 
                  onClick={handleBulkUpload}
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                  Bulk Upload
                </button>
              )}
            </div>
          </div>
        ) : targetMarket === 'TRADIES' ? (
          // Simple list view for tradies
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Product List ({products.length})</h2>
              <div className="space-y-1">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-lg border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{product.name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-500">SKU: {product.sku}</span>
                        {product.stock && (
                          <span className="text-sm text-gray-500">Stock: {product.stock} {product.unitOfMeasure}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Cost</div>
                        <div className="font-medium">${product.cost.toFixed(2)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Sell</div>
                        <div className="font-medium text-green-600">${product.sellPrice?.toFixed(2) || '0.00'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Margin</div>
                        <div className="font-medium text-blue-600">{product.margin || 0}%</div>
                      </div>
                      <button className="text-amber-600 hover:text-amber-700 text-sm font-medium px-3 py-1 hover:bg-amber-50 rounded">
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Advanced card view for SME
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">SKU: {product.sku}</p>
                      <div className="flex flex-wrap gap-1">
                        {product.categories?.map((category, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {category.name}
                          </span>
                        ))}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">${product.sellPrice?.toFixed(2) || '0.00'}</div>
                      <div className="text-sm text-gray-500">per {product.unitOfMeasure}</div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-4 space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Cost:</span>
                      <span className="font-medium">${product.cost.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Margin:</span>
                      <span className="font-medium text-green-600">{product.margin || 0}%</span>
                    </div>
                    {product.stock !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Stock:</span>
                        <span className="font-medium">{product.stock} {product.unitOfMeasure}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 py-2 px-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                      Edit
                    </button>
                    <button className="flex-1 py-2 px-3 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}