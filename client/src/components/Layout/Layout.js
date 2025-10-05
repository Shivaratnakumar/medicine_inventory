import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import {
  LayoutDashboard,
  Pill,
  ShoppingCart,
  Receipt,
  Store,
  Calendar,
  Bell,
  AlertTriangle,
  MessageSquare,
  HeadphonesIcon,
  CreditCard,
  User,
  LogOut,
  Menu,
  X,
  Package
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { getCartItemCount, openCart } = useCart();
  const location = useLocation();

  const mainNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Medicines', href: '/medicines', icon: Pill },
    { name: 'Expiry Tracker', href: '/expiry-tracker', icon: Calendar },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Order Tracking', href: '/order-tracking', icon: Package },
    { name: 'Billing', href: '/billing', icon: Receipt },
    { name: 'Payment', href: '/payment', icon: CreditCard },
  ];

  const managementNavigation = [
    { name: 'Stores', href: '/stores', icon: Store },
    { name: 'Alerts', href: '/alerts', icon: AlertTriangle },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Support', href: '/support', icon: HeadphonesIcon },
    { name: 'Feedback', href: '/feedback', icon: MessageSquare },
  ];

  const handleLogout = () => {
    logout();
  };

  const isActive = (href) => {
    // Make Dashboard active by default when on root path or dashboard
    if (href === '/dashboard' && (location.pathname === '/' || location.pathname === '/dashboard')) {
      return true;
    }
    return location.pathname === href;
  };

  return (
    <div className="h-screen flex overflow-hidden bg-medical-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-medical-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent mainNavigation={mainNavigation} managementNavigation={managementNavigation} isActive={isActive} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent mainNavigation={mainNavigation} managementNavigation={managementNavigation} isActive={isActive} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-lg border-b border-medical-200">
          <button
            type="button"
            className="px-4 border-r border-medical-200 text-medical-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-medical-400 focus-within:text-medical-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <span className="text-lg font-semibold text-medical-900">
                      Medicine Inventory Management
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              {/* Shopping Cart */}
              <button 
                onClick={openCart}
                className="relative bg-white p-1 rounded-full text-medical-400 hover:text-medical-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-2"
              >
                <ShoppingCart className="h-6 w-6" />
                {getCartItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getCartItemCount()}
                  </span>
                )}
              </button>

              {/* Notifications */}
              <button className="bg-white p-1 rounded-full text-medical-400 hover:text-medical-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <Bell className="h-6 w-6" />
              </button>

              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.name?.split(' ').map(n => n.charAt(0)).join('').toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-medical-700">
                      {user?.name || 'User'}
                    </div>
                    <div className="text-xs text-medical-500 capitalize">
                      {user?.role}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to="/profile"
                      className="p-2 text-medical-400 hover:text-medical-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-full"
                    >
                      <User className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-medical-400 hover:text-medical-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-full"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const SidebarContent = ({ mainNavigation, managementNavigation, isActive }) => {
  const renderNavigationItem = (item) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.name}
        to={item.href}
        className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
          isActive(item.href)
            ? 'bg-gradient-to-r from-primary-100 to-teal-100 text-primary-900 shadow-sm border-l-4 border-primary-500'
            : 'text-medical-600 hover:bg-medical-100 hover:text-medical-900 hover:shadow-sm'
        }`}
      >
        <Icon
          className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors ${
            isActive(item.href) ? 'text-primary-600' : 'text-medical-600 group-hover:text-medical-800'
          }`}
        />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 border-r border-medical-200 bg-gradient-to-br from-white via-primary-50 to-teal-50">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="h-8 w-8 bg-gradient-to-br from-primary-500 to-teal-500 rounded-lg flex items-center justify-center shadow-md">
            <Pill className="h-5 w-5 text-white" />
          </div>
          <span className="ml-2 text-lg font-semibold text-medical-900">
            MedInventory
          </span>
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {/* Main Operations Group */}
          {mainNavigation.map(renderNavigationItem)}
          
          {/* Separator */}
          <div className="my-4 mx-3 border-t border-medical-200"></div>
          
          {/* Management & Support Group */}
          {managementNavigation.map(renderNavigationItem)}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
