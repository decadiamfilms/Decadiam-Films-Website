import { useState, useEffect } from 'react';

interface UserPermissions {
  setup: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
  viewPricing: boolean;
  editPricing: boolean;
  manageUsers: boolean;
  systemSettings: boolean;
  viewReports: boolean;
  bulkOperations: boolean;
}

type UserRole = 'admin' | 'manager' | 'employee';

const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    setup: true,
    create: true,
    edit: true,
    delete: true,
    approve: true,
    export: true,
    viewPricing: true,
    editPricing: true,
    manageUsers: true,
    systemSettings: true,
    viewReports: true,
    bulkOperations: true
  },
  manager: {
    setup: false,
    create: true,
    edit: true,
    delete: true,
    approve: true,
    export: true,
    viewPricing: true,
    editPricing: true,
    manageUsers: false,
    systemSettings: false,
    viewReports: true,
    bulkOperations: true
  },
  employee: {
    setup: false,
    create: true,
    edit: true,
    delete: false,
    approve: false,
    export: false,
    viewPricing: true,
    editPricing: false,
    manageUsers: false,
    systemSettings: false,
    viewReports: false,
    bulkOperations: false
  }
};

export function usePermissions() {
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [permissions, setPermissions] = useState<UserPermissions>(ROLE_PERMISSIONS.admin);

  useEffect(() => {
    // In production, fetch user role from API
    const fetchUserRole = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const userData = await response.json();
            const role = userData.role || 'admin'; // Default to admin for demo
            setUserRole(role);
            setPermissions(ROLE_PERMISSIONS[role]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user permissions:', error);
        // Default to admin for demo
        setUserRole('admin');
        setPermissions(ROLE_PERMISSIONS.admin);
      }
    };

    fetchUserRole();
  }, []);

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    return permissions[permission] || false;
  };

  const canAccessPage = (page: string): boolean => {
    switch (page) {
      case 'employees':
      case 'settings':
        return hasPermission('manageUsers') || hasPermission('systemSettings');
      case 'reports':
        return hasPermission('viewReports');
      default:
        return true; // Basic pages accessible to all
    }
  };

  return {
    permissions,
    userRole,
    hasPermission,
    canAccessPage
  };
}