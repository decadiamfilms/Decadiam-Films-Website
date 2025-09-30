import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import { Modal } from '../../components/ui/Modal';
import { 
  PlusIcon, UsersIcon, ShieldCheckIcon, CheckIcon,
  XMarkIcon, UserGroupIcon, CogIcon, PencilIcon, TrashIcon,
  SparklesIcon, StarIcon, FireIcon, BoltIcon, TagIcon
} from '@heroicons/react/24/outline';

interface UserGroup {
  id: string;
  name: string;
  code: string;
  permissions: GroupPermissions;
  userIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

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
    accessCustomGlass: boolean;
    accessProcess: boolean;
    accessSpigot: boolean;
    accessLatch: boolean;
  };
  manageStatus: {
    manageStatus: boolean;
    addStatus: boolean;
    editStatus: boolean;
    deleteStatus: boolean;
    showSubStatus: boolean;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function UserGroupsPage() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [activeTab, setActiveTab] = useState<'permissions' | 'users'>('permissions');
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  const defaultPermissions: GroupPermissions = {
    manageUsers: {
      menuPage: false,
      inviteUser: false,
      viewLogs: false,
      manageUserGroup: false,
    },
    manageCustomers: {
      menuPage: false,
      addNew: false,
      activateDeactivate: false,
      customerRoles: false,
      inviteCustomer: false,
      creditLimitView: false,
      creditLimitEdit: false,
      accountingTermsView: false,
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
      addNew: false,
      edit: false,
      delete: false,
      viewCostPrice: false,
      viewNonRetailPrice: false,
      viewProducts: false,
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
      viewNonRetailPrice: false,
    },
    manageOrders: {
      menuPage: false,
      addNew: false,
      edit: false,
      delete: false,
      negativeCustomText: false,
      changeIndividualPrices: false,
      viewPrices: false,
      superviseOrders: false,
      viewOrders: false,
      cancelOrder: false,
      creditInvoice: false,
    },
    manageQuotes: {
      menuPage: false,
      addNew: false,
      edit: false,
      delete: false,
      negativeCustomText: false,
      changeIndividualPrices: false,
      viewPrices: false,
      superviseQuotes: false,
    },
    manageInvoices: {
      menuPage: false,
      generate: false,
      newPrices: false,
      delete: false,
      negativeCustomText: false,
      changeIndividualPrices: false,
      markSupplied: false,
      draft: false,
      print: false,
      payInvoice: false,
      showPrices: false,
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
      menuPageVisible: false,
      addNew: false,
      edit: false,
      delete: false,
      receiveStock: false,
      removeStock: false,
      adjustStock: false,
      cancelSupply: false,
    },
    managePurchase: {
      menuPageVisible: false,
      addNew: false,
      edit: false,
      delete: false,
      confirmPurchase: false,
    },
    manageJobs: {
      manageTask: false,
      addTask: false,
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
      manageOrders: false,
      manageQuotes: false,
      manageInvoices: false,
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
      salesReport: false,
      invoiceReports: false,
      statusManagement: false,
    },
    logistic: {
      schedulePO: false,
      accessLogistic: false,
    },
    productTypes: {
      accessGlass: false,
      accessCustomGlass: false,
      accessProcess: false,
      accessSpigot: false,
      accessLatch: false,
    },
    manageStatus: {
      manageStatus: false,
      addStatus: false,
      editStatus: false,
      deleteStatus: false,
      showSubStatus: false,
    },
  };

  useEffect(() => {
    loadUserGroups();
    loadUsers();
  }, []);

  const loadUserGroups = async () => {
    try {
      const savedGroups = localStorage.getItem('saleskik-user-groups');
      if (savedGroups) {
        const groups = JSON.parse(savedGroups);
        // Ensure current admin is in Administrator group
        const updatedGroups = groups.map((group: UserGroup) => {
          if (group.code === 'ADMIN' && !group.userIds.includes('current-admin')) {
            return {
              ...group,
              userIds: [...group.userIds, 'current-admin']
            };
          }
          return group;
        });
        setUserGroups(updatedGroups);
        localStorage.setItem('saleskik-user-groups', JSON.stringify(updatedGroups));
        
        // Set Administrator as default selection
        const adminGroup = updatedGroups.find(group => group.code === 'ADMIN');
        if (adminGroup) {
          setSelectedGroup(adminGroup);
        }
      } else {
        // Create sample user groups
        const sampleGroups: UserGroup[] = [
          {
            id: '1',
            name: 'Administrators',
            code: 'ADMIN',
            permissions: { ...defaultPermissions },
            userIds: ['current-admin'], // Add current signed-in account
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            name: 'Sales Staff',
            code: 'SALES',
            permissions: { ...defaultPermissions },
            userIds: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        setUserGroups(sampleGroups);
        localStorage.setItem('saleskik-user-groups', JSON.stringify(sampleGroups));
        
        // Set Administrator as default selection
        setSelectedGroup(sampleGroups[0]);
      }
    } catch (error) {
      console.error('Failed to load user groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      // Add current admin user
      const currentAdmin = {
        id: 'current-admin',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@company.com',
        role: 'ADMIN',
      };

      const savedEmployees = localStorage.getItem('saleskik-employees');
      if (savedEmployees) {
        const employees = JSON.parse(savedEmployees);
        const userList = employees.map((emp: any) => ({
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
          role: emp.role,
        }));
        setUsers([currentAdmin, ...userList]);
      } else {
        setUsers([currentAdmin]);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleAddUserGroup = () => {
    if (!newGroupName.trim()) {
      return;
    }

    // Generate a simple code from the name
    const generatedCode = newGroupName.trim().toUpperCase().replace(/\s+/g, '_').substring(0, 10);

    const newGroup: UserGroup = {
      id: Date.now().toString(),
      name: newGroupName.trim(),
      code: generatedCode,
      permissions: { ...defaultPermissions },
      userIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedGroups = [...userGroups, newGroup];
    setUserGroups(updatedGroups);
    localStorage.setItem('saleskik-user-groups', JSON.stringify(updatedGroups));

    setNewGroupName('');
    setShowAddModal(false);
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroupToDelete(groupId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteGroup = () => {
    if (!groupToDelete) return;
    
    const updatedGroups = userGroups.filter(group => group.id !== groupToDelete);
    setUserGroups(updatedGroups);
    localStorage.setItem('saleskik-user-groups', JSON.stringify(updatedGroups));
    
    if (selectedGroup?.id === groupToDelete) {
      // If we're deleting the selected group, select Administrator or first available group
      const adminGroup = updatedGroups.find(group => group.code === 'ADMIN');
      setSelectedGroup(adminGroup || updatedGroups[0] || null);
    }
    
    setShowDeleteConfirm(false);
    setGroupToDelete(null);
  };

  const cancelDeleteGroup = () => {
    setShowDeleteConfirm(false);
    setGroupToDelete(null);
  };

  const updateGroupPermissions = (groupId: string, category: string, permission: string, value: boolean) => {
    const updatedGroups = userGroups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          permissions: {
            ...group.permissions,
            [category]: {
              ...group.permissions[category as keyof GroupPermissions],
              [permission]: value,
            },
          },
          updatedAt: new Date(),
        };
      }
      return group;
    });

    setUserGroups(updatedGroups);
    localStorage.setItem('saleskik-user-groups', JSON.stringify(updatedGroups));
    
    if (selectedGroup?.id === groupId) {
      setSelectedGroup(updatedGroups.find(g => g.id === groupId) || null);
    }
  };

  const toggleCategoryPermissions = (groupId: string, category: string, selectAll: boolean) => {
    const updatedGroups = userGroups.map(group => {
      if (group.id === groupId) {
        const categoryPermissions = group.permissions[category as keyof GroupPermissions];
        const updatedCategoryPermissions = Object.keys(categoryPermissions).reduce((acc, permission) => {
          acc[permission] = selectAll;
          return acc;
        }, {} as any);

        return {
          ...group,
          permissions: {
            ...group.permissions,
            [category]: updatedCategoryPermissions,
          },
          updatedAt: new Date(),
        };
      }
      return group;
    });

    setUserGroups(updatedGroups);
    localStorage.setItem('saleskik-user-groups', JSON.stringify(updatedGroups));
    
    if (selectedGroup?.id === groupId) {
      setSelectedGroup(updatedGroups.find(g => g.id === groupId) || null);
    }
  };

  const isCategoryFullySelected = (permissions: any) => {
    return Object.values(permissions).every(value => value === true);
  };

  const isCategoryPartiallySelected = (permissions: any) => {
    const values = Object.values(permissions);
    return values.some(value => value === true) && !values.every(value => value === true);
  };

  const toggleUserInGroup = (groupId: string, userId: string) => {
    const updatedGroups = userGroups.map(group => {
      if (group.id === groupId) {
        const userIds = group.userIds.includes(userId)
          ? group.userIds.filter(id => id !== userId)
          : [...group.userIds, userId];
        
        return {
          ...group,
          userIds,
          updatedAt: new Date(),
        };
      }
      return group;
    });

    setUserGroups(updatedGroups);
    localStorage.setItem('saleskik-user-groups', JSON.stringify(updatedGroups));
    
    if (selectedGroup?.id === groupId) {
      setSelectedGroup(updatedGroups.find(g => g.id === groupId) || null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <UniversalHeader onMenuToggle={() => setShowSidebar(!showSidebar)} />
      <UniversalNavigation
        currentPage="User Groups"
        userPlan="SMALL_BUSINESS"
        userRole="ADMIN"
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <main className="flex-1 overflow-hidden">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Groups</h1>
              <p className="mt-1 text-gray-600">Manage user groups and permissions for your organization</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add User Group
            </button>
          </div>
        </div>

        <div className="flex h-full">
          {/* Sidebar - User Groups List */}
          <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-6">
                <UserGroupIcon className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-gray-900">Groups</h3>
              </div>
              <div className="space-y-3">
                {userGroups.map((group, index) => {
                  const colors = [
                    'from-amber-400 to-orange-500',
                    'from-blue-400 to-indigo-500', 
                    'from-green-400 to-emerald-500',
                    'from-purple-400 to-pink-500',
                    'from-red-400 to-rose-500',
                    'from-teal-400 to-cyan-500'
                  ];
                  const colorClass = colors[index % colors.length];
                  
                  return (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroup(group)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedGroup?.id === group.id
                          ? 'border-amber-300 bg-amber-50 shadow-md'
                          : 'border-gray-200 hover:border-amber-200 bg-white hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${colorClass} flex items-center justify-center shadow-sm`}>
                            <UserGroupIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{group.name}</p>
                            <p className="text-xs text-gray-400">{group.userIds.length} members</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGroup(group.id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden">
            {selectedGroup ? (
              <div className="h-full flex flex-col">
                {/* Group Header */}
                <div className="bg-white border-b border-gray-200 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h2 className="text-2xl font-bold text-gray-900">{selectedGroup.name}</h2>
                        <ShieldCheckIcon className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="bg-amber-100 rounded-lg px-3 py-1">
                        <span className="text-amber-700 text-sm font-medium">{selectedGroup.userIds.length} members</span>
                      </div>
                      <UserGroupIcon className="w-8 h-8 text-amber-600" />
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="mt-6">
                    <nav className="flex space-x-8">
                      <button
                        onClick={() => setActiveTab('permissions')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-all ${
                          activeTab === 'permissions'
                            ? 'border-amber-500 text-amber-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <ShieldCheckIcon className="w-4 h-4 inline mr-2" />
                        Permissions
                      </button>
                      <button
                        onClick={() => setActiveTab('users')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-all ${
                          activeTab === 'users'
                            ? 'border-amber-500 text-amber-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <UsersIcon className="w-4 h-4 inline mr-2" />
                        Users ({selectedGroup.userIds.length})
                      </button>
                    </nav>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-auto p-8">
                  {activeTab === 'permissions' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                      {Object.entries(selectedGroup.permissions).map(([category, permissions]) => {
                        const isFullySelected = isCategoryFullySelected(permissions);
                        const isPartiallySelected = isCategoryPartiallySelected(permissions);
                        
                        return (
                          <div key={category} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                              <h4 className="font-semibold text-gray-900 text-lg capitalize">
                                {category.replace(/([A-Z])/g, ' $1').trim()}
                              </h4>
                              <button
                                onClick={() => toggleCategoryPermissions(selectedGroup.id, category, !isFullySelected)}
                                className={`text-xs px-3 py-1.5 rounded-md border transition-all font-medium ${
                                  isFullySelected
                                    ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
                                    : isPartiallySelected
                                    ? 'bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200'
                                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-amber-100 hover:border-amber-300 hover:text-amber-700'
                                }`}
                                title={isFullySelected ? 'Deselect All' : 'Select All'}
                              >
                                {isFullySelected ? (
                                  <>
                                    <CheckIcon className="w-3 h-3 inline mr-1" />
                                    All Selected
                                  </>
                                ) : isPartiallySelected ? (
                                  <>
                                    <CheckIcon className="w-3 h-3 inline mr-1" />
                                    Partial
                                  </>
                                ) : (
                                  'Select All'
                                )}
                              </button>
                            </div>
                            <div className="space-y-3">
                              {Object.entries(permissions).map(([permission, value]) => (
                                <label key={permission} className="flex items-start space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={value as boolean}
                                    onChange={(e) => updateGroupPermissions(selectedGroup.id, category, permission, e.target.checked)}
                                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded mt-0.5"
                                  />
                                  <span className="text-sm text-gray-700 leading-5 capitalize flex-1">
                                    {permission.replace(/([A-Z])/g, ' $1').trim()}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {activeTab === 'users' && (
                    <div className="max-w-4xl">
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> User assignment is managed on a separate page. This view shows currently assigned users.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {users.filter(user => selectedGroup.userIds.includes(user.id)).map((user) => (
                          <div key={user.id} className="flex items-center p-4 border border-gray-200 rounded-lg bg-white">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                              <UsersIcon className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              <p className="text-xs text-gray-400 uppercase tracking-wide">{user.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {selectedGroup.userIds.length === 0 && (
                        <div className="text-center py-12">
                          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 text-lg">No users assigned</p>
                          <p className="text-gray-400 text-sm">Users can be assigned to this group from the user management page.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <UserGroupIcon className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Select a User Group</h3>
                  <p className="text-gray-500 max-w-md">Choose a user group from the sidebar to view and manage its permissions and users.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add User Group Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create User Group"
        subtitle="Set up a new group to organize team permissions"
        size="md"
      >
        <div className="px-1 py-2">
          {/* Icon and description */}
          <div className="flex items-center space-x-4 mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
              <UserGroupIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">New User Group</h4>
              <p className="text-sm text-gray-600">Groups help organize users and manage their permissions efficiently.</p>
            </div>
          </div>

          {/* Form field */}
          <div className="space-y-1">
            <label htmlFor="groupName" className="block text-sm font-semibold text-gray-700">
              Group Name
            </label>
            <p className="text-xs text-gray-500 mb-3">Choose a descriptive name for your user group</p>
            <div className="relative">
              <input
                type="text"
                id="groupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-sm placeholder-gray-400"
                placeholder="e.g., Sales Team, Project Managers, Customer Support"
                autoFocus
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <TagIcon className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Examples */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs font-medium text-blue-800 mb-2">Popular group names:</p>
            <div className="flex flex-wrap gap-2">
              {['Sales Team', 'Managers', 'Support Staff', 'Developers', 'Marketing'].map((example) => (
                <button
                  key={example}
                  onClick={() => setNewGroupName(example)}
                  className="px-2 py-1 text-xs bg-white border border-blue-300 rounded-md hover:bg-blue-100 transition-colors text-blue-700"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 bg-gray-50 px-1 py-4 rounded-b-lg">
          <button
            onClick={() => {
              setShowAddModal(false);
              setNewGroupName('');
            }}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleAddUserGroup}
            disabled={!newGroupName.trim()}
            className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 transform hover:scale-105 disabled:transform-none"
          >
            <div className="flex items-center space-x-2">
              <PlusIcon className="w-4 h-4" />
              <span>Create Group</span>
            </div>
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={cancelDeleteGroup}
        title="Delete User Group"
        subtitle="This action cannot be undone"
        size="md"
      >
        <div className="p-1">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <XMarkIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-900">
                Are you sure you want to delete this user group?
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {groupToDelete && userGroups.find(g => g.id === groupToDelete)?.name}
              </p>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> Users assigned to this group will lose their group permissions.
            </p>
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <button
            onClick={cancelDeleteGroup}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={confirmDeleteGroup}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete Group
          </button>
        </div>
      </Modal>
    </div>
  );
}