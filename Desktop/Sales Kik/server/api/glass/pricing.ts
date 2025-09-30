import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Real-time pricing calculation as per your document
router.post('/calculate-price', authenticate, async (req, res) => {
  try {
    const { 
      glassType, 
      productType = 'NOT_TOUGHENED',
      thickness, 
      quantity = 1, 
      heightMm, 
      widthMm,
      edgework,
      cornerFinish,
      holes,
      services,
      finishes,
      customerId 
    } = req.body;

    if (!glassType || !thickness || !heightMm || !widthMm) {
      return res.json({ 
        total: 0, 
        breakdown: { error: 'Missing required parameters' } 
      });
    }

    // Base glass pricing (as per document specifications)
    let pricePerSqm = getBasePricing(glassType);
    
    // Customer-specific pricing tiers (as per document)
    if (customerId) {
      const customerPricing = await getCustomerSpecificPricing(customerId, glassType, thickness);
      if (customerPricing) {
        pricePerSqm = customerPricing;
      }
    }

    // Toughened glass surcharge (as per document)
    if (productType === 'TOUGHENED') {
      pricePerSqm *= 1.3; // 30% surcharge for toughening
    }

    // Calculate dimensions
    const sqmPerPanel = (parseFloat(heightMm) / 1000) * (parseFloat(widthMm) / 1000);
    const totalSqm = sqmPerPanel * parseInt(quantity);
    const basePrice = pricePerSqm * totalSqm;

    // Processing costs (as per document - "defined rate based on lineal meters")
    let processingCost = 0;
    const perimeterM = ((parseFloat(heightMm) + parseFloat(widthMm)) * 2 / 1000) * parseInt(quantity);
    
    // Edgework - priced per linear meter, adjusts for thickness
    if (edgework) {
      processingCost += perimeterM * getEdgeworkRate(edgework, parseInt(thickness));
    }
    
    // Corner Finish - per piece, adjusts for thickness and radius
    if (cornerFinish) {
      processingCost += parseInt(quantity) * getCornerRate(cornerFinish, parseInt(thickness));
    }
    
    // Holes - per piece, varies by size and thickness
    if (holes) {
      processingCost += parseInt(quantity) * getHoleRate(holes, parseInt(thickness));
    }
    
    // Services - template, labor, miscellaneous
    if (services) {
      processingCost += getServiceRate(services);
    }
    
    // Surface Finishes - varied pricing models (sqm, piece, labor hour)
    if (finishes) {
      processingCost += getSurfaceFinishRate(finishes, totalSqm, parseInt(quantity));
    }

    const total = basePrice + processingCost;

    return res.json({
      total,
      basePrice,
      processingCost,
      pricePerSqm,
      sqm: totalSqm,
      perimeter: perimeterM,
      breakdown: {
        glass: `${totalSqm.toFixed(2)}m² × $${pricePerSqm.toFixed(2)} = $${basePrice.toFixed(2)}`,
        processing: `$${processingCost.toFixed(2)}`,
        edgework: edgework ? `${perimeterM.toFixed(2)}m × $${getEdgeworkRate(edgework, parseInt(thickness))}/m = $${(perimeterM * getEdgeworkRate(edgework, parseInt(thickness))).toFixed(2)}` : '',
        corners: cornerFinish ? `${quantity}pc × $${getCornerRate(cornerFinish, parseInt(thickness))}/pc = $${(parseInt(quantity) * getCornerRate(cornerFinish, parseInt(thickness))).toFixed(2)}` : '',
        holes: holes ? `${quantity}pc × $${getHoleRate(holes, parseInt(thickness))}/pc = $${(parseInt(quantity) * getHoleRate(holes, parseInt(thickness))).toFixed(2)}` : '',
        services: services ? `$${getServiceRate(services).toFixed(2)}` : '',
        finishes: finishes ? `$${getSurfaceFinishRate(finishes, totalSqm, parseInt(quantity)).toFixed(2)}` : '',
        total: `$${total.toFixed(2)}`
      }
    });

  } catch (error) {
    console.error('Glass price calculation error:', error);
    return res.status(500).json({ 
      total: 0, 
      error: 'Calculation failed',
      breakdown: {} 
    });
  }
});

// Base glass pricing function
function getBasePricing(glassType: string): number {
  const basePrices: Record<string, number> = {
    'clear': 120,
    'ultra-clear': 150,
    'mirror': 180,
    'toughened': 140,
    'laminated': 200
  };
  return basePrices[glassType] || 120;
}

// Customer-specific pricing (as per document)
async function getCustomerSpecificPricing(customerId: string, glassType: string, thickness: number): Promise<number | null> {
  // Mock customer pricing - in real implementation, query database
  const customerPricing: Record<string, Record<string, Record<number, number>>> = {
    'customer-1': { 'clear': { 6: 110, 8: 115 } }, // VIP pricing
    'customer-2': { 'ultra-clear': { 6: 140, 8: 145 } } // Bulk discount
  };
  
  return customerPricing[customerId]?.[glassType]?.[thickness] || null;
}

// Processing rate functions (as per document specifications)
function getEdgeworkRate(type: string, thickness: number): number {
  const baseRates: Record<string, number> = {
    'arrissed': 8,
    'flat-polished': 15,
    'miter-polished': 25,
    'beveled': 30
  };
  const baseRate = baseRates[type] || 0;
  // Adjust for thickness as per document
  return baseRate + (thickness > 8 ? thickness * 0.5 : 0);
}

function getCornerRate(type: string, thickness: number): number {
  const baseRates: Record<string, number> = {
    'tip': 8,
    'radius': 15
  };
  const baseRate = baseRates[type] || 0;
  // Adjust for thickness as per document
  return baseRate + (thickness > 6 ? thickness * 0.3 : 0);
}

function getHoleRate(type: string, thickness: number): number {
  const baseRates: Record<string, number> = {
    'standard-hole': 12,
    'hinge-cutout': 25,
    'power-cutout': 35
  };
  const baseRate = baseRates[type] || 0;
  // Vary by size and thickness as per document
  return baseRate + (thickness > 8 ? thickness * 0.4 : 0);
}

function getServiceRate(type: string): number {
  const rates: Record<string, number> = {
    'template': 50,
    'labor': 75,
    'setup': 35
  };
  return rates[type] || 0;
}

function getSurfaceFinishRate(type: string, sqm: number, quantity: number): number {
  const finishRates: Record<string, { type: string; rate: number }> = {
    'paint': { type: 'sqm', rate: 25 }, // per sqm
    'sandblast': { type: 'sqm', rate: 18 }, // per sqm  
    'vinyl-backing': { type: 'piece', rate: 12 } // per piece
  };
  
  const finish = finishRates[type];
  if (!finish) return 0;
  
  if (finish.type === 'sqm') {
    return sqm * finish.rate;
  } else {
    return quantity * finish.rate;
  }
}

export default router;