import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { MainDashboard } from '../dashboard/MainDashboard';
import { RoleBasedDashboard } from '../dashboard/RoleBasedDashboard';
import AdminDashboard from '../dashboard/AdminDashboard';

interface OnboardingStatus {
  onboardingCompleted: boolean;
  setupWizardCompleted: boolean;
  currentStep: number;
  targetMarket: string;
  hasBasicInfo: boolean;
}

export function DashboardRouter() {
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use relative URLs to leverage Vite proxy in development
  const API_URL = import.meta.env.PROD ? (import.meta.env.VITE_API_URL || 'http://localhost:5001') : '';

  useEffect(() => {
    // Check if this is an employee first - immediate redirect
    const employeeSession = localStorage.getItem('employee-session');
    if (employeeSession) {
      console.log('DashboardRouter: Employee detected, redirecting to employee dashboard');
      window.location.href = '/employee-dashboard';
      return;
    }
    
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        // No token found, redirect to login instead of throwing error
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return;
      }

      const response = await fetch(`${API_URL}/api/onboarding/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Clear expired token and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return;
        }
        throw new Error(`Failed to fetch onboarding status: ${response.status}`);
      }

      const status = await response.json();
      // Development override: mark onboarding as completed
      const modifiedStatus = {
        ...status,
        onboardingCompleted: true,
        setupWizardCompleted: true
      };
      setOnboardingStatus(modifiedStatus);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to check onboarding status';
      
      // If authentication failed or no access token, clear tokens and redirect to login
      if (errorMessage.includes('Authentication failed') || errorMessage.includes('No access token')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return;
      }
      
      // For network errors, provide a more helpful message
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        setError('Unable to connect to server. Please check your internet connection and try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!onboardingStatus) {
    return <Navigate to="/login" replace />;
  }

  // Smart routing logic based on onboarding status
  if (!onboardingStatus.onboardingCompleted) {
    // User hasn't completed onboarding - redirect to onboarding wizard
    console.log('User needs onboarding, redirecting...');
    return <Navigate to="/onboarding" replace />;
  }

  // User has completed onboarding - show Role-Based Dashboard
  // This shows different dashboards based on user role (Admin/Manager/Employee)
  return <RoleBasedDashboard />;
}