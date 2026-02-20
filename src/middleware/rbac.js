/**
 * Role-Based Access Control middleware
 * @param {...String} allowedRoles - Roles that are allowed to access the route
 * @returns {Function} Express middleware function
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
const isAdmin = authorize('admin');

/**
 * Middleware to check if user is admin or the resource owner
 * @param {Function} getUserId - Function to extract user ID from request (e.g., req => req.params.userId)
 */
const isAdminOrOwner = (getUserId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const userId = req.user._id.toString();
    const resourceUserId = getUserId ? getUserId(req) : null;

    if (userRole === 'admin' || userId === resourceUserId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources or be an admin.'
    });
  };
};

module.exports = {
  authorize,
  isAdmin,
  isAdminOrOwner
};
