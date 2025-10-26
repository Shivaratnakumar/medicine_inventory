const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/supply-payments
// @desc    Get supply payments (role-based filtering)
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      status, 
      payment_method,
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
      .from('supply_payments')
      .select(`
        *,
        supply_order:supply_orders(
          id,
          order_number,
          order_date,
          total_amount,
          status,
          supplier_store:stores!supply_orders_supplier_store_id_fkey(name, address, city),
          customer_store:stores!supply_orders_customer_store_id_fkey(name, address, city)
        )
      `)
      .order('payment_date', { ascending: false });

    // Apply role-based filtering through supply orders
    if (userRole !== 'admin') {
      // Non-admin users can only see payments for their stores
      query = query.in('supply_order_id', 
        supabaseAdmin
          .from('supply_orders')
          .select('id')
          .or(`supplier_store_id.in.(select id from stores where manager_id.eq.${userId}),customer_store_id.in.(select id from stores where manager_id.eq.${userId})`)
      );
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (payment_method && payment_method !== 'all') {
      query = query.eq('payment_method', payment_method);
    }

    if (date_from) {
      query = query.gte('payment_date', date_from);
    }

    if (date_to) {
      query = query.lte('payment_date', date_to);
    }

    if (store_id && store_id !== 'all') {
      query = query.in('supply_order_id', 
        supabaseAdmin
          .from('supply_orders')
          .select('id')
          .or(`supplier_store_id.eq.${store_id},customer_store_id.eq.${store_id}`)
      );
    }

    // Add search functionality
    if (search) {
      query = query.or(`payment_number.ilike.%${search}%,payment_reference.ilike.%${search}%`);
    }

    const offset = (page - 1) * limit;
    const { data: payments, error } = await query.range(offset, offset + limit - 1);
    
    // Get total count for pagination
    let count = 0;
    if (!error) {
      let countQuery = supabaseAdmin
        .from('supply_payments')
        .select('*', { count: 'exact', head: true });
      
      // Apply same filters to count query
      if (userRole !== 'admin') {
        countQuery = countQuery.in('supply_order_id', 
          supabaseAdmin
            .from('supply_orders')
            .select('id')
            .or(`supplier_store_id.in.(select id from stores where manager_id.eq.${userId}),customer_store_id.in.(select id from stores where manager_id.eq.${userId})`)
        );
      }
      
      if (status && status !== 'all') {
        countQuery = countQuery.eq('status', status);
      }
      
      if (payment_method && payment_method !== 'all') {
        countQuery = countQuery.eq('payment_method', payment_method);
      }
      
      if (date_from) {
        countQuery = countQuery.gte('payment_date', date_from);
      }
      
      if (date_to) {
        countQuery = countQuery.lte('payment_date', date_to);
      }
      
      if (store_id && store_id !== 'all') {
        countQuery = countQuery.in('supply_order_id', 
          supabaseAdmin
            .from('supply_orders')
            .select('id')
            .or(`supplier_store_id.eq.${store_id},customer_store_id.eq.${store_id}`)
        );
      }
      
      const { count: totalCount } = await countQuery;
      count = totalCount || 0;
    }

    if (error) {
      console.error('Error fetching supply payments:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error fetching supply payments'
      });
    }

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Supply payments fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching supply payments'
    });
  }
});

// @route   POST /api/supply-payments
// @desc    Create new supply payment
// @access  Private
router.post('/', authenticateToken, [
  body('supply_order_id').isUUID().withMessage('Valid supply order ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('payment_method').isIn(['cash', 'card', 'upi', 'bank_transfer', 'cheque']).withMessage('Invalid payment method'),
  body('payment_reference').optional().trim().isLength({ min: 1 }).withMessage('Payment reference is required'),
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
      supply_order_id,
      amount,
      payment_method,
      payment_reference,
      notes
    } = req.body;

    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify supply order exists and user has access
    const { data: order, error: orderError } = await supabaseAdmin
      .from('supply_orders')
      .select(`
        *,
        supplier_store:stores!supply_orders_supplier_store_id_fkey(id, name),
        customer_store:stores!supply_orders_customer_store_id_fkey(id, name)
      `)
      .eq('id', supply_order_id)
      .single();

    if (orderError || !order) {
      return res.status(400).json({
        success: false,
        message: 'Supply order not found'
      });
    }

    // Check if user has permission to create payments for this order
    if (userRole !== 'admin') {
      const { data: userStore, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('manager_id', userId)
        .single();

      if (storeError || !userStore || order.supplier_store_id !== userStore.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to create payments for this order'
        });
      }
    }

    // Check if payment amount doesn't exceed order total
    const { data: existingPayments, error: paymentsError } = await supabaseAdmin
      .from('supply_payments')
      .select('amount')
      .eq('supply_order_id', supply_order_id)
      .eq('status', 'completed');

    if (paymentsError) {
      console.error('Error fetching existing payments:', paymentsError);
      return res.status(500).json({
        success: false,
        message: 'Error checking existing payments'
      });
    }

    const totalPaid = existingPayments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    const remainingAmount = parseFloat(order.total_amount) - totalPaid;

    if (parseFloat(amount) > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount cannot exceed remaining amount of ₹${remainingAmount.toFixed(2)}`
      });
    }

    // Generate payment number
    const paymentNumber = `SP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create payment
    const paymentData = {
      payment_number: paymentNumber,
      supply_order_id,
      amount: parseFloat(amount),
      payment_method,
      payment_reference,
      status: payment_method === 'cash' ? 'pending' : 'completed',
      notes
    };

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('supply_payments')
      .insert(paymentData)
      .select(`
        *,
        supply_order:supply_orders(
          id,
          order_number,
          order_date,
          total_amount,
          status,
          supplier_store:stores!supply_orders_supplier_store_id_fkey(name, address, city),
          customer_store:stores!supply_orders_customer_store_id_fkey(name, address, city)
        )
      `)
      .single();

    if (paymentError) {
      console.error('Error creating supply payment:', paymentError);
      return res.status(500).json({
        success: false,
        message: 'Error creating supply payment'
      });
    }

    // Update order status if fully paid
    const newTotalPaid = totalPaid + parseFloat(amount);
    if (newTotalPaid >= parseFloat(order.total_amount)) {
      await supabaseAdmin
        .from('supply_orders')
        .update({ status: 'delivered' })
        .eq('id', supply_order_id);
    }

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Supply payment created successfully'
    });
  } catch (error) {
    console.error('Supply payment creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating supply payment'
    });
  }
});

// @route   PUT /api/supply-payments/:id
// @desc    Update supply payment
// @access  Private
router.put('/:id', authenticateToken, [
  body('status').optional().isIn(['pending', 'completed', 'failed', 'refunded']).withMessage('Invalid status'),
  body('payment_reference').optional().trim().isLength({ min: 1 }).withMessage('Payment reference is required'),
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

    // Check if payment exists and user has permission to update
    const { data: existingPayment, error: fetchError } = await supabaseAdmin
      .from('supply_payments')
      .select(`
        *,
        supply_order:supply_orders(
          id,
          supplier_store_id,
          customer_store_id,
          total_amount
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !existingPayment) {
      return res.status(404).json({
        success: false,
        message: 'Supply payment not found'
      });
    }

    // Check permissions
    if (userRole !== 'admin') {
      const { data: userStore, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('manager_id', userId)
        .single();

      if (storeError || !userStore || existingPayment.supply_order.supplier_store_id !== userStore.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this supply payment'
        });
      }
    }

    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    const { data: payment, error } = await supabaseAdmin
      .from('supply_payments')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        supply_order:supply_orders(
          id,
          order_number,
          order_date,
          total_amount,
          status,
          supplier_store:stores!supply_orders_supplier_store_id_fkey(name, address, city),
          customer_store:stores!supply_orders_customer_store_id_fkey(name, address, city)
        )
      `)
      .single();

    if (error) {
      console.error('Error updating supply payment:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating supply payment'
      });
    }

    res.json({
      success: true,
      data: payment,
      message: 'Supply payment updated successfully'
    });
  } catch (error) {
    console.error('Supply payment update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating supply payment'
    });
  }
});

// @route   GET /api/supply-payments/analytics
// @desc    Get supply payments analytics
// @access  Private
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { period = 'month', store_id } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let baseQuery = supabaseAdmin.from('supply_payments');
    
    // Apply role-based filtering through supply orders
    if (userRole !== 'admin') {
      baseQuery = baseQuery.in('supply_order_id', 
        supabaseAdmin
          .from('supply_orders')
          .select('id')
          .or(`supplier_store_id.in.(select id from stores where manager_id.eq.${userId}),customer_store_id.in.(select id from stores where manager_id.eq.${userId})`)
      );
    }

    if (store_id && store_id !== 'all') {
      baseQuery = baseQuery.in('supply_order_id', 
        supabaseAdmin
          .from('supply_orders')
          .select('id')
          .or(`supplier_store_id.eq.${store_id},customer_store_id.eq.${store_id}`)
      );
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

    baseQuery = baseQuery.gte('payment_date', dateFrom.toISOString());

    // Get payment statistics
    const { data: payments, error: paymentsError } = await baseQuery
      .select('id, amount, payment_method, status, payment_date, supply_order_id');

    if (paymentsError) {
      console.error('Error fetching payments for analytics:', paymentsError);
      return res.status(500).json({
        success: false,
        message: 'Error fetching payment analytics'
      });
    }

    // Calculate analytics
    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    
    const statusCounts = payments.reduce((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1;
      return acc;
    }, {});

    const methodCounts = payments.reduce((acc, payment) => {
      acc[payment.payment_method] = (acc[payment.payment_method] || 0) + 1;
      return acc;
    }, {});

    const methodAmounts = payments.reduce((acc, payment) => {
      if (!acc[payment.payment_method]) {
        acc[payment.payment_method] = 0;
      }
      acc[payment.payment_method] += parseFloat(payment.amount || 0);
      return acc;
    }, {});

    // Get daily trend data
    const dailyTrend = payments.reduce((acc, payment) => {
      const date = new Date(payment.payment_date).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { payments: 0, amount: 0 };
      }
      acc[date].payments += 1;
      acc[date].amount += parseFloat(payment.amount || 0);
      return acc;
    }, {});

    const dailyTrendArray = Object.entries(dailyTrend)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: {
        period,
        totalPayments,
        totalAmount,
        averagePaymentValue: totalPayments > 0 ? totalAmount / totalPayments : 0,
        statusCounts,
        methodCounts,
        methodAmounts,
        dailyTrend: dailyTrendArray
      }
    });
  } catch (error) {
    console.error('Supply payments analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching supply payments analytics'
    });
  }
});

module.exports = router;

