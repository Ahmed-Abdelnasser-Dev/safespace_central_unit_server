/**
 * Incident Controller
 * 
 * Thin controller layer for accident detection endpoints.
 * Delegates business logic to the service layer.
 * 
 * @module modules/incidents/incident.controller
 */

const catchAsync = require('../../middleware/catchAsync');
const AppError = require('../../utils/AppError');
const incidentService = require('./incident.service');
const { logger } = require('../../utils/logger');

/**
 * Handle POST /api/accident-detected
 * 
 * Receives accident data from Edge Nodes including image, coordinates,
 * and metadata. Validates input, processes detection, and returns
 * control commands.
 * 
 * @route POST /api/accident-detected
 * @access Internal (Edge Nodes only - should be protected by API key in production)
 */
const accidentDetected = catchAsync(async (req, res, next) => {
  // Extract text fields from multipart form
  const { lat, long, lanNumber, nodeId } = req.body;

  // Validate that required fields are present
  if (!lat || !long || !lanNumber || !nodeId) {
    return next(new AppError('Missing required fields: lat, long, lanNumber, nodeId', 400));
  }

  // Parse integer fields
  const parsedLanNumber = parseInt(lanNumber, 10);
  const parsedNodeId = parseInt(nodeId, 10);

  if (isNaN(parsedLanNumber) || isNaN(parsedNodeId)) {
    return next(new AppError('lanNumber and nodeId must be valid integers', 400));
  }

  // Validate image file
  if (!req.file) {
    return next(new AppError('Image is required', 400));
  }

  // Prepare incident data
  const incidentData = {
    lat,
    long,
    lanNumber: parsedLanNumber,
    nodeId: parsedNodeId,
    imagePath: req.file.path,
  };

  // Process accident detection (business logic)
  const result = await incidentService.processAccidentDetection(incidentData);

  // Log successful processing
  logger.info(`Accident processed successfully from Node ${parsedNodeId}`);

  // Send success response with decision results
  res.status(200).json({
    success: true,
    speedLimit: result.speedLimit,
    nodeDisplay: result.nodeDisplay,
    receivedAt: new Date().toISOString(),
  });
});

module.exports = {
  accidentDetected,
};
