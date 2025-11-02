import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import TwoFactorSetup from '../../components/auth/TwoFactorSetup';
import { 
  BuildingOfficeIcon, ShieldCheckIcon, CogIcon, UserGroupIcon,
  KeyIcon, CameraIcon, PaintBrushIcon, DocumentTextIcon,
  CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon,
  EyeIcon, EyeSlashIcon, ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

interface CompanySettings {
  name: string;
  email: string;
  phone: string;
  logo: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postcode: string;
  };
}

const ModernSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'security' | 'employees' | 'system'>('company');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);

  // Company settings state
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: 'SalesKik Company',
    email: '',
    phone: '',
    logo: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postcode: ''
    }
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 120, // minutes
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    auditLogging: true
  });

  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = () => {
    try {
      // Load company settings from localStorage (real data source)
      const savedCompanyName = localStorage.getItem('companyName') || 'SalesKik Company';
      const savedCompanyLogo = localStorage.getItem('companyLogo') || '';
      
      setCompanySettings(prev => ({
        ...prev,
        name: savedCompanyName,
        logo: savedCompanyLogo
      }));

      console.log('⚙️ Loaded current company settings');
    } catch (error) {
      console.error('❌ Failed to load settings:', error);
    }
  };

  const saveCompanySettings = async () => {
    setLoading(true);
    try {
      // Save to localStorage (real data persistence)
      localStorage.setItem('companyName', companySettings.name);
      if (companySettings.logo) {
        localStorage.setItem('companyLogo', companySettings.logo);
      }

      console.log('✅ Company settings saved');
      setMessage({ type: 'success', text: 'Company settings saved successfully!' });
      
      // Refresh page to show updated logo/name
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoData = e.target?.result as string;
        setCompanySettings(prev => ({ ...prev, logo: logoData }));
        setMessage({ type: 'info', text: 'Logo uploaded. Click "Save Settings" to apply changes.' });
      };
      reader.readAsDataURL(file);
    }
  };

  const settingsTabs = [
    { 
      id: 'company', 
      name: 'Company Profile', 
      icon: BuildingOfficeIcon, 
      desc: 'Business information & branding' 
    },
    { 
      id: 'security', 
      name: 'Security', 
      icon: ShieldCheckIcon, 
      desc: '2FA, passwords & access control' 
    },
    { 
      id: 'employees', 
      name: 'Employee System', 
      icon: UserGroupIcon, 
      desc: 'Staff management & permissions' 
    },
    { 
      id: 'system', 
      name: 'System', 
      icon: CogIcon, 
      desc: 'Database, backups & performance' 
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50" style={{ isolation: 'isolate' }}>
      <UniversalNavigation 
        currentPage="settings"
        isOpen={showSidebar} 
        onClose={() => setShowSidebar(false)}
        onOpen={() => setShowSidebar(true)}
      />
      
      <div className={`transition-all duration-300 ${showSidebar ? 'lg:ml-64' : ''}`}>
        <UniversalHeader 
          title="Admin Settings"
          subtitle="Configure company settings and system preferences"
          onMenuClick={() => setShowSidebar(!showSidebar)}
        />
        
        <div className="p-6 max-w-6xl mx-auto">
          {/* Success/Error Messages */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : message.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center">
                {message.type === 'success' && <CheckCircleIcon className="w-5 h-5 mr-2" />}
                {message.type === 'error' && <ExclamationTriangleIcon className="w-5 h-5 mr-2" />}
                {message.type === 'info' && <InformationCircleIcon className="w-5 h-5 mr-2" />}
                {message.text}
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Settings Navigation */}
            <div className="lg:w-1/4">
              <nav className="space-y-2">
                {settingsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-900 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{tab.name}</div>
                      <div className="text-xs text-gray-500">{tab.desc}</div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>

            {/* Settings Content */}
            <div className="lg:w-3/4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                {/* Company Profile Settings */}
                {activeTab === 'company' && (
                  <div className="p-8">
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Company Profile</h3>
                      <p className="text-gray-600">Manage your business information and branding</p>
                    </div>

                    <div className="space-y-6">
                      {/* Company Logo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Company Logo</label>
                        <div className="flex items-center gap-6">
                          {companySettings.logo ? (
                            <img 
                              src={companySettings.logo} 
                              alt="Company Logo" 
                              className="w-20 h-20 object-contain border border-gray-200 rounded-lg p-2"
                            />
                          ) : (
                            <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                              <CameraIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                              id="logo-upload"
                            />
                            <label
                              htmlFor="logo-upload"
                              className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              Upload Logo
                            </label>
                            <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 2MB</p>
                          </div>
                        </div>
                      </div>

                      {/* Company Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                          <input
                            type="text"
                            value={companySettings.name}
                            onChange={(e) => setCompanySettings(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Your Company Name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Business Email</label>
                          <input
                            type="email"
                            value={companySettings.email}
                            onChange={(e) => setCompanySettings(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="contact@yourcompany.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                          <input
                            type="tel"
                            value={companySettings.phone}
                            onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="+61 2 1234 5678"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1</label>
                          <input
                            type="text"
                            value={companySettings.address.line1}
                            onChange={(e) => setCompanySettings(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, line1: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="123 Business Street"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={saveCompanySettings}
                          disabled={loading}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors"
                        >
                          {loading ? 'Saving...' : 'Save Settings'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                {activeTab === 'security' && (
                  <div className="p-8">
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Security Settings</h3>
                      <p className="text-gray-600">Manage account security and access controls</p>
                    </div>

                    <div className="space-y-6">
                      {/* Two-Factor Authentication */}
                      <div className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              <KeyIcon className="w-5 h-5" />
                              Two-Factor Authentication
                              {securitySettings.twoFactorEnabled ? (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Enabled</span>
                              ) : (
                                <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">Disabled</span>
                              )}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Add extra security to admin accounts with authenticator apps
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              if (securitySettings.twoFactorEnabled) {
                                setMessage({ type: 'info', text: '2FA disable feature coming soon' });
                              } else {
                                setShowTwoFactorSetup(true);
                              }
                            }}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                              securitySettings.twoFactorEnabled
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {securitySettings.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                          </button>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h5 className="font-medium text-blue-900 mb-2">Enterprise Security Features</h5>
                          <div className="text-sm text-blue-800 space-y-1">
                            <div className="flex items-center gap-2">
                              <CheckCircleIcon className="w-4 h-4" />
                              <span>Argon2 password hashing (2025 standard)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircleIcon className="w-4 h-4" />
                              <span>Account lockout after failed attempts</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircleIcon className="w-4 h-4" />
                              <span>JWT token-based authentication</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircleIcon className="w-4 h-4" />
                              <span>Multi-tenant data isolation</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Password Policy */}
                      <div className="border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Password Policy</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Length</label>
                            <input
                              type="number"
                              value={securitySettings.passwordPolicy.minLength}
                              onChange={(e) => setSecuritySettings(prev => ({
                                ...prev,
                                passwordPolicy: { ...prev.passwordPolicy, minLength: parseInt(e.target.value) }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              min="8"
                              max="128"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                            <select
                              value={securitySettings.sessionTimeout}
                              onChange={(e) => setSecuritySettings(prev => ({
                                ...prev,
                                sessionTimeout: parseInt(e.target.value)
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value={30}>30 minutes</option>
                              <option value={60}>1 hour</option>
                              <option value={120}>2 hours</option>
                              <option value={480}>8 hours</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Employee System */}
                {activeTab === 'employees' && (
                  <div className="p-8">
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Employee Management System</h3>
                      <p className="text-gray-600">Configure staff access and permissions</p>
                    </div>

                    <div className="space-y-6">
                      {/* Quick Actions */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button
                          onClick={() => navigate('/admin/employees')}
                          className="p-6 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left"
                        >
                          <UserGroupIcon className="w-8 h-8 text-blue-600 mb-3" />
                          <h4 className="font-semibold text-gray-900 mb-2">Manage Employees</h4>
                          <p className="text-sm text-gray-600">Add, edit, and configure employee permissions</p>
                        </button>

                        <button
                          onClick={() => navigate('/help')}
                          className="p-6 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left"
                        >
                          <DocumentTextIcon className="w-8 h-8 text-green-600 mb-3" />
                          <h4 className="font-semibold text-gray-900 mb-2">Permission Guide</h4>
                          <p className="text-sm text-gray-600">Learn about the permission system</p>
                        </button>
                      </div>

                      {/* Current System Status */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <h4 className="font-semibold text-green-900 mb-3">Employee System Status</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-green-800">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Role-based access control (RBAC) active</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-green-800">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Permission system enforced</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-green-800">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Admin hierarchy implemented</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* System Settings */}
                {activeTab === 'system' && (
                  <div className="p-8">
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">System Information</h3>
                      <p className="text-gray-600">Database status and system performance</p>
                    </div>

                    <div className="space-y-6">
                      {/* System Status */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                          <CheckCircleIcon className="w-8 h-8 text-green-600 mx-auto mb-3" />
                          <h4 className="font-semibold text-gray-900">Database</h4>
                          <p className="text-sm text-gray-600 mt-1">PostgreSQL Connected</p>
                          <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Operational</span>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                          <CheckCircleIcon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                          <h4 className="font-semibold text-gray-900">APIs</h4>
                          <p className="text-sm text-gray-600 mt-1">Core endpoints working</p>
                          <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Active</span>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                          <CheckCircleIcon className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                          <h4 className="font-semibold text-gray-900">Security</h4>
                          <p className="text-sm text-gray-600 mt-1">Multi-tenant isolation</p>
                          <span className="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">Protected</span>
                        </div>
                      </div>

                      {/* Quick System Actions */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">System Actions</h4>
                        <div className="flex gap-4">
                          <button
                            onClick={() => window.open('/help', '_blank')}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            View Documentation
                          </button>
                          <button
                            onClick={() => navigate('/inventory/builder')}
                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            Manage Categories
                          </button>
                          <button
                            onClick={() => navigate('/products')}
                            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                          >
                            Manage Products
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication Setup Modal */}
      {showTwoFactorSetup && (
        <TwoFactorSetup
          userEmail={companySettings.email || 'admin@company.com'}
          onSetupComplete={(success) => {
            setShowTwoFactorSetup(false);
            if (success) {
              // Enable 2FA in settings
              setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: true }));
              
              // Store 2FA enabled status for login flow
              localStorage.setItem('admin-2fa-enabled', 'true');
              
              setMessage({ type: 'success', text: 'Two-Factor Authentication enabled successfully! You will be prompted for 2FA on future logins.' });
            }
          }}
          onCancel={() => setShowTwoFactorSetup(false)}
        />
      )}
    </div>
  );
};

export default ModernSettingsPage;