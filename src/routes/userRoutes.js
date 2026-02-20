const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/rbac');

// Validation rules
const roleValidation = [
  body('role')
    .isIn(['user', 'admin'])
    .withMessage('Role must be either "user" or "admin"')
];

// All user routes require authentication
router.use(authenticate);

// Get all users (Admin only)
router.get('/', isAdmin, userController.getUsers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Update user role (Admin only)
router.patch(
  '/:id/role',
  isAdmin,
  roleValidation,
  userController.updateUserRole
);

// Deactivate user (Admin only)
router.patch('/:id/deactivate', isAdmin, userController.deactivateUser);

// Activate user (Admin only)
router.patch('/:id/activate', isAdmin, userController.activateUser);

module.exports = router;
