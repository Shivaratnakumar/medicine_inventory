import React from 'react';
import { useStore } from '../contexts/StoreContext';
import { Store, ChevronDown } from 'lucide-react';

const StoreSelector = ({ className = "" }) => {
  const { 
    selectedStoreId, 
    availableStores, 
    selectStore, 
    getSelectedStore,
    loading 
  } = useStore();

  const selectedStore = getSelectedStore();

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Store className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-500">Loading stores...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Store className="h-4 w-4 text-gray-500" />
      <select
        value={selectedStoreId}
        onChange={(e) => selectStore(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
      >
        <option value="all">All Stores</option>
        {availableStores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.name} - {store.city}
          </option>
        ))}
      </select>
      {selectedStore && selectedStoreId !== 'all' && (
        <div className="text-xs text-gray-500">
          {selectedStore.name}
        </div>
      )}
    </div>
  );
};

export default StoreSelector;




