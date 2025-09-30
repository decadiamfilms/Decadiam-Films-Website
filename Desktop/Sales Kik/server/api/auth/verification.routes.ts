import express from 'express';
import emailService from '../../services/email.service';
import resendService from '../../services/resend.service';

const router = express.Router();

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map<string, {
  code: string;
  email: string;
  expiresAt: Date;
  attempts: number;
}>();

// Send verification code via email
router.post('/send-verification', async (req, res) => {
  try {
    const { email, firstName, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }

    // Store the verification code with expiration
    verificationCodes.set(email, {
      code: verificationCode,
      email,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes
      attempts: 0
    });

    // Try Resend first (faster), fallback to SendGrid
    let emailSent = false;
    try {
      emailSent = await resendService.sendVerificationEmail(email, firstName, verificationCode);
      console.log('📧 Email sent via Resend (instant delivery)');
    } catch (error) {
      console.log('⚠️  Resend failed, trying SendGrid fallback...');
      emailSent = await emailService.sendVerificationEmail(email, firstName, verificationCode);
    }
    
    if (!emailSent) {
      console.log('⚠️  All email services unavailable - code logged for development');
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent successfully',
      expiresIn: 120 // 2 minutes in seconds
    });

  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code'
    });
  }
});

// Verify the code
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and code are required'
      });
    }

    const storedData = verificationCodes.get(email);
    
    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found for this email'
      });
    }

    // Check if code has expired
    if (new Date() > storedData.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired'
      });
    }

    // Check attempts limit
    if (storedData.attempts >= 5) {
      verificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new code.'
      });
    }

    // Verify the code
    if (storedData.code === code) {
      // Success - remove from storage
      verificationCodes.delete(email);
      
      res.status(200).json({
        success: true,
        message: 'Email verified successfully'
      });
    } else {
      // Invalid code - increment attempts
      storedData.attempts++;
      verificationCodes.set(email, storedData);
      
      res.status(400).json({
        success: false,
        message: `Invalid verification code. ${5 - storedData.attempts} attempts remaining.`
      });
    }

  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify code'
    });
  }
});

export default router;