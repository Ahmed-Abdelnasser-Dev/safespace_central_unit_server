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

module.exports = {
  accidentDetectedSchema,
};
