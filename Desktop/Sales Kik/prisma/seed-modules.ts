import { PrismaClient, ModuleCategory, TargetMarket } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding available modules...');

  const modules = [
    {
      id: 'core-system',
      name: 'Core System',
      description: 'Essential features for running your business',
      category: ModuleCategory.CORE,
      monthlyPrice: 15,
      setupFee: 0,
      targetMarket: TargetMarket.TRADIES,
      features: ['Quick quote builder', 'Simple invoicing', 'Basic customer management', 'Mobile access'],
      dependencies: [],
      isPopular: true,
      screenshots: [],
      sortOrder: 1
    },
    {
      id: 'product-catalog',
      name: 'Product Catalog',
      description: 'Simple product list with pricing',
      category: ModuleCategory.SALES,
      monthlyPrice: 8,
      setupFee: 0,
      targetMarket: TargetMarket.TRADIES,
      features: ['Basic product list', 'Cost & sell pricing', 'Simple categories', 'Mobile friendly'],
      dependencies: ['core-system'],
      isPopular: true,
      screenshots: [],
      sortOrder: 2
    },
    {
      id: 'product-catalog-sme',
      name: 'Product Catalog',
      description: 'Advanced catalog with SKUs, categories, and bulk upload',
      category: ModuleCategory.SALES,
      monthlyPrice: 18,
      setupFee: 0,
      targetMarket: TargetMarket.SME,
      features: ['SKU management with AI suggestions', 'Multi-level categories', 'Bulk CSV upload', 'Multiple price lists', 'Formula pricing', 'Package/kit builder'],
      dependencies: ['core-system'],
      isPopular: true,
      screenshots: [],
      sortOrder: 2
    },
    {
      id: 'job-scheduling',
      name: 'Job Scheduling',
      description: 'Simple calendar and job tracking for solo work',
      category: ModuleCategory.LOGISTICS,
      monthlyPrice: 10,
      setupFee: 0,
      targetMarket: TargetMarket.TRADIES,
      features: ['Simple job calendar', 'Arrival photo timestamps', 'Basic time tracking', 'Customer sign-off', 'Material usage tracking'],
      dependencies: ['core-system'],
      isPopular: true,
      screenshots: [],
      sortOrder: 4
    }
  ];

  for (const module of modules) {
    await prisma.availableModule.upsert({
      where: { id: module.id },
      update: {},
      create: module
    });
    console.log(`✅ Seeded module: ${module.name} (${module.targetMarket})`);
  }

  console.log('✅ All modules seeded successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });