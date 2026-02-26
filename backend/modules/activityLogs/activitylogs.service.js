/**
 * activityLogs.service.js — Audit log reader service
 *
 * Read-only. Audit logs are append-only — never modified or deleted.
 * Admin sees all logs. Other roles see only their own.
 */

const prisma   = require('../../utils/prisma');
const AppError = require('../../utils/AppError');

async function getLogs({ requestingUser, page = 1, limit = 50, userId, eventType, success }) {
  const skip  = (page - 1) * limit;
  const isAdmin = requestingUser.role.name === 'admin';

  // Non-admins can only see their own logs
  const targetUserId = isAdmin ? userId : requestingUser.id;

  const where = {
    ...(targetUserId !== undefined && { userId: targetUserId }),
    ...(eventType    !== undefined && { eventType }),
    ...(success      !== undefined && { success }),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { timestamp: 'desc' },
      select: {
        id:            true,
        role:          true,
        eventType:     true,
        action:        true,
        resource:      true,
        success:       true,
        failureReason: true,
        ipAddress:     true,
        timestamp:     true,
        user: { select: { fullName: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  // AuditLog.id is BigInt — JSON.stringify can't serialize BigInt, convert to string
  const serializedLogs = logs.map(log => ({
    ...log,
    id: log.id !== undefined && log.id !== null ? log.id.toString() : log.id,
  }));

  return { logs: serializedLogs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

module.exports = { getLogs };