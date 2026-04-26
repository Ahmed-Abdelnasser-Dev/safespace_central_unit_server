/**
 * auth.schema.js — Zod validation schemas for Auth endpoints
 *
 * Each export wraps the schema in { body } so the validate middleware
 * correctly calls schema.body.parse(req.body).
 *
 * IMPORTANT: validate() middleware expects { body?, params?, query? }.
 * Passing a raw Zod object would silently skip all validation.
 */

const { z } = require('zod');

// ─── Login ────────────────────────────────────────────────────────────────────
const loginSchema = {
  body: z.object({
    email:    z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
};

// ─── Refresh token ────────────────────────────────────────────────────────────
const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logoutSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
};

// ─── MFA verification ─────────────────────────────────────────────────────────
const mfaVerifySchema = {
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    code:   z.string().length(6, 'MFA code must be 6 characters'),
  }),
};



// ─── Change Password ──────────────────────────────────────────────────────────
const changePasswordSchema = {
  body: z.object({
    userId:          z.string().uuid().optional(), // only required for first-login (unauthenticated)
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  }),
};

// re-export with new schema added
module.exports = { loginSchema, refreshSchema, logoutSchema, mfaVerifySchema, changePasswordSchema };