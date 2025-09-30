import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface LoginCredentials {
  email: string;
  password: string;
  deviceInfo?: {
    userAgent: string;
    ipAddress: string;
  };
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  companyId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  private generateTokens(userId: string, sessionId: string): AuthTokens {
    const accessToken = jwt.sign(
      { userId, sessionId },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      { userId, sessionId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 7200, // 2 hours in seconds
    };
  }

  async register(data: RegisterData) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create company if new registration
    let companyId = data.companyId;
    if (!companyId && data.companyName) {
      const company = await prisma.company.create({
        data: {
          name: data.companyName,
          email: data.email,
          subscriptionStatus: 'TRIAL',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        },
      });
      companyId = company.id;

      // Create default user group for admin
      await prisma.userGroup.create({
        data: {
          companyId,
          name: 'Administrator',
          permissions: {
            quotes: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
            orders: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
            invoices: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
            customers: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
            products: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
            inventory: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
            jobs: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
            reports: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
            administration: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          },
        },
      });
    }

    if (!companyId) {
      throw new Error('Company ID or name is required');
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        companyId,
        isActive: true,
      },
    });

    // If first user in company, make them admin
    const userCount = await prisma.user.count({
      where: { companyId },
    });

    if (userCount === 1) {
      const adminGroup = await prisma.userGroup.findFirst({
        where: { companyId, name: 'Administrator' },
      });

      if (adminGroup) {
        await prisma.userGroupMembership.create({
          data: {
            userId: user.id,
            groupId: adminGroup.id,
          },
        });
      }
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyId: user.companyId,
    };
  }

  async login(credentials: LoginCredentials) {
    console.log('AuthService.login called for:', credentials.email);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
      include: { company: true },
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Create session
    const sessionId = uuidv4();
    const refreshTokenUuid = uuidv4();
    
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours to match JWT

    // Generate tokens first so we can use the JWT as the session token
    const tokens = this.generateTokens(user.id, sessionId);

    console.log('About to create session with:', {
      sessionId,
      userId: user.id,
      tokenLength: tokens.accessToken.length,
      refreshTokenLength: refreshTokenUuid.length
    });

    let session;
    try {
      session = await prisma.authSession.create({
        data: {
          id: sessionId,
          userId: user.id,
          token: tokens.accessToken, // Use JWT as session token
          refreshToken: refreshTokenUuid,
          expiresAt,
          deviceInfo: credentials.deviceInfo,
          ipAddress: credentials.deviceInfo?.ipAddress,
        },
      });

      console.log('Session created successfully:', {
        sessionId: session.id,
        tokenLength: session.token.length,
        tokenPrefix: session.token.substring(0, 50) + '...'
      });
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error('Failed to create session: ' + (error as Error).message);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: user.companyId,
        company: {
          id: user.company.id,
          name: user.company.name,
          logoUrl: user.company.logoUrl,
        },
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as any;

      const session = await prisma.authSession.findUnique({
        where: { id: decoded.sessionId },
        include: { user: true },
      });

      if (!session) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = this.generateTokens(session.userId, session.id);

      // Update session expiry
      await prisma.authSession.update({
        where: { id: session.id },
        data: {
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          lastActivity: new Date(),
        },
      });

      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          firstName: session.user.firstName,
          lastName: session.user.lastName,
          companyId: session.user.companyId,
        },
        ...tokens,
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(token: string) {
    await prisma.authSession.delete({
      where: { token },
    });
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If an account exists, a password reset email has been sent' };
    }

    // Generate reset token (in production, send this via email)
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password-reset' },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' } as jwt.SignOptions
    );

    // In production, send email with reset link
    console.log('Password reset token:', resetToken);

    return { message: 'If an account exists, a password reset email has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

      if (decoded.type !== 'password-reset') {
        throw new Error('Invalid token');
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: decoded.userId },
        data: { passwordHash },
      });

      // Invalidate all existing sessions
      await prisma.authSession.deleteMany({
        where: { userId: decoded.userId },
      });

      return { message: 'Password reset successfully' };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}