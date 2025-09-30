import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { UserIcon, EnvelopeIcon, RocketLaunchIcon, BuildingOfficeIcon, CubeIcon } from '@heroicons/react/24/solid';
import AccountCreationStep from './steps/AccountCreationStep';
import EmailVerificationStep from './steps/EmailVerificationStep';
import PlanSelectionStep from './steps/PlanSelectionStep';
import BusinessSetupStep from './steps/BusinessSetupStep';
import ProductSetupStep from './steps/ProductSetupStep';
import { CompletionStep } from './steps/CompletionStep';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
}

interface FormData {
  // Account Creation
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  emailVerified: boolean;
  
  // Plan Selection
  selectedPlan: string;
  industryType: string;
  teamSize: string;
  targetMarket: string;
  
  // Business Setup
  businessName: string;
  tradingName: string;
  website: string;
  abnAcn: string;
  gstEnabled: boolean;
  gstNumber: string;
  logoFile: File | null;
  logoPreview: string | null;
  locations: Array<{
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    postcode: string;
    phone?: string;
    isPrimary: boolean;
  }>;
  employees: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  }>;
  
  // Product Setup
  productSetupMethod: 'manual' | 'upload' | 'skip';
  sampleProducts: Array<{
    name: string;
    price: string;
    category: string;
  }>;
  uploadedFile: File | null;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "Create Account",
    description: "Email and password setup",
    icon: UserIcon,
    component: AccountCreationStep
  },
  {
    id: 2,
    title: "Verify Email",
    description: "Confirm your email address",
    icon: EnvelopeIcon,
    component: EmailVerificationStep
  },
  {
    id: 3,
    title: "Choose Plan",
    description: "Select your pricing plan",
    icon: RocketLaunchIcon,
    component: PlanSelectionStep
  },
  {
    id: 4,
    title: "Business Setup",
    description: "Company info, locations, and team",
    icon: BuildingOfficeIcon,
    component: BusinessSetupStep
  },
  {
    id: 5,
    title: "Product Setup",
    description: "Add your product catalog",
    icon: CubeIcon,
    component: ProductSetupStep
  },
  {
    id: 6,
    title: "Complete Setup",
    description: "You're ready to go!",
    icon: CheckCircleIcon,
    component: CompletionStep
  }
];

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    // Account Creation
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    emailVerified: false,
    
    // Plan Selection
    selectedPlan: '',
    industryType: '',
    teamSize: '',
    targetMarket: '',
    
    // Business Setup
    businessName: '',
    tradingName: '',
    website: '',
    abnAcn: '',
    gstEnabled: false,
    gstNumber: '',
    logoFile: null,
    logoPreview: null,
    locations: [
      {
        id: '1',
        name: 'Main Office',
        address: '',
        city: '',
        state: '',
        postcode: '',
        phone: '',
        isPrimary: true
      }
    ],
    employees: [],
    
    // Product Setup
    productSetupMethod: 'skip',
    sampleProducts: [],
    uploadedFile: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const currentStepData = ONBOARDING_STEPS.find(step => step.id === currentStep);
  const isLastStep = currentStep === ONBOARDING_STEPS.length;
  const isFirstStep = currentStep === 1;

  const handleNext = async () => {
    if (isLastStep) {
      await completeOnboarding();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/onboarding/complete`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }
      
      const result = await response.json();
      console.log('Onboarding completed:', result);
      
      // Redirect to module marketplace or dashboard based on selections
      if (formData.selectedModules.length > 1) {
        // User selected additional modules beyond core - go to modules for trial setup
        window.location.href = '/modules';
      } else {
        // Only core module selected - go directly to dashboard
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Onboarding failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete setup');
    } finally {
      setIsLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: // Account Creation
        return formData.firstName && formData.lastName && formData.email && 
               formData.password && formData.confirmPassword;
      case 2: // Email Verification
        return formData.emailVerified;
      case 3: // Plan Selection
        return formData.selectedPlan !== '';
      case 4: // Business Setup
        return formData.businessName; // Just need business name
      case 5: // Product Setup
        return true; // Product setup is optional
      case 6: // Completion
        return true; // Completion step is always valid
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Progress Header */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <img src="/saleskik-logo.png" alt="SalesKik" style={{ height: '130px', width: 'auto' }} className="mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to SalesKik</h1>
            <p className="text-gray-600">Complete your business setup in just a few minutes</p>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {ONBOARDING_STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    step.id < currentStep 
                      ? 'bg-green-500 text-white' 
                      : step.id === currentStep 
                        ? 'bg-amber-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step.id < currentStep ? (
                      <CheckCircleIcon className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <span className="text-xs text-gray-600 mt-2 text-center max-w-20">{step.title}</span>
                </div>
                {index < ONBOARDING_STEPS.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step.id < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentStepData?.title}</h2>
            <p className="text-gray-600">{currentStepData?.description}</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          {/* Dynamic Step Component */}
          {currentStepData && (
            <currentStepData.component 
              data={formData} 
              onChange={setFormData}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
              isFirstStep 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <ChevronLeftIcon className="w-4 h-4 mr-2" />
            Previous
          </button>
          
          <button
            onClick={handleNext}
            disabled={isLoading || !isStepValid()}
            className="flex items-center px-6 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Setting up...
              </div>
            ) : isLastStep ? (
              'Complete Setup'
            ) : (
              <>
                Next
                <ChevronRightIcon className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}