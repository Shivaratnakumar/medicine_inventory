const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/supply-orders
// @desc    Get supply orders (role-based filtering)
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      status, 
      date_from, 
      date_to, 
      store_id, 
      page = 1, 
      limit = 20, 
      search 
    } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    let query = supabaseAdmin
      .from('supply_orders')
      .select(`
        *,
        supply_relationship:supply_relationships(
          id,
          relationship_type,
          commission_rate,
          supplier_store:stores!supply_relationships_supplier_store_id_fkey(name, address, city),
          customer_store:stores!supply_relationships_customer_store_id_fkey(name, address, city)
        ),
        supplier_store:stores!supply_orders_supplier_store_id_fkey(name, address, city),
        customer_store:stores!supply_orders_customer_store_id_fkey(name, address, city),
        supply_order_items(
          id,
          quantity,
          unit_price,
          total_price,
          commission_rate,
          medicines(name, sku, category)
        ),
        supply_payments(
          id,
          payment_number,
          amount,
          payment_method,
          payment_reference,
          payment_date,
          status
        ),
        created_by_user:users!supply_orders_created_by_fkey(first_name, last_name)
      `)
      .order('order_date', { ascending: false });

    // Apply role-based filtering
    if (userRole !== 'admin') {
      // Non-admin users can only see orders for their stores
      query = query.or(`supplier_store_id.in.(select id from stores where manager_id.eq.${userId}),customer_store_id.in.(select id from stores where manager_id.eq.${userId})`);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (store_id && store_id !== 'all') {
      query = query.or(`supplier_store_id.eq.${store_id},customer_store_id.eq.${store_id}`);
    }

    if (date_from) {
      query = query.gte('order_date', date_from);
    }

    if (date_to) {
      query = query.lte('order_date', date_to);
    }

    // Add search functionality
    if (search) {
      query = query.or(`order_number.ilike.%${search}%,supplier_store.name.ilike.%${search}%,customer_store.name.ilike.%${search}%`);
    }

    const offset = (page - 1) * limit;
    const { data: orders, error } = await query.range(offset, offset + limit - 1);
    
    // Get total count for pagination
    let count = 0;
    if (!error) {
      let countQuery = supabaseAdmin
        .from('supply_orders')
        .select('*', { count: 'exact', head: true });
      
      // Apply same filters to count query
      if (userRole !== 'admin') {
        countQuery = countQuery.or(`supplier_store_id.in.(select id from stores where manager_id.eq.${userId}),customer_store_id.in.(select id from stores where manager_id.eq.${userId})`);
      }
      
      if (status && status !== 'all') {
        countQuery = countQuery.eq('status', status);
      }
      
      if (store_id && store_id !== 'all') {
        countQuery = countQuery.or(`supplier_store_id.eq.${store_id},customer_store_id.eq.${store_id}`);
      }
      
      if (date_from) {
        countQuery = countQuery.gte('order_date', date_from);
      }
      
      if (date_to) {
        countQuery = countQuery.lte('order_date', date_to);
      }
      
      const { count: totalCount } = await countQuery;
      count = totalCount || 0;
    }

    if (error) {
      console.error('Error fetching supply orders:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error fetching supply orders'
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
    console.error('Supply orders fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching supply orders'
    });
  }
});

// @route   POST /api/supply-orders
// @desc    Create new supply order
// @access  Private
router.post('/', authenticateToken, [
  body('supply_relationship_id').isUUID().withMessage('Valid supply relationship ID is required'),
  body('customer_store_id').isUUID().withMessage('Valid customer store ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.medicine_id').isUUID().withMessage('Valid medicine ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('expected_delivery_date').optional().isISO8601().withMessage('Valid expected delivery date is required'),
  body('notes').optional().trim()
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

    const {
      supply_relationship_id,
      customer_store_id,
      items,
      expected_delivery_date,
      notes
    } = req.body;

    const userId = req.user.id;

    // Verify supply relationship exists and user has access
    const { data: relationship, error: relError } = await supabaseAdmin
      .from('supply_relationships')
      .select(`
        *,
        supplier_store:stores!supply_relationships_supplier_store_id_fkey(id, name),
        customer_store:stores!supply_relationships_customer_store_id_fkey(id, name)
      `)
      .eq('id', supply_relationship_id)
      .single();

    if (relError || !relationship) {
      return res.status(400).json({
        success: false,
        message: 'Supply relationship not found'
      });
    }

    // Check if user has permission to create orders for this relationship
    const { data: userStore, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('id')
      .eq('manager_id', userId)
      .single();

    if (storeError || !userStore || relationship.supplier_store_id !== userStore.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create orders for this relationship'
      });
    }

    // Generate order number
    const orderNumber = `SO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate total amount and commission
    let totalAmount = 0;
    let commissionAmount = 0;
    const orderItems = [];

    for (const item of items) {
      // Get medicine details
      const { data: medicine, error: medicineError } = await supabaseAdmin
        .from('medicines')
        .select('id, name, sku, selling_price')
        .eq('id', item.medicine_id)
        .single();

      if (medicineError || !medicine) {
        return res.status(400).json({
          success: false,
          message: `Medicine not found: ${item.medicine_id}`
        });
      }

      const unitPrice = medicine.selling_price;
      const itemTotal = unitPrice * item.quantity;
      const itemCommission = (itemTotal * relationship.commission_rate) / 100;

      totalAmount += itemTotal;
      commissionAmount += itemCommission;

      orderItems.push({
        medicine_id: item.medicine_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: itemTotal,
        commission_rate: relationship.commission_rate
      });
    }

    // Create supply order
    const orderData = {
      order_number: orderNumber,
      supply_relationship_id,
      customer_store_id,
      supplier_store_id: relationship.supplier_store_id,
      expected_delivery_date,
      total_amount: totalAmount,
      commission_amount: commissionAmount,
      notes,
      created_by: userId
    };

    const { data: order, error: orderError } = await supabaseAdmin
      .from('supply_orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Error creating supply order:', orderError);
      return res.status(500).json({
        success: false,
        message: 'Error creating supply order'
      });
    }

    // Create order items
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      supply_order_id: order.id
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('supply_order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) {
      console.error('Error creating supply order items:', itemsError);
      // Rollback order creation
      await supabaseAdmin.from('supply_orders').delete().eq('id', order.id);
      return res.status(500).json({
        success: false,
        message: 'Error creating supply order items'
      });
    }

    // Fetch complete order data
    const { data: completeOrder, error: fetchError } = await supabaseAdmin
      .from('supply_orders')
      .select(`
        *,
        supply_relationship:supply_relationships(
          id,
          relationship_type,
          commission_rate,
          supplier_store:stores!supply_relationships_supplier_store_id_fkey(name, address, city),
          customer_store:stores!supply_relationships_customer_store_id_fkey(name, address, city)
        ),
        supplier_store:stores!supply_orders_supplier_store_id_fkey(name, address, city),
        customer_store:stores!supply_orders_customer_store_id_fkey(name, address, city),
        supply_order_items(
          id,
          quantity,
          unit_price,
          total_price,
          commission_rate,
          medicines(name, sku, category)
        )
      `)
      .eq('id', order.id)
      .single();

    res.status(201).json({
      success: true,
      data: completeOrder,
      message: 'Supply order created successfully'
    });
  } catch (error) {
    console.error('Supply order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating supply order'
    });
  }
});

// @route   PUT /api/supply-orders/:id
// @desc    Update supply order
// @access  Private
router.put('/:id', authenticateToken, [
  body('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  body('expected_delivery_date').optional().isISO8601().withMessage('Valid expected delivery date is required'),
  body('actual_delivery_date').optional().isISO8601().withMessage('Valid actual delivery date is required'),
  body('notes').optional().trim()
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
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if order exists and user has permission to update
    const { data: existingOrder, error: fetchError } = await supabaseAdmin
      .from('supply_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Supply order not found'
      });
    }

    // Check permissions
    if (userRole !== 'admin') {
      const { data: userStore, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('manager_id', userId)
        .single();

      if (storeError || !userStore || existingOrder.supplier_store_id !== userStore.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this supply order'
        });
      }
    }

    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    const { data: order, error } = await supabaseAdmin
      .from('supply_orders')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        supply_relationship:supply_relationships(
          id,
          relationship_type,
          commission_rate,
          supplier_store:stores!supply_relationships_supplier_store_id_fkey(name, address, city),
          customer_store:stores!supply_relationships_customer_store_id_fkey(name, address, city)
        ),
        supplier_store:stores!supply_orders_supplier_store_id_fkey(name, address, city),
        customer_store:stores!supply_orders_customer_store_id_fkey(name, address, city),
        supply_order_items(
          id,
          quantity,
          unit_price,
          total_price,
          commission_rate,
          medicines(name, sku, category)
        ),
        supply_payments(
          id,
          payment_number,
          amount,
          payment_method,
          payment_reference,
          payment_date,
          status
        )
      `)
      .single();

    if (error) {
      console.error('Error updating supply order:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating supply order'
      });
    }

    res.json({
      success: true,
      data: order,
      message: 'Supply order updated successfully'
    });
  } catch (error) {
    console.error('Supply order update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating supply order'
    });
  }
});

// @route   GET /api/supply-orders/analytics
// @desc    Get supply orders analytics
// @access  Private
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { period = 'month', store_id } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let baseQuery = supabaseAdmin.from('supply_orders');
    
    // Apply role-based filtering
    if (userRole !== 'admin') {
      baseQuery = baseQuery.or(`supplier_store_id.in.(select id from stores where manager_id.eq.${userId}),customer_store_id.in.(select id from stores where manager_id.eq.${userId})`);
    }

    if (store_id && store_id !== 'all') {
      baseQuery = baseQuery.or(`supplier_store_id.eq.${store_id},customer_store_id.eq.${store_id}`);
    }

    // Calculate date range based on period
    const now = new Date();
    let dateFrom;
    
    switch (period) {
      case 'today':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        dateFrom = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    baseQuery = baseQuery.gte('order_date', dateFrom.toISOString());

    // Get order statistics
    const { data: orders, error: ordersError } = await baseQuery
      .select('id, total_amount, commission_amount, status, order_date, supplier_store_id, customer_store_id');

    if (ordersError) {
      console.error('Error fetching orders for analytics:', ordersError);
      return res.status(500).json({
        success: false,
        message: 'Error fetching order analytics'
      });
    }

    // Calculate analytics
    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
    const totalCommission = orders.reduce((sum, order) => sum + parseFloat(order.commission_amount || 0), 0);
    
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    // Get daily trend data
    const dailyTrend = orders.reduce((acc, order) => {
      const date = new Date(order.order_date).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { orders: 0, amount: 0 };
      }
      acc[date].orders += 1;
      acc[date].amount += parseFloat(order.total_amount || 0);
      return acc;
    }, {});

    const dailyTrendArray = Object.entries(dailyTrend)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Get top stores by order count
    const storeStats = orders.reduce((acc, order) => {
      const storeId = order.customer_store_id;
      if (!acc[storeId]) {
        acc[storeId] = { orders: 0, amount: 0 };
      }
      acc[storeId].orders += 1;
      acc[storeId].amount += parseFloat(order.total_amount || 0);
      return acc;
    }, {});

    const topStores = Object.entries(storeStats)
      .map(([storeId, data]) => ({ storeId, ...data }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        period,
        totalOrders,
        totalAmount,
        totalCommission,
        averageOrderValue: totalOrders > 0 ? totalAmount / totalOrders : 0,
        statusCounts,
        dailyTrend: dailyTrendArray,
        topStores
      }
    });
  } catch (error) {
    console.error('Supply orders analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching supply orders analytics'
    });
  }
});

module.exports = router;

