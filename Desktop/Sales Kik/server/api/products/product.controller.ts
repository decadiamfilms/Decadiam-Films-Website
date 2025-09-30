import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../index';
import { ProductService } from '../../services/product.service';
import Papa from 'papaparse';
import { BulkUploadRow } from '../../../src/types/product';

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService(prisma);
  }

  // ============================================
  // PRODUCT CRUD OPERATIONS
  // ============================================

  getProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Simple direct implementation for now to avoid ProductService issues
      const products = await prisma.product.findMany({
        where: { 
          companyId: companyId,
          isActive: true 
        },
        include: {
          categoryMappings: {
            include: { 
              category: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      console.log('Products API returning:', products.length, 'products');
      products.forEach(p => console.log('- Product:', p.sku, p.name));
      
      res.json({
        success: true,
        data: products,
        total: products.length,
        page: 1,
        totalPages: 1
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  };

  getProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const product = await this.productService.getProduct(companyId, req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(product);
    } catch (error) {
      next(error);
    }
  };

  createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const product = await this.productService.createProduct(companyId, req.body);
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  };

  updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const product = await this.productService.updateProduct(
        companyId,
        req.params.id,
        req.body
      );
      res.json(product);
    } catch (error) {
      next(error);
    }
  };

  deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await this.productService.deleteProduct(companyId, req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  // ============================================
  // SKU MANAGEMENT
  // ============================================

  suggestSKUs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const suggestions = await this.productService.suggestSKUs(companyId, req.body);
      res.json({ suggestions });
    } catch (error) {
      next(error);
    }
  };

  validateSKU = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { sku } = req.body;
      const existing = await prisma.product.findUnique({
        where: {
          companyId_sku: {
            companyId,
            sku
          }
        }
      });

      res.json({
        available: !existing,
        sku
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================
  // BULK OPERATIONS
  // ============================================

  bulkUploadProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const csvData = req.file.buffer.toString('utf-8');
      const parseResult = Papa.parse<BulkUploadRow>(csvData, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase().replace(/ /g, '_')
      });

      if (parseResult.errors.length > 0) {
        return res.status(400).json({
          error: 'CSV parsing failed',
          details: parseResult.errors
        });
      }

      const result = await this.productService.bulkUploadProducts(
        companyId,
        parseResult.data
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  downloadTemplate = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const buffer = await this.productService.generateBulkUploadTemplate();
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="product_upload_template.csv"');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  };

  validateBulkUpload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const csvData = req.file.buffer.toString('utf-8');
      const parseResult = Papa.parse<BulkUploadRow>(csvData, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase().replace(/ /g, '_')
      });

      // Validate without importing
      const validationResult = {
        isValid: true,
        rowCount: parseResult.data.length,
        errors: [] as any[],
        warnings: [] as any[]
      };

      for (let i = 0; i < parseResult.data.length; i++) {
        const row = parseResult.data[i];
        const rowNumber = i + 2;

        // Check required fields
        if (!row.name) {
          validationResult.errors.push({
            row: rowNumber,
            field: 'name',
            message: 'Product name is required'
          });
          validationResult.isValid = false;
        }

        // Check for duplicate SKUs in the file
        if (row.sku) {
          const duplicates = parseResult.data.filter((r, idx) => 
            idx !== i && r.sku === row.sku
          );
          if (duplicates.length > 0) {
            validationResult.warnings.push({
              row: rowNumber,
              field: 'sku',
              message: `Duplicate SKU "${row.sku}" found in file`
            });
          }
        }
      }

      res.json(validationResult);
    } catch (error) {
      next(error);
    }
  };

  bulkUpdateProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { products } = req.body;
      const results = {
        success: 0,
        failed: 0,
        errors: [] as any[]
      };

      for (const product of products) {
        try {
          await this.productService.updateProduct(companyId, product.id, product);
          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            id: product.id,
            error: error.message
          });
        }
      }

      res.json(results);
    } catch (error) {
      next(error);
    }
  };

  bulkDeleteProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { productIds } = req.body;
      const results = {
        success: 0,
        failed: 0,
        errors: [] as any[]
      };

      for (const productId of productIds) {
        try {
          await this.productService.deleteProduct(companyId, productId);
          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            id: productId,
            error: error.message
          });
        }
      }

      res.json(results);
    } catch (error) {
      next(error);
    }
  };

  // ============================================
  // CATEGORY MANAGEMENT
  // ============================================

  getCategoryTree = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const categories = await prisma.productCategory.findMany({
        where: { companyId },
        include: {
          children: {
            include: {
              children: true
            }
          }
        }
      });

      // Build tree structure
      const tree = categories
        .filter(cat => !cat.parentId)
        .map(cat => ({
          ...cat,
          level: 'category' as const,
          children: cat.children.map(sub => ({
            ...sub,
            level: 'subcategory' as const,
            children: sub.children.map(type => ({
              ...type,
              level: 'product_type' as const
            }))
          }))
        }));

      res.json(tree);
    } catch (error) {
      next(error);
    }
  };

  getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const categories = await prisma.productCategory.findMany({
        where: { companyId },
        include: {
          parent: true,
          _count: {
            select: {
              productMappings: true
            }
          }
        },
        orderBy: [
          { parentId: 'asc' },
          { sortOrder: 'asc' },
          { name: 'asc' }
        ]
      });

      res.json(categories);
    } catch (error) {
      next(error);
    }
  };

  createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const category = await prisma.productCategory.create({
        data: {
          companyId,
          ...req.body
        }
      });

      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const category = await prisma.productCategory.update({
        where: {
          id: req.params.id
        },
        data: req.body
      });

      res.json(category);
    } catch (error) {
      next(error);
    }
  };

  deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if category has products
      const hasProducts = await prisma.productCategoryMapping.findFirst({
        where: { categoryId: req.params.id }
      });

      if (hasProducts) {
        return res.status(400).json({
          error: 'Cannot delete category with products. Move or delete products first.'
        });
      }

      // Check if category has children
      const hasChildren = await prisma.productCategory.findFirst({
        where: { parentId: req.params.id }
      });

      if (hasChildren) {
        return res.status(400).json({
          error: 'Cannot delete category with subcategories. Delete subcategories first.'
        });
      }

      await prisma.productCategory.delete({
        where: { id: req.params.id }
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  moveProductsToCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { productIds, targetCategoryId } = req.body;

      // Update all product mappings
      await prisma.productCategoryMapping.updateMany({
        where: {
          categoryId: req.params.id,
          productId: { in: productIds }
        },
        data: {
          categoryId: targetCategoryId
        }
      });

      res.json({ message: 'Products moved successfully' });
    } catch (error) {
      next(error);
    }
  };

  // ============================================
  // PRICE LIST MANAGEMENT
  // ============================================

  getPriceLists = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const priceLists = await prisma.priceList.findMany({
        where: { companyId },
        include: {
          _count: {
            select: {
              prices: true,
              customers: true
            }
          }
        },
        orderBy: [
          { isDefault: 'desc' },
          { name: 'asc' }
        ]
      });

      res.json(priceLists);
    } catch (error) {
      next(error);
    }
  };

  getPriceList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const priceList = await prisma.priceList.findFirst({
        where: {
          id: req.params.id,
          companyId
        },
        include: {
          prices: {
            include: {
              product: true
            }
          }
        }
      });

      if (!priceList) {
        return res.status(404).json({ error: 'Price list not found' });
      }

      res.json(priceList);
    } catch (error) {
      next(error);
    }
  };

  createPriceList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // If setting as default, unset other defaults
      if (req.body.isDefault) {
        await prisma.priceList.updateMany({
          where: { companyId },
          data: { isDefault: false }
        });
      }

      const priceList = await prisma.priceList.create({
        data: {
          companyId,
          ...req.body
        }
      });

      res.status(201).json(priceList);
    } catch (error) {
      next(error);
    }
  };

  updatePriceList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // If setting as default, unset other defaults
      if (req.body.isDefault) {
        await prisma.priceList.updateMany({
          where: {
            companyId,
            id: { not: req.params.id }
          },
          data: { isDefault: false }
        });
      }

      const priceList = await prisma.priceList.update({
        where: { id: req.params.id },
        data: req.body
      });

      res.json(priceList);
    } catch (error) {
      next(error);
    }
  };

  deletePriceList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if price list is default
      const priceList = await prisma.priceList.findUnique({
        where: { id: req.params.id }
      });

      if (priceList?.isDefault) {
        return res.status(400).json({
          error: 'Cannot delete default price list'
        });
      }

      // Check if price list is used by customers
      const hasCustomers = await prisma.customer.findFirst({
        where: { priceListId: req.params.id }
      });

      if (hasCustomers) {
        return res.status(400).json({
          error: 'Cannot delete price list used by customers'
        });
      }

      await prisma.priceList.delete({
        where: { id: req.params.id }
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  applyMarkupToPriceList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { markup } = req.body;
      
      // Get all products
      const products = await prisma.product.findMany({
        where: { companyId }
      });

      // Create prices with markup
      const priceData = products
        .filter(p => p.cost)
        .map(product => ({
          productId: product.id,
          priceListId: req.params.id,
          price: product.cost!.toNumber() * (1 + markup / 100),
          effectiveFrom: new Date()
        }));

      await prisma.productPrice.createMany({
        data: priceData,
        skipDuplicates: true
      });

      res.json({ message: `Markup applied to ${priceData.length} products` });
    } catch (error) {
      next(error);
    }
  };

  clonePriceList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { name } = req.body;

      // Get original price list with prices
      const original = await prisma.priceList.findFirst({
        where: {
          id: req.params.id,
          companyId
        },
        include: {
          prices: true
        }
      });

      if (!original) {
        return res.status(404).json({ error: 'Price list not found' });
      }

      // Create new price list
      const newPriceList = await prisma.priceList.create({
        data: {
          companyId,
          name,
          markup: original.markup,
          isDefault: false
        }
      });

      // Copy prices
      if (original.prices.length > 0) {
        await prisma.productPrice.createMany({
          data: original.prices.map(price => ({
            productId: price.productId,
            priceListId: newPriceList.id,
            price: price.price,
            effectiveFrom: new Date()
          }))
        });
      }

      res.status(201).json(newPriceList);
    } catch (error) {
      next(error);
    }
  };

  // ============================================
  // PRODUCT PACKAGES
  // ============================================

  getPackages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const packages = await prisma.productPackage.findMany({
        where: { companyId },
        include: {
          components: {
            include: {
              product: true
            }
          }
        }
      });

      res.json(packages);
    } catch (error) {
      next(error);
    }
  };

  getPackage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const packageData = await prisma.productPackage.findFirst({
        where: {
          id: req.params.id,
          companyId
        },
        include: {
          components: {
            include: {
              product: true
            }
          }
        }
      });

      if (!packageData) {
        return res.status(404).json({ error: 'Package not found' });
      }

      res.json(packageData);
    } catch (error) {
      next(error);
    }
  };

  createPackage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { components, ...packageData } = req.body;

      const newPackage = await prisma.productPackage.create({
        data: {
          companyId,
          ...packageData,
          components: {
            create: components
          }
        },
        include: {
          components: {
            include: {
              product: true
            }
          }
        }
      });

      res.status(201).json(newPackage);
    } catch (error) {
      next(error);
    }
  };

  updatePackage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { components, ...packageData } = req.body;

      // Update package and recreate components
      const updatedPackage = await prisma.$transaction(async (tx) => {
        // Delete existing components
        await tx.packageComponent.deleteMany({
          where: { packageId: req.params.id }
        });

        // Update package and add new components
        return await tx.productPackage.update({
          where: { id: req.params.id },
          data: {
            ...packageData,
            components: {
              create: components
            }
          },
          include: {
            components: {
              include: {
                product: true
              }
            }
          }
        });
      });

      res.json(updatedPackage);
    } catch (error) {
      next(error);
    }
  };

  deletePackage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await prisma.productPackage.delete({
        where: { id: req.params.id }
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  calculatePackagePrice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { priceListId } = req.body;

      const packageData = await prisma.productPackage.findFirst({
        where: {
          id: req.params.id,
          companyId
        },
        include: {
          components: {
            include: {
              product: {
                include: {
                  prices: {
                    where: {
                      priceListId,
                      effectiveTo: null
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!packageData) {
        return res.status(404).json({ error: 'Package not found' });
      }

      // Calculate total price
      let totalPrice = 0;
      const componentPrices = packageData.components.map(component => {
        const productPrice = component.product.prices[0]?.price || component.product.cost || 0;
        const linePrice = productPrice.toNumber() * component.quantity.toNumber();
        totalPrice += linePrice;
        
        return {
          productId: component.productId,
          productName: component.product.name,
          quantity: component.quantity,
          unitPrice: productPrice,
          lineTotal: linePrice
        };
      });

      res.json({
        packageId: packageData.id,
        packageName: packageData.name,
        hasOwnPrice: packageData.hasOwnPrice,
        packagePrice: packageData.packagePrice,
        calculatedPrice: packageData.hasOwnPrice ? packageData.packagePrice : totalPrice,
        components: componentPrices
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================
  // FORMULA PRICING
  // ============================================

  getFormulaPricing = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const formulaPricing = await prisma.formulaPricing.findUnique({
        where: { productId: req.params.id }
      });

      if (!formulaPricing) {
        return res.status(404).json({ error: 'Formula pricing not found' });
      }

      res.json({
        ...formulaPricing,
        formula: JSON.parse(formulaPricing.formula),
        variables: JSON.parse(formulaPricing.variables)
      });
    } catch (error) {
      next(error);
    }
  };

  setFormulaPricing = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { formulaName, formula, variables } = req.body;

      const formulaPricing = await prisma.formulaPricing.upsert({
        where: { productId: req.params.id },
        create: {
          productId: req.params.id,
          formulaName,
          formula: JSON.stringify(formula),
          variables: JSON.stringify(variables)
        },
        update: {
          formulaName,
          formula: JSON.stringify(formula),
          variables: JSON.stringify(variables)
        }
      });

      res.json(formulaPricing);
    } catch (error) {
      next(error);
    }
  };

  deleteFormulaPricing = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.formulaPricing.delete({
        where: { productId: req.params.id }
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  calculateFormulaPrice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { variables } = req.body;

      const formulaPricing = await prisma.formulaPricing.findUnique({
        where: { productId: req.params.id }
      });

      if (!formulaPricing) {
        return res.status(404).json({ error: 'Formula pricing not found' });
      }

      const formula = JSON.parse(formulaPricing.formula);
      
      // Simple formula evaluation (expand based on actual formula structure)
      let price = 0;
      if (formula.type === 'calculation') {
        // Parse and evaluate formula expression with provided variables
        // This is a simplified example - implement proper formula evaluation
        const expression = formula.expression;
        // Replace variables in expression and evaluate
        // For now, return a mock calculation
        price = Object.values(variables).reduce((sum: number, val: any) => sum + Number(val), 0);
      }

      res.json({ price });
    } catch (error) {
      next(error);
    }
  };

  // ============================================
  // REPORTING & ANALYTICS
  // ============================================

  getProductStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const [totalProducts, activeProducts, categories, suppliers] = await Promise.all([
        prisma.product.count({ where: { companyId } }),
        prisma.product.count({ where: { companyId, isActive: true } }),
        prisma.productCategory.count({ where: { companyId } }),
        prisma.product.groupBy({
          by: ['supplierName'],
          where: { companyId, supplierName: { not: null } },
          _count: true
        })
      ]);

      res.json({
        totalProducts,
        activeProducts,
        inactiveProducts: totalProducts - activeProducts,
        totalCategories: categories,
        totalSuppliers: suppliers.length
      });
    } catch (error) {
      next(error);
    }
  };

  getLowStockProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const lowStockProducts = await prisma.stockLevel.findMany({
        where: {
          product: { companyId },
          OR: [
            {
              minLevel: { not: null },
              quantityAvailable: { lte: prisma.stockLevel.fields.minLevel }
            },
            {
              reorderPoint: { not: null },
              quantityAvailable: { lte: prisma.stockLevel.fields.reorderPoint }
            }
          ]
        },
        include: {
          product: true,
          location: true
        }
      });

      res.json(lowStockProducts);
    } catch (error) {
      next(error);
    }
  };

  getBestSellingProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { period = '30' } = req.query;
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - Number(period));

      const bestSellers = await prisma.documentLineItem.groupBy({
        by: ['productId'],
        where: {
          productId: { not: null },
          documentType: 'ORDER',
          order: {
            companyId,
            createdAt: { gte: daysAgo }
          }
        },
        _sum: {
          quantity: true,
          lineTotal: true
        },
        _count: true,
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 10
      });

      // Get product details
      const productIds = bestSellers.map(item => item.productId!);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } }
      });

      const productsMap = new Map(products.map(p => [p.id, p]));

      const result = bestSellers.map(item => ({
        product: productsMap.get(item.productId!),
        quantitySold: item._sum.quantity,
        revenue: item._sum.lineTotal,
        orderCount: item._count
      }));

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getPriceComparison = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const products = await prisma.product.findMany({
        where: { companyId },
        include: {
          prices: {
            where: { effectiveTo: null },
            include: {
              priceList: true
            }
          }
        }
      });

      const comparison = products.map(product => ({
        id: product.id,
        sku: product.sku,
        name: product.name,
        cost: product.cost,
        prices: product.prices.map(price => ({
          priceList: price.priceList.name,
          price: price.price,
          markup: product.cost 
            ? ((price.price.toNumber() - product.cost.toNumber()) / product.cost.toNumber() * 100).toFixed(2)
            : null
        }))
      }));

      res.json(comparison);
    } catch (error) {
      next(error);
    }
  };

  exportProductsToCSV = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const products = await this.productService.getProducts(companyId, {
        limit: 10000
      });

      // Transform products to CSV format
      const csvData = products.products.map(product => ({
        sku: product.sku,
        name: product.name,
        description: product.description,
        cost: product.cost,
        weight: product.weight,
        unit_of_measure: product.unitOfMeasure,
        supplier: product.supplierName,
        category: product.categories?.[0]?.name || '',
        is_active: product.isActive
      }));

      const csv = Papa.unparse(csvData);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="products_export.csv"');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  };

  exportProductCatalog = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // PDF generation would require a library like pdfkit or puppeteer
      // For now, return a message
      res.status(501).json({
        error: 'PDF export not yet implemented'
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================
  // SEARCH & FILTER
  // ============================================

  advancedSearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        search,
        categories,
        suppliers,
        priceMin,
        priceMax,
        costMin,
        costMax,
        hasStock,
        isActive
      } = req.body;

      const where: any = {
        companyId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }),
        ...(categories && {
          categoryMappings: {
            some: {
              categoryId: { in: categories }
            }
          }
        }),
        ...(suppliers && {
          supplierName: { in: suppliers }
        }),
        ...(costMin && { cost: { gte: costMin } }),
        ...(costMax && { cost: { lte: costMax } }),
        ...(isActive !== undefined && { isActive })
      };

      let products = await prisma.product.findMany({
        where,
        include: {
          categoryMappings: {
            include: { category: true }
          },
          prices: {
            where: { effectiveTo: null }
          },
          stockLevels: hasStock ? {} : undefined
        }
      });

      // Filter by price if specified
      if (priceMin || priceMax) {
        products = products.filter(product => {
          const prices = product.prices.map(p => p.price.toNumber());
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          
          if (priceMin && maxPrice < priceMin) return false;
          if (priceMax && minPrice > priceMax) return false;
          return true;
        });
      }

      // Filter by stock if specified
      if (hasStock) {
        products = products.filter(product => {
          const totalStock = product.stockLevels?.reduce(
            (sum, level) => sum + level.quantityAvailable.toNumber(),
            0
          ) || 0;
          return totalStock > 0;
        });
      }

      res.json(products);
    } catch (error) {
      next(error);
    }
  };

  getProductSuggestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { search } = req.query;
      
      if (!search || typeof search !== 'string' || search.length < 2) {
        return res.json([]);
      }

      const products = await prisma.product.findMany({
        where: {
          companyId,
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } }
          ],
          isActive: true
        },
        select: {
          id: true,
          sku: true,
          name: true
        },
        take: 10
      });

      res.json(products);
    } catch (error) {
      next(error);
    }
  };

  getProductsBySupplier = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const products = await prisma.product.findMany({
        where: {
          companyId,
          supplierName: req.params.supplierName
        },
        include: {
          categoryMappings: {
            include: { category: true }
          },
          prices: {
            where: { effectiveTo: null }
          }
        }
      });

      res.json(products);
    } catch (error) {
      next(error);
    }
  };
}