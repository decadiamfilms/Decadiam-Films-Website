import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth.utils';
import { generateNewCompanyId, NewCompanyData, validateCompanyCreation } from '../utils/company.utils';

const prisma = new PrismaClient();

export class CompanyCreationService {
  /**
   * Create a new isolated company account during onboarding
   * This ensures each new customer gets their own separate data
   */
  async createNewCompany(companyData: NewCompanyData): Promise<{
    company: any;
    adminUser: any;
    accessToken: string;
    refreshToken: string;
  }> {
    // Validate input data
    const validation = validateCompanyCreation(companyData);
    if (!validation.isValid) {
      throw new Error(`Invalid company data: ${validation.errors.join(', ')}`);
    }

    // Generate unique company ID (NOT the hardcoded one)
    const newCompanyId = generateNewCompanyId();
    console.log('🏢 Creating new company with ID:', newCompanyId);

    try {
      // Start database transaction to ensure data integrity
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create new company record
        const company = await tx.company.create({
          data: {
            id: newCompanyId,
            name: companyData.name,
            email: companyData.email,
            phone: companyData.phone || null,
            address: companyData.address || null,
            selectedPlan: companyData.selectedPlan || 'STARTER',
            subscriptionStatus: 'TRIAL',
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
          }
        });

        // 2. Create admin user for this company
        const hashedPassword = await hashPassword(companyData.adminUser.password);
        const adminUser = await tx.user.create({
          data: {
            email: companyData.adminUser.email,
            name: `${companyData.adminUser.firstName} ${companyData.adminUser.lastName}`,
            firstName: companyData.adminUser.firstName,
            lastName: companyData.adminUser.lastName,
            passwordHash: hashedPassword,
            role: 'ADMIN',
            company_id: newCompanyId,
            isActive: true,
            emailVerified: false, // Would require email verification in production
          }
        });

        // 3. Create default company settings
        await tx.companySetting.createMany({
          data: [
            {
              company_id: newCompanyId,
              setting_key: 'onboarding_completed',
              setting_value: false
            },
            {
              company_id: newCompanyId,
              setting_key: 'setup_wizard_completed',
              setting_value: false
            },
            {
              company_id: newCompanyId,
              setting_key: 'company_logo',
              setting_value: null
            },
            {
              company_id: newCompanyId,
              setting_key: 'email_templates_configured',
              setting_value: false
            }
          ]
        });

        // 4. Create default user group for this company
        const defaultUserGroup = await tx.userGroup.create({
          data: {
            name: 'Default Employees',
            description: 'Default employee permissions',
            company_id: newCompanyId,
            permissions: {
              manageQuotes: { menuPage: true, addNew: true },
              manageOrders: { menuPage: true, addNew: true },
              manageInvoices: { menuPage: true, generate: true },
              manageCustomers: { menuPage: true, addNew: true },
              // No product management or purchase orders by default
              manageProducts: { viewProducts: false, addNew: false },
              managePurchase: { menuPageVisible: false, addNew: false }
            }
          }
        });

        // 5. Create onboarding progress record
        await tx.onboardingProgress.create({
          data: {
            company_id: newCompanyId,
            current_step: 0,
            completed_steps: {},
            setup_data: {}
          }
        });

        return { company, adminUser, defaultUserGroup };
      });

      // Generate tokens for the new admin user
      const tokenPayload = {
        userId: result.adminUser.id,
        email: result.adminUser.email,
        role: 'ADMIN',
        companyId: newCompanyId
      };

      // For demo purposes, create simple tokens
      const accessToken = `new-admin-${result.adminUser.id}-${Date.now()}`;
      const refreshToken = `new-refresh-${result.adminUser.id}-${Date.now()}`;

      console.log('✅ Successfully created new company:', {
        companyId: newCompanyId,
        companyName: companyData.name,
        adminEmail: companyData.adminUser.email
      });

      return {
        company: result.company,
        adminUser: {
          id: result.adminUser.id,
          email: result.adminUser.email,
          firstName: result.adminUser.firstName,
          lastName: result.adminUser.lastName,
          role: result.adminUser.role,
          companyId: newCompanyId
        },
        accessToken,
        refreshToken
      };

    } catch (error) {
      console.error('❌ Failed to create new company:', error);
      throw new Error('Failed to create company account');
    }
  }

  /**
   * Check if a company already exists with the given email
   */
  async companyExists(email: string): Promise<boolean> {
    const existingCompany = await prisma.company.findFirst({
      where: { email: email.toLowerCase() }
    });
    return !!existingCompany;
  }

  /**
   * Get company information by ID
   */
  async getCompanyById(companyId: string) {
    return await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        users: true,
        _count: {
          select: {
            customers: true,
            products: true,
            quotes: true,
            orders: true
          }
        }
      }
    });
  }
}

export const companyCreationService = new CompanyCreationService();