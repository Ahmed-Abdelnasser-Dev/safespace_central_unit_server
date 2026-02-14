/**
 * auth.controller.js — Auth controller
 *
 * Thin layer only: extract input → call service → return response.
 * IP and User-Agent are extracted here and passed to the service
 * so the audit log has full context without the service touching req.
 */

const catchAsync  = require('../../middleware/catchAsync');
const authService = require('./auth.service');

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];

  const result = await authService.login({ email, password, ipAddress, userAgent });

  res.status(200).json({ status: 'success', data: result });
});

// ─── Refresh token ────────────────────────────────────────────────────────────
exports.refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];

  const tokens = await authService.refreshAccessToken(refreshToken, { ipAddress, userAgent });

  res.status(200).json({ status: 'success', data: tokens });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
exports.logout = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];

  // userId may be available if protect middleware runs before logout
  const userId = req.user?.id;

  await authService.logout(refreshToken, { userId, ipAddress, userAgent });

  res.status(200).json({ status: 'success', message: 'Logged out successfully' });
});

// ─── MFA verify ───────────────────────────────────────────────────────────────
exports.verifyMfa = catchAsync(async (req, res, next) => {
  const { userId, code } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];

  const result = await authService.verifyMfa({ userId, code, ipAddress, userAgent });

  res.status(200).json({ status: 'success', data: result });
});

// ─── Change Password ──────────────────────────────────────────────────────────
exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const userId    = req.body.userId || req.user?.id; // req.user if protect runs, else from body for first-login
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];

  await authService.changePassword({ userId, currentPassword, newPassword, ipAddress, userAgent });

  res.status(200).json({ status: 'success', message: 'Password changed successfully' });
});