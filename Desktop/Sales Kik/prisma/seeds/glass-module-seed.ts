// Glass Industry Module Seed Data
// Professional glass quoting with complete processing options

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedGlassModule() {
  console.log('🪟 Seeding Glass Industry Module...');

  // 1. Create Glass Types with Base Pricing
  const glassTypes = [
    {
      name: 'Clear Glass',
      basePrice: 85.00,
      isActive: true
    },
    {
      name: 'Ultra Clear Glass',
      basePrice: 125.00,
      isActive: true
    },
    {
      name: 'Mirror Glass',
      basePrice: 110.00,
      isActive: true
    },
    {
      name: 'Tinted Glass',
      basePrice: 95.00,
      isActive: true
    },
    {
      name: 'Frosted Glass',
      basePrice: 105.00,
      isActive: true
    },
    {
      name: 'Laminated Glass',
      basePrice: 145.00,
      isActive: true
    }
  ];

  console.log('Creating glass types...');
  for (const glassType of glassTypes) {
    await prisma.glassType.upsert({
      where: { name: glassType.name },
      update: glassType,
      create: glassType
    });
  }

  // 2. Create Processing Options
  const processingOptions = [
    // Edgework Options
    {
      type: 'EDGEWORK',
      name: 'Polished Edge',
      description: 'Clean polished edge finish',
      baseRate: 15.00,
      rateType: 'PER_METER',
      isActive: true
    },
    {
      type: 'EDGEWORK',
      name: 'Beveled Edge',
      description: 'Decorative beveled edge',
      baseRate: 25.00,
      rateType: 'PER_METER',
      isActive: true
    },
    {
      type: 'EDGEWORK',
      name: 'Miter Edge',
      description: 'Precision miter cut edge',
      baseRate: 20.00,
      rateType: 'PER_METER',
      isActive: true
    },
    {
      type: 'EDGEWORK',
      name: 'Pencil Polish',
      description: 'Rounded pencil edge polish',
      baseRate: 12.00,
      rateType: 'PER_METER',
      isActive: true
    },

    // Corner Finish Options
    {
      type: 'CORNER',
      name: 'Radius Corner',
      description: 'Rounded corner finish',
      baseRate: 8.00,
      rateType: 'PER_PIECE',
      isActive: true
    },
    {
      type: 'CORNER',
      name: 'Clipped Corner',
      description: 'Clean clipped corner',
      baseRate: 5.00,
      rateType: 'PER_PIECE',
      isActive: true
    },
    {
      type: 'CORNER',
      name: 'Notch Corner',
      description: 'Custom notch cut',
      baseRate: 12.00,
      rateType: 'PER_PIECE',
      isActive: true
    },

    // Holes & Cutouts
    {
      type: 'HOLE',
      name: 'Standard Hole (6-25mm)',
      description: 'Standard drilled hole',
      baseRate: 12.00,
      rateType: 'PER_PIECE',
      isActive: true
    },
    {
      type: 'HOLE',
      name: 'Large Hole (25-50mm)',
      description: 'Large diameter hole',
      baseRate: 18.00,
      rateType: 'PER_PIECE',
      isActive: true
    },
    {
      type: 'HOLE',
      name: 'Hinge Cutout',
      description: 'Precision hinge cutout',
      baseRate: 25.00,
      rateType: 'PER_PIECE',
      isActive: true
    },
    {
      type: 'HOLE',
      name: 'Lock Cutout',
      description: 'Lock mechanism cutout',
      baseRate: 35.00,
      rateType: 'PER_PIECE',
      isActive: true
    },
    {
      type: 'HOLE',
      name: 'Power Outlet Cutout',
      description: 'Electrical outlet cutout',
      baseRate: 45.00,
      rateType: 'PER_PIECE',
      isActive: true
    },

    // Services
    {
      type: 'SERVICE',
      name: 'Template Creation',
      description: 'Create measurement template',
      baseRate: 50.00,
      rateType: 'FIXED',
      isActive: true
    },
    {
      type: 'SERVICE',
      name: 'Site Measure',
      description: 'Professional site measurement',
      baseRate: 85.00,
      rateType: 'FIXED',
      isActive: true
    },
    {
      type: 'SERVICE',
      name: 'Installation Service',
      description: 'Professional installation',
      baseRate: 75.00,
      rateType: 'PER_HOUR',
      isActive: true
    },
    {
      type: 'SERVICE',
      name: 'Delivery Service',
      description: 'Professional delivery service',
      baseRate: 45.00,
      rateType: 'FIXED',
      isActive: true
    },
    {
      type: 'SERVICE',
      name: 'Setup/Handling Fee',
      description: 'Setup and handling charge',
      baseRate: 35.00,
      rateType: 'FIXED',
      isActive: true
    },

    // Surface Finishes
    {
      type: 'FINISH',
      name: 'Sandblasted Finish',
      description: 'Frosted sandblast finish',
      baseRate: 18.00,
      rateType: 'PER_SQM',
      isActive: true
    },
    {
      type: 'FINISH',
      name: 'Acid Etched',
      description: 'Premium acid etch finish',
      baseRate: 22.00,
      rateType: 'PER_SQM',
      isActive: true
    },
    {
      type: 'FINISH',
      name: 'Vinyl Backing',
      description: 'Safety vinyl backing',
      baseRate: 12.00,
      rateType: 'PER_SQM',
      isActive: true
    },
    {
      type: 'FINISH',
      name: 'Painted Back',
      description: 'Colored paint finish',
      baseRate: 25.00,
      rateType: 'PER_SQM',
      isActive: true
    },
    {
      type: 'FINISH',
      name: 'Digital Print',
      description: 'Custom digital printing',
      baseRate: 65.00,
      rateType: 'PER_SQM',
      isActive: true
    }
  ];

  console.log('Creating processing options...');
  for (const option of processingOptions) {
    await prisma.glassProcessingOption.upsert({
      where: { name: option.name },
      update: option,
      create: option
    });
  }

  // 3. Create Glass Templates for Common Configurations
  const createdGlassTypes = await prisma.glassType.findMany();
  const clearGlass = createdGlassTypes.find(g => g.name === 'Clear Glass');

  if (clearGlass) {
    const glassTemplates = [
      {
        name: 'Standard Pool Panel 1200x600',
        glassTypeId: clearGlass.id,
        thickness: 12,
        commonSizes: JSON.stringify([
          { height: 1200, width: 600, name: '1200x600mm' },
          { height: 1175, width: 600, name: '1175x600mm' },
          { height: 1200, width: 900, name: '1200x900mm' }
        ]),
        defaultProcessing: JSON.stringify({
          edgework: ['Polished Edge'],
          corners: ['Clipped Corner'],
          holes: ['Standard Hole (6-25mm)'],
          services: [],
          finishes: []
        })
      },
      {
        name: 'Shower Screen Panel 2000x900',
        glassTypeId: clearGlass.id,
        thickness: 10,
        commonSizes: JSON.stringify([
          { height: 2000, width: 900, name: '2000x900mm' },
          { height: 1950, width: 900, name: '1950x900mm' },
          { height: 2000, width: 800, name: '2000x800mm' }
        ]),
        defaultProcessing: JSON.stringify({
          edgework: ['Polished Edge'],
          corners: ['Radius Corner'],
          holes: ['Hinge Cutout'],
          services: ['Template Creation'],
          finishes: []
        })
      },
      {
        name: 'Balustrade Panel 1100x1200',
        glassTypeId: clearGlass.id,
        thickness: 12,
        commonSizes: JSON.stringify([
          { height: 1100, width: 1200, name: '1100x1200mm' },
          { height: 1100, width: 1500, name: '1100x1500mm' },
          { height: 1100, width: 1800, name: '1100x1800mm' }
        ]),
        defaultProcessing: JSON.stringify({
          edgework: ['Polished Edge'],
          corners: ['Clipped Corner'],
          holes: ['Standard Hole (6-25mm)'],
          services: [],
          finishes: ['Vinyl Backing']
        })
      }
    ];

    console.log('Creating glass templates...');
    for (const template of glassTemplates) {
      await prisma.glassTemplate.upsert({
        where: { name: template.name },
        update: template,
        create: template
      });
    }
  }

  console.log('✅ Glass Industry Module seeded successfully!');
  console.log(`Created ${glassTypes.length} glass types`);
  console.log(`Created ${processingOptions.length} processing options`);
  console.log('Created 3 glass templates');
  console.log('');
  console.log('🪟 Glass Module Features Available:');
  console.log('• Real-time price calculation');
  console.log('• Customer-specific pricing tiers');
  console.log('• Professional processing options');
  console.log('• Template system for quick quotes');
  console.log('• Comprehensive workflow integration');
}

// Run seeding if called directly
seedGlassModule()
  .catch((e) => {
    console.error('❌ Glass module seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });