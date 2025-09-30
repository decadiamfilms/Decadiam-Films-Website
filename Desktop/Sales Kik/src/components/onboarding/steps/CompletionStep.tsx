import React, { useState } from 'react';
import { CheckCircleIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

interface StepProps {
  data: any;
  onChange: (data: any) => void;
}

interface ModuleDetail {
  id: string;
  name: string;
  price: number;
}

export function CompletionStep({ data, onChange }: StepProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  
  // Get recommended modules based on business type and industry
  const getRecommendedModules = (): string[] => {
    const baseModules = ['core-system'];
    
    if (data.targetMarket === 'TRADIES') {
      if (data.industryType?.includes('Glass')) {
        return [...baseModules, 'product-catalog', 'job-scheduling'];
      }
      return [...baseModules, 'product-catalog', 'job-scheduling', 'simple-reports'];
    } else {
      if (data.industryType?.includes('Glass')) {
        return [...baseModules, 'product-catalog', 'inventory', 'glass-industry'];
      }
      return [...baseModules, 'product-catalog', 'inventory', 'crm-sales'];
    }
  };

  const getModuleDetails = (moduleIds: string[], targetMarket: string): ModuleDetail[] => {
    const tradiesPricing: { [key: string]: ModuleDetail } = {
      'core-system': { id: 'core-system', name: 'Core System', price: 15 },
      'product-catalog': { id: 'product-catalog', name: 'Product Catalog', price: 8 },
      'job-scheduling': { id: 'job-scheduling', name: 'Job Scheduling', price: 10 },
      'simple-reports': { id: 'simple-reports', name: 'Simple Reports', price: 6 },
      'glass-industry': { id: 'glass-industry', name: 'Glass Industry Pack', price: 12 }
    };

    const smePricing: { [key: string]: ModuleDetail } = {
      'core-system': { id: 'core-system', name: 'Core System', price: 25 },
      'product-catalog': { id: 'product-catalog', name: 'Product Catalog', price: 18 },
      'inventory': { id: 'inventory', name: 'Inventory Management', price: 22 },
      'crm-sales': { id: 'crm-sales', name: 'CRM & Sales', price: 20 },
      'glass-industry': { id: 'glass-industry', name: 'Glass Industry Pack', price: 25 }
    };

    const pricing = targetMarket === 'TRADIES' ? tradiesPricing : smePricing;
    return moduleIds.map(id => pricing[id] || { id, name: id, price: 0 });
  };

  const recommendedModules = getRecommendedModules();
  const moduleDetails = getModuleDetails(recommendedModules, data.targetMarket);
  const monthlyTotal = moduleDetails.reduce((sum, module) => sum + module.price, 0);

  const completeSetup = async () => {
    setIsCompleting(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      
      // Send all onboarding data including recommended modules
      const response = await fetch(`${API_URL}/api/onboarding/complete`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          ...data,
          selectedModules: recommendedModules
        })
      });

      if (!response.ok) {
        throw new Error('Failed to complete setup');
      }
      
      // Redirect to dashboard (not back to module marketplace!)
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Setup failed:', error);
      alert('Failed to complete setup. Please try again.');
      setIsCompleting(false);
    }
  };

  return (
    <div className="text-center space-y-8">
      <div>
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">You're All Set!</h2>
        <p className="text-gray-600 text-lg">
          Based on your {data.targetMarket === 'TRADIES' ? 'tradie' : 'business'} profile, 
          we've selected the perfect modules to get you started.
        </p>
      </div>

      {/* Recommended Setup */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md mx-auto">
        <h3 className="font-semibold text-gray-900 mb-4">
          Your {data.targetMarket === 'TRADIES' ? 'Tradie' : 'Business'} Setup
        </h3>
        
        <div className="space-y-3 text-left">
          {moduleDetails.map((module) => (
            <div key={module.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-700">{module.name}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">${module.price}/mo</span>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-100 mt-4 pt-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">Monthly Total:</span>
            <span className="text-xl font-bold text-amber-600">${monthlyTotal}/month</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">14-day free trial • Cancel anytime</p>
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-lg mx-auto">
        <h4 className="font-medium text-amber-900 mb-2">What happens next?</h4>
        <ul className="text-sm text-amber-800 space-y-1 text-left">
          <li>✓ Your 14-day free trial starts immediately</li>
          <li>✓ We'll set up your {data.targetMarket === 'TRADIES' ? 'mobile workspace' : 'business dashboard'}</li>
          <li>✓ You can add or remove modules anytime</li>
          <li>✓ Full setup takes under 5 minutes</li>
        </ul>
      </div>

      <button
        onClick={completeSetup}
        disabled={isCompleting}
        className="bg-amber-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
      >
        {isCompleting ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Setting up your workspace...
          </>
        ) : (
          <>
            <RocketLaunchIcon className="w-5 h-5 mr-2" />
            Complete Setup & Start Trial
          </>
        )}
      </button>
    </div>
  );
}