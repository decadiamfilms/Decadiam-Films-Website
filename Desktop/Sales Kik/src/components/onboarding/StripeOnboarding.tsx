import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/redux';
import { 
  CheckIcon,
  CreditCardIcon,
  BuildingOfficeIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');
interface OnboardingData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  businessName: string;
  industry: string;
  teamSize: string;
  selectedPlan: string;
  logo: File | null;
  logoPreview: string | null;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  priceId: string;
  interval: string;
  features: string[];
  popular?: boolean;
}

// Payment form component
function PaymentForm({ 
  onPaymentSuccess, 
  selectedPlan, 
  onboardingData 
}: {
  onPaymentSuccess: (paymentData: any) => void;
  selectedPlan: Plan;
  onboardingData: OnboardingData;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    try {
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }
      
      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: `${onboardingData.firstName} ${onboardingData.lastName}`,
          email: onboardingData.email,
        },
      });
      
      if (pmError) {
        throw new Error(pmError.message);
      }
      
      console.log('🔄 Creating subscription with payment method:', paymentMethod.id);
      
      // Call backend to create subscription
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: onboardingData.email,
          paymentMethodId: paymentMethod.id,
          priceId: selectedPlan.priceId,
          companyName: onboardingData.businessName,
          firstName: onboardingData.firstName,
          lastName: onboardingData.lastName,
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      console.log('✅ Subscription created successfully');
      
      onPaymentSuccess({
        customerId: result.data.customerId,
        subscriptionId: result.data.subscriptionId,
        plan: selectedPlan.id
      });
      
    } catch (err: any) {
      console.error('❌ Payment error:', err);
      setError(err.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Plan Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-blue-900">{selectedPlan.name} Plan</h3>
            <p className="text-blue-700 text-sm">Perfect for your business needs</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-900">${selectedPlan.price / 100}</div>
            <div className="text-blue-700 text-sm">per month</div>
          </div>
        </div>
      </div>

      {/* Card Element */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Payment Information
        </label>
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#374151',
                  fontFamily: 'Inter, sans-serif',
                  '::placeholder': {
                    color: '#9CA3AF',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || processing}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
          processing || !stripe
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg'
        }`}
      >
        {processing ? (
          <span className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Processing Payment...
          </span>
        ) : (
          `Subscribe to ${selectedPlan.name} - $${selectedPlan.price / 100}/month`
        )}
      </button>

      <div className="text-xs text-center text-gray-500">
        🔒 Secure payment powered by Stripe • Cancel anytime
      </div>
    </form>
  );
}

// Main onboarding component with Stripe integration
export function StripeOnboarding({ onComplete }: { onComplete: (data: any) => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [formData, setFormData] = useState<OnboardingData>({
    firstName: '', lastName: '', email: '', password: '',
    businessName: '', industry: '', teamSize: '', selectedPlan: '',
    logo: null, logoPreview: null
  });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const navigate = useNavigate();

  // Load Stripe plans on mount
  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/stripe/plans');
      const result = await response.json();
      if (result.success) {
        setPlans(result.data);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  };

  const updateFormData = (updates: Partial<OnboardingData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    updateFormData({ selectedPlan: plan.id });
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      console.log('🔄 Creating user account with subscription:', paymentData);
      
      // Create user account with subscription data
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          stripeCustomerId: paymentData.customerId,
          stripeSubscriptionId: paymentData.subscriptionId,
          subscriptionStatus: 'ACTIVE',
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Account created successfully');
        onComplete({ ...formData, ...paymentData });
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('❌ Account creation error:', error);
    }
  };

  const isStepValid = () => {
    if (currentStep === 0) {
      return formData.firstName && formData.lastName && formData.email && formData.password.length >= 6;
    }
    if (currentStep === 1) {
      return selectedPlan && showPayment;
    }
    if (currentStep === 2) {
      return formData.businessName && formData.industry && formData.teamSize;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 via-blue-50 to-gold-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/saleskik-logo.png" alt="SalesKik" className="w-10 h-10" />
            <span className="text-xl font-bold text-gray-900">SalesKik</span>
          </div>
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of 3
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 0 && (
              <AccountCreationStep 
                formData={formData}
                updateFormData={updateFormData}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
              />
            )}
            
            {currentStep === 1 && (
              <div>
                {!showPayment ? (
                  <PlanSelectionStep 
                    plans={plans}
                    onPlanSelect={handlePlanSelect}
                  />
                ) : (
                  <Elements stripe={stripePromise}>
                    <PaymentForm
                      onPaymentSuccess={handlePaymentSuccess}
                      selectedPlan={selectedPlan!}
                      onboardingData={formData}
                    />
                  </Elements>
                )}
              </div>
            )}
            
            {currentStep === 2 && (
              <BusinessSetupStep
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {(!showPayment || currentStep !== 1) && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-4">
              {currentStep > 0 && (
                <button
                  onClick={() => {
                    if (currentStep === 1 && showPayment) {
                      setShowPayment(false);
                    } else {
                      setCurrentStep(currentStep - 1);
                    }
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
              )}
              
              {currentStep < 2 && (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!isStepValid()}
                  className={`px-8 py-3 rounded-lg font-semibold ${
                    isStepValid()
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Account creation step component
function AccountCreationStep({ formData, updateFormData, showPassword, setShowPassword }: any) {
  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h2>
        <p className="text-gray-600">Start your SalesKik journey</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => updateFormData({ firstName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="John"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => updateFormData({ lastName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Acme Pool Fencing"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="john@acmepools.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => updateFormData({ password: e.target.value })}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
    </div>
  );
}

// Plan selection step
function PlanSelectionStep({ plans, onPlanSelect }: { plans: Plan[]; onPlanSelect: (plan: Plan) => void }) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
        <p className="text-gray-600">Select the plan that best fits your business needs</p>
        
        <div className="mt-4">
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Start with 14-day free trial (no payment required)
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => onPlanSelect(plan)}
            className={`cursor-pointer rounded-xl p-6 transition-all relative border-2 border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg ${
              plan.popular ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">${plan.price / 100}</span>
                <span className="text-gray-500 ml-1">/month</span>
              </div>
              
              <ul className="space-y-2 text-sm text-left mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <CheckIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all">
                Select {plan.name}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Business setup step
function BusinessSetupStep({ formData, updateFormData }: any) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Setup</h2>
        <p className="text-gray-600">Add your business details and preferences</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
            <select
              value={formData.industry}
              onChange={(e) => updateFormData({ industry: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Team Size</label>
            <select
              value={formData.teamSize}
              onChange={(e) => updateFormData({ teamSize: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select size...</option>
              <option value="solo">Just me</option>
              <option value="small">2-5 people</option>
              <option value="medium">6-20 people</option>
              <option value="large">20+ people</option>
            </select>
          </div>
        </div>
        
        <div className="text-center">
          <button
            onClick={() => onComplete(formData)}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all"
          >
            Complete Setup
          </button>
        </div>
      </div>
    </div>
  );
}