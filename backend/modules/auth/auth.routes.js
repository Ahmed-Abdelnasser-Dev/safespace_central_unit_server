/**
 * auth.routes.js — Auth routes
 *
 * Public routes (no protect middleware):
 *   POST /api/auth/login
 *   POST /api/auth/refresh
 *   POST /api/auth/logout
 *   POST /api/auth/mfa/verify
 *   POST /api/auth/change-password  ← also public so first-login (no token yet) can use it
 *
 * All inputs validated via Zod before hitting controller.
 */

const express        = require('express');
const router         = express.Router();
const rateLimit      = require('express-rate-limit');
const authController = require('./auth.controller');
const validate       = require('../../middleware/validate');
const {
  loginSchema,
  refreshSchema,
  logoutSchema,
  mfaVerifySchema,
  changePasswordSchema,
} = require('./auth.schema');

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,   // 5 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Try again in 5 minutes.' },
});

const mfaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many MFA attempts. Try again in 15 minutes.' },
});

router.post('/login',           loginLimiter, validate(loginSchema),          authController.login);
router.post('/refresh',         validate(refreshSchema),        authController.refreshToken);
router.post('/logout',          validate(logoutSchema),         authController.logout);
router.post('/mfa/verify',      mfaLimiter,   validate(mfaVerifySchema),      authController.verifyMfa);
router.post('/change-password', loginLimiter, validate(changePasswordSchema), authController.changePassword);

module.exports = router;