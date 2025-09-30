import React from 'react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface ModuleSubscription {
  isActive: boolean;
  isExpired: boolean;
  isTrialing?: boolean;
  trialDaysRemaining?: number;
  status: string;
  moduleId: string;
  moduleName: string;
  monthlyAmount: number;
  nextBillingDate?: string;
}

interface GlassModuleAccess {
  hasAccess: boolean;
  isTrialing: boolean;
  daysRemaining?: number;
  subscription?: ModuleSubscription;
  isLoading: boolean;
  error?: string;
}

export function useGlassModuleAccess(): GlassModuleAccess {
  // For development - always grant access to Glass Industry Module
  const isDevelopment = window.location.hostname === 'localhost';
  
  const { data: subscription, isLoading, error } = useQuery<ModuleSubscription>({
    queryKey: ['moduleSubscription', 'GLASS_INDUSTRY'],
    queryFn: async () => {
      // For development, return mock active subscription
      if (isDevelopment) {
        return {
          isActive: true,
          isExpired: false,
          isTrialing: false,
          trialDaysRemaining: 0,
          status: 'ACTIVE',
          moduleId: 'GLASS_INDUSTRY',
          moduleName: 'Glass Industry Module',
          monthlyAmount: 35.00,
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
      }

      const response = await fetch('/api/modules/subscription-status?moduleId=GLASS_INDUSTRY', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch module subscription status');
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Reduced retries for development
    enabled: true
  });

  return {
    hasAccess: subscription?.isActive && !subscription?.isExpired,
    isTrialing: subscription?.isTrialing || false,
    daysRemaining: subscription?.trialDaysRemaining,
    subscription,
    isLoading,
    error: error?.message
  };
}

interface ProtectedGlassComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export function ProtectedGlassComponent({ 
  children, 
  fallback, 
  showUpgradePrompt = true 
}: ProtectedGlassComponentProps) {
  const { hasAccess, isTrialing, daysRemaining, isLoading, error } = useGlassModuleAccess();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Checking module access...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
        <div className="text-red-600 mb-2">⚠️ Error checking module access</div>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!hasAccess && !isTrialing) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgradePrompt) {
      return <GlassModuleUpgradePrompt />;
    }

    return null;
  }

  if (isTrialing && daysRemaining !== undefined && daysRemaining <= 7) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-amber-600">⏰</span>
            <span className="text-amber-800 font-medium">
              Glass Module Trial: {daysRemaining} days remaining
            </span>
          </div>
          <p className="text-amber-700 text-sm mt-1">
            Upgrade to Glass Industry Module ($35/month) to continue using glass features after your trial ends.
          </p>
          <button 
            className="mt-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 transition-colors"
            onClick={() => window.open('/modules', '_blank')}
          >
            Upgrade Now
          </button>
        </div>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}

function GlassModuleUpgradePrompt() {
  const handleUpgrade = () => {
    // Open modules page in new tab
    window.open('/modules', '_blank');
  };

  const handleLearnMore = () => {
    // Scroll to glass features or open documentation
    window.open('https://docs.saleskik.com/modules/glass-industry', '_blank');
  };

  return (
    <div className="text-center p-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-dashed border-blue-300">
      {/* Glass Icon */}
      <div className="text-8xl mb-6">🪟</div>
      
      {/* Title */}
      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        Glass Industry Module Required
      </h3>
      
      {/* Description */}
      <p className="text-gray-600 mb-6 max-w-lg mx-auto leading-relaxed">
        Access professional glass quoting tools with real-time pricing, 
        10-step guided workflow, and comprehensive processing options.
      </p>
      
      {/* Features List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto mb-8 text-left">
        <div className="flex items-center space-x-2">
          <span className="text-green-500">✓</span>
          <span className="text-sm text-gray-700">Live price calculation</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-green-500">✓</span>
          <span className="text-sm text-gray-700">Customer-specific pricing</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-green-500">✓</span>
          <span className="text-sm text-gray-700">Processing options (edgework, holes)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-green-500">✓</span>
          <span className="text-sm text-gray-700">Template system</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-green-500">✓</span>
          <span className="text-sm text-gray-700">Photo upload support</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-green-500">✓</span>
          <span className="text-sm text-gray-700">Professional quote output</span>
        </div>
      </div>
      
      {/* Pricing */}
      <div className="bg-white rounded-lg p-6 max-w-sm mx-auto mb-6 shadow-sm border">
        <div className="text-3xl font-bold text-blue-600 mb-1">$35</div>
        <div className="text-gray-500 text-sm mb-2">per month</div>
        <div className="text-xs text-gray-400">No setup fees • Cancel anytime</div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
        <button 
          onClick={handleUpgrade}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
        >
          <span>🚀</span>
          <span>Start Free Trial</span>
        </button>
        <button 
          onClick={handleLearnMore}
          className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Learn More
        </button>
      </div>
      
      {/* Fine Print */}
      <p className="text-xs text-gray-400 mt-6">
        7-day free trial • No credit card required to start
      </p>
    </div>
  );
}