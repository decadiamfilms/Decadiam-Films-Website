import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateProductData {
  name: string;
  code: string;
  description?: string;
  category_id?: string;
  subcategory_id?: string;
  supplier_id?: string;
  weight?: number;
  dimensions?: any;
}

export interface UpdateProductData {
  name?: string;
  code?: string;
  description?: string;
  category_id?: string;
  subcategory_id?: string;
  supplier_id?: string;
  weight?: number;
  dimensions?: any;
  is_active?: boolean;
}

export class ProductServiceMinimal {
  async getProducts(companyId: string) {
    return await prisma.product.findMany({
      where: { 
        company_id: companyId,
        is_active: true 
      },
      include: {
        category: true,
        subcategory: {
          include: {
            category: true
          }
        },
        supplier: true,
        pricing: true,
        inventory: true
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async createProduct(companyId: string, data: CreateProductData) {
    return await prisma.product.create({
      data: {
        ...data,
        company_id: companyId,
        is_active: true
      },
      include: {
        category: true,
        subcategory: {
          include: {
            category: true
          }
        },
        supplier: true,
        pricing: true,
        inventory: true
      }
    });
  }

  async updateProduct(productId: string, companyId: string, data: UpdateProductData) {
    return await prisma.product.update({
      where: { 
        id: productId,
        company_id: companyId 
      },
      data,
      include: {
        category: true,
        subcategory: {
          include: {
            category: true
          }
        },
        supplier: true,
        pricing: true,
        inventory: true
      }
    });
  }

  async deleteProduct(productId: string, companyId: string) {
    await prisma.product.update({
      where: { 
        id: productId,
        company_id: companyId 
      },
      data: { is_active: false }
    });

    return { success: true, message: 'Product deleted successfully' };
  }

  async getProductsByCategory(categoryId: string, companyId: string) {
    return await prisma.product.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        OR: [
          { category_id: categoryId },
          { 
            subcategory: {
              category_id: categoryId
            }
          }
        ]
      },
      include: {
        category: true,
        subcategory: {
          include: {
            category: true
          }
        },
        supplier: true,
        pricing: true,
        inventory: true
      }
    });
  }

  async getProductsBySubcategory(subcategoryId: string, companyId: string) {
    return await prisma.product.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        subcategory_id: subcategoryId
      },
      include: {
        category: true,
        subcategory: {
          include: {
            category: true
          }
        },
        supplier: true,
        pricing: true,
        inventory: true
      }
    });
  }
}