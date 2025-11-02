import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../layout/UniversalNavigation';
import UniversalHeader from '../layout/UniversalHeader';
import CategoryEditor from '../products/CategoryEditor';
import SubcategoryLibrary from '../products/SubcategoryLibrary';
import { useAutoStartSimpleTour, SimpleTourButton } from '../tour/SimpleTour';
import { 
  PlusIcon, XMarkIcon, EyeIcon, CogIcon, 
  ArrowRightIcon, DocumentArrowDownIcon, ArrowUpTrayIcon,
  PhotoIcon, DocumentTextIcon, TrashIcon, PencilIcon,
  ClipboardDocumentListIcon, BuildingStorefrontIcon,
  TagIcon, SwatchIcon, AdjustmentsHorizontalIcon,
  CheckIcon, ExclamationTriangleIcon, ClockIcon,
  LinkIcon, DocumentDuplicateIcon, BeakerIcon,
  MagnifyingGlassIcon, ChevronRightIcon, ChevronDownIcon
} from '@heroicons/react/24/outline';

// Data structure following your exact specifications
interface MainCategory {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  subcategories: Subcategory[];
  specialItems: SpecialItem[];
  isStructureComplete: boolean; // For template generation
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  parentId?: string; // Parent subcategory ID for nesting
  color: string; // Individual color for each subcategory
  isVisible: boolean;
  sortOrder: number;
  options: SubcategoryOption[];
  linkedFinalProducts: string[]; // Final products linked under this subcategory
  level: number; // 0 = top level, 1 = first nested, etc.
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

// Final products are linked UNDER subcategories, but can appear in multiple categories
interface FinalProduct {
  id: string;
  name: string;
  sku: string;
  description: string;
  pricingMethod: 'each' | 'sqm' | 'box';
  unitType: 'mm' | 'cm' | 'm';
  basePrice: number;
  boxConversion?: number;
  images: ProductImage[];
  documents: ProductDocument[];
  // CORRECTED: Products are linked under subcategories, can appear in multiple categories
  subcategoryLinks: SubcategoryLink[];
  isActive: boolean;
  versionHistory: PriceVersion[];
  createdBy: string;
  createdAt: Date;
}

interface SubcategoryLink {
  subcategoryId: string;
  categoryId: string; // Which category this subcategory belongs to
  optionSelections: {[subcategoryId: string]: string}; // For other subcategories in same category
}

interface ProductImage {
  id: string;
  url: string;
  filename: string;
  originalSize: number;
  resizedSize: number;
  isAutoResized: boolean;
  includeInQuote: boolean;
  dimensions: { width: number; height: number };
}

interface ProductDocument {
  id: string;
  name: string;
  type: 'pdf' | 'cad' | 'spec' | 'warranty';
  url: string;
  appliesTo: 'product' | 'category';
  categoryId?: string;
  fileSize: number;
}

// Special items are ALWAYS at category level, not subcategory level
interface SpecialItem {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  categoryId: string;
  isAlwaysVisible: boolean;
  appliesTo: 'category'; // Always category level as specified
}

interface PriceVersion {
  id: string;
  price: number;
  effectiveDate: Date;
  changedBy: string;
  reason: string;
}

interface TemplateStructure {
  categories: MainCategory[];
  lastGenerated: Date;
  version: string;
  isComplete: boolean; // Only true when ALL categories have complete structure
}

export default function SalesKikInventoryBuilder() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'structure' | 'products' | 'admin' | 'templates' | 'preview'>('structure');
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [finalProducts, setFinalProducts] = useState<FinalProduct[]>([]);
  const [templateStructure, setTemplateStructure] = useState<TemplateStructure | null>(null);
  
  // Sidebar state
  const [showSidebar, setShowSidebar] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Auto-start simple tour for continuations
  useAutoStartSimpleTour();
  

  const tabs = [
    { id: 'structure', name: 'Category Structure', icon: AdjustmentsHorizontalIcon, description: 'Build categories with library integration' },
    { id: 'products', name: 'Product Linking', icon: BuildingStorefrontIcon, description: 'Link final products under subcategories' },
    { id: 'admin', name: 'Admin Products', icon: CogIcon, description: 'Complete product information management' },
    { id: 'templates', name: 'Upload Templates', icon: DocumentArrowDownIcon, description: 'Generated only when structure is complete' },
    { id: 'preview', name: 'System Preview', icon: EyeIcon, description: 'Test the employee quoting experience' }
  ];

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setShowSidebar(false);
      }
    }
    if (showSidebar) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSidebar]);

  useEffect(() => {
    // Templates only generate when ALL categories have complete structure
    checkAndGenerateTemplates();
  }, [mainCategories]);

  // Helper function to flatten nested subcategories from database
  const flattenSubcategoriesWithChildren = (subcategories: any[]): any[] => {
    const result: any[] = [];
    
    const processSubcategory = (sub: any) => {
      // Add the subcategory itself
      result.push({
        id: sub.id,
        name: sub.name,
        categoryId: sub.category_id,
        parentId: sub.parent_id, // Map database field to frontend field
        color: sub.color || '#10B981', // Use database color for sub-categories
        isVisible: sub.isVisible,
        sortOrder: sub.sortOrder || 0,
        level: sub.level || 0, // Include level from database
        options: (sub.options || []).map((option: any) => ({
          id: option.id,
          label: option.label,
          value: option.value,
          subcategoryId: sub.id,
          isActive: option.isActive,
          sortOrder: option.sortOrder || 0
        })),
        linkedFinalProducts: [],
      });

      // Recursively process children
      if (sub.children && sub.children.length > 0) {
        sub.children.forEach((child: any) => processSubcategory(child));
      }
    };

    // Process all top-level subcategories
    subcategories.forEach(sub => processSubcategory(sub));
    
    return result;
  };

  const fetchCategories = async () => {
    try {
      console.log('🔍 Inventory Builder: Loading categories from database...');
      
      // Try new database API first
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      
      console.log('📡 Inventory Builder: API Response status:', response.status);
      
      if (response.ok) {
        const apiResponse = await response.json();
        console.log('📋 Inventory Builder: Raw API response:', apiResponse);
        
        if (apiResponse.success && Array.isArray(apiResponse.data)) {
          const categoriesData = apiResponse.data;
          
          // Transform new hierarchical structure to frontend format
          const transformedCategories = categoriesData.map((cat: any) => {
            console.log('🔍 Frontend: Transforming category:', cat.name);
            console.log('📂 Raw subcategories from API:', cat.subcategories);
            
            return {
              id: cat.id,
              name: cat.name,
              color: cat.color || '#3B82F6', // Use database color or default
              isActive: cat.isActive,
              isStructureComplete: false, // Default to false for now
              subcategories: cat.subcategories || [], // Use direct mapping instead of flatten function
              specialItems: [],
              createdBy: 'database',
              productCount: cat._count?.products || 0,
              createdAt: cat.created_at ? new Date(cat.created_at) : new Date(),
              updatedAt: cat.updated_at ? new Date(cat.updated_at) : new Date()
            };
          });
          
          setMainCategories(transformedCategories);
          console.log('✅ Inventory Builder: Categories loaded from database:', transformedCategories.length);
          console.log('📝 Categories with subcategories:', transformedCategories.map(c => `${c.name} (${c.subcategories.length} subs)`).join(', '));
          return;
        }
      }
      
      // If database fails, start with empty categories
      console.log('📝 Inventory Builder: API failed, starting with empty categories');
      setMainCategories([]);
      console.log('✅ Inventory Builder: Ready for new categories from UI');
    } catch (error) {
      console.error('❌ Inventory Builder: Error loading categories:', error);
      
      // If there's an error, start with empty categories so user can create new ones
      console.log('📝 Inventory Builder: Error occurred, starting with empty categories');
      setMainCategories([]);
      console.log('✅ Inventory Builder: Ready for new categories from UI');
    }
  };

  const fetchProducts = async () => {
    // Start with empty products so user can build from scratch
    const mockProducts: FinalProduct[] = [];
    setFinalProducts(mockProducts);
  };

  const checkAndGenerateTemplates = () => {
    // Templates are only "properly generated" when ALL categories are structurally complete
    const allCategoriesComplete = mainCategories.length > 0 && 
      mainCategories.every(cat => cat.isStructureComplete && cat.subcategories.length > 0);

    if (allCategoriesComplete) {
      const templateStruct: TemplateStructure = {
        categories: mainCategories,
        lastGenerated: new Date(),
        version: `v${Date.now().toString().slice(-6)}`,
        isComplete: true
      };
      setTemplateStructure(templateStruct);
    } else {
      setTemplateStructure({
        categories: mainCategories,
        lastGenerated: new Date(),
        version: 'incomplete',
        isComplete: false
      });
    }
  };

  const logAction = async (action: string, details: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      user: 'admin-user',
      action,
      details,
      ipAddress: '192.168.1.1',
      userAgent: navigator.userAgent
    };
    console.log('Action logged:', logEntry);
  };

  // Helper function to count subcategories (simplified)
  const getTotalSubcategoryCount = (subcategories: Subcategory[]): number => {
    return subcategories.length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Universal Navigation */}
      <UniversalNavigation 
        currentPage="inventory" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      {/* Universal Header */}
      <UniversalHeader
        title="Product Category Setup"
        subtitle="Configure your product categories and subcategory structure"
        onMenuToggle={() => setShowSidebar(true)}
        actions={
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Categories: {mainCategories.length}
            </div>
          </div>
        }
      />

      {/* Direct Category Setup - No Tabs */}
      <div className="p-8 max-w-7xl mx-auto">
        <CategoryStructureBuilder 
          categories={mainCategories}
          onCategoriesUpdate={setMainCategories}
          onLogAction={logAction}
        />
      </div>
    </div>
  );
}

// Category Structure Builder - Step 1: Establish main categories and subcategories
function CategoryStructureBuilder({ categories, onCategoriesUpdate, onLogAction }: {
  categories: MainCategory[];
  onCategoriesUpdate: (categories: MainCategory[]) => void;
  onLogAction: (action: string, details: any) => void;
}) {
  const [editingCategory, setEditingCategory] = useState<MainCategory | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const lastClickRef = useRef<{categoryId: string, timestamp: number} | null>(null);

  // Helper function to count subcategories (local copy)
  const getTotalSubcategoryCount = (subcategories: Subcategory[]): number => {
    return subcategories.length;
  };

  // Toggle expansion with debounce protection
  const toggleCategoryExpansion = useCallback((categoryId: string) => {
    const now = Date.now();
    
    // Prevent double clicks within 100ms
    if (lastClickRef.current && 
        lastClickRef.current.categoryId === categoryId && 
        now - lastClickRef.current.timestamp < 100) {
      console.log('Ignoring double click on:', categoryId);
      return;
    }
    
    lastClickRef.current = { categoryId, timestamp: now };
    console.log('toggleCategoryExpansion called with:', categoryId);
    
    setExpandedCategories(prev => {
      console.log('Previous expanded categories:', prev);
      const newState = {
        ...prev,
        [categoryId]: !prev[categoryId]
      };
      console.log('New expanded categories:', newState);
      return newState;
    });
  }, []);

  const addNewCategory = () => {
    const newCategory: MainCategory = {
      id: Date.now().toString(),
      name: 'New Category',
      color: '#6B7280',
      isActive: true,
      isStructureComplete: false,
      subcategories: [],
      specialItems: [],
      createdBy: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setEditingCategory(newCategory);
  };

  const saveCategory = async (category: MainCategory) => {
    try {
      console.log('Saving category:', category);
      
      // Ensure all subcategories have required fields with defaults
      const safeCategoryData = {
        ...category,
        subcategories: category.subcategories.map(sub => ({
          ...sub,
          color: sub.color, // Don't override with gray - keep original color
          level: sub.level || 0,
          parentId: sub.parentId || undefined,
          options: sub.options || [],
          linkedFinalProducts: sub.linkedFinalProducts || []
        }))
      };
      
      const isNew = !categories.find(c => c.id === category.id);
      
      let updatedCategories;
      if (isNew) {
        updatedCategories = [...categories, safeCategoryData];
        onCategoriesUpdate(updatedCategories);
        await onLogAction('category_created', { 
          categoryId: category.id, 
          name: category.name,
          subcategoriesCount: category.subcategories.length,
          specialItemsCount: category.specialItems.length
        });
      } else {
        updatedCategories = categories.map(c => c.id === category.id ? safeCategoryData : c);
        onCategoriesUpdate(updatedCategories);
        await onLogAction('category_updated', { 
          categoryId: category.id, 
          name: category.name,
          isStructureComplete: category.isStructureComplete
        });
      }
      
      // Save complete category structure to database (including subcategories)
      try {
        if (category.name && category.name.trim().length > 0) {
          console.log('💾 Saving complete category structure to database:', category.name);
          console.log('📂 Subcategories count:', category.subcategories.length);
          
          // First, check if category exists in database or if it's a new one
          const isNewCategory = !categories.find(c => c.id === category.id);
          
          if (isNewCategory) {
            console.log('🆕 Creating new category in database first:', category.name);
            
            // Create the basic category first
            const createResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                name: category.name,
                description: '',
                color: category.color,
                sortOrder: 0
              })
            });
            
            if (createResponse.ok) {
              const createResult = await createResponse.json();
              console.log('✅ Basic category created:', createResult);
              
              // Update the category ID to match the database-generated one
              category.id = createResult.data.id;
              console.log('🔄 Updated category ID to:', category.id);
            }
          }
          
          // Now save the complete structure (if there are subcategories)
          if (category.subcategories.length > 0) {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(category)
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('✅ Complete category structure with subcategories saved to database:', result);
            } else {
              console.warn('❌ Failed to save subcategories to database');
              const errorText = await response.text();
              console.error('Error details:', errorText);
            }
          }
          
          // Refresh categories from database to get latest state
          setTimeout(() => {
            fetchCategories();
          }, 500);
        }
      } catch (error) {
        console.error('Error saving category to database:', error);
      }
      
      setEditingCategory(null);
      console.log('Category saved successfully');
    } catch (error) {
      console.error('Error saving category:', error);
      alert(`Error saving category: ${error.message}`);
    }
  };

  const markCategoryComplete = async (categoryId: string, isComplete: boolean) => {
    const updatedCategories = categories.map(c => 
      c.id === categoryId ? { ...c, isStructureComplete: isComplete } : c
    );
    onCategoriesUpdate(updatedCategories);
    
    // Save completion status to database
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isStructureComplete: isComplete
        })
      });
      
      if (response.ok) {
        console.log('✅ Category completion status saved to database');
      } else {
        console.warn('❌ Failed to save completion status to database, using localStorage fallback');
        localStorage.setItem('saleskik-categories', JSON.stringify(updatedCategories));
      }
    } catch (error) {
      console.error('Error saving completion to database, using localStorage fallback:', error);
      localStorage.setItem('saleskik-categories', JSON.stringify(updatedCategories));
    }
    
    await onLogAction('category_completion_changed', { categoryId, isComplete });
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Hero Section */}
      <div className="text-center py-12 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl border-2 border-blue-100 shadow-lg">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4">
            <TagIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Build Your Category Structure
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create beautiful, organized product categories with unlimited nested subcategories. Perfect for any business structure! ✨
          </p>
        </div>
        <button
          onClick={addNewCategory}
          data-tour="add-category"
          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-3 font-semibold mx-auto transform hover:-translate-y-1"
        >
          <PlusIcon className="w-6 h-6" />
          {categories.length === 0 ? 'Add Your First Category' : 'Add Category'}
        </button>
      </div>

      {/* Vibrant Status Overview */}
      {categories.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 rounded-3xl p-8 border-2 border-emerald-100 shadow-xl">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-2xl shadow-lg">
              <BeakerIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-3">
                🚀 Your Category Dashboard
              </h3>
              <p className="text-gray-600 mb-6 text-lg">Watch your business structure come to life!</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(cat => (
                  <div key={cat.id} className="group flex items-center gap-4 bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-purple-200">
                    <div
                      className="w-8 h-8 rounded-full ring-4 ring-white shadow-lg group-hover:scale-110 transition-transform duration-300"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="flex-1">
                      <span className="font-bold text-gray-900 text-lg">{cat.name}</span>
                      <div className="text-sm text-gray-500 font-medium">
                        {cat.subcategories.length} subcategories
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clean Category Cards */}
      <div className="space-y-8">
        {categories.map((category) => (
          <CategoryCard 
            key={category.id}
            category={category}
            onEdit={setEditingCategory}
            onDelete={async (categoryId) => {
              try {
                console.log('🗑️ Deleting category from database:', categoryId);
                
                // Delete from database first using new API
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories/${categoryId}`, {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json'
                  }
                });
                
                if (response.ok) {
                  console.log('✅ Category deleted from database successfully');
                  
                  // Only update frontend state after successful database deletion
                  const updatedCategories = categories.filter(c => c.id !== categoryId);
                  onCategoriesUpdate(updatedCategories);
                  console.log('✅ Category removed from frontend');
                } else {
                  console.error('❌ Failed to delete category from database:', response.status);
                  // If database delete fails, don't update frontend
                }
              } catch (error) {
                console.error('❌ Error deleting category from database:', error);
                // If there's an error, don't update frontend
              }
            }}
          />
        ))}
      </div>

      {/* Category Editor Modal */}
      {editingCategory && (
        <CategoryEditor
          category={editingCategory}
          onSave={saveCategory}
          onCancel={() => setEditingCategory(null)}
        />
      )}
    </div>
  );
}

// Isolated Category Card Component with its own state
function CategoryCard({ category, onEdit, onDelete }: {
  category: MainCategory;
  onEdit: (category: MainCategory) => void;
  onDelete: (categoryId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getTotalSubcategoryCount = (subcategories: Subcategory[]): number => {
    return subcategories.length;
  };
  
  const handleToggleExpansion = () => {
    setIsExpanded(prev => !prev);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-6">
        {/* Clickable left side */}
        <div 
          className="flex items-center gap-4 cursor-pointer flex-1 p-2 -m-2 rounded-lg hover:bg-gray-50 transition-colors"
          onClick={handleToggleExpansion}
        >
          <div 
            className="w-6 h-6 rounded-full ring-4 ring-white shadow-lg"
            style={{ backgroundColor: category.color }}
          />
          <div>
            <h3 className="text-xl font-bold text-gray-900">{category.name}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {getTotalSubcategoryCount(category.subcategories)} subcategories
            </p>
          </div>
          {/* Expansion indicator */}
          {category.subcategories.length > 0 && (
            <div className="flex items-center gap-2 text-gray-500 ml-4">
              <span className="text-sm font-medium">
                {isExpanded ? 'Collapse' : 'Expand'}
              </span>
              <ChevronDownIcon 
                className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </div>
          )}
        </div>
        
        {/* Right side - action buttons */}
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(category);
            }}
            className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
            title="Edit category"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete "${category.name}" category? This cannot be undone.`)) {
                onDelete(category.id);
              }
            }}
            className="p-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
            title="Delete category"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Accordion Content - Only show when this specific category is expanded */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-6 bg-blue-25 p-4 rounded-lg mt-4" style={{backgroundColor: `${category.color}10`}}>
          {/* Nested Subcategories Preview */}
          <div className="space-y-3 mb-6">
            <NestedSubcategoryPreview subcategories={category.subcategories} />
          </div>

          {/* Special Items Preview */}
          {category.specialItems.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-900 mb-2">Special Items (Category Level)</div>
              <div className="space-y-1">
                {category.specialItems.map((special) => (
                  <div key={special.id} className="text-sm text-gray-600 flex items-center justify-between">
                    <span>{special.name}</span>
                    <span className="font-medium">${special.price} per {special.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Component with accordion functionality for subcategories
function NestedSubcategoryPreview({ subcategories }: { subcategories: Subcategory[] }) {
  const [expandedSubcategories, setExpandedSubcategories] = useState<string[]>([]);
  
  // Get top-level subcategories (no parentId) sorted by sortOrder
  const getTopLevel = () => subcategories
    .filter(sub => !sub.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  
  // Get children of a specific subcategory sorted by sortOrder
  const getChildren = (parentId: string) => subcategories
    .filter(sub => sub.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  
  // Toggle expansion of a subcategory
  const toggleSubcategoryExpansion = (subcategoryId: string) => {
    setExpandedSubcategories(prev => 
      prev.includes(subcategoryId) 
        ? prev.filter(id => id !== subcategoryId)
        : [...prev, subcategoryId]
    );
  };
  
  // Recursive component with accordion functionality
  const SubcategoryNode = ({ subcategory, level = 0 }: { subcategory: Subcategory, level?: number }) => {
    const children = getChildren(subcategory.id);
    const isExpanded = expandedSubcategories.includes(subcategory.id);
    
    return (
      <div>
        <div 
          className="rounded-xl p-4 border-2 bg-white shadow-sm mb-3"
          style={{ 
            marginLeft: `${level * 24}px`,
            borderLeftWidth: '6px',
            borderLeftColor: subcategory.color || '#6B7280',
            borderTopColor: '#e5e7eb',
            borderRightColor: '#e5e7eb', 
            borderBottomColor: '#e5e7eb'
          }}
        >
          <div 
            className={`flex items-center justify-between ${children.length > 0 ? 'cursor-pointer hover:bg-gray-25 p-2 -m-2 rounded-lg transition-colors' : ''}`}
            onClick={() => children.length > 0 && toggleSubcategoryExpansion(subcategory.id)}
          >
            <div className="flex items-center gap-4">
              {/* Clean color indicator */}
              <div 
                className="w-5 h-5 rounded-full ring-2 ring-white shadow-md"
                style={{ backgroundColor: subcategory.color || '#6B7280' }}
              />
              
              <div className="flex-1">
                <span className="font-bold text-gray-900 text-base">{subcategory.name}</span>
                {subcategory.isShared && (
                  <span className="ml-3 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                    Shared
                  </span>
                )}
              </div>
            </div>
            
            {/* Show dropdown for subcategories with children */}
            {children.length > 0 && (
              <div className="flex items-center gap-2 text-gray-500">
                <span className="text-sm font-medium">{children.length} Sub Categories</span>
                <ChevronDownIcon 
                  className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Show children only when expanded */}
        {children.length > 0 && isExpanded && (
          <div className="ml-4">
            {children.map(child => (
              <SubcategoryNode key={child.id} subcategory={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!subcategories || subcategories.length === 0) {
    return <div className="text-sm text-gray-500 italic">No subcategories yet</div>;
  }

  return (
    <div className="space-y-4">
      {getTopLevel().map(subcategory => (
        <SubcategoryNode key={subcategory.id} subcategory={subcategory} />
      ))}
    </div>
  );
}

// Product Linking Interface - Step 2: Link products under subcategories
function ProductLinkingInterface({ categories, products, onProductsUpdate, onLogAction }: {
  categories: MainCategory[];
  products: FinalProduct[];
  onProductsUpdate: (products: FinalProduct[]) => void;
  onLogAction: (action: string, details: any) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [editingProduct, setEditingProduct] = useState<FinalProduct | null>(null);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [searchKeywords, setSearchKeywords] = useState('');

  const createNewProduct = () => {
    const newProduct: FinalProduct = {
      id: Date.now().toString(),
      name: 'New Product',
      sku: `PROD-${Date.now().toString().slice(-6)}`,
      description: 'Product description',
      pricingMethod: 'each',
      unitType: 'mm',
      basePrice: 0,
      images: [],
      documents: [],
      subcategoryLinks: [],
      isActive: true,
      versionHistory: [{
        id: '1',
        price: 0,
        effectiveDate: new Date(),
        changedBy: 'admin',
        reason: 'Initial creation'
      }],
      createdBy: 'admin',
      createdAt: new Date()
    };
    setEditingProduct(newProduct);
    setShowNewProductForm(true);
  };

  const saveProduct = async (product: FinalProduct) => {
    const isNew = !products.find(p => p.id === product.id);
    
    if (isNew) {
      onProductsUpdate([...products, product]);
      await onLogAction('product_created', { 
        productId: product.id, 
        name: product.name,
        sku: product.sku,
        subcategoryCount: product.subcategoryLinks.length
      });
    } else {
      onProductsUpdate(products.map(p => p.id === product.id ? product : p));
      await onLogAction('product_updated', { 
        productId: product.id, 
        name: product.name,
        subcategoryCount: product.subcategoryLinks.length
      });
    }
    
    setEditingProduct(null);
    setShowNewProductForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Step 2: Product Linking</h2>
          <p className="text-gray-600">Link final products under subcategories - products can appear in multiple categories</p>
        </div>
        <button
          onClick={createNewProduct}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2 inline" />
          Create New Product
        </button>
      </div>

      {/* Product Editor Modal */}
      {editingProduct && (
        <ProductEditor
          product={editingProduct}
          categories={categories}
          onSave={saveProduct}
          onCancel={() => {
            setEditingProduct(null);
            setShowNewProductForm(false);
          }}
        />
      )}
    </div>
  );
}

// Simple Product Editor for basic linking
function ProductEditor({ product, categories, onSave, onCancel }: {
  product: FinalProduct;
  categories: MainCategory[];
  onSave: (product: FinalProduct) => void;
  onCancel: () => void;
}) {
  const [editedProduct, setEditedProduct] = useState<FinalProduct>(product);

  const updateProduct = (field: keyof FinalProduct, value: any) => {
    setEditedProduct({ ...editedProduct, [field]: value });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Edit Product</h3>
              <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                  <input
                    type="text"
                    value={editedProduct.name}
                    onChange={(e) => updateProduct('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                  <input
                    type="text"
                    value={editedProduct.sku}
                    onChange={(e) => updateProduct('sku', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={editedProduct.description}
                  onChange={(e) => updateProduct('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Base Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editedProduct.basePrice}
                    onChange={(e) => updateProduct('basePrice', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Method</label>
                  <select
                    value={editedProduct.pricingMethod}
                    onChange={(e) => updateProduct('pricingMethod', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="each">Each</option>
                    <option value="sqm">Per SQM</option>
                    <option value="box">Per Box</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit Type</label>
                  <select
                    value={editedProduct.unitType}
                    onChange={(e) => updateProduct('unitType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="mm">mm</option>
                    <option value="cm">cm</option>
                    <option value="m">m</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => onSave(editedProduct)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Product
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Admin Product Management - Complete product information structure
function AdminProductManagement({ categories, products, onProductsUpdate, onLogAction }: {
  categories: MainCategory[];
  products: FinalProduct[];
  onProductsUpdate: (products: FinalProduct[]) => void;
  onLogAction: (action: string, details: any) => void;
}) {
  const [editingProduct, setEditingProduct] = useState<FinalProduct | null>(null);

  const createNewProduct = () => {
    const newProduct: FinalProduct = {
      id: Date.now().toString(),
      name: '',
      sku: '',
      description: '',
      pricingMethod: 'each',
      unitType: 'mm',
      basePrice: 0,
      images: [],
      documents: [],
      subcategoryLinks: [],
      isActive: true,
      versionHistory: [{
        id: '1',
        price: 0,
        effectiveDate: new Date(),
        changedBy: 'admin',
        reason: 'Initial creation'
      }],
      createdBy: 'admin',
      createdAt: new Date()
    };
    setEditingProduct(newProduct);
  };

  const saveProduct = async (product: FinalProduct) => {
    const isNew = !products.find(p => p.id === product.id);
    
    if (isNew) {
      onProductsUpdate([...products, product]);
      await onLogAction('final_product_created', { 
        productId: product.id, 
        name: product.name,
        sku: product.sku
      });
    } else {
      onProductsUpdate(products.map(p => p.id === product.id ? product : p));
      await onLogAction('final_product_updated', { 
        productId: product.id, 
        name: product.name
      });
    }
    
    setEditingProduct(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Admin Product Information Structure</h2>
          <p className="text-gray-600">Complete product management with pricing, media, and subcategory linkages</p>
        </div>
        <button
          onClick={createNewProduct}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2 inline" />
          Create New Product
        </button>
      </div>

      {/* Empty State */}
      {products.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <BuildingStorefrontIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Created</h3>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            Create your first product to start building your inventory system
          </p>
          <button
            onClick={createNewProduct}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto"
          >
            <PlusIcon className="w-5 h-5" />
            Create First Product
          </button>
        </div>
      )}

      {/* Simple Product Editor Modal */}
      {editingProduct && (
        <ProductEditor
          product={editingProduct}
          categories={categories}
          onSave={saveProduct}
          onCancel={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
}

// Template customization interface
interface TemplateSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  templateStyle: 'modern' | 'classic' | 'minimal';
  showLogo: boolean;
  showCompanyDetails: boolean;
  footerText: string;
  termsAndConditions: string;
}

function CorrectTemplatesInterface({ templateStructure, categories, onLogAction }: {
  templateStructure: TemplateStructure | null;
  categories: MainCategory[];
  onLogAction: (action: string, details: any) => void;
}) {
  const [activeView, setActiveView] = useState<'editor' | 'preview'>('editor');
  const [templateSettings, setTemplateSettings] = useState<TemplateSettings>({
    companyName: 'Your Company Name',
    companyAddress: '123 Business Street, City, State 12345',
    companyPhone: '+1 (555) 123-4567',
    companyEmail: 'info@yourcompany.com',
    logoUrl: '',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    templateStyle: 'modern',
    showLogo: true,
    showCompanyDetails: true,
    footerText: 'Thank you for your business!',
    termsAndConditions: 'Payment is due within 30 days. Late payments may incur additional charges.'
  });

  const updateSetting = (key: keyof TemplateSettings, value: any) => {
    setTemplateSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Template Builder</h2>
          <p className="text-gray-600">Create and customize professional quote templates</p>
        </div>
        
        {/* View Toggle */}
        <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            onClick={() => setActiveView('editor')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'editor'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CogIcon className="w-4 h-4 mr-2 inline" />
            Editor
          </button>
          <button
            onClick={() => setActiveView('preview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'preview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <EyeIcon className="w-4 h-4 mr-2 inline" />
            Preview
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
        {/* Editor Panel */}
        {activeView === 'editor' && (
          <div className="lg:col-span-1 space-y-6">
            <TemplateEditor 
              settings={templateSettings}
              onUpdateSetting={updateSetting}
              categories={categories}
            />
          </div>
        )}
        
        {/* Preview Panel */}
        <div className={`${activeView === 'editor' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <TemplatePreview 
            settings={templateSettings}
            categories={categories}
            isFullWidth={activeView === 'preview'}
          />
        </div>
      </div>
    </div>
  );
}

// Template Editor Component
function TemplateEditor({ settings, onUpdateSetting, categories }: {
  settings: TemplateSettings;
  onUpdateSetting: (key: keyof TemplateSettings, value: any) => void;
  categories: MainCategory[];
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-fit">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Template Settings</h3>
      
      <div className="space-y-6">
        {/* Company Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">Company Information</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Company Name</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => onUpdateSetting('companyName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Address</label>
              <textarea
                value={settings.companyAddress}
                onChange={(e) => onUpdateSetting('companyAddress', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="text"
                  value={settings.companyPhone}
                  onChange={(e) => onUpdateSetting('companyPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) => onUpdateSetting('companyEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Design Settings */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">Design & Colors</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Template Style</label>
              <select
                value={settings.templateStyle}
                onChange={(e) => onUpdateSetting('templateStyle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => onUpdateSetting('primaryColor', e.target.value)}
                    className="w-10 h-8 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => onUpdateSetting('primaryColor', e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => onUpdateSetting('secondaryColor', e.target.value)}
                    className="w-10 h-8 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={settings.secondaryColor}
                    onChange={(e) => onUpdateSetting('secondaryColor', e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Display Options */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">Display Options</h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.showLogo}
                onChange={(e) => onUpdateSetting('showLogo', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show Company Logo</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.showCompanyDetails}
                onChange={(e) => onUpdateSetting('showCompanyDetails', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show Company Details</span>
            </label>
          </div>
        </div>

        {/* Footer Settings */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">Footer & Terms</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Footer Text</label>
              <input
                type="text"
                value={settings.footerText}
                onChange={(e) => onUpdateSetting('footerText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Terms & Conditions</label>
              <textarea
                value={settings.termsAndConditions}
                onChange={(e) => onUpdateSetting('termsAndConditions', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Template Preview Component
function TemplatePreview({ settings, categories, isFullWidth }: {
  settings: TemplateSettings;
  categories: MainCategory[];
  isFullWidth: boolean;
}) {
  // Sample data for preview
  const sampleQuoteData = {
    quoteNumber: 'Q-000123',
    date: '04.02.2025',
    dueDate: '20.02.2025',
    customerName: 'ABC Construction Ltd',
    customerAddress: '456 Industrial Park\nMelbourne, VIC 3000',
    customerPhone: '+61 3 9876 5432',
    customerEmail: 'orders@abcconstruction.com.au',
    items: [
      { description: 'Premium Timber Flooring', quantity: 10, unitPrice: 150.00, total: 1500.00 },
      { description: 'Installation Service', quantity: 1, unitPrice: 500.00, total: 500.00 },
      { description: 'Delivery & Handling', quantity: 1, unitPrice: 100.00, total: 100.00 },
      { description: 'Premium Underlayment', quantity: 12, unitPrice: 25.00, total: 300.00 }
    ]
  };

  const subtotal = sampleQuoteData.items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.10; // 10% GST
  const total = subtotal + tax;

  const getStyleClasses = () => {
    switch (settings.templateStyle) {
      case 'modern':
        return {
          container: 'bg-white shadow-2xl rounded-lg overflow-hidden',
          header: `bg-gradient-to-r from-[${settings.primaryColor}] to-[${settings.secondaryColor}] text-white`,
          accent: settings.primaryColor
        };
      case 'classic':
        return {
          container: 'bg-white shadow-lg border-2 border-gray-200',
          header: `bg-[${settings.primaryColor}] text-white`,
          accent: settings.primaryColor
        };
      case 'minimal':
        return {
          container: 'bg-white shadow-sm border border-gray-100',
          header: `border-b-4 border-[${settings.primaryColor}] bg-gray-50`,
          accent: settings.primaryColor
        };
      default:
        return {
          container: 'bg-white shadow-xl rounded-lg overflow-hidden',
          header: `bg-gradient-to-r from-[${settings.primaryColor}] to-[${settings.secondaryColor}] text-white`,
          accent: settings.primaryColor
        };
    }
  };

  const styleClasses = getStyleClasses();

  return (
    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <EyeIcon className="w-4 h-4" />
          <span>Updates in real-time</span>
        </div>
      </div>
      
      {/* Template Preview */}
      <div className={`${styleClasses.container} max-w-4xl mx-auto transform ${isFullWidth ? 'scale-100' : 'scale-90'} origin-top`}>
        {/* Header Section */}
        <div className={`${styleClasses.header} p-8`}>
          <div className="flex justify-between items-start">
            <div>
              {settings.showLogo && (
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                  <BuildingStorefrontIcon className="w-8 h-8 text-white" />
                </div>
              )}
              <h1 className="text-3xl font-bold mb-2">{settings.companyName}</h1>
              {settings.showCompanyDetails && (
                <div className="text-white/90 space-y-1">
                  <p className="whitespace-pre-line">{settings.companyAddress}</p>
                  <p>{settings.companyPhone}</p>
                  <p>{settings.companyEmail}</p>
                </div>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold mb-4">QUOTE</h2>
              <div className="bg-white/20 rounded-lg p-4 space-y-2">
                <div className="flex justify-between gap-8">
                  <span className="font-medium">Quote No:</span>
                  <span>{sampleQuoteData.quoteNumber}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="font-medium">Date:</span>
                  <span>{sampleQuoteData.date}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="font-medium">Valid Until:</span>
                  <span>{sampleQuoteData.dueDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="p-8 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill To:</h3>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">{sampleQuoteData.customerName}</h4>
            <div className="text-gray-600 space-y-1">
              <p className="whitespace-pre-line">{sampleQuoteData.customerAddress}</p>
              <p>{sampleQuoteData.customerPhone}</p>
              <p>{sampleQuoteData.customerEmail}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quote Details</h3>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className={`bg-[${settings.primaryColor}] text-white`}>
                  <th className="px-6 py-4 text-left font-medium">Description</th>
                  <th className="px-6 py-4 text-center font-medium">Qty</th>
                  <th className="px-6 py-4 text-right font-medium">Unit Price</th>
                  <th className="px-6 py-4 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {sampleQuoteData.items.map((item, index) => (
                  <tr key={index} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-200`}>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.description}</td>
                    <td className="px-6 py-4 text-center text-gray-600">{item.quantity}</td>
                    <td className="px-6 py-4 text-right text-gray-600">${item.unitPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Section */}
        <div className="px-8 pb-8">
          <div className="flex justify-end">
            <div className="w-80">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST (10%):</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total:</span>
                      <span style={{ color: settings.primaryColor }}>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="px-8 pb-8">
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-3">Payment Details</h4>
            <p className="text-gray-600 text-sm mb-2">Bank Transfer Details:</p>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Bank:</strong> National Australia Bank</p>
              <p><strong>Account Name:</strong> {settings.companyName}</p>
              <p><strong>BSB:</strong> 123-456</p>
              <p><strong>Account Number:</strong> 12345678</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`bg-[${settings.primaryColor}] text-white p-6 text-center`}>
          <p className="text-lg font-medium mb-2">{settings.footerText}</p>
          <div className="text-sm text-white/80 max-w-3xl mx-auto">
            <p>{settings.termsAndConditions}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CorrectSystemPreview({ categories, products }: {
  categories: MainCategory[];
  products: FinalProduct[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Step 4: System Preview</h2>
          <p className="text-gray-600">Test the employee quoting experience with your configured categories and products</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Employee Quoting Preview</h3>
        <div className="text-center py-8">
          <EyeIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Preview Ready</h4>
          <p className="text-gray-600">
            System preview shows how employees will experience the quoting interface
          </p>
        </div>
      </div>
      
      {/* Tour Controls */}
      <TourControls />
      
      {/* Simple Tour Button */}
      <SimpleTourButton />
    </div>
  );
}