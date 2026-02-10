/**
 * Node Service
 * 
 * Business logic for node management, heartbeat processing,
 * and health monitoring.
 * 
 * @module modules/nodes/node.service
 */

const { logger } = require('../../utils/logger');
const AppError = require('../../utils/AppError');
const { prisma } = require('../../utils/prisma');

// Heartbeat timeout threshold (in milliseconds)
const HEARTBEAT_TIMEOUT = 60000; // 60 seconds

/**
 * Process heartbeat from a detection node
 * 
 * @param {object} heartbeatData - Heartbeat payload from node
 * @returns {object} Acknowledgment response
 */
async function processHeartbeat(heartbeatData) {
  const { 
    nodeId, 
    timestamp, 
    status, 
    uptimeSec, 
    health = {}, 
    firmwareVersion, 
    modelVersion,
    // Camera/Config
    frameRate,
    resolution,
    sensitivity,
    minObjectSize,
    bandwidth,
    // Telemetry
    cpu,
    temperature,
    memory,
    network,
    storage,
    // Location
    latitude,
    longitude,
    ipAddress,
    videoFeedUrl,
    // Road/Lane data
    lanes,
    laneStatus,
    speedLimit,
    // System data
    streetName,
  } = heartbeatData;

  logger.info(`Heartbeat received from ${nodeId}: status=${status}, cpu=${health.cpu || cpu}%, temp=${health.temperature || temperature}°C`);

  const existingNode = await prisma.node.findUnique({
    where: { nodeId },
  });

  if (!existingNode) {
    throw new AppError(`Node ${nodeId} is not registered`, 403);
  }

  // Build update object with all new fields
  const updateData = {
    status,
    lastHeartbeat: new Date(timestamp),
    lastUpdate: new Date(),
    uptimeSec,
    health: health || existingNode.health,
    firmwareVersion: firmwareVersion || existingNode.firmwareVersion,
    modelVersion: modelVersion || existingNode.modelVersion,
    // Add new fields if provided
    ...(frameRate !== undefined && { frameRate }),
    ...(resolution && { resolution }),
    ...(sensitivity !== undefined && { sensitivity }),
    ...(minObjectSize !== undefined && { minObjectSize }),
    ...(bandwidth !== undefined && { bandwidth }),
    ...(cpu !== undefined && { cpu }),
    ...(temperature !== undefined && { temperature }),
    ...(memory !== undefined && { memory }),
    ...(network !== undefined && { network }),
    ...(storage !== undefined && { storage }),
    ...(latitude !== undefined && { latitude }),
    ...(longitude !== undefined && { longitude }),
    ...(ipAddress && { ipAddress }),
    ...(videoFeedUrl && { videoFeedUrl }),
    ...(lanes && { lanes }),
    ...(laneStatus && { laneStatus }),
    ...(speedLimit !== undefined && { speedLimit }),
    ...(streetName && { streetName }),
  };

  await prisma.node.update({
    where: { nodeId },
    data: updateData,
  });

  // Return acknowledgment
  return {
    status: 'success',
    message: 'Heartbeat received',
    nodeId,
    timestamp: new Date().toISOString(),
    nextHeartbeatSec: 30,
  };
}

/**
 * Register a new node with the central unit
 * 
 * @param {object} nodeData - Node registration data
 * @returns {object} Registration confirmation
 */
