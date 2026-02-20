const { validationResult } = require('express-validator');
const authService = require('../services/authService');

/**
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, role } = req.body;

    // Only allow admin role assignment if user is admin
    const assignedRole = req.user && req.user.role === 'admin' ? (role || 'user') : 'user';

    const result = await authService.register(email, password, assignedRole);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 */
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 */
const logout = async (req, res, next) => {
  try {
    await authService.logout(req.userId);

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Google OAuth login initiation
 */
const googleLogin = async (req, res, next) => {
  // This will be handled by passport middleware
  // Just pass to next middleware
  next();
};

/**
 * Google OAuth callback
 */
const googleCallback = async (req, res, next) => {
  try {
    // User is attached to req.user by passport
    if (!req.user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }

    // Generate tokens for the user
    const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
    const User = require('../models/User');

    const accessToken = generateAccessToken({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role
    });

    const refreshToken = generateRefreshToken({
      userId: req.user._id
    });

    // Save refresh token
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    await User.findByIdAndUpdate(req.user._id, {
      refreshToken,
      refreshTokenExpiry
    });

    // Redirect to frontend with tokens
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
    res.redirect(redirectUrl);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getProfile,
  googleLogin,
  googleCallback
};
