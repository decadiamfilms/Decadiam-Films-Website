import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, XMarkIcon, PencilIcon, TrashIcon, 
  SwatchIcon, TagIcon, ChevronDownIcon, ChevronRightIcon,
  CheckIcon, BeakerIcon, ColorSwatchIcon 
} from '@heroicons/react/24/outline';

// Clean Category Structure Types - 5 Levels
interface CategoryStructure {
  id: string;
  name: string;
  description?: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  main_categories: MainCategoryStructure[];
  created_at: Date;
  updated_at: Date;
}

interface MainCategoryStructure {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  sub_categories: SubCategoryStructure[];
  created_at: Date;
  updated_at: Date;
}

interface SubCategoryStructure {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  sub_sub_categories: SubSubCategoryStructure[];
  created_at: Date;
  updated_at: Date;
}

interface SubSubCategoryStructure {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  sub_sub_sub_categories: SubSubSubCategoryStructure[];
  created_at: Date;
  updated_at: Date;
}

interface SubSubSubCategoryStructure {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Color options for categories
const colorOptions = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Cyan', value: '#06B6D4' },
];

export default function CleanCategoryBuilder() {
  const [categories, setCategories] = useState<CategoryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingCategory, setEditingCategory] = useState<CategoryStructure | null>(null);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching categories from clean API...');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Categories fetched successfully:', data);
        setCategories(data.data || []);
      } else {
        console.error('❌ Failed to fetch categories:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData: {
    name: string;
    description?: string;
    color: string;
  }) => {
    try {
      console.log('📝 Creating new category:', categoryData);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Category created successfully:', result);
        await fetchCategories(); // Refresh the list
        setShowNewCategoryForm(false);
      } else {
        console.error('❌ Failed to create category:', response.status);
      }
    } catch (error) {
      console.error('❌ Error creating category:', error);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      console.log('🗑️ Deleting category:', categoryId);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories/${categoryId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Category deleted successfully');
        await fetchCategories(); // Refresh the list
      } else {
        console.error('❌ Failed to delete category:', response.status);
      }
    } catch (error) {
      console.error('❌ Error deleting category:', error);
    }
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-12 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl border-2 border-blue-100 shadow-lg">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4">
            <SwatchIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Clean Category Structure
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Build your 5-level category structure: Color → Main Category → Sub Category → Sub Sub Category → Sub Sub Sub Category
          </p>
        </div>
        <button
          onClick={() => setShowNewCategoryForm(true)}
          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-3 font-semibold mx-auto transform hover:-translate-y-1"
        >
          <PlusIcon className="w-6 h-6" />
          {categories.length === 0 ? 'Add Your First Color Category' : 'Add Color Category'}
        </button>
      </div>

      {/* Categories List */}
      <div className="space-y-6">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            isExpanded={expandedCategories.has(category.id)}
            onToggleExpansion={() => toggleCategoryExpansion(category.id)}
            onEdit={() => setEditingCategory(category)}
            onDelete={() => {
              if (confirm(`Delete "${category.name}" category? This will also delete all subcategories.`)) {
                deleteCategory(category.id);
              }
            }}
          />
        ))}
      </div>

      {/* New Category Form */}
      {showNewCategoryForm && (
        <NewCategoryForm
          onSave={createCategory}
          onCancel={() => setShowNewCategoryForm(false)}
        />
      )}

      {/* Category Editor */}
      {editingCategory && (
        <CategoryEditor
          category={editingCategory}
          onSave={async (updatedCategory) => {
            // Handle save logic here
            setEditingCategory(null);
            await fetchCategories();
          }}
          onCancel={() => setEditingCategory(null)}
        />
      )}
    </div>
  );
}

// Category Card Component
function CategoryCard({ 
  category, 
  isExpanded, 
  onToggleExpansion, 
  onEdit, 
  onDelete 
}: {
  category: CategoryStructure;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        {/* Color and Info */}
        <div 
          className="flex items-center gap-4 cursor-pointer flex-1 p-2 -m-2 rounded-lg hover:bg-gray-50 transition-colors"
          onClick={onToggleExpansion}
        >
          <div 
            className="w-8 h-8 rounded-full ring-4 ring-white shadow-lg"
            style={{ backgroundColor: category.color }}
          />
          <div>
            <h3 className="text-xl font-bold text-gray-900">{category.name}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {category.main_categories.length} main categories
            </p>
            {category.description && (
              <p className="text-sm text-gray-500 mt-1">{category.description}</p>
            )}
          </div>
          {category.main_categories.length > 0 && (
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
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
            title="Edit category"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onDelete}
            className="p-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
            title="Delete category"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-6 bg-blue-25 p-4 rounded-lg mt-4" style={{backgroundColor: `${category.color}10`}}>
          <MainCategoriesList mainCategories={category.main_categories} />
        </div>
      )}
    </div>
  );
}

