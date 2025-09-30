import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class StockFlowController {
  
  // Get inventory overview
  async getInventoryOverview(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(401).json({ error: 'Company ID required' });
      }

      // Get total products count
      const totalProducts = await prisma.product.count({
        where: { companyId }
      });

      // Get inventory stats by checking ProductInventory records
      const inventoryStats = await prisma.productInventory.aggregate({
        where: {
          product: {
            companyId
          }
        },
        _count: true,
        _sum: {
          quantityOnHand: true
        }
      });

      // Get low stock count (products with inventory below reorder point)
      const lowStockCount = await prisma.productInventory.count({
        where: {
          product: {
            companyId
          },
          quantityOnHand: {
            lte: prisma.productInventory.fields.reorderPoint
          }
        }
      });

      res.json({
        totalProducts,
        lowStockProducts: lowStockCount,
        totalValue: 0, // Calculate properly with prices later
        recentActivity: 0, // To be implemented with stock movements
        outOfStockProducts: await prisma.productInventory.count({
          where: {
            product: { companyId },
            quantityOnHand: 0
          }
        })
      });

    } catch (error) {
      console.error('Error getting inventory overview:', error);
      res.status(500).json({ error: 'Failed to get inventory overview' });
    }
  }

  // Get inventory items with filtering and pagination
  async getInventoryItems(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      const { 
        page = 1, 
        limit = 20, 
        search = '', 
        category = '',
        status = 'all' 
      } = req.query;

      if (!companyId) {
        return res.status(401).json({ error: 'Company ID required' });
      }

      const skip = (Number(page) - 1) * Number(limit);

      let where: any = { companyId };

      // Add search filter
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
          { sku: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      // Add category filter
      if (category && category !== 'all') {
        where.categoryId = category as string;
      }

      // Add status filter
      if (status === 'low_stock') {
        where.stockQuantity = { lt: 10 };
      } else if (status === 'out_of_stock') {
        where.stockQuantity = 0;
      } else if (status === 'in_stock') {
        where.stockQuantity = { gt: 0 };
      }

      const [items, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: true
          },
          skip,
          take: Number(limit),
          orderBy: { updatedAt: 'desc' }
        }),
        prisma.product.count({ where })
      ]);

      res.json({
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          sku: item.sku || 'N/A',
          category: item.category?.name || 'Uncategorized',
          currentStock: item.stockQuantity || 0,
          unitPrice: item.price || 0,
          totalValue: (item.stockQuantity || 0) * (item.price || 0),
          status: (item.stockQuantity || 0) === 0 ? 'out_of_stock' : 
                  (item.stockQuantity || 0) < 10 ? 'low_stock' : 'in_stock',
          lastUpdated: item.updatedAt
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });

    } catch (error) {
      console.error('Error getting inventory items:', error);
      res.status(500).json({ error: 'Failed to get inventory items' });
    }
  }

  // Update stock quantity
  async updateStock(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const { quantity, reason = 'Manual adjustment' } = req.body;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(401).json({ error: 'Company ID required' });
      }

      // Verify product belongs to company
      const product = await prisma.product.findFirst({
        where: { id: productId, companyId }
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Update stock quantity
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: { 
          stockQuantity: Math.max(0, Number(quantity))
        }
      });

      res.json({
        success: true,
        product: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          stockQuantity: updatedProduct.stockQuantity
        }
      });

    } catch (error) {
      console.error('Error updating stock:', error);
      res.status(500).json({ error: 'Failed to update stock' });
    }
  }

  // Get categories for filtering
  async getCategories(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(401).json({ error: 'Company ID required' });
      }

      const categories = await prisma.category.findMany({
        where: { companyId },
        select: {
          id: true,
          name: true,
          _count: {
            select: { products: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      res.json(categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        productCount: cat._count.products
      })));

    } catch (error) {
      console.error('Error getting categories:', error);
      res.status(500).json({ error: 'Failed to get categories' });
    }
  }

  // Generate low stock report
  async getLowStockReport(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      const { threshold = 10 } = req.query;

      if (!companyId) {
        return res.status(401).json({ error: 'Company ID required' });
      }

      const lowStockItems = await prisma.product.findMany({
        where: {
          companyId,
          stockQuantity: { lt: Number(threshold) }
        },
        include: {
          category: true
        },
        orderBy: { stockQuantity: 'asc' }
      });

      res.json({
        threshold: Number(threshold),
        totalItems: lowStockItems.length,
        items: lowStockItems.map(item => ({
          id: item.id,
          name: item.name,
          sku: item.sku || 'N/A',
          category: item.category?.name || 'Uncategorized',
          currentStock: item.stockQuantity || 0,
          unitPrice: item.price || 0,
          suggestedReorder: Math.max(50, (item.stockQuantity || 0) * 5) // Simple reorder logic
        }))
      });

    } catch (error) {
      console.error('Error generating low stock report:', error);
      res.status(500).json({ error: 'Failed to generate low stock report' });
    }
  }

  // Create stock adjustment
  async createStockAdjustment(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      const { productId, quantity, reason, notes } = req.body;

      if (!companyId) {
        return res.status(401).json({ error: 'Company ID required' });
      }

      // Verify product belongs to company
      const product = await prisma.product.findFirst({
        where: { id: productId, companyId }
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Update stock quantity with adjustment
      const newQuantity = Math.max(0, (product.stockQuantity || 0) + Number(quantity));
      
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: newQuantity }
      });

      res.json({
        success: true,
        message: 'Stock adjustment completed',
        product: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          previousStock: product.stockQuantity || 0,
          adjustment: Number(quantity),
          newStock: updatedProduct.stockQuantity,
          reason,
          notes
        }
      });

    } catch (error) {
      console.error('Error creating stock adjustment:', error);
      res.status(500).json({ error: 'Failed to create stock adjustment' });
    }
  }

  // Get products with stock for Stock Check page
  async getProductsWithStock(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      const { warehouse_id } = req.query;

      if (!companyId) {
        return res.status(401).json({ error: 'Company ID required' });
      }

      // Get products with their inventory and categories
      const products = await prisma.product.findMany({
        where: { 
          companyId,
          isActive: true
        },
        include: {
          categoryMappings: {
            include: {
              category: true
            }
          },
          inventory: {
            where: warehouse_id && warehouse_id !== 'all' 
              ? { warehouseId: warehouse_id as string }
              : undefined
          },
          prices: {
            include: {
              priceList: true
            },
            where: {
              priceList: {
                isDefault: true
              }
            },
            orderBy: {
              effectiveFrom: 'desc'
            },
            take: 1
          }
        },
        orderBy: { name: 'asc' }
      });

      res.json({
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku || '',
          barcode: '', // Would need ProductBarcode relation
          category_id: p.categoryMappings[0]?.categoryId || '',
          category_name: p.categoryMappings[0]?.category?.name || '',
          image_url: '', // Would need to add imageUrl field to Product model
          is_active: p.isActive
        })),
        inventory: products.flatMap(p => 
          p.inventory.map(inv => ({
            id: inv.id,
            product_id: p.id,
            warehouse_id: inv.warehouseId,
            quantity_on_hand: inv.quantityOnHand,
            quantity_reserved: inv.quantityReserved,
            quantity_available: inv.quantityOnHand - inv.quantityReserved,
            quantity_pending_in: inv.quantityPendingIn,
            quantity_allocated: inv.quantityAllocated,
            reorder_point: inv.reorderPoint,
            reorder_quantity: inv.reorderQuantity,
            average_cost: Number(inv.averageCost),
            last_cost: Number(inv.lastCost),
            total_value: inv.quantityOnHand * Number(inv.averageCost),
            bin_location: inv.binLocation
          }))
        )
      });

    } catch (error) {
      console.error('Error getting products with stock:', error);
      res.status(500).json({ error: 'Failed to get products with stock' });
    }
  }

  // Get warehouses for Stock Check page
  async getWarehouses(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(401).json({ error: 'Company ID required' });
      }

      // Mock warehouses data - in a real implementation, this would come from a warehouses table
      const mockWarehouses = [
        { id: 1, name: 'Main Warehouse', code: 'MAIN', is_active: true, is_default: true },
        { id: 2, name: 'North Location', code: 'NORTH', is_active: true, is_default: false },
        { id: 3, name: 'South Location', code: 'SOUTH', is_active: true, is_default: false }
      ];

      res.json(mockWarehouses);

    } catch (error) {
      console.error('Error getting warehouses:', error);
      res.status(500).json({ error: 'Failed to get warehouses' });
    }
  }

  // Adjust stock for Stock Check page
  async adjustStock(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      const { product_id, warehouse_id, quantity, reason, notes } = req.body;

      if (!companyId) {
        return res.status(401).json({ error: 'Company ID required' });
      }

      // Verify product belongs to company
      const product = await prisma.product.findFirst({
        where: { id: product_id, companyId }
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Find or create inventory record
      let inventory = await prisma.productInventory.findUnique({
        where: {
          productId_warehouseId: {
            productId: product_id,
            warehouseId: warehouse_id || '1' // Default to warehouse 1
          }
        }
      });

      if (!inventory) {
        // Create new inventory record if doesn't exist
        inventory = await prisma.productInventory.create({
          data: {
            productId: product_id,
            warehouseId: warehouse_id || '1',
            quantityOnHand: Math.max(0, Number(quantity)),
            reorderPoint: 10,
            reorderQuantity: 50
          }
        });
      } else {
        // Update existing inventory
        const newQuantity = Math.max(0, inventory.quantityOnHand + Number(quantity));
        inventory = await prisma.productInventory.update({
          where: { id: inventory.id },
          data: { quantityOnHand: newQuantity }
        });
      }

      // Create stock movement record
      await prisma.stockMovement.create({
        data: {
          inventoryId: inventory.id,
          movementType: 'ADJUSTMENT',
          quantityChange: Number(quantity),
          reason: reason || 'Manual adjustment',
          notes,
          performedBy: req.user?.id || '',
          referenceType: 'MANUAL',
          referenceId: `ADJ-${Date.now()}`
        }
      });

      res.json({
        success: true,
        message: 'Stock adjusted successfully',
        adjustment: {
          product_id,
          warehouse_id: warehouse_id || '1',
          previous_quantity: inventory.quantityOnHand - Number(quantity),
          adjustment: Number(quantity),
          new_quantity: inventory.quantityOnHand,
          reason,
          notes,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error adjusting stock:', error);
      res.status(500).json({ error: 'Failed to adjust stock' });
    }
  }

  // Get specific product inventory for Stock Check page
  async getProductInventory(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      const { productId, warehouseId } = req.params;

      if (!companyId) {
        return res.status(401).json({ error: 'Company ID required' });
      }

      // Verify product belongs to company
      const product = await prisma.product.findFirst({
        where: { id: productId, companyId }
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Get inventory for specific warehouse
      const inventory = await prisma.productInventory.findUnique({
        where: {
          productId_warehouseId: {
            productId: productId,
            warehouseId: warehouseId
          }
        }
      });

      if (!inventory) {
        // Return empty inventory if not found
        return res.json({
          id: '',
          product_id: productId,
          warehouse_id: warehouseId,
          quantity_on_hand: 0,
          quantity_reserved: 0,
          quantity_available: 0,
          quantity_pending_in: 0,
          quantity_allocated: 0,
          reorder_point: 10,
          reorder_quantity: 50,
          average_cost: 0,
          last_cost: 0,
          total_value: 0,
          bin_location: null
        });
      }

      res.json({
        id: inventory.id,
        product_id: productId,
        warehouse_id: warehouseId,
        quantity_on_hand: inventory.quantityOnHand,
        quantity_reserved: inventory.quantityReserved,
        quantity_available: inventory.quantityOnHand - inventory.quantityReserved,
        quantity_pending_in: inventory.quantityPendingIn,
        quantity_allocated: inventory.quantityAllocated,
        reorder_point: inventory.reorderPoint,
        reorder_quantity: inventory.reorderQuantity,
        average_cost: Number(inventory.averageCost),
        last_cost: Number(inventory.lastCost),
        total_value: inventory.quantityOnHand * Number(inventory.averageCost),
        bin_location: inventory.binLocation
      });

    } catch (error) {
      console.error('Error getting product inventory:', error);
      res.status(500).json({ error: 'Failed to get product inventory' });
    }
  }
}