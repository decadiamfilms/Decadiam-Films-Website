import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../layout/UniversalNavigation';
import UniversalHeader from '../layout/UniversalHeader';
import { 
  PlusIcon, UserIcon, PencilIcon, TrashIcon, EyeIcon,
  CheckIcon, XMarkIcon, ShieldCheckIcon, KeyIcon, CubeIcon,
  EnvelopeIcon, PhoneIcon, CalendarIcon, ClockIcon,
  UserCircleIcon, CogIcon, EyeSlashIcon
} from '@heroicons/react/24/outline';

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

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string; // In production, this would be hashed
  phone: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'SUPERVISOR';
  department: string;
  position: string;
  hireDate: string;
  isActive: boolean;
  lastLogin?: Date;
  permissions: GroupPermissions;
  workSchedule: {
    startTime: string;
    endTime: string;
    daysOfWeek: string[];
  };
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  // Driver capabilities
  isDriver?: boolean;
  driverInfo?: {
    licenseNumber: string;
    licenseClass: string;
    licenseExpiry: string;
    driverPhone: string;
    driverStatus: 'AVAILABLE' | 'ON_DELIVERY' | 'OFF_DUTY' | 'UNAVAILABLE';
  };
  // Delivery assignments
  upcomingDeliveries?: Array<{
    id: string;
    runNumber: string;
    date: string;
    time: string;
    stops: number;
    customers: string[];
    vehicle: string;
  }>;
}

// Default permissions for new employees
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
    inviteCustomer: true,
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
  },
  manageManufacturers: {
    menuPage: false,
    addNew: false,
    edit: false,
    delete: false,
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
  },
  manageProductSpecification: {
    menuPage: false,
    addNew: false,
    edit: false,
    delete: false,
    copy: false,
  },
  pricingTemplate: {
    menuPage: false,
    addNew: false,
    edit: false,
    delete: false,
    copy: false,
  },
  customProcessPrice: {
    menuPage: false,
    addNew: false,
    edit: false,
    delete: false,
    copy: false,
    viewCostPrice: false,
    viewNonRetailPrice: true,
  },
  manageOrders: {
    menuPage: true,
    addNew: true,
    edit: true,
    delete: false,
    negativeCustomText: false,
    changeIndividualPrices: false,
    viewPrices: true,
    superviseOrders: false,
    viewOrders: true,
    cancelOrder: false,
    creditInvoice: false,
  },
  manageQuotes: {
    menuPage: true,
    addNew: true,
    edit: true,
    delete: false,
    negativeCustomText: false,
    changeIndividualPrices: false,
    viewPrices: true,
    superviseQuotes: false,
  },
  manageInvoices: {
    menuPage: true,
    generate: true,
    newPrices: false,
    delete: false,
    negativeCustomText: false,
    changeIndividualPrices: false,
    markSupplied: true,
    draft: true,
    print: true,
    payInvoice: false,
    showPrices: true,
    approveDraftInvoice: false,
    refreshXeroToken: false,
  },
  manageCustomText: {
    menuPage: false,
    addNew: false,
    edit: false,
    delete: false,
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
    addTask: false,
    editTask: false,
    deleteTask: false,
    addJob: false,
    editJob: false,
    deleteJob: false,
    viewJob: true,
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
    invoiceReports: true,
    statusManagement: false,
  },
  logistic: {
    schedulePO: false,
    accessLogistic: false,
  },
  productTypes: {
    accessGlass: true,
    accessHardware: true,
    accessSuperset: true,
  },
});

// Migrate old permission structure to new structure
const migratePermissions = (oldPermissions: any): GroupPermissions => {
  // If it's already the new structure, return as-is
  if (oldPermissions?.manageQuotes?.menuPage !== undefined) {
    return oldPermissions;
  }

  // If it's the old structure, migrate it
  if (oldPermissions?.canCreateQuotes !== undefined) {
    const newPerms = createDefaultEmployeePermissions();
    
    // Map old permissions to new structure
    newPerms.manageQuotes.addNew = oldPermissions.canCreateQuotes || false;
    newPerms.manageQuotes.menuPage = oldPermissions.canCreateQuotes || false;
    newPerms.manageProducts.viewCostPrice = oldPermissions.canViewPricing || false;
    newPerms.manageInventory.menuPageVisible = oldPermissions.canAccessInventory || false;
    newPerms.dashboardReports.salesReport = oldPermissions.canViewReports || false;
    newPerms.manageCustomers.addNew = oldPermissions.canManageCustomers || false;
    newPerms.manageCustomers.menuPage = oldPermissions.canManageCustomers || false;
    
    return newPerms;
  }

  // Fallback to default permissions
  return createDefaultEmployeePermissions();
};

export default function EmployeeManagement() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordFor, setShowPasswordFor] = useState<string | null>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const savedEmployees = localStorage.getItem('saleskik-employees');
      if (savedEmployees) {
        setEmployees(JSON.parse(savedEmployees));
      } else {
        // Create sample employees
        const sampleEmployees: Employee[] = [
          {
            id: '1',
            firstName: 'Sarah',
            lastName: 'Johnson',
            email: 'sarah@company.com',
            password: 'employee123', // In production, would be hashed
            phone: '+61 2 1234 5678',
            role: 'MANAGER',
            department: 'Sales',
            position: 'Sales Manager',
            hireDate: '2023-01-15',
            isActive: true,
            lastLogin: new Date(),
            permissions: createDefaultEmployeePermissions(),
            workSchedule: {
              startTime: '08:00',
              endTime: '17:00',
              daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
            },
            notes: 'Experienced sales manager with strong customer relationships',
            createdAt: new Date('2023-01-15'),
            updatedAt: new Date()
          },
          {
            id: '2',
            firstName: 'Mike',
            lastName: 'Chen',
            email: 'mike@company.com',
            password: 'employee456',
            phone: '+61 2 8765 4321',
            role: 'EMPLOYEE',
            department: 'Sales',
            position: 'Sales Representative',
            hireDate: '2023-06-20',
            isActive: true,
            permissions: createDefaultEmployeePermissions(),
            workSchedule: {
              startTime: '09:00',
              endTime: '18:00',
              daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
            },
            notes: 'New hire, showing good progress in sales',
            createdAt: new Date('2023-06-20'),
            updatedAt: new Date()
          }
        ];
        setEmployees(sampleEmployees);
        localStorage.setItem('saleskik-employees', JSON.stringify(sampleEmployees));
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveEmployees = (updatedEmployees: Employee[]) => {
    setEmployees(updatedEmployees);
    localStorage.setItem('saleskik-employees', JSON.stringify(updatedEmployees));
  };

  const deleteEmployee = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (employee && confirm(`Delete ${employee.firstName} ${employee.lastName}? This cannot be undone.`)) {
      const updatedEmployees = employees.filter(e => e.id !== employeeId);
      saveEmployees(updatedEmployees);
    }
  };

  const toggleEmployeeStatus = (employeeId: string) => {
    const updatedEmployees = employees.map(employee => 
      employee.id === employeeId 
        ? { ...employee, isActive: !employee.isActive }
        : employee
    );
    saveEmployees(updatedEmployees);
  };

  const resetPassword = (employeeId: string) => {
    const newPassword = Math.random().toString(36).slice(-8);
    const updatedEmployees = employees.map(employee => 
      employee.id === employeeId 
        ? { ...employee, password: newPassword, updatedAt: new Date() }
        : employee
    );
    saveEmployees(updatedEmployees);
    alert(`Password reset for employee. New password: ${newPassword}`);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'MANAGER': return 'bg-blue-100 text-blue-800';
      case 'SUPERVISOR': return 'bg-purple-100 text-purple-800';
      case 'EMPLOYEE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-8">Loading employees...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="employees" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="Employee Management"
        subtitle="Manage team members, accounts, and permissions"
        onMenuToggle={() => setShowSidebar(true)}
        actions={
          <div className="flex items-center gap-3">
            <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">
              ADMIN ONLY
            </span>
            <button
              onClick={() => {
                setEditingEmployee(null);
                setShowEmployeeForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Employee
            </button>
          </div>
        }
        summaryCards={
          <>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Employees</p>
                  <p className="text-2xl font-bold text-blue-900">{employees.length}</p>
                </div>
                <UserIcon className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Active Employees</p>
                  <p className="text-2xl font-bold text-green-900">{employees.filter(e => e.isActive).length}</p>
                </div>
                <CheckIcon className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Managers</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {employees.filter(e => e.role === 'MANAGER').length}
                  </p>
                </div>
                <ShieldCheckIcon className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Departments</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {[...new Set(employees.map(e => e.department))].length}
                  </p>
                </div>
                <CogIcon className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </>
        }
      />

      <div className="p-8 max-w-7xl mx-auto">
        {/* Employee Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => (
            <div key={employee.id} className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow ${
              !employee.isActive ? 'opacity-60' : ''
            }`}>
              {/* Employee Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-600">
                      {employee.firstName[0]}{employee.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </h4>
                    <p className="text-sm text-gray-600">{employee.position}</p>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingEmployee(employee);
                      setShowEmployeeForm(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit employee"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteEmployee(employee.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete employee"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Employee Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <EnvelopeIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <PhoneIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">{employee.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">Hired: {employee.hireDate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ClockIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">
                    {employee.workSchedule.startTime} - {employee.workSchedule.endTime}
                  </span>
                </div>
              </div>

              {/* Role & Status */}
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(employee.role)}`}>
                  {employee.role}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  employee.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {employee.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Permissions Summary */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Permissions</h5>
                <div className="flex flex-wrap gap-1">
                  {employee.permissions.manageQuotes?.addNew && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Quotes</span>
                  )}
                  {employee.permissions.manageOrders?.addNew && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Orders</span>
                  )}
                  {employee.permissions.manageInvoices?.generate && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Invoices</span>
                  )}
                  {employee.permissions.manageProducts?.viewProducts && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Products</span>
                  )}
                  {employee.permissions.managePurchase?.menuPageVisible && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Purchase Orders</span>
                  )}
                  {employee.permissions.companyAdmin?.companySetting && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Admin</span>
                  )}
                </div>
              </div>

              {/* Login Credentials */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Login Credentials</p>
                    <p className="text-xs text-gray-600">Email: {employee.email}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-600">
                        Password: {showPasswordFor === employee.id ? employee.password : '••••••••'}
                      </p>
                      <button
                        onClick={() => setShowPasswordFor(showPasswordFor === employee.id ? null : employee.id)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswordFor === employee.id ? (
                          <EyeSlashIcon className="w-3 h-3" />
                        ) : (
                          <EyeIcon className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => resetPassword(employee.id)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => toggleEmployeeStatus(employee.id)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    employee.isActive 
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {employee.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => {
                    // Simulate employee login view
                    localStorage.setItem('employee-preview', JSON.stringify(employee));
                    window.open('/employee-dashboard', '_blank');
                  }}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                  title="Preview employee dashboard"
                >
                  Preview
                </button>
              </div>
            </div>
          ))}

          {/* Add Employee Card */}
          <div 
            onClick={() => {
              setEditingEmployee(null);
              setShowEmployeeForm(true);
            }}
            className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer flex items-center justify-center"
          >
            <div className="text-center">
              <PlusIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-900 mb-2">Add Employee</h4>
              <p className="text-sm text-gray-600">Create a new employee account with login credentials</p>
            </div>
          </div>
        </div>

        {/* Employee Statistics */}
        <div className="mt-12 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Employee Overview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* By Role */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">By Role</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Managers</span>
                  <span className="font-medium text-blue-600">
                    {employees.filter(e => e.role === 'MANAGER').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Supervisors</span>
                  <span className="font-medium text-purple-600">
                    {employees.filter(e => e.role === 'SUPERVISOR').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Employees</span>
                  <span className="font-medium text-green-600">
                    {employees.filter(e => e.role === 'EMPLOYEE').length}
                  </span>
                </div>
              </div>
            </div>

            {/* By Department */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">By Department</h4>
              <div className="space-y-3">
                {[...new Set(employees.map(e => e.department))].map(dept => (
                  <div key={dept} className="flex justify-between">
                    <span className="text-sm text-gray-600">{dept}</span>
                    <span className="font-medium text-gray-900">
                      {employees.filter(e => e.department === dept).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Recent Activity</h4>
              <div className="space-y-3">
                {employees
                  .filter(e => e.lastLogin)
                  .sort((a, b) => new Date(b.lastLogin!).getTime() - new Date(a.lastLogin!).getTime())
                  .slice(0, 3)
                  .map(employee => (
                    <div key={employee.id} className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {employee.firstName[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{employee.firstName}</p>
                        <p className="text-xs text-gray-500">
                          {employee.lastLogin ? new Date(employee.lastLogin).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Form Modal */}
      {showEmployeeForm && (
        <EmployeeForm
          employee={editingEmployee}
          onSave={(employee) => {
            if (editingEmployee) {
              // Update existing
              const updatedEmployees = employees.map(e => 
                e.id === editingEmployee.id 
                  ? { ...employee, id: editingEmployee.id, createdAt: editingEmployee.createdAt, updatedAt: new Date() }
                  : e
              );
              saveEmployees(updatedEmployees);
            } else {
              // Create new
              const newEmployee = {
                ...employee,
                id: Date.now().toString(),
                createdAt: new Date(),
                updatedAt: new Date()
              };
              saveEmployees([...employees, newEmployee]);
            }
            setShowEmployeeForm(false);
            setEditingEmployee(null);
          }}
          onCancel={() => {
            setShowEmployeeForm(false);
            setEditingEmployee(null);
          }}
        />
      )}
    </div>
  );
}

// Employee Form Component
function EmployeeForm({ employee, onSave, onCancel }: {
  employee: Employee | null;
  onSave: (employee: Partial<Employee>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    firstName: employee?.firstName || '',
    lastName: employee?.lastName || '',
    email: employee?.email || '',
    password: employee?.password || Math.random().toString(36).slice(-8),
    phone: employee?.phone || '',
    role: employee?.role || 'EMPLOYEE' as Employee['role'],
    department: employee?.department || 'Sales',
    position: employee?.position || '',
    hireDate: employee?.hireDate || new Date().toISOString().split('T')[0],
    isActive: employee?.isActive ?? true,
    permissions: migratePermissions(employee?.permissions),
    workSchedule: employee?.workSchedule || {
      startTime: '09:00',
      endTime: '17:00',
      daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    notes: employee?.notes || ''
  });

  const handleSave = () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      alert('Please fill in required fields: First Name, Last Name, and Email');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white bg-opacity-95">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {employee ? 'Edit Employee' : 'Add Employee'}
                </h3>
                <p className="text-gray-600 mt-1">Create employee account with login credentials</p>
              </div>
              <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Basic Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">👤 Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address * (Login)</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="john.smith@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="+61 2 1234 5678"
                    />
                  </div>
                </div>
              </div>

              {/* Login Credentials */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">🔐 Login Credentials</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                        placeholder="Auto-generated password"
                      />
                      <button
                        onClick={() => setFormData(prev => ({ 
                          ...prev, 
                          password: Math.random().toString(36).slice(-8) 
                        }))}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as Employee['role'] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="SUPERVISOR">Supervisor</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Job Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">💼 Job Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Sales">Sales</option>
                      <option value="Production">Production</option>
                      <option value="Installation">Installation</option>
                      <option value="Administration">Administration</option>
                      <option value="Customer Service">Customer Service</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Sales Representative"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hire Date</label>
                    <input
                      type="date"
                      value={formData.hireDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, hireDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">🔒 System Permissions</h4>
                <div className="space-y-6">
                  {/* Core Business Operations */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <ShieldCheckIcon className="w-5 h-5" />
                      Core Business Operations
                    </h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.permissions.manageQuotes.menuPage}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              permissions: { 
                                ...prev.permissions, 
                                manageQuotes: { ...prev.permissions.manageQuotes, menuPage: e.target.checked }
                              }
                            }))}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">Access Quotes Menu</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.permissions.manageQuotes.addNew}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              permissions: { 
                                ...prev.permissions, 
                                manageQuotes: { ...prev.permissions.manageQuotes, addNew: e.target.checked }
                              }
                            }))}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">Create Quotes</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.permissions.manageOrders.menuPage}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              permissions: { 
                                ...prev.permissions, 
                                manageOrders: { ...prev.permissions.manageOrders, menuPage: e.target.checked }
                              }
                            }))}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">Access Orders Menu</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.permissions.manageOrders.addNew}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              permissions: { 
                                ...prev.permissions, 
                                manageOrders: { ...prev.permissions.manageOrders, addNew: e.target.checked }
                              }
                            }))}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">Create Orders</span>
                        </label>
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.permissions.manageInvoices.menuPage}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              permissions: { 
                                ...prev.permissions, 
                                manageInvoices: { ...prev.permissions.manageInvoices, menuPage: e.target.checked }
                              }
                            }))}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">Access Invoices Menu</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.permissions.manageInvoices.generate}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              permissions: { 
                                ...prev.permissions, 
                                manageInvoices: { ...prev.permissions.manageInvoices, generate: e.target.checked }
                              }
                            }))}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">Generate Invoices</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.permissions.manageCustomers.menuPage}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              permissions: { 
                                ...prev.permissions, 
                                manageCustomers: { ...prev.permissions.manageCustomers, menuPage: e.target.checked }
                              }
                            }))}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">Access Customers Menu</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.permissions.manageCustomers.addNew}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              permissions: { 
                                ...prev.permissions, 
                                manageCustomers: { ...prev.permissions.manageCustomers, addNew: e.target.checked }
                              }
                            }))}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">Create Customers</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Product Management - Admin Controlled */}
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <h5 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                      <CubeIcon className="w-5 h-5" />
                      Product Management (Admin Control Required)
                    </h5>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.permissions.manageProducts.viewProducts}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            permissions: { 
                              ...prev.permissions, 
                              manageProducts: { ...prev.permissions.manageProducts, viewProducts: e.target.checked }
                            }
                          }))}
                          className="h-4 w-4 text-red-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Access Products Menu</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.permissions.manageProducts.addNew}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            permissions: { 
                              ...prev.permissions, 
                              manageProducts: { ...prev.permissions.manageProducts, addNew: e.target.checked }
                            }
                          }))}
                          className="h-4 w-4 text-red-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Add New Products</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.permissions.manageProducts.edit}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            permissions: { 
                              ...prev.permissions, 
                              manageProducts: { ...prev.permissions.manageProducts, edit: e.target.checked }
                            }
                          }))}
                          className="h-4 w-4 text-red-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Edit Products</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.permissions.manageProducts.delete}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            permissions: { 
                              ...prev.permissions, 
                              manageProducts: { ...prev.permissions.manageProducts, delete: e.target.checked }
                            }
                          }))}
                          className="h-4 w-4 text-red-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Delete Products</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.permissions.manageProducts.viewCostPrice}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            permissions: { 
                              ...prev.permissions, 
                              manageProducts: { ...prev.permissions.manageProducts, viewCostPrice: e.target.checked }
                            }
                          }))}
                          className="h-4 w-4 text-red-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">View Cost Pricing</span>
                      </label>
                    </div>
                  </div>

                  {/* Purchase Orders - Admin Controlled */}
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h5 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                      <KeyIcon className="w-5 h-5" />
                      Purchase Orders (Admin Control Required)
                    </h5>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.permissions.managePurchase.menuPageVisible}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            permissions: { 
                              ...prev.permissions, 
                              managePurchase: { ...prev.permissions.managePurchase, menuPageVisible: e.target.checked }
                            }
                          }))}
                          className="h-4 w-4 text-orange-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Access Purchase Orders Menu</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.permissions.managePurchase.addNew}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            permissions: { 
                              ...prev.permissions, 
                              managePurchase: { ...prev.permissions.managePurchase, addNew: e.target.checked }
                            }
                          }))}
                          className="h-4 w-4 text-orange-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Create Purchase Orders</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.permissions.managePurchase.edit}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            permissions: { 
                              ...prev.permissions, 
                              managePurchase: { ...prev.permissions.managePurchase, edit: e.target.checked }
                            }
                          }))}
                          className="h-4 w-4 text-orange-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Edit Purchase Orders</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.permissions.managePurchase.confirmPurchase}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            permissions: { 
                              ...prev.permissions, 
                              managePurchase: { ...prev.permissions.managePurchase, confirmPurchase: e.target.checked }
                            }
                          }))}
                          className="h-4 w-4 text-orange-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Confirm/Approve Purchases</span>
                      </label>
                    </div>
                  </div>

                  {/* Additional Permissions */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CogIcon className="w-5 h-5" />
                      Additional Access
                    </h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.permissions.manageInventory.menuPageVisible}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              permissions: { 
                                ...prev.permissions, 
                                manageInventory: { ...prev.permissions.manageInventory, menuPageVisible: e.target.checked }
                              }
                            }))}
                            className="h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">Access Inventory</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.permissions.dashboardReports.salesReport}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              permissions: { 
                                ...prev.permissions, 
                                dashboardReports: { ...prev.permissions.dashboardReports, salesReport: e.target.checked }
                              }
                            }))}
                            className="h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">View Sales Reports</span>
                        </label>
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.permissions.companyAdmin.companySetting}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              permissions: { 
                                ...prev.permissions, 
                                companyAdmin: { ...prev.permissions.companyAdmin, companySetting: e.target.checked }
                              }
                            }))}
                            className="h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">Company Settings Access</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={onCancel}
                className="flex-1 px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                {employee ? 'Update Employee' : 'Create Employee Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}