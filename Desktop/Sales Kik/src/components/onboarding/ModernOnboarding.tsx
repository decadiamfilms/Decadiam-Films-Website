import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { 
  CheckCircleIcon,
  SparklesIcon,
  RocketLaunchIcon,
  BuildingOfficeIcon,
  UserIcon,
  CreditCardIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

// Initialize Stripe
const stripePromise = loadStripe((import.meta.env as any).VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

interface StepData {
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  };
  business: {
    name: string;
    industry: string;
    teamSize: string;
  };
  billing: {
    address: string;
    city: string;
    state: string;
    postcode: string;
    phone: string;
  };
  plan: {
    selectedPlan: string;
    planName: string;
    price: number;
  };
}

const STEPS = [
  { id: 'personal', title: 'About You', icon: UserIcon, description: 'Tell us about yourself' },
  { id: 'business', title: 'Your Business', icon: BuildingOfficeIcon, description: 'Business details' },
  { id: 'billing', title: 'Billing & Payment', icon: CreditCardIcon, description: 'Complete your subscription' }
];

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 39,
    popular: false,
    features: ['Basic CRM', 'Up to 500 products', '2 team members', 'Email support']
  },
  {
    id: 'professional', 
    name: 'Professional',
    price: 79,
    popular: true,
    features: ['Everything in Starter', 'Advanced inventory', 'Up to 15 users', 'Priority support']
  },
  {
    id: 'enterprise',
    name: 'Enterprise', 
    price: 149,
    popular: false,
    features: ['Everything in Professional', 'Unlimited users', 'Custom branding', '24/7 support']
  }
];

