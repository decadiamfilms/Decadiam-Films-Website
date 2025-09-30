import { PrismaClient, TeamSize, TargetMarket } from '@prisma/client';

export class OnboardingService {
  constructor(private prisma: PrismaClient) {
    console.log('OnboardingService: Constructor called, prisma:', !!this.prisma);
  }

  async completeOnboarding(companyId: string, onboardingData: any) {
    const {
      // Business Profile
      businessName,
      tradingName,
      email,
      phone,
      website,
      abnAcn,
      gstEnabled,
      gstNumber,
      
      // Business Type
      industryType,
      teamSize,
      targetMarket,
      
      // Location
      address,
      city,
      state,
      postcode,
      
      // Payment Profiles
      paymentProfiles,
      
      // Selected Modules
      selectedModules
    } = onboardingData;

    try {
      // Use transaction to ensure all operations succeed together
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Update company profile with onboarding data
        const updatedCompany = await tx.company.update({
          where: { id: companyId },
          data: {
            name: businessName,
            tradingName: tradingName || null,
            email: email,
            phone: phone || null,
            website: website || null,
            abnAcn: abnAcn || null,
            gstEnabled: gstEnabled,
            gstNumber: gstEnabled ? gstNumber || null : null,
            
            // Business details
            industryType: industryType || null,
            teamSize: teamSize as TeamSize || null,
            targetMarket: targetMarket as TargetMarket,
            
            // Location
            city: city || null,
            state: state || null,
            postcode: postcode || null,
            country: 'Australia',
            address: address ? {
              street: address,
              city: city,
              state: state,
              postcode: postcode,
              country: 'Australia'
            } : undefined,
            
            // Mark onboarding as completed
            onboardingCompleted: true,
            setupWizardCompleted: true,
            onboardingStep: 5,
            updatedAt: new Date()
          }
        });

        // 2. Create primary location
        if (address && city && state && postcode) {
          await tx.location.create({
            data: {
              companyId: companyId,
              name: 'Primary Location',
              address: {
                street: address,
                city: city,
                state: state,
                postcode: postcode,
                country: 'Australia'
              },
              type: 'WAREHOUSE',
              isDefault: true,
              isActive: true
            }
          });
        }

        // 3. Create payment profiles
        if (paymentProfiles && paymentProfiles.length > 0) {
          for (const profile of paymentProfiles) {
            await tx.paymentProfile.create({
              data: {
                companyId: companyId,
                name: profile.name,
                terms: profile.terms,
                methods: profile.methods || [],
                notes: profile.notes || null,
                isDefault: profile.isDefault || false
              }
            });
          }
        }

        // 4. Enable selected modules with trials
        if (selectedModules && selectedModules.length > 0) {
          const availableModules = await tx.availableModule.findMany({
            where: {
              id: { in: selectedModules },
              targetMarket: targetMarket as TargetMarket
            }
          });

          for (const module of availableModules) {
            // Create trial subscription for each module
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 14); // 14-day trial

            await tx.moduleSubscription.create({
              data: {
                companyId: companyId,
                moduleId: module.id,
                status: 'TRIAL',
                trialEndsAt: trialEndDate,
                nextBillingDate: trialEndDate,
                monthlyAmount: module.monthlyPrice,
                enabledAt: new Date()
              }
            });
          }
        }

        return updatedCompany;
      });

      return {
        success: true,
        data: result,
        message: 'Onboarding completed successfully'
      };

    } catch (error) {
      console.error('Onboarding completion failed:', error);
      throw new Error('Failed to complete onboarding process');
    }
  }

  async getOnboardingStatus(companyId: string) {
    console.log('OnboardingService: Getting status for companyId:', companyId);
    console.log('OnboardingService: this.prisma available:', !!this.prisma);
    
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        onboardingCompleted: true,
        setupWizardCompleted: true,
        onboardingStep: true,
        targetMarket: true,
        name: true,
        email: true
      }
    });

    console.log('OnboardingService: Company found:', !!company);
    if (company) {
      console.log('OnboardingService: Company data:', company);
    }

    if (!company) {
      throw new Error('Company not found');
    }

    return {
      onboardingCompleted: company.onboardingCompleted,
      setupWizardCompleted: company.setupWizardCompleted,
      currentStep: company.onboardingStep,
      targetMarket: company.targetMarket,
      hasBasicInfo: !!(company.name && company.email)
    };
  }

  async updateOnboardingStep(companyId: string, step: number) {
    return await this.prisma.company.update({
      where: { id: companyId },
      data: {
        onboardingStep: step,
        updatedAt: new Date()
      }
    });
  }

  // Helper method to get recommended modules for a market
  async getRecommendedModules(targetMarket: TargetMarket) {
    return await this.prisma.availableModule.findMany({
      where: {
        targetMarket: targetMarket,
        isActive: true
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });
  }
}