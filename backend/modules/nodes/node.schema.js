/**
 * Node Validation Schemas
 * 
 * Zod validation schemas for node-related requests.
 * All node data must pass through these schemas.
 * 
 * @module modules/nodes/node.schema
 */

const { z } = require('zod');

/**
 * Heartbeat Schema
 * Validates heartbeat data from detection nodes
 */
const heartbeatSchema = z.object({
  body: z.object({
    type: z.literal('heartbeat'),
    nodeId: z.string().min(1, 'Node ID is required'),
    timestamp: z.string().datetime('Invalid ISO timestamp'),
    status: z.enum(['online', 'offline']),
    uptimeSec: z.number().int().nonnegative(),
    health: z.object({
      cpu: z.number().min(0).max(100),
      temperature: z.number().min(0).max(150),
      memory: z.number().min(0).max(100),
      network: z.number().min(0).max(100),
      storage: z.number().min(0).max(100),
      currentFps: z.number().min(0).max(120),
    }).optional(),
    firmwareVersion: z.string().optional(),
    modelVersion: z.string().optional(),
    // New telemetry fields
    frameRate: z.number().int().min(1).max(120).optional(),
    resolution: z.string().optional(),
    sensitivity: z.number().min(0).max(1).optional(),
    minObjectSize: z.number().int().min(1).optional(),
    bandwidth: z.number().min(0).optional(),
    // Telemetry
    cpu: z.number().min(0).max(100).optional(),
    temperature: z.number().min(0).max(150).optional(),
    memory: z.number().min(0).max(100).optional(),
    network: z.number().min(0).max(100).optional(),
    storage: z.number().min(0).max(100).optional(),
    // Location & Network
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    ipAddress: z.string().optional(),
    videoFeedUrl: z.string().url().optional(),
    // Road/Lane data
    lanes: z.array(z.any()).optional(),
    laneStatus: z.string().optional(),
    speedLimit: z.number().int().min(0).optional(),
    streetName: z.string().optional(),
  }),
});

/**
 * Node Registration Schema
 * For new nodes connecting to the central unit
 */
const nodeRegistrationSchema = z.object({
  body: z.object({
    nodeId: z.string().min(1, 'Node ID is required'),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      address: z.string().optional(),
    }),
    nodeSpecs: z.object({
      cameraResolution: z.string(),
      frameRate: z.number().int().positive(),
      ipAddress: z.string().ip(),
      bandwidth: z.string(),
      detectionSensitivity: z.number().min(0).max(100),
      minObjectSize: z.number().int().positive(),
    }),
    firmwareVersion: z.string().optional(),
    modelVersion: z.string().optional(),
  }),
});

/**
 * Node Delete Schema
 * Validates node id for delete requests
 */
const deleteNodeSchema = z.object({
  params: z.object({
    nodeId: z.string().min(1, 'Node ID is required'),
  }),
});

/**
 * Node Update/Edit Schema
 * For editing node properties like name, street name, IP address, location
 */
const updateNodeSchema = z.object({
  params: z.object({
    nodeId: z.string().min(1, 'Node ID is required'),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    streetName: z.string().min(1).max(255).optional(),
    ipAddress: z.string().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    videoFeedUrl: z.string().url().optional(),
    frameRate: z.number().int().min(1).max(120).optional(),
    resolution: z.string().optional(),
    sensitivity: z.number().min(0).max(1).optional(),
    minObjectSize: z.number().int().min(1).optional(),
    speedLimit: z.number().int().min(0).optional(),
  }),
});

module.exports = {
  heartbeatSchema,
  nodeRegistrationSchema,
  deleteNodeSchema,
  updateNodeSchema,
};
