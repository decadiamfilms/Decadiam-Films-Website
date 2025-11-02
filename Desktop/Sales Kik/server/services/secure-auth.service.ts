import { 
  hashPassword, 
  verifyPassword, 
  generateAccessToken, 
  generateRefreshToken,
  validatePasswordStrength,
  generatePasswordResetToken
} from '../utils/auth.utils';

export interface SecureUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  companyId: string;
  isActive: boolean;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  emailVerified: boolean;
  permissions?: any;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  companyId: string;
  permissions?: any;
}

export interface AuthResponse {
  user: Omit<SecureUser, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
}

class SecureAuthService {
  private users: Map<string, SecureUser> = new Map();
  private refreshTokens: Map<string, string> = new Map(); // tokenId -> userId
  
  constructor() {
    this.initializeDefaultUsers();
  }

  /**
   * Initialize secure admin users with proper hashing
   */
  private async initializeDefaultUsers() {
    try {
      // Create secure admin user with the new credentials
      const adminPasswordHash = await hashPassword('Gabbie1512!');
      
      const adminUser: SecureUser = {
        id: 'admin-001',
        email: 'adambudai2806@gmail.com',
        firstName: 'Adam',
        lastName: 'Budai',
        role: 'ADMIN',
        companyId: '0e573687-3b53-498a-9e78-f198f16f8bcb',
        isActive: true,
        passwordHash: adminPasswordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
        failedLoginAttempts: 0,
        emailVerified: true,
      };

      this.users.set(adminUser.email, adminUser);
      console.log('✅ Secure admin user created: adambudai2806@gmail.com');
      
    } catch (error) {
      console.error('❌ Failed to initialize default users:', error);
    }
  }

  /**
   * Create a new user account with secure password hashing
   */
  async createUser(userData: CreateUserData): Promise<Omit<SecureUser, 'passwordHash'>> {
    // Validate email doesn't already exist
    if (this.users.has(userData.email)) {
      throw new Error('User with this email already exists');
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(userData.password);
    if (!passwordValidation.isValid) {
      throw new Error(`Password does not meet security requirements: ${passwordValidation.feedback.join(', ')}`);
    }

    // Hash password securely
    const passwordHash = await hashPassword(userData.password);

    const user: SecureUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      email: userData.email.toLowerCase().trim(),
      firstName: userData.firstName.trim(),
      lastName: userData.lastName.trim(),
      role: userData.role,
      companyId: userData.companyId,
      isActive: true,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
      failedLoginAttempts: 0,
      emailVerified: false, // Would require email verification in production
      permissions: userData.permissions
    };

    this.users.set(user.email, user);

    // Return user without password hash
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Authenticate user with secure login
   */
  async authenticateUser(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials;
    const user = this.users.get(email.toLowerCase().trim());

    if (!user) {
      // Prevent user enumeration by taking same time as password verification
      await hashPassword('dummy-password-to-prevent-timing-attacks');
      throw new Error('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new Error(`Account is locked. Try again in ${minutesLeft} minutes.`);
    }

    // Check if account is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      // Increment failed login attempts
      user.failedLoginAttempts += 1;
      
      // Lock account after 5 failed attempts for 15 minutes
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      
      user.updatedAt = new Date();
      throw new Error('Invalid credentials');
    }

    // Reset failed login attempts on successful login
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    user.lastLogin = new Date();
    user.updatedAt = new Date();

    // Generate JWT tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    this.refreshTokens.set(refreshToken, user.id);

    // Return user without password hash
    const { passwordHash: _, ...safeUser } = user;
    
    return {
      user: safeUser,
      accessToken,
      refreshToken
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    const userId = this.refreshTokens.get(refreshToken);
    
    if (!userId) {
      throw new Error('Invalid refresh token');
    }

    // Find user by ID
    const user = Array.from(this.users.values()).find(u => u.id === userId);
    
    if (!user || !user.isActive) {
      this.refreshTokens.delete(refreshToken);
      throw new Error('User not found or inactive');
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    };

    const accessToken = generateAccessToken(tokenPayload);
    
    return { accessToken };
  }

  /**
   * Logout user and invalidate tokens
   */
  async logoutUser(refreshToken: string): Promise<void> {
    this.refreshTokens.delete(refreshToken);
  }

  /**
   * Change user password with security checks
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = Array.from(this.users.values()).find(u => u.id === userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`New password does not meet security requirements: ${passwordValidation.feedback.join(', ')}`);
    }

    // Hash new password
    user.passwordHash = await hashPassword(newPassword);
    user.updatedAt = new Date();
    
    // Invalidate all refresh tokens for this user (force re-login)
    for (const [token, tokenUserId] of this.refreshTokens.entries()) {
      if (tokenUserId === userId) {
        this.refreshTokens.delete(token);
      }
    }
  }

  /**
   * Get user by ID (without password hash)
   */
  async getUserById(userId: string): Promise<Omit<SecureUser, 'passwordHash'> | null> {
    const user = Array.from(this.users.values()).find(u => u.id === userId);
    
    if (!user) {
      return null;
    }

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Get user by email (without password hash)
   */
  async getUserByEmail(email: string): Promise<Omit<SecureUser, 'passwordHash'> | null> {
    const user = this.users.get(email.toLowerCase().trim());
    
    if (!user) {
      return null;
    }

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  /**
   * List all users (admin only, without password hashes)
   */
  async getAllUsers(): Promise<Omit<SecureUser, 'passwordHash'>[]> {
    return Array.from(this.users.values()).map(user => {
      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    });
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: string): Promise<void> {
    const user = Array.from(this.users.values()).find(u => u.id === userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    user.isActive = false;
    user.updatedAt = new Date();
    
    // Invalidate all refresh tokens for this user
    for (const [token, tokenUserId] of this.refreshTokens.entries()) {
      if (tokenUserId === userId) {
        this.refreshTokens.delete(token);
      }
    }
  }
}

export const secureAuthService = new SecureAuthService();