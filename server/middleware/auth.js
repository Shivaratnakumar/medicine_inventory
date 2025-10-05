const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');

// Simple in-memory cache for user data (expires after 5 minutes)
const userCache = new Map();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      }
      return res.status(403).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Check cache first
    const cacheKey = `user_${decoded.userId}`;
    const cachedUser = userCache.get(cacheKey);
    
    if (cachedUser && (Date.now() - cachedUser.timestamp) < CACHE_EXPIRY) {
      req.user = cachedUser.data;
      return next();
    }

    // Get user from database with retry logic
    let user, error;
    let retries = 3;
    
    while (retries > 0) {
      try {
        const result = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single();
        
        user = result.data;
        error = result.error;
        break;
      } catch (dbError) {
        retries--;
        if (retries === 0) {
          console.error('❌ Database error in auth middleware:', dbError);
          return res.status(503).json({
            success: false,
            message: 'Service temporarily unavailable'
          });
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found'
      });
    }

    // Cache the user data
    userCache.set(cacheKey, {
      data: user,
      timestamp: Date.now()
    });

    // Clean up old cache entries periodically
    if (userCache.size > 1000) {
      const now = Date.now();
      for (const [key, value] of userCache.entries()) {
        if (now - value.timestamp > CACHE_EXPIRY) {
          userCache.delete(key);
        }
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

const requireManager = (req, res, next) => {
  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Manager or admin access required'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireManager
};
