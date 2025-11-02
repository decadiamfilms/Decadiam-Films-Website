import React from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface PasswordRequirement {
  label: string;
  met: boolean;
}

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export const PasswordStrengthValidator: React.FC<PasswordStrengthProps> = ({ 
  password, 
  className = '' 
}) => {
  const requirements: PasswordRequirement[] = [
    {
      label: 'At least 12 characters long',
      met: password.length >= 12
    },
    {
      label: 'Contains uppercase letters',
      met: /[A-Z]/.test(password)
    },
    {
      label: 'Contains lowercase letters',
      met: /[a-z]/.test(password)
    },
    {
      label: 'Contains numbers',
      met: /\d/.test(password)
    },
    {
      label: 'Contains special characters (!@#$%^&*)',
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    },
    {
      label: 'No common patterns or repeated characters',
      met: !/(.)\1{2,}/.test(password) && !/123|abc|password|admin/i.test(password)
    }
  ];

  const metRequirements = requirements.filter(req => req.met).length;
  const strengthScore = metRequirements;
  
  const getStrengthLabel = (score: number): string => {
    if (score < 3) return 'Weak';
    if (score < 5) return 'Fair';
    if (score < 6) return 'Good';
    return 'Strong';
  };

  const getStrengthColor = (score: number): string => {
    if (score < 3) return 'text-red-600';
    if (score < 5) return 'text-yellow-600';
    if (score < 6) return 'text-blue-600';
    return 'text-green-600';
  };

  const getBarColor = (score: number): string => {
    if (score < 3) return 'bg-red-500';
    if (score < 5) return 'bg-yellow-500';
    if (score < 6) return 'bg-blue-500';
    return 'bg-green-500';
  };

  if (!password) return null;

  return (
    <div className={`mt-3 ${className}`}>
      {/* Strength Indicator */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Password Strength</span>
          <span className={`text-sm font-semibold ${getStrengthColor(strengthScore)}`}>
            {getStrengthLabel(strengthScore)}
          </span>
        </div>
        
        {/* Strength Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getBarColor(strengthScore)}`}
            style={{ width: `${(strengthScore / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 mb-2">Requirements:</p>
        {requirements.map((requirement, index) => (
          <div key={index} className="flex items-center space-x-2">
            {requirement.met ? (
              <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
              <XCircleIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
            <span 
              className={`text-sm ${
                requirement.met ? 'text-green-700' : 'text-gray-600'
              }`}
            >
              {requirement.label}
            </span>
          </div>
        ))}
      </div>

      {/* Security Tips */}
      {strengthScore < 5 && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Security Tip:</strong> Use a combination of words, numbers, and symbols. 
            Consider using a passphrase like "Coffee#Morning#2025!" instead of complex character strings.
          </p>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthValidator;