const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/billing
// @desc    Get all billing records
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    let query = supabaseAdmin
      .from('billing')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('payment_status', status);
    }

    // Add search functionality
    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`);
    }

    // Get all records (pagination can be added later if needed)
    const { data: billing, error, count } = await query;

    if (error) {
      console.error('Error fetching billing:', error);
      // If table doesn't exist or any other error, return empty data instead of error
      if (error.code === 'PGRST205' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Error fetching billing records'
      });
    }

    // If we have billing records with order_id, try to fetch order details separately
    let billingWithOrders = billing || [];
    if (billingWithOrders.length > 0) {
      const orderIds = billingWithOrders
        .filter(b => b.order_id)
        .map(b => b.order_id);
      
      if (orderIds.length > 0) {
        try {
          const { data: orders } = await supabaseAdmin
            .from('orders')
            .select('id, order_number, customer_name')
            .in('id', orderIds);
          
          // Merge order data with billing data
          billingWithOrders = billingWithOrders.map(billing => {
            if (billing.order_id) {
              const order = orders?.find(o => o.id === billing.order_id);
              return {
                ...billing,
                orders: order || null
              };
            }
            return billing;
          });
        } catch (orderError) {
          console.warn('Could not fetch order details:', orderError.message);
          // Continue without order details
        }
      }
    }

    res.json({
      success: true,
      data: billingWithOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Billing fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching billing records'
    });
  }
});

// @route   POST /api/billing
// @desc    Create billing record
// @access  Private
router.post('/', authenticateToken, [
  body('order_id').optional().isUUID().withMessage('Valid order ID is required if provided'),
  body('customer_name').trim().isLength({ min: 1 }).withMessage('Customer name is required'),
  body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal must be a positive number'),
  body('total_amount').isFloat({ min: 0 }).withMessage('Total amount must be a positive number')
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

    const { order_id, customer_name, customer_email, customer_address, subtotal, tax_amount = 0, discount_amount = 0, total_amount } = req.body;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const billingData = {
      invoice_number: invoiceNumber,
      customer_name,
      customer_email,
      customer_address,
      subtotal,
      tax_amount,
      discount_amount,
      total_amount,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
    };

    // Only add order_id if it's provided
    if (order_id) {
      billingData.order_id = order_id;
    }

    const { data: billing, error } = await supabaseAdmin
      .from('billing')
      .insert(billingData)
      .select()
      .single();

    if (error) {
      console.error('Error creating billing:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating billing record'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Billing record created successfully',
      data: billing
    });
  } catch (error) {
    console.error('Billing creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating billing record'
    });
  }
});

module.exports = router;
