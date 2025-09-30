import { Router } from 'express';

const router = Router();

// Invoice routes will be implemented here
router.get('/', (req, res) => {
  res.json({ message: 'Invoice routes - To be implemented' });
});

export default router;