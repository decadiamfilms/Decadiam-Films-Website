import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserIcon,
  CreditCardIcon,
  BuildingOfficeIcon,
  CheckIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
  CloudArrowUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface OnboardingData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  selectedPlan: string;
  planSkipped: boolean;
  paymentCompleted: boolean;
  businessName: string;
  industry: string;
  teamSize: string;
  logo: File | null;
  logoPreview: string | null;
}

// Custom Dropdown Component (like SalesKik style)
function CustomDropdown({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder 
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:bg-gray-50 flex items-center justify-between"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {value ? options.find(opt => opt.value === value)?.label : placeholder}
        </span>
        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                value === option.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$39',
    period: '/month',
    description: 'Perfect for solo entrepreneurs',
    features: [
      'Customers, quotes & orders',
      'Up to 500 products', 
      'Basic inventory tracking',
      '2 team members',
      'Email support'
    ],
    note: 'Great for getting started',
    popular: false
  },
  {
    id: 'professional', 
    name: 'Professional',
    price: '$79',
    period: '/month',
    description: 'Advanced features for growing businesses',
    features: [
      'Everything in Starter',
      'Purchase orders & stocktakes',
      'Up to 15 users',
      'Custom branding & templates',
      'Job scheduling',
      'Priority support'
    ],
    note: 'Most businesses choose this',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise', 
    price: '$149',
    period: '/month',
    description: 'Complete solution for large organizations',
    features: [
      'Everything in Professional',
      'Unlimited users',
      'Advanced automation',
      'Field worker dashboards',
      'White-label options',
      '24/7 phone support'
    ],
    note: 'Add specialized modules like Glass Calculator ($29/mo)',
    popular: false
  }
];

