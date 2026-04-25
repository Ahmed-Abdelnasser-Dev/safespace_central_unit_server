/**
 * Activity logs validation schemas
 */

const { z } = require('zod');

const listActivityLogsSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(200).optional(),
    userId: z.string().uuid().optional(),
    eventType: z.string().optional(),
    success: z.enum(['true', 'false']).optional(),
  }),
};

module.exports = {
  listActivityLogsSchema,
};
