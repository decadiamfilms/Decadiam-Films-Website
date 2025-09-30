import React, { useState } from 'react';
import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';

export function SmallBusinessModules() {
  const [enabledModules, setEnabledModules] = useState(['advanced-quotes']);
  const [company, setCompany] = useState<any>({ industryType: 'Glass' }); // Mock data for demo

  const smeModules = [
    {
      id: 'advanced-quotes',
      name: 'Advanced Quote Workflows',
      description: 'Multi-step quotes with approvals, versions, and collaboration',
      monthlyPrice: 18,
      features: [
        'Quote versioning & history',
        'Approval workflows',
        'Team collaboration',
        'Custom templates',
        'Quote analytics',
        'Bulk quote generation'
      ],
      isCore: true
    },
    {
      id: 'product-catalog',
      name: 'Advanced Product Catalog',
      description: 'Comprehensive product management with SKUs, variants, and pricing rules',
      monthlyPrice: 18,
      features: [
        'Unlimited SKUs',
        'Product variants & options',
        'Dynamic pricing rules',
        'Bulk CSV import/export',
        'Product categories & tags',
        'AI-powered SKU suggestions'
      ]
    },
    {
      id: 'multi-location-inventory',
      name: 'Multi-Location Inventory',
      description: 'Track stock across multiple warehouses and locations',
      monthlyPrice: 22,
      features: [
        'Multiple warehouse tracking',
        'Stock transfers',
        'Low stock alerts',
        'Barcode scanning',
        'Stock forecasting',
        'Inventory valuation reports'
      ]
    },
    {
      id: 'team-crm',
      name: 'Team CRM & Sales',
      description: 'Advanced CRM with sales pipeline, lead scoring, and team collaboration',
      monthlyPrice: 15,
      features: [
        'Sales pipeline management',
        'Lead scoring & routing',
        'Email integration',
        'Activity tracking',
        'Sales forecasting',
        'Team performance metrics'
      ]
    },
    {
      id: 'advanced-analytics',
      name: 'Advanced Analytics',
      description: 'Comprehensive business intelligence and reporting',
      monthlyPrice: 16,
      features: [
        'Custom dashboards',
        'Real-time metrics',
        'Predictive analytics',
        'Export to Excel/PDF',
        'Scheduled reports',
        'API data access'
      ]
    },
    {
      id: 'user-management',
      name: 'User Management',
      description: 'Advanced user permissions and access control',
      monthlyPrice: 8,
      features: [
        'Role-based permissions',
        'User groups',
        'Activity audit logs',
        'Single sign-on (SSO)',
        'Two-factor auth',
        'API key management'
      ]
    },
    {
      id: 'api-access',
      name: 'API & Integrations',
      description: 'Connect with other business tools and custom integrations',
      monthlyPrice: 10,
      features: [
        'REST API access',
        'Webhook support',
        'Zapier integration',
        'Custom integrations',
        'API documentation',
        'Rate limiting controls'
      ]
    }
  ];

  const totalMonthly = enabledModules.reduce((sum, moduleId) => {
    const module = smeModules.find(m => m.id === moduleId);
    return sum + (module?.monthlyPrice || 0);
  }, 0);

  const handleToggleModule = (moduleId: string) => {
    if (moduleId === 'advanced-quotes') return; // Core module can't be disabled
    
    if (enabledModules.includes(moduleId)) {
      setEnabledModules(enabledModules.filter(id => id !== moduleId));
    } else {
      setEnabledModules([...enabledModules, moduleId]);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <img src="/saleskik-logo.png" alt="SalesKik" className="h-10 w-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Small Business Modules</h1>
            <p className="text-gray-600 mt-1">Advanced features for growing teams and businesses</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Monthly Total</div>
            <div className="text-3xl font-bold text-gray-900">${totalMonthly}</div>
            <div className="text-sm text-blue-600">14 days trial remaining</div>
          </div>
        </div>
      </div>

      {/* Plan Benefits */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Small Business Plan Benefits</h2>
            <p className="text-gray-600">Comprehensive tools for teams that need advanced features and integrations</p>
            <ul className="mt-3 text-sm text-gray-700 space-y-1">
              <li>• Advanced workflows and approvals</li>
              <li>• Multi-location support</li>
              <li>• Team collaboration features</li>
              <li>• API access and integrations</li>
              <li>• Industry-specific modules available</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {smeModules.map((module) => {
          const isEnabled = enabledModules.includes(module.id);
          
          return (
            <div key={module.id} className={`bg-white border-2 rounded-xl p-6 transition-all ${
              isEnabled 
                ? 'border-green-200 shadow-lg' 
                : 'border-gray-200 hover:shadow-md'
            }`}>
              {/* Status Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {module.isCore && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                      Core
                    </span>
                  )}
                  {isEnabled && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">${module.monthlyPrice}</div>
                  <div className="text-xs text-gray-500">/month</div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{module.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{module.description}</p>

              <div className="space-y-2 mb-6">
                {module.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-700">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>

              {isEnabled ? (
                <div className="space-y-2">
                  <a 
                    href={`/${module.id.replace('-', '')}`}
                    className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors text-center block"
                  >
                    Open {module.name.split(' ')[0]}
                  </a>
                  {!module.isCore && (
                    <button
                      onClick={() => handleToggleModule(module.id)}
                      className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Disable Module
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleToggleModule(module.id)}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Start 14-Day Trial
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Industry Specific Module */}
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
                  Advanced features for glass manufacturers and suppliers
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
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                    Toughening & laminating options
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                    Cut optimization algorithms
                  </div>
                </div>
              </div>
              <div className="text-right ml-6">
                <div className="text-3xl font-bold text-gray-900">$35</div>
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
      <div className="mt-12 bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Enterprise Features</h3>
        <p className="text-gray-600 text-sm mb-4">
          These modules provide enterprise-grade features for growing businesses. Need help choosing the right setup?
        </p>
        <div className="flex gap-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Schedule Demo
          </button>
          <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  );
}

export default SmallBusinessModules;