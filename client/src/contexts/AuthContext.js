import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user data with retry logic
      const verifyTokenWithRetry = async () => {
        let retries = 3;
        
        while (retries > 0) {
          try {
            const response = await authAPI.verifyToken();
            const newUser = response.data.user;
            setUser(prevUser => {
              // Clear cache if user changes during session
              if (prevUser && prevUser.id !== newUser.id) {
                queryClient.clear();
              }
              return newUser;
            });
            return;
          } catch (error) {
            retries--;
            
            if (error.response?.status === 401 || error.response?.status === 403) {
              // Token is invalid, remove it immediately
              console.error('Token verification failed - invalid token:', error);
              localStorage.removeItem('token');
              break;
            }
            
            if (retries === 0) {
              // All retries failed, but token might still be valid
              console.error('Token verification failed after retries:', error);
              // Don't remove token on network errors, let the user try again
              if (error.response?.status >= 500) {
                console.warn('Server error during token verification, keeping token');
              } else {
                localStorage.removeItem('token');
              }
            } else {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
      };
      
      verifyTokenWithRetry().finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setUser(user);
      
      // Clear cache when user logs in to prevent data leakage
      queryClient.clear();
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token, user } = response.data;
      
      // Don't auto-login after registration - just return success
      // The user will be redirected to login form
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    // Clear all cached data when user logs out
    queryClient.clear();
  };

  const updateUser = (userData) => {
    setUser(prev => {
      const newUser = { ...prev, ...userData };
      // Clear cache if user role changes to prevent data leakage
      if (prev && prev.role !== newUser.role) {
        queryClient.clear();
      }
      return newUser;
    });
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
