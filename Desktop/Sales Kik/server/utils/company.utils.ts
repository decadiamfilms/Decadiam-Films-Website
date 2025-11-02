import { AuthRequest } from '../middleware/auth.middleware';

// Your existing company ID - this will be preserved
export const MASTER_COMPANY_ID = '0e573687-3b53-498a-9e78-f198f16f8bcb';

/**
 * Safely extract company ID from authenticated request
 * Preserves existing data while enabling proper multi-tenancy
 */
export function getCompanyId(req: AuthRequest): string {
  // First priority: Use authenticated user's company ID
  if (req.user?.companyId) {
    console.log('✅ Using authenticated user company ID:', req.user.companyId);
    return req.user.companyId;
  }

  // Second priority: Check for demo/development mode with your company
  const authHeader = req.headers.authorization;
  if (authHeader?.includes('admin-token') || authHeader?.includes('employee-token')) {
    console.log('🔑 Demo mode detected, using master company ID');
    return MASTER_COMPANY_ID;
  }

  // Third priority: Check for employee session
  const employeeSession = req.headers['x-employee-session'];
  if (employeeSession) {
    try {
      const employee = JSON.parse(employeeSession as string);
      if (employee.companyId) {
        console.log('👥 Using employee company ID:', employee.companyId);
        return employee.companyId;
      }
    } catch (e) {
      console.log('❌ Error parsing employee session');
    }
  }

  // Fallback for development/testing (your existing data)
  console.log('⚠️ No company ID found, using master company for development');
  return MASTER_COMPANY_ID;
}

/**
 * Generate a new company ID for new customers
 */
export function generateNewCompanyId(): string {
  return `company-${Date.now()}-${Math.random().toString(36).substring(2)}`;
}

/**
 * Check if a company ID belongs to the master company (your data)
 */
export function isMasterCompany(companyId: string): boolean {
  return companyId === MASTER_COMPANY_ID;
}

/**
 * Validate that a user can access a specific company's data
 */
export function canAccessCompanyData(userCompanyId: string, requestedCompanyId: string): boolean {
  return userCompanyId === requestedCompanyId;
}

/**
 * Create a new company record during onboarding
 */
export interface NewCompanyData {
  name: string;
  email: string;
  phone?: string;
  address?: any;
  selectedPlan?: string;
  adminUser: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  };
}

export function validateCompanyCreation(data: NewCompanyData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name?.trim()) {
    errors.push('Company name is required');
  }

  if (!data.email?.trim()) {
    errors.push('Company email is required');
  }

  if (!data.adminUser.firstName?.trim()) {
    errors.push('Admin first name is required');
  }

  if (!data.adminUser.lastName?.trim()) {
    errors.push('Admin last name is required');
  }

  if (!data.adminUser.email?.trim()) {
    errors.push('Admin email is required');
  }

  if (!data.adminUser.password?.trim()) {
    errors.push('Admin password is required');
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(data.email)) {
    errors.push('Invalid company email format');
  }

  if (data.adminUser.email && !emailRegex.test(data.adminUser.email)) {
    errors.push('Invalid admin email format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}