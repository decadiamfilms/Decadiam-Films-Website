import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCategoryData {
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
}

export interface CreateSubCategoryData {
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  categoryId: string;
  parentId?: string;
  level?: number;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// Frontend interfaces that map to database structure
export interface FrontendSubcategory {
  id: string;
  name: string;
  categoryId: string;
  parentId?: string;
  color: string;
  isVisible: boolean;
  sortOrder: number;
  level: number;
  options: any[];
  linkedFinalProducts: string[];
  isShared?: boolean;
  sharedLibraryId?: string;
}

export interface FrontendCategory {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  isStructureComplete: boolean;
  subcategories: FrontendSubcategory[];
  specialItems: any[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CategoryService {
  
  // ===== MAIN CATEGORIES =====
  
  async getCategories(companyId: string) {
    try {
      console.log('🔍 CategoryService: Loading categories for company:', companyId);
      
      // Get categories with their simple subcategories using the new table
      const categories = await prisma.category.findMany({
        where: { 
          company_id: companyId,
          is_active: true 
        },
        include: {
          subcategories: {
            where: { is_visible: true },
            orderBy: [
              { level: 'asc' },
              { sort_order: 'asc' }
            ]
          }
        },
        orderBy: { sort_order: 'asc' }
      });

      console.log('📋 CategoryService: Raw categories from database:', categories.length);

      // Transform to frontend format - much simpler now!
      const frontendCategories: FrontendCategory[] = categories.map(category => {
        console.log(`🔍 Processing category: ${category.name} with ${category.subcategories.length} subcategories`);
        
        // Direct mapping from new subcategory table
        const subcategories: FrontendSubcategory[] = category.subcategories.map(sub => ({
          id: sub.id,
          name: sub.name,
          categoryId: category.id,
          parentId: sub.parent_id || undefined,
          color: sub.color,
          isVisible: sub.is_visible,
          sortOrder: sub.sort_order,
          level: sub.level,
          options: sub.options ? JSON.parse(sub.options as string) : [],
          linkedFinalProducts: sub.linked_products ? JSON.parse(sub.linked_products as string) : []
        }));

        return {
          id: category.id,
          name: category.name,
          color: category.color,
          isActive: category.is_active,
          isStructureComplete: false, // Will be calculated based on content
          subcategories: subcategories,
          specialItems: [],
          createdBy: 'database',
          createdAt: category.created_at,
          updatedAt: category.updated_at
        };
      });

      console.log('✅ CategoryService: Transformed categories:', frontendCategories.length);
      console.log('📝 Categories with subcategories:', frontendCategories.map(c => 
        `${c.name} (${c.subcategories.length} subs)`
      ).join(', '));

      return frontendCategories;
    } catch (error) {
      console.error('❌ CategoryService: Error loading categories:', error);
      throw error;
    }
  }

  async createCategory(companyId: string, data: CreateCategoryData) {
    try {
      console.log('💾 CategoryService: Creating category:', data.name);
      
      const category = await prisma.category.create({
        data: {
          name: data.name,
          description: data.description,
          color: data.color || '#3B82F6',
          sort_order: data.sortOrder || 0,
          company_id: companyId,
          is_active: true
        },
      });

      console.log('✅ CategoryService: Category created:', category.id);
      return category;
    } catch (error) {
      console.error('❌ CategoryService: Error creating category:', error);
      throw error;
    }
  }

  async updateCategory(categoryId: string, companyId: string, data: UpdateCategoryData) {
    try {
      console.log('🔄 CategoryService: Updating category:', categoryId);
      
      const category = await prisma.category.update({
        where: { 
          id: categoryId,
          company_id: companyId 
        },
        data: {
          name: data.name,
          description: data.description,
          color: data.color,
          sort_order: data.sortOrder,
          is_active: data.isActive
        }
      });

      console.log('✅ CategoryService: Category updated:', category.id);
      return category;
    } catch (error) {
      console.error('❌ CategoryService: Error updating category:', error);
      throw error;
    }
  }

  async deleteCategory(categoryId: string, companyId: string) {
    try {
      console.log('🗑️ CategoryService: Deleting category:', categoryId);
      
      // Soft delete by setting is_active to false
      await prisma.category.update({
        where: { 
          id: categoryId,
          company_id: companyId 
        },
        data: { is_active: false }
      });

      console.log('✅ CategoryService: Category deleted:', categoryId);
      return { success: true, message: 'Category deleted successfully' };
    } catch (error) {
      console.error('❌ CategoryService: Error deleting category:', error);
      throw error;
    }
  }

  // ===== SIMPLIFIED SUBCATEGORY OPERATIONS =====

  async saveCategoryStructure(companyId: string, frontendCategory: FrontendCategory) {
    try {
      console.log('💾 CategoryService: Saving complete category structure:', frontendCategory.name);
      console.log('📂 Subcategories to save:', frontendCategory.subcategories.length);

      // Update the main category
      await this.updateCategory(frontendCategory.id, companyId, {
        name: frontendCategory.name,
        color: frontendCategory.color,
        isActive: frontendCategory.isActive
      });

      // Clear existing subcategories for this category
      await prisma.subcategory.deleteMany({
        where: { category_id: frontendCategory.id }
      });
      console.log('🧹 Cleared existing subcategories');

      // Create all subcategories using the new simple table
      for (const subcategory of frontendCategory.subcategories) {
        try {
          console.log(`💾 Saving subcategory: ${subcategory.name} with color: ${subcategory.color}`);
          
          await prisma.subcategory.create({
            data: {
              id: subcategory.id, // Use frontend ID for consistency
              name: subcategory.name,
              description: '',
              color: subcategory.color,
              category_id: frontendCategory.id,
              parent_id: subcategory.parentId,
              level: subcategory.level,
              sort_order: subcategory.sortOrder,
              is_visible: subcategory.isVisible,
              options: JSON.stringify(subcategory.options || []),
              linked_products: JSON.stringify(subcategory.linkedFinalProducts || [])
            }
          });
          
          console.log(`✅ Saved subcategory: ${subcategory.name} (Level ${subcategory.level}) Color: ${subcategory.color}`);
        } catch (error) {
          console.error(`❌ Error saving subcategory ${subcategory.name}:`, error);
          // Continue with other subcategories even if one fails
        }
      }

      console.log('✅ CategoryService: Complete category structure saved successfully');
      return { success: true, message: 'Category structure saved successfully' };
    } catch (error) {
      console.error('❌ CategoryService: Error saving category structure:', error);
      throw error;
    }
  }

  // ===== UTILITY METHODS =====
  
  async getCategoryHierarchy(companyId: string) {
    return await this.getCategories(companyId);
  }

  async moveCategoryOrder(categoryId: string, companyId: string, newSortOrder: number) {
    return await this.updateCategory(categoryId, companyId, { sortOrder: newSortOrder });
  }
}