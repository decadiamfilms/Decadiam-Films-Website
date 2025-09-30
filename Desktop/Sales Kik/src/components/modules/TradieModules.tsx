import React, { useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

export function TradieModules() {
  const [enabledModules, setEnabledModules] = useState(['quick-quote-builder']);

  const tradieModules = [
    {
      id: 'quick-quote-builder',
      name: 'Quick Quote Builder',
      description: 'Generate professional quotes in under two minutes using preloaded templates',
      monthlyPrice: 8,
      features: [
        'Mobile-first quote creation',
        'Product/service templates',
        'Photo attachments',
        'Instant SMS/email sending',
        'Customer signature capture'
      ],
      isCore: true
    },
    {
      id: 'invoicing-payments',
      name: 'Invoicing & Payments',
      description: 'Convert quotes to invoices instantly and accept payments on-site',
      monthlyPrice: 12,
      features: [
        'One-click quote to invoice',
        'On-site card payments',
        'Bank transfer integration',
        'Automated payment reminders',
        'Receipt generation'
      ]
    },
    {
      id: 'job-scheduling',
      name: 'Job Scheduling',
      description: 'Simple calendar and job tracking for mobile professionals',
      monthlyPrice: 10,
      features: [
        'Drag-and-drop calendar',
        'Color-coded job types',
        'Google Calendar sync',
        'Arrival photo timestamps',
        'Basic time tracking'
      ]
    },
    {
      id: 'customer-management',
      name: 'Customer Management',
      description: 'Store customer details, job history, and notes in one place',
      monthlyPrice: 6,
      features: [
        'Quick customer capture',
        'Business card scanning',
        'Job history tracking',
        'Customer tags and notes',
        'Contact search'
      ]
    },
    {
      id: 'material-tracking',
      name: 'Material & Cost Tracking',
      description: 'Track materials used per job and calculate profit in real time',
      monthlyPrice: 8,
      features: [
        'Material usage tracking',
        'Auto-add to invoices',
        'Cost logging (fuel, subcontractors)',
        'Real-time profit calculation',
        'Expense categorization'
      ]
    },
    {
      id: 'mobile-access',
      name: 'On-the-Go Access',
      description: 'Full mobile interface with offline mode for remote work sites',
      monthlyPrice: 5,
      features: [
        'Mobile-optimized interface',
        'Offline mode capability',
        'Auto-sync when online',
        'Photo/signature capture',
        'GPS location tracking'
      ]
    },
    {
      id: 'simple-reports',
      name: 'Simple Reports',
      description: 'Weekly and monthly summaries of income, expenses, and payments',
      monthlyPrice: 5,
      features: [
        'Income vs expenses',
        'Outstanding payments',
        'Monthly summaries',
        'Job type filtering',
        'PDF export'
      ]
    }
  ];

  const totalMonthly = enabledModules.reduce((sum, moduleId) => {
    const module = tradieModules.find(m => m.id === moduleId);
    return sum + (module?.monthlyPrice || 0);
  }, 0);

  const handleToggleModule = (moduleId: string) => {
    if (moduleId === 'quick-quote-builder') return; // Core module can't be disabled
    
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
            <h1 className="text-3xl font-bold text-gray-900">Tradie Modules</h1>
            <p className="text-gray-600 mt-1">Simple, mobile-first tools for on-the-go professionals</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Monthly Total</div>
            <div className="text-3xl font-bold text-gray-900">${totalMonthly}</div>
            <div className="text-sm text-blue-600">14 days trial remaining</div>
          </div>
        </div>
      </div>

      {/* Plan Benefits */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Tradie Plan Benefits</h2>
            <p className="text-gray-600">Designed specifically for mobile professionals who need fast, simple tools</p>
            <ul className="mt-3 text-sm text-gray-700 space-y-1">
              <li>• Mobile-first design for on-site use</li>
              <li>• Offline capability for remote locations</li>
              <li>• Quick setup - get quoting in minutes</li>
              <li>• Simple pricing - no complex features you don't need</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tradieModules.map((module) => {
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
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mr-2">
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
                    Open {module.name}
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

      {/* Help Section */}
      <div className="mt-12 bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Perfect for Tradies</h3>
        <p className="text-gray-600 text-sm mb-4">
          These modules are specifically designed for mobile professionals. No complex features you don't need - just fast, simple tools that work on-site.
        </p>
        <div className="flex gap-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Watch Demo
          </button>
          <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}

export default TradieModules;