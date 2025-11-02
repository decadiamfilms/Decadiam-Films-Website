import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Generate a secure random JWT secret (following 2025 best practices)
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Argon2 configuration (2025 recommended settings)
const ARGON2_CONFIG = {
  type: argon2.argon2id, // Most secure variant
  memoryCost: 65536,     // 64MB memory usage
  timeCost: 3,           // 3 iterations
  parallelism: 4,        // 4 parallel threads
  hashLength: 32,        // 32-byte hash output
};

/**
 * Hash a password using Argon2id (2025 gold standard)
 * @param password - Plain text password
 * @returns Promise<string> - Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // Argon2 automatically generates a unique salt for each password
    const hashedPassword = await argon2.hash(password, ARGON2_CONFIG);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a password against its hash
 * @param password - Plain text password
 * @param hashedPassword - Previously hashed password
 * @returns Promise<boolean> - Whether password matches
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await argon2.verify(hashedPassword, password);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Generate a secure JWT access token
 * @param payload - User data to include in token
 * @returns string - JWT token
 */
export function generateAccessToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'saleskik-app',
    audience: 'saleskik-users'
  });
}

/**
 * Generate a secure JWT refresh token
 * @param payload - User data to include in token
 * @returns string - JWT refresh token
 */
export function generateRefreshToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'saleskik-app',
    audience: 'saleskik-users'
  });
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns any - Decoded token payload
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'saleskik-app',
      audience: 'saleskik-users'
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Generate a secure random password for temporary accounts
 * @param length - Password length (default: 16)
 * @returns string - Random password
 */
export function generateSecurePassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

/**
 * Validate password strength (2025 security requirements)
 * @param password - Password to validate
 * @returns object - Validation result with score and requirements
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
    noCommonPatterns: boolean;
  };
  feedback: string[];
} {
  const requirements = {
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    noCommonPatterns: !/(.)\1{2,}/.test(password) && !/123|abc|password|admin/i.test(password)
  };

  const score = Object.values(requirements).filter(Boolean).length;
  const isValid = score >= 5; // Must meet at least 5/6 requirements

  const feedback: string[] = [];
  if (!requirements.minLength) feedback.push('Password must be at least 12 characters long');
  if (!requirements.hasUppercase) feedback.push('Password must contain uppercase letters');
  if (!requirements.hasLowercase) feedback.push('Password must contain lowercase letters');
  if (!requirements.hasNumbers) feedback.push('Password must contain numbers');
  if (!requirements.hasSpecialChars) feedback.push('Password must contain special characters');
  if (!requirements.noCommonPatterns) feedback.push('Password contains common patterns or words');

  return { isValid, score, requirements, feedback };
}

/**
 * Secure password reset token generation
 * @param userId - User ID
 * @returns object - Reset token and expiry
 */
export function generatePasswordResetToken(userId: string): {
  token: string;
  expiresAt: Date;
} {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry
  
  return { token: resetToken, expiresAt };
}

export { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN };