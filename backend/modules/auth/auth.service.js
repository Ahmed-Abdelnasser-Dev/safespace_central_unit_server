/**
 * auth.service.js — Authentication service
 *
 * All business logic, DB access, and security enforcement lives here.
 * Controllers NEVER touch the database or tokens directly.
 *
 * Security model:
 * - Passwords verified with bcrypt
 * - Refresh tokens stored as SHA-256 hash (deterministic — needed for lookup)
 * - Access tokens are short-lived JWTs (15m)
 * - Account lockout enforced after MAX_LOGIN_ATTEMPTS failures
 * - mustChangePassword returns a flag — frontend redirects to change-password screen
 * - All security events written to audit_logs
 * - Role loaded from DB via relation — NEVER accepted from client
 */

const crypto  = require('crypto');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const prisma  = require('../../utils/prisma');
const AppError = require('../../utils/AppError');
const { logger } = require('../../utils/logger');

// ─── Config ───────────────────────────────────────────────────────────────────
// Hard crash on startup if secrets are missing — never silently fall back
const JWT_SECRET         = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN     = process.env.JWT_EXPIRES_IN     || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5;
const BCRYPT_ROUNDS      = parseInt(process.env.BCRYPT_ROUNDS, 10)      || 10;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  logger.error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in .env');
  process.exit(1);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * SHA-256 hash a token for storage/lookup.
 * Unlike bcrypt, SHA-256 is deterministic so we CAN search by it.
 * We use this for refresh tokens — bcrypt cannot be used for lookup.
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Sign a short-lived access JWT. Role comes from DB — never from client. */
function signAccessToken(userId, roleName) {
  return jwt.sign(
    { userId, role: roleName },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/** Write a security event to the audit log. Fire-and-forget — never block auth flow. */
async function audit({ userId, role, eventType, action, resource, success, failureReason, ipAddress, userAgent }) {
  try {
    await prisma.auditLog.create({
      data: { userId, role, eventType, action, resource, success, failureReason, ipAddress, userAgent },
    });
  } catch (err) {
    // Log but never let audit failure break auth
    logger.error('Audit log write failed: ' + err.message);
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Authenticate a user with email + password.
 *
 * Returns either:
 *   { mustChangePassword: true, userId }  — redirect to change-password screen
 *   { mfaRequired: true, userId }         — redirect to MFA screen
 *   { accessToken, refreshToken }         — full login success
 *
 * Security:
 * - Generic error message for all failure cases (no user enumeration)
 * - Account locked after MAX_LOGIN_ATTEMPTS failures
 * - Failed attempts incremented and logged
 * - Successful login resets failed attempt counter
 */
async function login({ email, password, ipAddress, userAgent }) {
  // Always load role relation so we never access undefined
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  // Generic message — never reveal whether email exists
  const GENERIC_ERROR = 'Invalid credentials';

  if (!user || !user.isActive || user.deletedAt) {
    logger.warn(`Login attempt for unknown/inactive account: ${email}`);
    await audit({ eventType: 'auth_failure', action: 'login', resource: 'users', success: false, failureReason: 'user_not_found', ipAddress, userAgent });
    throw new AppError(GENERIC_ERROR, 401);
  }

  // Check lockout BEFORE verifying password (prevents timing attacks on locked accounts)
  if (user.accountLocked) {
    logger.warn(`Login attempt on locked account: ${email}`);
    await audit({ userId: user.id, role: user.role.name, eventType: 'auth_failure', action: 'login', resource: 'users', success: false, failureReason: 'account_locked', ipAddress, userAgent });
    throw new AppError(GENERIC_ERROR, 401);
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, user.passwordHash);

  if (!validPassword) {
    const newAttempts = user.failedLoginAttempts + 1;
    const shouldLock  = newAttempts >= MAX_LOGIN_ATTEMPTS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newAttempts,
        lastFailedLoginAt:   new Date(),
        ...(shouldLock && { accountLocked: true, lockedAt: new Date(), lockedReason: 'Too many failed login attempts' }),
      },
    });

    if (shouldLock) {
      logger.warn(`Account locked after ${newAttempts} failed attempts: ${email}`);
      await audit({ userId: user.id, role: user.role.name, eventType: 'account_locked', action: 'login', resource: 'users', success: false, failureReason: 'max_attempts_exceeded', ipAddress, userAgent });
    } else {
      await audit({ userId: user.id, role: user.role.name, eventType: 'auth_failure', action: 'login', resource: 'users', success: false, failureReason: 'invalid_password', ipAddress, userAgent });
    }

    throw new AppError(GENERIC_ERROR, 401);
  }

  // Password correct — reset failed attempts
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lastLoginAt: new Date() },
  });

  // Force password change — issue FULL tokens so frontend can call /users/me,
  // but include mustChangePassword flag so frontend locks navigation to /profile.
  if (user.mustChangePassword) {
    const accessToken  = signAccessToken(user.id, user.role.name);
    const refreshToken = crypto.randomUUID();

    await prisma.refreshToken.create({
      data: {
        userId:    user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress,
        userAgent,
      },
    });

    await audit({ userId: user.id, role: user.role.name, eventType: 'auth_success', action: 'login', resource: 'users', success: true, failureReason: 'must_change_password', ipAddress, userAgent });
    logger.info(`User logged in (must change password): ${user.id} role=${user.role.name}`);
    return { mustChangePassword: true, userId: user.id, accessToken, refreshToken };
  }

  // MFA required
  if (user.mfaEnabled) {
    await audit({ userId: user.id, role: user.role.name, eventType: 'auth_partial', action: 'login', resource: 'users', success: true, failureReason: 'mfa_required', ipAddress, userAgent });
    return { mfaRequired: true, userId: user.id };
  }

  // Full login — issue tokens
  const accessToken  = signAccessToken(user.id, user.role.name);
  const refreshToken = crypto.randomUUID();

  await prisma.refreshToken.create({
    data: {
      userId:    user.id,
      tokenHash: hashToken(refreshToken),           // SHA-256 hash stored
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await audit({ userId: user.id, role: user.role.name, eventType: 'auth_success', action: 'login', resource: 'users', success: true, ipAddress, userAgent });
  logger.info(`User logged in: ${user.id} role=${user.role.name}`);

  return { accessToken, refreshToken };
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

/**
 * Issue a new access token using a valid refresh token.
 *
 * Security:
 * - Token is hashed with SHA-256 for lookup (bcrypt cannot be used here)
 * - Revoked and expired tokens are rejected
 * - Revocation rotates the token (old one is revoked, new one issued)
 */
async function refreshAccessToken(token, { ipAddress, userAgent } = {}) {
  const tokenHash = hashToken(token);

  const stored = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
    include: { user: { include: { role: true } } },
  });

  if (!stored) {
    await audit({ eventType: 'auth_failure', action: 'refresh_token', resource: 'users', success: false, failureReason: 'invalid_or_expired_refresh_token', ipAddress, userAgent });
    throw new AppError('Invalid or expired refresh token', 401);
  }

  if (!stored.user.isActive || stored.user.accountLocked) {
    throw new AppError('Account is inactive or locked', 401);
  }

  // Revoke old token and issue new ones (token rotation)
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data:  { isRevoked: true, revokedAt: new Date() },
  });

  const newRefreshToken = crypto.randomUUID();
  await prisma.refreshToken.create({
    data: {
      userId:    stored.userId,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress,
      userAgent,
    },
  });

  const accessToken = signAccessToken(stored.user.id, stored.user.role.name);

  return { accessToken, refreshToken: newRefreshToken };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

