import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../index';

// Extend Express Request with user property
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      companyId: string;
      email: string;
    };
  }
}

export class ModulesController {

  getAvailableModules = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { targetMarket = 'TRADIES' } = req.query;

      // Get company info
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          moduleSubscriptions: {
            include: { module: true }
          }
        }
      });

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      // Get available modules for the target market
      const availableModules = await prisma.availableModule.findMany({
        where: {
          OR: [
            { targetMarket: targetMarket as any },
            { targetMarket: 'BOTH' }
          ],
          isActive: true
        },
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' }
        ]
      });

      // Map with subscription status
      const modulesWithAccess = availableModules.map(module => {
        const subscription = company.moduleSubscriptions.find(sub => sub.moduleId === module.id);
        
        return {
          ...module,
          features: JSON.parse(module.features as any),
          dependencies: JSON.parse(module.dependencies as any),
          screenshots: JSON.parse(module.screenshots as any),
          userHasAccess: !!subscription && ['TRIAL', 'ACTIVE'].includes(subscription.status),
          subscriptionStatus: subscription?.status || 'NONE',
          trialDaysLeft: subscription?.trialEndsAt ? 
            Math.max(0, Math.ceil((subscription.trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) 
            : 0
        };
      });

      res.json(modulesWithAccess);
    } catch (error) {
      next(error);
    }
  };

  checkModuleAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { moduleId } = req.params;

      // Get company and subscription info
      const company = await prisma.company.findUnique({
        where: { id: companyId }
      });

      const subscription = await prisma.moduleSubscription.findUnique({
        where: {
          companyId_moduleId: {
            companyId,
            moduleId
          }
        },
        include: {
          module: true
        }
      });

      const hasAccess = subscription && ['TRIAL', 'ACTIVE'].includes(subscription.status);
      const isTrialActive = subscription?.status === 'TRIAL' && subscription.trialEndsAt && subscription.trialEndsAt > new Date();
      
      let trialDaysLeft = 0;
      if (isTrialActive && subscription.trialEndsAt) {
        trialDaysLeft = Math.max(0, Math.ceil((subscription.trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
      }

      const moduleFeatures = subscription?.module?.features ? JSON.parse(subscription.module.features as any) : [];

      res.json({
        hasAccess: !!hasAccess,
        isTrialActive: !!isTrialActive,
        trialDaysLeft,
        subscriptionStatus: subscription?.status || 'NONE',
        canUpgrade: !hasAccess,
        targetMarket: company?.targetMarket || 'TRADIES',
        moduleFeatures
      });
    } catch (error) {
      next(error);
    }
  };

  enableModule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { moduleId } = req.params;

      // Check if module exists
      const module = await prisma.availableModule.findUnique({
        where: { id: moduleId }
      });

      if (!module) {
        return res.status(404).json({ error: 'Module not found' });
      }

      // Check if already subscribed
      const existingSubscription = await prisma.moduleSubscription.findUnique({
        where: {
          companyId_moduleId: {
            companyId,
            moduleId
          }
        }
      });

      if (existingSubscription && ['TRIAL', 'ACTIVE'].includes(existingSubscription.status)) {
        return res.status(400).json({ error: 'Already subscribed to this module' });
      }

      // Create trial subscription (14 days)
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      const subscription = await prisma.moduleSubscription.upsert({
        where: {
          companyId_moduleId: {
            companyId,
            moduleId
          }
        },
        create: {
          companyId,
          moduleId,
          status: 'TRIAL',
          trialEndsAt: trialEndDate,
          nextBillingDate: trialEndDate,
          monthlyAmount: module.monthlyPrice
        },
        update: {
          status: 'TRIAL',
          trialEndsAt: trialEndDate,
          nextBillingDate: trialEndDate,
          enabledAt: new Date()
        }
      });

      res.json({ success: true, subscription });
    } catch (error) {
      next(error);
    }
  };

  cancelModule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { moduleId } = req.params;

      const subscription = await prisma.moduleSubscription.findUnique({
        where: {
          companyId_moduleId: {
            companyId,
            moduleId
          }
        }
      });

      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      // Update subscription status
      await prisma.moduleSubscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELLED',
          disabledAt: new Date()
        }
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  };

  getUserSubscriptions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const subscriptions = await prisma.moduleSubscription.findMany({
        where: { 
          companyId,
          status: { in: ['TRIAL', 'ACTIVE'] }
        },
        include: {
          module: true
        }
      });

      const totalMonthlyAmount = subscriptions.reduce((total, sub) => 
        total + parseFloat(sub.monthlyAmount.toString()), 0
      );

      res.json({
        subscriptions: subscriptions.map(sub => ({
          ...sub,
          module: {
            ...sub.module,
            features: JSON.parse(sub.module.features as any),
            dependencies: JSON.parse(sub.module.dependencies as any)
          }
        })),
        totalMonthlyAmount
      });
    } catch (error) {
      next(error);
    }
  };

  getSubscriptionStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { moduleId } = req.query;
      const companyId = req.user?.companyId;
      const userEmail = req.user?.email;

      if (!moduleId) {
        return res.status(400).json({ error: 'Module ID is required' });
      }

      // For development - always grant access to GLASS_INDUSTRY module
      if (moduleId === 'GLASS_INDUSTRY') {
        return res.status(200).json({
          isActive: true,
          isExpired: false,
          isTrialing: false,
          trialDaysRemaining: 0,
          status: 'ACTIVE',
          moduleId: 'GLASS_INDUSTRY',
          moduleName: 'Glass Industry Module',
          monthlyAmount: 35.00,
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          companyName: 'Ecco Hardware'
        });
      }

      // For development user, grant access to all modules
      if (userEmail === 'adam@eccohardware.com.au') {
        return res.status(200).json({
          isActive: true,
          isExpired: false,
          isTrialing: true,
          trialDaysRemaining: 30,
          status: 'TRIAL',
          moduleId: moduleId as string,
          moduleName: `${moduleId} Module`,
          monthlyAmount: 35.00,
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      // Check actual subscription in database
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const subscription = await prisma.moduleSubscription.findFirst({
        where: {
          companyId,
          moduleId: moduleId as string
        },
        include: {
          module: true
        }
      });

      if (!subscription) {
        return res.status(200).json({
          isActive: false,
          isExpired: true,
          isTrialing: false,
          trialDaysRemaining: 0,
          status: 'INACTIVE',
          moduleId: moduleId as string,
          moduleName: 'Unknown Module',
          monthlyAmount: 0,
          nextBillingDate: null
        });
      }

      const now = new Date();
      const isExpired = subscription.trialEndsAt ? subscription.trialEndsAt < now : false;
      const isTrialing = subscription.status === 'TRIAL';
      const trialDaysRemaining = subscription.trialEndsAt 
        ? Math.max(0, Math.ceil((subscription.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      res.json({
        isActive: subscription.status === 'ACTIVE' || (isTrialing && !isExpired),
        isExpired,
        isTrialing,
        trialDaysRemaining,
        status: subscription.status,
        moduleId: subscription.moduleId,
        moduleName: subscription.module?.name || 'Unknown Module',
        monthlyAmount: parseFloat(subscription.monthlyAmount.toString()),
        nextBillingDate: subscription.nextBillingDate?.toISOString()
      });
    } catch (error) {
      next(error);
    }
  };
}