// Main Categories List Component
function MainCategoriesList({ mainCategories }: { mainCategories: MainCategoryStructure[] }) {
  const [expandedMainCategories, setExpandedMainCategories] = useState<Set<string>>(new Set());

  const toggleMainCategoryExpansion = (mainCategoryId: string) => {
    const newExpanded = new Set(expandedMainCategories);
    if (newExpanded.has(mainCategoryId)) {
      newExpanded.delete(mainCategoryId);
    } else {
      newExpanded.add(mainCategoryId);
    }
    setExpandedMainCategories(newExpanded);
  };

  if (mainCategories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <TagIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>No main categories yet</p>
        <button className="mt-3 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
          <PlusIcon className="w-4 h-4 inline mr-2" />
          Add First Main Category
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900 mb-3">Main Categories</h4>
      {mainCategories.map((mainCategory) => (
        <div key={mainCategory.id} className="bg-white rounded-lg border border-gray-200 p-4">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleMainCategoryExpansion(mainCategory.id)}
          >
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="font-medium text-gray-900">{mainCategory.name}</span>
              <span className="text-sm text-gray-500">
                ({mainCategory.sub_categories.length} sub categories)
              </span>
            </div>
            {mainCategory.sub_categories.length > 0 && (
              <ChevronRightIcon 
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  expandedMainCategories.has(mainCategory.id) ? 'rotate-90' : ''
                }`}
              />
            )}
          </div>

          {expandedMainCategories.has(mainCategory.id) && (
            <div className="mt-4 ml-6 space-y-3">
              <SubCategoriesList subCategories={mainCategory.sub_categories} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Sub Categories List Component (and similar for deeper levels)
function SubCategoriesList({ subCategories }: { subCategories: SubCategoryStructure[] }) {
  if (subCategories.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400">
        <p className="text-sm">No sub categories yet</p>
        <button className="mt-2 text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">
          Add Sub Category
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h5 className="text-sm font-medium text-gray-700">Sub Categories</h5>
      {subCategories.map((subCategory) => (
        <div key={subCategory.id} className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>{subCategory.name}</span>
          <span className="text-xs text-gray-400">
            ({subCategory.sub_sub_categories.length} sub sub)
          </span>
        </div>
      ))}
    </div>
  );
}

// New Category Form Component
function NewCategoryForm({ 
  onSave, 
  onCancel 
}: {
  onSave: (data: { name: string; description?: string; color: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave({ name: name.trim(), description: description.trim() || undefined, color });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Create New Color Category</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Pool Fencing, Custom Glass"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of this category"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="grid grid-cols-5 gap-2">
              {colorOptions.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => setColor(colorOption.value)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 ${
                    color === colorOption.value 
                      ? 'border-gray-800 ring-2 ring-gray-300' 
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: colorOption.value }}
                  title={colorOption.name}
                >
                  {color === colorOption.value && (
                    <CheckIcon className="w-6 h-6 text-white mx-auto drop-shadow-lg" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Category Editor Component (simplified for now)
function CategoryEditor({ 
  category, 
  onSave, 
  onCancel 
}: {
  category: CategoryStructure;
  onSave: (category: CategoryStructure) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description || '');
  const [color, setColor] = useState(category.color);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Edit Category</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="grid grid-cols-5 gap-2">
              {colorOptions.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => setColor(colorOption.value)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 ${
                    color === colorOption.value 
                      ? 'border-gray-800 ring-2 ring-gray-300' 
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: colorOption.value }}
                  title={colorOption.name}
                >
                  {color === colorOption.value && (
                    <CheckIcon className="w-6 h-6 text-white mx-auto drop-shadow-lg" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave({ ...category, name, description, color })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}