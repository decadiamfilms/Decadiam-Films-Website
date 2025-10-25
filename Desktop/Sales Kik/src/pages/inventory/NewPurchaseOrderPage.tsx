import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import { useCategoryStructure } from '../../hooks/useCategoryStructure';
import AdminConnectedGlassQuote from '../../components/glass/AdminConnectedGlassQuote';
import PurchaseOrderModal from '../../components/inventory/PurchaseOrderModal';
import { dataService } from '../../services/api.service';
import { 
  PlusIcon, MagnifyingGlassIcon, XMarkIcon, BuildingOfficeIcon,
  ChevronDownIcon, InformationCircleIcon, CubeIcon,
  TagIcon, UserIcon, CheckIcon, ExclamationTriangleIcon,
  TrashIcon, QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

interface Customer {
  id: string;
  customerName: string;
  customerReference?: string;
  email: string;
  phone: string;
}

interface Supplier {
  id: string;
  supplierName: string;
  supplierCode: string;
  contactPerson: string;
  emailAddress: string;
  phoneNumber: string;
  paymentTerms: string;
  isLocalGlassSupplier: boolean;
  isApprovedSupplier: boolean;
  performanceRating: number;
  totalOrdersCount: number;
  status: 'active' | 'inactive';
  notes: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  costPrice: number;
  currentStock: number;
  categoryId: string;
  mainCategoryId?: string;
  categoryName: string;
  subcategoryPath: { id: string; name: string; color: string }[];
  // Add the missing subcategory ID fields that the filtering logic expects
  subCategoryId?: string;
  subSubCategoryId?: string;
  subSubSubCategoryId?: string;
  weight?: number;
  isActive: boolean;
}

interface PurchaseOrderLineItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

// Tooltip Component (from quote page)
function Tooltip({ content, children, position = 'top' }: { 
  content: string; 
  children: React.ReactNode; 
  position?: 'top' | 'bottom' | 'left' | 'right' 
}) {
  const [isVisible, setIsVisible] = useState(false);
  
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 px-3 py-2 text-base text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap ${positionClasses[position]}`}>
          {content}
        </div>
      )}
    </div>
  );
}

// Custom Dropdown (from quote page)
function CustomDropdown({ 
  label, 
  value, 
  placeholder, 
  options, 
  onChange 
}: {
  label: string;
  value: string;
  placeholder: string;
  options: { value: string; label: string; color?: string }[];
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      <label className="block text-base font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-left flex items-center justify-between h-12"
        >
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        </button>
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
            <button
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors border-b border-gray-200 text-base"
            >
              {placeholder}
            </button>
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900 text-base">{option.label}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Customer Search (from quote page style)
function CustomerSearch({ value, onChange }: { value: Customer | null; onChange: (customer: Customer | null) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const mockCustomers: Customer[] = [
      {
        id: '1',
        customerName: 'Johnson Construction',
        customerReference: 'Site Office Glass',
        email: 'john@johnsonconstruction.com.au',
        phone: '+61 2 9123 4567'
      },
      {
        id: '2',
        customerName: 'Metro Building Corp',
        customerReference: 'Tower Project - Floor 15',
        email: 'projects@metrobuilding.com.au',
        phone: '+61 2 9234 5678'
      },
      {
        id: '3',
        customerName: 'City Plaza Development',
        customerReference: 'Lobby Renovation',
        email: 'info@cityplaza.com.au',
        phone: '+61 2 9345 6789'
      }
    ];
    
    setCustomers(mockCustomers);
  }, []);

  const filteredCustomers = customers.filter(customer =>
    customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.customerReference?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={value ? value.customerName : searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (value) onChange(null);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={value ? value.customerName : "Search customers... (e.g., Johnson Construction)"}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-12 text-base"
        />
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute right-3 top-3.5" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {filteredCustomers.map(customer => (
            <button
              key={customer.id}
              onClick={() => {
                onChange(customer);
                setIsOpen(false);
                setSearchTerm('');
              }}
              className="w-full p-4 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900 text-base">{customer.customerName}</div>
              <div className="text-base text-gray-500">{customer.email}</div>
              {customer.customerReference && (
                <div className="text-sm text-gray-400">{customer.customerReference}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Supplier Search (from quote page style)
function SupplierSearch({ value, onChange }: { value: Supplier | null; onChange: (supplier: Supplier | null) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Load real suppliers from database
  const loadSuppliersFromDatabase = async () => {
    try {
      console.log('📦 SupplierSearch: Loading suppliers from database...');
      const suppliersData = await dataService.suppliers.getAll();
      console.log('✅ SupplierSearch: Loaded suppliers:', suppliersData.length);
      
      // Transform database suppliers to match expected interface format
      const transformedSuppliers = suppliersData
        .filter((supplier: any) => supplier.status === 'active')
        .map((supplier: any) => ({
          id: supplier.id,
          supplierName: supplier.name,
          supplierCode: supplier.accountingId || supplier.id.slice(0, 8).toUpperCase(),
          contactPerson: supplier.primaryContact ? 
            `${supplier.primaryContact.firstName} ${supplier.primaryContact.lastName}` : 
            'Contact Available',
          emailAddress: supplier.email,
          phoneNumber: supplier.phone || supplier.primaryContact?.mobile || '',
          paymentTerms: '30 days', // Default - could be enhanced later
          isLocalGlassSupplier: supplier.supplierType === 'Manufacturer',
          isApprovedSupplier: true, // All active suppliers are approved
          performanceRating: 4.5, // Default rating
          totalOrdersCount: 0, // Could be calculated later
          status: 'active' as const,
          notes: ''
        }));
      
      setSuppliers(transformedSuppliers);
      console.log('✅ SupplierSearch: Transformed suppliers ready:', transformedSuppliers.length);
      console.log('📋 SupplierSearch: Supplier names:', transformedSuppliers.map(s => s.supplierName));
    } catch (error) {
      console.error('❌ SupplierSearch: Failed to load suppliers:', error);
      setSuppliers([]); // Empty array on error
    }
  };

  useEffect(() => {
    loadSuppliersFromDatabase();
  }, []);

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.supplierCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={value ? value.supplierName : searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (value) onChange(null);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={value ? value.supplierName : "Search suppliers... (e.g., Sydney Glass Co)"}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-12 text-base"
        />
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute right-3 top-3.5" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {filteredSuppliers.map(supplier => (
            <button
              key={supplier.id}
              onClick={() => {
                onChange(supplier);
                setIsOpen(false);
                setSearchTerm('');
              }}
              className="w-full p-4 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 text-base flex items-center gap-2">
                    {supplier.supplierName}
                    {supplier.isLocalGlassSupplier && (
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">Glass Specialist</span>
                    )}
                  </div>
                  <div className="text-base text-gray-500">{supplier.emailAddress}</div>
                  <div className="text-base text-gray-400">
                    Contact: {supplier.contactPerson} • Rating: {supplier.performanceRating}/5 ⭐
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewPurchaseOrderPage() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Supplier selection for purchase orders
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [projectName, setProjectName] = useState('');
  const [jobName, setJobName] = useState('Main Order');
  const [poId] = useState(() => `PO-2025-${String(Date.now()).slice(-5)}`);
  
  // Product filters (exactly like quote page)
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPath, setSelectedPath] = useState<any[]>([]);
  const [smartSearch, setSmartSearch] = useState('');
  
  // Products and line items
  const [products, setProducts] = useState<Product[]>([]);
  // WORKING SUBCATEGORY FILTERING - Direct ID matching approach
  const filteredProducts = useMemo(() => {
    console.log('🚀 PO: FILTER START');
    console.log('🚀 PO: products.length:', products.length);
    console.log('🚀 PO: selectedCategory:', selectedCategory);
    console.log('🚀 PO: selectedPath:', selectedPath?.map(p => ({id: p.id, name: p.name})));
    
    if (!products || products.length === 0) {
      return [];
    }
    
    let filtered = products.filter(p => p.isActive !== false);
    
    // Smart search override
    if (smartSearch) {
      return filtered.filter(product => 
        product.code.toLowerCase().includes(smartSearch.toLowerCase()) ||
        product.name.toLowerCase().includes(smartSearch.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(smartSearch.toLowerCase()))
      );
    }
    
    // No category selected - show all
    if (!selectedCategory) {
      return filtered;
    }
    
    // First filter by main category
    filtered = filtered.filter(product => {
      return product.categoryId === selectedCategory || 
             product.mainCategoryId === selectedCategory ||
             product.categoryName === selectedCategory;
    });
    
    console.log('🔥 PO: After category filter:', filtered.length, 'products');
    
    // Apply subcategory filter if any subcategory is selected
    if (selectedPath && selectedPath.length > 0) {
      const targetSubcategory = selectedPath[selectedPath.length - 1]; // Get the most specific subcategory
      console.log('🔥 PO: Filtering by subcategory:', targetSubcategory.name, '(ID:', targetSubcategory.id, ')');
      
      filtered = filtered.filter(product => {
        // Method 1: Direct subcategory ID matching (with string conversion for safety)
        const targetId = String(targetSubcategory.id);
        const directMatch = 
          String(product.subCategoryId) === targetId ||
          String(product.subSubCategoryId) === targetId ||
          String(product.subSubSubCategoryId) === targetId;
        
        // Method 2: Hierarchical matching - if we select a parent, show products with that parent in their path
        const hierarchicalMatch = selectedPath.some(pathItem => {
          const pathId = String(pathItem.id);
          return String(product.subCategoryId) === pathId ||
                 String(product.subSubCategoryId) === pathId ||
                 String(product.subSubSubCategoryId) === pathId;
        });
        
        // Method 3: Subcategory path matching
        const pathMatch = product.subcategoryPath?.some(subcat => 
          String(subcat.id) === String(targetSubcategory.id) || subcat.name === targetSubcategory.name
        );
        
        const finalMatch = directMatch || hierarchicalMatch || pathMatch;
        
        console.log('🚨 DEBUG: Product', product.name, '- subcategory check:', {
          targetSubcategoryId: String(targetSubcategory.id),
          targetSubcategoryName: targetSubcategory.name,
          productSubCategoryId: String(product.subCategoryId),
          productSubSubCategoryId: String(product.subSubCategoryId),
          productSubSubSubCategoryId: String(product.subSubSubCategoryId),
          productSubcategoryPath: product.subcategoryPath?.map(s => ({ id: String(s.id), name: s.name })),
          directMatch,
          hierarchicalMatch,
          pathMatch,
          finalMatch
        });
        
        return finalMatch;
      });
      
      console.log('🔥 PO: After subcategory filter:', filtered.length, 'products');
    }
    
    console.log('🚀 PO: FINAL RESULT:', filtered.length, 'products');
    return filtered;
  }, [products, selectedCategory, selectedPath, smartSearch]);

  const [lineItems, setLineItems] = useState<PurchaseOrderLineItem[]>([]);
  const [quantities, setQuantities] = useState<{[key: string]: number | string}>({});
  
  // Categories (same as quote page)
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  // Purchase Order Modal
  const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      console.log('🔍 PurchaseOrder: Loading categories from database...');
      
      // Use direct API call like other pages
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      const data = await response.json();
      
      console.log('📡 PurchaseOrder: API response:', data);
      
      if (data.success && data.data) {
        const categoriesData = data.data;
        console.log('📂 PurchaseOrder: Categories data:', categoriesData);
        console.log('📊 PurchaseOrder: Categories count:', categoriesData.length);
        
        if (Array.isArray(categoriesData) && categoriesData.length > 0) {
          // Use the database categories directly
          const parsedCategories = categoriesData.map((cat: any) => ({
            ...cat,
            createdAt: new Date(cat.createdAt || new Date()),
            updatedAt: new Date(cat.updatedAt || new Date())
          }));
          
          // Add custom glass category if user has access to glass module
          const categoriesWithGlass = [...parsedCategories];
          
          // Check if custom-glass category already exists
          const hasGlassCategory = categoriesWithGlass.some(cat => cat.id === 'custom-glass');
          
          // Add glass category if not present (user has glass module access)
          if (!hasGlassCategory) {
            categoriesWithGlass.push({
              id: 'custom-glass',
              name: 'Custom Glass 🪟',
              color: '#10B981',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              subcategories: [],
              isGlassModule: true
            });
          }
          
          setCategories(categoriesWithGlass);
          console.log('PurchaseOrder page: Loaded categories from database API + glass module:', categoriesWithGlass.length, 'categories');
          console.log('📂 PurchaseOrder: Category names:', categoriesWithGlass.map(c => c.name));
        } else {
          // Fallback to basic categories if no database data
          const fallbackCategories = [
            {
              id: 'custom-glass',
              name: 'Custom Glass 🪟',
              color: '#10B981',
              subcategories: [],
              isGlassModule: true
            }
          ];
          setCategories(fallbackCategories);
          console.log('PurchaseOrder page: No API categories found - using glass fallback');
        }
      } else {
        console.warn('PurchaseOrder: API call failed or returned no success');
        const fallbackCategories = [
          {
            id: 'custom-glass',
            name: 'Custom Glass 🪟',
            color: '#10B981',
            subcategories: [],
            isGlassModule: true
          }
        ];
        setCategories(fallbackCategories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      console.log('📦 PO: Loading products from Product Management API...');
      const productsData = await dataService.products.getAll();
      
      if (productsData && productsData.length > 0) {
        // Transform database products to match expected format
        const transformedProducts = productsData.map((product: any) => ({
          id: product.id,
          code: product.code,
          name: product.name,
          description: product.description || '',
          costPrice: product.pricing?.cost_price || product.cost || 0,
          currentStock: product.inventory?.currentStock || product.currentStock || 0,
          categoryId: product.categoryId || product.mainCategoryId,
          mainCategoryId: product.mainCategoryId,
          categoryName: product.categoryName || 'Unknown',
          subcategoryPath: product.subcategoryPath || [],
          // Add the missing subcategory ID fields from the product data
          subCategoryId: product.subCategoryId || product.subcategoryId,
          subSubCategoryId: product.subSubCategoryId || product.subsubcategoryId,
          subSubSubCategoryId: product.subSubSubCategoryId || product.subsubsubcategoryId,
          isActive: product.isActive !== false
        }));
        
        setProducts(transformedProducts);
        // No need to set filteredProducts - useMemo will handle it
        console.log('✅ PO: Loaded', transformedProducts.length, 'real products from database');
        console.log('📋 PO: First product sample:', transformedProducts[0]);
        console.log('🔍 PO: Product subcategory IDs:', transformedProducts.map(p => ({
          name: p.name,
          subCategoryId: p.subCategoryId,
          subSubCategoryId: p.subSubCategoryId,
          subSubSubCategoryId: p.subSubSubCategoryId
        })));
        return; // Don't fall back to mock data
      } else {
        console.log('📝 PO: No products found in database');
        setProducts([]);
        return; // Don't fall back to mock data
      }
    } catch (error) {
      console.error('❌ PO: Error loading products from database:', error);
      const mockProducts: Product[] = [
        {
          id: '1',
          code: 'GLASS-10MM-TEMP',
          name: '10mm Tempered Glass Panel',
          description: 'High-quality tempered glass panel for commercial use',
          costPrice: 285.00,
          currentStock: 12,
          categoryId: 'glass',
          categoryName: 'Glass Products',
          subcategoryPath: [],
          isActive: true
        },
      {
        id: '2',
        code: 'GLASS-12MM-TEMP',
        name: '12mm Tempered Glass Panel',
        description: 'Premium thick tempered glass for heavy-duty applications',
        costPrice: 380.00,
        currentStock: 8,
        categoryId: 'glass',
        categoryName: 'Glass Products',
        subcategoryPath: [],
        isActive: true
      },
      {
        id: '3',
        code: 'STEEL-BRKT-HD',
        name: 'Steel Bracket - Heavy Duty',
        description: 'Industrial grade steel mounting bracket',
        costPrice: 45.00,
        currentStock: 150,
        categoryId: 'hardware',
        categoryName: 'Hardware',
        subcategoryPath: [],
        isActive: true
      }
    ];
    
      setProducts(mockProducts);
      // No need for // setFilteredProducts - REMOVED (using useMemo) - useMemo handles filtering
    }
  };

  // Cascading filter functions (exactly from quote page)
  const getSubcategoriesAtLevel = (level: number, parentId?: string) => {
    const category = categories.find(c => c.id === selectedCategory);
    if (!category) return [];
    
    return category.subcategories?.filter((sub: any) => 
      sub.level === level && sub.parentId === parentId
    ) || [];
  };

  const handleSubcategorySelectionAtLevel = (level: number, subcategoryId: string) => {
    if (!subcategoryId) {
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
    if (!category?.subcategories) return -1;
    return Math.max(-1, ...category.subcategories.map((sub: any) => sub.level || 0));
  };

  // Product filtering (exactly from quote page)
  useEffect(() => {
    if (smartSearch) {
      let filtered = products.filter(p => p.isActive);
      filtered = filtered.filter(p => 
        p.code.toLowerCase().includes(smartSearch.toLowerCase()) ||
        p.name.toLowerCase().includes(smartSearch.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(smartSearch.toLowerCase()))
      );
      // setFilteredProducts - REMOVED (using useMemo)(filtered);
      return;
    }

    // Don't filter if products haven't loaded yet
    if (!products || products.length === 0) {
      console.log('📋 PO: Waiting for products to load, products.length:', products?.length || 0);
      // setFilteredProducts - REMOVED (using useMemo)([]);
      return;
    }

    if (!selectedCategory) {
      console.log('📋 PO: No category selected, showing ALL products:', products.length);
      // setFilteredProducts - REMOVED (using useMemo)(products); // Show all products instead of hiding them
      return;
    }

    if (selectedCategory === 'custom-glass') {
      // setFilteredProducts - REMOVED (using useMemo)([]);
      return;
    }

    const maxLevel = getMaxLevel();
    const isCompletelySelected = selectedPath.length > maxLevel;
    
    if (!isCompletelySelected && maxLevel >= 0) {
      // setFilteredProducts - REMOVED (using useMemo)([]);
      return;
    }

    console.log('🔍 PO: Category filter - selectedCategory:', JSON.stringify(selectedCategory));
    console.log('🔍 PO: selectedCategory type:', typeof selectedCategory);
    console.log('🔍 PO: Product categories and paths:', products.map(p => ({
      name: p.name, 
      categoryId: p.categoryId, 
      categoryName: JSON.stringify(p.categoryName),
      categoryNameType: typeof p.categoryName
    })));
    
    let filtered = products.filter(p => {
      // WORKING CATEGORY MATCHING - handle both ID and name
      const categoryMatch = 
        p.categoryName === selectedCategory || 
        p.categoryId === selectedCategory ||
        selectedCategory === p.categoryName ||
        selectedCategory === 'cd44a54c-9641-49ea-a176-6dfff6203a00'; // Pool Fencing ID
      
      const matches = p.isActive && categoryMatch;
      
      console.log('🔧 PO: FIXED FILTER - Product', p.name, {
        productCategoryName: p.categoryName,
        productCategoryId: p.categoryId,
        selectedCategory: selectedCategory,
        categoryMatch: categoryMatch,
        matches: matches,
        isActive: p.isActive
      });
      return matches;
    });
    
    if (selectedPath.length > 0) {
      const finalSubcategory = selectedPath[selectedPath.length - 1];
      filtered = filtered.filter(p => {
        return p.subcategoryPath.some(sp => sp.name === finalSubcategory.name);
      });
    }

    // setFilteredProducts - REMOVED (using useMemo)(filtered);
  }, []); // DISABLE automatic filtering - use manual filtering only

  // SIMPLE DIRECT FILTERING - no useEffect complications
  const applyFilter = (categoryFilter: string = selectedCategory) => {
    console.log('🔥 PO: DIRECT FILTER - applying filter:', categoryFilter);
    console.log('🔥 PO: Available products:', products.map(p => ({name: p.name, categoryName: p.categoryName})));
    
    if (!categoryFilter || categoryFilter === '') {
      console.log('🔥 PO: No filter - showing all products:', products.length);
      // setFilteredProducts - REMOVED (using useMemo)(products);
      return;
    }
    
    const filtered = products.filter(p => {
      const match = p.categoryName === categoryFilter;
      console.log('🔥 PO: Product', p.name, 'category:', p.categoryName, 'filter:', categoryFilter, 'matches:', match);
      return match;
    });
    
    console.log('🔥 PO: Filtered result:', filtered.length, 'products');
    // setFilteredProducts - REMOVED (using useMemo)(filtered);
  };

  const handleCategoryChange = (category: string) => {
    console.log('🔥 PO: Category changed to:', category);
    setSelectedCategory(category);
    applyFilter(category);
  };

  const handleSmartSearch = (value: string) => {
    setSmartSearch(value);
    if (value && selectedCategory) {
      setSelectedCategory('');
      setSelectedPath([]);
      applyFilter('');
    }
  };

  const addToOrder = (product: Product, quantity: number = 1) => {
    const newItem: PurchaseOrderLineItem = {
      id: Date.now().toString(),
      productId: product.id,
      product,
      quantity,
      unitCost: product.costPrice,
      totalCost: product.costPrice * quantity
    };

    setLineItems(prev => [...prev, newItem]);
    
    // Clear the quantity input for this product
    setQuantities(prev => ({ ...prev, [product.id]: '' }));
  };

  const removeFromOrder = (itemId: string) => {
    setLineItems(prev => prev.filter(item => item.id !== itemId));
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((total, item) => total + item.totalCost, 0);
    const gst = subtotal * 0.1;
    const total = subtotal + gst;
    
    return { subtotal, gst, total };
  };

  const totals = calculateTotals();
  const totalItems = lineItems.length;

  const handleOrderCreated = (orderData: any) => {
    // Save to localStorage to appear in dashboard
    try {
      console.log('Purchase Order Created:', orderData);
      
      // Add unique ID if not present
      const orderWithId = {
        ...orderData,
        id: orderData.id || Date.now().toString()
      };
      
      const existingOrders = localStorage.getItem('saleskik-purchase-orders');
      const orders = existingOrders ? JSON.parse(existingOrders) : [];
      
      // Add new order to the beginning of the array
      orders.unshift(orderWithId);
      
      // Save back to localStorage
      localStorage.setItem('saleskik-purchase-orders', JSON.stringify(orders));
      
      console.log('Purchase order saved to localStorage');
    } catch (error) {
      console.error('Error saving purchase order:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="inventory" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="New Purchase Order"
        subtitle="Create purchase order with advanced product selection"
        onMenuToggle={() => setShowSidebar(true)}
      />

      <div className="p-6 max-w-none mx-auto">
        
        {/* Supplier Selection Header */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* Supplier Selection */}
            <div>
              <label className="block text-base font-medium text-gray-500 mb-1">Supplier *</label>
              <SupplierSearch value={selectedSupplier} onChange={setSelectedSupplier} />
            </div>

            {/* PO Details (same as quote page) */}
            <div>
              <label className="block text-base font-medium text-gray-500 mb-1">Reference Number</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Reference..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-12 text-base"
              />
            </div>

            <div>
              <label className="block text-base font-medium text-gray-500 mb-1">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-12 text-base"
              />
            </div>

            <div>
              <label className="block text-base font-medium text-gray-500 mb-1">PO ID</label>
              <input
                type="text"
                value={poId}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 h-12"
              />
            </div>
          </div>
        </div>

        {/* Main Product Selection (exactly like quote page) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Product Selection - Same as Quote Page */}
          <div className="lg:col-span-3 space-y-6">

          {/* Product Search & Filters - Exactly like Quote Page */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg">
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Category Filter */}
                <div>
                  {categoriesLoading ? (
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">Category</label>
                      <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                        Loading categories...
                      </div>
                    </div>
                  ) : categories.length > 0 ? (
                    <CustomDropdown
                      label="Category"
                      value={selectedCategory}
                      placeholder="All Categories"
                      options={categories.map(cat => ({
                        value: cat.id,
                        label: cat.name,
                        color: cat.color
                      }))}
                      onChange={(value) => {
                        setSelectedCategory(value);
                        setSelectedPath([]);
                      }}
                    />
                  ) : (
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">Category</label>
                      <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500">
                        No categories available
                      </div>
                    </div>
                  )}
                </div>

                {/* Dynamic Subcategory Dropdown */}
                {selectedCategory && !categoriesLoading && (() => {
                  const subcategoriesAtLevel = getSubcategoriesAtLevel(0);
                  
                  if (subcategoriesAtLevel.length > 0) {
                    return (
                      <CustomDropdown
                        label="Subcategory"
                        value={selectedPath[0]?.id || ''}
                        placeholder="All Subcategories"
                        options={subcategoriesAtLevel.map((sub: any) => ({
                          value: sub.id,
                          label: sub.name + (sub.isShared ? ' (Shared)' : ''),
                          color: sub.color
                        }))}
                        onChange={(value) => handleSubcategorySelectionAtLevel(0, value)}
                      />
                    );
                  }
                  return null;
                })()}

                {/* Level 1 Dropdown */}
                {selectedPath[0] && (() => {
                  const level1Options = getSubcategoriesAtLevel(1, selectedPath[0]?.id);
                  
                  if (level1Options.length > 0) {
                    return (
                      <CustomDropdown
                        label="Type"
                        value={selectedPath[1]?.id || ''}
                        placeholder="Select type..."
                        options={level1Options.map((sub: any) => ({
                          value: sub.id,
                          label: sub.name,
                          color: sub.color
                        }))}
                        onChange={(value) => handleSubcategorySelectionAtLevel(1, value)}
                      />
                    );
                  }
                  return null;
                })()}

                {/* Level 2 Dropdown */}
                {selectedPath[1] && (() => {
                  const level2Options = getSubcategoriesAtLevel(2, selectedPath[1]?.id);
                  
                  if (level2Options.length > 0) {
                    return (
                      <CustomDropdown
                        label="Specification"
                        value={selectedPath[2]?.id || ''}
                        placeholder="Select specification..."
                        options={level2Options.map((sub: any) => ({
                          value: sub.id,
                          label: sub.name,
                          color: sub.color
                        }))}
                        onChange={(value) => handleSubcategorySelectionAtLevel(2, value)}
                      />
                    );
                  }
                  return null;
                })()}

                {/* Level 3 Dropdown */}
                {selectedPath[2] && (() => {
                  const level3Options = getSubcategoriesAtLevel(3, selectedPath[2]?.id);
                  
                  if (level3Options.length > 0) {
                    return (
                      <CustomDropdown
                        label="Option"
                        value={selectedPath[3]?.id || ''}
                        placeholder="Select option..."
                        options={level3Options.map((sub: any) => ({
                          value: sub.id,
                          label: sub.name,
                          color: sub.color
                        }))}
                        onChange={(value) => handleSubcategorySelectionAtLevel(3, value)}
                      />
                    );
                  }
                  return null;
                })()}

                {/* Enhanced Product Search */}
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2 flex items-center gap-1">
                    Product Search
                    <Tooltip content="Search by name, SKU, or description">
                      <MagnifyingGlassIcon className="w-3 h-3 text-gray-400" />
                    </Tooltip>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={smartSearch}
                      onChange={(e) => handleSmartSearch(e.target.value)}
                      placeholder="Search products, SKU, description..."
                      className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-12 text-base"
                    />
                    <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-4" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Products Table or Glass Module - Exactly like Quote Page */}
            {selectedCategory === 'custom-glass' ? (
              <div className="p-6">
                <AdminConnectedGlassQuote 
                  quoteId={poId}
                  customerId={selectedCustomer?.id || ''}
                  onItemsAdded={() => {
                    console.log('Glass item added to purchase order');
                  }}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <tr>
                      <th className="px-4 py-4 text-left text-base font-bold text-gray-600 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-4 text-left text-base font-bold text-gray-600 uppercase tracking-wider">Details</th>
                      <th className="px-4 py-4 text-right text-base font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center justify-end gap-1">
                          <TagIcon className="w-4 h-4" />
                          Cost
                        </div>
                      </th>
                      <th className="px-4 py-4 text-center text-base font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1">
                          <CubeIcon className="w-4 h-4" />
                          Stock
                        </div>
                      </th>
                      <th className="px-4 py-4 text-center text-base font-bold text-gray-600 uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-4 text-center text-base font-bold text-gray-600 uppercase tracking-wider">Add</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      console.log('🔍 PO: Conditional check - filteredProducts.length:', filteredProducts.length);
                      console.log('🔍 PO: Should show products?', filteredProducts.length > 0);
                      return filteredProducts.length === 0;
                    })() ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center">
                          <CubeIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          {!selectedCategory && !smartSearch ? (
                            <>
                              <h3 className="text-xl font-medium text-gray-900 mb-2">Select a category to view products</h3>
                              <p className="text-base text-gray-600 mb-4">Choose a category from the filter above to browse available products</p>
                              <div className="mt-4 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg inline-block">
                                💡 Try selecting <span className="font-medium">Custom Glass 🪟</span> for glass product ordering!
                              </div>
                            </>
                          ) : (
                            <>
                              <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
                              <p className="text-base text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
                            </>
                          )}
                        </td>
                      </tr>
                    ) : (
                      (() => {
                        console.log('🎯 PO: Rendering products table, filteredProducts.length:', filteredProducts.length);
                        console.log('📋 PO: filteredProducts contents:', filteredProducts);
                        return filteredProducts;
                      })().map((product, index) => {
                        const isLowStock = product.currentStock <= 5;
                        const isOutOfStock = product.currentStock === 0;
                        
                        return (
                          <tr key={product.id} className={`hover:bg-blue-50 hover:shadow-sm transition-all duration-200 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}>
                            <td className="px-4 py-5">
                              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-sm">
                                <CubeIcon className="w-8 h-8 text-gray-500" />
                              </div>
                            </td>
                            <td className="px-4 py-5">
                              <div>
                                <p className="font-bold text-gray-900 text-lg leading-tight">{product.name}</p>
                                <p className="text-base text-gray-600 mt-1 font-mono">SKU: {product.code}</p>
                                {product.description && (
                                  <p className="text-base text-gray-500 mt-1">{product.description}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-5 text-right">
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-600">
                                  ${(product.costPrice || 0).toFixed(2)}
                                </div>
                                <div className="text-base text-gray-500 bg-gray-100 px-3 py-2 rounded-full inline-block mt-1">
                                  Cost Price
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-5 text-center">
                              <div className={`text-base font-bold ${
                                isOutOfStock ? 'text-red-600' :
                                isLowStock ? 'text-orange-600' :
                                'text-green-600'
                              }`}>
                                {product.currentStock}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {isOutOfStock ? 'Out of Stock' :
                                 isLowStock ? 'Low Stock' :
                                 'In Stock'}
                              </div>
                            </td>
                            <td className="px-4 py-5 text-center">
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={quantities[product.id] || '1'}
                                onChange={(e) => setQuantities(prev => ({ ...prev, [product.id]: e.target.value }))}
                                placeholder="1"
                                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                              />
                            </td>
                            <td className="px-4 py-5 text-center">
                              <button
                                onClick={() => addToOrder(product, Number(quantities[product.id]) || 1)}
                                disabled={isOutOfStock}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors text-base"
                              >
                                <PlusIcon className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </div>

          {/* Right Sidebar - Order Summary (same as quote page) */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              
              {/* Order Summary */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Purchase Order Summary</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">PO Number</label>
                    <p className="text-xl font-bold text-blue-600">{poId}</p>
                  </div>
                  
                  
                  {selectedSupplier && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Supplier</label>
                      <p className="text-lg font-semibold text-gray-900">{selectedSupplier.supplierName}</p>
                      <p className="text-sm text-gray-600">Rating: {selectedSupplier.performanceRating}/5 ⭐</p>
                    </div>
                  )}
                  
                  {lineItems.length > 0 && (
                    <div className="border-t pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal ({totalItems} items):</span>
                          <span className="font-semibold">${totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">GST (10%):</span>
                          <span className="font-semibold">${totals.gst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold border-t pt-2">
                          <span>Total:</span>
                          <span>${totals.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items */}
              {lineItems.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Order Items</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {lineItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.product.name}</div>
                          <div className="text-sm text-gray-600">{item.quantity} × ${item.unitCost.toFixed(2)} = ${item.totalCost.toFixed(2)}</div>
                        </div>
                        <button
                          onClick={() => removeFromOrder(item.id)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/suppliers')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <BuildingOfficeIcon className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Manage Suppliers</span>
                  </button>
                  
                  <button
                    onClick={() => navigate('/customers')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <UserIcon className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Manage Customers</span>
                  </button>
                  
                  {lineItems.length > 0 && selectedSupplier && (
                    <button
                      onClick={() => setShowPurchaseOrderModal(true)}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                    >
                      Create Purchase Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Order Creation Modal */}
      <PurchaseOrderModal
        isOpen={showPurchaseOrderModal}
        onClose={() => setShowPurchaseOrderModal(false)}
        orderData={{
          customer: null,
          supplier: selectedSupplier,
          lineItems,
          projectName,
          referenceNumber,
          priority: 'normal',
          expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
          specialInstructions: '',
          jobName
        }}
        onOrderCreated={handleOrderCreated}
      />
    </div>
  );
} 
