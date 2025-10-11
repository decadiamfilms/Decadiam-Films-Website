import { useState, useEffect } from 'react';

export interface CategoryOption {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

export interface SubcategoryOption {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  categoryId: string;
  parentId?: string;
  level: number;
}

export function useCascadingCategories() {
  const [mainCategories, setMainCategories] = useState<CategoryOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [subSubcategories, setSubSubcategories] = useState<SubcategoryOption[]>([]);
  const [subSubSubcategories, setSubSubSubcategories] = useState<SubcategoryOption[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedSubSubcategory, setSelectedSubSubcategory] = useState<string>('');
  const [selectedSubSubSubcategory, setSelectedSubSubSubcategory] = useState<string>('');
  
  const [loading, setLoading] = useState(false);

  // Load main categories on mount
  useEffect(() => {
    loadMainCategories();
  }, []);

  // Load subcategories when main category changes
  useEffect(() => {
    if (selectedCategory) {
      loadSubcategories(selectedCategory);
    } else {
      setSubcategories([]);
      setSelectedSubcategory('');
    }
  }, [selectedCategory]);

  // Load sub-subcategories when subcategory changes
  useEffect(() => {
    if (selectedSubcategory) {
      loadSubSubcategories(selectedSubcategory);
    } else {
      setSubSubcategories([]);
      setSelectedSubSubcategory('');
    }
  }, [selectedSubcategory]);

  // Load sub-sub-subcategories when sub-subcategory changes
  useEffect(() => {
    if (selectedSubSubcategory) {
      loadSubSubSubcategories(selectedSubSubcategory);
    } else {
      setSubSubSubcategories([]);
      setSelectedSubSubSubcategory('');
    }
  }, [selectedSubSubcategory]);

  const loadMainCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      const data = await response.json();
      
      if (data.success) {
        const categories = data.data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          color: cat.color,
          isActive: cat.isActive
        }));
        setMainCategories(categories);
      }
    } catch (error) {
      console.error('Failed to load main categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubcategories = async (categoryId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      const data = await response.json();
      
      if (data.success) {
        const category = data.data.find((cat: any) => cat.id === categoryId);
        if (category && category.subcategories) {
          // Get only level 0 subcategories (direct children of main category)
          const level0Subs = category.subcategories
            .filter((sub: any) => sub.level === 0 && !sub.parent_id)
            .map((sub: any) => ({
              id: sub.id,
              name: sub.name,
              color: sub.color,
              isActive: sub.isVisible,
              categoryId: categoryId,
              level: sub.level
            }));
          setSubcategories(level0Subs);
        }
      }
    } catch (error) {
      console.error('Failed to load subcategories:', error);
      setSubcategories([]);
    }
  };

  const loadSubSubcategories = async (subcategoryId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      const data = await response.json();
      
      if (data.success) {
        // Find the subcategory and get its children
        let targetSubcategory = null;
        for (const category of data.data) {
          const found = findSubcategoryById(category.subcategories || [], subcategoryId);
          if (found) {
            targetSubcategory = found;
            break;
          }
        }
        
        if (targetSubcategory && targetSubcategory.children) {
          const children = targetSubcategory.children.map((child: any) => ({
            id: child.id,
            name: child.name,
            color: child.color,
            isActive: child.isVisible,
            categoryId: child.category_id,
            parentId: child.parent_id,
            level: child.level
          }));
          setSubSubcategories(children);
        } else {
          setSubSubcategories([]);
        }
      }
    } catch (error) {
      console.error('Failed to load sub-subcategories:', error);
      setSubSubcategories([]);
    }
  };

  const loadSubSubSubcategories = async (subSubcategoryId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      const data = await response.json();
      
      if (data.success) {
        // Find the sub-subcategory and get its children
        let targetSubSubcategory = null;
        for (const category of data.data) {
          const found = findSubcategoryById(category.subcategories || [], subSubcategoryId);
          if (found) {
            targetSubSubcategory = found;
            break;
          }
        }
        
        if (targetSubSubcategory && targetSubSubcategory.children) {
          const children = targetSubSubcategory.children.map((child: any) => ({
            id: child.id,
            name: child.name,
            color: child.color,
            isActive: child.isVisible,
            categoryId: child.category_id,
            parentId: child.parent_id,
            level: child.level
          }));
          setSubSubSubcategories(children);
        } else {
          setSubSubSubcategories([]);
        }
      }
    } catch (error) {
      console.error('Failed to load sub-sub-subcategories:', error);
      setSubSubSubcategories([]);
    }
  };

  // Helper function to find a subcategory by ID in nested structure
  const findSubcategoryById = (subcategories: any[], targetId: string): any => {
    for (const sub of subcategories) {
      if (sub.id === targetId) {
        return sub;
      }
      if (sub.children && sub.children.length > 0) {
        const found = findSubcategoryById(sub.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const handleMainCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory('');
    setSelectedSubSubcategory('');
    setSelectedSubSubSubcategory('');
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId);
    setSelectedSubSubcategory('');
    setSelectedSubSubSubcategory('');
  };

  const handleSubSubcategoryChange = (subSubcategoryId: string) => {
    setSelectedSubSubcategory(subSubcategoryId);
    setSelectedSubSubSubcategory('');
  };

  const handleSubSubSubcategoryChange = (subSubSubcategoryId: string) => {
    setSelectedSubSubSubcategory(subSubSubcategoryId);
  };

  const getSelectedPath = () => {
    const path = [];
    if (selectedCategory) {
      const category = mainCategories.find(c => c.id === selectedCategory);
      if (category) path.push(category.name);
    }
    if (selectedSubcategory) {
      const subcategory = subcategories.find(s => s.id === selectedSubcategory);
      if (subcategory) path.push(subcategory.name);
    }
    if (selectedSubSubcategory) {
      const subSubcategory = subSubcategories.find(s => s.id === selectedSubSubcategory);
      if (subSubcategory) path.push(subSubcategory.name);
    }
    if (selectedSubSubSubcategory) {
      const subSubSubcategory = subSubSubcategories.find(s => s.id === selectedSubSubSubcategory);
      if (subSubSubcategory) path.push(subSubSubcategory.name);
    }
    return path.join(' → ');
  };

  return {
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
    getSelectedPath,
    refresh: loadMainCategories
  };
}