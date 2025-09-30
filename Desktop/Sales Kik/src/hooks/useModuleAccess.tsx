import { useState, useEffect } from 'react';

interface ModuleAccess {
  hasAccess: boolean;
  isTrialActive: boolean;
  trialDaysLeft: number;
  subscriptionStatus: string;
  canUpgrade: boolean;
  targetMarket: 'TRADIES' | 'SME';
  moduleFeatures: string[];
}

export function useModuleAccess(moduleId: string): ModuleAccess {
  const [access, setAccess] = useState<ModuleAccess>({
    hasAccess: false,
    isTrialActive: false,
    trialDaysLeft: 0,
    subscriptionStatus: 'NONE',
    canUpgrade: true,
    targetMarket: 'TRADIES',
    moduleFeatures: []
  });

  useEffect(() => {
    // Check if user has access to this module
    fetch(`/api/modules/${moduleId}/access`)
      .then(res => res.json())
      .then(data => setAccess(data))
      .catch(() => {
        // Default to no access if API fails
        setAccess(prev => ({ ...prev, hasAccess: false }));
      });
  }, [moduleId]);

  return access;
}

// Protected wrapper component
export function ProtectedFeature({ 
  moduleId, 
  children, 
  fallback 
}: {
  moduleId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasAccess, isTrialActive } = useModuleAccess(moduleId);
  
  if (!hasAccess && !isTrialActive) {
    return fallback || <ModuleUpgradePrompt moduleId={moduleId} />;
  }
  
  return <>{children}</>;
}

// Module upgrade prompt component
function ModuleUpgradePrompt({ moduleId }: { moduleId: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-8V7a3 3 0 00-6 0v4a1 1 0 01-1 1H3a1 1 0 01-1-1V7a5 5 0 0110 0v4a1 1 0 001 1h2a1 1 0 011 1v6a1 1 0 01-1 1h-5z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Module Access Required</h2>
        <p className="text-gray-600 mb-6">
          You need to subscribe to the {moduleId.replace('-', ' ')} module to access this feature.
        </p>
        <div className="space-y-3">
          <button 
            onClick={() => window.location.href = '/modules'}
            className="w-full bg-amber-500 text-white py-2.5 rounded-lg font-medium hover:bg-amber-600 transition-colors"
          >
            View Module Marketplace
          </button>
          <button 
            onClick={() => window.location.href = '/modules'}
            className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Start Free Trial
          </button>
        </div>
      </div>
    </div>
  );
}