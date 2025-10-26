import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const TestResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log('🔧 TestResetPassword component mounted');
    setMounted(true);
    
    const tokenFromUrl = searchParams.get('token');
    console.log('🔧 Token from URL:', tokenFromUrl);
    setToken(tokenFromUrl);
    
    // Log every second to see if component is still mounted
    const interval = setInterval(() => {
      console.log('🔧 TestResetPassword still mounted at:', new Date().toISOString());
    }, 1000);
    
    return () => {
      console.log('🔧 TestResetPassword component unmounting');
      clearInterval(interval);
    };
  }, [searchParams]);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f0f9ff', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '20px', color: '#1f2937' }}>
          Test Reset Password Page
        </h1>
        
        <div style={{ marginBottom: '20px' }}>
          <strong>Token from URL:</strong>
          <div style={{ 
            wordBreak: 'break-all', 
            backgroundColor: '#f3f4f6', 
            padding: '10px', 
            borderRadius: '5px',
            marginTop: '5px',
            fontSize: '12px'
          }}>
            {token || 'No token found'}
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <strong>Current URL:</strong>
          <div style={{ 
            wordBreak: 'break-all', 
            backgroundColor: '#f3f4f6', 
            padding: '10px', 
            borderRadius: '5px',
            marginTop: '5px',
            fontSize: '12px'
          }}>
            {window.location.href}
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <strong>Search Params:</strong>
          <div style={{ 
            backgroundColor: '#f3f4f6', 
            padding: '10px', 
            borderRadius: '5px',
            marginTop: '5px',
            fontSize: '12px'
          }}>
            {searchParams.toString()}
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>
            This page should stay loaded and not redirect to login.
          </p>
          <p style={{ color: '#6b7280' }}>
            Check the browser console for debug messages.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestResetPassword;
