// utils/prisma.js
// ─────────────────────────────────────────────────────────────────────────────
// Single Prisma client instance shared across the whole backend.
// Import this file wherever you need DB access:
//
// INTIALS VALUES MUST EXIST FOR ALL SYSTEMS
// 
// TO implement seed RUN "npm run db:seed"
//
// ─────────────────────────────────────────────────────────────────────────────

const { PrismaClient } = require('@prisma/client');
const { logger } = require('./logger');

const prisma = new PrismaClient({
  log: [
    { level: 'error',   emit: 'event' },
    { level: 'warn',    emit: 'event' },
    // Uncomment below to log every query (useful for debugging, noisy in prod)
    // { level: 'query', emit: 'event' },
  ],
});

// Forward Prisma errors/warnings to your Winston logger
prisma.$on('error', (e) => logger.error('Prisma error: ' + e.message));
prisma.$on('warn',  (e) => logger.warn('Prisma warning: ' + e.message));

module.exports = prisma;
