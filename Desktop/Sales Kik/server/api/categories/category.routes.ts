import { Router, Response } from 'express';
import { CategoryService } from '../../services/category.service';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validateRequest';
import { body, param } from 'express-validator';

const router = Router();
const categoryService = new CategoryService();

// Temporarily disable authentication for testing
// router.use(authenticate);

// ===================
// MAIN ENDPOINTS
// ===================

// Get all categories with full hierarchy
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    // Use actual company ID since auth is disabled
    const companyId = req.user?.companyId || '0e573687-3b53-498a-9e78-f198f16f8bcb';
    console.log('🔍 CategoryRoutes: Loading categories for company:', companyId);
    
    const categories = await categoryService.getCategories(companyId);
    res.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    console.error('❌ CategoryRoutes: Error in GET /:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Create category OR save complete category structure
router.post(
  '/',
  // authorize(['products.create']), // Disabled for testing
  [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('description').optional().trim(),
    body('sortOrder').optional().isNumeric(),
  ],
  // validateRequest, // Disabled for testing
  async (req: AuthRequest, res: Response) => {
    try {
      // Use test company ID since auth is disabled
      const companyId = req.user?.companyId || '0e573687-3b53-498a-9e78-f198f16f8bcb';
      
      // Check if this is a complete category structure save
      if (req.body.subcategories && Array.isArray(req.body.subcategories)) {
        console.log('💾 CategoryRoutes: Saving complete category structure for:', req.body.name);
        console.log('📂 Subcategories to save:', req.body.subcategories.length);
        
        const result = await categoryService.saveCategoryStructure(companyId, req.body);
        res.status(201).json({
          success: true,
          data: result,
        });
      } else {
        // Regular category creation
        console.log('💾 CategoryRoutes: Creating new category:', req.body.name);
        
        const category = await categoryService.createCategory(companyId, req.body);
        res.status(201).json({
          success: true,
          data: category,
        });
      }
    } catch (error: any) {
      console.error('❌ CategoryRoutes: Error in POST /:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Update main category
router.put(
  '/:id',
  // authorize(['products.edit']), // Disabled for testing
  [
    param('id').isUUID().withMessage('Invalid category ID'),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('sortOrder').optional().isNumeric(),
    body('isActive').optional().isBoolean(),
  ],
  // validateRequest, // Disabled for testing
  async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user?.companyId || '0e573687-3b53-498a-9e78-f198f16f8bcb';
      console.log('🔄 CategoryRoutes: Updating category:', req.params.id);
      
      const category = await categoryService.updateCategory(
        req.params.id,
        companyId,
        req.body
      );
      res.json({
        success: true,
        data: category,
      });
    } catch (error: any) {
      console.error('❌ CategoryRoutes: Error in PUT /:id:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Delete main category
router.delete(
  '/:id',
  // authorize(['products.delete']), // Disabled for testing
  [param('id').isUUID().withMessage('Invalid category ID')],
  // validateRequest, // Disabled for testing
  async (req: AuthRequest, res: Response) => {
    try {
      // Use test company ID since auth is disabled
      const companyId = req.user?.companyId || '0e573687-3b53-498a-9e78-f198f16f8bcb';
      console.log('🗑️ CategoryRoutes: Deleting category:', req.params.id);
      
      const result = await categoryService.deleteCategory(req.params.id, companyId);
      res.json(result);
    } catch (error: any) {
      console.error('❌ CategoryRoutes: Error in DELETE /:id:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ===================
// UTILITY ENDPOINTS
// ===================

// Move category order
router.patch(
  '/:id/move',
  // authorize(['products.edit']), // Disabled for testing
  [
    param('id').isUUID().withMessage('Invalid category ID'),
    body('sortOrder').isNumeric().withMessage('Sort order must be a number'),
  ],
  // validateRequest, // Disabled for testing
  async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user?.companyId || '0e573687-3b53-498a-9e78-f198f16f8bcb';
      console.log('🔄 CategoryRoutes: Moving category:', req.params.id);
      
      const category = await categoryService.moveCategoryOrder(
        req.params.id,
        companyId,
        req.body.sortOrder
      );
      res.json({
        success: true,
        data: category,
      });
    } catch (error: any) {
      console.error('❌ CategoryRoutes: Error in PATCH /:id/move:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ===================
// DISABLED ENDPOINTS (Informational)
// ===================

// All legacy subcategory endpoints redirect to main structure endpoint
const disabledMessage = { success: false, error: 'Use POST /api/categories with complete structure instead' };

router.get('/subcategories/:subId/subsubcategories', (req, res) => res.status(400).json(disabledMessage));
router.post('/:id/subcategories', (req, res) => res.status(400).json(disabledMessage));
router.put('/subcategories/:subId', (req, res) => res.status(400).json(disabledMessage));
router.delete('/subcategories/:subId', (req, res) => res.status(400).json(disabledMessage));
router.post('/subcategories/:subId/subsubcategories', (req, res) => res.status(400).json(disabledMessage));
router.put('/subsubcategories/:subSubId', (req, res) => res.status(400).json(disabledMessage));
router.delete('/subsubcategories/:subSubId', (req, res) => res.status(400).json(disabledMessage));
router.patch('/subcategories/:subId/move', (req, res) => res.status(400).json(disabledMessage));
router.patch('/subsubcategories/:subSubId/move', (req, res) => res.status(400).json(disabledMessage));

export default router;