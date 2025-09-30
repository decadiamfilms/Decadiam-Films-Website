import { Router, Request, Response } from 'express';

const router = Router();

// Get public quote by ID and token (no authentication required)
router.get('/quote/:quoteId', async (req: Request, res: Response) => {
  try {
    const { quoteId } = req.params;
    const { token } = req.query;

    if (!quoteId || !token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Quote ID and token are required' 
      });
    }

    // For now, return success as the frontend handles localStorage
    // In production, this would query a database
    res.json({ 
      success: true,
      message: 'Quote access validated',
      quoteId,
      accessible: true
    });

  } catch (error) {
    console.error('Public quote access error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Submit customer response (no authentication required)
router.post('/quote/:quoteId/respond', async (req: Request, res: Response) => {
  try {
    const { quoteId } = req.params;
    const { token, decision, selectedOptions, customerNotes, customerName, customerEmail } = req.body;

    if (!quoteId || !token || !decision) {
      return res.status(400).json({ 
        success: false, 
        error: 'Quote ID, token, and decision are required' 
      });
    }

    // Log the customer response
    console.log(`📋 Customer response for quote ${quoteId}:`);
    console.log(`Decision: ${decision}`);
    console.log(`Customer: ${customerName} (${customerEmail})`);
    if (selectedOptions?.length > 0) {
      console.log(`Selected options: ${selectedOptions.join(', ')}`);
    }
    if (customerNotes) {
      console.log(`Notes: ${customerNotes}`);
    }

    // In production, this would update the database
    // For now, return success as frontend handles localStorage updates

    res.json({ 
      success: true,
      message: 'Response recorded successfully',
      quoteId,
      decision,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Customer response error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to record response' 
    });
  }
});

export default router;