/**
 * Revoke a refresh token on logout.
 * Silent success even if token not found — prevents token probing.
 */
async function logout(token, { userId, ipAddress, userAgent } = {}) {
  const tokenHash = hashToken(token);

  await prisma.refreshToken.updateMany({
    where: { tokenHash, isRevoked: false },
    data:  { isRevoked: true, revokedAt: new Date() },
  });

  await audit({ userId, eventType: 'auth_logout', action: 'logout', resource: 'users', success: true, ipAddress, userAgent });
  logger.info(`User logged out: ${userId}`);
}

// ─── MFA Verify ───────────────────────────────────────────────────────────────

/**
 * Verify a TOTP/backup MFA code and issue tokens on success.
 *
 * Note: Real TOTP verification requires a library like `otplib`.
 * Backup codes are stored hashed — checked with bcrypt.
 */
async function verifyMfa({ userId, code, ipAddress, userAgent }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user || !user.mfaEnabled) {
    throw new AppError('MFA not enabled for this account', 400);
  }

  // Check each backup code with bcrypt (codes are stored hashed)
  let validBackupCode = false;
  let matchedCodeIndex = -1;

  for (let i = 0; i < user.mfaBackupCodes.length; i++) {
    const match = await bcrypt.compare(code, user.mfaBackupCodes[i]);
    if (match) {
      validBackupCode   = true;
      matchedCodeIndex  = i;
      break;
    }
  }

  if (!validBackupCode) {
    await audit({ userId, role: user.role.name, eventType: 'auth_failure', action: 'mfa_verify', resource: 'users', success: false, failureReason: 'invalid_mfa_code', ipAddress, userAgent });
    throw new AppError('Invalid MFA code', 401);
  }

  // Consume the backup code (one-time use)
  const updatedCodes = user.mfaBackupCodes.filter((_, i) => i !== matchedCodeIndex);
  await prisma.user.update({
    where: { id: userId },
    data:  { mfaBackupCodes: updatedCodes },
  });

  // MFA passed — issue full tokens
  const accessToken  = signAccessToken(user.id, user.role.name);
  const refreshToken = crypto.randomUUID();

  await prisma.refreshToken.create({
    data: {
      userId:    user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress,
      userAgent,
    },
  });

  await audit({ userId, role: user.role.name, eventType: 'auth_success', action: 'mfa_verify', resource: 'users', success: true, ipAddress, userAgent });

  return { accessToken, refreshToken };
}

