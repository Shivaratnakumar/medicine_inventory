import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import {
  CreditCard,
  Receipt,
  Calendar,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Download,
  X
} from 'lucide-react';
import { paymentAPI, billingAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const Payment = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const queryClient = useQueryClient();

  // Fetch payment history
  const { data: paymentsResponse, isLoading, error } = useQuery(
    ['payments', searchTerm, statusFilter],
    () => paymentAPI.getPaymentHistory({
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined
    })
  );

  const payments = paymentsResponse?.data || [];

  // Fetch billing records for payment creation
  const { data: billingResponse } = useQuery(
    'billing-for-payments',
    () => billingAPI.getAll({ limit: 1000 })
  );

  const billingRecords = billingResponse?.data || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'failed': return <X className="h-4 w-4" />;
      case 'refunded': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">Error loading payments</div>
        <div className="text-gray-500 mt-2">Please try refreshing the page</div>
      </div>
    );
  }

  const totalPayments = payments?.length || 0;
  const paidAmount = (payments && Array.isArray(payments)) 
    ? payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) 
    : 0;
  const pendingAmount = (payments && Array.isArray(payments)) 
    ? payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) 
    : 0;
  const failedAmount = (payments && Array.isArray(payments)) 
    ? payments.filter(p => p.status === 'failed').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage payment processing and transaction history
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="btn btn-primary"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Process Payment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-md bg-blue-500">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Payments
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {totalPayments}
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
                  <Receipt className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Paid Amount
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    ₹{paidAmount.toLocaleString()}
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
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    ₹{pendingAmount.toLocaleString()}
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
                  <X className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Failed
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    ₹{failedAmount.toLocaleString()}
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
              placeholder="Search payments..."
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
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          <button className="btn btn-outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Payment History ({payments?.length || 0})
          </h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {(payments && Array.isArray(payments)) ? payments.map((payment) => (
            <li key={payment.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      Payment #{payment.id.slice(-8)}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Receipt className="h-4 w-4 mr-1" />
                        ₹{payment.amount}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(payment.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-1" />
                        {payment.payment_method}
                      </div>
                    </div>
                    {payment.payment_reference && (
                      <p className="mt-1 text-sm text-gray-600">
                        Reference: {payment.payment_reference}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                    <span className="mr-1">{getStatusIcon(payment.status)}</span>
                    {payment.status.toUpperCase()}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedPayment(payment)}
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
              <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {error ? 'Error loading payments. Please try again.' : 'No payments match your current filter.'}
              </p>
            </div>
          )}
        </ul>
      </div>

      {/* Process Payment Modal */}
      {showPaymentModal && (
        <ProcessPaymentModal
          billingRecords={billingRecords}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries('payments');
            setShowPaymentModal(false);
          }}
        />
      )}

      {/* Payment Details Modal */}
      {selectedPayment && (
        <PaymentDetailsModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
};

// Process Payment Modal
const ProcessPaymentModal = ({ billingRecords, onClose, onSuccess }) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const selectedBillingId = watch('billing_id');

  const processPaymentMutation = useMutation(
    (data) => paymentAPI.createPaymentIntent(data),
    {
      onSuccess: (response) => {
        // In a real app, you would integrate with Stripe here
        toast.success('Payment intent created successfully');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to process payment');
      }
    }
  );

  const confirmPaymentMutation = useMutation(
    (data) => paymentAPI.confirmPayment(data),
    {
      onSuccess: () => {
        toast.success('Payment confirmed successfully');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to confirm payment');
      }
    }
  );

  const onSubmit = (data) => {
    // For demo purposes, we'll simulate payment processing
    const mockPaymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    processPaymentMutation.mutate({
      amount: data.amount,
      billing_id: data.billing_id
    });

    // Simulate payment confirmation after a short delay
    setTimeout(() => {
      confirmPaymentMutation.mutate({
        payment_intent_id: mockPaymentIntentId,
        billing_id: data.billing_id,
        amount: data.amount
      });
    }, 2000);
  };

  const selectedBilling = billingRecords.find(b => b.id === selectedBillingId);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Process Payment</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Invoice</label>
              <select
                {...register('billing_id', { required: 'Invoice is required' })}
                className="input mt-1"
              >
                <option value="">Select an invoice</option>
                {(billingRecords && Array.isArray(billingRecords)) ? billingRecords.map((billing) => (
                  <option key={billing.id} value={billing.id}>
                    {billing.invoice_number} - {billing.customer_name} - ₹{billing.total_amount}
                  </option>
                )) : (
                  <option value="" disabled>No billing records available</option>
                )}
              </select>
              {errors.billing_id && (
                <p className="mt-1 text-sm text-red-600">{errors.billing_id.message}</p>
              )}
            </div>

            {selectedBilling && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Invoice Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Customer:</span>
                    <span className="ml-2 text-gray-900">{selectedBilling.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total:</span>
                    <span className="ml-2 text-gray-900">₹{selectedBilling.total_amount}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2 text-gray-900 capitalize">{selectedBilling.payment_status}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Due Date:</span>
                    <span className="ml-2 text-gray-900">
                      {selectedBilling.due_date ? new Date(selectedBilling.due_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Amount *</label>
              <input
                {...register('amount', { 
                  required: 'Amount is required',
                  min: { value: 0.01, message: 'Amount must be greater than 0' }
                })}
                type="number"
                step="0.01"
                className="input mt-1"
                placeholder="0.00"
                defaultValue={selectedBilling?.total_amount || ''}
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <select {...register('payment_method')} className="input mt-1">
                <option value="card">Credit/Debit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
              </select>
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
                disabled={processPaymentMutation.isLoading || confirmPaymentMutation.isLoading}
                className="btn btn-primary"
              >
                {(processPaymentMutation.isLoading || confirmPaymentMutation.isLoading) ? (
                  <div className="loading-spinner h-4 w-4"></div>
                ) : (
                  'Process Payment'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Payment Details Modal
const PaymentDetailsModal = ({ payment, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Payment Details</h3>
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
                <label className="text-sm font-medium text-gray-500">Payment ID</label>
                <p className="text-sm text-gray-900">#{payment.id.slice(-8)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-sm text-gray-900 capitalize">{payment.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Amount</label>
                <p className="text-sm text-gray-900">₹{payment.amount}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Payment Method</label>
                <p className="text-sm text-gray-900 capitalize">{payment.payment_method}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-sm text-gray-900">{new Date(payment.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Processed</label>
                <p className="text-sm text-gray-900">
                  {payment.processed_at ? new Date(payment.processed_at).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>

            {payment.payment_reference && (
              <div>
                <label className="text-sm font-medium text-gray-500">Payment Reference</label>
                <p className="text-sm text-gray-900">{payment.payment_reference}</p>
              </div>
            )}

            {payment.stripe_payment_intent_id && (
              <div>
                <label className="text-sm font-medium text-gray-500">Stripe Payment Intent ID</label>
                <p className="text-sm text-gray-900 font-mono">{payment.stripe_payment_intent_id}</p>
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

export default Payment;
