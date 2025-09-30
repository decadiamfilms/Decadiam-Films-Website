import { Router } from 'express';
import { prisma } from '../../index';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all customers
router.get('/', async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const customers = await prisma.customer.findMany({
      where: { 
        companyId: companyId,
        isActive: true 
      },
      include: {
        contacts: true,
        priceList: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Create customer
router.post('/', async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const customer = await prisma.customer.create({
      data: {
        companyId: companyId,
        ...req.body
      }
    });

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

export default router;