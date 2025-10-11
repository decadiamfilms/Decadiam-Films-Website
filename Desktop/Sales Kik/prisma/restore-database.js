const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function restoreDatabase(backupFile) {
  try {
    if (!fs.existsSync(backupFile)) {
      console.error('❌ Backup file not found:', backupFile);
      return;
    }

    console.log('🔄 Restoring database from:', backupFile);

    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    console.log('📋 Backup info:');
    console.log(`  - Created: ${backup.timestamp}`);
    console.log(`  - Version: ${backup.version}`);
    console.log(`  - Description: ${backup.description}`);

    // Clear existing data
    console.log('🧹 Clearing existing categories...');
    await prisma.subcategory.deleteMany({});
    await prisma.category.deleteMany({});

    // Restore categories
    console.log('📂 Restoring categories...');
    for (const category of backup.data.categories) {
      const { subcategories, ...categoryData } = category;
      
      await prisma.category.create({
        data: categoryData
      });

      // Restore subcategories
      for (const subcategory of subcategories) {
        await prisma.subcategory.create({
          data: subcategory
        });
      }
    }

    console.log('✅ Database restored successfully!');
    console.log('📊 Restored:');
    console.log(`  - ${backup.data.categories.length} categories`);
    console.log(`  - ${backup.data.categories.reduce((sum, cat) => sum + cat.subcategories.length, 0)} subcategories`);

  } catch (error) {
    console.error('❌ Restore failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get backup file from command line argument
const backupFile = process.argv[2];
if (!backupFile) {
  console.log('Usage: node restore-database.js <backup-file.json>');
  console.log('Available backups:');
  const backups = fs.readdirSync('./prisma').filter(f => f.startsWith('database-backup-'));
  backups.forEach(f => console.log(`  - ${f}`));
} else {
  restoreDatabase(backupFile);
}