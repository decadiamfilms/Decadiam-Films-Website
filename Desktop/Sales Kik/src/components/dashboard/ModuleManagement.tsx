import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../layout/UniversalNavigation';
import UniversalHeader from '../layout/UniversalHeader';
import { 
  CheckCircleIcon, 
  StarIcon,
  SparklesIcon,
  CubeIcon,
  ChartBarIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ArchiveBoxIcon,
  CreditCardIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

interface Module {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  features: string[];
  status?: 'TRIAL' | 'ACTIVE' | 'INACTIVE';
  trialEndsAt?: string;
  dependencies: string[];
  isPopular?: boolean;
  icon?: React.ComponentType<any>;
}

export function ModuleManagement() {
  const navigate = useNavigate();
  const [enabledModules, setEnabledModules] = useState<Module[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    fetchModules();
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/api/company`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCompany(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch company data:', error);
    }
  };

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // For now, using mock data since the backend isn't fully implemented
      const mockEnabledModules: Module[] = [
        {
          id: 'core-system',
          name: 'Core System',
          description: 'Essential features for quotes, orders, and invoices',
          monthlyPrice: company?.targetMarket === 'TRADIES' ? 15 : 25,
          features: ['Quotes', 'Orders', 'Invoices', 'Customer Management'],
          status: 'ACTIVE',
          dependencies: [],
          icon: CubeIcon
        },
        {
          id: 'product-catalog',
          name: 'Product Catalog',
          description: 'Manage your products and services',
          monthlyPrice: company?.targetMarket === 'TRADIES' ? 8 : 18,
          features: ['Product management', 'Categories', 'Pricing rules', 'Bulk import/export'],
          status: 'TRIAL',
          trialEndsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          dependencies: [],
          icon: ArchiveBoxIcon
        }
      ];

      const mockAvailableModules: Module[] = [
        {
          id: 'inventory',
          name: 'Inventory Management',
          description: 'Track stock levels and manage warehouses',
          monthlyPrice: company?.targetMarket === 'TRADIES' ? 12 : 22,
          features: ['Stock tracking', 'Multiple locations', 'Low stock alerts', 'Stock movements'],
          dependencies: ['product-catalog'],
          isPopular: true,
          icon: ArchiveBoxIcon
        },
        {
          id: 'job-scheduling',
          name: 'Job Scheduling',
          description: 'Schedule and track jobs efficiently',
          monthlyPrice: company?.targetMarket === 'TRADIES' ? 10 : 20,
          features: ['Calendar view', 'Team scheduling', 'Job tracking', 'Mobile app access'],
          dependencies: [],
          isPopular: true,
          icon: CalendarIcon
        },
        {
          id: 'reporting',
          name: 'Advanced Reports',
          description: 'Detailed analytics and business insights',
          monthlyPrice: company?.targetMarket === 'TRADIES' ? 6 : 16,
          features: ['Sales reports', 'Profit analysis', 'Customer insights', 'Export to Excel'],
          dependencies: [],
          icon: ChartBarIcon
        },
        {
          id: 'crm-sales',
          name: 'CRM & Sales',
          description: 'Manage leads and sales pipeline',
          monthlyPrice: company?.targetMarket === 'TRADIES' ? 15 : 25,
          features: ['Lead management', 'Sales pipeline', 'Follow-up reminders', 'Email integration'],
          dependencies: [],
          icon: UserGroupIcon
        }
      ];

      setEnabledModules(mockEnabledModules);
      setAvailableModules(mockAvailableModules);
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableModule = async (moduleId: string) => {
    try {
      // Add to enabled modules with trial status
      const module = availableModules.find(m => m.id === moduleId);
      if (module) {
        const newModule = {
          ...module,
          status: 'TRIAL' as const,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        };
        setEnabledModules([...enabledModules, newModule]);
        setAvailableModules(availableModules.filter(m => m.id !== moduleId));
      }
    } catch (error) {
      console.error('Failed to enable module:', error);
    }
  };

  const handleDisableModule = async (moduleId: string) => {
    if (confirm('Are you sure? You can re-enable this module anytime.')) {
      try {
        const module = enabledModules.find(m => m.id === moduleId);
        if (module) {
          const { status, trialEndsAt, ...cleanModule } = module;
          setAvailableModules([...availableModules, cleanModule]);
          setEnabledModules(enabledModules.filter(m => m.id !== moduleId));
        }
      } catch (error) {
        console.error('Failed to disable module:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading modules...</p>
        </div>
      </div>
    );
  }

  const totalMonthly = enabledModules.reduce((sum, mod) => sum + mod.monthlyPrice, 0);
  const trialDaysLeft = 14; // Calculate from actual trial start date

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Universal Navigation */}
      <UniversalNavigation 
        currentPage="modules" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      {/* Universal Header */}
      <UniversalHeader
        title="Manage Modules"
        subtitle="Add or remove features as your business grows"
        onMenuToggle={() => setShowSidebar(true)}
      />

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div></div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Monthly Total</div>
              <div className="text-3xl font-bold text-gray-900">${totalMonthly}</div>
              <div className="text-sm text-blue-600">{trialDaysLeft} days trial remaining</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Plan Overview */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {company?.targetMarket === 'TRADIES' ? '🔧 Tradies Plan' : '🏢 Small Business Plan'}
              </h2>
              <p className="text-gray-600">
                {company?.targetMarket === 'TRADIES' 
                  ? 'Mobile-first tools with simplified pricing'
                  : 'Advanced features for growing businesses'
                }
              </p>
            </div>
            <button
              onClick={() => navigate('/billing')}
              className="bg-amber-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-600 transition-colors"
            >
              Manage Billing
            </button>
          </div>
        </div>

        {/* Enabled Modules */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Active Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enabledModules.map((module) => (
              <div key={module.id} className="bg-white border-2 border-green-200 rounded-xl p-6 relative">
                {/* Active Badge */}
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircleIconSolid className="w-3 h-3 mr-1" />
                    {module.status === 'TRIAL' ? 'Trial' : 'Active'}
                  </span>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{module.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">${module.monthlyPrice}</span>
                    <span className="text-gray-500 text-sm">/month</span>
                    {module.status === 'TRIAL' && module.trialEndsAt && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                        {Math.ceil((new Date(module.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d left
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4">{module.description}</p>

                <div className="space-y-2 mb-6">
                  {module.features.slice(0, 3).map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-700">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                  {module.features.length > 3 && (
                    <p className="text-xs text-gray-500">+{module.features.length - 3} more features</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/${module.id.replace('-', '')}`)}
                    className="flex-1 bg-amber-500 text-white py-2 px-3 rounded-lg text-center text-sm font-medium hover:bg-amber-600 transition-colors"
                  >
                    Open {module.name.split(' ')[0]}
                  </button>
                  {module.id !== 'core-system' && (
                    <button
                      onClick={() => handleDisableModule(module.id)}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Available Modules */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Add More Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableModules.map((module) => (
              <div key={module.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col h-full">
                {module.isPopular && (
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      <StarIcon className="w-3 h-3 mr-1" />
                      Popular
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{module.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">${module.monthlyPrice}</span>
                    <span className="text-gray-500 text-sm">/month</span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4">{module.description}</p>

                {module.dependencies.length > 0 && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800">
                      <strong>Requires:</strong> {module.dependencies.map(dep => 
                        enabledModules.find(em => em.id === dep)?.name || dep
                      ).join(', ')}
                    </p>
                  </div>
                )}

                <div className="space-y-2 mb-6 flex-grow">
                  {module.features.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-700">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="mt-auto">
                  <button
                    onClick={() => handleEnableModule(module.id)}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    disabled={module.dependencies.some(dep => !enabledModules.find(em => em.id === dep))}
                  >
                    Start 14-Day Trial
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Industry Specific Modules */}
        {company?.industryType?.includes('Glass') && (
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Industry Specific</h2>
            <p className="text-gray-600 mb-6">Specialized modules for {company.industryType} businesses</p>
            
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <SparklesIcon className="w-6 h-6 text-purple-600 mr-2" />
                    <h3 className="text-xl font-semibold text-gray-900">Glass Industry Module</h3>
                    <span className="ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Industry Specific
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Square meter pricing, glass types, processing options, and coating management
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                    <div className="flex items-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                      Square meter pricing engine
                    </div>
                    <div className="flex items-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                      Glass types & thicknesses
                    </div>
                    <div className="flex items-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                      Processing (holes, cutouts, edges)
                    </div>
                    <div className="flex items-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                      Bulk coating application
                    </div>
                  </div>
                </div>
                <div className="text-right ml-6">
                  <div className="text-3xl font-bold text-gray-900">
                    ${company?.targetMarket === 'TRADIES' ? 20 : 35}
                  </div>
                  <div className="text-gray-500 text-sm">/month</div>
                  <button className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                    Add Glass Module
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Need Help Choosing?</h3>
          <p className="text-gray-600 text-sm mb-4">
            Not sure which modules you need? We can help you choose the right setup for your business.
          </p>
          <div className="flex gap-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Schedule Demo
            </button>
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}