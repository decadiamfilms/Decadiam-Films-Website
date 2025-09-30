import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedGlassData() {
  try {
    console.log('Seeding Glass Industry Module data...');

    // Create Glass Types
    const clearGlass = await prisma.glassType.upsert({
      where: { id: 'glass-type-clear' },
      update: {},
      create: {
        id: 'glass-type-clear',
        name: 'Clear Glass',
        description: 'Standard clear float glass for general applications',
        isActive: true
      }
    });

    const ultraClear = await prisma.glassType.upsert({
      where: { id: 'glass-type-ultra-clear' },
      update: {},
      create: {
        id: 'glass-type-ultra-clear',
        name: 'Ultra Clear Glass',
        description: 'Low-iron glass with exceptional clarity and minimal green tint',
        isActive: true
      }
    });

    await prisma.glassType.upsert({
      where: { id: 'glass-type-tinted' },
      update: {},
      create: {
        id: 'glass-type-tinted',
        name: 'Tinted Glass',
        description: 'Solar control glass available in bronze, grey, and green tints',
        isActive: true
      }
    });

    await prisma.glassType.upsert({
      where: { id: 'glass-type-laminated' },
      update: {},
      create: {
        id: 'glass-type-laminated',
        name: 'Laminated Glass',
        description: 'Safety glass with PVB interlayer for security and sound reduction',
        isActive: true
      }
    });

    await prisma.glassType.upsert({
      where: { id: 'glass-type-mirror' },
      update: {},
      create: {
        id: 'glass-type-mirror',
        name: 'Mirror Glass',
        description: 'Silver-backed mirror glass for decorative and functional applications',
        isActive: true
      }
    });

    console.log('✓ Glass types created');

    // Create Glass Products for Clear Glass
    const clearGlassProducts = [
      { thickness: 4, basePrice: 25.50, productType: 'NOT_TOUGHENED' },
      { thickness: 5, basePrice: 28.75, productType: 'NOT_TOUGHENED' },
      { thickness: 6, basePrice: 32.00, productType: 'NOT_TOUGHENED' },
      { thickness: 8, basePrice: 38.50, productType: 'NOT_TOUGHENED' },
      { thickness: 10, basePrice: 45.00, productType: 'NOT_TOUGHENED' },
      { thickness: 12, basePrice: 52.50, productType: 'NOT_TOUGHENED' },
      { thickness: 4, basePrice: 45.00, productType: 'TOUGHENED' },
      { thickness: 5, basePrice: 48.75, productType: 'TOUGHENED' },
      { thickness: 6, basePrice: 52.00, productType: 'TOUGHENED' },
      { thickness: 8, basePrice: 58.50, productType: 'TOUGHENED' },
      { thickness: 10, basePrice: 65.00, productType: 'TOUGHENED' },
      { thickness: 12, basePrice: 72.50, productType: 'TOUGHENED' }
    ];

    for (const product of clearGlassProducts) {
      await prisma.glassProduct.upsert({
        where: {
          glassTypeId_productType_thickness: {
            glassTypeId: clearGlass.id,
            productType: product.productType as 'TOUGHENED' | 'NOT_TOUGHENED',
            thickness: product.thickness
          }
        },
        update: { basePrice: product.basePrice },
        create: {
          glassTypeId: clearGlass.id,
          productType: product.productType as 'TOUGHENED' | 'NOT_TOUGHENED',
          thickness: product.thickness,
          basePrice: product.basePrice,
          isActive: true
        }
      });
    }

    // Create Glass Products for Ultra Clear Glass (15% premium)
    const ultraClearProducts = clearGlassProducts.map(p => ({
      ...p,
      basePrice: p.basePrice * 1.15
    }));

    for (const product of ultraClearProducts) {
      await prisma.glassProduct.upsert({
        where: {
          glassTypeId_productType_thickness: {
            glassTypeId: ultraClear.id,
            productType: product.productType as 'TOUGHENED' | 'NOT_TOUGHENED',
            thickness: product.thickness
          }
        },
        update: { basePrice: product.basePrice },
        create: {
          glassTypeId: ultraClear.id,
          productType: product.productType as 'TOUGHENED' | 'NOT_TOUGHENED',
          thickness: product.thickness,
          basePrice: product.basePrice,
          isActive: true
        }
      });
    }

    console.log('✓ Glass products created');

    // Create Glass Processing Options
    const edgeworkOptions = [
      { name: 'Arrised Edge', description: 'Basic edge grinding to remove sharp edges', ratePerMeter: 2.50, thicknessMultiplier: { '4': 1.0, '5': 1.0, '6': 1.0, '8': 1.2, '10': 1.4, '12': 1.6 } },
      { name: 'Flat Polished Edge', description: 'Flat edge polished to optical quality', ratePerMeter: 8.50, thicknessMultiplier: { '4': 1.0, '5': 1.0, '6': 1.0, '8': 1.2, '10': 1.4, '12': 1.6 } },
      { name: 'Miter Polished Edge', description: 'Angled polished edge for joining', ratePerMeter: 12.00, thicknessMultiplier: { '4': 1.0, '5': 1.0, '6': 1.0, '8': 1.2, '10': 1.4, '12': 1.6 } },
      { name: 'Beveled Edge', description: 'Decorative beveled edge', ratePerMeter: 15.50, thicknessMultiplier: { '4': 1.0, '5': 1.0, '6': 1.0, '8': 1.2, '10': 1.4, '12': 1.6 } }
    ];

    for (const option of edgeworkOptions) {
      await prisma.glassEdgework.upsert({
        where: { id: `edgework-${option.name.toLowerCase().replace(/\s+/g, '-')}` },
        update: {},
        create: {
          id: `edgework-${option.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: option.name,
          description: option.description,
          ratePerMeter: option.ratePerMeter,
          thicknessMultiplier: option.thicknessMultiplier,
          isActive: true
        }
      });
    }

    // Create Corner Finish Options
    const cornerFinishOptions = [
      { name: 'Tip Corners', description: 'Remove sharp corners', ratePerPiece: 5.00, thicknessRates: { '4': 5.00, '5': 5.50, '6': 6.00, '8': 7.00, '10': 8.00, '12': 9.00 } },
      { name: 'Radius Polished 5mm', description: '5mm radius polished corners', ratePerPiece: 12.00, thicknessRates: { '4': 12.00, '5': 13.00, '6': 14.00, '8': 16.00, '10': 18.00, '12': 20.00 } },
      { name: 'Radius Polished 10mm', description: '10mm radius polished corners', ratePerPiece: 15.00, thicknessRates: { '4': 15.00, '5': 16.00, '6': 17.00, '8': 19.00, '10': 21.00, '12': 23.00 } }
    ];

    for (const option of cornerFinishOptions) {
      await prisma.glassCornerFinish.upsert({
        where: { id: `corner-${option.name.toLowerCase().replace(/\s+/g, '-')}` },
        update: {},
        create: {
          id: `corner-${option.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: option.name,
          description: option.description,
          ratePerPiece: option.ratePerPiece,
          thicknessRates: option.thicknessRates,
          isActive: true
        }
      });
    }

    // Create Holes and Cutouts Options
    const holesAndCutoutsOptions = [
      { 
        name: 'Standard Hole 6mm', 
        type: 'HOLE', 
        description: '6mm diameter hole for screws', 
        baseRate: 8.50, 
        sizeRates: { '6': 8.50, '8': 9.00, '10': 9.50, '12': 10.00 }, 
        thicknessRates: { '4': 1.0, '5': 1.0, '6': 1.0, '8': 1.1, '10': 1.2, '12': 1.3 } 
      },
      { 
        name: 'Standard Hole 10mm', 
        type: 'HOLE', 
        description: '10mm diameter hole', 
        baseRate: 10.50, 
        sizeRates: { '10': 10.50, '12': 11.00, '15': 12.00, '20': 14.00 }, 
        thicknessRates: { '4': 1.0, '5': 1.0, '6': 1.0, '8': 1.1, '10': 1.2, '12': 1.3 } 
      },
      { 
        name: 'Hinge Cutout', 
        type: 'CUTOUT', 
        description: 'Standard door hinge cutout', 
        baseRate: 25.00, 
        sizeRates: { 'standard': 25.00, 'heavy_duty': 35.00 }, 
        thicknessRates: { '4': 1.0, '5': 1.0, '6': 1.0, '8': 1.1, '10': 1.2, '12': 1.3 } 
      },
      { 
        name: 'Power Point Cutout', 
        type: 'CUTOUT', 
        description: 'Standard electrical outlet cutout', 
        baseRate: 35.00, 
        sizeRates: { 'single': 35.00, 'double': 45.00 }, 
        thicknessRates: { '4': 1.0, '5': 1.0, '6': 1.0, '8': 1.1, '10': 1.2, '12': 1.3 } 
      }
    ];

    for (const option of holesAndCutoutsOptions) {
      await prisma.glassHolesCutouts.upsert({
        where: { id: `holes-${option.name.toLowerCase().replace(/\s+/g, '-')}` },
        update: {},
        create: {
          id: `holes-${option.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: option.name,
          type: option.type as 'HOLE' | 'CUTOUT',
          description: option.description,
          baseRate: option.baseRate,
          sizeRates: option.sizeRates,
          thicknessRates: option.thicknessRates,
          isActive: true
        }
      });
    }

    // Create Services Options
    const servicesOptions = [
      { name: 'Template Charge', description: 'Custom template creation and setup', rate: 75.00, rateType: 'FIXED' },
      { name: 'Setup Charge', description: 'Job setup and preparation', rate: 50.00, rateType: 'FIXED' },
      { name: 'Installation Labor', description: 'Professional installation service', rate: 85.00, rateType: 'PER_HOUR' },
      { name: 'Site Measure', description: 'Professional on-site measuring', rate: 120.00, rateType: 'FIXED' }
    ];

    for (const option of servicesOptions) {
      await prisma.glassService.upsert({
        where: { id: `service-${option.name.toLowerCase().replace(/\s+/g, '-')}` },
        update: {},
        create: {
          id: `service-${option.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: option.name,
          description: option.description,
          rate: option.rate,
          rateType: option.rateType as 'PER_PIECE' | 'PER_HOUR' | 'FIXED',
          isActive: true
        }
      });
    }

    // Create Surface Finish Options
    const surfaceFinishOptions = [
      { name: 'Vinyl Backing', description: 'Safety vinyl backing film', rate: 15.50, rateType: 'PER_SQM' },
      { name: 'Sandblasting', description: 'Frosted sandblasted finish', rate: 25.00, rateType: 'PER_SQM' },
      { name: 'Painted Back', description: 'Custom color painted backing', rate: 35.00, rateType: 'PER_SQM' },
      { name: 'Anti-Slip Treatment', description: 'Non-slip surface treatment', rate: 20.00, rateType: 'PER_SQM' }
    ];

    for (const option of surfaceFinishOptions) {
      await prisma.glassSurfaceFinish.upsert({
        where: { id: `surface-${option.name.toLowerCase().replace(/\s+/g, '-')}` },
        update: {},
        create: {
          id: `surface-${option.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: option.name,
          description: option.description,
          rate: option.rate,
          rateType: option.rateType as 'PER_SQM' | 'PER_PIECE' | 'PER_HOUR',
          isActive: true
        }
      });
    }

    // Create Sample Glass Templates
    const templatesData = [
      {
        name: 'Standard Shower Screen',
        description: 'Common shower screen panel with standard processing',
        shapeType: 'Rectangle',
        presetSpecs: {
          heightMm: 2000,
          widthMm: 900,
          defaultEdgework: ['flat-polished-edge'],
          defaultCorners: ['tip-corners']
        },
        pricingRules: {
          minimumThickness: 6,
          recommendedType: 'TOUGHENED'
        }
      },
      {
        name: 'Tabletop Glass',
        description: 'Standard table top with polished edges',
        shapeType: 'Rectangle',
        presetSpecs: {
          defaultEdgework: ['flat-polished-edge'],
          defaultCorners: ['radius-polished-5mm']
        },
        pricingRules: {
          minimumThickness: 6,
          recommendedType: 'TOUGHENED'
        }
      },
      {
        name: 'Window Panel',
        description: 'Standard window glazing panel',
        shapeType: 'Rectangle',
        presetSpecs: {
          defaultEdgework: ['arrised-edge']
        },
        pricingRules: {
          minimumThickness: 4,
          recommendedType: 'NOT_TOUGHENED'
        }
      }
    ];

    for (const template of templatesData) {
      await prisma.glassTemplate.upsert({
        where: { id: `template-${template.name.toLowerCase().replace(/\s+/g, '-')}` },
        update: {},
        create: {
          id: `template-${template.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: template.name,
          description: template.description,
          shapeType: template.shapeType,
          presetSpecs: template.presetSpecs,
          pricingRules: template.pricingRules,
          isActive: true
        }
      });
    }

    console.log('✓ Glass processing options and templates created');
    console.log('🎉 Glass Industry Module seed data completed successfully!');

  } catch (error) {
    console.error('Error seeding glass data:', error);
    throw error;
  }
}

// Run the seed function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedGlassData()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}