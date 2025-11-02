import { TOTP, Secret } from 'otpauth';
import { randomBytes } from 'crypto';
import QRCode from 'qrcode';

/**
 * Enterprise Two-Factor Authentication Service
 * Following 2025 security best practices with TOTP implementation
 */
export class TwoFactorAuthService {
  private readonly ISSUER = 'SalesKik';
  private readonly ALGORITHM = 'SHA1';
  private readonly DIGITS = 6;
  private readonly PERIOD = 30; // seconds
  
  /**
   * Generate a new TOTP secret for user enrollment
   * Uses cryptographically secure random generation
   */
  generateTotpSecret(): string {
    // Generate 160-bit (20-byte) secret as recommended by RFC 6238
    const secret = new Secret({ size: 20 });
    return secret.base32;
  }

  /**
   * Create TOTP instance for a user
   * @param userEmail - User's email address
   * @param secret - User's TOTP secret
   */
  createTotpInstance(userEmail: string, secret: string): TOTP {
    return new TOTP({
      issuer: this.ISSUER,
      label: userEmail,
      algorithm: this.ALGORITHM,
      digits: this.DIGITS,
      period: this.PERIOD,
      secret: Secret.fromBase32(secret)
    });
  }

  /**
   * Generate QR code URL for authenticator app setup
   * @param userEmail - User's email address  
   * @param secret - User's TOTP secret
   */
  async generateQrCodeUrl(userEmail: string, secret: string): Promise<string> {
    const totp = this.createTotpInstance(userEmail, secret);
    const otpAuthUrl = totp.toString();
    
    try {
      const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);
      return qrCodeUrl;
    } catch (error) {
      console.error('❌ Failed to generate QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify a TOTP code against user's secret
   * @param secret - User's TOTP secret
   * @param token - 6-digit code from authenticator app
   * @param window - Time window tolerance (default: 1 = ±30 seconds)
   */
  verifyTotpCode(secret: string, token: string, window: number = 1): boolean {
    try {
      // Remove spaces and validate format
      const cleanToken = token.replace(/\s+/g, '');
      
      if (!/^\d{6}$/.test(cleanToken)) {
        console.log('⚠️ Invalid TOTP token format');
        return false;
      }

      const totp = new TOTP({
        issuer: this.ISSUER,
        algorithm: this.ALGORITHM,
        digits: this.DIGITS,
        period: this.PERIOD,
        secret: Secret.fromBase32(secret)
      });

      // Verify with time window tolerance for clock skew
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check current time and ±window periods
      for (let i = -window; i <= window; i++) {
        const timeStep = currentTime + (i * this.PERIOD);
        const expectedToken = totp.generate({ timestamp: timeStep * 1000 });
        
        if (expectedToken === cleanToken) {
          console.log('✅ TOTP verification successful');
          return true;
        }
      }
      
      console.log('❌ TOTP verification failed');
      return false;
    } catch (error) {
      console.error('❌ TOTP verification error:', error);
      return false;
    }
  }

  /**
   * Generate secure backup codes for account recovery
   * @param count - Number of backup codes to generate (default: 8)
   */
  generateBackupCodes(count: number = 8): string[] {
    const backupCodes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = randomBytes(4).toString('hex').toUpperCase();
      const formatted = `${code.slice(0, 4)}-${code.slice(4, 8)}`;
      backupCodes.push(formatted);
    }
    
    console.log('🔐 Generated backup codes for emergency access');
    return backupCodes;
  }

  /**
   * Verify backup code and mark as used
   * @param backupCodes - Array of user's backup codes
   * @param providedCode - Code provided by user
   */
  verifyBackupCode(backupCodes: string[], providedCode: string): {
    isValid: boolean;
    remainingCodes: string[];
  } {
    const cleanCode = providedCode.replace(/\s+/g, '').toUpperCase();
    const codeIndex = backupCodes.indexOf(cleanCode);
    
    if (codeIndex === -1) {
      console.log('❌ Invalid backup code provided');
      return { isValid: false, remainingCodes: backupCodes };
    }
    
    // Remove used backup code
    const remainingCodes = backupCodes.filter((_, index) => index !== codeIndex);
    
    console.log('✅ Backup code verified and marked as used');
    return { isValid: true, remainingCodes };
  }

  /**
   * Validate 2FA setup requirements
   * @param userEmail - User's email
   * @param secret - Generated secret  
   * @param verificationCode - Code from user's authenticator app
   */
  async validateTwoFactorSetup(
    userEmail: string, 
    secret: string, 
    verificationCode: string
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        return { isValid: false, error: 'Invalid email format' };
      }

      // Validate secret format (base32)
      if (!/^[A-Z2-7]+=*$/i.test(secret)) {
        return { isValid: false, error: 'Invalid secret format' };
      }

      // Verify the code works with the secret
      const isCodeValid = this.verifyTotpCode(secret, verificationCode);
      if (!isCodeValid) {
        return { isValid: false, error: 'Invalid verification code' };
      }

      console.log('✅ 2FA setup validation successful');
      return { isValid: true };
    } catch (error) {
      console.error('❌ 2FA setup validation error:', error);
      return { isValid: false, error: 'Setup validation failed' };
    }
  }

  /**
   * Get 2FA enrollment data for user setup
   * @param userEmail - User's email address
   */
  async generateEnrollmentData(userEmail: string): Promise<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
    manualEntryKey: string;
  }> {
    try {
      const secret = this.generateTotpSecret();
      const qrCodeUrl = await this.generateQrCodeUrl(userEmail, secret);
      const backupCodes = this.generateBackupCodes();
      
      // Format secret for manual entry (spaces every 4 chars)
      const manualEntryKey = secret.match(/.{1,4}/g)?.join(' ') || secret;
      
      console.log('🔐 Generated 2FA enrollment data for:', userEmail);
      
      return {
        secret,
        qrCodeUrl,
        backupCodes,
        manualEntryKey
      };
    } catch (error) {
      console.error('❌ Failed to generate enrollment data:', error);
      throw new Error('Failed to generate 2FA enrollment data');
    }
  }

  /**
   * Enterprise-grade rate limiting for 2FA attempts
   * Prevents brute force attacks on TOTP codes
   */
  private static attemptTracking = new Map<string, { attempts: number; lastAttempt: number }>();
  
  checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 300000): boolean {
    const now = Date.now();
    const tracking = TwoFactorAuthService.attemptTracking.get(identifier);
    
    if (!tracking || (now - tracking.lastAttempt) > windowMs) {
      // Reset or initialize tracking
      TwoFactorAuthService.attemptTracking.set(identifier, { attempts: 1, lastAttempt: now });
      return true;
    }
    
    if (tracking.attempts >= maxAttempts) {
      console.log('🚫 2FA rate limit exceeded for:', identifier);
      return false;
    }
    
    tracking.attempts++;
    tracking.lastAttempt = now;
    return true;
  }

  /**
   * Reset rate limiting for successful authentication
   */
  resetRateLimit(identifier: string): void {
    TwoFactorAuthService.attemptTracking.delete(identifier);
  }
}

export const twoFactorAuthService = new TwoFactorAuthService();