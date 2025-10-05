import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, X, Camera } from 'lucide-react';
import { profileAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: profile, isLoading, error } = useQuery(
    'profile',
    () => profileAPI.getProfile()
  );

  // Update profile mutation
  const updateProfileMutation = useMutation(
    (data) => profileAPI.updateProfile(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('profile');
        toast.success('Profile updated successfully');
        setIsEditing(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      }
    }
  );

  // Change password mutation
  const changePasswordMutation = useMutation(
    (data) => profileAPI.changePassword(data),
    {
      onSuccess: () => {
        toast.success('Password changed successfully');
        setShowPasswordModal(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to change password');
      }
    }
  );

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: profile?.data || {}
  });

  const onSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  const handleEdit = () => {
    setIsEditing(true);
    reset(profile?.data);
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset(profile?.data);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">Error loading profile</div>
        <div className="text-gray-500 mt-2">Please try refreshing the page</div>
      </div>
    );
  }

  const user = profile?.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your account information and preferences
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="btn btn-primary"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="btn btn-outline"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={updateProfileMutation.isLoading}
                className="btn btn-primary"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
            </div>
            <div className="card-content">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    {isEditing ? (
                      <input
                        {...register('first_name', { required: 'First name is required' })}
                        className="input mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{user?.first_name}</p>
                    )}
                    {errors.first_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    {isEditing ? (
                      <input
                        {...register('last_name', { required: 'Last name is required' })}
                        className="input mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{user?.last_name}</p>
                    )}
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    {isEditing ? (
                      <input
                        {...register('email', { 
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        type="email"
                        className="input mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                    )}
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    {isEditing ? (
                      <input
                        {...register('phone')}
                        type="tel"
                        className="input mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{user?.phone || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{user?.role}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Member Since</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Login</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {user?.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Profile Picture and Actions */}
        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Profile Picture</h3>
            </div>
            <div className="card-content">
              <div className="flex flex-col items-center">
                <div className="h-24 w-24 bg-primary-600 rounded-full flex items-center justify-center">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="Profile"
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-medium text-white">
                      {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                    </span>
                  )}
                </div>
                {isEditing && (
                  <button className="mt-4 btn btn-outline btn-sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Change Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Account Actions</h3>
            </div>
            <div className="card-content space-y-4">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full btn btn-outline"
              >
                Change Password
              </button>
              <button className="w-full btn btn-outline">
                Download Data
              </button>
              <button className="w-full btn btn-outline text-red-600 hover:text-red-700">
                Delete Account
              </button>
            </div>
          </div>

          {/* Account Statistics */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Account Statistics</h3>
            </div>
            <div className="card-content space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Orders Created</span>
                <span className="text-sm font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Medicines Managed</span>
                <span className="text-sm font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Last Activity</span>
                <span className="text-sm font-medium">Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSubmit={(data) => changePasswordMutation.mutate(data)}
          isLoading={changePasswordMutation.isLoading}
        />
      )}
    </div>
  );
};

// Change Password Modal
const ChangePasswordModal = ({ onClose, onSubmit, isLoading }) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const newPassword = watch('new_password');

  const handleFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Password</label>
              <input
                {...register('current_password', { required: 'Current password is required' })}
                type="password"
                className="input mt-1"
                placeholder="Enter current password"
              />
              {errors.current_password && (
                <p className="mt-1 text-sm text-red-600">{errors.current_password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                {...register('new_password', { 
                  required: 'New password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
                type="password"
                className="input mt-1"
                placeholder="Enter new password"
              />
              {errors.new_password && (
                <p className="mt-1 text-sm text-red-600">{errors.new_password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                {...register('confirm_password', { 
                  required: 'Please confirm your new password',
                  validate: value => value === newPassword || 'Passwords do not match'
                })}
                type="password"
                className="input mt-1"
                placeholder="Confirm new password"
              />
              {errors.confirm_password && (
                <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
              >
                {isLoading ? (
                  <div className="loading-spinner h-4 w-4"></div>
                ) : (
                  'Change Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
