import { useState, useEffect } from 'react';

export interface Category {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
  subCategories: SubCategory[];
  _count: {
    products: number;
    subCategories: number;
  };
}

export interface SubCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  category_id: string;
  created_at: string;
  updated_at: string;
  subSubCategories: SubSubCategory[];
  _count: {
    products: number;
    subSubCategories: number;
  };
}

export interface SubSubCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  sub_category_id: string;
  created_at: string;
  updated_at: string;
  _count: {
    products: number;
  };
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface CreateSubCategoryData {
  name: string;
  description?: string;
  sortOrder?: number;
  categoryId: string;
}

export interface CreateSubSubCategoryData {
  name: string;
  description?: string;
  sortOrder?: number;
  subCategoryId: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data);
      } else {
        setError(data.error || 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData: CreateCategoryData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchCategories(); // Refresh the list
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Failed to create category:', error);
      throw error;
    }
  };

  const updateCategory = async (categoryId: string, categoryData: Partial<CreateCategoryData>) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchCategories(); // Refresh the list
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories/${categoryId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchCategories(); // Refresh the list
        return data;
      } else {
        throw new Error(data.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  };

  const createSubCategory = async (categoryId: string, subCategoryData: Omit<CreateSubCategoryData, 'categoryId'>) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories/${categoryId}/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subCategoryData)
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchCategories(); // Refresh the list
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to create sub-category');
      }
    } catch (error) {
      console.error('Failed to create sub-category:', error);
      throw error;
    }
  };

  const updateSubCategory = async (subCategoryId: string, subCategoryData: Partial<CreateSubCategoryData>) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories/subcategories/${subCategoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subCategoryData)
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchCategories(); // Refresh the list
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to update sub-category');
      }
    } catch (error) {
      console.error('Failed to update sub-category:', error);
      throw error;
    }
  };

  const deleteSubCategory = async (subCategoryId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories/subcategories/${subCategoryId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchCategories(); // Refresh the list
        return data;
      } else {
        throw new Error(data.error || 'Failed to delete sub-category');
      }
    } catch (error) {
      console.error('Failed to delete sub-category:', error);
      throw error;
    }
  };

  const createSubSubCategory = async (subCategoryId: string, subSubCategoryData: Omit<CreateSubSubCategoryData, 'subCategoryId'>) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories/subcategories/${subCategoryId}/subsubcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subSubCategoryData)
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchCategories(); // Refresh the list
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to create sub-sub-category');
      }
    } catch (error) {
      console.error('Failed to create sub-sub-category:', error);
      throw error;
    }
  };

  const updateSubSubCategory = async (subSubCategoryId: string, subSubCategoryData: Partial<CreateSubSubCategoryData>) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories/subsubcategories/${subSubCategoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subSubCategoryData)
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchCategories(); // Refresh the list
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to update sub-sub-category');
      }
    } catch (error) {
      console.error('Failed to update sub-sub-category:', error);
      throw error;
    }
  };

  const deleteSubSubCategory = async (subSubCategoryId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories/subsubcategories/${subSubCategoryId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchCategories(); // Refresh the list
        return data;
      } else {
        throw new Error(data.error || 'Failed to delete sub-sub-category');
      }
    } catch (error) {
      console.error('Failed to delete sub-sub-category:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory,
    createSubSubCategory,
    updateSubSubCategory,
    deleteSubSubCategory,
  };
}