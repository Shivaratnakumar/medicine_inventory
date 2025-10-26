import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import api from '../../services/api';
import SimpleChart from '../../components/Charts/SimpleChart';
import StoreSelector from '../../components/StoreSelector';
import jsPDF from 'jspdf';
import {
  Truck,
  Store,
  TrendingUp,
  Calendar,
  Download,
  Eye,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  FileText,
  RefreshCw,
  ChevronDown
} from 'lucide-react';

const SupplyHub = () => {
  useAuth(); // Keep for potential future use
  const { 
    selectedStoreId, 
    availableStores, 
    selectStore, 
    getSelectedStore 
  } = useStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateFilter, setDateFilter] = useState('today');
  const [loading, setLoading] = useState(false);
  const [supplyStores, setSupplyStores] = useState([]);
  const [orderData, setOrderData] = useState({
    today: { orders: [], totalAmount: 0, totalOrders: 0 },
    monthly: { orders: [], totalAmount: 0, totalOrders: 0 },
    yearly: { orders: [], totalAmount: 0, totalOrders: 0 }
  });
  const [paymentData, setPaymentData] = useState([]);
  const [billingData, setBillingData] = useState([]);
  const [analytics, setAnalytics] = useState({
    dailyTrend: [],
    monthlyTrend: [],
    topStores: [],
    paymentMethods: []
  });


  const loadSupplyHubData = useCallback(async () => {
    setLoading(true);
    try {
      // Load supply relationships (stores)
      try {
        const relationshipsResponse = await api.get('/supply-relationships');
        if (relationshipsResponse.data.success) {
          const stores = relationshipsResponse.data.data.map(rel => ({
            id: rel.customer_store.id,
            name: rel.customer_store.name,
            address: rel.customer_store.address,
            phone: rel.contact_phone || rel.customer_store.phone,
            email: rel.contact_email || rel.customer_store.email,
            status: rel.status,
            totalOrders: 0, // Will be calculated from orders
            totalAmount: 0, // Will be calculated from orders
            lastOrder: null // Will be calculated from orders
          }));
          setSupplyStores(stores);
        }
      } catch (error) {
        console.log('Supply relationships API not available, using mock data');
        // Use mock data if API is not available
        const mockStores = [
          {
            id: '1',
            name: 'Metro Medical Center',
            address: '123 Healthcare Boulevard, Mumbai',
            phone: '+91-22-1234-5678',
            email: 'metro@medical.com',
            status: 'active',
            totalOrders: 45,
            totalAmount: 12500.00,
            lastOrder: '2024-01-15'
          },
          {
            id: '2',
            name: 'City Health Pharmacy',
            address: '456 Wellness Street, Delhi',
            phone: '+91-11-2345-6789',
            email: 'city@healthpharmacy.com',
            status: 'active',
            totalOrders: 32,
            totalAmount: 8900.00,
            lastOrder: '2024-01-14'
          },
          {
            id: '3',
            name: 'Prime Care Medical Store',
            address: '789 Medical Plaza, Bangalore',
            phone: '+91-80-3456-7890',
            email: 'prime@caremedical.com',
            status: 'active',
            totalOrders: 28,
            totalAmount: 15600.00,
            lastOrder: '2024-01-13'
          },
          {
            id: '4',
            name: 'Wellness Plus Pharmacy',
            address: '321 Health Avenue, Chennai',
            phone: '+91-44-4567-8901',
            email: 'wellness@pluspharmacy.com',
            status: 'active',
            totalOrders: 41,
            totalAmount: 11200.00,
            lastOrder: '2024-01-12'
          },
          {
            id: '5',
            name: 'Family Health Store',
            address: '654 Care Center, Kolkata',
            phone: '+91-33-5678-9012',
            email: 'family@healthstore.com',
            status: 'active',
            totalOrders: 36,
            totalAmount: 9800.00,
            lastOrder: '2024-01-11'
          },
          {
            id: '6',
            name: 'Community Medical Hub',
            address: '987 Service Road, Hyderabad',
            phone: '+91-40-6789-0123',
            email: 'community@medicalhub.com',
            status: 'active',
            totalOrders: 52,
            totalAmount: 18900.00,
            lastOrder: '2024-01-10'
          },
          {
            id: '7',
            name: 'Downtown Pharmacy',
            address: '456 Broadway Street, New York',
            phone: '+1-555-0201',
            email: 'downtown@pharmacy.com',
            status: 'active',
            totalOrders: 38,
            totalAmount: 14200.00,
            lastOrder: '2024-01-09'
          },
          {
            id: '8',
            name: 'Westside Medical Store',
            address: '789 West Avenue, Los Angeles',
            phone: '+1-555-0301',
            email: 'westside@pharmacy.com',
            status: 'active',
            totalOrders: 29,
            totalAmount: 7600.00,
            lastOrder: '2024-01-08'
          },
          {
            id: '9',
            name: 'Central Health Pharmacy',
            address: '321 Central Plaza, Chicago',
            phone: '+1-555-0401',
            email: 'central@pharmacy.com',
            status: 'active',
            totalOrders: 44,
            totalAmount: 16800.00,
            lastOrder: '2024-01-07'
          },
          {
            id: '10',
            name: 'Main Medical Store',
            address: '123 Main St, City',
            phone: '+1-555-0123',
            email: 'main@medical.com',
            status: 'active',
            totalOrders: 67,
            totalAmount: 22500.00,
            lastOrder: '2024-01-06'
          }
        ];
        setSupplyStores(mockStores);
      }

      // Load supply orders based on date filter
      const today = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];

      let dateFrom, dateTo;
      switch (dateFilter) {
        case 'today':
          dateFrom = today;
          dateTo = today;
          break;
        case 'monthly':
          dateFrom = startOfMonth;
          dateTo = today;
          break;
        case 'yearly':
          dateFrom = startOfYear;
          dateTo = today;
          break;
        default:
          dateFrom = today;
          dateTo = today;
      }

      try {
        const ordersUrl = selectedStoreId === 'all' 
          ? `/supply-orders?date_from=${dateFrom}&date_to=${dateTo}`
          : `/supply-orders?date_from=${dateFrom}&date_to=${dateTo}&store_id=${selectedStoreId}`;
        const ordersResponse = await api.get(ordersUrl);
        if (ordersResponse.data.success) {
          const orders = ordersResponse.data.data.map(order => ({
            id: order.order_number,
            date: order.order_date.split('T')[0],
            store: order.customer_store?.name || 'Unknown Store',
            items: order.supply_order_items?.map(item => item.medicines?.name || 'Unknown Medicine') || [],
            quantities: order.supply_order_items?.map(item => item.quantity) || [],
            status: order.status,
            totalAmount: parseFloat(order.total_amount || 0),
            paymentId: order.supply_payments?.[0]?.payment_number || 'N/A',
            paymentMethod: order.supply_payments?.[0]?.payment_method || 'N/A',
            paymentStatus: order.supply_payments?.[0]?.status || 'N/A'
          }));

          const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
          
          setOrderData({
            [dateFilter]: {
              orders,
              totalAmount,
              totalOrders: orders.length
            }
          });
        }
      } catch (error) {
        console.log('Supply orders API not available, using mock data');
        // Use mock data if API is not available - create store-specific data
        const allMockOrders = [
          // Metro Medical Center (ID: 1) - 3 orders
          {
            id: 'ORD-001',
            date: new Date().toISOString().split('T')[0],
            store: 'Metro Medical Center',
            storeId: '1',
            items: ['Paracetamol 500mg', 'Amoxicillin 250mg', 'Vitamin D3 1000IU'],
            quantities: [100, 50, 200],
            status: 'delivered',
            totalAmount: 2850.00,
            paymentId: 'PAY-001',
            paymentMethod: 'UPI',
            paymentStatus: 'paid'
          },
          {
            id: 'ORD-011',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            store: 'Metro Medical Center',
            storeId: '1',
            items: ['Insulin Pen', 'Glucose Test Strips'],
            quantities: [25, 150],
            status: 'shipped',
            totalAmount: 3200.00,
            paymentId: 'PAY-011',
            paymentMethod: 'Card',
            paymentStatus: 'paid'
          },
          {
            id: 'ORD-012',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            store: 'Metro Medical Center',
            storeId: '1',
            items: ['Multivitamin Tablets'],
            quantities: [200],
            status: 'processing',
            totalAmount: 1200.00,
            paymentId: 'PAY-012',
            paymentMethod: 'Bank Transfer',
            paymentStatus: 'pending'
          },
          
          // City Health Pharmacy (ID: 2) - 3 orders
          {
            id: 'ORD-002',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            store: 'City Health Pharmacy',
            storeId: '2',
            items: ['Aspirin 100mg', 'Albuterol Inhaler'],
            quantities: [150, 25],
            status: 'shipped',
            totalAmount: 1890.00,
            paymentId: 'PAY-002',
            paymentMethod: 'Card',
            paymentStatus: 'paid'
          },
          {
            id: 'ORD-021',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            store: 'City Health Pharmacy',
            storeId: '2',
            items: ['Blood Pressure Monitor', 'Thermometer'],
            quantities: [5, 20],
            status: 'delivered',
            totalAmount: 4500.00,
            paymentId: 'PAY-021',
            paymentMethod: 'UPI',
            paymentStatus: 'paid'
          },
          {
            id: 'ORD-022',
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            store: 'City Health Pharmacy',
            storeId: '2',
            items: ['Cough Syrup', 'Antihistamine Tablets'],
            quantities: [80, 120],
            status: 'confirmed',
            totalAmount: 980.00,
            paymentId: 'PAY-022',
            paymentMethod: 'Cash',
            paymentStatus: 'paid'
          },
          
          // Prime Care Medical Store (ID: 3) - 2 orders
          {
            id: 'ORD-003',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            store: 'Prime Care Medical Store',
            storeId: '3',
            items: ['Metformin 500mg', 'Insulin Pen'],
            quantities: [80, 15],
            status: 'processing',
            totalAmount: 3200.00,
            paymentId: 'PAY-003',
            paymentMethod: 'Bank Transfer',
            paymentStatus: 'pending'
          },
          {
            id: 'ORD-031',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            store: 'Prime Care Medical Store',
            storeId: '3',
            items: ['Calcium Supplements', 'Vitamin D3 1000IU'],
            quantities: [100, 150],
            status: 'delivered',
            totalAmount: 2100.00,
            paymentId: 'PAY-031',
            paymentMethod: 'UPI',
            paymentStatus: 'paid'
          },
          
          // Wellness Plus Pharmacy (ID: 4) - 2 orders
          {
            id: 'ORD-004',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            store: 'Wellness Plus Pharmacy',
            storeId: '4',
            items: ['Multivitamin Tablets', 'Calcium Supplements'],
            quantities: [120, 90],
            status: 'confirmed',
            totalAmount: 1650.00,
            paymentId: 'PAY-004',
            paymentMethod: 'Cash',
            paymentStatus: 'paid'
          },
          {
            id: 'ORD-041',
            date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            store: 'Wellness Plus Pharmacy',
            storeId: '4',
            items: ['Protein Powder', 'Omega-3 Capsules'],
            quantities: [50, 80],
            status: 'delivered',
            totalAmount: 2800.00,
            paymentId: 'PAY-041',
            paymentMethod: 'Card',
            paymentStatus: 'paid'
          },
          
          // Family Health Store (ID: 5) - 2 orders
          {
            id: 'ORD-005',
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            store: 'Family Health Store',
            storeId: '5',
            items: ['Cough Syrup', 'Antihistamine Tablets'],
            quantities: [60, 100],
            status: 'delivered',
            totalAmount: 980.00,
            paymentId: 'PAY-005',
            paymentMethod: 'UPI',
            paymentStatus: 'paid'
          },
          {
            id: 'ORD-051',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            store: 'Family Health Store',
            storeId: '5',
            items: ['Children\'s Medicine', 'Pediatric Syrup'],
            quantities: [40, 60],
            status: 'shipped',
            totalAmount: 750.00,
            paymentId: 'PAY-051',
            paymentMethod: 'Cash',
            paymentStatus: 'paid'
          },
          
          // Community Medical Hub (ID: 6) - 2 orders
          {
            id: 'ORD-006',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            store: 'Community Medical Hub',
            storeId: '6',
            items: ['Blood Pressure Monitor', 'Glucose Test Strips'],
            quantities: [10, 200],
            status: 'delivered',
            totalAmount: 4200.00,
            paymentId: 'PAY-006',
            paymentMethod: 'Card',
            paymentStatus: 'paid'
          },
          {
            id: 'ORD-061',
            date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            store: 'Community Medical Hub',
            storeId: '6',
            items: ['Surgical Masks', 'Hand Sanitizer'],
            quantities: [500, 100],
            status: 'processing',
            totalAmount: 1500.00,
            paymentId: 'PAY-061',
            paymentMethod: 'UPI',
            paymentStatus: 'pending'
          }
        ];
        
        // Filter orders based on selected store
        let filteredOrders = allMockOrders;
        if (selectedStoreId !== 'all') {
          const selectedStore = getSelectedStore();
          if (selectedStore) {
            filteredOrders = allMockOrders.filter(order => order.storeId === selectedStoreId);
          }
        }
        
        const mockOrders = filteredOrders;
        
        setOrderData({
          [dateFilter]: {
            orders: mockOrders,
            totalAmount: mockOrders.reduce((sum, order) => sum + order.totalAmount, 0),
            totalOrders: mockOrders.length
          }
        });
      }

      // Load supply payments
      try {
        const paymentsUrl = selectedStoreId === 'all' 
          ? `/supply-payments?date_from=${dateFrom}&date_to=${dateTo}`
          : `/supply-payments?date_from=${dateFrom}&date_to=${dateTo}&store_id=${selectedStoreId}`;
        const paymentsResponse = await api.get(paymentsUrl);
        if (paymentsResponse.data.success) {
          const payments = paymentsResponse.data.data.map(payment => ({
            id: payment.payment_number,
            date: payment.payment_date.split('T')[0],
            amount: parseFloat(payment.amount || 0),
            method: payment.payment_method,
            status: payment.status,
            orderId: payment.supply_order?.order_number || 'N/A'
          }));
          setPaymentData(payments);
        }
      } catch (error) {
        console.log('Supply payments API not available, using mock data');
        // Use mock data if API is not available - create store-specific data
        const allMockPayments = [
          // Metro Medical Center (ID: 1) - 3 payments
          {
            id: 'PAY-001',
            date: new Date().toISOString().split('T')[0],
            amount: 2850.00,
            method: 'UPI',
            status: 'paid',
            orderId: 'ORD-001',
            storeId: '1'
          },
          {
            id: 'PAY-011',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: 3200.00,
            method: 'Card',
            status: 'paid',
            orderId: 'ORD-011',
            storeId: '1'
          },
          {
            id: 'PAY-012',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: 1200.00,
            method: 'Bank Transfer',
            status: 'pending',
            orderId: 'ORD-012',
            storeId: '1'
          },
          
          // City Health Pharmacy (ID: 2) - 3 payments
          {
            id: 'PAY-002',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: 1890.00,
            method: 'Card',
            status: 'paid',
            orderId: 'ORD-002',
            storeId: '2'
          },
          {
            id: 'PAY-021',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: 4500.00,
            method: 'UPI',
            status: 'paid',
            orderId: 'ORD-021',
            storeId: '2'
          },
          {
            id: 'PAY-022',
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: 980.00,
            method: 'Cash',
            status: 'paid',
            orderId: 'ORD-022',
            storeId: '2'
          },
          
          // Prime Care Medical Store (ID: 3) - 2 payments
          {
            id: 'PAY-003',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: 3200.00,
            method: 'Bank Transfer',
            status: 'pending',
            orderId: 'ORD-003',
            storeId: '3'
          },
          {
            id: 'PAY-031',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: 2100.00,
            method: 'UPI',
            status: 'paid',
            orderId: 'ORD-031',
            storeId: '3'
          },
          
          // Wellness Plus Pharmacy (ID: 4) - 2 payments
          {
            id: 'PAY-004',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: 1650.00,
            method: 'Cash',
            status: 'paid',
            orderId: 'ORD-004',
            storeId: '4'
          },
          {
            id: 'PAY-041',
            date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: 2800.00,
            method: 'Card',
            status: 'paid',
            orderId: 'ORD-041',
            storeId: '4'
          },
          
          // Family Health Store (ID: 5) - 2 payments
          {
            id: 'PAY-005',
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: 980.00,
            method: 'UPI',
            status: 'paid',
            orderId: 'ORD-005',
            storeId: '5'
          },
          {
            id: 'PAY-051',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: 750.00,
            method: 'Cash',
            status: 'paid',
            orderId: 'ORD-051',
            storeId: '5'
          },
          
          // Community Medical Hub (ID: 6) - 2 payments
          {
            id: 'PAY-006',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: 4200.00,
            method: 'Card',
            status: 'paid',
            orderId: 'ORD-006',
            storeId: '6'
          },
          {
            id: 'PAY-061',
            date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: 1500.00,
            method: 'UPI',
            status: 'pending',
            orderId: 'ORD-061',
            storeId: '6'
          }
        ];
        
        // Filter payments based on selected store
        let filteredPayments = allMockPayments;
        if (selectedStoreId !== 'all') {
          filteredPayments = allMockPayments.filter(payment => payment.storeId === selectedStoreId);
        }
        
        const mockPayments = filteredPayments;
        setPaymentData(mockPayments);
      }

      // Load billing data
      try {
        const billingUrl = selectedStoreId === 'all' 
          ? `/billing?date_from=${dateFrom}&date_to=${dateTo}`
          : `/billing?date_from=${dateFrom}&date_to=${dateTo}&store_id=${selectedStoreId}`;
        const billingResponse = await api.get(billingUrl);
        if (billingResponse.data.success) {
          const billing = billingResponse.data.data.map(bill => ({
            id: bill.invoice_number,
            date: bill.created_at.split('T')[0],
            customerName: bill.customer_name,
            customerEmail: bill.customer_email,
            subtotal: parseFloat(bill.subtotal || 0),
            taxAmount: parseFloat(bill.tax_amount || 0),
            discountAmount: parseFloat(bill.discount_amount || 0),
            totalAmount: parseFloat(bill.total_amount || 0),
            paymentStatus: bill.payment_status,
            dueDate: bill.due_date,
            orderId: bill.order_id
          }));
          setBillingData(billing);
        }
      } catch (error) {
        console.log('Billing API not available, using mock data');
        // Use mock data if API is not available - create store-specific data
        const allMockBilling = [
          // Metro Medical Center (ID: 1) - 3 invoices
          {
            id: 'INV-001',
            date: new Date().toISOString().split('T')[0],
            customerName: 'Metro Medical Center',
            customerEmail: 'metro@medical.com',
            subtotal: 2500.00,
            taxAmount: 200.00,
            discountAmount: 250.00,
            totalAmount: 2450.00,
            paymentStatus: 'paid',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            orderId: 'ORD-001',
            storeId: '1'
          },
          {
            id: 'INV-011',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            customerName: 'Metro Medical Center',
            customerEmail: 'metro@medical.com',
            subtotal: 2800.00,
            taxAmount: 224.00,
            discountAmount: 280.00,
            totalAmount: 2744.00,
            paymentStatus: 'paid',
            dueDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            orderId: 'ORD-011',
            storeId: '1'
          },
          {
            id: 'INV-012',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            customerName: 'Metro Medical Center',
            customerEmail: 'metro@medical.com',
            subtotal: 1000.00,
            taxAmount: 80.00,
            discountAmount: 100.00,
            totalAmount: 980.00,
            paymentStatus: 'pending',
            dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            orderId: 'ORD-012',
            storeId: '1'
          },
          
          // City Health Pharmacy (ID: 2) - 3 invoices
          {
            id: 'INV-002',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            customerName: 'City Health Pharmacy',
            customerEmail: 'city@healthpharmacy.com',
            subtotal: 1800.00,
            taxAmount: 144.00,
            discountAmount: 180.00,
            totalAmount: 1764.00,
            paymentStatus: 'paid',
            dueDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            orderId: 'ORD-002',
            storeId: '2'
          },
          {
            id: 'INV-021',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            customerName: 'City Health Pharmacy',
            customerEmail: 'city@healthpharmacy.com',
            subtotal: 4000.00,
            taxAmount: 320.00,
            discountAmount: 400.00,
            totalAmount: 3920.00,
            paymentStatus: 'paid',
            dueDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            orderId: 'ORD-021',
            storeId: '2'
          },
          {
            id: 'INV-022',
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            customerName: 'City Health Pharmacy',
            customerEmail: 'city@healthpharmacy.com',
            subtotal: 850.00,
            taxAmount: 68.00,
            discountAmount: 85.00,
            totalAmount: 833.00,
            paymentStatus: 'paid',
            dueDate: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            orderId: 'ORD-022',
            storeId: '2'
          },
          
          // Prime Care Medical Store (ID: 3) - 2 invoices
          {
            id: 'INV-003',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            customerName: 'Prime Care Medical Store',
            customerEmail: 'prime@caremedical.com',
            subtotal: 2800.00,
            taxAmount: 224.00,
            discountAmount: 280.00,
            totalAmount: 2744.00,
            paymentStatus: 'pending',
            dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            orderId: 'ORD-003',
            storeId: '3'
          },
          {
            id: 'INV-031',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            customerName: 'Prime Care Medical Store',
            customerEmail: 'prime@caremedical.com',
            subtotal: 1900.00,
            taxAmount: 152.00,
            discountAmount: 190.00,
            totalAmount: 1862.00,
            paymentStatus: 'paid',
            dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            orderId: 'ORD-031',
            storeId: '3'
          },
          
          // Wellness Plus Pharmacy (ID: 4) - 2 invoices
          {
            id: 'INV-004',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            customerName: 'Wellness Plus Pharmacy',
            customerEmail: 'wellness@pluspharmacy.com',
            subtotal: 1500.00,
            taxAmount: 120.00,
            discountAmount: 150.00,
            totalAmount: 1470.00,
            paymentStatus: 'paid',
            dueDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            orderId: 'ORD-004',
            storeId: '4'
          },
          {
            id: 'INV-041',
            date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            customerName: 'Wellness Plus Pharmacy',
            customerEmail: 'wellness@pluspharmacy.com',
            subtotal: 2500.00,
            taxAmount: 200.00,
            discountAmount: 250.00,
            totalAmount: 2450.00,
            paymentStatus: 'paid',
            dueDate: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            orderId: 'ORD-041',
            storeId: '4'
          },
          
          // Family Health Store (ID: 5) - 2 invoices
          {
            id: 'INV-005',
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            customerName: 'Family Health Store',
            customerEmail: 'family@healthstore.com',
            subtotal: 900.00,
            taxAmount: 72.00,
            discountAmount: 90.00,
            totalAmount: 882.00,
            paymentStatus: 'paid',
            dueDate: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            orderId: 'ORD-005',
            storeId: '5'
          },
          {
            id: 'INV-051',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            customerName: 'Family Health Store',
            customerEmail: 'family@healthstore.com',
            subtotal: 650.00,
            taxAmount: 52.00,
            discountAmount: 65.00,
            totalAmount: 637.00,
            paymentStatus: 'paid',
            dueDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            orderId: 'ORD-051',
            storeId: '5'
          },
          
          // Community Medical Hub (ID: 6) - 2 invoices
          {
            id: 'INV-006',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            customerName: 'Community Medical Hub',
            customerEmail: 'community@medicalhub.com',
            subtotal: 4000.00,
            taxAmount: 320.00,
            discountAmount: 400.00,
            totalAmount: 3920.00,
            paymentStatus: 'paid',
            dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            orderId: 'ORD-006',
            storeId: '6'
          },
          {
            id: 'INV-061',
            date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            customerName: 'Community Medical Hub',
            customerEmail: 'community@medicalhub.com',
            subtotal: 1300.00,
            taxAmount: 104.00,
            discountAmount: 130.00,
            totalAmount: 1274.00,
            paymentStatus: 'pending',
            dueDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            orderId: 'ORD-061',
            storeId: '6'
          }
        ];
        
        // Filter billing based on selected store
        let filteredBilling = allMockBilling;
        if (selectedStoreId !== 'all') {
          filteredBilling = allMockBilling.filter(bill => bill.storeId === selectedStoreId);
        }
        
        const mockBilling = filteredBilling;
        setBillingData(mockBilling);
      }

      // Load analytics
      try {
        const analyticsUrl = selectedStoreId === 'all' 
          ? `/supply-orders/analytics?period=${dateFilter}`
          : `/supply-orders/analytics?period=${dateFilter}&store_id=${selectedStoreId}`;
        const analyticsResponse = await api.get(analyticsUrl);
        if (analyticsResponse.data.success) {
          setAnalytics(analyticsResponse.data.data);
        }
      } catch (error) {
        console.log('Analytics API not available, using mock data');
        // Use mock analytics data
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        setAnalytics({
          dailyTrend: [
            { date: fiveDaysAgo, amount: 4200, orders: 1 },
            { date: fourDaysAgo, amount: 980, orders: 1 },
            { date: threeDaysAgo, amount: 1650, orders: 1 },
            { date: twoDaysAgo, amount: 3200, orders: 1 },
            { date: yesterday, amount: 1890, orders: 1 },
            { date: today, amount: 2850, orders: 1 }
          ],
          monthlyTrend: [
            { month: 'Jan', amount: 45000, orders: 25 },
            { month: 'Feb', amount: 52000, orders: 28 },
            { month: 'Mar', amount: 48000, orders: 26 },
            { month: 'Apr', amount: 55000, orders: 30 },
            { month: 'May', amount: 60000, orders: 32 },
            { month: 'Jun', amount: 58000, orders: 31 }
          ],
          methodAmounts: {
            'UPI': 5600,
            'Card': 6090,
            'Cash': 1650,
            'Bank Transfer': 3200,
            'Cheque': 1500
          },
          topStores: [
            { storeId: '6', storeName: 'Community Medical Hub', orders: 1, amount: 4200 },
            { storeId: '3', storeName: 'Prime Care Medical Store', orders: 1, amount: 3200 },
            { storeId: '1', storeName: 'Metro Medical Center', orders: 1, amount: 2850 },
            { storeId: '2', storeName: 'City Health Pharmacy', orders: 1, amount: 1890 },
            { storeId: '4', storeName: 'Wellness Plus Pharmacy', orders: 1, amount: 1650 }
          ],
          paymentMethods: [
            { method: 'UPI', count: 3, amount: 5600 },
            { method: 'Card', count: 2, amount: 6090 },
            { method: 'Cash', count: 1, amount: 1650 },
            { method: 'Bank Transfer', count: 1, amount: 3200 },
            { method: 'Cheque', count: 1, amount: 1500 }
          ]
        });
      }

    } catch (error) {
      console.error('Error loading supply hub data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, selectedStoreId]);

  useEffect(() => {
    loadSupplyHubData();
  }, [loadSupplyHubData]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToCSV = () => {
    const currentData = orderData[dateFilter];
    const csvContent = [
      ['Order ID', 'Date', 'Store', 'Items', 'Quantities', 'Status', 'Total Amount', 'Payment ID', 'Payment Method', 'Payment Status'],
      ...currentData.orders.map(order => [
        order.id,
        order.date,
        order.store,
        order.items.join('; '),
        order.quantities.join('; '),
        order.status,
        order.totalAmount,
        order.paymentId,
        order.paymentMethod,
        order.paymentStatus
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supply-orders-${dateFilter}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const currentData = orderData[dateFilter];
    const selectedStore = getSelectedStore();
    const storeName = selectedStore ? selectedStore.name : 'All Stores';
    
    // Set up the document
    doc.setFontSize(20);
    doc.text('Supply Hub Report', 20, 30);
    
    // Add report details
    doc.setFontSize(12);
    doc.text(`Store: ${storeName}`, 20, 50);
    doc.text(`Period: ${dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)}`, 20, 60);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 70);
    
    // Add summary statistics
    doc.setFontSize(14);
    doc.text('Summary', 20, 90);
    doc.setFontSize(10);
    doc.text(`Total Orders: ${currentData.totalOrders}`, 20, 100);
    doc.text(`Total Revenue: ₹${currentData.totalAmount.toLocaleString()}`, 20, 110);
    doc.text(`Connected Stores: ${supplyStores.length}`, 20, 120);
    
    // Add orders table
    if (currentData.orders.length > 0) {
      doc.setFontSize(14);
      doc.text('Recent Orders', 20, 140);
      
      // Table headers
      doc.setFontSize(8);
      doc.text('Order ID', 20, 150);
      doc.text('Date', 50, 150);
      doc.text('Store', 80, 150);
      doc.text('Status', 120, 150);
      doc.text('Amount', 150, 150);
      
      // Table data
      let yPosition = 160;
      currentData.orders.slice(0, 10).forEach((order, index) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.text(order.id, 20, yPosition);
        doc.text(order.date, 50, yPosition);
        doc.text(order.store.length > 15 ? order.store.substring(0, 15) + '...' : order.store, 80, yPosition);
        doc.text(order.status, 120, yPosition);
        doc.text(`₹${order.totalAmount}`, 150, yPosition);
        yPosition += 10;
      });
    }
    
    // Add supply stores information
    if (supplyStores.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Supply Stores', 20, 30);
      
      doc.setFontSize(8);
      let yPos = 50;
      supplyStores.forEach((store, index) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.text(`${store.name}`, 20, yPos);
        doc.text(`Status: ${store.status}`, 20, yPos + 8);
        doc.text(`Orders: ${store.totalOrders || 0}`, 20, yPos + 16);
        yPos += 30;
      });
    }
    
    // Save the PDF
    const fileName = `supply-hub-report-${dateFilter}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'orders', name: 'Orders', icon: Package },
    { id: 'payments', name: 'Payments', icon: DollarSign },
    { id: 'billing', name: 'Billing', icon: FileText },
    { id: 'stores', name: 'Supply Stores', icon: Store },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp }
  ];

  const currentData = orderData[dateFilter];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Supply Hub</h1>
                <p className="text-gray-600">Manage your supply relationships and track orders</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadSupplyHubData}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {selectedStoreId === 'all' ? 'Total Supply Stores' : 'Connected Stores'}
                </p>
                <p className="text-2xl font-bold text-gray-900">{supplyStores.length}</p>
                {selectedStoreId !== 'all' && (
                  <p className="text-xs text-gray-500 mt-1">
                    {getSelectedStore()?.name || 'Selected Store'}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Store className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {dateFilter === 'today' ? 'Today\'s Orders' : 
                   dateFilter === 'monthly' ? 'This Month\'s Orders' : 'This Year\'s Orders'}
                </p>
                <p className="text-2xl font-bold text-gray-900">{currentData.totalOrders}</p>
                {selectedStoreId !== 'all' && (
                  <p className="text-xs text-gray-500 mt-1">
                    {getSelectedStore()?.name || 'Selected Store'}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {dateFilter === 'today' ? 'Today\'s Revenue' : 
                   dateFilter === 'monthly' ? 'This Month\'s Revenue' : 'This Year\'s Revenue'}
                </p>
                <p className="text-2xl font-bold text-gray-900">₹{currentData.totalAmount.toLocaleString()}</p>
                {selectedStoreId !== 'all' && (
                  <p className="text-xs text-gray-500 mt-1">
                    {getSelectedStore()?.name || 'Selected Store'}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Stores</p>
                <p className="text-2xl font-bold text-gray-900">
                  {supplyStores.filter(store => store.status === 'active').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Store Selection, Date Filter and Export Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <StoreSelector className="min-w-[200px]" />
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Period:</span>
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="monthly">This Month</option>
              <option value="yearly">This Year</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
                <div className="space-y-3">
                  {currentData.orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(order.status)}
                        <div>
                          <p className="font-medium text-gray-900">{order.id}</p>
                          <p className="text-sm text-gray-600">{order.store}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{order.totalAmount.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">{order.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Supply Stores Status</h3>
                <div className="space-y-3">
                  {supplyStores.map((store) => (
                    <div key={store.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{store.name}</p>
                        <p className="text-sm text-gray-600">{store.address}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(store.status)}`}>
                          {store.status}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">{store.totalOrders} orders</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantities</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.store}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-xs truncate">
                          {order.items.join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.quantities.join(', ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{order.totalAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentData.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{payment.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.method}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          <span className="ml-1">{payment.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.orderId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Billing Information</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billingData.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bill.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bill.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="font-medium text-gray-900">{bill.customerName}</div>
                          <div className="text-xs text-gray-500">{bill.customerEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{bill.subtotal.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{bill.taxAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{bill.discountAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{bill.totalAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bill.paymentStatus)}`}>
                          {getStatusIcon(bill.paymentStatus)}
                          <span className="ml-1">{bill.paymentStatus}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bill.dueDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bill.orderId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'stores' && (
          <div className="space-y-6">
            {selectedStoreId === 'all' ? (
              // Show all stores in grid view
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {supplyStores.map((store) => (
                  <div key={store.id} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow cursor-pointer"
                       onClick={() => selectStore(store.id)}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                          <Store className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{store.name}</h3>
                          <p className="text-sm text-gray-600">{store.address}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(store.status)}`}>
                        {store.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Phone:</span>
                        <span className="text-sm font-medium text-gray-900">{store.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Email:</span>
                        <span className="text-sm font-medium text-gray-900">{store.email}</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Total Orders</p>
                          <p className="text-lg font-semibold text-gray-900">{store.totalOrders}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Amount</p>
                          <p className="text-lg font-semibold text-gray-900">₹{store.totalAmount.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">Last Order</p>
                        <p className="text-sm font-medium text-gray-900">{store.lastOrder}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Show detailed information for selected store
              <div className="space-y-6">
                {(() => {
                  const selectedStore = getSelectedStore();
                  if (!selectedStore) return null;
                  
                  // Filter data for selected store
                  const storeOrders = currentData.orders.filter(order => order.store === selectedStore.name);
                  const storePayments = paymentData.filter(payment => 
                    storeOrders.some(order => order.paymentId === payment.id)
                  );
                  const storeBilling = billingData.filter(bill => 
                    storeOrders.some(order => order.id === bill.orderId)
                  );
                  
                  return (
                    <>
                      {/* Store Header */}
                      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
                              <Store className="h-8 w-8 text-white" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold text-gray-900">{selectedStore.name}</h2>
                              <p className="text-gray-600">{selectedStore.address}</p>
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="text-sm text-gray-600">
                                  <strong>Phone:</strong> {selectedStore.phone}
                                </span>
                                <span className="text-sm text-gray-600">
                                  <strong>Email:</strong> {selectedStore.email}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedStore.status)}`}>
                              {selectedStore.status}
                            </span>
                            <p className="text-sm text-gray-600 mt-2">Store ID: {selectedStore.id}</p>
                          </div>
                        </div>
                        
                        {/* Store Statistics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-blue-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">{selectedStore.totalOrders}</div>
                            <div className="text-sm text-blue-800">Total Orders</div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">₹{selectedStore.totalAmount.toLocaleString()}</div>
                            <div className="text-sm text-green-800">Total Revenue</div>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-purple-600">{storeOrders.length}</div>
                            <div className="text-sm text-purple-800">Period Orders</div>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-orange-600">{selectedStore.lastOrder}</div>
                            <div className="text-sm text-orange-800">Last Order</div>
                          </div>
                        </div>
                      </div>

                      {/* Store Orders */}
                      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900">Recent Orders for {selectedStore.name}</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {storeOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                                  <td className="px-6 py-4 text-sm text-gray-500">
                                    <div className="max-w-xs">
                                      {order.items.join(', ')}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                      {getStatusIcon(order.status)}
                                      <span className="ml-1">{order.status}</span>
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{order.totalAmount.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Store Payments */}
                      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900">Payment History for {selectedStore.name}</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {storePayments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.id}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.date}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{payment.amount.toLocaleString()}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.method}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                      {getStatusIcon(payment.status)}
                                      <span className="ml-1">{payment.status}</span>
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Store Billing */}
                      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900">Billing Information for {selectedStore.name}</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {storeBilling.map((bill) => (
                                <tr key={bill.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bill.id}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bill.date}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{bill.subtotal.toLocaleString()}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{bill.taxAmount.toLocaleString()}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{bill.discountAmount.toLocaleString()}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{bill.totalAmount.toLocaleString()}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bill.paymentStatus)}`}>
                                      {getStatusIcon(bill.paymentStatus)}
                                      <span className="ml-1">{bill.paymentStatus}</span>
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bill.dueDate}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimpleChart
                data={analytics.dailyTrend?.map(item => ({
                  label: item.date,
                  value: item.amount || item.orders || 0
                })) || []}
                type="line"
                title="Sales Trend (Daily)"
                height={300}
              />

              <SimpleChart
                data={Object.entries(analytics.methodAmounts || {}).map(([method, amount]) => ({
                  label: method.replace('_', ' ').toUpperCase(),
                  value: amount
                }))}
                type="pie"
                title="Payment Methods Distribution"
                height={300}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimpleChart
                data={analytics.topStores?.slice(0, 10).map(store => ({
                  label: store.storeId,
                  value: store.orders
                })) || []}
                type="bar"
                title="Top Stores by Orders"
                height={250}
              />

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics.totalOrders || 0}
                    </div>
                    <div className="text-sm text-blue-800">Total Orders</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ₹{(analytics.totalAmount || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-green-800">Total Amount</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      ₹{(analytics.averageOrderValue || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-yellow-800">Avg Order Value</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {analytics.totalCommission || 0}
                    </div>
                    <div className="text-sm text-purple-800">Total Commission</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-gray-700">Loading supply hub data...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplyHub;
