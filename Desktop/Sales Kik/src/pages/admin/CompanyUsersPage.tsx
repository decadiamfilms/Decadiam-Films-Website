import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import { Modal } from '../../components/ui/Modal';
import { 
  PlusIcon, UsersIcon, CheckIcon, XMarkIcon, 
  PencilIcon, EyeIcon, EyeSlashIcon, EnvelopeIcon,
  ChevronDownIcon, UserCircleIcon, TagIcon, ClockIcon,
  PowerIcon, StopIcon, MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userGroupId: string;
  userGroupName: string;
  status: 'active' | 'inactive' | 'invited';
  skillSet: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface UserGroup {
  id: string;
  name: string;
  code: string;
}

interface CustomDropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  value: string;
  placeholder: string;
  options: CustomDropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

function CustomDropdown({ value, placeholder, options, onChange, disabled }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(opt => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (disabled) {
    return (
      <div className="w-full px-4 py-3 bg-gray-100 text-gray-400 border border-gray-200 rounded-xl">
        {placeholder}
      </div>
    );
  }

  return (
    <div className="w-full relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 text-left border-2 rounded-xl transition-all duration-200 flex items-center justify-between ${
          isOpen
            ? 'border-amber-500 ring-2 ring-amber-200 bg-white shadow-lg'
            : 'border-gray-300 hover:border-amber-400 bg-white shadow-sm'
        }`}
      >
        <span className={selectedOption ? 'text-gray-900 font-medium' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-50 w-full">
          <div className="py-2 max-h-60 overflow-y-auto">
            <button
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors border-b border-gray-200"
            >
              {placeholder}
            </button>
            {options.map((option, index) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 transition-colors ${
                  index < options.length - 1 ? 'border-b border-gray-100' : ''
                } ${
                  option.value === value 
                    ? 'bg-amber-50 text-amber-700 font-semibold' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompanyUsersPage() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedUserGroup, setSelectedUserGroup] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Invite User Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteUserGroup, setInviteUserGroup] = useState('');
  const [inviteSkillSet, setInviteSkillSet] = useState('');
  const [savedSkillSets, setSavedSkillSets] = useState<string[]>([]);
  
  // Edit User Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editUserGroup, setEditUserGroup] = useState('');
  const [editSkillSet, setEditSkillSet] = useState('');
  
  // Deactivate Modal
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
  

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load user groups
      const savedGroups = localStorage.getItem('saleskik-user-groups');
      if (savedGroups) {
        const groups = JSON.parse(savedGroups);
        setUserGroups(groups);
      }

      // Load saved skill sets
      const savedSkills = localStorage.getItem('saleskik-saved-skill-sets');
      if (savedSkills) {
        setSavedSkillSets(JSON.parse(savedSkills));
      }

      // Load users
      const savedUsers = localStorage.getItem('saleskik-company-users');
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers));
      } else {
        // Create sample users
        const sampleUsers: User[] = [
          {
            id: 'current-admin',
            email: 'admin@company.com',
            firstName: 'Admin',
            lastName: 'User',
            userGroupId: '1',
            userGroupName: 'Administrators',
            status: 'active',
            skillSet: 'System Administrator',
            lastLogin: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        ];
        setUsers(sampleUsers);
        localStorage.setItem('saleskik-company-users', JSON.stringify(sampleUsers));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail || !inviteFirstName || !inviteLastName || !inviteUserGroup || !inviteSkillSet) {
      return;
    }

    const selectedGroup = userGroups.find(g => g.id === inviteUserGroup);

    // Save skill set if it's new
    if (inviteSkillSet && !savedSkillSets.includes(inviteSkillSet)) {
      const updatedSkillSets = [...savedSkillSets, inviteSkillSet];
      setSavedSkillSets(updatedSkillSets);
      localStorage.setItem('saleskik-saved-skill-sets', JSON.stringify(updatedSkillSets));
    }

    const newUser: User = {
      id: Date.now().toString(),
      email: inviteEmail,
      firstName: inviteFirstName,
      lastName: inviteLastName,
      userGroupId: inviteUserGroup,
      userGroupName: selectedGroup?.name || '',
      status: 'invited',
      skillSet: inviteSkillSet,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('saleskik-company-users', JSON.stringify(updatedUsers));

    // Send email invitation with template
    const emailData = {
      to: inviteEmail,
      firstName: inviteFirstName,
      lastName: inviteLastName,
      email: inviteEmail,
      companyName: 'Your Company', // This would come from company settings
      userGroupName: selectedGroup?.name || '',
      skillSet: inviteSkillSet,
      inviterName: 'Admin User', // This would come from current user
      signupLink: `${window.location.origin}/signup?invite=${newUser.id}&token=secure-token-here`
    };
    
    console.log('Sending beautifully designed invitation email to:', inviteEmail, 'with data:', emailData);
    // TODO: Integrate with email service using template at /email-templates/user-invitation.html

    // Reset form
    setInviteEmail('');
    setInviteFirstName('');
    setInviteLastName('');
    setInviteUserGroup('');
    setInviteSkillSet('');
    setShowInviteModal(false);
  };

  const handleToggleUserStatus = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (user.status === 'active') {
      setUserToDeactivate(user);
      setShowDeactivateModal(true);
    } else if (user.status === 'inactive') {
      // Reactivate user
      const updatedUsers = users.map(u => 
        u.id === userId 
          ? { ...u, status: 'active' as const, updatedAt: new Date() }
          : u
      );
      setUsers(updatedUsers);
      localStorage.setItem('saleskik-company-users', JSON.stringify(updatedUsers));
    }
  };

  const confirmDeactivateUser = () => {
    if (!userToDeactivate) return;

    const updatedUsers = users.map(u => 
      u.id === userToDeactivate.id 
        ? { ...u, status: 'inactive' as const, updatedAt: new Date() }
        : u
    );
    
    setUsers(updatedUsers);
    localStorage.setItem('saleskik-company-users', JSON.stringify(updatedUsers));
    setShowDeactivateModal(false);
    setUserToDeactivate(null);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditEmail(user.email);
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditUserGroup(user.userGroupId);
    setEditSkillSet(user.skillSet);
    setShowEditModal(true);
  };

  const handleUpdateUser = () => {
    if (!editingUser || !editEmail || !editFirstName || !editLastName || !editUserGroup || !editSkillSet) {
      return;
    }

    const selectedGroup = userGroups.find(g => g.id === editUserGroup);

    // Save skill set if it's new
    if (editSkillSet && !savedSkillSets.includes(editSkillSet)) {
      const updatedSkillSets = [...savedSkillSets, editSkillSet];
      setSavedSkillSets(updatedSkillSets);
      localStorage.setItem('saleskik-saved-skill-sets', JSON.stringify(updatedSkillSets));
    }

    const updatedUsers = users.map(user => 
      user.id === editingUser.id
        ? {
            ...user,
            email: editEmail,
            firstName: editFirstName,
            lastName: editLastName,
            userGroupId: editUserGroup,
            userGroupName: selectedGroup?.name || '',
            skillSet: editSkillSet,
            updatedAt: new Date(),
          }
        : user
    );

    setUsers(updatedUsers);
    localStorage.setItem('saleskik-company-users', JSON.stringify(updatedUsers));

    // Reset form
    setEditingUser(null);
    setEditEmail('');
    setEditFirstName('');
    setEditLastName('');
    setEditUserGroup('');
    setEditSkillSet('');
    setShowEditModal(false);
  };

  const getFilteredUsers = () => {
    return users.filter(user => {
      const groupMatch = selectedUserGroup === 'all' || user.userGroupId === selectedUserGroup;
      const statusMatch = selectedStatus === 'all' || user.status === selectedStatus;
      
      // Search functionality
      const searchMatch = !searchQuery || 
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.skillSet.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.userGroupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
      
      return groupMatch && statusMatch && searchMatch;
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-red-100 text-red-800 border-red-200',
      invited: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    
    return badges[status as keyof typeof badges] || badges.inactive;
  };

  const formatLastLogin = (date?: Date) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <UniversalHeader onMenuToggle={() => setShowSidebar(!showSidebar)} />
      <UniversalNavigation
        currentPage="Company Users"
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
              <h1 className="text-2xl font-bold text-gray-900">Company Users</h1>
              <p className="mt-1 text-gray-600">Manage user accounts and permissions</p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              <EnvelopeIcon className="w-4 h-4 mr-2" />
              Invite User
            </button>
          </div>
        </div>

        <div className="p-8">
          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Search Bar */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Users
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm placeholder-gray-400 transition-all duration-200"
                    placeholder="Search by name, email, skill..."
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-3.5 h-4 w-4 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* User Group Filter */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Group
                </label>
                <CustomDropdown
                  value={selectedUserGroup}
                  placeholder="All Groups"
                  options={[
                    { value: 'all', label: 'All Groups' },
                    ...userGroups.map(group => ({ value: group.id, label: group.name }))
                  ]}
                  onChange={setSelectedUserGroup}
                />
              </div>

              {/* Status Filter */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <CustomDropdown
                  value={selectedStatus}
                  placeholder="All"
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'invited', label: 'Invited' }
                  ]}
                  onChange={setSelectedStatus}
                />
              </div>

              {/* Results Count */}
              <div className="lg:col-span-1 flex items-end">
                <div className="text-sm text-gray-500 pb-3">
                  {getFilteredUsers().length} users found
                  {searchQuery && (
                    <div className="text-xs text-amber-600 mt-1">
                      Searching: "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Group
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredUsers().map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserCircleIcon className="w-8 h-8 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.skillSet}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {user.userGroupName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(user.status)}`}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {formatLastLogin(user.lastLogin)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="text-amber-600 hover:text-amber-900"
                            title="Edit user"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          {user.status !== 'invited' && (
                            <button
                              onClick={() => handleToggleUserStatus(user.id)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                                user.status === 'active' ? 'bg-green-600' : 'bg-gray-300'
                              }`}
                              title={user.status === 'active' ? 'Click to deactivate' : 'Click to activate'}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  user.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {getFilteredUsers().length === 0 && (
                <div className="text-center py-12">
                  <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-500">No users match the current filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Invite User Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setInviteEmail('');
          setInviteFirstName('');
          setInviteLastName('');
          setInviteUserGroup('');
          setInviteSkillSet('');
        }}
        title="Invite New User"
        subtitle="Send an invitation to join your SalesKik workspace"
        size="xl"
      >
        <div className="px-2 py-4">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8 p-6 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 rounded-xl border-2 border-amber-200 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 flex items-center justify-center shadow-lg">
              <EnvelopeIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-900 mb-1">New User Invitation</h4>
              <p className="text-gray-600">The user will receive a beautifully designed email invitation to create their SalesKik account and join your workspace.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm placeholder-gray-400 transition-all duration-200"
                  placeholder="user@company.com"
                  required
                />
                <EnvelopeIcon className="absolute right-3 top-3.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={inviteFirstName}
                onChange={(e) => setInviteFirstName(e.target.value)}
                className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm placeholder-gray-400 transition-all duration-200"
                placeholder="John"
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={inviteLastName}
                onChange={(e) => setInviteLastName(e.target.value)}
                className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm placeholder-gray-400 transition-all duration-200"
                placeholder="Smith"
                required
              />
            </div>

            {/* User Group */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                User Group <span className="text-red-500">*</span>
              </label>
              <CustomDropdown
                value={inviteUserGroup}
                placeholder="Select a group"
                options={userGroups.map(group => ({ value: group.id, label: group.name }))}
                onChange={setInviteUserGroup}
              />
            </div>

            {/* Skill Set */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Skill Set <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={inviteSkillSet}
                onChange={(e) => setInviteSkillSet(e.target.value)}
                className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm placeholder-gray-400 transition-all duration-200"
                placeholder="e.g., Project Manager, Glazier, etc."
                required
              />
              
              {/* Saved Skill Sets */}
              {savedSkillSets.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-600 mb-2">Previously used:</p>
                  <div className="flex flex-wrap gap-2">
                    {savedSkillSets.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => setInviteSkillSet(skill)}
                        className="px-3 py-1 text-xs bg-amber-100 border border-amber-300 rounded-md hover:bg-amber-200 transition-colors text-amber-700 font-medium"
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 bg-gray-50 px-1 py-4 rounded-b-lg">
          <button
            onClick={() => {
              setShowInviteModal(false);
              setInviteEmail('');
              setInviteFirstName('');
              setInviteLastName('');
              setInviteUserGroup('');
              setInviteSkillSet('');
              setCustomSkillSet('');
            }}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleInviteUser}
            disabled={!inviteEmail || !inviteFirstName || !inviteLastName || !inviteUserGroup || !inviteSkillSet}
            className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none"
          >
            <div className="flex items-center space-x-2">
              <EnvelopeIcon className="w-4 h-4" />
              <span>Send Invitation</span>
            </div>
          </button>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
          setEditEmail('');
          setEditFirstName('');
          setEditLastName('');
          setEditUserGroup('');
          setEditSkillSet('');
          setEditCustomSkillSet('');
        }}
        title="Edit User"
        subtitle="Update user information and permissions"
        size="xl"
      >
        <div className="px-2 py-4">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8 p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-200 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <PencilIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-900 mb-1">Edit User Information</h4>
              <p className="text-gray-600">Update the user's profile details and group assignment. Changes will be applied immediately.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 transition-all duration-200"
                  placeholder="user@company.com"
                  required
                />
                <EnvelopeIcon className="absolute right-3 top-3.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 transition-all duration-200"
                placeholder="John"
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 transition-all duration-200"
                placeholder="Smith"
                required
              />
            </div>

            {/* User Group */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                User Group <span className="text-red-500">*</span>
              </label>
              <CustomDropdown
                value={editUserGroup}
                placeholder="Select a group"
                options={userGroups.map(group => ({ value: group.id, label: group.name }))}
                onChange={setEditUserGroup}
              />
            </div>

            {/* Skill Set */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Skill Set <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editSkillSet}
                onChange={(e) => setEditSkillSet(e.target.value)}
                className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 transition-all duration-200"
                placeholder="e.g., Project Manager, Glazier, etc."
                required
              />
              
              {/* Saved Skill Sets */}
              {savedSkillSets.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-600 mb-2">Previously used:</p>
                  <div className="flex flex-wrap gap-2">
                    {savedSkillSets.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => setEditSkillSet(skill)}
                        className="px-3 py-1 text-xs bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 transition-colors text-blue-700 font-medium"
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 bg-gray-50 px-1 py-4 rounded-b-lg">
          <button
            onClick={() => {
              setShowEditModal(false);
              setEditingUser(null);
              setEditEmail('');
              setEditFirstName('');
              setEditLastName('');
              setEditUserGroup('');
              setEditSkillSet('');
            }}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateUser}
            disabled={!editEmail || !editFirstName || !editLastName || !editUserGroup || !editSkillSet}
            className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none"
          >
            <div className="flex items-center space-x-2">
              <CheckIcon className="w-4 h-4" />
              <span>Update User</span>
            </div>
          </button>
        </div>
      </Modal>

      {/* Deactivate User Modal */}
      <Modal
        isOpen={showDeactivateModal}
        onClose={() => {
          setShowDeactivateModal(false);
          setUserToDeactivate(null);
        }}
        title="Deactivate User"
        subtitle="This will disable the user's access to the system"
        size="md"
      >
        <div className="p-1">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <StopIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-900">
                Are you sure you want to deactivate this user?
              </p>
              {userToDeactivate && (
                <p className="text-xs text-gray-500 mt-1">
                  {userToDeactivate.firstName} {userToDeactivate.lastName} ({userToDeactivate.email})
                </p>
              )}
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This user will no longer be able to access the system. You can reactivate them later if needed.
            </p>
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <button
            onClick={() => {
              setShowDeactivateModal(false);
              setUserToDeactivate(null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={confirmDeactivateUser}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Deactivate User
          </button>
        </div>
      </Modal>
    </div>
  );
}