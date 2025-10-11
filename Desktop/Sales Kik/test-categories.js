const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCategories() {
  try {
    console.log('🔍 Testing category database connection...');
    
    // Test if we can fetch categories
    const categories = await prisma.category.findMany({
      where: {
        is_active: true
      },
      include: {
        main_categories: {
          where: { is_active: true },
          include: {
            sub_categories: {
              where: { is_active: true },
              include: {
                sub_sub_categories: {
                  where: { is_active: true },
                  include: {
                    sub_sub_sub_categories: {
                      where: { is_active: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    
    console.log('✅ Categories found:', categories.length);
    categories.forEach(cat => {
      console.log(`📂 ${cat.name} (${cat.color}) - ${cat.main_categories.length} main categories`);
      cat.main_categories.forEach(main => {
        console.log(`  └── ${main.name} - ${main.sub_categories.length} sub categories`);
        main.sub_categories.forEach(sub => {
          console.log(`      └── ${sub.name} - ${sub.sub_sub_categories.length} sub sub categories`);
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCategories();