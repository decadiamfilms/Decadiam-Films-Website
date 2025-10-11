import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Clean Category Structure Service - 5 Levels: Color -> Main -> Sub -> Sub Sub -> Sub Sub Sub

export interface CategoryStructure {
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

export interface MainCategoryStructure {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  sub_categories: SubCategoryStructure[];
  created_at: Date;
  updated_at: Date;
}

export interface SubCategoryStructure {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  sub_sub_categories: SubSubCategoryStructure[];
  created_at: Date;
  updated_at: Date;
}

export interface SubSubCategoryStructure {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  sub_sub_sub_categories: SubSubSubCategoryStructure[];
  created_at: Date;
  updated_at: Date;
}

export interface SubSubSubCategoryStructure {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class CategoryService {
  // Get all categories with full hierarchy
  async getAllCategories(companyId: string): Promise<CategoryStructure[]> {
    try {
      const categories = await prisma.category.findMany({
        where: {
          company_id: companyId,
          is_active: true
        },
        include: {
          main_categories: {
            where: { is_active: true },
            include: {
              sub_categories: {
                where: { is_active: true },
                include: {
                  sub_sub_categories: {
                    where: { is_active: true },
                    include: {
                      sub_sub_sub_categories: {
                        where: { is_active: true },
                        orderBy: { sort_order: 'asc' }
                      }
                    },
                    orderBy: { sort_order: 'asc' }
                  }
                },
                orderBy: { sort_order: 'asc' }
              }
            },
            orderBy: { sort_order: 'asc' }
          }
        },
        orderBy: { sort_order: 'asc' }
      });

      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  }

  // Create new category (Color level)
  async createCategory(companyId: string, data: {
    name: string;
    description?: string;
    color: string;
    sort_order?: number;
  }): Promise<CategoryStructure> {
    try {
      const category = await prisma.category.create({
        data: {
          name: data.name,
          description: data.description,
          color: data.color,
          sort_order: data.sort_order || 0,
          company_id: companyId,
          is_active: true
        },
        include: {
          main_categories: {
            include: {
              sub_categories: {
                include: {
                  sub_sub_categories: {
                    include: {
                      sub_sub_sub_categories: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      return category;
    } catch (error) {
      console.error('Error creating category:', error);
      throw new Error(`Failed to create category: ${error.message}`);
    }
  }

  // Create main category
  async createMainCategory(categoryId: string, data: {
    name: string;
    description?: string;
    sort_order?: number;
  }): Promise<MainCategoryStructure> {
    try {
      const mainCategory = await prisma.mainCategory.create({
        data: {
          name: data.name,
          description: data.description,
          sort_order: data.sort_order || 0,
          category_id: categoryId,
          is_active: true
        },
        include: {
          sub_categories: {
            include: {
              sub_sub_categories: {
                include: {
                  sub_sub_sub_categories: true
                }
              }
            }
          }
        }
      });

      return mainCategory;
    } catch (error) {
      console.error('Error creating main category:', error);
      throw new Error(`Failed to create main category: ${error.message}`);
    }
  }

  // Create sub category
  async createSubCategory(mainCategoryId: string, data: {
    name: string;
    description?: string;
    sort_order?: number;
  }): Promise<SubCategoryStructure> {
    try {
      const subCategory = await prisma.subCategory.create({
        data: {
          name: data.name,
          description: data.description,
          sort_order: data.sort_order || 0,
          main_category_id: mainCategoryId,
          is_active: true
        },
        include: {
          sub_sub_categories: {
            include: {
              sub_sub_sub_categories: true
            }
          }
        }
      });

      return subCategory;
    } catch (error) {
      console.error('Error creating sub category:', error);
      throw new Error(`Failed to create sub category: ${error.message}`);
    }
  }

  // Create sub sub category
  async createSubSubCategory(subCategoryId: string, data: {
    name: string;
    description?: string;
    sort_order?: number;
  }): Promise<SubSubCategoryStructure> {
    try {
      const subSubCategory = await prisma.subSubCategory.create({
        data: {
          name: data.name,
          description: data.description,
          sort_order: data.sort_order || 0,
          sub_category_id: subCategoryId,
          is_active: true
        },
        include: {
          sub_sub_sub_categories: true
        }
      });

      return subSubCategory;
    } catch (error) {
      console.error('Error creating sub sub category:', error);
      throw new Error(`Failed to create sub sub category: ${error.message}`);
    }
  }

  // Create sub sub sub category
  async createSubSubSubCategory(subSubCategoryId: string, data: {
    name: string;
    description?: string;
    sort_order?: number;
  }): Promise<SubSubSubCategoryStructure> {
    try {
      const subSubSubCategory = await prisma.subSubSubCategory.create({
        data: {
          name: data.name,
          description: data.description,
          sort_order: data.sort_order || 0,
          sub_sub_category_id: subSubCategoryId,
          is_active: true
        }
      });

      return subSubSubCategory;
    } catch (error) {
      console.error('Error creating sub sub sub category:', error);
      throw new Error(`Failed to create sub sub sub category: ${error.message}`);
    }
  }

  // Update category
  async updateCategory(categoryId: string, data: {
    name?: string;
    description?: string;
    color?: string;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<CategoryStructure> {
    try {
      const category = await prisma.category.update({
        where: { id: categoryId },
        data,
        include: {
          main_categories: {
            include: {
              sub_categories: {
                include: {
                  sub_sub_categories: {
                    include: {
                      sub_sub_sub_categories: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      return category;
    } catch (error) {
      console.error('Error updating category:', error);
      throw new Error(`Failed to update category: ${error.message}`);
    }
  }

  // Delete category (soft delete)
  async deleteCategory(categoryId: string): Promise<void> {
    try {
      await prisma.category.update({
        where: { id: categoryId },
        data: { is_active: false }
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  }

  // Get category by ID with full hierarchy
  async getCategoryById(categoryId: string): Promise<CategoryStructure | null> {
    try {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          main_categories: {
            where: { is_active: true },
            include: {
              sub_categories: {
                where: { is_active: true },
                include: {
                  sub_sub_categories: {
                    where: { is_active: true },
                    include: {
                      sub_sub_sub_categories: {
                        where: { is_active: true },
                        orderBy: { sort_order: 'asc' }
                      }
                    },
                    orderBy: { sort_order: 'asc' }
                  }
                },
                orderBy: { sort_order: 'asc' }
              }
            },
            orderBy: { sort_order: 'asc' }
          }
        }
      });

      return category;
    } catch (error) {
      console.error('Error fetching category by ID:', error);
      throw new Error(`Failed to fetch category: ${error.message}`);
    }
  }

  // Bulk create categories from structure
  async createCategoryStructure(companyId: string, structure: {
    name: string;
    description?: string;
    color: string;
    main_categories: Array<{
      name: string;
      description?: string;
      sub_categories: Array<{
        name: string;
        description?: string;
        sub_sub_categories: Array<{
          name: string;
          description?: string;
          sub_sub_sub_categories: Array<{
            name: string;
            description?: string;
          }>;
        }>;
      }>;
    }>;
  }): Promise<CategoryStructure> {
    try {
      const category = await prisma.category.create({
        data: {
          name: structure.name,
          description: structure.description,
          color: structure.color,
          company_id: companyId,
          is_active: true,
          main_categories: {
            create: structure.main_categories.map((mainCat, mainIndex) => ({
              name: mainCat.name,
              description: mainCat.description,
              sort_order: mainIndex,
              is_active: true,
              sub_categories: {
                create: mainCat.sub_categories.map((subCat, subIndex) => ({
                  name: subCat.name,
                  description: subCat.description,
                  sort_order: subIndex,
                  is_active: true,
                  sub_sub_categories: {
                    create: subCat.sub_sub_categories.map((subSubCat, subSubIndex) => ({
                      name: subSubCat.name,
                      description: subSubCat.description,
                      sort_order: subSubIndex,
                      is_active: true,
                      sub_sub_sub_categories: {
                        create: subSubCat.sub_sub_sub_categories.map((subSubSubCat, subSubSubIndex) => ({
                          name: subSubSubCat.name,
                          description: subSubSubCat.description,
                          sort_order: subSubSubIndex,
                          is_active: true
                        }))
                      }
                    }))
                  }
                }))
              }
            }))
          }
        },
        include: {
          main_categories: {
            include: {
              sub_categories: {
                include: {
                  sub_sub_categories: {
                    include: {
                      sub_sub_sub_categories: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      return category;
    } catch (error) {
      console.error('Error creating category structure:', error);
      throw new Error(`Failed to create category structure: ${error.message}`);
    }
  }
}

export const categoryService = new CategoryService();