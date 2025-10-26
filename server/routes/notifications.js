const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications (all for admin, own for regular users)
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    // If user is not admin, filter by user_id
    if (req.user.role !== 'admin') {
      query = query.eq('user_id', req.user.id);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      // If table doesn't exist, return empty data instead of error
      if (error.code === 'PGRST205') {
        return res.json({
          success: true,
          data: []
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Error fetching notifications'
      });
    }

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching notifications'
    });
  }
});

// @route   PATCH /api/notifications/:id/read
// @desc    Mark notification as read (admin can mark any, users can only mark their own)
// @access  Private
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    let query = supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    // If user is not admin, restrict to their own notifications
    if (req.user.role !== 'admin') {
      query = query.eq('user_id', req.user.id);
    }

    const { error } = await query;

    if (error) {
      console.error('Error updating notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating notification'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Notification update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating notification'
    });
  }
});

// @route   PATCH /api/notifications/read-all
// @desc    Mark all notifications as read (admin can mark all, users can only mark their own)
// @access  Private
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('notifications')
      .update({ is_read: true });

    // If user is not admin, restrict to their own notifications
    if (req.user.role !== 'admin') {
      query = query.eq('user_id', req.user.id);
    }

    const { error } = await query;

    if (error) {
      console.error('Error updating all notifications:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating notifications'
      });
    }

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Notification update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating notifications'
    });
  }
});

module.exports = router;
