import { Router, Request, Response } from 'express';
import { AuthService } from '../../services/auth.service';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validateRequest';
import { body } from 'express-validator';

const router = Router();
const authService = new AuthService();

// Register new user
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('companyName').optional().trim(),
    body('companyId').optional().isUUID(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      console.log('Auth route: login called for', req.body.email);
      const result = await authService.login({
        email: req.body.email,
        password: req.body.password,
        deviceInfo: {
          userAgent: req.headers['user-agent'] || '',
          ipAddress: req.ip || '',
        },
      });
      console.log('Auth route: login result obtained');

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Refresh token
router.post(
  '/refresh',
  [body('refreshToken').notEmpty()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const result = await authService.refreshToken(req.body.refreshToken);
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.session?.token) {
      await authService.logout(req.session.token);
    }
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Forgot password
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const result = await authService.forgotPassword(req.body.email);
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Reset password
router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const result = await authService.resetPassword(req.body.token, req.body.password);
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      data: req.user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;