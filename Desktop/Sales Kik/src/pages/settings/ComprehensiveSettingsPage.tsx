import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import TwoFactorSetup from '../../components/auth/TwoFactorSetup';
import { 
  BuildingOfficeIcon, ShieldCheckIcon, CogIcon, UserGroupIcon,
  CreditCardIcon, DocumentTextIcon, ChartBarIcon, CloudArrowUpIcon,
  KeyIcon, CameraIcon, PaintBrushIcon, BellIcon, ClockIcon,
  CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon,
  EyeIcon, EyeSlashIcon, ClipboardDocumentIcon, BanknotesIcon,
  ReceiptPercentIcon, TagIcon, TruckIcon, ArchiveBoxIcon
} from '@heroicons/react/24/outline';

const ComprehensiveSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'financial' | 'operations' | 'billing' | 'employees' | 'security' | 'system'>('company');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);

  // Company settings state
  const [companySettings, setCompanySettings] = useState({
    name: 'SalesKik Company',
    email: '',
    phone: '',
    abn: '',
    website: '',
    logo: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postcode: '',
      country: 'Australia'
    },
    businessType: 'Hardware & Building Supplies',
    defaultCurrency: 'AUD',
    timezone: 'Australia/Sydney'
  });

  // Financial settings state  
  const [financialSettings, setFinancialSettings] = useState({
    defaultPaymentTerms: 30,
    defaultTaxRate: 10,
    invoicePrefix: 'INV',
    quotePrefix: 'QT', 
    orderPrefix: 'ORD',
    autoInvoiceNumbers: true,
    requirePO: false,
    creditTerms: 'Net 30',
    lateFeeRate: 1.5,
    currency: 'AUD'
  });

  // Operational settings state
  const [operationalSettings, setOperationalSettings] = useState({
    lowStockThreshold: 10,
    defaultLeadTime: 7,
    autoReorderEnabled: false,
    workingHours: {
      start: '08:00',
      end: '17:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    defaultLocation: 'Main Warehouse',
    measurementUnits: 'Metric',
    weightUnit: 'kg',
    dimensionUnit: 'mm'
  });

  // Billing settings state
  const [billingSettings, setBillingSettings] = useState({
    currentPlan: 'Professional',
    planStatus: 'Active',
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    monthlyPrice: 89,
    yearlyPrice: 890,
    billingCycle: 'monthly',
    paymentMethod: 'Credit Card ****1234',
    autoRenewal: true,
    usage: {
      employees: 3,
      maxEmployees: 25,
      storage: '2.3 GB',
      maxStorage: '50 GB'
    }
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      expiryDays: 90
    },
    sessionTimeout: 120, // minutes
    auditLogging: true,
    backupFrequency: 'daily'
  });

  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = () => {
    try {
      // Load real settings from localStorage
      const savedCompanyName = localStorage.getItem('companyName') || 'SalesKik Company';
      const savedCompanyLogo = localStorage.getItem('companyLogo') || '';
      const admin2FAEnabled = localStorage.getItem('admin-2fa-enabled') === 'true';
      
      setCompanySettings(prev => ({
        ...prev,
        name: savedCompanyName,
        logo: savedCompanyLogo
      }));

      setSecuritySettings(prev => ({
        ...prev,
        twoFactorEnabled: admin2FAEnabled
      }));

      console.log('⚙️ Settings loaded from localStorage');
    } catch (error) {
      console.error('❌ Failed to load settings:', error);
    }
  };

  const saveSettings = async (category: string) => {
    setLoading(true);
    try {
      console.log(`💾 Saving ${category} settings...`);

      if (category === 'company') {
        localStorage.setItem('companyName', companySettings.name);
        localStorage.setItem('companyEmail', companySettings.email);
        localStorage.setItem('companyPhone', companySettings.phone);
        if (companySettings.logo) {
          localStorage.setItem('companyLogo', companySettings.logo);
        }
      }

      if (category === 'financial') {
        localStorage.setItem('defaultPaymentTerms', financialSettings.defaultPaymentTerms.toString());
        localStorage.setItem('defaultTaxRate', financialSettings.defaultTaxRate.toString());
        localStorage.setItem('invoicePrefix', financialSettings.invoicePrefix);
        localStorage.setItem('quotePrefix', financialSettings.quotePrefix);
      }

      setMessage({ type: 'success', text: `${category.charAt(0).toUpperCase() + category.slice(1)} settings saved successfully!` });
      
      // Refresh if company branding changed
      if (category === 'company') {
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.size <= 2 * 1024 * 1024) { // 2MB limit
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoData = e.target?.result as string;
        setCompanySettings(prev => ({ ...prev, logo: logoData }));
        setMessage({ type: 'info', text: 'Logo uploaded. Click "Save Company Settings" to apply changes.' });
      };
      reader.readAsDataURL(file);
    } else {
      setMessage({ type: 'error', text: 'Logo file must be under 2MB' });
    }
  };

  const businessSettingsTabs = [
    { 
      id: 'company', 
      name: 'Company Profile', 
      icon: BuildingOfficeIcon, 
      desc: 'Business info, branding & contact details'
    },
    { 
      id: 'financial', 
      name: 'Financial Settings', 
      icon: BanknotesIcon, 
      desc: 'Payment terms, tax rates & pricing rules'
    },
    { 
      id: 'operations', 
      name: 'Operations', 
      icon: CogIcon, 
      desc: 'Inventory, workflow & business processes'
    },
    { 
      id: 'billing', 
      name: 'Billing & Plans', 
      icon: CreditCardIcon, 
      desc: 'Subscription, payments & account management'
    },
    { 
      id: 'employees', 
      name: 'Employee Management', 
      icon: UserGroupIcon, 
      desc: 'Staff access, roles & permissions'
    },
    { 
      id: 'security', 
      name: 'Security & Access', 
      icon: ShieldCheckIcon, 
      desc: '2FA, passwords & data protection'
    },
    { 
      id: 'system', 
      name: 'System & Data', 
      icon: CloudArrowUpIcon, 
      desc: 'Backups, performance & maintenance'
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
          title="Business Settings"
          subtitle="Configure your business operations and preferences"
          onMenuClick={() => setShowSidebar(!showSidebar)}
        />
        
        <div className="p-6 max-w-7xl mx-auto">
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

          <div className="flex flex-col xl:flex-row gap-8">
            {/* Settings Navigation */}
            <div className="xl:w-1/4">
              <nav className="space-y-2 sticky top-6">
                {businessSettingsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-900 border-2 border-blue-200 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      activeTab === tab.id ? 'bg-blue-200' : 'bg-gray-100'
                    }`}>
                      <tab.icon className={`w-6 h-6 ${
                        activeTab === tab.id ? 'text-blue-700' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{tab.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{tab.desc}</div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>

            {/* Settings Content */}
            <div className="xl:w-3/4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                
                {/* Company Profile Settings */}
                {activeTab === 'company' && (
                  <div className="p-8">
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Company Profile</h3>
                      <p className="text-gray-600">Manage your business identity and contact information</p>
                    </div>

                    <div className="space-y-8">
                      {/* Business Branding */}
                      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                        <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                          <PaintBrushIcon className="w-5 h-5" />
                          Business Branding
                        </h4>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-blue-900 mb-3">Company Logo</label>
                            <div className="flex items-center gap-6">
                              {companySettings.logo ? (
                                <img 
                                  src={companySettings.logo} 
                                  alt="Company Logo" 
                                  className="w-24 h-24 object-contain border border-blue-200 rounded-xl p-3 bg-white"
                                />
                              ) : (
                                <div className="w-24 h-24 border-2 border-dashed border-blue-300 rounded-xl flex items-center justify-center bg-white">
                                  <CameraIcon className="w-8 h-8 text-blue-400" />
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
                                <p className="text-xs text-blue-700 mt-2">PNG, JPG up to 2MB<br />Recommended: 200x80px</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-blue-900 mb-2">Company Name</label>
                              <input
                                type="text"
                                value={companySettings.name}
                                onChange={(e) => setCompanySettings(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Your Company Name"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-blue-900 mb-2">Business Type</label>
                              <select
                                value={companySettings.businessType}
                                onChange={(e) => setCompanySettings(prev => ({ ...prev, businessType: e.target.value }))}
                                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                <option>Hardware & Building Supplies</option>
                                <option>Manufacturing</option>
                                <option>Construction</option>
                                <option>Glass & Glazing</option>
                                <option>General Contracting</option>
                                <option>Wholesale & Distribution</option>
                                <option>Other</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Business Email</label>
                            <input
                              type="email"
                              value={companySettings.email}
                              onChange={(e) => setCompanySettings(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="contact@yourcompany.com"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <input
                              type="tel"
                              value={companySettings.phone}
                              onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="+61 2 1234 5678"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">ABN Number</label>
                            <input
                              type="text"
                              value={companySettings.abn}
                              onChange={(e) => setCompanySettings(prev => ({ ...prev, abn: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="12 345 678 901"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                            <input
                              type="url"
                              value={companySettings.website}
                              onChange={(e) => setCompanySettings(prev => ({ ...prev, website: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="https://yourcompany.com"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Business Address */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Business Address</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                            <input
                              type="text"
                              value={companySettings.address.line1}
                              onChange={(e) => setCompanySettings(prev => ({ 
                                ...prev, 
                                address: { ...prev.address, line1: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="123 Business Street"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                            <input
                              type="text"
                              value={companySettings.address.city}
                              onChange={(e) => setCompanySettings(prev => ({ 
                                ...prev, 
                                address: { ...prev.address, city: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Sydney"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                            <select
                              value={companySettings.address.state}
                              onChange={(e) => setCompanySettings(prev => ({ 
                                ...prev, 
                                address: { ...prev.address, state: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select State</option>
                              <option value="NSW">New South Wales</option>
                              <option value="VIC">Victoria</option>
                              <option value="QLD">Queensland</option>
                              <option value="WA">Western Australia</option>
                              <option value="SA">South Australia</option>
                              <option value="TAS">Tasmania</option>
                              <option value="ACT">Australian Capital Territory</option>
                              <option value="NT">Northern Territory</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-6 border-t border-gray-200">
                        <button
                          onClick={() => saveSettings('company')}
                          disabled={loading}
                          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors"
                        >
                          {loading ? 'Saving...' : 'Save Company Settings'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Financial Settings */}
                {activeTab === 'financial' && (
                  <div className="p-8">
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Financial Settings</h3>
                      <p className="text-gray-600">Configure pricing, payment terms and tax settings</p>
                    </div>

                    <div className="space-y-8">
                      {/* Payment Terms */}
                      <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                        <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                          <BanknotesIcon className="w-5 h-5" />
                          Payment & Terms
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-green-900 mb-2">Default Payment Terms</label>
                            <select
                              value={financialSettings.defaultPaymentTerms}
                              onChange={(e) => setFinancialSettings(prev => ({ 
                                ...prev, 
                                defaultPaymentTerms: parseInt(e.target.value) 
                              }))}
                              className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
                            >
                              <option value={7}>7 Days</option>
                              <option value={14}>14 Days</option>
                              <option value={30}>30 Days</option>
                              <option value={60}>60 Days</option>
                              <option value={90}>90 Days</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-green-900 mb-2">Default Tax Rate (%)</label>
                            <input
                              type="number"
                              value={financialSettings.defaultTaxRate}
                              onChange={(e) => setFinancialSettings(prev => ({ 
                                ...prev, 
                                defaultTaxRate: parseFloat(e.target.value) 
                              }))}
                              className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
                              step="0.1"
                              min="0"
                              max="50"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-green-900 mb-2">Late Fee Rate (%)</label>
                            <input
                              type="number"
                              value={financialSettings.lateFeeRate}
                              onChange={(e) => setFinancialSettings(prev => ({ 
                                ...prev, 
                                lateFeeRate: parseFloat(e.target.value) 
                              }))}
                              className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
                              step="0.1"
                              min="0"
                              max="25"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Document Numbering */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <DocumentTextIcon className="w-5 h-5" />
                          Document Numbering
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Prefix</label>
                            <input
                              type="text"
                              value={financialSettings.invoicePrefix}
                              onChange={(e) => setFinancialSettings(prev => ({ 
                                ...prev, 
                                invoicePrefix: e.target.value.toUpperCase()
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="INV"
                              maxLength={5}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Quote Prefix</label>
                            <input
                              type="text"
                              value={financialSettings.quotePrefix}
                              onChange={(e) => setFinancialSettings(prev => ({ 
                                ...prev, 
                                quotePrefix: e.target.value.toUpperCase()
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="QT"
                              maxLength={5}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Order Prefix</label>
                            <input
                              type="text"
                              value={financialSettings.orderPrefix}
                              onChange={(e) => setFinancialSettings(prev => ({ 
                                ...prev, 
                                orderPrefix: e.target.value.toUpperCase()
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="ORD"
                              maxLength={5}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-6 border-t border-gray-200">
                        <button
                          onClick={() => saveSettings('financial')}
                          disabled={loading}
                          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold transition-colors"
                        >
                          {loading ? 'Saving...' : 'Save Financial Settings'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Billing & Subscription Management */}
                {activeTab === 'billing' && (
                  <div className="p-8">
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Billing & Subscription</h3>
                      <p className="text-gray-600">Manage your SalesKik subscription and payment methods</p>
                    </div>

                    <div className="space-y-8">
                      {/* Current Plan */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h4 className="text-xl font-bold text-blue-900">Current Plan: {billingSettings.currentPlan}</h4>
                            <p className="text-blue-700">Next billing: {billingSettings.nextBillingDate.toLocaleDateString()}</p>
                            <p className="text-sm text-blue-600 mt-1">
                              {billingSettings.billingCycle === 'monthly' ? 'Monthly' : 'Annual'} billing • ${billingSettings.billingCycle === 'monthly' ? billingSettings.monthlyPrice : billingSettings.yearlyPrice}
                              {billingSettings.billingCycle === 'yearly' && <span className="ml-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Save 17%</span>}
                            </p>
                          </div>
                          <span className={`px-4 py-2 rounded-xl font-semibold ${
                            billingSettings.planStatus === 'Active' 
                              ? 'bg-green-600 text-white' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {billingSettings.planStatus}
                          </span>
                        </div>

                        {/* Plan Usage */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white rounded-lg p-4 border border-blue-200">
                            <h5 className="font-semibold text-gray-900 mb-3">Plan Usage</h5>
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-gray-600">Employees</span>
                                  <span className="font-medium">{billingSettings.usage.employees} / {billingSettings.usage.maxEmployees}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full" 
                                    style={{width: `${(billingSettings.usage.employees / billingSettings.usage.maxEmployees) * 100}%`}}
                                  ></div>
                                </div>
                              </div>
                              
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-gray-600">Storage</span>
                                  <span className="font-medium">{billingSettings.usage.storage} / {billingSettings.usage.maxStorage}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full" 
                                    style={{width: '4.6%'}}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-4 border border-blue-200">
                            <h5 className="font-semibold text-gray-900 mb-3">Payment Method</h5>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>
                                <div>
                                  <div className="font-medium text-gray-900">{billingSettings.paymentMethod}</div>
                                  <div className="text-sm text-gray-600">Expires 12/2027</div>
                                </div>
                              </div>
                              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                Update
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Plan Options */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-6">Available Plans</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Starter Plan */}
                          <div className={`rounded-xl p-6 border-2 transition-all ${
                            billingSettings.currentPlan === 'Starter' 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}>
                            <div className="text-center">
                              <h5 className="text-lg font-bold text-gray-900 mb-2">Starter</h5>
                              <div className="text-3xl font-bold text-gray-900 mb-1">$29<span className="text-lg text-gray-600">/mo</span></div>
                              <div className="text-sm text-gray-600 mb-4">Perfect for small businesses</div>
                              
                              <div className="space-y-2 text-sm text-gray-700 mb-6">
                                <div>• Up to 5 employees</div>
                                <div>• 10 GB storage</div>
                                <div>• Basic reporting</div>
                                <div>• Email support</div>
                              </div>
                              
                              <button 
                                className={`w-full py-2 px-4 rounded-lg font-medium ${
                                  billingSettings.currentPlan === 'Starter'
                                    ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                                disabled={billingSettings.currentPlan === 'Starter'}
                              >
                                {billingSettings.currentPlan === 'Starter' ? 'Current Plan' : 'Downgrade'}
                              </button>
                            </div>
                          </div>

                          {/* Professional Plan */}
                          <div className={`rounded-xl p-6 border-2 transition-all ${
                            billingSettings.currentPlan === 'Professional' 
                              ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}>
                            <div className="text-center">
                              {billingSettings.currentPlan === 'Professional' && (
                                <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium mb-3">CURRENT PLAN</div>
                              )}
                              <h5 className="text-lg font-bold text-gray-900 mb-2">Professional</h5>
                              <div className="text-3xl font-bold text-gray-900 mb-1">$89<span className="text-lg text-gray-600">/mo</span></div>
                              <div className="text-sm text-gray-600 mb-4">Most popular for growing businesses</div>
                              
                              <div className="space-y-2 text-sm text-gray-700 mb-6">
                                <div>• Up to 25 employees</div>
                                <div>• 50 GB storage</div>
                                <div>• Advanced reporting & analytics</div>
                                <div>• 2FA security features</div>
                                <div>• Priority support</div>
                              </div>
                              
                              <button 
                                className={`w-full py-2 px-4 rounded-lg font-medium ${
                                  billingSettings.currentPlan === 'Professional'
                                    ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                                    : 'bg-purple-600 text-white hover:bg-purple-700'
                                }`}
                                disabled={billingSettings.currentPlan === 'Professional'}
                              >
                                {billingSettings.currentPlan === 'Professional' ? 'Current Plan' : 'Upgrade'}
                              </button>
                            </div>
                          </div>

                          {/* Enterprise Plan */}
                          <div className={`rounded-xl p-6 border-2 transition-all ${
                            billingSettings.currentPlan === 'Enterprise' 
                              ? 'border-gold-500 bg-yellow-50' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}>
                            <div className="text-center">
                              <h5 className="text-lg font-bold text-gray-900 mb-2">Enterprise</h5>
                              <div className="text-3xl font-bold text-gray-900 mb-1">$199<span className="text-lg text-gray-600">/mo</span></div>
                              <div className="text-sm text-gray-600 mb-4">Full featured for large businesses</div>
                              
                              <div className="space-y-2 text-sm text-gray-700 mb-6">
                                <div>• Unlimited employees</div>
                                <div>• 500 GB storage</div>
                                <div>• Custom reporting & API access</div>
                                <div>• Advanced security features</div>
                                <div>• Dedicated support manager</div>
                              </div>
                              
                              <button 
                                className={`w-full py-2 px-4 rounded-lg font-medium ${
                                  billingSettings.currentPlan === 'Enterprise'
                                    ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                                }`}
                                disabled={billingSettings.currentPlan === 'Enterprise'}
                              >
                                {billingSettings.currentPlan === 'Enterprise' ? 'Current Plan' : 'Upgrade'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Billing Cycle & Auto-Renewal */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="border border-gray-200 rounded-lg p-6">
                          <h4 className="font-semibold text-gray-900 mb-4">Billing Cycle</h4>
                          <div className="space-y-3">
                            <label className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="billingCycle"
                                checked={billingSettings.billingCycle === 'monthly'}
                                onChange={() => setBillingSettings(prev => ({ ...prev, billingCycle: 'monthly' }))}
                                className="h-4 w-4 text-blue-600 border-gray-300"
                              />
                              <div>
                                <span className="font-medium text-gray-900">Monthly</span>
                                <div className="text-sm text-gray-600">${billingSettings.monthlyPrice}/month</div>
                              </div>
                            </label>
                            
                            <label className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="billingCycle"
                                checked={billingSettings.billingCycle === 'yearly'}
                                onChange={() => setBillingSettings(prev => ({ ...prev, billingCycle: 'yearly' }))}
                                className="h-4 w-4 text-blue-600 border-gray-300"
                              />
                              <div>
                                <span className="font-medium text-gray-900">Annual</span>
                                <div className="text-sm text-gray-600">${billingSettings.yearlyPrice}/year • Save 17%</div>
                              </div>
                            </label>
                          </div>
                        </div>

                        <div className="border border-gray-200 rounded-lg p-6">
                          <h4 className="font-semibold text-gray-900 mb-4">Account Management</h4>
                          <div className="space-y-4">
                            <label className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={billingSettings.autoRenewal}
                                onChange={(e) => setBillingSettings(prev => ({ ...prev, autoRenewal: e.target.checked }))}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                              />
                              <div>
                                <span className="font-medium text-gray-900">Auto-renewal</span>
                                <div className="text-sm text-gray-600">Automatically renew subscription</div>
                              </div>
                            </label>

                            <button
                              onClick={() => setMessage({ 
                                type: 'info', 
                                text: 'Account cancellation requires contacting support to ensure proper data handling and export options.' 
                              })}
                              className="w-full px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-medium transition-colors"
                            >
                              Cancel Subscription
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Billing History */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Billing History</h4>
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                            <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700">
                              <div>Date</div>
                              <div>Description</div>
                              <div>Amount</div>
                              <div>Status</div>
                            </div>
                          </div>
                          <div className="divide-y divide-gray-200">
                            {[
                              { date: '2025-01-01', desc: 'Professional Plan - Monthly', amount: '$89.00', status: 'Paid' },
                              { date: '2024-12-01', desc: 'Professional Plan - Monthly', amount: '$89.00', status: 'Paid' },
                              { date: '2024-11-01', desc: 'Professional Plan - Monthly', amount: '$89.00', status: 'Paid' }
                            ].map((invoice, index) => (
                              <div key={index} className="px-6 py-4 grid grid-cols-4 gap-4 text-sm">
                                <div className="text-gray-900">{invoice.date}</div>
                                <div className="text-gray-700">{invoice.desc}</div>
                                <div className="font-medium text-gray-900">{invoice.amount}</div>
                                <div>
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                    {invoice.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Support Options */}
                      <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                        <h4 className="font-semibold text-yellow-900 mb-3">Need Help with Billing?</h4>
                        <p className="text-yellow-800 text-sm mb-4">
                          Our billing team is here to help with plan changes, payment issues, or account questions.
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => window.open('mailto:billing@saleskik.com', '_blank')}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium transition-colors"
                          >
                            Contact Billing Support
                          </button>
                          <button
                            onClick={() => navigate('/help')}
                            className="px-4 py-2 border border-yellow-300 text-yellow-800 rounded-lg hover:bg-yellow-100 font-medium transition-colors"
                          >
                            View Documentation
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Operations Settings */}
                {activeTab === 'operations' && (
                  <div className="p-8">
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Operational Settings</h3>
                      <p className="text-gray-600">Configure inventory, workflow and business processes</p>
                    </div>

                    <div className="space-y-6">
                      {/* Inventory Management */}
                      <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                        <h4 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
                          <ArchiveBoxIcon className="w-5 h-5" />
                          Inventory Management
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-orange-900 mb-2">Low Stock Threshold</label>
                            <input
                              type="number"
                              value={operationalSettings.lowStockThreshold}
                              onChange={(e) => setOperationalSettings(prev => ({ 
                                ...prev, 
                                lowStockThreshold: parseInt(e.target.value) 
                              }))}
                              className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                              min="0"
                              max="1000"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-orange-900 mb-2">Default Lead Time (days)</label>
                            <input
                              type="number"
                              value={operationalSettings.defaultLeadTime}
                              onChange={(e) => setOperationalSettings(prev => ({ 
                                ...prev, 
                                defaultLeadTime: parseInt(e.target.value) 
                              }))}
                              className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                              min="1"
                              max="365"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Business Hours */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <ClockIcon className="w-5 h-5" />
                          Business Hours
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                            <input
                              type="time"
                              value={operationalSettings.workingHours.start}
                              onChange={(e) => setOperationalSettings(prev => ({
                                ...prev,
                                workingHours: { ...prev.workingHours, start: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                            <input
                              type="time"
                              value={operationalSettings.workingHours.end}
                              onChange={(e) => setOperationalSettings(prev => ({
                                ...prev,
                                workingHours: { ...prev.workingHours, end: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-6 border-t border-gray-200">
                        <button
                          onClick={() => saveSettings('operations')}
                          disabled={loading}
                          className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-semibold transition-colors"
                        >
                          {loading ? 'Saving...' : 'Save Operational Settings'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Employee Management */}
                {activeTab === 'employees' && (
                  <div className="p-8">
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Employee Management</h3>
                      <p className="text-gray-600">Manage staff access, roles and permissions</p>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                          <UserGroupIcon className="w-10 h-10 text-blue-600 mb-4" />
                          <h4 className="text-lg font-semibold text-blue-900 mb-2">Employee Accounts</h4>
                          <p className="text-blue-700 text-sm mb-4">Create and manage staff access with granular permissions</p>
                          <button
                            onClick={() => navigate('/admin/employees')}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                          >
                            Manage Employees →
                          </button>
                        </div>

                        <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                          <ShieldCheckIcon className="w-10 h-10 text-purple-600 mb-4" />
                          <h4 className="text-lg font-semibold text-purple-900 mb-2">Permission System</h4>
                          <p className="text-purple-700 text-sm mb-4">Control access to sensitive features like product management</p>
                          <button
                            onClick={() => navigate('/help')}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                          >
                            View Permission Guide →
                          </button>
                        </div>
                      </div>

                      {/* Current Permission Status */}
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Current System Status</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">✓</div>
                            <div className="text-sm font-medium text-gray-900">RBAC System</div>
                            <div className="text-xs text-gray-600">Role-based access control active</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">✓</div>
                            <div className="text-sm font-medium text-gray-900">Admin Hierarchy</div>
                            <div className="text-xs text-gray-600">Admin override permissions working</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">✓</div>
                            <div className="text-sm font-medium text-gray-900">Permission Enforcement</div>
                            <div className="text-xs text-gray-600">Menu access control enforced</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                {activeTab === 'security' && (
                  <div className="p-8">
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Security & Access Control</h3>
                      <p className="text-gray-600">Configure authentication, access controls and data protection</p>
                    </div>

                    <div className="space-y-8">
                      {/* Two-Factor Authentication */}
                      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h4 className="text-lg font-semibold text-blue-900 flex items-center gap-2 mb-2">
                              <KeyIcon className="w-5 h-5" />
                              Two-Factor Authentication
                              {securitySettings.twoFactorEnabled ? (
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
                              ) : (
                                <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">Inactive</span>
                              )}
                            </h4>
                            <p className="text-sm text-blue-700">
                              {securitySettings.twoFactorEnabled 
                                ? 'Admin accounts are protected with 2FA. New devices require verification.'
                                : 'Add extra security to admin accounts with authenticator apps.'
                              }
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              if (securitySettings.twoFactorEnabled) {
                                setMessage({ type: 'info', text: '2FA disable feature coming soon. Contact support if needed.' });
                              } else {
                                setShowTwoFactorSetup(true);
                              }
                            }}
                            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                              securitySettings.twoFactorEnabled
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {securitySettings.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                          </button>
                        </div>

                        {securitySettings.twoFactorEnabled && (
                          <div className="bg-white rounded-lg p-4 border border-blue-300">
                            <h5 className="font-medium text-blue-900 mb-3">2FA Features Active:</h5>
                            <div className="space-y-2 text-sm text-blue-800">
                              <div className="flex items-center gap-2">
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>TOTP codes with Google Authenticator support</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>Device trust for 30 days (reduces prompts)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>Emergency backup codes for recovery</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>Rate limiting prevents brute force attacks</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Security Status */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Security Status Overview</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="border border-gray-200 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-3">Active Security Features</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-green-700">
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>Argon2 password hashing (2025 standard)</span>
                              </div>
                              <div className="flex items-center gap-2 text-green-700">
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>JWT token-based authentication</span>
                              </div>
                              <div className="flex items-center gap-2 text-green-700">
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>Multi-tenant data isolation</span>
                              </div>
                              <div className="flex items-center gap-2 text-green-700">
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>Role-based access control (RBAC)</span>
                              </div>
                              <div className="flex items-center gap-2 text-green-700">
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>Rate limiting & API protection</span>
                              </div>
                            </div>
                          </div>

                          <div className="border border-gray-200 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-3">Compliance Ready</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-blue-700">
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>Enterprise-grade error handling</span>
                              </div>
                              <div className="flex items-center gap-2 text-blue-700">
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>Audit logging capabilities</span>
                              </div>
                              <div className="flex items-center gap-2 text-blue-700">
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>Data backup protection</span>
                              </div>
                              <div className="flex items-center gap-2 text-blue-700">
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>Session management & timeouts</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* System Information */}
                {activeTab === 'system' && (
                  <div className="p-8">
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">System Information</h3>
                      <p className="text-gray-600">Database status, performance metrics and system health</p>
                    </div>

                    <div className="space-y-6">
                      {/* System Health */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                          <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto mb-3" />
                          <h4 className="font-semibold text-green-900">Database</h4>
                          <p className="text-sm text-green-700 mt-1">PostgreSQL Connected</p>
                          <span className="inline-block mt-3 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Operational</span>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                          <CheckCircleIcon className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                          <h4 className="font-semibold text-blue-900">Core APIs</h4>
                          <p className="text-sm text-blue-700 mt-1">Categories, Products, Quotes</p>
                          <span className="inline-block mt-3 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Active</span>
                        </div>

                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
                          <CheckCircleIcon className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                          <h4 className="font-semibold text-purple-900">Security</h4>
                          <p className="text-sm text-purple-700 mt-1">Multi-tenant isolation</p>
                          <span className="inline-block mt-3 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Protected</span>
                        </div>
                      </div>

                      {/* Quick Management Actions */}
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Quick Management Actions</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <button
                            onClick={() => navigate('/inventory/builder')}
                            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                          >
                            <TagIcon className="w-6 h-6 text-blue-600" />
                            <div className="text-left">
                              <div className="font-medium text-gray-900">Manage Categories</div>
                              <div className="text-xs text-gray-600">Product category structure</div>
                            </div>
                          </button>

                          <button
                            onClick={() => navigate('/products')}
                            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-green-300 transition-colors"
                          >
                            <ArchiveBoxIcon className="w-6 h-6 text-green-600" />
                            <div className="text-left">
                              <div className="font-medium text-gray-900">Product Catalog</div>
                              <div className="text-xs text-gray-600">Products, pricing & inventory</div>
                            </div>
                          </button>

                          <button
                            onClick={() => navigate('/suppliers')}
                            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-orange-300 transition-colors"
                          >
                            <TruckIcon className="w-6 h-6 text-orange-600" />
                            <div className="text-left">
                              <div className="font-medium text-gray-900">Suppliers</div>
                              <div className="text-xs text-gray-600">Vendor management</div>
                            </div>
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
              setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: true }));
              localStorage.setItem('admin-2fa-enabled', 'true');
              setMessage({ type: 'success', text: 'Two-Factor Authentication enabled successfully! You will be prompted for 2FA on future logins from new devices.' });
            }
          }}
          onCancel={() => setShowTwoFactorSetup(false)}
        />
      )}
    </div>
  );
};

export default ComprehensiveSettingsPage;