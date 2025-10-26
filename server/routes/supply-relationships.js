const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/supply-relationships
// @desc    Get supply relationships (role-based filtering)
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search, store_id } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    let query = supabaseAdmin
      .from('supply_relationships')
      .select(`
        *,
        supplier_store:stores!supply_relationships_supplier_store_id_fkey(name, address, city, phone, email),
        customer_store:stores!supply_relationships_customer_store_id_fkey(name, address, city, phone, email),
        created_by_user:users!supply_relationships_created_by_fkey(first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    // Apply role-based filtering
    if (userRole !== 'admin') {
      // Non-admin users can only see relationships for their stores
      query = query.or(`supplier_store_id.in.(select id from stores where manager_id.eq.${userId}),customer_store_id.in.(select id from stores where manager_id.eq.${userId})`);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Add search functionality
    if (store_id && store_id !== 'all') {
      query = query.or(`supplier_store_id.eq.${store_id},customer_store_id.eq.${store_id}`);
    }

    if (search) {
      query = query.or(`supplier_store.name.ilike.%${search}%,customer_store.name.ilike.%${search}%,contact_person.ilike.%${search}%`);
    }

    const offset = (page - 1) * limit;
    const { data: relationships, error } = await query.range(offset, offset + limit - 1);
    
    // Get total count for pagination
    let count = 0;
    if (!error) {
      let countQuery = supabaseAdmin
        .from('supply_relationships')
        .select('*', { count: 'exact', head: true });
      
      // Apply role-based filtering to count query as well
      if (userRole !== 'admin') {
        countQuery = countQuery.or(`supplier_store_id.in.(select id from stores where manager_id.eq.${userId}),customer_store_id.in.(select id from stores where manager_id.eq.${userId})`);
      }
      
      if (store_id && store_id !== 'all') {
        countQuery = countQuery.or(`supplier_store_id.eq.${store_id},customer_store_id.eq.${store_id}`);
      }
      
      const { count: totalCount } = await countQuery;
      count = totalCount || 0;
    }

    if (error) {
      console.error('Error fetching supply relationships:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error fetching supply relationships'
      });
    }

    res.json({
      success: true,
      data: relationships,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Supply relationships fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching supply relationships'
    });
  }
});

// @route   POST /api/supply-relationships
// @desc    Create new supply relationship
// @access  Private
router.post('/', authenticateToken, [
  body('customer_store_id').isUUID().withMessage('Valid customer store ID is required'),
  body('relationship_type').optional().isIn(['supply', 'partnership', 'exclusive']).withMessage('Invalid relationship type'),
  body('contract_start_date').optional().isISO8601().withMessage('Valid contract start date is required'),
  body('contract_end_date').optional().isISO8601().withMessage('Valid contract end date is required'),
  body('commission_rate').optional().isFloat({ min: 0, max: 100 }).withMessage('Commission rate must be between 0 and 100'),
  body('credit_limit').optional().isFloat({ min: 0 }).withMessage('Credit limit must be positive'),
  body('payment_terms').optional().isIn(['15 days', '30 days', '45 days', '60 days']).withMessage('Invalid payment terms'),
  body('contact_person').optional().trim().isLength({ min: 1 }).withMessage('Contact person name is required'),
  body('contact_phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('contact_email').optional().isEmail().withMessage('Valid email is required')
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

    const {
      customer_store_id,
      relationship_type = 'supply',
      contract_start_date,
      contract_end_date,
      commission_rate = 0,
      credit_limit = 0,
      payment_terms = '30 days',
      contact_person,
      contact_phone,
      contact_email,
      notes
    } = req.body;

    const userId = req.user.id;
    const userRole = req.user.role;

    // Get user's store (assuming user is manager of supplier store)
    const { data: userStore, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('id')
      .eq('manager_id', userId)
      .single();

    if (storeError || !userStore) {
      return res.status(400).json({
        success: false,
        message: 'User must be a store manager to create supply relationships'
      });
    }

    // Check if customer store exists
    const { data: customerStore, error: customerError } = await supabaseAdmin
      .from('stores')
      .select('id, name')
      .eq('id', customer_store_id)
      .single();

    if (customerError || !customerStore) {
      return res.status(400).json({
        success: false,
        message: 'Customer store not found'
      });
    }

    // Check if relationship already exists
    const { data: existingRelationship, error: existingError } = await supabaseAdmin
      .from('supply_relationships')
      .select('id')
      .eq('supplier_store_id', userStore.id)
      .eq('customer_store_id', customer_store_id)
      .single();

    if (existingRelationship) {
      return res.status(400).json({
        success: false,
        message: 'Supply relationship already exists with this store'
      });
    }

    const relationshipData = {
      supplier_store_id: userStore.id,
      customer_store_id,
      relationship_type,
      contract_start_date,
      contract_end_date,
      commission_rate,
      credit_limit,
      payment_terms,
      contact_person,
      contact_phone,
      contact_email,
      notes,
      created_by: userId,
      updated_by: userId
    };

    const { data: relationship, error } = await supabaseAdmin
      .from('supply_relationships')
      .insert(relationshipData)
      .select(`
        *,
        supplier_store:stores!supply_relationships_supplier_store_id_fkey(name, address, city, phone, email),
        customer_store:stores!supply_relationships_customer_store_id_fkey(name, address, city, phone, email)
      `)
      .single();

    if (error) {
      console.error('Error creating supply relationship:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating supply relationship'
      });
    }

    res.status(201).json({
      success: true,
      data: relationship,
      message: 'Supply relationship created successfully'
    });
  } catch (error) {
    console.error('Supply relationship creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating supply relationship'
    });
  }
});

// @route   PUT /api/supply-relationships/:id
// @desc    Update supply relationship
// @access  Private
router.put('/:id', authenticateToken, [
  body('relationship_type').optional().isIn(['supply', 'partnership', 'exclusive']).withMessage('Invalid relationship type'),
  body('status').optional().isIn(['active', 'inactive', 'pending', 'suspended']).withMessage('Invalid status'),
  body('contract_start_date').optional().isISO8601().withMessage('Valid contract start date is required'),
  body('contract_end_date').optional().isISO8601().withMessage('Valid contract end date is required'),
  body('commission_rate').optional().isFloat({ min: 0, max: 100 }).withMessage('Commission rate must be between 0 and 100'),
  body('credit_limit').optional().isFloat({ min: 0 }).withMessage('Credit limit must be positive'),
  body('payment_terms').optional().isIn(['15 days', '30 days', '45 days', '60 days']).withMessage('Invalid payment terms'),
  body('contact_person').optional().trim().isLength({ min: 1 }).withMessage('Contact person name is required'),
  body('contact_phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('contact_email').optional().isEmail().withMessage('Valid email is required')
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
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if relationship exists and user has permission to update
    const { data: existingRelationship, error: fetchError } = await supabaseAdmin
      .from('supply_relationships')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingRelationship) {
      return res.status(404).json({
        success: false,
        message: 'Supply relationship not found'
      });
    }

    // Check permissions
    if (userRole !== 'admin') {
      const { data: userStore, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('manager_id', userId)
        .single();

      if (storeError || !userStore || existingRelationship.supplier_store_id !== userStore.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this supply relationship'
        });
      }
    }

    const updateData = {
      ...req.body,
      updated_by: userId,
      updated_at: new Date().toISOString()
    };

    const { data: relationship, error } = await supabaseAdmin
      .from('supply_relationships')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        supplier_store:stores!supply_relationships_supplier_store_id_fkey(name, address, city, phone, email),
        customer_store:stores!supply_relationships_customer_store_id_fkey(name, address, city, phone, email)
      `)
      .single();

    if (error) {
      console.error('Error updating supply relationship:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating supply relationship'
      });
    }

    res.json({
      success: true,
      data: relationship,
      message: 'Supply relationship updated successfully'
    });
  } catch (error) {
    console.error('Supply relationship update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating supply relationship'
    });
  }
});

