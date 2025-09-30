import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetOnboarding() {
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

    // Reset the company's onboarding status
    if (user.companyId) {
      await prisma.company.update({
        where: { id: user.companyId },
        data: {
          onboardingCompleted: false,
          setupWizardCompleted: false,
          onboardingStep: 0
        }
      });
      console.log('✅ Onboarding has been reset for adam@eccohardware.com.au');
      console.log('You can now go through the onboarding process again.');
      console.log('Navigate to http://localhost:3000/dashboard and you will be redirected to onboarding.');
    } else {
      console.log('No company found for this user');
    }

  } catch (error) {
    console.error('Error resetting onboarding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetOnboarding();