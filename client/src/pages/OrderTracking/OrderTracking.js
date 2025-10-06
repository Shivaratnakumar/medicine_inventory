import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { ordersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  Calendar,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const OrderTracking = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user } = useAuth();

  // Fetch user's orders (OrderTracking always shows only user's orders)
  const { data: ordersResponse, isLoading, error, refetch } = useQuery(
    ['user-orders', user?.id, searchTerm, statusFilter],
    () => ordersAPI.getAll({
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined
      // Note: user_id filtering is now handled by the backend based on user role
    }),
    {
      enabled: !!user,
      retry: 1,
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
      }
    }
  );

  const orders = ordersResponse?.data || [];

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-orange-100 text-orange-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">Error loading orders</div>
        <div className="text-gray-500 mt-2">Please try refreshing the page</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track the status of your personal orders and view order details
          </p>
        </div>
      </div>

      {/* Search and Filters */}
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
            onClick={() => refetch()}
            className="btn btn-outline"
          >
            <Filter className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Orders List */}
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
    </div>
  );
};

export default OrderTracking;
