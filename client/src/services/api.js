import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
    
    // Handle 503 errors (service unavailable) with retry
    if (error.response?.status === 503 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Wait and retry once
      await new Promise(resolve => setTimeout(resolve, 2000));
      return api(originalRequest);
    }
    
    // Handle network errors with retry
    if (!error.response && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Wait and retry once
      await new Promise(resolve => setTimeout(resolve, 1000));
      return api(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  verifyToken: () => api.get('/auth/verify'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyOTP: (phone, otp) => api.post('/auth/verify-otp', { phone, otp }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Medicines API
export const medicinesAPI = {
  getAll: async (params) => {
    const response = await api.get('/medicines', { params });
    return response.data; // Return the actual data, not the axios response
  },
  getById: (id) => api.get(`/medicines/${id}`),
  create: (data) => api.post('/medicines', data),
  update: (id, data) => api.put(`/medicines/${id}`, data),
  delete: (id) => api.delete(`/medicines/${id}`),
  search: (query) => api.get(`/medicines/search?q=${query}`),
  getLowStock: async () => {
    const response = await api.get('/medicines/low-stock');
    return response.data; // Return the actual data, not the axios response
  },
  getExpiring: async (days = 30) => {
    const response = await api.get(`/medicines/expiring?days=${days}`);
    return response.data; // Return the actual data, not the axios response
  },
};

// Medicine Names API (for autocomplete and fuzzy search)
export const medicineNamesAPI = {
  getAll: async (params) => {
    const response = await api.get('/medicine-names', { params });
    return response.data;
  },
  getAutocomplete: async (query, limit = 20) => { // Increased from 10 to 20
    const response = await api.get(`/medicine-names/autocomplete?q=${query}&limit=${limit}`);
    return response.data;
  },
  search: async (query, options = {}) => {
    const { type = 'all', min_score = 0.1, limit = 40, offset = 0 } = options; // Increased from 20 to 40
    const params = new URLSearchParams({
      q: query,
      type,
      min_score: min_score.toString(),
      limit: limit.toString(),
      offset: offset.toString()
    });
    const response = await api.get(`/medicine-names/search?${params}`);
    return response.data;
  },
  create: (data) => api.post('/medicine-names', data),
  update: (id, data) => api.put(`/medicine-names/${id}`, data),
  delete: (id) => api.delete(`/medicine-names/${id}`),
  bulkImport: (medicines) => api.post('/medicine-names/bulk-import', { medicines }),
  getStats: async () => {
    const response = await api.get('/medicine-names/stats');
    return response.data;
  },
};

// Convenience functions for autocomplete
export const getAutocompleteSuggestions = async (query, limit = 20) => { // Increased from 10 to 20
  return await medicineNamesAPI.getAutocomplete(query, limit);
};

export const searchMedicineNames = async (query, options = {}) => {
  return await medicineNamesAPI.search(query, options);
};

// Ollama API functions
export const ollamaAPI = {
  search: async (query, options = {}) => {
    const { limit = 10, min_score = 0.1 } = options;
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      min_score: min_score.toString()
    });
    const response = await api.get(`/medicine-names/ollama-search?${params}`);
    return response.data;
  },
  getStatus: async () => {
    const response = await api.get('/medicine-names/ollama-status');
    return response.data;
  }
};

// Orders API - Using direct SQL endpoints to bypass Supabase issues
export const ordersAPI = {
  getAll: async (params) => {
    console.log('🔍 Using direct SQL orders endpoint...');
    try {
      const response = await api.get('/orders-direct', { 
        params,
        timeout: 10000 // 10 second timeout
      });
      return response.data; // Return the actual data, not the axios response
    } catch (error) {
      console.error('Orders API Error:', error);
      // Return a structured error response
      throw {
        response: {
          data: {
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
          }
        }
      };
    }
  },
  getById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  create: async (data) => {
    console.log('🔍 Using direct SQL create order endpoint...');
    console.log('📤 Sending data:', data);
    try {
      const response = await api.post('/orders-direct', data, {
        timeout: 15000, // 15 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Order creation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Order creation error:', error);
      console.error('❌ Error response:', error.response?.data);
      throw error;
    }
  },
  update: async (id, data) => {
    const response = await api.put(`/orders/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/orders-direct/${id}`);
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  },
};

// Billing API
export const billingAPI = {
  getAll: async (params) => {
    const response = await api.get('/billing', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/billing/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/billing', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/billing/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/billing/${id}`);
    return response.data;
  },
  getByOrderId: async (orderId) => {
    const response = await api.get(`/orders/${orderId}/billing`);
    return response.data;
  },
  generateInvoice: (id) => api.get(`/billing/${id}/invoice`),
};

// Stores API
export const storesAPI = {
  getAll: async () => {
    const response = await api.get('/stores');
    return response.data; // Return the actual data, not the axios response
  },
  getById: async (id) => {
    const response = await api.get(`/stores/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/stores', data);
    return response.data;
  },
  update: async (id, data) => {
    console.log('Updating store with ID:', id, 'Data:', data);
    const response = await api.put(`/stores/${id}`, data, {
      timeout: 10000 // 10 second timeout
    });
    console.log('Store update response:', response.data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/stores/${id}`);
    return response.data;
  },
  getInventory: async (id) => {
    const response = await api.get(`/stores/${id}/inventory`);
    return response.data;
  },
  getStaff: async (id) => {
    const response = await api.get(`/stores/${id}/staff`);
    return response.data;
  },
  getOrders: async (id, params = {}) => {
    const response = await api.get(`/stores/${id}/orders`, { params });
    return response.data;
  },
  getBilling: async (id, params = {}) => {
    const response = await api.get(`/stores/${id}/billing`, { params });
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getSales: (period) => api.get(`/analytics/sales?period=${period}`),
  getInventory: () => api.get('/analytics/inventory'),
  getExpiry: () => api.get('/analytics/expiry'),
  getLowStock: () => api.get('/analytics/low-stock'),
};

// Notifications API
export const notificationsAPI = {
  getAll: async () => {
    const response = await api.get('/notifications');
    return response.data; // Return the actual data, not the axios response
  },
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  create: (data) => api.post('/notifications', data),
};

// Feedback API
export const feedbackAPI = {
  getAll: async (params) => {
    const response = await api.get('/feedback', { params });
    return response.data; // Return the actual data, not the axios response
  },
  getById: (id) => api.get(`/feedback/${id}`),
  create: (data) => api.post('/feedback', data),
  update: (id, data) => api.put(`/feedback/${id}`, data),
  delete: (id) => api.delete(`/feedback/${id}`),
};

// Support API
export const supportAPI = {
  getAll: async (params) => {
    const response = await api.get('/support', { params });
    return response.data; // Return the actual data, not the axios response
  },
  getById: (id) => api.get(`/support/${id}`),
  create: (data) => api.post('/support', data),
  update: (id, data) => api.put(`/support/${id}`, data),
  delete: (id) => api.delete(`/support/${id}`),
  updateStatus: (id, status) => api.patch(`/support/${id}/status`, { status }),
};

// Payment API
export const paymentAPI = {
  create: (data) => api.post('/payments', data),
  createPaymentIntent: (data) => api.post('/payments/create-intent', data),
  confirmPayment: (data) => api.post('/payments/confirm', data),
  getPaymentHistory: async (params) => {
    const response = await api.get('/payments/history', { params });
    return response.data; // Return the actual data, not the axios response
  },
  processOrderPayment: async (orderData) => {
    try {
      // Create payment intent
      const paymentIntentResponse = await api.post('/payments/create-intent', {
        amount: orderData.total_amount,
        order_id: orderData.order_id,
        payment_method: orderData.payment_method
      });

      // Confirm payment
      const confirmResponse = await api.post('/payments/confirm', {
        payment_intent_id: paymentIntentResponse.data.data.payment_intent_id,
        order_id: orderData.order_id,
        amount: orderData.total_amount,
        payment_method: orderData.payment_method
      });

      return confirmResponse.data;
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  },
};

// Profile API
export const profileAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
  changePassword: (data) => api.put('/profile/password', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
