const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    // Test the connection by counting companies
    const companyCount = await prisma.company.count();
    console.log('✅ Database connection successful!');
    console.log(`   Found ${companyCount} companies in the database`);
    
    // Check all tables
    const tables = [
      'Company', 'User', 'UserGroup', 'Product', 'Customer',
      'Quote', 'Order', 'Invoice', 'Location', 'Job'
    ];
    
    console.log('\n📊 Database tables status:');
    for (const table of tables) {
      try {
        const count = await prisma[table.charAt(0).toLowerCase() + table.slice(1)].count();
        console.log(`   ✓ ${table}: ${count} records`);
      } catch (e) {
        console.log(`   ✗ ${table}: Error accessing table`);
      }
    }
    
    console.log('\n🎉 Database setup complete and working!');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();