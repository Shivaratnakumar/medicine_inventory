import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Mail, Phone, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import OTPVerification from './OTPVerification';
import PasswordResetForm from './PasswordResetForm';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState('method'); // 'method', 'email', 'sms', 'otp', 'reset'
  const [method, setMethod] = useState('email');
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm();

  const email = watch('email');
  const phone = watch('phone');

  const handleMethodSelect = (selectedMethod) => {
    setMethod(selectedMethod);
    setStep(selectedMethod);
    reset();
  };

  const onSubmitEmail = async (data) => {
    setIsLoading(true);
    try {
      const response = await authAPI.forgotPassword({
        email: data.email,
        method: 'email'
      });

      if (response.data.success) {
        toast.success('Password reset link sent to your email!');
        setUserData({ email: data.email, method: 'email' });
        setStep('email-sent');
      } else {
        toast.error(response.data.message || 'Failed to send reset email');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitSMS = async (data) => {
    setIsLoading(true);
    try {
      const response = await authAPI.forgotPassword({
        phone: data.phone,
        method: 'sms'
      });

      if (response.data.success) {
        toast.success('OTP sent to your phone number!');
        setUserData({ phone: data.phone, method: 'sms' });
        setStep('otp');
      } else {
        toast.error(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerified = (resetToken) => {
    setUserData(prev => ({ ...prev, resetToken }));
    setStep('reset');
  };

  const handlePasswordReset = () => {
    toast.success('Password reset successfully!');
    onClose();
    setStep('method');
    setUserData(null);
    reset();
  };

  const handleBack = () => {
    if (step === 'email-sent' || step === 'otp' || step === 'reset') {
      setStep('method');
      setUserData(null);
      reset();
    } else if (step === 'email' || step === 'sms') {
      setStep('method');
      reset();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 'method' && 'Forgot Password'}
            {step === 'email' && 'Reset via Email'}
            {step === 'sms' && 'Reset via SMS'}
            {step === 'email-sent' && 'Check Your Email'}
            {step === 'otp' && 'Enter OTP Code'}
            {step === 'reset' && 'Reset Password'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'method' && (
            <div className="space-y-4">
              <p className="text-gray-600 text-center">
                Choose how you'd like to reset your password
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleMethodSelect('email')}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <Mail className="h-6 w-6 text-primary-500" />
                    <div>
                      <h3 className="font-medium text-gray-900">Email Reset</h3>
                      <p className="text-sm text-gray-500">
                        We'll send a reset link to your registered email
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleMethodSelect('sms')}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <Phone className="h-6 w-6 text-primary-500" />
                    <div>
                      <h3 className="font-medium text-gray-900">SMS Reset</h3>
                      <p className="text-sm text-gray-500">
                        We'll send a 6-digit code to your registered phone
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleSubmit(onSubmitEmail)} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className="input w-full"
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <div className="mt-1 flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.email.message}
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          )}

          {step === 'sms' && (
            <form onSubmit={handleSubmit(onSubmitSMS)} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  {...register('phone', {
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[\+]?[1-9][\d]{0,15}$/,
                      message: 'Invalid phone number format'
                    }
                  })}
                  type="tel"
                  className="input w-full"
                  placeholder="Enter your phone number"
                />
                {errors.phone && (
                  <div className="mt-1 flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.phone.message}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Include country code (e.g., +1234567890)
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            </form>
          )}

          {step === 'email-sent' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Check Your Email
                </h3>
                <p className="text-gray-600">
                  We've sent a password reset link to <strong>{userData?.email}</strong>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  The link will expire in 1 hour. Check your spam folder if you don't see it.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleBack}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {step === 'otp' && (
            <OTPVerification
              phone={userData?.phone}
              onVerified={handleOTPVerified}
              onBack={handleBack}
            />
          )}

          {step === 'reset' && (
            <PasswordResetForm
              userData={userData}
              onSuccess={handlePasswordReset}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
