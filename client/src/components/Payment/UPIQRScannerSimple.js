import React, { useState } from 'react';

const UPIQRScannerSimple = ({ orderDetails, onBack, onPaymentSuccess, onPaymentCancel }) => {
  console.log('UPIQRScannerSimple rendered with:', orderDetails);
  const [upiId, setUpiId] = useState('7204569464-2@ybl');

  const handleUPIPayment = () => {
    // Create UPI payment URL
    const amount = orderDetails?.total || 0;
    const merchantName = 'Medicine Store';
    const transactionId = `TXN${Date.now()}`;
    
    // UPI deep link format
    const upiUrl = `upi://pay?pa=${upiId}&pn=${merchantName}&am=${amount}&cu=INR&tn=Medicine Order&tr=${transactionId}`;
    
    // Try to open UPI app
    window.open(upiUrl, '_blank');
    
    // Show success message
    alert('UPI app opened! Please complete the payment and click "Payment Done" when finished.');
  };

  return (
    <div style={{ padding: '20px', backgroundColor: 'white' }}>
      <h2>UPI Payment</h2>
      <p>Order Total: ₹{orderDetails?.total || 0}</p>
      
      {/* Payment Method Selection */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>Choose Payment Method:</h3>
        
        {/* QR Code Scanner Option */}
        <div style={{ 
          border: '2px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '15px', 
          marginBottom: '15px',
          backgroundColor: orderDetails?.upiMethod === 'qr' ? '#f0f9ff' : 'white'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>QR Code Scanner</h4>
          <div style={{ 
            width: '150px', 
            height: '150px', 
            backgroundColor: 'black', 
            margin: '10px auto',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* QR Pattern */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(6, 1fr)', 
              gap: '2px',
              width: '120px',
              height: '120px'
            }}>
              {Array.from({ length: 36 }, (_, i) => {
                const isBlack = (i + Math.floor(i / 6)) % 3 === 0 || i % 7 === 0;
                return (
                  <div
                    key={i}
                    style={{
                      backgroundColor: isBlack ? 'black' : 'white',
                      width: '100%',
                      height: '100%'
                    }}
                  />
                );
              })}
            </div>
            
            {/* PhonePe Logo */}
            <div style={{
              position: 'absolute',
              width: '30px',
              height: '30px',
              backgroundColor: 'white',
              borderRadius: '50%',
              border: '2px solid black',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '12px'
            }}>
              पे
            </div>
          </div>
          <p style={{ textAlign: 'center', margin: '5px 0', fontSize: '12px' }}>
            <strong>Santosh</strong><br />
            Scan with any UPI app
          </p>
        </div>

        {/* UPI ID Option */}
        <div style={{ 
          border: '2px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '15px',
          backgroundColor: orderDetails?.upiMethod === 'id' ? '#f0f9ff' : 'white'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>UPI ID Payment</h4>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
              UPI ID:
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              placeholder="Enter UPI ID"
            />
          </div>
          <button
            onClick={handleUPIPayment}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Pay with UPI ID
          </button>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button 
          onClick={onBack}
          style={{ 
            flex: 1, 
            padding: '10px', 
            backgroundColor: '#6b7280', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back
        </button>
        <button 
          onClick={onPaymentSuccess}
          style={{ 
            flex: 1, 
            padding: '10px', 
            backgroundColor: '#10b981', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Payment Done
        </button>
      </div>
    </div>
  );
};

export default UPIQRScannerSimple;
