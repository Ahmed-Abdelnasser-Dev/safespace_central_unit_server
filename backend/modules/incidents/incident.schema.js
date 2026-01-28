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
    }).refine((val) => !isNaN(parseInt(val, 10)), {
      message: 'nodeId must be a valid integer',
    }),
  }),
  files: z.array(z.any(), {
    required_error: 'At least one media file is required (images/videos)',
    invalid_type_error: 'Media must be an array of files',
  }).min(1, 'At least one media file is required (images/videos)'),
});

/**
 * Schema for accident decision review (admin/operator confirmation)
 * Validates actions selected or rejection status.
 */
const accidentDecisionSchema = z.object({
  body: z.object({
    incidentId: z.string({ required_error: 'incidentId is required' }),
    nodeId: z.number({ required_error: 'nodeId is required' }).int().positive(),
    status: z.enum(['CONFIRMED', 'REJECTED']),
    actions: z.array(z.enum(['reduce-speed', 'block-routes', 'call-emergency'])).optional(),
    message: z.string().optional(),
  }).refine((data) => {
    // If confirmed must have at least one action
    if (data.status === 'CONFIRMED') return Array.isArray(data.actions) && data.actions.length > 0;
    // If rejected must include message
    if (data.status === 'REJECTED') return typeof data.message === 'string' && data.message.length > 2;
    return false;
  }, {
    message: 'Invalid decision payload: CONFIRMED requires actions; REJECTED requires message.'
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
    
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
      required_error: 'Severity must be one of: LOW, MEDIUM, HIGH, CRITICAL',
    }),
  }),
});

module.exports = {
  accidentDetectedSchema,
  accidentDecisionSchema,
  mobileAccidentDetectedSchema,
};
