import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Default employee permissions matching the EmployeeManagement component
const createDefaultEmployeePermissions = (): GroupPermissions => ({
  manageUsers: {
    menuPage: false,
    inviteUser: false,
    viewLogs: false,
    manageUserGroup: false,
  },
  manageCustomers: {
    menuPage: true,
    addNew: true,
    activateDeactivate: false,
    customerRoles: false,
    inviteCustomer: false,
    creditLimitView: true,
    creditLimitEdit: false,
    accountingTermsView: true,
    accountingTermsEdit: false,
    discounts: false,
  },
  manageSupplier: {
    menuPage: false,
    addNew: false,
    edit: false,
    delete: false,
    activateDeactivate: false,
  },
  manageManufacturers: {
    menuPage: false,
    addNew: false,
    edit: false,
    delete: false,
    activateDeactivate: false,
  },
  manageProducts: {
    addNew: false,           // Admin can enable this
    edit: false,             // Admin can enable this
    delete: false,           // Admin can enable this
    viewCostPrice: false,    // Admin can enable this
    viewNonRetailPrice: false, // Admin can enable this
    viewProducts: false,     // Admin can enable this - NO access by default
  },
  managePackages: {
    addNew: false,
    edit: false,
    delete: false,
    activateDeactivate: false,
  },
  manageProductSpecification: {
    menuPage: false,
    addNew: false,
    edit: false,
    delete: false,
  },
  pricingTemplate: {
    view: false,
    edit: false,
    create: false,
    delete: false,
  },
  customProcessPrice: {
    view: false,
    edit: false,
  },
  manageOrders: {
    menuPage: true,
    addNew: true,
    edit: true,
    delete: false,
    confirmOrder: false,
    viewStatusPage: true,
    acceptDeclineOrder: false,
    viewAllOrders: true,
  },
  manageQuotes: {
    menuPage: true,
    addNew: true,
    edit: true,
    delete: false,
    sendQuote: true,
    convertToOrder: true,
    acceptDeclineQuote: false,
    viewAllQuotes: true,
  },
  manageInvoices: {
    menuPage: true,
    generate: true,
    edit: false,
    delete: false,
    viewCostPrice: false,
    send: true,
    viewAllInvoices: true,
  },
  manageCustomText: {
    view: false,
    edit: false,
  },
  manageDelivery: {
    menuPage: false,
    managePick: false,
    addPick: false,
    editPick: false,
    deletePick: false,
    addPickTruck: false,
    editPickTruck: false,
    deletePickTruck: false,
    managePickSchedule: false,
    schedule: false,
    addTruck: false,
    editTruck: false,
    deleteTruck: false,
    manageDelivery: false,
    // New Delivery Management Features
    deliveryScheduling: false,
    routeOptimization: false,
    fleetManagement: false,
    driverManagement: false,
    deliveryTracking: false,
    customerNotifications: false,
  },
  manageInventory: {
    menuPageVisible: true,
    addNew: false,
    edit: false,
    delete: false,
    receiveStock: false,
    removeStock: false,
    adjustStock: false,
    cancelSupply: false,
  },
  managePurchase: {
    menuPageVisible: false, // Admin can enable this
    addNew: false,         // Admin can enable this
    edit: false,           // Admin can enable this
    delete: false,         // Admin can enable this
    confirmPurchase: false, // Admin can enable this
  },
  manageJobs: {
    manageTask: false,
    editTask: false,
    deleteTask: false,
    addJob: false,
    editJob: false,
    deleteJob: false,
    viewJob: false,
    editAllocation: false,
    taskAllocation: false,
    taskSubAllocation: false,
    jobTaskAllocation: false,
    jobTaskSubAllocation: false,
  },
  manageStock: {
    stockInvoice: false,
    addStockPrice: false,
    editStockPrice: false,
    randomStock: false,
  },
  modules: {
    glassGlobleModule: false,
    accessCustomGroup: false,
    manageProcessPricing: false,
    manageCustomText: false,
    manageGlassTemplate: false,
    managePricingTemplate: false,
    manageOrders: true,
    manageQuotes: true,
    manageInvoices: true,
    managePackages: false,
    manageStock: false,
    manageProcess: false,
    manageCustomProcess: false,
  },
  companyAdmin: {
    autoConfig: false,
    deliverySetting: false,
    companySetting: false,
    accessCompanies: false,
    exportCustom: false,
    exportData: false,
  },
  dashboardReports: {
    manageWarehouse: false,
    salesReport: true,
    invoiceReports: false,
    statusManagement: false,
  },
  logistic: {
    schedulePO: false,
    accessLogistic: false,
  },
  productTypes: {
    accessGlass: false,
    accessHardware: false,
    accessSuperset: false,
  },
});

interface GroupPermissions {
  manageUsers: {
    menuPage: boolean;
    inviteUser: boolean;
    viewLogs: boolean;
    manageUserGroup: boolean;
  };
  manageCustomers: {
    menuPage: boolean;
    addNew: boolean;
    activateDeactivate: boolean;
    customerRoles: boolean;
    inviteCustomer: boolean;
    creditLimitView: boolean;
    creditLimitEdit: boolean;
    accountingTermsView: boolean;
    accountingTermsEdit: boolean;
    discounts: boolean;
  };
  manageSupplier: {
    menuPage: boolean;
    addNew: boolean;
    edit: boolean;
    delete: boolean;
  };
  manageManufacturers: {
    menuPage: boolean;
    addNew: boolean;
    edit: boolean;
    delete: boolean;
  };
  manageProducts: {
    addNew: boolean;
    edit: boolean;
    delete: boolean;
    viewCostPrice: boolean;
    viewNonRetailPrice: boolean;
    viewProducts: boolean;
  };
  managePackages: {
    addNew: boolean;
    edit: boolean;
    delete: boolean;
  };
  manageProductSpecification: {
    menuPage: boolean;
    addNew: boolean;
    edit: boolean;
    delete: boolean;
    copy: boolean;
  };
  pricingTemplate: {
    menuPage: boolean;
    addNew: boolean;
    edit: boolean;
    delete: boolean;
    copy: boolean;
  };
  customProcessPrice: {
    menuPage: boolean;
    addNew: boolean;
    edit: boolean;
    delete: boolean;
    copy: boolean;
    viewCostPrice: boolean;
    viewNonRetailPrice: boolean;
  };
  manageOrders: {
    menuPage: boolean;
    addNew: boolean;
    edit: boolean;
    delete: boolean;
    negativeCustomText: boolean;
    changeIndividualPrices: boolean;
    viewPrices: boolean;
    superviseOrders: boolean;
    viewOrders: boolean;
    cancelOrder: boolean;
    creditInvoice: boolean;
  };
  manageQuotes: {
    menuPage: boolean;
    addNew: boolean;
    edit: boolean;
    delete: boolean;
    negativeCustomText: boolean;
    changeIndividualPrices: boolean;
    viewPrices: boolean;
    superviseQuotes: boolean;
  };
  manageInvoices: {
    menuPage: boolean;
    generate: boolean;
    newPrices: boolean;
    delete: boolean;
    negativeCustomText: boolean;
    changeIndividualPrices: boolean;
    markSupplied: boolean;
    draft: boolean;
    print: boolean;
    payInvoice: boolean;
    showPrices: boolean;
    approveDraftInvoice: boolean;
    refreshXeroToken: boolean;
  };
  manageCustomText: {
    menuPage: boolean;
    addNew: boolean;
    edit: boolean;
    delete: boolean;
  };
  manageDelivery: {
    menuPage: boolean;
    managePick: boolean;
    addPick: boolean;
    editPick: boolean;
    deletePick: boolean;
    addPickTruck: boolean;
    editPickTruck: boolean;
    deletePickTruck: boolean;
    managePickSchedule: boolean;
    schedule: boolean;
    addTruck: boolean;
    editTruck: boolean;
    deleteTruck: boolean;
    manageDelivery: boolean;
    // New Delivery Management Features
    deliveryScheduling: boolean;
    routeOptimization: boolean;
    fleetManagement: boolean;
    driverManagement: boolean;
    deliveryTracking: boolean;
    customerNotifications: boolean;
  };
  manageInventory: {
    menuPageVisible: boolean;
    addNew: boolean;
    edit: boolean;
    delete: boolean;
    receiveStock: boolean;
    removeStock: boolean;
    adjustStock: boolean;
    cancelSupply: boolean;
  };
  managePurchase: {
    menuPageVisible: boolean;
    addNew: boolean;
    edit: boolean;
    delete: boolean;
    confirmPurchase: boolean;
  };
  manageJobs: {
    manageTask: boolean;
    addTask: boolean;
    editTask: boolean;
    deleteTask: boolean;
    addJob: boolean;
    editJob: boolean;
    deleteJob: boolean;
    viewJob: boolean;
    editAllocation: boolean;
    taskAllocation: boolean;
    taskSubAllocation: boolean;
    jobTaskAllocation: boolean;
    jobTaskSubAllocation: boolean;
  };
  manageStock: {
    stockInvoice: boolean;
    addStockPrice: boolean;
    editStockPrice: boolean;
    randomStock: boolean;
  };
  modules: {
    glassGlobleModule: boolean;
    accessCustomGroup: boolean;
    manageProcessPricing: boolean;
    manageCustomText: boolean;
    manageGlassTemplate: boolean;
    managePricingTemplate: boolean;
    manageOrders: boolean;
    manageQuotes: boolean;
    manageInvoices: boolean;
    managePackages: boolean;
    manageStock: boolean;
    manageProcess: boolean;
    manageCustomProcess: boolean;
  };
  companyAdmin: {
    autoConfig: boolean;
    deliverySetting: boolean;
    companySetting: boolean;
    accessCompanies: boolean;
    exportCustom: boolean;
    exportData: boolean;
  };
  dashboardReports: {
    manageWarehouse: boolean;
    salesReport: boolean;
    invoiceReports: boolean;
    statusManagement: boolean;
  };
  logistic: {
    schedulePO: boolean;
    accessLogistic: boolean;
  };
  productTypes: {
    accessGlass: boolean;
    accessHardware: boolean;
    accessSuperset: boolean;
  };
}

interface PermissionContextType {
  permissions: GroupPermissions | null;
  hasPermission: (category: keyof GroupPermissions, permission: string) => boolean;
  hasAnyPermission: (category: keyof GroupPermissions, permissions: string[]) => boolean;
  canAccessMenu: (menuType: 'quotes' | 'orders' | 'invoices' | 'customers' | 'inventory' | 'purchase' | 'admin') => boolean;
  canPerformAction: (category: keyof GroupPermissions, action: string) => boolean;
  isAdmin: () => boolean;
  loadUserPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// Default admin permissions (for demo/fallback)
const createAdminPermissions = (): GroupPermissions => {
  return {
    manageUsers: {
      menuPage: true,
      inviteUser: true,
      viewLogs: true,
      manageUserGroup: true,
    },
    manageCustomers: {
      menuPage: true,
      addNew: true,
      activateDeactivate: true,
      customerRoles: true,
      inviteCustomer: true,
      creditLimitView: true,
      creditLimitEdit: true,
      accountingTermsView: true,
      accountingTermsEdit: true,
      discounts: true,
    },
    manageSupplier: {
      menuPage: true,
      addNew: true,
      edit: true,
      delete: true,
      activateDeactivate: true,
    },
    manageManufacturers: {
      menuPage: true,
      addNew: true,
      edit: true,
      delete: true,
      activateDeactivate: true,
    },
    manageProducts: {
      menuPage: true,
      addNew: true,
      viewCostPrice: true,
      editCostPrice: true,
      viewSalePrice: true,
      editSalePrice: true,
      bulkImport: true,
      bulkUpdate: true,
      bulkExport: true,
      manageCategories: true,
      activateDeactivate: true,
    },
    managePackages: {
      menuPage: true,
      addNew: true,
      edit: true,
      delete: true,
      activateDeactivate: true,
    },
    manageProductSpecification: {
      menuPage: true,
      addNew: true,
      edit: true,
      delete: true,
    },
    pricingTemplate: {
      view: true,
      edit: true,
      create: true,
      delete: true,
    },
    customProcessPrice: {
      view: true,
      edit: true,
    },
    manageOrders: {
      menuPage: true,
      addNew: true,
      edit: true,
      delete: true,
      confirmOrder: true,
      viewStatusPage: true,
      acceptDeclineOrder: true,
      viewAllOrders: true,
    },
    manageQuotes: {
      menuPage: true,
      addNew: true,
      edit: true,
      delete: true,
      sendQuote: true,
      convertToOrder: true,
      acceptDeclineQuote: true,
      viewAllQuotes: true,
    },
    manageInvoices: {
      menuPage: true,
      generate: true,
      edit: true,
      delete: true,
      viewCostPrice: true,
      send: true,
      viewAllInvoices: true,
    },
    manageCustomText: {
      view: true,
      edit: true,
    },
    manageDelivery: {
      menuPage: true,
      managePick: true,
      addPick: true,
      editPick: true,
      deletePick: true,
      addPickTruck: true,
      editPickTruck: true,
      deletePickTruck: true,
      managePickSchedule: true,
      schedule: true,
      addTruck: true,
      editTruck: true,
      deleteTruck: true,
      manageDelivery: true,
      // New Delivery Management Features (Admin gets full access)
      deliveryScheduling: true,
      routeOptimization: true,
      fleetManagement: true,
      driverManagement: true,
      deliveryTracking: true,
      customerNotifications: true,
    },
    manageInventory: {
      menuPageVisible: true,
      stockCheck: true,
      receiveStock: true,
      adjustStock: true,
      viewStockHistory: true,
      exportData: true,
      stocktakes: true,
    },
    managePurchase: {
      menuPageVisible: true,
      addNew: true,
      edit: true,
      delete: true,
      confirmPurchase: true,
    },
    manageJobs: {
      manageTask: true,
      editTask: true,
      deleteTask: true,
      addJob: true,
      editJob: true,
      deleteJob: true,
      viewJob: true,
      editAllocation: true,
      taskAllocation: true,
      taskSubAllocation: true,
      jobTaskAllocation: true,
      jobTaskSubAllocation: true,
    },
    manageStock: {
      stockInvoice: true,
      addStockPrice: true,
      editStockPrice: true,
      randomStock: true,
    },
    modules: {
      glassGlobleModule: true,
      accessCustomGroup: true,
      manageProcessPricing: true,
      manageCustomText: true,
      manageGlassTemplate: true,
      managePricingTemplate: true,
      manageOrders: true,
      manageQuotes: true,
      manageInvoices: true,
      managePackages: true,
      manageStock: true,
      manageProcess: true,
      manageCustomProcess: true,
    },
    companyAdmin: {
      autoConfig: true,
      deliverySetting: true,
      companySetting: true,
      accessCompanies: true,
      exportCustom: true,
      exportData: true,
    },
    dashboardReports: {
      manageWarehouse: true,
      salesReport: true,
      invoiceReports: true,
      statusManagement: true,
    },
    logistic: {
      schedulePO: true,
      accessLogistic: true,
    },
    productTypes: {
      accessGlass: true,
      accessHardware: true,
      accessSuperset: true,
    },
  };
};

export const PermissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<GroupPermissions | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const loadUserPermissions = async () => {
    try {
      // Get current user data from localStorage directly
      let userData = null;
      
      // Check for employee session first
      const employeeSession = localStorage.getItem('employee-session');
      if (employeeSession) {
        try {
          userData = JSON.parse(employeeSession);
          userData.isEmployee = true;
          console.log('Loading permissions for employee:', userData);
        } catch (e) {
          console.log('Error parsing employee session');
        }
      }
      
      // If no employee, check for admin user
      if (!userData) {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
          try {
            userData = JSON.parse(currentUser);
            userData.isEmployee = false;
            console.log('Loading permissions for admin:', userData);
          } catch (e) {
            console.log('Error parsing current user');
          }
        }
      }
      
      if (!userData) {
        console.log('No user data found, defaulting to admin permissions for demo');
        setPermissions(createAdminPermissions());
        setIsAdmin(true);
        return;
      }

      // Check if user is admin (multiple ways to detect)
      const isAdminUser = !userData.isEmployee && (
                         userData.role === 'ADMIN' || 
                         userData.role === 'OWNER' || 
                         userData.isOwner === true ||
                         userData.email === 'adambudai2806@gmail.com' ||
                         userData.email?.includes('admin') ||
                         window.location.href.includes('/admin'));
      
      console.log('Admin detection check:', {
        userRole: userData.role,
        isOwner: userData.isOwner,
        email: userData.email,
        urlContainsAdmin: window.location.href.includes('/admin'),
        finalIsAdmin: isAdminUser,
        fullUserData: userData
      });
      
      setIsAdmin(isAdminUser);
      
      if (isAdminUser) {
        console.log('User is admin, loading full permissions including purchase orders');
        const adminPerms = createAdminPermissions();
        console.log('Admin permissions created:', adminPerms.managePurchase);
        setPermissions(adminPerms);
      } else {
        console.log('User is employee, loading employee permissions');
        // Try to load employee permissions from localStorage - check both employee-session and saleskik-employees
        let currentEmployee = null;
        
        // First check employee-session (for logged in employee)
        const employeeSession = localStorage.getItem('employee-session');
        if (employeeSession) {
          try {
            currentEmployee = JSON.parse(employeeSession);
            console.log('Found employee from session:', currentEmployee);
          } catch (e) {
            console.log('Error parsing employee session');
          }
        }
        
        // If not found, check in saleskik-employees list
        if (!currentEmployee) {
          const employees = localStorage.getItem('saleskik-employees');
          if (employees && userData.email) {
            const employeeList = JSON.parse(employees);
            currentEmployee = employeeList.find((emp: any) => emp.email === userData.email);
            console.log('Found employee from list:', currentEmployee);
          }
        }
        
        if (currentEmployee?.permissions) {
          console.log('Loading employee permissions:', currentEmployee.permissions);
          setPermissions(currentEmployee.permissions);
        } else {
          console.log('No employee permissions found, using default employee permissions');
          setPermissions(createDefaultEmployeePermissions());
        }
      }
    } catch (error) {
      console.error('Failed to load user permissions:', error);
      // Fallback to admin permissions for demo
      setPermissions(createAdminPermissions());
      setIsAdmin(true);
    }
  };

  useEffect(() => {
    loadUserPermissions();
  }, []);

  const hasPermission = (category: keyof GroupPermissions, permission: string): boolean => {
    if (!permissions) return false;
    return (permissions[category] as any)?.[permission] === true;
  };

  const hasAnyPermission = (category: keyof GroupPermissions, permissionList: string[]): boolean => {
    return permissionList.some(perm => hasPermission(category, perm));
  };

  const canAccessMenu = (menuType: 'quotes' | 'orders' | 'invoices' | 'customers' | 'inventory' | 'purchase' | 'products' | 'logistics' | 'admin'): boolean => {
    if (!permissions) {
      console.log('canAccessMenu: No permissions loaded yet');
      return false;
    }
    
    // RBAC 2025 Best Practice: Admin hierarchy override
    // Admins should have access to all features automatically
    if (isAdmin) {
      console.log(`🔑 Admin override: ${menuType} access granted via admin role`);
      return true;
    }
    
    const result = (() => {
      switch (menuType) {
        case 'quotes': return permissions.manageQuotes.menuPage;
        case 'orders': return permissions.manageOrders.menuPage;
        case 'invoices': return permissions.manageInvoices.menuPage;
        case 'customers': return permissions.manageCustomers.menuPage;
        case 'inventory': return permissions.manageInventory.menuPageVisible;
        case 'purchase': return permissions.managePurchase.menuPageVisible;
        case 'products': return permissions.manageProducts.viewProducts;
        case 'logistics': return permissions.manageDelivery.menuPage;
        case 'admin': return permissions.companyAdmin.companySetting;
        default: return false;
      }
    })();
    
    if (menuType === 'purchase' || menuType === 'products') {
      console.log(`canAccessMenu check for ${menuType}:`, {
        menuType,
        permissions: menuType === 'purchase' ? permissions.managePurchase : permissions.manageProducts,
        result,
        isAdminState: isAdmin,
        userType: isAdmin ? 'ADMIN' : 'EMPLOYEE',
        permissionCheck: menuType === 'products' ? permissions.manageProducts?.viewProducts : permissions.managePurchase?.menuPageVisible
      });
    }
    
    return result;
  };

  const canPerformAction = (category: keyof GroupPermissions, action: string): boolean => {
    return hasPermission(category, action);
  };

  const checkIsAdmin = (): boolean => {
    return isAdmin;
  };

  const value: PermissionContextType = {
    permissions,
    hasPermission,
    hasAnyPermission,
    canAccessMenu,
    canPerformAction,
    isAdmin: checkIsAdmin,
    loadUserPermissions
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};