async function registerNode(nodeData) {
  const { 
    nodeId, 
    location, 
    nodeSpecs, 
    firmwareVersion, 
    modelVersion,
    latitude,
    longitude,
    ipAddress,
    videoFeedUrl,
    streetName,
  } = nodeData;

  logger.info(`Registering new node: ${nodeId} at ${location.address || latitude + ', ' + longitude}`);

  await prisma.node.upsert({
    where: { nodeId },
    update: {
      location,
      nodeSpecs,
      firmwareVersion: firmwareVersion || 'unknown',
      modelVersion: modelVersion || 'unknown',
      latitude: latitude || 0.0,
      longitude: longitude || 0.0,
      ipAddress: ipAddress || '0.0.0.0',
      videoFeedUrl: videoFeedUrl || null,
      streetName: streetName || 'Unknown Street',
      lastUpdate: new Date(),
    },
    create: {
      nodeId,
      name: nodeId,
      streetName: streetName || 'Unknown Street',
      status: 'offline',
      location,
      nodeSpecs,
      firmwareVersion: firmwareVersion || 'unknown',
      modelVersion: modelVersion || 'unknown',
      latitude: latitude || 0.0,
      longitude: longitude || 0.0,
      ipAddress: ipAddress || '0.0.0.0',
      videoFeedUrl: videoFeedUrl || null,
      health: {
        cpu: 0,
        temperature: 0,
        memory: 0,
        network: 0,
        storage: 0,
        currentFps: 0,
      },
      cpu: 0,
      temperature: 0,
      memory: 0,
      network: 0,
      storage: 0,
      roadRules: {
        lanes: [{ id: 1, name: 'Lane 1', type: 'Main Lane', status: 'open' }],
        speedLimit: 80,
      },
      lanes: [{ id: 1, name: 'Lane 1', type: 'Main Lane', status: 'open' }],
      laneStatus: 'unknown',
      speedLimit: 80,
      frameRate: 30,
      resolution: '1920x1080',
      sensitivity: 0.5,
      minObjectSize: 10,
      bandwidth: 0,
      lanePolygons: [],
      lastHeartbeat: null,
      lastUpdate: new Date(),
      uptimeSec: 0,
    },
  });

  return {
    status: 'success',
    message: 'Node registered successfully',
    nodeId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get all registered nodes
 * 
 * @returns {Array} List of all nodes
 */
async function getAllNodes() {
  const nodes = await prisma.node.findMany();
  
  // Check for stale heartbeats and mark as offline
  const now = Date.now();
  for (const node of nodes) {
    if (node.lastHeartbeat) {
      const lastHeartbeatTime = new Date(node.lastHeartbeat).getTime();
      const timeSinceHeartbeat = now - lastHeartbeatTime;
      
      if (timeSinceHeartbeat > HEARTBEAT_TIMEOUT && node.status === 'online') {
        logger.warn(`Node ${node.nodeId} heartbeat timeout. Marking as offline.`);
        await prisma.node.update({
          where: { nodeId: node.nodeId },
          data: {
            status: 'offline',
            lastUpdate: new Date(),
          },
        });
        node.status = 'offline';
      }
    }
  }

  return nodes;
}

/**
 * Get a specific node by ID
 * 
 * @param {string} nodeId - Node identifier
 * @returns {object} Node data
 */
async function getNodeById(nodeId) {
  const node = await prisma.node.findUnique({
    where: { nodeId },
  });
  
  if (!node) {
    throw new AppError(`Node ${nodeId} not found`, 404);
  }

  return node;
}

/**
 * Update node configuration
 * 
 * @param {string} nodeId - Node identifier
 * @param {object} updates - Configuration updates
 * @returns {object} Updated node
 */
async function updateNodeConfig(nodeId, updates) {
  const node = await prisma.node.findUnique({
    where: { nodeId },
  });
  
  if (!node) {
    throw new AppError(`Node ${nodeId} not found`, 404);
  }

  const updatedNode = await prisma.node.update({
    where: { nodeId },
    data: {
      name: updates.name || node.name,
      status: updates.status || node.status,
      location: updates.location || node.location,
      nodeSpecs: updates.nodeSpecs || node.nodeSpecs,
      roadRules: updates.roadRules || node.roadRules,
      lanePolygons: updates.lanePolygons || node.lanePolygons,
      health: updates.health || node.health,
      uptimeSec: typeof updates.uptimeSec === 'number' ? updates.uptimeSec : node.uptimeSec,
      firmwareVersion: updates.firmwareVersion || node.firmwareVersion,
      modelVersion: updates.modelVersion || node.modelVersion,
      lastHeartbeat: updates.lastHeartbeat ? new Date(updates.lastHeartbeat) : node.lastHeartbeat,
      lastUpdate: new Date(),
      // Editable fields
      streetName: updates.streetName !== undefined ? updates.streetName : node.streetName,
      ipAddress: updates.ipAddress !== undefined ? updates.ipAddress : node.ipAddress,
      latitude: typeof updates.latitude === 'number' ? updates.latitude : node.latitude,
      longitude: typeof updates.longitude === 'number' ? updates.longitude : node.longitude,
      videoFeedUrl: updates.videoFeedUrl !== undefined ? updates.videoFeedUrl : node.videoFeedUrl,
      // Route/Lane updates
      lanes: updates.lanes || node.lanes,
      laneStatus: updates.laneStatus || node.laneStatus,
      speedLimit: typeof updates.speedLimit === 'number' ? updates.speedLimit : node.speedLimit,
      // Camera config
      frameRate: typeof updates.frameRate === 'number' ? updates.frameRate : node.frameRate,
      resolution: updates.resolution || node.resolution,
      sensitivity: typeof updates.sensitivity === 'number' ? updates.sensitivity : node.sensitivity,
      minObjectSize: typeof updates.minObjectSize === 'number' ? updates.minObjectSize : node.minObjectSize,
      bandwidth: typeof updates.bandwidth === 'number' ? updates.bandwidth : node.bandwidth,
      // Telemetry
      cpu: typeof updates.cpu === 'number' ? updates.cpu : node.cpu,
      temperature: typeof updates.temperature === 'number' ? updates.temperature : node.temperature,
      memory: typeof updates.memory === 'number' ? updates.memory : node.memory,
      network: typeof updates.network === 'number' ? updates.network : node.network,
      storage: typeof updates.storage === 'number' ? updates.storage : node.storage,
    },
  });

  logger.info(`Node ${nodeId} configuration updated`);

  return updatedNode;
}

/**
 * Delete a node by ID
 * 
 * @param {string} nodeId - Node identifier
 * @returns {object} Deleted node
 */
async function deleteNode(nodeId) {
  const node = await prisma.node.findUnique({
    where: { nodeId },
  });

  if (!node) {
    throw new AppError(`Node ${nodeId} not found`, 404);
  }

  const deletedNode = await prisma.node.delete({
    where: { nodeId },
  });

  logger.warn(`Node ${nodeId} deleted`);

  return deletedNode;
}

module.exports = {
  processHeartbeat,
  registerNode,
  getAllNodes,
  getNodeById,
  updateNodeConfig,
  deleteNode,
};
