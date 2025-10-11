import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCategoryData {
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
}

export interface CreateSubcategoryData {
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  level?: number;
  parentId?: string; // For nested subcategories
  categoryId: string;
}

export interface CreateSubcategoryOptionData {
  label: string;
  value: string;
  sortOrder?: number;
  subcategoryId: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export class CategoryServiceNew {
  // Main Categories - Load ALL subcategories (not just top-level ones)
  async getCategories(companyId: string) {
    const categories = await prisma.category.findMany({
      where: { 
        company_id: companyId,
        isActive: true 
      },
      include: {
        subcategories: {
          where: { isVisible: true },
          include: {
            options: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' }
            }
          },
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: {
            products: true,
            subcategories: true
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    // Build the nested structure manually since Prisma has limitations with deep nesting
    const categoriesWithNesting = categories.map(category => {
      // Get all subcategories for this category
      const allSubcategories = category.subcategories;
      
      // Build nested structure: attach children to their parents
      const subcategoryMap = new Map();
      const topLevelSubcategories: any[] = [];

      // First pass: create the map and identify top-level subcategories
      allSubcategories.forEach(sub => {
        subcategoryMap.set(sub.id, { ...sub, children: [] });
        if (!sub.parent_id) {
          topLevelSubcategories.push(subcategoryMap.get(sub.id));
        }
      });

      // Second pass: attach children to parents
      allSubcategories.forEach(sub => {
        if (sub.parent_id && subcategoryMap.has(sub.parent_id)) {
          const parent = subcategoryMap.get(sub.parent_id);
          parent.children.push(subcategoryMap.get(sub.id));
        }
      });

      return {
        ...category,
        subcategories: topLevelSubcategories
      };
    });

    return categoriesWithNesting;
  }

  async createCategory(companyId: string, data: CreateCategoryData) {
    return await prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color || '#3B82F6',
        sortOrder: data.sortOrder || 0,
        company_id: companyId,
        isActive: true
      },
      include: {
        subcategories: {
          include: {
            options: true,
            children: {
              include: {
                options: true
              }
            }
          }
        },
        _count: {
          select: {
            products: true,
            subcategories: true
          }
        }
      }
    });
  }

  async updateCategory(categoryId: string, companyId: string, data: UpdateCategoryData) {
    return await prisma.category.update({
      where: { 
        id: categoryId,
        company_id: companyId 
      },
      data,
      include: {
        subcategories: {
          include: {
            options: true,
            children: {
              include: {
                options: true
              }
            }
          }
        },
        _count: {
          select: {
            products: true,
            subcategories: true
          }
        }
      }
    });
  }

  async deleteCategory(categoryId: string, companyId: string) {
    await prisma.category.update({
      where: { 
        id: categoryId,
        company_id: companyId 
      },
      data: { isActive: false }
    });

    return { success: true, message: 'Category deleted successfully' };
  }

  // Subcategories (with nested structure using parentId)
  async createSubcategory(companyId: string, data: CreateSubcategoryData) {
    // Verify the parent category belongs to the company
    const category = await prisma.category.findFirst({
      where: { 
        id: data.categoryId,
        company_id: companyId 
      }
    });

    if (!category) {
      throw new Error('Category not found or does not belong to your company');
    }

    // If parentId is provided, verify it exists and belongs to the same category
    if (data.parentId) {
      const parentSubcategory = await prisma.subcategory.findFirst({
        where: {
          id: data.parentId,
          category_id: data.categoryId
        }
      });

      if (!parentSubcategory) {
        throw new Error('Parent subcategory not found or does not belong to the same category');
      }
    }

    return await prisma.subcategory.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color || '#10B981',
        sortOrder: data.sortOrder || 0,
        level: data.level || 0,
        category_id: data.categoryId,
        parent_id: data.parentId,
        isVisible: true
      },
      include: {
        options: true,
        children: {
          include: {
            options: true
          }
        },
        _count: {
          select: {
            options: true,
            children: true
          }
        }
      }
    });
  }

  async updateSubcategory(subcategoryId: string, companyId: string, data: UpdateCategoryData) {
    return await prisma.subcategory.update({
      where: { 
        id: subcategoryId,
        category: {
          company_id: companyId
        }
      },
      data,
      include: {
        options: true,
        children: {
          include: {
            options: true
          }
        }
      }
    });
  }

  async deleteSubcategory(subcategoryId: string, companyId: string) {
    await prisma.subcategory.update({
      where: { 
        id: subcategoryId,
        category: {
          company_id: companyId
        }
      },
      data: { isVisible: false }
    });

    return { success: true, message: 'Subcategory deleted successfully' };
  }

  // Subcategory Options
  async createSubcategoryOption(companyId: string, data: CreateSubcategoryOptionData) {
    // Verify the subcategory belongs to the company
    const subcategory = await prisma.subcategory.findFirst({
      where: { 
        id: data.subcategoryId,
        category: {
          company_id: companyId
        }
      }
    });

    if (!subcategory) {
      throw new Error('Subcategory not found or does not belong to your company');
    }

    return await prisma.subcategoryOption.create({
      data: {
        label: data.label,
        value: data.value,
        sortOrder: data.sortOrder || 0,
        subcategory_id: data.subcategoryId,
        isActive: true
      }
    });
  }

  async updateSubcategoryOption(optionId: string, companyId: string, data: Partial<CreateSubcategoryOptionData>) {
    return await prisma.subcategoryOption.update({
      where: { 
        id: optionId,
        subcategory: {
          category: {
            company_id: companyId
          }
        }
      },
      data
    });
  }

  async deleteSubcategoryOption(optionId: string, companyId: string) {
    await prisma.subcategoryOption.update({
      where: { 
        id: optionId,
        subcategory: {
          category: {
            company_id: companyId
          }
        }
      },
      data: { isActive: false }
    });

    return { success: true, message: 'Subcategory option deleted successfully' };
  }

  // Save complete category structure (matching frontend format)
  async saveCategoryStructure(companyId: string, categoryData: any) {
    // First, delete existing category if it exists to avoid duplicates
    if (categoryData.id) {
      try {
        await this.deleteCategory(categoryData.id, companyId);
      } catch (error) {
        console.log('Category not found for deletion, creating new one');
      }
    }

    // Save main category
    const category = await this.createCategory(companyId, {
      name: categoryData.name,
      color: categoryData.color,
      description: categoryData.description || 'Category created from editor'
    });

    // Map old subcategory IDs to new database IDs
    const subcategoryIdMap = new Map<string, string>();

    // Sort subcategories by level to ensure parents are created before children
    const sortedSubcategories = (categoryData.subcategories || []).sort((a: any, b: any) => a.level - b.level);

    // Save all subcategories in level order
    for (const subcategory of sortedSubcategories) {
      // Map parentId to new database ID if it exists
      let parentId: string | undefined = undefined;
      if (subcategory.parentId && subcategoryIdMap.has(subcategory.parentId)) {
        parentId = subcategoryIdMap.get(subcategory.parentId);
      }

      const savedSubcategory = await this.createSubcategory(companyId, {
        name: subcategory.name,
        color: subcategory.color,
        level: subcategory.level,
        parentId: parentId,
        categoryId: category.id,
        sortOrder: subcategory.sortOrder
      });

      // Store mapping for child subcategories
      subcategoryIdMap.set(subcategory.id, savedSubcategory.id);

      // Save subcategory options
      for (const option of subcategory.options || []) {
        await this.createSubcategoryOption(companyId, {
          label: option.label,
          value: option.value,
          sortOrder: option.sortOrder,
          subcategoryId: savedSubcategory.id
        });
      }
    }

    // Return the complete saved category with all relationships
    return await this.getCategories(companyId);
  }
}