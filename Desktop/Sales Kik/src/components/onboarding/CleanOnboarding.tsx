import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { EyeIcon, EyeSlashIcon, CheckIcon, ClipboardDocumentListIcon, CubeIcon, UsersIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

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

const STEPS = [
  { id: 1, title: 'About You', active: true },
  { id: 2, title: 'Your Business', active: false },
  { id: 3, title: 'Billing', active: false }
];

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 39,
    description: 'Perfect for solo entrepreneurs',
    popular: false,
    savings: '',
    features: [
      'Basic quotes & invoicing',
      'Up to 500 products', 
      '2 team members only',
      'Email support only',
      'Basic inventory tracking'
    ],
    limitations: ['❌ No custom branding', '❌ Limited reporting', '❌ No priority support']
  },
  {
    id: 'professional', 
    name: 'Professional',
    price: 79,
    description: '🔥 Most businesses choose this!',
    popular: true,
    savings: 'Save $840/year vs Enterprise',
    features: [
      '✅ Everything in Starter, plus:',
      '🚀 Advanced inventory & purchase orders',
      '🎨 Custom branding & email templates', 
      '👥 Up to 15 team members',
      '📞 Priority phone & chat support',
      '📊 Advanced reporting & analytics',
      '🔄 Job scheduling & workflows'
    ],
    limitations: []
  },
  {
    id: 'enterprise',
    name: 'Enterprise', 
    price: 149,
    description: 'For scaling & enterprise businesses',
    popular: false,
    savings: 'Everything included',
    features: [
      '✅ Everything in Professional, plus:',
      '♾️ Unlimited team members',
      '🏷️ Complete white-label customization',
      '📱 Field worker mobile apps',
      '🔧 Custom integrations & API access',
      '☎️ 24/7 dedicated phone support',
      '🏆 Dedicated account manager',
      '🔒 Advanced security & compliance'
    ],
    limitations: []
  }
];

