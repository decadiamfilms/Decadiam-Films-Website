import React, { useState, useEffect } from 'react';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import AdvancedInventoryGrid from '../../components/stockflow/AdvancedInventoryGrid';
import AutoPODashboard from '../../components/stockflow/AutoPODashboard';
import AutoPOSettingsModal from '../../components/stockflow/AutoPOSettingsModal';
import PurchaseOrderModal from '../../components/inventory/PurchaseOrderModal';
import { generatePurchaseOrderTemplate, generatePONumber } from '../../components/inventory/PurchaseOrderTemplate';
import { dataService } from '../../services/api.service';
import { 
  ArchiveBoxIcon,
  BuildingOffice2Icon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BoltIcon,
  MagnifyingGlassIcon,
  ChevronUpDownIcon
} from '@heroicons/react/24/outline';

// CustomDropdown component (same as NewQuotePage)
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
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'
        }`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronUpDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-2.5" />
      </button>
      
      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 text-gray-900 border-b border-gray-100 last:border-b-0"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface StockMetrics {
  totalInventoryValue: number;
  lowStockItems: number;
  pendingStocktakes: number;
  todayMovements: number;
  pendingTransfers: number;
  pendingPurchaseOrders: number;
}

export default function StockFlowDashboard() {
  const [metrics, setMetrics] = useState<StockMetrics>({
    totalInventoryValue: 0,
    lowStockItems: 0,
    pendingStocktakes: 0,
    todayMovements: 0,
    pendingTransfers: 0,
    pendingPurchaseOrders: 0
  });

  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Products for modals
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  
  // Categories for filters
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  // Transfer requests storage
  const [transferRequests, setTransferRequests] = useState<any[]>([]);
  
  // Modal states
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [showNewStocktake, setShowNewStocktake] = useState(false);
  const [showTransferRequest, setShowTransferRequest] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false);
  const [showRealPOModal, setShowRealPOModal] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showPendingStocktakes, setShowPendingStocktakes] = useState(false);
  const [showPendingTransfers, setShowPendingTransfers] = useState(false);
  const [showPendingPOs, setShowPendingPOs] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [poOrderData, setPOOrderData] = useState<any>(null);
  
  // Tab navigation state
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'auto-po'>('inventory');
  
  // Notification state
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  
  // Automation settings state
  const [automationSettings, setAutomationSettings] = useState({
    autoPurchaseOrders: true,
    smartReorderSuggestions: false,
    automatedStocktakeScheduling: false
  });
  
  // Form states
  const [stockAdjustmentForm, setStockAdjustmentForm] = useState({
    product: '',
    productName: '',
    currentStock: 0,
    adjustment: 0,
    reason: '',
    notes: '',
    productSearch: '',
    categoryFilter: '',
    subcategoryFilter: ''
  });
  
  const [stocktakeForm, setStocktakeForm] = useState({
    name: '',
    warehouse: 'main',
    type: 'full',
    date: '',
    hideQuantities: true,
    allowMobile: true
  });
  
  const [transferForm, setTransferForm] = useState({
    fromWarehouse: 'main',
    toWarehouse: 'north',
    product: '',
    productName: '',
    quantity: 0,
    priority: 'normal',
    reason: '',
    categoryFilter: '',
    subcategoryFilter: '',
    productSearch: ''
  });

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    loadDashboardData();
    loadProducts();
    loadCategories();
    loadTransfers();
  }, [selectedWarehouse]);

  const handleWarehouseChange = (warehouse: string) => {
    setSelectedWarehouse(warehouse);
    showNotification('info', `Switching to ${warehouse === 'all' ? 'All Warehouses' : warehouse} view...`);
    
    // Simulate loading different data based on warehouse selection
    setLoading(true);
    setTimeout(() => {
      const warehouseData = {
        all: { totalInventoryValue: 142500.00, lowStockItems: 23, pendingStocktakes: 2, todayMovements: 15, pendingTransfers: 4, pendingPurchaseOrders: 7 },
        main: { totalInventoryValue: 85500.00, lowStockItems: 12, pendingStocktakes: 1, todayMovements: 8, pendingTransfers: 2, pendingPurchaseOrders: 4 },
        north: { totalInventoryValue: 35200.00, lowStockItems: 8, pendingStocktakes: 1, todayMovements: 4, pendingTransfers: 1, pendingPurchaseOrders: 2 },
        south: { totalInventoryValue: 21800.00, lowStockItems: 3, pendingStocktakes: 0, todayMovements: 3, pendingTransfers: 1, pendingPurchaseOrders: 1 }
      };
      
      setMetrics(warehouseData[warehouse as keyof typeof warehouseData] || warehouseData.all);
      setLoading(false);
      showNotification('success', `Data loaded for ${warehouse === 'all' ? 'All Warehouses' : warehouse}`);
    }, 800);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading dashboard data from inventory API...');
      
      // Use mock data for now (API temporarily disabled)
      console.log('📊 Loading dashboard data with mock data...');
      
      const mockData = {
        totalInventoryValue: 142500.00,
        lowStockItems: 23,
        pendingStocktakes: 2,
        todayMovements: 15,
        pendingTransfers: 4,
        pendingPurchaseOrders: 7
      };
      
      setMetrics(mockData);
      console.log('✅ Dashboard data loaded (mock):', mockData);
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      // Fallback to mock data if API fails
      setMetrics({
        totalInventoryValue: 142500.00,
        lowStockItems: 23,
        pendingStocktakes: 2,
        todayMovements: 15,
        pendingTransfers: 4,
        pendingPurchaseOrders: 7
      });
      setLoading(false);
      showNotification('error', 'Failed to load data from API, showing cached data');
    }
  };

  // Load products from Product Management API for modals
  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      console.log('📦 StockFlow: Loading products from Product Management API...');
      
      const productsData = await dataService.products.getAll();
      
      if (productsData && productsData.length > 0) {
        setProducts(productsData);
        console.log('✅ StockFlow: Loaded', productsData.length, 'products for modals');
      } else {
        setProducts([]);
        console.log('📝 StockFlow: No products found');
      }
    } catch (error) {
      console.error('❌ StockFlow: Error loading products:', error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // Load categories for filters
  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      console.log('📁 StockFlow: Loading categories for filters...');
      
      const categoriesData = await dataService.categories.getAll();
      
      if (categoriesData && categoriesData.length > 0) {
        const transformedCategories = categoriesData.map((cat: any) => ({
          ...cat,
          createdAt: new Date(cat.createdAt),
          updatedAt: new Date(cat.updatedAt)
        }));
        
        setCategories(transformedCategories);
        console.log('✅ StockFlow: Loaded', transformedCategories.length, 'categories for filters');
      } else {
        setCategories([]);
        console.log('📝 StockFlow: No categories found');
      }
    } catch (error) {
      console.error('❌ StockFlow: Error loading categories:', error);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Load transfer requests from API/localStorage
  const loadTransfers = async () => {
    try {
      console.log('📦 StockFlow: Loading transfer requests...');
      const transfersData = await dataService.transfers.getAll();
      setTransferRequests(transfersData);
      console.log('✅ StockFlow: Loaded', transfersData.length, 'transfer requests');
    } catch (error) {
      console.error('❌ StockFlow: Error loading transfers:', error);
      setTransferRequests([]);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  const createPurchaseOrderFromAlert = (alert: any) => {
    // Create purchase order data in the format your template system expects
    const poData = {
      customer: {
        name: 'Ecco Hardware', // Your company
        address: 'Main Warehouse',
        email: 'purchasing@eccohardware.com.au',
        phone: '+61 2 1234 5678'
      },
      supplier: {
        id: 'supplier-001',
        name: 'AusGlass Supplies', // Default supplier for the product
        address: '123 Industrial Ave, Sydney NSW 2000',
        email: 'orders@ausglass.com.au',
        phone: '+61 2 9876 5432',
        abn: '12 345 678 901'
      },
      lineItems: [{
        id: 'item-001',
        product: {
          id: alert.productId || 'product-001',
          name: alert.product,
          sku: `SKU-${alert.product.replace(/\s+/g, '').substring(0, 8).toUpperCase()}`,
          description: `Restock for ${alert.product} due to low inventory levels`
        },
        quantity: alert.reorder,
        unitCost: alert.estimatedCost || 25.00,
        totalCost: (alert.reorder || 50) * (alert.estimatedCost || 25.00),
        notes: `Critical restock - Current stock: ${alert.current}`
      }],
      projectName: `Inventory Restock - ${alert.product}`,
      referenceNumber: `RESTOCK-${Date.now()}`,
      priority: alert.urgency === 'high' ? 'urgent' as const : 'normal' as const,
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      specialInstructions: `Auto-generated purchase order for low stock item. Current stock level: ${alert.current}, Reorder level: ${alert.reorder}`,
      jobName: 'Inventory Management'
    };

    setPOOrderData(poData);
    setSelectedProduct(alert);
    setShowRealPOModal(true);
  };

  const MetricCard = ({ title, value, icon: Icon, color = 'blue', trend, onClick }: any) => (
    <button 
      type="button"
      className={`w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left min-h-[120px] ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('MetricCard clicked:', title);
        if (onClick) {
          onClick();
        }
      }}
      disabled={!onClick}
    >
      <div className="flex items-start justify-between h-full">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
          <p className={`text-xl font-semibold break-words ${color === 'warning' ? 'text-orange-600' : color === 'danger' ? 'text-red-600' : color === 'success' ? 'text-green-600' : 'text-blue-600'}`}>
            {value}
          </p>
          {trend && (
            <p className={`text-xs mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full flex-shrink-0 ml-4 ${color === 'warning' ? 'bg-orange-100' : color === 'danger' ? 'bg-red-100' : color === 'success' ? 'bg-green-100' : 'bg-blue-100'}`}>
          <Icon className={`w-6 h-6 ${color === 'warning' ? 'text-orange-600' : color === 'danger' ? 'text-red-600' : color === 'success' ? 'text-green-600' : 'text-blue-600'}`} />
        </div>
      </div>
    </button>
  );

  const QuickActionCard = ({ title, description, icon: Icon, onClick, color = 'blue' }: any) => (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-full ${color === 'green' ? 'bg-green-100' : color === 'orange' ? 'bg-orange-100' : 'bg-blue-100'}`}>
          <Icon className={`w-6 h-6 ${color === 'green' ? 'text-green-600' : color === 'orange' ? 'text-orange-600' : 'text-blue-600'}`} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="stockflow" 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
      />
      
      <UniversalHeader 
        title="StockFlow Manager"
        subtitle="Comprehensive stock management and inventory control"
        onMenuToggle={() => setSidebarOpen(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">StockFlow Dashboard</h1>
            <p className="text-gray-600 mt-1">Monitor and manage your inventory across all locations</p>
          </div>
          
          <div className="flex space-x-4">
            <select 
              value={selectedWarehouse}
              onChange={(e) => handleWarehouseChange(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">All Warehouses</option>
              <option value="main">Main Warehouse</option>
              <option value="north">North Location</option>
              <option value="south">South Location</option>
            </select>
            
            <button 
              onClick={() => setShowSettings(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CogIcon className="w-4 h-4 mr-2 inline" />
              Settings
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard data...</p>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <MetricCard
                title="Total Inventory Value"
                value={formatCurrency(metrics.totalInventoryValue)}
                icon={ArchiveBoxIcon}
                color="blue"
                trend={5.2}
              />
              <MetricCard
                title="Low Stock Items"
                value={metrics.lowStockItems}
                icon={ExclamationTriangleIcon}
                color={metrics.lowStockItems > 20 ? 'danger' : metrics.lowStockItems > 10 ? 'warning' : 'success'}
                onClick={() => showNotification('info', 'Filtering products with low stock levels...')}
              />
              <MetricCard
                title="Pending Stocktakes"
                value={metrics.pendingStocktakes}
                icon={ClipboardDocumentCheckIcon}
                color="blue"
                onClick={() => {
                  console.log('Pending Stocktakes clicked - setting state to true');
                  setShowPendingStocktakes(true);
                  console.log('State should now be true');
                }}
              />
              <MetricCard
                title="Today's Movements"
                value={metrics.todayMovements}
                icon={ArrowsRightLeftIcon}
                color="success"
                onClick={() => showNotification('info', 'Loading stock movement history...')}
              />
              <MetricCard
                title="Pending Transfers"
                value={metrics.pendingTransfers}
                icon={BuildingOffice2Icon}
                color="warning"
                onClick={() => {
                  console.log('Pending Transfers clicked');
                  setShowPendingTransfers(true);
                }}
              />
              <MetricCard
                title="Pending POs"
                value={metrics.pendingPurchaseOrders}
                icon={DocumentTextIcon}
                color="orange"
                onClick={() => {
                  console.log('Pending POs clicked');
                  setShowPendingPOs(true);
                }}
              />
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <QuickActionCard
                  title="Adjust Stock Levels"
                  description="Manual stock adjustments and corrections"
                  icon={ArchiveBoxIcon}
                  onClick={() => {
                    console.log('🔧 Opening Stock Adjustment Modal');
                    setShowStockAdjustment(true);
                  }}
                />
                <QuickActionCard
                  title="Create Stocktake"
                  description="Schedule and manage stock counting"
                  icon={ClipboardDocumentCheckIcon}
                  onClick={() => {
                    console.log('📋 Navigating to Stock Check page');
                    window.location.href = '/inventory/stock-check';
                  }}
                  color="green"
                />
                <QuickActionCard
                  title="Request Stock Transfer"
                  description="Move stock between warehouses"
                  icon={ArrowsRightLeftIcon}
                  onClick={() => {
                    console.log('🔄 Opening Stock Transfer Modal');
                    setShowTransferRequest(true);
                  }}
                  color="orange"
                />
              </div>
            </div>

            {/* Recent Activity & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Stock Movements */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Stock Movements</h3>
                  <button 
                    onClick={() => showNotification('info', 'Loading complete stock movement history...')}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {[
                    { type: 'IN', product: 'Glass Panel 1200x800', quantity: 50, time: '2 hours ago', reference: 'PO-2024-001' },
                    { type: 'OUT', product: 'Aluminum Frame Kit', quantity: -25, time: '4 hours ago', reference: 'ORD-2024-156' },
                    { type: 'TRANSFER', product: 'Pool Gate Hardware', quantity: 10, time: '6 hours ago', reference: 'TR-2024-003' }
                  ].map((movement, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer"
                         onClick={() => showNotification('info', `Movement Details:\n${movement.product}\nReference: ${movement.reference}\nQuantity: ${movement.quantity}\nTime: ${movement.time}`)}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${movement.type === 'IN' ? 'bg-green-500' : movement.type === 'OUT' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                        <div>
                          <p className="font-medium text-gray-900">{movement.product}</p>
                          <p className="text-sm text-gray-500">{movement.time} • {movement.reference}</p>
                        </div>
                      </div>
                      <span className={`font-semibold ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Low Stock Alerts */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alerts</h3>
                <div className="space-y-3">
                  {[
                    { product: 'Glass Sealant Tube', current: 5, reorder: 20, urgency: 'high' },
                    { product: 'Stainless Steel Bolts', current: 12, reorder: 50, urgency: 'medium' },
                    { product: 'Pool Fence Post', current: 8, reorder: 15, urgency: 'low' }
                  ].map((alert, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <ExclamationTriangleIcon className={`w-5 h-5 ${alert.urgency === 'high' ? 'text-red-500' : alert.urgency === 'medium' ? 'text-orange-500' : 'text-yellow-500'}`} />
                        <div>
                          <p className="font-medium text-gray-900">{alert.product}</p>
                          <p className="text-sm text-gray-500">Current: {alert.current} | Reorder: {alert.reorder}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const alertWithEstimate = {
                            ...alert,
                            productId: `product-${alert.product.replace(/\s+/g, '').toLowerCase()}`,
                            estimatedCost: alert.urgency === 'high' ? 35.00 : 25.00
                          };
                          createPurchaseOrderFromAlert(alertWithEstimate);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Create PO
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-8">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'overview', name: 'Overview', icon: ArchiveBoxIcon, description: 'Dashboard overview and metrics' },
                    { id: 'inventory', name: 'Inventory Grid', icon: ClipboardDocumentCheckIcon, description: 'Manage thousands of products' },
                    { id: 'auto-po', name: 'Auto Purchase Orders', icon: BoltIcon, description: 'AI-powered PO generation' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className={`w-5 h-5 mr-2 ${
                        activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`} />
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className="mt-8">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Quick Actions */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button 
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                        onClick={() => setActiveTab('inventory')}
                      >
                        <div className="flex items-center">
                          <ArchiveBoxIcon className="w-5 h-5 text-blue-600 mr-3" />
                          <span className="font-medium">View All Inventory</span>
                        </div>
                      </button>
                      <button 
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowStockAdjustment(true)}
                      >
                        <div className="flex items-center">
                          <ClipboardDocumentCheckIcon className="w-5 h-5 text-green-600 mr-3" />
                          <span className="font-medium">Adjust Stock Levels</span>
                        </div>
                      </button>
                      <button 
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowNewStocktake(true)}
                      >
                        <div className="flex items-center">
                          <DocumentTextIcon className="w-5 h-5 text-orange-600 mr-3" />
                          <span className="font-medium">Start Stocktake</span>
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  {/* Transfer Requests */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Transfer Requests</h3>
                    {transferRequests.length > 0 ? (
                      <div className="space-y-3">
                        {transferRequests.slice(0, 5).map(request => (
                          <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{request.productName}</div>
                                <div className="text-sm text-gray-600">
                                  {request.quantity} units • {request.fromWarehouse} → {request.toWarehouse}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(request.requestedAt).toLocaleDateString()} • {request.requestedBy}
                                </div>
                                {request.reason && (
                                  <div className="text-sm text-gray-600 mt-1">{request.reason}</div>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  request.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                  request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {request.status === 'approved' ? 'Approved' :
                                   request.status === 'rejected' ? 'Rejected' :
                                   request.priority}
                                </div>
                                
                                {request.status === 'pending' && (
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={async () => {
                                        try {
                                          // Update stock levels for approved transfer
                                          const updatedProducts = products.map(product => {
                                            if (product.id === request.productId) {
                                              const currentStock = product.inventory?.currentStock || product.currentStock || 0;
                                              const newStock = Math.max(0, currentStock - request.quantity);
                                              return {
                                                ...product,
                                                inventory: {
                                                  ...product.inventory,
                                                  currentStock: newStock,
                                                  lastMovement: new Date().toISOString()
                                                }
                                              };
                                            }
                                            return product;
                                          });
                                          
                                          // Save updated products
                                          await dataService.products.save(updatedProducts);
                                          setProducts(updatedProducts);
                                          
                                          // Update transfer request status via API
                                          await dataService.transfers.updateStatus(request.id, 'approved', 'current-user');
                                          
                                          // Refresh transfer requests list
                                          await loadTransfers();
                                          
                                          showNotification('success', `Transfer approved! ${request.quantity} units of ${request.productName} transferred from ${request.fromWarehouse} to ${request.toWarehouse}.`);
                                          loadDashboardData();
                                          
                                        } catch (error) {
                                          showNotification('error', 'Failed to process transfer approval');
                                        }
                                      }}
                                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={async () => {
                                        try {
                                          // Update transfer request status via API
                                          await dataService.transfers.updateStatus(request.id, 'rejected', 'current-user');
                                          
                                          // Refresh transfer requests list
                                          await loadTransfers();
                                          
                                          showNotification('info', `Transfer request rejected for ${request.productName}.`);
                                        } catch (error) {
                                          showNotification('error', 'Failed to reject transfer request');
                                        }
                                      }}
                                      className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {transferRequests.length > 5 && (
                          <div className="text-center">
                            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                              View all {transferRequests.length} requests →
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No transfer requests yet. Create one using the "Request Stock Transfer" button.
                      </p>
                    )}
                  </div>
                  
                  {/* Alerts Placeholder */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Alerts</h3>
                    <p className="text-gray-500 text-sm">
                      Low stock alerts and reorder notifications will appear here.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'inventory' && (
                <AdvancedInventoryGrid />
              )}

              {activeTab === 'auto-po' && (
                <AutoPODashboard />
              )}
            </div>

            {/* Enterprise Features Section */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Enterprise Features</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Advanced Analytics */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Analytics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">ABC Analysis Classification</span>
                      <button 
                        onClick={() => showNotification('info', 'Loading ABC Analysis report - classifying products by value and turnover...')}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Report
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Stock Turnover Analysis</span>
                      <button 
                        onClick={() => showNotification('info', 'Generating stock turnover analysis for the last 12 months...')}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Report
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Supplier Performance Dashboard</span>
                      <button 
                        onClick={() => showNotification('info', 'Loading supplier performance metrics and delivery ratings...')}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Report
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Demand Forecasting (AI)</span>
                      <button 
                        onClick={() => showNotification('info', 'Opening AI demand forecasting configuration panel...')}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Configure
                      </button>
                    </div>
                  </div>
                </div>

                {/* Automation Hub */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Automation Hub</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-gray-900 font-medium">Auto Purchase Orders</span>
                        <p className="text-sm text-gray-500">Generate POs when stock hits reorder point</p>
                      </div>
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={automationSettings.autoPurchaseOrders}
                          onChange={(e) => {
                            setAutomationSettings(prev => ({ ...prev, autoPurchaseOrders: e.target.checked }));
                            showNotification('success', `Auto Purchase Orders ${e.target.checked ? 'enabled' : 'disabled'}`);
                          }}
                          className="rounded" 
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-gray-900 font-medium">Smart Reorder Suggestions</span>
                        <p className="text-sm text-gray-500">AI-powered optimal reorder quantities</p>
                      </div>
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={automationSettings.smartReorderSuggestions}
                          onChange={(e) => {
                            setAutomationSettings(prev => ({ ...prev, smartReorderSuggestions: e.target.checked }));
                            showNotification('success', `Smart Reorder Suggestions ${e.target.checked ? 'enabled' : 'disabled'}`);
                          }}
                          className="rounded" 
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-gray-900 font-medium">Automated Stocktake Scheduling</span>
                        <p className="text-sm text-gray-500">Schedule recurring stocktakes by category</p>
                      </div>
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={automationSettings.automatedStocktakeScheduling}
                          onChange={(e) => {
                            setAutomationSettings(prev => ({ ...prev, automatedStocktakeScheduling: e.target.checked }));
                            showNotification('success', `Automated Stocktake Scheduling ${e.target.checked ? 'enabled' : 'disabled'}`);
                          }}
                          className="rounded" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </>
        )}
        
        {/* Notification Toast */}
        {notification && (
          <div className="fixed top-4 right-4 z-50">
            <div className={`rounded-lg p-4 shadow-lg border bg-white ${
              notification.type === 'success' ? 'border-green-200 text-green-800' :
              notification.type === 'error' ? 'border-red-200 text-red-800' :
              'border-blue-200 text-blue-800'
            }`}>
              {notification.message}
            </div>
          </div>
        )}

        {/* Stock Adjustment Modal - Clean & Simple */}
        {showStockAdjustment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-white bg-opacity-80" 
              onClick={() => setShowStockAdjustment(false)}
            ></div>
            
            {/* Modal */}
            <div className="relative bg-white w-full max-w-lg mx-auto border-2 border-gray-900 shadow-xl">
              {/* Header */}
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Adjust Stock Levels</h2>
                  <button 
                    onClick={() => setShowStockAdjustment(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Cascading Category Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomDropdown
                    label="Category"
                    value={stockAdjustmentForm.categoryFilter}
                    placeholder="All Categories"
                    options={categories.map(cat => ({
                      value: cat.id,
                      label: cat.name,
                      color: cat.color
                    }))}
                    onChange={(value) => {
                      setStockAdjustmentForm(prev => ({ 
                        ...prev, 
                        categoryFilter: value, 
                        subcategoryFilter: '',
                        product: '',
                        productName: '',
                        currentStock: 0
                      }));
                    }}
                  />
                  
                  {stockAdjustmentForm.categoryFilter && (
                    <CustomDropdown
                      label="Subcategory"
                      value={stockAdjustmentForm.subcategoryFilter}
                      placeholder="All Subcategories"
                      options={categories
                        .find(c => c.id === stockAdjustmentForm.categoryFilter)
                        ?.subcategories?.map((sub: any) => ({
                          value: sub.id,
                          label: sub.name,
                          color: sub.color
                        })) || []}
                      onChange={(value) => {
                        setStockAdjustmentForm(prev => ({ 
                          ...prev, 
                          subcategoryFilter: value,
                          product: '',
                          productName: '',
                          currentStock: 0
                        }));
                      }}
                    />
                  )}
                </div>
                
                {/* Product Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Products</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type product name, code, or description..."
                      value={stockAdjustmentForm.productSearch || ''}
                      onChange={(e) => setStockAdjustmentForm(prev => ({ ...prev, productSearch: e.target.value }))}
                      className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                </div>
                
                {/* Product Selection */}
                <CustomDropdown
                  label="Product"
                  value={stockAdjustmentForm.product}
                  placeholder="Select product to adjust..."
                  options={products
                    .filter(product => {
                      const searchTerm = stockAdjustmentForm.productSearch?.toLowerCase() || '';
                      const matchesSearch = !searchTerm || 
                        product.name?.toLowerCase().includes(searchTerm) ||
                        product.code?.toLowerCase().includes(searchTerm) ||
                        product.description?.toLowerCase().includes(searchTerm);
                      
                      const matchesCategory = !stockAdjustmentForm.categoryFilter || 
                        product.categoryId === stockAdjustmentForm.categoryFilter;
                        
                      const matchesSubcategory = !stockAdjustmentForm.subcategoryFilter || 
                        product.subcategoryId === stockAdjustmentForm.subcategoryFilter;
                      
                      return matchesSearch && matchesCategory && matchesSubcategory && product.isActive;
                    })
                    .slice(0, 100)
                    .map(product => ({
                      value: product.id,
                      label: `${product.name} (Stock: ${product.inventory?.currentStock || product.currentStock || 0})`,
                      color: product.color
                    }))}
                  onChange={(value) => {
                    const selectedProduct = products.find(p => p.id === value);
                    setStockAdjustmentForm(prev => ({ 
                      ...prev, 
                      product: value,
                      productName: selectedProduct?.name || '',
                      currentStock: selectedProduct?.inventory?.currentStock || selectedProduct?.currentStock || 0
                    }));
                  }}
                />
                
                {stockAdjustmentForm.product && (
                  <>
                    {/* Current Stock Display */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Stock</label>
                      <input 
                        type="number" 
                        value={stockAdjustmentForm.currentStock} 
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50" 
                      />
                    </div>
                    
                    {/* Adjustment Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment (+/-)</label>
                      <input 
                        type="number" 
                        value={stockAdjustmentForm.adjustment}
                        onChange={(e) => setStockAdjustmentForm(prev => ({ ...prev, adjustment: Number(e.target.value) }))}
                        placeholder="Enter +/- amount" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      />
                      {stockAdjustmentForm.adjustment !== 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          New stock: {Math.max(0, stockAdjustmentForm.currentStock + stockAdjustmentForm.adjustment)}
                        </p>
                      )}
                    </div>
                    
                    {/* Reason */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                      <select 
                        value={stockAdjustmentForm.reason}
                        onChange={(e) => setStockAdjustmentForm(prev => ({ ...prev, reason: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select reason...</option>
                        <option value="damaged">Damaged goods</option>
                        <option value="found">Found stock</option>
                        <option value="stocktake">Stocktake correction</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                      <textarea 
                        value={stockAdjustmentForm.notes}
                        onChange={(e) => setStockAdjustmentForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Add any notes..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>
              
              {/* Footer */}
              <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
                <button 
                  onClick={() => setShowStockAdjustment(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                >
                  Cancel
                </button>
                {stockAdjustmentForm.product && (
                  <button 
                    onClick={async () => {
                      // Validation
                      if (!stockAdjustmentForm.product) {
                        showNotification('error', 'Please select a product');
                        return;
                      }
                      if (stockAdjustmentForm.adjustment === 0) {
                        showNotification('error', 'Please enter an adjustment amount');
                        return;
                      }
                      if (!stockAdjustmentForm.reason) {
                        showNotification('error', 'Please select a reason');
                        return;
                      }
                      
                      try {
                        // Update stock
                        const selectedProduct = products.find(p => p.id === stockAdjustmentForm.product);
                        const updatedProducts = products.map(product => {
                          if (product.id === stockAdjustmentForm.product) {
                            const newStock = Math.max(0, (product.inventory?.currentStock || product.currentStock || 0) + stockAdjustmentForm.adjustment);
                            return {
                              ...product,
                              inventory: {
                                ...product.inventory,
                                currentStock: newStock,
                                lastMovement: new Date().toISOString()
                              }
                            };
                          }
                          return product;
                        });
                        
                        await dataService.products.save(updatedProducts);
                        setProducts(updatedProducts);
                        
                        showNotification('success', `Stock adjusted successfully!`);
                        
                        // Reset and close
                        setStockAdjustmentForm({
                          product: '',
                          productName: '',
                          currentStock: 0,
                          adjustment: 0,
                          reason: '',
                          productSearch: '',
                          categoryFilter: '',
                          subcategoryFilter: '',
                          notes: ''
                        });
                        setShowStockAdjustment(false);
                        loadDashboardData();
                        
                      } catch (error) {
                        showNotification('error', 'Failed to save adjustment');
                      }
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                  >
                    Save Adjustment
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* New Stocktake Modal */}
        {showNewStocktake && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setShowNewStocktake(false)}></div>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Create New Stocktake</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Stocktake Name</label>
                      <input 
                        type="text" 
                        value={stocktakeForm.name}
                        onChange={(e) => setStocktakeForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Q4 2024 Full Count" 
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Warehouse</label>
                      <select 
                        value={stocktakeForm.warehouse}
                        onChange={(e) => setStocktakeForm(prev => ({ ...prev, warehouse: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="main">Main Warehouse</option>
                        <option value="north">North Location</option>
                        <option value="south">South Location</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <select 
                        value={stocktakeForm.type}
                        onChange={(e) => setStocktakeForm(prev => ({ ...prev, type: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="full">Full Stocktake</option>
                        <option value="partial">Partial Stocktake</option>
                        <option value="cycle">Cycle Count</option>
                        <option value="spot">Spot Check</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Scheduled Date</label>
                      <input 
                        type="date" 
                        value={stocktakeForm.date}
                        onChange={(e) => setStocktakeForm(prev => ({ ...prev, date: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" 
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={stocktakeForm.hideQuantities}
                          onChange={(e) => setStocktakeForm(prev => ({ ...prev, hideQuantities: e.target.checked }))}
                          className="rounded" 
                        />
                        <span className="ml-2 text-sm text-gray-700">Hide quantities from counters</span>
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={stocktakeForm.allowMobile}
                          onChange={(e) => setStocktakeForm(prev => ({ ...prev, allowMobile: e.target.checked }))}
                          className="rounded" 
                        />
                        <span className="ml-2 text-sm text-gray-700">Allow mobile counting</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button 
                    onClick={() => {
                      if (!stocktakeForm.name) {
                        showNotification('error', 'Please enter a stocktake name');
                        return;
                      }
                      if (!stocktakeForm.date) {
                        showNotification('error', 'Please select a scheduled date');
                        return;
                      }
                      
                      const stocktakeId = `ST-${Date.now()}`;
                      showNotification('success', `Stocktake created successfully!\n\nID: ${stocktakeId}\nName: ${stocktakeForm.name}\nWarehouse: ${stocktakeForm.warehouse}\nType: ${stocktakeForm.type}\nDate: ${stocktakeForm.date}\nOptions: ${stocktakeForm.hideQuantities ? 'Hide quantities' : 'Show quantities'}, ${stocktakeForm.allowMobile ? 'Mobile enabled' : 'Mobile disabled'}`);
                      
                      // Reset form
                      setStocktakeForm({
                        name: '',
                        warehouse: 'main',
                        type: 'full',
                        date: '',
                        hideQuantities: true,
                        allowMobile: true
                      });
                      setShowNewStocktake(false);
                    }}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Create Stocktake
                  </button>
                  <button 
                    onClick={() => setShowNewStocktake(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stock Transfer Modal */}
        {showTransferRequest && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
              <div className="fixed inset-0 bg-white bg-opacity-80 transition-opacity" onClick={() => setShowTransferRequest(false)}></div>
              
              <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all max-w-xl w-full mx-4">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Request Stock Transfer</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">From Warehouse</label>
                        <select 
                          value={transferForm.fromWarehouse}
                          onChange={(e) => setTransferForm(prev => ({ ...prev, fromWarehouse: e.target.value }))}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="main">Main Warehouse</option>
                          <option value="north">North Location</option>
                          <option value="south">South Location</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">To Warehouse</label>
                        <select 
                          value={transferForm.toWarehouse}
                          onChange={(e) => setTransferForm(prev => ({ ...prev, toWarehouse: e.target.value }))}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select destination...</option>
                          <option value="main">Main Warehouse</option>
                          <option value="north">North Location</option>
                          <option value="south">South Location</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Cascading Category Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CustomDropdown
                        label="Category"
                        value={transferForm.categoryFilter}
                        placeholder="All Categories"
                        options={categories.map(cat => ({
                          value: cat.id,
                          label: cat.name,
                          color: cat.color
                        }))}
                        onChange={(value) => {
                          setTransferForm(prev => ({ 
                            ...prev, 
                            categoryFilter: value, 
                            subcategoryFilter: '',
                            product: '',
                            productName: ''
                          }));
                        }}
                      />
                      
                      {transferForm.categoryFilter && (
                        <CustomDropdown
                          label="Subcategory"
                          value={transferForm.subcategoryFilter}
                          placeholder="All Subcategories"
                          options={categories
                            .find(c => c.id === transferForm.categoryFilter)
                            ?.subcategories?.map((sub: any) => ({
                              value: sub.id,
                              label: sub.name,
                              color: sub.color
                            })) || []}
                          onChange={(value) => {
                            setTransferForm(prev => ({ 
                              ...prev, 
                              subcategoryFilter: value,
                              product: '',
                              productName: ''
                            }));
                          }}
                        />
                      )}
                    </div>
                    
                    {/* Product Search */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Search Products</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Type product name, code, or description..."
                          value={transferForm.productSearch || ''}
                          onChange={(e) => setTransferForm(prev => ({ ...prev, productSearch: e.target.value }))}
                          className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                      </div>
                    </div>
                    
                    {/* Product Selection */}
                    <CustomDropdown
                      label="Product"
                      value={transferForm.product}
                      placeholder="Select product to transfer..."
                      options={products
                        .filter(product => {
                          const searchTerm = transferForm.productSearch?.toLowerCase() || '';
                          const matchesSearch = !searchTerm || 
                            product.name?.toLowerCase().includes(searchTerm) ||
                            product.code?.toLowerCase().includes(searchTerm) ||
                            product.description?.toLowerCase().includes(searchTerm);
                          
                          const matchesCategory = !transferForm.categoryFilter || 
                            product.categoryId === transferForm.categoryFilter;
                            
                          const matchesSubcategory = !transferForm.subcategoryFilter || 
                            product.subcategoryId === transferForm.subcategoryFilter;
                          
                          return matchesSearch && matchesCategory && matchesSubcategory && product.isActive;
                        })
                        .slice(0, 100)
                        .map(product => ({
                          value: product.id,
                          label: `${product.name} (Stock: ${product.inventory?.currentStock || product.currentStock || 0})`,
                          color: product.color
                        }))}
                      onChange={(value) => {
                        const selectedProduct = products.find(p => p.id === value);
                        setTransferForm(prev => ({ 
                          ...prev, 
                          product: value,
                          productName: selectedProduct?.name || ''
                        }));
                      }}
                    />
                    
                    {/* Selected Product Preview */}
                    {transferForm.product && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="font-medium text-blue-900">{transferForm.productName}</div>
                        <div className="text-sm text-blue-700">Available Stock: {products.find(p => p.id === transferForm.product)?.inventory?.currentStock || 0}</div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantity to Transfer</label>
                      <input 
                        type="number" 
                        placeholder="Enter quantity" 
                        value={transferForm.quantity}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priority</label>
                      <select 
                        value={transferForm.priority}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, priority: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reason</label>
                      <textarea 
                        value={transferForm.reason}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, reason: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        rows={2} 
                        placeholder="Reason for transfer..."
                      ></textarea>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button 
                    onClick={async () => {
                      // Validation
                      if (!transferForm.fromWarehouse || !transferForm.toWarehouse) {
                        showNotification('error', 'Please select both warehouses');
                        return;
                      }
                      if (transferForm.fromWarehouse === transferForm.toWarehouse) {
                        showNotification('error', 'From and To warehouses must be different');
                        return;
                      }
                      if (!transferForm.product) {
                        showNotification('error', 'Please select a product to transfer');
                        return;
                      }
                      if (!transferForm.quantity || transferForm.quantity <= 0) {
                        showNotification('error', 'Please enter a valid quantity');
                        return;
                      }
                      if (!transferForm.reason.trim()) {
                        showNotification('error', 'Please provide a reason for the transfer');
                        return;
                      }
                      
                      // Check if enough stock is available
                      const selectedProduct = products.find(p => p.id === transferForm.product);
                      const availableStock = selectedProduct?.inventory?.currentStock || selectedProduct?.currentStock || 0;
                      if (transferForm.quantity > availableStock) {
                        showNotification('error', `Not enough stock available. Only ${availableStock} units in stock.`);
                        return;
                      }
                      
                      try {
                        // Create transfer request object
                        const transferRequest = {
                          id: `TR-${Date.now()}`,
                          fromWarehouse: transferForm.fromWarehouse,
                          toWarehouse: transferForm.toWarehouse,
                          productId: transferForm.product,
                          productName: transferForm.productName,
                          quantity: transferForm.quantity,
                          priority: transferForm.priority,
                          reason: transferForm.reason,
                          status: 'pending',
                          requestedBy: 'current-user', // You could get this from auth context
                          requestedAt: new Date().toISOString()
                        };
                        
                        // Save transfer request to database via API
                        const savedTransfer = await dataService.transfers.create(transferRequest);
                        
                        // Refresh transfer requests list
                        await loadTransfers();
                        
                        showNotification('success', `Transfer request created!\n\nID: ${savedTransfer.id}\nProduct: ${transferForm.productName}\nQuantity: ${transferForm.quantity}\nFrom: ${transferForm.fromWarehouse} → ${transferForm.toWarehouse}\nPriority: ${transferForm.priority}`);
                        
                        // Reset form and close
                        setTransferForm({
                          fromWarehouse: 'main',
                          toWarehouse: 'north',
                          product: '',
                          productName: '',
                          quantity: 0,
                          priority: 'normal',
                          reason: '',
                          categoryFilter: '',
                          subcategoryFilter: '',
                          productSearch: ''
                        });
                        setShowTransferRequest(false);
                        
                      } catch (error) {
                        console.error('❌ Error creating transfer request:', error);
                        showNotification('error', 'Failed to create transfer request');
                      }
                    }}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Submit Request
                  </button>
                  <button 
                    onClick={() => setShowTransferRequest(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Order Modal */}
        {showPurchaseOrderModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-white bg-opacity-90 transition-opacity" onClick={() => setShowPurchaseOrderModal(false)}></div>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Generate Purchase Order</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Supplier</label>
                      <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                        <option>AusGlass Supplies</option>
                        <option>Hardware Direct</option>
                        <option>Pool Pro Equipment</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Products to Order</label>
                      <div className="mt-1 space-y-2">
                        {selectedProduct ? (
                          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                            <span className="text-sm font-medium">{selectedProduct.product}</span>
                            <input type="number" placeholder="Qty" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                              <span className="text-sm font-medium">Glass Sealant Tube</span>
                              <input type="number" defaultValue="50" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                            </div>
                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                              <span className="text-sm font-medium">Stainless Steel Bolts</span>
                              <input type="number" defaultValue="100" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Expected Delivery</label>
                      <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priority</label>
                      <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                        <option>Normal</option>
                        <option>High</option>
                        <option>Urgent</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button 
                    onClick={() => {
                      showNotification('success', 'Purchase order created and sent for approval');
                      setShowPurchaseOrderModal(false);
                      setSelectedProduct(null);
                    }}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Create PO
                  </button>
                  <button 
                    onClick={() => {
                      setShowPurchaseOrderModal(false);
                      setSelectedProduct(null);
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-white bg-opacity-90 transition-opacity" onClick={() => setShowSettings(false)}></div>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">StockFlow Settings</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Stock Deduction Settings</h4>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input type="radio" name="deduction" value="invoice" className="rounded" defaultChecked />
                          <span className="ml-2 text-sm text-gray-700">Deduct stock when invoice is sent</span>
                        </label>
                        <label className="flex items-center">
                          <input type="radio" name="deduction" value="delivery" className="rounded" />
                          <span className="ml-2 text-sm text-gray-700">Deduct stock when delivery note is signed</span>
                        </label>
                        <label className="flex items-center">
                          <input type="radio" name="deduction" value="manual" className="rounded" />
                          <span className="ml-2 text-sm text-gray-700">Manual stock deduction only</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Automation Settings</h4>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded" defaultChecked />
                          <span className="ml-2 text-sm text-gray-700">Enable automatic purchase order generation</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded" />
                          <span className="ml-2 text-sm text-gray-700">Auto-approve orders under $500</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded" defaultChecked />
                          <span className="ml-2 text-gray-700">Send low stock notifications</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded" />
                          <span className="ml-2 text-sm text-gray-700">Enable barcode scanning</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Default Values</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Default Warehouse</label>
                          <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                            <option>Main Warehouse</option>
                            <option>North Location</option>
                            <option>South Location</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Reservation Expiry (hours)</label>
                          <input type="number" defaultValue="24" className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button 
                    onClick={() => {
                      showNotification('success', 'StockFlow settings saved successfully');
                      setShowSettings(false);
                    }}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Save Settings
                  </button>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Stocktakes Modal */}
        {showPendingStocktakes && (
          <>
          {console.log('Rendering Pending Stocktakes Modal')}
          
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-white bg-opacity-90" onClick={() => setShowPendingStocktakes(false)}></div>
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Pending Stocktakes ({metrics.pendingStocktakes})</h3>
                  
                  <div className="space-y-4">
                    {[
                      { id: 'ST-2024-001', name: 'Q4 Full Count - Main Warehouse', type: 'Full', date: '2024-12-15', assignee: 'John Smith', status: 'Planned' },
                      { id: 'ST-2024-002', name: 'Hardware Section Spot Check', type: 'Spot', date: '2024-12-10', assignee: 'Sarah Wilson', status: 'In Progress' }
                    ].map((stocktake) => (
                      <div key={stocktake.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{stocktake.name}</h4>
                            <p className="text-sm text-gray-500">ID: {stocktake.id} • Type: {stocktake.type}</p>
                            <p className="text-sm text-gray-500">Scheduled: {stocktake.date} • Assigned: {stocktake.assignee}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              stocktake.status === 'Planned' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {stocktake.status}
                            </span>
                            <button 
                              onClick={() => showNotification('info', `Opening stocktake details for ${stocktake.name}...\n\nID: ${stocktake.id}\nType: ${stocktake.type}\nAssigned to: ${stocktake.assignee}\nStatus: ${stocktake.status}`)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View
                            </button>
                            {stocktake.status === 'Planned' && (
                              <button 
                                onClick={() => showNotification('success', `Stocktake ${stocktake.id} started successfully`)}
                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                              >
                                Start
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button 
                    onClick={() => {
                      setShowPendingStocktakes(false);
                      setShowNewStocktake(true);
                    }}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Create New Stocktake
                  </button>
                  <button 
                    onClick={() => setShowPendingStocktakes(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Close
                  </button>
              </div>
            </div>
          </div>
          </>
        )}

        {/* Pending Transfers Modal */}
        {showPendingTransfers && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-white bg-opacity-90" onClick={() => setShowPendingTransfers(false)}></div>
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Pending Stock Transfers ({metrics.pendingTransfers})</h3>
                  
                  <div className="space-y-4">
                    {[
                      { id: 'TR-2024-001', from: 'Main Warehouse', to: 'North Location', product: 'Glass Panel 1200x800', qty: 25, status: 'Requested', date: '2024-12-08' },
                      { id: 'TR-2024-002', from: 'South Location', to: 'Main Warehouse', product: 'Pool Fence Hardware Kit', qty: 15, status: 'Approved', date: '2024-12-09' },
                      { id: 'TR-2024-003', from: 'Main Warehouse', to: 'South Location', product: 'Stainless Steel Bolts', qty: 100, status: 'In Transit', date: '2024-12-07' },
                      { id: 'TR-2024-004', from: 'North Location', to: 'Main Warehouse', product: 'Gate Hinges', qty: 8, status: 'Requested', date: '2024-12-10' }
                    ].map((transfer) => (
                      <div key={transfer.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{transfer.product}</h4>
                            <p className="text-sm text-gray-500">ID: {transfer.id} • Quantity: {transfer.qty}</p>
                            <p className="text-sm text-gray-500">{transfer.from} → {transfer.to}</p>
                            <p className="text-sm text-gray-500">Requested: {transfer.date}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transfer.status === 'Requested' ? 'bg-yellow-100 text-yellow-800' : 
                              transfer.status === 'Approved' ? 'bg-blue-100 text-blue-800' : 
                              'bg-green-100 text-green-800'
                            }`}>
                              {transfer.status}
                            </span>
                            <button 
                              onClick={() => showNotification('info', `Transfer Details:\n\nID: ${transfer.id}\nProduct: ${transfer.product}\nQuantity: ${transfer.qty}\nFrom: ${transfer.from}\nTo: ${transfer.to}\nStatus: ${transfer.status}\nRequested: ${transfer.date}`)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button 
                    onClick={() => {
                      setShowPendingTransfers(false);
                      setShowTransferRequest(true);
                    }}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    New Transfer Request
                  </button>
                  <button 
                    onClick={() => setShowPendingTransfers(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Close
                  </button>
              </div>
            </div>
          </div>
        )}

        {/* Pending Purchase Orders Modal */}
        {showPendingPOs && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-white bg-opacity-90" onClick={() => setShowPendingPOs(false)}></div>
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Pending Purchase Orders ({metrics.pendingPurchaseOrders})</h3>
                  
                  <div className="space-y-4">
                    {[
                      { id: 'PO-2024-001', supplier: 'AusGlass Supplies', items: 3, total: 2450.00, status: 'Draft', date: '2024-12-08' },
                      { id: 'PO-2024-002', supplier: 'Hardware Direct', items: 5, total: 890.50, status: 'Pending Approval', date: '2024-12-09' },
                      { id: 'PO-2024-003', supplier: 'Pool Pro Equipment', items: 2, total: 1200.00, status: 'Approved', date: '2024-12-07' },
                      { id: 'PO-2024-004', supplier: 'Industrial Solutions', items: 8, total: 3200.00, status: 'Pending Approval', date: '2024-12-10' },
                      { id: 'PO-2024-005', supplier: 'Trade Supplies Co', items: 4, total: 650.75, status: 'Draft', date: '2024-12-11' },
                      { id: 'PO-2024-006', supplier: 'AusGlass Supplies', items: 6, total: 1850.00, status: 'Sent', date: '2024-12-06' },
                      { id: 'PO-2024-007', supplier: 'Hardware Direct', items: 12, total: 4500.00, status: 'Pending Approval', date: '2024-12-12' }
                    ].map((po) => (
                      <div key={po.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{po.supplier}</h4>
                            <p className="text-sm text-gray-500">ID: {po.id} • {po.items} items • {formatCurrency(po.total)}</p>
                            <p className="text-sm text-gray-500">Created: {po.date}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              po.status === 'Draft' ? 'bg-gray-100 text-gray-800' : 
                              po.status === 'Pending Approval' ? 'bg-yellow-100 text-yellow-800' : 
                              po.status === 'Approved' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {po.status}
                            </span>
                            {po.status === 'Pending Approval' && (
                              <button 
                                onClick={() => showNotification('success', `Purchase Order ${po.id} approved successfully! Order value: ${formatCurrency(po.total)}`)}
                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                              >
                                Approve
                              </button>
                            )}
                            <button 
                              onClick={() => showNotification('info', `Purchase Order Details:\n\nID: ${po.id}\nSupplier: ${po.supplier}\nItems: ${po.items} products\nTotal: ${formatCurrency(po.total)}\nStatus: ${po.status}\nCreated: ${po.date}`)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button 
                    onClick={() => {
                      setShowPendingPOs(false);
                      setShowPurchaseOrderModal(true);
                    }}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Create New PO
                  </button>
                  <button 
                    onClick={() => setShowPendingPOs(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Close
                  </button>
              </div>
            </div>
          </div>
        )}

        {/* Auto-PO Settings Modal */}
        <AutoPOSettingsModal 
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSaved={() => {
            loadDashboardData();
            showNotification('success', 'Auto-PO settings updated successfully');
          }}
        />

        {/* Real Purchase Order Modal - Uses your existing template system */}
        {showRealPOModal && poOrderData && (
          <PurchaseOrderModal
            isOpen={showRealPOModal}
            onClose={() => {
              setShowRealPOModal(false);
              setPOOrderData(null);
              setSelectedProduct(null);
            }}
            orderData={poOrderData}
            onOrderCreated={(createdOrder) => {
              console.log('✅ Purchase Order created via StockFlow:', createdOrder);
              showNotification('success', `Purchase Order ${createdOrder.poNumber || 'created'} generated successfully using your custom templates!`);
              setShowRealPOModal(false);
              setPOOrderData(null);
              setSelectedProduct(null);
              loadDashboardData(); // Refresh metrics
            }}
          />
        )}
      </div>
    </div>
  );
}