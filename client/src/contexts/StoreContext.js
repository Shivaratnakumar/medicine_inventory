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
          name: 'Metro Medical Center',
          address: '123 Healthcare Boulevard, Mumbai',
          city: 'Mumbai',
          state: 'Maharashtra',
          phone: '+91-22-1234-5678',
          email: 'metro@medical.com',
          is_active: true
        },
        {
          id: '2',
          name: 'City Health Pharmacy',
          address: '456 Wellness Street, Delhi',
          city: 'Delhi',
          state: 'Delhi',
          phone: '+91-11-2345-6789',
          email: 'city@healthpharmacy.com',
          is_active: true
        },
        {
          id: '3',
          name: 'Prime Care Medical Store',
          address: '789 Medical Plaza, Bangalore',
          city: 'Bangalore',
          state: 'Karnataka',
          phone: '+91-80-3456-7890',
          email: 'prime@caremedical.com',
          is_active: true
        },
        {
          id: '4',
          name: 'Wellness Plus Pharmacy',
          address: '321 Health Avenue, Chennai',
          city: 'Chennai',
          state: 'Tamil Nadu',
          phone: '+91-44-4567-8901',
          email: 'wellness@pluspharmacy.com',
          is_active: true
        },
        {
          id: '5',
          name: 'Family Health Store',
          address: '654 Care Center, Kolkata',
          city: 'Kolkata',
          state: 'West Bengal',
          phone: '+91-33-5678-9012',
          email: 'family@healthstore.com',
          is_active: true
        },
        {
          id: '6',
          name: 'Community Medical Hub',
          address: '987 Service Road, Hyderabad',
          city: 'Hyderabad',
          state: 'Telangana',
          phone: '+91-40-6789-0123',
          email: 'community@medicalhub.com',
          is_active: true
        },
        {
          id: '7',
          name: 'Downtown Pharmacy',
          address: '456 Broadway Street, New York',
          city: 'New York',
          state: 'NY',
          phone: '+1-555-0201',
          email: 'downtown@pharmacy.com',
          is_active: true
        },
        {
          id: '8',
          name: 'Westside Medical Store',
          address: '789 West Avenue, Los Angeles',
          city: 'Los Angeles',
          state: 'CA',
          phone: '+1-555-0301',
          email: 'westside@pharmacy.com',
          is_active: true
        },
        {
          id: '9',
          name: 'Central Health Pharmacy',
          address: '321 Central Plaza, Chicago',
          city: 'Chicago',
          state: 'IL',
          phone: '+1-555-0401',
          email: 'central@pharmacy.com',
          is_active: true
        },
        {
          id: '10',
          name: 'Main Medical Store',
          address: '123 Main St, City',
          city: 'City',
          state: 'State',
          phone: '+1-555-0123',
          email: 'main@medical.com',
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

