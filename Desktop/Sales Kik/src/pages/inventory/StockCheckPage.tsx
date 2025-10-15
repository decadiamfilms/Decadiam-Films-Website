import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import { 
  MagnifyingGlassIcon as Search, 
  CameraIcon as Camera, 
  ChartBarIcon as BarChart3, 
  ClipboardDocumentCheckIcon as ClipboardCheck, 
  PencilIcon as Edit3, 
  XMarkIcon as X,
  ArchiveBoxIcon as Package,
  ExclamationTriangleIcon as AlertTriangle,
  XCircleIcon as XCircle,
  BellIcon as Bell,
  BuildingOffice2Icon as Warehouse,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import StockCheckCard from '@/components/inventory/StockCheckCard';
import QuickAdjustmentModal from '@/components/inventory/QuickAdjustmentModal';
import BarcodeScannerModal from '@/components/inventory/BarcodeScannerModal';
import UniversalNavigation from '@/components/layout/UniversalNavigation';
import UniversalHeader from '@/components/layout/UniversalHeader';
import type { Product, ProductInventory, Warehouse as WarehouseType, StockCheckFilter } from '@/types/inventory';
import { dataService } from '../../services/api.service';
import '@/styles/stock-check.css';

// CustomDropdown component for category filtering
interface CustomDropdownOption {
  value: string;
  label: string;
  color?: string;
}

interface CustomDropdownProps {
  label: string;
  value: string;
  placeholder: string;
  options: CustomDropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

function CustomDropdown({ 
  label, 
  value, 
  placeholder, 
  options, 
  onChange, 
  disabled 
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
        } flex items-center justify-between`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-sm">No options available</div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 text-sm ${
                    value === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Mock components for now - these would be created in subsequent implementations
const TransferRequestModal = ({ isOpen, onClose, product }: any) => null;
const ProductDetailsModal = ({ isOpen, onClose, productId }: any) => null;
const StockMovementsModal = ({ isOpen, onClose, productId, warehouseId }: any) => null;

const StockCheckPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryMap, setInventoryMap] = useState<Map<string, ProductInventory>>(new Map());
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'low' | 'out' | 'reorder'>('all');
  const [loading, setLoading] = useState(true);

  // Category filtering state
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');
  const [selectedSubSubcategoryId, setSelectedSubSubcategoryId] = useState<string>('');
  const [selectedSubSubSubcategoryId, setSelectedSubSubSubcategoryId] = useState<string>('');
  
  // Available options for each level
  const [stockLevel1Options, setStockLevel1Options] = useState<any[]>([]);
  const [stockLevel2Options, setStockLevel2Options] = useState<any[]>([]);
  const [stockLevel3Options, setStockLevel3Options] = useState<any[]>([]);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Modal states
  const [showQuickAdjustment, setShowQuickAdjustment] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showMovements, setShowMovements] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Stats
  const [lowStockCount, setLowStockCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [needsReorderCount, setNeedsReorderCount] = useState(0);

  // Load data on mount
  useEffect(() => {
    loadWarehouses();
    loadStockData();
    loadCategories(); // Load categories for filtering
  }, [selectedWarehouse]);

  // Load warehouses
  const loadWarehouses = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/stockflow/warehouses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const warehouses = await response.json();
        setWarehouses(warehouses);
      } else {
        // Fallback to mock data
        const mockWarehouses: WarehouseType[] = [
          { id: 1, name: 'Main Warehouse', code: 'MAIN', is_active: true, is_default: true },
          { id: 2, name: 'North Location', code: 'NORTH', is_active: true, is_default: false },
          { id: 3, name: 'South Location', code: 'SOUTH', is_active: true, is_default: false }
        ];
        setWarehouses(mockWarehouses);
      }
    } catch (error) {
      console.error('Failed to load warehouses:', error);
      // Fallback to mock data
      const mockWarehouses: WarehouseType[] = [
        { id: 1, name: 'Main Warehouse', code: 'MAIN', is_active: true, is_default: true },
        { id: 2, name: 'North Location', code: 'NORTH', is_active: true, is_default: false },
        { id: 3, name: 'South Location', code: 'SOUTH', is_active: true, is_default: false }
      ];
      setWarehouses(mockWarehouses);
    }
  };

  // Load categories for filtering
  const loadCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      if (response.ok) {
        const result = await response.json();
        const data = result.success ? result.data : [];
        
        // Transform categories to safe objects (avoid React rendering errors)
        const safeCategories = data.map((cat: any) => ({
          id: String(cat.id || ''),
          name: String(cat.name || 'Unknown'),
          color: String(cat.color || '#3B82F6'),
          subcategories: cat.subcategories || []
        }));
        
        setCategories(safeCategories);
        console.log('✅ StockCheck: Categories transformed and loaded:', safeCategories.length);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
  };

  // StockCheck cascading dropdown loading functions  
  const loadStockCheckLevel1Options = async (categoryId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      const result = await response.json();
      
      if (result.success) {
        const category = result.data.find((cat: any) => cat.id === categoryId);
        if (category && category.subcategories) {
          const level0Subs = category.subcategories
            .filter((sub: any) => sub.level === 0 && !sub.parentId)
            .map((sub: any) => ({
              value: String(sub.id || ''),
              label: String(sub.name || 'Unknown'),
              color: String(sub.color || '#3B82F6')
            }));
          setStockLevel1Options(level0Subs);
        } else {
          setStockLevel1Options([]);
        }
      }
    } catch (error) {
      console.error('Failed to load stock check level 1 options:', error);
      setStockLevel1Options([]);
    }
  };

  const loadStockCheckLevel2Options = async (subcategoryId: string) => {
    try {
      console.log('🔍 StockCheck: Loading Level 2 options for parent:', subcategoryId);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      const result = await response.json();
      
      if (result.success) {
        // Find all subcategories with this parentId (using flat structure)
        let level1Children: any[] = [];
        for (const category of result.data) {
          if (category.subcategories) {
            const children = category.subcategories.filter((sub: any) => 
              sub.parentId === subcategoryId
            );
            level1Children.push(...children);
          }
        }
        
        console.log('📂 StockCheck: Found Level 2 options:', level1Children.map(c => c.name));
        
        const level2Options = level1Children.map((child: any) => ({
          value: String(child.id || ''),
          label: String(child.name || 'Unknown'),
          color: String(child.color || '#3B82F6')
        }));
        
        setStockLevel2Options(level2Options);
      }
    } catch (error) {
      console.error('Failed to load stock check level 2 options:', error);
      setStockLevel2Options([]);
    }
  };

  const loadStockCheckLevel3Options = async (subcategoryId: string) => {
    try {
      console.log('🔍 StockCheck: Loading Level 3 options for parent:', subcategoryId);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      const result = await response.json();
      
      if (result.success) {
        // Find all subcategories with this parentId (using flat structure)
        let level2Children: any[] = [];
        for (const category of result.data) {
          if (category.subcategories) {
            const children = category.subcategories.filter((sub: any) => 
              sub.parentId === subcategoryId
            );
            level2Children.push(...children);
          }
        }
        
        console.log('📂 StockCheck: Found Level 3 options:', level2Children.map(c => c.name));
        
        const level3Options = level2Children.map((child: any) => ({
          value: String(child.id || ''),
          label: String(child.name || 'Unknown'),
          color: String(child.color || '#3B82F6')
        }));
        
        setStockLevel3Options(level3Options);
      }
    } catch (error) {
      console.error('Failed to load stock check level 3 options:', error);
      setStockLevel3Options([]);
    }
  };

  // Helper function for StockCheck cascading
  const findStockCheckSubcategoryInHierarchy = (subcategories: any[], targetId: string): any => {
    for (const sub of subcategories) {
      if (sub.id === targetId) {
        return sub;
      }
      if (sub.children && sub.children.length > 0) {
        const found = findStockCheckSubcategoryInHierarchy(sub.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  // Load real database products for Stock Check
  const loadStockData = async () => {
    setLoading(true);
    try {
      console.log('📦 StockCheck: Loading products from database');
      
      // Load real products from database
      console.log('📦 StockCheck: Loading products using dataService...');
      const databaseProducts = await dataService.products.getAll();
      console.log('✅ StockCheck: dataService returned:', databaseProducts?.length || 'undefined', 'products');
      
      if (!databaseProducts || databaseProducts.length === 0) {
        throw new Error('No products received from database');
      }
      
      // Transform database products to Stock Check format while preserving inventory/pricing
      const stockCheckProducts: Product[] = databaseProducts.map((product: any) => ({
        id: String(product.id || ''),
        name: String(product.name || 'Unnamed Product'),
        sku: String(product.code || ''),
        barcode: String(product.code || ''), // Use product code as barcode
        category_id: product.category_id || product.categoryId,
        category_name: String(product.categoryName || product.category?.name || 'Unknown Category'),
        image_url: '',
        is_active: Boolean(product.isActive !== false),
        
        // PRESERVE inventory and pricing data for stock calculations
        inventory: product.inventory,
        pricing: product.pricing,
        cost: product.cost,
        currentStock: product.currentStock
      }));
      
      // Apply filters
      let filteredProducts = stockCheckProducts;
      
      // Search filter
      if (searchQuery) {
        const searchTerm = searchQuery.toLowerCase();
        filteredProducts = stockCheckProducts.filter(p => 
          p.name.toLowerCase().includes(searchTerm) ||
          p.sku.toLowerCase().includes(searchTerm) ||
          p.barcode.toLowerCase().includes(searchTerm) ||
          p.category_name.toLowerCase().includes(searchTerm)
        );
      }
      
      // Category filters
      if (selectedCategoryId || selectedSubcategoryId || selectedSubSubcategoryId || selectedSubSubSubcategoryId) {
        filteredProducts = filteredProducts.filter(product => {
          if (selectedCategoryId) {
            const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
            if (selectedCategory) {
              return product.category_name?.includes(selectedCategory.name);
            }
          }
          return true;
        });
      }
      
      // Show first 25 products by default, or all if searching/filtering
      if (!searchQuery && activeFilter === 'all') {
        filteredProducts = filteredProducts.slice(0, 25);
      }
      
      console.log('✅ StockCheck: Loaded', stockCheckProducts.length, 'products from database, showing', filteredProducts.length);
      setProducts(filteredProducts);

      // Use REAL inventory data from database instead of fake data
      const realInventory: ProductInventory[] = filteredProducts.map((product, index) => {
        console.log('📋 StockCheck: Processing product inventory:', product.name);
        console.log('📦 StockCheck: Full product object:', product);
        console.log('📊 StockCheck: Inventory object:', product.inventory);
        console.log('💰 StockCheck: Pricing object:', product.pricing);
        
        // Try multiple possible inventory data structures
        const inventoryData = product.inventory || {};
        const pricingData = product.pricing || {};
        
        // More comprehensive field checking
        const currentStock = 
          inventoryData.current_stock || 
          inventoryData.currentStock || 
          product.currentStock ||
          product.inventory?.current_stock ||
          0;
          
        const reserved = inventoryData.reserved_stock || inventoryData.reserved || 0;
        const available = inventoryData.available_stock || inventoryData.available || currentStock;
        const reorderPoint = inventoryData.reorder_point || inventoryData.reorderPoint || product.reorderLevel || 10;
        
        // More comprehensive pricing field checking  
        const costPrice = 
          pricingData.cost_price || 
          pricingData.costPrice ||
          product.cost ||
          product.costPrice ||
          0;
        
        console.log('✅ StockCheck: Real values mapped:', {
          productName: product.name,
          currentStock,
          available,
          reorderPoint,
          costPrice
        });

        return {
          id: index + 1,
          product_id: product.id,
          warehouse_id: 1,
          quantity_on_hand: currentStock,
          quantity_reserved: reserved,
          quantity_available: available,
          quantity_pending_in: 0,
          quantity_allocated: 0,
          reorder_point: reorderPoint,
          reorder_quantity: 50,
          average_cost: costPrice,
          last_cost: costPrice,
          total_value: currentStock * costPrice,
          bin_location: 'A1-B1' // Default location
        };
      });

      // Products already set above with setProducts(filteredProducts)

      // Build inventory map from real inventory data
      const newInventoryMap = new Map<string, ProductInventory>();
      realInventory.forEach(inv => {
        newInventoryMap.set(`${inv.product_id}-${inv.warehouse_id}`, inv);
      });
      setInventoryMap(newInventoryMap);

      calculateStats(filteredProducts, newInventoryMap);
    } catch (error) {
      console.error('Failed to load stock data:', error);
      setProducts([]);
      setInventoryMap(new Map());
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = useCallback((
    productList: Product[] = products,
    invMap: Map<string, ProductInventory> = inventoryMap
  ) => {
    let low = 0, out = 0, reorder = 0;

    productList.forEach(p => {
      const inv = getInventoryForProduct(p.id, invMap);
      if (!inv || inv.quantity_available === 0) {
        out++;
        reorder++;
      } else if (inv.quantity_available <= inv.reorder_point) {
        low++;
        reorder++;
      }
    });

    setLowStockCount(low);
    setOutOfStockCount(out);
    setNeedsReorderCount(reorder);
  }, [products, inventoryMap]);

  // Get inventory for a product
  const getInventoryForProduct = (
    productId: number,
    invMap: Map<string, ProductInventory> = inventoryMap
  ): ProductInventory | null => {
    if (selectedWarehouse !== 'all') {
      return invMap.get(`${productId}-${selectedWarehouse}`) || null;
    }

    // Aggregate across all warehouses
    const allInventory = Array.from(invMap.values())
      .filter(inv => inv.product_id === productId);

    if (allInventory.length === 0) return null;

    return {
      ...allInventory[0],
      quantity_on_hand: allInventory.reduce((sum, inv) => sum + inv.quantity_on_hand, 0),
      quantity_reserved: allInventory.reduce((sum, inv) => sum + inv.quantity_reserved, 0),
      quantity_available: allInventory.reduce((sum, inv) => sum + inv.quantity_available, 0),
      quantity_pending_in: allInventory.reduce((sum, inv) => sum + inv.quantity_pending_in, 0),
    };
  };

  // Get warehouse name
  const getWarehouseName = (warehouseId: number): string => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse?.name || 'Unknown';
  };

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      setSearchQuery(query);
    }, 300),
    []
  );

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.barcode?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(p => {
        const inv = getInventoryForProduct(p.id);
        if (!inv) return activeFilter === 'out';

        switch (activeFilter) {
          case 'out':
            return inv.quantity_available === 0;
          case 'low':
            return inv.quantity_available > 0 && inv.quantity_available <= inv.reorder_point;
          case 'reorder':
            return inv.quantity_available <= inv.reorder_point;
          default:
            return true;
        }
      });
    }

    // Apply category filters
    if (selectedCategoryId || selectedSubcategoryId || selectedSubSubcategoryId || selectedSubSubSubcategoryId) {
      filtered = filtered.filter(product => {
        // For now, filter by category name matching since we're using mock data
        // In a real implementation, this would filter by product.categoryId
        if (selectedCategoryId) {
          const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
          if (selectedCategory) {
            return product.category_name?.includes(selectedCategory.name);
          }
        }
        return true;
      });
    }

    // Limit to first 25 products by default (unless searching or filtering)
    if (!searchQuery && activeFilter === 'all') {
      filtered = filtered.slice(0, 25);
    }

    return filtered;
  }, [products, searchQuery, activeFilter, inventoryMap, selectedCategoryId, selectedSubcategoryId, selectedSubSubcategoryId, selectedSubSubSubcategoryId, categories]);

  // Quick filters
  const quickFilters: StockCheckFilter[] = [
    { value: 'all', label: 'All Items', icon: 'package', count: null },
    { value: 'low', label: 'Low Stock', icon: 'alert-triangle', count: lowStockCount },
    { value: 'out', label: 'Out of Stock', icon: 'x-circle', count: outOfStockCount },
    { value: 'reorder', label: 'Needs Reorder', icon: 'bell', count: needsReorderCount }
  ];

  // Handler functions
  const handleBarcodeScanned = async (barcode: string) => {
    try {
      // Find product by barcode in local data
      const product = products.find(p => p.barcode === barcode);
      
      if (product) {
        setSearchQuery(product.sku);
        
        setTimeout(() => {
          const element = document.querySelector(`[data-product-id="${product.id}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('highlight');
            setTimeout(() => element.classList.remove('highlight'), 2000);
          }
        }, 100);

        alert(`Product Found: ${product.name}`);
      } else {
        alert('Product not found');
      }
    } catch (error) {
      alert('Error scanning barcode');
    }
  };

  const handleAdjustmentSaved = async () => {
    await loadStockData();
    alert('Stock adjusted successfully');
  };

  const handleTransferCreated = async () => {
    await loadStockData();
    alert('Transfer request created');
  };

  const openAdjustment = (product: Product) => {
    setSelectedProduct(product);
    setShowQuickAdjustment(true);
  };

  const openTransfer = (product: Product) => {
    setSelectedProduct(product);
    setShowTransferModal(true);
  };

  const viewProductDetails = (product: Product) => {
    setSelectedProductId(product.id);
    setShowProductDetails(true);
  };

  const viewMovements = (product: Product) => {
    setSelectedProductId(product.id);
    setShowMovements(true);
  };

  // Render filter icon
  const FilterIcon = ({ name }: { name: string }) => {
    const icons: Record<string, React.ReactNode> = {
      'package': <Package className="w-4 h-4" />,
      'alert-triangle': <AlertTriangle className="w-4 h-4" />,
      'x-circle': <XCircle className="w-4 h-4" />,
      'bell': <Bell className="w-4 h-4" />
    };
    return <>{icons[name]}</>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="inventory" 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
      />
      
      <UniversalHeader 
        title="Stock Check & Management"
        subtitle="Search-optimized inventory management for large catalogs"
        onMenuToggle={() => setSidebarOpen(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/stockflow')}>
              <BarChart3 className="w-4 h-4 mr-2" />
              StockFlow Analytics
            </Button>
            <Button variant="outline" onClick={() => navigate('/inventory/stocktakes')}>
              <ClipboardCheck className="w-4 h-4 mr-2" />
              View Stocktakes
            </Button>
          </div>
          
          <Button variant="primary" onClick={() => setShowQuickAdjustment(true)}>
            <Edit3 className="w-4 h-4 mr-2" />
            Quick Adjustment
          </Button>
        </div>

      {/* Filters & Search */}
      <div className="filters-section">
        <div className="filters-row">
          {/* Warehouse Selector */}
          <div className="filter-group">
            <label>Warehouse</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="warehouse-select"
            >
              <option value="all">All Warehouses</option>
              {warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id.toString()}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <div className="filter-group flex-1">
            <label>Search</label>
            <div className="search-input-wrapper">
              <Search className="search-icon w-4 h-4" />
              <input
                type="text"
                placeholder="Product name, SKU, or barcode..."
                onChange={(e) => debouncedSearch(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="clear-btn">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filters - 4-Level Cascading Dropdowns */}
          <div className="filter-group">
            <label>Category Filters</label>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Main Category Dropdown */}
              <CustomDropdown
                label=""
                value={selectedCategoryId}
                placeholder="All Categories"
                options={categories.map(cat => ({
                  value: cat.id,
                  label: cat.name,
                  color: cat.color
                }))}
                onChange={(value) => {
                  console.log('StockCheck: Main category selected:', value);
                  setSelectedCategoryId(value);
                  setSelectedSubcategoryId('');
                  setSelectedSubSubcategoryId('');
                  setSelectedSubSubSubcategoryId('');
                  setStockLevel1Options([]);
                  setStockLevel2Options([]);
                  setStockLevel3Options([]);
                  if (value) {
                    loadStockCheckLevel1Options(value);
                  }
                }}
              />

              {/* Level 1 Subcategory Dropdown */}
              {selectedCategoryId && stockLevel1Options.length > 0 && (
                <CustomDropdown
                  label=""
                  value={selectedSubcategoryId}
                  placeholder="Select subcategory..."
                  options={stockLevel1Options}
                  onChange={(value) => {
                    console.log('StockCheck: Level 1 selected:', value);
                    setSelectedSubcategoryId(value);
                    setSelectedSubSubcategoryId('');
                    setSelectedSubSubSubcategoryId('');
                    setStockLevel2Options([]);
                    setStockLevel3Options([]);
                    if (value) {
                      loadStockCheckLevel2Options(value);
                    }
                  }}
                />
              )}

              {/* Level 2 Sub-Subcategory Dropdown */}
              {selectedSubcategoryId && stockLevel2Options.length > 0 && (
                <CustomDropdown
                  label=""
                  value={selectedSubSubcategoryId}
                  placeholder="Select type..."
                  options={stockLevel2Options}
                  onChange={(value) => {
                    console.log('StockCheck: Level 2 selected:', value);
                    setSelectedSubSubcategoryId(value);
                    setSelectedSubSubSubcategoryId('');
                    setStockLevel3Options([]);
                    if (value) {
                      loadStockCheckLevel3Options(value);
                    }
                  }}
                />
              )}

              {/* Level 3 Final Category Dropdown */}
              {selectedSubSubcategoryId && stockLevel3Options.length > 0 && (
                <CustomDropdown
                  label=""
                  value={selectedSubSubSubcategoryId}
                  placeholder="Select specification..."
                  options={stockLevel3Options}
                  onChange={(value) => {
                    console.log('StockCheck: Level 3 selected:', value);
                    setSelectedSubSubSubcategoryId(value);
                  }}
                />
              )}
            </div>
          </div>

          {/* Barcode Scanner Button */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowBarcodeScanner(true)}
            className="barcode-btn"
          >
            <Camera className="w-6 h-6" />
          </Button>
        </div>

        {/* Quick Filters */}
        <div className="quick-filters">
          {quickFilters.map(filter => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`filter-chip ${activeFilter === filter.value ? 'active' : ''}`}
            >
              <FilterIcon name={filter.icon} />
              {filter.label}
              {filter.count !== null && filter.count > 0 && (
                <span className="badge">{filter.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Grid */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Searching inventory...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Action Buttons - Always visible */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick Stock Actions</h3>
              <span className="text-sm text-gray-500">{filteredProducts.length} products shown</span>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button 
                onClick={() => setActiveFilter('low')}
                className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors flex items-center"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                View Low Stock ({lowStockCount})
              </button>
              <button 
                onClick={() => setActiveFilter('out')}
                className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors flex items-center"
              >
                <XCircle className="w-4 h-4 mr-2" />
                View Out of Stock ({outOfStockCount})
              </button>
              <button 
                onClick={() => setActiveFilter('reorder')}
                className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors flex items-center"
              >
                <Bell className="w-4 h-4 mr-2" />
                Needs Reorder ({needsReorderCount})
              </button>
              <button 
                onClick={() => setShowBarcodeScanner(true)}
                className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors flex items-center"
              >
                <Camera className="w-4 h-4 mr-2" />
                Scan Barcode
              </button>
              <button 
                onClick={() => navigate('/inventory/stocktakes/new')}
                className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors flex items-center"
              >
                <ClipboardCheck className="w-4 h-4 mr-2" />
                New Stocktake
              </button>
              {activeFilter !== 'all' && (
                <button 
                  onClick={() => setActiveFilter('all')}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Show All Products
                </button>
              )}
            </div>
          </div>

          {/* Products Table */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                >
                  Clear Search
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 tracking-wider">Product</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 tracking-wider">SKU/Code</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 tracking-wider">Current Stock</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 tracking-wider">Last Movement</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredProducts.map((product, index) => {
                      const inventory = getInventoryForProduct(product.id);
                      const stockLevel = inventory?.quantity_available || 0;
                      const reorderPoint = inventory?.reorder_point || 10;
                      
                      let stockStatus = 'Good Stock';
                      let statusColor = 'text-green-600 bg-green-100';
                      
                      if (stockLevel === 0) {
                        stockStatus = 'Out of Stock';
                        statusColor = 'text-red-600 bg-red-100';
                      } else if (stockLevel <= reorderPoint) {
                        stockStatus = 'Low Stock';
                        statusColor = 'text-yellow-600 bg-yellow-100';
                      } else if (stockLevel > reorderPoint * 5) {
                        stockStatus = 'Overstock';
                        statusColor = 'text-blue-600 bg-blue-100';
                      }
                      
                      return (
                        <tr key={product.id} className={`hover:bg-blue-25 border-b border-gray-100 transition-colors duration-200 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                        }`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-base font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.barcode}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-base font-medium text-gray-900">{product.sku}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{product.category_name}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-lg font-bold text-gray-900">{stockLevel.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColor}`}>
                              {stockStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {inventory?.last_movement ? new Date(inventory.last_movement).toLocaleDateString() : 'No movement'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openAdjustment(product)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Adjust stock"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => viewProductDetails(product)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="View details"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => viewMovements(product.id, selectedWarehouse !== 'all' ? parseInt(selectedWarehouse) : undefined)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="View movements"
                              >
                                <BarChart3 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <QuickAdjustmentModal
        product={selectedProduct}
        warehouseId={selectedWarehouse !== 'all' ? parseInt(selectedWarehouse) : undefined}
        isOpen={showQuickAdjustment}
        onClose={() => setShowQuickAdjustment(false)}
        onSaved={handleAdjustmentSaved}
      />

      <BarcodeScannerModal
        isOpen={showBarcodeScanner}
        onScanned={handleBarcodeScanned}
        onClose={() => setShowBarcodeScanner(false)}
      />
      </div>
    </div>
  );
};

export default StockCheckPage;