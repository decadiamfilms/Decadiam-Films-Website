import { Router } from 'express';
import pricingRoutes from './pricing';
import templatesRoutes from './templates';
import customerPricingRoutes from './customer-pricing';
import { authenticate } from '../../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = Router();

// Apply auth middleware to all glass routes
router.use(authenticate);

// Mount sub-routes
router.use('/pricing', pricingRoutes);
router.use('/templates', templatesRoutes);
router.use('/customer', customerPricingRoutes);

// Glass types CRUD endpoints - now using database
router.get('/types', async (req, res) => {
  try {
    const glassTypes = await prisma.glassType.findMany({
      where: { isActive: true },
      include: {
        glassProducts: {
          where: { isActive: true },
          orderBy: { thickness: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    res.json(glassTypes);
  } catch (error) {
    console.error('Error fetching glass types:', error);
    res.status(500).json({ error: 'Failed to fetch glass types' });
  }
});

// Create new glass type with thicknesses
router.post('/types', async (req, res) => {
  try {
    const { name, thicknesses } = req.body;
    
    // Create glass type and products in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the glass type
      const glassType = await tx.glassType.create({
        data: {
          name,
          basePrice: 0, // Will be calculated from products
          isActive: true
        }
      });
      
      // Create glass products for each thickness
      const glassProducts = [];
      for (const thickness of thicknesses) {
        // Create NOT_TOUGHENED product
        const notToughened = await tx.glassProduct.create({
          data: {
            glassTypeId: glassType.id,
            sku: `${name.toUpperCase().replace(/\s+/g, '-')}-NT-${thickness.thickness}MM`,
            thickness: thickness.thickness,
            productType: 'NOT_TOUGHENED',
            priceT1: thickness.price * 0.85, // 15% discount for T1
            priceT2: thickness.price * 0.90, // 10% discount for T2
            priceT3: thickness.price * 0.95, // 5% discount for T3
            priceRetail: thickness.price,
            isActive: true
          }
        });
        glassProducts.push(notToughened);
        
        // Create TOUGHENED product if applicable
        if (thickness.canBeToughened) {
          const toughenedPrice = thickness.price * (1 + thickness.tougheningPercent / 100);
          const toughened = await tx.glassProduct.create({
            data: {
              glassTypeId: glassType.id,
              sku: `${name.toUpperCase().replace(/\s+/g, '-')}-T-${thickness.thickness}MM`,
              thickness: thickness.thickness,
              productType: 'TOUGHENED',
              priceT1: toughenedPrice * 0.85,
              priceT2: toughenedPrice * 0.90,
              priceT3: toughenedPrice * 0.95,
              priceRetail: toughenedPrice,
              isActive: true
            }
          });
          glassProducts.push(toughened);
        }
      }
      
      return { glassType, glassProducts };
    });
    
    res.json({
      glassType: result.glassType,
      products: result.glassProducts,
      message: `Glass type "${name}" created with ${result.glassProducts.length} products`
    });
    
  } catch (error) {
    console.error('Error creating glass type:', error);
    res.status(500).json({ error: 'Failed to create glass type' });
  }
});

// Update glass type
router.put('/types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, basePrice, isActive } = req.body;
    
    // In real implementation, update in database
    res.json({
      message: `Glass type updated successfully`,
      glassType: {
        id,
        name,
        basePrice: parseFloat(basePrice),
        isActive,
        updatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error updating glass type:', error);
    res.status(500).json({ error: 'Failed to update glass type' });
  }
});

// Delete glass type
router.delete('/types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // In real implementation, delete from database
    res.json({
      message: `Glass type deleted successfully`
    });
    
  } catch (error) {
    console.error('Error deleting glass type:', error);
    res.status(500).json({ error: 'Failed to delete glass type' });
  }
});

// Processing options endpoint - now using database
router.get('/processing-options', async (req, res) => {
  try {
    const processingOptions = await prisma.glassProcessingOption.findMany({
      where: { isActive: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }]
    });
    
    // Group by type for easier frontend consumption
    const grouped = {
      edgework: processingOptions.filter(opt => opt.type === 'EDGEWORK'),
      cornerFinish: processingOptions.filter(opt => opt.type === 'CORNER'),
      holesCutouts: processingOptions.filter(opt => opt.type === 'HOLE'),
      services: processingOptions.filter(opt => opt.type === 'SERVICE'),
      surfaceFinish: processingOptions.filter(opt => opt.type === 'FINISH')
    };
    
    res.json(grouped);
  } catch (error) {
    console.error('Error fetching processing options:', error);
    res.status(500).json({ error: 'Failed to fetch processing options' });
  }
});

// Update processing option - now using database
router.put('/processing-options/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { baseRate } = req.body;
    
    const updatedOption = await prisma.glassProcessingOption.update({
      where: { id },
      data: {
        baseRate: parseFloat(baseRate)
      }
    });
    
    res.json({
      message: `Processing option updated successfully`,
      option: updatedOption
    });
    
  } catch (error) {
    console.error('Error updating processing option:', error);
    res.status(500).json({ error: 'Failed to update processing option' });
  }
});

// Add new processing option - now using database
router.post('/processing-options', async (req, res) => {
  try {
    const { type, name, baseRate, rateType, description } = req.body;
    
    const newOption = await prisma.glassProcessingOption.create({
      data: {
        type: type.toUpperCase(),
        name,
        baseRate: parseFloat(baseRate),
        rateType: rateType.toUpperCase(),
        description,
        isActive: true
      }
    });
    
    res.json({
      message: `Processing option "${name}" created successfully`,
      option: newOption
    });
    
  } catch (error) {
    console.error('Error creating processing option:', error);
    res.status(500).json({ error: 'Failed to create processing option' });
  }
});

// Seed initial data if database is empty
router.post('/seed-initial-data', async (req, res) => {
  try {
    // Check if data already exists
    const existingTypes = await prisma.glassType.count();
    const existingOptions = await prisma.glassProcessingOption.count();
    
    if (existingTypes > 0 && existingOptions > 0) {
      return res.json({ message: 'Data already exists' });
    }
    
    // Seed glass types and products
    await prisma.$transaction(async (tx) => {
      // Clear Glass
      const clearGlass = await tx.glassType.create({
        data: {
          name: 'Clear Glass',
          basePrice: 120,
          isActive: true
        }
      });
      
      await tx.glassProduct.createMany({
        data: [
          {
            glassTypeId: clearGlass.id,
            sku: 'CLEAR-NT-4MM',
            thickness: 4,
            productType: 'NOT_TOUGHENED',
            priceT1: 25,
            priceT2: 28,
            priceT3: 32,
            priceRetail: 40
          },
          {
            glassTypeId: clearGlass.id,
            sku: 'CLEAR-NT-6MM',
            thickness: 6,
            productType: 'NOT_TOUGHENED',
            priceT1: 30,
            priceT2: 35,
            priceT3: 40,
            priceRetail: 50
          },
          {
            glassTypeId: clearGlass.id,
            sku: 'CLEAR-T-6MM',
            thickness: 6,
            productType: 'TOUGHENED',
            priceT1: 45,
            priceT2: 50,
            priceT3: 55,
            priceRetail: 70
          },
          {
            glassTypeId: clearGlass.id,
            sku: 'CLEAR-T-10MM',
            thickness: 10,
            productType: 'TOUGHENED',
            priceT1: 65,
            priceT2: 72,
            priceT3: 80,
            priceRetail: 100
          },
          {
            glassTypeId: clearGlass.id,
            sku: 'CLEAR-T-12MM',
            thickness: 12,
            productType: 'TOUGHENED',
            priceT1: 75,
            priceT2: 85,
            priceT3: 95,
            priceRetail: 120
          }
        ]
      });
      
      // Ultra Clear Glass
      const ultraClear = await tx.glassType.create({
        data: {
          name: 'Ultra Clear Glass',
          basePrice: 150,
          isActive: true
        }
      });
      
      await tx.glassProduct.createMany({
        data: [
          {
            glassTypeId: ultraClear.id,
            sku: 'ULTRA-T-10MM',
            thickness: 10,
            productType: 'TOUGHENED',
            priceT1: 90,
            priceT2: 100,
            priceT3: 110,
            priceRetail: 135
          },
          {
            glassTypeId: ultraClear.id,
            sku: 'ULTRA-T-12MM',
            thickness: 12,
            productType: 'TOUGHENED',
            priceT1: 105,
            priceT2: 115,
            priceT3: 125,
            priceRetail: 150
          }
        ]
      });
      
      // Seed processing options
      await tx.glassProcessingOption.createMany({
        data: [
          // Edgework
          { type: 'EDGEWORK', name: 'Arrissed Edges', baseRate: 8, rateType: 'PER_METER', description: 'Basic edge smoothing' },
          { type: 'EDGEWORK', name: 'Flat Polished Edges', baseRate: 15, rateType: 'PER_METER', description: 'Most popular choice' },
          { type: 'EDGEWORK', name: 'Miter Polished Edges', baseRate: 25, rateType: 'PER_METER', description: 'Angled polished edges' },
          { type: 'EDGEWORK', name: 'Beveled Edges', baseRate: 30, rateType: 'PER_METER', description: 'Decorative angled edges' },
          
          // Corner Finish
          { type: 'CORNER', name: 'Tip Corners', baseRate: 8, rateType: 'PER_PIECE', description: 'Standard corner tip' },
          { type: 'CORNER', name: 'Radius Polished Corners (10mm)', baseRate: 12, rateType: 'PER_PIECE', description: '10mm radius' },
          { type: 'CORNER', name: 'Radius Polished Corners (25mm)', baseRate: 18, rateType: 'PER_PIECE', description: '25mm radius' },
          
          // Holes and Cutouts
          { type: 'HOLE', name: 'Standard Hole (6mm)', baseRate: 12, rateType: 'PER_PIECE', description: 'Standard 6mm hole' },
          { type: 'HOLE', name: 'Hinge Cutout', baseRate: 25, rateType: 'PER_PIECE', description: 'Hinge cutout' },
          { type: 'HOLE', name: 'Power Point Cutout', baseRate: 35, rateType: 'PER_PIECE', description: 'Power point cutout' },
          
          // Services
          { type: 'SERVICE', name: 'Template Service', baseRate: 50, rateType: 'FIXED', description: 'Template creation service' },
          { type: 'SERVICE', name: 'Additional Labor', baseRate: 75, rateType: 'FIXED', description: 'Additional labor charges' },
          { type: 'SERVICE', name: 'Setup Charges', baseRate: 35, rateType: 'FIXED', description: 'Setup charges' },
          
          // Surface Finishes
          { type: 'FINISH', name: 'Paint Finish', baseRate: 25, rateType: 'PER_SQM', description: 'Paint finish per square meter' },
          { type: 'FINISH', name: 'Sandblasted', baseRate: 18, rateType: 'PER_SQM', description: 'Sandblasted finish' },
          { type: 'FINISH', name: 'Vinyl Backing', baseRate: 12, rateType: 'PER_PIECE', description: 'Vinyl backing per piece' }
        ]
      });
    });
    
    res.json({ message: 'Initial glass data seeded successfully' });
    
  } catch (error) {
    console.error('Error seeding initial data:', error);
    res.status(500).json({ error: 'Failed to seed initial data' });
  }
});

// Get suppliers for dropdowns - currently from supplier management localStorage
router.get('/suppliers', async (req, res) => {
  try {
    // Since suppliers are stored in localStorage in SupplierManagement, 
    // we'll return some default suppliers that match the glass processing options
    const defaultSuppliers = [
      { id: 'supplier-1', name: 'ABC Glass Supplies', email: 'orders@abcglass.com', phone: '+61 2 9876 5432' },
      { id: 'supplier-2', name: 'XYZ Hardware Distributors', email: 'sales@xyzhardware.com', phone: '+61 3 8765 4321' },
      { id: 'supplier-3', name: 'Premium Glass Solutions', email: 'info@premiumglass.com', phone: '+61 7 7654 3210' },
      { id: 'supplier-4', name: 'Industrial Glass Co', email: 'orders@industrialglass.com', phone: '+61 8 6543 2109' },
      { id: 'supplier-5', name: 'Clear View Glass', email: 'contact@clearview.com', phone: '+61 4 5432 1098' }
    ];
    
    res.json(defaultSuppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Calculate glass price with proper formula: quantity × height × width × base thickness price
router.get('/calculate-price', async (req, res) => {
  try {
    const {
      glassTypeId,
      productType, 
      thickness,
      quantity,
      heightMm,
      widthMm,
      customerId,
      edgeworkIds,
      cornerFinishIds,
      holesIds,
      serviceIds,
      finishIds
    } = req.query;

    // Convert parameters
    const qty = parseInt(quantity as string) || 1;
    const height = parseFloat(heightMm as string) || 0;
    const width = parseFloat(widthMm as string) || 0;
    const thick = parseFloat(thickness as string) || 0;

    if (height <= 0 || width <= 0 || qty <= 0) {
      return res.status(400).json({ error: 'Invalid dimensions or quantity' });
    }

    // Calculate total area: quantity × height × width (in square meters)
    const areaPerPanel = (height / 1000) * (width / 1000);
    const totalArea = areaPerPanel * qty;
    const perimeter = 2 * ((height / 1000) + (width / 1000)) * qty;

    // Get customer tier (simplified for now - should come from customer data)
    let customerTier = 'retail'; // Default
    // TODO: Fetch actual customer tier from database based on customerId

    // Get glass product pricing from database
    const glassProduct = await prisma.glassProduct.findFirst({
      where: {
        glassTypeId: glassTypeId as string,
        productType: productType as string,
        thickness: thick,
        isActive: true
      }
    });

    if (!glassProduct) {
      return res.status(404).json({ error: 'Glass product not found' });
    }

    // Base glass price calculation: quantity × height × width × base thickness price (per tier)
    let basePricePerSqm = 0;
    switch (customerTier) {
      case 't1': basePricePerSqm = glassProduct.priceT1; break;
      case 't2': basePricePerSqm = glassProduct.priceT2; break;
      case 't3': basePricePerSqm = glassProduct.priceT3; break;
      default: basePricePerSqm = glassProduct.priceRetail; break;
    }

    // Proper pricing formula: quantity × height × width × base thickness price
    const baseGlass = totalArea * basePricePerSqm;

    // Calculate processing costs (simplified - should use actual processing options from DB)
    let totalProcessingCost = 0;
    const processingBreakdown: any[] = [];

    // Add processing costs based on selected options
    if (edgeworkIds) {
      const edgeworkOptions = await prisma.glassProcessingOption.findMany({
        where: { 
          id: { in: (edgeworkIds as string).split(',') },
          type: 'EDGEWORK',
          isActive: true
        }
      });

      edgeworkOptions.forEach(option => {
        const cost = option.baseRate * perimeter; // Per linear meter
        totalProcessingCost += cost;
        processingBreakdown.push({
          name: option.name,
          cost,
          type: 'edgework'
        });
      });
    }

    // Add other processing costs (corners, holes, services, finishes)
    const processingTypes = [
      { param: cornerFinishIds, type: 'CORNER', multiplier: qty },
      { param: holesIds, type: 'HOLE', multiplier: qty },
      { param: serviceIds, type: 'SERVICE', multiplier: 1 },
      { param: finishIds, type: 'FINISH', multiplier: totalArea }
    ];

    for (const procType of processingTypes) {
      if (procType.param) {
        const options = await prisma.glassProcessingOption.findMany({
          where: { 
            id: { in: (procType.param as string).split(',') },
            type: procType.type,
            isActive: true
          }
        });

        options.forEach(option => {
          const cost = option.baseRate * procType.multiplier;
          totalProcessingCost += cost;
          processingBreakdown.push({
            name: option.name,
            cost,
            type: procType.type.toLowerCase()
          });
        });
      }
    }

    const total = baseGlass + totalProcessingCost;

    res.json({
      total,
      basePrice: baseGlass,
      processingCost: totalProcessingCost,
      pricePerSqm: basePricePerSqm,
      sqm: totalArea,
      glassProduct,
      breakdown: {
        glass: `$${baseGlass.toFixed(2)} (${totalArea.toFixed(3)}m² × $${basePricePerSqm}/m²)`,
        processing: processingBreakdown,
        processingTotal: `$${totalProcessingCost.toFixed(2)}`,
        total: `$${total.toFixed(2)}`
      }
    });

  } catch (error) {
    console.error('Error calculating glass price:', error);
    res.status(500).json({ error: 'Failed to calculate price' });
  }
});

export default router;