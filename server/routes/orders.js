const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { processOrderCompletion, getBillingForOrder } = require('../utils/billingUtils');

const router = express.Router();

// @route   GET /api/orders
// @desc    Get orders (role-based filtering)
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items(
          id,
          quantity,
          unit_price,
          total_price,
          medicines(name, sku)
        ),
        stores(name),
        users(first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    // Apply role-based filtering
    if (userRole !== 'admin') {
      // Non-admin users can only see their own orders
      query = query.eq('user_id', userId);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Add search functionality
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,order_number.ilike.%${search}%,customer_email.ilike.%${search}%`);
    }

    const offset = (page - 1) * limit;
    const { data: orders, error } = await query.range(offset, offset + limit - 1);
    
    // Get total count for pagination
    let count = 0;
    if (!error) {
      let countQuery = supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true });
      
      // Apply role-based filtering to count query as well
      if (userRole !== 'admin') {
        countQuery = countQuery.eq('user_id', userId);
      }
      
      const { count: totalCount } = await countQuery;
      count = totalCount || 0;
    }

    if (error) {
      console.error('Error fetching orders:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // If table doesn't exist or schema cache issue, return empty data instead of error
      if (error.code === 'PGRST205') {
        console.log('PGRST205 error detected - table not found in schema cache');
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          },
          warning: 'Orders table not found in schema cache. Please refresh the schema in Supabase.'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Error fetching orders',
        error: error.message,
        code: error.code
      });
    }

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching orders'
    });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', authenticateToken, [
  body('customer_name').trim().isLength({ min: 1 }).withMessage('Customer name is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.medicine_id').isUUID().withMessage('Valid medicine ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { customer_name, customer_email, customer_phone, customer_address, items, store_id, notes, order_type } = req.body;

    // Generate order number based on order type
    const orderPrefix = order_type === 'prescription' ? 'PRES' : 'ORD';
    const orderNumber = `${orderPrefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      // Get medicine details
      const { data: medicine, error: medicineError } = await supabaseAdmin
        .from('medicines')
        .select('price, quantity_in_stock')
        .eq('id', item.medicine_id)
        .eq('is_active', true)
        .single();

      if (medicineError || !medicine) {
        return res.status(400).json({
          success: false,
          message: `Medicine with ID ${item.medicine_id} not found`
        });
      }

      if (medicine.quantity_in_stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for medicine ${item.medicine_id}`
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
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name,
        customer_email,
        customer_phone,
        customer_address,
        store_id: store_id || null,
        user_id: req.user.id,
        total_amount: totalAmount,
        notes,
        order_type: order_type || 'regular'
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return res.status(500).json({
        success: false,
        message: 'Error creating order'
      });
    }

    // Create order items
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      return res.status(500).json({
        success: false,
        message: 'Error creating order items'
      });
    }

    // Update medicine stock
    for (const item of orderItems) {
      // First get current stock
      const { data: currentMedicine, error: getError } = await supabaseAdmin
        .from('medicines')
        .select('quantity_in_stock')
        .eq('id', item.medicine_id)
        .single();
      
      if (getError) {
        console.error('Error getting current stock:', getError);
        continue;
      }
      
      const newStock = currentMedicine.quantity_in_stock - item.quantity;
      
      const { error: stockError } = await supabaseAdmin
        .from('medicines')
        .update({
          quantity_in_stock: newStock
        })
        .eq('id', item.medicine_id);
      
      if (stockError) {
        console.error('Error updating stock:', stockError);
        // Don't fail the order creation, just log the error
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating order'
    });
  }
});

// @route   PATCH /api/orders/:id/status
// @desc    Update order status
// @access  Private (Admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Get the current order first
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      throw fetchError;
    }

    // Update order status
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // If order is being marked as delivered/completed, create billing record
    if (status === 'delivered' || status === 'completed') {
      try {
        // Check if billing already exists for this order
        const existingBilling = await getBillingForOrder(id);
        
        if (!existingBilling) {
          console.log('📋 Creating billing record for completed order:', id);
          await processOrderCompletion(order);
        } else {
          console.log('📋 Billing record already exists for order:', id);
        }
      } catch (billingError) {
        console.error('⚠️ Error creating billing record:', billingError);
        // Don't fail the order status update if billing creation fails
        // Just log the error and continue
      }
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating order status'
    });
  }
});

// @route   GET /api/orders/:id/billing
// @desc    Get billing information for an order
// @access  Private
router.get('/:id/billing', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if order exists and user has permission to view
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      throw orderError;
    }

    // Check permissions - users can only view their own orders unless they're admin
    if (userRole !== 'admin' && order.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    // Get billing information
    const billing = await getBillingForOrder(id);

    res.json({
      success: true,
      data: {
        order,
        billing
      }
    });
  } catch (error) {
    console.error('Error getting billing for order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting billing information'
    });
  }
});

module.exports = router;
