import React, { useState, useEffect } from 'react';
import { CreditCardIcon, CheckCircleIcon, ClockIcon, StarIcon } from '@heroicons/react/24/outline';
import { ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface AvailableModule {
  id: string;
  name: string;
  description: string;
  category: string;
  monthlyPrice: number;
  setupFee?: number;
  targetMarket: 'TRADIES' | 'SME' | 'BOTH';
  features: string[];
  dependencies: string[];
  isPopular: boolean;
  screenshots: string[];
  userHasAccess: boolean;
  subscriptionStatus?: 'TRIAL' | 'ACTIVE' | 'EXPIRED';
  trialDaysLeft?: number;
}

export function ModuleMarketplace() {
  const [selectedMarket, setSelectedMarket] = useState<'TRADIES' | 'SME'>('TRADIES');
  const [modules, setModules] = useState<AvailableModule[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    console.log('ModuleMarketplace: Fetching data for market:', selectedMarket);
    setLoading(true);
    setError(null);
    
    // Fetch available modules and user profile
    Promise.all([
      fetch(`${API_URL}/api/modules?targetMarket=${selectedMarket}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      }).then(r => r.json()),
      fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      }).then(r => r.json())
    ]).then(([modulesData, profileData]) => {
      console.log('Modules data:', modulesData);
      console.log('Profile data:', profileData);
      setModules(modulesData);
      setUserProfile(profileData);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching data:', err);
      setError(err.message);
      setLoading(false);
    });
  }, [selectedMarket]);

  const handleEnableModule = async (moduleId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/modules/${moduleId}/enable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      
      if (result.success) {
        // Refresh modules list
        const updatedModules = await fetch(`/api/modules?targetMarket=${selectedMarket}`).then(r => r.json());
        setModules(updatedModules);
      }
    } catch (error) {
      console.error('Failed to enable module:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Module Marketplace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Modules</h2>
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">SalesKik Modules</h1>
                <p className="text-gray-600 mt-1">Choose the features you need. Cancel anytime.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Monthly Total</div>
                  <div className="text-2xl font-bold text-gray-900">$47.00</div>
                </div>
                <button className="bg-amber-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors">
                  Manage Billing
                </button>
              </div>
            </div>
            
            {/* Market Selector */}
            <div className="mt-6">
              <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                <button
                  onClick={() => setSelectedMarket('TRADIES')}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    selectedMarket === 'TRADIES'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🔧 Tradies & Sole Traders
                </button>
                <button
                  onClick={() => setSelectedMarket('SME')}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    selectedMarket === 'SME'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🏢 Small Businesses
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {selectedMarket === 'TRADIES' 
                  ? 'Simple, mobile-first tools for on-the-go professionals'
                  : 'Comprehensive business management with advanced features'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Modules Status Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClockIcon className="w-5 h-5 text-blue-600" />
              <div>
                <span className="font-medium text-blue-900">Free Trial Active</span>
                <span className="text-blue-700 ml-2">14 days remaining</span>
              </div>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Start Subscription
            </button>
          </div>
        </div>
      </div>

      {/* Module Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Core Module - Always Required */}
          <div className="bg-white rounded-xl border-2 border-amber-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-500 text-white px-3 py-1 text-xs font-medium">
              REQUIRED
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <ShieldCheckIcon className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Core System</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      ${selectedMarket === 'TRADIES' ? '15' : '25'}
                    </span>
                    <span className="text-gray-500 text-sm">/month</span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4 text-sm">
                Essential features for running your business
              </p>
              
              <ul className="space-y-2 mb-6">
                {(selectedMarket === 'TRADIES' ? [
                  'Quick quote builder',
                  'Simple invoicing',
                  'Basic customer management',
                  'Mobile access'
                ] : [
                  'Advanced quote workflows',
                  'Full customer CRM',
                  'Document generation',
                  'User management',
                  'Basic reporting'
                ]).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircleIcon className="w-3 h-3 mr-1" />
                  Active
                </span>
                <span className="text-xs text-gray-500">Trial: 14 days left</span>
              </div>
            </div>
          </div>

          {/* Products Module - THE MAIN IMPLEMENTATION */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Product Catalog</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      ${selectedMarket === 'TRADIES' ? '8' : '18'}
                    </span>
                    <span className="text-gray-500 text-sm">/month</span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4 text-sm">
                {selectedMarket === 'TRADIES' 
                  ? 'Simple product list with pricing'
                  : 'Advanced catalog with SKUs, categories, and bulk upload'
                }
              </p>
              
              <ul className="space-y-2 mb-6">
                {(selectedMarket === 'TRADIES' ? [
                  'Basic product list',
                  'Cost & sell pricing',
                  'Simple categories',
                  'Mobile friendly'
                ] : [
                  'SKU management with AI suggestions',
                  'Multi-level categories',
                  'Bulk CSV upload',
                  'Multiple price lists',
                  'Formula pricing',
                  'Package/kit builder'
                ]).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => handleEnableModule('product-catalog')}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Start 14-Day Trial
              </button>
            </div>
          </div>

          {/* Inventory Module */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Inventory</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      ${selectedMarket === 'TRADIES' ? '12' : '22'}
                    </span>
                    <span className="text-gray-500 text-sm">/month</span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4 text-sm">
                {selectedMarket === 'TRADIES' 
                  ? 'Track stock across 3 locations (warehouse + 2 trucks)'
                  : 'Multi-location inventory with advanced tracking'
                }
              </p>
              
              <div className="mb-4">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Requires: Product Catalog
                </span>
              </div>
              
              <ul className="space-y-2 mb-6">
                {(selectedMarket === 'TRADIES' ? [
                  'Stock levels tracking',
                  'Up to 3 locations',
                  'Simple transfers',
                  'Basic adjustments'
                ] : [
                  'Multi-location management',
                  'Stock transfers & adjustments',
                  'Cycle counting',
                  'Purchase order receiving',
                  'Low stock alerts',
                  'Backorder management'
                ]).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Start 14-Day Trial
              </button>
            </div>
          </div>

          {/* Job Scheduling */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Job Scheduling</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      ${selectedMarket === 'TRADIES' ? '10' : '20'}
                    </span>
                    <span className="text-gray-500 text-sm">/month</span>
                  </div>
                </div>
              </div>
              
              {selectedMarket === 'TRADIES' && (
                <div className="mb-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <StarIcon className="w-3 h-3 mr-1" />
                    Popular for Tradies
                  </span>
                </div>
              )}
              
              <p className="text-gray-600 mb-4 text-sm">
                {selectedMarket === 'TRADIES' 
                  ? 'Simple calendar and job tracking for solo work'
                  : 'Advanced scheduling with team coordination'
                }
              </p>
              
              <ul className="space-y-2 mb-6">
                {(selectedMarket === 'TRADIES' ? [
                  'Simple job calendar',
                  'Arrival photo timestamps',
                  'Basic time tracking',
                  'Customer sign-off',
                  'Material usage tracking'
                ] : [
                  'Multi-user scheduling',
                  'Recurring jobs',
                  'Job templates',
                  'Time tracking & timesheets',
                  'Customer notifications',
                  'GPS tracking add-on'
                ]).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors">
                Start 14-Day Trial
              </button>
            </div>
          </div>

          {/* Glass Industry Module - Only for SME */}
          {selectedMarket === 'SME' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="absolute top-0 right-0 bg-purple-500 text-white px-3 py-1 text-xs font-medium">
                INDUSTRY SPECIFIC
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <SparklesIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Glass Industry</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">$35</span>
                      <span className="text-gray-500 text-sm">/month</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4 text-sm">
                  Specialized tools for glass manufacturing and installation
                </p>
                
                <div className="mb-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Requires: Product Catalog
                  </span>
                </div>
                
                <ul className="space-y-2 mb-6">
                  {[
                    'Square meter pricing engine',
                    'Glass types & thicknesses',
                    'Processing (holes, cutouts, edges)',
                    'Coating application (bulk)',
                    'Custom glass ordering',
                    'Technical specifications'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                  Start 14-Day Trial
                </button>
              </div>
            </div>
          )}

          {/* Reporting Module */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedMarket === 'TRADIES' ? 'Simple Reports' : 'Advanced Analytics'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      ${selectedMarket === 'TRADIES' ? '6' : '16'}
                    </span>
                    <span className="text-gray-500 text-sm">/month</span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4 text-sm">
                {selectedMarket === 'TRADIES' 
                  ? 'Weekly/monthly summaries of income and expenses'
                  : 'Comprehensive business analytics and custom reports'
                }
              </p>
              
              <ul className="space-y-2 mb-6">
                {(selectedMarket === 'TRADIES' ? [
                  'Income vs expenses',
                  'Outstanding payments',
                  'Basic profit tracking',
                  'Monthly summaries'
                ] : [
                  'Sales performance analysis',
                  'Customer analytics',
                  'Inventory reports',
                  'Financial dashboards',
                  'Scheduled reports',
                  'Custom report builder'
                ]).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Start 14-Day Trial
              </button>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to get started?</h2>
            <p className="text-gray-600 mb-6">
              Start with our core system and add modules as you grow. Cancel anytime.
            </p>
            <div className="flex justify-center gap-4">
              <button className="bg-amber-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors">
                Start 14-Day Free Trial
              </button>
              <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}