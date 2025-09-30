import React, { useState } from 'react';
import { 
  PlusIcon, CheckIcon, TagIcon, FolderIcon,
  ArrowRightIcon, XMarkIcon, LinkIcon
} from '@heroicons/react/24/outline';

interface MainCategory {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  subcategories: Subcategory[];
  specialItems: SpecialItem[];
  isStructureComplete: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  parentId?: string;
  color: string;
  isVisible: boolean;
  sortOrder: number;
  options: SubcategoryOption[];
  linkedFinalProducts: string[];
  level: number;
  isShared?: boolean; // New field for shared subcategories
  sharedLibraryId?: string; // Reference to library subcategory
}

interface SubcategoryOption {
  id: string;
  label: string;
  value: string;
  subcategoryId: string;
  isActive: boolean;
  sortOrder: number;
}

interface SpecialItem {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  categoryId: string;
  isAlwaysVisible: boolean;
  appliesTo: 'category';
}

interface LibrarySubcategory {
  id: string;
  name: string;
  description: string;
  options: SubcategoryOption[];
  usedInCategories: string[]; // Array of category IDs using this subcategory
  createdAt: Date;
  createdBy: string;
}

interface SubcategoryLibraryProps {
  categories: MainCategory[];
  onCategoriesUpdate: (categories: MainCategory[]) => void;
  onLogAction: (action: string, details: any) => void;
}

