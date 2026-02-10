/**
 * Prisma Client Singleton
 * 
 * Provides a single Prisma client instance across the app.
 * 
 * @module utils/prisma
 */

const { PrismaClient } = require('@prisma/client');

/**
 * Shared Prisma client instance
 */
const prisma = new PrismaClient();

module.exports = {
  prisma,
};
