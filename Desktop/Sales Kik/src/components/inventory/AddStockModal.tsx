import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, XMarkIcon, PlusIcon, MinusIcon,
  PhotoIcon, ArrowPathIcon, Cog6ToothIcon, CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface Product {
  id: string;
  image?: string;
  productCode: string;
  productName: string;
  price: number;
  currentQuantity: number;
  unitOfMeasure: string;
  category: string;
  subcategory: string;
  productType: string;
}

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (adjustments: StockAdjustment[]) => void;
}

interface StockAdjustment {
  productId: string;
  quantity: number;
  productCode: string;
  productName: string;
  price: number;
  currentQuantity: number;
  image?: string;
}

interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  productTypes: string[];
}

export function AddStockModal({ isOpen, onClose, onSave }: AddStockModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [keywords, setKeywords] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [stockCurrentPage, setStockCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stockAdjustments, setStockAdjustments] = useState<Map<string, number>>(new Map());
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // New product form for adding products on the fly
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    image: '',
    productCode: '',
    productName: '',
    price: 0,
    currentQuantity: 0,
    category: '',
    subcategory: '',
    productType: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      fetchCategories();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      // Mock data matching your original - replace with actual API
      const mockProducts: Product[] = [
        {
          id: '1',
          productCode: 'DD700',
          productName: '10mm Clear Toughened Door Panel',
          price: 1041.45,
          currentQuantity: 0,
          unitOfMeasure: 'each',
          category: 'Pool Fencing',
          subcategory: 'Frameless Pool Fencing',
          productType: 'Spring Hinge Panels'
        },
        {
          id: '2',
          productCode: 'DF500',
          productName: '10mm Clear Toughened Mitred Fixed Panel',
          price: 826.80,
          currentQuantity: 0,
          unitOfMeasure: 'each',
          category: 'Pool Fencing',
          subcategory: 'Frameless Pool Fencing',
          productType: 'Spring Hinge Panels'
        }
      ];
      setProducts(mockProducts);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      // Start with sample data or empty
      const mockCategories: Category[] = [
        {
          id: '1',
          name: 'Pool Fencing',
          subcategories: [
            {
              id: '1',
              name: 'Frameless Pool Fencing',
              productTypes: ['Spring Hinge Panels', 'Fixed Panels', 'Return Panels']
            }
          ]
        }
      ];
      setCategories(mockCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const getSubcategories = () => {
    if (!selectedCategory) return [];
    const category = categories.find(c => c.name === selectedCategory);
    return category?.subcategories || [];
  };

  const getProductTypes = () => {
    if (!selectedCategory || !selectedSubcategory) return [];
    const category = categories.find(c => c.name === selectedCategory);
    const subcategory = category?.subcategories.find(s => s.name === selectedSubcategory);
    return subcategory?.productTypes || [];
  };

  const filteredProducts = products.filter(product => {
    const categoryMatch = !selectedCategory || product.category === selectedCategory;
    const subcategoryMatch = !selectedSubcategory || product.subcategory === selectedSubcategory;
    const productTypeMatch = !selectedProductType || product.productType === selectedProductType;
    const keywordMatch = !keywords || 
      product.productName.toLowerCase().includes(keywords.toLowerCase()) ||
      product.productCode.toLowerCase().includes(keywords.toLowerCase());
    
    return categoryMatch && subcategoryMatch && productTypeMatch && keywordMatch;
  });

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stockAdjustmentsList = Array.from(stockAdjustments.entries()).map(([productId, quantity]) => {
    const product = products.find(p => p.id === productId);
    return product ? { ...product, adjustmentQuantity: quantity } : null;
  }).filter(Boolean);

  const paginatedStockAdjustments = stockAdjustmentsList.slice(
    (stockCurrentPage - 1) * itemsPerPage,
    stockCurrentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const stockTotalPages = Math.ceil(stockAdjustmentsList.length / itemsPerPage);

  // Handle field updates for existing products
  const handleProductUpdate = async (productId: string, field: string, value: any) => {
    try {
      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, [field]: value }
          : product
      ));
      
      // In real app, make API call here
      // await fetch(`/api/products/${productId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ [field]: value })
      // });
      
    } catch (error) {
      console.error('Failed to update product:', error);
    }
  };

  // Handle image upload
  const handleImageUpload = async (productId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // In real app, upload to server
      // const response = await fetch(`/api/products/${productId}/image`, {
      //   method: 'POST',
      //   body: formData
      // });
      // const { imageUrl } = await response.json();
      
      // For now, create object URL
      const imageUrl = URL.createObjectURL(file);
      handleProductUpdate(productId, 'image', imageUrl);
      
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  // Add new product
  const handleAddProduct = async () => {
    try {
      const product: Product = {
        id: Date.now().toString(),
        ...newProduct,
        unitOfMeasure: 'each'
      };
      
      setProducts([...products, product]);
      setNewProduct({
        image: '',
        productCode: '',
        productName: '',
        price: 0,
        currentQuantity: 0,
        category: '',
        subcategory: '',
        productType: ''
      });
      setShowAddProductForm(false);
      
    } catch (error) {
      console.error('Failed to add product:', error);
    }
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    const newAdjustments = new Map(stockAdjustments);
    if (quantity > 0) {
      newAdjustments.set(productId, quantity);
    } else {
      newAdjustments.delete(productId);
    }
    setStockAdjustments(newAdjustments);
  };

  const handleSave = () => {
    const adjustments: StockAdjustment[] = [];
    stockAdjustments.forEach((quantity, productId) => {
      const product = products.find(p => p.id === productId);
      if (product && quantity > 0) {
        adjustments.push({
          productId,
          quantity,
          productCode: product.productCode,
          productName: product.productName,
          price: product.price,
          currentQuantity: product.currentQuantity,
          image: product.image
        });
      }
    });
    onSave(adjustments);
    setStockAdjustments(new Map());
    onClose();
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Stock"
      subtitle="Select products and quantities to add to inventory"
      size="full"
      footer={
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {stockAdjustments.size > 0 && (
              <span>
                Total adjustments: <span className="font-semibold text-gray-900">{stockAdjustments.size} products</span>
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="success" 
              onClick={handleSave}
              disabled={stockAdjustments.size === 0}
            >
              Save Stock Adjustments
            </Button>
          </div>
        </div>
      }
    >
      <div className="p-6">
            {/* Filters */}
            <div className="p-6 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setSelectedSubcategory('');
                        setSelectedProductType('');
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowCategoryManager(true)}
                      className="px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-xs font-medium whitespace-nowrap"
                      title="Add categories"
                    >
                      <PlusIcon className="w-3 h-3" />
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sub Category</label>
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => {
                      setSelectedSubcategory(e.target.value);
                      setSelectedProductType('');
                    }}
                    disabled={!selectedCategory}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Select</option>
                    {getSubcategories().map(subcategory => (
                      <option key={subcategory.id} value={subcategory.name}>{subcategory.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Type</label>
                  <select
                    value={selectedProductType}
                    onChange={(e) => setSelectedProductType(e.target.value)}
                    disabled={!selectedSubcategory}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Select</option>
                    {getProductTypes().map(productType => (
                      <option key={productType} value={productType}>{productType}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Search..."
                      />
                      <MagnifyingGlassIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    <button 
                      onClick={() => window.location.reload()}
                      className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Add Product Button */}
              <div className="mt-4">
                <button
                  onClick={() => setShowAddProductForm(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  + Add New Product
                </button>
              </div>
            </div>

            {/* Add Product Form */}
            {showAddProductForm && (
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Product</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Code</label>
                    <input
                      type="text"
                      value={newProduct.productCode}
                      onChange={(e) => setNewProduct({...newProduct, productCode: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g. DD700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <input
                      type="text"
                      value={newProduct.productName}
                      onChange={(e) => setNewProduct({...newProduct, productName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      placeholder="Product description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAddProduct}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Add Product
                  </button>
                  <button
                    onClick={() => setShowAddProductForm(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Products Table */}
            <div className="p-6">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">No Product is available</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Image</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product Code</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Price</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Current Quantity</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Quantity</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {paginatedProducts.map((product) => (
                        <tr key={product.id} className="border-t border-gray-200">
                          {/* Image Field - Functional */}
                          <td className="px-4 py-3">
                            <div className="relative w-12 h-12 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center hover:bg-gray-50 cursor-pointer group">
                              {product.image ? (
                                <img 
                                  src={product.image} 
                                  alt={product.productName} 
                                  className="w-full h-full object-cover rounded" 
                                />
                              ) : (
                                <PhotoIcon className="w-6 h-6 text-gray-400" />
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(product.id, file);
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
                                <CloudArrowUpIcon className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          </td>

                          {/* Product Code Field - Editable */}
                          <td className="px-4 py-3">
                            {editingProduct === product.id ? (
                              <input
                                type="text"
                                value={product.productCode}
                                onChange={(e) => handleProductUpdate(product.id, 'productCode', e.target.value)}
                                onBlur={() => setEditingProduct(null)}
                                onKeyPress={(e) => e.key === 'Enter' && setEditingProduct(null)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                autoFocus
                              />
                            ) : (
                              <span 
                                onClick={() => setEditingProduct(product.id)}
                                className="text-sm text-gray-900 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                              >
                                {product.productCode}
                              </span>
                            )}
                          </td>

                          {/* Product Name Field - Editable */}
                          <td className="px-4 py-3">
                            {editingProduct === product.id ? (
                              <input
                                type="text"
                                value={product.productName}
                                onChange={(e) => handleProductUpdate(product.id, 'productName', e.target.value)}
                                onBlur={() => setEditingProduct(null)}
                                onKeyPress={(e) => e.key === 'Enter' && setEditingProduct(null)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span 
                                onClick={() => setEditingProduct(product.id)}
                                className="text-sm text-gray-900 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                              >
                                {product.productName}
                              </span>
                            )}
                          </td>

                          {/* Price Field - Editable */}
                          <td className="px-4 py-3">
                            {editingProduct === product.id ? (
                              <input
                                type="number"
                                step="0.01"
                                value={product.price}
                                onChange={(e) => handleProductUpdate(product.id, 'price', parseFloat(e.target.value) || 0)}
                                onBlur={() => setEditingProduct(null)}
                                onKeyPress={(e) => e.key === 'Enter' && setEditingProduct(null)}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span 
                                onClick={() => setEditingProduct(product.id)}
                                className="text-sm text-gray-900 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                              >
                                {product.price.toFixed(2)}
                              </span>
                            )}
                          </td>

                          {/* Current Quantity Field - Editable */}
                          <td className="px-4 py-3">
                            {editingProduct === product.id ? (
                              <input
                                type="number"
                                value={product.currentQuantity}
                                onChange={(e) => handleProductUpdate(product.id, 'currentQuantity', parseInt(e.target.value) || 0)}
                                onBlur={() => setEditingProduct(null)}
                                onKeyPress={(e) => e.key === 'Enter' && setEditingProduct(null)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span 
                                onClick={() => setEditingProduct(product.id)}
                                className="text-sm text-gray-900 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                              >
                                {product.currentQuantity}
                              </span>
                            )}
                          </td>

                          {/* Quantity Field - Stock Addition Input */}
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              value={stockAdjustments.get(product.id) || ''}
                              onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </td>

                          {/* Action Field - Add/Remove Buttons */}
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  const current = stockAdjustments.get(product.id) || 0;
                                  handleQuantityChange(product.id, current + 1);
                                }}
                                className="bg-green-500 hover:bg-green-600 text-white p-1 rounded transition-colors"
                                title="Add 1"
                              >
                                <PlusIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const current = stockAdjustments.get(product.id) || 0;
                                  if (current > 0) {
                                    handleQuantityChange(product.id, current - 1);
                                  }
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white p-1 rounded transition-colors"
                                title="Remove 1"
                              >
                                <MinusIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded disabled:opacity-50"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded disabled:opacity-50"
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Stock Product List */}
            <div className="px-6 pb-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4 pt-6">Stock Product List</h3>
              
              {stockAdjustmentsList.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">No Results Found</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Image</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product Code</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Price</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Quantity</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {paginatedStockAdjustments.map((item: any) => (
                        <tr key={item.id} className="border-t border-gray-200">
                          <td className="px-4 py-3">
                            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                              {item.image ? (
                                <img src={item.image} alt={item.productName} className="w-full h-full object-cover rounded" />
                              ) : (
                                <PhotoIcon className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.productCode}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.productName}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">+{item.adjustmentQuantity}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleQuantityChange(item.id, 0)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
    </Modal>
    
    {/* Category Manager Modal */}
    {showCategoryManager && (
      <CategoryManagerModal 
        onClose={() => setShowCategoryManager(false)}
        onSave={(newCategories) => {
          setCategories(newCategories);
          setShowCategoryManager(false);
        }}
      />
    )}
    </>
  );
}

// Category Manager Modal component stays the same...
function CategoryManagerModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (categories: Category[]) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  const addCategory = () => {
    if (newCategoryName.trim()) {
      const newCategory: Category = {
        id: Date.now().toString(),
        name: newCategoryName.trim(),
        subcategories: []
      };
      setCategories([...categories, newCategory]);
      setNewCategoryName('');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-gray-100">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Categories</h3>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={addCategory}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Category
                </button>
              </div>
              
              <div className="max-h-60 overflow-y-auto">
                {categories.map((category) => (
                  <div key={category.id} className="border border-gray-200 rounded p-3 mb-2">
                    <div className="font-medium text-gray-900">{category.name}</div>
                    <div className="mt-2 pl-4">
                      {category.subcategories.map((sub) => (
                        <div key={sub.id} className="text-sm text-gray-600">• {sub.name}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => onSave(categories)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Save Categories
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddStockModal;