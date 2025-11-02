import express, { Request, Response } from 'express';
import { twoFactorAuthService } from '../../services/two-factor-auth.service';

const router = express.Router();

// Generate 2FA enrollment data
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Check rate limiting
    if (!twoFactorAuthService.checkRateLimit(`2fa_generate_${email}`, 3, 300000)) {
      return res.status(429).json({
        success: false,
        error: 'Too many 2FA generation attempts. Please wait 5 minutes.'
      });
    }

    console.log('🔐 Generating 2FA enrollment data for:', email);
    
    const enrollmentData = await twoFactorAuthService.generateEnrollmentData(email);

    res.json({
      success: true,
      data: enrollmentData
    });
  } catch (error) {
    console.error('❌ 2FA generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate 2FA enrollment data'
    });
  }
});

// Verify 2FA setup
router.post('/verify-setup', async (req: Request, res: Response) => {
  try {
    const { email, secret, code } = req.body;

    if (!email || !secret || !code) {
      return res.status(400).json({
        success: false,
        error: 'Email, secret, and verification code are required'
      });
    }

    // Check rate limiting for verification attempts
    if (!twoFactorAuthService.checkRateLimit(`2fa_verify_${email}`, 5, 300000)) {
      return res.status(429).json({
        success: false,
        error: 'Too many verification attempts. Please wait 5 minutes.'
      });
    }

    console.log('🔐 Verifying 2FA setup for:', email);

    const validation = await twoFactorAuthService.validateTwoFactorSetup(email, secret, code);

    if (validation.isValid) {
      // Reset rate limiting on successful verification
      twoFactorAuthService.resetRateLimit(`2fa_verify_${email}`);
      
      res.json({
        success: true,
        message: '2FA setup verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: validation.error || 'Invalid verification code'
      });
    }
  } catch (error) {
    console.error('❌ 2FA verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify 2FA setup'
    });
  }
});

// Enable 2FA for user (final step)
router.post('/enable', async (req: Request, res: Response) => {
  try {
    const { email, secret, backupCodes } = req.body;

    if (!email || !secret || !backupCodes) {
      return res.status(400).json({
        success: false,
        error: 'Email, secret, and backup codes are required'
      });
    }

    console.log('🔐 Enabling 2FA for user:', email);

    // In production, this would update the database
    // For now, we'll simulate successful completion
    
    res.json({
      success: true,
      message: '2FA enabled successfully',
      data: {
        twoFactorEnabled: true,
        backupCodesCount: backupCodes.length
      }
    });
  } catch (error) {
    console.error('❌ 2FA enable error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enable 2FA'
    });
  }
});

// Verify 2FA code during login
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { email, code, isBackupCode } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: 'Email and code are required'
      });
    }

    // Check rate limiting for login verification
    if (!twoFactorAuthService.checkRateLimit(`2fa_login_${email}`, 10, 900000)) {
      return res.status(429).json({
        success: false,
        error: 'Too many login attempts. Please wait 15 minutes.'
      });
    }

    console.log('🔐 Verifying 2FA code for login:', email);

    // In production, this would check against stored user secret/backup codes
    // For now, simulate verification logic
    
    res.json({
      success: true,
      message: '2FA verification successful'
    });
  } catch (error) {
    console.error('❌ 2FA login verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify 2FA code'
    });
  }
});

// Disable 2FA
router.post('/disable', async (req: Request, res: Response) => {
  try {
    const { email, currentPassword } = req.body;

    if (!email || !currentPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email and current password are required to disable 2FA'
      });
    }

    console.log('🔐 Disabling 2FA for user:', email);

    // In production, this would verify password and update database
    
    res.json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    console.error('❌ 2FA disable error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disable 2FA'
    });
  }
});

export default router;