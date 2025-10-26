import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { ordersAPI } from '../../services/api';
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
  AlertTriangle,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

const PrescriptionPaymentModal = ({ 
  prescriptionItems, 
  isOpen, 
  onClose, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearPrescription,
  getPrescriptionTotal,
  getPrescriptionItemCount 
}) => {
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
      onRemoveItem(medicineId);
    } else {
      onUpdateQuantity(medicineId, newQuantity);
    }
  };

  const handleProceedToPayment = () => {
    if (prescriptionItems.length === 0) {
      toast.error('No items in prescription');
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
      // Create prescription order
      const orderData = {
        customer_name: paymentData.deliveryAddress.name,
        customer_email: user.email,
        customer_phone: paymentData.deliveryAddress.phone,
        customer_address: paymentData.deliveryAddress.address,
        items: prescriptionItems.map(item => ({
          medicine_id: item.id,
          quantity: item.quantity
        })),
        notes: `Prescription Order | Payment method: ${paymentData.paymentMethod}${paymentData.cardDetails ? ` | Card: ****${paymentData.cardDetails.number.slice(-4)}` : ''}${paymentData.upiDetails ? ` | UPI: ${paymentData.upiDetails.id}` : ''}`,
        total_amount: paymentData.total,
        order_type: 'prescription'
      };

      console.log('Creating prescription order with data:', orderData);
      const orderResponse = await ordersAPI.create(orderData);
      
      console.log('Order response received:', orderResponse);
      
      if (orderResponse && orderResponse.success) {
        console.log('Prescription order created successfully:', orderResponse.data);
        
        // Clear prescription and show success
        onClearPrescription();
        setOrderSuccess(true);
        setOrderDetails({
          orderNumber: orderResponse.data.order_number,
          total: paymentData.total,
          paymentMethod: paymentData.paymentMethod,
          orderId: orderResponse.data.id,
          deliveryAddress: paymentData.deliveryAddress,
          orderType: 'Prescription'
        });
        
        // Close payment screens
        setShowFlipkartPayment(false);
        setShowPaymentForm(false);
        
        // Invalidate orders query to refresh the orders page
        queryClient.invalidateQueries(['orders']);
        
        toast.success('Prescription order placed successfully!');
      } else {
        console.error('Prescription order creation failed:', orderResponse);
        const errorMessage = orderResponse?.message || orderResponse?.error || 'Failed to place prescription order';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error placing prescription order:', error);
      console.error('Error details:', error.response?.data);
      
      let errorMessage = 'Error placing prescription order. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Check for specific database connection errors
      if (error.message?.includes('Network Error') || 
          error.message?.includes('ECONNREFUSED') ||
          error.response?.status === 500) {
        errorMessage = 'Server is not responding. Please check if the server is running and try again.';
      } else if (error.response?.status === 503) {
        errorMessage = 'Database service unavailable. Please check server configuration and try again.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUPIPaymentSuccess = (paymentData) => {
    console.log('UPI payment success:', paymentData);
    handleFlipkartPayment(paymentData);
  };

  const handleUPIPaymentCancel = () => {
    console.log('UPI payment cancelled');
    setShowUPIScanner(false);
  };

  const handlePayment = (paymentData) => {
    console.log('Payment handler called with:', paymentData);
    handleFlipkartPayment(paymentData);
  };

  const handleClose = () => {
    setOrderSuccess(false);
    setOrderDetails(null);
    setShowPaymentForm(false);
    setShowFlipkartPayment(false);
    setShowUPIScanner(false);
    onClose();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-6 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">Prescription Order</h3>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {getPrescriptionItemCount()} items
            </span>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {orderSuccess ? (
          <OrderSuccess orderDetails={orderDetails} onClose={handleClose} />
        ) : showFlipkartPayment ? (
          <FlipkartPaymentScreen
            cartItems={prescriptionItems}
            total={getPrescriptionTotal()}
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
            cartItems={prescriptionItems}
            total={getPrescriptionTotal()}
            paymentMode={paymentMode}
            setPaymentMode={setPaymentMode}
            upiMethod={upiMethod}
            setUpiMethod={setUpiMethod}
            onPayment={handlePayment}
            onBack={() => setShowPaymentForm(false)}
            isProcessing={isProcessing}
          />
        ) : (
          <PrescriptionItems
            prescriptionItems={prescriptionItems}
            onQuantityChange={handleQuantityChange}
            onRemove={onRemoveItem}
            onProceedToPayment={handleProceedToPayment}
            total={getPrescriptionTotal()}
            formatPrice={formatPrice}
          />
        )}
      </div>
    </div>
  );
};

const PrescriptionItems = ({ prescriptionItems, onQuantityChange, onRemove, onProceedToPayment, total, formatPrice }) => {
  return (
    <div className="space-y-6">
      {/* Items List */}
      <div className="space-y-4">
        {prescriptionItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No prescription items</p>
            <p className="text-sm">Scan a prescription to add medicines</p>
          </div>
        ) : (
          prescriptionItems.map((item) => (
            <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.name}</h4>
                <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                <p className="text-sm text-gray-500">Price: {formatPrice(item.price)}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <Minus className="h-4 w-4 text-gray-600" />
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <Plus className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              
              <div className="text-right">
                <p className="font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</p>
              </div>
              
              <button
                onClick={() => onRemove(item.id)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Total and Actions */}
      {prescriptionItems.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-medium text-gray-900">Total:</span>
            <span className="text-xl font-bold text-gray-900">{formatPrice(total)}</span>
          </div>
          
          <button
            onClick={onProceedToPayment}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <ShoppingBag className="h-5 w-5" />
            <span>Proceed to Payment</span>
          </button>
        </div>
      )}
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
        <h4 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h4>
        <div className="space-y-3">
          {[
            { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, color: 'text-blue-600' },
            { id: 'upi', name: 'UPI', icon: Smartphone, color: 'text-purple-600' },
            { id: 'cash', name: 'Cash on Delivery', icon: Banknote, color: 'text-green-600' }
          ].map((method) => (
            <label key={method.id} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="paymentMode"
                value={method.id}
                checked={paymentMode === method.id}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <method.icon className={`h-5 w-5 ${method.color}`} />
              <span className="text-sm font-medium text-gray-900">{method.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => onPayment({ paymentMethod: paymentMode, total })}
          disabled={isProcessing}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
};

const OrderSuccess = ({ orderDetails, onClose }) => {
  return (
    <div className="text-center py-8">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <h3 className="text-xl font-medium text-gray-900 mb-2">Prescription Order Placed Successfully!</h3>
      <p className="text-gray-600 mb-6">
        Your prescription order has been placed and will be processed soon.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
        <h4 className="font-medium text-gray-900 mb-2">Order Details</h4>
        <div className="space-y-1 text-sm text-gray-600">
          <p><span className="font-medium">Order Number:</span> {orderDetails.orderNumber}</p>
          <p><span className="font-medium">Order Type:</span> {orderDetails.orderType}</p>
          <p><span className="font-medium">Total Amount:</span> ₹{orderDetails.total}</p>
          <p><span className="font-medium">Payment Method:</span> {orderDetails.paymentMethod}</p>
        </div>
      </div>
      
      <button
        onClick={onClose}
        className="bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        Close
      </button>
    </div>
  );
};

export default PrescriptionPaymentModal;
