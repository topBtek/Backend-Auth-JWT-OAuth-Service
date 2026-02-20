const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter, refreshLimiter } = require('../middleware/rateLimiter');

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either "user" or "admin"')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Routes
router.post(
  '/register',
  authLimiter,
  registerValidation,
  authController.register
);

router.post(
  '/login',
  authLimiter,
  loginValidation,
  authController.login
);

router.post(
  '/refresh',
  refreshLimiter,
  authController.refresh
);

router.post(
  '/logout',
  authenticate,
  authController.logout
);

router.get(
  '/profile',
  authenticate,
  authController.getProfile
);

// OAuth Google routes
router.get(
  '/oauth/google',
  authLimiter,
  authController.googleLogin,
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

router.get(
  '/oauth/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`
  }),
  authController.googleCallback
);

module.exports = router;
