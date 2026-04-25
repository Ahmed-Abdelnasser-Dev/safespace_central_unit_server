/**
 * AI module validation schemas
 *
 * Zod schemas for AI analysis test endpoints.
 */

const { z } = require('zod');

const aiAnalyzeSchema = {
  body: z.object({
    mediaPath: z.string().optional(),
    mediaPaths: z.array(z.string()).optional(),
    accidentPolygon: z
      .object({
        points: z.array(z.object({ x: z.number(), y: z.number() })).min(3),
        baseWidth: z.number().positive(),
        baseHeight: z.number().positive(),
      })
      .optional(),
    location: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .optional(),
  }).refine((data) => data.mediaPath || (Array.isArray(data.mediaPaths) && data.mediaPaths.length > 0), {
    message: 'Either mediaPath or mediaPaths is required',
    path: ['mediaPath'],
  }),
};

module.exports = {
  aiAnalyzeSchema,
};
