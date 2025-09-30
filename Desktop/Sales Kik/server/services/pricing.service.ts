import { PrismaClient } from '@prisma/client';

export class PricingService {
  constructor(private prisma: PrismaClient) {}

  async resolvePrice(customerId: string, productId: string) {
    // 1. Check for custom pricing first
    const customPrice = await this.prisma.customerCustomPrice.findFirst({
      where: { 
        customerId: customerId, 
        productId: productId,
        isActive: true 
      }
    });
    
    if (customPrice) {
      return {
        price: customPrice.customPrice,
        type: 'custom',
        margin: customPrice.marginPercentage,
        source: 'custom_pricelist'
      };
    }
    
    // 2. Fall back to customer's tier pricing
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: { priceList: true }
    });
    
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { prices: true }
    });
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Get tier pricing from customer's assigned price list
    let tierPrice: number | null = null;
    let tierLevel = 1; // default tier
    
    if (customer.priceList) {
      const productPrice = await this.prisma.productPrice.findFirst({
        where: {
          productId: productId,
          priceListId: customer.priceListId!,
          effectiveFrom: { lte: new Date() },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: new Date() } }
          ]
        }
      });
      
      if (productPrice) {
        tierPrice = productPrice.price.toNumber();
      }
    }
    
    // If no specific price list price found, look for default pricing
    if (!tierPrice && product.prices.length > 0) {
      const defaultPrice = product.prices.find(p => p.effectiveFrom <= new Date() && 
        (!p.effectiveTo || p.effectiveTo >= new Date()));
      
      if (defaultPrice) {
        tierPrice = defaultPrice.price.toNumber();
        tierLevel = 1;
      }
    }
    
    return {
      price: tierPrice || 0,
      type: 'tier',
      tier: tierLevel,
      source: 'standard_tier'
    };
  }
  
  async bulkResolveCustomerPricing(customerId: string, productIds: string[]) {
    const results: Record<string, any> = {};
    
    for (const productId of productIds) {
      try {
        results[productId] = await this.resolvePrice(customerId, productId);
      } catch (error) {
        results[productId] = {
          price: 0,
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    return results;
  }

  async setCustomPrice(customerId: string, productId: string, customPrice: number, options: {
    marginPercentage?: number;
    costPrice?: number;
    reason?: string;
    createdBy: string;
  }) {
    // Check if custom price already exists
    const existing = await this.prisma.customerCustomPrice.findUnique({
      where: {
        customerId_productId: {
          customerId,
          productId
        }
      }
    });

    const result = await this.prisma.$transaction(async (tx) => {
      // Create or update custom price
      const customPriceRecord = await tx.customerCustomPrice.upsert({
        where: {
          customerId_productId: {
            customerId,
            productId
          }
        },
        update: {
          customPrice: customPrice,
          marginPercentage: options.marginPercentage,
          costPrice: options.costPrice,
          updatedBy: options.createdBy,
          updatedAt: new Date()
        },
        create: {
          customerId,
          productId,
          customPrice: customPrice,
          marginPercentage: options.marginPercentage,
          costPrice: options.costPrice,
          createdBy: options.createdBy
        }
      });

      // Log the price change
      await tx.priceChangeHistory.create({
        data: {
          customerId,
          productId,
          oldPrice: existing?.customPrice,
          newPrice: customPrice,
          oldMarginPercentage: existing?.marginPercentage,
          newMarginPercentage: options.marginPercentage,
          changeType: existing ? 'update' : 'create',
          changedBy: options.createdBy,
          reason: options.reason
        }
      });

      return customPriceRecord;
    });

    return result;
  }

  async deleteCustomPrice(customerId: string, productId: string, deletedBy: string, reason?: string) {
    const existing = await this.prisma.customerCustomPrice.findUnique({
      where: {
        customerId_productId: {
          customerId,
          productId
        }
      }
    });

    if (!existing) {
      throw new Error('Custom price not found');
    }

    await this.prisma.$transaction(async (tx) => {
      // Soft delete the custom price
      await tx.customerCustomPrice.update({
        where: {
          customerId_productId: {
            customerId,
            productId
          }
        },
        data: {
          isActive: false,
          updatedBy: deletedBy,
          updatedAt: new Date()
        }
      });

      // Log the deletion
      await tx.priceChangeHistory.create({
        data: {
          customerId,
          productId,
          oldPrice: existing.customPrice,
          newPrice: 0,
          oldMarginPercentage: existing.marginPercentage,
          newMarginPercentage: null,
          changeType: 'delete',
          changedBy: deletedBy,
          reason: reason || 'Custom price removed'
        }
      });
    });
  }

  async getCustomerPrices(customerId: string) {
    return await this.prisma.customerCustomPrice.findMany({
      where: {
        customerId: customerId,
        isActive: true
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            cost: true,
            categoryMappings: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { updatedAt: 'desc' }
      ]
    });
  }

  async getPriceHistory(customerId: string, productId?: string) {
    const where: any = { customerId };
    if (productId) {
      where.productId = productId;
    }

    return await this.prisma.priceChangeHistory.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true
          }
        },
        changer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: [
        { changedAt: 'desc' }
      ]
    });
  }

  async bulkUpdatePrices(customerId: string, updates: Array<{
    productId: string;
    customPrice: number;
    marginPercentage?: number;
    costPrice?: number;
  }>, updatedBy: string, reason?: string) {
    
    const results = await this.prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const update of updates) {
        const existing = await tx.customerCustomPrice.findUnique({
          where: {
            customerId_productId: {
              customerId,
              productId: update.productId
            }
          }
        });

        const customPriceRecord = await tx.customerCustomPrice.upsert({
          where: {
            customerId_productId: {
              customerId,
              productId: update.productId
            }
          },
          update: {
            customPrice: update.customPrice,
            marginPercentage: update.marginPercentage,
            costPrice: update.costPrice,
            updatedBy: updatedBy,
            updatedAt: new Date()
          },
          create: {
            customerId,
            productId: update.productId,
            customPrice: update.customPrice,
            marginPercentage: update.marginPercentage,
            costPrice: update.costPrice,
            createdBy: updatedBy
          }
        });

        // Log the change
        await tx.priceChangeHistory.create({
          data: {
            customerId,
            productId: update.productId,
            oldPrice: existing?.customPrice,
            newPrice: update.customPrice,
            oldMarginPercentage: existing?.marginPercentage,
            newMarginPercentage: update.marginPercentage,
            changeType: existing ? 'update' : 'create',
            changedBy: updatedBy,
            reason: reason || 'Bulk price update'
          }
        });

        results.push(customPriceRecord);
      }

      return results;
    });

    return results;
  }

  async copyPricelist(sourceCustomerId: string, targetCustomerId: string, copiedBy: string, categoryIds?: string[]) {
    const where: any = {
      customerId: sourceCustomerId,
      isActive: true
    };

    // If category IDs specified, filter by them
    if (categoryIds && categoryIds.length > 0) {
      where.product = {
        categoryMappings: {
          some: {
            categoryId: {
              in: categoryIds
            }
          }
        }
      };
    }

    const sourcePrices = await this.prisma.customerCustomPrice.findMany({
      where,
      include: {
        product: true
      }
    });

    const updates = sourcePrices.map(price => ({
      productId: price.productId,
      customPrice: price.customPrice.toNumber(),
      marginPercentage: price.marginPercentage?.toNumber(),
      costPrice: price.costPrice?.toNumber()
    }));

    return await this.bulkUpdatePrices(
      targetCustomerId, 
      updates, 
      copiedBy, 
      `Copied from customer ${sourceCustomerId}`
    );
  }
}