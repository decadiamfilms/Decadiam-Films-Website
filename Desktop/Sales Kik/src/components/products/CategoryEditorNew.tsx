import React, { useState } from 'react';
import { 
  PlusIcon, XMarkIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon,
  FolderIcon, DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { useCategories, Category, SubCategory, SubSubCategory } from '../../hooks/useCategories';

const CategoryEditorNew: React.FC = () => {
  const {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory,
    createSubSubCategory,
    updateSubSubCategory,
    deleteSubSubCategory,
  } = useCategories();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<string | null>(null);
  const [editingSubSubCategory, setEditingSubSubCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const [newSubSubCategoryName, setNewSubSubCategoryName] = useState('');

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleSubCategory = (subCategoryId: string) => {
    const newExpanded = new Set(expandedSubCategories);
    if (newExpanded.has(subCategoryId)) {
      newExpanded.delete(subCategoryId);
    } else {
      newExpanded.add(subCategoryId);
    }
    setExpandedSubCategories(newExpanded);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      await createCategory({ name: newCategoryName.trim() });
      setNewCategoryName('');
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleCreateSubCategory = async (categoryId: string) => {
    if (!newSubCategoryName.trim()) return;
    
    try {
      await createSubCategory(categoryId, { name: newSubCategoryName.trim() });
      setNewSubCategoryName('');
    } catch (error) {
      console.error('Failed to create sub-category:', error);
    }
  };

  const handleCreateSubSubCategory = async (subCategoryId: string) => {
    if (!newSubSubCategoryName.trim()) return;
    
    try {
      await createSubSubCategory(subCategoryId, { name: newSubSubCategoryName.trim() });
      setNewSubSubCategoryName('');
    } catch (error) {
      console.error('Failed to create sub-sub-category:', error);
    }
  };

  const handleUpdateCategory = async (categoryId: string, name: string) => {
    try {
      await updateCategory(categoryId, { name });
      setEditingCategory(null);
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleUpdateSubCategory = async (subCategoryId: string, name: string) => {
    try {
      await updateSubCategory(subCategoryId, { name });
      setEditingSubCategory(null);
    } catch (error) {
      console.error('Failed to update sub-category:', error);
    }
  };

  const handleUpdateSubSubCategory = async (subSubCategoryId: string, name: string) => {
    try {
      await updateSubSubCategory(subSubCategoryId, { name });
      setEditingSubSubCategory(null);
    } catch (error) {
      console.error('Failed to update sub-sub-category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category? This will also delete all sub-categories and sub-sub-categories.')) {
      try {
        await deleteCategory(categoryId);
      } catch (error) {
        console.error('Failed to delete category:', error);
      }
    }
  };

  const handleDeleteSubCategory = async (subCategoryId: string) => {
    if (window.confirm('Are you sure you want to delete this sub-category? This will also delete all sub-sub-categories.')) {
      try {
        await deleteSubCategory(subCategoryId);
      } catch (error) {
        console.error('Failed to delete sub-category:', error);
      }
    }
  };

  const handleDeleteSubSubCategory = async (subSubCategoryId: string) => {
    if (window.confirm('Are you sure you want to delete this sub-sub-category?')) {
      try {
        await deleteSubSubCategory(subSubCategoryId);
      } catch (error) {
        console.error('Failed to delete sub-sub-category:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading categories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-700">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Category Management</h3>
          <div className="text-sm text-gray-500">
            {categories.length} main categories
          </div>
        </div>

        {/* Add New Main Category */}
        <div className="mb-6 flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Add new main category..."
            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
          />
          <button
            onClick={handleCreateCategory}
            disabled={!newCategoryName.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Category
          </button>
        </div>

        {/* Category Tree */}
        <div className="space-y-2">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isExpanded={expandedCategories.has(category.id)}
              onToggle={() => toggleCategory(category.id)}
              onEdit={(name) => handleUpdateCategory(category.id, name)}
              onDelete={() => handleDeleteCategory(category.id)}
              isEditing={editingCategory === category.id}
              setIsEditing={(editing) => setEditingCategory(editing ? category.id : null)}
              expandedSubCategories={expandedSubCategories}
              onToggleSubCategory={toggleSubCategory}
              onCreateSubCategory={handleCreateSubCategory}
              onUpdateSubCategory={handleUpdateSubCategory}
              onDeleteSubCategory={handleDeleteSubCategory}
              onCreateSubSubCategory={handleCreateSubSubCategory}
              onUpdateSubSubCategory={handleUpdateSubSubCategory}
              onDeleteSubSubCategory={handleDeleteSubSubCategory}
              editingSubCategory={editingSubCategory}
              setEditingSubCategory={setEditingSubCategory}
              editingSubSubCategory={editingSubSubCategory}
              setEditingSubSubCategory={setEditingSubSubCategory}
              newSubCategoryName={newSubCategoryName}
              setNewSubCategoryName={setNewSubCategoryName}
              newSubSubCategoryName={newSubSubCategoryName}
              setNewSubSubCategoryName={setNewSubSubCategoryName}
            />
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <FolderIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No categories yet. Add your first category above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface CategoryCardProps {
  category: Category;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (name: string) => void;
  onDelete: () => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  expandedSubCategories: Set<string>;
  onToggleSubCategory: (subCategoryId: string) => void;
  onCreateSubCategory: (categoryId: string) => void;
  onUpdateSubCategory: (subCategoryId: string, name: string) => void;
  onDeleteSubCategory: (subCategoryId: string) => void;
  onCreateSubSubCategory: (subCategoryId: string) => void;
  onUpdateSubSubCategory: (subSubCategoryId: string, name: string) => void;
  onDeleteSubSubCategory: (subSubCategoryId: string) => void;
  editingSubCategory: string | null;
  setEditingSubCategory: (id: string | null) => void;
  editingSubSubCategory: string | null;
  setEditingSubSubCategory: (id: string | null) => void;
  newSubCategoryName: string;
  setNewSubCategoryName: (name: string) => void;
  newSubSubCategoryName: string;
  setNewSubSubCategoryName: (name: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  isEditing,
  setIsEditing,
  expandedSubCategories,
  onToggleSubCategory,
  onCreateSubCategory,
  onUpdateSubCategory,
  onDeleteSubCategory,
  onCreateSubSubCategory,
  onUpdateSubSubCategory,
  onDeleteSubSubCategory,
  editingSubCategory,
  setEditingSubCategory,
  editingSubSubCategory,
  setEditingSubSubCategory,
  newSubCategoryName,
  setNewSubCategoryName,
  newSubSubCategoryName,
  setNewSubSubCategoryName,
}) => {
  const [editName, setEditName] = useState(category.name);

  const handleSave = () => {
    if (editName.trim() && editName !== category.name) {
      onEdit(editName.trim());
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(category.name);
    setIsEditing(false);
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Main Category Header */}
      <div className="flex items-center gap-2 p-4 bg-gray-50">
        <button onClick={onToggle} className="text-gray-500 hover:text-gray-700">
          {isExpanded ? (
            <ChevronDownIcon className="w-4 h-4" />
          ) : (
            <ChevronRightIcon className="w-4 h-4" />
          )}
        </button>
        
        <FolderIcon className="w-5 h-5 text-blue-600" />
        
        {isEditing ? (
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-2 py-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <button
              onClick={handleSave}
              className="text-green-600 hover:text-green-700"
            >
              <CheckIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-between">
            <span 
              className="font-medium text-gray-900 cursor-pointer"
              onClick={() => setIsEditing(true)}
            >
              {category.name}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {category._count.subCategories} sub-categories, {category._count.products} products
              </span>
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-500 hover:text-gray-700"
              >
                Edit
              </button>
              <button
                onClick={onDelete}
                className="text-red-500 hover:text-red-700"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sub Categories */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Add New Sub Category */}
          <div className="flex gap-2 ml-6">
            <input
              type="text"
              value={newSubCategoryName}
              onChange={(e) => setNewSubCategoryName(e.target.value)}
              placeholder="Add new sub-category..."
              className="flex-1 border border-gray-300 rounded-md px-3 py-2"
              onKeyPress={(e) => e.key === 'Enter' && onCreateSubCategory(category.id)}
            />
            <button
              onClick={() => onCreateSubCategory(category.id)}
              disabled={!newSubCategoryName.trim()}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Sub
            </button>
          </div>

          {/* Sub Category List */}
          {category.subCategories.map((subCategory) => (
            <SubCategoryCard
              key={subCategory.id}
              subCategory={subCategory}
              isExpanded={expandedSubCategories.has(subCategory.id)}
              onToggle={() => onToggleSubCategory(subCategory.id)}
              onEdit={(name) => onUpdateSubCategory(subCategory.id, name)}
              onDelete={() => onDeleteSubCategory(subCategory.id)}
              isEditing={editingSubCategory === subCategory.id}
              setIsEditing={(editing) => setEditingSubCategory(editing ? subCategory.id : null)}
              onCreateSubSubCategory={onCreateSubSubCategory}
              onUpdateSubSubCategory={onUpdateSubSubCategory}
              onDeleteSubSubCategory={onDeleteSubSubCategory}
              editingSubSubCategory={editingSubSubCategory}
              setEditingSubSubCategory={setEditingSubSubCategory}
              newSubSubCategoryName={newSubSubCategoryName}
              setNewSubSubCategoryName={setNewSubSubCategoryName}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface SubCategoryCardProps {
  subCategory: SubCategory;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (name: string) => void;
  onDelete: () => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  onCreateSubSubCategory: (subCategoryId: string) => void;
  onUpdateSubSubCategory: (subSubCategoryId: string, name: string) => void;
  onDeleteSubSubCategory: (subSubCategoryId: string) => void;
  editingSubSubCategory: string | null;
  setEditingSubSubCategory: (id: string | null) => void;
  newSubSubCategoryName: string;
  setNewSubSubCategoryName: (name: string) => void;
}

const SubCategoryCard: React.FC<SubCategoryCardProps> = ({
  subCategory,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  isEditing,
  setIsEditing,
  onCreateSubSubCategory,
  onUpdateSubSubCategory,
  onDeleteSubSubCategory,
  editingSubSubCategory,
  setEditingSubSubCategory,
  newSubSubCategoryName,
  setNewSubSubCategoryName,
}) => {
  const [editName, setEditName] = useState(subCategory.name);

  const handleSave = () => {
    if (editName.trim() && editName !== subCategory.name) {
      onEdit(editName.trim());
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(subCategory.name);
    setIsEditing(false);
  };

  return (
    <div className="ml-6 border border-gray-200 rounded-lg">
      {/* Sub Category Header */}
      <div className="flex items-center gap-2 p-3 bg-blue-50">
        <button onClick={onToggle} className="text-gray-500 hover:text-gray-700">
          {isExpanded ? (
            <ChevronDownIcon className="w-4 h-4" />
          ) : (
            <ChevronRightIcon className="w-4 h-4" />
          )}
        </button>
        
        <FolderIcon className="w-4 h-4 text-green-600" />
        
        {isEditing ? (
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-2 py-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <button
              onClick={handleSave}
              className="text-green-600 hover:text-green-700"
            >
              <CheckIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-between">
            <span 
              className="font-medium text-gray-800 cursor-pointer"
              onClick={() => setIsEditing(true)}
            >
              {subCategory.name}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {subCategory._count.subSubCategories} sub-sub-categories, {subCategory._count.products} products
              </span>
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-500 hover:text-gray-700"
              >
                Edit
              </button>
              <button
                onClick={onDelete}
                className="text-red-500 hover:text-red-700"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sub-Sub Categories */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Add New Sub-Sub Category */}
          <div className="flex gap-2 ml-6">
            <input
              type="text"
              value={newSubSubCategoryName}
              onChange={(e) => setNewSubSubCategoryName(e.target.value)}
              placeholder="Add new sub-sub-category..."
              className="flex-1 border border-gray-300 rounded-md px-3 py-2"
              onKeyPress={(e) => e.key === 'Enter' && onCreateSubSubCategory(subCategory.id)}
            />
            <button
              onClick={() => onCreateSubSubCategory(subCategory.id)}
              disabled={!newSubSubCategoryName.trim()}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Sub-Sub
            </button>
          </div>

          {/* Sub-Sub Category List */}
          {subCategory.subSubCategories.map((subSubCategory) => (
            <SubSubCategoryCard
              key={subSubCategory.id}
              subSubCategory={subSubCategory}
              onEdit={(name) => onUpdateSubSubCategory(subSubCategory.id, name)}
              onDelete={() => onDeleteSubSubCategory(subSubCategory.id)}
              isEditing={editingSubSubCategory === subSubCategory.id}
              setIsEditing={(editing) => setEditingSubSubCategory(editing ? subSubCategory.id : null)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface SubSubCategoryCardProps {
  subSubCategory: SubSubCategory;
  onEdit: (name: string) => void;
  onDelete: () => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
}

const SubSubCategoryCard: React.FC<SubSubCategoryCardProps> = ({
  subSubCategory,
  onEdit,
  onDelete,
  isEditing,
  setIsEditing,
}) => {
  const [editName, setEditName] = useState(subSubCategory.name);

  const handleSave = () => {
    if (editName.trim() && editName !== subSubCategory.name) {
      onEdit(editName.trim());
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(subSubCategory.name);
    setIsEditing(false);
  };

  return (
    <div className="ml-6 flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
      <FolderIcon className="w-4 h-4 text-purple-600" />
      
      {isEditing ? (
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-2 py-1"
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
          <button
            onClick={handleSave}
            className="text-green-600 hover:text-green-700"
          >
            <CheckIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-between">
          <span 
            className="font-medium text-gray-800 cursor-pointer"
            onClick={() => setIsEditing(true)}
          >
            {subSubCategory.name}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {subSubCategory._count.products} products
            </span>
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="text-red-500 hover:text-red-700"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryEditorNew;