import { Router } from 'express';

const router = Router();

// Order routes will be implemented here
router.get('/', (req, res) => {
  res.json({ message: 'Order routes - To be implemented' });
});

export default router;