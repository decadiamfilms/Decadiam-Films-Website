import { randomBytes } from 'crypto';

interface TrustedDevice {
  id: string;
  userId: string;
  fingerprint: string;
  name: string;
  lastUsed: Date;
  createdAt: Date;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
}

/**
 * Device Trust Service - Intelligent 2FA Requirements
 * Implements "Remember Device" functionality following 2025 best practices
 */
export class DeviceTrustService {
  private trustedDevices: Map<string, TrustedDevice> = new Map();
  private readonly TRUST_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
  
  /**
   * Generate device fingerprint from request headers
   * Uses user agent, IP, and other identifying characteristics
   */
  generateDeviceFingerprint(req: any): string {
    const components = [
      req.get('User-Agent') || '',
      req.get('Accept-Language') || '',
      req.get('Accept-Encoding') || '',
      req.ip || '',
      // Add more fingerprint components for security
      req.get('Accept') || ''
    ];
    
    const fingerprint = Buffer.from(components.join('|')).toString('base64');
    return fingerprint.substring(0, 32); // Truncate for storage
  }

  /**
   * Check if device should be trusted (skip 2FA)
   * @param userId - User ID
   * @param deviceFingerprint - Device fingerprint
   */
  isDeviceTrusted(userId: string, deviceFingerprint: string): boolean {
    const deviceKey = `${userId}:${deviceFingerprint}`;
    const trustedDevice = this.trustedDevices.get(deviceKey);
    
    if (!trustedDevice) {
      console.log('🔍 Device not found in trusted list');
      return false;
    }

    // Check if device trust has expired
    if (trustedDevice.expiresAt < new Date()) {
      console.log('⏰ Device trust expired, removing from trusted list');
      this.trustedDevices.delete(deviceKey);
      return false;
    }

    // Update last used timestamp
    trustedDevice.lastUsed = new Date();
    console.log('✅ Device is trusted, skipping 2FA');
    return true;
  }

  /**
   * Add device to trusted list after successful 2FA
   * @param userId - User ID
   * @param deviceFingerprint - Device fingerprint  
   * @param req - Express request object for device info
   */
  trustDevice(userId: string, deviceFingerprint: string, req: any): string {
    const deviceId = randomBytes(16).toString('hex');
    const now = new Date();
    
    // Generate friendly device name
    const userAgent = req.get('User-Agent') || '';
    let deviceName = 'Unknown Device';
    
    if (userAgent.includes('Chrome')) {
      deviceName = 'Chrome Browser';
    } else if (userAgent.includes('Firefox')) {
      deviceName = 'Firefox Browser';
    } else if (userAgent.includes('Safari')) {
      deviceName = 'Safari Browser';
    } else if (userAgent.includes('Edge')) {
      deviceName = 'Edge Browser';
    }
    
    // Add OS info if available
    if (userAgent.includes('Windows')) {
      deviceName += ' on Windows';
    } else if (userAgent.includes('Mac')) {
      deviceName += ' on macOS';
    } else if (userAgent.includes('iPhone')) {
      deviceName = 'iPhone';
    } else if (userAgent.includes('Android')) {
      deviceName = 'Android Device';
    }

    const trustedDevice: TrustedDevice = {
      id: deviceId,
      userId,
      fingerprint: deviceFingerprint,
      name: deviceName,
      lastUsed: now,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.TRUST_DURATION),
      ipAddress: req.ip || 'unknown',
      userAgent: userAgent
    };

    const deviceKey = `${userId}:${deviceFingerprint}`;
    this.trustedDevices.set(deviceKey, trustedDevice);
    
    console.log('🔐 Device trusted for 30 days:', deviceName);
    return deviceId;
  }

  /**
   * Remove device from trusted list
   * @param userId - User ID
   * @param deviceId - Device ID to remove
   */
  removeTrustedDevice(userId: string, deviceId: string): boolean {
    for (const [key, device] of this.trustedDevices.entries()) {
      if (device.userId === userId && device.id === deviceId) {
        this.trustedDevices.delete(key);
        console.log('🗑️ Trusted device removed:', device.name);
        return true;
      }
    }
    return false;
  }

  /**
   * Get all trusted devices for a user
   * @param userId - User ID
   */
  getTrustedDevices(userId: string): TrustedDevice[] {
    const userDevices: TrustedDevice[] = [];
    
    for (const device of this.trustedDevices.values()) {
      if (device.userId === userId) {
        userDevices.push(device);
      }
    }
    
    // Sort by most recently used
    return userDevices.sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());
  }

  /**
   * Clean up expired trusted devices
   */
  cleanupExpiredDevices(): void {
    const now = new Date();
    const expiredKeys: string[] = [];
    
    for (const [key, device] of this.trustedDevices.entries()) {
      if (device.expiresAt < now) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.trustedDevices.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log('🧹 Cleaned up expired trusted devices:', expiredKeys.length);
    }
  }

  /**
   * Determine if 2FA is required based on risk assessment
   * @param userId - User ID
   * @param req - Express request object
   */
  is2FARequired(userId: string, req: any): {
    required: boolean;
    reason: string;
    riskLevel: 'low' | 'medium' | 'high';
  } {
    // Clean up expired devices first
    this.cleanupExpiredDevices();
    
    const deviceFingerprint = this.generateDeviceFingerprint(req);
    const isTrusted = this.isDeviceTrusted(userId, deviceFingerprint);
    
    if (isTrusted) {
      return {
        required: false,
        reason: 'Trusted device within 30-day window',
        riskLevel: 'low'
      };
    }

    // Risk-based assessment
    const currentTime = new Date();
    const lastLogin = new Date(); // Would come from user record
    const timeSinceLastLogin = currentTime.getTime() - lastLogin.getTime();
    
    // High risk factors
    const isNewDevice = !isTrusted;
    const isUnusualTime = currentTime.getHours() < 6 || currentTime.getHours() > 22;
    const isLongTimeSinceLogin = timeSinceLastLogin > (7 * 24 * 60 * 60 * 1000); // 7 days
    
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    let reason = 'New device detected';
    
    if (isUnusualTime) {
      riskLevel = 'high';
      reason = 'Login attempt during unusual hours';
    } else if (isLongTimeSinceLogin) {
      riskLevel = 'high';
      reason = 'Long time since last login';
    }
    
    return {
      required: true,
      reason,
      riskLevel
    };
  }

  /**
   * Get device trust statistics for admin dashboard
   */
  getTrustStatistics(): {
    totalTrustedDevices: number;
    activeDevices: number;
    expiredDevices: number;
  } {
    const now = new Date();
    let activeDevices = 0;
    let expiredDevices = 0;
    
    for (const device of this.trustedDevices.values()) {
      if (device.expiresAt > now) {
        activeDevices++;
      } else {
        expiredDevices++;
      }
    }
    
    return {
      totalTrustedDevices: this.trustedDevices.size,
      activeDevices,
      expiredDevices
    };
  }
}

export const deviceTrustService = new DeviceTrustService();