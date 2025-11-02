import { Router } from 'express';
import { StockFlowController } from './stockflow.controller';
// import { authenticate } from '../../middleware/auth.middleware'; // Temporarily disabled

const router = Router();
const stockFlowController = new StockFlowController();

// Apply auth middleware to all routes
// router.use(authenticate); // Temporarily disabled for development

// Inventory Management Routes
router.get('/overview', stockFlowController.getInventoryOverview.bind(stockFlowController));
router.get('/items', stockFlowController.getInventoryItems.bind(stockFlowController));
router.put('/items/:productId/stock', stockFlowController.updateStock.bind(stockFlowController));
router.get('/categories', stockFlowController.getCategories.bind(stockFlowController));
router.get('/reports/low-stock', stockFlowController.getLowStockReport.bind(stockFlowController));
router.post('/adjustments', stockFlowController.createStockAdjustment.bind(stockFlowController));

// Stock Check Page Routes
router.get('/products-with-stock', stockFlowController.getProductsWithStock.bind(stockFlowController));
router.get('/warehouses', stockFlowController.getWarehouses.bind(stockFlowController));
router.post('/adjust', stockFlowController.adjustStock.bind(stockFlowController));
router.get('/product/:productId/warehouse/:warehouseId', stockFlowController.getProductInventory.bind(stockFlowController));

export default router;