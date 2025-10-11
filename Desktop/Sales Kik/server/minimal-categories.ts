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

app.listen(PORT, () => {
  console.log(`🚀 Minimal Categories & Customers Server running on port ${PORT}`);
  console.log('📝 Environment: development');
});