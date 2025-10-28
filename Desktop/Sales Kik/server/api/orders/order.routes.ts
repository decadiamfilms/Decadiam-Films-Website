import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import backupService from '../../services/backup.service';
// import orderPdfService from '../../services/orderPdf.service'; // TODO: Fix PDF service

const router = Router();
const prisma = new PrismaClient();

// Get all orders
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Orders API: Loading orders from database');
    
    const orders = await prisma.order.findMany({
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
        quote: true
      },
      orderBy: { created_at: 'desc' }
    });

    console.log('✅ Orders API: Found', orders.length, 'orders');
    
    // Save successful data to backup
    try {
      await backupService.saveCompanyData('0e573687-3b53-498a-9e78-f198f16f8bcb', [], orders);
      console.log('💾 Orders backup saved successfully');
    } catch (backupError) {
      console.error('⚠️ Failed to save orders backup:', backupError);
    }
    
    res.json({
      success: true,
      data: orders,
      source: 'database'
    });
  } catch (error: any) {
    console.error('❌ Orders API Error:', error);
    
    // Try to serve backup data
    const backup = await backupService.loadCompanyData('0e573687-3b53-498a-9e78-f198f16f8bcb');
    
    if (backup && backup.products.length > 0) {
      console.log('🚀 Orders: Serving personalized backup data');
      return res.json({
        success: true,
        data: backup.products, // Using products as orders backup for now
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

// Create new order
router.post('/', async (req, res) => {
  try {
    console.log('💾 Orders API: Creating new order');
    const orderData = req.body;
    
    // Generate order number
    const orderCount = await prisma.order.count({
      where: { company_id: '0e573687-3b53-498a-9e78-f198f16f8bcb' }
    });
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(3, '0')}`;
    
    // Create order data with proper typing
    const orderCreateData: Prisma.OrderUncheckedCreateInput = {
      order_number: orderNumber,
      company_id: '0e573687-3b53-498a-9e78-f198f16f8bcb',
      customer_id: orderData.customer_id,
      quote_id: orderData.quote_id,
      reference_number: orderData.reference_number,
      project_name: orderData.project_name,
      job_name: orderData.job_name,
      job_description: orderData.job_description,
      special_instructions: orderData.special_instructions,
      delivery_method: orderData.delivery_method,
      delivery_address: orderData.delivery_address,
      delivery_contact: orderData.delivery_contact,
      delivery_phone: orderData.delivery_phone,
      delivery_instructions: orderData.delivery_instructions,
      delivery_date: orderData.delivery_date ? new Date(orderData.delivery_date) : null,
      subtotal: orderData.subtotal,
      tax_amount: orderData.tax_amount || 0,
      discount_amount: orderData.discount_amount || 0,
      total_amount: orderData.total_amount,
      payment_terms: orderData.payment_terms,
      priority: orderData.priority || 'NORMAL',
      due_date: orderData.due_date ? new Date(orderData.due_date) : null,
      created_by: orderData.created_by || 'system',
      option_data: orderData.option_groups || {},
      custom_fields: orderData.custom_fields || {},
      notes: orderData.notes
    };

    // Create order first
    const order = await prisma.order.create({
      data: orderCreateData,
      include: {
        customer: true,
        quote: true
      }
    });

    // Create line items separately
    if (orderData.line_items && orderData.line_items.length > 0) {
      await prisma.orderLineItem.createMany({
        data: orderData.line_items.map((item: any, index: number) => ({
          order_id: order.id,
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

    console.log('✅ Orders API: Order created with number:', order.order_number);
    
    res.json({
      success: true,
      data: order,
      order_number: orderNumber
    });
  } catch (error: any) {
    console.error('❌ Orders API Create Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Generate PDF for order
router.post('/:id/pdf', async (req, res) => {
  try {
    const orderId = req.params.id;
    console.log('📄 Orders PDF: Generating PDF for order:', orderId);
    
    // Get order data with all details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        line_items: {
          include: {
            product: true
          }
        },
        documents: true,
        quote: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Prepare order data for PDF service
    const orderData = {
      id: order.id,
      order_number: order.order_number,
      customer_name: order.customer?.name || 'Unknown Customer',
      customer_email: order.customer?.email,
      customer_address: order.customer?.address ? String(order.customer.address) : '',
      project_name: order.project_name,
      job_name: order.job_name,
      reference_number: order.reference_number,
      order_date: order.created_at,
      due_date: order.due_date,
      delivery_method: order.delivery_method,
      delivery_address: order.delivery_address,
      delivery_contact: order.delivery_contact,
      delivery_phone: order.delivery_phone,
      delivery_instructions: order.delivery_instructions,
      line_items: order.line_items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total_price
      })),
      options: [], // TODO: Parse from option_data when needed
      subtotal: order.subtotal,
      tax_amount: order.tax_amount,
      total_amount: order.total_amount,
      notes: order.notes,
      special_instructions: order.special_instructions,
      priority: order.priority,
      status: order.status
    };

    const templateData = {
      company_name: 'Your Company',
      company_address: '123 Business St, City, State 12345',
      company_phone: '(555) 123-4567',
      company_email: 'info@yourcompany.com',
      company_logo: '',
      header_color: '#007bff',
      font_family: 'Arial',
      show_tax: true,
      tax_rate: 10
    };

    // TODO: Generate PDF (temporarily disabled for compilation)
    // const pdfBuffer = await orderPdfService.generateOrderPDF(orderData, templateData);
    // const filePath = await orderPdfService.saveOrderPDF(order.id, pdfBuffer);
    
    // TODO: Save document record after PDF generation is fixed
    
    console.log('✅ Orders PDF: PDF generation pending implementation');
    
    res.json({
      success: true,
      message: 'Order PDF generation will be implemented'
    });
    
  } catch (error: any) {
    console.error('❌ Orders PDF Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to generate order PDF'
    });
  }
});

export default router;// activate orders Tue Oct 28 20:24:49 AEDT 2025
// fix compilation Tue Oct 28 21:32:20 AEDT 2025
