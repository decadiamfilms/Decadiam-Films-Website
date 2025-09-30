import { Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';

const TRANSFERS_FILE = path.join(process.cwd(), 'data', 'transfers.json');

interface TransferRequest {
  id: string;
  fromWarehouse: string;
  toWarehouse: string;
  productId: string;
  productName: string;
  quantity: number;
  priority: 'normal' | 'high' | 'urgent';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  approvedBy?: string;
  rejectedBy?: string;
}

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Load transfer requests from file
async function loadTransfers(): Promise<TransferRequest[]> {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(TRANSFERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is empty, return empty array
    return [];
  }
}

// Save transfer requests to file
async function saveTransfers(transfers: TransferRequest[]): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(TRANSFERS_FILE, JSON.stringify(transfers, null, 2));
}

// Get all transfer requests
export const getAllTransfers = async (req: Request, res: Response) => {
  try {
    const transfers = await loadTransfers();
    res.json(transfers);
  } catch (error) {
    console.error('Error loading transfers:', error);
    res.status(500).json({ error: 'Failed to load transfer requests' });
  }
};

// Create new transfer request
export const createTransfer = async (req: Request, res: Response) => {
  try {
    const transferData = req.body;
    
    // Validate required fields
    if (!transferData.fromWarehouse || !transferData.toWarehouse || !transferData.productId || !transferData.quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const transfers = await loadTransfers();
    
    const newTransfer: TransferRequest = {
      id: `TR-${Date.now()}`,
      fromWarehouse: transferData.fromWarehouse,
      toWarehouse: transferData.toWarehouse,
      productId: transferData.productId,
      productName: transferData.productName,
      quantity: Number(transferData.quantity),
      priority: transferData.priority || 'normal',
      reason: transferData.reason,
      status: 'pending',
      requestedBy: transferData.requestedBy || 'system',
      requestedAt: new Date().toISOString()
    };
    
    transfers.unshift(newTransfer);
    await saveTransfers(transfers);
    
    console.log('✅ Transfer request created:', newTransfer.id);
    res.json(newTransfer);
  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(500).json({ error: 'Failed to create transfer request' });
  }
};

// Update transfer status (approve/reject)
export const updateTransferStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, approvedBy } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const transfers = await loadTransfers();
    const transferIndex = transfers.findIndex(t => t.id === id);
    
    if (transferIndex === -1) {
      return res.status(404).json({ error: 'Transfer request not found' });
    }
    
    // Update the transfer
    transfers[transferIndex] = {
      ...transfers[transferIndex],
      status: status as 'approved' | 'rejected',
      ...(status === 'approved' && { 
        approvedAt: new Date().toISOString(),
        approvedBy: approvedBy || 'system'
      }),
      ...(status === 'rejected' && { 
        rejectedAt: new Date().toISOString(),
        rejectedBy: approvedBy || 'system'
      })
    };
    
    await saveTransfers(transfers);
    
    console.log(`✅ Transfer ${status}:`, id);
    res.json(transfers[transferIndex]);
  } catch (error) {
    console.error('Error updating transfer status:', error);
    res.status(500).json({ error: 'Failed to update transfer status' });
  }
};

// Delete transfer request
export const deleteTransfer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transfers = await loadTransfers();
    const updatedTransfers = transfers.filter(t => t.id !== id);
    
    await saveTransfers(updatedTransfers);
    
    console.log('✅ Transfer deleted:', id);
    res.json({ message: 'Transfer request deleted' });
  } catch (error) {
    console.error('Error deleting transfer:', error);
    res.status(500).json({ error: 'Failed to delete transfer request' });
  }
};