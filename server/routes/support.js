const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/support
// @desc    Get support tickets
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    
    console.log('🔍 Support API called with user:', req.user.id);
    console.log('🔍 Query params:', { search, status, page, limit });

    let query = supabaseAdmin
      .from('support_tickets')
      .select(`
        *,
        users!support_tickets_user_id_fkey(first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    // Apply search filter
    if (search) {
      query = query.or(`ticket_number.ilike.%${search}%,subject.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: tickets, error, count } = await query;
    
    console.log('🔍 Query result:', { tickets: tickets?.length, error, count });

    if (error) {
      console.error('Error fetching support tickets:', error);
      // If table doesn't exist or any other error, return empty data instead of error
      if (error.code === 'PGRST205' || error.message.includes('relation') || error.message.includes('does not exist')) {
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
      return res.status(500).json({
        success: false,
        message: 'Error fetching support tickets'
      });
    }

    res.json({
      success: true,
      data: tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Support tickets fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching support tickets'
    });
  }
});

// @route   POST /api/support
// @desc    Create support ticket
// @access  Private
router.post('/', authenticateToken, [
  body('subject').trim().isLength({ min: 1 }).withMessage('Subject is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required')
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

    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const { data: ticket, error } = await supabaseAdmin
      .from('support_tickets')
      .insert({
        ticket_number: ticketNumber,
        user_id: req.user.id,
        subject: req.body.subject,
        description: req.body.description,
        priority: req.body.priority || 'medium'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating support ticket:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating support ticket'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: ticket
    });
  } catch (error) {
    console.error('Support ticket creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating support ticket'
    });
  }
});

// @route   GET /api/support/:id
// @desc    Get support ticket by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { data: ticket, error } = await supabaseAdmin
      .from('support_tickets')
      .select(`
        *,
        users!support_tickets_user_id_fkey(first_name, last_name)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) {
      console.error('Error fetching support ticket:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching support ticket'
      });
    }

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('Support ticket fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching support ticket'
    });
  }
});

// @route   PUT /api/support/:id
// @desc    Update support ticket
// @access  Private
router.put('/:id', authenticateToken, [
  body('subject').optional().trim().isLength({ min: 1 }).withMessage('Subject cannot be empty'),
  body('description').optional().trim().isLength({ min: 1 }).withMessage('Description cannot be empty')
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

    const { data: ticket, error } = await supabaseAdmin
      .from('support_tickets')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating support ticket:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating support ticket'
      });
    }

    res.json({
      success: true,
      message: 'Support ticket updated successfully',
      data: ticket
    });
  } catch (error) {
    console.error('Support ticket update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating support ticket'
    });
  }
});

// @route   PATCH /api/support/:id/status
// @desc    Update support ticket status
// @access  Private
router.patch('/:id/status', authenticateToken, [
  body('status').isIn(['open', 'in_progress', 'resolved', 'closed']).withMessage('Invalid status')
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

    const { data: ticket, error } = await supabaseAdmin
      .from('support_tickets')
      .update({ 
        status: req.body.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating support ticket status:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating support ticket status'
      });
    }

    res.json({
      success: true,
      message: 'Support ticket status updated successfully',
      data: ticket
    });
  } catch (error) {
    console.error('Support ticket status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating support ticket status'
    });
  }
});

// @route   DELETE /api/support/:id
// @desc    Delete support ticket
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('support_tickets')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Error deleting support ticket:', error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting support ticket'
      });
    }

    res.json({
      success: true,
      message: 'Support ticket deleted successfully'
    });
  } catch (error) {
    console.error('Support ticket deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting support ticket'
    });
  }
});

module.exports = router;
