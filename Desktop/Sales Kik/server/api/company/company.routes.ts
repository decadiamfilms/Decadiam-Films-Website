import { Router, Response } from 'express';
import { CompanyService } from '../../services/company.service';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validateRequest';
import { body, param } from 'express-validator';

const router = Router();
const companyService = new CompanyService();

// All routes require authentication
router.use(authenticate);

// Get company details
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const company = await companyService.getCompany(req.user!.companyId);
    res.json({
      success: true,
      data: company,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// Update company details
router.put(
  '/',
  authorize(['administration.edit']),
  [
    body('name').optional().trim().notEmpty(),
    body('legalName').optional().trim(),
    body('tradingName').optional().trim(),
    body('abnAcn').optional().trim(),
    body('gstNumber').optional().trim(),
    body('email').optional().isEmail(),
    body('phone').optional().trim(),
    body('website').optional().isURL(),
    body('gstEnabled').optional().isBoolean(),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const company = await companyService.updateCompany(req.user!.companyId, req.body);
      res.json({
        success: true,
        data: company,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get dashboard stats
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await companyService.getDashboardStats(req.user!.companyId);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Payment Profiles
router.get('/payment-profiles', async (req: AuthRequest, res: Response) => {
  try {
    const profiles = await companyService.getPaymentProfiles(req.user!.companyId);
    res.json({
      success: true,
      data: profiles,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post(
  '/payment-profiles',
  authorize(['administration.create']),
  [
    body('name').trim().notEmpty(),
    body('terms').trim().notEmpty(),
    body('methods').isArray().notEmpty(),
    body('notes').optional().trim(),
    body('isDefault').optional().isBoolean(),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const profile = await companyService.createPaymentProfile(req.user!.companyId, req.body);
      res.status(201).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

router.put(
  '/payment-profiles/:id',
  authorize(['administration.edit']),
  [
    param('id').isUUID(),
    body('name').optional().trim().notEmpty(),
    body('terms').optional().trim().notEmpty(),
    body('methods').optional().isArray(),
    body('notes').optional().trim(),
    body('isDefault').optional().isBoolean(),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const profile = await companyService.updatePaymentProfile(
        req.params.id,
        req.user!.companyId,
        req.body
      );
      res.json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

router.delete(
  '/payment-profiles/:id',
  authorize(['administration.delete']),
  [param('id').isUUID()],
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      await companyService.deletePaymentProfile(req.params.id, req.user!.companyId);
      res.json({
        success: true,
        message: 'Payment profile deleted successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Module Management
router.get('/modules', async (req: AuthRequest, res: Response) => {
  try {
    const modules = await companyService.getEnabledModules(req.user!.companyId);
    res.json({
      success: true,
      data: modules,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post(
  '/modules/:moduleId/enable',
  authorize(['administration.create']),
  [param('moduleId').trim().notEmpty()],
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const module = await companyService.enableModule(
        req.user!.companyId,
        req.params.moduleId,
        req.user!.id
      );
      res.json({
        success: true,
        data: module,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

router.post(
  '/modules/:moduleId/disable',
  authorize(['administration.delete']),
  [param('moduleId').trim().notEmpty()],
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const module = await companyService.disableModule(req.user!.companyId, req.params.moduleId);
      res.json({
        success: true,
        data: module,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

export default router;