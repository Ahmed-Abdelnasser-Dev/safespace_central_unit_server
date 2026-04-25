/**
 * Node Controller
 * 
 * HTTP request handlers for node-related operations.
 * Controllers are thin; all logic lives in node.service.js.
 * 
 * @module modules/nodes/node.controller
 */

const catchAsync = require('../../middleware/catchAsync');
const nodeService = require('./node.service');
const { logger } = require('../../utils/logger');

/**
 * Handle heartbeat from detection node
 * 
 * @route POST /api/nodes/heartbeat
 * @access Public (but should be authenticated in production)
 */
exports.handleHeartbeat = catchAsync(async (req, res) => {
  const result = await nodeService.processHeartbeat(req.body);
  
  // Emit heartbeat to connected dashboard clients via Socket.IO
  const io = req.app.get('io');
  if (io) {
    io.emit('node_heartbeat', {
      nodeId: req.body.nodeId,
      status: req.body.status,
      health: req.body.health,
      timestamp: req.body.timestamp,
      uptimeSec: req.body.uptimeSec,
      firmwareVersion: req.body.firmwareVersion,
      modelVersion: req.body.modelVersion,
      // New telemetry fields
      frameRate: req.body.frameRate,
      resolution: req.body.resolution,
      sensitivity: req.body.sensitivity,
      minObjectSize: req.body.minObjectSize,
      bandwidth: req.body.bandwidth,
      cpu: req.body.cpu || req.body.health?.cpu,
      temperature: req.body.temperature || req.body.health?.temperature,
      memory: req.body.memory || req.body.health?.memory,
      network: req.body.network || req.body.health?.network,
      storage: req.body.storage || req.body.health?.storage,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      ipAddress: req.body.ipAddress,
      videoFeedUrl: req.body.videoFeedUrl,
      lanes: req.body.lanes,
      laneStatus: req.body.laneStatus,
      speedLimit: req.body.speedLimit,
      streetName: req.body.streetName,
    });
  }

  res.status(200).json(result);
});

/**
 * Register a new node
 * 
 * @route POST /api/nodes/register
 * @access Public (but should be authenticated in production)
 */
exports.registerNode = catchAsync(async (req, res) => {
  const result = await nodeService.registerNode(req.body);
  
  res.status(201).json(result);
});

/**
 * Get all nodes
 * 
 * @route GET /api/nodes
 * @access Public (should be admin-only in production)
 */
exports.getAllNodes = catchAsync(async (req, res) => {
  const nodes = await nodeService.getAllNodes();
  
  res.status(200).json({
    status: 'success',
    results: nodes.length,
    data: nodes,
  });
});

/**
 * Get a specific node by ID
 * 
 * @route GET /api/nodes/:nodeId
 * @access Public (should be admin-only in production)
 */
exports.getNodeById = catchAsync(async (req, res) => {
  const node = await nodeService.getNodeById(req.params.nodeId);
  
  res.status(200).json({
    status: 'success',
    data: node,
  });
});

/**
 * Update node configuration
 * 
 * @route PATCH /api/nodes/:nodeId
 * @access Admin only
 */
exports.updateNodeConfig = catchAsync(async (req, res) => {
  const node = await nodeService.updateNodeConfig(req.params.nodeId, req.body);
  
  // Emit config update to node via Socket.IO
  const io = req.app.get('io');
  if (io) {
    io.emit('node_config_update', {
      nodeId: req.params.nodeId,
      config: req.body,
      timestamp: new Date().toISOString(),
    });
  }

  res.status(200).json({
    status: 'success',
    data: node,
  });
});

/**
 * Delete a node
 * 
 * @route DELETE /api/nodes/:nodeId
 * @access Admin only
 */
exports.deleteNode = catchAsync(async (req, res) => {
  const deletedNode = await nodeService.deleteNode(req.params.nodeId);

  const io = req.app.get('io');
  if (io) {
    io.emit('node_deleted', {
      nodeId: deletedNode.nodeId,
      timestamp: new Date().toISOString(),
    });
  }

  res.status(200).json({
    status: 'success',
    data: deletedNode,
  });
});

/**
 * Upload snapshot from detection node
 * 
 * @route POST /api/nodes/:nodeId/snapshot
 * @access Public (should be authenticated in production)
 */
exports.uploadSnapshot = catchAsync(async (req, res) => {
  const { nodeId } = req.params;
  const { incident_id, timestamp, incident_type, confidence } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      status: 'error',
      message: 'No snapshot file provided',
    });
  }

  logger.info(`Snapshot uploaded from ${nodeId}: ${file.filename}, type=${incident_type}, confidence=${confidence}`);

  // Broadcast snapshot to dashboards
  const io = req.app.get('io');
  if (io) {
    io.emit('node_snapshot', {
      nodeId,
      incidentId: incident_id,
      timestamp,
      incidentType: incident_type,
      confidence: parseFloat(confidence),
      snapshotPath: `/uploads/snapshots/${file.filename}`,
      filename: file.filename,
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Snapshot uploaded successfully',
    data: {
      filename: file.filename,
      path: `/uploads/snapshots/${file.filename}`,
      incidentType: incident_type,
      timestamp,
    },
  });
});

