import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Calendar, AlertTriangle, Clock, Package, Filter } from 'lucide-react';
import { medicinesAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const ExpiryTracker = () => {
  const [filterDays, setFilterDays] = useState(30);
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch expiring medicines
  const { data: expiringMedicines, isLoading, error } = useQuery(
    ['expiring-medicines', filterDays],
    () => medicinesAPI.getExpiring(filterDays),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Fetch expired medicines
  const { data: expiredMedicines } = useQuery(
    'expired-medicines',
    () => medicinesAPI.getExpiring(0), // 0 days means already expired
  );

  const getExpiryStatus = (expiryDate) => {
    // Use date strings in YYYY-MM-DD format to avoid timezone issues
    const today = new Date().toISOString().split('T')[0];
    const expiry = expiryDate.split('T')[0]; // Handle both date and datetime formats
    
    // Calculate difference in days
    const todayDate = new Date(today);
    const expiryDateObj = new Date(expiry);
    const diffTime = expiryDateObj - todayDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'expired', color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle };
    if (diffDays <= 7) return { status: 'critical', color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle };
    if (diffDays <= 30) return { status: 'warning', color: 'text-orange-600', bg: 'bg-orange-100', icon: Clock };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-100', icon: Package };
  };

  const getDaysUntilExpiry = (expiryDate) => {
    // Use date strings in YYYY-MM-DD format to avoid timezone issues
    const today = new Date().toISOString().split('T')[0];
    const expiry = expiryDate.split('T')[0]; // Handle both date and datetime formats
    
    // Calculate difference in days
    const todayDate = new Date(today);
    const expiryDateObj = new Date(expiry);
    const diffTime = expiryDateObj - todayDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredMedicines = (expiringMedicines?.data && Array.isArray(expiringMedicines.data)) 
    ? expiringMedicines.data.filter(medicine => {
        if (filterStatus === 'all') return true;
        const status = getExpiryStatus(medicine.expiry_date).status;
        return status === filterStatus;
      })
    : [];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">Error loading expiry data</div>
        <div className="text-gray-500 mt-2">Please try refreshing the page</div>
      </div>
    );
  }

  const expiredCount = expiredMedicines?.data?.length || 0;
  const expiringCount = expiringMedicines?.data?.length || 0;
  const criticalCount = (Array.isArray(filteredMedicines)) 
    ? filteredMedicines.filter(m => getExpiryStatus(m.expiry_date).status === 'critical').length 
    : 0;
  const warningCount = (Array.isArray(filteredMedicines)) 
    ? filteredMedicines.filter(m => getExpiryStatus(m.expiry_date).status === 'warning').length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expiry Tracker</h1>
          <p className="mt-2 text-sm text-gray-700">
            Monitor medicine expiry dates and manage inventory
          </p>
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
                    Expired
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {expiredCount}
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
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Critical (7 days)
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
                <div className="p-3 rounded-md bg-yellow-500">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Warning (30 days)
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {warningCount}
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
                  <Package className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Expiring
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {expiringCount}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Days to Expiry
            </label>
            <select
              value={filterDays}
              onChange={(e) => setFilterDays(parseInt(e.target.value))}
              className="input"
            >
              <option value={7}>Next 7 days</option>
              <option value={30}>Next 30 days</option>
              <option value={60}>Next 60 days</option>
              <option value={90}>Next 90 days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Filter
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="expired">Expired</option>
              <option value="critical">Critical (≤7 days)</option>
              <option value="warning">Warning (≤30 days)</option>
              <option value="good">Good</option>
            </select>
          </div>

          <div className="flex items-end">
            <button className="btn btn-outline">
              <Filter className="h-4 w-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Medicines List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Expiring Medicines
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Medicines expiring within the selected timeframe
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {(Array.isArray(filteredMedicines)) ? filteredMedicines.map((medicine) => {
            const expiryStatus = getExpiryStatus(medicine.expiry_date);
            const daysUntilExpiry = getDaysUntilExpiry(medicine.expiry_date);
            const Icon = expiryStatus.icon;

            return (
              <li key={medicine.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 p-2 rounded-full ${expiryStatus.bg}`}>
                      <Icon className={`h-5 w-5 ${expiryStatus.color}`} />
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h4 className="text-lg font-medium text-gray-900">
                          {medicine.name}
                        </h4>
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${expiryStatus.bg} ${expiryStatus.color}`}>
                          {expiryStatus.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-500">
                          {medicine.generic_name} • {medicine.manufacturer}
                        </p>
                        <p className="text-sm text-gray-500">
                          SKU: {medicine.sku} • Batch: {medicine.batch_number}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className={`text-sm font-medium ${expiryStatus.color}`}>
                        {daysUntilExpiry < 0 
                          ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                          : daysUntilExpiry === 0
                          ? 'Expires today'
                          : `Expires in ${daysUntilExpiry} days`
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(medicine.expiry_date.split('T')[0]).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        Stock: {medicine.quantity_in_stock}
                      </p>
                      <p className="text-sm text-gray-500">
                        Price: ${medicine.price}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                        Restock
                      </button>
                      <button className="text-gray-400 hover:text-gray-500 text-sm font-medium">
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          }) : (
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No medicines found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No medicines match your current filter criteria.
              </p>
            </div>
          )}
        </ul>

      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Showing {Array.isArray(filteredMedicines) ? filteredMedicines.length : 0} medicines
        </div>
        <div className="flex space-x-3">
          <button className="btn btn-outline">
            Send Expiry Alerts
          </button>
          <button className="btn btn-primary">
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpiryTracker;
