/**
 * Decision module validation schemas
 *
 * Zod schemas for decision analysis endpoints.
 */

const { z } = require('zod');

const decisionAnalyzeSchema = {
  body: z.object({
    nodeId: z.number().int().positive(),
    lanNumber: z.number().int().positive(),
    accidentPolygon: z.object({
      points: z.array(z.object({ x: z.number(), y: z.number() })).min(3),
      baseWidth: z.number().positive(),
      baseHeight: z.number().positive(),
    }),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }),
    aiResults: z
      .object({
        severity: z.number().min(0).max(1).optional(),
        recommendations: z.array(z.string()).optional(),
      })
      .optional(),
  }),
};

module.exports = {
  decisionAnalyzeSchema,
};
