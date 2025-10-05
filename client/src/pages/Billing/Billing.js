import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Download,
  Receipt,
  DollarSign,
  Calendar,
  User,
  CreditCard,
  X
} from 'lucide-react';
import { billingAPI, ordersAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const Billing = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);

  const queryClient = useQueryClient();

  // Fetch billing records
  const { data: billingResponse, isLoading, error } = useQuery(
    ['billing', searchTerm, statusFilter],
    () => billingAPI.getAll({
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined
    }),
    {
      retry: 1,
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Error fetching billing records:', error);
        toast.error('Failed to load billing records');
      }
    }
  );

  const billingRecords = billingResponse?.data || [];

  // Fetch orders for billing creation
  const { data: ordersResponse } = useQuery(
    'orders-for-billing',
    () => ordersAPI.getAll({ limit: 1000 })
  );

  const orders = ordersResponse?.data || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return '✓';
      case 'pending': return '⏳';
      case 'failed': return '✗';
      case 'refunded': return '↩';
      default: return '?';
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">Error loading billing records</div>
        <div className="text-gray-500 mt-2">Please try refreshing the page</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage invoices, payments, and billing records
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-md bg-blue-500">
                  <Receipt className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Invoices
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {billingRecords?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-md bg-green-500">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Revenue
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    ${(billingRecords && Array.isArray(billingRecords) 
                      ? billingRecords.reduce((sum, record) => 
                          record.payment_status === 'paid' ? sum + parseFloat(record.total_amount || 0) : sum, 0
                        )
                      : 0
                    ).toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-md bg-yellow-500">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {(billingRecords && Array.isArray(billingRecords)) 
                      ? billingRecords.filter(r => r.payment_status === 'pending').length 
                      : 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-md bg-red-500">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Overdue
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {(billingRecords && Array.isArray(billingRecords)) 
                      ? billingRecords.filter(r => {
                          if (r.payment_status === 'paid') return false;
                          const dueDate = new Date(r.due_date);
                          const today = new Date();
                          return dueDate < today;
                        }).length 
                      : 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          <button className="btn btn-outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Billing Records Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Billing Records ({billingRecords?.length || 0})
          </h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {(billingRecords && Array.isArray(billingRecords)) ? billingRecords.map((record) => (
            <li key={record.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-primary-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {record.invoice_number}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {record.customer_name}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(record.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        ${record.total_amount}
                      </div>
                      {record.due_date && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Due: {new Date(record.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.payment_status)}`}>
                    <span className="mr-1">{getStatusIcon(record.payment_status)}</span>
                    {record.payment_status.charAt(0).toUpperCase() + record.payment_status.slice(1)}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedBilling(record)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-green-600">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          )) : (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No billing records found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {error ? 'Error loading billing records. Please try again.' : 'Get started by creating a new invoice.'}
              </p>
              {!error && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="btn btn-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Invoice
                  </button>
                </div>
              )}
            </div>
          )}
        </ul>
      </div>

      {/* Create Invoice Modal */}
      {showAddModal && (
        <CreateInvoiceModal
          orders={orders || []}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries('billing');
            setShowAddModal(false);
          }}
        />
      )}

      {/* Billing Details Modal */}
      {selectedBilling && (
        <BillingDetailsModal
          billing={selectedBilling}
          onClose={() => setSelectedBilling(null)}
        />
      )}
    </div>
  );
};

// Create Invoice Modal
const CreateInvoiceModal = ({ orders, onClose, onSuccess }) => {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm();
  const selectedOrderId = watch('order_id');
  
  // Debug logging
  console.log('CreateInvoiceModal - orders prop:', orders);
  console.log('CreateInvoiceModal - orders length:', orders?.length);

  const createBillingMutation = useMutation(
    (data) => billingAPI.create(data),
    {
      onSuccess: (response) => {
        console.log('Invoice created successfully:', response);
        toast.success('Invoice created successfully');
        onSuccess();
      },
      onError: (error) => {
        console.error('Failed to create invoice:', error);
        console.error('Error response:', error.response?.data);
        toast.error(error.response?.data?.message || 'Failed to create invoice');
      }
    }
  );

  const onSubmit = (data) => {
    console.log('Form submitted with data:', data);
    console.log('Form errors:', errors);
    
    // Convert string numbers to actual numbers
    const processedData = {
      ...data,
      subtotal: parseFloat(data.subtotal) || 0,
      tax_amount: parseFloat(data.tax_amount) || 0,
      discount_amount: parseFloat(data.discount_amount) || 0,
      total_amount: parseFloat(data.total_amount) || 0
    };
    
    console.log('Processed data:', processedData);
    createBillingMutation.mutate(processedData);
  };

  const selectedOrder = orders.find(order => order.id === selectedOrderId);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create Invoice</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Order (Optional)</label>
              <select
                {...register('order_id')}
                className="input mt-1"
                onChange={(e) => {
                  const orderId = e.target.value;
                  setValue('order_id', orderId);
                  const order = orders.find(o => o.id === orderId);
                  if (order) {
                    setValue('customer_name', order.customer_name);
                    setValue('customer_email', order.customer_email);
                    setValue('customer_address', order.customer_address);
                    setValue('subtotal', order.total_amount);
                    setValue('total_amount', order.total_amount);
                  }
                }}
              >
                <option value="">Select an order (optional)</option>
                {orders && Array.isArray(orders) && orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.order_number} - {order.customer_name} - ${order.total_amount}
                  </option>
                ))}
              </select>
              {errors.order_id && (
                <p className="mt-1 text-sm text-red-600">{errors.order_id.message}</p>
              )}
            </div>

            {selectedOrder && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Order Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Customer:</span>
                    <span className="ml-2 text-gray-900">{selectedOrder.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total:</span>
                    <span className="ml-2 text-gray-900">${selectedOrder.total_amount}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Items:</span>
                    <span className="ml-2 text-gray-900">{selectedOrder.order_items?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(selectedOrder.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                <input
                  {...register('customer_name', { required: 'Customer name is required' })}
                  className="input mt-1"
                />
                {errors.customer_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.customer_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Email</label>
                <input
                  {...register('customer_email')}
                  type="email"
                  className="input mt-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Address</label>
              <textarea
                {...register('customer_address')}
                rows={3}
                className="input mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Subtotal</label>
                <input
                  {...register('subtotal', { 
                    required: 'Subtotal is required',
                    min: { value: 0, message: 'Subtotal must be positive' }
                  })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="input mt-1"
                />
                {errors.subtotal && (
                  <p className="mt-1 text-sm text-red-600">{errors.subtotal.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tax Amount</label>
                <input
                  {...register('tax_amount', { 
                    min: { value: 0, message: 'Tax amount must be positive' }
                  })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="input mt-1"
                />
                {errors.tax_amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.tax_amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Discount Amount</label>
                <input
                  {...register('discount_amount', { 
                    min: { value: 0, message: 'Discount amount must be positive' }
                  })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="input mt-1"
                />
                {errors.discount_amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.discount_amount.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Total Amount</label>
              <input
                {...register('total_amount', { 
                  required: 'Total amount is required',
                  min: { value: 0, message: 'Total amount must be positive' }
                })}
                type="number"
                step="0.01"
                min="0"
                className="input mt-1"
              />
              {errors.total_amount && (
                <p className="mt-1 text-sm text-red-600">{errors.total_amount.message}</p>
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
                disabled={createBillingMutation.isLoading}
                className="btn btn-primary"
              >
                {createBillingMutation.isLoading ? (
                  <div className="loading-spinner h-4 w-4"></div>
                ) : (
                  'Create Invoice'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Billing Details Modal
const BillingDetailsModal = ({ billing, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Invoice Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Invoice Number</label>
                <p className="text-sm text-gray-900">{billing.invoice_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-sm text-gray-900 capitalize">{billing.payment_status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Customer</label>
                <p className="text-sm text-gray-900">{billing.customer_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Total Amount</label>
                <p className="text-sm text-gray-900">${billing.total_amount}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Amount Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Subtotal:</span>
                  <span className="text-sm text-gray-900">${billing.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Tax:</span>
                  <span className="text-sm text-gray-900">${billing.tax_amount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Discount:</span>
                  <span className="text-sm text-gray-900">-${billing.discount_amount || 0}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-gray-900">Total:</span>
                  <span className="text-sm font-medium text-gray-900">${billing.total_amount}</span>
                </div>
              </div>
            </div>

            {billing.due_date && (
              <div>
                <label className="text-sm font-medium text-gray-500">Due Date</label>
                <p className="text-sm text-gray-900">{new Date(billing.due_date).toLocaleDateString()}</p>
              </div>
            )}

            {billing.paid_at && (
              <div>
                <label className="text-sm font-medium text-gray-500">Paid At</label>
                <p className="text-sm text-gray-900">{new Date(billing.paid_at).toLocaleString()}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={onClose}
              className="btn btn-outline"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
