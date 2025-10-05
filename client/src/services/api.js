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

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  verifyToken: () => api.get('/auth/verify'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
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
    const response = await api.delete(`/orders/${id}`);
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
    try {
      const response = await api.get('/billing', { params });
      return response.data; // Return the actual data, not the axios response
    } catch (error) {
      console.error('Billing API Error:', error);
      throw error;
    }
  },
  getById: (id) => api.get(`/billing/${id}`),
  create: (data) => api.post('/billing', data),
  update: (id, data) => api.put(`/billing/${id}`, data),
  delete: (id) => api.delete(`/billing/${id}`),
  generateInvoice: (id) => api.get(`/billing/${id}/invoice`),
};

// Stores API
export const storesAPI = {
  getAll: async () => {
    const response = await api.get('/stores');
    return response.data; // Return the actual data, not the axios response
  },
  getById: (id) => api.get(`/stores/${id}`),
  create: (data) => api.post('/stores', data),
  update: (id, data) => api.put(`/stores/${id}`, data),
  delete: (id) => api.delete(`/stores/${id}`),
  getInventory: (id) => api.get(`/stores/${id}/inventory`),
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
  createPaymentIntent: (data) => api.post('/payments/create-intent', data),
  confirmPayment: (data) => api.post('/payments/confirm', data),
  getPaymentHistory: async (params) => {
    const response = await api.get('/payments/history', { params });
    return response.data; // Return the actual data, not the axios response
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
