const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestCategory() {
  try {
    console.log('🔧 Creating test category...');
    
    // Create a test company ID (using the one from the service)
    const companyId = '0e573687-3b53-498a-9e78-f198f16f8bcb';
    
    // Create a category with the full hierarchy
    const category = await prisma.category.create({
      data: {
        name: 'Pool Fencing',
        description: 'Pool fencing products and accessories',
        color: '#3B82F6',
        sort_order: 0,
        is_active: true,
        company_id: companyId,
        main_categories: {
          create: [
            {
              name: 'Glass Panels',
              description: 'Tempered glass panels for pool fencing',
              sort_order: 0,
              is_active: true,
              sub_categories: {
                create: [
                  {
                    name: 'Clear Glass',
                    description: 'Clear tempered glass panels',
                    sort_order: 0,
                    is_active: true,
                    sub_sub_categories: {
                      create: [
                        {
                          name: '12mm Thick',
                          description: '12mm thick clear glass',
                          sort_order: 0,
                          is_active: true,
                          sub_sub_sub_categories: {
                            create: [
                              {
                                name: 'Standard Size',
                                description: 'Standard 1200x1800mm panels',
                                sort_order: 0,
                                is_active: true
                              }
                            ]
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            }
          ]
        }
      },
      include: {
        main_categories: {
          include: {
            sub_categories: {
              include: {
                sub_sub_categories: {
                  include: {
                    sub_sub_sub_categories: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    console.log('✅ Test category created successfully!');
    console.log(`📂 Category: ${category.name} (${category.color})`);
    console.log(`   Main categories: ${category.main_categories.length}`);
    
    category.main_categories.forEach(main => {
      console.log(`  └── ${main.name}`);
      main.sub_categories.forEach(sub => {
        console.log(`      └── ${sub.name}`);
        sub.sub_sub_categories.forEach(subsub => {
          console.log(`          └── ${subsub.name}`);
          subsub.sub_sub_sub_categories.forEach(subsubsub => {
            console.log(`              └── ${subsubsub.name}`);
          });
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Error creating category:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestCategory();