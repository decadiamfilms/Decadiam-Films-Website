import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../layout/UniversalNavigation';
import UniversalHeader from '../layout/UniversalHeader';
import HybridBulkUpload from './HybridBulkUpload';
import { 
  PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, 
  PhotoIcon, DocumentArrowDownIcon, CubeIcon, 
  ExclamationTriangleIcon, CheckIcon, TagIcon,
  BuildingStorefrontIcon, XMarkIcon, DocumentDuplicateIcon,
  CloudArrowUpIcon, ChevronDownIcon, ChevronRightIcon,
  ChevronUpDownIcon
} from '@heroicons/react/24/outline';
import { dataService } from '../../services/api.service';
// Using custom sequential dropdowns instead of CascadingCategoryDropdown


// Product interface matching your software structure
interface Product {
  id: string;
  code: string; // Product Code like 12F-100
  productType: string; // Like "Frameless Pool Fencing Glass"
  name: string; // Like "1175 x 100 mm - 12mm Clear Toughened"
  size: string; // Like "1175 x 100 mm" or "Large" or "Standard"
  weight: number;
  cost: number; // T1, T2, T3 pricing tiers
  priceT1: number;
  priceT2: number; 
  priceT3: number;
  priceN: number; // Net price
  categoryId: string;
  categoryName: string;
  subcategoryPath: SubcategoryPath[];
  inventory: {
    currentStock: number;
    reorderPoint: number;
    supplier: string;
    primaryLocation?: string;
  };
  isActive: boolean;
  isUsedInDocuments?: boolean; // Track if product is used anywhere in the system
  createdAt: Date;
  updatedAt: Date;
}

interface SubcategoryPath {
  id: string;
  name: string;
  level: number;
  color: string;
}

interface CustomDropdownOption {
  value: string;
  label: string;
  color?: string;
}

interface CustomDropdownProps {
  label: string;
  required?: boolean;
  value: string;
  placeholder: string;
  options: CustomDropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  isLast?: boolean;
}

