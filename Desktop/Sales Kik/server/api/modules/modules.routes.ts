import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { ModulesController } from './modules.controller';

const router = Router();
const controller = new ModulesController();

// All routes require authentication
router.use(authenticate);

// GET /api/modules - List available modules for user's market
router.get('/', controller.getAvailableModules);

// GET /api/modules/:moduleId/access - Check access to specific module
router.get('/:moduleId/access', controller.checkModuleAccess);

// POST /api/modules/:moduleId/enable - Enable a module (start trial or subscribe)
router.post('/:moduleId/enable', controller.enableModule);

// POST /api/modules/:moduleId/cancel - Cancel a module subscription
router.post('/:moduleId/cancel', controller.cancelModule);

// GET /api/modules/subscriptions - Get user's current subscriptions
router.get('/subscriptions', controller.getUserSubscriptions);

// GET /api/modules/subscription-status - Check specific module subscription status
router.get('/subscription-status', controller.getSubscriptionStatus);

export default router;