import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppDispatch } from '../hooks/redux';
import { register } from '../store/slices/authSlice';
import { Modern2025Onboarding } from '../components/onboarding/Modern2025Onboarding';
import { StripeOnboarding } from '../components/onboarding/StripeOnboarding';
import { ModernOnboarding } from '../components/onboarding/ModernOnboarding';
import { CleanOnboarding } from '../components/onboarding/CleanOnboarding';
import { UltraModernOnboarding } from '../components/onboarding/UltraModernOnboarding';
import { PopOnboarding } from '../components/onboarding/PopOnboarding';
import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface OnboardingData {
  businessName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  industry: string;
  teamSize: string;
  goals: string[];
}

export default function PremiumOnboardingPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedData, setCompletedData] = useState<OnboardingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOnboardingComplete = async (data: OnboardingData) => {
    console.log('🚀 Onboarding completed with data:', data);
    setError(null);
    
    try {
      // Create the actual user account using SalesKik auth system
      await dispatch(register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.businessName,
      })).unwrap();
      
      // Store additional onboarding data
      localStorage.setItem('onboardingData', JSON.stringify({
        industry: data.industry,
        teamSize: data.teamSize,
        selectedPlan: data.selectedPlan,
        planSkipped: data.planSkipped,
        logo: data.logoPreview
      }));
      
      setCompletedData(data);
      setIsCompleted(true);
      
      // Redirect to login after celebration (they'll need to login with new account)
      setTimeout(() => {
        navigate('/login?registered=true');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
      console.error('Registration error:', err);
    }
  };

  if (isCompleted && completedData) {
    return <CompletionCelebration data={completedData} />;
  }

  return (
    <div>
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <span className="font-medium">Error: </span>
          {error}
        </div>
      )}
      <PopOnboarding onComplete={handleOnboardingComplete} />
    </div>
  );
}

function CompletionCelebration({ data }: { data: OnboardingData }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-primary-100 to-gold-100 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="text-center max-w-3xl mx-auto px-6"
      >
        {/* Success Animation with Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-32 h-32 bg-gradient-to-br from-green-500 via-emerald-500 to-saleskik-blue rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl relative"
        >
          <CheckCircleIcon className="w-16 h-16 text-white" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute -top-2 -right-2 w-8 h-8 bg-saleskik-gold rounded-full flex items-center justify-center"
          >
            <SparklesIcon className="w-5 h-5 text-white" />
          </motion.div>
        </motion.div>

        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-6xl font-bold mb-6">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-saleskik-blue via-primary-600 to-saleskik-gold bg-clip-text text-transparent">
              SalesKik
            </span>, {data.firstName}!
          </h1>
          <p className="text-2xl text-gray-700 mb-10 font-medium">
            <span className="font-bold text-saleskik-blue">{data.businessName}</span> is now set up and ready to grow. 
            Let's take you to your new dashboard!
          </p>
        </motion.div>

        {/* Feature Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-3 gap-8 mb-12"
        >
          {[
            { Icon: ChartBarIcon, label: 'Analytics Ready', color: 'from-blue-500 to-primary-600' },
            { Icon: RocketLaunchIcon, label: 'Business Growing', color: 'from-saleskik-gold to-yellow-500' },
            { Icon: SparklesIcon, label: 'Success Awaits', color: 'from-purple-500 to-pink-500' }
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + index * 0.1, type: "spring" }}
              whileHover={{ y: -10 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/50"
            >
              <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                <item.Icon className="w-8 h-8 text-white" />
              </div>
              <div className="text-lg font-bold text-gray-800">{item.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Loading to Dashboard */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center justify-center space-x-4 text-gray-700"
        >
          <div className="w-6 h-6 border-3 border-saleskik-blue border-t-transparent rounded-full animate-spin" />
          <span className="text-xl font-semibold">Taking you to your dashboard...</span>
        </motion.div>
      </motion.div>
    </div>
  );
}