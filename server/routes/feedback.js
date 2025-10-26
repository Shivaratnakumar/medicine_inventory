const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/feedback
// @desc    Get feedback (all for admin, own for regular users)
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Feedback API called with user:', req.user.id, 'role:', req.user.role);

    // Apply role-based filtering
    let query;
    if (req.user.role !== 'admin') {
      console.log('🔍 Non-admin user - filtering feedback for user_id:', req.user.id);
      query = supabaseAdmin
        .from('feedback')
        .select(`
          *,
          users(first_name, last_name)
        `)
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });
    } else {
      console.log('🔍 Admin user - showing all feedback');
      query = supabaseAdmin
        .from('feedback')
        .select(`
          *,
          users(first_name, last_name)
        `)
        .order('created_at', { ascending: false });
    }

    const { data: feedback, error } = await query;

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

// @route   GET /api/feedback/:id
// @desc    Get feedback by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('feedback')
      .select(`
        *,
        users(first_name, last_name)
      `)
      .eq('id', req.params.id);

    // Apply role-based filtering - admin can see any feedback, users can only see their own
    if (req.user.role !== 'admin') {
      query = query.eq('user_id', req.user.id);
    }

    const { data: feedback, error } = await query.single();

    if (error) {
      console.error('Error fetching feedback:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching feedback'
      });
    }

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found or access denied'
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

// @route   PUT /api/feedback/:id
// @desc    Update feedback
// @access  Private
router.put('/:id', authenticateToken, [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
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

    // First check if the feedback exists and user has permission to update it
    let checkQuery = supabaseAdmin
      .from('feedback')
      .select('id, user_id')
      .eq('id', req.params.id);

    // Apply role-based filtering - admin can update any feedback, users can only update their own
    if (req.user.role !== 'admin') {
      checkQuery = checkQuery.eq('user_id', req.user.id);
    }

    const { data: existingFeedback, error: checkError } = await checkQuery.single();

    if (checkError || !existingFeedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found or access denied'
      });
    }

    const { data: feedback, error } = await supabaseAdmin
      .from('feedback')
      .update(req.body)
      .eq('id', req.params.id)
      .select(`
        *,
        users(first_name, last_name)
      `)
      .single();

    if (error) {
      console.error('Error updating feedback:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating feedback'
      });
    }

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      data: feedback
    });
  } catch (error) {
    console.error('Feedback update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating feedback'
    });
  }
});

// @route   DELETE /api/feedback/:id
// @desc    Delete feedback
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // First check if the feedback exists and user has permission to delete it
    let checkQuery = supabaseAdmin
      .from('feedback')
      .select('id, user_id')
      .eq('id', req.params.id);

    // Apply role-based filtering - admin can delete any feedback, users can only delete their own
    if (req.user.role !== 'admin') {
      checkQuery = checkQuery.eq('user_id', req.user.id);
    }

    const { data: existingFeedback, error: checkError } = await checkQuery.single();

    if (checkError || !existingFeedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found or access denied'
      });
    }

    const { error } = await supabaseAdmin
      .from('feedback')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Error deleting feedback:', error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting feedback'
      });
    }

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Feedback deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting feedback'
    });
  }
});

module.exports = router;
