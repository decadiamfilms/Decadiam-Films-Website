const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedGlassData() {
  try {
    console.log('🚀 Seeding Glass Industry Module data...');

    // Create Clear Glass Type
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

    // Create Ultra Clear Glass Type
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

    // Create Tinted Glass Type
    const tintedGlass = await prisma.glassType.upsert({
      where: { id: 'glass-type-tinted' },
      update: {},
      create: {
        id: 'glass-type-tinted',
        name: 'Tinted Glass',
        description: 'Solar control glass available in bronze, grey, and green tints',
        isActive: true
      }
    });

    console.log('✅ Glass types created');

    // Create Glass Products for Clear Glass
    const products = [
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

    for (const product of products) {
      await prisma.glassProduct.upsert({
        where: {
          glassTypeId_productType_thickness: {
            glassTypeId: clearGlass.id,
            productType: product.productType,
            thickness: product.thickness
          }
        },
        update: { basePrice: product.basePrice },
        create: {
          glassTypeId: clearGlass.id,
          productType: product.productType,
          thickness: product.thickness,
          basePrice: product.basePrice,
          isActive: true
        }
      });
    }

    // Create Ultra Clear products (15% premium)
    for (const product of products) {
      await prisma.glassProduct.upsert({
        where: {
          glassTypeId_productType_thickness: {
            glassTypeId: ultraClear.id,
            productType: product.productType,
            thickness: product.thickness
          }
        },
        update: { basePrice: product.basePrice * 1.15 },
        create: {
          glassTypeId: ultraClear.id,
          productType: product.productType,
          thickness: product.thickness,
          basePrice: product.basePrice * 1.15,
          isActive: true
        }
      });
    }

    console.log('✅ Glass products created');
    console.log('🎉 Glass Industry Module seed completed successfully!');

    // Count what we created
    const glassTypeCount = await prisma.glassType.count();
    const productCount = await prisma.glassProduct.count();
    
    console.log(`📊 Summary: ${glassTypeCount} glass types, ${productCount} products`);

  } catch (error) {
    console.error('❌ Error seeding glass data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedGlassData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });