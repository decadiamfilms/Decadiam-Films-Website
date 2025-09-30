import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedGlassData() {
  console.log('🪟 Seeding Glass Industry Module data...');

  try {
    // Create Glass Types
    const clearGlass = await prisma.glassType.upsert({
      where: { id: 'clear-glass-type' },
      update: {},
      create: {
        id: 'clear-glass-type',
        name: 'Clear Glass',
        description: 'Standard clear float glass',
        isActive: true
      }
    });

    const ultraClearGlass = await prisma.glassType.upsert({
      where: { id: 'ultra-clear-glass-type' },
      update: {},
      create: {
        id: 'ultra-clear-glass-type',
        name: 'Ultra Clear Glass',
        description: 'Low iron ultra clear glass',
        isActive: true
      }
    });

    const mirrorGlass = await prisma.glassType.upsert({
      where: { id: 'mirror-glass-type' },
      update: {},
      create: {
        id: 'mirror-glass-type',
        name: 'Mirror Glass',
        description: 'Silvered mirror glass',
        isActive: true
      }
    });

    const laminatedGlass = await prisma.glassType.upsert({
      where: { id: 'laminated-glass-type' },
      update: {},
      create: {
        id: 'laminated-glass-type',
        name: 'Laminated Glass',
        description: 'Safety laminated glass',
        isActive: true
      }
    });

    console.log('✅ Glass types created');

    // Create Glass Products (different thicknesses and toughening options)
    const glassProducts = [
      // Clear Glass Products
      { glassTypeId: clearGlass.id, productType: 'NOT_TOUGHENED', thickness: 4, basePrice: 45.00 },
      { glassTypeId: clearGlass.id, productType: 'NOT_TOUGHENED', thickness: 5, basePrice: 52.00 },
      { glassTypeId: clearGlass.id, productType: 'NOT_TOUGHENED', thickness: 6, basePrice: 58.00 },
      { glassTypeId: clearGlass.id, productType: 'NOT_TOUGHENED', thickness: 8, basePrice: 68.00 },
      { glassTypeId: clearGlass.id, productType: 'NOT_TOUGHENED', thickness: 10, basePrice: 85.00 },
      { glassTypeId: clearGlass.id, productType: 'NOT_TOUGHENED', thickness: 12, basePrice: 95.00 },
      { glassTypeId: clearGlass.id, productType: 'TOUGHENED', thickness: 6, basePrice: 85.00 },
      { glassTypeId: clearGlass.id, productType: 'TOUGHENED', thickness: 8, basePrice: 98.00 },
      { glassTypeId: clearGlass.id, productType: 'TOUGHENED', thickness: 10, basePrice: 120.00 },
      { glassTypeId: clearGlass.id, productType: 'TOUGHENED', thickness: 12, basePrice: 135.00 },

      // Ultra Clear Glass Products
      { glassTypeId: ultraClearGlass.id, productType: 'NOT_TOUGHENED', thickness: 6, basePrice: 75.00 },
      { glassTypeId: ultraClearGlass.id, productType: 'NOT_TOUGHENED', thickness: 8, basePrice: 88.00 },
      { glassTypeId: ultraClearGlass.id, productType: 'NOT_TOUGHENED', thickness: 10, basePrice: 105.00 },
      { glassTypeId: ultraClearGlass.id, productType: 'NOT_TOUGHENED', thickness: 12, basePrice: 118.00 },
      { glassTypeId: ultraClearGlass.id, productType: 'TOUGHENED', thickness: 8, basePrice: 125.00 },
      { glassTypeId: ultraClearGlass.id, productType: 'TOUGHENED', thickness: 10, basePrice: 145.00 },
      { glassTypeId: ultraClearGlass.id, productType: 'TOUGHENED', thickness: 12, basePrice: 165.00 },

      // Mirror Glass Products
      { glassTypeId: mirrorGlass.id, productType: 'NOT_TOUGHENED', thickness: 4, basePrice: 65.00 },
      { glassTypeId: mirrorGlass.id, productType: 'NOT_TOUGHENED', thickness: 6, basePrice: 78.00 },
      { glassTypeId: mirrorGlass.id, productType: 'TOUGHENED', thickness: 6, basePrice: 115.00 },

      // Laminated Glass Products
      { glassTypeId: laminatedGlass.id, productType: 'NOT_TOUGHENED', thickness: 6.4, basePrice: 95.00 },
      { glassTypeId: laminatedGlass.id, productType: 'NOT_TOUGHENED', thickness: 8.8, basePrice: 125.00 },
      { glassTypeId: laminatedGlass.id, productType: 'NOT_TOUGHENED', thickness: 10.8, basePrice: 145.00 }
    ];

    for (const product of glassProducts) {
      await prisma.glassProduct.upsert({
        where: {
          glassTypeId_productType_thickness: {
            glassTypeId: product.glassTypeId,
            productType: product.productType as 'TOUGHENED' | 'NOT_TOUGHENED',
            thickness: product.thickness
          }
        },
        update: { basePrice: product.basePrice },
        create: {
          glassTypeId: product.glassTypeId,
          productType: product.productType as 'TOUGHENED' | 'NOT_TOUGHENED',
          thickness: product.thickness,
          basePrice: product.basePrice,
          isActive: true
        }
      });
    }

    console.log('✅ Glass products created');

    // Create Edgework Options
    const edgeworkOptions = [
      { id: 'arrised-edges', name: 'Arrised Edges', description: 'Basic edge finishing, smoothed', ratePerMeter: 8.50 },
      { id: 'flat-polished', name: 'Flat Polished', description: 'Machine polished flat edge', ratePerMeter: 15.00 },
      { id: 'miter-polished', name: 'Miter Polished', description: '45° beveled polished edge', ratePerMeter: 22.00 },
      { id: 'beveled-edge', name: 'Beveled Edge', description: 'Decorative beveled edge', ratePerMeter: 28.00 },
      { id: 'pencil-polished', name: 'Pencil Polished', description: 'Rounded polished edge', ratePerMeter: 18.00 }
    ];

    for (const edge of edgeworkOptions) {
      await prisma.glassEdgework.upsert({
        where: { id: edge.id },
        update: {},
        create: {
          id: edge.id,
          name: edge.name,
          description: edge.description,
          ratePerMeter: edge.ratePerMeter,
          thicknessMultiplier: {},
          isActive: true
        }
      });
    }

    console.log('✅ Edgework options created');

    // Create Corner Finish Options
    const cornerOptions = [
      { id: 'tip-corners', name: 'Tip Corners', description: 'Sharp pointed corners', ratePerPiece: 5.00 },
      { id: 'radius-10mm', name: 'Radius Polished 10mm', description: '10mm radius rounded corners', ratePerPiece: 12.00 },
      { id: 'radius-25mm', name: 'Radius Polished 25mm', description: '25mm radius rounded corners', ratePerPiece: 15.00 },
      { id: 'clipped-corners', name: 'Clipped Corners', description: '10mm clipped corners', ratePerPiece: 8.00 }
    ];

    for (const corner of cornerOptions) {
      await prisma.glassCornerFinish.upsert({
        where: { id: corner.id },
        update: {},
        create: {
          id: corner.id,
          name: corner.name,
          description: corner.description,
          ratePerPiece: corner.ratePerPiece,
          thicknessRates: {},
          radiusRates: {},
          isActive: true
        }
      });
    }

    console.log('✅ Corner finish options created');

    // Create Holes & Cutouts Options
    const holesOptions = [
      { id: 'hole-6mm', name: 'Standard Hole 6mm', type: 'HOLE', description: '6mm diameter hole', baseRate: 12.00 },
      { id: 'hole-8mm', name: 'Standard Hole 8mm', type: 'HOLE', description: '8mm diameter hole', baseRate: 14.00 },
      { id: 'hole-10mm', name: 'Standard Hole 10mm', type: 'HOLE', description: '10mm diameter hole', baseRate: 15.00 },
      { id: 'hole-12mm', name: 'Standard Hole 12mm', type: 'HOLE', description: '12mm diameter hole', baseRate: 16.00 },
      { id: 'hinge-cutout', name: 'Hinge Cutout', type: 'CUTOUT', description: 'Standard door hinge cutout', baseRate: 25.00 },
      { id: 'power-cutout', name: 'Power Point Cutout', type: 'CUTOUT', description: 'Power outlet cutout', baseRate: 35.00 },
      { id: 'switch-cutout', name: 'Light Switch Cutout', type: 'CUTOUT', description: 'Light switch cutout', baseRate: 30.00 }
    ];

    for (const hole of holesOptions) {
      await prisma.glassHolesCutouts.upsert({
        where: { id: hole.id },
        update: {},
        create: {
          id: hole.id,
          name: hole.name,
          type: hole.type as 'HOLE' | 'CUTOUT',
          description: hole.description,
          baseRate: hole.baseRate,
          sizeRates: {},
          thicknessRates: {},
          isActive: true
        }
      });
    }

    console.log('✅ Holes & cutouts options created');

    // Create Service Options
    const serviceOptions = [
      { id: 'template-charge', name: 'Template Charge', description: 'Custom template creation', rate: 50.00, rateType: 'FIXED' },
      { id: 'site-measure', name: 'Site Measure', description: 'Professional site measurement', rate: 85.00, rateType: 'FIXED' },
      { id: 'rush-job', name: 'Rush Job', description: 'Express processing (48hr)', rate: 75.00, rateType: 'FIXED' },
      { id: 'install-labor', name: 'Installation Labor', description: 'Professional installation', rate: 95.00, rateType: 'PER_HOUR' },
      { id: 'delivery-setup', name: 'Delivery Setup', description: 'Delivery and setup service', rate: 45.00, rateType: 'FIXED' }
    ];

    for (const service of serviceOptions) {
      await prisma.glassService.upsert({
        where: { id: service.id },
        update: {},
        create: {
          id: service.id,
          name: service.name,
          description: service.description,
          rate: service.rate,
          rateType: service.rateType as 'PER_PIECE' | 'PER_HOUR' | 'FIXED',
          isActive: true
        }
      });
    }

    console.log('✅ Service options created');

    // Create Surface Finish Options
    const finishOptions = [
      { id: 'painted-back', name: 'Painted Back', description: 'Painted back surface', rate: 25.00, rateType: 'PER_SQM' },
      { id: 'sandblasted', name: 'Sandblasted', description: 'Sandblasted frosted finish', rate: 18.00, rateType: 'PER_SQM' },
      { id: 'vinyl-backing', name: 'Vinyl Backing', description: 'Protective vinyl backing', rate: 12.00, rateType: 'PER_SQM' },
      { id: 'safety-film', name: 'Safety Film', description: 'Clear safety film application', rate: 15.00, rateType: 'PER_SQM' },
      { id: 'anti-slip', name: 'Anti-Slip Treatment', description: 'Anti-slip surface treatment', rate: 22.00, rateType: 'PER_SQM' }
    ];

    for (const finish of finishOptions) {
      await prisma.glassSurfaceFinish.upsert({
        where: { id: finish.id },
        update: {},
        create: {
          id: finish.id,
          name: finish.name,
          description: finish.description,
          rate: finish.rate,
          rateType: finish.rateType as 'PER_SQM' | 'PER_PIECE' | 'PER_HOUR',
          isActive: true
        }
      });
    }

    console.log('✅ Surface finish options created');

    console.log('🎉 Glass Industry Module seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding glass data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedGlassData()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

export default seedGlassData;