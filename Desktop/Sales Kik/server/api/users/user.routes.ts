import { Router } from 'express';

const router = Router();

// User routes will be implemented here
router.get('/', (req, res) => {
  res.json({ message: 'User routes - To be implemented' });
});

export default router;