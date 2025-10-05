const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/payments/create-intent
// @desc    Create payment intent
// @access  Private
router.post('/create-intent', authenticateToken, [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('billing_id').isUUID().withMessage('Valid billing ID is required')
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

    // In a real implementation, you would integrate with Stripe here
    // For now, we'll create a mock payment intent
    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      success: true,
      data: {
        client_secret: paymentIntentId,
        payment_intent_id: paymentIntentId
      }
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating payment intent'
    });
  }
});

// @route   GET /api/payments/history
// @desc    Get payment history
// @access  Private
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;

    let query = supabaseAdmin
      .from('payments')
      .select(`
        *,
        billing(invoice_number, customer_name, customer_email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply search filter
    if (search) {
      query = query.or(`payment_reference.ilike.%${search}%,billing.invoice_number.ilike.%${search}%`);
    }

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: payments, error, count } = await query;

    if (error) {
      console.error('Error fetching payment history:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching payment history'
      });
    }

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Payment history fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching payment history'
    });
  }
});

// @route   POST /api/payments/confirm
// @desc    Confirm payment
// @access  Private
router.post('/confirm', authenticateToken, [
  body('payment_intent_id').trim().isLength({ min: 1 }).withMessage('Payment intent ID is required')
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

    const { payment_intent_id, billing_id } = req.body;

    // In a real implementation, you would verify the payment with Stripe
    // For now, we'll simulate a successful payment
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .insert({
        billing_id,
        amount: req.body.amount || 0,
        payment_method: 'card',
        payment_reference: payment_intent_id,
        stripe_payment_intent_id: payment_intent_id,
        status: 'paid',
        processed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment record:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating payment record'
      });
    }

    // Update billing status
    if (billing_id) {
      await supabaseAdmin
        .from('billing')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', billing_id);
    }

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: payment
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error confirming payment'
    });
  }
});

module.exports = router;
