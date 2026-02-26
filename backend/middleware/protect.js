/**
 * protect.js — JWT Authentication Middleware
 *
 * Verifies the Bearer token on every protected route.
 * Loads the full user + role from DB so req.user is always fresh.
 *
 * Security rules:
 * - Token MUST come from Authorization header only (never body/query)
 * - Role is loaded from DB — never trusted from the token payload alone
 * - Deleted, inactive, or locked accounts are rejected even with a valid token
 * - Generic 401 message — never reveals why auth failed
 */

const jwt      = require('jsonwebtoken');
const prisma   = require('../utils/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('./catchAsync');
const { logger } = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  require('../utils/logger').logger.error('FATAL: JWT_SECRET not set');
  process.exit(1);
}

const protect = catchAsync(async (req, res, next) => {
  // 1. Extract token from Authorization header only
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];

  // 2. Verify signature and expiry
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    // Never reveal whether token is expired vs invalid
    logger.warn(`Invalid token attempt from ${req.ip}: ${err.message}`);
    throw new AppError('Authentication required', 401);
  }

  // 3. Load fresh user from DB — role comes from DB, NOT from token
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { role: true },
  });

  if (!user || user.deletedAt || !user.isActive || user.accountLocked) {
    logger.warn(`Token valid but user unavailable: ${decoded.userId}`);
    throw new AppError('Authentication required', 401);
  }

  // 4. Block access until password is changed
  if (user.mustChangePassword) {
    throw new AppError('Password change required before accessing this resource', 403);
  }

  // 5. Attach to request — controllers use req.user
  req.user = user;
  next();
});

module.exports = protect;