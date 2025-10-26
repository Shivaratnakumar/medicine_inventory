import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { ordersAPI, paymentAPI } from '../../services/api';
import UPIQRScanner from '../Payment/UPIQRScannerSimple';
import FlipkartPaymentScreen from '../Payment/FlipkartPaymentScreen';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const CartModal = () => {
  const {
    cartItems,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemCount
  } = useCart();

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showFlipkartPayment, setShowFlipkartPayment] = useState(false);
  const [showUPIScanner, setShowUPIScanner] = useState(false);
  const [upiMethod, setUpiMethod] = useState('qr'); // 'qr' or 'id'
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  const handleQuantityChange = (medicineId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(medicineId);
    } else {
      updateQuantity(medicineId, newQuantity);
    }
  };

  const handleProceedToPayment = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    setShowFlipkartPayment(true);
  };

  const handleFlipkartPayment = async (paymentData) => {
    console.log('Flipkart payment handler called with:', paymentData);
    
    if (!user) {
      toast.error('Please login to place an order');
      return;
    }

    setIsProcessing(true);
    try {
      // Create order
      const orderData = {
        customer_name: paymentData.deliveryAddress.name,
        customer_email: user.email,
        customer_phone: paymentData.deliveryAddress.phone,
        customer_address: paymentData.deliveryAddress.address,
        items: cartItems.map(item => ({
          medicine_id: item.id,
          quantity: item.quantity
        })),
        notes: `Payment method: ${paymentData.paymentMethod}${paymentData.cardDetails ? ` | Card: ****${paymentData.cardDetails.number.slice(-4)}` : ''}${paymentData.upiDetails ? ` | UPI: ${paymentData.upiDetails.id}` : ''}`,
        total_amount: paymentData.total
      };

      console.log('Creating order with data:', orderData);
      const orderResponse = await ordersAPI.create(orderData);
      
      if (orderResponse.success) {
        console.log('Order created successfully:', orderResponse.data);
        
        // Process payment and create billing record
        try {
          const paymentResponse = await paymentAPI.confirmPayment({
            payment_intent_id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            order_id: orderResponse.data.id,
            amount: paymentData.total,
            payment_method: paymentData.paymentMethod
          });
          
          console.log('Payment processed successfully:', paymentResponse.data);
        } catch (paymentError) {
          console.error('Payment processing error:', paymentError);
          // Don't fail the order creation if payment processing fails
          toast.error('Order created but payment processing failed. Please contact support.');
        }
        
        // Clear cart and show success
        clearCart();
        setOrderSuccess(true);
        setOrderDetails({
          orderNumber: orderResponse.data.order_number,
          total: paymentData.total,
          paymentMethod: paymentData.paymentMethod,
          orderId: orderResponse.data.id,
          deliveryAddress: paymentData.deliveryAddress
        });
        
        // Close payment screens
        setShowFlipkartPayment(false);
        setShowPaymentForm(false);
        
        // Invalidate orders query to refresh the orders page
        queryClient.invalidateQueries(['orders']);
        
        toast.success('Order placed and payment processed successfully!');
      } else {
        console.error('Order creation failed:', orderResponse.message);
        toast.error(orderResponse.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!user) {
      toast.error('Please login to place an order');
      return;
    }

    // For UPI payments, show QR scanner instead of processing immediately
    if (paymentMode === 'upi') {
      console.log('UPI payment selected, showing scanner');
      setOrderDetails({
        total: getCartTotal(),
        items: cartItems,
        paymentMethod: paymentMode,
        upiMethod: upiMethod
      });
      setShowUPIScanner(true);
      return;
    }

    setIsProcessing(true);
    try {
      // Create order
      const orderData = {
        customer_name: user.name || 'Customer',
        customer_email: user.email,
        customer_phone: user.phone || '',
        customer_address: user.address || '',
        items: cartItems.map(item => ({
          medicine_id: item.id,
          quantity: item.quantity
        })),
        notes: `Payment method: ${paymentMode}`,
        total_amount: getCartTotal()
      };

      console.log('Creating order with data:', orderData);
      const orderResponse = await ordersAPI.create(orderData);
      
      if (orderResponse.success) {
        // Payment processing handled by the payment method

        // For demo purposes, we'll simulate payment processing
        if (paymentMode !== 'cash') {
          // Simulate online payment
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        setOrderDetails({
          orderNumber: orderResponse.data.order_number,
          total: getCartTotal(),
          items: cartItems,
          paymentMethod: paymentMode,
          orderId: orderResponse.data.id
        });

        setOrderSuccess(true);
        clearCart();
        
        // Invalidate orders query to refresh the orders page
        queryClient.invalidateQueries(['orders']);
        
        toast.success('Order placed successfully!');
      } else {
        throw new Error(orderResponse.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Order creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUPIPaymentSuccess = async () => {
    setIsProcessing(true);
    try {
      // Create order
      const orderData = {
        customer_name: user.name || 'Customer',
        customer_email: user.email,
        customer_phone: user.phone || '',
        customer_address: user.address || '',
        items: cartItems.map(item => ({
          medicine_id: item.id,
          quantity: item.quantity
        })),
        notes: `Payment method: ${paymentMode}`,
        total_amount: getCartTotal()
      };

      console.log('Creating order with data:', orderData);
      const orderResponse = await ordersAPI.create(orderData);
      
      if (orderResponse.success) {
        setOrderDetails({
          orderNumber: orderResponse.data.order_number,
          total: getCartTotal(),
          items: cartItems,
          paymentMethod: paymentMode,
          orderId: orderResponse.data.id
        });

        setOrderSuccess(true);
        setShowUPIScanner(false);
        clearCart();
        
        // Invalidate orders query to refresh the orders page
        queryClient.invalidateQueries(['orders']);
        
        toast.success('Order placed successfully!');
      } else {
        throw new Error(orderResponse.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Order creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUPIPaymentCancel = () => {
    setShowUPIScanner(false);
    setOrderDetails(null);
    toast.error('UPI payment cancelled');
  };

  const handleClose = () => {
    setShowPaymentForm(false);
    setShowUPIScanner(false);
    setOrderSuccess(false);
    setOrderDetails(null);
    closeCart();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className={`relative ${showFlipkartPayment ? 'top-0 mx-0 p-0 w-full h-full shadow-none rounded-none' : 'top-4 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 xl:w-2/5 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto'}`}>
        {!showFlipkartPayment && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Shopping Cart ({getCartItemCount()} items)
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        )}

        {orderSuccess ? (
          <OrderSuccess orderDetails={orderDetails} onClose={handleClose} />
        ) : showFlipkartPayment ? (
          <FlipkartPaymentScreen
            cartItems={cartItems}
            total={getCartTotal()}
            onBack={() => setShowFlipkartPayment(false)}
            onPlaceOrder={handleFlipkartPayment}
            isProcessing={isProcessing}
            user={user}
          />
        ) : showUPIScanner ? (
          <div>
            {console.log('Rendering UPI Scanner, orderDetails:', orderDetails)}
            <UPIQRScanner
              orderDetails={orderDetails}
              onBack={() => setShowUPIScanner(false)}
              onPaymentSuccess={handleUPIPaymentSuccess}
              onPaymentCancel={handleUPIPaymentCancel}
            />
          </div>
        ) : showPaymentForm ? (
          <PaymentForm
            cartItems={cartItems}
            total={getCartTotal()}
            paymentMode={paymentMode}
            setPaymentMode={setPaymentMode}
            upiMethod={upiMethod}
            setUpiMethod={setUpiMethod}
            onPayment={handlePayment}
            onBack={() => setShowPaymentForm(false)}
            isProcessing={isProcessing}
          />
        ) : (
          <CartItems
            cartItems={cartItems}
            onQuantityChange={handleQuantityChange}
            onRemove={removeFromCart}
            onProceedToPayment={handleProceedToPayment}
            total={getCartTotal()}
            formatPrice={formatPrice}
          />
        )}
      </div>
    </div>
  );
};

const CartItems = ({ cartItems, onQuantityChange, onRemove, onProceedToPayment, total, formatPrice }) => {
  if (cartItems.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
        <p className="mt-1 text-sm text-gray-500">Add some medicines to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {cartItems.map((item) => (
          <div key={item.id} className="flex items-center space-x-4 p-3 border rounded-lg">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
              <p className="text-xs text-gray-500">{item.category}</p>
              {item.prescription_required && (
                <div className="flex items-center text-xs text-orange-600 mt-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Prescription Required
                </div>
              )}
              <p className="text-sm font-medium text-gray-900 mt-1">
                {formatPrice(item.price)} each
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                className="p-1 rounded-full hover:bg-gray-100"
                disabled={item.quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
              <button
                onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                className="p-1 rounded-full hover:bg-gray-100"
                disabled={item.quantity >= item.stock}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {formatPrice(item.price * item.quantity)}
              </p>
              <button
                onClick={() => onRemove(item.id)}
                className="text-red-500 hover:text-red-700 mt-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-medium text-gray-900">Total:</span>
          <span className="text-lg font-bold text-gray-900">{formatPrice(total)}</span>
        </div>
        
        <button
          onClick={onProceedToPayment}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};

const PaymentForm = ({ cartItems, total, paymentMode, setPaymentMode, upiMethod, setUpiMethod, onPayment, onBack, isProcessing }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h4>
        <div className="space-y-2">
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.name} x {item.quantity}</span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="border-t pt-2 mt-4">
          <div className="flex justify-between font-medium">
            <span>Total:</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Select Payment Method</h4>
        <div className="space-y-3">
          {[
            { value: 'cash', label: 'Cash on Delivery', icon: Banknote },
            { value: 'card', label: 'Credit/Debit Card', icon: CreditCard },
            { value: 'upi', label: 'UPI Payment', icon: Smartphone }
          ].map((method) => {
            const Icon = method.icon;
            return (
              <label key={method.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMode"
                  value={method.value}
                  checked={paymentMode === method.value}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="mr-3"
                />
                <Icon className="h-5 w-5 mr-3 text-gray-500" />
                <span className="text-sm font-medium">{method.label}</span>
              </label>
            );
          })}
        </div>
        
        {/* UPI Method Selection */}
        {paymentMode === 'upi' && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h5 className="text-sm font-medium text-gray-900 mb-3">Choose UPI Payment Method</h5>
            <div className="space-y-2">
              <label className="flex items-center p-2 border rounded-lg cursor-pointer hover:bg-white">
                <input
                  type="radio"
                  name="upiMethod"
                  value="qr"
                  checked={upiMethod === 'qr'}
                  onChange={(e) => setUpiMethod(e.target.value)}
                  className="mr-3"
                />
                <Smartphone className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">QR Code Scanner</span>
              </label>
              <label className="flex items-center p-2 border rounded-lg cursor-pointer hover:bg-white">
                <input
                  type="radio"
                  name="upiMethod"
                  value="id"
                  checked={upiMethod === 'id'}
                  onChange={(e) => setUpiMethod(e.target.value)}
                  className="mr-3"
                />
                <Smartphone className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">UPI ID</span>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Back to Cart
        </button>
        <button
          onClick={onPayment}
          disabled={isProcessing}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
};

const OrderSuccess = ({ orderDetails, onClose }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  return (
    <div className="text-center py-8">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Order Placed Successfully!</h3>
      <p className="text-sm text-gray-500 mb-4">
        Your order has been confirmed and will be processed shortly.
      </p>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left">
        <h4 className="font-medium text-gray-900 mb-2">Order Details:</h4>
        <p className="text-sm text-gray-600">Order Number: {orderDetails?.orderNumber}</p>
        <p className="text-sm text-gray-600">Total Amount: {formatPrice(orderDetails?.total)}</p>
        <p className="text-sm text-gray-600">Payment Method: {orderDetails?.paymentMethod}</p>
      </div>

      <button
        onClick={onClose}
        className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Close
      </button>
    </div>
  );
};

export default CartModal;
