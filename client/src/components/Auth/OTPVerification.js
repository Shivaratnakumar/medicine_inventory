import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';

const OTPVerification = ({ phone, onVerified, onBack }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleSubmit(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    setError('');

    // Focus the next empty field or the last field
    const nextEmptyIndex = newOtp.findIndex(digit => digit === '');
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();

    // Auto-submit if all fields are filled
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleSubmit(newOtp.join(''));
    }
  };

  const handleSubmit = async (otpCode = null) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    if (attempts >= 3) {
      setError('Too many attempts. Please request a new OTP.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.verifyOTP(phone, code);
      
      if (response.data.success) {
        toast.success('OTP verified successfully!');
        onVerified(response.data.resetToken);
      } else {
        setError(response.data.message || 'Invalid OTP');
        setAttempts(prev => prev + 1);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to verify OTP';
      setError(errorMessage);
      setAttempts(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    setAttempts(0);
    setOtp(['', '', '', '', '', '']);
    setTimeLeft(600);

    try {
      const response = await authAPI.forgotPassword({
        phone: phone,
        method: 'sms'
      });

      if (response.data.success) {
        toast.success('New OTP sent to your phone!');
      } else {
        toast.error(response.data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Enter Verification Code
        </h3>
        <p className="text-gray-600">
          We sent a 6-digit code to <strong>{phone}</strong>
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center space-x-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`w-12 h-12 text-center text-lg font-semibold border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center justify-center text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            {error}
          </div>
        )}

        {attempts > 0 && (
          <div className="text-center text-sm text-gray-500">
            Attempts: {attempts}/3
          </div>
        )}
      </div>

      <div className="text-center space-y-4">
        {timeLeft > 0 ? (
          <p className="text-sm text-gray-500">
            Code expires in <span className="font-medium text-gray-900">{formatTime(timeLeft)}</span>
          </p>
        ) : (
          <p className="text-sm text-red-600">
            Code has expired. Please request a new one.
          </p>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onBack}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          
          <button
            onClick={() => handleSubmit()}
            disabled={isLoading || otp.some(digit => digit === '') || timeLeft === 0}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </button>
        </div>

        <button
          onClick={handleResend}
          disabled={isResending || timeLeft > 0}
          className="text-sm text-primary-600 hover:text-primary-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center mx-auto"
        >
          {isResending ? (
            <>
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              Resending...
            </>
          ) : (
            "Didn't receive the code? Resend"
          )}
        </button>
      </div>
    </div>
  );
};

export default OTPVerification;
