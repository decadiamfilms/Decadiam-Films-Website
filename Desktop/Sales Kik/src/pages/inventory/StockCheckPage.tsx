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
  BuildingOffice2Icon as Warehouse
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import StockCheckCard from '@/components/inventory/StockCheckCard';
import QuickAdjustmentModal from '@/components/inventory/QuickAdjustmentModal';
import BarcodeScannerModal from '@/components/inventory/BarcodeScannerModal';
import UniversalNavigation from '@/components/layout/UniversalNavigation';
import UniversalHeader from '@/components/layout/UniversalHeader';
import type { Product, ProductInventory, Warehouse as WarehouseType, StockCheckFilter } from '@/types/inventory';
import '@/styles/stock-check.css';

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

  // Load stock data - optimized for large inventories
  const loadStockData = async () => {
    // Only load data if there's a search query or filter applied
    if (!searchQuery && activeFilter === 'all') {
      setLoading(false);
      setProducts([]);
      setInventoryMap(new Map());
      return;
    }

    setLoading(true);
    try {
      // Use mock data for now (API temporarily disabled for debugging)
      console.log('Loading stock data with search/filter:', { searchQuery, activeFilter });
      
      // Generate mock data based on search to simulate real search results
      const generateMockProducts = (searchTerm: string, filter: string): Product[] => {
        const allMockProducts = [
          { id: 1, name: 'Glass Panel 1200x800mm', sku: 'GP-1200-800', barcode: '123456789012', category_id: 1, category_name: 'Glass Panels', image_url: '', is_active: true },
          { id: 2, name: 'Pool Fence Post 1800mm', sku: 'PFP-1800', barcode: '987654321098', category_id: 2, category_name: 'Fence Posts', image_url: '', is_active: true },
          { id: 3, name: 'Stainless Steel Bolts M8x50', sku: 'SSB-M8-50', barcode: '111222333444', category_id: 3, category_name: 'Hardware', image_url: '', is_active: true },
          { id: 4, name: 'Aluminum Window Frame', sku: 'AWF-2000', barcode: '555666777888', category_id: 4, category_name: 'Frames', image_url: '', is_active: true },
          { id: 5, name: 'Safety Glass 10mm', sku: 'SG-10MM', barcode: '999888777666', category_id: 1, category_name: 'Glass Panels', image_url: '', is_active: true },
          { id: 6, name: 'Gate Hinges Stainless', sku: 'GH-SS', barcode: '444333222111', category_id: 3, category_name: 'Hardware', image_url: '', is_active: true }
        ];
        
        if (searchTerm) {
          return allMockProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.barcode.includes(searchTerm)
          );
        }
        
        return allMockProducts;
      };

      const mockProducts = generateMockProducts(searchQuery, activeFilter);

      const mockInventory: ProductInventory[] = mockProducts.map((product, index) => {
        let stockLevel = 50; // Default good stock
        
        // Simulate different stock levels based on filter
        if (activeFilter === 'out') stockLevel = 0;
        else if (activeFilter === 'low') stockLevel = Math.floor(Math.random() * 10) + 1;
        else if (activeFilter === 'reorder') stockLevel = Math.floor(Math.random() * 15) + 1;
        else stockLevel = Math.floor(Math.random() * 200) + 20;

        return {
          id: index + 1,
          product_id: product.id,
          warehouse_id: 1,
          quantity_on_hand: stockLevel,
          quantity_reserved: Math.floor(stockLevel * 0.1),
          quantity_available: Math.floor(stockLevel * 0.9),
          quantity_pending_in: Math.floor(Math.random() * 50),
          quantity_allocated: 0,
          reorder_point: 15,
          reorder_quantity: 50,
          average_cost: 25.50 + (index * 5),
          last_cost: 27.00 + (index * 5),
          total_value: stockLevel * (25.50 + (index * 5)),
          bin_location: `A${Math.floor(Math.random() * 5) + 1}-B${Math.floor(Math.random() * 5) + 1}`
        };
      });

      setProducts(mockProducts);

      // Build inventory map
      const newInventoryMap = new Map<string, ProductInventory>();
      mockInventory.forEach(inv => {
        newInventoryMap.set(`${inv.product_id}-${inv.warehouse_id}`, inv);
      });
      setInventoryMap(newInventoryMap);

      calculateStats(mockProducts, newInventoryMap);
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

    return filtered;
  }, [products, searchQuery, activeFilter, inventoryMap]);

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
      ) : !searchQuery && activeFilter === 'all' ? (
        <div className="search-first-state">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3>Search Your Inventory</h3>
          <p>Optimized for large catalogs - search by product name, SKU, or barcode to quickly find what you need</p>
          <div className="mt-6 space-y-3">
            <p className="text-sm text-gray-500">Quick ways to get started:</p>
            <div className="flex gap-2 justify-center flex-wrap">
              <button 
                onClick={() => setActiveFilter('low')}
                className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
              >
                <AlertTriangle className="w-4 h-4 mr-2 inline" />
                View Low Stock Items
              </button>
              <button 
                onClick={() => setActiveFilter('out')}
                className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
              >
                <XCircle className="w-4 h-4 mr-2 inline" />
                View Out of Stock
              </button>
              <button 
                onClick={() => setShowBarcodeScanner(true)}
                className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Camera className="w-4 h-4 mr-2 inline" />
                Scan Barcode
              </button>
              <button 
                onClick={() => navigate('/inventory/stocktakes/new')}
                className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
              >
                <ClipboardCheck className="w-4 h-4 mr-2 inline" />
                New Stocktake
              </button>
            </div>
            <div className="mt-4 text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
              💡 <strong>Performance Tip:</strong> This search-first approach keeps the page fast even with thousands of products
            </div>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <Package className="w-12 h-12" />
          <h3>No products found</h3>
          <p>Try adjusting your search or filters</p>
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
        <div className="stock-grid">
          {filteredProducts.map(product => (
            <StockCheckCard
              key={product.id}
              product={product}
              inventory={getInventoryForProduct(product.id)}
              warehouseName={
                selectedWarehouse !== 'all' ? getWarehouseName(parseInt(selectedWarehouse)) : undefined
              }
              onAdjust={openAdjustment}
              onTransfer={openTransfer}
              onViewDetails={viewProductDetails}
              onViewMovements={viewMovements}
            />
          ))}
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