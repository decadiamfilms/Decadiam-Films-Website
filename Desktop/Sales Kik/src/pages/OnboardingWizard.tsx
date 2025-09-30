import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  BuildingOfficeIcon,
  UserGroupIcon,
  CubeIcon,
  UsersIcon,
  CogIcon,
  EnvelopeIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  HomeIcon,
  PlusIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { dataService } from '../services/api.service';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  required: boolean;
  completed: boolean;
  canSkip?: boolean;
  component?: React.ComponentType<any>;
}

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const [companyForm, setCompanyForm] = useState({
    name: '',
    abn: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postcode: ''
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#3B82F6' });
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to SalesKik',
      description: 'Let\'s get your business set up for success',
      icon: HomeIcon,
      required: true,
      completed: false
    },
    {
      id: 'company-profile',
      title: 'Company Profile',
      description: 'Your business information and contact details',
      icon: BuildingOfficeIcon,
      required: true,
      completed: false
    },
    {
      id: 'categories-reminder',
      title: 'Product Categories Setup',
      description: 'Important next step after onboarding',
      icon: CubeIcon,
      required: false,
      completed: false,
      canSkip: true
    },
    {
      id: 'first-products',
      title: 'Add Initial Products',
      description: 'Add a few key products to get started',
      icon: CubeIcon,
      required: false,
      completed: false,
      canSkip: true
    },
    {
      id: 'first-customers',
      title: 'Add Key Customers',
      description: 'Add your most important customers',
      icon: UsersIcon,
      required: false,
      completed: false,
      canSkip: true
    },
    {
      id: 'team-setup',
      title: 'Add Team Members',
      description: 'Add employees who will use the system',
      icon: UserGroupIcon,
      required: false,
      completed: false,
      canSkip: true
    },
    {
      id: 'completion',
      title: 'You\'re Ready!',
      description: 'Your SalesKik account is set up and ready to use',
      icon: CheckCircleIcon,
      required: true,
      completed: false
    }
  ];

  const [onboardingSteps, setOnboardingSteps] = useState(steps);

  useEffect(() => {
    // Load onboarding progress
    loadOnboardingProgress();
  }, []);

  const loadOnboardingProgress = async () => {
    try {
      // Check which steps are already completed by checking if data exists
      const progress = { ...onboardingSteps };
      
      // Check company profile
      const hasCompanyProfile = localStorage.getItem('company-profile-completed');
      if (hasCompanyProfile) {
        const index = progress.findIndex(s => s.id === 'company-profile');
        if (index !== -1) progress[index].completed = true;
      }
      
      // Check if categories exist
      const categories = await dataService.categories.getAll();
      if (categories && categories.length > 0) {
        const index = progress.findIndex(s => s.id === 'product-categories');
        if (index !== -1) progress[index].completed = true;
      }
      
      // Check if products exist
      const products = await dataService.products.getAll();
      if (products && products.length > 0) {
        const index = progress.findIndex(s => s.id === 'product-setup');
        if (index !== -1) progress[index].completed = true;
      }
      
      setOnboardingSteps(progress);
    } catch (error) {
      console.error('Error loading onboarding progress:', error);
    }
  };

  const completeStep = async (stepId: string) => {
    setOnboardingSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
    
    // Save progress
    localStorage.setItem(`${stepId}-completed`, 'true');
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishOnboarding = async () => {
    try {
      setLoading(true);
      // Mark onboarding as complete
      await dataService.onboarding?.complete?.();
      localStorage.setItem('onboarding-completed', 'true');
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentStepData = onboardingSteps[currentStep];
  const completedSteps = onboardingSteps.filter(s => s.completed).length;
  const requiredSteps = onboardingSteps.filter(s => s.required);
  const completedRequiredSteps = requiredSteps.filter(s => s.completed).length;
  const canFinish = completedRequiredSteps === requiredSteps.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header with Large Logo */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            {/* Extra Large Logo */}
            <div className="flex items-center" style={{height: '120px', width: '600px'}}>
              <img
                src="/logo.png"
                alt="SalesKik Logo"
                className="h-full w-auto object-contain"
                onError={(e) => {
                  // Fallback if logo not found
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<div class="text-6xl font-bold text-gray-900">SalesKik</div>';
                }}
              />
            </div>
            
            {/* Title & Progress */}
            <div className="flex items-center space-x-8">
              <div className="text-right">
                <h1 className="text-xl font-bold text-gray-900">Account Setup</h1>
                <p className="text-sm text-gray-600">
                  {completedSteps} of {onboardingSteps.length} steps ({Math.round((completedSteps / onboardingSteps.length) * 100)}%)
                </p>
              </div>
              
              {/* Compact Progress Circle */}
              <div className="w-12 h-12 relative">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - completedSteps / onboardingSteps.length)}`}
                    className="text-blue-600 transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-700">
                    {Math.round((completedSteps / onboardingSteps.length) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Beautiful Steps Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-28">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-blue-500 rounded-lg">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Setup Journey</h3>
              </div>
              <div className="space-y-4">
                {onboardingSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <button
                      key={step.id}
                      onClick={() => goToStep(index)}
                      className={`w-full flex items-start space-x-4 p-4 rounded-xl text-left transition-all duration-300 ${
                        index === currentStep
                          ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 shadow-md transform scale-105'
                          : step.completed
                          ? 'bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200'
                          : 'hover:bg-gray-50 border border-transparent hover:shadow-md'
                      }`}
                    >
                      <div className={`p-3 rounded-xl ${
                        step.completed
                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                          : index === currentStep
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                          : 'bg-gradient-to-r from-gray-400 to-gray-500'
                      }`}>
                        {step.completed ? (
                          <CheckCircleIcon className="w-6 h-6 text-white" />
                        ) : (
                          <Icon className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-base font-semibold ${
                          index === currentStep ? 'text-blue-900' : 
                          step.completed ? 'text-green-900' : 'text-gray-900'
                        }`}>
                          {step.title}
                          {step.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                          {step.canSkip && (
                            <span className="text-gray-400 ml-1 text-xs">(optional)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {step.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    <span>* Required for basic functionality</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Completed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Beautiful Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {currentStepData && (
                <>
                  {/* Colorful Header */}
                  <div className={`px-8 py-6 ${
                    currentStepData.completed 
                      ? 'bg-green-50 border-b border-green-200' 
                      : 'bg-blue-50 border-b border-blue-200'
                  }`}>
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl ${
                        currentStepData.completed ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {currentStepData.completed ? (
                          <CheckCircleIcon className="w-8 h-8 text-green-600" />
                        ) : (
                          <currentStepData.icon className="w-8 h-8 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h2 className={`text-3xl font-bold ${
                          currentStepData.completed ? 'text-green-900' : 'text-blue-900'
                        }`}>
                          {currentStepData.title}
                          {currentStepData.required && (
                            <span className="text-red-500 ml-2">*</span>
                          )}
                        </h2>
                        <p className={`text-lg ${
                          currentStepData.completed ? 'text-green-700' : 'text-blue-700'
                        }`}>{currentStepData.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content Area */}
                  <div className="p-8">

                  {/* Step Content */}
                  <div className="mb-8">
                    {/* Welcome Step */}
                    {currentStepData.id === 'welcome' && (
                      <div className="text-center py-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                          Welcome to SalesKik!
                        </h3>
                        <p className="text-gray-600 mb-6">
                          We'll set up your business management platform in just a few steps. 
                          You can always skip optional steps and complete them later.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-2 text-center">We'll set up:</h4>
                          <ul className="text-sm text-blue-800 space-y-1 text-center max-w-md mx-auto">
                            <li>✓ Company profile and business details</li>
                            <li>✓ Product categories (essential for quotes)</li>
                            <li>• Initial products (can skip and add later)</li>
                            <li>• Key customers (can skip and add later)</li>
                            <li>• Team members (can skip and add later)</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Company Profile Step */}
                    {currentStepData.id === 'company-profile' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                            <input
                              type="text"
                              value={companyForm.name}
                              onChange={(e) => setCompanyForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Enter your business name"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ABN</label>
                            <input
                              type="text"
                              value={companyForm.abn}
                              onChange={(e) => setCompanyForm(prev => ({ ...prev, abn: e.target.value }))}
                              placeholder="Australian Business Number"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
                            <input
                              type="tel"
                              value={companyForm.phone}
                              onChange={(e) => setCompanyForm(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="Business phone number"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Business Email</label>
                            <input
                              type="email"
                              value={companyForm.email}
                              onChange={(e) => setCompanyForm(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="Business email address"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                          <input
                            type="text"
                            value={companyForm.address}
                            onChange={(e) => setCompanyForm(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Street address"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input
                              type="text"
                              value={companyForm.city}
                              onChange={(e) => setCompanyForm(prev => ({ ...prev, city: e.target.value }))}
                              placeholder="City"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                            <select
                              value={companyForm.state}
                              onChange={(e) => setCompanyForm(prev => ({ ...prev, state: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select state</option>
                              <option value="NSW">NSW</option>
                              <option value="VIC">VIC</option>
                              <option value="QLD">QLD</option>
                              <option value="WA">WA</option>
                              <option value="SA">SA</option>
                              <option value="TAS">TAS</option>
                              <option value="ACT">ACT</option>
                              <option value="NT">NT</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                            <input
                              type="text"
                              value={companyForm.postcode}
                              onChange={(e) => setCompanyForm(prev => ({ ...prev, postcode: e.target.value }))}
                              placeholder="Postcode"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Categories Reminder Step */}
                    {currentStepData.id === 'categories-reminder' && (
                      <div className="space-y-6">
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
                          <CubeIcon className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                          <h4 className="font-medium text-orange-900 mb-2">Important Next Step</h4>
                          <p className="text-orange-800 mb-4">
                            After onboarding, you'll need to set up product categories using the 
                            <strong> Inventory Builder</strong>. This is essential for quotes and products to work.
                          </p>
                          <div className="bg-white border border-orange-200 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">Why categories matter:</h5>
                            <ul className="text-sm text-gray-700 space-y-1 text-left">
                              <li>• Required for creating quotes</li>
                              <li>• Organize your products efficiently</li>
                              <li>• Enable advanced filtering and search</li>
                              <li>• Support subcategories and custom pricing</li>
                            </ul>
                          </div>
                          <div className="mt-4">
                            <p className="text-sm text-orange-700">
                              <strong>We'll remind you to complete this after onboarding.</strong>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Other step content would go here... */}
                    {currentStepData.id === 'completion' && (
                      <div className="space-y-6">
                        <div className="text-center">
                          <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">
                            Welcome to SalesKik!
                          </h3>
                          <p className="text-gray-600 mb-6">
                            Your account is set up and ready. Here's what you need to do next to start 
                            creating quotes and managing your business.
                          </p>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-medium text-green-900 mb-2">✅ Completed:</h4>
                          <ul className="text-sm text-green-800 space-y-1">
                            <li>✓ Company profile configured</li>
                            <li>✓ Account activated and ready</li>
                            <li>✓ Access to all SalesKik features</li>
                          </ul>
                        </div>
                        
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <h4 className="font-medium text-orange-900 mb-2">🎯 Critical Next Step:</h4>
                          <p className="text-orange-800 text-sm mb-3">
                            <strong>Set up Product Categories</strong> - This is essential before you can create quotes or add products.
                          </p>
                          <a
                            href="/inventory/builder"
                            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm font-medium"
                          >
                            Go to Inventory Builder
                            <ArrowRightIcon className="w-4 h-4 ml-2" />
                          </a>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-2">📋 When You're Ready:</h4>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Add products to your catalog</li>
                            <li>• Import or add your customers</li>
                            <li>• Set up team members and permissions</li>
                            <li>• Customize your quotes and invoices</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  </div>
                  
                  {/* Beautiful Navigation */}
                  <div className="flex items-center justify-between pt-8 border-t border-gray-200/50">
                    <button
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                        currentStep === 0
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
                      }`}
                    >
                      <ArrowLeftIcon className="w-5 h-5 mr-2" />
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-3">
                      {/* Skip Button for Optional Steps */}
                      {currentStepData.canSkip && !currentStepData.completed && (
                        <button
                          onClick={() => {
                            completeStep(currentStepData.id);
                            nextStep();
                          }}
                          className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-300"
                        >
                          Skip This Step
                        </button>
                      )}
                      
                      {currentStep === onboardingSteps.length - 1 ? (
                        <button
                          onClick={finishOnboarding}
                          disabled={!canFinish || loading}
                          className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                            canFinish && !loading
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {loading ? 'Finishing...' : 'Launch SalesKik'}
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            // Save current step data before proceeding
                            if (currentStepData.id === 'company-profile' && companyForm.name) {
                              try {
                                await dataService.company?.save?.(companyForm);
                                completeStep('company-profile');
                              } catch (error) {
                                console.error('Error saving company profile:', error);
                              }
                            }
                            
                            if (currentStepData.id === 'product-categories' && categories.length >= 2) {
                              try {
                                await dataService.categories.save(categories);
                                completeStep('product-categories');
                              } catch (error) {
                                console.error('Error saving categories:', error);
                              }
                            }
                            
                            nextStep();
                          }}
                          disabled={
                            (currentStepData.id === 'company-profile' && !companyForm.name) ||
                            (currentStepData.id === 'product-categories' && categories.length < 2)
                          }
                          className={`flex items-center px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                            (currentStepData.id === 'company-profile' && !companyForm.name) ||
                            (currentStepData.id === 'categories-reminder' && categories.length < 2)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-orange-500 to-blue-500 text-white hover:from-orange-600 hover:to-blue-600 shadow-lg hover:shadow-xl'
                          }`}
                        >
                          {currentStepData.id === 'product-categories' && categories.length < 2
                            ? 'Add at least 2 categories'
                            : 'Continue'
                          }
                          <ArrowRightIcon className="w-5 h-5 ml-2" />
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Progress Summary */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Setup Progress</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {completedRequiredSteps}/{requiredSteps.length}
                  </div>
                  <div className="text-sm text-blue-800">Required Steps</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {completedSteps}/{onboardingSteps.length}
                  </div>
                  <div className="text-sm text-green-800">Total Steps</div>
                </div>
              </div>
              
              {canFinish && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium">
                      Ready to launch! All required steps completed.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}