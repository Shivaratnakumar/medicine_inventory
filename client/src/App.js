import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Layout from './components/Layout/Layout';
import CartModal from './components/Cart/CartModal';
import Login from './pages/Auth/Login';
import ResetPassword from './pages/Auth/ResetPassword';
import Dashboard from './pages/Dashboard/Dashboard';
import Medicines from './pages/Medicines/Medicines';
import Orders from './pages/Orders/Orders';
import OrderTracking from './pages/OrderTracking/OrderTracking';
import Billing from './pages/Billing/Billing';
import Stores from './pages/Stores/Stores';
import ExpiryTracker from './pages/ExpiryTracker/ExpiryTracker';
import Alerts from './pages/Alerts/Alerts';
import Notifications from './pages/Notifications/Notifications';
import Profile from './pages/Profile/Profile';
import Feedback from './pages/Feedback/Feedback';
import Support from './pages/Support/Support';
import Payment from './pages/Payment/Payment';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/reset-password" 
                element={<ResetPassword />} 
              />

              {/* Protected Routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/medicines" element={<Medicines />} />
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/order-tracking" element={<OrderTracking />} />
                        <Route path="/billing" element={<Billing />} />
                        <Route path="/stores" element={<Stores />} />
                        <Route path="/expiry-tracker" element={<ExpiryTracker />} />
                        <Route path="/alerts" element={<Alerts />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/feedback" element={<Feedback />} />
                        <Route path="/support" element={<Support />} />
                        <Route path="/payment" element={<Payment />} />
                      </Routes>
                    </Layout>
                    <CartModal />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
