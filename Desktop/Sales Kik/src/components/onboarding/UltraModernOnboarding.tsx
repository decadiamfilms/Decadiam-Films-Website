import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { 
  CheckCircleIcon, 
  SparklesIcon, 
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

// Initialize Stripe
const stripePromise = loadStripe((import.meta.env as any).VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

interface FormData {
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  password: string;
  industry: string;
  teamSize: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  selectedPlan: string;
}

export function UltraModernOnboarding({ onComplete }: { onComplete: (data: any) => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    firstName: '', lastName: '', businessName: '', email: '', password: '',
    industry: '', teamSize: '', address: '', city: '', state: '', postcode: '', selectedPlan: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const steps = [
    { 
      id: 'personal', 
      title: 'Welcome to SalesKik', 
      subtitle: 'Let\'s get you set up',
      gradient: 'from-blue-500 to-purple-600'
    },
    { 
      id: 'business', 
      title: 'About your business', 
      subtitle: 'Help us customize your experience',
      gradient: 'from-purple-500 to-pink-600' 
    },
    { 
      id: 'billing', 
      title: 'Choose your plan', 
      subtitle: 'Start growing with SalesKik',
      gradient: 'from-green-500 to-blue-500'
    }
  ];

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27 width=%2732%27 height=%2732%27 fill=%27none%27%3e%3cpath d=%27m0 2 2-2h4l-6 6%27/%3e%3cpath d=%27m28 2 2-2h4l-6 6%27/%3e%3cpath d=%27m0 30 2 2h4l-6-6%27/%3e%3cpath d=%27m28 30 2 2h4l-6-6%27/%3e%3c/svg%3e')] opacity-[0.05]"></div>
      
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 z-10">
        <motion.div
          className={`h-full bg-gradient-to-r ${currentStepData.gradient}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <div className="flex min-h-screen">
        {/* Left Panel - Branding & Value */}
        <div className="flex-1 flex flex-col justify-center items-center p-12 relative">
          <div className="max-w-lg text-center">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <img 
                src="/saleskik-logo.png" 
                alt="SalesKik" 
                className="h-20 mx-auto mb-4"
                style={{ filter: 'drop-shadow(0 4px 20px rgba(59, 130, 246, 0.3))' }}
              />
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                SalesKik
              </div>
              <div className="text-lg text-gray-600 font-medium">
                Professional Business Management Platform
              </div>
            </motion.div>

            {/* Dynamic Step Content */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentStepData.title}
                </h2>
                <p className="text-gray-600">
                  {currentStepData.subtitle}
                </p>
              </div>

              {/* Value Props for Each Step */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: '📈', title: 'Grow Revenue', desc: '30% average increase' },
                      { icon: '⚡', title: 'Save Time', desc: '5 hours saved weekly' },
                      { icon: '🎯', title: 'Professional', desc: 'Impress customers' },
                      { icon: '📊', title: 'Insights', desc: 'Data-driven decisions' }
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="p-4 rounded-xl bg-white/60 backdrop-blur border border-white/20"
                      >
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <div className="font-semibold text-gray-900 text-sm">{item.title}</div>
                        <div className="text-xs text-gray-600">{item.desc}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="p-6 rounded-xl bg-white/60 backdrop-blur border border-white/20">
                    <div className="text-lg font-semibold text-gray-900 mb-2">🚀 Join 10,000+ businesses</div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>• Pool fencing companies using SalesKik save 15 hours/week</div>
                      <div>• Manufacturing businesses increase quote accuracy by 40%</div>
                      <div>• Service businesses grow revenue 25% in first year</div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="p-6 rounded-xl bg-green-50 border border-green-200">
                    <div className="text-lg font-semibold text-green-900 mb-2">🎉 You're almost there!</div>
                    <div className="text-sm text-green-700">
                      Thousands of businesses have transformed their operations with SalesKik. Join them today!
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="flex-1 flex flex-col justify-center items-center p-12 bg-white/50 backdrop-blur">
          <div className="w-full max-w-md">
            {/* Step Indicator */}
            <div className="flex items-center justify-center space-x-2 mb-8">
              {steps.map((_, index) => (
                <motion.div
                  key={index}
                  className="h-2 rounded-full"
                  style={{ 
                    width: index === currentStep ? '32px' : '8px',
                    backgroundColor: index <= currentStep ? '#3b82f6' : '#e2e8f0'
                  }}
                  animate={{ 
                    width: index === currentStep ? '32px' : '8px',
                    backgroundColor: index <= currentStep ? '#3b82f6' : '#e2e8f0'
                  }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>

            {/* Form Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8"
              style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)' }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentStep === 0 && <PersonalInfoStep formData={formData} updateFormData={updateFormData} showPassword={showPassword} setShowPassword={setShowPassword} />}
                  {currentStep === 1 && <BusinessInfoStep formData={formData} updateFormData={updateFormData} />}
                  {currentStep === 2 && <BillingPlanStep formData={formData} updateFormData={updateFormData} onComplete={onComplete} />}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                <div>
                  {currentStep > 0 && (
                    <button
                      onClick={prevStep}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <span>←</span>
                      <span>Back</span>
                    </button>
                  )}
                </div>

                <div className="text-sm text-gray-500">
                  {currentStep + 1} of {steps.length}
                </div>

                <div>
                  {currentStep < steps.length - 1 && (
                    <button
                      onClick={nextStep}
                      className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <span>Continue</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 1: Personal Information
function PersonalInfoStep({ formData, updateFormData, showPassword, setShowPassword }: any) {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Create your account</h3>
        <p className="text-gray-600">Join thousands of growing businesses</p>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => updateFormData({ firstName: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200"
              placeholder="John"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => updateFormData({ lastName: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200"
              placeholder="Smith"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
          <input
            type="text"
            value={formData.businessName}
            onChange={(e) => updateFormData({ businessName: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200"
            placeholder="Acme Business Solutions"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200"
            placeholder="john@acmebusiness.com.au"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => updateFormData({ password: e.target.value })}
              className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200"
              placeholder="Create a secure password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 2: Business Information
function BusinessInfoStep({ formData, updateFormData }: any) {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Tell us about your business</h3>
        <p className="text-gray-600">This helps us customize SalesKik for you</p>
      </div>
      
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
            <select
              value={formData.industry}
              onChange={(e) => updateFormData({ industry: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200"
            >
              <option value="">Select...</option>
              <option value="construction">Construction & Building</option>
              <option value="retail">Retail & E-commerce</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="services">Professional Services</option>
              <option value="hospitality">Hospitality & Events</option>
              <option value="healthcare">Healthcare</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Team Size</label>
            <select
              value={formData.teamSize}
              onChange={(e) => updateFormData({ teamSize: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200"
            >
              <option value="">Select...</option>
              <option value="solo">Just me</option>
              <option value="small">2-5 people</option>
              <option value="medium">6-20 people</option>
              <option value="large">20+ people</option>
            </select>
          </div>
        </div>

        {/* Industry-Specific Message */}
        {formData.industry && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-blue-50 rounded-xl border border-blue-200"
          >
            <div className="text-sm text-blue-800">
              <strong>Perfect!</strong> SalesKik helps {formData.industry === 'construction' ? 'construction businesses' : formData.industry === 'retail' ? 'retailers' : `${formData.industry} businesses`} streamline operations and grow revenue by an average of 25% in their first year.
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Step 3: Billing & Plan Selection  
function BillingPlanStep({ formData, updateFormData, onComplete }: any) {
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const plans = [
    {
      id: 'professional',
      name: 'Professional', 
      price: 79,
      originalPrice: 99,
      popular: true,
      description: 'Most popular choice',
      features: [
        'Advanced inventory management',
        'Custom branding & templates',
        'Up to 15 team members',
        'Priority support',
        'Advanced reporting'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 149,
      description: 'For scaling businesses',
      features: [
        'Everything in Professional',
        'Unlimited team members', 
        'White-label customization',
        'Dedicated account manager',
        'API access'
      ]
    }
  ];

  return (
    <Elements stripe={stripePromise}>
      <div>
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Choose your plan</h3>
          <p className="text-gray-600">Start your 14-day free trial, upgrade anytime</p>
        </div>
        
        <div className="space-y-4 mb-6">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedPlan(plan)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                selectedPlan?.id === plan.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{plan.name}</span>
                    {plan.popular && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{plan.description}</div>
                </div>
                <div className="text-right">
                  {plan.originalPrice && (
                    <div className="text-sm text-gray-400 line-through">${plan.originalPrice}</div>
                  )}
                  <div className="text-2xl font-bold text-gray-900">${plan.price}</div>
                  <div className="text-sm text-gray-600">/month</div>
                </div>
              </div>
              
              <div className="space-y-1">
                {plan.features.slice(0, 3).map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    {feature}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="text-center">
                <div className="text-lg font-bold text-green-900">14-day free trial included!</div>
                <div className="text-sm text-green-700">No credit card required to start</div>
              </div>
            </div>
            
            <button
              onClick={() => onComplete({ ...formData, selectedPlan: selectedPlan.id })}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Start Free Trial →
            </button>
          </motion.div>
        )}
      </div>
    </Elements>
  );
}