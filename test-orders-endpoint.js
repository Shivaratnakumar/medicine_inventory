// Test this endpoint directly in your browser or Postman
// GET http://localhost:5000/api/test-orders

const express = require('express');
const { supabaseAdmin } = require('./server/config/supabase');

const router = express.Router();

// Simple test endpoint to check orders table
router.get('/test-orders', async (req, res) => {
  try {
    console.log('Testing orders table access...');
    
    // Test 1: Simple select
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Error accessing orders table:', error);
      return res.status(500).json({
        success: false,
        error: error,
        message: 'Error accessing orders table'
      });
    }
    
    console.log('Orders found:', orders?.length || 0);
    
    // Test 2: Check if order_items exists
    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .limit(5);
    
    console.log('Order items found:', orderItems?.length || 0);
    
    res.json({
      success: true,
      orders: orders || [],
      orderItems: orderItems || [],
      message: 'Orders table is accessible'
    });
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Test endpoint failed'
    });
  }
});

module.exports = router;

