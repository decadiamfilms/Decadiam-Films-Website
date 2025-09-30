import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function grantGlassAccess() {
  console.log('Granting Glass Industry Module access to development user...');

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'adam@eccohardware.com.au' },
      include: { company: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`✅ Found user: ${user.email} (Company: ${user.company.name})`);

    // Create or find the Glass Industry module
    const glassModule = await prisma.availableModule.upsert({
      where: { id: 'GLASS_INDUSTRY' },
      update: {},
      create: {
        id: 'GLASS_INDUSTRY',
        name: 'Glass Industry Module',
        description: 'Professional glass quoting with real-time pricing, processing options, and customer-specific rates',
        category: 'INDUSTRY_SPECIFIC',
        monthlyPrice: 35.00,
        setupFee: 0,
        targetMarket: 'TRADIES',
        features: [
          'Real-time glass pricing',
          'Customer-specific price tiers',
          'Processing options (edgework, corners, holes)',
          'Template system for common configurations',
          'Professional quote output',
          'Photo upload support'
        ],
        dependencies: [],
        isPopular: true,
        screenshots: [],
        isActive: true,
        sortOrder: 1
      }
    });

    console.log(`✅ Glass Industry Module ready: ${glassModule.name}`);

    // Create active subscription
    const subscription = await prisma.moduleSubscription.upsert({
      where: {
        companyId_moduleId: {
          companyId: user.companyId,
          moduleId: glassModule.id
        }
      },
      update: {
        status: 'ACTIVE',
        enabledAt: new Date(),
        disabledAt: null,
        trialEndsAt: null,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        monthlyAmount: 35.00,
        usageCharges: 0
      },
      create: {
        companyId: user.companyId,
        moduleId: glassModule.id,
        status: 'ACTIVE',
        enabledAt: new Date(),
        trialEndsAt: null,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        monthlyAmount: 35.00,
        usageCharges: 0
      }
    });

    console.log(`✅ Active subscription created for Glass Industry Module`);
    console.log(`Company: ${user.company.name}`);
    console.log(`User: ${user.email}`);
    console.log(`Status: ${subscription.status}`);
    console.log(`Monthly: $${subscription.monthlyAmount}`);
    console.log('');
    console.log('🪟 Glass Industry Module access granted successfully!');

  } catch (error) {
    console.error('❌ Error granting glass access:', error);
  } finally {
    await prisma.$disconnect();
  }
}

grantGlassAccess();