export function ModernOnboarding({ onComplete }: { onComplete: (data: any) => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<StepData>({
    personal: { firstName: '', lastName: '', email: '', password: '' },
    business: { name: '', industry: '', teamSize: '' },
    billing: { address: '', city: '', state: '', postcode: '', phone: '' },
    plan: { selectedPlan: '', planName: '', price: 0 }
  });
  const [showPassword, setShowPassword] = useState(false);

  const updateStepData = (stepKey: keyof StepData, updates: any) => {
    setData(prev => ({
      ...prev,
      [stepKey]: { ...prev[stepKey], ...updates }
    }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: // Personal
        return data.personal.firstName && data.personal.lastName && 
               data.personal.email && data.personal.password.length >= 6;
      case 1: // Business
        return data.business.name && data.business.industry && data.business.teamSize;
      case 2: // Billing & Payment
        return data.billing.address && data.billing.city && data.billing.state && 
               data.billing.postcode && data.billing.phone && data.plan.selectedPlan;
      default:
        return false;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAF7F0',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-15px) rotate(120deg); }
          66% { transform: translateY(15px) rotate(240deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.8; }
        }
        
        .floating-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(40px);
          animation: float 20s ease-in-out infinite;
        }
      `}</style>

      {/* Background Orbs */}
      <div className="floating-orb" style={{
        top: '10%', left: '5%', width: '120px', height: '120px',
        background: 'linear-gradient(135deg, #D4A574, #E8C4A0)', opacity: 0.4
      }}></div>
      <div className="floating-orb" style={{
        bottom: '20%', right: '10%', width: '100px', height: '100px',
        background: 'linear-gradient(135deg, #5B7FBF, #7A9AD1)', opacity: 0.4, animationDelay: '10s'
      }}></div>

      {/* Header with Progress */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.9)', 
        backdropFilter: 'blur(10px)', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '1.5rem 2rem',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <img src="/saleskik-logo.png" alt="SalesKik" style={{ height: '120px', width: 'auto', filter: 'drop-shadow(0 8px 20px rgba(212, 165, 116, 0.3))' }} />
            <h1 style={{
              fontSize: '28px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #D4A574 0%, #5B7FBF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '1rem 0 0.5rem 0'
            }}>
              Professional Business Management
            </h1>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>
              Join thousands of businesses growing with SalesKik
            </p>
          </div>

          {/* Progress Steps */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
            {STEPS.map((step, index) => (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <motion.div
                  animate={{
                    backgroundColor: index <= currentStep ? '#D4A574' : '#e5e7eb',
                    scale: index === currentStep ? 1.1 : 1
                  }}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600'
                  }}
                >
                  {index < currentStep ? (
                    <CheckCircleIcon style={{ width: '24px', height: '24px' }} />
                  ) : index === currentStep ? (
                    <step.icon style={{ width: '24px', height: '24px' }} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </motion.div>
                <div>
                  <div style={{ fontWeight: '600', color: '#1f2937' }}>{step.title}</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>{step.description}</div>
                </div>
                {index < STEPS.length - 1 && (
                  <div style={{
                    width: '60px',
                    height: '2px',
                    background: index < currentStep ? '#D4A574' : '#e5e7eb',
                    margin: '0 1rem'
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '3rem 2rem',
        position: 'relative',
        zIndex: 10
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
          >
            {currentStep === 0 && <PersonalStep data={data.personal} updateData={(updates) => updateStepData('personal', updates)} showPassword={showPassword} setShowPassword={setShowPassword} />}
            {currentStep === 1 && <BusinessStep data={data.business} updateData={(updates) => updateStepData('business', updates)} plans={PLANS} onPlanSelect={(plan) => updateStepData('plan', { selectedPlan: plan.id, planName: plan.name, price: plan.price })} />}
            {currentStep === 2 && <BillingStep data={data} onComplete={onComplete} />}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '3rem',
          padding: '0 1rem'
        }}>
          <div>
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                style={{
                  padding: '12px 24px',
                  background: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#D4A574';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                ← Back
              </button>
            )}
          </div>

          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Step {currentStep + 1} of {STEPS.length}
          </div>

          <div>
            {currentStep < STEPS.length - 1 && (
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                style={{
                  padding: '12px 32px',
                  background: isStepValid() ? 'linear-gradient(135deg, #D4A574 0%, #B8935F 100%)' : '#d1d5db',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: isStepValid() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  opacity: isStepValid() ? 1 : 0.5
                }}
                onMouseOver={(e) => {
                  if (isStepValid()) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(212, 165, 116, 0.3)';
                  }
                }}
                onMouseOut={(e) => {
                  if (isStepValid()) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
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

// Step 1: Personal Information - Clean and simple
function PersonalStep({ data, updateData, showPassword, setShowPassword }: any) {
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '24px',
          padding: '3rem',
          boxShadow: '0 20px 60px rgba(212, 165, 116, 0.15)'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #D4A574, #B8935F)',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 16px 32px rgba(212, 165, 116, 0.4)'
            }}
          >
            <UserIcon style={{ width: '36px', height: '36px', color: 'white' }} />
          </motion.div>
          
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1f2937', marginBottom: '0.5rem' }}>
            Create Your Account
          </h2>
          <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '1rem' }}>
            Start your journey with SalesKik
          </p>
          
          {/* Quick Benefits */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.1), rgba(91, 127, 191, 0.1))',
            border: '1px solid rgba(212, 165, 116, 0.2)',
            borderRadius: '12px',
            padding: '1rem',
            fontSize: '14px',
            color: '#374151'
          }}>
            📊 Professional quotes • 📦 Inventory tracking • 👥 Customer management
          </div>
        </div>

        {/* Form */}
        <div style={{ space: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                First Name
              </label>
              <input
                type="text"
                value={data.firstName}
                onChange={(e) => updateData({ firstName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  background: 'white'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#D4A574';
                  e.target.style.boxShadow = '0 0 0 3px rgba(212, 165, 116, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="John"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                Last Name
              </label>
              <input
                type="text"
                value={data.lastName}
                onChange={(e) => updateData({ lastName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  background: 'white'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#D4A574';
                  e.target.style.boxShadow = '0 0 0 3px rgba(212, 165, 116, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Smith"
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
              Email Address
            </label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => updateData({ email: e.target.value })}
              style={{
                width: '100%',
                padding: '16px 20px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                background: 'white'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#D4A574';
                e.target.style.boxShadow = '0 0 0 3px rgba(212, 165, 116, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="john@acmepools.com.au"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={data.password}
                onChange={(e) => updateData({ password: e.target.value })}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  paddingRight: '52px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  background: 'white'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#D4A574';
                  e.target.style.boxShadow = '0 0 0 3px rgba(212, 165, 116, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Create a secure password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? (
                  <EyeSlashIcon style={{ width: '20px', height: '20px', color: '#9ca3af' }} />
                ) : (
                  <EyeIcon style={{ width: '20px', height: '20px', color: '#9ca3af' }} />
                )}
              </button>
            </div>
            {data.password && (
              <div style={{ marginTop: '0.75rem', fontSize: '14px', color: data.password.length >= 6 ? '#10b981' : '#6b7280' }}>
                {data.password.length >= 6 ? '✅ Perfect! Your password is secure' : `💡 ${6 - data.password.length} more characters needed`}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Step 2: Business Information
function BusinessStep({ data, updateData, plans, onPlanSelect }: any) {
  return (
    <div>
      {/* Business Info Card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '24px',
        padding: '3rem',
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #D4A574, #B8935F)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem',
            boxShadow: '0 20px 40px rgba(212, 165, 116, 0.3)'
          }}
        >
          <BuildingOfficeIcon style={{ width: '36px', height: '36px', color: 'white' }} />
        </motion.div>

        <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#1f2937', marginBottom: '1rem' }}>
          Tell us about your business
        </h2>
        <p style={{ color: '#6b7280', fontSize: '18px', marginBottom: '3rem' }}>
          This helps us customize SalesKik for your specific needs
        </p>

        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
              Business Name
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => updateData({ name: e.target.value })}
              style={{
                width: '100%',
                padding: '14px 18px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '16px',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#D4A574';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(212, 165, 116, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="Acme Pool Fencing Pty Ltd"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Industry
              </label>
              <select
                value={data.industry}
                onChange={(e) => updateData({ industry: e.target.value })}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: 'white'
                }}
              >
                <option value="">Select industry...</option>
                <option value="tradies">Tradies & Construction</option>
                <option value="retail">Retail & E-commerce</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="services">Professional Services</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Team Size
              </label>
              <select
                value={data.teamSize}
                onChange={(e) => updateData({ teamSize: e.target.value })}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: 'white'
                }}
              >
                <option value="">Select size...</option>
                <option value="solo">Just me</option>
                <option value="small">2-5 people</option>
                <option value="medium">6-20 people</option>
                <option value="large">20+ people</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Selection */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '1rem' }}>
          Choose Your Plan
        </h3>
        <p style={{ color: '#6b7280' }}>Select the plan that fits your business needs</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        {plans.map((plan: any) => (
          <motion.div
            key={plan.id}
            whileHover={{ scale: 1.02, y: -5 }}
            onClick={() => onPlanSelect(plan)}
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '20px',
              padding: '2rem',
              cursor: 'pointer',
              textAlign: 'center',
              position: 'relative',
              transition: 'all 0.3s ease'
            }}
          >
            {plan.popular && (
              <div style={{
                position: 'absolute',
                top: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #D4A574, #B8935F)',
                color: 'white',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                Most Popular
              </div>
            )}
            
            <h4 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '0.5rem' }}>{plan.name}</h4>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '32px', fontWeight: '800', color: '#1f2937' }}>${plan.price}</span>
              <span style={{ color: '#6b7280' }}>/month</span>
            </div>
            
            <ul style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              {plan.features.map((feature: string, i: number) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontSize: '14px' }}>
                  <CheckCircleIcon style={{ width: '16px', height: '16px', color: '#10b981', marginRight: '0.5rem' }} />
                  {feature}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Step 3: Billing & Payment
function BillingStep({ data, onComplete }: any) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '24px',
      padding: '3rem',
      maxWidth: '700px',
      margin: '0 auto'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem',
            boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)'
          }}
        >
          <CreditCardIcon style={{ width: '36px', height: '36px', color: 'white' }} />
        </motion.div>

        <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#1f2937', marginBottom: '1rem' }}>
          Complete Your Subscription
        </h2>
        <p style={{ color: '#6b7280', fontSize: '18px' }}>
          Secure billing setup for {data.plan.planName} (${data.plan.price}/month)
        </p>
      </div>

      {/* Billing Address + Payment in Same Section */}
      <div style={{ display: 'grid', gap: '2rem' }}>
        {/* Billing Address */}
        <div>
          <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '1rem' }}>📍 Billing Address</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <input
                type="text"
                value={data.billing.address}
                onChange={(e) => updateData({ billing: { ...data.billing, address: e.target.value } })}
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '12px' }}
                placeholder="Business Address"
              />
            </div>
            <input
              type="text"
              value={data.billing.city}
              onChange={(e) => updateData({ billing: { ...data.billing, city: e.target.value } })}
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '12px' }}
              placeholder="City"
            />
            <input
              type="text"
              value={data.billing.postcode}
              onChange={(e) => updateData({ billing: { ...data.billing, postcode: e.target.value } })}
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '12px' }}
              placeholder="Postcode"
            />
          </div>
        </div>

        {/* Payment Method */}
        <Elements stripe={stripePromise}>
          <PaymentSection onComplete={onComplete} planData={data.plan} />
        </Elements>
      </div>
    </div>
  );
}

// Payment component
function PaymentSection({ onComplete, planData }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    
    setProcessing(true);
    console.log('🎉 Demo payment completed for:', planData.planName);
    setTimeout(() => {
      onComplete({ plan: planData.selectedPlan });
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '1rem' }}>💳 Payment Method</h4>
      <div style={{
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '1.5rem'
      }}>
        <CardElement options={{
          style: {
            base: { fontSize: '16px', fontFamily: 'Inter, sans-serif' }
          },
          hidePostalCode: true
        }} />
      </div>
      
      <button
        type="submit"
        disabled={!stripe || processing}
        style={{
          width: '100%',
          padding: '16px',
          background: processing ? '#d1d5db' : 'linear-gradient(135deg, #D4A574 0%, #B8935F 100%)',
          border: 'none',
          borderRadius: '12px',
          color: 'white',
          fontSize: '16px',
          fontWeight: '600',
          cursor: processing ? 'not-allowed' : 'pointer'
        }}
      >
        {processing ? 'Processing...' : `Subscribe to ${planData.planName} - $${planData.price}/month`}
      </button>
    </form>
  );
}