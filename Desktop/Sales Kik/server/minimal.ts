import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './api/auth/auth.routes';
import companyRoutes from './api/company/company.routes';
import categoryRoutes from './api/categories/category.routes.new';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5001;

// Initialize Prisma
const prisma = new PrismaClient({
  log: ['query', 'warn', 'error'],
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// API Routes - Minimal set for testing categories
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/categories', categoryRoutes);

// Stub endpoints for dashboard to work
app.get('/api/customers', (_req, res) => {
  res.json({ success: true, data: [] });
});

// Product endpoints with category integration
app.get('/api/products', async (_req, res) => {
  try {
    const { ProductServiceMinimal } = await import('./services/product.service.minimal');
    const productService = new ProductServiceMinimal();
    const products = await productService.getProducts('test-company-id');
    res.json({ success: true, data: products });
  } catch (error: any) {
    res.json({ success: true, data: [] }); // Fallback to empty for now
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { ProductServiceMinimal } = await import('./services/product.service.minimal');
    const productService = new ProductServiceMinimal();
    const product = await productService.createProduct('test-company-id', req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { ProductServiceMinimal } = await import('./services/product.service.minimal');
    const productService = new ProductServiceMinimal();
    const product = await productService.updateProduct(req.params.id, 'test-company-id', req.body);
    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { ProductServiceMinimal } = await import('./services/product.service.minimal');
    const productService = new ProductServiceMinimal();
    const result = await productService.deleteProduct(req.params.id, 'test-company-id');
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/onboarding/status', (_req, res) => {
  res.json({ success: true, data: { completed: true } });
});

// Handle frontend category structure saving (exact format from CategoryEditor)
app.post('/api/category/structure', async (req, res) => {
  try {
    console.log('💾 Saving category structure from frontend:', JSON.stringify(req.body, null, 2));
    
    // Use the new service to save the complete structure
    const { CategoryServiceNew } = await import('./services/category.service.new');
    const categoryService = new CategoryServiceNew();
    
    const result = await categoryService.saveCategoryStructure('test-company-id', req.body);
    
    res.json({ 
      success: true, 
      data: result,
      message: "Category structure saved successfully" 
    });
  } catch (error: any) {
    console.error('❌ Error saving category structure:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/api/category/structure', async (req, res) => {
  try {
    // Return categories from database for ProductManagement component
    const { CategoryServiceNew } = await import('./services/category.service.new');
    const categoryService = new CategoryServiceNew();
    const categories = await categoryService.getCategories('test-company-id');
    
    // Transform nested structure to flat format for ProductManagement dropdowns
    const flatCategories: any[] = [];
    
    categories.forEach((cat: any) => {
      // Add main category
      flatCategories.push({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        isActive: cat.isActive,
        level: 0,
        type: 'category'
      });
      
      // Recursively add all subcategories and their children
      const addSubcategoriesFlat = (subcategories: any[], parentName: string, level: number) => {
        subcategories.forEach((sub: any) => {
          flatCategories.push({
            id: sub.id,
            name: `${parentName} → ${sub.name}`,
            color: sub.color,
            isActive: sub.isVisible,
            level: level,
            type: 'subcategory',
            categoryId: cat.id,
            parentId: sub.parent_id
          });
          
          // Add children recursively
          if (sub.children && sub.children.length > 0) {
            addSubcategoriesFlat(sub.children, `${parentName} → ${sub.name}`, level + 1);
          }
        });
      };
      
      if (cat.subcategories && cat.subcategories.length > 0) {
        addSubcategoriesFlat(cat.subcategories, cat.name, 1);
      }
    });
    
    res.json(flatCategories);
  } catch (error: any) {
    console.error('Error loading categories for ProductManagement:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cascading category endpoints for ProductManagement dropdowns

// Get main categories only (for first dropdown)
app.get('/api/categories/main', async (_req, res) => {
  try {
    const { CategoryServiceNew } = await import('./services/category.service.new');
    const categoryService = new CategoryServiceNew();
    const categories = await categoryService.getCategories('test-company-id');
    
    // Return only main categories
    const mainCategories = categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      isActive: cat.isActive
    }));
    
    res.json({ success: true, data: mainCategories });
  } catch (error: any) {
    res.json({ success: true, data: [] });
  }
});

// Get subcategories for a specific category (for second dropdown)
app.get('/api/categories/:categoryId/subcategories', async (req, res) => {
  try {
    const { CategoryServiceNew } = await import('./services/category.service.new');
    const categoryService = new CategoryServiceNew();
    const categories = await categoryService.getCategories('test-company-id');
    
    const category = categories.find((cat: any) => cat.id === req.params.categoryId);
    if (!category) {
      return res.json({ success: true, data: [] });
    }
    
    // Return only top-level subcategories (no parent_id)
    const subcategories = category.subcategories
      .filter((sub: any) => !sub.parent_id)
      .map((sub: any) => ({
        id: sub.id,
        name: sub.name,
        color: sub.color,
        isActive: sub.isVisible,
        categoryId: category.id
      }));
    
    res.json({ success: true, data: subcategories });
  } catch (error: any) {
    res.json({ success: true, data: [] });
  }
});

// Get sub-sub-categories for a specific subcategory (for third dropdown)
app.get('/api/subcategories/:subcategoryId/children', async (req, res) => {
  try {
    const { CategoryServiceNew } = await import('./services/category.service.new');
    const categoryService = new CategoryServiceNew();
    const categories = await categoryService.getCategories('test-company-id');
    
    // Find the subcategory across all categories
    let targetSubcategory = null;
    for (const category of categories) {
      const findInSubcategories = (subcategories: any[]): any => {
        for (const sub of subcategories) {
          if (sub.id === req.params.subcategoryId) {
            return sub;
          }
          if (sub.children && sub.children.length > 0) {
            const found = findInSubcategories(sub.children);
            if (found) return found;
          }
        }
        return null;
      };
      
      targetSubcategory = findInSubcategories(category.subcategories || []);
      if (targetSubcategory) break;
    }
    
    if (!targetSubcategory) {
      return res.json({ success: true, data: [] });
    }
    
    // Return children of this subcategory
    const children = (targetSubcategory.children || []).map((child: any) => ({
      id: child.id,
      name: child.name,
      color: child.color,
      isActive: child.isVisible,
      parentId: child.parent_id,
      level: child.level
    }));
    
    res.json({ success: true, data: children });
  } catch (error: any) {
    res.json({ success: true, data: [] });
  }
});

// Simple test endpoint that doesn't require auth
app.get('/api/categories/test', (_req, res) => {
  res.json({ success: true, message: "Category API is working!" });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Minimal server running on port ${PORT}`);
  console.log('📂 Category APIs available at /api/categories');
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed.');
  });
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed.');
  });
  await prisma.$disconnect();
});

export default app;