import { PrismaClient, Prisma } from '@prisma/client';
import { 
  Product, 
  CreateProductRequest, 
  UpdateProductRequest, 
  ProductQueryParams,
  ProductsResponse,
  BulkUploadResult,
  BulkUploadError,
  BulkUploadWarning,
  BulkUploadRow,
  SKUSuggestionRequest,
  ValidationError,
  ProductValidationResult
} from '../../src/types/product';

export class ProductService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // PRODUCT CRUD OPERATIONS
  // ============================================

  async getProducts(companyId: string, params: ProductQueryParams): Promise<ProductsResponse> {
    const { 
      page = 1, 
      limit = 50, 
      search, 
      categoryId, 
      subcategoryId,
      isActive,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = params;
    
    const where: Prisma.ProductWhereInput = {
      companyId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { supplierName: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(categoryId && {
        categoryMappings: {
          some: { categoryId }
        }
      }),
      ...(subcategoryId && {
        categoryMappings: {
          some: { 
            category: {
              parentId: subcategoryId
            }
          }
        }
      }),
      ...(isActive !== undefined && { isActive })
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      [sortBy]: sortOrder
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          categoryMappings: {
            include: { 
              category: true
            }
          },
          prices: true
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy
      }),
      this.prisma.product.count({ where })
    ]);

    return {
      products: products.map(this.transformProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getProduct(companyId: string, productId: string): Promise<Product | null> {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        companyId
      },
      include: {
        categoryMappings: {
          include: { 
            category: {
              include: {
                parent: true
              }
            }
          }
        },
        prices: {
          include: { 
            priceList: true 
          }
        },
        formulaPricing: true,
        packageComponents: {
          include: {
            package: true
          }
        }
      }
    });

    return product ? this.transformProduct(product) : null;
  }

  async createProduct(companyId: string, data: CreateProductRequest): Promise<Product> {
    // Generate SKU if not provided
    const sku = data.sku || await this.generateSKU(companyId, data);
    
    // Validate SKU uniqueness
    const existing = await this.prisma.product.findUnique({
      where: { 
        companyId_sku: { 
          companyId, 
          sku 
        } 
      }
    });
    
    if (existing) {
      throw new Error(`SKU "${sku}" already exists`);
    }

    // Validate product data
    const validation = await this.validateProduct(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Create product with transactions
    const product = await this.prisma.$transaction(async (tx) => {
      // Create the product
      const newProduct = await tx.product.create({
        data: {
          companyId,
          sku,
          name: data.name,
          description: data.description,
          cost: data.cost ? new Prisma.Decimal(data.cost) : null,
          weight: data.weight ? new Prisma.Decimal(data.weight) : null,
          unitOfMeasure: data.unitOfMeasure || 'each',
          supplierName: data.supplierName,
          categoryMappings: {
            create: data.categoryIds?.map(categoryId => ({ categoryId })) || []
          }
        },
        include: {
          categoryMappings: { 
            include: { 
              category: true 
            } 
          }
        }
      });

      // Create prices if provided
      if (data.prices && data.prices.length > 0) {
        await tx.productPrice.createMany({
          data: data.prices.map(price => ({
            productId: newProduct.id,
            priceListId: price.priceListId,
            price: new Prisma.Decimal(price.price),
            effectiveFrom: new Date()
          }))
        });
      }

      // Learn from this SKU pattern for future suggestions
      await this.learnSKUPattern(tx, companyId, sku, data);
      
      return newProduct;
    });

    // Return with all relations loaded
    return await this.getProduct(companyId, product.id) as Product;
  }

  async updateProduct(
    companyId: string, 
    productId: string, 
    data: UpdateProductRequest
  ): Promise<Product> {
    // Check product exists and belongs to company
    const existing = await this.prisma.product.findFirst({
      where: {
        id: productId,
        companyId
      }
    });

    if (!existing) {
      throw new Error('Product not found');
    }

    // Check SKU uniqueness if changing
    if (data.sku && data.sku !== existing.sku) {
      const skuExists = await this.prisma.product.findUnique({
        where: { 
          companyId_sku: { 
            companyId, 
            sku: data.sku 
          } 
        }
      });
      
      if (skuExists) {
        throw new Error(`SKU "${data.sku}" already exists`);
      }
    }

    // Update product
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update product
      const product = await tx.product.update({
        where: { id: productId },
        data: {
          sku: data.sku,
          name: data.name,
          description: data.description,
          cost: data.cost !== undefined ? new Prisma.Decimal(data.cost) : undefined,
          weight: data.weight !== undefined ? new Prisma.Decimal(data.weight) : undefined,
          unitOfMeasure: data.unitOfMeasure,
          supplierName: data.supplierName,
          isActive: data.isActive,
          version: { increment: 1 }
        }
      });

      // Update categories if provided
      if (data.categoryIds) {
        // Remove existing mappings
        await tx.productCategoryMapping.deleteMany({
          where: { productId }
        });

        // Add new mappings
        if (data.categoryIds.length > 0) {
          await tx.productCategoryMapping.createMany({
            data: data.categoryIds.map(categoryId => ({
              productId,
              categoryId
            }))
          });
        }
      }

      // Update prices if provided
      if (data.prices) {
        for (const priceData of data.prices) {
          await tx.productPrice.upsert({
            where: {
              productId_priceListId_effectiveFrom: {
                productId,
                priceListId: priceData.priceListId,
                effectiveFrom: new Date()
              }
            },
            create: {
              productId,
              priceListId: priceData.priceListId,
              price: new Prisma.Decimal(priceData.price),
              effectiveFrom: new Date()
            },
            update: {
              price: new Prisma.Decimal(priceData.price)
            }
          });
        }
      }

      return product;
    });

    return await this.getProduct(companyId, productId) as Product;
  }

  async deleteProduct(companyId: string, productId: string): Promise<void> {
    // Check product exists and belongs to company
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        companyId
      },
      include: {
        lineItems: true
      }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Check if product is used in any documents
    if (product.lineItems.length > 0) {
      // Soft delete - just mark as inactive
      await this.prisma.product.update({
        where: { id: productId },
        data: { isActive: false }
      });
    } else {
      // Hard delete if not used anywhere
      await this.prisma.product.delete({
        where: { id: productId }
      });
    }
  }

  // ============================================
  // SKU GENERATION & AI SUGGESTIONS
  // ============================================

  async generateSKU(companyId: string, productData: Partial<CreateProductRequest>): Promise<string> {
    const patterns = await this.prisma.sKUPattern.findMany({
      where: { companyId },
      orderBy: { usageCount: 'desc' },
      take: 1
    });

    if (patterns.length === 0) {
      // Default pattern for new companies
      return await this.generateSequentialSKU(companyId, 'PRD');
    }

    // Use most common pattern
    const pattern = patterns[0].pattern;
    return await this.applyPattern(companyId, pattern, productData);
  }

  async suggestSKUs(companyId: string, data: SKUSuggestionRequest): Promise<string[]> {
    const patterns = await this.prisma.sKUPattern.findMany({
      where: { 
        companyId,
        ...(data.category && { category: data.category }),
        ...(data.subcategory && { subcategory: data.subcategory })
      },
      orderBy: { usageCount: 'desc' },
      take: 3
    });

    const suggestions: string[] = [];
    
    // Generate suggestions based on learned patterns
    for (const pattern of patterns) {
      const suggestion = await this.applyPattern(companyId, pattern.pattern, data);
      suggestions.push(suggestion);
    }

    // If no patterns found, generate default suggestions
    if (suggestions.length === 0) {
      // Category-based suggestion
      if (data.category) {
        const catCode = data.category.substring(0, 3).toUpperCase();
        suggestions.push(await this.generateSequentialSKU(companyId, catCode));
      }

      // Name-based suggestion
      if (data.name) {
        const nameCode = data.name
          .split(' ')
          .map(w => w[0])
          .join('')
          .toUpperCase()
          .substring(0, 4);
        suggestions.push(await this.generateSequentialSKU(companyId, nameCode));
      }

      // Default suggestion
      suggestions.push(await this.generateSequentialSKU(companyId, 'PRD'));
    }

    return [...new Set(suggestions)]; // Remove duplicates
  }

  private async generateSequentialSKU(companyId: string, prefix: string): Promise<string> {
    // Find the highest sequential number for this prefix
    const lastProduct = await this.prisma.product.findFirst({
      where: {
        companyId,
        sku: {
          startsWith: prefix + '-'
        }
      },
      orderBy: {
        sku: 'desc'
      }
    });

    let nextNumber = 1;
    if (lastProduct) {
      const match = lastProduct.sku.match(/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
  }

  private async applyPattern(
    companyId: string, 
    pattern: string, 
    data: Partial<CreateProductRequest | SKUSuggestionRequest>
  ): Promise<string> {
    let sku = pattern;

    // Replace pattern placeholders
    if (pattern.includes('CAT') && (data as any).category) {
      const catCode = (data as any).category.substring(0, 3).toUpperCase();
      sku = sku.replace('CAT', catCode);
    }

    if (pattern.includes('SUB') && data.subcategory) {
      const subCode = data.subcategory.substring(0, 3).toUpperCase();
      sku = sku.replace('SUB', subCode);
    }

    if (pattern.includes('####')) {
      // Get next sequential number for this pattern
      const basePattern = sku.replace('####', '');
      const lastProduct = await this.prisma.product.findFirst({
        where: {
          companyId,
          sku: {
            startsWith: basePattern
          }
        },
        orderBy: {
          sku: 'desc'
        }
      });

      let nextNumber = 1;
      if (lastProduct) {
        const match = lastProduct.sku.match(/(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      sku = sku.replace('####', nextNumber.toString().padStart(4, '0'));
    }

    return sku;
  }

  private async learnSKUPattern(
    tx: any, 
    companyId: string, 
    sku: string, 
    productData: Partial<CreateProductRequest>
  ): Promise<void> {
    const pattern = this.extractPattern(sku);
    
    const existing = await tx.sKUPattern.findFirst({
      where: { 
        companyId, 
        pattern,
        category: productData.primaryCategory,
        subcategory: productData.subcategory
      }
    });

    if (existing) {
      await tx.sKUPattern.update({
        where: { id: existing.id },
        data: { usageCount: { increment: 1 } }
      });
    } else {
      await tx.sKUPattern.create({
        data: {
          companyId,
          pattern,
          category: productData.primaryCategory,
          subcategory: productData.subcategory,
          usageCount: 1
        }
      });
    }
  }

  private extractPattern(sku: string): string {
    // Extract pattern from SKU
    // Example: "GLS-CLR-0001" -> "CAT-SUB-####"
    const parts = sku.split('-');
    const pattern = parts.map((part, index) => {
      if (/^\d+$/.test(part)) {
        return '#'.repeat(part.length);
      } else if (index === 0) {
        return 'CAT';
      } else if (index === 1) {
        return 'SUB';
      }
      return part;
    }).join('-');

    return pattern;
  }

  // ============================================
  // BULK UPLOAD
  // ============================================

  async bulkUploadProducts(
    companyId: string, 
    rows: BulkUploadRow[]
  ): Promise<BulkUploadResult> {
    const results: BulkUploadResult = {
      successCount: 0,
      errorCount: 0,
      errors: [],
      warnings: [],
      createdProducts: []
    };

    // Get or create categories map
    const categoryMap = await this.getCategoryMap(companyId);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // Account for header row

      try {
        // Validate row
        const validation = this.validateBulkUploadRow(row, rowNumber);
        if (validation.errors.length > 0) {
          results.errors.push(...validation.errors);
          results.errorCount++;
          continue;
        }

        // Parse categories
        const categoryIds: string[] = [];
        if (row.category) {
          const category = await this.findOrCreateCategory(
            companyId, 
            row.category, 
            null,
            categoryMap
          );
          categoryIds.push(category.id);

          if (row.subcategory) {
            const subcategory = await this.findOrCreateCategory(
              companyId,
              row.subcategory,
              category.id,
              categoryMap
            );
            categoryIds.push(subcategory.id);

            if (row.product_type) {
              const productType = await this.findOrCreateCategory(
                companyId,
                row.product_type,
                subcategory.id,
                categoryMap
              );
              categoryIds.push(productType.id);
            }
          }
        }

        // Create product
        const product = await this.createProduct(companyId, {
          sku: row.sku,
          name: row.name,
          description: row.description,
          cost: row.cost ? parseFloat(row.cost.toString()) : undefined,
          weight: row.weight ? parseFloat(row.weight.toString()) : undefined,
          unitOfMeasure: row.unit_of_measure || 'each',
          supplierName: row.supplier,
          categoryIds,
          primaryCategory: row.category,
          subcategory: row.subcategory,
          productType: row.product_type
        });

        results.successCount++;
        results.createdProducts?.push(product);

        // Add prices if provided
        if (row.retail_price || row.trade_price) {
          const prices = [];
          
          if (row.retail_price) {
            const retailPriceList = await this.getOrCreatePriceList(companyId, 'Retail');
            prices.push({
              priceListId: retailPriceList.id,
              price: parseFloat(row.retail_price.toString())
            });
          }

          if (row.trade_price) {
            const tradePriceList = await this.getOrCreatePriceList(companyId, 'Trade');
            prices.push({
              priceListId: tradePriceList.id,
              price: parseFloat(row.trade_price.toString())
            });
          }

          // Update product with prices
          await this.updateProduct(companyId, product.id, { prices });
        }
        
      } catch (error: any) {
        results.errors.push({
          row: rowNumber,
          field: 'general',
          message: error.message,
          value: row
        });
        results.errorCount++;
      }
    }

    return results;
  }

  private validateBulkUploadRow(row: BulkUploadRow, rowNumber: number): {
    errors: BulkUploadError[];
    warnings: BulkUploadWarning[];
  } {
    const errors: BulkUploadError[] = [];
    const warnings: BulkUploadWarning[] = [];

    // Required fields
    if (!row.name || row.name.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'name',
        message: 'Product name is required',
        value: row.name
      });
    }

    // Validate numbers
    if (row.cost && isNaN(Number(row.cost))) {
      errors.push({
        row: rowNumber,
        field: 'cost',
        message: 'Cost must be a valid number',
        value: row.cost
      });
    }

    if (row.weight && isNaN(Number(row.weight))) {
      errors.push({
        row: rowNumber,
        field: 'weight',
        message: 'Weight must be a valid number',
        value: row.weight
      });
    }

    if (row.retail_price && isNaN(Number(row.retail_price))) {
      errors.push({
        row: rowNumber,
        field: 'retail_price',
        message: 'Retail price must be a valid number',
        value: row.retail_price
      });
    }

    if (row.trade_price && isNaN(Number(row.trade_price))) {
      errors.push({
        row: rowNumber,
        field: 'trade_price',
        message: 'Trade price must be a valid number',
        value: row.trade_price
      });
    }

    // Validate unit of measure
    const validUnits = ['each', 'sqm', 'lm', 'perimeter', 'weight'];
    if (row.unit_of_measure && !validUnits.includes(row.unit_of_measure.toLowerCase())) {
      warnings.push({
        row: rowNumber,
        field: 'unit_of_measure',
        message: `Unknown unit of measure: ${row.unit_of_measure}`,
        suggestion: 'Will default to "each"'
      });
    }

    // SKU warnings
    if (!row.sku) {
      warnings.push({
        row: rowNumber,
        field: 'sku',
        message: 'SKU not provided',
        suggestion: 'SKU will be auto-generated'
      });
    }

    return { errors, warnings };
  }

  async generateBulkUploadTemplate(): Promise<Buffer> {
    const Papa = require('papaparse');
    
    const template = [
      {
        sku: 'EXAMPLE-001',
        name: 'Example Product',
        description: 'Product description (optional)',
        cost: '10.50',
        weight: '1.5',
        unit_of_measure: 'each',
        supplier: 'Supplier Name (optional)',
        category: 'Glass',
        subcategory: 'Clear Glass',
        product_type: 'Standard',
        retail_price: '15.75',
        trade_price: '13.65'
      },
      {
        sku: 'EXAMPLE-002',
        name: 'Another Example',
        description: '',
        cost: '25.00',
        weight: '',
        unit_of_measure: 'sqm',
        supplier: '',
        category: 'Hardware',
        subcategory: 'Handles',
        product_type: '',
        retail_price: '35.00',
        trade_price: '30.00'
      }
    ];

    const csv = Papa.unparse(template, {
      header: true
    });

    return Buffer.from(csv, 'utf-8');
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async validateProduct(data: CreateProductRequest): Promise<ProductValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: any[] = [];

    // Required fields
    if (!data.name || data.name.trim() === '') {
      errors.push({
        field: 'name',
        message: 'Product name is required',
        code: 'REQUIRED_FIELD'
      });
    }

    // Validate cost
    if (data.cost && data.cost < 0) {
      errors.push({
        field: 'cost',
        message: 'Cost cannot be negative',
        code: 'INVALID_VALUE'
      });
    }

    // Validate weight
    if (data.weight && data.weight < 0) {
      errors.push({
        field: 'weight',
        message: 'Weight cannot be negative',
        code: 'INVALID_VALUE'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private async getCategoryMap(companyId: string): Promise<Map<string, any>> {
    const categories = await this.prisma.productCategory.findMany({
      where: { companyId }
    });

    const map = new Map();
    categories.forEach(cat => {
      const key = `${cat.parentId || 'root'}-${cat.name}`;
      map.set(key, cat);
    });

    return map;
  }

  private async findOrCreateCategory(
    companyId: string,
    name: string,
    parentId: string | null,
    categoryMap: Map<string, any>
  ): Promise<any> {
    const key = `${parentId || 'root'}-${name}`;
    
    if (categoryMap.has(key)) {
      return categoryMap.get(key);
    }

    const category = await this.prisma.productCategory.create({
      data: {
        companyId,
        name,
        parentId
      }
    });

    categoryMap.set(key, category);
    return category;
  }

  private async getOrCreatePriceList(companyId: string, name: string): Promise<any> {
    let priceList = await this.prisma.priceList.findFirst({
      where: {
        companyId,
        name
      }
    });

    if (!priceList) {
      priceList = await this.prisma.priceList.create({
        data: {
          companyId,
          name,
          isDefault: name === 'Retail'
        }
      });
    }

    return priceList;
  }

  private transformProduct(dbProduct: any): Product {
    return {
      id: dbProduct.id,
      companyId: dbProduct.companyId,
      sku: dbProduct.sku,
      name: dbProduct.name,
      description: dbProduct.description,
      cost: dbProduct.cost ? parseFloat(dbProduct.cost.toString()) : null,
      weight: dbProduct.weight ? parseFloat(dbProduct.weight.toString()) : null,
      unitOfMeasure: dbProduct.unitOfMeasure,
      supplierName: dbProduct.supplierName,
      isActive: dbProduct.isActive,
      version: dbProduct.version,
      createdAt: dbProduct.createdAt,
      updatedAt: dbProduct.updatedAt,
      categories: dbProduct.categoryMappings?.map((mapping: any) => ({
        ...mapping.category,
        level: this.determineCategoryLevel(mapping.category),
        fullPath: this.buildCategoryPath(mapping.category)
      })) || [],
      prices: dbProduct.prices?.map((price: any) => ({
        ...price,
        price: parseFloat(price.price.toString())
      })) || [],
      formulaPricing: dbProduct.formulaPricing
    };
  }

  private determineCategoryLevel(category: any): string {
    if (!category.parentId) return 'category';
    if (category.parent && !category.parent.parentId) return 'subcategory';
    return 'product_type';
  }

  private buildCategoryPath(category: any): string {
    const parts = [category.name];
    let current = category;
    
    while (current.parent) {
      parts.unshift(current.parent.name);
      current = current.parent;
    }
    
    return parts.join(' > ');
  }
}