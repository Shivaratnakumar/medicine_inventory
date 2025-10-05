import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock the AuthContext to avoid authentication issues in tests
jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    user: null,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    updateUser: jest.fn()
  })
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ children }) => children,
  Navigate: () => <div>Navigate</div>
}));

// Mock the API service
jest.mock('../services/api', () => ({
  authAPI: {
    login: jest.fn(),
    register: jest.fn(),
    verifyToken: jest.fn()
  }
}));

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
    // The app should render without throwing any errors
  });

  test('renders loading spinner when loading', () => {
    // This test would need to be updated based on your loading state implementation
    render(<App />);
    // Add specific assertions based on your loading behavior
  });
});
