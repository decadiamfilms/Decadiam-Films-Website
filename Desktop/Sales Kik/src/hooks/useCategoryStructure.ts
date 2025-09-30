import { useState, useEffect } from 'react';

interface CategoryColumn {
  id: string;
  title: string;
  description: string;
  isRequired: boolean;
  items: CategoryItem[];
  order: number;
}

interface CategoryItem {
  id: string;
  label: string;
  value: string;
  isActive: boolean;
  order: number;
  parentValue?: string;
}

interface CategoryStructure {
  id: string;
  name: string;
  columns: CategoryColumn[];
  isActive: boolean;
}

export function useCategoryStructure() {
  const [categoryStructure, setCategoryStructure] = useState<CategoryStructure>({
    id: 'default',
    name: 'Default Structure',
    isActive: true,
    columns: []
  });
  const [loading, setLoading] = useState(true);

  const fetchStructure = async () => {
    try {
      const response = await fetch('/api/category/structure');
      const data = await response.json();
      setCategoryStructure(data);
    } catch (error) {
      console.error('Failed to fetch category structure:', error);
      // Fallback to default structure
      setCategoryStructure({
        id: 'default',
        name: 'Default Structure',
        isActive: true,
        columns: [
          {
            id: '1',
            title: 'Category',
            description: 'Main product category',
            isRequired: true,
            order: 1,
            items: [
              { id: '1', label: 'Pool Fencing', value: 'pool-fencing', isActive: true, order: 1 },
              { id: '2', label: 'Shower Screens', value: 'shower-screens', isActive: true, order: 2 },
              { id: '3', label: 'Hardware', value: 'hardware', isActive: true, order: 3 }
            ]
          },
          {
            id: '2',
            title: 'Sub Category',
            description: 'Product specifications',
            isRequired: false,
            order: 2,
            items: [
              { id: '4', label: 'Frameless', value: 'frameless', isActive: true, order: 1, parentValue: 'pool-fencing' },
              { id: '5', label: 'Semi-Frameless', value: 'semi-frameless', isActive: true, order: 2, parentValue: 'pool-fencing' },
              { id: '6', label: 'Fixed Panels', value: 'fixed-panels', isActive: true, order: 3, parentValue: 'shower-screens' }
            ]
          },
          {
            id: '3',
            title: 'Product Type',
            description: 'Specific product type',
            isRequired: false,
            order: 3,
            items: [
              { id: '7', label: 'Spring Hinge Panels', value: 'spring-hinge-panels', isActive: true, order: 1, parentValue: 'frameless' },
              { id: '8', label: 'Fixed Panels', value: 'fixed-panels-type', isActive: true, order: 2, parentValue: 'frameless' }
            ]
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshStructure = () => {
    fetchStructure();
  };

  const saveStructure = async (structure: CategoryStructure) => {
    try {
      await fetch('/api/category/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(structure)
      });
      setCategoryStructure(structure);
    } catch (error) {
      console.error('Failed to save category structure:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchStructure();
  }, []);

  return {
    categoryStructure,
    loading,
    refreshStructure,
    saveStructure
  };
}