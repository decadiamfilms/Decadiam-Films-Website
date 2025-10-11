const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking what\'s in the database...');
    
    // Check all categories (regardless of is_active)
    const allCategories = await prisma.category.findMany({});
    console.log('📊 Total categories in database:', allCategories.length);
    
    allCategories.forEach(cat => {
      console.log(`📂 Category: ${cat.name} (ID: ${cat.id})`);
      console.log(`   Color: ${cat.color}`);
      console.log(`   Active: ${cat.is_active}`);
      console.log(`   Company ID: ${cat.company_id}`);
      console.log(`   Created: ${cat.created_at}`);
      console.log('');
    });
    
    // Check main categories
    const mainCategories = await prisma.mainCategory.findMany({});
    console.log('📊 Total main categories:', mainCategories.length);
    
    mainCategories.forEach(main => {
      console.log(`📁 Main Category: ${main.name} (ID: ${main.id})`);
      console.log(`   Category ID: ${main.category_id}`);
      console.log(`   Active: ${main.is_active}`);
      console.log('');
    });
    
    // Check sub categories
    const subCategories = await prisma.subCategory.findMany({});
    console.log('📊 Total sub categories:', subCategories.length);
    
    subCategories.forEach(sub => {
      console.log(`📄 Sub Category: ${sub.name} (ID: ${sub.id})`);
      console.log(`   Main Category ID: ${sub.main_category_id}`);
      console.log(`   Active: ${sub.is_active}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();