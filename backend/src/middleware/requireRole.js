/**
 * Middleware: Require specific role(s) to access a route
 * Usage: requireRole(['owner', 'manager'])
 *
 * Role hierarchy: owner > manager > receptionist > trainer
 * Must be used AFTER authenticate middleware
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied. Insufficient permissions.',
        requiredRoles: allowedRoles,
        yourRole: req.user.role,
      });
    }

    next();
  };
};

module.exports = requireRole;
