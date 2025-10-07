import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import PasswordResetForm from '../../components/Auth/PasswordResetForm';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [isValidToken, setIsValidToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    
    if (!tokenFromUrl) {
      setIsValidToken(false);
      setIsLoading(false);
      return;
    }

    setToken(tokenFromUrl);
    setIsValidToken(true);
    setIsLoading(false);
  }, [searchParams]);

  const handlePasswordReset = () => {
    toast.success('Password reset successfully! You can now log in with your new password.');
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-50 via-primary-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying reset token...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-50 via-primary-50 to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center shadow-lg">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              This password reset link is invalid or has expired.
            </p>
          </div>

          <div className="bg-white py-8 px-6 shadow-xl rounded-lg border border-gray-200">
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Please request a new password reset link from the login page.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/login')}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  Go to Login
                </button>
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Request New Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-primary-50 to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-primary-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-medical-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-sm text-medical-600">
            Create a new password for your account
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg border border-medical-200">
          <PasswordResetForm
            userData={{ 
              method: 'email', 
              resetToken: token 
            }}
            onSuccess={handlePasswordReset}
            onBack={() => navigate('/login')}
          />
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
