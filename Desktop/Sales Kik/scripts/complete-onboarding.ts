import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function completeOnboarding() {
  try {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: 'adam@eccohardware.com.au' },
      include: { company: true }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    // Update the company's onboarding status to completed
    if (user.companyId) {
      await prisma.company.update({
        where: { id: user.companyId },
        data: {
          onboardingCompleted: true,
          setupWizardCompleted: true,
          onboardingStep: 5, // Set to final step
          // Also set some default values for a complete profile
          name: 'Ecco Hardware',
          industryType: 'Hardware & Construction',
          teamSize: 'SMALL_TEAM',
          targetMarket: 'SME',
          city: 'Sydney',
          state: 'NSW',
          postcode: '2000',
          country: 'Australia'
        }
      });

      console.log('✅ Onboarding marked as COMPLETED for adam@eccohardware.com.au');
      console.log('You can now:');
      console.log('- Skip the onboarding wizard');
      console.log('- Go directly to the dashboard');
      console.log('- Access all features immediately');
    } else {
      console.log('No company found for this user');
    }

  } catch (error) {
    console.error('Error completing onboarding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeOnboarding();