import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import {
  X,
  MapPin,
  Phone,
  Mail,
  Clock,
  Users,
  Package,
  AlertTriangle,
  Receipt,
  CreditCard,
  FileText,
  Bell,
  Calendar,
  TrendingUp,
  Activity
} from 'lucide-react';
import { storesAPI, medicinesAPI, ordersAPI, billingAPI } from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';
import toast from 'react-hot-toast';

// Mock data for demonstration when API data is not available
const mockStoreData = {
  inventory: {
    total_items: 156,
    total_stock: 2847,
    categories: ['Antibiotics', 'Pain Relief', 'Cardiovascular', 'Vitamins', 'Respiratory'],
    low_stock: [
      { id: 1, name: 'Paracetamol 500mg', stock_quantity: 8 },
      { id: 2, name: 'Amoxicillin 250mg', stock_quantity: 5 },
      { id: 3, name: 'Aspirin 100mg', stock_quantity: 12 }
    ],
    expiring: [
      { id: 1, name: 'Amoxicillin 250mg', expiry_date: '2025-06-30' },
      { id: 2, name: 'Albuterol Inhaler', expiry_date: '2025-08-15' }
    ]
  },
  billing: [
    {
      id: 1,
      invoice_number: 'INV-001',
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      total_amount: 45.97,
      payment_status: 'paid',
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      invoice_number: 'INV-002',
      customer_name: 'Jane Smith',
      customer_email: 'jane@example.com',
      total_amount: 28.98,
      payment_status: 'pending',
      created_at: '2024-01-16T14:20:00Z'
    },
    {
      id: 3,
      invoice_number: 'INV-003',
      customer_name: 'Bob Johnson',
      customer_email: 'bob@example.com',
      total_amount: 67.95,
      payment_status: 'paid',
      created_at: '2024-01-17T09:15:00Z'
    }
  ],
  staff: [
    {
      id: 1,
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@pharmacy.com',
      phone: '+1-555-0202',
      role: 'manager',
      position: 'Store Manager',
      is_active: true
    },
    {
      id: 2,
      first_name: 'Mike',
      last_name: 'Chen',
      email: 'mike.chen@pharmacy.com',
      phone: '+1-555-0203',
      role: 'user',
      position: 'Pharmacist',
      is_active: true
    },
    {
      id: 3,
      first_name: 'Lisa',
      last_name: 'Williams',
      email: 'lisa.williams@pharmacy.com',
      phone: '+1-555-0204',
      role: 'user',
      position: 'Sales Associate',
      is_active: true
    }
  ],
  alerts: [
    {
      id: 1,
      type: 'warning',
      title: 'Low Stock Alert',
      message: '3 items are running low in stock',
      created_at: '2024-01-17T08:00:00Z'
    },
    {
      id: 2,
      type: 'info',
      title: 'Expiry Alert',
      message: '2 medicines will expire within 30 days',
      created_at: '2024-01-16T15:30:00Z'
    }
  ]
};

const BranchDetailsModal = ({ store, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch detailed store data
  const { data: storeDetails, isLoading: storeLoading } = useQuery(
    ['store-details', store?.id],
    () => storesAPI.getById(store.id),
    {
      enabled: !!store?.id,
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  // Fetch store inventory
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery(
    ['store-inventory', store?.id],
    () => storesAPI.getInventory(store.id),
    {
      enabled: !!store?.id,
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  // Fetch recent orders for this store
  const { data: recentOrders, isLoading: ordersLoading } = useQuery(
    ['store-orders', store?.id],
    () => storesAPI.getOrders(store.id, { limit: 10 }),
    {
      enabled: !!store?.id,
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  // Fetch billing history for this store
  const { data: billingHistory, isLoading: billingLoading } = useQuery(
    ['store-billing', store?.id],
    () => storesAPI.getBilling(store.id, { limit: 20 }),
    {
      enabled: !!store?.id,
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  // Fetch low stock medicines
  const { data: lowStockData, isLoading: lowStockLoading } = useQuery(
    ['low-stock', store?.id],
    () => medicinesAPI.getLowStock(),
    {
      enabled: !!store?.id,
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  // Fetch expiring medicines
  const { data: expiringData, isLoading: expiringLoading } = useQuery(
    ['expiring-medicines', store?.id],
    () => medicinesAPI.getExpiring(30),
    {
      enabled: !!store?.id,
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  const isLoading = storeLoading || inventoryLoading || ordersLoading || billingLoading;
  
  // Use mock data if API data is not available
  const displayData = {
    inventory: inventoryData?.data || mockStoreData.inventory,
    recentOrders: recentOrders?.data || mockStoreData.billing,
    billingHistory: billingHistory?.data || mockStoreData.billing,
    lowStockData: lowStockData?.data || mockStoreData.inventory.low_stock,
    expiringData: expiringData?.data || mockStoreData.inventory.expiring,
    staffData: mockStoreData.staff, // Using mock data for staff since API might not be available
    alertsData: mockStoreData.alerts
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'billing', label: 'Billing', icon: Receipt },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'notes', label: 'Notes', icon: FileText }
  ];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'inactive':
      case 'closed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Store Basic Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 text-gray-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">{store?.name}</p>
                <p className="text-sm text-gray-600">
                  {store?.address}, {store?.city}, {store?.state} {store?.zip_code}
                </p>
              </div>
            </div>
            {store?.phone && (
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">{store.phone}</span>
              </div>
            )}
            {store?.email && (
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">{store.email}</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(store?.is_active ? 'active' : 'inactive')}`}>
                {store?.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">Mon-Sun: 9:00 AM - 9:00 PM</span>
            </div>
            {store?.users && (
              <div className="flex items-center">
                <Users className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">
                  Manager: {store.users.first_name} {store.users.last_name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Inventory</p>
              <p className="text-2xl font-semibold text-gray-900">
                {displayData.inventory?.total_items || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <Receipt className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Recent Orders</p>
              <p className="text-2xl font-semibold text-gray-900">
                {displayData.recentOrders?.length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(displayData.billingHistory?.reduce((sum, bill) => sum + (bill.total_amount || 0), 0) || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStaffTab = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Members</h3>
        <div className="space-y-3">
          {displayData.staffData?.length > 0 ? (
            displayData.staffData.map((staff) => (
              <div key={staff.id} className="bg-white p-3 rounded border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {staff.first_name} {staff.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{staff.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{staff.email}</p>
                    <p className="text-sm text-gray-600">{staff.phone}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    staff.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {staff.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No staff information available</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderInventoryTab = () => (
    <div className="space-y-4">
      {/* Inventory Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Summary</h3>
        {inventoryLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded border">
              <p className="text-sm font-medium text-gray-500">Total Items</p>
              <p className="text-xl font-semibold text-gray-900">{displayData.inventory?.total_items || 0}</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
              <p className="text-xl font-semibold text-yellow-600">{displayData.lowStockData?.length || 0}</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
              <p className="text-xl font-semibold text-red-600">{displayData.expiringData?.length || 0}</p>
            </div>
          </div>
        )}
      </div>

      {/* Low Stock Alerts */}
      {displayData.lowStockData?.length > 0 && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">Low Stock Alerts</h3>
          <div className="space-y-2">
            {displayData.lowStockData.slice(0, 5).map((medicine) => (
              <div key={medicine.id} className="bg-white p-2 rounded border">
                <p className="font-medium text-gray-900">{medicine.name}</p>
                <p className="text-sm text-gray-600">Stock: {medicine.stock_quantity} units</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expiry Alerts */}
      {displayData.expiringData?.length > 0 && (
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-3">Expiry Alerts</h3>
          <div className="space-y-2">
            {displayData.expiringData.slice(0, 5).map((medicine) => (
              <div key={medicine.id} className="bg-white p-2 rounded border">
                <p className="font-medium text-gray-900">{medicine.name}</p>
                <p className="text-sm text-gray-600">Expires: {formatDate(medicine.expiry_date)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderBillingTab = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h3>
        {billingLoading ? (
          <LoadingSpinner />
        ) : displayData.billingHistory?.length > 0 ? (
          <div className="space-y-3">
            {displayData.billingHistory.slice(0, 10).map((bill) => (
              <div key={bill.id} className="bg-white p-3 rounded border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{bill.invoice_number}</p>
                    <p className="text-sm text-gray-600">{bill.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(bill.total_amount)}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bill.payment_status)}`}>
                      {bill.payment_status}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{formatDate(bill.created_at)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No billing records found</p>
        )}
      </div>
    </div>
  );

  const renderAlertsTab = () => (
    <div className="space-y-4">
      {/* Store Status Alerts */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Alerts & Notifications</h3>
        <div className="space-y-3">
          {!store?.is_active && (
            <div className="bg-red-50 p-3 rounded border border-red-200">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-800 font-medium">Store is currently inactive</p>
              </div>
            </div>
          )}
          
          {displayData.lowStockData?.length > 0 && (
            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-yellow-800 font-medium">
                  {displayData.lowStockData.length} items are low in stock
                </p>
              </div>
            </div>
          )}

          {displayData.expiringData?.length > 0 && (
            <div className="bg-orange-50 p-3 rounded border border-orange-200">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-orange-600 mr-2" />
                <p className="text-orange-800 font-medium">
                  {displayData.expiringData.length} medicines expiring within 30 days
                </p>
              </div>
            </div>
          )}

          {(!displayData.lowStockData?.length && !displayData.expiringData?.length && store?.is_active) && (
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <div className="flex items-center">
                <Bell className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-green-800 font-medium">All systems operational</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderNotesTab = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Notes & Comments</h3>
        <div className="space-y-3">
          <div className="bg-white p-3 rounded border">
            <p className="text-sm text-gray-600">
              This section is for internal notes and comments about the store.
              Add any specific instructions, special handling requirements, or important information here.
            </p>
          </div>
          <div className="bg-white p-3 rounded border">
            <p className="text-sm text-gray-500 italic">
              No custom notes available for this store.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'staff':
        return renderStaffTab();
      case 'inventory':
        return renderInventoryTab();
      case 'billing':
        return renderBillingTab();
      case 'alerts':
        return renderAlertsTab();
      case 'notes':
        return renderNotesTab();
      default:
        return renderOverviewTab();
    }
  };

  if (!store) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-0 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{store.name}</h2>
              <p className="text-sm text-gray-600">{store.address}, {store.city}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b bg-gray-50">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {/* Demo data notice */}
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center">
                  <Bell className="h-4 w-4 text-blue-600 mr-2" />
                  <p className="text-sm text-blue-800">
                    <strong>Demo Mode:</strong> This modal displays sample data for demonstration purposes. 
                    Connect to your database to see real store information.
                  </p>
                </div>
              </div>
              {renderTabContent()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BranchDetailsModal;
