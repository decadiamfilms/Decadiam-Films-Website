import { PrismaClient, GlassProductType, GlassProcessingType, ServiceRateType, SurfaceFinishRateType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedGlassModule() {
  console.log('🪟 Seeding Glass Module data...');

  try {
    // 1. Seed Glass Types
    const glassTypesData = [
      { name: 'Clear Glass', description: 'Standard clear glass for general applications' },
      { name: 'Ultra Clear', description: 'Low-iron glass with exceptional clarity' },
      { name: 'Mirror', description: 'Silver-backed mirror glass' },
      { name: 'Tinted', description: 'Colored or tinted glass options' },
      { name: 'Laminated', description: 'Safety glass with interlayer' },
      { name: 'Textured', description: 'Patterned or textured glass' }
    ];

    console.log('Creating glass types...');
    for (const glassTypeData of glassTypesData) {
      const existing = await prisma.glassType.findFirst({ where: { name: glassTypeData.name } });
      if (!existing) {
        await prisma.glassType.create({ data: glassTypeData });
      }
    }

    // 2. Get created glass types
    const glassTypes = await prisma.glassType.findMany();

    // 3. Seed Glass Products (combinations of type, thickness, and toughening)
    const thicknesses = [4, 5, 6, 8, 10, 12, 15];
    const productTypes: GlassProductType[] = ['NOT_TOUGHENED', 'TOUGHENED'];
    
    console.log('Creating glass products...');
    for (const glassType of glassTypes) {
      for (const thickness of thicknesses) {
        for (const productType of productTypes) {
          // Check if product already exists
          const existing = await prisma.glassProduct.findFirst({
            where: {
              glassTypeId: glassType.id,
              productType: productType,
              thickness: thickness
            }
          });

          if (!existing) {
            // Base pricing logic
            let basePrice = 0;
            
            // Price by glass type
            switch (glassType.name) {
              case 'Clear Glass':
                basePrice = 35 + (thickness * 2); // $35 base + $2 per mm thickness
                break;
              case 'Ultra Clear':
                basePrice = 45 + (thickness * 2.5);
                break;
              case 'Mirror':
                basePrice = 42 + (thickness * 2.2);
                break;
              case 'Tinted':
                basePrice = 38 + (thickness * 2.1);
                break;
              case 'Laminated':
                basePrice = 55 + (thickness * 3);
                break;
              case 'Textured':
                basePrice = 40 + (thickness * 2.3);
                break;
              default:
                basePrice = 35 + (thickness * 2);
            }

            // Toughened glass multiplier
            if (productType === 'TOUGHENED') {
              basePrice *= 1.4; // 40% surcharge for toughening
            }

            await prisma.glassProduct.create({
              data: {
                glassTypeId: glassType.id,
                productType: productType,
                thickness: thickness,
                basePrice: Math.round(basePrice * 100) / 100, // Round to 2 decimal places
              }
            });
          }
        }
      }
    }

    // 4. Seed Glass Edgework Options
    console.log('Creating edgework options...');
    const edgeworkOptions = [
      { name: 'Arrised', description: 'Safe smooth edges', ratePerMeter: 8.50, thicknessMultiplier: {} },
      { name: 'Flat Polished', description: 'Clean polished flat edge', ratePerMeter: 12.00, thicknessMultiplier: {} },
      { name: 'Miter Polished', description: 'Angled polished edge', ratePerMeter: 18.50, thicknessMultiplier: {} },
      { name: 'Beveled', description: 'Decorative beveled edge', ratePerMeter: 22.00, thicknessMultiplier: {} }
    ];

    for (const edge of edgeworkOptions) {
      const existing = await prisma.glassEdgework.findFirst({ where: { name: edge.name } });
      if (!existing) {
        await prisma.glassEdgework.create({ data: edge });
      }
    }

    // 5. Seed Glass Corner Finish Options
    console.log('Creating corner finish options...');
    const cornerOptions = [
      { name: 'Tip Corners', description: 'Sharp corner finish', ratePerPiece: 5.00, thicknessRates: {} },
      { name: 'Radius Polished 10mm', description: '10mm radius corners', ratePerPiece: 8.50, thicknessRates: {}, radiusRates: {} },
      { name: 'Radius Polished 20mm', description: '20mm radius corners', ratePerPiece: 12.00, thicknessRates: {}, radiusRates: {} }
    ];

    for (const corner of cornerOptions) {
      const existing = await prisma.glassCornerFinish.findFirst({ where: { name: corner.name } });
      if (!existing) {
        await prisma.glassCornerFinish.create({ data: corner });
      }
    }

    // 6. Seed Holes and Cutouts
    console.log('Creating holes and cutouts options...');
    const holesOptions = [
      { name: 'Standard Hole 6mm', type: 'HOLE' as GlassProcessingType, description: '6mm diameter hole', baseRate: 12.00, sizeRates: {}, thicknessRates: {} },
      { name: 'Standard Hole 12mm', type: 'HOLE' as GlassProcessingType, description: '12mm diameter hole', baseRate: 15.00, sizeRates: {}, thicknessRates: {} },
      { name: 'Hinge Cutout', type: 'CUTOUT' as GlassProcessingType, description: 'Standard hinge cutout', baseRate: 25.00, sizeRates: {}, thicknessRates: {} },
      { name: 'Power Point Cutout', type: 'CUTOUT' as GlassProcessingType, description: 'Electrical outlet cutout', baseRate: 35.00, sizeRates: {}, thicknessRates: {} }
    ];

    for (const hole of holesOptions) {
      const existing = await prisma.glassHolesCutouts.findFirst({ where: { name: hole.name } });
      if (!existing) {
        await prisma.glassHolesCutouts.create({ data: hole });
      }
    }

    // 7. Seed Glass Services
    console.log('Creating service options...');
    const services = [
      { name: 'Template Charge', description: 'Custom template creation', rate: 50.00, rateType: 'FIXED' as ServiceRateType },
      { name: 'Labor Hour', description: 'Additional labor charges', rate: 75.00, rateType: 'PER_HOUR' as ServiceRateType },
      { name: 'Setup Fee', description: 'Job setup and preparation', rate: 35.00, rateType: 'FIXED' as ServiceRateType }
    ];

    for (const service of services) {
      const existing = await prisma.glassService.findFirst({ where: { name: service.name } });
      if (!existing) {
        await prisma.glassService.create({ data: service });
      }
    }

    // 8. Seed Surface Finishes
    console.log('Creating surface finish options...');
    const finishes = [
      { name: 'Paint Back', description: 'Back-painted glass', rate: 25.00, rateType: 'PER_SQM' as SurfaceFinishRateType },
      { name: 'Sandblasting', description: 'Frosted sandblast finish', rate: 18.50, rateType: 'PER_SQM' as SurfaceFinishRateType },
      { name: 'Vinyl Backing', description: 'Safety vinyl backing', rate: 12.00, rateType: 'PER_SQM' as SurfaceFinishRateType }
    ];

    for (const finish of finishes) {
      const existing = await prisma.glassSurfaceFinish.findFirst({ where: { name: finish.name } });
      if (!existing) {
        await prisma.glassSurfaceFinish.create({ data: finish });
      }
    }

    // 9. Create Glass Templates
    console.log('Creating glass templates...');
    const templates = [
      {
        name: 'Standard Rectangle',
        description: 'Basic rectangular glass panel',
        shapeType: 'Rectangle',
        presetSpecs: {
          commonSizes: [
            { width: 1000, height: 600, label: '1000×600mm' },
            { width: 1200, height: 800, label: '1200×800mm' },
            { width: 1500, height: 1000, label: '1500×1000mm' }
          ]
        },
        pricingRules: {},
        imageUrl: null
      },
      {
        name: 'Shower Screen',
        description: 'Standard shower screen dimensions',
        shapeType: 'Rectangle',
        presetSpecs: {
          commonSizes: [
            { width: 900, height: 1980, label: '900×1980mm (Standard)' },
            { width: 1000, height: 1980, label: '1000×1980mm (Wide)' },
            { width: 1200, height: 1980, label: '1200×1980mm (Extra Wide)' }
          ],
          recommendedThickness: [10, 12],
          recommendedType: 'Clear Glass',
          recommendedToughening: 'TOUGHENED'
        },
        pricingRules: {},
        imageUrl: null
      },
      {
        name: 'Balustrade Panel',
        description: 'Glass balustrade panel',
        shapeType: 'Rectangle',
        presetSpecs: {
          commonSizes: [
            { width: 1000, height: 1000, label: '1000×1000mm (Standard)' },
            { width: 1200, height: 1000, label: '1200×1000mm (Wide)' },
            { width: 1500, height: 1000, label: '1500×1000mm (Extra Wide)' }
          ],
          recommendedThickness: [12, 15],
          recommendedType: 'Clear Glass',
          recommendedToughening: 'TOUGHENED'
        },
        pricingRules: {},
        imageUrl: null
      }
    ];

    for (const template of templates) {
      const existing = await prisma.glassTemplate.findFirst({ where: { name: template.name } });
      if (!existing) {
        await prisma.glassTemplate.create({ data: template });
      }
    }

    // 10. Create Glass Industry Module in AvailableModule if not exists
    console.log('Creating Glass Industry Module subscription option...');
    const existingModule = await prisma.availableModule.findFirst({ where: { name: 'Glass Industry Module' } });
    if (!existingModule) {
      await prisma.availableModule.create({
        data: {
          name: 'Glass Industry Module',
          description: 'Professional glass quoting, pricing, and workflow management',
          category: 'INDUSTRY_SPECIFIC',
          monthlyPrice: 35,
          setupFee: 0,
          targetMarket: 'TRADIES',
          features: [
            '10-step guided glass workflow',
            'Dynamic pricing by glass type & thickness',
            'Customer-specific price lists',
            'Template system for common configurations',
            'Quick Price Calculator',
            'Photo upload for visual references',
            'Processing options (edgework, corners, holes)',
            'Professional glass quote output'
          ],
          dependencies: [],
          isPopular: true,
          screenshots: [],
          isActive: true,
          sortOrder: 1
        }
      });
    }

    console.log('✅ Glass Module seeding completed successfully!');
    
    // Get counts for summary
    const glassTypeCount = await prisma.glassType.count();
    const glassProductCount = await prisma.glassProduct.count();
    const edgeworkCount = await prisma.glassEdgework.count();
    const cornerFinishCount = await prisma.glassCornerFinish.count();
    const holesCutoutsCount = await prisma.glassHolesCutouts.count();
    const serviceCount = await prisma.glassService.count();
    const surfaceFinishCount = await prisma.glassSurfaceFinish.count();
    const templateCount = await prisma.glassTemplate.count();

    console.log('📊 Database contains:');
    console.log(`   - ${glassTypeCount} glass types`);
    console.log(`   - ${glassProductCount} glass products`);
    console.log(`   - ${edgeworkCount} edgework options`);
    console.log(`   - ${cornerFinishCount} corner finish options`);
    console.log(`   - ${holesCutoutsCount} holes/cutouts options`);
    console.log(`   - ${serviceCount} service options`);
    console.log(`   - ${surfaceFinishCount} surface finish options`);
    console.log(`   - ${templateCount} glass templates`);

  } catch (error) {
    console.error('❌ Error seeding glass module:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedGlassModule()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedGlassModule };