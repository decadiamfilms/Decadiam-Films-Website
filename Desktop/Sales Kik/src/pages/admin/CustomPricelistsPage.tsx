import React, { useState, useEffect, useRef } from 'react';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import { CustomDropdown } from '../../components/ui/CustomDropdown';
import { 
  CurrencyDollarIcon,
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { dataService } from '../../services/api.service';

interface Customer {
  id: string;
  name: string;
  email: string;
  customPricesCount: number;
  lastUpdated: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  cost?: number;
  customPrice?: number;
  tierPrice?: number;
  customPriceType?: 'custom' | 'tier';
  categoryName?: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  subcategories: Subcategory[];
  productCount: number;
}

interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  parentId?: string;
  color: string;
  level: number;
}

interface SubcategoryPath {
  id: string;
  name: string;
  level: number;
  color: string;
}

export default function CustomPricelistsPage() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategoryPath, setSelectedSubcategoryPath] = useState<SubcategoryPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerSelector, setShowCustomerSelector] = useState(true);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  
  // Modal states for new features
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);
  const [selectedProductForCopy, setSelectedProductForCopy] = useState<Product | null>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [copyTargetCustomer, setCopyTargetCustomer] = useState<string>('');
  
  // Bulk selection states
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showBulkCopyModal, setShowBulkCopyModal] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerProducts();
    }
  }, [selectedCustomer, selectedSubcategoryPath, selectedCategory, selectedPath]);

  // Advanced cascading category logic (from NewQuotePage)
  const getSubcategoriesAtLevel = (level: number, parentId?: string) => {
    const category = categories.find(c => c.id === selectedCategory);
    if (!category) return [];
    
    return category.subcategories?.filter((sub: any) => 
      sub.level === level && sub.parentId === parentId
    ) || [];
  };

  const handleSubcategorySelectionAtLevel = (level: number, subcategoryId: string) => {
    if (!subcategoryId) {
      // Clear from this level onwards
      setSelectedPath(selectedPath.slice(0, level));
      return;
    }
    
    const category = categories.find(c => c.id === selectedCategory);
    if (!category) return;
    
    const subcategory = category.subcategories?.find((sub: any) => sub.id === subcategoryId);
    if (subcategory) {
      const newPath = selectedPath.slice(0, level).concat([{
        id: subcategory.id,
        name: subcategory.name,
        level: subcategory.level || level,
        color: subcategory.color
      }]);
      setSelectedPath(newPath);
    }
  };

  const getMaxLevel = () => {
    const category = categories.find(c => c.id === selectedCategory);
    if (!category || !category.subcategories) return -1;
    
    return Math.max(-1, ...category.subcategories.map((sub: any) => sub.level || 0));
  };

  // Get level field names for better UX
  const getLevelFieldName = (level: number) => {
    switch (level) {
      case 0: return 'Category';
      case 1: return 'Subcategory';
      case 2: return 'Type';
      case 3: return 'Dimensions';
      default: return `Level ${level + 1}`;
    }
  };

  // Advanced cascading dropdowns (from NewQuotePage)
  const renderCategoryDropdowns = () => {
    const dropdowns = [];
    
    // Main category dropdown
    dropdowns.push(
      <CustomDropdown
        key="main-category"
        label="Category"
        value={selectedCategory}
        placeholder="All Categories"
        options={Array.isArray(categories) ? categories.map(cat => ({
          value: cat.id,
          label: cat.name,
          color: cat.color
        })) : []}
        onChange={(value) => {
          setSelectedCategory(value);
          setSelectedPath([]);
        }}
      />
    );

    // Dynamic subcategory dropdowns based on selected category
    if (selectedCategory && !loading) {
      const maxLevel = getMaxLevel();
      
      for (let level = 0; level <= maxLevel; level++) {
        const parentId = level === 0 ? undefined : selectedPath[level - 1]?.id;
        const subcategoriesAtLevel = getSubcategoriesAtLevel(level, parentId);
        
        if (subcategoriesAtLevel.length > 0) {
          const fieldName = level === 0 ? 'Subcategory' : 
                           level === 1 ? 'Category Type' : 
                           level === 2 ? 'Specification' : 
                           `Option ${level + 1}`;
          
          dropdowns.push(
            <CustomDropdown
              key={`level-${level}`}
              label={fieldName}
              value={selectedPath[level]?.id || ''}
              placeholder={`Select ${fieldName}...`}
              options={subcategoriesAtLevel.map((sub: any) => ({
                value: sub.id,
                label: sub.name + (sub.isShared ? ' (Shared)' : ''),
                color: sub.color
              }))}
              onChange={(value) => handleSubcategorySelectionAtLevel(level, value)}
            />
          );
        }
      }
    }
    
    return dropdowns;
  };

  // Customer dropdown with same styling
  const renderCustomerDropdown = () => {
    if (!showCustomerDropdown) return null;

    return (
      <div 
        ref={customerDropdownRef}
        className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-50 w-full max-w-md"
      >
        <div className="py-2 max-h-96 overflow-y-auto">
          <div className="px-4 py-2 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search customers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {/* Add search functionality */}}
              />
            </div>
          </div>
          {customers.map((customer, index) => (
            <button
              key={customer.id}
              onClick={() => {
                handleCustomerSelect(customer);
                setShowCustomerDropdown(false);
              }}
              className={`w-full text-left px-4 py-3 transition-colors ${
                index < customers.length - 1 ? 'border-b border-gray-100' : ''
              } hover:bg-gray-50`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{customer.name}</div>
                  <div className="text-sm text-gray-600">{customer.email}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Custom Prices</div>
                  <div className="text-sm font-semibold text-blue-600">{customer.customPricesCount || 0}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadCustomers(),
        loadCategories()
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      // Load customers using dataService like other pages
      const customersData = await dataService.customers.getAll();
      console.log('📡 PriceList: Customers from dataService:', customersData);
      
      if (customersData && customersData.length > 0) {
        const parsedCustomers = customersData.map((customer: any) => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          salesRepName: customer.sales_rep_name || customer.salesRepName,
          createdAt: customer.created_at ? new Date(customer.created_at) : new Date(),
          customPricesCount: 0
        }));
        
        setCustomers(parsedCustomers);
        console.log('✅ PriceList: Loaded database customers:', parsedCustomers.length, 'customers');
      } else {
        // Try localStorage fallback
        const savedCustomers = localStorage.getItem('saleskik-customers');
        if (savedCustomers) {
          const parsedCustomers = JSON.parse(savedCustomers);
          const customersWithDates = parsedCustomers.map((customer: any) => ({
            ...customer,
            createdAt: new Date(customer.createdAt || new Date()),
            customPricesCount: 0
          }));
          setCustomers(customersWithDates);
          console.log('✅ PriceList: Loaded customers from localStorage:', customersWithDates.length);
        } else {
          setCustomers([]);
        }
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
    }
  };

  const loadCategories = async () => {
    try {
      console.log('🔍 Custom Price Lists: Loading categories from database...');
      
      // Use correct API URL with environment variable
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      
      console.log('📡 Custom Price Lists: API Response status:', response.status);
      
      if (response.ok) {
        const apiResponse = await response.json();
        console.log('📋 Custom Price Lists: Raw API response:', apiResponse);
        
        if (apiResponse.success && Array.isArray(apiResponse.data) && apiResponse.data.length > 0) {
          // Use the categories with their subcategories directly
          const transformedCategories = apiResponse.data.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            color: cat.color || '#3B82F6',
            isActive: cat.isActive,
            isStructureComplete: cat.isStructureComplete,
            subcategories: cat.subcategories || [], // Keep the subcategories!
            specialItems: cat.specialItems || [],
            createdBy: cat.createdBy || 'database',
            productCount: cat.subcategories ? cat.subcategories.length : 0,
            createdAt: cat.createdAt ? new Date(cat.createdAt) : new Date(),
            updatedAt: cat.updatedAt ? new Date(cat.updatedAt) : new Date()
          }));
          
          setCategories(transformedCategories);
          console.log('✅ Custom Price Lists: Categories loaded from database:', transformedCategories.length);
          console.log('📝 Category names:', transformedCategories.map(c => c.name).join(', '));
          return;
        } else {
          console.log('📝 Custom Price Lists: No categories in database response');
          setCategories([]);
        }
      } else {
        console.error('❌ Custom Price Lists: API call failed with status:', response.status);
        setCategories([]);
      }
    } catch (error) {
      console.error('❌ Custom Price Lists: Error loading categories:', error);
      setCategories([]);
    }
  };

  const loadCustomerProducts = async () => {
    if (!selectedCustomer) return;

    try {
      setLoading(true);
      
      // Get all products using the same dataService pattern as other pages (working!)
      const productsData = await dataService.products?.getAll() || [];
      const allProducts = Array.isArray(productsData) ? productsData : productsData.data || [];
      console.log('Custom Price Lists: Loaded products from API:', allProducts.length, 'products');
      allProducts.forEach(p => console.log('- Product for pricing:', p.sku, p.name));

      // Filter by category if selected (using same logic as other pages)
      let filteredProducts = allProducts;
      console.log('🔍 PRICELISTS: Filter debug:', {
        selectedCategory,
        selectedSubcategoryPath,
        selectedPath,
        totalProducts: allProducts.length,
        firstProduct: allProducts[0] ? {
          categoryId: allProducts[0].categoryId,
          mainCategoryId: allProducts[0].mainCategoryId,
          subCategoryId: allProducts[0].subCategoryId
        } : 'none'
      });
      
      if (selectedCategory) {
        // First filter by main category
        filteredProducts = allProducts.filter((product: any) => {
          const matches = product.categoryId === selectedCategory || 
                         product.mainCategoryId === selectedCategory ||
                         product.categoryName === categories.find(cat => cat.id === selectedCategory)?.name;
          
          console.log('🔥 PRICELISTS: Category filter check:', {
            productName: product.name,
            productCategoryId: product.categoryId,
            productMainCategoryId: product.mainCategoryId,
            selectedCategory,
            matches
          });
          
          return matches;
        });
        
        console.log('🔥 PRICELISTS: After category filter:', filteredProducts.length, 'products');
        
        // Then filter by subcategory if selected
        if (selectedPath.length > 0) {
          const targetSubcategory = selectedPath[selectedPath.length - 1];
          console.log('🔥 PRICELISTS: Filtering by subcategory:', targetSubcategory.name, 'ID:', targetSubcategory.id);
          
          filteredProducts = filteredProducts.filter((product: any) => {
            const matches = product.subCategoryId === targetSubcategory.id ||
                           product.subSubCategoryId === targetSubcategory.id ||
                           product.subSubSubCategoryId === targetSubcategory.id;
            
            console.log('🔥 PRICELISTS: Subcategory filter check:', {
              productName: product.name,
              productSubIds: {
                sub: product.subCategoryId,
                subSub: product.subSubCategoryId,
                subSubSub: product.subSubSubCategoryId
              },
              targetId: targetSubcategory.id,
              matches
            });
            
            return matches;
          });
          
          console.log('🔥 PRICELISTS: After subcategory filter:', filteredProducts.length, 'products');
        }
      }

      // Get existing custom prices for this customer
      let customPrices: any[] = [];
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const customPricingResponse = await fetch(`/api/products/${filteredProducts[0]?.id}/price-history/${selectedCustomer.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          // For now, we'll load custom prices individually as needed
        }
      } catch (error) {
        console.log('Custom pricing lookup failed, showing base prices');
      }

      // Transform products for display
      const productsForDisplay = filteredProducts.map((product: any) => ({
        id: product.id,
        name: product.name,
        sku: product.sku || product.code,
        cost: parseFloat(product.cost) || 0,
        tierPrice: parseFloat(product.cost) || 0, // Use cost as base price for now
        customPrice: undefined, // Will be populated when user sets custom price
        customPriceType: 'tier', // Default to tier pricing
        categoryName: product.categoryMappings?.[0]?.category?.name || product.categoryName || 'Uncategorized'
      }));

      setProducts(productsForDisplay);
      console.log('Custom Price Lists: Displaying products:', productsForDisplay.length, 'products');
      console.log('🎯 PRICELISTS: Setting filtered products in state:', productsForDisplay.map(p => p.name));
      productsForDisplay.forEach(p => console.log('- Display product:', p.sku, p.name));

    } catch (error) {
      console.error('Error loading customer products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerSelector(false);
  };

  const handlePriceUpdate = async (productId: string, newPrice: number) => {
    if (!selectedCustomer || savingPrice) return; // Prevent multiple concurrent saves

    setSavingPrice(true);
    console.log('Attempting to save custom price:', { 
      productId, 
      customerId: selectedCustomer.id, 
      customerName: selectedCustomer.name,
      newPrice 
    });

    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        alert('Authentication required. Please log in again.');
        setSavingPrice(false);
        return;
      }

      const response = await fetch(`/api/products/${productId}/custom-price/${selectedCustomer.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          custom_price: newPrice,
          reason: 'Price updated from admin interface'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update price (${response.status})`);
      }

      const result = await response.json();
      console.log('Price updated successfully:', result);

      // Update the price in the UI immediately
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === productId 
            ? { ...p, customPrice: newPrice, customPriceType: 'custom' }
            : p
        )
      );
      
      // Show success message
      const product = products.find(p => p.id === productId);
      console.log(`Updated price for ${product?.name || 'product'} to $${newPrice.toFixed(2)}`);
      alert(`Price updated to $${newPrice.toFixed(2)} successfully!`);
      
    } catch (error) {
      console.error('Error updating price:', error);
      alert(`Failed to update price: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setSavingPrice(false); // Always reset saving state
    }
  };

  const handleShowHistory = async (product: Product) => {
    if (!selectedCustomer) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/products/${product.id}/price-history/${selectedCustomer.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Price history loaded:', data.data);
        setPriceHistory(data.data || []);
      } else {
        console.error('Error loading price history:', response.status);
        // Fallback to showing original price
        setPriceHistory([
          {
            id: 'original',
            oldPrice: null,
            newPrice: product.cost || product.tierPrice || 0,
            changeType: 'original',
            changedAt: new Date().toISOString(),
            reason: 'Original product cost price',
            changer: { firstName: 'System', lastName: '', email: 'system@saleskik.com' }
          }
        ]);
      }
      
      setSelectedProductForHistory(product);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Error loading price history:', error);
      // Show fallback history
      setPriceHistory([
        {
          id: 'original',
          oldPrice: null,
          newPrice: product.cost || product.tierPrice || 0,
          changeType: 'original',
          changedAt: new Date().toISOString(),
          reason: 'Original product cost price',
          changer: { firstName: 'System', lastName: '', email: 'system@saleskik.com' }
        }
      ]);
      setSelectedProductForHistory(product);
      setShowHistoryModal(true);
    }
  };

  const handleCopyPrice = (product: Product) => {
    setSelectedProductForCopy(product);
    setCopyTargetCustomer('');
    setShowCopyModal(true);
  };

  const handleCopyPriceToCustomer = async () => {
    if (!selectedProductForCopy || !copyTargetCustomer || !selectedCustomer) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/custom-pricelists/copy/${selectedCustomer.id}/${copyTargetCustomer}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          categoryIds: [selectedProductForCopy.id] // Copy just this product
        })
      });

      if (response.ok) {
        const targetCustomerName = customers.find(c => c.id === copyTargetCustomer)?.name;
        alert(`Custom price for "${selectedProductForCopy.name}" copied to ${targetCustomerName} successfully!`);
      } else {
        alert('Failed to copy price. Please try again.');
      }
    } catch (error) {
      console.error('Error copying price:', error);
      alert('Failed to copy price. Please try again.');
    }
    
    setShowCopyModal(false);
    setSelectedProductForCopy(null);
    setCopyTargetCustomer('');
  };

  // Bulk selection functions
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    const productsWithCustomPrices = filteredProducts.filter(p => p.customPrice);
    if (selectedProducts.length === productsWithCustomPrices.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(productsWithCustomPrices.map(p => p.id));
    }
  };

  const handleBulkCopyPrice = () => {
    if (selectedProducts.length === 0) {
      alert('Please select products to copy');
      return;
    }
    setCopyTargetCustomer('');
    setShowBulkCopyModal(true);
  };

  const handleBulkCopyToCustomer = async () => {
    if (!selectedCustomer || selectedProducts.length === 0 || !copyTargetCustomer) return;

    try {
      const token = localStorage.getItem('accessToken');
      let successCount = 0;
      
      // Copy each selected product's custom price
      for (const productId of selectedProducts) {
        const product = products.find(p => p.id === productId);
        if (product?.customPrice) {
          const response = await fetch(`/api/products/${productId}/custom-price/${copyTargetCustomer}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              custom_price: product.customPrice,
              reason: `Copied from ${selectedCustomer.name}`
            })
          });

          if (response.ok) {
            successCount++;
          }
        }
      }

      const targetCustomerName = customers.find(c => c.id === copyTargetCustomer)?.name;
      alert(`Successfully copied ${successCount} custom prices to ${targetCustomerName}!`);
      
      setShowBulkCopyModal(false);
      setSelectedProducts([]);
      setCopyTargetCustomer('');
    } catch (error) {
      console.error('Error bulk copying prices:', error);
      alert('Failed to copy prices. Please try again.');
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const productsWithCustomPrices = filteredProducts.filter(p => p.customPrice);

  if (loading && !selectedCustomer) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <UniversalNavigation 
          currentPage="Custom Price Lists"
          isOpen={showSidebar} 
          onClose={() => setShowSidebar(false)} 
        />
        <div className="flex-1">
          <UniversalHeader 
            title="Custom Price Lists"
            onMenuToggle={() => setShowSidebar(!showSidebar)}
          />
          <div className="p-6 flex items-center justify-center">
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <UniversalNavigation 
        currentPage="Custom Price Lists"
        isOpen={showSidebar} 
        onClose={() => setShowSidebar(false)} 
      />
      <div className="flex-1">
        <UniversalHeader 
          title="Custom Price Lists"
          onMenuToggle={() => setShowSidebar(!showSidebar)}
        />
        
        <div className="p-6">
          {/* Header with customer selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Custom Price Lists</h1>
                <p className="text-gray-600">Manage customer-specific pricing</p>
              </div>
              {selectedCustomer && (
                <button
                  onClick={() => setShowCustomerSelector(true)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Change Customer
                </button>
              )}
            </div>

            {selectedCustomer && !showCustomerSelector && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UserGroupIcon className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{selectedCustomer.name}</h3>
                      <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Custom Prices</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedCustomer.customPricesCount || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Customer Selector with Custom Dropdown Style */}
          {(!selectedCustomer || showCustomerSelector) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <UserGroupIcon className="w-6 h-6 text-gray-400 mr-2" />
                  <h2 className="text-lg font-medium text-gray-900">Select Customer</h2>
                </div>
                
                <div className="relative">
                  <CustomDropdown
                    label="Customer"
                    required={true}
                    value={selectedCustomer?.id || ''}
                    placeholder="Choose a customer..."
                    options={customers.map(customer => ({
                      value: customer.id,
                      label: `${customer.name} (${customer.customPricesCount || 0} custom prices)`,
                      color: '#3B82F6'
                    }))}
                    onChange={(customerId) => {
                      const customer = customers.find(c => c.id === customerId);
                      if (customer) {
                        handleCustomerSelect(customer);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Product Pricing Grid */}
          {selectedCustomer && !showCustomerSelector && (
            <div className="space-y-6">
              {/* Filters with Cascading Category Dropdowns */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Product Filters</h3>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setBulkMode(!bulkMode)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                        bulkMode 
                          ? 'bg-orange-600 text-white hover:bg-orange-700' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {bulkMode ? 'Exit Bulk Mode' : 'Bulk Select'}
                    </button>
                    {bulkMode && selectedProducts.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {selectedProducts.length} selected
                        </span>
                        <button
                          onClick={handleBulkCopyPrice}
                          className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center transition-all duration-200 shadow-sm"
                        >
                          <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                          Copy All
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search products by name or SKU..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                    />
                  </div>
                </div>

                {/* Cascading Category Dropdowns */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Navigate through your category structure to filter products by classification.
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {renderCategoryDropdowns()}
                  </div>
                  
                  {/* Selected Path Display (Enhanced from NewQuotePage) */}
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {bulkMode && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedProducts.length === productsWithCustomPrices.length && productsWithCustomPrices.length > 0}
                            onChange={selectAllProducts}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Custom Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Margin
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          Loading products...
                        </td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          No products found
                        </td>
                      </tr>
                    ) : (
                      products.map((product) => (
                        <ProductRow
                          key={product.id}
                          product={product}
                          onPriceUpdate={(newPrice) => handlePriceUpdate(product.id, newPrice)}
                          onShowHistory={handleShowHistory}
                          onCopyPrice={handleCopyPrice}
                          allCustomers={customers}
                          bulkMode={bulkMode}
                          isSelected={selectedProducts.includes(product.id)}
                          onToggleSelection={toggleProductSelection}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Price History Modal */}
          {showHistoryModal && selectedProductForHistory && (
            <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-8 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Price History: {selectedProductForHistory.name}
                  </h3>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-3">
                  {priceHistory.map((entry, index) => (
                    <div key={entry.id || index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {entry.changeType === 'original' ? 'Original Price' : 
                             entry.changeType === 'create' ? 'Custom Price Set' :
                             entry.changeType === 'update' ? 'Price Updated' : 
                             'Price Changed'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(entry.changedAt).toLocaleDateString()} by {entry.changer.firstName} {entry.changer.lastName}
                          </div>
                          {entry.reason && (
                            <div className="text-xs text-gray-400 mt-1">{entry.reason}</div>
                          )}
                        </div>
                        <div className="text-right">
                          {entry.oldPrice && (
                            <div className="text-sm text-gray-500 line-through">
                              ${entry.oldPrice.toFixed(2)}
                            </div>
                          )}
                          <div className="text-sm font-medium text-green-600">
                            ${entry.newPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Copy Price Modal */}
          {showCopyModal && selectedProductForCopy && (
            <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-8 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Copy Custom Price
                  </h3>
                  <button
                    onClick={() => setShowCopyModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Product:</div>
                    <div className="text-sm text-gray-900">{selectedProductForCopy.name}</div>
                    <div className="text-xs text-gray-500">{selectedProductForCopy.sku}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Current Price:</div>
                    <div className="text-sm font-medium text-blue-600">
                      ${(selectedProductForCopy.customPrice || selectedProductForCopy.tierPrice || 0).toFixed(2)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Copy to Customer:
                    </label>
                    <select
                      value={copyTargetCustomer}
                      onChange={(e) => setCopyTargetCustomer(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select customer...</option>
                      {customers.filter(c => c.id !== selectedCustomer?.id).map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCopyModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCopyPriceToCustomer}
                    disabled={!copyTargetCustomer}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Copy Modal */}
          {showBulkCopyModal && (
            <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-8 max-w-lg w-full mx-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Copy Custom Prices
                  </h3>
                  <button
                    onClick={() => setShowBulkCopyModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Selected Products ({selectedProducts.length}):
                    </div>
                    <div className="max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-3">
                      {selectedProducts.map(productId => {
                        const product = products.find(p => p.id === productId);
                        return product ? (
                          <div key={productId} className="flex items-center justify-between py-1">
                            <span className="text-sm text-gray-900">{product.name}</span>
                            <span className="text-sm font-medium text-blue-600">
                              ${(product.customPrice || 0).toFixed(2)}
                            </span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Copy to Customer:
                    </label>
                    <select
                      value={copyTargetCustomer}
                      onChange={(e) => setCopyTargetCustomer(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select customer...</option>
                      {customers.filter(c => c.id !== selectedCustomer?.id).map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowBulkCopyModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkCopyToCustomer}
                    disabled={!copyTargetCustomer}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Copy {selectedProducts.length} Prices
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Product Row Component with Enhanced Actions
interface ProductRowProps {
  product: Product;
  onPriceUpdate: (price: number) => void;
  onShowHistory: (product: Product) => void;
  onCopyPrice: (product: Product) => void;
  allCustomers: Customer[];
  bulkMode: boolean;
  isSelected: boolean;
  onToggleSelection: (productId: string) => void;
}

function ProductRow({ product, onPriceUpdate, onShowHistory, onCopyPrice, allCustomers, bulkMode, isSelected, onToggleSelection }: ProductRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editPrice, setEditPrice] = useState(product.customPrice?.toString() || '');

  const handleSave = () => {
    const newPrice = parseFloat(editPrice);
    if (isNaN(newPrice) || newPrice <= 0) {
      alert('Please enter a valid price');
      return;
    }
    onPriceUpdate(newPrice);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditPrice(product.customPrice?.toString() || '');
    setIsEditing(false);
  };

  const currentPrice = product.customPrice || product.tierPrice || 0;
  const cost = product.cost || 0;
  const margin = cost > 0 ? ((currentPrice - cost) / currentPrice * 100) : 0;

  return (
    <tr>
      {bulkMode && (
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection(product.id)}
            disabled={!product.customPrice}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
          />
        </td>
      )}
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">{product.name}</div>
          <div className="text-sm text-gray-500">{product.sku}</div>
          {product.categoryName && (
            <div className="text-xs text-gray-400">{product.categoryName}</div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <span className="text-sm text-gray-900">${(product.tierPrice || 0).toFixed(2)}</span>
          <span className="ml-2 text-xs text-gray-500">Tier</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {isEditing ? (
          <div className="flex items-center space-x-2">
            <input
              type="number"
              step="0.01"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleSave}
              className="text-green-600 hover:text-green-800 text-sm"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <span className={`text-sm ${product.customPrice ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
              ${currentPrice.toFixed(2)}
            </span>
            {product.customPrice && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Custom
              </span>
            )}
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${cost.toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`text-sm ${margin > 30 ? 'text-green-600' : margin > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
          {margin.toFixed(1)}%
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        {!isEditing && (
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => onShowHistory(product)}
              className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
            >
              History
            </button>
            <button
              onClick={() => onCopyPrice(product)}
              className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
            >
              Copy
            </button>
            {product.customPrice && (
              <button
                onClick={() => {/* Handle revert to tier */}}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Revert
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}