// (exports consolidated at bottom)


// ─── Change Password ───────────────────────────────────────────────────────────

/**
 * Change a user's password.
 * Used for both:
 *   a) Forced first-login password change (mustChangePassword = true)
 *   b) Voluntary password change from profile settings
 *
 * Security:
 * - Current password must be verified before allowing change
 * - New password checked against last PASSWORD_HISTORY_LIMIT hashes
 * - mustChangePassword flag cleared after successful change
 * - Audit logged
 */
async function changePassword({ userId, currentPassword, newPassword, ipAddress, userAgent }) {
  const PASSWORD_HISTORY_LIMIT = parseInt(process.env.PASSWORD_HISTORY_LIMIT, 10) || 5;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user) throw new AppError('User not found', 404);

  // Verify current password
  const validCurrent = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!validCurrent) {
    await audit({ userId, role: user.role.name, eventType: 'auth_failure', action: 'change_password', resource: 'users', success: false, failureReason: 'wrong_current_password', ipAddress, userAgent });
    throw new AppError('Current password is incorrect', 401);
  }

  // Check password history — prevent reuse of last N passwords
  const history = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: PASSWORD_HISTORY_LIMIT,
  });

  for (const entry of history) {
    const reused = await bcrypt.compare(newPassword, entry.passwordHash);
    if (reused) {
      throw new AppError(`You cannot reuse any of your last ${PASSWORD_HISTORY_LIMIT} passwords`, 400);
    }
  }

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // Save old password to history before overwriting
  await prisma.passwordHistory.create({
    data: { userId, passwordHash: user.passwordHash },
  });

  // Update user
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash:       newHash,
      mustChangePassword: false,
      passwordChangedAt:  new Date(),
    },
  });

  await audit({ userId, role: user.role.name, eventType: 'password_change', action: 'change_password', resource: 'users', success: true, ipAddress, userAgent });
  logger.info(`Password changed for user: ${userId}`);
}

module.exports = { login, refreshAccessToken, logout, verifyMfa, changePassword };