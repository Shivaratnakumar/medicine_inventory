import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Smartphone,
  Banknote,
  MapPin,
  Edit3,
  Check,
  CheckCircle,
  Shield,
  Truck,
  Star,
  ChevronRight,
  Plus,
  ArrowLeft,
  Lock,
  X,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const FlipkartPaymentScreen = ({ 
  cartItems, 
  total, 
  onBack, 
  onPlaceOrder, 
  isProcessing,
  user 
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [showAddCard, setShowAddCard] = useState(true); // Auto-show card form
  const [showAddUPI, setShowAddUPI] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [errors, setErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  
  const [deliveryAddress, setDeliveryAddress] = useState({
    name: user?.name || 'John Doe',
    phone: user?.phone || '+91 9876543210',
    address: user?.address || '123, Main Street, City, State - 123456',
    type: 'Home'
  });

  // Payment method specific states
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
    saved: false
  });

  const [upiDetails, setUpiDetails] = useState({
    id: '',
    saved: false
  });

  const [savedPaymentMethods, setSavedPaymentMethods] = useState({
    cards: [],
    upi: []
  });

  const [showUPIStatus, setShowUPIStatus] = useState(false);
  const [upiPaymentStatus, setUpiPaymentStatus] = useState('pending'); // pending, success, failed
  const [showManualUPI, setShowManualUPI] = useState(false);
  const [manualUPIDetails, setManualUPIDetails] = useState(null);
  const [upiVerificationInterval, setUPIVerificationInterval] = useState(null);
  const [currentTransactionId, setCurrentTransactionId] = useState(null);
  const [countdown, setCountdown] = useState(5);

  // Debug logging
  useEffect(() => {
    console.log('FlipkartPaymentScreen mounted with:', {
      cartItems,
      total,
      user,
      deliveryAddress
    });
  }, [cartItems, total, user, deliveryAddress]);

  // Cleanup verification interval on unmount
  useEffect(() => {
    return () => {
      if (upiVerificationInterval) {
        clearInterval(upiVerificationInterval);
      }
    };
  }, [upiVerificationInterval]);

  // Listen for UPI payment messages
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'UPI_PAYMENT_COMPLETE') {
        console.log('UPI payment completed via message:', event.data.data);
        if (upiVerificationInterval) {
          clearInterval(upiVerificationInterval);
        }
        setUpiPaymentStatus('success');
        
        // Process the order
        setTimeout(() => {
          setShowUPIStatus(false);
          onPlaceOrder({
            paymentMethod: 'upi',
            deliveryAddress,
            total: calculateTotal(),
            upiDetails,
            transactionId: event.data.data.transactionId
          });
        }, 2000);
      } else if (event.data.type === 'UPI_PAYMENT_FAILED') {
        console.log('UPI payment failed via message:', event.data.data);
        if (upiVerificationInterval) {
          clearInterval(upiVerificationInterval);
        }
        setUpiPaymentStatus('failed');
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [upiVerificationInterval, deliveryAddress, upiDetails, onPlaceOrder]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDelivery = () => {
    return total > 500 ? 0 : 50; // Free delivery above ₹500
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateDelivery();
  };

  // Validation functions
  const validateAddress = () => {
    console.log('Validating address:', deliveryAddress);
    const newErrors = {};
    
    if (!deliveryAddress.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!deliveryAddress.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(\+91|91)?[6-9]\d{9}$/.test(deliveryAddress.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid Indian phone number';
    }
    
    if (!deliveryAddress.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (deliveryAddress.address.trim().length < 10) {
      newErrors.address = 'Please enter a complete address';
    }
    
    console.log('Address validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCardDetails = () => {
    const newErrors = {};
    
    if (!cardDetails.number.trim()) {
      newErrors.cardNumber = 'Card number is required';
    } else if (!/^\d{16}$/.test(cardDetails.number.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Please enter a valid 16-digit card number';
    }
    
    if (!cardDetails.expiry.trim()) {
      newErrors.expiry = 'Expiry date is required';
    } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardDetails.expiry)) {
      newErrors.expiry = 'Please enter expiry in MM/YY format';
    }
    
    if (!cardDetails.cvv.trim()) {
      newErrors.cvv = 'CVV is required';
    } else if (!/^\d{3,4}$/.test(cardDetails.cvv)) {
      newErrors.cvv = 'Please enter a valid CVV';
    }
    
    if (!cardDetails.name.trim()) {
      newErrors.cardName = 'Name on card is required';
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateUPIDetails = () => {
    console.log('Validating UPI ID:', upiDetails.id);
    const newErrors = {};
    
    if (!upiDetails.id.trim()) {
      newErrors.upiId = 'UPI ID is required';
    } else {
      // More flexible UPI ID validation
      const upiId = upiDetails.id.trim().toLowerCase();
      const validUPIProviders = [
        'paytm', 'phonepe', 'gpay', 'ybl', 'okaxis', 'okbizaxis', 
        'upi', 'upiid', 'bank', 'sbi', 'hdfc', 'icici', 'axis', 
        'kotak', 'pnb', 'bob', 'canara', 'union', 'indian'
      ];
      
      console.log('Checking UPI ID:', upiId);
      
      // Check if it contains @ and has a valid provider
      if (!upiId.includes('@')) {
        newErrors.upiId = 'UPI ID must contain @ symbol (e.g., username@paytm)';
      } else {
        const parts = upiId.split('@');
        if (parts.length !== 2) {
          newErrors.upiId = 'Invalid UPI ID format';
        } else {
          const [username, provider] = parts;
          console.log('Username:', username, 'Provider:', provider);
          if (!username || username.length < 2) {
            newErrors.upiId = 'Username must be at least 2 characters';
          } else if (!validUPIProviders.some(p => provider.includes(p))) {
            console.log('Provider not found in valid list:', validUPIProviders);
            newErrors.upiId = 'Please use a supported UPI provider (paytm, phonepe, gpay, ybl, etc.)';
          }
        }
      }
    }
    
    console.log('UPI validation errors:', newErrors);
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validatePaymentMethod = () => {
    console.log('Validating payment method:', selectedPaymentMethod);
    if (selectedPaymentMethod === 'card') {
      const isValid = validateCardDetails();
      console.log('Card validation result:', isValid);
      return isValid;
    } else if (selectedPaymentMethod === 'upi') {
      const isValid = validateUPIDetails();
      console.log('UPI validation result:', isValid);
      return isValid;
    }
    console.log('COD selected, no validation needed');
    return true; // COD doesn't need validation
  };

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, RuPay',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'upi',
      name: 'UPI',
      icon: Smartphone,
      description: 'Google Pay, PhonePe, Paytm',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'cod',
      name: 'Cash on Delivery',
      icon: Banknote,
      description: 'Pay when your order is delivered',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    }
  ];

  // Utility functions
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleAddressEdit = (field, value) => {
    setDeliveryAddress(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCardInput = (field, value) => {
    let formattedValue = value;
    
    if (field === 'number') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiry') {
      formattedValue = formatExpiry(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    }
    
    setCardDetails(prev => ({
      ...prev,
      [field]: formattedValue
    }));
    
    // Clear error when user starts typing
    if (errors[`card${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
      setErrors(prev => ({ ...prev, [`card${field.charAt(0).toUpperCase() + field.slice(1)}`]: '' }));
    }
  };

  const handleUPIInput = (field, value) => {
    setUpiDetails(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors.upiId) {
      setErrors(prev => ({ ...prev, upiId: '' }));
    }
  };

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
    
    // Auto-show the appropriate form
    if (method === 'card') {
      setShowAddCard(true);
      setShowAddUPI(false);
    } else if (method === 'upi') {
      setShowAddCard(false);
      setShowAddUPI(true);
    } else {
      // COD - hide all forms
      setShowAddCard(false);
      setShowAddUPI(false);
    }
    
    // Clear any existing errors
    setErrors(prev => ({
      ...prev,
      cardNumber: '',
      expiry: '',
      cvv: '',
      cardName: '',
      upiId: ''
    }));
  };

  const savePaymentMethod = () => {
    if (selectedPaymentMethod === 'card' && validateCardDetails()) {
      const newCard = {
        id: Date.now(),
        number: cardDetails.number,
        expiry: cardDetails.expiry,
        name: cardDetails.name,
        last4: cardDetails.number.slice(-4),
        type: 'Visa' // You can determine this based on card number
      };
      
      setSavedPaymentMethods(prev => ({
        ...prev,
        cards: [...prev.cards, newCard]
      }));
      
      setShowAddCard(false);
      setCardDetails({ number: '', expiry: '', cvv: '', name: '', saved: false });
      toast.success('Card saved successfully!');
    } else if (selectedPaymentMethod === 'upi' && validateUPIDetails()) {
      const newUPI = {
        id: Date.now(),
        upiId: upiDetails.id,
        provider: upiDetails.id.split('@')[1] || 'upi'
      };
      
      setSavedPaymentMethods(prev => ({
        ...prev,
        upi: [...prev.upi, newUPI]
      }));
      
      setShowAddUPI(false);
      setUpiDetails({ id: '', saved: false });
      toast.success('UPI ID saved successfully!');
    }
  };

  const handleUPIPayment = async () => {
    if (!validateUPIDetails()) {
      toast.error('Please fix UPI ID errors before proceeding');
      return;
    }

    console.log('Initiating UPI payment for:', upiDetails.id);
    
    // Create UPI payment URL
    const upiId = upiDetails.id.trim();
    const amount = calculateTotal();
    const merchantName = 'Medicine Store';
    const transactionId = `TXN${Date.now()}`;
    
    // UPI deep link format with callback
    const upiUrl = `upi://pay?pa=${upiId}&pn=${merchantName}&am=${amount}&cu=INR&tn=Medicine Order&tr=${transactionId}&url=${encodeURIComponent(window.location.origin + '/upi-callback')}`;
    
    console.log('UPI URL generated:', upiUrl);
    
    // Store payment details for verification
    const paymentDetails = {
      upiId,
      amount,
      merchantName,
      transactionId,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    // Store in localStorage for verification
    localStorage.setItem('pendingUPIPayment', JSON.stringify(paymentDetails));
    
    // Store transaction ID
    setCurrentTransactionId(transactionId);
    
    // Set up payment verification
    startUPIPaymentVerification(transactionId);
    
    // Try to open UPI app
    try {
      // Create a temporary link element to trigger UPI
      const link = document.createElement('a');
      link.href = upiUrl;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('UPI app opened! Please complete the payment.');
      
      // Show payment status modal
      setShowUPIStatus(true);
      setUpiPaymentStatus('pending');
    } catch (error) {
      console.error('Error opening UPI app:', error);
      
      // Fallback: Show manual UPI details
      const manualUPIDetails = {
        upiId: upiId,
        amount: amount,
        merchantName: merchantName,
        transactionId: transactionId
      };
      
      setShowManualUPI(true);
      setManualUPIDetails(manualUPIDetails);
    }
  };

  const startUPIPaymentVerification = (transactionId) => {
    console.log('Starting UPI payment verification for:', transactionId);
    
    // Reset countdown
    setCountdown(5);
    
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Auto-complete payment after 5 seconds for demo purposes
    const autoCompleteTimer = setTimeout(() => {
      console.log('Auto-completing UPI payment after 5 seconds');
      clearInterval(countdownInterval);
      if (upiVerificationInterval) {
        clearInterval(upiVerificationInterval);
      }
      setUpiPaymentStatus('success');
      
      // Process the order
      setTimeout(() => {
        setShowUPIStatus(false);
        onPlaceOrder({
          paymentMethod: 'upi',
          deliveryAddress,
          total: calculateTotal(),
          upiDetails,
          transactionId: transactionId
        });
      }, 2000);
    }, 5000); // Auto-complete after 5 seconds
    
    // Set up interval to check payment status
    const verificationInterval = setInterval(async () => {
      try {
        // Check if payment was completed
        const response = await checkUPIPaymentStatus(transactionId);
        
        if (response.status === 'completed') {
          console.log('UPI payment completed successfully');
          clearInterval(verificationInterval);
          clearTimeout(autoCompleteTimer); // Cancel auto-complete timer
          setUpiPaymentStatus('success');
          
          // Process the order
          setTimeout(() => {
            setShowUPIStatus(false);
            onPlaceOrder({
              paymentMethod: 'upi',
              deliveryAddress,
              total: calculateTotal(),
              upiDetails,
              transactionId: transactionId
            });
          }, 2000);
          
        } else if (response.status === 'failed') {
          console.log('UPI payment failed');
          clearInterval(verificationInterval);
          clearTimeout(autoCompleteTimer); // Cancel auto-complete timer
          setUpiPaymentStatus('failed');
        }
        
        // Timeout after 5 minutes
        const storedPayment = localStorage.getItem('pendingUPIPayment');
        if (storedPayment) {
          const payment = JSON.parse(storedPayment);
          if (Date.now() - payment.timestamp > 300000) { // 5 minutes
            clearInterval(verificationInterval);
            clearTimeout(autoCompleteTimer); // Cancel auto-complete timer
            setUpiPaymentStatus('failed');
            localStorage.removeItem('pendingUPIPayment');
          }
        }
        
      } catch (error) {
        console.error('Error checking UPI payment status:', error);
      }
    }, 2000); // Check every 2 seconds
    
    // Store interval ID for cleanup
    setUPIVerificationInterval(verificationInterval);
  };

  const checkUPIPaymentStatus = async (transactionId) => {
    // In a real implementation, this would call your backend API
    // For now, we'll simulate the check by looking for UPI callback data
    
    // Check if there's callback data in localStorage (simulated)
    const callbackData = localStorage.getItem('upiCallbackData');
    if (callbackData) {
      const callback = JSON.parse(callbackData);
      if (callback.transactionId === transactionId) {
        localStorage.removeItem('upiCallbackData');
        return { status: callback.status, data: callback };
      }
    }
    
    // Simulate API call to backend
    try {
      const response = await fetch(`/api/payments/verify-upi/${transactionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.log('Backend verification not available, using simulation');
    }
    
    // Fallback: Check if user manually confirmed (for testing)
    const manualConfirmation = localStorage.getItem('manualUPIConfirmation');
    if (manualConfirmation === transactionId) {
      localStorage.removeItem('manualUPIConfirmation');
      return { status: 'completed', data: { transactionId } };
    }
    
    return { status: 'pending' };
  };

  const handlePlaceOrder = async () => {
    console.log('Place order clicked');
    setIsValidating(true);
    
    // Validate address first
    if (!validateAddress()) {
      setIsValidating(false);
      toast.error('Please fix address errors before proceeding');
      return;
    }
    
    // Validate payment method
    if (!validatePaymentMethod()) {
      setIsValidating(false);
      toast.error('Please fix payment method errors before proceeding');
      return;
    }
    
    setIsValidating(false);
    
    // Prepare payment data
    const paymentData = {
      paymentMethod: selectedPaymentMethod,
      deliveryAddress,
      total: calculateTotal(),
      cardDetails: selectedPaymentMethod === 'card' ? cardDetails : null,
      upiDetails: selectedPaymentMethod === 'upi' ? upiDetails : null
    };
    
    console.log('Payment data prepared:', paymentData);
    
    try {
      await onPlaceOrder(paymentData);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Checkout</h1>
                <p className="text-sm text-gray-500">Secure payment powered by Flipkart</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Shield className="h-4 w-4" />
              <span>100% Secure</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                  Delivery Address
                </h2>
                <button
                  onClick={() => setIsEditingAddress(!isEditingAddress)}
                  className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  {isEditingAddress ? 'Save' : 'Edit'}
                </button>
              </div>

              {isEditingAddress ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={deliveryAddress.name}
                        onChange={(e) => handleAddressEdit('name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your full name"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        value={deliveryAddress.phone}
                        onChange={(e) => handleAddressEdit('phone', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="+91 9876543210"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Complete Address *</label>
                    <textarea
                      value={deliveryAddress.address}
                      onChange={(e) => handleAddressEdit('address', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter complete address with landmark"
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.address}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
                    <select
                      value={deliveryAddress.type}
                      onChange={(e) => handleAddressEdit('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setIsEditingAddress(false);
                        setErrors({});
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (validateAddress()) {
                          setIsEditingAddress(false);
                          toast.success('Address updated successfully!');
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Save Address
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{deliveryAddress.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{deliveryAddress.phone}</p>
                      <p className="text-sm text-gray-600 mt-1">{deliveryAddress.address}</p>
                      <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {deliveryAddress.type}
                      </span>
                    </div>
                    <div className="flex items-center text-green-600 text-sm">
                      <Check className="h-4 w-4 mr-1" />
                      <span>Verified</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Payment Method</h2>
              <p className="text-sm text-gray-600 mb-4">
                {selectedPaymentMethod === 'card' && 'Please enter your card details below'}
                {selectedPaymentMethod === 'upi' && 'Please enter your UPI ID below'}
                {selectedPaymentMethod === 'cod' && 'No additional details required for Cash on Delivery'}
              </p>
              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedPaymentMethod === method.id;
                  
                  return (
                    <div
                      key={method.id}
                      onClick={() => handlePaymentMethodChange(method.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? `${method.borderColor} ${method.bgColor}` 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${isSelected ? method.bgColor : 'bg-gray-100'}`}>
                            <Icon className={`h-5 w-5 ${isSelected ? method.color : 'text-gray-600'}`} />
                          </div>
                          <div>
                            <h3 className={`font-medium ${isSelected ? method.color : 'text-gray-900'}`}>
                              {method.name}
                            </h3>
                            <p className="text-sm text-gray-500">{method.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isSelected && (
                            <div className={`w-5 h-5 rounded-full ${method.bgColor} flex items-center justify-center`}>
                              <Check className={`h-3 w-3 ${method.color}`} />
                            </div>
                          )}
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Saved Payment Methods */}
              {savedPaymentMethods.cards.length > 0 && selectedPaymentMethod === 'card' && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Saved Cards</h5>
                  <div className="space-y-2">
                    {savedPaymentMethods.cards.map((card) => (
                      <div key={card.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-gray-900">{card.type} •••• {card.last4}</p>
                              <p className="text-sm text-gray-500">Expires {card.expiry}</p>
                            </div>
                          </div>
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {savedPaymentMethods.upi.length > 0 && selectedPaymentMethod === 'upi' && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Saved UPI IDs</h5>
                  <div className="space-y-2">
                    {savedPaymentMethods.upi.map((upi) => (
                      <div key={upi.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Smartphone className="h-5 w-5 text-purple-600" />
                            <div>
                              <p className="font-medium text-gray-900">{upi.upiId}</p>
                              <p className="text-sm text-gray-500">{upi.provider}</p>
                            </div>
                          </div>
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Payment Method */}
              {selectedPaymentMethod === 'card' && !showAddCard && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowAddCard(true)}
                    className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium p-3 border border-dashed border-gray-300 rounded-lg w-full justify-center hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Card
                  </button>
                </div>
              )}

              {selectedPaymentMethod === 'upi' && !showAddUPI && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowAddUPI(true)}
                    className="flex items-center text-purple-600 hover:text-purple-700 text-sm font-medium p-3 border border-dashed border-gray-300 rounded-lg w-full justify-center hover:bg-purple-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add UPI ID
                  </button>
                </div>
              )}

              {/* Card Details Form */}
              {showAddCard && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-sm font-medium text-gray-900">
                      {selectedPaymentMethod === 'card' ? 'Enter Card Details' : 'Add New Card'}
                    </h5>
                    <button
                      onClick={() => {
                        setShowAddCard(false);
                        setCardDetails({ number: '', expiry: '', cvv: '', name: '', saved: false });
                        setErrors(prev => ({ ...prev, cardNumber: '', expiry: '', cvv: '', cardName: '' }));
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Card Number *</label>
                      <input
                        type="text"
                        value={cardDetails.number}
                        onChange={(e) => handleCardInput('number', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                      {errors.cardNumber && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.cardNumber}
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry *</label>
                        <input
                          type="text"
                          value={cardDetails.expiry}
                          onChange={(e) => handleCardInput('expiry', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.expiry ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                        {errors.expiry && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.expiry}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CVV *</label>
                        <input
                          type="text"
                          value={cardDetails.cvv}
                          onChange={(e) => handleCardInput('cvv', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.cvv ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="123"
                          maxLength={4}
                        />
                        {errors.cvv && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.cvv}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card *</label>
                      <input
                        type="text"
                        value={cardDetails.name}
                        onChange={(e) => handleCardInput('name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.cardName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="John Doe"
                      />
                      {errors.cardName && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.cardName}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="saveCard"
                        checked={cardDetails.saved}
                        onChange={(e) => setCardDetails(prev => ({ ...prev, saved: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="saveCard" className="ml-2 text-sm text-gray-700">
                        Save this card for future payments
                      </label>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setShowAddCard(false);
                          setCardDetails({ number: '', expiry: '', cvv: '', name: '', saved: false });
                          setErrors(prev => ({ ...prev, cardNumber: '', expiry: '', cvv: '', cardName: '' }));
                        }}
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={savePaymentMethod}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        {selectedPaymentMethod === 'card' ? 'Continue with Card' : 'Add Card'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* UPI Details Form */}
              {showAddUPI && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-sm font-medium text-gray-900">
                      {selectedPaymentMethod === 'upi' ? 'Enter UPI ID' : 'Add UPI ID'}
                    </h5>
                    <button
                      onClick={() => {
                        setShowAddUPI(false);
                        setUpiDetails({ id: '', saved: false });
                        setErrors(prev => ({ ...prev, upiId: '' }));
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID *</label>
                      <input
                        type="text"
                        value={upiDetails.id}
                        onChange={(e) => handleUPIInput('id', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          errors.upiId ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="username@paytm or 9876543210@ybl"
                      />
                      {errors.upiId && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.upiId}
                        </p>
                      )}
                      <div className="mt-1 text-xs text-gray-500">
                        <p className="font-medium mb-1">Supported formats:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-xs">
                          <li>username@paytm</li>
                          <li>9876543210@ybl</li>
                          <li>user@phonepe</li>
                          <li>name@gpay</li>
                          <li>account@okaxis</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="saveUPI"
                        checked={upiDetails.saved}
                        onChange={(e) => setUpiDetails(prev => ({ ...prev, saved: e.target.checked }))}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="saveUPI" className="ml-2 text-sm text-gray-700">
                        Save this UPI ID for future payments
                      </label>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setShowAddUPI(false);
                          setUpiDetails({ id: '', saved: false });
                          setErrors(prev => ({ ...prev, upiId: '' }));
                        }}
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={selectedPaymentMethod === 'upi' ? handleUPIPayment : savePaymentMethod}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                      >
                        {selectedPaymentMethod === 'upi' ? 'Continue with UPI' : 'Add UPI ID'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-gray-500">IMG</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      <p className="text-sm font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Per unit: {formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({cartItems.length} items)</span>
                  <span className="text-gray-900">{formatPrice(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Charges</span>
                  <span className="text-gray-900">
                    {calculateDelivery() === 0 ? (
                      <span className="text-green-600 font-medium">FREE</span>
                    ) : (
                      formatPrice(calculateDelivery())
                    )}
                  </span>
                </div>
                {calculateDelivery() === 0 && (
                  <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                    <Check className="h-3 w-3 inline mr-1" />
                    You saved ₹50 on delivery!
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="flex items-center space-x-2 text-blue-800 text-sm">
                  <Truck className="h-4 w-4" />
                  <span className="font-medium">Delivery by Tomorrow</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">Order before 11 PM for next day delivery</p>
              </div>

              {/* Security Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex items-center space-x-2 text-gray-600 text-sm mb-2">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Secure Payment</span>
                </div>
                <p className="text-xs text-gray-500">
                  Your payment information is encrypted and secure. We do not store your card details.
                </p>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing || isValidating}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {isProcessing || isValidating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>{isValidating ? 'Validating...' : 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Place Order</span>
                  </>
                )}
              </button>

              {/* Trust Indicators */}
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Shield className="h-3 w-3 mr-1" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center">
                    <Truck className="h-3 w-3 mr-1" />
                    <span>Fast Delivery</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    <span>4.8/5 Rating</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UPI Payment Status Modal */}
      {showUPIStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mb-4">
                {upiPaymentStatus === 'pending' && (
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto"></div>
                )}
                {upiPaymentStatus === 'success' && (
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                )}
                {upiPaymentStatus === 'failed' && (
                  <X className="h-12 w-12 text-red-500 mx-auto" />
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {upiPaymentStatus === 'pending' && 'Payment in Progress'}
                {upiPaymentStatus === 'success' && 'Payment Successful!'}
                {upiPaymentStatus === 'failed' && 'Payment Failed'}
              </h3>
              
               <p className="text-sm text-gray-600 mb-4">
                 {upiPaymentStatus === 'pending' && `Please complete the payment in your UPI app. We will automatically detect when the payment is completed. Auto-completing in ${countdown} seconds...`}
                 {upiPaymentStatus === 'success' && 'Your payment has been processed successfully.'}
                 {upiPaymentStatus === 'failed' && 'Payment could not be completed. Please try again.'}
               </p>

              {upiPaymentStatus === 'pending' && (
                <div className="space-y-3">
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm text-purple-800">
                      <strong>UPI ID:</strong> {upiDetails.id}
                    </p>
                    <p className="text-sm text-purple-800">
                      <strong>Amount:</strong> {formatPrice(calculateTotal())}
                    </p>
                    <p className="text-sm text-purple-800">
                      <strong>Transaction ID:</strong> {currentTransactionId}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">
                      Waiting for payment completion...
                    </p>
                    <div className="flex justify-center space-x-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (upiVerificationInterval) {
                        clearInterval(upiVerificationInterval);
                      }
                      setShowUPIStatus(false);
                      setUpiPaymentStatus('pending');
                    }}
                    className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel Payment
                  </button>
                </div>
              )}

              {upiPaymentStatus === 'success' && (
                <button
                  onClick={() => setShowUPIStatus(false)}
                  className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition-colors"
                >
                  Continue
                </button>
              )}

              {upiPaymentStatus === 'failed' && (
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowUPIStatus(false);
                      setUpiPaymentStatus('pending');
                    }}
                    className="bg-purple-600 text-white py-2 px-6 rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setShowUPIStatus(false)}
                    className="bg-gray-600 text-white py-2 px-6 rounded-md hover:bg-gray-700 transition-colors ml-3"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual UPI Details Modal */}
      {showManualUPI && manualUPIDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <Smartphone className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                UPI Payment Details
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                UPI app could not be opened automatically. Please use these details to make the payment manually.
              </p>

              <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">UPI ID:</span>
                    <span className="text-gray-900 font-mono">{manualUPIDetails.upiId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Amount:</span>
                    <span className="text-gray-900 font-mono">{formatPrice(manualUPIDetails.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Merchant:</span>
                    <span className="text-gray-900">{manualUPIDetails.merchantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Transaction ID:</span>
                    <span className="text-gray-900 font-mono text-xs">{manualUPIDetails.transactionId}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    // Copy UPI details to clipboard
                    const upiText = `UPI ID: ${manualUPIDetails.upiId}\nAmount: ${formatPrice(manualUPIDetails.amount)}\nMerchant: ${manualUPIDetails.merchantName}\nTransaction ID: ${manualUPIDetails.transactionId}`;
                    navigator.clipboard.writeText(upiText);
                    toast.success('UPI details copied to clipboard!');
                  }}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
                >
                  Copy Details
                </button>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowManualUPI(false);
                      setShowUPIStatus(true);
                    }}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Payment Done
                  </button>
                  <button
                    onClick={() => setShowManualUPI(false)}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlipkartPaymentScreen;
