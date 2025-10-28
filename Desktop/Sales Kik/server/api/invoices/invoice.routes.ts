import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import backupService from '../../services/backup.service';

const router = Router();
const prisma = new PrismaClient();

// Get all invoices
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Invoices API: Loading invoices from database');
    
    const invoices = await prisma.invoice.findMany({
      where: { 
        company_id: '0e573687-3b53-498a-9e78-f198f16f8bcb'
      },
      include: {
        customer: true,
        line_items: {
          include: {
            product: true
          }
        },
        documents: true,
        order: true
      },
      orderBy: { created_at: 'desc' }
    });

    console.log('✅ Invoices API: Found', invoices.length, 'invoices');
    
    // Save successful data to backup
    try {
      await backupService.saveCompanyData('0e573687-3b53-498a-9e78-f198f16f8bcb', [], invoices);
      console.log('💾 Invoices backup saved successfully');
    } catch (backupError) {
      console.error('⚠️ Failed to save invoices backup:', backupError);
    }
    
    res.json({
      success: true,
      data: invoices,
      source: 'database'
    });
  } catch (error: any) {
    console.error('❌ Invoices API Error:', error);
    
    // Try to serve backup data
    const backup = await backupService.loadCompanyData('0e573687-3b53-498a-9e78-f198f16f8bcb');
    
    if (backup && backup.products.length > 0) {
      console.log('🚀 Invoices: Serving personalized backup data');
      return res.json({
        success: true,
        data: backup.products, // Using products as invoices backup for now
        source: 'backup',
        note: 'Database temporarily unavailable, serving your backed-up data'
      });
    }

    res.status(503).json({
      success: false,
      error: 'Database and backup unavailable',
      note: 'Please try again in a few moments'
    });
  }
});

// Create new invoice
router.post('/', async (req, res) => {
  try {
    console.log('💾 Invoices API: Creating new invoice');
    const invoiceData = req.body;
    
    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({
      where: { company_id: '0e573687-3b53-498a-9e78-f198f16f8bcb' }
    });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(3, '0')}`;
    
    // Create invoice data with proper typing
    const invoiceCreateData: Prisma.InvoiceUncheckedCreateInput = {
      invoice_number: invoiceNumber,
      company_id: '0e573687-3b53-498a-9e78-f198f16f8bcb',
      customer_id: invoiceData.customer_id,
      order_id: invoiceData.order_id,
      reference_number: invoiceData.reference_number,
      project_name: invoiceData.project_name,
      job_name: invoiceData.job_name,
      job_description: invoiceData.job_description,
      subtotal: invoiceData.subtotal,
      tax_amount: invoiceData.tax_amount || 0,
      discount_amount: invoiceData.discount_amount || 0,
      total_amount: invoiceData.total_amount,
      due_date: invoiceData.due_date ? new Date(invoiceData.due_date) : null,
      sales_rep: invoiceData.sales_rep,
      needs_followup: invoiceData.needs_followup || false,
      followup_date: invoiceData.followup_date ? new Date(invoiceData.followup_date) : null,
      created_by: invoiceData.created_by || 'system',
      option_data: invoiceData.option_groups || {},
      custom_fields: invoiceData.custom_fields || {},
      notes: invoiceData.notes
    };

    // Create invoice first
    const invoice = await prisma.invoice.create({
      data: invoiceCreateData,
      include: {
        customer: true,
        order: true
      }
    });

    // Create line items separately
    if (invoiceData.line_items && invoiceData.line_items.length > 0) {
      await prisma.invoiceLineItem.createMany({
        data: invoiceData.line_items.map((item: any, index: number) => ({
          invoice_id: invoice.id,
          product_id: item.product_id,
          sort_order: index,
          product_name: item.product_name,
          product_code: item.product_code,
          description: item.description,
          category_path: item.category_path,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          customer_tier: item.customer_tier,
          job_section_name: item.job_section_name
        }))
      });
    }

    console.log('✅ Invoices API: Invoice created with number:', invoice.invoice_number);
    
    res.json({
      success: true,
      data: invoice,
      invoice_number: invoiceNumber
    });
  } catch (error: any) {
    console.error('❌ Invoices API Create Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Generate PDF for invoice
router.post('/:id/pdf', async (req, res) => {
  try {
    const invoiceId = req.params.id;
    console.log('📄 Invoices PDF: Generating PDF for invoice:', invoiceId);
    
    res.json({
      success: true,
      message: 'Invoice PDF generation will be implemented next'
    });
    
  } catch (error: any) {
    console.error('❌ Invoices PDF Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;