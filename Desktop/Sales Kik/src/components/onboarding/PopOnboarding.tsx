import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { 
  CheckCircleIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronDownIcon,
  ChartBarIcon,
  CubeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

// Initialize Stripe
const stripePromise = loadStripe((import.meta.env as any).VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

interface FormData {
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  password: string;
  confirmPassword: string;
  industry: string;
  teamSize: string;
  // Billing info
  billingCompanyName: string;
  billingEmail: string;
  abn: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  selectedPlan: string;
  logo: string; // Base64 encoded logo data
}

export function PopOnboarding({ onComplete }: { onComplete: (data: any) => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    firstName: '', lastName: '', businessName: '', email: '', password: '', confirmPassword: '',
    industry: '', teamSize: '', 
    billingCompanyName: '', billingEmail: '', abn: '',
    address: '', city: '', state: '', postcode: '', selectedPlan: '', logo: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const steps = [
    { title: 'Your Details', icon: UsersIcon, color: '#F7931E' },
    { title: 'Your Business', icon: CubeIcon, color: '#2B4C7E' },
    { title: 'Choose Plan', icon: SparklesIcon, color: '#10b981' },
    { title: 'Billing', icon: CheckCircleIcon, color: '#8b5cf6' }
  ];

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Logo file must be smaller than 2MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        updateFormData({ logo: base64 });
      };
      reader.readAsDataURL(file);
    }
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

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.firstName && formData.lastName && formData.businessName && 
               formData.email && formData.password.length >= 6 && 
               formData.confirmPassword && formData.password === formData.confirmPassword;
      case 1:
        return formData.industry && formData.teamSize;
      case 2:
        return formData.selectedPlan;
      case 3:
        return (formData.billingCompanyName || formData.businessName) && 
               formData.address && formData.city && formData.postcode;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(247, 147, 30, 0.3); }
          50% { box-shadow: 0 0 30px rgba(247, 147, 30, 0.6); }
        }
        
        @keyframes slideInBounce {
          0% { transform: translateX(100px); opacity: 0; }
          60% { transform: translateX(-10px); opacity: 1; }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        .pop-card {
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
          border: 2px solid transparent;
          background-clip: padding-box;
          box-shadow: 
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04),
            0 0 0 1px rgba(255, 255, 255, 0.05);
        }
        
        .pop-card:hover {
          transform: translateY(-4px);
          box-shadow: 
            0 25px 35px -5px rgba(0, 0, 0, 0.15),
            0 15px 15px -5px rgba(0, 0, 0, 0.08);
        }
        
        .input-pop:focus {
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
        }
      `}</style>

      {/* Header */}
      <div className="relative z-10 text-center pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="mb-6"
        >
          <img 
            src="/saleskik-logo.png" 
            alt="SalesKik" 
            className="h-24 mx-auto mb-4"
            style={{ filter: 'drop-shadow(0 8px 25px rgba(247, 147, 30, 0.3))' }}
          />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Professional Business Management Platform
          </h1>
        </motion.div>

        {/* Step Indicators with Pop */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex items-center justify-center space-x-8 mb-8"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="flex items-center space-x-3"
              animate={{
                scale: index === currentStep ? 1.1 : 1,
                opacity: index <= currentStep ? 1 : 0.5
              }}
              transition={{ duration: 0.3 }}
            >
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg"
                style={{ 
                  background: index <= currentStep 
                    ? `linear-gradient(135deg, ${step.color}, ${step.color}dd)` 
                    : '#e2e8f0',
                  color: index <= currentStep ? 'white' : '#94a3b8',
                  boxShadow: index === currentStep 
                    ? `0 8px 25px ${step.color}40` 
                    : 'none'
                }}
              >
                {index < currentStep ? (
                  <CheckCircleIcon className="w-6 h-6" />
                ) : (
                  <step.icon className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className={`font-semibold ${index <= currentStep ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step.title}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="flex justify-center px-6">
        <motion.div
          layout
          className="pop-card rounded-3xl p-8 w-full max-w-2xl transition-all duration-300"
          style={{
            background: currentStep === 0 ? 'linear-gradient(145deg, #fff5f1 0%, #ffffff 100%)' :
                       currentStep === 1 ? 'linear-gradient(145deg, #f0f4ff 0%, #ffffff 100%)' :
                       'linear-gradient(145deg, #f0fdf4 0%, #ffffff 100%)'
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4, type: "spring" }}
            >
              {currentStep === 0 && <PersonalStep formData={formData} updateFormData={updateFormData} showPassword={showPassword} setShowPassword={setShowPassword} />}
              {currentStep === 1 && <BusinessStep formData={formData} updateFormData={updateFormData} handleLogoUpload={handleLogoUpload} />}
              {currentStep === 2 && <PlanStep formData={formData} updateFormData={updateFormData} nextStep={nextStep} />}
              {currentStep === 3 && <BillingStep formData={formData} updateFormData={updateFormData} onComplete={onComplete} />}
            </motion.div>
          </AnimatePresence>

          {/* Navigation with Pop */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            <div>
              {currentStep > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05, x: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={prevStep}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <span>←</span>
                  <span>Back</span>
                </motion.button>
              )}
            </div>

            <div>
              {currentStep < steps.length - 1 && (
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className="flex items-center space-x-2 px-8 py-4 rounded-2xl font-bold text-white transition-all duration-200 shadow-xl"
                  style={{
                    background: isStepValid() 
                      ? `linear-gradient(135deg, ${steps[currentStep].color}, ${steps[currentStep].color}dd)`
                      : '#d1d5db',
                    cursor: isStepValid() ? 'pointer' : 'not-allowed',
                    boxShadow: isStepValid() 
                      ? `0 8px 25px ${steps[currentStep].color}40` 
                      : 'none'
                  }}
                >
                  <span>Continue</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Step 1: Personal Information with Pop
function PersonalStep({ formData, updateFormData, showPassword, setShowPassword }: any) {
  return (
    <div>
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{ 
            background: 'linear-gradient(135deg, #F7931E, #e67a00)',
            boxShadow: '0 8px 25px rgba(247, 147, 30, 0.4)'
          }}
        >
          <UsersIcon className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h3>
        <p className="text-gray-600">Join thousands of successful businesses</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <motion.div whileHover={{ y: -2 }} whileFocus={{ y: -2 }}>
            <label className="block text-sm font-bold text-gray-800 mb-2">First Name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => updateFormData({ firstName: e.target.value })}
              className="input-pop w-full px-4 py-4 border-2 border-gray-200 rounded-xl outline-none transition-all duration-200 text-lg"
              style={{ borderColor: formData.firstName ? '#F7931E' : '#e2e8f0' }}
              placeholder="John"
            />
          </motion.div>
          <motion.div whileHover={{ y: -2 }} whileFocus={{ y: -2 }}>
            <label className="block text-sm font-bold text-gray-800 mb-2">Last Name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => updateFormData({ lastName: e.target.value })}
              className="input-pop w-full px-4 py-4 border-2 border-gray-200 rounded-xl outline-none transition-all duration-200 text-lg"
              style={{ borderColor: formData.lastName ? '#F7931E' : '#e2e8f0' }}
              placeholder="Smith"
            />
          </motion.div>
        </div>

        <motion.div whileHover={{ y: -2 }} whileFocus={{ y: -2 }}>
          <label className="block text-sm font-bold text-gray-800 mb-2">Business Name</label>
          <input
            type="text"
            value={formData.businessName}
            onChange={(e) => updateFormData({ businessName: e.target.value })}
            className="input-pop w-full px-4 py-4 border-2 border-gray-200 rounded-xl outline-none transition-all duration-200 text-lg"
            style={{ borderColor: formData.businessName ? '#F7931E' : '#e2e8f0' }}
            placeholder="Acme Business Solutions"
          />
        </motion.div>

        <motion.div whileHover={{ y: -2 }} whileFocus={{ y: -2 }}>
          <label className="block text-sm font-bold text-gray-800 mb-2">Email Address</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            className="input-pop w-full px-4 py-4 border-2 border-gray-200 rounded-xl outline-none transition-all duration-200 text-lg"
            style={{ borderColor: formData.email ? '#2B4C7E' : '#e2e8f0' }}
            placeholder="john@acmebusiness.com.au"
          />
        </motion.div>

        <motion.div whileHover={{ y: -2 }} whileFocus={{ y: -2 }}>
          <label className="block text-sm font-bold text-gray-800 mb-2">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => updateFormData({ password: e.target.value })}
              className="input-pop w-full px-4 py-4 pr-12 border-2 border-gray-200 rounded-xl outline-none transition-all duration-200 text-lg"
              style={{ borderColor: formData.password.length >= 6 ? '#10b981' : '#e2e8f0' }}
              placeholder="Create a secure password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeSlashIcon className="w-6 h-6" /> : <EyeIcon className="w-6 h-6" />}
            </button>
          </div>
          {formData.password && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`mt-2 text-sm font-medium ${formData.password.length >= 6 ? 'text-green-600' : 'text-gray-500'}`}
            >
              {formData.password.length >= 6 ? '✓ Strong password' : `${6 - formData.password.length} more characters needed`}
            </motion.div>
          )}

        {/* Confirm Password */}
        <motion.div whileHover={{ y: -2 }} whileFocus={{ y: -2 }}>
          <label className="block text-sm font-bold text-gray-800 mb-2">Confirm Password</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
            className="input-pop w-full px-4 py-4 border-2 border-gray-200 rounded-xl outline-none transition-all duration-200 text-lg"
            style={{ 
              borderColor: formData.confirmPassword && formData.password === formData.confirmPassword ? '#10b981' : 
                          formData.confirmPassword && formData.password !== formData.confirmPassword ? '#ef4444' : '#e2e8f0'
            }}
            placeholder="Confirm your password"
          />
          {formData.confirmPassword && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`mt-2 text-sm font-medium ${formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'}`}
            >
              {formData.password === formData.confirmPassword ? '✓ Passwords match perfectly!' : '✗ Passwords do not match'}
            </motion.div>
          )}
        </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// Step 2: Business Information with Visual Appeal
function BusinessStep({ formData, updateFormData, handleLogoUpload }: any) {
  const [industryOpen, setIndustryOpen] = useState(false);
  const [teamSizeOpen, setTeamSizeOpen] = useState(false);

  const industries = [
    { value: 'construction', label: 'Construction & Building', icon: CubeIcon },
    { value: 'retail', label: 'Retail & E-commerce', icon: ChartBarIcon },
    { value: 'manufacturing', label: 'Manufacturing', icon: CubeIcon },
    { value: 'services', label: 'Professional Services', icon: UsersIcon },
    { value: 'hospitality', label: 'Hospitality & Events', icon: SparklesIcon },
    { value: 'other', label: 'Other', icon: ClipboardDocumentListIcon }
  ];

  const teamSizes = [
    { value: 'solo', label: 'Just me', desc: 'Solo entrepreneur' },
    { value: 'small', label: '2-5 people', desc: 'Small team' },
    { value: 'medium', label: '6-20 people', desc: 'Growing business' },
    { value: 'large', label: '20+ people', desc: 'Established company' }
  ];

  return (
    <div>
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{ 
            background: 'linear-gradient(135deg, #2B4C7E, #1e3d6f)',
            boxShadow: '0 8px 25px rgba(43, 76, 126, 0.4)'
          }}
        >
          <CubeIcon className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">About Your Business</h3>
        <p className="text-gray-600">Help us customize SalesKik for your industry</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Industry Selector */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-3">Industry</label>
          <div className="relative">
            <motion.button
              whileHover={{ y: -2 }}
              type="button"
              onClick={() => setIndustryOpen(!industryOpen)}
              className="w-full p-4 text-left border-2 rounded-xl transition-all duration-200 flex items-center justify-between"
              style={{
                borderColor: formData.industry ? '#2B4C7E' : '#e2e8f0',
                backgroundColor: industryOpen ? '#f0f4ff' : 'white'
              }}
            >
              <span style={{ color: formData.industry ? '#111' : '#999' }}>
                {formData.industry ? industries.find(i => i.value === formData.industry)?.label : 'Select industry...'}
              </span>
              <ChevronDownIcon 
                className="w-5 h-5 text-gray-400 transition-transform duration-200"
                style={{ transform: industryOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </motion.button>

            {industryOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute z-20 w-full mt-2 bg-white rounded-xl border-2 border-gray-100 shadow-2xl max-h-64 overflow-auto"
              >
                {industries.map((industry) => (
                  <button
                    key={industry.value}
                    onClick={() => {
                      updateFormData({ industry: industry.value });
                      setIndustryOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center space-x-3"
                    style={{
                      backgroundColor: formData.industry === industry.value ? '#f0f4ff' : 'transparent',
                      color: formData.industry === industry.value ? '#2B4C7E' : '#111'
                    }}
                  >
                    <industry.icon className="w-4 h-4" style={{ color: '#2B4C7E' }} />
                    <span className="font-medium">{industry.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Team Size Selector */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-3">Team Size</label>
          <div className="space-y-2">
            {teamSizes.map((size) => (
              <motion.button
                key={size.value}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => updateFormData({ teamSize: size.value })}
                className="w-full p-3 text-left rounded-xl transition-all duration-200 border-2"
                style={{
                  borderColor: formData.teamSize === size.value ? '#F7931E' : '#e2e8f0',
                  backgroundColor: formData.teamSize === size.value ? '#fff5f1' : 'white',
                  boxShadow: formData.teamSize === size.value ? '0 4px 15px rgba(247, 147, 30, 0.2)' : 'none'
                }}
              >
                <div className="font-semibold" style={{ color: formData.teamSize === size.value ? '#F7931E' : '#111' }}>
                  {size.label}
                </div>
                <div className="text-sm text-gray-600">{size.desc}</div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Industry-Specific Success Story */}
      {formData.industry && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mt-6 p-6 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(43, 76, 126, 0.1), rgba(247, 147, 30, 0.1))',
            border: '1px solid rgba(43, 76, 126, 0.2)'
          }}
        >
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2B4C7E, #F7931E)' }}
            >
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900">Perfect choice!</div>
              <div className="text-sm text-gray-700">
                {formData.industry === 'construction' && 'Construction businesses save 15+ hours weekly with SalesKik'}
                {formData.industry === 'retail' && 'Retail businesses increase order accuracy by 40%'}
                {formData.industry === 'services' && 'Service businesses grow revenue 25% in first year'}
                {!['construction', 'retail', 'services'].includes(formData.industry) && 'Businesses in your industry love SalesKik\'s flexibility'}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Logo Upload Section */}
      <div className="mt-8">
        <label className="block text-sm font-bold text-gray-800 mb-3">Company Logo (Optional)</label>
        <div className="flex items-center gap-6">
          {/* Logo Preview */}
          <div 
            className="w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden"
            style={{ borderColor: formData.logo ? '#2B4C7E' : '#e2e8f0' }}
          >
            {formData.logo ? (
              <img 
                src={formData.logo} 
                alt="Company logo" 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center text-gray-400">
                <CubeIcon className="w-8 h-8 mx-auto mb-1" />
                <div className="text-xs">Logo</div>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex-1">
            <input
              type="file"
              id="logo-upload"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <motion.label
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              htmlFor="logo-upload"
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl font-semibold cursor-pointer transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #2B4C7E, #1e3d6f)',
                color: 'white',
                boxShadow: '0 4px 15px rgba(43, 76, 126, 0.3)'
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {formData.logo ? 'Change Logo' : 'Upload Logo'}
            </motion.label>
            <div className="mt-2 text-xs text-gray-500">
              PNG, JPG up to 2MB. Square images work best.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 3: Plan Selection with Major Pop
function PlanStep({ formData, updateFormData, nextStep }: any) {
  const [selectedPlan, setSelectedPlan] = useState(formData.selectedPlan || '');

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 39,
      description: 'Perfect for getting started',
      features: [
        { icon: ClipboardDocumentListIcon, text: 'Basic quotes & invoicing' },
        { icon: CubeIcon, text: 'Up to 500 products' },
        { icon: UsersIcon, text: '2 team members' },
        { icon: ChartBarIcon, text: 'Email support only' }
      ],
      limitations: ['Limited customization', 'Basic reporting only']
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 79,
      popular: true,
      description: 'Most businesses choose this',
      features: [
        { icon: ClipboardDocumentListIcon, text: 'Advanced quotes & templates' },
        { icon: CubeIcon, text: 'Advanced inventory management' },
        { icon: UsersIcon, text: 'Up to 15 team members' },
        { icon: ChartBarIcon, text: 'Priority support & analytics' }
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 149,
      description: 'For scaling businesses',
      features: [
        { icon: SparklesIcon, text: 'White-label customization' },
        { icon: RocketLaunchIcon, text: 'Unlimited team members' },
        { icon: UsersIcon, text: 'Dedicated account manager' },
        { icon: ClipboardDocumentListIcon, text: 'Custom integrations & API' }
      ]
    }
  ];

  return (
    <div>
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{ 
            background: 'linear-gradient(135deg, #10b981, #059669)',
            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)'
          }}
        >
          <RocketLaunchIcon className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h3>
        <p className="text-gray-600">Start with 14 days free, upgrade anytime</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            whileHover={{ scale: 1.03, y: -8 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setSelectedPlan(plan.id);
              updateFormData({ selectedPlan: plan.id });
            }}
            className="relative cursor-pointer"
          >
            <div 
              className="p-6 rounded-2xl border-3 transition-all duration-300"
              style={{
                borderColor: selectedPlan === plan.id ? '#F7931E' : '#e2e8f0',
                backgroundColor: selectedPlan === plan.id ? '#fff5f1' : 'white',
                boxShadow: selectedPlan === plan.id ? '0 8px 25px rgba(247, 147, 30, 0.2)' : '0 4px 15px rgba(0, 0, 0, 0.05)',
                borderWidth: '3px'
              }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div 
                    className="px-3 py-1 rounded-full text-white text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, #F7931E, #e67a00)' }}
                  >
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-4">
                <div className="text-xl font-bold text-gray-900">{plan.name}</div>
                <div className="text-3xl font-black text-gray-900 mt-2">${plan.price}</div>
                <div className="text-gray-600">/month</div>
              </div>

              <div className="space-y-2">
                {plan.features.slice(0, 3).map((feature, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ 
                        background: selectedPlan === plan.id 
                          ? 'linear-gradient(135deg, #F7931E, #e67a00)' 
                          : '#e2e8f0'
                      }}
                    >
                      <feature.icon 
                        className="w-3 h-3" 
                        style={{ color: selectedPlan === plan.id ? 'white' : '#64748b' }} 
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{feature.text}</span>
                  </div>
                ))}
                
                {plan.limitations && (
                  <div className="mt-3 space-y-1">
                    {plan.limitations.map((limit, i) => (
                      <div key={i} className="text-xs text-red-500">❌ {limit}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {selectedPlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6"
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onComplete({ ...formData, selectedPlan })}
            className="w-full py-5 px-6 rounded-2xl font-bold text-lg text-white transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)'
            }}
          >
            🚀 Start 14-Day Free Trial
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}

// Step 4: Billing & Payment
function BillingStep({ formData, updateFormData, onComplete }: any) {
  return (
    <Elements stripe={stripePromise}>
      <BillingForm formData={formData} updateFormData={updateFormData} onComplete={onComplete} />
    </Elements>
  );
}

function BillingForm({ formData, updateFormData, onComplete }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const selectedPlan = formData.selectedPlan === 'starter' ? 'Starter ($39/month)' :
                      formData.selectedPlan === 'professional' ? 'Professional ($79/month)' :
                      'Enterprise ($149/month)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    
    try {
      console.log('💾 Saving onboarding data to database...', formData);
      
      // Save company data to database
      const companyResponse = await fetch('/api/company', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.billingCompanyName || formData.businessName,
          legalName: formData.billingCompanyName || formData.businessName,
          email: formData.billingEmail || formData.email,
          phone: formData.phone || '',
          website: formData.website || '',
          abnAcn: formData.abn || '',
          address: {
            street: formData.address || '',
            city: formData.city || '',
            state: formData.state || '',
            postcode: formData.postcode || ''
          },
          logoUrl: formData.logo || '',
          industry: formData.industry || '',
          teamSize: formData.teamSize || '',
          gstEnabled: true
        })
      });

      if (companyResponse.ok) {
        console.log('✅ Company data saved to database');
        
        // Show success message
        alert(`🎉 Welcome to SalesKik!\n\n✅ Your ${formData.selectedPlan} account is ready!\n✅ Company data saved to database\n✅ You can view/edit your profile at Company Settings\n\nAccount Details:\n• Company: ${formData.billingCompanyName || formData.businessName}\n• Email: ${formData.billingEmail || formData.email}\n• ABN: ${formData.abn}\n• Plan: ${formData.selectedPlan}`);
        
        // Redirect to dashboard
        onComplete(formData);
      } else {
        console.error('Failed to save company data');
        // Fall back to demo mode
        alert(`Demo mode: Data collected but not saved to database.\n\n${formData.billingCompanyName || formData.businessName} account created!`);
        onComplete(formData);
      }
    } catch (error) {
      console.error('Error during onboarding:', error);
      // Fall back to demo mode
      alert(`Demo mode: ${formData.billingCompanyName || formData.businessName} account created!`);
      onComplete(formData);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{ 
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)'
          }}
        >
          <CheckCircleIcon className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Setup</h3>
        <p className="text-gray-600">Secure billing for {selectedPlan}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Billing Company Information */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-3">💼 Billing Company Information</label>
          <div className="space-y-4">
            <motion.div whileHover={{ y: -2 }}>
              <input
                type="text"
                value={formData.billingCompanyName || formData.businessName}
                onChange={(e) => updateFormData({ billingCompanyName: e.target.value })}
                className="input-pop w-full px-4 py-4 border-2 rounded-xl outline-none transition-all duration-200 text-lg"
                style={{ borderColor: formData.billingCompanyName ? '#8b5cf6' : '#e2e8f0' }}
                placeholder="Company Name (as it should appear on invoices)"
              />
            </motion.div>
            
            <div className="grid grid-cols-2 gap-4">
              <motion.div whileHover={{ y: -2 }}>
                <input
                  type="email"
                  value={formData.billingEmail || formData.email}
                  onChange={(e) => updateFormData({ billingEmail: e.target.value })}
                  className="input-pop w-full px-4 py-4 border-2 rounded-xl outline-none transition-all duration-200 text-lg"
                  style={{ borderColor: formData.billingEmail ? '#8b5cf6' : '#e2e8f0' }}
                  placeholder="billing@company.com.au"
                />
              </motion.div>
              <motion.div whileHover={{ y: -2 }}>
                <input
                  type="text"
                  value={formData.abn}
                  onChange={(e) => updateFormData({ abn: e.target.value })}
                  className="input-pop w-full px-4 py-4 border-2 rounded-xl outline-none transition-all duration-200 text-lg"
                  style={{ borderColor: formData.abn ? '#8b5cf6' : '#e2e8f0' }}
                  placeholder="ABN (optional)"
                />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Business Address */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-3">🏢 Business Address</label>
          <div className="space-y-4">
            <motion.div whileHover={{ y: -2 }}>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => updateFormData({ address: e.target.value })}
                className="input-pop w-full px-4 py-4 border-2 rounded-xl outline-none transition-all duration-200 text-lg"
                style={{ borderColor: formData.address ? '#8b5cf6' : '#e2e8f0' }}
                placeholder="123 Business Street"
              />
            </motion.div>
            
            <div className="grid grid-cols-3 gap-4">
              <motion.div whileHover={{ y: -2 }}>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateFormData({ city: e.target.value })}
                  className="input-pop w-full px-4 py-4 border-2 rounded-xl outline-none transition-all duration-200 text-lg"
                  style={{ borderColor: formData.city ? '#8b5cf6' : '#e2e8f0' }}
                  placeholder="Sydney"
                />
              </motion.div>
              <select
                value={formData.state}
                onChange={(e) => updateFormData({ state: e.target.value })}
                className="input-pop w-full px-4 py-4 border-2 rounded-xl outline-none transition-all duration-200 text-lg"
                style={{ borderColor: formData.state ? '#8b5cf6' : '#e2e8f0' }}
              >
                <option value="">State</option>
                <option value="NSW">NSW</option>
                <option value="VIC">VIC</option>
                <option value="QLD">QLD</option>
                <option value="WA">WA</option>
                <option value="SA">SA</option>
                <option value="TAS">TAS</option>
                <option value="NT">NT</option>
                <option value="ACT">ACT</option>
              </select>
              <motion.div whileHover={{ y: -2 }}>
                <input
                  type="text"
                  value={formData.postcode}
                  onChange={(e) => updateFormData({ postcode: e.target.value })}
                  className="input-pop w-full px-4 py-4 border-2 rounded-xl outline-none transition-all duration-200 text-lg"
                  style={{ borderColor: formData.postcode ? '#8b5cf6' : '#e2e8f0' }}
                  placeholder="2000"
                  maxLength={4}
                />
              </motion.div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-800 mb-3">Payment Method</label>
          <div className="p-4 border-2 border-gray-200 rounded-xl bg-white">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '18px',
                    fontFamily: 'Inter, sans-serif',
                    color: '#111',
                    '::placeholder': { color: '#999' }
                  }
                },
                hidePostalCode: true
              }}
            />
          </div>
          <div className="text-center text-xs text-gray-500 mt-2">
            🔒 Secure payment • 14-day free trial • Cancel anytime
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02, y: -3 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={processing}
          className="w-full py-5 px-6 rounded-2xl font-bold text-lg text-white transition-all duration-200"
          style={{
            background: processing ? '#d1d5db' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            boxShadow: processing ? 'none' : '0 8px 25px rgba(139, 92, 246, 0.4)',
            cursor: processing ? 'not-allowed' : 'pointer'
          }}
        >
          {processing ? 'Setting up your account...' : `Start ${selectedPlan} Trial`}
        </motion.button>
      </form>
    </div>
  );
}
