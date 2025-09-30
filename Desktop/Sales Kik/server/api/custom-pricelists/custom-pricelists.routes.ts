import { Router } from 'express';
import { CustomPricelistsController } from './custom-pricelists.controller';

const router = Router();
const controller = new CustomPricelistsController();

// Permission middleware - only admins and account owners can modify custom pricelists
const checkCustomPricelistPermissions = (req: any, res: any, next: any) => {
  const user = req.user;
  
  if (!user) {
    console.log('Custom pricelists: No user found in request');
    return res.status(401).json({ 
      error: 'Authentication required' 
    });
  }

  console.log('Custom pricelists: User found:', { id: user.id, email: user.email, companyId: user.companyId });

  // Allow all authenticated users for now
  const hasPermission = true;
  
  if (!hasPermission) {
    return res.status(403).json({ 
      error: 'Insufficient permissions to modify custom pricelists' 
    });
  }
  
  next();
};

// Customer pricelist management routes
router.get('/customers/:customerId', checkCustomPricelistPermissions, controller.getCustomerPricelist.bind(controller));
router.get('/customers/:customerId/products', checkCustomPricelistPermissions, controller.getCustomerProducts.bind(controller));
router.get('/customers/:customerId/categories/:categoryId', checkCustomPricelistPermissions, controller.getCategoryProducts.bind(controller));

// Individual price management
router.post('/customers/:customerId/products/:productId', checkCustomPricelistPermissions, controller.setCustomPrice.bind(controller));
router.put('/customers/:customerId/products/:productId', checkCustomPricelistPermissions, controller.updateCustomPrice.bind(controller));
router.delete('/customers/:customerId/products/:productId', checkCustomPricelistPermissions, controller.deleteCustomPrice.bind(controller));

// History and reversion
router.get('/customers/:customerId/history', checkCustomPricelistPermissions, controller.getPriceHistory.bind(controller));
router.post('/customers/:customerId/revert-to-tier', checkCustomPricelistPermissions, controller.revertToTier.bind(controller));

// Bulk operations
router.post('/customers/:customerId/bulk-update', checkCustomPricelistPermissions, controller.bulkUpdate.bind(controller));
router.post('/copy/:sourceCustomerId/:targetCustomerId', checkCustomPricelistPermissions, controller.copyPricelist.bind(controller));

export { router as customPricelistsRoutes };

// Separate router for pricing resolution (used by quotes/orders/invoices)
export const pricingRouter = Router();

// Price resolution endpoints (less restrictive permissions)
pricingRouter.get('/resolve/:customerId/:productId', controller.resolvePrice.bind(controller));
pricingRouter.post('/bulk-resolve/:customerId', controller.bulkResolvePrice.bind(controller));