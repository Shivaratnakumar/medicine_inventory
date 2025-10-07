import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const RegisterForm = ({ onSwitchToLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: 'user' // Default role for new registrations
      });
      
      if (result.success) {
        toast.success('Registration successful! Please sign in with your new account.');
        // Clear the form
        reset();
        // Switch back to login form after successful registration
        setTimeout(() => {
          onSwitchToLogin();
        }, 1500); // Wait 1.5 seconds to show the success message
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (error) {
      toast.error('An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white py-8 px-6 shadow-xl rounded-lg border border-medical-200">
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-medical-700">
              First Name
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-medical-400" />
              </div>
              <input
                {...register('firstName', {
                  required: 'First name is required',
                  minLength: {
                    value: 2,
                    message: 'First name must be at least 2 characters'
                  }
                })}
                type="text"
                className="input pl-10"
                placeholder="Enter your first name"
              />
            </div>
            {errors.firstName && (
              <div className="mt-1 flex items-center text-sm text-danger-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.firstName.message}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-medical-700">
              Last Name
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-medical-400" />
              </div>
              <input
                {...register('lastName', {
                  required: 'Last name is required',
                  minLength: {
                    value: 2,
                    message: 'Last name must be at least 2 characters'
                  }
                })}
                type="text"
                className="input pl-10"
                placeholder="Enter your last name"
              />
            </div>
            {errors.lastName && (
              <div className="mt-1 flex items-center text-sm text-danger-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.lastName.message}
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-medical-700">
            Email Address
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-medical-400" />
            </div>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              type="email"
              className="input pl-10"
              placeholder="Enter your email"
            />
          </div>
          {errors.email && (
            <div className="mt-1 flex items-center text-sm text-danger-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.email.message}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-medical-700">
            Phone Number (Optional)
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-medical-400" />
            </div>
            <input
              {...register('phone', {
                pattern: {
                  value: /^[\+]?[1-9][\d]{0,15}$/,
                  message: 'Invalid phone number'
                }
              })}
              type="tel"
              className="input pl-10"
              placeholder="Enter your phone number"
            />
          </div>
          {errors.phone && (
            <div className="mt-1 flex items-center text-sm text-danger-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.phone.message}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-medical-700">
            Password
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-medical-400" />
            </div>
            <input
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              type={showPassword ? 'text' : 'password'}
              className="input pl-10 pr-10"
              placeholder="Enter your password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-medical-400 hover:text-medical-600" />
              ) : (
                <Eye className="h-5 w-5 text-medical-400 hover:text-medical-600" />
              )}
            </button>
          </div>
          {errors.password && (
            <div className="mt-1 flex items-center text-sm text-danger-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.password.message}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-medical-700">
            Confirm Password
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-medical-400" />
            </div>
            <input
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: value => value === password || 'Passwords do not match'
              })}
              type={showConfirmPassword ? 'text' : 'password'}
              className="input pl-10 pr-10"
              placeholder="Confirm your password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-medical-400 hover:text-medical-600" />
              ) : (
                <Eye className="h-5 w-5 text-medical-400 hover:text-medical-600" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <div className="mt-1 flex items-center text-sm text-danger-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.confirmPassword.message}
            </div>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-primary-600 to-teal-600 hover:from-primary-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              'Create Account'
            )}
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm text-medical-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in here
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
