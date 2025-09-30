import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import { 
  BuildingOfficeIcon, UsersIcon, CreditCardIcon, ShieldCheckIcon,
  CogIcon, BellIcon, PaintBrushIcon, GlobeAltIcon,
  KeyIcon, DocumentTextIcon, ChartBarIcon, CloudIcon,
  EnvelopeIcon, PhoneIcon, MapPinIcon, CameraIcon,
  CheckIcon, XMarkIcon, PlusIcon, PencilIcon, TrashIcon,
  ExclamationTriangleIcon, InformationCircleIcon
} from '@heroicons/react/24/outline';

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  logo: string;
  selectedPlan: string;
  industry: string;
  website: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
}

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'users' | 'billing' | 'security' | 'integrations' | 'notifications'>('company');
  const [company, setCompany] = useState<Company | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const fetchSettingsData = async () => {
    try {
      // Mock data for settings
      const mockCompany: Company = {
        id: '1',
        name: 'Ecco Hardware',
        email: 'admin@eccohardware.com.au',
        phone: '+61 2 1234 5678',
        address: '123 Business St, Sydney NSW 2000',
        logo: '/company-logo.png',
        selectedPlan: 'Small Business',
        industry: 'Glass & Hardware',
        website: 'https://eccohardware.com.au'
      };

      const mockUsers: User[] = [
        { id: '1', name: 'Adam Budai', email: 'adam@eccohardware.com.au', role: 'ADMIN' },
        { id: '2', name: 'Sarah Johnson', email: 'sarah@eccohardware.com.au', role: 'MANAGER' },
        { id: '3', name: 'Mike Chen', email: 'mike@eccohardware.com.au', role: 'EMPLOYEE' },
        { id: '4', name: 'Emma Wilson', email: 'emma@eccohardware.com.au', role: 'EMPLOYEE' },
      ];

      setCompany(mockCompany);
      setUsers(mockUsers);
    } catch (error) {
      console.error('Failed to fetch settings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'company', name: 'Company', icon: BuildingOfficeIcon, desc: 'Business info & branding' },
    { id: 'users', name: 'Users', icon: UsersIcon, desc: 'Team & permissions' },
    { id: 'billing', name: 'Billing', icon: CreditCardIcon, desc: 'Plans & payments' },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon, desc: 'Access & audit logs' },
    { id: 'integrations', name: 'Integrations', icon: CloudIcon, desc: 'Third-party apps' },
    { id: 'notifications', name: 'Notifications', icon: BellIcon, desc: 'Alerts & preferences' },
  ];

  if (loading) {
    return <div className="p-8">Loading settings...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="settings" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        onOpen={() => setShowSidebar(true)}
      />

      <UniversalHeader
        title="System Settings"
        subtitle="Configure your business settings and system preferences"
        onMenuToggle={() => setShowSidebar(true)}
        actions={
          <div className="flex items-center gap-3">
            <span className="text-xs bg-gradient-to-r from-purple-600 to-purple-700 text-white px-3 py-1 rounded-full font-semibold">
              ADMIN SETTINGS
            </span>
          </div>
        }
      />

      <div className="p-8 max-w-7xl mx-auto">
        {/* Settings Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="border-b border-gray-100">
            <nav className="flex space-x-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-3 py-4 px-6 font-medium text-sm transition-all duration-200 border-b-2 ${
                    activeTab === tab.id
                      ? 'text-blue-700 border-blue-500 bg-blue-50'
                      : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">{tab.name}</div>
                    <div className="text-xs text-gray-500">{tab.desc}</div>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'company' && <CompanySettings company={company} setCompany={setCompany} />}
            {activeTab === 'users' && <UserManagement users={users} setUsers={setUsers} />}
            {activeTab === 'billing' && <BillingSettings company={company} />}
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'integrations' && <IntegrationsSettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
          </div>
        </div>
      </div>
    </div>
  );
};

// Company Settings Component
function CompanySettings({ company, setCompany }: { 
  company: Company | null; 
  setCompany: (company: Company) => void; 
}) {
  const [editingCompany, setEditingCompany] = useState<Company | null>(company);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoPreviewStyle, setLogoPreviewStyle] = useState<string>('max-w-64 max-h-48');

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        
        // Analyze logo for intelligent scaling
        analyzeLogoForPreview(result);
        
        if (editingCompany) {
          setEditingCompany({...editingCompany, logo: result});
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Intelligent logo scaling for preview
  const analyzeLogoForPreview = (logoSrc: string) => {
    const img = new Image();
    img.onload = () => {
      const { naturalWidth, naturalHeight } = img;
      const aspectRatio = naturalWidth / naturalHeight;
      
      let style = '';
      
      if (aspectRatio > 2.5) {
        // Very wide logo (like long company names)
        style = 'max-w-80 max-h-32';
      } else if (aspectRatio > 1.5) {
        // Wide logo (landscape)
        style = 'max-w-72 max-h-40';
      } else if (aspectRatio < 0.7) {
        // Tall logo (portrait)
        style = 'max-w-40 max-h-56';
      } else if (aspectRatio >= 0.7 && aspectRatio <= 1.3) {
        // Square-ish logo - these need special handling
        style = 'max-w-48 max-h-48';
      } else {
        // Slightly wide logo
        style = 'max-w-64 max-h-44';
      }
      
      // Size boost for small original images
      if (naturalWidth < 200 && naturalHeight < 200) {
        // Small original logo - boost size significantly
        style = style.replace('max-w-40', 'max-w-56')
                     .replace('max-w-48', 'max-w-64')
                     .replace('max-w-64', 'max-w-80')
                     .replace('max-h-32', 'max-h-40')
                     .replace('max-h-40', 'max-h-48')
                     .replace('max-h-44', 'max-h-52')
                     .replace('max-h-48', 'max-h-56');
      }
      
      setLogoPreviewStyle(style);
    };
    
    img.onerror = () => {
      // Fallback styling if image fails to load
      setLogoPreviewStyle('max-w-64 max-h-48');
    };
    
    img.src = logoSrc;
  };

  const saveCompanySettings = () => {
    if (editingCompany) {
      setCompany(editingCompany);
      // Save logo and company name to localStorage for header
      if (editingCompany.logo) {
        localStorage.setItem('companyLogo', editingCompany.logo);
      } else {
        localStorage.removeItem('companyLogo');
      }
      localStorage.setItem('companyName', editingCompany.name);
      
      // In production, this would save to API
      console.log('Saving company settings:', editingCompany);
      alert('Company settings saved successfully!');
    }
  };

  // Load existing logo on component mount
  React.useEffect(() => {
    const savedLogo = localStorage.getItem('companyLogo');
    if (savedLogo && editingCompany) {
      setLogoPreview(savedLogo);
      analyzeLogoForPreview(savedLogo);
      setEditingCompany({...editingCompany, logo: savedLogo});
    }
  }, []);

  if (!editingCompany) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Company Information</h3>
        <p className="text-gray-600">Update your business details and branding</p>
      </div>

      {/* Basic Company Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
            <input
              type="text"
              value={editingCompany.name}
              onChange={(e) => setEditingCompany({...editingCompany, name: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Industry</label>
            <select
              value={editingCompany.industry}
              onChange={(e) => setEditingCompany({...editingCompany, industry: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="Glass & Hardware">Glass & Hardware</option>
              <option value="Construction">Construction</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Retail">Retail</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
            <input
              type="url"
              value={editingCompany.website}
              onChange={(e) => setEditingCompany({...editingCompany, website: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="https://yourcompany.com"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={editingCompany.email}
              onChange={(e) => setEditingCompany({...editingCompany, email: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={editingCompany.phone}
              onChange={(e) => setEditingCompany({...editingCompany, phone: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Business Address</label>
            <textarea
              value={editingCompany.address}
              onChange={(e) => setEditingCompany({...editingCompany, address: e.target.value})}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Company Branding */}
      <div className="border-t border-gray-200 pt-8">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Company Branding</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Company Logo</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors min-h-80">
              {logoPreview ? (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <img 
                      src={logoPreview} 
                      alt="Company Logo Preview" 
                      className={`${logoPreviewStyle} mx-auto object-contain rounded-lg`}
                    />
                  </div>
                  <div className="space-y-4">
                    <p className="text-lg text-green-600 font-semibold">✓ Logo uploaded successfully!</p>
                    <p className="text-sm text-gray-600">This is how your logo will appear in the header</p>
                    <div className="flex gap-3 justify-center">
                      <input
                        type="file"
                        id="logo-upload"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer"
                      >
                        Change Logo
                      </label>
                      <button
                        onClick={() => {
                          setLogoPreview('');
                          if (editingCompany) {
                            setEditingCompany({...editingCompany, logo: ''});
                          }
                          localStorage.removeItem('companyLogo');
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        Remove Logo
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <CameraIcon className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Upload your company logo</h4>
                  <p className="text-gray-600 mb-2">Make your brand visible across SalesKik</p>
                  <p className="text-sm text-gray-500 mb-6">Supports PNG, JPG, GIF up to 5MB</p>
                  <input
                    type="file"
                    id="logo-upload-initial"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="logo-upload-initial"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block font-medium"
                  >
                    Choose Logo File
                  </label>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Brand Colors</label>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Primary Color</label>
                <input type="color" value="#3B82F6" className="w-full h-12 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Secondary Color</label>
                <input type="color" value="#10B981" className="w-full h-12 border border-gray-300 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-8 border-t border-gray-200">
        <button
          onClick={saveCompanySettings}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
        >
          Save Company Settings
        </button>
      </div>
    </div>
  );
}

// User Management Component
function UserManagement({ users, setUsers }: { 
  users: User[]; 
  setUsers: (users: User[]) => void; 
}) {
  const [showAddUser, setShowAddUser] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-700';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-700';
      case 'EMPLOYEE':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">User Management</h3>
          <p className="text-gray-600 mt-1">Manage team members and their access permissions</p>
        </div>
        <button
          onClick={() => setShowAddUser(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900">Team Members ({users.length})</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {users.map((user) => (
            <div key={user.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-600">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-900">{user.name}</h5>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadge(user.role)}`}>
                    {user.role}
                  </span>
                  <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  {user.role !== 'ADMIN' && (
                    <button className="p-2 text-gray-400 hover:text-red-600 rounded-lg">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Permissions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Role Permissions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border border-red-200 rounded-xl bg-red-50">
            <h5 className="font-semibold text-red-900 mb-2">Admin</h5>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Full system access</li>
              <li>• User management</li>
              <li>• Billing & settings</li>
              <li>• Inventory builder</li>
            </ul>
          </div>
          <div className="p-4 border border-blue-200 rounded-xl bg-blue-50">
            <h5 className="font-semibold text-blue-900 mb-2">Manager</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Team oversight</li>
              <li>• Quote approval</li>
              <li>• Inventory management</li>
              <li>• Customer relations</li>
            </ul>
          </div>
          <div className="p-4 border border-green-200 rounded-xl bg-green-50">
            <h5 className="font-semibold text-green-900 mb-2">Employee</h5>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Create quotes</li>
              <li>• View inventory</li>
              <li>• Customer lookup</li>
              <li>• Basic reporting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Billing Settings Component
function BillingSettings({ company }: { company: Company | null }) {
  const plans = [
    { 
      name: 'Tradie', 
      price: '$39', 
      period: 'month', 
      features: ['Quick Quotes', 'Basic Invoicing', 'Job Scheduling', '1 User'],
      current: company?.selectedPlan === 'Tradie'
    },
    { 
      name: 'Small Business', 
      price: '$89', 
      period: 'month', 
      features: ['Advanced Quotes', 'Inventory Management', 'Team Collaboration', '5 Users', 'Analytics'],
      current: company?.selectedPlan === 'Small Business'
    },
    { 
      name: 'Enterprise', 
      price: '$199', 
      period: 'month', 
      features: ['Custom Workflows', 'API Access', 'Multi-location', 'Unlimited Users', 'Priority Support'],
      current: company?.selectedPlan === 'Enterprise'
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-gray-900">Billing & Plans</h3>
        <p className="text-gray-600 mt-1">Manage your subscription and billing information</p>
      </div>

      {/* Current Plan */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-bold text-blue-900">Current Plan: {company?.selectedPlan}</h4>
            <p className="text-blue-700">Next billing date: January 15, 2025</p>
          </div>
          <span className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold">Active</span>
        </div>
      </div>

      {/* Available Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <div key={index} className={`rounded-2xl border-2 p-6 transition-all duration-200 ${
            plan.current 
              ? 'border-blue-500 bg-blue-50 shadow-lg' 
              : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
          }`}>
            <div className="text-center">
              <h4 className="text-xl font-bold text-gray-900">{plan.name}</h4>
              <div className="mt-2">
                <span className="text-3xl font-black text-gray-900">{plan.price}</span>
                <span className="text-gray-600">/{plan.period}</span>
              </div>
              
              <ul className="mt-6 space-y-3 text-sm">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button className={`w-full mt-6 py-3 rounded-xl font-semibold transition-colors ${
                plan.current
                  ? 'bg-blue-600 text-white cursor-default'
                  : 'bg-gray-100 text-gray-900 hover:bg-blue-600 hover:text-white'
              }`}>
                {plan.current ? 'Current Plan' : 'Upgrade'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Security Settings Component
function SecuritySettings() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-gray-900">Security & Access</h3>
        <p className="text-gray-600 mt-1">Manage security settings and access controls</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Access Control</h4>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Two-Factor Authentication</span>
              <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Force Password Reset (90 days)</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">IP Whitelist</span>
              <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Audit Logs</h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckIcon className="w-4 h-4 text-green-500" />
              <span>User login: adam@eccohardware.com.au</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <InformationCircleIcon className="w-4 h-4 text-blue-500" />
              <span>Category created: Glass Pool Fencing</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
              <span>Failed login attempt detected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Integrations Component
function IntegrationsSettings() {
  const integrations = [
    { name: 'Xero Accounting', status: 'Connected', icon: DocumentTextIcon, color: 'green' },
    { name: 'Google Analytics', status: 'Not Connected', icon: ChartBarIcon, color: 'gray' },
    { name: 'Mailchimp', status: 'Connected', icon: EnvelopeIcon, color: 'green' },
    { name: 'Stripe Payments', status: 'Connected', icon: CreditCardIcon, color: 'green' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-gray-900">Integrations</h3>
        <p className="text-gray-600 mt-1">Connect third-party applications and services</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <integration.icon className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{integration.name}</h4>
                  <p className={`text-sm font-medium ${
                    integration.status === 'Connected' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {integration.status}
                  </p>
                </div>
              </div>
              <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                integration.status === 'Connected'
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}>
                {integration.status === 'Connected' ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Notifications Component
function NotificationSettings() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-gray-900">Notification Preferences</h3>
        <p className="text-gray-600 mt-1">Configure how and when you receive notifications</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Email Notifications</h4>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">New quote requests</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Low stock alerts</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Daily sales summary</span>
              <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">System Alerts</h4>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Security alerts</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">System maintenance</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Feature updates</span>
              <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;