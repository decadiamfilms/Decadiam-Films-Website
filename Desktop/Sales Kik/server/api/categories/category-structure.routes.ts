import express from 'express';
import { prisma } from '../../index';
import { authenticate } from '../../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get category structure from database
router.get('/structure', async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get categories from database with subcategories
    const categories = await prisma.productCategory.findMany({
      where: { 
        companyId,
        parentId: null // Only get top-level categories
      },
      include: {
        children: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    console.log('Categories from database:', categories.length, 'found');
    
    res.json(categories); // Return array directly, no wrapper
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Handle any category data format from Inventory Builder
router.post('/structure', async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Category save request received:', JSON.stringify(req.body, null, 2));

    // PREVENT BULK OPERATIONS that cause infinite loops
    if (Array.isArray(req.body)) {
      console.log('🚫 Bulk category operations blocked to prevent infinite loops');
      return res.json({ success: true, message: 'Bulk operations disabled to prevent duplication' });
    }

    // Handle single category creation only
    const { name, color, parentId, sortOrder } = req.body;
    if (name && typeof name === 'string' && name.trim().length > 0) {
      try {
        // Check if category already exists to prevent duplicates
        const existing = await prisma.productCategory.findFirst({
          where: { 
            companyId,
            name: name.trim()
          }
        });

        if (existing) {
          console.log('Category already exists:', name);
          return res.json({ success: true, data: existing, message: 'Category already exists' });
        }

        const category = await prisma.productCategory.create({
          data: {
            companyId,
            name: name.trim(),
            parentId: parentId || null,
            sortOrder: sortOrder || 0,
            color: color || '#3B82F6',
            isStructureComplete: false,
            isActive: true
          }
        });
        
        console.log('✅ Single category created:', category);
        return res.json({ success: true, data: category });
      } catch (error) {
        console.error('Error creating single category:', error);
        return res.status(500).json({ error: 'Failed to create category' });
      }
    }

    // Default response for other formats
    console.log('Invalid category format, returning success without action');
    res.json({ success: true, message: 'No valid category data provided' });
  } catch (error) {
    console.error('Failed to save category:', error);
    res.status(500).json({ error: 'Failed to save category' });
  }
});

// Update category
router.put('/structure/:id', async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    const categoryId = req.params.id;
    
    if (!companyId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, color, parentId, sortOrder } = req.body;

    const category = await prisma.productCategory.update({
      where: { 
        id: categoryId,
        companyId: companyId // Ensure user can only update their company's categories
      },
      data: {
        name,
        parentId: parentId || null,
        sortOrder: sortOrder || 0
      }
    });

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Failed to update category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/structure/:id', async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    const categoryId = req.params.id;
    
    if (!companyId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Deleting category:', categoryId);

    await prisma.productCategory.delete({
      where: { 
        id: categoryId,
        companyId: companyId // Ensure user can only delete their company's categories
      }
    });

    console.log('✅ Category deleted from database:', categoryId);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;