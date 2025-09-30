import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../index';
import { PricingService } from '../../services/pricing.service';

export class CustomPricelistsController {
  private pricingService: PricingService;

  constructor() {
    this.pricingService = new PricingService(prisma);
  }

  // GET /api/custom-pricelists/customers/:customerId
  async getCustomerPricelist(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.params;
      
      const customPrices = await this.pricingService.getCustomerPrices(customerId);
      
      res.json({
        success: true,
        data: customPrices
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/custom-pricelists/customers/:customerId/products
  async getCustomerProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.params;
      const { categoryId, search } = req.query;
      
      // Build where clause for products
      const where: any = {
        companyId: req.user?.companyId
      };

      if (categoryId) {
        where.categoryMappings = {
          some: {
            categoryId: categoryId as string
          }
        };
      }

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { sku: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const products = await prisma.product.findMany({
        where,
        include: {
          categoryMappings: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          customPrices: {
            where: { 
              customerId: customerId,
              isActive: true 
            }
          },
          prices: {
            where: {
              effectiveFrom: { lte: new Date() },
              OR: [
                { effectiveTo: null },
                { effectiveTo: { gte: new Date() } }
              ]
            }
          }
        },
        orderBy: [
          { name: 'asc' }
        ]
      });

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/custom-pricelists/customers/:customerId/categories/:categoryId
  async getCategoryProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId, categoryId } = req.params;

      const products = await prisma.product.findMany({
        where: {
          companyId: req.user?.companyId,
          categoryMappings: {
            some: {
              categoryId: categoryId
            }
          }
        },
        include: {
          categoryMappings: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          customPrices: {
            where: { 
              customerId: customerId,
              isActive: true 
            }
          },
          prices: true
        },
        orderBy: [
          { name: 'asc' }
        ]
      });

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/custom-pricelists/customers/:customerId/products/:productId
  async setCustomPrice(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId, productId } = req.params;
      const { custom_price, margin_percentage, cost_price, reason } = req.body;

      if (!custom_price || custom_price <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid custom price is required'
        });
      }

      const result = await this.pricingService.setCustomPrice(
        customerId, 
        productId, 
        parseFloat(custom_price), 
        {
          marginPercentage: margin_percentage ? parseFloat(margin_percentage) : undefined,
          costPrice: cost_price ? parseFloat(cost_price) : undefined,
          reason: reason,
          createdBy: req.user!.id
        }
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/custom-pricelists/customers/:customerId/products/:productId
  async updateCustomPrice(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId, productId } = req.params;
      const { custom_price, margin_percentage, cost_price, reason } = req.body;

      if (!custom_price || custom_price <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid custom price is required'
        });
      }

      const result = await this.pricingService.setCustomPrice(
        customerId, 
        productId, 
        parseFloat(custom_price), 
        {
          marginPercentage: margin_percentage ? parseFloat(margin_percentage) : undefined,
          costPrice: cost_price ? parseFloat(cost_price) : undefined,
          reason: reason || 'Price updated',
          createdBy: req.user!.id
        }
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/custom-pricelists/customers/:customerId/products/:productId
  async deleteCustomPrice(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId, productId } = req.params;
      const { reason } = req.body;

      await this.pricingService.deleteCustomPrice(
        customerId, 
        productId, 
        req.user!.id, 
        reason
      );

      res.json({
        success: true,
        message: 'Custom price removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/custom-pricelists/customers/:customerId/history
  async getPriceHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.params;
      const { productId } = req.query;

      const history = await this.pricingService.getPriceHistory(
        customerId, 
        productId as string | undefined
      );

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/custom-pricelists/customers/:customerId/revert-to-tier
  async revertToTier(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.params;
      const { productIds, reason } = req.body;

      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Product IDs are required'
        });
      }

      for (const productId of productIds) {
        await this.pricingService.deleteCustomPrice(
          customerId, 
          productId, 
          req.user!.id, 
          reason || 'Reverted to tier pricing'
        );
      }

      res.json({
        success: true,
        message: `Reverted ${productIds.length} products to tier pricing`
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/custom-pricelists/customers/:customerId/bulk-update
  async bulkUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.params;
      const { updates, reason } = req.body;

      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Updates array is required'
        });
      }

      // Validate updates
      for (const update of updates) {
        if (!update.productId || !update.customPrice || update.customPrice <= 0) {
          return res.status(400).json({
            success: false,
            error: 'Each update must have productId and valid customPrice'
          });
        }
      }

      const results = await this.pricingService.bulkUpdatePrices(
        customerId,
        updates.map((u: any) => ({
          productId: u.productId,
          customPrice: parseFloat(u.customPrice),
          marginPercentage: u.marginPercentage ? parseFloat(u.marginPercentage) : undefined,
          costPrice: u.costPrice ? parseFloat(u.costPrice) : undefined
        })),
        req.user!.id,
        reason
      );

      res.json({
        success: true,
        data: results,
        message: `Updated ${results.length} custom prices`
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/custom-pricelists/copy/:sourceCustomerId/:targetCustomerId
  async copyPricelist(req: Request, res: Response, next: NextFunction) {
    try {
      const { sourceCustomerId, targetCustomerId } = req.params;
      const { categoryIds } = req.body;

      if (sourceCustomerId === targetCustomerId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot copy pricelist to the same customer'
        });
      }

      const results = await this.pricingService.copyPricelist(
        sourceCustomerId,
        targetCustomerId,
        req.user!.id,
        categoryIds
      );

      res.json({
        success: true,
        data: results,
        message: `Copied ${results.length} custom prices`
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/pricing/resolve/:customerId/:productId
  async resolvePrice(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId, productId } = req.params;

      const pricing = await this.pricingService.resolvePrice(customerId, productId);

      res.json({
        success: true,
        data: pricing
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/pricing/bulk-resolve/:customerId
  async bulkResolvePrice(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.params;
      const { product_ids } = req.body;

      if (!product_ids || !Array.isArray(product_ids)) {
        return res.status(400).json({
          success: false,
          error: 'product_ids array is required'
        });
      }

      const pricing = await this.pricingService.bulkResolveCustomerPricing(
        customerId, 
        product_ids
      );

      res.json({
        success: true,
        data: pricing
      });
    } catch (error) {
      next(error);
    }
  }
}