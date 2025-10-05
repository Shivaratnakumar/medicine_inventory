import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  AlertTriangle,
  Package,
  X,
  ShoppingCart
} from 'lucide-react';
import { medicinesAPI } from '../../services/api';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const Medicines = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterExpiry, setFilterExpiry] = useState('all');
  
  const { addToCart, isInCart } = useCart();
  const { user } = useAuth();


  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Increased debounce time to 500ms

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const queryClient = useQueryClient();

  // Fetch medicines
  const { data: medicinesResponse, isLoading, error, isFetching } = useQuery(
    ['medicines', debouncedSearchTerm, filterCategory, filterExpiry],
    () => medicinesAPI.getAll({
      search: debouncedSearchTerm,
      category: filterCategory !== 'all' ? filterCategory : undefined,
      expiry: filterExpiry !== 'all' ? filterExpiry : undefined
    }),
    {
      retry: 1,
      refetchOnWindowFocus: false,
      enabled: true, // Always enabled
      onError: (error) => {
        console.error('Error fetching medicines:', error);
      }
    }
  );

  const medicines = medicinesResponse?.data || [];

  // Delete medicine mutation
  const deleteMedicineMutation = useMutation(
    (id) => medicinesAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('medicines');
        toast.success('Medicine deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete medicine');
      }
    }
  );

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      deleteMedicineMutation.mutate(id);
    }
  };

  const getExpiryStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'expired', color: 'text-red-600', bg: 'bg-red-100' };
    if (diffDays <= 30) return { status: 'expiring', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const getStockStatus = (quantity) => {
    const qty = quantity || 0;
    if (qty === 0) return { status: 'out', color: 'text-red-600', bg: 'bg-red-100' };
    if (qty <= 10) return { status: 'low', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-100' };
  };

  if (isLoading && !medicines) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">Error loading medicines</div>
        <div className="text-gray-500 mt-2">Please try refreshing the page</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medicines</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your medicine inventory
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Medicine
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {isFetching ? (
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              ) : (
                <Search className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <input
              type="text"
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
              className="input pl-10"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input"
          >
            <option value="all">All Categories</option>
            <option value="Antibiotics">Antibiotics</option>
            <option value="Pain Relief">Pain Relief</option>
            <option value="Cardiovascular">Cardiovascular</option>
            <option value="Diabetes">Diabetes</option>
            <option value="Respiratory">Respiratory</option>
            <option value="Digestive">Digestive</option>
            <option value="Vitamins">Vitamins</option>
            <option value="Topical">Topical</option>
            <option value="Eye Care">Eye Care</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={filterExpiry}
            onChange={(e) => setFilterExpiry(e.target.value)}
            className="input"
          >
            <option value="all">All Expiry Status</option>
            <option value="expired">Expired</option>
            <option value="expiring">Expiring Soon (30 days)</option>
            <option value="good">Good</option>
          </select>

          <button className="btn btn-outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>


      {/* Medicines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {(medicines && Array.isArray(medicines)) ? medicines.map((medicine) => {
          const expiryStatus = getExpiryStatus(medicine.expiry_date);
          const stockStatus = getStockStatus(medicine.quantity_in_stock || medicine.quantity);
          
          return (
            <div key={medicine.id} className="card hover:shadow-lg transition-shadow">
              <div className="card-content">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {medicine.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {medicine.description}
                    </p>
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <button
                      onClick={() => setEditingMedicine(medicine)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(medicine.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Category:</span>
                    <span className="text-sm font-medium">{medicine.categories?.name || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Price:</span>
                    <span className="text-sm font-medium">${medicine.price}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Stock:</span>
                    <span className={`text-sm font-medium ${stockStatus.color}`}>
                      {medicine.quantity_in_stock || medicine.quantity} units
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Expiry:</span>
                    <span className={`text-sm font-medium ${expiryStatus.color}`}>
                      {new Date(medicine.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.bg} ${stockStatus.color}`}>
                    {stockStatus.status === 'out' ? 'Out of Stock' :
                     stockStatus.status === 'low' ? 'Low Stock' : 'In Stock'}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${expiryStatus.bg} ${expiryStatus.color}`}>
                    {expiryStatus.status === 'expired' ? 'Expired' :
                     expiryStatus.status === 'expiring' ? 'Expiring Soon' : 'Good'}
                  </span>
                </div>

                {medicine.prescription_required && (
                  <div className="mt-2 flex items-center text-xs text-orange-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Prescription Required
                  </div>
                )}

                {/* Add to Cart Button - Only show for non-admin users */}
                {user?.role !== 'admin' && stockStatus.status !== 'out' && expiryStatus.status !== 'expired' && (
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        addToCart(medicine);
                        toast.success(`${medicine.name} added to cart!`);
                      }}
                      disabled={isInCart(medicine.id)}
                      className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isInCart(medicine.id)
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                      }`}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {isInCart(medicine.id) ? 'In Cart' : 'Add to Cart'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No medicines found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {error ? 'Error loading medicines. Please try again.' : 'Get started by adding a new medicine.'}
            </p>
          </div>
        )}
      </div>


      {/* Add/Edit Medicine Modal */}
      {(showAddModal || editingMedicine) && (
        <MedicineModal
          medicine={editingMedicine}
          onClose={() => {
            setShowAddModal(false);
            setEditingMedicine(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries('medicines');
            setShowAddModal(false);
            setEditingMedicine(null);
          }}
        />
      )}
    </div>
  );
};

// Medicine Modal Component
const MedicineModal = ({ medicine, onClose, onSuccess }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: medicine ? {
      ...medicine,
      quantity: medicine.quantity_in_stock || medicine.quantity,
      category: medicine.categories?.name || ''
    } : {}
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation(
    (data) => medicinesAPI.create(data),
    {
      onSuccess: () => {
        toast.success('Medicine added successfully');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add medicine');
      }
    }
  );

  const updateMutation = useMutation(
    (data) => medicinesAPI.update(medicine.id, data),
    {
      onSuccess: () => {
        toast.success('Medicine updated successfully');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update medicine');
      }
    }
  );

  const onSubmit = (data) => {
    if (medicine) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {medicine ? 'Edit Medicine' : 'Add New Medicine'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Medicine Name *</label>
                <input
                  {...register('name', { required: 'Medicine name is required' })}
                  className="input mt-1"
                  placeholder="Enter medicine name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Generic Name</label>
                <input
                  {...register('generic_name')}
                  className="input mt-1"
                  placeholder="Enter generic name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  {...register('description')}
                  className="input mt-1"
                  placeholder="Enter description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                <input
                  {...register('manufacturer')}
                  className="input mt-1"
                  placeholder="Enter manufacturer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select {...register('category')} className="input mt-1">
                  <option value="">Select category</option>
                  <option value="Antibiotics">Antibiotics</option>
                  <option value="Pain Relief">Pain Relief</option>
                  <option value="Cardiovascular">Cardiovascular</option>
                  <option value="Diabetes">Diabetes</option>
                  <option value="Respiratory">Respiratory</option>
                  <option value="Digestive">Digestive</option>
                  <option value="Vitamins">Vitamins</option>
                  <option value="Topical">Topical</option>
                  <option value="Eye Care">Eye Care</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                <input
                  {...register('batch_number')}
                  className="input mt-1"
                  placeholder="Enter batch number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Price *</label>
                <input
                  {...register('price', { 
                    required: 'Price is required',
                    min: { value: 0, message: 'Price must be positive' }
                  })}
                  type="number"
                  step="0.01"
                  className="input mt-1"
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity *</label>
                <input
                  {...register('quantity', { 
                    required: 'Quantity is required',
                    min: { value: 0, message: 'Quantity must be non-negative' }
                  })}
                  type="number"
                  className="input mt-1"
                  placeholder="0"
                />
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Expiry Date *</label>
                <input
                  {...register('expiry_date', { required: 'Expiry date is required' })}
                  type="date"
                  className="input mt-1"
                />
                {errors.expiry_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.expiry_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Manufacturing Date</label>
                <input
                  {...register('manufacturing_date')}
                  type="date"
                  className="input mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    {...register('prescription_required')}
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Prescription Required</span>
                </label>
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
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
              >
                {isLoading ? (
                  <div className="loading-spinner h-4 w-4"></div>
                ) : (
                  medicine ? 'Update Medicine' : 'Add Medicine'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Medicines;
