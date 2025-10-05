const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const medicineValidation = [
  body('name').trim().isLength({ min: 1 }).withMessage('Medicine name is required'),
  body('sku').trim().isLength({ min: 1 }).withMessage('SKU is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('cost_price').isFloat({ min: 0 }).withMessage('Cost price must be a positive number'),
  body('quantity_in_stock').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('expiry_date').isISO8601().withMessage('Valid expiry date is required'),
  body('minimum_stock_level').optional().isInt({ min: 0 }).withMessage('Minimum stock level must be a non-negative integer'),
  body('maximum_stock_level').optional().isInt({ min: 0 }).withMessage('Maximum stock level must be a non-negative integer'),
];

// @route   GET /api/medicines
// @desc    Get all medicines with filters
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      search, 
      category, 
      expiry, 
      low_stock, 
      page = 1, 
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    let query = supabaseAdmin
      .from('medicines')
      .select(`
        *,
        categories(name)
      `)
      .eq('is_active', true);

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,generic_name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    // Apply category filter
    if (category) {
      query = query.eq('category_id', category);
    }

    // Apply expiry filter
    if (expiry === 'expired') {
      query = query.lt('expiry_date', new Date().toISOString().split('T')[0]);
    } else if (expiry === 'expiring') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      query = query
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0]);
    }

    // Apply low stock filter
    if (low_stock === 'true') {
      query = query.lte('quantity_in_stock', 'minimum_stock_level');
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: medicines, error, count } = await query;

    if (error) {
      console.error('Error fetching medicines:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching medicines'
      });
    }

    res.json({
      success: true,
      data: medicines,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Medicines fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching medicines'
    });
  }
});

// @route   GET /api/medicines/search
// @desc    Search medicines
// @access  Private
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const { data: medicines, error } = await supabaseAdmin
      .from('medicines')
      .select(`
        *,
        categories(name)
      `)
      .eq('is_active', true)
      .or(`name.ilike.%${q}%,generic_name.ilike.%${q}%,sku.ilike.%${q}%`)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error searching medicines:', error);
      return res.status(500).json({
        success: false,
        message: 'Error searching medicines'
      });
    }

    res.json({
      success: true,
      data: medicines
    });
  } catch (error) {
    console.error('Medicine search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching medicines'
    });
  }
});

// @route   GET /api/medicines/low-stock
// @desc    Get low stock medicines
// @access  Private
router.get('/low-stock', authenticateToken, async (req, res) => {
  try {
    // Get all medicines and filter in JavaScript
    const { data: allMedicines, error } = await supabaseAdmin
      .from('medicines')
      .select(`
        *,
        categories(name)
      `)
      .eq('is_active', true);

    if (error) {
      console.error('Low stock medicines error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching low stock medicines'
      });
    }

    const lowStockMedicines = allMedicines.filter(medicine =>
      medicine.quantity_in_stock <= medicine.minimum_stock_level
    );

    res.json({
      success: true,
      data: lowStockMedicines
    });
  } catch (error) {
    console.error('Low stock medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching low stock medicines'
    });
  }
});

// @route   GET /api/medicines/expiring
// @desc    Get expiring medicines
// @access  Private
router.get('/expiring', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const today = new Date().toISOString().split('T')[0];
    
    let query = supabaseAdmin
      .from('medicines')
      .select(`
        *,
        categories(name)
      `)
      .eq('is_active', true);

    // Handle different cases based on days parameter
    if (parseInt(days) === 0) {
      // Get expired medicines (expiry date before today)
      query = query.lt('expiry_date', today);
    } else {
      // Get medicines expiring within specified days
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(days));
      query = query
        .gte('expiry_date', today)
        .lte('expiry_date', expiryDate.toISOString().split('T')[0]);
    }

    const { data: medicines, error } = await query.order('expiry_date', { ascending: true });

    if (error) {
      console.error('Expiring medicines error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching expiring medicines'
      });
    }

    res.json({
      success: true,
      data: medicines
    });
  } catch (error) {
    console.error('Expiring medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching expiring medicines'
    });
  }
});

// @route   GET /api/medicines/:id
// @desc    Get medicine by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: medicine, error } = await supabaseAdmin
      .from('medicines')
      .select(`
        *,
        categories(name)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching medicine:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching medicine'
      });
    }

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.json({
      success: true,
      data: medicine
    });
  } catch (error) {
    console.error('Medicine fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching medicine'
    });
  }
});

// @route   POST /api/medicines
// @desc    Create new medicine
// @access  Private (Admin only)
router.post('/', authenticateToken, requireAdmin, medicineValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { data: medicine, error } = await supabaseAdmin
      .from('medicines')
      .insert(req.body)
      .select(`
        *,
        categories(name)
      `)
      .single();

    if (error) {
      console.error('Error creating medicine:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating medicine'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Medicine created successfully',
      data: medicine
    });
  } catch (error) {
    console.error('Medicine creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating medicine'
    });
  }
});

// @route   PUT /api/medicines/:id
// @desc    Update medicine
// @access  Private (Admin only)
router.put('/:id', authenticateToken, requireAdmin, medicineValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;

    const { data: medicine, error } = await supabaseAdmin
      .from('medicines')
      .update(req.body)
      .eq('id', id)
      .select(`
        *,
        categories(name)
      `)
      .single();

    if (error) {
      console.error('Error updating medicine:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating medicine'
      });
    }

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.json({
      success: true,
      message: 'Medicine updated successfully',
      data: medicine
    });
  } catch (error) {
    console.error('Medicine update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating medicine'
    });
  }
});

// @route   DELETE /api/medicines/:id
// @desc    Delete medicine (soft delete)
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: medicine, error } = await supabaseAdmin
      .from('medicines')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting medicine:', error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting medicine'
      });
    }

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (error) {
    console.error('Medicine deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting medicine'
    });
  }
});

module.exports = router;