export function Modern2025Onboarding({ onComplete }: { onComplete: (data: OnboardingData) => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingData>({
    firstName: '', lastName: '', email: '', password: '',
    selectedPlan: '', planSkipped: false, paymentCompleted: false,
    businessName: '', industry: '', teamSize: '', logo: null, logoPreview: null
  });
  const [showPassword, setShowPassword] = useState(false);

  const updateFormData = (updates: Partial<OnboardingData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(formData);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateFormData({ logo: file, logoPreview: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const isStepValid = () => {
    if (currentStep === 0) {
      return formData.firstName.trim() && 
             formData.lastName.trim() && 
             formData.email.trim() && 
             formData.password.length >= 6;
    }
    if (currentStep === 1) return (formData.selectedPlan && formData.paymentCompleted) || formData.planSkipped;
    if (currentStep === 2) return formData.businessName && formData.industry && formData.teamSize;
    return false;
  };

  const shouldShowButton = () => {
    if (currentStep === 0) {
      return formData.firstName.trim() && 
             formData.lastName.trim() && 
             formData.email.trim() && 
             formData.password.length > 0;
    }
    return true;
  };

  const stepTitles = [
    'Create your account',
    'Choose your plan', 
    'Set up your business'
  ];

  const stepDescriptions = [
    "Let's get you started with a few quick details",
    "Select your plan and complete payment to continue", 
    "Now let's personalize your SalesKik experience"
  ];

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #E3F2FD 0%, #FFF3E0 50%, #E8F5E8 100%)',
      fontFamily: "'Inter', sans-serif" 
    }}>
      {/* Header - Top Left Logo like business software */}
      <header className="bg-white border-b border-gray-100 px-6 py-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <img src="/saleskik-logo.png" alt="SalesKik" className="w-36 h-36" />
          </div>
          
          {/* Clean Progress Indicator */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Step {currentStep + 1} of 3</span>
            <div className="flex space-x-2">
              {[0, 1, 2].map((step) => (
                <div
                  key={step}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: step <= currentStep 
                      ? 'linear-gradient(135deg, #5B7FBF 0%, #D4A574 100%)' 
                      : '#e5e7eb',
                    transition: 'all 0.3s ease',
                    boxShadow: step <= currentStep ? '0 2px 8px rgba(91, 127, 191, 0.3)' : 'none'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 style={{
            fontSize: '40px',
            fontWeight: '800',
            color: '#1f2937',
            marginBottom: '1rem'
          }}>
            {stepTitles[currentStep]}
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {stepDescriptions[currentStep]}
          </p>
        </div>

        {/* Content Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8 mb-8"
          >
            {currentStep === 0 && <ModernAccountStep formData={formData} updateFormData={updateFormData} showPassword={showPassword} setShowPassword={setShowPassword} />}
            {currentStep === 1 && <ModernPlanStep formData={formData} updateFormData={updateFormData} />}
            {currentStep === 2 && <ModernBusinessStep formData={formData} updateFormData={updateFormData} handleLogoUpload={handleLogoUpload} />}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          {currentStep > 0 ? (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          ) : <div />}
          
          {shouldShowButton() && (
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              style={{
                padding: '12px 32px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isStepValid() ? 'pointer' : 'not-allowed',
                background: isStepValid() 
                  ? 'linear-gradient(135deg, #5B7FBF 0%, #D4A574 100%)'
                  : '#d1d5db',
                color: 'white',
                boxShadow: isStepValid() ? '0 4px 16px rgba(91, 127, 191, 0.3)' : 'none',
                transition: 'all 0.3s ease',
                opacity: isStepValid() ? 1 : 0.6
              }}
            >
              {currentStep === 0 ? 'Continue' : 
               currentStep === 1 ? (formData.planSkipped ? 'Continue to Setup' : 'Subscribe & Continue') :
               'Complete Setup'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

// Modern Account Step
function ModernAccountStep({ formData, updateFormData, showPassword, setShowPassword }: any) {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => updateFormData({ firstName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="John"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => updateFormData({ lastName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Smith"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => updateFormData({ email: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="john@company.com"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => updateFormData({ password: e.target.value })}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Minimum 6 characters"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <EyeIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modern Plan Step
function ModernPlanStep({ formData, updateFormData }: any) {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: ''
  });

  const handlePlanSelect = (planId: string) => {
    updateFormData({ selectedPlan: planId, planSkipped: false });
    setShowPayment(true);
  };

  const handlePaymentSubmit = () => {
    // Here you would integrate with Stripe/PayPal etc.
    console.log('Processing payment for plan:', formData.selectedPlan);
    // For now, just mark as completed
    updateFormData({ paymentCompleted: true });
  };

  if (showPayment && formData.selectedPlan) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-1">
            {PLANS.find(p => p.id === formData.selectedPlan)?.name} Plan
          </h3>
          <p className="text-blue-700 text-sm">
            {PLANS.find(p => p.id === formData.selectedPlan)?.price}/month
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name on Card</label>
            <input
              type="text"
              value={paymentData.nameOnCard}
              onChange={(e) => setPaymentData(prev => ({ ...prev, nameOnCard: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="John Smith"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
            <input
              type="text"
              value={paymentData.cardNumber}
              onChange={(e) => setPaymentData(prev => ({ ...prev, cardNumber: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="1234 5678 9012 3456"
              maxLength={19}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
              <input
                type="text"
                value={paymentData.expiryDate}
                onChange={(e) => setPaymentData(prev => ({ ...prev, expiryDate: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="MM/YY"
                maxLength={5}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
              <input
                type="text"
                value={paymentData.cvv}
                onChange={(e) => setPaymentData(prev => ({ ...prev, cvv: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="123"
                maxLength={4}
              />
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              onClick={() => setShowPayment(false)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Plans
            </button>
            <button
              onClick={handlePaymentSubmit}
              disabled={!paymentData.nameOnCard || !paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: paymentData.nameOnCard && paymentData.cardNumber && paymentData.expiryDate && paymentData.cvv ? 'pointer' : 'not-allowed',
                background: paymentData.nameOnCard && paymentData.cardNumber && paymentData.expiryDate && paymentData.cvv
                  ? 'linear-gradient(135deg, #5B7FBF 0%, #D4A574 100%)'
                  : '#d1d5db',
                color: 'white',
                flex: 1
              }}
            >
              Complete Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Skip Option */}
      <div className="text-center mb-6">
        <button
          onClick={() => updateFormData({ planSkipped: true, selectedPlan: '' })}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Start with 14-day free trial (no payment required)
        </button>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <motion.div
            key={plan.id}
            whileHover={{ y: -2 }}
            onClick={() => handlePlanSelect(plan.id)}
            className={`cursor-pointer rounded-xl p-6 transition-all relative ${
              formData.selectedPlan === plan.id
                ? 'ring-2 ring-blue-500 bg-blue-50 border-2 border-blue-500'
                : 'border border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                Most Popular
              </span>
            )}
            
            <div className="text-center">
              <h3 className="font-bold text-gray-900 text-lg mb-1">{plan.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
              
              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-500 ml-1">{plan.period}</span>
              </div>
              
              <ul className="space-y-2 text-left text-sm mb-4">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <CheckIcon className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {(plan as any).note && (
                <div className="text-xs text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-blue-700 font-medium">{(plan as any).note}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Modern Business Step
function ModernBusinessStep({ formData, updateFormData, handleLogoUpload }: any) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
        <input
          type="text"
          value={formData.businessName}
          onChange={(e) => updateFormData({ businessName: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="e.g. Acme Pool Fencing"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CustomDropdown
          label="Industry"
          value={formData.industry}
          onChange={(value) => updateFormData({ industry: value })}
          placeholder="Select industry..."
          options={[
            { value: 'tradies', label: 'Tradies & Construction' },
            { value: 'retail', label: 'Retail & E-commerce' },
            { value: 'manufacturing', label: 'Manufacturing' },
            { value: 'services', label: 'Professional Services' },
            { value: 'other', label: 'Other' }
          ]}
        />
        
        <CustomDropdown
          label="Team Size"
          value={formData.teamSize}
          onChange={(value) => updateFormData({ teamSize: value })}
          placeholder="Select size..."
          options={[
            { value: 'solo', label: 'Just me' },
            { value: 'small', label: '2-5 people' },
            { value: 'medium', label: '6-20 people' },
            { value: 'large', label: '20+ people' }
          ]}
        />
      </div>

      {/* Clean Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Business Logo (Optional)</label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-saleskik-gold/50 border-dashed rounded-lg hover:border-saleskik-gold bg-gradient-to-r from-gold-50/50 to-primary-50/30 transition-colors">
          <div className="space-y-2 text-center">
            {formData.logoPreview ? (
              <div className="space-y-2">
                <img src={formData.logoPreview} alt="Logo preview" className="w-16 h-16 mx-auto object-contain" />
                <button
                  onClick={() => updateFormData({ logo: null, logoPreview: null })}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove logo
                </button>
              </div>
            ) : (
              <>
                <CloudArrowUpIcon className="mx-auto h-10 w-10 text-gray-400" />
                <div className="text-sm">
                  <label className="cursor-pointer font-semibold text-saleskik-blue hover:text-saleskik-gold transition-colors">
                    Upload a file
                    <input type="file" className="sr-only" accept="image/*" onChange={handleLogoUpload} />
                  </label>
                  <span className="text-gray-500"> or drag and drop</span>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}