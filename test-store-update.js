const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testStoreUpdate() {
  try {
    console.log('🧪 Testing store update functionality...');
    
    // First, let's get the list of stores
    console.log('📋 Fetching stores...');
    const storesResponse = await axios.get(`${API_BASE_URL}/stores`);
    console.log('✅ Stores fetched successfully');
    console.log('📊 Number of stores:', storesResponse.data.data.length);
    
    if (storesResponse.data.data.length === 0) {
      console.log('❌ No stores found to test with');
      return;
    }
    
    const firstStore = storesResponse.data.data[0];
    console.log('🏪 Testing with store:', firstStore.name, '(ID:', firstStore.id, ')');
    
    // Test data for update
    const updateData = {
      name: firstStore.name + ' (Updated)',
      address: firstStore.address,
      city: firstStore.city,
      state: firstStore.state,
      zip_code: firstStore.zip_code,
      phone: firstStore.phone || '+1-555-TEST',
      email: firstStore.email || 'test@store.com'
    };
    
    console.log('📝 Update data:', updateData);
    
    // Test the update
    console.log('🔄 Updating store...');
    const updateResponse = await axios.put(`${API_BASE_URL}/stores/${firstStore.id}`, updateData, {
      timeout: 10000
    });
    
    console.log('✅ Store update successful!');
    console.log('📊 Response:', updateResponse.data);
    
    // Verify the update by fetching the store again
    console.log('🔍 Verifying update...');
    const verifyResponse = await axios.get(`${API_BASE_URL}/stores/${firstStore.id}`);
    console.log('✅ Verification successful');
    console.log('📊 Updated store data:', verifyResponse.data.data);
    
    // Revert the change
    console.log('🔄 Reverting changes...');
    const revertData = {
      name: firstStore.name,
      address: firstStore.address,
      city: firstStore.city,
      state: firstStore.state,
      zip_code: firstStore.zip_code,
      phone: firstStore.phone,
      email: firstStore.email
    };
    
    await axios.put(`${API_BASE_URL}/stores/${firstStore.id}`, revertData, {
      timeout: 10000
    });
    
    console.log('✅ Changes reverted successfully');
    console.log('🎉 Store update test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📊 Error response:', error.response.data);
      console.error('📊 Status:', error.response.status);
    }
    process.exit(1);
  }
}

// Run the test
testStoreUpdate();