// @route   DELETE /api/supply-relationships/:id
// @desc    Delete supply relationship
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if relationship exists and user has permission to delete
    const { data: existingRelationship, error: fetchError } = await supabaseAdmin
      .from('supply_relationships')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingRelationship) {
      return res.status(404).json({
        success: false,
        message: 'Supply relationship not found'
      });
    }

    // Check permissions
    if (userRole !== 'admin') {
      const { data: userStore, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('manager_id', userId)
        .single();

      if (storeError || !userStore || existingRelationship.supplier_store_id !== userStore.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this supply relationship'
        });
      }
    }

    const { error } = await supabaseAdmin
      .from('supply_relationships')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting supply relationship:', error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting supply relationship'
      });
    }

    res.json({
      success: true,
      message: 'Supply relationship deleted successfully'
    });
  } catch (error) {
    console.error('Supply relationship deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting supply relationship'
    });
  }
});

// @route   GET /api/supply-relationships/stats
// @desc    Get supply relationships statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let baseQuery = supabaseAdmin.from('supply_relationships');
    
    // Apply role-based filtering
    if (userRole !== 'admin') {
      baseQuery = baseQuery.or(`supplier_store_id.in.(select id from stores where manager_id.eq.${userId}),customer_store_id.in.(select id from stores where manager_id.eq.${userId})`);
    }

    // Get total relationships
    const { count: totalRelationships } = await baseQuery
      .select('*', { count: 'exact', head: true });

    // Get active relationships
    const { count: activeRelationships } = await baseQuery
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get relationships by type
    const { data: relationshipsByType } = await baseQuery
      .select('relationship_type, status')
      .in('status', ['active', 'inactive', 'pending']);

    const typeStats = relationshipsByType?.reduce((acc, rel) => {
      if (!acc[rel.relationship_type]) {
        acc[rel.relationship_type] = { total: 0, active: 0 };
      }
      acc[rel.relationship_type].total++;
      if (rel.status === 'active') {
        acc[rel.relationship_type].active++;
      }
      return acc;
    }, {}) || {};

    res.json({
      success: true,
      data: {
        totalRelationships: totalRelationships || 0,
        activeRelationships: activeRelationships || 0,
        inactiveRelationships: (totalRelationships || 0) - (activeRelationships || 0),
        relationshipsByType: typeStats
      }
    });
  } catch (error) {
    console.error('Supply relationships stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching supply relationships statistics'
    });
  }
});

module.exports = router;

