import React, { useState } from 'react';
import { 
  ShieldCheckIcon, KeyIcon, ClockIcon, DevicePhoneMobileIcon,
  ExclamationTriangleIcon, ArrowLeftIcon 
} from '@heroicons/react/24/outline';

interface TwoFactorVerificationProps {
  userEmail: string;
  onVerificationSuccess: (rememberDevice: boolean) => void;
  onCancel: () => void;
  onBackupCodeMode: () => void;
}

export const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({
  userEmail,
  onVerificationSuccess,
  onCancel,
  onBackupCodeMode
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isBackupCodeMode, setIsBackupCodeMode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState(5);

  const verifyCode = async () => {
    if ((!verificationCode && !isBackupCodeMode) || (!backupCode && isBackupCodeMode)) {
      setError('Please enter a verification code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          code: isBackupCodeMode ? backupCode : verificationCode,
          isBackupCode: isBackupCodeMode
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ 2FA verification successful');
        onVerificationSuccess(rememberDevice);
      } else {
        setAttemptsLeft(prev => prev - 1);
        setError(result.error || 'Invalid verification code');
        
        // Clear the input
        if (isBackupCodeMode) {
          setBackupCode('');
        } else {
          setVerificationCode('');
        }

        if (attemptsLeft <= 1) {
          setError('Too many failed attempts. Account temporarily locked for security.');
        }
      }
    } catch (error) {
      console.error('❌ 2FA verification error:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      verifyCode();
    }
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8 max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4">
            <ShieldCheckIcon className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h2>
          <p className="text-gray-600">
            {isBackupCodeMode 
              ? 'Enter one of your backup codes' 
              : 'Enter the 6-digit code from your authenticator app'
            }
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Attempts Counter */}
        {attemptsLeft < 5 && (
          <div className="mb-4 text-center">
            <p className="text-sm text-orange-600">
              {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
            </p>
          </div>
        )}

        {/* Input Section */}
        <div className="space-y-6">
          {!isBackupCodeMode ? (
            /* TOTP Code Input */
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <KeyIcon className="w-4 h-4 inline mr-1" />
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(value);
                }}
                onKeyPress={handleKeyPress}
                placeholder="000000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest font-mono"
                maxLength={6}
                autoComplete="off"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Open your authenticator app to get the current code
              </p>
            </div>
          ) : (
            /* Backup Code Input */
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DevicePhoneMobileIcon className="w-4 h-4 inline mr-1" />
                Backup Code
              </label>
              <input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="XXXX-XXXX"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-wide font-mono"
                autoComplete="off"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Enter one of your 8-character backup codes
              </p>
            </div>
          )}

          {/* Remember Device Option */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <input
              type="checkbox"
              id="remember-device"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="h-5 w-5 text-blue-600 border-gray-300 rounded mt-0.5"
            />
            <div>
              <label htmlFor="remember-device" className="text-sm font-medium text-blue-900 cursor-pointer">
                Remember this device for 30 days
              </label>
              <p className="text-xs text-blue-700 mt-1">
                You won't need to enter 2FA codes on this device for 30 days
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={verifyCode}
              disabled={
                loading || 
                (!isBackupCodeMode && verificationCode.length !== 6) || 
                (isBackupCodeMode && !backupCode) ||
                attemptsLeft <= 0
              }
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            {/* Switch between TOTP and Backup Code */}
            <button
              onClick={() => {
                setIsBackupCodeMode(!isBackupCodeMode);
                setError(null);
                setVerificationCode('');
                setBackupCode('');
              }}
              className="w-full px-6 py-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              {isBackupCodeMode 
                ? '← Use Authenticator App Instead' 
                : 'Use Backup Code Instead →'
              }
            </button>

            {/* Cancel */}
            <button
              onClick={onCancel}
              className="w-full px-6 py-2 text-gray-500 hover:text-gray-700 font-medium"
            >
              Cancel Login
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <ClockIcon className="w-5 h-5 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">
              Codes expire every 30 seconds. If your code doesn't work, wait for a new one.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorVerification;