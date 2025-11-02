import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  UserPlusIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon,
  ExclamationTriangleIcon, EnvelopeIcon, UserIcon, 
  LockClosedIcon, ShieldCheckIcon, KeyIcon, SparklesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface InvitationData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userGroupName: string;
  skillSet: string;
  companyName: string;
  isValid: boolean;
}

export default function InviteSignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get('invite');
  const token = searchParams.get('token');

  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Password validation
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false
  });

  useEffect(() => {
    validateInvitation();
  }, [inviteId, token]);

  useEffect(() => {
    // Real-time password validation
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  }, [password]);

  const validateInvitation = async () => {
    try {
      if (!inviteId || !token) {
        setError('Invalid invitation link. Please check your email and try again.');
        setLoading(false);
        return;
      }

      // Load invitation data from localStorage (in production, this would be an API call)
      const savedUsers = localStorage.getItem('saleskik-company-users');
      if (savedUsers) {
        const users = JSON.parse(savedUsers);
        const invitedUser = users.find((u: any) => u.id === inviteId && u.status === 'invited');
        
        if (invitedUser) {
          setInvitationData({
            id: invitedUser.id,
            email: invitedUser.email,
            firstName: invitedUser.firstName,
            lastName: invitedUser.lastName,
            userGroupName: invitedUser.userGroupName,
            skillSet: invitedUser.skillSet,
            companyName: 'Ecco Hardware', // This would come from API
            isValid: true
          });
        } else {
          setError('This invitation has expired or is no longer valid.');
        }
      } else {
        setError('Invalid invitation. Please contact your administrator.');
      }
    } catch (err) {
      setError('An error occurred while validating your invitation.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitationData || !password || !confirmPassword || !agreedToTerms) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const allPasswordRequirements = Object.values(passwordValidation).every(req => req);
    if (!allPasswordRequirements) {
      setError('Password does not meet security requirements.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Update user status from 'invited' to 'active'
      const savedUsers = localStorage.getItem('saleskik-company-users');
      if (savedUsers) {
        const users = JSON.parse(savedUsers);
        const updatedUsers = users.map((user: any) => 
          user.id === invitationData.id
            ? {
                ...user,
                status: 'active',
                lastLogin: new Date(),
                passwordSet: true,
                updatedAt: new Date()
              }
            : user
        );
        localStorage.setItem('saleskik-company-users', JSON.stringify(updatedUsers));
      }

      // TODO: In production, this would create the actual user account
      console.log('Creating account for:', invitationData.email);

      // Simulate account creation success
      setTimeout(() => {
        setSubmitting(false);
        setShowSuccessModal(true);
      }, 1000);

    } catch (err) {
      setError('Failed to create account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-96 h-72 -mb-20">
              <img src="/saleskik-logo.png" alt="SalesKik" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Complete Your Registration</h2>
            <p className="mt-2 text-gray-600">
              You've been invited to join <strong>{invitationData?.companyName}</strong> on SalesKik
            </p>
          </div>

          {/* Invitation Details Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                <UserPlusIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Your Invitation Details</h3>
                <p className="text-sm text-gray-600">Review your invitation information below</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                <UserIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{invitationData?.firstName} {invitationData?.lastName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                <EnvelopeIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{invitationData?.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                <ShieldCheckIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Role</p>
                  <p className="font-medium text-gray-900">{invitationData?.userGroupName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                <KeyIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Skill Set</p>
                  <p className="font-medium text-gray-900">{invitationData?.skillSet}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sign Up Form */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create Your Password</h3>
              <p className="text-sm text-gray-600">Set up your secure password to access SalesKik</p>
            </div>

            <form onSubmit={handleSignup} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm transition-all duration-200"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Password Requirements:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'minLength', label: 'At least 8 characters' },
                    { key: 'hasUpper', label: 'One uppercase letter' },
                    { key: 'hasLower', label: 'One lowercase letter' },
                    { key: 'hasNumber', label: 'One number' },
                    { key: 'hasSpecial', label: 'One special character' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <CheckCircleIcon 
                        className={`w-4 h-4 ${
                          passwordValidation[key as keyof typeof passwordValidation] 
                            ? 'text-green-500' 
                            : 'text-gray-300'
                        }`} 
                      />
                      <span className={`text-sm ${
                        passwordValidation[key as keyof typeof passwordValidation] 
                          ? 'text-green-700' 
                          : 'text-gray-500'
                      }`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm transition-all duration-200"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                )}
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start space-x-3">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded mt-1"
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  I agree to the{' '}
                  <a href="#" className="text-amber-600 hover:text-amber-700 font-medium">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="#" className="text-amber-600 hover:text-amber-700 font-medium">
                    Privacy Policy
                  </a>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  !password || 
                  !confirmPassword || 
                  password !== confirmPassword || 
                  !agreedToTerms || 
                  !Object.values(passwordValidation).every(req => req) ||
                  submitting
                }
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none"
              >
                {submitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <UserPlusIcon className="w-4 h-4" />
                    <span>Complete Registration</span>
                  </div>
                )}
              </button>

              {/* Help Text */}
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Need help? Contact your team administrator or{' '}
                  <a href="mailto:support@saleskik.com" className="text-amber-600 hover:text-amber-700 font-medium">
                    SalesKik Support
                  </a>
                </p>
              </div>
            </form>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <LockClosedIcon className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">Secure Registration</p>
                <p className="text-xs text-blue-600">Your data is encrypted and protected throughout the registration process.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white bg-opacity-90 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
            <div className="p-8 text-center">
              {/* Success Icon */}
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <CheckCircleIcon className="w-10 h-10 text-white" />
              </div>

              {/* Success Message */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Account Created Successfully!</h3>
                <p className="text-gray-600">
                  Welcome to <strong>{invitationData?.companyName}</strong>! Your SalesKik account has been created and you're ready to get started.
                </p>
              </div>

              {/* Welcome Details */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 mb-6 border border-amber-200">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <SparklesIcon className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-amber-800">You're all set up as:</span>
                </div>
                <p className="text-gray-700">
                  <strong>{invitationData?.firstName} {invitationData?.lastName}</strong> - {invitationData?.skillSet}
                </p>
                <p className="text-sm text-gray-600">
                  {invitationData?.userGroupName} Team Member
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Take Me to Dashboard</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}