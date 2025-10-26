import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  ShoppingCart,
  User,
  Calendar,
  Receipt,
  Package,
  X,
  Shield,
  UserCheck,
  Trash2,
  AlertTriangle,
  Camera,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { ordersAPI, medicinesAPI, billingAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import PrescriptionScanner from '../../components/OCR/PrescriptionScanner';
import toast from 'react-hot-toast';

const Orders = () => {
  const [activeTab, setActiveTab] = useState('management'); // 'management' or 'tracking'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [showPrescriptionScanner, setShowPrescriptionScanner] = useState(false);

  const queryClient = useQueryClient();
  const { user, loading: userLoading } = useAuth();

  // Force refresh orders data
  const refreshOrders = () => {
    queryClient.invalidateQueries(['orders', user?.id, searchTerm, statusFilter]);
  };

  // Fetch orders with retry and fallback
  const { data: ordersResponse, isLoading, error } = useQuery(
    ['orders', user?.id, searchTerm, statusFilter],
    () => ordersAPI.getAll({
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined
    }),
    {
      enabled: !userLoading && !!user, // Only run query when user is loaded
      retry: 1,
      retryDelay: 2000,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      onSuccess: (data) => {
        console.log('✅ Orders API Success:', data);
      },
      onError: (error) => {
        console.error('❌ Orders API Error:', error);
      }
    }
  );

  console.log('🔍 Orders Debug Info:');
  console.log('- User Loading:', userLoading);
  console.log('- User:', user);
  console.log('- User ID:', user?.id);
  console.log('- User Role:', user?.role);
  console.log('- Query Enabled:', !userLoading && !!user);
  console.log('- ordersResponse:', ordersResponse);
  console.log('- isLoading:', isLoading);
  console.log('- error:', error);
  console.log('- orders:', ordersResponse?.data || []);
  console.log('- orders count:', ordersResponse?.data?.length || 0);

  // Use API data only - no mock data to avoid UUID conflicts
  const orders = ordersResponse?.data || [];

  // Fetch medicines for order creation
  const { data: medicinesResponse, isLoading: medicinesLoading } = useQuery(
    'medicines-for-orders',
    () => medicinesAPI.getAll({ limit: 1000 }),
    {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );

  // Use API data only - no mock data to avoid UUID conflicts
  const medicines = medicinesResponse?.data || [];

  // Update order status mutation
  const updateStatusMutation = useMutation(
    ({ id, status }) => ordersAPI.updateStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('orders');
        toast.success('Order status updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update order status');
      }
    }
  );

  // Delete order mutation
  const deleteOrderMutation = useMutation(
    (id) => ordersAPI.delete(id),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('orders');
        setOrderToDelete(null);
        toast.success(`Order ${data.data?.order_number || ''} deleted successfully`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete order');
      }
    }
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-orange-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleStatusChange = (orderId, newStatus) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const handleDeleteOrder = (order) => {
    setOrderToDelete(order);
  };

  const confirmDeleteOrder = () => {
    if (orderToDelete) {
      deleteOrderMutation.mutate(orderToDelete.id);
    }
  };

  const handleMedicinesDetected = (medicines) => {
    // Close the scanner
    setShowPrescriptionScanner(false);
    
    // Open the add order modal with pre-filled medicines
    setShowAddModal(true);
    
    // Store the detected medicines for the order modal
    // This will be handled by the OrderModal component
    toast.success(`Found ${medicines.length} available medicines from prescription`);
  };

  if (userLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error && !ordersResponse?.data) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">❌ Connection Error</div>
        <div className="text-gray-500 mt-2">Unable to connect to the server</div>
        <div className="text-sm text-gray-400 mt-1">Please check your server connection and try refreshing</div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 btn btn-primary"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            {user?.role === 'admin' ? (
              <div className="flex items-center space-x-1 text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                <Shield className="h-4 w-4" />
                <span>Admin View</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <UserCheck className="h-4 w-4" />
                <span>My Orders</span>
              </div>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-700">
            {user?.role === 'admin' 
              ? 'Manage all customer orders and track order status'
              : 'View and manage your orders'
            }
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          {activeTab === 'management' && (
            <>
              <button
                onClick={() => setShowPrescriptionScanner(true)}
                className="btn btn-secondary text-base px-6 py-3"
              >
                <Camera className="h-5 w-5 mr-2" />
                Scan Prescription
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary text-base px-6 py-3"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Order
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('management')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'management'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4" />
              <span>Orders Management</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tracking'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Order Tracking</span>
            </div>
          </button>
        </nav>
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
              placeholder="Search orders..."
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
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button 
            onClick={() => queryClient.invalidateQueries(['orders', user?.id, searchTerm, statusFilter])}
            className="btn btn-outline"
          >
            <Filter className="h-4 w-4 mr-2" />
            {activeTab === 'tracking' ? 'Refresh' : 'More Filters'}
          </button>
        </div>
      </div>

      {/* Orders Management Tab */}
      {activeTab === 'management' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Orders ({orders?.length || 0})
            </h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {orders && Array.isArray(orders) && orders.map((order) => (
              <li key={order.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        {order.order_number}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {order.customer_name}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Receipt className="h-4 w-4 mr-1" />
                          ₹{order.total_amount}
                        </div>
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-1" />
                          {order.order_items?.length || 0} items
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <div className="flex space-x-2">
                      {user?.role === 'admin' ? (
                        <div className="flex items-center space-x-1">
                          <Shield className="h-3 w-3 text-blue-500" title="Admin control" />
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="input text-sm py-1 px-2 min-w-[120px]"
                            title="Admin: Change order status"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      ) : (
                        <div 
                          className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded min-w-[120px] text-center"
                          title="Only admins can change order status"
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </div>
                      )}
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="View order details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600" title="Edit order">
                        <Edit className="h-4 w-4" />
                      </button>
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => handleDeleteOrder(order)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete order"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {orders?.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {user?.role === 'admin' 
                  ? 'No orders have been placed yet. Orders will appear here once customers start placing them.'
                  : 'You haven\'t placed any orders yet. Get started by creating a new order.'
                }
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Order
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Tracking Tab */}
      {activeTab === 'tracking' && (
        <div className="space-y-4">
          {orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Order #{order.order_number}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Placed on {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(order.status)}
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Order Items */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Order Items</h4>
                    <div className="space-y-2">
                      {order.order_items?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {item.medicines?.name || 'Medicine'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Quantity: {item.quantity} × {formatPrice(item.unit_price)}
                            </p>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatPrice(item.total_price)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">Total:</span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(order.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Information */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Delivery Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                          <p className="text-sm text-gray-500">{order.customer_address || 'No address provided'}</p>
                        </div>
                      </div>
                      
                      {order.customer_phone && (
                        <div className="flex items-center space-x-3">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <p className="text-sm text-gray-500">{order.customer_phone}</p>
                        </div>
                      )}
                      
                      {order.customer_email && (
                        <div className="flex items-center space-x-3">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <p className="text-sm text-gray-500">{order.customer_email}</p>
                        </div>
                      )}
                    </div>

                    {order.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-md">
                        <h5 className="text-xs font-medium text-gray-700 mb-1">Notes:</h5>
                        <p className="text-sm text-gray-600">{order.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Timeline */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Order Timeline</h4>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-gray-500">Order Placed</span>
                    </div>
                    {order.status !== 'pending' && (
                      <>
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-xs text-gray-500">Confirmed</span>
                        </div>
                      </>
                    )}
                    {['processing', 'shipped', 'delivered'].includes(order.status) && (
                      <>
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-xs text-gray-500">Processing</span>
                        </div>
                      </>
                    )}
                    {['shipped', 'delivered'].includes(order.status) && (
                      <>
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-xs text-gray-500">Shipped</span>
                        </div>
                      </>
                    )}
                    {order.status === 'delivered' && (
                      <>
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-xs text-gray-500">Delivered</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No orders match your search criteria.' 
                  : 'You haven\'t placed any orders yet.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Order Modal */}
      {showAddModal && (
        <OrderModal
          medicines={medicines}
          medicinesLoading={medicinesLoading}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries('orders');
            setShowAddModal(false);
          }}
        />
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Delete Order</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-2">
                Are you sure you want to delete this order?
              </p>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="font-medium text-gray-900">Order #{orderToDelete.order_number}</p>
                <p className="text-sm text-gray-600">Customer: {orderToDelete.customer_name}</p>
                <p className="text-sm text-gray-600">Total: ₹{orderToDelete.total_amount}</p>
                <p className="text-sm text-gray-600">Items: {orderToDelete.order_items?.length || 0}</p>
              </div>
              <p className="text-xs text-amber-600 mt-2">
                ⚠️ This will restore the medicine stock and permanently delete the order.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setOrderToDelete(null)}
                className="flex-1 btn btn-outline"
                disabled={deleteOrderMutation.isLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteOrder}
                className="flex-1 btn btn-danger"
                disabled={deleteOrderMutation.isLoading}
              >
                {deleteOrderMutation.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Scanner Modal */}
      {showPrescriptionScanner && (
        <PrescriptionScanner
          onMedicinesDetected={handleMedicinesDetected}
          onClose={() => setShowPrescriptionScanner(false)}
        />
      )}
    </div>
  );
};

// Order Modal Component
const OrderModal = ({ medicines, medicinesLoading, onClose, onSuccess }) => {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      customer_address: '',
      store_id: '',
      items: [{ medicine_id: '', quantity: 1 }],
      notes: ''
    }
  });
  
  // Debug: Log form values when they change
  const formValues = watch();
  console.log('📝 Form values:', formValues);

  const watchedItems = watch('items');
  
  // Reset form when modal opens
  useEffect(() => {
    console.log('🔄 Resetting form values...');
    setValue('customer_name', '');
    setValue('customer_email', '');
    setValue('customer_phone', '');
    setValue('customer_address', '');
    setValue('store_id', ''); // Make sure this is empty string, not "1"
    setValue('items', [{ medicine_id: '', quantity: 1 }]);
    setValue('notes', '');
    console.log('✅ Form reset complete');
  }, [setValue]);

  const addItem = () => {
    setValue('items', [...watchedItems, { medicine_id: '', quantity: 1 }]);
  };

  const removeItem = (index) => {
    if (watchedItems.length > 1) {
      setValue('items', watchedItems.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...watchedItems];
    newItems[index][field] = value;
    setValue('items', newItems);
  };

  const createOrderMutation = useMutation(
    (data) => ordersAPI.create(data),
    {
      onSuccess: (response) => {
        console.log('✅ Order created successfully:', response);
        toast.success('Order created successfully');
        onSuccess();
      },
      onError: (error) => {
        console.error('❌ Order creation error:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to create order';
        toast.error(errorMessage);
      }
    }
  );

  const onSubmit = (data) => {
    console.log('📝 Form submission data:', data);
    console.log('📝 Available medicines:', medicines);
    console.log('📝 Medicines loading:', medicinesLoading);
    
    // Check if medicines are still loading
    if (medicinesLoading) {
      toast.error('Please wait for medicines to load');
      return;
    }
    
    // Check if we have medicines available
    if (!medicines || medicines.length === 0) {
      toast.error('No medicines available. Please check your connection.');
      return;
    }
    
    // Validate that at least one item has a medicine selected
    const validItems = data.items.filter(item => item.medicine_id && item.medicine_id.trim() !== '' && item.quantity > 0);
    console.log('📝 Valid items after filtering:', validItems);
    
    if (validItems.length === 0) {
      toast.error('Please select at least one medicine');
      return;
    }
    
    // Validate customer name
    if (!data.customer_name || data.customer_name.trim() === '') {
      toast.error('Customer name is required');
      return;
    }
    
    // Validate each item more thoroughly
    for (let i = 0; i < validItems.length; i++) {
      const item = validItems[i];
      console.log(`📝 Validating item ${i + 1}:`, item);
      
      if (!item.medicine_id || item.medicine_id.trim() === '') {
        toast.error(`Please select a medicine for item ${i + 1}`);
        return;
      }
      
      // Check if medicine_id is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(item.medicine_id)) {
        toast.error(`Invalid medicine ID format for item ${i + 1}: ${item.medicine_id}`);
        return;
      }
      
      // Check if the medicine exists in our medicines list
      const medicineExists = medicines.some(med => med.id === item.medicine_id);
      if (!medicineExists) {
        toast.error(`Selected medicine not found for item ${i + 1}`);
        return;
      }
      
      if (!item.quantity || item.quantity <= 0) {
        toast.error(`Please enter a valid quantity for item ${i + 1}`);
        return;
      }
    }
    
    // Update data with only valid items and ensure proper data types
    const submitData = {
      customer_name: data.customer_name.trim(),
      customer_email: data.customer_email?.trim() || null,
      customer_phone: data.customer_phone?.trim() || null,
      customer_address: data.customer_address?.trim() || null,
      store_id: data.store_id && data.store_id.trim() !== '' && data.store_id !== '1' ? data.store_id.trim() : null,
      notes: data.notes?.trim() || null,
      items: validItems.map(item => ({
        medicine_id: item.medicine_id.trim(),
        quantity: parseInt(item.quantity, 10)
      }))
    };
    
    console.log('📤 Submitting order data:', submitData);
    console.log('📤 Items being submitted:', submitData.items);
    console.log('📤 Store ID being submitted:', submitData.store_id);
    createOrderMutation.mutate(submitData);
  };

  const isLoading = createOrderMutation.isLoading;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create New Order</h3>
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
                <label className="block text-sm font-medium text-gray-700">Customer Name *</label>
                <input
                  {...register('customer_name', { required: 'Customer name is required' })}
                  className="input mt-1"
                  placeholder="Enter customer name"
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
                  placeholder="Enter customer email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Phone</label>
                <input
                  {...register('customer_phone')}
                  className="input mt-1"
                  placeholder="Enter customer phone"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Store</label>
                <select {...register('store_id')} className="input mt-1">
                  <option value="">Select store</option>
                  <option value="550e8400-e29b-41d4-a716-446655440001">Main Pharmacy</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Address</label>
              <textarea
                {...register('customer_address')}
                rows={3}
                className="input mt-1"
                placeholder="Enter customer address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Order Items *</label>
              <div className="mt-2 space-y-2">
                {watchedItems && Array.isArray(watchedItems) && watchedItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <select
                      value={item.medicine_id}
                      onChange={(e) => updateItem(index, 'medicine_id', e.target.value)}
                      className="input flex-1"
                      required
                      disabled={medicinesLoading}
                    >
                      <option value="">
                        {medicinesLoading ? 'Loading medicines...' : 'Select medicine'}
                      </option>
                      {medicines && Array.isArray(medicines) && medicines.map((medicine) => (
                        <option 
                          key={medicine.id} 
                          value={medicine.id}
                          disabled={medicine.quantity_in_stock <= 0}
                        >
                          {medicine.name} - ₹{medicine.price} (Stock: {medicine.quantity_in_stock})
                          {medicine.quantity_in_stock <= 0 ? ' - Out of Stock' : ''}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={item.quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        updateItem(index, 'quantity', Math.max(1, Math.min(999, value)));
                      }}
                      className="input w-20"
                      required
                    />
                    {watchedItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addItem}
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  + Add Item
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                {...register('notes')}
                rows={2}
                className="input mt-1"
                placeholder="Enter order notes"
              />
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
                disabled={isLoading || medicinesLoading || !medicines || medicines.length === 0}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner h-4 w-4 mr-2"></div>
                    Creating...
                  </>
                ) : medicinesLoading ? (
                  'Loading Medicines...'
                ) : !medicines || medicines.length === 0 ? (
                  'No Medicines Available'
                ) : (
                  'Create Order'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Order Details Modal
const OrderDetailsModal = ({ order, onClose }) => {
  const [billingData, setBillingData] = useState(null);
  const [loadingBilling, setLoadingBilling] = useState(false);

  useEffect(() => {
    const fetchBillingData = async () => {
      if (order?.id) {
        setLoadingBilling(true);
        try {
          const response = await billingAPI.getByOrderId(order.id);
          if (response.success) {
            setBillingData(response.data.billing);
          }
        } catch (error) {
          console.error('Error fetching billing data:', error);
        } finally {
          setLoadingBilling(false);
        }
      }
    };

    fetchBillingData();
  }, [order?.id]);

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'refunded': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Order Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Order Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Order Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Order Number</label>
                  <p className="text-sm text-gray-900">{order.order_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-sm text-gray-900 capitalize">{order.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer</label>
                  <p className="text-sm text-gray-900">{order.customer_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Amount</label>
                  <p className="text-sm text-gray-900 font-semibold">₹{order.total_amount}</p>
                </div>
                {order.customer_email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm text-gray-900">{order.customer_email}</p>
                  </div>
                )}
                {order.customer_phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-sm text-gray-900">{order.customer_phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-3">Order Items</h4>
              <div className="space-y-2">
                {order.order_items && Array.isArray(order.order_items) && order.order_items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                    <div>
                      <p className="text-sm font-medium">{item.medicines?.name}</p>
                      <p className="text-xs text-gray-500">SKU: {item.medicines?.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">Qty: {item.quantity}</p>
                      <p className="text-sm font-medium">₹{item.total_price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing Information */}
            {loadingBilling ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-sm text-gray-500">Loading billing information...</span>
              </div>
            ) : billingData ? (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                  <Receipt className="h-4 w-4 mr-2" />
                  Billing Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Invoice Number</label>
                    <p className="text-sm text-gray-900 font-mono">{billingData.invoice_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(billingData.payment_status)}`}>
                      {billingData.payment_status}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Subtotal</label>
                    <p className="text-sm text-gray-900">₹{billingData.subtotal}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tax Amount</label>
                    <p className="text-sm text-gray-900">₹{billingData.tax_amount}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Discount</label>
                    <p className="text-sm text-gray-900">₹{billingData.discount_amount}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Amount</label>
                    <p className="text-sm text-gray-900 font-semibold">₹{billingData.total_amount}</p>
                  </div>
                  {billingData.payment_method && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Payment Method</label>
                      <p className="text-sm text-gray-900 capitalize">{billingData.payment_method}</p>
                    </div>
                  )}
                  {billingData.paid_at && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Paid At</label>
                      <p className="text-sm text-gray-900">{new Date(billingData.paid_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Payment History */}
                {billingData.payments && billingData.payments.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Payment History</h5>
                    <div className="space-y-2">
                      {billingData.payments.map((payment, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                          <div>
                            <p className="text-sm font-medium">{payment.payment_method}</p>
                            <p className="text-xs text-gray-500">{payment.payment_reference}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">₹{payment.amount}</p>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(payment.status)}`}>
                              {payment.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-700">
                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                  No billing information available for this order.
                </p>
              </div>
            )}

            {/* Notes */}
            {order.notes && (
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-3">Notes</h4>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{order.notes}</p>
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

export default Orders;
