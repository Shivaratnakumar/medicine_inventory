const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics
// @access  Private
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // Get total counts
    const [
      { count: totalMedicines },
      { count: totalOrders },
      { count: activeStores },
      { count: expiringSoon }
    ] = await Promise.all([
      supabaseAdmin.from('medicines').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('stores').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('medicines').select('*', { count: 'exact', head: true }).eq('is_active', true).lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    ]);

    // Get low stock medicines and count them
    const { data: lowStockMedicines } = await supabaseAdmin
      .from('medicines')
      .select('id, name, quantity_in_stock, minimum_stock_level')
      .eq('is_active', true);
    
    const lowStockItems = lowStockMedicines?.filter(medicine => 
      medicine.quantity_in_stock <= medicine.minimum_stock_level
    ).length || 0;

    // Get total revenue
    const { data: revenueData } = await supabaseAdmin
      .from('billing')
      .select('total_amount')
      .eq('payment_status', 'paid');

    const totalRevenue = revenueData?.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0) || 0;

    // Get recent orders
    const { data: recentOrders } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        customer_name,
        total_amount,
        status,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get low stock medicines (filter from the data we already have)
    const lowStockMedicinesList = lowStockMedicines?.filter(medicine => 
      medicine.quantity_in_stock <= medicine.minimum_stock_level
    ).slice(0, 5) || [];

    res.json({
      success: true,
      data: {
        totalMedicines,
        totalOrders,
        totalRevenue,
        activeStores,
        lowStockItems,
        expiringSoon,
        recentOrders,
        lowStockMedicines: lowStockMedicinesList
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard analytics'
    });
  }
});

// @route   GET /api/analytics/sales
// @desc    Get sales analytics
// @access  Private
router.get('/sales', authenticateToken, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get sales data grouped by day
    const { data: salesData } = await supabaseAdmin
      .from('billing')
      .select(`
        total_amount,
        created_at,
        payment_status
      `)
      .eq('payment_status', 'paid')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Group by day
    const dailySales = {};
    salesData?.forEach(sale => {
      const date = new Date(sale.created_at).toISOString().split('T')[0];
      if (!dailySales[date]) {
        dailySales[date] = { date, sales: 0, orders: 0 };
      }
      dailySales[date].sales += parseFloat(sale.total_amount || 0);
      dailySales[date].orders += 1;
    });

    const chartData = Object.values(dailySales).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching sales analytics'
    });
  }
});

// @route   GET /api/analytics/inventory
// @desc    Get inventory analytics
// @access  Private
router.get('/inventory', authenticateToken, async (req, res) => {
  try {
    // Get category distribution
    const { data: categoryData } = await supabaseAdmin
      .from('medicines')
      .select(`
        categories(name),
        id
      `)
      .eq('is_active', true);

    const categoryCount = {};
    categoryData?.forEach(medicine => {
      const category = medicine.categories?.name || 'Other';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const categoryDistribution = Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value,
      color: getCategoryColor(name)
    }));

    // Get stock status distribution
    const { data: stockData } = await supabaseAdmin
      .from('medicines')
      .select('quantity_in_stock, minimum_stock_level')
      .eq('is_active', true);

    let inStock = 0, lowStock = 0, outOfStock = 0;
    stockData?.forEach(medicine => {
      if (medicine.quantity_in_stock === 0) {
        outOfStock++;
      } else if (medicine.quantity_in_stock <= medicine.minimum_stock_level) {
        lowStock++;
      } else {
        inStock++;
      }
    });

    const stockDistribution = [
      { name: 'In Stock', value: inStock, color: '#10b981' },
      { name: 'Low Stock', value: lowStock, color: '#f59e0b' },
      { name: 'Out of Stock', value: outOfStock, color: '#ef4444' }
    ];

    res.json({
      success: true,
      data: {
        categoryDistribution,
        stockDistribution
      }
    });
  } catch (error) {
    console.error('Inventory analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching inventory analytics'
    });
  }
});

