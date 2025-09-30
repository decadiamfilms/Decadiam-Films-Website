import React from 'react';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ProductList } from './ProductList';

function ModuleUpgradePrompt({ 
  moduleId, 
  moduleName,
  description 
}: { 
  moduleId: string;
  moduleName: string;
  description: string;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{moduleName} Required</h2>
        <p className="text-gray-600 mb-8">{description}</p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">What's included:</h3>
          <ul className="text-sm text-blue-800 space-y-1 text-left">
            <li>• SKU management with AI suggestions</li>
            <li>• Multi-level categories</li>
            <li>• Bulk CSV upload</li>
            <li>• Multiple price lists</li>
            <li>• Formula pricing</li>
            <li>• Package/kit builder</li>
          </ul>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={() => window.location.href = '/modules'}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Start 14-Day Free Trial
          </button>
          <button 
            onClick={() => window.location.href = '/modules'}
            className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            View All Modules
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-4">
          No contract • Cancel anytime • Full access during trial
        </p>
      </div>
    </div>
  );
}

export function ProtectedProductList() {
  const { hasAccess, isTrialActive, trialDaysLeft } = useModuleAccess('product-catalog');
  
  if (!hasAccess && !isTrialActive) {
    return <ModuleUpgradePrompt 
      moduleId="product-catalog" 
      moduleName="Product Catalog"
      description="Manage your product catalog with advanced features like SKU management, bulk upload, and pricing tiers."
    />;
  }
  
  return (
    <>
      {isTrialActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 m-6 mb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <span className="font-medium text-amber-900">Product Catalog Trial Active</span>
                <span className="text-amber-700 ml-2">{trialDaysLeft} days remaining</span>
              </div>
            </div>
            <button 
              onClick={() => window.location.href = '/modules'}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              Subscribe Now
            </button>
          </div>
        </div>
      )}
      <ProductList />
    </>
  );
}