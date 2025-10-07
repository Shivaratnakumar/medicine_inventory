const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const smsService = require('../services/smsService');
const emailService = require('../services/emailService');

const router = express.Router();

// Validation rules
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
];

const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 }),
  body('role').optional().isIn(['user', 'manager'])
];

const forgotPasswordValidation = [
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone(),
  body('method').isIn(['email', 'sms'])
];

const otpVerificationValidation = [
  body('phone').isMobilePhone(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric()
];

const resetPasswordValidation = [
  body('token').optional().isLength({ min: 10 }),
  body('phone').optional().isMobilePhone(),
  body('otp').optional().isLength({ min: 6, max: 6 }).isNumeric(),
  body('password').isLength({ min: 6 }),
  body('method').isIn(['email', 'sms'])
];

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Get user from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName, phone, role = 'user' } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        phone,
        role
      })
      .select()
      .single();

    if (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating user'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   GET /api/auth/verify
// @desc    Verify token and get user data
// @access  Private
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const { password_hash, ...userWithoutPassword } = req.user;
    
    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token verification'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset via email or SMS
// @access  Public
router.post('/forgot-password', forgotPasswordValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, phone, method } = req.body;

    if (method === 'email') {
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required for email reset method'
        });
      }

      // Check if user exists
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id, email, first_name, phone')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (!user) {
        // Don't reveal if user exists or not
        return res.json({
          success: true,
          message: 'If the email exists, a password reset link has been sent'
        });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id, type: 'password_reset' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Store token in database
      await supabaseAdmin
        .from('password_reset_tokens')
        .insert({
          user_id: user.id,
          token: resetToken,
          type: 'email',
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        });

      // Send email
      await emailService.sendPasswordResetEmail(user.email, resetToken, user.first_name);

      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });

    } else if (method === 'sms') {
      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required for SMS reset method'
        });
      }

      // Validate phone number
      if (!smsService.validatePhoneNumber(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }

      const formattedPhone = smsService.formatPhoneNumber(phone);

      // Check if user exists with this phone number
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id, email, first_name, phone')
        .eq('phone', formattedPhone)
        .eq('is_active', true)
        .single();

      if (!user) {
        // Don't reveal if user exists or not
        return res.json({
          success: true,
          message: 'If the phone number exists, an OTP has been sent'
        });
      }

      // Generate OTP
      const otp = smsService.generateOTP();

      // Store OTP in database
      await supabaseAdmin
        .from('otp_verifications')
        .insert({
          user_id: user.id,
          phone: formattedPhone,
          otp_code: otp,
          type: 'password_reset',
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        });

      // Send SMS
      await smsService.sendOTP(formattedPhone, otp, 'password_reset');

      res.json({
        success: true,
        message: 'If the phone number exists, an OTP has been sent'
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for password reset
// @access  Public
router.post('/verify-otp', otpVerificationValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { phone, otp } = req.body;

    // Validate phone number
    if (!smsService.validatePhoneNumber(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    const formattedPhone = smsService.formatPhoneNumber(phone);

    // Use the database function to validate OTP
    const { data: result, error } = await supabaseAdmin
      .rpc('validate_otp', {
        p_phone: formattedPhone,
        p_otp_code: otp,
        p_type: 'password_reset'
      });

    if (error) {
      console.error('OTP verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verifying OTP'
      });
    }

    if (!result || result.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    const { is_valid, user_id, message } = result[0];

    if (!is_valid) {
      return res.status(400).json({
        success: false,
        message: message
      });
    }

    // Generate a temporary token for password reset
    const resetToken = jwt.sign(
      { userId: user_id, type: 'otp_password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // 15 minutes to complete password reset
    );

    res.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token or OTP
// @access  Public
router.post('/reset-password', resetPasswordValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token, phone, otp, password, method } = req.body;

    let userId;

    if (method === 'email') {
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required for email reset method'
        });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.type !== 'password_reset') {
        return res.status(400).json({
          success: false,
          message: 'Invalid token type'
        });
      }

      // Check if token exists and is not used
      const { data: tokenRecord } = await supabaseAdmin
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .eq('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!tokenRecord) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      userId = decoded.userId;

      // Mark token as used
      await supabaseAdmin
        .from('password_reset_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', tokenRecord.id);

    } else if (method === 'sms') {
      if (!phone || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and OTP are required for SMS reset method'
        });
      }

      // Validate phone number
      if (!smsService.validatePhoneNumber(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }

      const formattedPhone = smsService.formatPhoneNumber(phone);

      // Verify OTP again
      const { data: result, error } = await supabaseAdmin
        .rpc('validate_otp', {
          p_phone: formattedPhone,
          p_otp_code: otp,
          p_type: 'password_reset'
        });

      if (error || !result || result.length === 0 || !result[0].is_valid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      userId = result[0].user_id;
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update password
    const { error } = await supabaseAdmin
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', userId);

    if (error) {
      console.error('Password reset error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating password'
      });
    }

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired'
      });
    }
    
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
});

module.exports = router;