// @route   GET /api/analytics/expiry
// @desc    Get expiry analytics
// @access  Private
router.get('/expiry', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      { data: expired },
      { data: expiringThisWeek },
      { data: expiringThisMonth },
      { data: expiringNextMonth }
    ] = await Promise.all([
      supabaseAdmin
        .from('medicines')
        .select('id, name, expiry_date')
        .eq('is_active', true)
        .lt('expiry_date', today.toISOString().split('T')[0]),
      supabaseAdmin
        .from('medicines')
        .select('id, name, expiry_date')
        .eq('is_active', true)
        .gte('expiry_date', today.toISOString().split('T')[0])
        .lte('expiry_date', nextWeek.toISOString().split('T')[0]),
      supabaseAdmin
        .from('medicines')
        .select('id, name, expiry_date')
        .eq('is_active', true)
        .gte('expiry_date', nextWeek.toISOString().split('T')[0])
        .lte('expiry_date', nextMonth.toISOString().split('T')[0]),
      supabaseAdmin
        .from('medicines')
        .select('id, name, expiry_date')
        .eq('is_active', true)
        .gte('expiry_date', nextMonth.toISOString().split('T')[0])
        .lte('expiry_date', new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    ]);

    const expiryData = [
      { name: 'Expired', count: expired?.length || 0, color: '#ef4444' },
      { name: 'This Week', count: expiringThisWeek?.length || 0, color: '#f59e0b' },
      { name: 'This Month', count: expiringThisMonth?.length || 0, color: '#3b82f6' },
      { name: 'Next Month', count: expiringNextMonth?.length || 0, color: '#10b981' }
    ];

    res.json({
      success: true,
      data: {
        summary: expiryData,
        expired: expired || [],
        expiringThisWeek: expiringThisWeek || [],
        expiringThisMonth: expiringThisMonth || [],
        expiringNextMonth: expiringNextMonth || []
      }
    });
  } catch (error) {
    console.error('Expiry analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching expiry analytics'
    });
  }
});

// @route   GET /api/analytics/low-stock
// @desc    Get low stock analytics
// @access  Private
router.get('/low-stock', authenticateToken, async (req, res) => {
  try {
    const { data: allMedicines } = await supabaseAdmin
      .from('medicines')
      .select(`
        id,
        name,
        sku,
        quantity_in_stock,
        minimum_stock_level,
        maximum_stock_level,
        price,
        categories(name)
      `)
      .eq('is_active', true)
      .order('quantity_in_stock', { ascending: true });

    const lowStockMedicines = allMedicines?.filter(medicine => 
      medicine.quantity_in_stock <= medicine.minimum_stock_level
    ) || [];

    // Calculate restock suggestions
    const restockSuggestions = lowStockMedicines?.map(medicine => ({
      ...medicine,
      suggested_quantity: Math.max(
        medicine.minimum_stock_level * 2,
        medicine.maximum_stock_level - medicine.quantity_in_stock
      ),
      urgency: medicine.quantity_in_stock === 0 ? 'critical' : 
               medicine.quantity_in_stock <= medicine.minimum_stock_level / 2 ? 'high' : 'medium'
    }));

    res.json({
      success: true,
      data: {
        medicines: restockSuggestions || [],
        total: lowStockMedicines?.length || 0,
        critical: restockSuggestions?.filter(m => m.urgency === 'critical').length || 0,
        high: restockSuggestions?.filter(m => m.urgency === 'high').length || 0,
        medium: restockSuggestions?.filter(m => m.urgency === 'medium').length || 0
      }
    });
  } catch (error) {
    console.error('Low stock analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching low stock analytics'
    });
  }
});

// Helper function to get category colors
function getCategoryColor(category) {
  const colors = {
    'Antibiotics': '#3b82f6',
    'Pain Relief': '#10b981',
    'Cardiovascular': '#f59e0b',
    'Diabetes': '#ef4444',
    'Respiratory': '#8b5cf6',
    'Digestive': '#06b6d4',
    'Vitamins': '#84cc16',
    'Topical': '#f97316',
    'Eye Care': '#ec4899',
    'Other': '#6b7280'
  };
  return colors[category] || '#6b7280';
}

module.exports = router;
