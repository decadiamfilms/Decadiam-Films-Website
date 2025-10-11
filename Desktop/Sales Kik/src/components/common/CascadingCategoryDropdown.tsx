import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useCascadingCategories } from '../../hooks/useCascadingCategories';

interface CascadingCategoryDropdownProps {
  selectedCategoryId?: string;
  selectedSubcategoryId?: string;
  selectedSubSubcategoryId?: string;
  selectedSubSubSubcategoryId?: string;
  onCategoryChange: (categoryId: string, subcategoryId?: string, subSubcategoryId?: string, subSubSubcategoryId?: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const CascadingCategoryDropdown: React.FC<CascadingCategoryDropdownProps> = ({
  selectedCategoryId,
  selectedSubcategoryId,
  selectedSubSubcategoryId,
  selectedSubSubSubcategoryId,
  onCategoryChange,
  disabled = false,
  placeholder = "Select category..."
}) => {
  const {
    mainCategories,
    subcategories,
    subSubcategories,
    subSubSubcategories,
    selectedCategory,
    selectedSubcategory,
    selectedSubSubcategory,
    selectedSubSubSubcategory,
    loading,
    handleMainCategoryChange,
    handleSubcategoryChange,
    handleSubSubcategoryChange,
    handleSubSubSubcategoryChange,
    getSelectedPath
  } = useCascadingCategories();

  // Update hook state when props change
  React.useEffect(() => {
    if (selectedCategoryId !== selectedCategory) {
      handleMainCategoryChange(selectedCategoryId || '');
    }
  }, [selectedCategoryId]);

  React.useEffect(() => {
    if (selectedSubcategoryId !== selectedSubcategory) {
      handleSubcategoryChange(selectedSubcategoryId || '');
    }
  }, [selectedSubcategoryId]);

  React.useEffect(() => {
    if (selectedSubSubcategoryId !== selectedSubSubcategory) {
      handleSubSubcategoryChange(selectedSubSubcategoryId || '');
    }
  }, [selectedSubSubcategoryId]);

  React.useEffect(() => {
    if (selectedSubSubSubcategoryId !== selectedSubSubSubcategory) {
      handleSubSubSubcategoryChange(selectedSubSubSubcategoryId || '');
    }
  }, [selectedSubSubSubcategoryId]);

  const handleCategorySelect = (categoryId: string) => {
    handleMainCategoryChange(categoryId);
    onCategoryChange(categoryId, '', '', '');
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    handleSubcategoryChange(subcategoryId);
    onCategoryChange(selectedCategory, subcategoryId, '', '');
  };

  const handleSubSubcategorySelect = (subSubcategoryId: string) => {
    handleSubSubcategoryChange(subSubcategoryId);
    onCategoryChange(selectedCategory, selectedSubcategory, subSubcategoryId, '');
  };

  const handleSubSubSubcategorySelect = (subSubSubcategoryId: string) => {
    handleSubSubSubcategoryChange(subSubSubcategoryId);
    onCategoryChange(selectedCategory, selectedSubcategory, selectedSubSubcategory, subSubSubcategoryId);
  };

  if (loading) {
    return <div className="text-gray-500">Loading categories...</div>;
  }

  return (
    <div className="space-y-3">
      {/* Selected Path Display */}
      {getSelectedPath() && (
        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
          <strong>Selected:</strong> {getSelectedPath()}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Main Category Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Main Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => handleCategorySelect(e.target.value)}
            disabled={disabled}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
          >
            <option value="">Select main category...</option>
            {mainCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subcategory
          </label>
          <select
            value={selectedSubcategory}
            onChange={(e) => handleSubcategorySelect(e.target.value)}
            disabled={disabled || !selectedCategory || subcategories.length === 0}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white disabled:bg-gray-100"
          >
            <option value="">Select subcategory...</option>
            {subcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sub-Subcategory Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sub-Subcategory
          </label>
          <select
            value={selectedSubSubcategory}
            onChange={(e) => handleSubSubcategorySelect(e.target.value)}
            disabled={disabled || !selectedSubcategory || subSubcategories.length === 0}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white disabled:bg-gray-100"
          >
            <option value="">Select sub-subcategory...</option>
            {subSubcategories.map((subSubcategory) => (
              <option key={subSubcategory.id} value={subSubcategory.id}>
                {subSubcategory.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sub-Sub-Subcategory Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sub-Sub-Subcategory
          </label>
          <select
            value={selectedSubSubSubcategory}
            onChange={(e) => handleSubSubSubcategorySelect(e.target.value)}
            disabled={disabled || !selectedSubSubcategory || subSubSubcategories.length === 0}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white disabled:bg-gray-100"
          >
            <option value="">Select final subcategory...</option>
            {subSubSubcategories.map((subSubSubcategory) => (
              <option key={subSubSubcategory.id} value={subSubSubcategory.id}>
                {subSubSubcategory.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default CascadingCategoryDropdown;