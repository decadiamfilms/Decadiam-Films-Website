import { Router } from 'express';

const router = Router();

// Quote routes will be implemented here
router.get('/', (req, res) => {
  res.json({ message: 'Quote routes - To be implemented' });
});

export default router;