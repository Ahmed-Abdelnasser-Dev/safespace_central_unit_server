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
const dotenv = require('dotenv');
dotenv.config();
const MobileAppNotificationService = require('../../utils/mobileAppNotificationService');
const mobileAppNotificationService = new MobileAppNotificationService(process.env.MOBILE_APP_SERVER_URL);

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

  // Notification to Mobile App Server will be sent after admin confirmation, not here.
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
    const { description, latitude, longitude, occurredAt } = req.body;

    // Validate at least one media file is present
    if (!req.files || req.files.length === 0) {
      return next(new AppError('At least one media file is required for mobile accident reports (images/videos)', 400));
    }

    logger.info(`Mobile accident report: ${description} at (${latitude}, ${longitude})`);

    // Generate unique incident ID
    const incidentId = `mobile_incident_${Date.now()}`;
    const nodeId = 999; // Default external source ID

    // Build media list from uploaded files (type + URL)
    const videoExtensions = ['mp4', 'webm', 'mpeg', 'mov', 'avi', 'mkv'];
    const mediaList = req.files.map((f) => {
      const ext = f.originalname.split('.').pop().toLowerCase();
      const type = videoExtensions.includes(ext) ? 'video' : 'image';
      const url = `/uploads/incidents/${f.filename || f.path.split('/').pop()}`;
      return { url, type };
    });

    // Prepare incident data for dashboard
    const incidentPayload = {
      incidentId,
      nodeId,
      latitude: typeof latitude === 'string' ? parseFloat(latitude) : latitude,
      longitude: typeof longitude === 'string' ? parseFloat(longitude) : longitude,
      lanNumber: 0, // N/A for mobile reports
      lanes: [],
      locationName: description,
      mediaList,
      timestamp: occurredAt ? new Date(occurredAt).getTime() : Date.now(),
    };

    // Get Socket.IO instance and emit to dashboard
      const io = req.app.get('io');
      // If this request originated from the Central Unit, skip re-emitting to dashboard
      const fromCentral = req.headers['x-from-central'] === 'true' || req.headers['x-from-central'] === '1';
      if (fromCentral) {
        logger.info(`Received mobile accident from Central Unit for ${incidentId}, skipping dashboard emit.`);
      } else {
        // Also skip if this mobile report matches a recent notification we sent (to avoid duplicates)
        const latNum = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
        const longNum = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
        const recent = incidentService.isRecentMobileNotification({ latitude: latNum, longitude: longNum, nodeId: null });
        if (recent) {
          logger.info(`Skipping emit for mobile incident ${incidentId} because it matches a recent Central Unit notification.`);
        } else {
          logger.info(`Emitting mobile accident to dashboard: ${incidentId}`);
          io.emit('accident-detected', incidentPayload);
        }
      }

    // Return success immediately (no admin decision wait required for mobile)
    res.status(200).json({
      success: true,
      incidentId,
      message: 'Accident report received and displayed on dashboard',
      timestamp: new Date().toISOString(),
    });
  }),

  /**
   * POST /central-unit/send-accident-to-central-unit
   * Server-to-server endpoint used by the Mobile App Server to send JSON accident reports.
   */
  sendAccidentToCentralUnit: catchAsync(async (req, res, next) => {
    const { accidentId, description, latitude, longitude, severity, media = [] } = req.body;

    // Basic validation (routes also validate schema)
    if (typeof description !== 'string' || description.length < 1) {
      return next(new AppError('description is required', 400));
    }
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return next(new AppError('latitude and longitude must be numbers', 400));
    }

    const incidentIdLocal = `mobile_${accidentId || Date.now()}`;
    const nodeId = 999; // external source

    // If media contains external URLs, try to download and store locally so the dashboard can serve them reliably
    const fs = require('fs');
    const path = require('path');
    const axios = require('axios');
    const uploadsDir = path.join(__dirname, '../../uploads/incidents');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const mediaList = [];
    if (Array.isArray(media)) {
      await Promise.all(media.map(async (m, idx) => {
        if (!m || !m.url) return;
        try {
          const url = m.url;
          // Only attempt to download http/https resources
          // Resolve relative paths (starting with '/') against known bases
          let resolvedUrl = url;
          if (url.startsWith('/')) {
            // Try headers first
            const origin = req.headers.origin || req.headers.referer || req.headers['x-mobile-base-url'];
            if (origin) {
              resolvedUrl = `${origin.replace(/\/$/, '')}${url}`;
            } else if (process.env.MOBILE_SERVER_BASE_URL) {
              resolvedUrl = `${process.env.MOBILE_SERVER_BASE_URL.replace(/\/$/, '')}${url}`;
            } else {
              // Can't resolve relative path to absolute URL; log and fallback to pushing original path (will 404)
              logger.warn(`Received relative media URL ${url} but no base URL available to resolve it. Set MOBILE_SERVER_BASE_URL env var or send absolute URLs.`);
            }
          }

          if (resolvedUrl.startsWith('http://') || resolvedUrl.startsWith('https://')) {
            const parsedResolved = new URL(resolvedUrl);
            const ext = path.extname(parsedResolved.pathname) || '.jpg';
            const filename = `mobile_${Date.now()}_${idx}${ext}`;
            const destPath = path.join(uploadsDir, filename);
            logger.info(`Downloading media from ${resolvedUrl} -> ${destPath}`);
            const response = await axios.get(resolvedUrl, { responseType: 'stream', timeout: 15000 });
            const writer = fs.createWriteStream(destPath);
            await new Promise((resolve, reject) => {
              response.data.pipe(writer);
              writer.on('error', (err) => { try { writer.close(); } catch(e){}; reject(err); });
              writer.on('finish', () => resolve());
            });
            logger.info(`Saved media to ${destPath}`);
            mediaList.push({ url: `/uploads/incidents/${filename}`, type: m.type || 'image' });
            return;
          }
          // For non-http URLs, just include as-is
          mediaList.push({ url: m.url, type: m.type || 'image' });
        } catch (e) {
          // On failure, fallback to original URL
          logger.warn(`Failed to download media ${m.url}: ${e.message || e}`);
          mediaList.push({ url: m.url, type: m.type || 'image' });
        }
      }));
    }

    const incidentPayload = {
      incidentId: incidentIdLocal,
      nodeId,
      latitude,
      longitude,
      lanNumber: 0,
      lanes: [],
      locationName: description,
      mediaList,
      timestamp: Date.now(),
      severity: severity || 'unknown',
    };

    // Register into incident store so admin decisions can reference it
    incidentService.registerExternalIncident(incidentIdLocal, {
      lat: latitude,
      long: longitude,
      lanNumber: 0,
      nodeId,
      timestamp: Date.now(),
      mediaList,
      description,
    });

    // Emit to dashboard
    const io = req.app.get('io');
    logger.info(`Received external mobile accident ${incidentIdLocal}: ${description} at (${latitude}, ${longitude})`);
    io.emit('accident-detected', incidentPayload);

    res.status(202).json({ ok: true, incidentId: incidentIdLocal });
  }),
};
