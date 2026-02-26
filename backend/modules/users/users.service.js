/**
 * users.service.js — User management service
 *
 * Handles:
 *   - Admin: list all users, create user, deactivate user
 *   - Self: get own profile, update own profile
 *
 * Security:
 * - Admin creation only — users never self-register
 * - Passwords hashed before storage, never returned in queries
 * - Role assigned by admin only — never from request body trust
 * - National ID and Employee ID are read-only after creation
 * - Profile photo URL validated — stored path only, not user-provided URL
 * - Soft delete only — audit trail preserved
 */

const bcrypt   = require('bcrypt');
const crypto   = require('crypto');
const prisma   = require('../../utils/prisma');
const AppError = require('../../utils/AppError');
const { logger } = require('../../utils/logger');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;

// ─── List all users (admin only) ──────────────────────────────────────────────
async function listUsers({ page = 1, limit = 20, role, isActive } = {}) {
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(role     && { role: { name: role } }),
    ...(isActive !== undefined && { isActive }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id:                  true,
        email:               true,
        employeeId:          true,
        fullName:            true,
        username:            true,
        department:          true,
        officeLocation:      true,
        isActive:            true,
        accountLocked:       true,
        mustChangePassword:  true,
        lastLoginAt:         true,
        createdAt:           true,
        profilePhotoUrl:     true,
        role: { select: { name: true } },
        // Never return: passwordHash, mfaSecret, mfaBackupCodes, nationalId
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ─── Get single user (admin) or self ──────────────────────────────────────────
async function getUserById(targetId, requestingUser) {
  // Users can only fetch their own profile unless they are admin
  if (requestingUser.role.name !== 'admin' && requestingUser.id !== targetId) {
    throw new AppError('You do not have permission to view this profile', 403);
  }

  const user = await prisma.user.findUnique({
    where: { id: targetId, deletedAt: null },
    select: {
      id:              true,
      email:           true,
      employeeId:      true,
      nationalId:      true,
      fullName:        true,
      username:        true,
      phone:           true,
      birthdate:       true,
      address:         true,
      gender:          true,
      department:      true,
      officeLocation:  true,
      profilePhotoUrl: true,
      isActive:        true,
      accountLocked:   true,
      lastLoginAt:     true,
      createdAt:       true,
      mustChangePassword: true,
      mfaEnabled:      true,
      role: { select: { name: true, description: true } },
    },
  });

  if (!user) throw new AppError('User not found', 404);
  return user;
}

// ─── Create user (admin only) ─────────────────────────────────────────────────
async function createUser({ email, roleId, nationalId, employeeId, createdByUserId }) {
  // Check for duplicates
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { nationalId }, { employeeId }], deletedAt: null },
  });

  if (existing) {
    if (existing.email === email)           throw new AppError('Email already in use', 409);
    if (existing.nationalId === nationalId) throw new AppError('National ID already registered', 409);
    if (existing.employeeId === employeeId) throw new AppError('Employee ID already registered', 409);
  }

  // Generate a secure temporary password
  const tempPassword = crypto.randomBytes(12).toString('base64url');
  const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      roleId,
      nationalId,
      employeeId,
      mustChangePassword: true,
      createdByUserId,
    },
    select: {
      id:         true,
      email:      true,
      employeeId: true,
      nationalId: true,
      mustChangePassword: true,
      role: { select: { name: true } },
    },
  });

  logger.info(`Admin ${createdByUserId} created user ${user.id} (${email})`);

  // Return tempPassword once so admin can share with user — never stored in plain text again
  return { ...user, tempPassword };
}

// ─── Update own profile (self) ────────────────────────────────────────────────
async function updateMyProfile(userId, { username, fullName, phone, birthdate, address, gender, department, officeLocation }) {
  // Check username uniqueness if being changed
  if (username) {
    const taken = await prisma.user.findFirst({
      where: { username, id: { not: userId }, deletedAt: null },
    });
    if (taken) throw new AppError('Username already taken', 409);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(username       !== undefined && { username }),
      ...(fullName       !== undefined && { fullName }),
      ...(phone          !== undefined && { phone }),
      ...(birthdate      !== undefined && { birthdate: new Date(birthdate) }),
      ...(address        !== undefined && { address }),
      ...(gender         !== undefined && { gender }),
      ...(department     !== undefined && { department }),
      ...(officeLocation !== undefined && { officeLocation }),
    },
    select: {
      id: true, email: true, username: true, fullName: true,
      phone: true, birthdate: true, address: true, gender: true,
      department: true, officeLocation: true, profilePhotoUrl: true,
      role: { select: { name: true } },
    },
  });

  logger.info(`User ${userId} updated their profile`);
  return updated;
}

// ─── Update profile photo ──────────────────────────────────────────────────────
async function updateProfilePhoto(userId, photoUrl) {
  return prisma.user.update({
    where: { id: userId },
    data: { profilePhotoUrl: photoUrl },
    select: { id: true, profilePhotoUrl: true },
  });
}

// ─── Deactivate user (admin only, soft) ───────────────────────────────────────
async function deactivateUser(targetId, adminId) {
  if (targetId === adminId) throw new AppError('You cannot deactivate your own account', 400);

  const user = await prisma.user.findUnique({ where: { id: targetId, deletedAt: null } });
  if (!user) throw new AppError('User not found', 404);

  await prisma.user.update({
    where: { id: targetId },
    data: { isActive: false },
  });

  logger.info(`Admin ${adminId} deactivated user ${targetId}`);
}

// ─── Reactivate user (admin only) ─────────────────────────────────────────────
async function reactivateUser(targetId, adminId) {
  const user = await prisma.user.findUnique({ where: { id: targetId, deletedAt: null } });
  if (!user) throw new AppError('User not found', 404);

  await prisma.user.update({
    where: { id: targetId },
    data: { isActive: true, accountLocked: false, failedLoginAttempts: 0, lockedAt: null, lockedReason: null },
  });

  logger.info(`Admin ${adminId} reactivated user ${targetId}`);
}

module.exports = { listUsers, getUserById, createUser, updateMyProfile, updateProfilePhoto, deactivateUser, reactivateUser };