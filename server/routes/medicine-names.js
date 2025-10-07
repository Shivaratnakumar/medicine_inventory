const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const Fuse = require('fuse.js');

const router = express.Router();

// In-memory cache for medicine names (for better performance)
let medicineNamesCache = [];
let fuseInstance = null;
let lastCacheUpdate = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Initialize Fuse.js with medicine names
const initializeFuse = (medicineNames) => {
  const fuseOptions = {
    keys: [
      { name: 'name', weight: 0.3 },
      { name: 'generic_name', weight: 0.25 },
      { name: 'brand_name', weight: 0.15 },
      { name: 'manufacturer', weight: 0.1 },
      { name: 'description', weight: 0.1 },
      { name: 'common_names', weight: 0.1 }
    ],
    threshold: 0.4, // Lower threshold means more strict matching
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    shouldSort: true,
    findAllMatches: true,
    ignoreLocation: true,
    useExtendedSearch: true
  };
  
  return new Fuse(medicineNames, fuseOptions);
};

// Load medicine names from database
const loadMedicineNames = async () => {
  try {
    const { data: medicineNames, error } = await supabaseAdmin
      .from('medicine_names')
      .select(`
        id,
        name,
        generic_name,
        description,
        manufacturer,
        sku,
        price,
        cost_price,
        quantity_in_stock,
        minimum_stock_level,
        maximum_stock_level,
        expiry_date,
        manufacturing_date,
        prescription_required,
        image_url,
        barcode,
        is_active,
        created_at,
        updated_at,
        brand_name,
        common_names,
        popularity_score
      `)
      .eq('is_active', true)
      .order('popularity_score', { ascending: false });
    
    if (error) {
      console.error('Error loading medicine names:', error);
      return [];
    }
    
    return medicineNames || [];
  } catch (error) {
    console.error('Error loading medicine names:', error);
    return [];
  }
};

// Get or refresh cache
const getMedicineNamesCache = async () => {
  const now = Date.now();
  
  if (!medicineNamesCache.length || !lastCacheUpdate || (now - lastCacheUpdate) > CACHE_DURATION) {
    console.log('🔄 Refreshing medicine names cache...');
    medicineNamesCache = await loadMedicineNames();
    fuseInstance = initializeFuse(medicineNamesCache);
    lastCacheUpdate = now;
    console.log(`✅ Cache refreshed with ${medicineNamesCache.length} medicine names`);
  }
  
  return { medicineNames: medicineNamesCache, fuse: fuseInstance };
};

// Validation rules (compatible with medicines table)
const medicineNameValidation = [
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Medicine name is required and must be less than 255 characters'),
  body('generic_name').optional().isLength({ max: 255 }).withMessage('Generic name must be less than 255 characters'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('manufacturer').optional().isLength({ max: 255 }).withMessage('Manufacturer must be less than 255 characters'),
  body('sku').optional().isLength({ max: 100 }).withMessage('SKU must be less than 100 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('cost_price').optional().isFloat({ min: 0 }).withMessage('Cost price must be a positive number'),
  body('quantity_in_stock').optional().isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('minimum_stock_level').optional().isInt({ min: 0 }).withMessage('Minimum stock level must be a non-negative integer'),
  body('maximum_stock_level').optional().isInt({ min: 0 }).withMessage('Maximum stock level must be a non-negative integer'),
  body('expiry_date').optional().isISO8601().withMessage('Expiry date must be valid'),
  body('manufacturing_date').optional().isISO8601().withMessage('Manufacturing date must be valid'),
  body('prescription_required').optional().isBoolean().withMessage('Prescription required must be boolean'),
  body('image_url').optional().isURL().withMessage('Image URL must be valid'),
  body('barcode').optional().isLength({ max: 100 }).withMessage('Barcode must be less than 100 characters'),
  body('brand_name').optional().isLength({ max: 255 }).withMessage('Brand name must be less than 255 characters'),
  body('common_names').optional().isArray().withMessage('Common names must be an array'),
  body('popularity_score').optional().isInt({ min: 0 }).withMessage('Popularity score must be a non-negative integer'),
];

// @route   GET /api/medicine-names
// @desc    Get all medicine names with optional search
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;
    
    const { medicineNames, fuse } = await getMedicineNamesCache();
    
    let results = medicineNames;
    
    // Apply search if provided
    if (search && search.trim()) {
      const searchQuery = search.trim();
      
      // Use Fuse.js for fuzzy search
      const fuseResults = fuse.search(searchQuery);
      results = fuseResults.map(result => ({
        ...result.item,
        score: result.score,
        matches: result.matches
      }));
    }
    
    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedResults = results.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedResults,
      pagination: {
        total: results.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: endIndex < results.length
      }
    });
  } catch (error) {
    console.error('Medicine names fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching medicine names'
    });
  }
});

