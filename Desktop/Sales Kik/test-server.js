const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Simple categories endpoint
app.get('/api/categories', async (req, res) => {
  try {
    console.log('📋 Fetching categories...');
    
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
              orderBy: { sort_order: 'asc' }
            }
          },
          orderBy: { sort_order: 'asc' }
        }
      },
      orderBy: { sort_order: 'asc' }
    });
    
    console.log('✅ Found categories:', categories.length);
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete categories endpoint
app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting category:', id);
    
    await prisma.category.update({
      where: { id },
      data: { is_active: false }
    });
    
    console.log('✅ Category deleted successfully');
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(5001, () => {
  console.log('🚀 Test server running on port 5001');
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});