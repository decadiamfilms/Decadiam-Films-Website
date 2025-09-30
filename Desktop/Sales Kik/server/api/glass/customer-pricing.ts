import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Customer-specific glass pricing as per your document
interface CustomerGlassPricing {
  customerId: string;
  glassType: string;
  thickness: number;
  customerPrice: number;
  priceTier: 'T1' | 'T2' | 'T3' | 'RETAIL';
  effectiveDate: Date;
  expiryDate?: Date;
}

// Mock customer pricing data (as per document: "different price lists to be applied per client")
const mockCustomerPricing: CustomerGlassPricing[] = [
  // T1 Customer - Best pricing
  { customerId: '1', glassType: 'clear', thickness: 6, customerPrice: 110, priceTier: 'T1', effectiveDate: new Date() },
  { customerId: '1', glassType: 'clear', thickness: 8, customerPrice: 115, priceTier: 'T1', effectiveDate: new Date() },
  { customerId: '1', glassType: 'ultra-clear', thickness: 6, customerPrice: 140, priceTier: 'T1', effectiveDate: new Date() },
  
  // T2 Customer - Standard pricing
  { customerId: '2', glassType: 'clear', thickness: 6, customerPrice: 120, priceTier: 'T2', effectiveDate: new Date() },
  { customerId: '2', glassType: 'ultra-clear', thickness: 6, customerPrice: 150, priceTier: 'T2', effectiveDate: new Date() },
  
  // T3 Customer - Higher pricing
  { customerId: '3', glassType: 'clear', thickness: 6, customerPrice: 130, priceTier: 'T3', effectiveDate: new Date() },
];

// Get customer-specific pricing
router.get('/customer-pricing/:customerId', authenticate, async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const customerPricing = mockCustomerPricing.filter(p => p.customerId === customerId);
    
    if (customerPricing.length === 0) {
      // No custom pricing, return standard pricing
      return res.json({
        hasCustomPricing: false,
        message: 'Customer uses standard pricing',
        priceTier: 'RETAIL'
      });
    }
    
    // Group by glass type for easy lookup
    const pricingByGlassType = customerPricing.reduce((acc, pricing) => {
      if (!acc[pricing.glassType]) {
        acc[pricing.glassType] = {};
      }
      acc[pricing.glassType][pricing.thickness] = {
        price: pricing.customerPrice,
        tier: pricing.priceTier
      };
      return acc;
    }, {} as any);
    
    res.json({
      hasCustomPricing: true,
      customerId,
      priceTier: customerPricing[0].priceTier,
      pricing: pricingByGlassType,
      message: `Custom pricing loaded for ${customerPricing[0].priceTier} tier customer`
    });
    
  } catch (error) {
    console.error('Error fetching customer pricing:', error);
    res.status(500).json({ error: 'Failed to fetch customer pricing' });
  }
});

// Set customer-specific pricing (Admin function)
router.post('/customer-pricing', authenticate, async (req, res) => {
  try {
    const { customerId, glassType, thickness, customerPrice, priceTier } = req.body;
    
    // Remove existing pricing for this combination
    const existingIndex = mockCustomerPricing.findIndex(
      p => p.customerId === customerId && p.glassType === glassType && p.thickness === thickness
    );
    
    if (existingIndex >= 0) {
      mockCustomerPricing.splice(existingIndex, 1);
    }
    
    // Add new pricing
    const newPricing: CustomerGlassPricing = {
      customerId,
      glassType,
      thickness,
      customerPrice,
      priceTier,
      effectiveDate: new Date()
    };
    
    mockCustomerPricing.push(newPricing);
    
    res.json({
      pricing: newPricing,
      message: `Custom pricing set for customer ${customerId}`
    });
    
  } catch (error) {
    console.error('Error setting customer pricing:', error);
    res.status(500).json({ error: 'Failed to set customer pricing' });
  }
});

// Get pricing tiers summary
router.get('/pricing-tiers', authenticate, async (req, res) => {
  try {
    const tiers = {
      T1: { discount: '15%', description: 'Premium customers, best pricing' },
      T2: { discount: '10%', description: 'Standard customers, good pricing' },
      T3: { discount: '5%', description: 'New customers, standard pricing' },
      RETAIL: { discount: '0%', description: 'Retail customers, full pricing' }
    };
    
    res.json(tiers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pricing tiers' });
  }
});

export default router;