// @route   GET /api/medicine-names/autocomplete
// @desc    Get autocomplete suggestions for medicine names
// @access  Private
router.get('/autocomplete', authenticateToken, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: [],
        message: 'Query must be at least 2 characters long'
      });
    }
    
    const { medicineNames, fuse } = await getMedicineNamesCache();
    const searchQuery = q.trim();
    
    // Use Fuse.js for fuzzy search with autocomplete
    const fuseOptions = {
      ...fuse.options,
      threshold: 0.3, // More strict for autocomplete
      limit: parseInt(limit)
    };
    
    const autocompleteFuse = new Fuse(medicineNames, fuseOptions);
    const results = autocompleteFuse.search(searchQuery);
    
    // Format results for autocomplete
    const suggestions = results.map(result => ({
      id: result.item.id,
      name: result.item.name,
      generic_name: result.item.generic_name,
      brand_name: result.item.brand_name,
      common_names: result.item.common_names,
      score: result.score,
      highlight: result.matches ? result.matches.map(match => ({
        key: match.key,
        value: match.value,
        indices: match.indices
      })) : []
    }));
    
    res.json({
      success: true,
      data: suggestions,
      query: searchQuery,
      total: suggestions.length
    });
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in autocomplete'
    });
  }
});

// @route   GET /api/medicine-names/search
// @desc    Advanced search with fuzzy matching and filters
// @access  Private
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { 
      q, 
      type = 'all', // all, generic, brand, common
      min_score = 0.1,
      limit = 20,
      offset = 0
    } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }
    
    const { medicineNames, fuse } = await getMedicineNamesCache();
    const searchQuery = q.trim();
    
    // Configure Fuse.js based on search type
    let searchKeys = [
      { name: 'name', weight: 0.4 },
      { name: 'generic_name', weight: 0.3 },
      { name: 'brand_name', weight: 0.2 },
      { name: 'common_names', weight: 0.1 }
    ];
    
    if (type !== 'all') {
      searchKeys = searchKeys.filter(key => 
        (type === 'generic' && key.name === 'generic_name') ||
        (type === 'brand' && key.name === 'brand_name') ||
        (type === 'common' && key.name === 'common_names') ||
        key.name === 'name' // Always include name
      );
    }
    
    const searchFuse = new Fuse(medicineNames, {
      ...fuse.options,
      keys: searchKeys,
      threshold: parseFloat(min_score),
      limit: parseInt(limit)
    });
    
    const results = searchFuse.search(searchQuery);
    
    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedResults = results.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedResults.map(result => ({
        ...result.item,
        score: result.score,
        matches: result.matches
      })),
      pagination: {
        total: results.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: endIndex < results.length
      },
      search: {
        query: searchQuery,
        type: type,
        min_score: parseFloat(min_score)
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in search'
    });
  }
});

// @route   POST /api/medicine-names
// @desc    Add new medicine name
// @access  Private (Admin only)
router.post('/', authenticateToken, requireAdmin, medicineNameValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { name, generic_name, brand_name, common_names = [], popularity_score = 0 } = req.body;
    
    // Check if medicine name already exists
    const { data: existingMedicine, error: checkError } = await supabaseAdmin
      .from('medicine_names')
      .select('id')
      .eq('name', name)
      .single();
    
    if (existingMedicine) {
      return res.status(409).json({
        success: false,
        message: 'Medicine name already exists'
      });
    }
    
    // Insert new medicine name
    const { data: newMedicine, error: insertError } = await supabaseAdmin
      .from('medicine_names')
      .insert({
        name,
        generic_name,
        brand_name,
        common_names,
        popularity_score,
        is_active: true
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating medicine name:', insertError);
      return res.status(500).json({
        success: false,
        message: 'Error creating medicine name',
        error: insertError.message
      });
    }
    
    // Clear cache to force refresh
    medicineNamesCache = [];
    lastCacheUpdate = null;
    
    res.status(201).json({
      success: true,
      message: 'Medicine name created successfully',
      data: newMedicine
    });
  } catch (error) {
    console.error('Medicine name creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating medicine name'
    });
  }
});

// @route   PUT /api/medicine-names/:id
// @desc    Update medicine name
// @access  Private (Admin only)
router.put('/:id', authenticateToken, requireAdmin, medicineNameValidation, async (req, res) => {
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
    const { name, generic_name, brand_name, common_names, popularity_score } = req.body;
    
    // Check if medicine name exists
    const { data: existingMedicine, error: checkError } = await supabaseAdmin
      .from('medicine_names')
      .select('id')
      .eq('id', id)
      .single();
    
    if (!existingMedicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine name not found'
      });
    }
    
    // Update medicine name
    const { data: updatedMedicine, error: updateError } = await supabaseAdmin
      .from('medicine_names')
      .update({
        name,
        generic_name,
        brand_name,
        common_names,
        popularity_score,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating medicine name:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Error updating medicine name',
        error: updateError.message
      });
    }
    
    // Clear cache to force refresh
    medicineNamesCache = [];
    lastCacheUpdate = null;
    
    res.json({
      success: true,
      message: 'Medicine name updated successfully',
      data: updatedMedicine
    });
  } catch (error) {
    console.error('Medicine name update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating medicine name'
    });
  }
});

// @route   DELETE /api/medicine-names/:id
// @desc    Delete medicine name (soft delete)
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete by setting is_active to false
    const { data: deletedMedicine, error: deleteError } = await supabaseAdmin
      .from('medicine_names')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (deleteError) {
      console.error('Error deleting medicine name:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Error deleting medicine name',
        error: deleteError.message
      });
    }
    
    if (!deletedMedicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine name not found'
      });
    }
    
    // Clear cache to force refresh
    medicineNamesCache = [];
    lastCacheUpdate = null;
    
    res.json({
      success: true,
      message: 'Medicine name deleted successfully'
    });
  } catch (error) {
    console.error('Medicine name deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting medicine name'
    });
  }
});

// @route   POST /api/medicine-names/bulk-import
// @desc    Bulk import medicine names
// @access  Private (Admin only)
router.post('/bulk-import', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { medicines } = req.body;
    
    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Medicines must be a non-empty array'
      });
    }
    
    // Validate each medicine
    const validatedMedicines = medicines.map((medicine, index) => {
      if (!medicine.name || typeof medicine.name !== 'string') {
        throw new Error(`Medicine at index ${index} must have a valid name`);
      }
      
      return {
        name: medicine.name.trim(),
        generic_name: medicine.generic_name?.trim() || null,
        brand_name: medicine.brand_name?.trim() || null,
        common_names: Array.isArray(medicine.common_names) ? medicine.common_names : [],
        popularity_score: parseInt(medicine.popularity_score) || 0,
        is_active: true
      };
    });
    
    // Insert medicines in batches
    const batchSize = 100;
    const results = [];
    
    for (let i = 0; i < validatedMedicines.length; i += batchSize) {
      const batch = validatedMedicines.slice(i, i + batchSize);
      
      const { data: batchResults, error: batchError } = await supabaseAdmin
        .from('medicine_names')
        .insert(batch)
        .select();
      
      if (batchError) {
        console.error(`Error in batch ${i / batchSize + 1}:`, batchError);
        // Continue with other batches
      } else {
        results.push(...(batchResults || []));
      }
    }
    
    // Clear cache to force refresh
    medicineNamesCache = [];
    lastCacheUpdate = null;
    
    res.status(201).json({
      success: true,
      message: `Successfully imported ${results.length} medicine names`,
      data: {
        imported: results.length,
        total: validatedMedicines.length,
        medicines: results
      }
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in bulk import',
      error: error.message
    });
  }
});

// @route   GET /api/medicine-names/stats
// @desc    Get medicine names statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { medicineNames } = await getMedicineNamesCache();
    
    const stats = {
      total: medicineNames.length,
      with_generic: medicineNames.filter(m => m.generic_name).length,
      with_brand: medicineNames.filter(m => m.brand_name).length,
      with_common_names: medicineNames.filter(m => m.common_names && m.common_names.length > 0).length,
      top_popular: medicineNames
        .sort((a, b) => b.popularity_score - a.popularity_score)
        .slice(0, 10)
        .map(m => ({ name: m.name, score: m.popularity_score }))
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting stats'
    });
  }
});

module.exports = router;
