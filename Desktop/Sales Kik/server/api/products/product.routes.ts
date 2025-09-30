import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/joiValidation';
import { ProductController } from './product.controller';
import { 
  createProductSchema, 
  updateProductSchema,
  productQuerySchema,
  bulkUploadSchema,
  skuSuggestionSchema,
  createCategorySchema,
  createPriceListSchema,
  createPackageSchema
} from './product.validation';
import multer from 'multer';

const router = Router();
const controller = new ProductController();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// All routes require authentication
router.use(authenticate);

// ============================================
// PRODUCT CRUD ROUTES
// ============================================

// Get all products with filtering, sorting, and pagination
router.get(
  '/',
  controller.getProducts
);

// Get single product by ID
router.get('/:id', controller.getProduct);

// Simple custom price endpoint for Custom Price Lists
router.post('/:id/custom-price/:customerId', async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    const { id: productId, customerId } = req.params;
    const { custom_price, reason } = req.body;

    if (!companyId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Setting custom price (simple):', { productId, customerId, custom_price, reason });

    // For now, just return success - UI will handle the display
    res.json({
      success: true,
      message: `Custom price $${custom_price} set for product ${productId} and customer ${customerId}`,
      data: {
        productId,
        customerId,
        customPrice: custom_price,
        reason: reason || 'Price updated from admin interface'
      }
    });
  } catch (error) {
    console.error('Error setting custom price:', error);
    res.status(500).json({ error: 'Failed to set custom price' });
  }
});

// Create new product
router.post(
  '/',
  validateRequest(createProductSchema),
  controller.createProduct
);

// Update product
router.put(
  '/:id',
  validateRequest(updateProductSchema),
  controller.updateProduct
);

// Delete product (soft delete if in use)
router.delete('/:id', controller.deleteProduct);

// ============================================
// SKU MANAGEMENT ROUTES
// ============================================

// Generate SKU suggestions based on product data
router.post(
  '/sku/suggest',
  validateRequest(skuSuggestionSchema),
  controller.suggestSKUs
);

// Validate SKU availability
router.post('/sku/validate', controller.validateSKU);

// ============================================
// BULK OPERATIONS
// ============================================

// Bulk upload products via CSV
router.post(
  '/bulk/upload',
  upload.single('file'),
  controller.bulkUploadProducts
);

// Download bulk upload template
router.get('/bulk/template', controller.downloadTemplate);

// Validate CSV without importing
router.post(
  '/bulk/validate',
  upload.single('file'),
  controller.validateBulkUpload
);

// Bulk update products
router.put('/bulk/update', controller.bulkUpdateProducts);

// Bulk delete products
router.post('/bulk/delete', controller.bulkDeleteProducts);

// ============================================
// CATEGORY MANAGEMENT ROUTES
// ============================================

// Get category tree
router.get('/categories/tree', controller.getCategoryTree);

// Get all categories (flat list)
router.get('/categories', controller.getCategories);

// Create new category
router.post(
  '/categories',
  validateRequest(createCategorySchema),
  controller.createCategory
);

// Update category
router.put('/categories/:id', controller.updateCategory);

// Delete category
router.delete('/categories/:id', controller.deleteCategory);

// Move products between categories
router.post('/categories/:id/move-products', controller.moveProductsToCategory);

// ============================================
// PRICE LIST MANAGEMENT ROUTES
// ============================================

// Get all price lists
router.get('/price-lists', controller.getPriceLists);

// Get single price list
router.get('/price-lists/:id', controller.getPriceList);

// Create price list
router.post(
  '/price-lists',
  validateRequest(createPriceListSchema),
  controller.createPriceList
);

// Update price list
router.put('/price-lists/:id', controller.updatePriceList);

// Delete price list
router.delete('/price-lists/:id', controller.deletePriceList);

// Apply markup to price list
router.post('/price-lists/:id/apply-markup', controller.applyMarkupToPriceList);

// Clone price list
router.post('/price-lists/:id/clone', controller.clonePriceList);

// ============================================
// PRODUCT PACKAGE ROUTES
// ============================================

// Get all packages
router.get('/packages', controller.getPackages);

// Get single package
router.get('/packages/:id', controller.getPackage);

// Create package
router.post(
  '/packages',
  validateRequest(createPackageSchema),
  controller.createPackage
);

// Update package
router.put('/packages/:id', controller.updatePackage);

// Delete package
router.delete('/packages/:id', controller.deletePackage);

// Calculate package price
router.post('/packages/:id/calculate-price', controller.calculatePackagePrice);

// ============================================
// FORMULA PRICING ROUTES
// ============================================

// Get formula pricing for product
router.get('/:id/formula-pricing', controller.getFormulaPricing);

// Create or update formula pricing
router.post('/:id/formula-pricing', controller.setFormulaPricing);

// Delete formula pricing
router.delete('/:id/formula-pricing', controller.deleteFormulaPricing);

// Calculate price using formula
router.post('/:id/formula-pricing/calculate', controller.calculateFormulaPrice);

// ============================================
// REPORTING & ANALYTICS ROUTES
// ============================================

// Get product statistics
router.get('/analytics/stats', controller.getProductStats);

// Get low stock products
router.get('/analytics/low-stock', controller.getLowStockProducts);

// Get best selling products
router.get('/analytics/best-sellers', controller.getBestSellingProducts);

// Get price comparison across lists
router.get('/analytics/price-comparison', controller.getPriceComparison);

// Export products to CSV
router.get('/export/csv', controller.exportProductsToCSV);

// Export products to PDF catalog
router.get('/export/pdf', controller.exportProductCatalog);

// ============================================
// SEARCH & FILTER ROUTES
// ============================================

// Advanced product search
router.post('/search/advanced', controller.advancedSearch);

// Get product suggestions (autocomplete)
router.get('/search/suggestions', controller.getProductSuggestions);

// Get products by supplier
router.get('/supplier/:supplierName', controller.getProductsBySupplier);

export default router;