const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/stores
// @desc    Get all stores
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: stores, error } = await supabaseAdmin
      .from('stores')
      .select(`
        *,
        users(first_name, last_name)
      `)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching stores:', error);
      // If table doesn't exist, return empty data instead of error
      if (error.code === 'PGRST205') {
        return res.json({
          success: true,
          data: []
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Error fetching stores'
      });
    }

    res.json({
      success: true,
      data: stores
    });
  } catch (error) {
    console.error('Stores fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching stores'
    });
  }
});

// @route   POST /api/stores
// @desc    Create new store
// @access  Private (Manager)
router.post('/', authenticateToken, requireManager, [
  body('name').trim().isLength({ min: 1 }).withMessage('Store name is required'),
  body('address').trim().isLength({ min: 1 }).withMessage('Address is required'),
  body('city').trim().isLength({ min: 1 }).withMessage('City is required'),
  body('state').trim().isLength({ min: 1 }).withMessage('State is required'),
  body('zip_code').trim().isLength({ min: 1 }).withMessage('ZIP code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { data: store, error } = await supabaseAdmin
      .from('stores')
      .insert(req.body)
      .select()
      .single();

    if (error) {
      console.error('Error creating store:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating store'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Store created successfully',
      data: store
    });
  } catch (error) {
    console.error('Store creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating store'
    });
  }
});

// @route   PUT /api/stores/:id
// @desc    Update store
// @access  Private (Manager)
router.put('/:id', authenticateToken, requireManager, [
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Store name cannot be empty'),
  body('address').optional().trim().isLength({ min: 1 }).withMessage('Address cannot be empty'),
  body('city').optional().trim().isLength({ min: 1 }).withMessage('City cannot be empty'),
  body('state').optional().trim().isLength({ min: 1 }).withMessage('State cannot be empty'),
  body('zip_code').optional().trim().isLength({ min: 1 }).withMessage('ZIP code cannot be empty')
], async (req, res) => {
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
    const updateData = req.body;

    // Validate store ID
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid store ID'
      });
    }

    console.log('Updating store with ID:', id);
    console.log('Update data:', updateData);

    // First check if store exists
    const { data: existingStore, error: fetchError } = await supabaseAdmin
      .from('stores')
      .select('id, name')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching store:', fetchError);
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    if (!existingStore) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    const { data: store, error } = await supabaseAdmin
      .from('stores')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating store:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return res.status(500).json({
        success: false,
        message: 'Error updating store',
        error: error.message
      });
    }

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    console.log('Store updated successfully:', store);
    res.json({
      success: true,
      message: 'Store updated successfully',
      data: store
    });
  } catch (error) {
    console.error('Store update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating store'
    });
  }
});

// @route   DELETE /api/stores/:id
// @desc    Delete store
// @access  Private (Manager)
router.delete('/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: store, error } = await supabaseAdmin
      .from('stores')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting store:', error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting store'
      });
    }

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    res.json({
      success: true,
      message: 'Store deleted successfully'
    });
  } catch (error) {
    console.error('Store deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting store'
    });
  }
});

// @route   GET /api/stores/:id
// @desc    Get store by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: store, error } = await supabaseAdmin
      .from('stores')
      .select(`
        *,
        users(first_name, last_name)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching store:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching store'
      });
    }

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    res.json({
      success: true,
      data: store
    });
  } catch (error) {
    console.error('Store fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching store'
    });
  }
});

module.exports = router;
