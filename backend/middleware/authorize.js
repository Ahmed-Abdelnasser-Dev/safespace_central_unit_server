/**
 * authorize.js — Role-Based Authorization Middleware
 *
 * Security:
 * - Role is read from req.user (loaded fresh from DB by protect)
 * - NEVER accepted from request body, query, or headers
 * - Returns 403 with generic message — never reveals valid roles
 */

const AppError = require('../utils/AppError');
const { logger } = require('../utils/logger');

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      // protect middleware must run first
      return next(new AppError('Authentication required', 401));
    }

    const userRole = req.user.role.name;

    if (!allowedRoles.includes(userRole)) {
      logger.warn(
        `Authorization denied — user ${req.user.id} (role: ${userRole}) attempted access requiring [${allowedRoles.join(', ')}] on ${req.method} ${req.originalUrl}`
      );
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};

module.exports = authorize;