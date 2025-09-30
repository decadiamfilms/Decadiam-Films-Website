import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedGlassData() {
  console.log('🪟 Seeding Glass Module data...');

  try {
    // 1. Seed Glass Types
    const glassTypes = await Promise.all([
      prisma.glassType.upsert({
        where: { name: 'Clear Glass' },
        update: {},
        create: {
          name: 'Clear Glass',
          basePrice: 45.00,
          isActive: true
        }
      }),
      prisma.glassType.upsert({
        where: { name: 'Ultra Clear' },
        update: {},
        create: {
          name: 'Ultra Clear',
          basePrice: 65.00,
          isActive: true
        }
      }),
      prisma.glassType.upsert({
        where: { name: 'Mirror Glass' },
        update: {},
        create: {
          name: 'Mirror Glass',
          basePrice: 55.00,
          isActive: true
        }
      }),
      prisma.glassType.upsert({
        where: { name: 'Tinted Glass' },
        update: {},
        create: {
          name: 'Tinted Glass',
          basePrice: 52.00,
          isActive: true
        }
      }),
      prisma.glassType.upsert({
        where: { name: 'Laminated Glass' },
        update: {},
        create: {
          name: 'Laminated Glass',
          basePrice: 85.00,
          isActive: true
        }
      })
    ]);

    console.log(`✅ Created ${glassTypes.length} glass types`);

    // 2. Seed Processing Options
    const processingOptions = [
      // Edgework
      { type: 'EDGEWORK', name: 'Polished Edge', description: 'Smooth polished edge finish', baseRate: 15, rateType: 'PER_METER' },
      { type: 'EDGEWORK', name: 'Beveled Edge', description: 'Angled beveled edge', baseRate: 25, rateType: 'PER_METER' },
      { type: 'EDGEWORK', name: 'Miter Edge', description: 'Precise miter cut edge', baseRate: 20, rateType: 'PER_METER' },
      
      // Corner Work
      { type: 'CORNER', name: 'Radius Corners', description: 'Smooth rounded corners', baseRate: 8, rateType: 'PER_PIECE' },
      { type: 'CORNER', name: 'Tip Corners', description: 'Precise corner tips', baseRate: 5, rateType: 'PER_PIECE' },
      
      // Holes & Cutouts
      { type: 'HOLE', name: 'Standard Hole', description: 'Standard circular hole', baseRate: 12, rateType: 'PER_PIECE' },
      { type: 'HOLE', name: 'Hinge Cutout', description: 'Rectangular hinge cutout', baseRate: 25, rateType: 'PER_PIECE' },
      { type: 'HOLE', name: 'Power Point Cutout', description: 'Power outlet cutout', baseRate: 35, rateType: 'PER_PIECE' },
      
      // Services
      { type: 'SERVICE', name: 'Template Charge', description: 'Custom template creation', baseRate: 50, rateType: 'FIXED' },
      { type: 'SERVICE', name: 'Labor Charge', description: 'Additional labor', baseRate: 75, rateType: 'FIXED' },
      { type: 'SERVICE', name: 'Setup Fee', description: 'Job setup fee', baseRate: 35, rateType: 'FIXED' },
      
      // Surface Finishes
      { type: 'FINISH', name: 'Paint Finish', description: 'Custom paint finish', baseRate: 25, rateType: 'PER_SQM' },
      { type: 'FINISH', name: 'Sandblasting', description: 'Frosted sandblast finish', baseRate: 18, rateType: 'PER_SQM' },
      { type: 'FINISH', name: 'Vinyl Backing', description: 'Safety vinyl backing', baseRate: 12, rateType: 'PER_SQM' }
    ];

    for (const option of processingOptions) {
      await prisma.glassProcessingOption.upsert({
        where: { name: option.name },
        update: {},
        create: option
      });
    }

    console.log(`✅ Created ${processingOptions.length} processing options`);

    // 3. Seed Glass Templates
    const templates = [
      {
        name: 'Standard Window',
        glassTypeId: glassTypes[0].id, // Clear Glass
        thickness: 6,
        commonSizes: [
          { height: 1200, width: 800 },
          { height: 1500, width: 1000 },
          { height: 1800, width: 1200 }
        ],
        defaultProcessing: {
          edgework: 'polished',
          corners: 'radius'
        }
      },
      {
        name: 'Mirror Panel',
        glassTypeId: glassTypes[2].id, // Mirror Glass
        thickness: 5,
        commonSizes: [
          { height: 1800, width: 600 },
          { height: 2000, width: 800 },
          { height: 2400, width: 1200 }
        ],
        defaultProcessing: {
          edgework: 'polished',
          corners: 'tip',
          services: 'template'
        }
      },
      {
        name: 'Cabinet Door',
        glassTypeId: glassTypes[0].id, // Clear Glass
        thickness: 4,
        commonSizes: [
          { height: 600, width: 400 },
          { height: 800, width: 500 },
          { height: 1000, width: 600 }
        ],
        defaultProcessing: {
          edgework: 'polished',
          holes: 'hinge_cutout'
        }
      }
    ];

    for (const template of templates) {
      await prisma.glassTemplate.upsert({
        where: { name: template.name },
        update: {},
        create: template
      });
    }

    console.log(`✅ Created ${templates.length} glass templates`);

    console.log('🎉 Glass module data seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding glass data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedGlassData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });