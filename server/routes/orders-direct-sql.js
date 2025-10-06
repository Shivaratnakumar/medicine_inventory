const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/orders-direct
// @desc    Get orders using Supabase client (role-based filtering)
// @access  Private
router.get('/orders-direct', authenticateToken, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;
    
    console.log('🔍 Using Supabase client to fetch orders...', { 
      status, search, page, limit, userRole, userId 
    });
    
    // Build query with filters
    let query = supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply role-based filtering
    if (userRole !== 'admin') {
      // Non-admin users can only see their own orders
      query = query.eq('user_id', userId);
    }
    
    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    // Apply search filter
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,order_number.ilike.%${search}%,customer_email.ilike.%${search}%`);
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    const { data: orders, error: ordersError } = await query.range(offset, offset + limit - 1);
    
    if (ordersError) {
      console.error('❌ Orders fetch error:', ordersError);
      return res.status(500).json({
        success: false,
        message: 'Error fetching orders',
        error: ordersError.message
      });
    }
    
    // Get order items for all orders
    const orderIds = orders?.map(order => order.id) || [];
    let orderItems = [];
    let medicines = [];
    
    if (orderIds.length > 0) {
      const { data: items, error: itemsError } = await supabaseAdmin
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);
      
      if (itemsError) {
        console.error('❌ Order items fetch error:', itemsError);
      } else {
        orderItems = items || [];
        
        // Get medicines for the order items
        const medicineIds = [...new Set(orderItems.map(item => item.medicine_id))];
        if (medicineIds.length > 0) {
          const { data: meds, error: medsError } = await supabaseAdmin
            .from('medicines')
            .select('id, name, sku')
            .in('id', medicineIds);
          
          if (medsError) {
            console.error('❌ Medicines fetch error:', medsError);
          } else {
            medicines = meds || [];
          }
        }
      }
    }
    
    // Combine the data
    const ordersWithItems = orders?.map(order => {
      const items = orderItems.filter(item => item.order_id === order.id);
      const itemsWithMedicines = items.map(item => {
        const medicine = medicines.find(med => med.id === item.medicine_id);
        return {
          id: item.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          medicines: medicine ? { name: medicine.name, sku: medicine.sku } : null
        };
      });
      
      return {
        ...order,
        order_items: itemsWithMedicines
      };
    }) || [];
    
    console.log('📦 Orders fetched:', ordersWithItems?.length || 0);
    
    // Get total count for pagination (with same filters)
    let countQuery = supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    // Apply role-based filtering to count query as well
    if (userRole !== 'admin') {
      countQuery = countQuery.eq('user_id', userId);
    }
    
    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }
    
    if (search) {
      countQuery = countQuery.or(`customer_name.ilike.%${search}%,order_number.ilike.%${search}%,customer_email.ilike.%${search}%`);
    }
    
    const { count } = await countQuery;
    
    res.json({
      success: true,
      data: ordersWithItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Orders fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message
    });
  }
});

// @route   POST /api/orders-direct
// @desc    Create order using Supabase client
// @access  Private
router.post('/orders-direct', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Creating new order with data:', req.body);
    console.log('📝 Items received:', JSON.stringify(req.body.items, null, 2));
    console.log('📝 Store ID received:', req.body.store_id);
    const { customer_name, customer_email, customer_phone, customer_address, items, store_id, notes } = req.body;
    
    // Validate required fields
    if (!customer_name || customer_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required'
      });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }
    
    // Validate store_id if provided
    if (store_id && store_id.trim() !== '') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(store_id)) {
        console.log('❌ Invalid UUID format for store_id:', store_id);
        return res.status(400).json({
          success: false,
          message: `Invalid store ID format: ${store_id}. Expected UUID format.`
        });
      }
    }
    
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate total amount
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      console.log('📝 Processing item:', item);
      
      // Validate item
      if (!item.medicine_id || !item.quantity || item.quantity <= 0) {
        console.log('❌ Invalid item - missing medicine_id or quantity:', item);
        return res.status(400).json({
          success: false,
          message: 'Invalid item: medicine ID and quantity are required'
        });
      }
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(item.medicine_id)) {
        console.log('❌ Invalid UUID format for medicine_id:', item.medicine_id);
        return res.status(400).json({
          success: false,
          message: `Invalid medicine ID format: ${item.medicine_id}. Expected UUID format.`
        });
      }
      
      const { data: medicine, error: medicineError } = await supabaseAdmin
        .from('medicines')
        .select('price, quantity_in_stock, name')
        .eq('id', item.medicine_id)
        .eq('is_active', true)
        .single();
      
      if (medicineError || !medicine) {
        console.error('Medicine not found:', item.medicine_id, medicineError);
        return res.status(400).json({
          success: false,
          message: `Medicine with ID ${item.medicine_id} not found or inactive`
        });
      }
      
      // Check stock availability
      if (medicine.quantity_in_stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${medicine.name}. Available: ${medicine.quantity_in_stock}, Requested: ${item.quantity}`
        });
      }
      
      const unitPrice = parseFloat(medicine.price);
      const totalPrice = unitPrice * item.quantity;
      totalAmount += totalPrice;
      
      orderItems.push({
        medicine_id: item.medicine_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice
      });
    }
    
    // Create order
    console.log('📦 Creating order with total amount:', totalAmount);
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: customer_name.trim(),
        customer_email: customer_email?.trim() || null,
        customer_phone: customer_phone?.trim() || null,
        customer_address: customer_address?.trim() || null,
        store_id: store_id || null,
        user_id: req.user.id,
        total_amount: totalAmount,
        notes: notes?.trim() || null,
        status: 'pending'
      })
      .select()
      .single();
    
    if (orderError) {
      console.error('❌ Error creating order:', orderError);
      return res.status(500).json({
        success: false,
        message: 'Error creating order',
        error: orderError.message
      });
    }
    
    console.log('✅ Order created successfully:', order.id);
    
    // Create order items
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }));
    
    console.log('📋 Creating order items:', orderItemsWithOrderId.length);
    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemsWithOrderId);
    
    if (itemsError) {
      console.error('❌ Error creating order items:', itemsError);
      // Try to clean up the created order
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      return res.status(500).json({
        success: false,
        message: 'Error creating order items',
        error: itemsError.message
      });
    }
    
    console.log('✅ Order items created successfully');
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        ...order,
        order_items: orderItemsWithOrderId
      }
    });
    
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
});

// @route   DELETE /api/orders-direct/:id
// @desc    Delete order (admin only)
// @access  Private (Admin)
router.delete('/orders-direct/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    
    // Only admin users can delete orders
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can delete orders.'
      });
    }
    
    console.log('🗑️ Admin deleting order:', id);
    
    // First, get the order to check if it exists and get order items
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items(
          id,
          medicine_id,
          quantity
        )
      `)
      .eq('id', id)
      .single();
    
    if (orderError || !order) {
      console.error('❌ Order not found:', orderError);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Restore stock for all items in the order
    console.log('📦 Restoring stock for order items...');
    for (const item of order.order_items) {
      try {
        // Get current stock
        const { data: currentMedicine, error: getError } = await supabaseAdmin
          .from('medicines')
          .select('quantity_in_stock')
          .eq('id', item.medicine_id)
          .single();
        
        if (getError) {
          console.error('❌ Error getting current stock for medicine:', item.medicine_id, getError);
          continue;
        }
        
        // Restore stock
        const newStock = currentMedicine.quantity_in_stock + item.quantity;
        
        const { error: stockError } = await supabaseAdmin
          .from('medicines')
          .update({
            quantity_in_stock: newStock
          })
          .eq('id', item.medicine_id);
        
        if (stockError) {
          console.error('❌ Error restoring stock for medicine:', item.medicine_id, stockError);
        } else {
          console.log('✅ Stock restored for medicine:', item.medicine_id, '(+' + item.quantity + ')');
        }
      } catch (stockError) {
        console.error('❌ Error processing stock restoration for medicine:', item.medicine_id, stockError);
      }
    }
    
    // Delete order items first (due to foreign key constraint)
    const { error: itemsDeleteError } = await supabaseAdmin
      .from('order_items')
      .delete()
      .eq('order_id', id);
    
    if (itemsDeleteError) {
      console.error('❌ Error deleting order items:', itemsDeleteError);
      return res.status(500).json({
        success: false,
        message: 'Error deleting order items',
        error: itemsDeleteError.message
      });
    }
    
    // Delete the order
    const { error: deleteError } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('❌ Error deleting order:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Error deleting order',
        error: deleteError.message
      });
    }
    
    console.log('✅ Order deleted successfully:', id);
    
    res.json({
      success: true,
      message: 'Order deleted successfully',
      data: {
        id: id,
        order_number: order.order_number,
        customer_name: order.customer_name
      }
    });
    
  } catch (error) {
    console.error('❌ Order deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting order',
      error: error.message
    });
  }
});

module.exports = router;

