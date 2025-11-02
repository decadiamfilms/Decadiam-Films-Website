import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../../components/layout/UniversalNavigation';
import UniversalHeader from '../../../components/layout/UniversalHeader';
import { 
  BuildingOfficeIcon, PencilIcon, CheckIcon, XMarkIcon,
  CameraIcon, MapPinIcon, PhoneIcon, EnvelopeIcon,
  CreditCardIcon, ShieldCheckIcon, GlobeAltIcon,
  ExclamationTriangleIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';

interface CompanyProfile {
  id: string;
  name: string;
  type: string;
  subscriptionStatus: 'ACTIVE' | 'INACTIVE' | 'TRIAL' | 'SUSPENDED';
  organizationIntegration: 'XERO' | 'MYOB' | 'QUICKBOOKS' | null;
  logo: string;
  abn: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

const CompanyProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    id: '1',
    name: 'Ecco Hardware',
    type: 'Glass & Hardware Specialist',
    subscriptionStatus: 'ACTIVE',
    organizationIntegration: 'XERO',
    logo: '',
    abn: 'ABN 12 345 678 901',
    address: '123 Business Street, Sydney NSW 2000',
    phone: '+61 2 1234 5678',
    email: 'admin@eccohardware.com.au',
    website: 'https://eccohardware.com.au'
  });

  useEffect(() => {
    // Load company data
    fetchCompanyData();
    
    // Load saved logo
    const savedLogo = localStorage.getItem('companyLogo');
    if (savedLogo) {
      setLogoPreview(savedLogo);
      setCompanyProfile(prev => ({ ...prev, logo: savedLogo }));
    }
  }, []);

  const fetchCompanyData = async () => {
    try {
      // Try to fetch from API first
      const response = await fetch('/api/company', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Map API data to component interface
          setCompanyProfile({
            id: result.data.id,
            name: result.data.name || 'Your Company',
            type: result.data.type || 'Business',
            subscriptionStatus: result.data.subscriptionStatus || 'ACTIVE',
            organizationIntegration: result.data.organizationIntegration,
            logo: result.data.logoUrl || '',
            abn: result.data.abnAcn || '',
            address: typeof result.data.address === 'string' ? result.data.address : 
                    `${result.data.address?.street || ''} ${result.data.address?.city || ''} ${result.data.address?.state || ''} ${result.data.address?.postcode || ''}`.trim(),
            phone: result.data.phone || '',
            email: result.data.email || '',
            website: result.data.website || ''
          });
        }
      } else {
        console.log('API not available, using fallback data');
        // Fallback to localStorage if API fails
        const savedProfile = localStorage.getItem('companyProfile');
        if (savedProfile) {
          try {
            const parsed = JSON.parse(savedProfile);
            setCompanyProfile(parsed);
          } catch (error) {
            console.error('Failed to parse saved company profile:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch company data:', error);
      // Keep default fallback data
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        setCompanyProfile(prev => ({ ...prev, logo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      // Save to localStorage for persistence
      localStorage.setItem('companyProfile', JSON.stringify(companyProfile));
      
      // Save logo to localStorage for header display
      if (companyProfile.logo) {
        localStorage.setItem('companyLogo', companyProfile.logo);
      }
      localStorage.setItem('companyName', companyProfile.name);
      
      // In production, save to API
      console.log('Saving company profile:', companyProfile);
      
      setTimeout(() => {
        setSaving(false);
        setShowSuccessMessage(true);
        // Auto-hide after 3 seconds
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }, 1000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'TRIAL':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'INACTIVE':
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIntegrationLogo = (integration: string | null) => {
    if (!integration) return null;
    
    const logos = {
      'XERO': '/integrations/xero-logo.png',
      'MYOB': '/integrations/myob-logo.png', 
      'QUICKBOOKS': '/integrations/quickbooks-logo.png'
    };
    
    return logos[integration as keyof typeof logos];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading company profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="company-profile" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="Company Profile"
        subtitle="Manage your business information and settings"
        onMenuToggle={() => setShowSidebar(true)}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={saveProfile}
              disabled={saving}
              className={`px-6 py-2 rounded-xl font-semibold transition-all ${
                saving 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
              }`}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      />

      <div className="p-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Company Identity */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Company Name & Status */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <BuildingOfficeIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Company Identity</h3>
                  <p className="text-sm text-gray-600">Basic business information</p>
                </div>
              </div>

              {/* Company Name */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={companyProfile.name}
                      onChange={(e) => setCompanyProfile({ ...companyProfile, name: e.target.value })}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                    <button
                      onClick={() => setEditingName(false)}
                      className="p-3 text-green-600 hover:bg-green-50 rounded-xl border border-green-200"
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingName(false)}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-xl border border-red-200"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="text-lg font-semibold text-gray-900">{companyProfile.name}</span>
                    <button
                      onClick={() => setEditingName(true)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Company Type */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Type</label>
                <select
                  value={companyProfile.type}
                  onChange={(e) => setCompanyProfile({ ...companyProfile, type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Glass & Hardware Specialist">Glass & Hardware Specialist</option>
                  <option value="Construction & Building">Construction & Building</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail & Wholesale">Retail & Wholesale</option>
                  <option value="Services">Services</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Subscription Status */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subscription Status</label>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold ${getStatusBadge(companyProfile.subscriptionStatus)}`}>
                  {companyProfile.subscriptionStatus === 'ACTIVE' ? (
                    <CheckCircleIcon className="w-4 h-4" />
                  ) : (
                    <ExclamationTriangleIcon className="w-4 h-4" />
                  )}
                  {companyProfile.subscriptionStatus === 'ACTIVE' ? 'Active Subscription' : 
                   companyProfile.subscriptionStatus === 'TRIAL' ? 'Trial Period' : 'Inactive'}
                </div>
              </div>

              {/* Organization Integration */}
              {companyProfile.organizationIntegration && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Accounting Integration</label>
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                    <img 
                      src={getIntegrationLogo(companyProfile.organizationIntegration)} 
                      alt={companyProfile.organizationIntegration}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        // Fallback to text if logo doesn't exist
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling!.style.display = 'block';
                      }}
                    />
                    <span className="hidden font-semibold text-green-800">
                      {companyProfile.organizationIntegration}
                    </span>
                    <div>
                      <div className="font-semibold text-green-800">{companyProfile.organizationIntegration} Connected</div>
                      <div className="text-xs text-green-600">Accounting software synchronized</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Company Logo */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <CameraIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Company Logo</h3>
                  <p className="text-sm text-gray-600">Brand your business</p>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
                {logoPreview ? (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <img 
                        src={logoPreview} 
                        alt="Company Logo Preview" 
                        className="max-w-32 max-h-24 mx-auto object-contain rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-green-600 font-medium">✓ Logo uploaded successfully!</p>
                      <div className="flex gap-2 justify-center">
                        <input
                          type="file"
                          id="logo-upload"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="logo-upload"
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm cursor-pointer"
                        >
                          Change Logo
                        </label>
                        <button
                          onClick={() => {
                            setLogoPreview('');
                            setCompanyProfile(prev => ({ ...prev, logo: '' }));
                            localStorage.removeItem('companyLogo');
                          }}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <CameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Upload your company logo</h4>
                    <p className="text-gray-600 mb-2">Appears in header and invoices</p>
                    <p className="text-sm text-gray-500 mb-4">Supports PNG, JPG, GIF up to 5MB</p>
                    <input
                      type="file"
                      id="logo-upload-initial"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="logo-upload-initial"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block font-medium"
                    >
                      Choose Logo File
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Business Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Business Information */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <GlobeAltIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
                  <p className="text-sm text-gray-600">Legal and regulatory details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ABN Number</label>
                  <input
                    type="text"
                    value={companyProfile.abn}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, abn: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={companyProfile.abn ? "" : "ABN 12 345 678 901"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={companyProfile.website}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, website: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={companyProfile.website ? "" : "https://yourcompany.com"}
                  />
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <PhoneIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Contact Details</h3>
                  <p className="text-sm text-gray-600">How customers can reach you</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4" />
                      Business Address
                    </div>
                  </label>
                  <textarea
                    value={companyProfile.address}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={companyProfile.address ? "" : "Street address, city, state, postal code"}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="w-4 h-4" />
                        Phone Number
                      </div>
                    </label>
                    <input
                      type="tel"
                      value={companyProfile.phone}
                      onChange={(e) => setCompanyProfile({ ...companyProfile, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={companyProfile.phone ? "" : "+61 2 1234 5678"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <EnvelopeIcon className="w-4 h-4" />
                        Email Address
                      </div>
                    </label>
                    <input
                      type="email"
                      value={companyProfile.email}
                      onChange={(e) => setCompanyProfile({ ...companyProfile, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={companyProfile.email ? "" : "admin@yourcompany.com"}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Success Message */}
        {saving && (
          <div className="fixed bottom-8 right-8 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving changes...
            </div>
          </div>
        )}

        {/* Success Notification */}
        {showSuccessMessage && (
          <div className="fixed bottom-8 right-8 transform transition-all duration-500 ease-out animate-in slide-in-from-right">
            <div className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
              <CheckIcon className="w-5 h-5" />
              <span className="font-medium">Company profile saved successfully!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyProfilePage;