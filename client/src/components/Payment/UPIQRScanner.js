import React, { useState, useEffect, useMemo } from 'react';
import { X, Smartphone, QrCode, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const UPIQRScanner = ({ orderDetails, onBack, onPaymentSuccess, onPaymentCancel }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, success, failed
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes timeout

  // Debug logging
  useEffect(() => {
    console.log('UPIQRScanner rendered with orderDetails:', orderDetails);
  }, [orderDetails]);

  // Countdown timer
  useEffect(() => {
    if (isScanning && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setPaymentStatus('failed');
      setIsScanning(false);
      toast.error('Payment timeout. Please try again.');
    }
  }, [isScanning, timeLeft]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate a stable QR code pattern
  const qrPattern = useMemo(() => {
    const size = 8;
    const pattern = [];
    for (let i = 0; i < size * size; i++) {
      const row = Math.floor(i / size);
      const col = i % size;
      // Create a more realistic QR pattern with corner squares and data
      const isBlack = 
        // Corner squares (like real QR codes)
        (row < 2 && col < 2) || 
        (row < 2 && col >= size - 2) || 
        (row >= size - 2 && col < 2) ||
        // Some data pattern
        (row + col) % 3 === 0 ||
        (row * col) % 5 === 0 ||
        // Random but deterministic pattern
        ((row * 7 + col * 11) % 13) < 6;
      
      pattern.push(isBlack);
    }
    return pattern;
  }, []);

  const handleStartScanning = () => {
    setIsScanning(true);
    setTimeLeft(300); // Reset timer
    setPaymentStatus('pending');
    toast.success('Scan the QR code with your UPI app to complete payment');
  };

  const handlePaymentSuccess = () => {
    setPaymentStatus('success');
    setIsScanning(false);
    toast.success('Payment successful!');
    setTimeout(() => {
      onPaymentSuccess();
    }, 2000);
  };

  const handlePaymentCancel = () => {
    setPaymentStatus('failed');
    setIsScanning(false);
    onPaymentCancel();
  };

  const handleUPIRedirect = () => {
    // Create UPI payment URL
    const upiId = 'santosh@paytm'; // Replace with actual UPI ID
    const amount = orderDetails.total;
    const merchantName = 'Medicine Store';
    const transactionId = `TXN${Date.now()}`;
    
    // UPI deep link format
    const upiUrl = `upi://pay?pa=${upiId}&pn=${merchantName}&am=${amount}&cu=INR&tn=Medicine Order&tr=${transactionId}`;
    
    // Try to open UPI app
    window.open(upiUrl, '_blank');
    
    // Start scanning mode
    handleStartScanning();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-3 p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Smartphone className="h-5 w-5 mr-2" />
            UPI Payment
          </h3>
        </div>
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Order Total:</span>
            <span className="font-medium">{formatPrice(orderDetails.total)}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment Method:</span>
            <span>UPI</span>
          </div>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="text-center">
        <div className="bg-white p-6 rounded-lg border-2 border-gray-200 inline-block">
          {/* QR Code - Using a placeholder for now, in real implementation you'd generate actual QR */}
          <div className="w-64 h-64 bg-black rounded-lg flex items-center justify-center relative overflow-hidden">
            {/* QR Code Pattern - Stable pattern for consistent display */}
            <div className="grid grid-cols-8 gap-0.5 w-48 h-48">
              {qrPattern.map((isBlack, i) => (
                <div
                  key={i}
                  className={`w-full h-full ${isBlack ? 'bg-black' : 'bg-white'}`}
                />
              ))}
            </div>
            
            {/* PhonePe Logo in center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-2 border-black shadow-lg">
                <span className="text-black font-bold text-lg">पे</span>
              </div>
            </div>
          </div>
          
          {/* Merchant Name */}
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-900">Santosh</p>
            <p className="text-xs text-gray-500">Scan with any UPI app</p>
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <QrCode className="h-4 w-4" />
            <span>Scan QR code with PhonePe, Google Pay, Paytm, or any UPI app</span>
          </div>
          
          {isScanning && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-2 text-blue-800">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Waiting for payment...</span>
              </div>
              <p className="text-xs text-blue-600 mt-1 text-center">
                Time remaining: {formatTime(timeLeft)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {!isScanning && paymentStatus === 'pending' && (
          <div className="flex space-x-3">
            <button
              onClick={handleUPIRedirect}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center space-x-2"
            >
              <Smartphone className="h-4 w-4" />
              <span>Open UPI App</span>
            </button>
            <button
              onClick={handleStartScanning}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center space-x-2"
            >
              <QrCode className="h-4 w-4" />
              <span>Scan QR Code</span>
            </button>
          </div>
        )}

        {isScanning && (
          <div className="flex space-x-3">
            <button
              onClick={handlePaymentSuccess}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Payment Done
            </button>
            <button
              onClick={handlePaymentCancel}
              className="flex-1 bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Cancel Payment
            </button>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="text-center">
            <div className="text-green-600 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-800 font-medium">Payment Successful!</p>
            <p className="text-sm text-green-600">Redirecting to order confirmation...</p>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="text-center">
            <div className="text-red-600 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-800 font-medium">Payment Failed or Cancelled</p>
            <p className="text-sm text-red-600">Please try again or choose a different payment method</p>
            <button
              onClick={onBack}
              className="mt-3 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="text-center text-xs text-gray-500">
        <p>Having trouble? Make sure your UPI app is installed and working</p>
        <p>Supported apps: PhonePe, Google Pay, Paytm, BHIM, and more</p>
      </div>
    </div>
  );
};

export default UPIQRScanner;
