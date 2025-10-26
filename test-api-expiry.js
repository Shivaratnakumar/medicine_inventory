const axios = require('axios');

async function testExpiryAPI() {
  console.log('Testing Expiry API...');
  
  try {
    // Test expired medicines (days=0)
    console.log('\n1. Testing expired medicines (days=0)...');
    const expiredResponse = await axios.get('http://localhost:5000/api/medicines/expiring?days=0', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('Status:', expiredResponse.status);
    console.log('Expired medicines count:', expiredResponse.data.data?.length || 0);
    if (expiredResponse.data.data && expiredResponse.data.data.length > 0) {
      console.log('Sample expired medicine:', expiredResponse.data.data[0]);
    }
    
    // Test expiring medicines (days=30)
    console.log('\n2. Testing expiring medicines (days=30)...');
    const expiringResponse = await axios.get('http://localhost:5000/api/medicines/expiring?days=30', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('Status:', expiringResponse.status);
    console.log('Expiring medicines count:', expiringResponse.data.data?.length || 0);
    if (expiringResponse.data.data && expiringResponse.data.data.length > 0) {
      console.log('Sample expiring medicine:', expiringResponse.data.data[0]);
    }
    
    // Test all medicines
    console.log('\n3. Testing all medicines...');
    const allMedicinesResponse = await axios.get('http://localhost:5000/api/medicines', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('Status:', allMedicinesResponse.status);
    console.log('All medicines count:', allMedicinesResponse.data.data?.length || 0);
    
    // Check for expired medicines in all medicines
    if (allMedicinesResponse.data.data) {
      const today = new Date().toISOString().split('T')[0];
      const expiredInAll = allMedicinesResponse.data.data.filter(med => 
        med.expiry_date && med.expiry_date < today
      );
      console.log('Expired medicines found in all medicines:', expiredInAll.length);
      
      if (expiredInAll.length > 0) {
        console.log('Sample expired from all medicines:', expiredInAll[0]);
      }
    }
    
  } catch (error) {
    console.error('Error testing API:', error.response?.data || error.message);
  }
}

testExpiryAPI();