export default function SubcategoryLibrary({ categories, onCategoriesUpdate, onLogAction }: SubcategoryLibraryProps) {
  const [librarySubcategories, setLibrarySubcategories] = useState<LibrarySubcategory[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newSubcategoryDesc, setNewSubcategoryDesc] = useState('');

  // Initialize library subcategories from existing categories
  React.useEffect(() => {
    const existingLibrary = localStorage.getItem('saleskik-subcategory-library');
    if (existingLibrary) {
      setLibrarySubcategories(JSON.parse(existingLibrary));
    } else {
      // Create initial library from existing subcategories
      const library: LibrarySubcategory[] = [];
      categories.forEach(category => {
        category.subcategories.forEach(sub => {
          if (!sub.parentId) { // Only top-level subcategories
            const existing = library.find(lib => lib.name === sub.name);
            if (existing) {
              if (!existing.usedInCategories.includes(category.id)) {
                existing.usedInCategories.push(category.id);
              }
            } else {
              library.push({
                id: sub.id,
                name: sub.name,
                description: `Reusable ${sub.name} subcategory`,
                options: sub.options,
                usedInCategories: [category.id],
                createdAt: new Date(),
                createdBy: 'admin'
              });
            }
          }
        });
      });
      setLibrarySubcategories(library);
    }
  }, [categories]);

  // Save library to localStorage
  const saveLibrary = (library: LibrarySubcategory[]) => {
    setLibrarySubcategories(library);
    localStorage.setItem('saleskik-subcategory-library', JSON.stringify(library));
  };

  // Create new library subcategory
  const createLibrarySubcategory = () => {
    if (!newSubcategoryName.trim()) return;

    const newLibrarySubcategory: LibrarySubcategory = {
      id: Date.now().toString(),
      name: newSubcategoryName.trim(),
      description: newSubcategoryDesc.trim() || `Reusable ${newSubcategoryName.trim()} subcategory`,
      options: [],
      usedInCategories: [],
      createdAt: new Date(),
      createdBy: 'admin'
    };

    const updatedLibrary = [...librarySubcategories, newLibrarySubcategory];
    saveLibrary(updatedLibrary);
    
    setNewSubcategoryName('');
    setNewSubcategoryDesc('');
    setShowCreateForm(false);
    
    onLogAction('library_subcategory_created', { 
      subcategoryId: newLibrarySubcategory.id,
      name: newLibrarySubcategory.name
    });
  };

  // Bulk assign selected subcategories to selected categories
  const bulkAssignSubcategories = () => {
    if (selectedSubcategories.length === 0 || selectedCategories.length === 0) return;

    const updatedCategories = categories.map(category => {
      if (selectedCategories.includes(category.id)) {
        const newSubcategories = [...category.subcategories];
        
        selectedSubcategories.forEach(libSubId => {
          const librarySubcategory = librarySubcategories.find(lib => lib.id === libSubId);
          if (librarySubcategory) {
            // Check if already exists
            const exists = newSubcategories.find(sub => sub.sharedLibraryId === libSubId);
            if (!exists) {
              // Add as shared subcategory
              const sharedSubcategory: Subcategory = {
                id: `${category.id}-${libSubId}-${Date.now()}`,
                name: librarySubcategory.name,
                categoryId: category.id,
                color: category.color, // Inherit category color
                isVisible: true,
                sortOrder: newSubcategories.length + 1,
                options: librarySubcategory.options,
                linkedFinalProducts: [],
                level: 0,
                isShared: true,
                sharedLibraryId: libSubId
              };
              newSubcategories.push(sharedSubcategory);
            }
          }
        });
        
        return { ...category, subcategories: newSubcategories };
      }
      return category;
    });

    // Update library usage tracking
    const updatedLibrary = librarySubcategories.map(libSub => {
      if (selectedSubcategories.includes(libSub.id)) {
        const newUsedInCategories = [...new Set([...libSub.usedInCategories, ...selectedCategories])];
        return { ...libSub, usedInCategories: newUsedInCategories };
      }
      return libSub;
    });

    onCategoriesUpdate(updatedCategories);
    saveLibrary(updatedLibrary);
    
    // Clear selections
    setSelectedSubcategories([]);
    setSelectedCategories([]);

    onLogAction('bulk_subcategory_assignment', {
      subcategoryCount: selectedSubcategories.length,
      categoryCount: selectedCategories.length
    });
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  // Toggle subcategory selection
  const toggleSubcategorySelection = (subcategoryId: string) => {
    setSelectedSubcategories(prev => 
      prev.includes(subcategoryId) 
        ? prev.filter(id => id !== subcategoryId)
        : [...prev, subcategoryId]
    );
  };

  // Toggle category selection
  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subcategory Library</h2>
          <p className="text-gray-600 mt-1">Manage reusable subcategories across multiple categories</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Create Subcategory
        </button>
      </div>

      {/* Create New Subcategory Form */}
      {showCreateForm && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Create New Library Subcategory</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory Name</label>
              <input
                type="text"
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Glass Type, Hardware Finish"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
              <input
                type="text"
                value={newSubcategoryDesc}
                onChange={(e) => setNewSubcategoryDesc(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of this subcategory"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={createLibrarySubcategory}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={!newSubcategoryName.trim()}
            >
              Create Subcategory
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewSubcategoryName('');
                setNewSubcategoryDesc('');
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Subcategory Library */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Available Subcategories</h3>
            <div className="text-sm text-gray-500">
              {selectedSubcategories.length} selected
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {librarySubcategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FolderIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No subcategories in library yet</p>
                <p className="text-sm">Create your first reusable subcategory</p>
              </div>
            ) : (
              librarySubcategories.map((libSub) => (
                <div key={libSub.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedSubcategories.includes(libSub.id)}
                      onChange={() => toggleSubcategorySelection(libSub.id)}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <TagIcon className="w-4 h-4 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">{libSub.name}</h4>
                        {libSub.usedInCategories.length > 1 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                            Shared
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{libSub.description}</p>
                      <div className="text-xs text-gray-500">
                        {libSub.options.length} options • {libSub.usedInCategories.length} categories
                      </div>
                      
                      {/* Show which categories use this subcategory */}
                      {libSub.usedInCategories.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-600 mb-2">Used in:</p>
                          <div className="flex flex-wrap gap-2">
                            {libSub.usedInCategories.map(categoryId => (
                              <span key={categoryId} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                {getCategoryName(categoryId)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column - Target Categories */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Target Categories</h3>
            <div className="text-sm text-gray-500">
              {selectedCategories.length} selected
            </div>
          </div>

          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {categories.map((category) => (
              <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => toggleCategorySelection(category.id)}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <div 
                      className="w-4 h-4 rounded-full ring-2 ring-white shadow-sm"
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900">{category.name}</h4>
                      <p className="text-sm text-gray-600">
                        {category.subcategories.length} subcategories • 
                        {category.subcategories.filter(sub => sub.isShared).length} shared
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bulk Assignment Button */}
          <div className="border-t border-gray-200 pt-6">
            <button
              onClick={bulkAssignSubcategories}
              disabled={selectedSubcategories.length === 0 || selectedCategories.length === 0}
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <LinkIcon className="w-5 h-5" />
              Add {selectedSubcategories.length} Subcategories to {selectedCategories.length} Categories
            </button>
            
            {(selectedSubcategories.length > 0 || selectedCategories.length > 0) && (
              <div className="mt-3 text-center">
                <button
                  onClick={() => {
                    setSelectedSubcategories([]);
                    setSelectedCategories([]);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear selections
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Library Usage Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Library Usage Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <div className="text-2xl font-bold text-blue-600">{librarySubcategories.length}</div>
            <div className="text-sm text-blue-700 font-medium">Library Subcategories</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <div className="text-2xl font-bold text-purple-600">
              {librarySubcategories.filter(lib => lib.usedInCategories.length > 1).length}
            </div>
            <div className="text-sm text-purple-700 font-medium">Shared Across Categories</div>
          </div>
          
          <div className="text-center p-4 bg-emerald-50 rounded-xl">
            <div className="text-2xl font-bold text-emerald-600">
              {librarySubcategories.reduce((sum, lib) => sum + lib.usedInCategories.length, 0)}
            </div>
            <div className="text-sm text-emerald-700 font-medium">Total Usage Instances</div>
          </div>
        </div>

        {/* Most Used Subcategories */}
        <div className="mt-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Most Used Subcategories</h4>
          <div className="space-y-3">
            {librarySubcategories
              .sort((a, b) => b.usedInCategories.length - a.usedInCategories.length)
              .slice(0, 5)
              .map((libSub) => (
                <div key={libSub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TagIcon className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">{libSub.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Used in {libSub.usedInCategories.length} categories</span>
                    <div className="flex gap-1">
                      {libSub.usedInCategories.slice(0, 3).map(categoryId => {
                        const category = categories.find(cat => cat.id === categoryId);
                        return (
                          <div
                            key={categoryId}
                            className="w-3 h-3 rounded-full ring-1 ring-white"
                            style={{ backgroundColor: category?.color || '#6B7280' }}
                            title={category?.name}
                          />
                        );
                      })}
                      {libSub.usedInCategories.length > 3 && (
                        <span className="text-xs text-gray-500 ml-1">+{libSub.usedInCategories.length - 3}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Library Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
          <div className="flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-blue-600" />
            <span>Consistent subcategories across categories</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-blue-600" />
            <span>Easy bulk assignment to multiple categories</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-blue-600" />
            <span>Centralized management of common subcategories</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-blue-600" />
            <span>Automatic updates across all uses</span>
          </div>
        </div>
      </div>
    </div>
  );
}