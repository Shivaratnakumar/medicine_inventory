import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Users,
  X
} from 'lucide-react';
import { storesAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const Stores = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);

  const queryClient = useQueryClient();

  // Fetch stores
  const { data: storesResponse, isLoading, error } = useQuery(
    ['stores', searchTerm],
    () => storesAPI.getAll(),
    {
      retry: 1,
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Error fetching stores:', error);
      }
    }
  );

  const stores = storesResponse?.data || [];

  // Delete store mutation
  const deleteStoreMutation = useMutation(
    (id) => storesAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('stores');
        toast.success('Store deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete store');
      }
    }
  );

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this store?')) {
      deleteStoreMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">Error loading stores</div>
        <div className="text-gray-500 mt-2">Please try refreshing the page</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stores</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your pharmacy store locations
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Store
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search stores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(stores && Array.isArray(stores)) ? stores.map((store) => (
          <div key={store.id} className="card hover:shadow-lg transition-shadow">
            <div className="card-content">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {store.name}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-2" />
                      {store.address}, {store.city}, {store.state} {store.zip_code}
                    </div>
                    {store.phone && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="h-4 w-4 mr-2" />
                        {store.phone}
                      </div>
                    )}
                    {store.email && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="h-4 w-4 mr-2" />
                        {store.email}
                      </div>
                    )}
                    {store.users && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-2" />
                        Manager: {store.users.first_name} {store.users.last_name}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1 ml-2">
                  <button
                    onClick={() => setEditingStore(store)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(store.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No stores found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {error ? 'Error loading stores. Please try again.' : 'Get started by adding a new store.'}
            </p>
            {!error && (
              <div className="mt-6">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Store
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Store Modal */}
      {(showAddModal || editingStore) && (
        <StoreModal
          store={editingStore}
          onClose={() => {
            setShowAddModal(false);
            setEditingStore(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries('stores');
            setShowAddModal(false);
            setEditingStore(null);
          }}
        />
      )}
    </div>
  );
};

// Store Modal Component
const StoreModal = ({ store, onClose, onSuccess }) => {
  console.log('🏪 StoreModal rendered with store:', store);
  
  const { register, handleSubmit, formState: { errors }, getValues, watch } = useForm({
    defaultValues: store || {}
  });
  
  // Watch form values for debugging
  const watchedValues = watch();
  console.log('📊 Current form values:', watchedValues);

  const createMutation = useMutation(
    (data) => storesAPI.create(data),
    {
      onSuccess: () => {
        toast.success('Store added successfully');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add store');
      }
    }
  );

  const updateMutation = useMutation(
    (data) => {
      return storesAPI.update(store.id, data);
    },
    {
      retry: 1, // Retry once on failure
      retryDelay: 1000, // Wait 1 second before retry
      onSuccess: (response) => {
        console.log('Store update successful:', response);
        toast.success('Store updated successfully');
        onSuccess();
      },
      onError: (error) => {
        console.error('Update failed:', error);
        console.error('Error response:', error.response);
        console.error('Error data:', error.response?.data);
        
        let errorMessage = 'Failed to update store';
        
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timeout. Please try again.';
        } else if (error.message === 'Network Error') {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        }
        
        toast.error(errorMessage);
      }
    }
  );

  const onSubmit = (data) => {
    console.log('=== STORE UPDATE DEBUG ===');
    console.log('Submitting store data:', data);
    console.log('Is editing store:', !!store);
    console.log('Store ID:', store?.id);
    console.log('Store object:', store);
    console.log('Mutation loading state:', updateMutation.isLoading);
    console.log('Mutation error state:', updateMutation.error);
    console.log('Form errors:', errors);
    console.log('================================');
    
    // Check for validation errors
    if (Object.keys(errors).length > 0) {
      console.error('❌ Form validation errors:', errors);
      toast.error('Please fix the form errors before submitting');
      return;
    }
    
    if (store && store.id) {
      console.log('🚀 Starting store update...');
      // Test with a simple data object first
      const testData = {
        name: data.name || 'Test Store',
        address: data.address || 'Test Address',
        city: data.city || 'Test City',
        state: data.state || 'TS',
        zip_code: data.zip_code || '12345',
        phone: data.phone || '+1-555-TEST',
        email: data.email || 'test@store.com'
      };
      console.log('🧪 Using test data:', testData);
      updateMutation.mutate(testData);
    } else if (!store) {
      console.log('🚀 Starting store creation...');
      createMutation.mutate(data);
    } else {
      console.error('❌ Invalid store data for update:', store);
      toast.error('Invalid store data. Please try again.');
    }
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {store ? 'Edit Store' : 'Add New Store'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>


          <form 
            onSubmit={(e) => {
              console.log('📝 Form submit event triggered');
              console.log('Event:', e);
              handleSubmit(onSubmit)(e);
            }} 
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">Store Name *</label>
              <input
                {...register('name', { required: 'Store name is required' })}
                className="input mt-1"
                placeholder="Enter store name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Address *</label>
              <textarea
                {...register('address', { required: 'Address is required' })}
                rows={3}
                className="input mt-1"
                placeholder="Enter store address"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">City *</label>
                <input
                  {...register('city', { required: 'City is required' })}
                  className="input mt-1"
                  placeholder="Enter city"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">State *</label>
                <input
                  {...register('state', { required: 'State is required' })}
                  className="input mt-1"
                  placeholder="Enter state"
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">ZIP Code *</label>
                <input
                  {...register('zip_code', { required: 'ZIP code is required' })}
                  className="input mt-1"
                  placeholder="Enter ZIP code"
                />
                {errors.zip_code && (
                  <p className="mt-1 text-sm text-red-600">{errors.zip_code.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="input mt-1"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  className="input mt-1"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline"
              >
                Cancel
              </button>
              
              {/* Debug button for testing */}
              {store && (
                <button
                  type="button"
                  onClick={() => {
                    console.log('🧪 Manual test triggered');
                    const formData = new FormData(document.querySelector('form'));
                    const data = Object.fromEntries(formData.entries());
                    console.log('Form data from FormData:', data);
                    console.log('Current form values:', document.querySelector('form'));
                    updateMutation.mutate(data);
                  }}
                  className="btn btn-secondary"
                >
                  Test Update
                </button>
              )}
              
              {/* Retry button for failed updates */}
              {updateMutation.error && store && (
                <button
                  type="button"
                  onClick={() => {
                    console.log('🔄 Manual retry triggered');
                    const formData = new FormData(document.querySelector('form'));
                    const data = Object.fromEntries(formData.entries());
                    updateMutation.mutate(data);
                  }}
                  className="btn btn-secondary"
                >
                  Retry Update
                </button>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                onClick={(e) => {
                  console.log('🔘 Submit button clicked');
                  console.log('Form valid:', Object.keys(errors).length === 0);
                  console.log('Is loading:', isLoading);
                  console.log('Store:', store);
                  // Don't prevent default - let the form handle it
                }}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="loading-spinner h-4 w-4 mr-2"></div>
                    {store ? 'Updating...' : 'Adding...'}
                  </div>
                ) : (
                  store ? 'Update Store' : 'Add Store'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Stores;
