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
}

export interface PaymentProfileData {
  name: string;
  terms: string;
  methods: string[];
  notes?: string;
  isDefault?: boolean;
}

export class CompanyService {
  async getCompany(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        paymentProfiles: true,
        enabledModules: true,
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

  async updateCompany(companyId: string, data: UpdateCompanyData) {
    const company = await prisma.company.update({
      where: { id: companyId },
      data,
    });

    return company;
  }

  async uploadLogo(companyId: string, logoUrl: string) {
    const company = await prisma.company.update({
      where: { id: companyId },
      data: { logoUrl },
    });

    return company;
  }

  async createPaymentProfile(companyId: string, data: PaymentProfileData) {
    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.paymentProfile.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const profile = await prisma.paymentProfile.create({
      data: {
        ...data,
        companyId,
      },
    });

    return profile;
  }

  async updatePaymentProfile(profileId: string, companyId: string, data: Partial<PaymentProfileData>) {
    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.paymentProfile.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const profile = await prisma.paymentProfile.update({
      where: { id: profileId },
      data,
    });

    return profile;
  }

  async deletePaymentProfile(profileId: string, companyId: string) {
    // Check if it's the only profile
    const count = await prisma.paymentProfile.count({
      where: { companyId },
    });

    if (count <= 1) {
      throw new Error('Cannot delete the last payment profile');
    }

    await prisma.paymentProfile.delete({
      where: { id: profileId },
    });

    return { success: true };
  }

  async getPaymentProfiles(companyId: string) {
    const profiles = await prisma.paymentProfile.findMany({
      where: { companyId },
      orderBy: { isDefault: 'desc' },
    });

    return profiles;
  }

  async enableModule(companyId: string, moduleId: string, userId: string) {
    const existingModule = await prisma.enabledModule.findUnique({
      where: {
        companyId_moduleId: {
          companyId,
          moduleId,
        },
      },
    });

    if (existingModule) {
      if (existingModule.isActive) {
        throw new Error('Module is already enabled');
      } else {
        // Re-enable the module
        const module = await prisma.enabledModule.update({
          where: { id: existingModule.id },
          data: { isActive: true },
        });
        return module;
      }
    }

    const module = await prisma.enabledModule.create({
      data: {
        companyId,
        moduleId,
        enabledBy: userId,
        isActive: true,
      },
    });

    return module;
  }

  async disableModule(companyId: string, moduleId: string) {
    const module = await prisma.enabledModule.update({
      where: {
        companyId_moduleId: {
          companyId,
          moduleId,
        },
      },
      data: { isActive: false },
    });

    return module;
  }

  async getEnabledModules(companyId: string) {
    const modules = await prisma.enabledModule.findMany({
      where: { companyId, isActive: true },
    });

    return modules;
  }

  async getDashboardStats(companyId: string) {
    const [
      totalCustomers,
      totalProducts,
      activeQuotes,
      pendingOrders,
      unpaidInvoices,
      monthlyRevenue,
    ] = await Promise.all([
      prisma.customer.count({ where: { companyId, isActive: true } }),
      prisma.product.count({ where: { companyId, isActive: true } }),
      prisma.quote.count({ where: { companyId, status: { in: ['SENT', 'VIEWED'] } } }),
      prisma.order.count({ where: { companyId, status: { in: ['CONFIRMED', 'IN_PROGRESS'] } } }),
      prisma.invoice.count({ where: { companyId, status: { in: ['UNPAID', 'OVERDUE'] } } }),
      this.getMonthlyRevenue(companyId),
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

  private async getMonthlyRevenue(companyId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        status: 'PAID',
        createdAt: { gte: startOfMonth },
      },
      select: { total: true },
    });

    const revenue = invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
    return revenue;
  }
}