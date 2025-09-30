import React, { useState, useEffect, useRef } from 'react';
import { 
  EnvelopeIcon, 
  CheckCircleIcon, 
  ArrowPathIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface StepProps {
  data: any;
  onChange: (data: any) => void;
}

function EmailVerificationStep({ data, onChange }: StepProps) {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Send initial verification code when component loads
    sendVerificationCode();
  }, []);

  useEffect(() => {
    // Countdown timer
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendVerificationCode = async () => {
    try {
      setIsResending(true);
      const code = generateVerificationCode();
      setSentCode(code);
      
      // Send email with verification code
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          firstName: data.firstName,
          verificationCode: code
        })
      });

      if (response.ok) {
        setIsCodeSent(true);
        setTimeLeft(120); // Reset timer to 2 minutes
        setCanResend(false);
        
        // For development, log the code
        console.log('Verification code sent:', code);
      } else {
        throw new Error('Failed to send verification email');
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      alert('Failed to send verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleCodeInput = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Move to next input if value entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if code is complete
    if (newCode.every(digit => digit !== '')) {
      verifyCode(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyCode = async (code: string) => {
    setIsVerifying(true);
    
    try {
      // Check if code matches
      if (code === sentCode) {
        // Mark as verified
        onChange({
          ...data,
          emailVerified: true,
          isStepComplete: true
        });
        
        // Show success
        setTimeout(() => {
          setIsVerifying(false);
        }, 1000);
      } else {
        // Invalid code
        setVerificationCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        alert('Invalid verification code. Please try again.');
        setIsVerifying(false);
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      setIsVerifying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isCodeComplete = verificationCode.every(digit => digit !== '');
  const isVerified = data.emailVerified;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <EnvelopeIcon className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
        <p className="text-gray-600">
          We've sent a 6-digit verification code to{' '}
          <span className="font-medium text-gray-900">{data.email}</span>
        </p>
      </div>

      {/* Verification Code Input */}
      <div className="max-w-md mx-auto">
        <div className="flex justify-center gap-3 mb-6">
          {verificationCode.map((digit, index) => (
            <input
              key={index}
              ref={(el) => inputRefs.current[index] = el}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeInput(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${
                isVerified 
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : digit 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300'
              }`}
              disabled={isVerifying || isVerified}
            />
          ))}
        </div>

        {/* Status Messages */}
        {isVerifying && (
          <div className="text-center text-blue-600 mb-4">
            <div className="flex items-center justify-center gap-2">
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
              <span>Verifying code...</span>
            </div>
          </div>
        )}

        {isVerified && (
          <div className="text-center text-green-600 mb-4">
            <div className="flex items-center justify-center gap-2">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="font-medium">Email verified successfully!</span>
            </div>
          </div>
        )}

        {/* Timer and Resend */}
        {!isVerified && (
          <div className="text-center">
            {timeLeft > 0 ? (
              <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
                <ClockIcon className="w-4 h-4" />
                <span className="text-sm">Code expires in {formatTime(timeLeft)}</span>
              </div>
            ) : (
              <div className="text-sm text-red-600 mb-4">Verification code expired</div>
            )}

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Didn't receive the code?</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={sendVerificationCode}
                  disabled={!canResend && timeLeft > 0}
                  className={`text-sm font-medium transition-colors ${
                    canResend || timeLeft === 0
                      ? 'text-blue-600 hover:text-blue-800 cursor-pointer'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isResending ? 'Sending...' : 'Resend verification code'}
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => {
                    onChange({
                      ...data,
                      emailVerified: true,
                      isStepComplete: true
                    });
                  }}
                  className="text-sm font-medium text-orange-600 hover:text-orange-800 cursor-pointer"
                >
                  Skip verification (dev only)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="max-w-md mx-auto bg-gray-50 rounded-xl p-4">
        <h4 className="font-medium text-gray-900 mb-2">Having trouble?</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Check your spam/junk folder</li>
          <li>• Make sure {data.email} is correct</li>
          <li>• Wait a few minutes and try resending</li>
        </ul>
        
        {/* Development Helper */}
        {sentCode && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Development Helper:</strong> Verification code is <span className="font-mono font-bold">{sentCode}</span>
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              (Email sent to {data.email} - check inbox and spam folder)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmailVerificationStep;