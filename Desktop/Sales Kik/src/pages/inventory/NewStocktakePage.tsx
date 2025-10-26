import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardDocumentCheckIcon,
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  AdjustmentsHorizontalIcon,
  PlayIcon,
  ArrowLeftIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import UniversalNavigation from '@/components/layout/UniversalNavigation';
import UniversalHeader from '@/components/layout/UniversalHeader';

interface StocktakeSettings {
  name: string;
  description: string;
  warehouse: string;
  type: 'full' | 'partial' | 'cycle' | 'spot';
  scheduledDate: string;
  assignedTo: string[];
  categories: string[];
  hideQuantities: boolean;
  allowMobile: boolean;
  randomSampling: boolean;
  samplingPercentage: number;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface Category {
  id: string;
  name: string;
  productCount: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const NewStocktakePage: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [settings, setSettings] = useState<StocktakeSettings>({
    name: '',
    description: '',
    warehouse: '',
    type: 'full',
    scheduledDate: new Date().toISOString().split('T')[0],
    assignedTo: [],
    categories: [],
    hideQuantities: true,
    allowMobile: true,
    randomSampling: false,
    samplingPercentage: 10
  });

  // Data
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Mock data for now
    setWarehouses([
      { id: '1', name: 'Main Warehouse', code: 'MAIN' },
      { id: '2', name: 'North Location', code: 'NORTH' },
      { id: '3', name: 'South Location', code: 'SOUTH' }
    ]);

    // Load categories from database like other pages
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      const result = await response.json();
      if (result.success && result.data.length > 0) {
        const transformedCategories = result.data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          productCount: cat.subcategories ? cat.subcategories.length : 0
        }));
        setCategories(transformedCategories);
        console.log('✅ NewStocktake: Loaded categories from database:', transformedCategories.length);
      } else {
        // Fallback to mock categories
        setCategories([
          { id: '1', name: 'Glass Panels', productCount: 245 },
          { id: '2', name: 'Hardware', productCount: 1250 },
          { id: '3', name: 'Fence Posts', productCount: 89 },
          { id: '4', name: 'Frames', productCount: 156 }
        ]);
      }
    } catch (error) {
      console.error('Failed to load categories for stocktake:', error);
      // Fallback to mock categories
      setCategories([
        { id: '1', name: 'Glass Panels', productCount: 245 },
        { id: '2', name: 'Hardware', productCount: 1250 },
        { id: '3', name: 'Fence Posts', productCount: 89 },
        { id: '4', name: 'Frames', productCount: 156 }
      ]);
    }

    setUsers([
      { id: '1', name: 'John Smith', email: 'john@eccohardware.com.au', role: 'Manager' },
      { id: '2', name: 'Sarah Wilson', email: 'sarah@eccohardware.com.au', role: 'Staff' },
      { id: '3', name: 'Mike Johnson', email: 'mike@eccohardware.com.au', role: 'Staff' }
    ]);
  };

  const handleSubmit = async () => {
    if (!settings.name || !settings.warehouse) {
      alert('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      // Generate stocktake ID
      const stocktakeId = `ST-${Date.now()}`;
      
      // Mock API call
      console.log('Creating stocktake:', {
        id: stocktakeId,
        ...settings
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Navigate to the stocktake session
      navigate(`/inventory/stocktakes/${stocktakeId}`);
    } catch (error) {
      console.error('Error creating stocktake:', error);
      alert('Failed to create stocktake');
    } finally {
      setLoading(false);
    }
  };

  const getEstimatedProducts = () => {
    if (settings.type === 'full') {
      return categories.reduce((sum, cat) => sum + cat.productCount, 0);
    } else if (settings.categories.length > 0) {
      return categories
        .filter(cat => settings.categories.includes(cat.id))
        .reduce((sum, cat) => sum + cat.productCount, 0);
    }
    return 0;
  };

  const getEstimatedTime = () => {
    const productCount = getEstimatedProducts();
    if (settings.randomSampling) {
      const sampleSize = Math.ceil(productCount * (settings.samplingPercentage / 100));
      return Math.ceil(sampleSize / 60); // 1 minute per product
    }
    return Math.ceil(productCount / 30); // 2 minutes per product for full count
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
        title="New Stocktake"
        subtitle="Create and configure a new stock counting session"
        onMenuToggle={() => setSidebarOpen(true)}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/inventory/stock-check')}
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Stock Check
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Stocktake</h1>
              <p className="text-gray-600 mt-1">Set up a comprehensive stock counting session</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
            disabled={!settings.name || !settings.warehouse}
          >
            <InformationCircleIcon className="w-4 h-4 mr-2" />
            Preview Settings
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ClipboardDocumentCheckIcon className="w-5 h-5 mr-2" />
                Basic Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stocktake Name *
                  </label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Q4 2024 Full Count - Main Warehouse"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={settings.description}
                    onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description of this stocktake session..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Warehouse *
                    </label>
                    <select
                      value={settings.warehouse}
                      onChange={(e) => setSettings(prev => ({ ...prev, warehouse: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select warehouse...</option>
                      {warehouses.map(warehouse => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scheduled Date *
                    </label>
                    <input
                      type="date"
                      value={settings.scheduledDate}
                      onChange={(e) => setSettings(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stocktake Type */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" />
                Stocktake Type & Scope
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Type of Count
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'full', label: 'Full Stocktake', desc: 'Count all products in warehouse' },
                      { value: 'partial', label: 'Partial Count', desc: 'Count selected categories only' },
                      { value: 'cycle', label: 'Cycle Count', desc: 'Rotating count of different sections' },
                      { value: 'spot', label: 'Spot Check', desc: 'Quick verification of specific items' }
                    ].map(type => (
                      <label
                        key={type.value}
                        className={`flex flex-col p-4 border rounded-lg cursor-pointer transition-colors ${
                          settings.type === type.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="type"
                          value={type.value}
                          checked={settings.type === type.value}
                          onChange={(e) => setSettings(prev => ({ ...prev, type: e.target.value as any }))}
                          className="sr-only"
                        />
                        <span className="font-medium text-gray-900">{type.label}</span>
                        <span className="text-sm text-gray-500 mt-1">{type.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Category Selection for Partial Counts */}
                {(settings.type === 'partial' || settings.type === 'cycle') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Categories to Count
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {categories.map(category => (
                        <label key={category.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.categories.includes(category.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSettings(prev => ({
                                  ...prev,
                                  categories: [...prev.categories, category.id]
                                }));
                              } else {
                                setSettings(prev => ({
                                  ...prev,
                                  categories: prev.categories.filter(id => id !== category.id)
                                }));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="ml-2 text-sm">
                            {category.name} ({category.productCount} items)
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Random Sampling */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={settings.randomSampling}
                      onChange={(e) => setSettings(prev => ({ ...prev, randomSampling: e.target.checked }))}
                      className="rounded mt-1"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900">Enable Random Sampling</span>
                      <p className="text-xs text-gray-600 mt-1">
                        Count a random percentage of products for statistical accuracy (faster for large inventories)
                      </p>
                      {settings.randomSampling && (
                        <div className="mt-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Sampling Percentage: {settings.samplingPercentage}%
                          </label>
                          <input
                            type="range"
                            min="5"
                            max="50"
                            value={settings.samplingPercentage}
                            onChange={(e) => setSettings(prev => ({ ...prev, samplingPercentage: parseInt(e.target.value) }))}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>5%</span>
                            <span>25%</span>
                            <span>50%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Team Assignment */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserGroupIcon className="w-5 h-5 mr-2" />
                Team Assignment
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Assign Team Members
                  </label>
                  <div className="space-y-2">
                    {users.map(user => (
                      <label key={user.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={settings.assignedTo.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSettings(prev => ({
                                ...prev,
                                assignedTo: [...prev.assignedTo, user.id]
                              }));
                            } else {
                              setSettings(prev => ({
                                ...prev,
                                assignedTo: prev.assignedTo.filter(id => id !== user.id)
                              }));
                            }
                          }}
                          className="rounded"
                        />
                        <div className="ml-3">
                          <span className="text-sm font-medium text-gray-900">{user.name}</span>
                          <p className="text-xs text-gray-500">{user.email} • {user.role}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Advanced Settings
              </h2>
              
              <div className="space-y-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={settings.hideQuantities}
                    onChange={(e) => setSettings(prev => ({ ...prev, hideQuantities: e.target.checked }))}
                    className="rounded mt-1"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">Hide System Quantities</span>
                    <p className="text-xs text-gray-600 mt-1">
                      Don't show current stock levels to counters (prevents bias)
                    </p>
                  </div>
                </label>

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={settings.allowMobile}
                    onChange={(e) => setSettings(prev => ({ ...prev, allowMobile: e.target.checked }))}
                    className="rounded mt-1"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">Enable Mobile Counting</span>
                    <p className="text-xs text-gray-600 mt-1">
                      Allow team members to count using mobile devices and tablets
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Type:</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {settings.type} Count
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Warehouse:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {warehouses.find(w => w.id === settings.warehouse)?.name || 'Not selected'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estimated Products:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {getEstimatedProducts().toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estimated Time:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {getEstimatedTime()} hours
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Team Members:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {settings.assignedTo.length} assigned
                  </span>
                </div>
              </div>

              {settings.randomSampling && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Random Sampling:</strong> {settings.samplingPercentage}% of products
                    ({Math.ceil(getEstimatedProducts() * (settings.samplingPercentage / 100))} items)
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleSubmit}
                disabled={!settings.name || !settings.warehouse || loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  'Creating Stocktake...'
                ) : (
                  <>
                    <PlayIcon className="w-5 h-5 mr-2" />
                    Create & Start Stocktake
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/inventory/stocktakes')}
                className="w-full"
              >
                Save as Draft
              </Button>
            </div>

            {/* Tips */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-amber-800 mb-2">💡 Stocktake Tips</h4>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• Schedule during low-activity periods</li>
                <li>• Assign 2+ people for accuracy verification</li>
                <li>• Use random sampling for large inventories</li>
                <li>• Enable mobile counting for faster completion</li>
                <li>• Hide quantities to prevent counting bias</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <Modal
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            title="Stocktake Preview"
            size="lg"
          >
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{settings.name}</h3>
                <p className="text-sm text-gray-600">{settings.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <p className="capitalize">{settings.type} Count</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Warehouse:</span>
                  <p>{warehouses.find(w => w.id === settings.warehouse)?.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Scheduled:</span>
                  <p>{new Date(settings.scheduledDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Team:</span>
                  <p>{settings.assignedTo.length} members</p>
                </div>
              </div>

              {settings.categories.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Categories:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {settings.categories.map(catId => {
                      const category = categories.find(c => c.id === catId);
                      return (
                        <span key={catId} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {category?.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button
                  onClick={() => {
                    setShowPreview(false);
                    handleSubmit();
                  }}
                  className="w-full"
                  disabled={loading}
                >
                  Confirm & Create Stocktake
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default NewStocktakePage;