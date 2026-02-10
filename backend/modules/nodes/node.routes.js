/**
 * Node Routes
 * 
 * HTTP route definitions for node management.
 * All routes are mounted under /api/nodes.
 * 
 * @module modules/nodes/node.routes
 */

const express = require('express');
const validate = require('../../middleware/validate');
const { heartbeatSchema, nodeRegistrationSchema, deleteNodeSchema, updateNodeSchema } = require('./node.schema');
const { uploadSnapshot } = require('../../middleware/upload');
const nodeController = require('./node.controller');

const router = express.Router();

// ============================================
// NODE HEARTBEAT & REGISTRATION
// ============================================

/**
 * POST /api/nodes/heartbeat
 * Receive heartbeat from detection node
 */
router.post(
  '/heartbeat',
  validate(heartbeatSchema),
  nodeController.handleHeartbeat
);

/**
 * POST /api/nodes/register
 * Register a new detection node
 */
router.post(
  '/register',
  validate(nodeRegistrationSchema),
  nodeController.registerNode
);

/**
 * POST /api/nodes/:nodeId/snapshot
 * Upload incident snapshot from node
 */
router.post(
  '/:nodeId/snapshot',
  uploadSnapshot.single('file'),
  nodeController.uploadSnapshot
);

// ============================================
// NODE MANAGEMENT (ADMIN)
// ============================================

/**
 * GET /api/nodes
 * Get all registered nodes
 */
router.get('/', nodeController.getAllNodes);

/**
 * GET /api/nodes/:nodeId
 * Get specific node by ID
 */
router.get('/:nodeId', nodeController.getNodeById);

/**
 * PATCH /api/nodes/:nodeId
 * Update node configuration
 */
router.patch('/:nodeId', validate(updateNodeSchema), nodeController.updateNodeConfig);

/**
 * DELETE /api/nodes/:nodeId
 * Delete a node
 */
router.delete('/:nodeId', validate(deleteNodeSchema), nodeController.deleteNode);

module.exports = router;