function CustomDropdown({ 
  label, 
  required, 
  value, 
  placeholder, 
  options, 
  onChange, 
  disabled,
  isLast 
}: CustomDropdownProps) {
  console.log('CustomDropdown rendered with:', { label, value, placeholder, optionsCount: options.length });
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (disabled) {
    return (
      <div className="w-48 px-4 py-3 bg-gray-100 text-gray-400 border border-gray-200 rounded-xl">
        {placeholder}
      </div>
    );
  }

  return (
    <div className="min-w-56 w-auto relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 text-left border-2 rounded-xl transition-all duration-200 flex items-center justify-between whitespace-nowrap ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-200 bg-white shadow-lg'
            : 'border-gray-300 hover:border-blue-400 bg-white shadow-sm'
        }`}
      >
        <span className={selectedOption ? 'text-gray-900 font-medium' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-50 w-fit min-w-full"
        >
          <div className="py-2">
            <button
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors border-b border-gray-200"
            >
              {placeholder}
            </button>
            {options.map((option, index) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 transition-colors whitespace-nowrap ${
                  index < options.length - 1 ? 'border-b border-gray-100' : ''
                } ${
                  option.value === value 
                    ? 'bg-blue-50 text-blue-700 font-semibold' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
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

export default function ProductManagement() {
  const navigate = useNavigate();

  // Helper function to reconstruct subcategory path from database IDs
  const reconstructSubcategoryPath = (mainCategoryId: string, subCategoryId: string, subSubCategoryId: string, subSubSubCategoryId: string, categories: Category[]) => {
    const path: SubcategoryPath[] = [];
    
    if (!categories || categories.length === 0) return path;
    
    // Find the main category
    const mainCategory = categories.find(cat => cat.id === mainCategoryId);
    if (!mainCategory) return path;
    
    // Build path from subcategory IDs
    const addToPath = (subcategoryId: string, level: number) => {
      const subcategory = mainCategory.subcategories?.find(sub => sub.id === subcategoryId);
      if (subcategory) {
        path.push({
          id: subcategory.id,
          name: subcategory.name,
          level: level,
          color: subcategory.color
        });
      }
    };
    
    if (subCategoryId) addToPath(subCategoryId, 0);
    if (subSubCategoryId) addToPath(subSubCategoryId, 1);
    if (subSubSubCategoryId) addToPath(subSubSubCategoryId, 2);
    
    console.log('🔗 Reconstructed subcategory path:', path.map(p => p.name).join(' → '));
    return path;
  };
  const [showSidebar, setShowSidebar] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // Sequential cascading dropdown state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');
  const [selectedSubSubcategoryId, setSelectedSubSubcategoryId] = useState<string>('');
  const [selectedSubSubSubcategoryId, setSelectedSubSubSubcategoryId] = useState<string>('');
  
  // Available options for each level
  const [level1Options, setLevel1Options] = useState<any[]>([]);
  const [level2Options, setLevel2Options] = useState<any[]>([]);
  const [level3Options, setLevel3Options] = useState<any[]>([]);
  
  // Keep the legacy subcategory path for backward compatibility
  const [selectedSubcategoryPath, setSelectedSubcategoryPath] = useState<SubcategoryPath[]>([]);
  
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pricingTierNames, setPricingTierNames] = useState({
    t1: 'T1',
    t2: 'T2', 
    t3: 'T3',
    net: 'T4'
  });
  const [showTierSettings, setShowTierSettings] = useState(false);
  const [showInactiveProducts, setShowInactiveProducts] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  useEffect(() => {
    loadData();
    loadPricingTierNames();
  }, []);

  const loadPricingTierNames = () => {
    try {
      const saved = localStorage.getItem('saleskik-pricing-tier-names');
      if (saved) {
        setPricingTierNames(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading pricing tier names:', error);
    }
  };

  const savePricingTierNames = (names: typeof pricingTierNames) => {
    try {
      localStorage.setItem('saleskik-pricing-tier-names', JSON.stringify(names));
      setPricingTierNames(names);
    } catch (error) {
      console.error('Error saving pricing tier names:', error);
    }
  };

  // Check if a product is used anywhere in the system
  const isProductUsedAnywhere = (productId: string) => {
    // This would check against quotes, orders, invoices, and any other forms/documents
    // For now, we'll simulate this - in real app this would query your backend
    
    // Check localStorage for any references to this product
    try {
      const quotes = localStorage.getItem('saleskik-quotes');
      const orders = localStorage.getItem('saleskik-orders'); 
      const invoices = localStorage.getItem('saleskik-invoices');
      
      // Check if product ID appears in any of these documents
      const allDocuments = [quotes, orders, invoices].filter(Boolean);
      return allDocuments.some(doc => doc && doc.includes(productId));
    } catch (error) {
      return false; // If error checking, assume not used
    }
  };

  // Toggle product active status
  const toggleProductStatus = async (productId: string) => {
    const updatedProducts = products.map(p => 
      p.id === productId ? { ...p, isActive: !p.isActive, updatedAt: new Date() } : p
    );
    setProducts(updatedProducts);
    await dataService.products.save(updatedProducts);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load categories from database
      const categoriesData = await dataService.categories.getAll();
      setCategories(categoriesData);
      console.log('📂 ProductManagement: Loaded categories:', categoriesData.length);

      // Load locations (with fallback)
      try {
        const locationsData = await dataService.locations.getAll();
        const activeLocations = locationsData.filter((loc: any) => loc.isActive);
        setLocations(activeLocations);
      } catch (error) {
        console.log('📍 Using fallback locations');
        setLocations([{ id: 'main', name: 'Main Warehouse', isActive: true }]);
      }

      // Load products from database
      const productsData = await dataService.products.getAll();
      console.log('📦 ProductManagement: Loaded products from database:', productsData.length);
      
      // Simple transformation - minimal changes to avoid errors
      const parsedProducts = productsData.map((product: any) => ({
        ...product,
        // Map database fields to frontend expected fields
        categoryId: product.categoryId || product.category_id,
        categoryName: product.categoryName || product.category?.name || 'Unknown',
        productType: product.categoryName || product.category?.name || 'Unknown', 
        size: product.size || product.dimensions?.size || '',
        weight: product.weight || 0,
        // Reconstruct subcategory path from database IDs with enhanced logging
        subcategoryPath: (() => {
          const path = reconstructSubcategoryPath(
            product.mainCategoryId || product.categoryId, 
            product.subCategoryId,
            product.subSubCategoryId, 
            product.subSubSubCategoryId,
            categories
          );
          console.log('🔗 Product', product.name, 'reconstructed path:', path.map(p => p.name));
          return path;
        })(),
        inventory: {
          currentStock: product.inventory?.current_stock || product.inventory?.currentStock || 0,
          reorderPoint: product.inventory?.reorder_point || 10,
          supplier: 'Unknown',
          primaryLocation: 'Main Warehouse'
        },
        // Map pricing fields - handle both API formats
        cost: product.pricing?.cost_price || product.pricing?.[0]?.cost_price || product.cost || 0,
        priceT1: product.pricing?.tier_1 || product.pricing?.[0]?.tier_1 || product.priceT1 || 0,
        priceT2: product.pricing?.tier_2 || product.pricing?.[0]?.tier_2 || product.priceT2 || 0,
        priceT3: product.pricing?.tier_3 || product.pricing?.[0]?.tier_3 || product.priceT3 || 0,
        priceN: product.pricing?.retail || product.pricing?.[0]?.retail || product.priceN || 0,
        isActive: product.isActive !== undefined ? product.isActive : true, // Default to true if not specified
        createdAt: new Date(product.created_at || new Date()),
        updatedAt: new Date(product.updated_at || new Date())
      }));
      
      console.log('📋 ProductManagement: Transformed products:', parsedProducts.length);
      if (parsedProducts.length > 0) {
        console.log('📋 First product:', parsedProducts[0].code, parsedProducts[0].name);
      }
      
      setProducts(parsedProducts);
      
      if (productsData.length === 0) {
        console.log('📝 ProductManagement: No products in database - showing empty table');
      } else {
        console.log('✅ ProductManagement: Showing', productsData.length, 'products from database');
      }
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
      setProducts([]); // Show empty table on error
    } finally {
      setLoading(false);
    }
  };

  // Get subcategories for selected category (flattened)
  const getSubcategoriesForCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return [];
    return category.subcategories || [];
  };

  // Handle bulk upload
  const handleBulkUpload = async (newProducts: Product[]) => {
    const updatedProducts = [...products, ...newProducts];
    setProducts(updatedProducts);
    await dataService.products.save(updatedProducts);
  };

  // Sequential cascading dropdown loading functions
  const loadLevel1Options = async (categoryId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      const data = await response.json();
      
      if (data.success) {
        const category = data.data.find((cat: any) => cat.id === categoryId);
        if (category && category.subcategories) {
          // Get only level 0 subcategories (direct children of main category)
          const level0Subs = category.subcategories
            .filter((sub: any) => sub.level === 0 && !sub.parent_id)
            .map((sub: any) => ({
              value: sub.id,
              label: sub.name,
              color: sub.color
            }));
          setLevel1Options(level0Subs);
        } else {
          setLevel1Options([]);
        }
      }
    } catch (error) {
      console.error('Failed to load level 1 options:', error);
      setLevel1Options([]);
    }
  };

  const loadLevel2Options = async (subcategoryId: string) => {
    try {
      console.log('🔍 Filter: Loading Level 2 options for parent:', subcategoryId);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      const data = await response.json();
      
      if (data.success) {
        // Find all subcategories with this parentId (using flat structure)
        let level1Children: any[] = [];
        for (const category of data.data) {
          if (category.subcategories) {
            const children = category.subcategories.filter((sub: any) => 
              sub.parentId === subcategoryId
            );
            level1Children.push(...children);
          }
        }
        
        console.log('📂 Filter: Found Level 2 options:', level1Children.map(c => c.name));
        
        const level2Options = level1Children.map((child: any) => ({
          value: child.id,
          label: child.name,
          color: child.color
        }));
        
        setLevel2Options(level2Options);
      }
    } catch (error) {
      console.error('Failed to load level 2 options:', error);
      setLevel2Options([]);
    }
  };

  const loadLevel3Options = async (subcategoryId: string) => {
    try {
      console.log('🔍 Filter: Loading Level 3 options for parent:', subcategoryId);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      const data = await response.json();
      
      if (data.success) {
        // Find all subcategories with this parentId (using flat structure)
        let level2Children: any[] = [];
        for (const category of data.data) {
          if (category.subcategories) {
            const children = category.subcategories.filter((sub: any) => 
              sub.parentId === subcategoryId
            );
            level2Children.push(...children);
          }
        }
        
        console.log('📂 Filter: Found Level 3 options:', level2Children.map(c => c.name));
        
        const level3Options = level2Children.map((child: any) => ({
          value: child.id,
          label: child.name,
          color: child.color
        }));
        
        setLevel3Options(level3Options);
      }
    } catch (error) {
      console.error('Failed to load level 3 options:', error);
      setLevel3Options([]);
    }
  };

  // Helper function to find subcategory by ID in nested structure
  const findSubcategoryInHierarchy = (subcategories: any[], targetId: string): any => {
    for (const sub of subcategories) {
      if (sub.id === targetId) {
        return sub;
      }
      if (sub.children && sub.children.length > 0) {
        const found = findSubcategoryInHierarchy(sub.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  // Filter products with proper useMemo dependencies
  const filteredProducts = useMemo(() => {
    console.log('🔄 Filtering products with:', {
      searchKeyword,
      selectedCategoryId,
      selectedSubcategoryId,
      selectedSubSubcategoryId,
      selectedSubSubSubcategoryId,
      showInactiveProducts,
      totalProducts: products.length
    });

    return products.filter(product => {
      const matchesSearch = !searchKeyword || 
        product.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        product.code.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        product.productType.toLowerCase().includes(searchKeyword.toLowerCase());
      
      const matchesCategory = !selectedCategoryId || product.categoryId === selectedCategoryId;
      
      // Enhanced multi-level subcategory filtering
      let matchesSubcategory = true;
      
      // If any subcategory filter is selected, apply hierarchical filtering
      if (selectedSubcategoryId || selectedSubSubcategoryId || selectedSubSubSubcategoryId) {
        // Check if product matches at the deepest selected level
        if (selectedSubSubSubcategoryId) {
          // Level 3 selected - product must match this exact level
          matchesSubcategory = product.subSubSubCategoryId === selectedSubSubSubcategoryId;
        } else if (selectedSubSubcategoryId) {
          // Level 2 selected - product must match this level (or have this as parent)
          matchesSubcategory = product.subSubCategoryId === selectedSubSubcategoryId ||
                               product.subSubSubCategoryId === selectedSubSubcategoryId;
        } else if (selectedSubcategoryId) {
          // Level 1 selected - product must match this level (or have this as ancestor)
          matchesSubcategory = product.subCategoryId === selectedSubcategoryId ||
                               product.subSubCategoryId === selectedSubcategoryId ||
                               product.subSubSubCategoryId === selectedSubcategoryId;
        }
      }
      
      const matchesStatus = showInactiveProducts ? true : product.isActive;
      
      const matches = matchesSearch && matchesCategory && matchesSubcategory && matchesStatus;
      
      if (selectedSubcategoryId && product.categoryId === selectedCategoryId) {
        console.log('🔍 Product filter check:', {
          productName: product.name,
          productSubCategoryId: product.subCategoryId,
          selectedSubcategoryId,
          matchesSubcategory,
          matches
        });
      }
      
      return matches;
    });
  }, [
    products, 
    searchKeyword, 
    selectedCategoryId, 
    selectedSubcategoryId, 
    selectedSubSubcategoryId, 
    selectedSubSubSubcategoryId, 
    showInactiveProducts
  ]);

  if (loading) {
    return <div className="p-8">Loading products...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="products" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        onOpen={() => setShowSidebar(true)}
      />

      <UniversalHeader
        title="Product Management"
        subtitle="Manage your product catalog and pricing"
        onMenuToggle={() => setShowSidebar(true)}
        actions={
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              Products: {products.length}
            </div>
          </div>
        }
      />

      <div className="p-8 max-w-full mx-auto">
        {/* Minimalistic Left-Aligned Header */}
        <div className="flex items-center gap-6 py-4 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
            <CubeIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Product Management</h2>
            <p className="text-sm text-gray-600">Manage your product catalog</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (categories.length === 0) {
                  navigate('/inventory/builder');
                  return;
                }
                setEditingProduct(null);
                setShowProductForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              {categories.length === 0 ? (
                <>
                  <TagIcon className="w-4 h-4" />
                  Set Up Categories
                </>
              ) : (
                <>
                  <PlusIcon className="w-4 h-4" />
                  Add Product
                </>
              )}
            </button>

            {categories.length > 0 && (
              <button
                onClick={() => setShowBulkUpload(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <CloudArrowUpIcon className="w-4 h-4" />
                Bulk Upload
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Filter Section */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl border-2 border-blue-100 p-8 mb-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Filter & Search Products
              </h3>
              <p className="text-gray-600 text-lg">Find exactly what you're looking for</p>
            </div>
            
            {/* Search bar in top right */}
            <div className="relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-80 px-5 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-base bg-white shadow-sm"
                placeholder="Search by name, code, size..."
              />
              <MagnifyingGlassIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-6">
            {/* Category and Subcategory Filters */}
            <div className="flex items-center gap-2 flex-wrap flex-1 min-h-16">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Main Category Dropdown */}
                <div className="flex items-center gap-2">
                  <label className="text-base font-bold text-gray-700">Category:</label>
                  <CustomDropdown
                    label=""
                    value={selectedCategoryId}
                    placeholder="All Categories"
                    options={Array.isArray(categories) ? categories.map(cat => ({
                      value: cat.id,
                      label: cat.name,
                      color: cat.color
                    })) : []}
                    onChange={(value) => {
                      console.log('Main category selected:', value);
                      setSelectedCategoryId(value);
                      // Reset subsequent selections
                      setSelectedSubcategoryId('');
                      setSelectedSubSubcategoryId('');
                      setSelectedSubSubSubcategoryId('');
                      setLevel1Options([]);
                      setLevel2Options([]);
                      setLevel3Options([]);
                      // Load next level if category selected
                      if (value) {
                        loadLevel1Options(value);
                      }
                    }}
                  />
                </div>

                {/* Level 1 Subcategory Dropdown - Only show if main category selected and has options */}
                {selectedCategoryId && level1Options.length > 0 && (
                  <div className="flex items-center gap-2">
                    <CustomDropdown
                      label=""
                      value={selectedSubcategoryId}
                      placeholder="Select subcategory..."
                      options={level1Options}
                      onChange={(value) => {
                        console.log('Level 1 subcategory selected:', value);
                        setSelectedSubcategoryId(value);
                        // Reset subsequent selections
                        setSelectedSubSubcategoryId('');
                        setSelectedSubSubSubcategoryId('');
                        setLevel2Options([]);
                        setLevel3Options([]);
                        // Load next level if subcategory selected
                        if (value) {
                          loadLevel2Options(value);
                        }
                      }}
                    />
                  </div>
                )}

                {/* Level 2 Sub-Subcategory Dropdown - Only show if level 1 selected and has options */}
                {selectedSubcategoryId && level2Options.length > 0 && (
                  <div className="flex items-center gap-2">
                    <CustomDropdown
                      label=""
                      value={selectedSubSubcategoryId}
                      placeholder="Select sub-subcategory..."
                      options={level2Options}
                      onChange={(value) => {
                        console.log('Level 2 sub-subcategory selected:', value);
                        setSelectedSubSubcategoryId(value);
                        // Reset subsequent selections
                        setSelectedSubSubSubcategoryId('');
                        setLevel3Options([]);
                        // Load next level if sub-subcategory selected
                        if (value) {
                          loadLevel3Options(value);
                        }
                      }}
                    />
                  </div>
                )}

                {/* Level 3 Sub-Sub-Subcategory Dropdown - Only show if level 2 selected and has options */}
                {selectedSubSubcategoryId && level3Options.length > 0 && (
                  <div className="flex items-center gap-2">
                    <CustomDropdown
                      label=""
                      value={selectedSubSubSubcategoryId}
                      placeholder="Select final category..."
                      options={level3Options}
                      onChange={(value) => {
                        console.log('Level 3 final category selected:', value);
                        setSelectedSubSubSubcategoryId(value);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-base font-medium text-gray-700">Include Inactive:</span>
              <button
                onClick={() => {
                  console.log('Toggle clicked, current state:', showInactiveProducts);
                  setShowInactiveProducts(!showInactiveProducts);
                  console.log('New state will be:', !showInactiveProducts);
                }}
                className={`w-14 h-7 rounded-full cursor-pointer transition-all duration-200 flex items-center px-1 hover:shadow-md ${
                  showInactiveProducts 
                    ? 'bg-orange-500' 
                    : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                  showInactiveProducts ? 'translate-x-6' : 'translate-x-0'
                }`}></div>
              </button>
              <span className={`text-base font-medium ${showInactiveProducts ? 'text-orange-600' : 'text-gray-500'}`}>
                {showInactiveProducts ? 'Showing All' : 'Active Only'}
              </span>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full table-auto">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-base font-bold text-gray-800 border-r border-gray-200">
                    <div className="flex items-center gap-1">
                      Code
                      <span className="text-xs">⇅</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-base font-bold text-gray-800 border-r border-gray-200">
                    <div className="flex items-center gap-1">
                      Name
                      <span className="text-xs">⇅</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-base font-bold text-gray-800 border-r border-gray-200">
                    <div className="flex items-center gap-1">
                      Size
                      <span className="text-xs">⇅</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-base font-bold text-gray-800 border-r border-gray-200">
                    <div className="flex items-center gap-1">
                      Weight
                      <span className="text-xs">⇅</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-base font-bold text-gray-800 border-r border-gray-200">
                    <div className="flex items-center gap-1">
                      Cost
                      <span className="text-xs">⇅</span>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-center text-base font-bold text-blue-800 border-r border-gray-200 bg-blue-50">
                    <div className="flex items-center justify-center gap-1">
                      {pricingTierNames.t1}
                      <button
                        onClick={() => setShowTierSettings(!showTierSettings)}
                        className="p-1 text-blue-500 hover:text-blue-700 rounded transition-colors"
                        title="Customize tier names"
                      >
                        <PencilIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-center text-base font-bold text-green-800 border-r border-gray-200 bg-green-50">
                    {pricingTierNames.t2}
                  </th>
                  <th className="px-4 py-4 text-center text-base font-bold text-orange-800 border-r border-gray-200 bg-orange-50">
                    {pricingTierNames.t3}
                  </th>
                  <th className="px-4 py-4 text-center text-base font-bold text-purple-800 border-r border-gray-200 bg-purple-50">
                    {pricingTierNames.net}
                  </th>
                  <th className="px-4 py-4 text-center text-base font-bold text-gray-800 border-r border-gray-200 bg-gray-50">
                    Available Stock
                  </th>
                  <th className="px-6 py-4 text-center text-base font-bold text-gray-800">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-16 text-center">
                      <BuildingStorefrontIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
                      <p className="text-gray-600">Get started by adding your first product</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product, index) => (
                    <tr key={product.id} className={`hover:bg-blue-25 border-b-2 border-gray-100 transition-colors duration-200 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                    }`}>
                      <td className="px-6 py-4 text-base text-blue-600 font-bold border-r border-gray-200 whitespace-nowrap">
                        {product.code}
                      </td>
                      <td className="px-6 py-4 text-base text-gray-900 font-medium border-r border-gray-200">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 text-base text-gray-900 font-medium border-r border-gray-200">
                        {product.size || '-'}
                      </td>
                      <td className="px-6 py-4 text-base text-gray-900 font-medium border-r border-gray-200">
                        {(parseFloat(product.weight) || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-base text-gray-900 font-medium border-r border-gray-200">
                        ${(parseFloat(product.cost) || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-center border-r border-gray-200 bg-blue-25">
                        <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg font-bold text-base">
                          ${(parseFloat(product.priceT1) || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center border-r border-gray-200 bg-green-25">
                        <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg font-bold text-base">
                          ${(parseFloat(product.priceT2) || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center border-r border-gray-200 bg-orange-25">
                        <div className="bg-orange-100 text-orange-800 px-3 py-2 rounded-lg font-bold text-base">
                          ${(parseFloat(product.priceT3) || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center border-r border-gray-200 bg-purple-25">
                        <div className="bg-purple-100 text-purple-800 px-3 py-2 rounded-lg font-bold text-base">
                          ${(parseFloat(product.priceN) || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center border-r border-gray-200 bg-gray-25">
                        <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg font-bold text-base">
                          {product.inventory?.currentStock || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-1">
                          {/* Edit button - always available */}
                          <button
                            onClick={async () => {
                              setEditingProduct(product);
                              setShowProductForm(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit product"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          
                          {/* Duplicate button - always available */}
                          <button
                            onClick={async () => {
                              const duplicateProduct = {
                                ...product,
                                id: Date.now().toString(),
                                code: product.code + '-COPY',
                                name: product.name + ' (Copy)',
                                isUsedInDocuments: false,
                                createdAt: new Date(),
                                updatedAt: new Date()
                              };
                              const updatedProducts = [...products, duplicateProduct];
                              setProducts(updatedProducts);
                              await dataService.products.save(updatedProducts);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Duplicate product"
                          >
                            <DocumentDuplicateIcon className="w-4 h-4" />
                          </button>

                          {/* Active/Inactive toggle - always available */}
                          <button
                            onClick={() => toggleProductStatus(product.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              product.isActive 
                                ? 'text-orange-600 hover:bg-orange-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={product.isActive ? 'Make inactive' : 'Make active'}
                          >
                            {product.isActive ? (
                              <ExclamationTriangleIcon className="w-4 h-4" />
                            ) : (
                              <CheckIcon className="w-4 h-4" />
                            )}
                          </button>

                          {/* Delete button - only for unused products */}
                          {!isProductUsedAnywhere(product.id) && (
                            <button
                              onClick={async () => {
                                if (confirm(`Delete "${product.name}"? This cannot be undone.`)) {
                                  try {
                                    console.log('🗑️ Deleting product from database:', product.id);
                                    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${product.id}`, {
                                      method: 'DELETE'
                                    });
                                    
                                    if (response.ok) {
                                      console.log('✅ Product deleted from database');
                                      // Refresh products list from database
                                      loadData();
                                    } else {
                                      console.error('❌ Failed to delete product');
                                      alert('Failed to delete product. Please try again.');
                                    }
                                  } catch (error) {
                                    console.error('❌ Error deleting product:', error);
                                    alert('Error deleting product. Please try again.');
                                  }
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete product"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        </div>

        {/* Pricing Tier Settings Modal */}
        {showTierSettings && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-white bg-opacity-75">
            <div className="flex items-center justify-center min-h-screen p-4">
              <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Customize Pricing Tier Names</h3>
                    <button 
                      onClick={() => setShowTierSettings(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tier 1 Name</label>
                      <input
                        type="text"
                        value={pricingTierNames.t1}
                        onChange={(e) => setPricingTierNames(prev => ({ ...prev, t1: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Retail, Standard, Basic"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tier 2 Name</label>
                      <input
                        type="text"
                        value={pricingTierNames.t2}
                        onChange={(e) => setPricingTierNames(prev => ({ ...prev, t2: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Trade, Premium, Pro"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tier 3 Name</label>
                      <input
                        type="text"
                        value={pricingTierNames.t3}
                        onChange={(e) => setPricingTierNames(prev => ({ ...prev, t3: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Wholesale, Enterprise, Bulk"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tier 4 Name</label>
                      <input
                        type="text"
                        value={pricingTierNames.net}
                        onChange={(e) => setPricingTierNames(prev => ({ ...prev, net: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., T4, Premium+, VIP, Exclusive"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setShowTierSettings(false)}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        savePricingTierNames(pricingTierNames);
                        setShowTierSettings(false);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save Names
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Modal - Matching Your Software Structure */}
      {showProductForm && (
        <ProductFormStructured
          product={editingProduct}
          categories={categories}
          locations={locations}
          pricingTierNames={pricingTierNames}
          onSave={async (product) => {
            try {
              console.log('💾 Saving product to database:', product);
              
              if (editingProduct) {
                // Update existing product
                // Extract subcategory IDs from selectedSubcategoryPath for update too
                const subcategoryIds = {
                  mainCategoryId: product.categoryId,
                  subCategoryId: product.subcategoryPath?.[0]?.id || null,
                  subSubCategoryId: product.subcategoryPath?.[1]?.id || null,
                  subSubSubCategoryId: product.subcategoryPath?.[2]?.id || null
                };

                console.log('📝 Updating product with complete data:', {
                  name: product.name,
                  code: product.code,
                  categoryPath: product.subcategoryPath?.map(s => s.name).join(' → '),
                  subcategoryIds
                });

                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${editingProduct.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    code: product.code,
                    name: product.name,
                    description: product.description,
                    categoryId: product.categoryId,
                    
                    // Full subcategory hierarchy
                    mainCategoryId: subcategoryIds.mainCategoryId,
                    subCategoryId: subcategoryIds.subCategoryId,
                    subSubCategoryId: subcategoryIds.subSubCategoryId,
                    subSubSubCategoryId: subcategoryIds.subSubSubCategoryId,
                    
                    // Size/Dimensions
                    size: product.size,
                    weight: product.weight,
                    
                    // Pricing fields
                    cost: product.cost,
                    priceT1: product.priceT1,
                    priceT2: product.priceT2,
                    priceT3: product.priceT3,
                    priceN: product.priceN,
                    
                    // Inventory
                    currentStock: product.inventory?.currentStock || 0,
                    reorderPoint: product.inventory?.reorderPoint || 10,
                    
                    // Product status
                    isActive: product.isActive
                  })
                });
                
                if (response.ok) {
                  console.log('✅ Product updated in database');
                  
                  // Close modal first, then refresh
                  setShowProductForm(false);
                  setEditingProduct(null);
                  
                  // Refresh products list from database
                  console.log('🔄 Refreshing product list after update...');
                  await loadData();
                  console.log('✅ Product list refreshed after update');
                } else {
                  console.error('❌ Failed to update product');
                  setShowProductForm(false);
                  setEditingProduct(null);
                }
              } else {
                // Create new product
                // Extract subcategory IDs from selectedSubcategoryPath
                const subcategoryIds = {
                  mainCategoryId: product.categoryId,
                  subCategoryId: product.subcategoryPath?.[0]?.id || null,
                  subSubCategoryId: product.subcategoryPath?.[1]?.id || null,
                  subSubSubCategoryId: product.subcategoryPath?.[2]?.id || null
                };

                console.log('🏗️ Sending complete product data with subcategories:', {
                  name: product.name,
                  code: product.code,
                  categoryPath: product.subcategoryPath?.map(s => s.name).join(' → '),
                  subcategoryIds
                });

                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    code: product.code,
                    name: product.name,
                    description: product.description,
                    categoryId: product.categoryId,
                    
                    // Full subcategory hierarchy
                    mainCategoryId: subcategoryIds.mainCategoryId,
                    subCategoryId: subcategoryIds.subCategoryId,
                    subSubCategoryId: subcategoryIds.subSubCategoryId,
                    subSubSubCategoryId: subcategoryIds.subSubSubCategoryId,
                    
                    // Size/Dimensions
                    size: product.size,
                    weight: product.weight,
                    
                    // Pricing fields
                    cost: product.cost,
                    priceT1: product.priceT1,
                    priceT2: product.priceT2,
                    priceT3: product.priceT3,
                    priceN: product.priceN,
                    
                    // Inventory
                    currentStock: product.inventory?.currentStock || 0,
                    reorderPoint: product.inventory?.reorderPoint || 10,
                    
                    // Product status
                    isActive: product.isActive
                  })
                });
                
                if (response.ok) {
                  const result = await response.json();
                  console.log('✅ Product created in database:', result);
                  
                  // Close modal first, then refresh to avoid state conflicts
                  setShowProductForm(false);
                  setEditingProduct(null);
                  
                  // Refresh products list from database after modal closes
                  console.log('🔄 Refreshing product list...');
                  await loadData();
                  console.log('✅ Product list refreshed - new product should be visible');
                } else {
                  console.error('❌ Failed to create product');
                  setShowProductForm(false);
                  setEditingProduct(null);
                }
              }
            } catch (error) {
              console.error('❌ Error saving product:', error);
            }
          }}
          onCancel={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* Bulk Product Upload Modal */}
      {showBulkUpload && (
        <HybridBulkUpload
          categories={categories}
          pricingTierNames={pricingTierNames}
          onProductsUploaded={handleBulkUpload}
          onClose={() => setShowBulkUpload(false)}
        />
      )}
    </div>
  );
}

// Product Form matching your software structure
function ProductFormStructured({ product, categories, locations, pricingTierNames, onSave, onCancel }: {
  product: Product | null;
  categories: Category[];
  locations: any[];
  pricingTierNames: { t1: string; t2: string; t3: string; net: string };
  onSave: (product: Partial<Product>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    code: product?.code || '',
    name: product?.name || '',
    size: product?.size || '',
    cost: product?.cost || 0,
    priceT1: product?.priceT1 || 0,
    priceT2: product?.priceT2 || 0,
    priceT3: product?.priceT3 || 0,
    priceN: product?.priceN || 0,
    categoryId: product?.categoryId || '',
    selectedSubcategoryPath: product?.subcategoryPath || [],
    currentStock: product?.inventory?.currentStock || 0,
    isActive: product?.isActive ?? true
  });

  // Sequential cascading dropdown state for form
  const [formSelectedCategoryId, setFormSelectedCategoryId] = useState<string>(product?.categoryId || '');
  const [formSelectedSubcategoryId, setFormSelectedSubcategoryId] = useState<string>('');
  const [formSelectedSubSubcategoryId, setFormSelectedSubSubcategoryId] = useState<string>('');
  const [formSelectedSubSubSubcategoryId, setFormSelectedSubSubSubcategoryId] = useState<string>('');
  
  // Available options for each level in form
  const [formLevel1Options, setFormLevel1Options] = useState<any[]>([]);
  const [formLevel2Options, setFormLevel2Options] = useState<any[]>([]);
  const [formLevel3Options, setFormLevel3Options] = useState<any[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    product ? categories.find(c => c.id === product.categoryId) || null : null
  );

  // Form cascading dropdown loading functions
  const loadFormLevel1Options = async (categoryId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      const data = await response.json();
      
      if (data.success) {
        const category = data.data.find((cat: any) => cat.id === categoryId);
        if (category && category.subcategories) {
          const level0Subs = category.subcategories
            .filter((sub: any) => sub.level === 0 && !sub.parent_id)
            .map((sub: any) => ({
              value: sub.id,
              label: sub.name,
              color: sub.color
            }));
          setFormLevel1Options(level0Subs);
        } else {
          setFormLevel1Options([]);
        }
      }
    } catch (error) {
      console.error('Failed to load form level 1 options:', error);
      setFormLevel1Options([]);
    }
  };

  // Helper function for form
  const findFormSubcategoryInHierarchy = (subcategories: any[], targetId: string): any => {
    for (const sub of subcategories) {
      if (sub.id === targetId) {
        return sub;
      }
      if (sub.children && sub.children.length > 0) {
        const found = findFormSubcategoryInHierarchy(sub.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const loadFormLevel2Options = async (subcategoryId: string) => {
    try {
      console.log('🔍 Loading Level 2 options for parent:', subcategoryId);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      const data = await response.json();
      
      if (data.success) {
        // Find all subcategories with this parentId (using flat structure)
        let level1Children: any[] = [];
        for (const category of data.data) {
          if (category.subcategories) {
            const children = category.subcategories.filter((sub: any) => 
              sub.parentId === subcategoryId
            );
            level1Children.push(...children);
          }
        }
        
        console.log('📂 Found Level 2 options:', level1Children.map(c => c.name));
        
        const level2Options = level1Children.map((child: any) => ({
          value: child.id,
          label: child.name,
          color: child.color
        }));
        
        setFormLevel2Options(level2Options);
      }
    } catch (error) {
      console.error('Failed to load form level 2 options:', error);
      setFormLevel2Options([]);
    }
  };

  const loadFormLevel3Options = async (subcategoryId: string) => {
    try {
      console.log('🔍 Loading Level 3 options for parent:', subcategoryId);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      const data = await response.json();
      
      if (data.success) {
        // Find all subcategories with this parentId (using flat structure)
        let level2Children: any[] = [];
        for (const category of data.data) {
          if (category.subcategories) {
            const children = category.subcategories.filter((sub: any) => 
              sub.parentId === subcategoryId
            );
            level2Children.push(...children);
          }
        }
        
        console.log('📂 Found Level 3 options:', level2Children.map(c => c.name));
        
        const level3Options = level2Children.map((child: any) => ({
          value: child.id,
          label: child.name,
          color: child.color
        }));
        
        setFormLevel3Options(level3Options);
      }
    } catch (error) {
      console.error('Failed to load form level 3 options:', error);
      setFormLevel3Options([]);
    }
  };

  const handleSave = () => {
    if (!formData.code || !formData.name || !formData.categoryId) {
      alert('Please fill in required fields: Code, Name, and Category');
      return;
    }

    const selectedSubcategory = selectedCategory?.subcategories?.find(sub => sub.id === formData.subcategoryId);
    
    const productToSave: Partial<Product> = {
      code: formData.code,
      productType: selectedCategory?.name || '',
      name: formData.name,
      size: formData.size,
      weight: 0,
      cost: formData.cost,
      priceT1: formData.priceT1,
      priceT2: formData.priceT2,
      priceT3: formData.priceT3,
      priceN: formData.priceN,
      categoryId: formData.categoryId,
      categoryName: selectedCategory?.name || '',
      subcategoryPath: formData.selectedSubcategoryPath,
      inventory: {
        currentStock: formData.currentStock,
        reorderPoint: 10,
        supplier: '',
        primaryLocation: ''
      },
      isActive: formData.isActive
    };

    onSave(productToSave);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white bg-opacity-75">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {product ? 'Update Product' : 'Add New Product'}
                </h3>
                <p className="text-gray-600 mt-1">Configure product details and pricing tiers</p>
              </div>
              <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Simplified Form */}
            <div className="space-y-8">
              {/* Category Selection */}
              <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-100">
                <h4 className="text-lg font-bold text-blue-900 mb-4">Select Category Path</h4>
                
                {/* Sequential Cascading Category Dropdowns */}
                <div className="flex items-center gap-4 flex-wrap">
                  <CustomDropdown
                    label="Category"
                    value={formSelectedCategoryId}
                    placeholder="Choose a category..."
                    options={Array.isArray(categories) ? categories.map(cat => ({
                      value: cat.id,
                      label: cat.name,
                      color: cat.color
                    })) : []}
                    onChange={(value) => {
                      console.log('Form: Main category selected:', value);
                      setFormSelectedCategoryId(value);
                      // Reset subsequent selections
                      setFormSelectedSubcategoryId('');
                      setFormSelectedSubSubcategoryId('');
                      setFormSelectedSubSubSubcategoryId('');
                      setFormLevel1Options([]);
                      setFormLevel2Options([]);
                      setFormLevel3Options([]);
                      // Update form data and selected category
                      const category = categories.find(c => c.id === value);
                      setSelectedCategory(category || null);
                      setFormData(prev => ({ 
                        ...prev, 
                        categoryId: value,
                        selectedSubcategoryPath: [],
                        subcategoryId: ''
                      }));
                      // Load next level if category selected
                      if (value) {
                        loadFormLevel1Options(value);
                      }
                    }}
                    required={true}
                  />
                  
                  {/* Level 1 Dropdown - appears after category selection */}
                  {formSelectedCategoryId && formLevel1Options.length > 0 && (
                    <CustomDropdown
                      label=""
                      value={formSelectedSubcategoryId}
                      placeholder="Select subcategory..."
                      options={formLevel1Options}
                      onChange={(value) => {
                        console.log('Form: Level 1 subcategory selected:', value);
                        setFormSelectedSubcategoryId(value);
                        // Reset subsequent selections
                        setFormSelectedSubSubcategoryId('');
                        setFormSelectedSubSubSubcategoryId('');
                        setFormLevel2Options([]);
                        setFormLevel3Options([]);
                        // Load next level if subcategory selected
                        if (value) {
                          loadFormLevel2Options(value);
                        }
                      }}
                    />
                  )}
                  
                  {/* Level 2 Dropdown - appears after level 1 selection */}
                  {formSelectedSubcategoryId && formLevel2Options.length > 0 && (
                    <CustomDropdown
                      label=""
                      value={formSelectedSubSubcategoryId}
                      placeholder="Select option..."
                      options={formLevel2Options}
                      onChange={(value) => {
                        console.log('Form: Level 2 selected:', value);
                        setFormSelectedSubSubcategoryId(value);
                        // Reset subsequent selections
                        setFormSelectedSubSubSubcategoryId('');
                        setFormLevel3Options([]);
                        // Load next level if selected
                        if (value) {
                          loadFormLevel3Options(value);
                        }
                      }}
                    />
                  )}
                  
                  {/* Level 3 Dropdown - appears after level 2 selection */}
                  {formSelectedSubSubcategoryId && formLevel3Options.length > 0 && (
                    <CustomDropdown
                      label=""
                      value={formSelectedSubSubSubcategoryId}
                      placeholder="Select final option..."
                      options={formLevel3Options}
                      onChange={(value) => {
                        console.log('Form: Level 3 selected:', value);
                        setFormSelectedSubSubSubcategoryId(value);
                        // Load level 4 if needed (though level 3 is usually the deepest)
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Product Details */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Product Details</h4>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-base font-bold text-gray-700 mb-2">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-base"
                      placeholder="e.g., 12mm Clear Toughened Glass"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-bold text-gray-700 mb-2">
                      Product Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-base font-mono font-bold"
                      placeholder="e.g., 12F-100"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-bold text-gray-700 mb-2">
                      Size/Dimensions
                    </label>
                    <input
                      type="text"
                      value={formData.size}
                      onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-base"
                      placeholder="e.g., 1175 x 100 mm, Large, Standard"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="bg-emerald-50 rounded-2xl p-6 border-2 border-emerald-100">
                <h4 className="text-lg font-bold text-emerald-900 mb-4">Pricing & Inventory</h4>
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="block text-base font-bold text-gray-700 mb-2">
                      Cost Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.cost || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-base font-medium"
                        placeholder="Enter price"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-bold text-gray-700 mb-2">Current Stock</label>
                    <input
                      type="number"
                      value={formData.currentStock || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentStock: e.target.value === '' ? '' : parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-base font-medium"
                      placeholder="Enter stock quantity"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="h-5 w-5 text-emerald-600 border-2 border-gray-300 rounded"
                      />
                      <span className="text-base font-bold text-gray-700">Product Active</span>
                    </label>
                  </div>
                </div>

                {/* Pricing Tiers Row */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-base font-bold text-blue-700 mb-2">{pricingTierNames.t1} Price</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.priceT1 || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, priceT1: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-10 pr-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-base font-medium bg-blue-50"
                        placeholder="Enter price"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-bold text-green-700 mb-2">{pricingTierNames.t2} Price</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.priceT2 || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, priceT2: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-10 pr-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 text-base font-medium bg-green-50"
                        placeholder="Enter price"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-bold text-orange-700 mb-2">{pricingTierNames.t3} Price</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.priceT3 || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, priceT3: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-10 pr-4 py-3 border-2 border-orange-300 rounded-xl focus:ring-2 focus:ring-orange-500 text-base font-medium bg-orange-50"
                        placeholder="Enter price"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-bold text-purple-700 mb-2">{pricingTierNames.net} Price</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.priceN || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, priceN: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-10 pr-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-base font-medium bg-purple-50"
                        placeholder="Enter price"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={onCancel}
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {product ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dynamic Subcategory Selector that supports unlimited nesting
function DynamicSubcategorySelector({ category, selectedPath, onPathChange }: {
  category: Category;
  selectedPath: SubcategoryPath[];
  onPathChange: (path: SubcategoryPath[]) => void;
}) {
  // Get available subcategories for a specific level and parent
  const getSubcategoriesForLevel = (level: number, parentId?: string) => {
    return category.subcategories?.filter(sub => 
      sub.level === level && sub.parentId === parentId
    );
  };

  // Handle selection at a specific level
  const handleSelectionAtLevel = (level: number, subcategoryId: string) => {
    if (!subcategoryId) {
      // Clear from this level onwards
      onPathChange(selectedPath.slice(0, level));
      return;
    }

    const subcategory = category.subcategories?.find(sub => sub.id === subcategoryId);
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

  // Get the maximum level to know how many dropdowns to show
  const getMaxLevel = () => {
    return Math.max(0, ...(category.subcategories?.map(sub => sub.level || 0) || [0]));
  };

  // Render dropdowns for each level
  const renderLevelDropdowns = () => {
    const dropdowns = [];
    const maxLevel = getMaxLevel();
    
    for (let level = 0; level <= maxLevel; level++) {
      const parentId = level === 0 ? undefined : selectedPath[level - 1]?.id;
      const subcategoriesAtLevel = getSubcategoriesForLevel(level, parentId);
      
      // Only show dropdown if there are subcategories at this level
      if (subcategoriesAtLevel.length > 0) {
        const currentSelection = selectedPath[level];
        const isEnabled = level === 0 || selectedPath[level - 1]; // First level always enabled, others need parent selection
        
        dropdowns.push(
          <div key={level} className="mb-4">
            <label className="block text-base font-bold text-gray-700 mb-2">
              Subcategory {level + 1} {level === 0 && <span className="text-red-500">*</span>}
            </label>
            <select
              value={currentSelection?.id || ''}
              onChange={(e) => handleSelectionAtLevel(level, e.target.value)}
              disabled={!isEnabled}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-base font-medium disabled:bg-gray-100"
            >
              <option value="">Choose subcategory...</option>
              {subcategoriesAtLevel.map(subcategory => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name} {subcategory.isShared && '(Shared)'}
                </option>
              ))}
            </select>
          </div>
        );
      }
    }
    
    return dropdowns;
  };

  if ((category.subcategories?.length || 0) === 0) {
    return null; // Categories without subcategories are perfectly valid
  }

  return (
    <div>
      {renderLevelDropdowns()}
      
      {/* Show selected path */}
      {selectedPath.length > 0 && (
        <div className="bg-white rounded-xl p-4 border-2 border-blue-200 mt-4">
          <h5 className="font-bold text-blue-900 mb-2">Selected Path:</h5>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-blue-700">{category.name}</span>
            {selectedPath.map((path, index) => (
              <div key={path.id} className="flex items-center gap-1">
                <span className="text-blue-600">→</span>
                <span 
                  className="px-3 py-1 rounded-lg border-2 font-medium text-sm"
                  style={{
                    borderColor: path.color,
                    backgroundColor: `${path.color}20`,
                    color: path.color
                  }}
                >
                  {path.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Enhanced Breadcrumb-style Subcategory Filter
function SubcategoryBreadcrumbFilter({ category, selectedPath, onPathChange }: {
  category: Category | undefined;
  selectedPath: SubcategoryPath[];
  onPathChange: (path: SubcategoryPath[]) => void;
}) {
  if (!category) return null;

  // Get available subcategories for a specific level and parent
  const getSubcategoriesForLevel = (level: number, parentId?: string) => {
    return (category.subcategories || [])
      .filter(sub => sub.level === level && sub.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  // Handle selection at a specific level
  const handleSelectionAtLevel = (level: number, subcategoryId: string) => {
    if (!subcategoryId) {
      onPathChange(selectedPath.slice(0, level));
      return;
    }

    const subcategory = category.subcategories?.find(sub => sub.id === subcategoryId);
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

  // Get the maximum level
  const getMaxLevel = () => {
    return Math.max(0, ...(category.subcategories?.map(sub => sub.level || 0) || [0]));
  };

  // Render breadcrumb-style navigation
  const renderBreadcrumbLevels = () => {
    const levels = [];
    const maxLevel = getMaxLevel();
    
    for (let level = 0; level <= maxLevel; level++) {
      const parentId = level === 0 ? undefined : selectedPath[level - 1]?.id;
      const subcategoriesAtLevel = getSubcategoriesForLevel(level, parentId);
      
      if (subcategoriesAtLevel.length > 0) {
        const currentSelection = selectedPath[level];
        const isEnabled = level === 0 || selectedPath[level - 1];
        
        levels.push(
          <React.Fragment key={level}>
            {level > 0 && <div className="w-px h-8 bg-gray-300 mx-2"></div>}
            <CustomDropdown
              label=""
              value={currentSelection?.id || ''}
              placeholder="All Subcategories"
              options={subcategoriesAtLevel.map(sub => ({
                value: sub.id,
                label: sub.name,
                color: sub.color
              }))}
              onChange={(value) => handleSelectionAtLevel(level, value)}
              disabled={!isEnabled}
              isLast={level === maxLevel}
            />
          </React.Fragment>
        );
      }
    }
    
    return levels;
  };

  return (
    <div className="flex items-center gap-2">
      {renderBreadcrumbLevels()}
      
      {/* Clear button */}
      {selectedPath.length > 0 && (
        <button
          onClick={() => onPathChange([])}
          className="px-2 py-1 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-xs font-medium border border-blue-200 ml-2"
        >
          Clear
        </button>
      )}
    </div>
  );
}

// Dynamic Subcategory Filter for the main page
function DynamicSubcategoryFilter({ category, selectedPath, onPathChange }: {
  category: Category | undefined;
  selectedPath: SubcategoryPath[];
  onPathChange: (path: SubcategoryPath[]) => void;
}) {
  if (!category) return null;

  // Get available subcategories for a specific level and parent
  const getSubcategoriesForLevel = (level: number, parentId?: string) => {
    return category.subcategories?.filter(sub => 
      sub.level === level && sub.parentId === parentId
    );
  };

  // Handle selection at a specific level
  const handleSelectionAtLevel = (level: number, subcategoryId: string) => {
    if (!subcategoryId) {
      // Clear from this level onwards
      onPathChange(selectedPath.slice(0, level));
      return;
    }

    const subcategory = category.subcategories?.find(sub => sub.id === subcategoryId);
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

  // Get the maximum level
  const getMaxLevel = () => {
    return Math.max(0, ...(category.subcategories?.map(sub => sub.level || 0) || [0]));
  };

  // Render filter dropdowns horizontally
  const renderFilterDropdowns = () => {
    const dropdowns = [];
    const maxLevel = getMaxLevel();
    
    for (let level = 0; level <= maxLevel; level++) {
      const parentId = level === 0 ? undefined : selectedPath[level - 1]?.id;
      const subcategoriesAtLevel = getSubcategoriesForLevel(level, parentId);
      
      if (subcategoriesAtLevel.length > 0) {
        const currentSelection = selectedPath[level];
        const isEnabled = level === 0 || selectedPath[level - 1];
        
        dropdowns.push(
          <div key={level}>
            <label className="block text-sm font-bold text-purple-700 mb-2">
              {level + 1}
            </label>
            <select
              value={currentSelection?.id || ''}
              onChange={(e) => handleSelectionAtLevel(level, e.target.value)}
              disabled={!isEnabled}
              className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-base disabled:bg-gray-100"
            >
              <option value="">All {level + 1}</option>
              {subcategoriesAtLevel.map(subcategory => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {renderFilterDropdowns()}
      </div>
      
      {/* Clear filters button */}
      {selectedPath.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-purple-600">
            <strong>Active filters:</strong> {selectedPath.map(p => p.name).join(' → ')}
          </div>
          <button
            onClick={() => onPathChange([])}
            className="px-3 py-1 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors text-sm font-medium"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}

// Cascading Subcategory Selector Component
function CascadingSubcategorySelector({ category, selectedPath, onPathChange }: {
  category: Category;
  selectedPath: SubcategoryPath[];
  onPathChange: (path: SubcategoryPath[]) => void;
}) {
  // Get subcategories for a specific level
  const getSubcategoriesAtLevel = (level: number, parentId?: string) => {
    return (category.subcategories || [])
      .filter(sub => sub.level === level && sub.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  // Get maximum depth
  const getMaxLevel = () => {
    return Math.max(0, ...(category.subcategories?.map(sub => sub.level || 0) || [0]));
  };

  // Handle selection at a specific level
  const handleSelectionAtLevel = (level: number, subcategoryId: string) => {
    if (!subcategoryId) {
      onPathChange(selectedPath.slice(0, level));
      return;
    }

    const subcategory = category.subcategories?.find(sub => sub.id === subcategoryId);
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

  // Map levels to your software's field names
  const getLevelFieldName = (level: number) => {
    switch (level) {
      case 0: return 'Sub Category';
      case 1: return 'Product Type';
      case 2: return 'Variety';
      case 3: return 'Dimensions';
      default: return `${level + 1}`;
    }
  };

  // Render cascading dropdowns
  const renderDropdowns = () => {
    const dropdowns = [];
    const maxLevel = getMaxLevel();
    
    for (let level = 0; level <= maxLevel; level++) {
      const parentId = level === 0 ? undefined : selectedPath[level - 1]?.id;
      const subcategoriesAtLevel = getSubcategoriesAtLevel(level, parentId);
      
      if (subcategoriesAtLevel.length > 0) {
        const currentSelection = selectedPath[level];
        const fieldName = getLevelFieldName(level);
        
        dropdowns.push(
          <CustomDropdown
            key={level}
            label={fieldName}
            required={level === 0}
            value={currentSelection?.id || ''}
            placeholder={`Select ${fieldName}...`}
            options={subcategoriesAtLevel.map(sub => ({
              value: sub.id,
              label: sub.name + (sub.isShared ? ' (Shared)' : ''),
              color: sub.color
            }))}
            onChange={(value) => handleSelectionAtLevel(level, value)}
            disabled={level > 0 && !selectedPath[level - 1]}
            isLast={level === maxLevel}
          />
        );
      }
    }
    
    return (
      <div className="flex flex-wrap gap-4 items-start">
        {dropdowns}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-sm text-gray-600 mb-4">
        Navigate through your category structure to define the product classification.
      </div>
      <div className="grid grid-cols-2 gap-4">
        {renderDropdowns()}
      </div>
    </div>
  );
}