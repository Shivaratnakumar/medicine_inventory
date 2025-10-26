const { supabaseAdmin } = require('../config/supabase');

/**
 * Creates a billing record for a completed order
 * @param {Object} order - The order object
 * @param {Object} paymentData - Payment information (optional)
 * @returns {Object} Created billing record
 */
async function createBillingForOrder(order, paymentData = null) {
  try {
    console.log('📋 Creating billing record for order:', order.id);
    
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    // Calculate billing amounts
    const subtotal = parseFloat(order.total_amount) - parseFloat(order.tax_amount || 0) - parseFloat(order.discount_amount || 0);
    const taxAmount = parseFloat(order.tax_amount || 0);
    const discountAmount = parseFloat(order.discount_amount || 0);
    const totalAmount = parseFloat(order.total_amount);
    
    // Prepare billing data
    const billingData = {
      invoice_number: invoiceNumber,
      order_id: order.id,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_address: order.customer_address,
      subtotal: subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      payment_status: paymentData ? 'paid' : 'pending',
      payment_method: paymentData?.payment_method || null,
      payment_reference: paymentData?.payment_reference || null,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      paid_at: paymentData ? new Date().toISOString() : null
    };
    
    // Create billing record
    const { data: billing, error } = await supabaseAdmin
      .from('billing')
      .insert(billingData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating billing record:', error);
      throw error;
    }
    
    console.log('✅ Billing record created successfully:', billing.id);
    return billing;
    
  } catch (error) {
    console.error('❌ Error in createBillingForOrder:', error);
    throw error;
  }
}

/**
 * Creates a payment record for a billing
 * @param {Object} billing - The billing object
 * @param {Object} paymentData - Payment information
 * @returns {Object} Created payment record
 */
async function createPaymentForBilling(billing, paymentData) {
  try {
    console.log('💳 Creating payment record for billing:', billing.id);
    
    const paymentRecord = {
      billing_id: billing.id,
      amount: paymentData.amount || billing.total_amount,
      payment_method: paymentData.payment_method,
      payment_reference: paymentData.payment_reference,
      stripe_payment_intent_id: paymentData.stripe_payment_intent_id,
      status: paymentData.status || 'completed',
      processed_at: new Date().toISOString()
    };
    
    // Create payment record
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .insert(paymentRecord)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating payment record:', error);
      throw error;
    }
    
    console.log('✅ Payment record created successfully:', payment.id);
    return payment;
    
  } catch (error) {
    console.error('❌ Error in createPaymentForBilling:', error);
    throw error;
  }
}

/**
 * Processes order completion with billing and payment
 * @param {Object} order - The order object
 * @param {Object} paymentData - Payment information (optional)
 * @returns {Object} Result with billing and payment records
 */
async function processOrderCompletion(order, paymentData = null) {
  try {
    console.log('🔄 Processing order completion for order:', order.id);
    
    const result = {
      billing: null,
      payment: null
    };
    
    // Create billing record
    result.billing = await createBillingForOrder(order, paymentData);
    
    // Create payment record if payment data provided
    if (paymentData) {
      result.payment = await createPaymentForBilling(result.billing, paymentData);
    }
    
    console.log('✅ Order completion processed successfully');
    return result;
    
  } catch (error) {
    console.error('❌ Error in processOrderCompletion:', error);
    throw error;
  }
}

/**
 * Gets billing information for an order
 * @param {string} orderId - Order ID
 * @returns {Object} Billing information
 */
async function getBillingForOrder(orderId) {
  try {
    const { data: billing, error } = await supabaseAdmin
      .from('billing')
      .select(`
        *,
        payments (
          id,
          amount,
          payment_method,
          payment_reference,
          status,
          processed_at,
          created_at
        )
      `)
      .eq('order_id', orderId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No billing record found
      }
      throw error;
    }
    
    return billing;
    
  } catch (error) {
    console.error('❌ Error getting billing for order:', error);
    throw error;
  }
}

module.exports = {
  createBillingForOrder,
  createPaymentForBilling,
  processOrderCompletion,
  getBillingForOrder
};

