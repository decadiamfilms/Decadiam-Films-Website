import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import SMSService from '../../services/sms.service';

const router = Router();

// Send quote via SMS
router.post('/send', authenticate, async (req: Request, res: Response) => {
  try {
    const { 
      phoneNumber, 
      quoteId, 
      customerName, 
      projectName, 
      total, 
      quoteLink,
      customMessage 
    } = req.body;

    if (!phoneNumber || !quoteId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number and quote ID are required' 
      });
    }

    console.log(`SMS API: Sending quote ${quoteId} to ${phoneNumber}`);

    let success = false;

    if (customMessage) {
      // Send custom message
      success = await SMSService.sendCustomSMS(phoneNumber, customMessage);
    } else {
      // Send standardized quote SMS
      success = await SMSService.sendQuoteSMS(
        phoneNumber, 
        quoteId, 
        customerName, 
        projectName, 
        total, 
        quoteLink
      );
    }

    if (success) {
      console.log(`✅ SMS sent successfully for quote ${quoteId}`);
      res.json({ 
        success: true, 
        message: 'SMS sent successfully',
        quoteId,
        phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*') // Mask for security
      });
    } else {
      console.log(`❌ Failed to send SMS for quote ${quoteId}`);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send SMS' 
      });
    }

  } catch (error) {
    console.error('SMS API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error while sending SMS' 
    });
  }
});

// Get SMS service status
router.get('/status', authenticate, async (req: Request, res: Response) => {
  try {
    const status = SMSService.getStatus();
    const isHealthy = await SMSService.isHealthy();

    res.json({
      success: true,
      status: {
        ...status,
        isHealthy,
        lastChecked: new Date()
      }
    });
  } catch (error) {
    console.error('SMS status check error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check SMS service status' 
    });
  }
});

export default router;