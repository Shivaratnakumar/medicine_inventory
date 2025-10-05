import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Bell, Check, X, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { notificationsAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const Notifications = () => {
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications, isLoading, error } = useQuery(
    ['notifications', filter],
    () => notificationsAPI.getAll()
  );

  // Mark as read mutation
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

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation(
    () => notificationsAPI.markAllAsRead(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications');
        toast.success('All notifications marked as read');
      },
      onError: () => {
        toast.error('Failed to mark all notifications as read');
      }
    }
  );

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationBg = (type, isRead) => {
    if (isRead) return 'bg-gray-50';
    switch (type) {
      case 'error':
        return 'bg-red-50 border-l-red-500';
      case 'warning':
        return 'bg-yellow-50 border-l-yellow-500';
      case 'success':
        return 'bg-green-50 border-l-green-500';
      default:
        return 'bg-blue-50 border-l-blue-500';
    }
  };

  const filteredNotifications = (notifications?.data && Array.isArray(notifications.data)) 
    ? notifications.data.filter(notification => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !notification.is_read;
        return notification.type === filter;
      })
    : [];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">Error loading notifications</div>
        <div className="text-gray-500 mt-2">Please try refreshing the page</div>
      </div>
    );
  }

  const unreadCount = (notifications?.data && Array.isArray(notifications.data)) 
    ? notifications.data.filter(n => !n.is_read).length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your system notifications and alerts
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isLoading}
              className="btn btn-outline"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-md bg-blue-500">
                  <Bell className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Notifications
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {notifications?.data?.length || 0}
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
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Unread
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {unreadCount}
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
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Warnings
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {(notifications?.data && Array.isArray(notifications.data)) 
                      ? notifications.data.filter(n => n.type === 'warning').length 
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
                <div className="p-3 rounded-md bg-green-500">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Success
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {(notifications?.data && Array.isArray(notifications.data)) 
                      ? notifications.data.filter(n => n.type === 'success').length 
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
        <div className="flex space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input w-48"
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread Only</option>
            <option value="info">Info</option>
            <option value="warning">Warnings</option>
            <option value="error">Errors</option>
            <option value="success">Success</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Notifications ({filteredNotifications.length})
          </h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {(Array.isArray(filteredNotifications)) ? filteredNotifications.map((notification) => (
            <li
              key={notification.id}
              className={`px-4 py-4 sm:px-6 border-l-4 ${getNotificationBg(notification.type, notification.is_read)}`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-medium ${
                      notification.is_read ? 'text-gray-500' : 'text-gray-900'
                    }`}>
                      {notification.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        notification.is_read 
                          ? 'bg-gray-100 text-gray-500' 
                          : 'bg-primary-100 text-primary-800'
                      }`}>
                        {notification.is_read ? 'Read' : 'Unread'}
                      </span>
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className={`mt-1 text-sm ${
                    notification.is_read ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </li>
          )) : (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'unread' 
                  ? 'You have no unread notifications.' 
                  : 'No notifications match your current filter.'
                }
              </p>
            </div>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Notifications;
