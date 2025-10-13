import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const prisma = new PrismaClient();

app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json());

console.log('🚀 Minimal Categories Server Starting...');

// Our working categories API - exactly as we had it working
app.get('/api/categories', async (_req, res) => {
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

    console.log('✅ CategoryService: Transformed categories:', frontendCategories.length);
    console.log('📝 Categories with subcategories:', frontendCategories.map(c => 
      `${c.name} (${c.subcategories.length} subs)`
    ).join(', '));

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

// Alternative route for dataService compatibility
app.get('/api/category/structure', async (_req, res) => {
  try {
    console.log('🔍 CategoryStructure: Loading categories for company: 0e573687-3b53-498a-9e78-f198f16f8bcb');
    
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

    console.log('📋 CategoryStructure: Raw categories from database:', categories.length);

    const frontendCategories = categories.map(category => {
      console.log(`🔍 Processing category: ${category.name} with ${category.subcategories.length} subcategories`);
      
      const subcategories = category.subcategories.map(sub => ({
        id: sub.id,
        name: sub.name,
        categoryId: category.id,
        parentId: sub.parent_id,
        color: sub.color,
        isVisible: sub.is_visible,
        sortOrder: sub.sort_order,
        level: sub.level,
        options: [],
        linkedFinalProducts: []
      }));

      return {
        id: category.id,
        name: category.name,
        color: category.color,
        isActive: category.is_active,
        isStructureComplete: category.is_structure_complete,
        subcategories,
        specialItems: [],
        createdBy: 'database',
        createdAt: category.created_at,
        updatedAt: category.updated_at
      };
    });

    console.log('✅ CategoryStructure: Successfully transformed', frontendCategories.length, 'categories');
    if (frontendCategories.length > 0) {
      console.log('📂 CategoryStructure: Categories:', frontendCategories.map(c => c.name).join(', '));
    }

    res.json(frontendCategories);
  } catch (error) {
    console.error('❌ CategoryStructure: Error loading categories:', error);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const companyId = '0e573687-3b53-498a-9e78-f198f16f8bcb';
    
    if (req.body.subcategories && Array.isArray(req.body.subcategories)) {
      console.log('💾 CategoryRoutes: Saving complete category structure for:', req.body.name);
      console.log('📂 Subcategories to save:', req.body.subcategories.length);
      
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

      // Clear existing subcategories
      await prisma.subcategory.deleteMany({
        where: { category_id: req.body.id }
      });
      console.log('🧹 Cleared existing subcategories');

      // Create all subcategories
      for (const subcategory of req.body.subcategories) {
        console.log(`💾 Saving subcategory: ${subcategory.name} with color: ${subcategory.color}`);
        
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
        
        console.log(`✅ Saved subcategory: ${subcategory.name} (Level ${subcategory.level}) Color: ${subcategory.color}`);
      }

      console.log('✅ CategoryService: Complete category structure saved successfully');
      res.status(201).json({
        success: true,
        data: { success: true, message: 'Category structure saved successfully' }
      });
    } else {
      // Create new category
      console.log('💾 CategoryRoutes: Creating new category:', req.body.name);
      
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

      console.log('✅ CategoryService: Category created:', category.id);
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
    console.log('🗑️ CategoryRoutes: Deleting category:', req.params.id);
    
    await prisma.category.update({
      where: { 
        id: req.params.id,
        company_id: '0e573687-3b53-498a-9e78-f198f16f8bcb' 
      },
      data: { is_active: false }
    });

    console.log('✅ CategoryService: Category deleted:', req.params.id);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('❌ Categories DELETE Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Customer API endpoints
app.get('/api/customers', async (_req, res) => {
  try {
    console.log('👥 Customers API: Fetching customers from database');
    
    const customers = await prisma.customer.findMany({
      where: { 
        company_id: '0e573687-3b53-498a-9e78-f198f16f8bcb'
      },
      include: {
        additional_contacts: true,
        price_lists: {
          include: {
            category: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    console.log('✅ Customers API: Found', customers.length, 'customers');

    res.json({
      success: true,
      data: customers
    });
  } catch (error: any) {
    console.error('❌ Customers API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    console.log('👥 Customers API: Creating customer:', req.body.name);
    
    const customerData = req.body;
    const companyId = '0e573687-3b53-498a-9e78-f198f16f8bcb';
    
    // Create customer with all fields
    const customer = await prisma.customer.create({
      data: {
        name: customerData.name,
        accounting_id: customerData.accountingId,
        sales_rep_id: customerData.salesRepId,
        sales_rep_name: customerData.salesRepName,
        abn_number: customerData.abnNumber,
        phone: customerData.phone,
        email: customerData.email,
        
        // Primary contact
        primary_contact_first_name: customerData.primaryContact?.firstName,
        primary_contact_last_name: customerData.primaryContact?.lastName,
        primary_contact_email: customerData.primaryContact?.email,
        primary_contact_landline: customerData.primaryContact?.landline,
        primary_contact_fax: customerData.primaryContact?.fax,
        primary_contact_mobile: customerData.primaryContact?.mobile,
        
        // Location details
        location_type: customerData.locationDetails?.locationType || 'Main',
        mailing_address: customerData.locationDetails?.mailingAddress,
        billing_address: customerData.locationDetails?.billingAddress,
        delivery_address: customerData.locationDetails?.deliveryAddress,
        
        // Account details
        accounting_terms: customerData.accountDetails?.accountingTerms,
        payment_terms: `Net ${customerData.accountDetails?.paymentTerms || 30}`,
        payment_due_days: parseInt(String(customerData.accountDetails?.paymentTerms || 30)),
        credit_limit: customerData.accountDetails?.creditLimit,
        available_limit: customerData.accountDetails?.availableLimit,
        invoice_type: customerData.accountDetails?.invoiceType || 'Account',
        
        // General
        status: customerData.status || 'active',
        notes: customerData.notes,
        company_id: companyId
      }
    });

    // Create additional contacts
    if (customerData.additionalContacts && customerData.additionalContacts.length > 0) {
      for (const contact of customerData.additionalContacts) {
        await prisma.customerContact.create({
          data: {
            customer_id: customer.id,
            first_name: contact.firstName,
            last_name: contact.lastName,
            email: contact.email,
            landline: contact.landline,
            fax: contact.fax,
            mobile: contact.mobile
          }
        });
      }
    }

    // Create price lists
    if (customerData.priceLists && customerData.priceLists.length > 0) {
      for (const priceList of customerData.priceLists) {
        if (priceList.isSelected && priceList.selectedTier) {
          await prisma.customerPriceList.create({
            data: {
              customer_id: customer.id,
              category_id: priceList.id,
              tier_name: priceList.selectedTier,
              markup: priceList.markupDiscount || 0,
              is_active: true
            }
          });
        }
      }
    }

    console.log('✅ Customer created successfully:', customer.id);
    
    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error: any) {
    console.error('❌ Customer creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update customer endpoint
app.put('/api/customers/:id', async (req, res) => {
  try {
    console.log('👥 Customers API: Updating customer:', req.params.id, req.body.name);
    
    const customerData = req.body;
    const customerId = req.params.id;
    const companyId = '0e573687-3b53-498a-9e78-f198f16f8bcb';
    
    // Update customer with all fields
    const customer = await prisma.customer.update({
      where: { 
        id: customerId,
        company_id: companyId 
      },
      data: {
        name: customerData.name,
        accounting_id: customerData.accountingId,
        sales_rep_id: customerData.salesRepId,
        sales_rep_name: customerData.salesRepName,
        abn_number: customerData.abnNumber,
        phone: customerData.phone,
        email: customerData.email,
        
        // Primary contact
        primary_contact_first_name: customerData.primaryContact?.firstName,
        primary_contact_last_name: customerData.primaryContact?.lastName,
        primary_contact_email: customerData.primaryContact?.email,
        primary_contact_landline: customerData.primaryContact?.landline,
        primary_contact_fax: customerData.primaryContact?.fax,
        primary_contact_mobile: customerData.primaryContact?.mobile,
        
        // Location details
        location_type: customerData.locationDetails?.locationType || 'Main',
        mailing_address: customerData.locationDetails?.mailingAddress,
        billing_address: customerData.locationDetails?.billingAddress,
        delivery_address: customerData.locationDetails?.deliveryAddress,
        
        // Account details
        accounting_terms: customerData.accountDetails?.accountingTerms,
        payment_terms: `Net ${customerData.accountDetails?.paymentTerms || 30}`,
        payment_due_days: parseInt(String(customerData.accountDetails?.paymentTerms || 30)),
        credit_limit: customerData.accountDetails?.creditLimit,
        available_limit: customerData.accountDetails?.availableLimit,
        invoice_type: customerData.accountDetails?.invoiceType || 'Account',
        
        // General
        status: customerData.status || 'active',
        notes: customerData.notes
      }
    });

    // Update price lists (delete and recreate)
    await prisma.customerPriceList.deleteMany({
      where: { customer_id: customerId }
    });
    
    if (customerData.priceLists && customerData.priceLists.length > 0) {
      for (const priceList of customerData.priceLists) {
        if (priceList.isSelected && priceList.selectedTier) {
          await prisma.customerPriceList.create({
            data: {
              customer_id: customerId,
              category_id: priceList.id,
              tier_name: priceList.selectedTier,
              markup: priceList.markupDiscount || 0,
              is_active: true
            }
          });
        }
      }
    }

    console.log('✅ Customer updated successfully:', customer.id);
    
    res.json({
      success: true,
      data: customer
    });
  } catch (error: any) {
    console.error('❌ Customer update error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete customer endpoint
app.delete('/api/customers/:id', async (req, res) => {
  try {
    console.log('🗑️ Customers API: Deleting customer:', req.params.id);
    
    const customerId = req.params.id;
    const companyId = '0e573687-3b53-498a-9e78-f198f16f8bcb';
    
    // Delete customer and related data
    await prisma.customerPriceList.deleteMany({
      where: { customer_id: customerId }
    });
    
    await prisma.customerContact.deleteMany({
      where: { customer_id: customerId }
    });
    
    await prisma.customer.delete({
      where: { 
        id: customerId,
        company_id: companyId 
      }
    });

    console.log('✅ Customer deleted successfully:', customerId);
    
    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error: any) {
    console.error('❌ Customer deletion error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Cleanup duplicate customers endpoint
app.post('/api/customers/cleanup-duplicates', async (_req, res) => {
  try {
    console.log('🧹 Cleaning up duplicate customers...');
    
    const customers = await prisma.customer.findMany({
      where: { company_id: '0e573687-3b53-498a-9e78-f198f16f8bcb' },
      orderBy: { created_at: 'desc' }
    });
    
    const seen = new Set();
    const duplicates = [];
    
    for (const customer of customers) {
      if (seen.has(customer.name)) {
        duplicates.push(customer.id);
      } else {
        seen.add(customer.name);
      }
    }
    
    console.log('Found', duplicates.length, 'duplicate customers to delete');
    
    for (const id of duplicates) {
      await prisma.customerPriceList.deleteMany({ where: { customer_id: id } });
      await prisma.customerContact.deleteMany({ where: { customer_id: id } });
      await prisma.customer.delete({ where: { id } });
    }
    
    console.log('✅ Cleaned up', duplicates.length, 'duplicate customers');
    
    res.json({
      success: true,
      message: `Removed ${duplicates.length} duplicate customers`
    });
  } catch (error: any) {
    console.error('❌ Cleanup error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Quotes API endpoints
app.get('/api/quotes', async (_req, res) => {
  try {
    console.log('📄 Quotes API: Fetching quotes from database');
    
    const quotes = await prisma.quote.findMany({
      where: { 
        company_id: '0e573687-3b53-498a-9e78-f198f16f8bcb'
      },
      include: {
        customer: true
      },
      orderBy: { created_at: 'desc' }
    });

    console.log('✅ Quotes API: Found', quotes.length, 'quotes');

    // Transform to frontend format
    const transformedQuotes = quotes.map(quote => ({
      id: quote.id,
      quoteNumber: quote.quote_number,
      customerId: quote.customer_id,
      customerName: quote.customer.name,
      customerEmail: quote.customer.email,
      customerPhone: quote.customer.phone,
      status: quote.status,
      total: quote.total,
      createdAt: quote.created_at,
      updatedAt: quote.updated_at
    }));

    res.json({
      success: true,
      data: transformedQuotes
    });
  } catch (error: any) {
    console.error('❌ Quotes API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Orders API endpoints  
app.get('/api/orders', async (_req, res) => {
  try {
    console.log('📦 Orders API: Fetching orders from database');
    
    const orders = await prisma.order.findMany({
      where: { 
        company_id: '0e573687-3b53-498a-9e78-f198f16f8bcb'
      },
      include: {
        customer: true
      },
      orderBy: { created_at: 'desc' }
    });

    console.log('✅ Orders API: Found', orders.length, 'orders');

    // Transform to frontend format
    const transformedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      customerId: order.customer_id,
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      customerPhone: order.customer.phone,
      status: order.status,
      total: order.total,
      createdAt: order.created_at,
      updatedAt: order.updated_at
    }));

    res.json({
      success: true,
      data: transformedOrders
    });
  } catch (error: any) {
    console.error('❌ Orders API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Invoices API endpoints
app.get('/api/invoices', async (_req, res) => {
  try {
    console.log('🧾 Invoices API: Fetching invoices from database');
    
    const invoices = await prisma.invoice.findMany({
      where: { 
        companyId: '0e573687-3b53-498a-9e78-f198f16f8bcb'
      },
      include: {
        customer: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('✅ Invoices API: Found', invoices.length, 'invoices');

    // Transform to frontend format
    const transformedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      customerId: invoice.customerId,
      customerName: invoice.customer.name,
      customerEmail: invoice.customer.email,
      customerPhone: invoice.customer.phone,
      status: invoice.status,
      total: invoice.total,
      dueDate: invoice.due_date,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt
    }));

    res.json({
      success: true,
      data: transformedInvoices
    });
  } catch (error: any) {
    console.error('❌ Invoices API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// System Modules API - Get available modules for onboarding
app.get('/api/modules', async (_req, res) => {
  try {
    console.log('🧩 Modules API: Fetching system modules');
    
    const modules = await prisma.systemModule.findMany({
      where: { is_active: true },
      orderBy: [
        { is_core: 'desc' }, // Core modules first
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    console.log('✅ Modules API: Found', modules.length, 'modules');

    const transformedModules = modules.map(module => ({
      id: module.id,
      name: module.name,
      description: module.description,
      category: module.category,
      isCore: module.is_core,
      pricingTier: module.pricing_tier,
      isActive: module.is_active
    }));

    res.json({
      success: true,
      data: transformedModules
    });
  } catch (error: any) {
    console.error('❌ Modules API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Company Modules API - Get modules for a specific company
app.get('/api/companies/:companyId/modules', async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log('🏢 Company Modules API: Fetching for company', companyId);
    
    const companyModules = await prisma.companyModule.findMany({
      where: { 
        company_id: companyId,
        is_active: true 
      },
      include: {
        module: true
      }
    });

    console.log('✅ Company Modules API: Found', companyModules.length, 'active modules');

    const transformedModules = companyModules.map(cm => ({
      id: cm.module.id,
      name: cm.module.name,
      description: cm.module.description,
      category: cm.module.category,
      isCore: cm.module.is_core,
      pricingTier: cm.module.pricing_tier,
      activatedAt: cm.activated_at,
      isActive: cm.is_active
    }));

    res.json({
      success: true,
      data: transformedModules
    });
  } catch (error: any) {
    console.error('❌ Company Modules API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Company Settings API - Get/Set company settings
app.get('/api/companies/:companyId/settings', async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log('⚙️ Settings API: Fetching for company', companyId);
    
    const settings = await prisma.companySetting.findMany({
      where: { company_id: companyId }
    });

    console.log('✅ Settings API: Found', settings.length, 'settings');

    // Transform to key-value object
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {} as any);

    res.json({
      success: true,
      data: settingsObj
    });
  } catch (error: any) {
    console.error('❌ Settings API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.put('/api/companies/:companyId/settings', async (req, res) => {
  try {
    const { companyId } = req.params;
    const settings = req.body;
    
    console.log('💾 Settings API: Updating settings for company', companyId);

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      await prisma.companySetting.upsert({
        where: {
          company_id_setting_key: {
            company_id: companyId,
            setting_key: key
          }
        },
        update: { setting_value: value as any },
        create: {
          company_id: companyId,
          setting_key: key,
          setting_value: value as any
        }
      });
    }

    console.log('✅ Settings API: Updated', Object.keys(settings).length, 'settings');

    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error: any) {
    console.error('❌ Settings API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Onboarding Progress API - Track onboarding steps
app.get('/api/onboarding/progress/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log('🎯 Onboarding API: Fetching progress for company', companyId);
    
    const progress = await prisma.onboardingProgress.findUnique({
      where: { company_id: companyId }
    });

    if (!progress) {
      // Create initial progress record
      const newProgress = await prisma.onboardingProgress.create({
        data: {
          company_id: companyId,
          current_step: 0,
          completed_steps: [],
          selected_modules: [],
          payment_profiles: []
        }
      });

      res.json({
        success: true,
        data: newProgress
      });
      return;
    }

    console.log('✅ Onboarding API: Progress found, step', progress.current_step);

    res.json({
      success: true,
      data: progress
    });
  } catch (error: any) {
    console.error('❌ Onboarding API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.put('/api/onboarding/progress/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const updateData = req.body;
    
    console.log('📝 Onboarding API: Updating progress for company', companyId);

    const progress = await prisma.onboardingProgress.upsert({
      where: { company_id: companyId },
      update: updateData,
      create: {
        company_id: companyId,
        ...updateData
      }
    });

    console.log('✅ Onboarding API: Progress updated to step', progress.current_step);

    res.json({
      success: true,
      data: progress
    });
  } catch (error: any) {
    console.error('❌ Onboarding Progress Update Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Suppliers API endpoints
app.get('/api/suppliers', async (_req, res) => {
  try {
    console.log('🏭 Suppliers API: Fetching suppliers from database');
    
    const suppliers = await prisma.supplier.findMany({
      where: { 
        company_id: '0e573687-3b53-498a-9e78-f198f16f8bcb',
        is_active: true 
      },
      include: {
        primary_category: true,
        additional_contacts: true,
        addresses: true,
        supplier_products: {
          include: {
            product: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log('✅ Suppliers API: Found', suppliers.length, 'suppliers');

    // Transform to frontend format matching SupplierManagement interface
    const transformedSuppliers = suppliers.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      supplierType: 'Manufacturer', // Default value
      accountingId: supplier.accounting_id || '',
      salesRepId: '',
      salesRepName: '',
      abnNumber: '',
      phone: supplier.mobile || '',
      email: supplier.email || '',
      
      // Primary Contact - matching SupplierContact interface with full null checking
      primaryContact: {
        id: supplier.id + '-primary',
        firstName: supplier.primary_contact_first_name || supplier.name?.split(' ')[0] || '',
        lastName: supplier.primary_contact_last_name || supplier.name?.split(' ')[1] || '',
        email: supplier.primary_contact_email || supplier.email || '',
        landline: supplier.primary_contact_landline || '',
        fax: supplier.primary_contact_fax || '',
        mobile: supplier.primary_contact_mobile || supplier.mobile || ''
      },
      
      // Locations from addresses - convert to SupplierLocation format with null checking
      locations: (supplier.addresses || []).map(addr => ({
        id: addr.id,
        type: addr.address_type as any,
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
      
      // Additional contacts - convert to SupplierContact format with null checking
      additionalContacts: (supplier.additional_contacts || []).map(contact => ({
        id: contact.id,
        firstName: contact.first_name || '',
        lastName: contact.last_name || '',
        email: contact.email || '',
        landline: contact.landline || '',
        fax: contact.fax || '',
        mobile: contact.mobile || ''
      })),
      
      // Default values for required fields
      priceLists: [],
      accountDetails: {
        invoiceType: 'Account',
        accountingTerms: '',
        paymentTerms: '',
        creditLimit: 0,
        availableLimit: 0
      },
      
      // Supplier Products - Map database supplier_products to frontend format
      supplierProducts: (supplier.supplier_products || []).map(sp => ({
        id: sp.id,
        productId: sp.product_id,
        supplierId: sp.supplier_id,
        productName: sp.product?.name,
        productCode: sp.product?.code,
        isActive: sp.is_active
      })),
      
      status: supplier.is_active ? 'active' : 'inactive' as const,
      createdAt: new Date(supplier.created_at),
      notes: ''
    }));

    res.json({
      success: true,
      data: transformedSuppliers
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
    
    console.log('💾 Creating new supplier:', supplierData.name);

    // Create supplier with all fields
    const newSupplier = await prisma.supplier.create({
      data: {
        company_id: companyId,
        name: supplierData.name,
        mobile: supplierData.mobile,
        email: supplierData.email,
        accounting_id: supplierData.accountingId,
        
        // Primary contact
        primary_contact_first_name: supplierData.primaryContact?.firstName,
        primary_contact_last_name: supplierData.primaryContact?.lastName,
        primary_contact_position: supplierData.primaryContact?.position,
        primary_contact_email: supplierData.primaryContact?.email,
        primary_contact_landline: supplierData.primaryContact?.landline,
        primary_contact_fax: supplierData.primaryContact?.fax,
        primary_contact_mobile: supplierData.primaryContact?.mobile,
        
        // Addresses
        mailing_address: supplierData.mailingAddress,
        billing_address: supplierData.billingAddress,
        delivery_address: supplierData.deliveryAddress,
        
        // Category
        primary_category_id: supplierData.primaryCategoryId,
        
        is_active: supplierData.isActive ?? true
      },
      include: {
        primary_category: true,
        additional_contacts: true,
        addresses: true
      }
    });

    // Create additional contacts if provided
    if (supplierData.additionalContacts && Array.isArray(supplierData.additionalContacts)) {
      for (const contact of supplierData.additionalContacts) {
        await prisma.supplierContact.create({
          data: {
            supplier_id: newSupplier.id,
            first_name: contact.firstName,
            last_name: contact.lastName,
            position: contact.position,
            email: contact.email,
            landline: contact.landline,
            fax: contact.fax,
            mobile: contact.mobile
          }
        });
      }
    }

    // Create additional addresses if provided
    if (supplierData.addresses && Array.isArray(supplierData.addresses)) {
      for (const address of supplierData.addresses) {
        await prisma.supplierAddress.create({
          data: {
            supplier_id: newSupplier.id,
            address_type: address.addressType,
            usage_type: address.usageType,
            unit_number: address.unitNumber,
            street_number: address.streetNumber,
            street_name: address.streetName,
            city: address.city,
            state: address.state,
            postcode: address.postcode,
            country: address.country || 'Australia',
            is_primary: address.isPrimary || false
          }
        });
      }
    }

    // Link to products if specified - with validation
    if (supplierData.selectedProducts && Array.isArray(supplierData.selectedProducts)) {
      for (const productId of supplierData.selectedProducts) {
        try {
          // Check if product exists before creating relationship
          const productExists = await prisma.product.findUnique({
            where: { id: productId }
          });
          
          if (productExists) {
            await prisma.supplierProduct.create({
              data: {
                supplier_id: newSupplier.id,
                product_id: productId,
                is_active: true
              }
            });
            console.log('✅ Linked supplier to product:', productExists.name);
          } else {
            console.warn('⚠️ Product not found, skipping:', productId);
          }
        } catch (error) {
          console.error('❌ Error linking product to supplier:', error);
        }
      }
    }

    console.log('✅ Supplier created with ID:', newSupplier.id);

    res.json({
      success: true,
      data: newSupplier
    });
  } catch (error: any) {
    console.error('❌ Suppliers CREATE Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supplierData = req.body;
    
    console.log('📝 Updating supplier:', id, supplierData.name);

    // Update supplier with all fields
    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: supplierData.name,
        mobile: supplierData.mobile,
        email: supplierData.email,
        accounting_id: supplierData.accountingId,
        
        // Primary contact
        primary_contact_first_name: supplierData.primaryContact?.firstName,
        primary_contact_last_name: supplierData.primaryContact?.lastName,
        primary_contact_position: supplierData.primaryContact?.position,
        primary_contact_email: supplierData.primaryContact?.email,
        primary_contact_landline: supplierData.primaryContact?.landline,
        primary_contact_fax: supplierData.primaryContact?.fax,
        primary_contact_mobile: supplierData.primaryContact?.mobile,
        
        // Addresses
        mailing_address: supplierData.mailingAddress,
        billing_address: supplierData.billingAddress,
        delivery_address: supplierData.deliveryAddress,
        
        // Category
        primary_category_id: supplierData.primaryCategoryId,
        
        is_active: supplierData.isActive ?? true
      },
      include: {
        primary_category: true,
        additional_contacts: true,
        addresses: true
      }
    });

    // Update additional contacts - delete and recreate
    await prisma.supplierContact.deleteMany({
      where: { supplier_id: id }
    });
    
    if (supplierData.additionalContacts && Array.isArray(supplierData.additionalContacts)) {
      for (const contact of supplierData.additionalContacts) {
        await prisma.supplierContact.create({
          data: {
            supplier_id: id,
            first_name: contact.firstName,
            last_name: contact.lastName,
            position: contact.position,
            email: contact.email,
            landline: contact.landline,
            fax: contact.fax,
            mobile: contact.mobile
          }
        });
      }
    }

    // Update additional addresses - delete and recreate  
    await prisma.supplierAddress.deleteMany({
      where: { supplier_id: id }
    });
    
    if (supplierData.addresses && Array.isArray(supplierData.addresses)) {
      for (const address of supplierData.addresses) {
        await prisma.supplierAddress.create({
          data: {
            supplier_id: id,
            address_type: address.addressType,
            usage_type: address.usageType,
            unit_number: address.unitNumber,
            street_number: address.streetNumber,
            street_name: address.streetName,
            city: address.city,
            state: address.state,
            postcode: address.postcode,
            country: address.country || 'Australia',
            is_primary: address.isPrimary || false
          }
        });
      }
    }

    // Update supplier products - delete and recreate with validation
    await prisma.supplierProduct.deleteMany({
      where: { supplier_id: id }
    });
    
    if (supplierData.selectedProducts && Array.isArray(supplierData.selectedProducts)) {
      for (const productId of supplierData.selectedProducts) {
        try {
          // Check if product exists before creating relationship
          const productExists = await prisma.product.findUnique({
            where: { id: productId }
          });
          
          if (productExists) {
            await prisma.supplierProduct.create({
              data: {
                supplier_id: id,
                product_id: productId,
                is_active: true
              }
            });
            console.log('✅ Updated supplier-product link:', productExists.name);
          } else {
            console.warn('⚠️ Product not found for supplier update, skipping:', productId);
          }
        } catch (error) {
          console.error('❌ Error updating supplier-product link:', error);
        }
      }
    }

    console.log('✅ Supplier updated successfully:', updatedSupplier.id);

    res.json({
      success: true,
      data: updatedSupplier
    });
  } catch (error: any) {
    console.error('❌ Suppliers UPDATE Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting supplier:', id);

    await prisma.supplier.delete({
      where: { id }
    });

    console.log('✅ Supplier deleted successfully');

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error: any) {
    console.error('❌ Suppliers DELETE Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Products API endpoints - Basic support for supplier relationships
app.get('/api/products', async (_req, res) => {
  try {
    console.log('📦 Products API: Fetching products from database');
    
    const products = await prisma.product.findMany({
      where: { 
        company_id: '0e573687-3b53-498a-9e78-f198f16f8bcb',
        is_active: true 
      },
      include: {
        category: true,
        pricing: true,
        inventory: true
      },
      orderBy: { name: 'asc' }
    });

    console.log('✅ Products API: Found', products.length, 'products');

    // Transform to frontend format with full subcategory hierarchy
    const transformedProducts = products.map(product => ({
      id: product.id,
      code: product.code,
      name: product.name,
      description: product.description,
      categoryId: product.category_id,
      categoryName: product.category?.name,
      
      // Full subcategory hierarchy
      mainCategoryId: product.main_category_id,
      subCategoryId: product.sub_category_id,
      subSubCategoryId: product.sub_sub_category_id,
      subSubSubCategoryId: product.sub_sub_sub_category_id,
      
      // Extract size from dimensions JSON
      size: product.dimensions?.size || '',
      
      weight: product.weight,
      isActive: product.is_active,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      
      // Include pricing and inventory data
      pricing: product.pricing?.[0] || null,
      inventory: product.inventory?.[0] || null
    }));

    res.json({
      success: true,
      data: transformedProducts
    });
  } catch (error: any) {
    console.error('❌ Products API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const companyId = '0e573687-3b53-498a-9e78-f198f16f8bcb';
    const productData = req.body;
    
    console.log('💾 Creating new product:', productData.name);
    console.log('🏗️ Product data received:', {
      name: productData.name,
      code: productData.code,
      categoryId: productData.categoryId,
      hasPricing: !!productData.cost,
      hasInventory: !!productData.currentStock
    });

    // Create product with full category hierarchy support
    const newProduct = await prisma.product.create({
      data: {
        company_id: companyId,
        code: productData.code,
        name: productData.name,
        description: productData.description,
        category_id: productData.categoryId,
        main_category_id: productData.mainCategoryId,
        sub_category_id: productData.subCategoryId,
        sub_sub_category_id: productData.subSubCategoryId,
        sub_sub_sub_category_id: productData.subSubSubCategoryId,
        weight: productData.weight || 0,
        dimensions: productData.size ? { size: productData.size } : null,
        is_active: productData.isActive ?? true
      },
      include: {
        category: true,
        pricing: true,
        inventory: true
      }
    });

    console.log('✅ Product created with ID:', newProduct.id);

    // Create pricing record if pricing data provided
    if (productData.cost || productData.priceT1 || productData.priceT2 || productData.priceT3 || productData.priceN) {
      console.log('💰 Creating pricing record...');
      await prisma.productPricing.create({
        data: {
          product_id: newProduct.id,
          cost_price: parseFloat(productData.cost || 0),
          tier_1: parseFloat(productData.priceT1 || 0),
          tier_2: parseFloat(productData.priceT2 || 0),
          tier_3: parseFloat(productData.priceT3 || 0),
          retail: parseFloat(productData.priceN || 0)
        }
      });
      console.log('✅ Pricing record created');
    }

    // Create inventory record if stock data provided
    if (productData.currentStock !== undefined || productData.reorderPoint !== undefined) {
      console.log('📦 Creating inventory record...');
      
      // Get or create default location
      let defaultLocation = await prisma.location.findFirst({
        where: { company_id: companyId }
      });
      
      if (!defaultLocation) {
        console.log('🏢 No location found, creating default location...');
        defaultLocation = await prisma.location.create({
          data: {
            company_id: companyId,
            name: 'Main Warehouse',
            address: { street: 'Default Location', city: 'Main Office' },
            is_active: true
          }
        });
        console.log('✅ Default location created:', defaultLocation.id);
      }
      
      await prisma.productInventory.create({
        data: {
          product_id: newProduct.id,
          location_id: defaultLocation.id,
          current_stock: parseInt(productData.currentStock || 0),
          reorder_point: parseInt(productData.reorderPoint || 10)
        }
      });
      console.log('✅ Inventory record created with stock:', productData.currentStock);
    }

    res.json({
      success: true,
      data: newProduct
    });
  } catch (error: any) {
    console.error('❌ Products CREATE Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Update product endpoint
app.put('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const productData = req.body;
    
    console.log('📝 Updating product:', productId, productData.name);

    // Update product with full category hierarchy support
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        code: productData.code,
        name: productData.name,
        description: productData.description,
        category_id: productData.categoryId,
        main_category_id: productData.mainCategoryId,
        sub_category_id: productData.subCategoryId,
        sub_sub_category_id: productData.subSubCategoryId,
        sub_sub_sub_category_id: productData.subSubSubCategoryId,
        weight: productData.weight || 0,
        dimensions: productData.size ? { size: productData.size } : null,
        is_active: productData.isActive ?? true
      },
      include: {
        category: true,
        pricing: true,
        inventory: true
      }
    });

    console.log('✅ Product updated with ID:', updatedProduct.id);

    // Update pricing record if pricing data provided
    if (productData.cost || productData.priceT1 || productData.priceT2 || productData.priceT3 || productData.priceN) {
      console.log('💰 Updating pricing record...');
      
      // Delete existing pricing records and create new one
      await prisma.productPricing.deleteMany({
        where: { product_id: productId }
      });
      
      await prisma.productPricing.create({
        data: {
          product_id: productId,
          cost_price: parseFloat(productData.cost || 0),
          tier_1: parseFloat(productData.priceT1 || 0),
          tier_2: parseFloat(productData.priceT2 || 0),
          tier_3: parseFloat(productData.priceT3 || 0),
          retail: parseFloat(productData.priceN || 0)
        }
      });
      console.log('✅ Pricing record updated');
    }

    // Update inventory record if stock data provided
    if (productData.currentStock !== undefined) {
      console.log('📦 Updating inventory record...');
      
      // Get or create default location
      let defaultLocation = await prisma.location.findFirst({
        where: { company_id: '0e573687-3b53-498a-9e78-f198f16f8bcb' }
      });
      
      if (!defaultLocation) {
        defaultLocation = await prisma.location.create({
          data: {
            company_id: '0e573687-3b53-498a-9e78-f198f16f8bcb',
            name: 'Main Warehouse',
            address: { street: 'Default Location', city: 'Main Office' },
            is_active: true
          }
        });
      }
      
      // Delete existing inventory and create new
      await prisma.productInventory.deleteMany({
        where: { product_id: productId }
      });
      
      await prisma.productInventory.create({
        data: {
          product_id: productId,
          location_id: defaultLocation.id,
          current_stock: parseInt(productData.currentStock || 0),
          reorder_point: parseInt(productData.reorderPoint || 10)
        }
      });
      console.log('✅ Inventory record updated with stock:', productData.currentStock);
    }

    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error: any) {
    console.error('❌ Products UPDATE Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete product endpoint
app.delete('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    console.log('🗑️ Deleting product:', productId);

    // Delete related records first (cascade should handle this, but being explicit)
    await prisma.productPricing.deleteMany({
      where: { product_id: productId }
    });
    
    await prisma.productInventory.deleteMany({
      where: { product_id: productId }
    });

    // Delete the product itself
    const deletedProduct = await prisma.product.delete({
      where: { id: productId }
    });

    console.log('✅ Product deleted successfully:', deletedProduct.name);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error: any) {
    console.error('❌ Products DELETE Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Mock onboarding status for dashboard compatibility
app.get('/api/onboarding/status', async (_req, res) => {
  try {
    res.json({
      success: true,
      data: {
        isComplete: true,
        currentStep: 5,
        companySetup: true
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Minimal Categories & Customers Server running on port ${PORT}`);
  console.log('📝 Environment: development');
});