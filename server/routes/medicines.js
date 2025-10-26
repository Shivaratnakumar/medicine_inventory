const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const medicineValidation = [
  body('name').trim().isLength({ min: 1 }).withMessage('Medicine name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('expiry_date').isISO8601().withMessage('Valid expiry date is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('category').optional().isString().withMessage('Category must be a string'),
  body('generic_name').optional().isString().withMessage('Generic name must be a string'),
  body('manufacturer').optional().isString().withMessage('Manufacturer must be a string'),
  body('batch_number').optional().isString().withMessage('Batch number must be a string'),
  body('manufacturing_date').optional().isISO8601().withMessage('Manufacturing date must be valid'),
  body('prescription_required').optional().isBoolean().withMessage('Prescription required must be boolean'),
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



    // Get category ID if category filter is applied
    let categoryId = null;
    if (category && category !== 'all') {
      const { data: categoryData, error: categoryError } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('name', category)
        .single();
      
      if (categoryData && !categoryError) {
        categoryId = categoryData.id;
        // Category found successfully
      } else {
        // Category not found
        // If category not found, return empty result
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        });
      }
    }

    let query = supabaseAdmin
      .from('medicines')
      .select(`
        *,
        categories(name)
      `)
      .eq('is_active', true);

    // Apply search filter
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%,generic_name.ilike.%${search.trim()}%`);
    }

    // Apply category filter
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    // Apply expiry filter
    if (expiry && expiry !== 'all') {
      if (expiry === 'expired') {
        query = query.lt('expiry_date', new Date().toISOString().split('T')[0]);
      } else if (expiry === 'expiring') {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        query = query
          .gte('expiry_date', new Date().toISOString().split('T')[0])
          .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0]);
      }
    }

    // Apply low stock filter
    if (low_stock === 'true') {
      query = query.lte('quantity_in_stock', 10); // Using actual column name and default threshold
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: medicines, error } = await query;

    if (error) {
      console.error('Error fetching medicines:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching medicines',
        error: error.message
      });
    }


    res.json({
      success: true,
      data: medicines || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: medicines ? medicines.length : 0,
        pages: Math.ceil((medicines ? medicines.length : 0) / limit)
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
      .select('*')
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
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
// @access  Private (Admin only)
router.get('/low-stock', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get all medicines and filter in JavaScript
    const { data: allMedicines, error } = await supabaseAdmin
      .from('medicines')
      .select('*');

    if (error) {
      console.error('Low stock medicines error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching low stock medicines'
      });
    }

    const lowStockMedicines = allMedicines.filter(medicine =>
      medicine.quantity_in_stock <= 10 // Using actual column name and default threshold
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
// @access  Admin only
router.get('/expiring', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const today = new Date().toISOString().split('T')[0];
    
    let query = supabaseAdmin
      .from('medicines')
      .select('*')
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
      .select('*')
      .eq('id', id)
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

    const { category, quantity, ...medicineData } = req.body;
    
    // Get category_id from category name
    let category_id = null;
    if (category) {
      const { data: categoryData, error: categoryError } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('name', category)
        .single();
      
      if (categoryError || !categoryData) {
        console.error('Category lookup error:', categoryError);
        // Create the category if it doesn't exist
        const { data: newCategory, error: createError } = await supabaseAdmin
          .from('categories')
          .insert({ name: category, description: `Category for ${category}` })
          .select('id')
          .single();
        
        if (createError || !newCategory) {
          console.error('Category creation error:', createError);
          return res.status(400).json({
            success: false,
            message: 'Invalid category and failed to create it'
          });
        }
        category_id = newCategory.id;
      } else {
        category_id = categoryData.id;
      }
    }

    // Generate SKU if not provided
    const sku = medicineData.sku || `MED${Date.now()}`;
    
    // Set cost price to 50% of selling price if not provided
    const cost_price = medicineData.cost_price || (parseFloat(medicineData.price) * 0.5);

    const { data: medicine, error } = await supabaseAdmin
      .from('medicines')
      .insert({
        ...medicineData,
        quantity_in_stock: quantity,
        category_id,
        sku,
        cost_price,
        is_active: true
      })
      .select(`
        *,
        categories(name)
      `)
      .single();

    if (error) {
      console.error('Error creating medicine:', error);
      console.error('Medicine data being inserted:', {
        ...medicineData,
        quantity_in_stock: quantity,
        category_id,
        sku,
        cost_price,
        is_active: true
      });
      return res.status(500).json({
        success: false,
        message: 'Error creating medicine',
        error: error.message
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
    const { category, quantity, ...medicineData } = req.body;
    
    // Get category_id from category name if category is provided
    let category_id = null;
    if (category) {
      const { data: categoryData, error: categoryError } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('name', category)
        .single();
      
      if (categoryError || !categoryData) {
        console.error('Category lookup error:', categoryError);
        // Create the category if it doesn't exist
        const { data: newCategory, error: createError } = await supabaseAdmin
          .from('categories')
          .insert({ name: category, description: `Category for ${category}` })
          .select('id')
          .single();
        
        if (createError || !newCategory) {
          console.error('Category creation error:', createError);
          return res.status(400).json({
            success: false,
            message: 'Invalid category and failed to create it'
          });
        }
        category_id = newCategory.id;
      } else {
        category_id = categoryData.id;
      }
    }

    const updateData = {
      ...medicineData,
      ...(quantity !== undefined && { quantity_in_stock: quantity }),
      ...(category_id && { category_id })
    };

    const { data: medicine, error } = await supabaseAdmin
      .from('medicines')
      .update(updateData)
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