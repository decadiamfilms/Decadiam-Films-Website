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

// Suppliers API
app.get('/api/suppliers', async (req, res) => {
  try {
    console.log('🏭 SuppliersAPI: Loading suppliers for company: 0e573687-3b53-498a-9e78-f198f16f8bcb');
    
    const suppliers = await prisma.supplier.findMany({
      where: { 
        company_id: '0e573687-3b53-498a-9e78-f198f16f8bcb',
        is_active: true 
      },
      include: {
        contacts: true,
        addresses: true,
        supplier_products: {
          include: {
            product: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    console.log('📋 SuppliersAPI: Raw suppliers from database:', suppliers.length);

    // Transform to frontend format
    const frontendSuppliers = suppliers.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      supplierType: supplier.supplier_type || 'Product',
      accountingId: supplier.accounting_id || '',
      salesRepId: '1', // Default
      salesRepName: 'John Smith', // Default
      abnNumber: supplier.abn_number || '',
      phone: supplier.mobile || '',
      email: supplier.email || '',
      primaryContact: {
        id: `contact-${supplier.id}`,
        firstName: supplier.primary_contact_first_name || '',
        lastName: supplier.primary_contact_last_name || '',
        email: supplier.primary_contact_email || '',
        landline: supplier.primary_contact_landline || '',
        fax: supplier.primary_contact_fax || '',
        mobile: supplier.primary_contact_mobile || ''
      },
      locations: supplier.addresses.map(addr => ({
        id: addr.id,
        type: addr.address_type as 'Main' | 'Branch' | 'PO Box' | 'Others',
        isMailingAddress: addr.address_type === 'Mailing',
        isBillingAddress: addr.address_type === 'Billing',
        isDeliveryAddress: addr.address_type === 'Delivery',
        unitNumber: addr.unit_number || '',
        streetNumber: addr.street_number || '',
        streetName: addr.street_name || '',
        city: addr.city || '',
        state: addr.state || '',
        postcode: addr.postcode || '',
        country: addr.country || 'Australia'
      })),
      additionalContacts: supplier.contacts.map(contact => ({
        id: contact.id,
        firstName: contact.first_name,
        lastName: contact.last_name,
        email: contact.email,
        landline: contact.landline,
        fax: contact.fax,
        mobile: contact.mobile
      })),
      priceLists: [],
      accountDetails: {
        accountingTerms: supplier.accounting_terms || 'NET',
        paymentTerms: supplier.payment_terms || 30,
        paymentPeriod: 'days' as const,
        creditLimit: supplier.credit_limit || 50000,
        availableLimit: supplier.available_limit || 50000,
        invoiceType: supplier.invoice_type as any || 'Account'
      },
      status: supplier.is_active ? 'active' as const : 'inactive' as const,
      createdAt: supplier.created_at,
      notes: supplier.notes || ''
    }));

    res.json({
      success: true,
      data: frontendSuppliers,
    });
  } catch (error: any) {
    console.error('❌ Suppliers API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const companyId = '0e573687-3b53-498a-9e78-f198f16f8bcb';
    const supplierData = req.body;
    
    console.log('🏭 SuppliersAPI: Creating new supplier:', supplierData.name);
    
    const supplier = await prisma.supplier.create({
      data: {
        name: supplierData.name,
        supplier_type: supplierData.supplierType || 'Product',
        mobile: supplierData.phone,
        email: supplierData.email,
        accounting_id: supplierData.accountingId,
        abn_number: supplierData.abnNumber,
        primary_contact_first_name: supplierData.primaryContact?.firstName,
        primary_contact_last_name: supplierData.primaryContact?.lastName,
        primary_contact_email: supplierData.primaryContact?.email,
        primary_contact_landline: supplierData.primaryContact?.landline,
        primary_contact_fax: supplierData.primaryContact?.fax,
        primary_contact_mobile: supplierData.primaryContact?.mobile,
        accounting_terms: supplierData.accountDetails?.accountingTerms || 'NET',
        payment_terms: supplierData.accountDetails?.paymentTerms || 30,
        credit_limit: supplierData.accountDetails?.creditLimit || 50000,
        available_limit: supplierData.accountDetails?.availableLimit || 50000,
        invoice_type: supplierData.accountDetails?.invoiceType || 'Account',
        notes: supplierData.notes || '',
        company_id: companyId,
        is_active: true
      },
    });

    console.log('✅ SuppliersAPI: Supplier created successfully:', supplier.id);

    // Transform back to frontend format
    const frontendSupplier = {
      id: supplier.id,
      name: supplier.name,
      supplierType: supplier.supplier_type || 'Product',
      accountingId: supplier.accounting_id || '',
      salesRepId: '1',
      salesRepName: 'John Smith',
      abnNumber: supplier.abn_number || '',
      phone: supplier.mobile || '',
      email: supplier.email || '',
      primaryContact: {
        id: `contact-${supplier.id}`,
        firstName: supplier.primary_contact_first_name || '',
        lastName: supplier.primary_contact_last_name || '',
        email: supplier.primary_contact_email || '',
        landline: supplier.primary_contact_landline || '',
        fax: supplier.primary_contact_fax || '',
        mobile: supplier.primary_contact_mobile || ''
      },
      locations: [],
      additionalContacts: [],
      priceLists: [],
      accountDetails: {
        accountingTerms: supplier.accounting_terms || 'NET',
        paymentTerms: supplier.payment_terms || 30,
        paymentPeriod: 'days' as const,
        creditLimit: supplier.credit_limit || 50000,
        availableLimit: supplier.available_limit || 50000,
        invoiceType: supplier.invoice_type as any || 'Account'
      },
      status: 'active' as const,
      createdAt: supplier.created_at,
      notes: supplier.notes || ''
    };

    res.status(201).json({
      success: true,
      data: frontendSupplier,
    });
  } catch (error: any) {
    console.error('❌ Suppliers POST Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    await prisma.supplier.update({
      where: { 
        id: req.params.id,
        company_id: '0e573687-3b53-498a-9e78-f198f16f8bcb' 
      },
      data: { is_active: false }
    });

    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error: any) {
    console.error('❌ Suppliers DELETE Error:', error);
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