const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const { processOrderCompletion, getBillingForOrder } = require('../utils/billingUtils');

const router = express.Router();

// @route   POST /api/payments
// @desc    Create payment record
// @access  Private
router.post('/', authenticateToken, [
  body('billing_id').isUUID().withMessage('Valid billing ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('payment_method').isIn(['cash', 'card', 'upi', 'bank_transfer']).withMessage('Invalid payment method'),
  body('status').optional().isIn(['pending', 'completed', 'failed', 'refunded']).withMessage('Invalid payment status')
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

    const { billing_id, amount, payment_method, status = 'pending', payment_date, payment_reference } = req.body;

    // Create payment record in database
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .insert([{
        billing_id,
        amount,
        payment_method,
        payment_reference,
        status,
        processed_at: status === 'completed' ? new Date().toISOString() : null,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Payment creation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment record'
      });
    }

    res.json({
      success: true,
      data: payment,
      message: 'Payment record created successfully'
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating payment record'
    });
  }
});

// @route   POST /api/payments/create-intent
// @desc    Create payment intent
// @access  Private
router.post('/create-intent', authenticateToken, [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('order_id').optional(),
  body('billing_id').optional()
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

    const { amount, order_id, billing_id, payment_method = 'card' } = req.body;

    // In a real implementation, you would integrate with Stripe/PayPal here
    // For now, we'll create a mock payment intent
    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      success: true,
      data: {
        client_secret: paymentIntentId,
        payment_intent_id: paymentIntentId,
        amount: amount,
        payment_method: payment_method
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

    const { payment_intent_id, billing_id, order_id, amount, payment_method = 'card' } = req.body;

    // In a real implementation, you would verify the payment with Stripe/PayPal
    // For now, we'll simulate a successful payment
    const paymentData = {
      amount: amount || 0,
      payment_method: payment_method,
      payment_reference: payment_intent_id,
      stripe_payment_intent_id: payment_intent_id,
      status: payment_method === 'cash' ? 'pending' : 'paid',
      processed_at: new Date().toISOString()
    };

    let billing = null;
    let payment = null;

    // If order_id is provided, create billing and payment records
    if (order_id) {
      try {
        // Get the order details
        const { data: order, error: orderError } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('id', order_id)
          .single();

        if (orderError) {
          throw orderError;
        }

        // Check if billing already exists
        const existingBilling = await getBillingForOrder(order_id);
        
        if (existingBilling) {
          // Update existing billing with payment info
          const { data: updatedBilling, error: updateError } = await supabaseAdmin
            .from('billing')
            .update({
              payment_status: payment_method === 'cash' ? 'pending' : 'paid',
              payment_method: payment_method,
              payment_reference: payment_intent_id,
              paid_at: payment_method === 'cash' ? null : new Date().toISOString()
            })
            .eq('id', existingBilling.id)
            .select()
            .single();

          if (updateError) {
            throw updateError;
          }

          billing = updatedBilling;
        } else {
          // Create new billing record with payment
          const result = await processOrderCompletion(order, paymentData);
          billing = result.billing;
          payment = result.payment;
        }

        // If billing exists but no payment record, create one
        if (billing && !payment) {
          const { data: newPayment, error: paymentError } = await supabaseAdmin
            .from('payments')
            .insert({
              billing_id: billing.id,
              amount: paymentData.amount,
              payment_method: paymentData.payment_method,
              payment_reference: paymentData.payment_reference,
              stripe_payment_intent_id: paymentData.stripe_payment_intent_id,
              status: paymentData.status,
              processed_at: paymentData.processed_at
            })
            .select()
            .single();

          if (paymentError) {
            console.error('Error creating payment record:', paymentError);
          } else {
            payment = newPayment;
          }
        }

        // Update order status
        await supabaseAdmin
          .from('orders')
          .update({
            status: 'confirmed'
          })
          .eq('id', order_id);

      } catch (orderError) {
        console.error('Error processing order payment:', orderError);
        // Continue with regular payment processing
      }
    }

    // If billing_id is provided (legacy flow), create payment record
    if (billing_id && !payment) {
      paymentData.billing_id = billing_id;
      
      const { data: newPayment, error } = await supabaseAdmin
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (error) {
        console.error('Error creating payment record:', error);
        return res.status(500).json({
          success: false,
          message: 'Error creating payment record'
        });
      }

      payment = newPayment;

      // Update billing status
      await supabaseAdmin
        .from('billing')
        .update({
          payment_status: payment_method === 'cash' ? 'pending' : 'paid',
          paid_at: payment_method === 'cash' ? null : new Date().toISOString()
        })
        .eq('id', billing_id);
    }

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: {
        payment,
        billing
      }
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error confirming payment'
    });
  }
});

// @route   GET /api/payments/verify-upi/:transactionId
// @desc    Verify UPI payment status
// @access  Public (for UPI callback)
router.get('/verify-upi/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    console.log('Verifying UPI payment for transaction:', transactionId);
    
    // In a real implementation, you would:
    // 1. Check with UPI service provider (NPCI, Razorpay, etc.)
    // 2. Verify the transaction with the bank
    // 3. Check your database for payment records
    
    // For now, we'll simulate the verification
    // Check if there's a pending payment record
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('payment_reference', transactionId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking payment:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verifying payment'
      });
    }
    
    if (payment) {
      // Payment record exists, return its status
      return res.json({
        success: true,
        status: payment.status,
        data: {
          transactionId: payment.payment_reference,
          amount: payment.amount,
          status: payment.status,
          processedAt: payment.processed_at
        }
      });
    }
    
    // No payment record found, check if it's a new transaction
    // In a real implementation, you would verify with UPI service provider
    // For simulation, we'll return pending status
    return res.json({
      success: true,
      status: 'pending',
      data: {
        transactionId,
        status: 'pending',
        message: 'Payment verification in progress'
      }
    });
    
  } catch (error) {
    console.error('UPI verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/payments/upi-callback
// @desc    Handle UPI payment callback
// @access  Public (for UPI service provider)
router.post('/upi-callback', async (req, res) => {
  try {
    const { 
      transactionId, 
      status, 
      amount, 
      upiId, 
      responseCode, 
      responseMessage 
    } = req.body;
    
    console.log('UPI callback received:', req.body);
    
    // Validate the callback data
    if (!transactionId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }
    
    // Determine payment status
    let paymentStatus = 'pending';
    if (status === 'SUCCESS' || responseCode === '00') {
      paymentStatus = 'completed';
    } else if (status === 'FAILED' || responseCode === '01') {
      paymentStatus = 'failed';
    }
    
    // Update or create payment record
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('payment_reference', transactionId)
      .single();
    
    if (existingPayment) {
      // Update existing payment
      const { error: updateError } = await supabaseAdmin
        .from('payments')
        .update({
          status: paymentStatus,
          processed_at: paymentStatus === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('payment_reference', transactionId);
      
      if (updateError) {
        console.error('Error updating payment:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Failed to update payment'
        });
      }
    } else {
      // Create new payment record
      const { error: createError } = await supabaseAdmin
        .from('payments')
        .insert([{
          payment_reference: transactionId,
          amount: parseFloat(amount) || 0,
          payment_method: 'upi',
          status: paymentStatus,
          processed_at: paymentStatus === 'completed' ? new Date().toISOString() : null,
          created_at: new Date().toISOString()
        }]);
      
      if (createError) {
        console.error('Error creating payment:', createError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create payment record'
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Callback processed successfully',
      status: paymentStatus
    });
    
  } catch (error) {
    console.error('UPI callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
