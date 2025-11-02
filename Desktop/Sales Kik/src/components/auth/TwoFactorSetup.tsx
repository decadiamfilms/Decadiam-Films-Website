import React, { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, QrCodeIcon, KeyIcon, CheckCircleIcon, 
  XCircleIcon, ClipboardDocumentIcon, EyeIcon, EyeSlashIcon 
} from '@heroicons/react/24/outline';

interface TwoFactorSetupProps {
  userEmail: string;
  onSetupComplete: (success: boolean) => void;
  onCancel: () => void;
}

interface EnrollmentData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  userEmail,
  onSetupComplete,
  onCancel
}) => {
  const [step, setStep] = useState<'generate' | 'scan' | 'verify' | 'backup'>('generate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodesSaved, setBackupCodesSaved] = useState(false);

  // Generate 2FA enrollment data when component mounts
  useEffect(() => {
    generateEnrollmentData();
  }, []);

  const generateEnrollmentData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔐 Generating 2FA enrollment data for:', userEmail);
      
      // In production, this would be an API call
      // For now, simulating with the frontend logic
      const response = await fetch('/api/auth/2fa/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });

      if (!response.ok) {
        throw new Error('Failed to generate 2FA data');
      }

      const data = await response.json();
      setEnrollmentData(data.data);
      setStep('scan');
    } catch (error) {
      console.error('❌ 2FA generation error:', error);
      setError('Failed to generate 2FA setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async () => {
    if (!enrollmentData || !verificationCode) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Verifying 2FA setup with code:', verificationCode);

      const response = await fetch('/api/auth/2fa/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          secret: enrollmentData.secret,
          code: verificationCode
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ 2FA setup verified successfully');
        setStep('backup');
      } else {
        setError(result.error || 'Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('❌ 2FA verification error:', error);
      setError('Verification failed. Please check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const completeTwoFactorSetup = async () => {
    if (!backupCodesSaved) {
      setError('Please save your backup codes before completing setup.');
      return;
    }

    try {
      console.log('🔐 Completing 2FA setup for:', userEmail);
      
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          secret: enrollmentData?.secret,
          backupCodes: enrollmentData?.backupCodes
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ 2FA enabled successfully');
        onSetupComplete(true);
      } else {
        setError(result.error || 'Failed to enable 2FA');
      }
    } catch (error) {
      console.error('❌ 2FA completion error:', error);
      setError('Failed to complete 2FA setup');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const copyBackupCodes = () => {
    if (enrollmentData) {
      const codesText = enrollmentData.backupCodes.join('\n');
      copyToClipboard(codesText);
    }
  };

  if (loading && !enrollmentData) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Setting up Two-Factor Authentication</h3>
            <p className="text-gray-600">Generating secure credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4">
            <ShieldCheckIcon className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Enable Two-Factor Authentication</h2>
          <p className="text-gray-600">Add an extra layer of security to your account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <XCircleIcon className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'scan' || step === 'verify' || step === 'backup' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className="w-16 h-1 bg-gray-200"></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'verify' || step === 'backup'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <div className="w-16 h-1 bg-gray-200"></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'backup'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Step Content */}
        {step === 'scan' && enrollmentData && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Scan QR Code</h3>
              <p className="text-gray-600 mb-6">
                Open your authenticator app and scan this QR code
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-4 bg-white border-2 border-gray-200 rounded-xl">
                <img 
                  src={enrollmentData.qrCodeUrl} 
                  alt="2FA QR Code" 
                  className="w-48 h-48"
                />
              </div>
            </div>

            {/* Manual Entry Option */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Can't scan? Enter manually:</h4>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-white border border-gray-300 rounded text-sm font-mono">
                  {enrollmentData.manualEntryKey}
                </code>
                <button
                  onClick={() => copyToClipboard(enrollmentData.secret)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  title="Copy to clipboard"
                >
                  <ClipboardDocumentIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Recommended Apps */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Recommended Authenticator Apps:</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Google Authenticator (iOS/Android)</p>
                <p>• Microsoft Authenticator (iOS/Android)</p>  
                <p>• Authy (Cross-platform sync)</p>
                <p>• 1Password (Premium users)</p>
              </div>
            </div>

            <button
              onClick={() => setStep('verify')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              I've Added the Account →
            </button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Verify Setup</h3>
              <p className="text-gray-600">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(value);
                  }}
                  placeholder="000000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                  autoComplete="off"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={verifySetup}
                  disabled={verificationCode.length !== 6 || loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
                <button
                  onClick={() => setStep('scan')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'backup' && enrollmentData && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2FA Setup Successful!</h3>
              <p className="text-gray-600">
                Save these backup codes in a safe place
              </p>
            </div>

            {/* Backup Codes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-yellow-900">Emergency Backup Codes</h4>
                <div className="flex gap-2">
                  <button
                    onClick={copyBackupCodes}
                    className="p-2 text-yellow-700 hover:text-yellow-900"
                    title="Copy all codes"
                  >
                    <ClipboardDocumentIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowBackupCodes(!showBackupCodes)}
                    className="p-2 text-yellow-700 hover:text-yellow-900"
                  >
                    {showBackupCodes ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              {showBackupCodes ? (
                <div className="grid grid-cols-2 gap-2">
                  {enrollmentData.backupCodes.map((code, index) => (
                    <div key={index} className="p-2 bg-white border border-yellow-300 rounded font-mono text-sm">
                      {code}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-yellow-800 text-sm">Click the eye icon to reveal backup codes</p>
                </div>
              )}
              
              <div className="mt-4 p-3 bg-yellow-100 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> These codes can be used if you lose access to your authenticator app. 
                  Each code can only be used once. Store them securely!
                </p>
              </div>
            </div>

            {/* Confirmation */}
            <div className="space-y-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={backupCodesSaved}
                  onChange={(e) => setBackupCodesSaved(e.target.checked)}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded mt-1"
                />
                <span className="text-sm text-gray-700">
                  I have saved my backup codes in a secure location and understand they are required for account recovery.
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={completeTwoFactorSetup}
                  disabled={!backupCodesSaved || loading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Complete 2FA Setup
                </button>
                <button
                  onClick={onCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step Navigation (for scan and verify steps) */}
        {(step === 'scan' || step === 'verify') && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onCancel}
              className="w-full px-6 py-2 text-gray-500 hover:text-gray-700 font-medium"
            >
              Cancel 2FA Setup
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorSetup;