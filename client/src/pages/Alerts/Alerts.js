import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { AlertTriangle, Package, TrendingDown, Bell, CheckCircle, X } from 'lucide-react';
import { medicinesAPI, notificationsAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const Alerts = () => {
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const [showBulkAlertModal, setShowBulkAlertModal] = useState(false);
  const [bulkAlertData, setBulkAlertData] = useState({
    title: '',
    message: '',
    type: 'warning',
    recipients: 'all'
  });
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
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



  // Send bulk alerts mutation
  const sendBulkAlertMutation = useMutation(
    (data) => notificationsAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications');
        setShowBulkAlertModal(false);
        setBulkAlertData({ title: '', message: '', type: 'warning', recipients: 'all' });
        toast.success('Bulk alert sent successfully');
      },
      onError: () => {
        toast.error('Failed to send bulk alert');
      }
    }
  );

  // Restock selected medicines mutation
  const restockSelectedMutation = useMutation(
    async (medicineIds) => {
      // Create purchase orders for selected medicines
      const restockPromises = medicineIds.map(async (medicineId) => {
        const medicine = lowStockMedicines.find(m => m.id === medicineId);
        if (medicine) {
          // Calculate suggested restock quantity (3x minimum stock level)
          const suggestedQuantity = Math.max(medicine.minimum_stock_level * 3, 50);
          
          // Create notification for restock
          return notificationsAPI.create({
            title: `Restock Required: ${medicine.name}`,
            message: `${medicine.name} (SKU: ${medicine.sku}) is low in stock. Current: ${medicine.quantity_in_stock}, Minimum: ${medicine.minimum_stock_level}. Suggested restock quantity: ${suggestedQuantity}`,
            type: 'warning',
            user_id: null, // Admin notification
            metadata: {
              medicine_id: medicineId,
              medicine_name: medicine.name,
              current_stock: medicine.quantity_in_stock,
              minimum_stock: medicine.minimum_stock_level,
              suggested_quantity: suggestedQuantity
            }
          });
        }
        return null;
      });
      
      await Promise.all(restockPromises.filter(Boolean));
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications');
        setSelectedAlerts([]);
        toast.success(`Restock notifications created for ${selectedAlerts.length} medicines`);
      },
      onError: () => {
        toast.error('Failed to create restock notifications');
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
    if (selectedAlerts.length === filteredMedicines?.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts((filteredMedicines && Array.isArray(filteredMedicines)) 
        ? filteredMedicines.map(m => m.id) 
        : []);
    }
  };


  const handleSendBulkAlert = () => {
    if (!bulkAlertData.title.trim() || !bulkAlertData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    sendBulkAlertMutation.mutate({
      ...bulkAlertData,
      user_id: bulkAlertData.recipients === 'all' ? null : 'current_user'
    });
  };

  const handleRestockSelected = () => {
    if (selectedAlerts.length === 0) {
      toast.error('Please select medicines to restock');
      return;
    }
    
    restockSelectedMutation.mutate(selectedAlerts);
  };

  const handleExportAlerts = () => {
    if (lowStockMedicines.length === 0) {
      toast.error('No alerts to export');
      return;
    }

    const csvContent = [
      ['Medicine Name', 'SKU', 'Current Stock', 'Minimum Stock', 'Status', 'Urgency'],
      ...lowStockMedicines.map(medicine => {
        const stockStatus = getStockStatus(medicine.quantity_in_stock, medicine.minimum_stock_level);
        return [
          medicine.name,
          medicine.sku || 'N/A',
          medicine.quantity_in_stock,
          medicine.minimum_stock_level,
          stockStatus.status,
          stockStatus.urgency
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `low-stock-alerts-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Alerts exported successfully');
  };

  const handleGenerateRestockReport = () => {
    if (lowStockMedicines.length === 0) {
      toast.error('No low stock medicines to generate report for');
      return;
    }

    const reportData = lowStockMedicines.map(medicine => {
      const stockStatus = getStockStatus(medicine.quantity_in_stock, medicine.minimum_stock_level);
      const suggestedQuantity = Math.max(medicine.minimum_stock_level * 3, 50);
      
      return {
        medicine_name: medicine.name,
        sku: medicine.sku || 'N/A',
        current_stock: medicine.quantity_in_stock,
        minimum_stock: medicine.minimum_stock_level,
        suggested_quantity: suggestedQuantity,
        status: stockStatus.status,
        urgency: stockStatus.urgency,
        estimated_cost: suggestedQuantity * (medicine.price_per_unit || 0)
      };
    });

    const csvContent = [
      ['Medicine Name', 'SKU', 'Current Stock', 'Minimum Stock', 'Suggested Quantity', 'Status', 'Urgency', 'Estimated Cost'],
      ...reportData.map(item => [
        item.medicine_name,
        item.sku,
        item.current_stock,
        item.minimum_stock,
        item.suggested_quantity,
        item.status,
        item.urgency,
        item.estimated_cost.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restock-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Restock report generated successfully');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alerts & Notifications</h1>
            <p className="mt-2 text-sm text-gray-700">
              Monitor low stock alerts and system notifications
            </p>
          </div>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alerts & Notifications</h1>
            <p className="mt-2 text-sm text-gray-700">
              Monitor low stock alerts and system notifications
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="text-red-600 text-lg">Error loading alerts</div>
          <div className="text-gray-500 mt-2">Please try refreshing the page</div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Filter medicines based on search and urgency filter
  const filteredMedicines = (lowStockMedicines && Array.isArray(lowStockMedicines)) 
    ? lowStockMedicines.filter(medicine => {
        const stockStatus = getStockStatus(medicine.quantity_in_stock, medicine.minimum_stock_level);
        const matchesSearch = !searchTerm || 
          medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (medicine.sku && medicine.sku.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesUrgency = filterUrgency === 'all' || stockStatus.urgency === filterUrgency;
        return matchesSearch && matchesUrgency;
      })
    : [];

  const criticalCount = (lowStockMedicines && Array.isArray(lowStockMedicines)) 
    ? lowStockMedicines.filter(m => getStockStatus(m.quantity_in_stock, m.minimum_stock_level).urgency === 'critical').length 
    : 0;
  const highCount = (lowStockMedicines && Array.isArray(lowStockMedicines)) 
    ? lowStockMedicines.filter(m => getStockStatus(m.quantity_in_stock, m.minimum_stock_level).urgency === 'high').length 
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
          <button 
            className="btn btn-primary"
            onClick={() => setShowBulkAlertModal(true)}
          >
            <Bell className="h-4 w-4 mr-2" />
            Send Bulk Alerts
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    {lowStockMedicines?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Search and Filter Controls */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search medicines by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Urgency Levels</option>
                <option value="critical">Critical Only</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
            {(searchTerm || filterUrgency !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterUrgency('all');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Low Stock Alerts</h3>
                {(searchTerm || filterUrgency !== 'all') && (
                  <p className="text-sm text-gray-500 mt-1">
                    Showing {filteredMedicines.length} of {lowStockMedicines?.length || 0} medicines
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  {selectedAlerts.length === filteredMedicines?.length ? 'Deselect All' : 'Select All'}
                </button>
                {selectedAlerts.length > 0 && (
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={handleRestockSelected}
                    disabled={restockSelectedMutation.isLoading}
                  >
                    {restockSelectedMutation.isLoading ? 'Processing...' : `Restock Selected (${selectedAlerts.length})`}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {(filteredMedicines && Array.isArray(filteredMedicines)) ? filteredMedicines.map((medicine) => {
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
                  {filteredMedicines.length === 0 && (searchTerm || filterUrgency !== 'all') ? (
                    <>
                      <Package className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No medicines match your filters</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Try adjusting your search terms or filter criteria.
                      </p>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No low stock alerts</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        All medicines are well stocked.
                      </p>
                    </>
                  )}
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
          <button 
            className="btn btn-outline"
            onClick={handleExportAlerts}
          >
            Export Alerts
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleGenerateRestockReport}
          >
            Generate Restock Report
          </button>
        </div>
      </div>

      {/* Bulk Alert Modal */}
      {showBulkAlertModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Send Bulk Alert</h3>
                <button
                  onClick={() => setShowBulkAlertModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alert Title *
                  </label>
                  <input
                    type="text"
                    value={bulkAlertData.title}
                    onChange={(e) => setBulkAlertData({...bulkAlertData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter alert title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    value={bulkAlertData.message}
                    onChange={(e) => setBulkAlertData({...bulkAlertData, message: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter alert message"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alert Type
                  </label>
                  <select
                    value={bulkAlertData.type}
                    onChange={(e) => setBulkAlertData({...bulkAlertData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="success">Success</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipients
                  </label>
                  <select
                    value={bulkAlertData.recipients}
                    onChange={(e) => setBulkAlertData({...bulkAlertData, recipients: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Users</option>
                    <option value="admin">Admin Only</option>
                    <option value="current_user">Current User Only</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowBulkAlertModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendBulkAlert}
                  disabled={sendBulkAlertMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {sendBulkAlertMutation.isLoading ? 'Sending...' : 'Send Alert'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
