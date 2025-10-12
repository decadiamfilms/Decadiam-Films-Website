import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
// import authRoutes from './api/auth/auth.routes';
// import companyRoutes from './api/company/company.routes';  
// import userRoutes from './api/users/user.routes';
// import productRoutes from './api/products/product.routes';
// import customerRoutes from './api/customers/customer.routes';
import quoteRoutes from './api/quotes/quote.routes';
import smsRoutes from './api/quotes/sms.routes';
import emailRoutes from './api/quotes/email.routes';
import publicQuoteRoutes from './api/public/quote.routes';
import orderRoutes from './api/orders/order.routes';
import invoiceRoutes from './api/invoices/invoice.routes';
import enterpriseRoutes from './api/enterprise/enterprise.routes';
import categoryStructureRoutes from './api/categories/category-structure.routes';
import categoryRoutes from './api/categories/category.routes';
import verificationRoutes from './api/auth/verification.routes';
import modulesRoutes from './api/modules/modules.routes';
import onboardingRoutes from './api/onboarding/onboarding.routes';
import claudeRoutes from './api/ai/claude.routes';
import glassRoutes from './api/glass/glass.routes';
import { customPricelistsRoutes, pricingRouter } from './api/custom-pricelists/custom-pricelists.routes';
import transferRoutes from './api/transfers/transfers.routes';
// import stockflowRoutes from './api/stockflow/stockflow.routes';
// import inventoryRoutes from './api/inventory/inventory.routes';
// import purchaseOrderRoutes from './api/purchase-orders/purchase-orders.routes';
// import jobRoutes from './api/jobs/job.routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
console.log('CLIENT_URL from env:', process.env.CLIENT_URL);

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Middleware
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use('/api', rateLimiter);

// API Routes (auth temporarily disabled due to schema issues)
// Temporarily disabled routes due to schema issues
// app.use('/api/auth', authRoutes);
// app.use('/api/auth', verificationRoutes);
// app.use('/api/company', companyRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/modules', modulesRoutes);
// app.use('/api/onboarding', onboardingRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/customers', customerRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/quotes/email', emailRoutes);
app.use('/api/public', publicQuoteRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api/category', categoryStructureRoutes);

// Our working categories API
app.get('/api/categories', async (req, res) => {
  try {
    console.log('🔍 CategoryRoutes: Loading categories for company: 0e573687-3b53-498a-9e78-f198f16f8bcb');
    
    const categories = await prisma.category.findMany({
      where: { 
        company_id: '0e573687-3b53-498a-9e78-f198f16f8bcb',
        is_active: true 
      },
      include: {
        subcategories: {
          where: { is_visible: true },
          orderBy: [
            { level: 'asc' },
            { sort_order: 'asc' }
          ]
        }
      },
      orderBy: { sort_order: 'asc' }
    });

    console.log('📋 CategoryService: Raw categories from database:', categories.length);

    const frontendCategories = categories.map(category => {
      console.log(`🔍 Processing category: ${category.name} with ${category.subcategories.length} subcategories`);
      
      const subcategories = category.subcategories.map(sub => ({
        id: sub.id,
        name: sub.name,
        categoryId: category.id,
        parentId: sub.parent_id || undefined,
        color: sub.color,
        isVisible: sub.is_visible,
        sortOrder: sub.sort_order,
        level: sub.level,
        options: sub.options ? JSON.parse(sub.options as string) : [],
        linkedFinalProducts: sub.linked_products ? JSON.parse(sub.linked_products as string) : []
      }));

      return {
        id: category.id,
        name: category.name,
        color: category.color,
        isActive: category.is_active,
        isStructureComplete: false,
        subcategories: subcategories,
        specialItems: [],
        createdBy: 'database',
        createdAt: category.created_at,
        updatedAt: category.updated_at
      };
    });

    res.json({
      success: true,
      data: frontendCategories,
    });
  } catch (error: any) {
    console.error('❌ Categories API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const companyId = '0e573687-3b53-498a-9e78-f198f16f8bcb';
    
    if (req.body.subcategories && Array.isArray(req.body.subcategories)) {
      console.log('💾 CategoryRoutes: Saving complete category structure for:', req.body.name);
      
      // Update the main category
      await prisma.category.update({
        where: { 
          id: req.body.id,
          company_id: companyId 
        },
        data: {
          name: req.body.name,
          color: req.body.color,
          is_active: req.body.isActive
        }
      });

      // Clear and recreate subcategories
      await prisma.subcategory.deleteMany({
        where: { category_id: req.body.id }
      });

      for (const subcategory of req.body.subcategories) {
        await prisma.subcategory.create({
          data: {
            id: subcategory.id,
            name: subcategory.name,
            description: '',
            color: subcategory.color,
            category_id: req.body.id,
            parent_id: subcategory.parentId,
            level: subcategory.level,
            sort_order: subcategory.sortOrder,
            is_visible: subcategory.isVisible,
            options: JSON.stringify(subcategory.options || []),
            linked_products: JSON.stringify(subcategory.linkedFinalProducts || [])
          }
        });
      }

      res.status(201).json({
        success: true,
        data: { success: true, message: 'Category structure saved successfully' }
      });
    } else {
      // Create new category
      const category = await prisma.category.create({
        data: {
          name: req.body.name,
          description: req.body.description,
          color: req.body.color || '#3B82F6',
          sort_order: req.body.sortOrder || 0,
          company_id: companyId,
          is_active: true
        },
      });

      res.status(201).json({
        success: true,
        data: category,
      });
    }
  } catch (error: any) {
    console.error('❌ Categories POST Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await prisma.category.update({
      where: { 
        id: req.params.id,
        company_id: '0e573687-3b53-498a-9e78-f198f16f8bcb' 
      },
      data: { is_active: false }
    });

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('❌ Categories DELETE Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});
app.use('/api/ai/claude', claudeRoutes);
app.use('/api/glass', glassRoutes);
app.use('/api/custom-pricelists', customPricelistsRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/pricing', pricingRouter);
// app.use('/api/stockflow', stockflowRoutes);
// app.use('/api/inventory', inventoryRoutes);
// app.use('/api/purchase-orders', purchaseOrderRoutes);
// app.use('/api/jobs', jobRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
console.log('🔧 Updated auth service running v5');
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
  await prisma.$disconnect();
  process.exit(0);
});

export default app;