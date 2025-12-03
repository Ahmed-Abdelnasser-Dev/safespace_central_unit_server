/**
 * Incident Service Layer
 * 
 * Business logic for accident detection and processing.
 * Implements decision logic per Central Unit specifications.
 * 
 * @module modules/incidents/incident.service
 */

const { logger } = require('../../utils/logger');

// In-memory store for pending accident decisions
const pendingDecisions = new Map();

/**
 * Wait for admin decision on accident
 * @param {string} incidentId - unique identifier for incident
 * @param {number} timeout - milliseconds to wait before auto-reject
 * @returns {Promise<Object>} decision object
 */
function waitForDecision(incidentId, timeout = 120000) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (pendingDecisions.has(incidentId)) {
        pendingDecisions.delete(incidentId);
        logger.warn(`Decision timeout for incident ${incidentId}`);
        resolve({ status: 'TIMEOUT', actions: [], message: 'No decision received' });
      }
    }, timeout);

    pendingDecisions.set(incidentId, { resolve, timer });
  });
}

/**
 * Resolve pending decision
 * @param {string} incidentId
 * @param {Object} decision
 */
function resolveDecision(incidentId, decision) {
  const pending = pendingDecisions.get(incidentId);
  if (pending) {
    clearTimeout(pending.timer);
    pending.resolve(decision);
    pendingDecisions.delete(incidentId);
    return true;
  }
  return false;
}

/**
 * Process accident detection data from Edge Node
 * 
 * This function implements the Central Unit's decision logic:
 * - Validates the incident data
 * - Calculates severity and affected areas
 * - Determines speed limit adjustments
 * - Prepares control commands for the Node
 * 
 * @param {Object} incidentData - Accident data from Edge Node
 * @param {string} incidentData.lat - Latitude coordinate
 * @param {string} incidentData.long - Longitude coordinate
 * @param {number} incidentData.lanNumber - Lane number where accident occurred
 * @param {number} incidentData.nodeId - ID of the reporting Edge Node
 * @param {string} incidentData.imagePath - Path to uploaded accident image
 * @returns {Object} Decision result with speed limit and node display instructions
 */
const processAccidentDetection = async (incidentData, io) => {
  const { lat, long, lanNumber, nodeId, mediaPaths = [] } = incidentData;

  logger.info(`Processing accident from Node ${nodeId} at coordinates (${lat}, ${long}), Lane ${lanNumber}`);

  // Generate unique incident ID
  const incidentId = `incident_${nodeId}_${Date.now()}`;

  // Build media list with type and URL
  const videoExtensions = ['mp4', 'webm', 'mpeg', 'mov', 'avi'];
  const mediaList = mediaPaths.map((p) => {
    const ext = p.split('.').pop().toLowerCase();
    const type = videoExtensions.includes(ext) ? 'video' : 'image';
    const url = `/uploads/incidents/${p.split('/').pop()}`;
    return { url, type };
  });

  // Prepare incident data for dashboard
  const incidentPayload = {
    incidentId,
    nodeId,
    latitude: parseFloat(lat),
    longitude: parseFloat(long),
    lanNumber,
    lanes: [`Lane ${lanNumber}`],
    locationName: `Highway Node ${nodeId}`,
    mediaList,
    timestamp: Date.now(),
    severity: 'CRITICAL',
  };

  // Emit to connected dashboard clients
  logger.info(`Emitting accident event to dashboard: ${incidentId}`);
  io.emit('accident-detected', incidentPayload);

  // Wait for admin decision
  logger.info(`Waiting for admin decision on ${incidentId}...`);
  const decision = await waitForDecision(incidentId);

  logger.info(`Decision received for ${incidentId}: ${decision.status}`);

  // Process decision
  let speedLimit = null;
  let nodeDisplayConfig = {
    nodeId,
    message: 'NORMAL',
    displayMode: 'NORMAL',
  };

  if (decision.status === 'CONFIRMED') {
    speedLimit = decision.actions.includes('reduce-speed') ? 40 : null;
    const displayMessage = decision.actions.includes('block-routes')
      ? `LANE ${lanNumber} BLOCKED - REDUCE SPEED`
      : 'ACCIDENT - CAUTION';
    nodeDisplayConfig = {
      nodeId,
      message: displayMessage,
      displayMode: 'ALERT',
    };
  }

  logger.info(`Decision applied for Node ${nodeId}: Speed Limit = ${speedLimit || 'unchanged'} km/h`);

  return {
    speedLimit,
    nodeDisplay: nodeDisplayConfig,
    decision,
  };
};

/**
 * Store accident image in designated directory
 * 
 * @param {string} imagePath - Path where multer stored the uploaded image
 * @returns {string} Relative path for database storage
 */
const storeAccidentImage = (imagePath) => {
  // Image is already stored by multer in uploads/incidents/
  // Return relative path for database
  logger.info(`Accident image stored at: ${imagePath}`);
  return imagePath;
};

module.exports = {
  processAccidentDetection,
  storeAccidentImage,
  processAccidentDecision,
  waitForDecision,
  resolveDecision,
};

/**
 * Process operator/admin decision for an accident.
 * Logs audit trail and prepares control responses to nodes.
 * @param {Object} decisionData
 * @param {number} decisionData.nodeId
 * @param {('CONFIRMED'|'REJECTED')} decisionData.status
 * @param {string[]} [decisionData.actions]
 * @param {string} [decisionData.message]
 * @returns {Object} structured decision result
 */
async function processAccidentDecision(decisionData) {
  const { incidentId, nodeId, status, actions = [], message } = decisionData;

  // Resolve the pending decision
  const resolved = resolveDecision(incidentId, { status, actions, message });
  
  if (!resolved) {
    logger.warn(`No pending decision found for incident ${incidentId}`);
  }

  if (status === 'REJECTED') {
    logger.warn(`Accident report ${incidentId} rejected: ${message}`);
    return {
      incidentId,
      nodeId,
      status,
      actions: [],
      message,
    };
  }

  // CONFIRMED logic
  logger.info(`Accident decision confirmed for ${incidentId}. Actions: ${actions.join(', ')}`);

  return {
    incidentId,
    nodeId,
    status,
    actions,
    message: 'Decision applied successfully',
  };
}
