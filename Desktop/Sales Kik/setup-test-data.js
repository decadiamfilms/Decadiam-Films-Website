const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupTestData() {
  try {
    console.log('🔧 Setting up test data...');
    
    const companyId = '0e573687-3b53-498a-9e78-f198f16f8bcb';
    
    // Create test company first
    const company = await prisma.company.upsert({
      where: { id: companyId },
      update: {},
      create: {
        id: companyId,
        name: 'Test Company',
        email: 'test@example.com',
        phone: '+61400000000',
        subscriptionStatus: 'TRIAL'
      }
    });
    
    console.log('✅ Company created/updated:', company.name);
    
    // Now create a simple category without nested data first
    const category = await prisma.category.create({
      data: {
        name: 'Pool Fencing',
        description: 'Pool fencing products and accessories', 
        color: '#3B82F6',
        sort_order: 0,
        is_active: true,
        company_id: companyId
      }
    });
    
    console.log('✅ Category created:', category.name);
    
    // Create a main category
    const mainCategory = await prisma.mainCategory.create({
      data: {
        name: 'Glass Panels',
        description: 'Tempered glass panels',
        sort_order: 0,
        is_active: true,
        category_id: category.id
      }
    });
    
    console.log('✅ Main category created:', mainCategory.name);
    
    // Create a sub category  
    const subCategory = await prisma.subCategory.create({
      data: {
        name: 'Clear Glass',
        description: 'Clear tempered glass panels',
        sort_order: 0,
        is_active: true,
        main_category_id: mainCategory.id
      }
    });
    
    console.log('✅ Sub category created:', subCategory.name);
    
    console.log('\n🎉 Test data setup complete! You should now see categories in the frontend.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestData();