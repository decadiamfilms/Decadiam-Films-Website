import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UpdateCompanyData {
  name?: string;
  legalName?: string;
  tradingName?: string;
  abnAcn?: string;
  gstNumber?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: any;
  gstEnabled?: boolean;
  logo?: string;
  logoUrl?: string;
  industry?: string;
  teamSize?: string;
}

export interface PaymentProfileData {
  name: string;
  terms: string;
  methods: string[];
  notes?: string;
  isDefault?: boolean;
}

export class CompanyService {
  async getCompany(company_id: string) {
    const company = await prisma.company.findUnique({
      where: { id: company_id },
      include: {
        settings: true,
        modules: true,
        _count: {
          select: {
            users: true,
            customers: true,
            products: true,
            quotes: true,
            orders: true,
            invoices: true,
          },
        },
      },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    return company;
  }

  async updateCompany(company_id: string, data: UpdateCompanyData) {
    const company = await prisma.company.update({
      where: { id: company_id },
      data,
    });

    return company;
  }

  async uploadLogo(company_id: string, logoUrl: string) {
    const company = await prisma.company.update({
      where: { id: company_id },
      data: { logoUrl },
    });

    return company;
  }

  async createPaymentProfile(company_id: string, data: PaymentProfileData) {
    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.companySetting.updateMany({
        where: { company_id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const profile = await prisma.companySetting.create({
      data: {
        ...data,
        company_id,
      },
    });

    return profile;
  }

  async updatePaymentProfile(profileId: string, company_id: string, data: Partial<PaymentProfileData>) {
    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.companySetting.updateMany({
        where: { company_id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const profile = await prisma.companySetting.update({
      where: { id: profileId },
      data,
    });

    return profile;
  }

  async deletePaymentProfile(profileId: string, company_id: string) {
    // Check if it's the only profile
    const count = await prisma.companySetting.count({
      where: { company_id },
    });

    if (count <= 1) {
      throw new Error('Cannot delete the last payment profile');
    }

    await prisma.companySetting.delete({
      where: { id: profileId },
    });

    return { success: true };
  }

  async getPaymentProfiles(company_id: string) {
    const profiles = await prisma.companySetting.findMany({
      where: { company_id },
      orderBy: { isDefault: 'desc' },
    });

    return profiles;
  }

  async enableModule(company_id: string, moduleId: string, userId: string) {
    const existingModule = await prisma.companyModule.findUnique({
      where: {
        company_id_moduleId: {
          company_id,
          moduleId,
        },
      },
    });

    if (existingModule) {
      if (existingModule.isActive) {
        throw new Error('Module is already enabled');
      } else {
        // Re-enable the module
        const module = await prisma.companyModule.update({
          where: { id: existingModule.id },
          data: { isActive: true },
        });
        return module;
      }
    }

    const module = await prisma.companyModule.create({
      data: {
        company_id,
        moduleId,
        enabledBy: userId,
        isActive: true,
      },
    });

    return module;
  }

  async disableModule(company_id: string, moduleId: string) {
    const module = await prisma.companyModule.update({
      where: {
        company_id_moduleId: {
          company_id,
          moduleId,
        },
      },
      data: { isActive: false },
    });

    return module;
  }

  async getEnabledModules(company_id: string) {
    const modules = await prisma.companyModule.findMany({
      where: { company_id, isActive: true },
    });

    return modules;
  }

  async getDashboardStats(company_id: string) {
    const [
      totalCustomers,
      totalProducts,
      activeQuotes,
      pendingOrders,
      unpaidInvoices,
      monthlyRevenue,
    ] = await Promise.all([
      prisma.customer.count({ where: { company_id, isActive: true } }),
      prisma.product.count({ where: { company_id, isActive: true } }),
      prisma.quote.count({ where: { company_id, status: { in: ['SENT', 'VIEWED'] } } }),
      prisma.order.count({ where: { company_id, status: { in: ['CONFIRMED', 'IN_PROGRESS'] } } }),
      prisma.invoice.count({ where: { company_id, status: { in: ['UNPAID', 'OVERDUE'] } } }),
      this.getMonthlyRevenue(company_id),
    ]);

    return {
      totalCustomers,
      totalProducts,
      activeQuotes,
      pendingOrders,
      unpaidInvoices,
      monthlyRevenue,
    };
  }

  private async getMonthlyRevenue(company_id: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const invoices = await prisma.invoice.findMany({
      where: {
        company_id,
        status: 'PAID',
        createdAt: { gte: startOfMonth },
      },
      select: { total: true },
    });

    const revenue = invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
    return revenue;
  }
}