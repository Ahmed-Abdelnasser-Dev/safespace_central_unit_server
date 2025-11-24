/**
 * Incident Service Layer
 * 
 * Business logic for accident detection and processing.
 * Implements decision logic per Central Unit specifications.
 * 
 * @module modules/incidents/incident.service
 */

const { logger } = require('../../utils/logger');

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
const processAccidentDetection = async (incidentData) => {
  const { lat, long, lanNumber, nodeId, imagePath } = incidentData;

  logger.info(`Processing accident from Node ${nodeId} at coordinates (${lat}, ${long}), Lane ${lanNumber}`);

  // TODO: Future enhancements
  // 1. Cross-node correlation checks
  // 2. Severity calculation using @turf/turf for affected radius
  // 3. Query nearby nodes within affected area
  // 4. Integration with AI model for image analysis
  // 5. Database persistence (Live Event Data)

  // Decision Logic - Calculate recommended speed limit
  // For now, implementing simple rule-based logic
  // CRITICAL accidents -> 40 km/h, WARNING -> 60 km/h
  const calculatedSpeedLimit = 40; // Default critical response

  // Prepare control command for the Edge Node
  const nodeDisplayConfig = {
    nodeId: nodeId,
    message: `ACCIDENT DETECTED - LANE ${lanNumber} BLOCKED`,
    displayMode: 'ALERT', // Can be: ALERT, WARNING, NORMAL
  };

  // Audit Trail: Log decision
  logger.info(`Decision made for Node ${nodeId}: Speed Limit = ${calculatedSpeedLimit} km/h`);

  return {
    speedLimit: calculatedSpeedLimit,
    nodeDisplay: nodeDisplayConfig,
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
};
