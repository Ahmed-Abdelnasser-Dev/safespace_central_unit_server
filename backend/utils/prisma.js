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
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { logger } = require('./logger');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for Prisma initialization');
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
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
module.exports.prisma = prisma;
module.exports.pool = pool;
console.log('DATABASE_URL IS:', process.env.DATABASE_URL)
