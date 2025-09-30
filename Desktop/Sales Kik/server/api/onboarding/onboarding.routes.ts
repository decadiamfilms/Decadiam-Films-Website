import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { OnboardingController } from './onboarding.controller';
import { body } from 'express-validator';
import { validateRequest } from '../../middleware/validateRequest';

const router = Router();
const controller = new OnboardingController();

// All routes require authentication
router.use(authenticate);

// POST /api/onboarding/complete - Complete the onboarding process
router.post(
  '/complete',
  [
    // Basic validation for required fields
    body('businessName').notEmpty().trim().withMessage('Business name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('targetMarket').isIn(['TRADIES', 'SME']).withMessage('Valid target market is required'),
    body('industryType').notEmpty().trim().withMessage('Industry type is required'),
    body('teamSize').isIn(['SOLO', 'SMALL_TEAM', 'MEDIUM_TEAM', 'LARGE_TEAM']).withMessage('Valid team size is required'),
    body('address').notEmpty().trim().withMessage('Address is required'),
    body('city').notEmpty().trim().withMessage('City is required'),
    body('state').notEmpty().trim().withMessage('State is required'),
    body('postcode').isLength({ min: 4, max: 4 }).withMessage('Valid postcode is required'),
    body('paymentProfiles').isArray({ min: 1 }).withMessage('At least one payment profile is required'),
    body('selectedModules').isArray({ min: 1 }).withMessage('At least one module must be selected')
  ],
  validateRequest,
  controller.completeOnboarding
);

// GET /api/onboarding/status - Get current onboarding status
router.get('/status', controller.getOnboardingStatus);

// PUT /api/onboarding/step - Update current onboarding step
router.put(
  '/step',
  [
    body('step').isInt({ min: 0, max: 5 }).withMessage('Valid step number is required')
  ],
  validateRequest,
  controller.updateOnboardingStep
);

// GET /api/onboarding/modules - Get recommended modules for target market
router.get('/modules', controller.getRecommendedModules);

export default router;