// Custom Dropdown Component
function CustomDropdown({ 
  value, 
  onChange, 
  options, 
  placeholder 
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left border rounded-lg p-3 transition-all outline-none flex items-center justify-between"
        style={{ 
          borderColor: '#E5E7EB',
          fontSize: '16px',
          background: 'white'
        }}
        onFocus={(e) => {
          e.target.style.boxShadow = '0 0 0 2px rgba(43, 76, 126, 0.3)';
          e.target.style.borderColor = '#2B4C7E';
        }}
        onBlur={(e) => {
          if (!isOpen) {
            e.target.style.boxShadow = 'none';
            e.target.style.borderColor = '#E5E7EB';
          }
        }}
      >
        <span style={{ color: value ? '#111' : '#999' }}>
          {value ? options.find(opt => opt.value === value)?.label : placeholder}
        </span>
        <ChevronDownIcon 
          style={{ 
            width: '16px', 
            height: '16px', 
            color: '#999',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }} 
        />
      </button>
      
      {isOpen && (
        <div 
          className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-auto"
          style={{ borderColor: '#E5E7EB' }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
              style={{
                color: value === option.value ? '#F7931E' : '#111',
                backgroundColor: value === option.value ? 'rgba(247, 147, 30, 0.1)' : 'white',
                fontWeight: value === option.value ? '600' : '400'
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CleanOnboarding({ onComplete }: { onComplete: (data: any) => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: '', lastName: '', businessName: '', email: '', password: '',
    industry: '', teamSize: '', address: '', city: '', state: '', postcode: '', selectedPlan: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName && formData.lastName && formData.businessName && 
               formData.email && formData.password.length >= 6;
      case 2:
        return formData.industry && formData.teamSize && selectedPlan;
      case 3:
        return formData.address && formData.city && formData.state && formData.postcode;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-white" style={{ fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden', paddingTop: '2rem', paddingBottom: '4rem' }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .logo-shimmer {
          animation: shimmer 3s infinite;
          background: linear-gradient(90deg, transparent, rgba(247, 147, 30, 0.3), transparent);
          background-size: 200px 100%;
        }
        
        .floating-element {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>


      {/* Logo and Branding */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
        style={{ textAlign: 'center', marginBottom: '0.25rem' }}
      >
        <div style={{ display: 'inline-block', marginBottom: '1rem' }}>
          <img 
            src="/saleskik-logo.png" 
            alt="SalesKik" 
            style={{ 
              height: '180px', 
              width: 'auto',
              filter: 'drop-shadow(0 8px 25px rgba(247, 147, 30, 0.2))'
            }} 
          />
        </div>
        
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          style={{ 
            color: '#666', 
            fontSize: '18px',
            fontWeight: '500',
            marginBottom: '1rem'
          }}
        >
          Professional Business Management & Growth Platform
        </motion.p>

        {/* Animated feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          style={{
            display: 'flex',
            gap: '2rem',
            justifyContent: 'center',
            fontSize: '14px',
            color: '#888'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardDocumentListIcon style={{ width: '16px', height: '16px', color: '#F7931E' }} />
            <span>Professional Quotes</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CubeIcon style={{ width: '16px', height: '16px', color: '#2B4C7E' }} />
            <span>Inventory Management</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UsersIcon style={{ width: '16px', height: '16px', color: '#10b981' }} />
            <span>Customer CRM</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Enhanced Step Tracker */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          marginBottom: '0.25rem',
          padding: '1rem 2rem',
          background: 'rgba(247, 147, 30, 0.05)',
          borderRadius: '50px',
          border: '1px solid rgba(247, 147, 30, 0.1)'
        }}
      >
        {[
          { step: 1, title: 'About You', subtitle: 'Personal details' },
          { step: 2, title: 'Your Business', subtitle: 'Company info & plan' },
          { step: 3, title: 'Billing', subtitle: 'Payment & address' }
        ].map((item, index) => (
          <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <motion.div
              animate={{
                backgroundColor: currentStep >= item.step ? '#F7931E' : '#e5e7eb',
                scale: currentStep === item.step ? 1.1 : 1
              }}
              transition={{ duration: 0.3 }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: currentStep >= item.step ? 'white' : '#999',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: currentStep === item.step ? '0 4px 12px rgba(247, 147, 30, 0.3)' : 'none'
              }}
            >
              {currentStep > item.step ? '✓' : item.step}
            </motion.div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ 
                fontSize: '14px',
                fontWeight: '600',
                color: currentStep >= item.step ? '#F7931E' : '#666'
              }}>
                {item.title}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                {item.subtitle}
              </div>
            </div>
            {index < 2 && (
              <div style={{
                width: '30px',
                height: '2px',
                background: currentStep > item.step ? '#F7931E' : '#e5e7eb',
                margin: '0 0.5rem',
                borderRadius: '1px'
              }} />
            )}
          </div>
        ))}
      </motion.div>

      {/* Form Card */}
      <div 
        className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm w-full max-w-lg"
        style={{ 
          borderColor: '#E5E7EB',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          maxWidth: '450px'
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 1 && <Step1AboutYou formData={formData} updateFormData={updateFormData} showPassword={showPassword} setShowPassword={setShowPassword} />}
            {currentStep === 2 && <Step2YourBusiness formData={formData} updateFormData={updateFormData} plans={PLANS} selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} />}
            {currentStep === 3 && <Step3Billing formData={formData} updateFormData={updateFormData} selectedPlan={selectedPlan} onComplete={onComplete} />}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <div>
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="text-gray-500 hover:text-gray-700 font-medium"
              >
                ← Back
              </button>
            )}
          </div>

          <div>
            {currentStep < 3 && (
              <button
                onClick={nextStep}
                disabled={!isStepValid()}
                className="font-semibold rounded-lg py-3 px-6 transition-all"
                style={{
                  backgroundColor: isStepValid() ? '#F7931E' : '#d1d5db',
                  color: 'white',
                  cursor: isStepValid() ? 'pointer' : 'not-allowed',
                  opacity: isStepValid() ? 1 : 0.6
                }}
                onMouseOver={(e) => {
                  if (isStepValid()) {
                    e.currentTarget.style.backgroundColor = '#e67a00';
                  }
                }}
                onMouseOut={(e) => {
                  if (isStepValid()) {
                    e.currentTarget.style.backgroundColor = '#F7931E';
                  }
                }}
              >
                Continue →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 1: About You
function Step1AboutYou({ formData, updateFormData, showPassword, setShowPassword }: any) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-gray-900" style={{ color: '#111', fontWeight: 600 }}>
        Create your account
      </h2>
      
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#333' }}>
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => updateFormData({ firstName: e.target.value })}
              className="w-full border rounded-lg p-3 transition-all outline-none"
              style={{ 
                borderColor: '#E5E7EB',
                fontSize: '16px'
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = '0 0 0 2px rgba(43, 76, 126, 0.3)';
                e.target.style.borderColor = '#2B4C7E';
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = 'none';
                e.target.style.borderColor = '#E5E7EB';
              }}
              placeholder="John"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#333' }}>
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => updateFormData({ lastName: e.target.value })}
              className="w-full border rounded-lg p-3 transition-all outline-none"
              style={{ 
                borderColor: '#E5E7EB',
                fontSize: '16px'
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = '0 0 0 2px rgba(43, 76, 126, 0.3)';
                e.target.style.borderColor = '#2B4C7E';
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = 'none';
                e.target.style.borderColor = '#E5E7EB';
              }}
              placeholder="Smith"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#333' }}>
            Business Name
          </label>
          <input
            type="text"
            value={formData.businessName}
            onChange={(e) => updateFormData({ businessName: e.target.value })}
            className="w-full border rounded-lg p-3 transition-all outline-none"
            style={{ 
              borderColor: '#E5E7EB',
              fontSize: '16px'
            }}
            onFocus={(e) => {
              e.target.style.boxShadow = '0 0 0 2px rgba(43, 76, 126, 0.3)';
              e.target.style.borderColor = '#2B4C7E';
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = 'none';
              e.target.style.borderColor = '#E5E7EB';
            }}
            placeholder="Acme Pool Fencing"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#333' }}>
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            className="w-full border rounded-lg p-3 transition-all outline-none"
            style={{ 
              borderColor: '#E5E7EB',
              fontSize: '16px'
            }}
            onFocus={(e) => {
              e.target.style.boxShadow = '0 0 0 2px rgba(43, 76, 126, 0.3)';
              e.target.style.borderColor = '#2B4C7E';
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = 'none';
              e.target.style.borderColor = '#E5E7EB';
            }}
            placeholder="john@acmepools.com.au"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#333' }}>
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => updateFormData({ password: e.target.value })}
              className="w-full border rounded-lg p-3 pr-12 transition-all outline-none"
              style={{ 
                borderColor: '#E5E7EB',
                fontSize: '16px'
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = '0 0 0 2px rgba(43, 76, 126, 0.3)';
                e.target.style.borderColor = '#2B4C7E';
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = 'none';
                e.target.style.borderColor = '#E5E7EB';
              }}
              placeholder="Create a secure password"
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
          {formData.password && (
            <div className="mt-2 text-xs" style={{ color: formData.password.length >= 6 ? '#10b981' : '#666' }}>
              {formData.password.length >= 6 ? '✅ Password strength: Good' : `${6 - formData.password.length} more characters needed`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 2: Your Business
function Step2YourBusiness({ formData, updateFormData, plans, selectedPlan, setSelectedPlan }: any) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-gray-900" style={{ color: '#111', fontWeight: 600 }}>
        Tell us about your business
      </h2>
      
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#333' }}>
              Industry
            </label>
            <CustomDropdown
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
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#333' }}>
              Team Size
            </label>
            <CustomDropdown
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
        </div>

        {/* Plan Selection */}
        <div>
          <label className="block text-sm font-medium mb-3" style={{ color: '#333' }}>
            Choose your plan
          </label>
          <div className="grid grid-cols-1 gap-3">
            {plans.map((plan: any) => (
              <div
                key={plan.id}
                onClick={() => {
                  setSelectedPlan(plan);
                  updateFormData({ selectedPlan: plan.id });
                }}
                className="border rounded-lg p-4 cursor-pointer transition-all"
                style={{
                  borderColor: selectedPlan?.id === plan.id ? '#F7931E' : '#E5E7EB',
                  backgroundColor: selectedPlan?.id === plan.id ? 'rgba(247, 147, 30, 0.05)' : 'white'
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold" style={{ color: '#111' }}>{plan.name}</span>
                      {plan.popular && (
                        <span 
                          className="text-xs px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: '#F7931E' }}
                        >
                          Most Popular
                        </span>
                      )}
                    </div>
                    <div className="text-sm" style={{ color: '#666' }}>
                      Perfect for {plan.id === 'starter' ? 'getting started' : plan.id === 'professional' ? 'growing businesses' : 'large teams'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold" style={{ color: '#111' }}>${plan.price}</div>
                    <div className="text-sm" style={{ color: '#666' }}>/month</div>
                  </div>
                </div>
                
                <div className="text-xs space-y-1 mb-3">
                  {plan.features.slice(0, 4).map((feature: string, i: number) => (
                    <div key={i} className="flex items-center gap-1" style={{ color: '#666' }}>
                      <CheckIcon className="w-3 h-3" style={{ color: '#10b981' }} />
                      {feature}
                    </div>
                  ))}
                  {plan.features.length > 4 && (
                    <div style={{ color: '#F7931E', fontSize: '11px', fontWeight: '600', textAlign: 'center', marginTop: '0.5rem' }}>
                      +{plan.features.length - 4} more features
                    </div>
                  )}
                </div>
                
                {plan.savings && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(247, 147, 30, 0.1), rgba(43, 76, 126, 0.1))',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#F7931E',
                    textAlign: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    💰 {plan.savings}
                  </div>
                )}
                
                {plan.limitations && plan.limitations.length > 0 && (
                  <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '0.5rem' }}>
                    {plan.limitations.slice(0, 2).map((limitation, i) => (
                      <div key={i}>{limitation}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 3: Billing
function Step3Billing({ formData, updateFormData, selectedPlan, onComplete }: any) {
  return (
    <Elements stripe={stripePromise}>
      <BillingForm formData={formData} updateFormData={updateFormData} selectedPlan={selectedPlan} onComplete={onComplete} />
    </Elements>
  );
}

function BillingForm({ formData, updateFormData, selectedPlan, onComplete }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError('');

    try {
      // Demo mode - simulate successful payment
      console.log('🎉 Demo subscription created for:', selectedPlan.name);
      setTimeout(() => {
        onComplete({
          ...formData,
          selectedPlan: selectedPlan.id,
          planName: selectedPlan.name,
          price: selectedPlan.price
        });
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      setProcessing(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-gray-900" style={{ color: '#111', fontWeight: 600 }}>
        Complete your subscription
      </h2>

      {/* Plan Summary */}
      {selectedPlan && (
        <div className="mb-6 p-3 rounded-lg" style={{ backgroundColor: 'rgba(247, 147, 30, 0.1)', border: '1px solid rgba(247, 147, 30, 0.2)' }}>
          <div className="flex justify-between items-center">
            <span className="font-medium" style={{ color: '#333' }}>{selectedPlan.name} Plan</span>
            <span className="font-semibold" style={{ color: '#F7931E' }}>${selectedPlan.price}/month</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Billing Address */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#333' }}>
            Business Address
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => updateFormData({ address: e.target.value })}
            className="w-full border rounded-lg p-3 mb-3 transition-all outline-none"
            style={{ borderColor: '#E5E7EB' }}
            placeholder="123 Business Street"
          />
          
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={formData.city}
              onChange={(e) => updateFormData({ city: e.target.value })}
              className="border rounded-lg p-3 transition-all outline-none"
              style={{ borderColor: '#E5E7EB' }}
              placeholder="Sydney"
            />
            <input
              type="text"
              value={formData.postcode}
              onChange={(e) => updateFormData({ postcode: e.target.value })}
              className="border rounded-lg p-3 transition-all outline-none"
              style={{ borderColor: '#E5E7EB' }}
              placeholder="2000"
              maxLength={4}
            />
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#333' }}>
            Payment Method
          </label>
          <div className="border rounded-lg p-4" style={{ borderColor: '#E5E7EB' }}>
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    fontFamily: 'Inter, sans-serif',
                    color: '#111',
                    '::placeholder': { color: '#999' }
                  }
                },
                hidePostalCode: true
              }}
            />
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || processing}
          className="w-full font-semibold rounded-lg py-3 transition-all"
          style={{
            backgroundColor: processing ? '#d1d5db' : '#F7931E',
            color: 'white',
            cursor: processing ? 'not-allowed' : 'pointer',
            padding: '14px 20px'
          }}
          onMouseOver={(e) => {
            if (!processing) {
              e.currentTarget.style.backgroundColor = '#e67a00';
            }
          }}
          onMouseOut={(e) => {
            if (!processing) {
              e.currentTarget.style.backgroundColor = '#F7931E';
            }
          }}
        >
          {processing ? 'Processing...' : `Subscribe to ${selectedPlan.name} - $${selectedPlan.price}/month`}
        </button>
        
        <div className="text-center text-xs" style={{ color: '#666' }}>
          🔒 Secure payment • Cancel anytime
        </div>
      </form>
    </div>
  );
}