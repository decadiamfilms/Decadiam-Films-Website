import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface StepProps {
  data: any;
  onChange: (data: any) => void;
}

interface Module {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  features: string[];
  isPopular?: boolean;
  isRequired?: boolean;
}

export function ModuleSelectionStep({ data, onChange }: StepProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    // Get modules based on target market
    const marketModules = getModulesForMarket(data.targetMarket);
    setModules(marketModules);
    
    // Calculate total price
    const total = data.selectedModules.reduce((sum: number, moduleId: string) => {
      const module = marketModules.find(m => m.id === moduleId);
      return sum + (module ? module.monthlyPrice : 0);
    }, 0);
    setTotalPrice(total);
  }, [data.targetMarket, data.selectedModules]);

  const getModulesForMarket = (targetMarket: string): Module[] => {
    if (targetMarket === 'TRADIES') {
      return [
        {
          id: 'core-system',
          name: 'Core System',
          description: 'Essential tools for running your business',
          monthlyPrice: 15,
          features: ['Quick quotes', 'Simple invoicing', 'Customer management', 'Mobile access'],
          isRequired: true
        },
        {
          id: 'product-catalog',
          name: 'Product Catalog',
          description: 'Manage your products and pricing',
          monthlyPrice: 8,
          features: ['Product database', 'Simple pricing', 'Stock tracking', 'Categories'],
          isPopular: true
        },
        {
          id: 'job-scheduling',
          name: 'Job Scheduling',
          description: 'Schedule and track your jobs',
          monthlyPrice: 10,
          features: ['Job calendar', 'Time tracking', 'Photo timestamps', 'Customer sign-off']
        },
        {
          id: 'payment-processing',
          name: 'Payment Processing',
          description: 'Accept payments on-site',
          monthlyPrice: 12,
          features: ['Card payments', 'Payment links', 'Instant receipts', 'Reconciliation']
        }
      ];
    } else {
      // SME modules
      return [
        {
          id: 'core-system',
          name: 'Core Business',
          description: 'Complete business management platform',
          monthlyPrice: 25,
          features: ['Advanced workflows', 'Team collaboration', 'Reporting', 'API access'],
          isRequired: true
        },
        {
          id: 'product-catalog-sme',
          name: 'Advanced Catalog',
          description: 'Comprehensive product management',
          monthlyPrice: 18,
          features: ['Multi-level categories', 'Bulk uploads', 'Price lists', 'Package builder'],
          isPopular: true
        },
        {
          id: 'inventory-management',
          name: 'Inventory Management',
          description: 'Track stock across locations',
          monthlyPrice: 20,
          features: ['Multi-location stock', 'Purchase orders', 'Stock alerts', 'Barcode scanning']
        },
        {
          id: 'crm-advanced',
          name: 'CRM & Sales',
          description: 'Advanced customer relationship management',
          monthlyPrice: 15,
          features: ['Lead tracking', 'Sales pipeline', 'Customer history', 'Sales reporting']
        }
      ];
    }
  };

  const toggleModule = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (module?.isRequired) return; // Can't toggle required modules
    
    const newSelected = data.selectedModules.includes(moduleId)
      ? data.selectedModules.filter((id: string) => id !== moduleId)
      : [...data.selectedModules, moduleId];
    
    onChange({ ...data, selectedModules: newSelected });
  };

  const isModuleSelected = (moduleId: string) => {
    return data.selectedModules.includes(moduleId);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {data.targetMarket === 'TRADIES' ? 'Simple Tools for Tradies' : 'Powerful Business Features'}
        </h3>
        <p className="text-gray-600">
          Start with our recommended modules. You can add more anytime.
        </p>
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="text-green-800 font-medium">
            🎉 14-day free trial on all modules • Cancel anytime
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((module) => (
          <div
            key={module.id}
            className={`relative p-6 border rounded-xl cursor-pointer transition-all ${
              isModuleSelected(module.id)
                ? 'border-amber-500 bg-amber-50 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            } ${module.isRequired ? 'cursor-not-allowed opacity-75' : ''}`}
            onClick={() => !module.isRequired && toggleModule(module.id)}
          >
            {/* Popular Badge */}
            {module.isPopular && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                Popular
              </span>
            )}

            {/* Selection Indicator */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                  isModuleSelected(module.id) 
                    ? 'border-amber-500 bg-amber-500' 
                    : 'border-gray-300'
                }`}>
                  {isModuleSelected(module.id) && (
                    <CheckCircleIcon className="w-3 h-3 text-white" />
                  )}
                </div>
                <h4 className="text-lg font-semibold text-gray-900">{module.name}</h4>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">${module.monthlyPrice}</p>
                <p className="text-sm text-gray-500">/month</p>
              </div>
            </div>

            <p className="text-gray-600 mb-4">{module.description}</p>

            {/* Features */}
            <ul className="space-y-2 mb-4">
              {module.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-gray-700">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            {/* Required Badge */}
            {module.isRequired && (
              <div className="flex items-center justify-center">
                <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  <ClockIcon className="w-3 h-3 mr-1" />
                  Required
                </span>
              </div>
            )}

            {/* Trial Information */}
            {!module.isRequired && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  14-day free trial • Cancel anytime
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pricing Summary */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Monthly Summary</h4>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">${totalPrice}</p>
            <p className="text-sm text-gray-500">per month</p>
          </div>
        </div>

        {/* Selected Modules List */}
        <div className="space-y-2">
          {data.selectedModules.map((moduleId: string) => {
            const module = modules.find(m => m.id === moduleId);
            if (!module) return null;
            
            return (
              <div key={moduleId} className="flex justify-between items-center py-2">
                <span className="text-gray-700">{module.name}</span>
                <span className="font-medium text-gray-900">${module.monthlyPrice}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-300">
          <div className="flex justify-between items-center font-semibold">
            <span className="text-gray-900">Total Monthly</span>
            <span className="text-2xl text-gray-900">${totalPrice}</span>
          </div>
          <p className="text-sm text-green-600 mt-2 text-center">
            ✨ First 14 days free • No setup fees • Cancel anytime
          </p>
        </div>
      </div>

      {/* Getting Started Message */}
      <div className="bg-amber-50 rounded-lg p-4">
        <h4 className="font-medium text-amber-900 mb-2">Ready to get started?</h4>
        <p className="text-sm text-amber-700">
          Click "Complete Setup" to create your account and start your free trial. 
          You'll have full access to all selected modules for 14 days.
        </p>
      </div>
    </div>
  );
}