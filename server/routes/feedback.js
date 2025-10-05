const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/feedback
// @desc    Get all feedback
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: feedback, error } = await supabaseAdmin
      .from('feedback')
      .select(`
        *,
        users(first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching feedback:', error);
      // If table doesn't exist or any other error, return empty data instead of error
      if (error.code === 'PGRST205' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return res.json({
          success: true,
          data: []
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Error fetching feedback'
      });
    }

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Feedback fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching feedback'
    });
  }
});

// @route   POST /api/feedback
// @desc    Create feedback
// @access  Private
router.post('/', authenticateToken, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim()
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

    const { data: feedback, error } = await supabaseAdmin
      .from('feedback')
      .insert({
        ...req.body,
        user_id: req.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating feedback:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating feedback'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    console.error('Feedback creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating feedback'
    });
  }
});

module.exports = router;
