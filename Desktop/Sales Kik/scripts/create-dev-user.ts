import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createDevUser() {
  console.log('Creating development user...');

  const email = 'adam@eccohardware.com.au';
  const password = 'password123'; // Simple dev password
  
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('User already exists. Updating password...');
      
      // Update password
      const passwordHash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email },
        data: { 
          passwordHash,
          isActive: true 
        }
      });
      
      console.log(`✅ Updated user: ${email}`);
      console.log(`Password: ${password}`);
      return;
    }

    // Create company first
    let company = await prisma.company.findFirst({
      where: { email }
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'Ecco Hardware',
          email: email,
          subscriptionStatus: 'ACTIVE',
          trialEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year trial
          onboardingCompleted: true,
          setupWizardCompleted: true
        }
      });
      console.log('✅ Created company: Ecco Hardware');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: 'Adam',
        lastName: 'Smith',
        companyId: company.id,
        isActive: true,
        emailVerified: true
      }
    });

    // Create admin user group
    const adminGroup = await prisma.userGroup.create({
      data: {
        companyId: company.id,
        name: 'Administrator',
        permissions: {
          quotes: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          orders: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          invoices: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          customers: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          products: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          inventory: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          jobs: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          reports: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          administration: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
        }
      }
    });

    // Add user to admin group
    await prisma.userGroupMembership.create({
      data: {
        userId: user.id,
        groupId: adminGroup.id
      }
    });

    console.log(`✅ Created user: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Company: ${company.name}`);
    console.log('User added to Administrator group');

  } catch (error) {
    console.error('❌ Error creating dev user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDevUser();