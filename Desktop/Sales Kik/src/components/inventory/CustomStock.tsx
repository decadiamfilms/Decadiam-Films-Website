import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../layout/UniversalNavigation';
import UniversalHeader from '../layout/UniversalHeader';
import { 
  PlusIcon, MagnifyingGlassIcon, DocumentArrowDownIcon,
  WrenchScrewdriverIcon, ChartBarIcon, CubeIcon,
  ArchiveBoxIcon, TagIcon, PhotoIcon, PencilIcon,
  TrashIcon, MapPinIcon, UserIcon, BuildingOffice2Icon
} from '@heroicons/react/24/outline';

// Updated interface for custom stock items
interface CustomStockItem {
  id: string;
  baseProductId?: string; // Reference to main product if derived from one
  productName: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  subcategoryPath: SubcategoryPath[];
  customSpecs: string; // What makes this custom/special
  quantity: number;
  unitPrice: number;
  totalValue: number;
  location: string;
  customerName?: string; // If for specific customer
  projectName?: string; // If for specific project
  dateAdded: string;
  lastModified: string;
  notes: string;
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

export function CustomStock() {
  const navigate = useNavigate();
  const [customStock, setCustomStock] = useState<CustomStockItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [baseProducts, setBaseProducts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategoryPath, setSelectedSubcategoryPath] = useState<SubcategoryPath[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showAddCustomForm, setShowAddCustomForm] = useState(false);

  useEffect(() => {
    loadIntegratedData();
  }, []);

  const loadIntegratedData = async () => {
    try {
      // Load base products for reference
      const savedProducts = localStorage.getItem('saleskik-products');
      if (savedProducts) {
        setBaseProducts(JSON.parse(savedProducts));
      }

      // Load categories
      const savedCategories = localStorage.getItem('saleskik-categories');
      if (savedCategories) {
        setCategories(JSON.parse(savedCategories));
      }

      // Load locations from admin setup
      const savedLocations = localStorage.getItem('saleskik-locations');
      if (savedLocations) {
        setLocations(JSON.parse(savedLocations).filter((loc: any) => loc.isActive));
      }

      // Load custom stock items
      const savedCustomStock = localStorage.getItem('saleskik-custom-stock');
      if (savedCustomStock) {
        setCustomStock(JSON.parse(savedCustomStock));
      } else {
        // Create sample custom stock based on base products
        const sampleCustomStock: CustomStockItem[] = [
          {
            id: '1',
            baseProductId: '1',
            productName: 'Custom Cut 10mm Clear Glass - Pool Project',
            sku: 'CUSTOM-GLASS-001',
            categoryId: 'cat1',
            categoryName: 'Glass Pool Fencing',
            subcategoryPath: [
              { id: 'sub1', name: 'Mirror Finish', level: 0, color: '#3B82F6' },
              { id: 'sub2', name: 'Spigots', level: 1, color: '#3B82F6' },
            ],
            customSpecs: 'Custom dimensions: 2.4m x 1.8m with curved edge',
            quantity: 2,
            unitPrice: 450.00,
            totalValue: 900.00,
            location: 'Workshop A',
            customerName: 'Luxury Pools Brisbane',
            projectName: 'Backyard Paradise Pool',
            dateAdded: new Date().toISOString().split('T')[0],
            lastModified: new Date().toISOString().split('T')[0],
            notes: 'Handle with extra care - custom curved edge'
          },
          {
            id: '2',
            productName: 'Bespoke Hardware Set - Chrome Finish',
            sku: 'CUSTOM-HARDWARE-002',
            categoryId: 'cat2',
            categoryName: 'Hardware',
            subcategoryPath: [
              { id: 'sub5', name: 'Premium Finishes', level: 0, color: '#10B981' },
            ],
            customSpecs: 'Special chrome plating with anti-corrosion coating',
            quantity: 1,
            unitPrice: 1200.00,
            totalValue: 1200.00,
            location: 'Storage B',
            customerName: 'Elite Glass Co',
            projectName: 'Commercial Tower',
            dateAdded: new Date().toISOString().split('T')[0],
            lastModified: new Date().toISOString().split('T')[0],
            notes: 'Customer specific - do not use for other projects'
          }
        ];
        setCustomStock(sampleCustomStock);
        localStorage.setItem('saleskik-custom-stock', JSON.stringify(sampleCustomStock));
      }
    } catch (error) {
      console.error('Failed to load custom stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format subcategory path for display
  const formatSubcategoryPath = (path: SubcategoryPath[]) => {
    return path.map(p => p.name).join(' → ');
  };

  // Filter custom stock items
  const filteredCustomStock = customStock.filter(item => {
    const matchesSearch = !searchKeyword || 
      item.productName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      item.customSpecs.toLowerCase().includes(searchKeyword.toLowerCase());
    
    const matchesCategory = !selectedCategory || item.categoryId === selectedCategory;
    const matchesLocation = !selectedLocation || item.location === selectedLocation;
    
    const matchesSubcategory = selectedSubcategoryPath.length === 0 || 
      selectedSubcategoryPath.every(filterPath => 
        item.subcategoryPath.some(itemPath => itemPath.id === filterPath.id)
      );
    
    return matchesSearch && matchesCategory && matchesLocation && matchesSubcategory;
  });

  // Get active locations from admin setup
  const getActiveLocations = () => {
    return locations.map(loc => loc.name);
  };

  if (loading) {
    return <div className="p-8">Loading custom stock...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="inventory" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="Custom Stock"
        subtitle="Manage custom and specialty items for specific projects"
        onMenuToggle={() => setShowSidebar(true)}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddCustomForm(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Custom Item
            </button>
            <button
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm flex items-center gap-2"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              Export
            </button>
          </div>
        }
        summaryCards={
          <>
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Custom Items</p>
                  <p className="text-2xl font-bold text-purple-900">{customStock.length}</p>
                </div>
                <WrenchScrewdriverIcon className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Value</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${customStock.reduce((sum, item) => sum + item.totalValue, 0).toLocaleString()}
                  </p>
                </div>
                <ChartBarIcon className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Active Projects</p>
                  <p className="text-2xl font-bold text-green-900">
                    {[...new Set(customStock.map(item => item.projectName))].filter(Boolean).length}
                  </p>
                </div>
                <BuildingOffice2Icon className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Locations</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {getActiveLocations().length}
                  </p>
                </div>
                <ArchiveBoxIcon className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </>
        }
      />

      <div className="p-8 max-w-7xl mx-auto">
        {/* Enhanced Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Custom Stock Filters</h3>
            <button 
              onClick={() => {
                setSearchKeyword('');
                setSelectedCategory('');
                setSelectedSubcategoryPath([]);
                setSelectedLocation('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All Filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Custom Items</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Search by name, SKU, or specs..."
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

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Locations</option>
                {getActiveLocations().map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
                {getActiveLocations().length === 0 && (
                  <option disabled>No locations configured</option>
                )}
              </select>
            </div>

            {/* Actions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quick Actions</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddCustomForm(true)}
                  className="flex-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm"
                >
                  Add Custom
                </button>
                <button
                  onClick={() => navigate(getActiveLocations().length === 0 ? '/admin/locations' : '/products')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                    getActiveLocations().length === 0 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                  title={getActiveLocations().length === 0 ? 'Setup locations first' : 'View base products'}
                >
                  {getActiveLocations().length === 0 ? 'Setup Locations' : 'Base Products'}
                </button>
              </div>
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
              {filteredCustomStock.length} custom items {(searchKeyword || selectedCategory || selectedLocation) ? 'filtered' : 'total'}
            </div>
          </div>
        </div>

        {/* Custom Stock Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Custom & Specialty Items</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product & SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category Path</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Custom Specs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project/Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomStock.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <WrenchScrewdriverIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Custom Items Found</h3>
                      <p className="text-gray-600 mb-6">
                        {customStock.length === 0 
                          ? 'Create custom items for special projects or unique requirements'
                          : 'Try adjusting your filters to see more custom items'
                        }
                      </p>
                      <button
                        onClick={() => setShowAddCustomForm(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
                      >
                        Add First Custom Item
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredCustomStock.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <WrenchScrewdriverIcon className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{item.productName}</div>
                            <div className="text-sm text-gray-500 font-mono">{item.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{item.categoryName}</div>
                          <div className="text-gray-500">
                            {formatSubcategoryPath(item.subcategoryPath)}
                          </div>
                          {item.subcategoryPath.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {item.subcategoryPath.map((path, index) => (
                                <div key={path.id} className="flex items-center gap-1">
                                  <div 
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: path.color }}
                                  />
                                  {index < item.subcategoryPath.length - 1 && (
                                    <span className="text-xs text-gray-400">→</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          <div className="font-medium">{item.customSpecs}</div>
                          {item.notes && (
                            <div className="text-gray-500 mt-1 text-xs">{item.notes}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{item.quantity}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">${item.unitPrice.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-green-700">${item.totalValue.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {item.customerName && (
                            <div className="font-medium text-gray-900 flex items-center gap-1">
                              <UserIcon className="w-3 h-3" />
                              {item.customerName}
                            </div>
                          )}
                          {item.projectName && (
                            <div className="text-gray-500 flex items-center gap-1 mt-1">
                              <BuildingOffice2Icon className="w-3 h-3" />
                              {item.projectName}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <MapPinIcon className="w-3 h-3 text-gray-500" />
                          {item.location}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit custom item"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete custom item"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
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

// Filter Cascading Selector (same as other pages)
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

export default CustomStock;