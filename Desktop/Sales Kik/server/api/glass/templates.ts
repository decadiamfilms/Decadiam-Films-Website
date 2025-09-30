import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Template data structure as per your document
interface GlassTemplate {
  id: string;
  name: string;
  description: string;
  shapeType: 'rectangle' | 'rounded' | 'custom';
  dimensions?: {
    standardWidth?: number;
    standardHeight?: number;
    radiusSize?: number;
  };
  cutouts?: Array<{
    type: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
  }>;
  pricingRules: {
    baseCostMultiplier: number; // e.g., 1.15 for 15% markup
    processingCost: number; // Fixed cost for template complexity
    minimumCharge: number; // Minimum charge regardless of size
  };
  isActive: boolean;
  createdAt: Date;
}

// Mock templates data (as per document: "Templates can be uploaded and defined in the backend")
const mockTemplates: GlassTemplate[] = [
  {
    id: 'tmpl-rect',
    name: 'Standard Rectangle',
    description: 'Basic rectangular panel with standard edgework',
    shapeType: 'rectangle',
    pricingRules: {
      baseCostMultiplier: 1.0,
      processingCost: 0,
      minimumCharge: 50
    },
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'tmpl-rounded',
    name: 'Rounded Corners',
    description: 'Rectangular panel with rounded corners',
    shapeType: 'rounded',
    dimensions: {
      radiusSize: 25 // 25mm radius
    },
    pricingRules: {
      baseCostMultiplier: 1.15, // 15% markup for corner work
      processingCost: 30, // $30 per piece for corner processing
      minimumCharge: 75
    },
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'tmpl-cutout',
    name: 'Custom Cutout',
    description: 'Panel with standard power point and hinge cutouts',
    shapeType: 'custom',
    cutouts: [
      {
        type: 'power-point',
        position: { x: 100, y: 50 },
        size: { width: 35, height: 35 }
      },
      {
        type: 'hinge',
        position: { x: 0, y: 100 },
        size: { width: 25, height: 80 }
      }
    ],
    pricingRules: {
      baseCostMultiplier: 1.25, // 25% markup for custom work
      processingCost: 85, // $85 for cutout work
      minimumCharge: 120
    },
    isActive: true,
    createdAt: new Date()
  }
];

// Automated cost calculation function (as per document)
function calculateTemplateCost(
  template: GlassTemplate,
  glassBasePrice: number,
  quantity: number,
  heightMm: number,
  widthMm: number
): { totalCost: number; breakdown: any } {
  const sqmPerPanel = (heightMm / 1000) * (widthMm / 1000);
  const baseCost = glassBasePrice * sqmPerPanel * quantity;
  
  // Apply template pricing rules
  const adjustedBaseCost = baseCost * template.pricingRules.baseCostMultiplier;
  const processingCost = template.pricingRules.processingCost * quantity;
  const totalBeforeMinimum = adjustedBaseCost + processingCost;
  
  // Apply minimum charge
  const finalCost = Math.max(totalBeforeMinimum, template.pricingRules.minimumCharge);
  
  return {
    totalCost: finalCost,
    breakdown: {
      baseCost: adjustedBaseCost,
      processingCost: processingCost,
      minimumApplied: finalCost === template.pricingRules.minimumCharge,
      sqmPerPanel: sqmPerPanel
    }
  };
}

// Get all available templates
router.get('/templates', authenticate, async (req, res) => {
  try {
    // Return active templates only
    const activeTemplates = mockTemplates.filter(t => t.isActive);
    res.json(activeTemplates);
  } catch (error) {
    console.error('Error fetching glass templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Calculate template cost
router.post('/templates/calculate', authenticate, async (req, res) => {
  try {
    const { templateId, glassBasePrice, quantity, heightMm, widthMm } = req.body;
    
    const template = mockTemplates.find(t => t.id === templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const calculation = calculateTemplateCost(
      template,
      glassBasePrice || 120,
      quantity || 1,
      heightMm || 1000,
      widthMm || 1000
    );
    
    res.json({
      template: template,
      calculation: calculation,
      message: `Template "${template.name}" cost calculated successfully`
    });
    
  } catch (error) {
    console.error('Error calculating template cost:', error);
    res.status(500).json({ error: 'Failed to calculate template cost' });
  }
});

// Admin: Create new template
router.post('/templates', authenticate, async (req, res) => {
  try {
    const newTemplate: GlassTemplate = {
      id: `tmpl-${Date.now()}`,
      ...req.body,
      createdAt: new Date()
    };
    
    mockTemplates.push(newTemplate);
    
    res.json({
      template: newTemplate,
      message: 'Template created successfully'
    });
    
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

export default router;