import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import api from '../../services/api';
import SimpleChart from '../../components/Charts/SimpleChart';
import StoreSelector from '../../components/StoreSelector';
import jsPDF from 'jspdf';
import {
  Truck,
  Store,
  TrendingUp,
  Calendar,
  Download,
  Eye,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  FileText,
  RefreshCw,
  ChevronDown
} from 'lucide-react';

const SupplyHub = () => {
  useAuth(); // Keep for potential future use
  const { 
    selectedStoreId, 
    availableStores, 
    selectStore, 
    getSelectedStore 
  } = useStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateFilter, setDateFilter] = useState('today');
  const [loading, setLoading] = useState(false);
  const [supplyStores, setSupplyStores] = useState([]);
  const [orderData, setOrderData] = useState({
    today: { orders: [], totalAmount: 0, totalOrders: 0 },
    monthly: { orders: [], totalAmount: 0, totalOrders: 0 },
    yearly: { orders: [], totalAmount: 0, totalOrders: 0 }
  });
  const [paymentData, setPaymentData] = useState([]);
  const [analytics, setAnalytics] = useState({
    dailyTrend: [],
    monthlyTrend: [],
    topStores: [],
    paymentMethods: []
  });


  const loadSupplyHubData = useCallback(async () => {
    setLoading(true);
    try {
      // Load supply relationships (stores)
      try {
        const relationshipsResponse = await api.get('/supply-relationships');
        if (relationshipsResponse.data.success) {
          const stores = relationshipsResponse.data.data.map(rel => ({
            id: rel.customer_store.id,
            name: rel.customer_store.name,
            address: rel.customer_store.address,
            phone: rel.contact_phone || rel.customer_store.phone,
            email: rel.contact_email || rel.customer_store.email,
            status: rel.status,
            totalOrders: 0, // Will be calculated from orders
            totalAmount: 0, // Will be calculated from orders
            lastOrder: null // Will be calculated from orders
          }));
          setSupplyStores(stores);
        }
      } catch (error) {
        console.log('Supply relationships API not available, using mock data');
        // Use mock data if API is not available
        const mockStores = [
          {
            id: '1',
            name: 'City Medical Store',
            address: '123 Main St, City',
            phone: '+1-555-0123',
            email: 'contact@citymedical.com',
            status: 'active',
            totalOrders: 45,
            totalAmount: 12500.00,
            lastOrder: '2024-01-15'
          },
          {
            id: '2',
            name: 'Health Plus Pharmacy',
            address: '456 Oak Ave, City',
            phone: '+1-555-0124',
            email: 'info@healthplus.com',
            status: 'active',
            totalOrders: 32,
            totalAmount: 8900.00,
            lastOrder: '2024-01-14'
          }
        ];
        setSupplyStores(mockStores);
      }

      // Load supply orders based on date filter
      const today = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];

      let dateFrom, dateTo;
      switch (dateFilter) {
        case 'today':
          dateFrom = today;
          dateTo = today;
          break;
        case 'monthly':
          dateFrom = startOfMonth;
          dateTo = today;
          break;
        case 'yearly':
          dateFrom = startOfYear;
          dateTo = today;
          break;
        default:
          dateFrom = today;
          dateTo = today;
      }

      try {
        const ordersUrl = selectedStoreId === 'all' 
          ? `/supply-orders?date_from=${dateFrom}&date_to=${dateTo}`
          : `/supply-orders?date_from=${dateFrom}&date_to=${dateTo}&store_id=${selectedStoreId}`;
        const ordersResponse = await api.get(ordersUrl);
        if (ordersResponse.data.success) {
          const orders = ordersResponse.data.data.map(order => ({
            id: order.order_number,
            date: order.order_date.split('T')[0],
            store: order.customer_store?.name || 'Unknown Store',
            items: order.supply_order_items?.map(item => item.medicines?.name || 'Unknown Medicine') || [],
            quantities: order.supply_order_items?.map(item => item.quantity) || [],
            status: order.status,
            totalAmount: parseFloat(order.total_amount || 0),
            paymentId: order.supply_payments?.[0]?.payment_number || 'N/A',
            paymentMethod: order.supply_payments?.[0]?.payment_method || 'N/A',
            paymentStatus: order.supply_payments?.[0]?.status || 'N/A'
          }));

          const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
          
          setOrderData({
            [dateFilter]: {
              orders,
              totalAmount,
              totalOrders: orders.length
            }
          });
        }
      } catch (error) {
        console.log('Supply orders API not available, using mock data');
        // Use mock data if API is not available
        const mockOrders = [
          {
            id: 'ORD-001',
            date: new Date().toISOString().split('T')[0],
            store: 'City Medical Store',
            items: ['Paracetamol 500mg', 'Amoxicillin 250mg'],
            quantities: [100, 50],
            status: 'completed',
            totalAmount: 1250.00,
            paymentId: 'PAY-001',
            paymentMethod: 'UPI',
            paymentStatus: 'paid'
          }
        ];
        
        setOrderData({
          [dateFilter]: {
            orders: mockOrders,
            totalAmount: mockOrders.reduce((sum, order) => sum + order.totalAmount, 0),
            totalOrders: mockOrders.length
          }
        });
      }

      // Load supply payments
      try {
        const paymentsUrl = selectedStoreId === 'all' 
          ? `/supply-payments?date_from=${dateFrom}&date_to=${dateTo}`
          : `/supply-payments?date_from=${dateFrom}&date_to=${dateTo}&store_id=${selectedStoreId}`;
        const paymentsResponse = await api.get(paymentsUrl);
        if (paymentsResponse.data.success) {
          const payments = paymentsResponse.data.data.map(payment => ({
            id: payment.payment_number,
            date: payment.payment_date.split('T')[0],
            amount: parseFloat(payment.amount || 0),
            method: payment.payment_method,
            status: payment.status,
            orderId: payment.supply_order?.order_number || 'N/A'
          }));
          setPaymentData(payments);
        }
      } catch (error) {
        console.log('Supply payments API not available, using mock data');
        // Use mock data if API is not available
        const mockPayments = [
          {
            id: 'PAY-001',
            date: new Date().toISOString().split('T')[0],
            amount: 1250.00,
            method: 'UPI',
            status: 'paid',
            orderId: 'ORD-001'
          }
        ];
        setPaymentData(mockPayments);
      }

      // Load analytics
      try {
        const analyticsUrl = selectedStoreId === 'all' 
          ? `/supply-orders/analytics?period=${dateFilter}`
          : `/supply-orders/analytics?period=${dateFilter}&store_id=${selectedStoreId}`;
        const analyticsResponse = await api.get(analyticsUrl);
        if (analyticsResponse.data.success) {
          setAnalytics(analyticsResponse.data.data);
        }
      } catch (error) {
        console.log('Analytics API not available, using mock data');
        // Use mock analytics data
        setAnalytics({
          dailyTrend: [
            { date: new Date().toISOString().split('T')[0], amount: 1250, orders: 1 }
          ],
          methodAmounts: {
            'UPI': 1250,
            'Card': 0,
            'Cash': 0
          },
          topStores: [
            { storeId: '1', orders: 1, amount: 1250 }
          ]
        });
      }

    } catch (error) {
      console.error('Error loading supply hub data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, selectedStoreId]);

  useEffect(() => {
    loadSupplyHubData();
  }, [loadSupplyHubData]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToCSV = () => {
    const currentData = orderData[dateFilter];
    const csvContent = [
      ['Order ID', 'Date', 'Store', 'Items', 'Quantities', 'Status', 'Total Amount', 'Payment ID', 'Payment Method', 'Payment Status'],
      ...currentData.orders.map(order => [
        order.id,
        order.date,
        order.store,
        order.items.join('; '),
        order.quantities.join('; '),
        order.status,
        order.totalAmount,
        order.paymentId,
        order.paymentMethod,
        order.paymentStatus
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supply-orders-${dateFilter}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const currentData = orderData[dateFilter];
    const selectedStore = getSelectedStore();
    const storeName = selectedStore ? selectedStore.name : 'All Stores';
    
    // Set up the document
    doc.setFontSize(20);
    doc.text('Supply Hub Report', 20, 30);
    
    // Add report details
    doc.setFontSize(12);
    doc.text(`Store: ${storeName}`, 20, 50);
    doc.text(`Period: ${dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)}`, 20, 60);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 70);
    
    // Add summary statistics
    doc.setFontSize(14);
    doc.text('Summary', 20, 90);
    doc.setFontSize(10);
    doc.text(`Total Orders: ${currentData.totalOrders}`, 20, 100);
    doc.text(`Total Revenue: ₹${currentData.totalAmount.toLocaleString()}`, 20, 110);
    doc.text(`Connected Stores: ${supplyStores.length}`, 20, 120);
    
    // Add orders table
    if (currentData.orders.length > 0) {
      doc.setFontSize(14);
      doc.text('Recent Orders', 20, 140);
      
      // Table headers
      doc.setFontSize(8);
      doc.text('Order ID', 20, 150);
      doc.text('Date', 50, 150);
      doc.text('Store', 80, 150);
      doc.text('Status', 120, 150);
      doc.text('Amount', 150, 150);
      
      // Table data
      let yPosition = 160;
      currentData.orders.slice(0, 10).forEach((order, index) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.text(order.id, 20, yPosition);
        doc.text(order.date, 50, yPosition);
        doc.text(order.store.length > 15 ? order.store.substring(0, 15) + '...' : order.store, 80, yPosition);
        doc.text(order.status, 120, yPosition);
        doc.text(`₹${order.totalAmount}`, 150, yPosition);
        yPosition += 10;
      });
    }
    
    // Add supply stores information
    if (supplyStores.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Supply Stores', 20, 30);
      
      doc.setFontSize(8);
      let yPos = 50;
      supplyStores.forEach((store, index) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.text(`${store.name}`, 20, yPos);
        doc.text(`Status: ${store.status}`, 20, yPos + 8);
        doc.text(`Orders: ${store.totalOrders || 0}`, 20, yPos + 16);
        yPos += 30;
      });
    }
    
    // Save the PDF
    const fileName = `supply-hub-report-${dateFilter}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'orders', name: 'Orders', icon: Package },
    { id: 'payments', name: 'Payments', icon: DollarSign },
    { id: 'stores', name: 'Supply Stores', icon: Store },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp }
  ];

  const currentData = orderData[dateFilter];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Supply Hub</h1>
                <p className="text-gray-600">Manage your supply relationships and track orders</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadSupplyHubData}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {selectedStoreId === 'all' ? 'Total Supply Stores' : 'Connected Stores'}
                </p>
                <p className="text-2xl font-bold text-gray-900">{supplyStores.length}</p>
                {selectedStoreId !== 'all' && (
                  <p className="text-xs text-gray-500 mt-1">
                    {getSelectedStore()?.name || 'Selected Store'}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Store className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {dateFilter === 'today' ? 'Today\'s Orders' : 
                   dateFilter === 'monthly' ? 'This Month\'s Orders' : 'This Year\'s Orders'}
                </p>
                <p className="text-2xl font-bold text-gray-900">{currentData.totalOrders}</p>
                {selectedStoreId !== 'all' && (
                  <p className="text-xs text-gray-500 mt-1">
                    {getSelectedStore()?.name || 'Selected Store'}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {dateFilter === 'today' ? 'Today\'s Revenue' : 
                   dateFilter === 'monthly' ? 'This Month\'s Revenue' : 'This Year\'s Revenue'}
                </p>
                <p className="text-2xl font-bold text-gray-900">₹{currentData.totalAmount.toLocaleString()}</p>
                {selectedStoreId !== 'all' && (
                  <p className="text-xs text-gray-500 mt-1">
                    {getSelectedStore()?.name || 'Selected Store'}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Stores</p>
                <p className="text-2xl font-bold text-gray-900">
                  {supplyStores.filter(store => store.status === 'active').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Store Selection, Date Filter and Export Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <StoreSelector className="min-w-[200px]" />
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Period:</span>
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="monthly">This Month</option>
              <option value="yearly">This Year</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
                <div className="space-y-3">
                  {currentData.orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(order.status)}
                        <div>
                          <p className="font-medium text-gray-900">{order.id}</p>
                          <p className="text-sm text-gray-600">{order.store}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{order.totalAmount.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">{order.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Supply Stores Status</h3>
                <div className="space-y-3">
                  {supplyStores.map((store) => (
                    <div key={store.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{store.name}</p>
                        <p className="text-sm text-gray-600">{store.address}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(store.status)}`}>
                          {store.status}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">{store.totalOrders} orders</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantities</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.store}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-xs truncate">
                          {order.items.join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.quantities.join(', ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{order.totalAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentData.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{payment.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.method}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          <span className="ml-1">{payment.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.orderId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'stores' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {supplyStores.map((store) => (
              <div key={store.id} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                      <Store className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{store.name}</h3>
                      <p className="text-sm text-gray-600">{store.address}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(store.status)}`}>
                    {store.status}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Phone:</span>
                    <span className="text-sm font-medium text-gray-900">{store.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm font-medium text-gray-900">{store.email}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Orders</p>
                      <p className="text-lg font-semibold text-gray-900">{store.totalOrders}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-lg font-semibold text-gray-900">₹{store.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Last Order</p>
                    <p className="text-sm font-medium text-gray-900">{store.lastOrder}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimpleChart
                data={analytics.dailyTrend?.map(item => ({
                  label: item.date,
                  value: item.amount || item.orders || 0
                })) || []}
                type="line"
                title="Sales Trend (Daily)"
                height={300}
              />

              <SimpleChart
                data={Object.entries(analytics.methodAmounts || {}).map(([method, amount]) => ({
                  label: method.replace('_', ' ').toUpperCase(),
                  value: amount
                }))}
                type="pie"
                title="Payment Methods Distribution"
                height={300}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimpleChart
                data={analytics.topStores?.slice(0, 10).map(store => ({
                  label: store.storeId,
                  value: store.orders
                })) || []}
                type="bar"
                title="Top Stores by Orders"
                height={250}
              />

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics.totalOrders || 0}
                    </div>
                    <div className="text-sm text-blue-800">Total Orders</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ₹{(analytics.totalAmount || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-green-800">Total Amount</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      ₹{(analytics.averageOrderValue || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-yellow-800">Avg Order Value</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {analytics.totalCommission || 0}
                    </div>
                    <div className="text-sm text-purple-800">Total Commission</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-gray-700">Loading supply hub data...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplyHub;
