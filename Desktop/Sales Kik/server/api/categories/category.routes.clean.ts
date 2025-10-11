import { Router } from 'express';
import { categoryService } from '../../services/category.service.clean';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/categories - Get all categories with full hierarchy
router.get('/', async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'Company ID is required'
      });
    }

    console.log(`📋 Getting all categories for company: ${companyId}`);
    
    const categories = await categoryService.getAllCategories(companyId);
    
    console.log(`✅ Retrieved ${categories.length} categories with full hierarchy`);
    
    res.status(200).json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('❌ Error getting categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/categories/:id - Get specific category with full hierarchy
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📋 Getting category: ${id}`);
    
    const category = await categoryService.getCategoryById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    console.log(`✅ Retrieved category: ${category.name}`);
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('❌ Error getting category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/categories - Create new category (Color level)
router.post('/', async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'Company ID is required'
      });
    }

    const { name, description, color, sort_order } = req.body;
    
    if (!name || !color) {
      return res.status(400).json({
        success: false,
        error: 'Name and color are required'
      });
    }

    console.log(`📝 Creating new category: ${name} with color: ${color}`);
    
    const category = await categoryService.createCategory(companyId, {
      name,
      description,
      color,
      sort_order
    });
    
    console.log(`✅ Created category: ${category.name}`);
    
    res.status(201).json({
      success: true,
      data: category,
      message: `Category "${category.name}" created successfully`
    });
  } catch (error) {
    console.error('❌ Error creating category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/categories/:id/main-categories - Create main category
router.post('/:id/main-categories', async (req, res) => {
  try {
    const { id: categoryId } = req.params;
    const { name, description, sort_order } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    console.log(`📝 Creating main category: ${name} under category: ${categoryId}`);
    
    const mainCategory = await categoryService.createMainCategory(categoryId, {
      name,
      description,
      sort_order
    });
    
    console.log(`✅ Created main category: ${mainCategory.name}`);
    
    res.status(201).json({
      success: true,
      data: mainCategory,
      message: `Main category "${mainCategory.name}" created successfully`
    });
  } catch (error) {
    console.error('❌ Error creating main category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/categories/main-categories/:id/sub-categories - Create sub category
router.post('/main-categories/:id/sub-categories', async (req, res) => {
  try {
    const { id: mainCategoryId } = req.params;
    const { name, description, sort_order } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    console.log(`📝 Creating sub category: ${name} under main category: ${mainCategoryId}`);
    
    const subCategory = await categoryService.createSubCategory(mainCategoryId, {
      name,
      description,
      sort_order
    });
    
    console.log(`✅ Created sub category: ${subCategory.name}`);
    
    res.status(201).json({
      success: true,
      data: subCategory,
      message: `Sub category "${subCategory.name}" created successfully`
    });
  } catch (error) {
    console.error('❌ Error creating sub category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/categories/sub-categories/:id/sub-sub-categories - Create sub sub category
router.post('/sub-categories/:id/sub-sub-categories', async (req, res) => {
  try {
    const { id: subCategoryId } = req.params;
    const { name, description, sort_order } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    console.log(`📝 Creating sub sub category: ${name} under sub category: ${subCategoryId}`);
    
    const subSubCategory = await categoryService.createSubSubCategory(subCategoryId, {
      name,
      description,
      sort_order
    });
    
    console.log(`✅ Created sub sub category: ${subSubCategory.name}`);
    
    res.status(201).json({
      success: true,
      data: subSubCategory,
      message: `Sub sub category "${subSubCategory.name}" created successfully`
    });
  } catch (error) {
    console.error('❌ Error creating sub sub category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/categories/sub-sub-categories/:id/sub-sub-sub-categories - Create sub sub sub category
router.post('/sub-sub-categories/:id/sub-sub-sub-categories', async (req, res) => {
  try {
    const { id: subSubCategoryId } = req.params;
    const { name, description, sort_order } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    console.log(`📝 Creating sub sub sub category: ${name} under sub sub category: ${subSubCategoryId}`);
    
    const subSubSubCategory = await categoryService.createSubSubSubCategory(subSubCategoryId, {
      name,
      description,
      sort_order
    });
    
    console.log(`✅ Created sub sub sub category: ${subSubSubCategory.name}`);
    
    res.status(201).json({
      success: true,
      data: subSubSubCategory,
      message: `Sub sub sub category "${subSubSubCategory.name}" created successfully`
    });
  } catch (error) {
    console.error('❌ Error creating sub sub sub category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/categories/bulk - Create complete category structure
router.post('/bulk', async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'Company ID is required'
      });
    }

    const { structure } = req.body;
    
    if (!structure || !structure.name || !structure.color) {
      return res.status(400).json({
        success: false,
        error: 'Complete structure with name and color is required'
      });
    }

    console.log(`📝 Creating bulk category structure: ${structure.name}`);
    
    const category = await categoryService.createCategoryStructure(companyId, structure);
    
    console.log(`✅ Created complete category structure: ${category.name}`);
    
    res.status(201).json({
      success: true,
      data: category,
      message: `Category structure "${category.name}" created successfully`
    });
  } catch (error) {
    console.error('❌ Error creating category structure:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`📝 Updating category: ${id}`);
    
    const category = await categoryService.updateCategory(id, updateData);
    
    console.log(`✅ Updated category: ${category.name}`);
    
    res.status(200).json({
      success: true,
      data: category,
      message: `Category "${category.name}" updated successfully`
    });
  } catch (error) {
    console.error('❌ Error updating category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/categories/:id - Delete category (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting category: ${id}`);
    
    await categoryService.deleteCategory(id);
    
    console.log(`✅ Deleted category: ${id}`);
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;