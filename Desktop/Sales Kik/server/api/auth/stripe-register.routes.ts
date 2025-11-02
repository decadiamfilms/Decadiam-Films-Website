import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../index';

const router = Router();

// Enhanced registration with Stripe integration
router.post('/register', async (req, res) => {
  try {
    const {
      // Personal info
      email,
      password,
      firstName,
      lastName,
      phone,
      
      // Business info
      businessName,
      businessEmail,
      businessPhone,
      abn,
      industry,
      teamSize,
      
      // Billing address
      address,
      city,
      state,
      postcode,
      country,
      
      // Subscription info
      selectedPlan,
      stripeCustomerId,
      stripeSubscriptionId,
      subscriptionStatus,
      logoPreview
    } = req.body;

    console.log('🔄 Creating SalesKik account for:', email);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Account already exists with this email address'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create company record with comprehensive business info
    const company = await prisma.company.create({
      data: {
        name: businessName,
        email: businessEmail || email,
        phone: businessPhone || phone,
        address: {
          street: address,
          city: city,
          state: state,
          postcode: postcode,
          country: country || 'Australia'
        },
        logoUrl: logoPreview,
        subscriptionStatus: subscriptionStatus || 'TRIAL',
        selectedPlan: selectedPlan,
        stripeCustomerId: stripeCustomerId,
        stripeSubscriptionId: stripeSubscriptionId,
        trialEndsAt: subscriptionStatus === 'TRIAL' 
          ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
          : null,
      }
    });

    console.log('✅ Company created:', company.id);

    // Create user record
    const user = await prisma.user.create({
      data: {
        email,
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        passwordHash,
        role: 'ADMIN', // First user is always admin
        company_id: company.id,
      }
    });

    console.log('✅ User created:', user.id);

    // Create onboarding progress record
    await prisma.onboardingProgress.create({
      data: {
        company_id: company.id,
        current_step: 0,
        completed_steps: JSON.stringify([]),
        target_market: industry?.toUpperCase() || 'GENERAL',
        team_size: teamSize,
        selected_modules: JSON.stringify([]), // Will be populated later
        is_completed: true, // Mark as completed since they went through our new onboarding
        completed_at: new Date(),
      }
    });

    console.log('✅ Onboarding progress created');

    // Store additional onboarding data as company settings
    const settings = [
      { setting_key: 'industry', setting_value: industry },
      { setting_key: 'team_size', setting_value: teamSize },
      { setting_key: 'business_email', setting_value: businessEmail },
      { setting_key: 'business_phone', setting_value: businessPhone },
      { setting_key: 'abn', setting_value: abn },
      { setting_key: 'billing_address', setting_value: JSON.stringify({ address, city, state, postcode, country }) },
      { setting_key: 'owner_phone', setting_value: phone },
      { setting_key: 'onboarding_completed_at', setting_value: new Date().toISOString() },
      { setting_key: 'onboarding_version', setting_value: '2.0' },
      { setting_key: 'customer_type', setting_value: 'business' },
      { setting_key: 'setup_completed', setting_value: 'true' }
    ].filter(setting => setting.setting_value); // Only save non-empty values

    await prisma.companySetting.createMany({
      data: settings.map(setting => ({
        company_id: company.id,
        ...setting
      }))
    });

    console.log('✅ Company settings created');

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        company: {
          id: company.id,
          name: company.name,
          subscriptionStatus: company.subscriptionStatus,
          selectedPlan: company.selectedPlan,
        }
      },
      message: 'Account created successfully! Please log in to continue.'
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create account',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Start trial without payment
router.post('/start-trial', async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      businessName,
      industry,
      teamSize
    } = req.body;

    console.log('🔄 Creating trial account for:', email);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Account already exists with this email address'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create company record for trial
    const company = await prisma.company.create({
      data: {
        name: businessName,
        email: email,
        subscriptionStatus: 'TRIAL',
        selectedPlan: 'trial',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      }
    });

    // Create user record
    const user = await prisma.user.create({
      data: {
        email,
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        passwordHash,
        role: 'ADMIN',
        company_id: company.id,
      }
    });

    // Create onboarding progress
    await prisma.onboardingProgress.create({
      data: {
        company_id: company.id,
        current_step: 0,
        completed_steps: JSON.stringify([]),
        target_market: industry?.toUpperCase() || 'GENERAL',
        team_size: teamSize,
        is_completed: true,
        completed_at: new Date(),
      }
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        company: {
          id: company.id,
          name: company.name,
          subscriptionStatus: 'TRIAL',
          trialEndsAt: company.trialEndsAt,
        }
      },
      message: 'Trial account created successfully! Please log in to continue.'
    });

  } catch (error) {
    console.error('❌ Trial registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create trial account'
    });
  }
});

export default router;