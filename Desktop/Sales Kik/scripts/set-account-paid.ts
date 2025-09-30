import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setAccountPaid() {
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

    // Update the company's subscription status to ACTIVE (paid)
    if (user.companyId) {
      await prisma.company.update({
        where: { id: user.companyId },
        data: {
          subscriptionStatus: 'ACTIVE',
          trialEndsAt: null, // Remove trial end date
          stripeCustomerId: 'cus_premium_adam' // Fake stripe ID to indicate paid
        }
      });

      // Update all module subscriptions to ACTIVE
      await prisma.moduleSubscription.updateMany({
        where: { companyId: user.companyId },
        data: {
          status: 'ACTIVE',
          trialEndsAt: null
        }
      });

      console.log('✅ Account updated to PAID status for adam@eccohardware.com.au');
      console.log('You now have:');
      console.log('- Active subscription (no trial limits)');
      console.log('- All modules activated');
      console.log('- No payment prompts');
    } else {
      console.log('No company found for this user');
    }

  } catch (error) {
    console.error('Error updating account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setAccountPaid();