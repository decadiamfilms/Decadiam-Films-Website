import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

interface StepProps {
  data: any;
  onChange: (data: any) => void;
}

function AccountCreationStep({ data, onChange }: StepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: data.email || '',
    password: data.password || '',
    confirmPassword: data.confirmPassword || '',
    firstName: data.firstName || '',
    lastName: data.lastName || ''
  });

  const handleChange = (field: string, value: string) => {
    try {
      const updatedData = { ...formData, [field]: value };
      setFormData(updatedData);
      
      // Safely call onChange
      if (typeof onChange === 'function') {
        onChange({ ...data, ...updatedData });
      }
    } catch (error) {
      console.error('Error updating form data:', error);
    }
  };

  // Simple validation for Next button (no complex UI rendering)
  const hasAllFields = formData.email && formData.firstName && formData.lastName && 
                      formData.password && formData.confirmPassword;
  
  // Update parent data for navigation
  React.useEffect(() => {
    if (onChange && hasAllFields) {
      onChange({ 
        ...data, 
        ...formData,
        isStepComplete: hasAllFields
      });
    }
  }, [formData, hasAllFields]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h2>
        <p className="text-gray-600">Let's start by setting up your SalesKik account</p>
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Smith"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
          <div className="relative">
            <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@company.com"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
          <div className="relative">
            <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Confirm Password - Simplified */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
          <input
            type="password"
            required
            value={formData.confirmPassword || ''}
            onChange={(e) => {
              try {
                setFormData(prev => ({ ...prev, confirmPassword: e.target.value }));
                if (onChange) {
                  onChange({ ...data, confirmPassword: e.target.value });
                }
              } catch (err) {
                console.log('Confirm password error:', err);
              }
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Re-enter your password"
          />
        </div>

        {/* Terms Agreement */}
        <div className="bg-gray-50 rounded-lg p-4">
          <label className="flex items-start">
            <input
              type="checkbox"
              required
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1 mr-3"
            />
            <span className="text-sm text-gray-700">
              I agree to the{' '}
              <a href="/terms" className="text-blue-600 hover:text-blue-800">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-blue-600 hover:text-blue-800">Privacy Policy</a>
            </span>
          </label>
        </div>

        {/* Removed all validation UI that could cause crashes */}
      </div>
    </div>
  );
}

export default AccountCreationStep;