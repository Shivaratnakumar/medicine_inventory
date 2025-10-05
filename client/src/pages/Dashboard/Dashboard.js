import React, { useState } from 'react';
import { useQuery } from 'react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Store,
  Calendar,
  Bell
} from 'lucide-react';
import { analyticsAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('7d');

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery(
    ['dashboard', timeRange],
    () => analyticsAPI.getDashboard(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Fetch additional analytics data
  const { data: salesData } = useQuery(
    ['sales', timeRange],
    () => analyticsAPI.getSales(timeRange)
  );

  const { data: inventoryData } = useQuery(
    ['inventory'],
    () => analyticsAPI.getInventory()
  );

  const { data: expiryData } = useQuery(
    ['expiry'],
    () => analyticsAPI.getExpiry()
  );


  // Use real data from API or fallback to empty arrays
  const salesChartData = Array.isArray(salesData?.data?.data) && salesData.data.data.length > 0 ? salesData.data.data : [
    { date: new Date().toISOString().split('T')[0], sales: 0, orders: 0 }
  ];
  const categoryChartData = Array.isArray(inventoryData?.data?.data?.categoryDistribution) && inventoryData.data.data.categoryDistribution.length > 0 ? inventoryData.data.data.categoryDistribution : [
    { name: 'No Data', value: 1, color: '#6b7280' }
  ];
  const expiryChartData = Array.isArray(expiryData?.data?.data?.summary) && expiryData.data.data.summary.length > 0 ? expiryData.data.data.summary : [
    { name: 'No Data', count: 0, color: '#6b7280' }
  ];

  const stats = [
    {
      name: 'Total Medicines',
      value: dashboardData?.data?.data?.totalMedicines || 0,
      change: '+12%',
      changeType: 'positive',
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Orders',
      value: dashboardData?.data?.data?.totalOrders || 0,
      change: '+8%',
      changeType: 'positive',
      icon: ShoppingCart,
      color: 'bg-green-500',
    },
    {
      name: 'Total Revenue',
      value: `$${dashboardData?.data?.data?.totalRevenue?.toLocaleString() || 0}`,
      change: '+15%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'bg-yellow-500',
    },
    {
      name: 'Low Stock Items',
      value: dashboardData?.data?.data?.lowStockItems || 0,
      change: '-3%',
      changeType: 'negative',
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      name: 'Expiring Soon',
      value: dashboardData?.data?.data?.expiringSoon || 0,
      change: '+5%',
      changeType: 'negative',
      icon: Calendar,
      color: 'bg-orange-500',
    },
    {
      name: 'Active Stores',
      value: dashboardData?.data?.data?.activeStores || 0,
      change: '+2%',
      changeType: 'positive',
      icon: Store,
      color: 'bg-purple-500',
    },
  ];


  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">Error loading dashboard data</div>
        <div className="text-gray-500 mt-2">Please try refreshing the page</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's what's happening with your medicine inventory.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input w-32"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>


      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats && Array.isArray(stats) && stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-md ${stat.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stat.value}
                        </div>
                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                          stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stat.changeType === 'positive' ? (
                            <TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                          ) : (
                            <TrendingDown className="self-center flex-shrink-0 h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {stat.changeType === 'positive' ? 'Increased' : 'Decreased'} by
                          </span>
                          {stat.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Sales Overview</h3>
            <p className="text-sm text-gray-500">Daily sales and orders for the past week</p>
          </div>
          <div className="card-content">
            <div className="h-80">
              {salesChartData && salesChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="orders"
                      stackId="2"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No sales data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Medicine Categories</h3>
            <p className="text-sm text-gray-500">Distribution by category</p>
          </div>
          <div className="card-content">
            <div className="h-80">
              {categoryChartData && categoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryChartData && Array.isArray(categoryChartData) && categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No category data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expiry Tracking */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Expiry Tracking</h3>
          <p className="text-sm text-gray-500">Medicines expiring in different time periods</p>
        </div>
        <div className="card-content">
          <div className="h-80">
            {expiryChartData && expiryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expiryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No expiry data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {dashboardData?.data?.data?.recentOrders?.length > 0 ? (
                dashboardData.data.data.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                      <p className="text-sm text-gray-500">Order #{order.order_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${order.total_amount}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No recent orders found</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Low Stock Alerts</h3>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {dashboardData?.data?.data?.lowStockMedicines?.length > 0 ? (
                dashboardData.data.data.lowStockMedicines.map((medicine) => (
                  <div key={medicine.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{medicine.name}</p>
                      <p className="text-sm text-gray-500">Min: {medicine.minimum_stock_level} units</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">{medicine.quantity_in_stock} left</p>
                      <button className="text-xs text-primary-600 hover:text-primary-500">
                        Restock
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No low stock items found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
