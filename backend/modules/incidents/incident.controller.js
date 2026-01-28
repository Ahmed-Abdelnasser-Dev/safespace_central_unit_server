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

  // Validate at least one media file
  if (!req.files || req.files.length === 0) {
    return next(new AppError('At least one media file is required (images/videos)', 400));
  }

  // Prepare incident data
  const incidentData = {
    lat,
    long,
    lanNumber: parsedLanNumber,
    nodeId: parsedNodeId,
    mediaPaths: req.files.map(f => f.path),
  };

  // Get Socket.IO instance
  const io = req.app.get('io');

  // Process accident detection (will wait for admin decision)
  const result = await incidentService.processAccidentDetection(incidentData, io);

  // Log successful processing
  logger.info(`Accident processed successfully from Node ${parsedNodeId}`);

  // Send success response with decision results
  res.status(200).json({
    success: true,
    speedLimit: result.speedLimit,
    nodeDisplay: result.nodeDisplay,
    decision: result.decision,
    receivedAt: new Date().toISOString(),
  });
});

module.exports = {
  accidentDetected,
  accidentDecision: catchAsync(async (req, res) => {
    const { incidentId, nodeId, status, actions, message } = req.body;
    const decision = await incidentService.processAccidentDecision({
      incidentId,
      nodeId: Number(nodeId),
      status,
      actions,
      message,
    });
    logger.info(`Decision recorded for incident ${incidentId}: ${status}`);
    res.status(200).json({ success: true, decision, receivedAt: new Date().toISOString() });
  }),

  /**
   * Handle POST /api/mobile-accident-detected
   * 
   * Receives accident reports from external mobile/external servers
   * without multipart file upload. Emits to dashboard for admin review.
   * 
   * @route POST /api/mobile-accident-detected
   * @access Public
   */
  mobileAccidentDetected: catchAsync(async (req, res, next) => {
    const { description, latitude, longitude, severity } = req.body;

    logger.info(`Mobile accident report: ${description} at (${latitude}, ${longitude}) - Severity: ${severity}`);

    // Generate unique incident ID
    const incidentId = `mobile_incident_${Date.now()}`;
    const nodeId = 999; // Default external source ID

    // Prepare incident data for dashboard
    const incidentPayload = {
      incidentId,
      nodeId,
      latitude,
      longitude,
      lanNumber: 0, // N/A for mobile reports
      lanes: [],
      locationName: description,
      mediaList: [],
      timestamp: Date.now(),
      severity: severity.toUpperCase(),
    };

    // Get Socket.IO instance and emit to dashboard
    const io = req.app.get('io');
    logger.info(`Emitting mobile accident to dashboard: ${incidentId}`);
    io.emit('accident-detected', incidentPayload);

    // Return success immediately (no admin decision wait required for mobile)
    res.status(200).json({
      success: true,
      incidentId,
      message: 'Accident report received and displayed on dashboard',
      timestamp: new Date().toISOString(),
    });
  }),
};
