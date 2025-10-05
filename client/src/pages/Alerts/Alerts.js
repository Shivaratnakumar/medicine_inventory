import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { AlertTriangle, Package, TrendingDown, Bell, CheckCircle, X } from 'lucide-react';
import { medicinesAPI, notificationsAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const Alerts = () => {
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const queryClient = useQueryClient();

  // Fetch low stock medicines
  const { data: lowStockResponse, isLoading, error } = useQuery(
    'low-stock-medicines',
    () => medicinesAPI.getLowStock(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const lowStockMedicines = lowStockResponse?.data || [];

  // Fetch notifications
  const { data: notificationsResponse } = useQuery(
    'notifications',
    () => notificationsAPI.getAll(),
  );

  const notifications = notificationsResponse?.data || [];

  // Mark notification as read
  const markAsReadMutation = useMutation(
    (id) => notificationsAPI.markAsRead(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications');
        toast.success('Notification marked as read');
      },
      onError: () => {
        toast.error('Failed to mark notification as read');
      }
    }
  );

  const getStockStatus = (quantity, minLevel) => {
    if (quantity === 0) return { status: 'out', color: 'text-red-600', bg: 'bg-red-100', urgency: 'critical' };
    if (quantity <= minLevel / 2) return { status: 'critical', color: 'text-red-600', bg: 'bg-red-100', urgency: 'critical' };
    if (quantity <= minLevel) return { status: 'low', color: 'text-orange-600', bg: 'bg-orange-100', urgency: 'high' };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-100', urgency: 'low' };
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const handleSelectAlert = (medicineId) => {
    setSelectedAlerts(prev => 
      prev.includes(medicineId) 
        ? prev.filter(id => id !== medicineId)
        : [...prev, medicineId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAlerts.length === lowStockMedicines?.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts((lowStockMedicines && Array.isArray(lowStockMedicines)) 
        ? lowStockMedicines.map(m => m.id) 
        : []);
    }
  };

  const handleMarkAsRead = (notificationId) => {
    markAsReadMutation.mutate(notificationId);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">Error loading alerts</div>
        <div className="text-gray-500 mt-2">Please try refreshing the page</div>
      </div>
    );
  }

  const criticalCount = (lowStockMedicines && Array.isArray(lowStockMedicines)) 
    ? lowStockMedicines.filter(m => getStockStatus(m.quantity_in_stock, m.minimum_stock_level).urgency === 'critical').length 
    : 0;
  const highCount = (lowStockMedicines && Array.isArray(lowStockMedicines)) 
    ? lowStockMedicines.filter(m => getStockStatus(m.quantity_in_stock, m.minimum_stock_level).urgency === 'high').length 
    : 0;
  const unreadNotifications = (notifications && Array.isArray(notifications)) 
    ? notifications.filter(n => !n.is_read).length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts & Notifications</h1>
          <p className="mt-2 text-sm text-gray-700">
            Monitor low stock alerts and system notifications
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="btn btn-primary">
            <Bell className="h-4 w-4 mr-2" />
            Send Bulk Alerts
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-md bg-red-500">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Critical Alerts
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {criticalCount}
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
                <div className="p-3 rounded-md bg-orange-500">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    High Priority
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {highCount}
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
                <div className="p-3 rounded-md bg-blue-500">
                  <Package className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Low Stock
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {lowStockMedicines?.data?.length || 0}
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
                <div className="p-3 rounded-md bg-purple-500">
                  <Bell className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Unread Notifications
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {unreadNotifications}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Low Stock Alerts</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  {selectedAlerts.length === lowStockMedicines?.data?.length ? 'Deselect All' : 'Select All'}
                </button>
                {selectedAlerts.length > 0 && (
                  <button className="btn btn-sm btn-primary">
                    Restock Selected ({selectedAlerts.length})
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {(lowStockMedicines?.data && Array.isArray(lowStockMedicines.data)) ? lowStockMedicines.data.map((medicine) => {
                const stockStatus = getStockStatus(medicine.quantity_in_stock, medicine.minimum_stock_level);
                const isSelected = selectedAlerts.includes(medicine.id);

                return (
                  <div
                    key={medicine.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSelectAlert(medicine.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectAlert(medicine.id)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <div className={`w-3 h-3 rounded-full ${getUrgencyColor(stockStatus.urgency)}`}></div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{medicine.name}</h4>
                          <p className="text-sm text-gray-500">{medicine.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${stockStatus.color}`}>
                          {medicine.quantity_in_stock} / {medicine.minimum_stock_level}
                        </p>
                        <p className="text-xs text-gray-500">
                          {stockStatus.status === 'out' ? 'Out of Stock' :
                           stockStatus.status === 'critical' ? 'Critical' :
                           stockStatus.status === 'low' ? 'Low Stock' : 'Good'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No low stock alerts</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    All medicines are well stocked.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Notifications</h3>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {(notifications?.data && Array.isArray(notifications.data)) ? notifications.data.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg ${
                    notification.is_read ? 'bg-gray-50' : 'bg-white border-l-4 border-l-primary-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </h4>
                      <p className="mt-1 text-sm text-gray-500">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Bell className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No recent notifications to display.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {selectedAlerts.length > 0 && `${selectedAlerts.length} alerts selected`}
        </div>
        <div className="flex space-x-3">
          <button className="btn btn-outline">
            Export Alerts
          </button>
          <button className="btn btn-primary">
            Generate Restock Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
