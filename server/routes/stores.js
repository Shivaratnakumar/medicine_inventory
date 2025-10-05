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

module.exports = router;
