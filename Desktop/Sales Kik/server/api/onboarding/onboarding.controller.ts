import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { OnboardingService } from './onboarding.service';

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

export class OnboardingController {
  private onboardingService: OnboardingService;

  constructor() {
    const prisma = new PrismaClient();
    console.log('OnboardingController: Constructor called, creating new prisma instance');
    this.onboardingService = new OnboardingService(prisma);
  }

  completeOnboarding = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await this.onboardingService.completeOnboarding(
        companyId,
        req.body
      );

      res.json(result);
    } catch (error) {
      console.error('Onboarding completion error:', error);
      next(error);
    }
  };

  getOnboardingStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('OnboardingController: req.user:', req.user);
      const companyId = req.user?.companyId;
      console.log('OnboardingController: companyId:', companyId);
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const status = await this.onboardingService.getOnboardingStatus(companyId);
      res.json(status);
    } catch (error) {
      next(error);
    }
  };

  updateOnboardingStep = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { step } = req.body;
      if (!step || step < 0 || step > 5) {
        return res.status(400).json({ error: 'Invalid step number' });
      }

      const result = await this.onboardingService.updateOnboardingStep(
        companyId,
        step
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getRecommendedModules = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targetMarket } = req.query;
      
      if (!targetMarket || !['TRADIES', 'SME'].includes(targetMarket as string)) {
        return res.status(400).json({ error: 'Valid target market required' });
      }

      const modules = await this.onboardingService.getRecommendedModules(
        targetMarket as 'TRADIES' | 'SME'
      );

      // Transform the response to include parsed JSON fields
      const transformedModules = modules.map(module => ({
        ...module,
        features: typeof module.features === 'string' 
          ? JSON.parse(module.features) 
          : module.features,
        dependencies: typeof module.dependencies === 'string'
          ? JSON.parse(module.dependencies)
          : module.dependencies,
        screenshots: typeof module.screenshots === 'string'
          ? JSON.parse(module.screenshots)
          : module.screenshots
      }));

      res.json(transformedModules);
    } catch (error) {
      next(error);
    }
  };
}