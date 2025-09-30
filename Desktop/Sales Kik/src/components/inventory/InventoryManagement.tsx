import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, DocumentTextIcon, CubeIcon, 
  ChartBarIcon, PlusIcon, ShoppingCartIcon,
  EyeIcon, ChevronDownIcon, ChevronRightIcon,
  CurrencyDollarIcon, ArchiveBoxIcon, TagIcon,
  ExclamationTriangleIcon, CheckIcon, PhotoIcon
} from '@heroicons/react/24/outline';
import UniversalNavigation from '../layout/UniversalNavigation';
import UniversalHeader from '../layout/UniversalHeader';

// Interfaces matching our product system
interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  subcategoryPath: SubcategoryPath[];
  costPrice: number;
  basePrice: number;
  unitType: 'each' | 'sqm' | 'lm';
  inventory: {
    currentStock: number;
    reorderPoint: number;
    supplier: string;
  };
  images: any[];
  glassSpecs?: {
    thickness: string;
    glassType: string;
    finish: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SubcategoryPath {
  id: string;
  name: string;
  level: number;
  color: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  parentId?: string;
  color: string;
  level: number;
}

export function InventoryManagement() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategoryPath, setSelectedSubcategoryPath] = useState<SubcategoryPath[]>([]);
  const [stockFilter, setStockFilter] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    loadIntegratedData();
  }, []);

  const loadIntegratedData = async () => {
    try {
      // Load products from Product Management system
      const savedProducts = localStorage.getItem('saleskik-products');
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      }

      // Load categories from Inventory Builder system
      const savedCategories = localStorage.getItem('saleskik-categories');
      if (savedCategories) {
        setCategories(JSON.parse(savedCategories));
      }
    } catch (error) {
      console.error('Failed to load integrated data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format subcategory path for display
  const formatSubcategoryPath = (path: SubcategoryPath[]) => {
    return path.map(p => p.name).join(' → ');
  };

  // Filter products based on search and category selection
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchKeyword || 
      product.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchKeyword.toLowerCase());
    
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    
    const matchesSubcategory = selectedSubcategoryPath.length === 0 || 
      selectedSubcategoryPath.every(filterPath => 
        product.subcategoryPath.some(productPath => productPath.id === filterPath.id)
      );

    const matchesStock = stockFilter === 'all' ||
      (stockFilter === 'in-stock' && product.inventory.currentStock > product.inventory.reorderPoint) ||
      (stockFilter === 'low-stock' && product.inventory.currentStock <= product.inventory.reorderPoint && product.inventory.currentStock > 0) ||
      (stockFilter === 'out-of-stock' && product.inventory.currentStock === 0);
    
    return matchesSearch && matchesCategory && matchesSubcategory && matchesStock && product.isActive;
  });

  // Toggle product selection for quote building
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Create quote with selected products
  const createQuoteWithProducts = () => {
    if (selectedProducts.length === 0) {
      alert('Please select products first');
      return;
    }
    
    const selectedProductData = products.filter(p => selectedProducts.includes(p.id));
    // Store selected products for quote creation
    localStorage.setItem('quote-products', JSON.stringify(selectedProductData));
    navigate('/quotes');
  };

  if (loading) {
    return <div className="p-8">Loading inventory...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="inventory" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="Stock Management"
        subtitle="View products, check inventory, and create quotes"
        onMenuToggle={() => setShowSidebar(true)}
        actions={
          selectedProducts.length > 0 && (
            <button
              onClick={createQuoteWithProducts}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
            >
              <DocumentTextIcon className="w-4 h-4" />
              Create Quote ({selectedProducts.length})
            </button>
          )
        }
        summaryCards={
          <>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Products</p>
                  <p className="text-2xl font-bold text-blue-900">{products.length}</p>
                </div>
                <CubeIcon className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Low Stock</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {products.filter(p => p.inventory.currentStock <= p.inventory.reorderPoint).length}
                  </p>
                </div>
                <ExclamationTriangleIcon className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Total Value</p>
                  <p className="text-2xl font-bold text-green-900">
                    ${products.reduce((sum, p) => sum + (p.inventory.currentStock * p.basePrice), 0).toLocaleString()}
                  </p>
                </div>
                <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Categories</p>
                  <p className="text-2xl font-bold text-purple-900">{categories.length}</p>
                </div>
                <TagIcon className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </>
        }
      />

      <div className="p-8 max-w-7xl mx-auto">
        {/* Enhanced Filters with Cascading Dropdowns */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Product Filters</h3>
            <button 
              onClick={() => {
                setSearchKeyword('');
                setSelectedCategory('');
                setSelectedSubcategoryPath([]);
                setStockFilter('all');
                setSelectedProducts([]);
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All Filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Products</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Search by name or SKU..."
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubcategoryPath([]);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            {/* Stock Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Stock Levels</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>

          </div>

          {/* Cascading Subcategory Filter */}
          {selectedCategory && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <FilterCascadingSelector 
                category={categories.find(c => c.id === selectedCategory)}
                selectedPath={selectedSubcategoryPath}
                onPathChange={setSelectedSubcategoryPath}
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
            <div className="text-sm text-gray-500">
              {filteredProducts.length} products {(searchKeyword || selectedCategory || selectedSubcategoryPath.length > 0) ? 'filtered' : 'total'}
            </div>
            {selectedProducts.length > 0 && (
              <div className="text-sm text-green-600 font-medium">
                {selectedProducts.length} products selected for quote
              </div>
            )}
          </div>
        </div>

        {/* Product Stock Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Product Inventory</h3>
              <div className="text-sm text-gray-500">
                Select products to add to quote
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(filteredProducts.map(p => p.id));
                        } else {
                          setSelectedProducts([]);
                        }
                      }}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product & SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category Path</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retail Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <CubeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
                      <p className="text-gray-600 mb-6">
                        {products.length === 0 
                          ? 'Add products in Product Management to see them here'
                          : 'Try adjusting your filters to see more products'
                        }
                      </p>
                      <button
                        onClick={() => navigate('/products')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                      >
                        Go to Product Management
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${
                      selectedProducts.includes(product.id) ? 'bg-blue-50' : ''
                    }`}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            <PhotoIcon className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500 font-mono">{product.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{product.categoryName}</div>
                          <div className="text-gray-500">
                            {formatSubcategoryPath(product.subcategoryPath)}
                          </div>
                          {product.subcategoryPath.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {product.subcategoryPath.map((path, index) => (
                                <div key={path.id} className="flex items-center gap-1">
                                  <div 
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: path.color }}
                                  />
                                  {index < product.subcategoryPath.length - 1 && (
                                    <span className="text-xs text-gray-400">→</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-700">${(product.costPrice || 0).toFixed(2)}</div>
                        <div className="text-xs text-gray-500">per {product.unitType}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-green-700">${product.basePrice.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">per {product.unitType}</div>
                        {product.costPrice && product.costPrice > 0 && (
                          <div className="text-xs text-blue-600">
                            {(((product.basePrice - product.costPrice) / product.costPrice) * 100).toFixed(1)}% margin
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.inventory.currentStock === 0 
                              ? 'bg-red-100 text-red-800' 
                              : product.inventory.currentStock <= product.inventory.reorderPoint
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {product.inventory.currentStock}
                          </span>
                          <span className="text-xs text-gray-500">
                            (Reorder: {product.inventory.reorderPoint})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{product.inventory.supplier || 'Not specified'}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Filter Cascading Selector (reused from Product Management)
function FilterCascadingSelector({ category, selectedPath, onPathChange }: {
  category: Category | undefined;
  selectedPath: SubcategoryPath[];
  onPathChange: (path: SubcategoryPath[]) => void;
}) {
  if (!category) return null;

  const getSubcategoriesAtLevel = (level: number, parentId?: string) => {
    return category.subcategories
      .filter(sub => sub.level === level && sub.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const getMaxLevel = () => {
    return Math.max(0, ...category.subcategories.map(sub => sub.level || 0));
  };

  const handleSelectionAtLevel = (level: number, subcategoryId: string) => {
    if (!subcategoryId) {
      onPathChange(selectedPath.slice(0, level));
      return;
    }

    const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
    if (subcategory) {
      const newPath = selectedPath.slice(0, level).concat([{
        id: subcategory.id,
        name: subcategory.name,
        level: subcategory.level || level,
        color: subcategory.color
      }]);
      
      onPathChange(newPath);
    }
  };

  const renderFilterDropdowns = () => {
    const dropdowns = [];
    const maxLevel = getMaxLevel();
    
    for (let level = 0; level <= maxLevel; level++) {
      const parentId = level === 0 ? undefined : selectedPath[level - 1]?.id;
      const subcategoriesAtLevel = getSubcategoriesAtLevel(level, parentId);
      
      if (subcategoriesAtLevel.length > 0) {
        const currentSelection = selectedPath[level];
        
        dropdowns.push(
          <div key={level} className="mb-3">
            <label className="text-sm font-medium text-gray-700">
              Level {level} {level > 0 && selectedPath[level - 1] && `(under ${selectedPath[level - 1].name})`}
            </label>
            <select
              value={currentSelection?.id || ''}
              onChange={(e) => handleSelectionAtLevel(level, e.target.value)}
              disabled={level > 0 && !selectedPath[level - 1]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm mt-1"
            >
              <option value="">Any Level {level}</option>
              {subcategoriesAtLevel.map(subcategory => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                  {subcategory.isShared && ' (Shared)'}
                </option>
              ))}
            </select>
          </div>
        );
      }
    }
    
    return dropdowns;
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Filter by Subcategory Path
      </label>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {renderFilterDropdowns()}
      </div>
      {selectedPath.length > 0 && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 flex-wrap">
            {selectedPath.map((path, index) => (
              <div key={path.id} className="flex items-center gap-1">
                <span className="text-xs bg-white px-2 py-1 rounded border" style={{
                  borderColor: path.color,
                  color: path.color
                }}>
                  {path.name}
                </span>
                {index < selectedPath.length - 1 && (
                  <span className="text-blue-600 text-xs">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryManagement;