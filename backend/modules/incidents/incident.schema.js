/**
 * Incident Validation Schemas
 * 
 * Zod schemas for validating accident detection endpoint inputs.
 * Implements strict validation rules per Security Guidelines.
 * 
 * @module modules/incidents/incident.schema
 */

const { z } = require('zod');

/**
 * Schema for accident-detected endpoint body validation
 * Note: multipart/form-data fields come as strings, so we parse them
 */
const accidentDetectedSchema = z.object({
  body: z.object({
    lat: z.string({
      required_error: 'Latitude is required',
    }).min(1, 'Latitude cannot be empty'),

    long: z.string({
      required_error: 'Longitude is required',
    }).min(1, 'Longitude cannot be empty'),

    lanNumber: z.string({
      required_error: 'Lane number is required',
    }).refine((val) => !isNaN(parseInt(val, 10)), {
      message: 'lanNumber must be a valid integer',
    }),

    nodeId: z.string({
      required_error: 'Node ID is required',
    }).min(1, 'Node ID cannot be empty'),

    accidentPolygon: z.string({
      required_error: 'Accident polygon is required for decision analysis',
    }).transform((val, ctx) => {
      try {
        const parsed = JSON.parse(val);
        
        // Validate structure
        if (!parsed.points || !Array.isArray(parsed.points)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'accidentPolygon must contain a points array',
          });
          return z.NEVER;
        }
        
        if (parsed.points.length < 3) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'accidentPolygon must have at least 3 points',
          });
          return z.NEVER;
        }
        
        // Validate each point has x and y coordinates
        const invalidPoint = parsed.points.find(p => 
          typeof p.x !== 'number' || typeof p.y !== 'number'
        );
        
        if (invalidPoint) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'All points must have numeric x and y coordinates',
          });
          return z.NEVER;
        }
        
        // Validate baseWidth and baseHeight
        if (typeof parsed.baseWidth !== 'number' || parsed.baseWidth <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'accidentPolygon must have a valid baseWidth',
          });
          return z.NEVER;
        }
        
        if (typeof parsed.baseHeight !== 'number' || parsed.baseHeight <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'accidentPolygon must have a valid baseHeight',
          });
          return z.NEVER;
        }
        
        return parsed;
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `accidentPolygon must be valid JSON. Received: ${val.substring(0, 100)}... Error: ${error.message}`,
        });
        return z.NEVER;
      }
    }),
  }),
  files: z.array(z.any(), {
    required_error: 'At least one media file is required (images/videos)',
    invalid_type_error: 'Media must be an array of files',
  }).min(1, 'At least one media file is required (images/videos)'),
});

/**
 * Schema for accident decision review (admin/operator confirmation)
 * Supports: CONFIRMED, MODIFIED, REJECTED
 * Validates actions, speed limits, and lane configurations.
 */
const accidentDecisionSchema = z.object({
  body: z.object({
    incidentId: z.string({ required_error: 'incidentId is required' }),
    nodeId: z.number({ required_error: 'nodeId is required' }).int().positive(),
    status: z.enum(['CONFIRMED', 'MODIFIED', 'REJECTED'], {
      required_error: 'status must be CONFIRMED, MODIFIED, or REJECTED'
    }),
    actions: z.array(z.string()).optional(), // Array of action strings
    message: z.string().optional(),
    speedLimit: z.number().int().min(20).max(200).optional(), // Modified speed limit
    laneConfiguration: z.string().optional(), // Modified lane config (e.g., "open,blocked,right")
  }).refine((data) => {
    // CONFIRMED: must have at least one action
    if (data.status === 'CONFIRMED') {
      return Array.isArray(data.actions) && data.actions.length > 0;
    }
    // REJECTED: must include message
    if (data.status === 'REJECTED') {
      return typeof data.message === 'string' && data.message.length > 2;
    }
    // MODIFIED: should have some modified data
    if (data.status === 'MODIFIED') {
      return data.speedLimit !== undefined || 
             data.laneConfiguration !== undefined || 
             (Array.isArray(data.actions) && data.actions.length > 0);
    }
    return false;
  }, {
    message: 'Invalid decision: CONFIRMED needs actions, REJECTED needs message, MODIFIED needs at least one modification.'
  }),
});

/**
 * Schema for mobile/external accident report endpoint
 * Accepts reports from external servers without multipart uploads
 */
const mobileAccidentDetectedSchema = z.object({
  body: z.object({
    description: z.string({
      required_error: 'Description is required',
    }).min(1, 'Description cannot be empty'),
    
    latitude: z.string({
      required_error: 'Latitude is required',
    }).min(1, 'Latitude cannot be empty')
      .transform(val => parseFloat(val)),
    
    longitude: z.string({
      required_error: 'Longitude is required',
    }).min(1, 'Longitude cannot be empty')
      .transform(val => parseFloat(val)),
    
    occurredAt: z.string().optional(),
  }),
  files: z.array(z.any(), {
    required_error: 'At least one media file is required (images/videos)',
    invalid_type_error: 'Media must be an array of files',
  }).min(1, 'At least one media file is required (images/videos)'),
});

/**
 * Schema for server-to-server Mobile->Central accident report
 * Expected JSON body (application/json):
 * {
 *   accidentId: string,
 *   description: string,
 *   latitude: number,
 *   longitude: number,
 *   severity: string,
 *   media: [{ type: 'image'|'video', url: string }]
 * }
 */
const mobileServerToCentralSchema = z.object({
  body: z.object({
    accidentId: z.string().optional(),
    description: z.string({ required_error: 'description is required' }).min(1),
    latitude: z.number({ required_error: 'latitude is required' }).refine((v) => v >= -90 && v <= 90, { message: 'latitude must be between -90 and 90' }),
    longitude: z.number({ required_error: 'longitude is required' }).refine((v) => v >= -180 && v <= 180, { message: 'longitude must be between -180 and 180' }),
    severity: z.enum(['low', 'medium', 'high']).optional(),
    // media.url may be a full URL or a server-local path (starting with '/')
    media: z.array(z.object({
      type: z.enum(['image', 'video']),
      url: z.string().refine((v) => typeof v === 'string' && (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/')), { message: 'url must be a full URL or an absolute path starting with /' })
    })).optional(),
  })
});

/**
 * Schema for node snapshot upload
 * POST /api/nodes/:nodeId/snapshot
 */
const nodeSnapshotSchema = z.object({
  body: z.object({
    incident_id: z.string().optional(),
    timestamp: z.string(),
    incident_type: z.string(),
    confidence: z.string().transform(val => parseFloat(val)),
  }),
  params: z.object({
    nodeId: z.string().min(1, 'Node ID is required'),
  }),
  files: z.array(z.any()).min(1, 'Snapshot image is required'),
});

module.exports = {
  accidentDetectedSchema,
  accidentDecisionSchema,
  mobileAccidentDetectedSchema,
  mobileServerToCentralSchema,
  nodeSnapshotSchema,
};

