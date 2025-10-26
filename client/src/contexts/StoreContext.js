import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const StoreContext = createContext();

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

export const StoreProvider = ({ children }) => {
  const [selectedStoreId, setSelectedStoreId] = useState('all');
  const [availableStores, setAvailableStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storesResponse = await api.get('/stores');
      if (storesResponse.data.success) {
        const stores = storesResponse.data.data.map(store => ({
          id: store.id,
          name: store.name,
          address: store.address,
          city: store.city,
          state: store.state,
          phone: store.phone,
          email: store.email,
          is_active: store.is_active
        }));
        setAvailableStores(stores);
      }
    } catch (error) {
      console.log('Stores API not available, using mock data');
      setError('Failed to load stores from API, using mock data');
      // Use mock data if API is not available
      const mockStores = [
        {
          id: '1',
          name: 'Main Medical Store',
          address: '123 Main St, City',
          city: 'City',
          state: 'State',
          phone: '+1-555-0123',
          email: 'main@medical.com',
          is_active: true
        },
        {
          id: '2',
          name: 'Branch Medical Store',
          address: '456 Oak Ave, City',
          city: 'City',
          state: 'State',
          phone: '+1-555-0124',
          email: 'branch@medical.com',
          is_active: true
        }
      ];
      setAvailableStores(mockStores);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSelectedStore = useCallback(() => {
    if (selectedStoreId === 'all') {
      return { id: 'all', name: 'All Stores', address: '', city: '', state: '' };
    }
    return availableStores.find(store => store.id === selectedStoreId) || null;
  }, [selectedStoreId, availableStores]);

  const getStoreById = useCallback((storeId) => {
    if (storeId === 'all') {
      return { id: 'all', name: 'All Stores', address: '', city: '', state: '' };
    }
    return availableStores.find(store => store.id === storeId) || null;
  }, [availableStores]);

  const isStoreSelected = useCallback((storeId) => {
    return selectedStoreId === storeId;
  }, [selectedStoreId]);

  const selectStore = useCallback((storeId) => {
    setSelectedStoreId(storeId);
    // Store selection in localStorage for persistence
    localStorage.setItem('selectedStoreId', storeId);
  }, []);

  const clearStoreSelection = useCallback(() => {
    setSelectedStoreId('all');
    localStorage.removeItem('selectedStoreId');
  }, []);

  // Load stores on mount
  useEffect(() => {
    loadStores();
  }, [loadStores]);

  // Load selected store from localStorage on mount
  useEffect(() => {
    const savedStoreId = localStorage.getItem('selectedStoreId');
    if (savedStoreId && availableStores.some(store => store.id === savedStoreId)) {
      setSelectedStoreId(savedStoreId);
    }
  }, [availableStores]);

  const value = {
    selectedStoreId,
    availableStores,
    loading,
    error,
    loadStores,
    getSelectedStore,
    getStoreById,
    isStoreSelected,
    selectStore,
    clearStoreSelection,
    setSelectedStoreId
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};

export default StoreContext;

