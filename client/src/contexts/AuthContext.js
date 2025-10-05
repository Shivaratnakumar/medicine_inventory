import React, { createContext, useContext, useState, useEffect } from 'react';
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user data with retry logic
      const verifyTokenWithRetry = async () => {
        let retries = 3;
        
        while (retries > 0) {
          try {
            const response = await authAPI.verifyToken();
            setUser(response.data.user);
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
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  const value = {
    user,
    login,
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
