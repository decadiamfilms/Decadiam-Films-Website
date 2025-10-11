const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function backupDatabase() {
  try {
    console.log('🔄 Creating database backup...');

    // Export current categories and subcategories
    const categories = await prisma.category.findMany({
      include: {
        subcategories: true
      }
    });

    const companies = await prisma.company.findMany();
    const users = await prisma.user.findMany();

    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      description: 'SalesKik database backup with complete category structure',
      data: {
        companies,
        categories,
        users: users.map(u => ({
          ...u,
          passwordHash: '[REDACTED]' // Don't backup passwords
        }))
      }
    };

    // Write backup file
    const backupPath = `./prisma/database-backup-${Date.now()}.json`;
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    
    console.log('✅ Database backup created:', backupPath);
    console.log('📊 Backup contains:');
    console.log(`  - ${backup.data.companies.length} companies`);
    console.log(`  - ${backup.data.categories.length} categories`);
    console.log(`  - ${backup.data.categories.reduce((sum, cat) => sum + cat.subcategories.length, 0)} total subcategories`);
    console.log(`  - ${backup.data.users.length} users (passwords redacted)`);

    return backupPath;
  } catch (error) {
    console.error('❌ Backup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase();