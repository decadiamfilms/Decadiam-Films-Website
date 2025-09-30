import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, MagnifyingGlassIcon, UserPlusIcon, 
  KeyIcon, EnvelopeIcon, ShieldCheckIcon, UserGroupIcon,
  PencilIcon, TrashIcon, EyeIcon
} from '@heroicons/react/24/outline';
import UniversalNavigation from '../layout/UniversalNavigation';
import UniversalHeader from '../layout/UniversalHeader';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  userGroups: UserGroup[];
  isActive: boolean;
  lastLogin?: Date;
  invitedAt: Date;
  activatedAt?: Date;
  permissions: string[];
}

interface UserGroup {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  color: string;
  memberCount: number;
  isDefault: boolean;
}

interface Permission {
  id: string;
  module: string;
  action: string; // view, create, edit, delete, approve, export
  description: string;
}

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [activeTab, setActiveTab] = useState<'employees' | 'groups'>('employees');
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchUserGroups();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserGroups = async () => {
    try {
      const response = await fetch('/api/user-groups');
      const data = await response.json();
      setUserGroups(data);
    } catch (error) {
      console.error('Failed to fetch user groups:', error);
    }
  };

  const filteredEmployees = employees.filter(employee =>
    `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-8">Loading team management...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team & Employee Management</h1>
            <p className="text-gray-600 mt-1">Manage user accounts, permissions, and access levels across SalesKik</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('groups')}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ShieldCheckIcon className="w-4 h-4 mr-2" />
              Manage User Groups
            </button>
            <button
              onClick={() => setShowInviteForm(true)}
              className="inline-flex items-center px-4 py-2 bg-amber-500 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-amber-600 transition-colors"
            >
              <UserPlusIcon className="w-4 h-4 mr-2" />
              Invite Team Member
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('employees')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'employees'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Team Members ({employees.length})
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'groups'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Groups ({userGroups.length})
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'employees' ? (
        <EmployeesList 
          employees={filteredEmployees}
          userGroups={userGroups}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onRefresh={fetchEmployees}
        />
      ) : (
        <UserGroupsList 
          userGroups={userGroups}
          onRefresh={fetchUserGroups}
        />
      )}

      {/* Invite Employee Modal */}
      {showInviteForm && (
        <InviteEmployeeModal 
          onClose={() => setShowInviteForm(false)}
          onEmployeeInvited={fetchEmployees}
          userGroups={userGroups}
        />
      )}
    </div>
  );
}

// Employees List Component
function EmployeesList({ employees, userGroups, searchTerm, setSearchTerm, onRefresh }: {
  employees: Employee[];
  userGroups: UserGroup[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onRefresh: () => void;
}) {
  return (
    <>
      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-80">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search team members by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
          <select className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent">
            <option>All Status</option>
            <option>Active</option>
            <option>Pending Invitation</option>
            <option>Inactive</option>
          </select>
          <select className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent">
            <option>All User Groups</option>
            {userGroups.map((group) => (
              <option key={group.id} value={group.name}>{group.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* User Groups Overview */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active User Groups</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {userGroups.slice(0, 4).map((group) => (
            <div key={group.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: group.color }}
                />
                <h3 className="font-medium text-gray-900">{group.name}</h3>
                {group.isDefault && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Default</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">{group.permissions.length} permissions</p>
              <p className="text-xs text-gray-500">{group.memberCount} members</p>
            </div>
          ))}
        </div>
      </div>

      {/* Employees List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
            <div className="text-sm text-gray-500">
              {employees.filter(emp => emp.isActive).length} active, {employees.filter(emp => !emp.isActive).length} pending
            </div>
          </div>

          <div className="space-y-4">
            {employees.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlusIcon className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
                <p className="text-gray-500 mb-6">Invite your first team member to start collaborating on SalesKik.</p>
              </div>
            ) : (
              employees.map((employee) => (
                <div key={employee.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mr-4">
                        <span className="text-lg font-bold text-white">
                          {employee.firstName[0]}{employee.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </h3>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <EnvelopeIcon className="w-4 h-4 mr-1" />
                            {employee.email}
                          </div>
                          <div className="text-sm text-gray-600">{employee.role}</div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            employee.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {employee.isActive ? 'Active' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">User Groups:</span>
                          {employee.userGroups.map((group) => (
                            <span 
                              key={group.id}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: group.color }}
                            >
                              {group.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-2">
                        {employee.lastLogin 
                          ? `Last login: ${employee.lastLogin.toLocaleDateString()}`
                          : employee.activatedAt 
                            ? 'Never logged in'
                            : `Invited: ${employee.invitedAt.toLocaleDateString()}`
                        }
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                          <EyeIcon className="w-3 h-3 mr-1 inline" />
                          View
                        </button>
                        <button className="px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
                          <PencilIcon className="w-3 h-3 mr-1 inline" />
                          Edit
                        </button>
                        <button className="px-3 py-1 text-xs border border-amber-300 text-amber-700 rounded hover:bg-amber-50 transition-colors">
                          <KeyIcon className="w-3 h-3 mr-1 inline" />
                          Reset Access
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// User Groups List Component
function UserGroupsList({ userGroups, onRefresh }: {
  userGroups: UserGroup[];
  onRefresh: () => void;
}) {
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">User Groups & Permissions</h2>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create User Group
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userGroups.map((group) => (
              <div key={group.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: group.color }}
                    />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{group.name}</h3>
                      <p className="text-sm text-gray-600">{group.description}</p>
                    </div>
                  </div>
                  {group.isDefault && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Default
                    </span>
                  )}
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Members:</span>
                    <span className="font-medium">{group.memberCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Permissions:</span>
                    <span className="font-medium">{group.permissions.length}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Key Permissions:</h4>
                  <div className="space-y-1">
                    {group.permissions.slice(0, 4).map((permission) => (
                      <div key={permission.id} className="text-xs text-gray-600">
                        • {permission.module}: {permission.action}
                      </div>
                    ))}
                    {group.permissions.length > 4 && (
                      <div className="text-xs text-gray-500">
                        +{group.permissions.length - 4} more permissions
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors">
                    Edit Permissions
                  </button>
                  <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-50 transition-colors">
                    View Members
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCreateGroup && (
        <CreateUserGroupModal 
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={onRefresh}
        />
      )}
    </>
  );
}

// Invite Employee Modal Component
function InviteEmployeeModal({ onClose, onEmployeeInvited, userGroups }: {
  onClose: () => void;
  onEmployeeInvited: () => void;
  userGroups: UserGroup[];
}) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    userGroupIds: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/employees/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      onEmployeeInvited();
      onClose();
    } catch (error) {
      console.error('Failed to invite employee:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full border border-gray-200">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Invite Team Member</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="employee@example.com"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title/Role</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="e.g. Sales Manager, Technician, Admin"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User Groups & Permissions</label>
                <div className="space-y-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {userGroups.map((group) => (
                    <label key={group.id} className="flex items-start">
                      <input
                        type="checkbox"
                        checked={formData.userGroupIds.includes(group.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData, 
                              userGroupIds: [...formData.userGroupIds, group.id]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              userGroupIds: formData.userGroupIds.filter(id => id !== group.id)
                            });
                          }
                        }}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded mt-1"
                      />
                      <div className="ml-3">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: group.color }}
                          />
                          <span className="text-sm font-medium text-gray-900">{group.name}</span>
                          {group.isDefault && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Default</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{group.description}</p>
                        <p className="text-xs text-gray-500">{group.permissions.length} permissions</p>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Users can belong to multiple groups. Their effective permissions will be the union of all selected groups.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-1">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• An invitation email will be sent with a secure setup link</li>
                  <li>• They'll create their password and activate their account</li>
                  <li>• Access is controlled by the user groups you've selected</li>
                  <li>• You can modify permissions anytime from this screen</li>
                  <li>• Re-inviting triggers a password reset without deleting data</li>
                </ul>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-500 border border-transparent rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// Create User Group Modal Component
function CreateUserGroupModal({ onClose, onGroupCreated }: {
  onClose: () => void;
  onGroupCreated: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    permissions: [] as string[]
  });

  const availablePermissions = [
    { module: 'Products', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { module: 'Quotes', actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
    { module: 'Orders', actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
    { module: 'Invoices', actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
    { module: 'Customers', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { module: 'Inventory', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { module: 'Employees', actions: ['view', 'create', 'edit', 'delete'] },
    { module: 'Settings', actions: ['view', 'edit'] },
    { module: 'Reports', actions: ['view', 'export'] }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-100">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create User Group</h2>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Group Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="e.g. Sales Team, Warehouse Staff"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Group Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    rows={3}
                    placeholder="What does this user group do? Who should be in it?"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Permissions</label>
                <div className="space-y-4">
                  {availablePermissions.map((modulePermission) => (
                    <div key={modulePermission.module} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">{modulePermission.module}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {modulePermission.actions.map((action) => (
                          <label key={`${modulePermission.module}-${action}`} className="flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700 capitalize">{action}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-500 border border-transparent rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Create User Group
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeManagement;