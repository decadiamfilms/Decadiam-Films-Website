import express, { Request, Response } from 'express';
import { secureAuthService, CreateUserData, LoginCredentials } from '../../services/secure-auth.service';
import { validatePasswordStrength } from '../../utils/auth.utils';

const router = express.Router();

// Login endpoint with proper security
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginCredentials = req.body;

    // Basic input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Authenticate user
    const authResult = await secureAuthService.authenticateUser({ email, password });

    // Set secure HTTP-only cookie for refresh token
    res.cookie('refreshToken', authResult.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      data: {
        user: authResult.user,
        accessToken: authResult.accessToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    });
  }
});

// Register endpoint with password validation
router.post('/register', async (req: Request, res: Response) => {
  try {
    const userData: CreateUserData = req.body;

    // Basic input validation
    if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Create user
    const user = await secureAuthService.createUser(userData);

    res.status(201).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token not provided'
      });
    }

    const result = await secureAuthService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed'
    });
  }
});

// Logout endpoint
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (refreshToken) {
      await secureAuthService.logoutUser(refreshToken);
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

// Change password endpoint
router.post('/change-password', async (req: Request, res: Response) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'All password fields are required'
      });
    }

    await secureAuthService.changePassword(userId, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Password change failed'
    });
  }
});

// Password strength validation endpoint
router.post('/validate-password', (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    const validation = validatePasswordStrength(password);

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Password validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Password validation failed'
    });
  }
});

// Get current user endpoint (requires authentication)
router.get('/me', async (req: Request, res: Response) => {
  try {
    // This would typically use JWT middleware to extract user from token
    // For now, we'll use a simple header-based approach
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const user = await secureAuthService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user'
    });
  }
});

export default router;