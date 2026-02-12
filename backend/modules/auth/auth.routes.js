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
const authController = require('./auth.controller');
const validate       = require('../../middleware/validate');
const {
  loginSchema,
  refreshSchema,
  logoutSchema,
  mfaVerifySchema,
  changePasswordSchema,
} = require('./auth.schema');

router.post('/login',           validate(loginSchema),          authController.login);
router.post('/refresh',         validate(refreshSchema),        authController.refreshToken);
router.post('/logout',          validate(logoutSchema),         authController.logout);
router.post('/mfa/verify',      validate(mfaVerifySchema),      authController.verifyMfa);
router.post('/change-password', validate(changePasswordSchema), authController.changePassword);

module.exports = router;