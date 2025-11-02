import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getCompanyId } from '../../utils/company.utils';

const router = Router();
const prisma = new PrismaClient();

// Get all quotes
router.get('/', async (req: AuthRequest, res) => {
  try {
    const companyId = getCompanyId(req);
    console.log('🔍 Quotes API: Loading quotes for company:', companyId);
    
    const quotes = await prisma.quote.findMany({
      where: { 
        company_id: companyId
      },
      include: {
        customer: true,
        line_items: {
          include: {
            product: true
          }
        },
        documents: true,
        template: true
      },
      orderBy: { created_at: 'desc' }
    });

    console.log('✅ Quotes API: Found', quotes.length, 'quotes');
    
    res.json({
      success: true,
      data: quotes,
      source: 'database'
    });
  } catch (error: any) {
    console.error('❌ Quotes API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Create new quote
router.post('/', async (req: AuthRequest, res) => {
  try {
    console.log('💾 Quotes API: Creating new quote');
    const quoteData = req.body;
    
    // Generate quote number
    const quoteCount = await prisma.quote.count({
      where: { company_id: getCompanyId(req) }
    });
    const quoteNumber = `QT-${new Date().getFullYear()}-${String(quoteCount + 1).padStart(3, '0')}`;
    
    // Create quote with line items and options
    // First create the quote using UncheckedCreateInput to avoid type intersection issues
    const quoteCreateData: Prisma.QuoteUncheckedCreateInput = {
      quote_number: quoteNumber,
      company_id: getCompanyId(req),
      customer_id: quoteData.customer_id,
      job_name: quoteData.job_name,
      job_description: quoteData.job_description,
      special_instructions: quoteData.special_instructions,
      subtotal: quoteData.subtotal,
      tax_amount: quoteData.tax_amount || 0,
      total_amount: quoteData.total_amount,
      valid_until: quoteData.valid_until ? new Date(quoteData.valid_until) : null,
      created_by: quoteData.created_by || 'system',
      option_data: quoteData.option_groups || {},
    };

    const quote = await prisma.quote.create({
      data: quoteCreateData,
      include: {
        customer: true,
        line_items: {
          include: {
            product: true
          }
        }
      }
    });

    // Create line items separately
    if (quoteData.line_items && quoteData.line_items.length > 0) {
      await prisma.quoteLineItem.createMany({
        data: quoteData.line_items.map((item: any, index: number) => ({
          quote_id: quote.id,
          product_id: item.product_id,
          job_section_name: item.job_section_name,
          sort_order: index,
          product_name: item.product_name,
          product_code: item.product_code,
          description: item.description,
          category_path: item.category_path,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          customer_tier: item.customer_tier
        }))
      });
    }

    console.log('✅ Quotes API: Quote created with number:', quote.quote_number);
    
    res.json({
      success: true,
      data: quote,
      quote_number: quoteNumber
    });
  } catch (error: any) {
    console.error('❌ Quotes API Create Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// QUICK VEHICLE DATABASE ENDPOINTS (temporary until fleet API fixed)
router.get('/vehicles', async (req, res) => {
  try {
    const companyId = '0e573687-3b53-498a-9e78-f198f16f8bcb';
    
    const vehicles = await prisma.vehicle.findMany({
      where: {
        company_id: companyId,
        is_active: true
      },
      orderBy: { created_at: 'desc' }
    });

    console.log(`🚛 Vehicle DB: Found ${vehicles.length} vehicles`);
    
    res.json({
      success: true,
      data: vehicles,
      count: vehicles.length
    });
  } catch (error) {
    console.error('Vehicle fetch error:', error);
    res.json({ success: true, data: [], count: 0 });
  }
});

router.post('/vehicles', async (req, res) => {
  try {
    const companyId = '0e573687-3b53-498a-9e78-f198f16f8bcb';
    const { registration, make, model, year, type, maxWeight, maxVolume, fuelType } = req.body;

    // Check existing
    const existing = await prisma.vehicle.findUnique({
      where: { registration: registration.toUpperCase() }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: `Vehicle ${registration} already exists`
      });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        company_id: companyId,
        registration: registration.toUpperCase(),
        make: make || 'Unknown',
        model: model || 'Unknown',
        year: year ? parseInt(year.toString()) : null,
        type: type || 'CAR',
        max_weight: maxWeight && maxWeight !== '' ? parseFloat(maxWeight) : null,
        max_volume: maxVolume && maxVolume !== '' ? parseFloat(maxVolume) : null,
        fuel_type: fuelType || 'PETROL',
        status: 'AVAILABLE'
      }
    });

    console.log(`✅ Vehicle DB: Created ${vehicle.registration} (${vehicle.make} ${vehicle.model})`);
    
    res.json({
      success: true,
      data: vehicle,
      message: `Vehicle ${vehicle.registration} added successfully`
    });
  } catch (error) {
    console.error('Vehicle create error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Database error'
    });
  }
});

export default router;