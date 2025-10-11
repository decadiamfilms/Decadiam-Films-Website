import { Router, Response } from 'express';
import { CategoryServiceNew } from '../../services/category.service.new';
import { AuthRequest } from '../../middleware/auth.middleware';

const router = Router();
const categoryService = new CategoryServiceNew();

// Get all categories with nested subcategories (matching frontend structure)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'test-company-id';
    const categories = await categoryService.getCategories(companyId);
    res.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Create main category
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'test-company-id';
    const category = await categoryService.createCategory(companyId, req.body);
    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Update main category
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'test-company-id';
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
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete main category
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'test-company-id';
    const result = await categoryService.deleteCategory(req.params.id, companyId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Create subcategory (can be nested using parentId)
router.post('/:categoryId/subcategories', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'test-company-id';
    const subcategory = await categoryService.createSubcategory(companyId, {
      ...req.body,
      categoryId: req.params.categoryId,
    });
    res.status(201).json({
      success: true,
      data: subcategory,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Update subcategory
router.put('/subcategories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'test-company-id';
    const subcategory = await categoryService.updateSubcategory(
      req.params.id,
      companyId,
      req.body
    );
    res.json({
      success: true,
      data: subcategory,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete subcategory
router.delete('/subcategories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'test-company-id';
    const result = await categoryService.deleteSubcategory(req.params.id, companyId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Create subcategory option
router.post('/subcategories/:subcategoryId/options', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'test-company-id';
    const option = await categoryService.createSubcategoryOption(companyId, {
      ...req.body,
      subcategoryId: req.params.subcategoryId,
    });
    res.status(201).json({
      success: true,
      data: option,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Update subcategory option
router.put('/options/:id', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'test-company-id';
    const option = await categoryService.updateSubcategoryOption(
      req.params.id,
      companyId,
      req.body
    );
    res.json({
      success: true,
      data: option,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete subcategory option
router.delete('/options/:id', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'test-company-id';
    const result = await categoryService.deleteSubcategoryOption(req.params.id, companyId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Save complete category structure (matching frontend onSave format)
router.post('/structure', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'test-company-id';
    const result = await categoryService.saveCategoryStructure(companyId, req.body);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;