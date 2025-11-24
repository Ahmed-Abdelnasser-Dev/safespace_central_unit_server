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

module.exports = {
  accidentDetectedSchema,
  accidentDecisionSchema,
};
