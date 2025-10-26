import React from 'react';
import UPIQRScanner from './components/Payment/UPIQRScanner';

// Test component to verify UPI scanner display
const TestUPIScanner = () => {
  const mockOrderDetails = {
    total: 10.00,
    items: [{ name: 'DOLO 650', quantity: 1, price: 10.00 }],
    paymentMethod: 'upi'
  };

  const handleBack = () => {
    console.log('Back clicked');
  };

  const handlePaymentSuccess = () => {
    console.log('Payment success');
  };

  const handlePaymentCancel = () => {
    console.log('Payment cancelled');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <UPIQRScanner
          orderDetails={mockOrderDetails}
          onBack={handleBack}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentCancel={handlePaymentCancel}
        />
      </div>
    </div>
  );
};

export default TestUPIScanner;


