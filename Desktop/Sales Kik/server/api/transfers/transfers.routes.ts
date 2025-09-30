import express from 'express';
import { 
  getAllTransfers, 
  createTransfer, 
  updateTransferStatus, 
  deleteTransfer 
} from './transfers.controller';

const router = express.Router();

// GET /api/transfers - Get all transfer requests
router.get('/', getAllTransfers);

// POST /api/transfers - Create new transfer request
router.post('/', createTransfer);

// PUT /api/transfers/:id/status - Update transfer status (approve/reject)
router.put('/:id/status', updateTransferStatus);

// DELETE /api/transfers/:id - Delete transfer request
router.delete('/:id', deleteTransfer);

export default router;