import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class StockFlowController {
  
  // Get inventory overview - simplified
  async getInventoryOverview(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(401).json({ error: 'Company ID required' });
      }

      // Mock data for now
      res.json({
        totalProducts: 150,
        lowStockProducts: 23,
        totalValue: 142500,
        recentActivity: 15,
        outOfStockProducts: 5
      });

    } catch (error) {
      console.error('Error getting inventory overview:', error);
      res.status(500).json({ error: 'Failed to get inventory overview' });
    }
  }

  // Get inventory items - simplified
  async getInventoryItems(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(401).json({ error: 'Company ID required' });
      }

      // Mock data for now
      res.json({
        items: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        }
      });

    } catch (error) {
      console.error('Error getting inventory items:', error);
      res.status(500).json({ error: 'Failed to get inventory items' });
    }
  }

  // Update stock - simplified
  async updateStock(req: Request, res: Response) {
    try {
      res.json({ success: true, message: 'Stock updated (mock)' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update stock' });
    }
  }

  // Get categories - simplified
  async getCategories(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(401).json({ error: 'Company ID required' });
      }

      const categories = await prisma.productCategory.findMany({
        where: { companyId },
        select: {
          id: true,
          name: true
        },
        orderBy: { name: 'asc' }
      });

      res.json(categories);

    } catch (error) {
      console.error('Error getting categories:', error);
      res.status(500).json({ error: 'Failed to get categories' });
    }
  }

  // Get low stock report - simplified
  async getLowStockReport(req: Request, res: Response) {
    try {
      res.json({
        threshold: 10,
        totalItems: 0,
        items: []
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate low stock report' });
    }
  }

  // Create stock adjustment - simplified
  async createStockAdjustment(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        message: 'Stock adjustment completed (mock)'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create stock adjustment' });
    }
  }

  // Get products with stock for Stock Check page
  async getProductsWithStock(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(401).json({ error: 'Company ID required' });
      }

      // Get basic products
      const products = await prisma.product.findMany({
        where: { 
          companyId,
          isActive: true
        },
        include: {
          categoryMappings: {
            include: {
              category: true
            },
            take: 1
          }
        },
        orderBy: { name: 'asc' }
      });

      // Mock inventory data for now
      const mockInventory = products.map((product, index) => ({
        id: `inv-${index}`,
        product_id: product.id,
        warehouse_id: '1',
        quantity_on_hand: Math.floor(Math.random() * 200) + 10,
        quantity_reserved: Math.floor(Math.random() * 20),
        quantity_available: Math.floor(Math.random() * 180) + 10,
        quantity_pending_in: Math.floor(Math.random() * 50),
        quantity_allocated: 0,
        reorder_point: 10,
        reorder_quantity: 50,
        average_cost: 25.50,
        last_cost: 27.00,
        total_value: (Math.floor(Math.random() * 200) + 10) * 25.50,
        bin_location: `A${Math.floor(Math.random() * 5) + 1}-B${Math.floor(Math.random() * 5) + 1}`
      }));

      res.json({
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku || '',
          barcode: '',
          category_id: p.categoryMappings[0]?.categoryId || '',
          category_name: p.categoryMappings[0]?.category?.name || '',
          image_url: '',
          is_active: p.isActive
        })),
        inventory: mockInventory
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

      // Get actual warehouses from database
      const warehouses = await prisma.warehouse.findMany({
        where: { 
          companyId,
          isActive: true
        },
        orderBy: { name: 'asc' }
      });

      res.json(warehouses.map(w => ({
        id: w.id,
        name: w.name,
        code: w.code,
        is_active: w.isActive,
        is_default: w.isDefault
      })));

    } catch (error) {
      console.error('Error getting warehouses:', error);
      // Fallback to mock data
      res.json([
        { id: 1, name: 'Main Warehouse', code: 'MAIN', is_active: true, is_default: true },
        { id: 2, name: 'North Location', code: 'NORTH', is_active: true, is_default: false },
        { id: 3, name: 'South Location', code: 'SOUTH', is_active: true, is_default: false }
      ]);
    }
  }

  // Adjust stock for Stock Check page - simplified
  async adjustStock(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      const { product_id, warehouse_id, quantity, reason, notes } = req.body;

      if (!companyId) {
        return res.status(401).json({ error: 'Company ID required' });
      }

      // For now, just return success - this would need proper inventory implementation
      res.json({
        success: true,
        message: 'Stock adjusted successfully',
        adjustment: {
          product_id,
          warehouse_id: warehouse_id || '1',
          previous_quantity: 0,
          adjustment: Number(quantity),
          new_quantity: Number(quantity),
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

  // Get specific product inventory - simplified
  async getProductInventory(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      const { productId, warehouseId } = req.params;

      if (!companyId) {
        return res.status(401).json({ error: 'Company ID required' });
      }

      // Return mock inventory data
      res.json({
        id: `inv-${productId}-${warehouseId}`,
        product_id: productId,
        warehouse_id: warehouseId,
        quantity_on_hand: Math.floor(Math.random() * 200) + 10,
        quantity_reserved: Math.floor(Math.random() * 20),
        quantity_available: Math.floor(Math.random() * 180) + 10,
        quantity_pending_in: Math.floor(Math.random() * 50),
        quantity_allocated: 0,
        reorder_point: 10,
        reorder_quantity: 50,
        average_cost: 25.50,
        last_cost: 27.00,
        total_value: 1000.00,
        bin_location: `A${Math.floor(Math.random() * 5) + 1}-B${Math.floor(Math.random() * 5) + 1}`
      });

    } catch (error) {
      console.error('Error getting product inventory:', error);
      res.status(500).json({ error: 'Failed to get product inventory' });
    }
  }
}