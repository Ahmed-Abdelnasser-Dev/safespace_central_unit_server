/**
 * Incident Service Layer
 * 
 * Business logic for accident detection and processing.
 * Implements decision logic per Central Unit specifications.
 * 
 * @module modules/incidents/incident.service
 */

const { logger } = require('../../utils/logger');
const MobileAppNotificationService = require('../../utils/mobileAppNotificationService');
const aiService = require('../ai/ai.service');
const decisionService = require('../decision/decision.service');
const { prisma } = require('../../utils/prisma');
const dotenv = require('dotenv');
dotenv.config();
const mobileAppNotificationService = new MobileAppNotificationService(process.env.MOBILE_APP_SERVER_URL);

// In-memory store for pending accident decisions
const pendingDecisions = new Map();
// In-memory store for incident data by incidentId
const incidentDataMap = new Map();
// Track recent notifications sent to Mobile App Server to avoid duplicate re-emits
const recentMobileNotifications = new Map();
const MOBILE_NOTIFICATION_TTL_MS = 15000; // 15 seconds

function _roundCoord(v) {
  return Math.round(Number(v) * 10000) / 10000;
}

function addRecentMobileNotification({ latitude, longitude, nodeId, timestamp = Date.now() }) {
  const key = `${_roundCoord(latitude)}:${_roundCoord(longitude)}:${nodeId || '0'}`;
  recentMobileNotifications.set(key, timestamp);
}

function isRecentMobileNotification({ latitude, longitude, nodeId }) {
  const key = `${_roundCoord(latitude)}:${_roundCoord(longitude)}:${nodeId || '0'}`;
  const ts = recentMobileNotifications.get(key);
  if (!ts) return false;
  if (Date.now() - ts <= MOBILE_NOTIFICATION_TTL_MS) return true;
  recentMobileNotifications.delete(key);
  return false;
}

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
 * NEW MODULAR FLOW:
 * 1. Accident sent from node
 * 2. AI Module analyzes and provides recommendations
 * 3. Decision Module applies logic (uses AI results)
 * 4. Combined results sent to dashboard
 * 5. Dashboard user confirms/modifies/cancels
 * 6. Response sent back to node
 * 
 * @param {Object} incidentData - Accident data from Edge Node
 * @param {string} incidentData.lat - Latitude coordinate
 * @param {string} incidentData.long - Longitude coordinate
 * @param {number} incidentData.lanNumber - Lane number where accident occurred
 * @param {string} incidentData.nodeId - ID of the reporting Edge Node
 * @param {Array<string>} incidentData.mediaPaths - Paths to uploaded media files
 * @param {Object} incidentData.accidentPolygon - Accident polygon geometry
 * @param {Object} io - Socket.IO instance for real-time updates
 * @returns {Object} Decision result with speed limit and node display instructions
 */
const processAccidentDetection = async (incidentData, io) => {
  const { lat, long, lanNumber, nodeId, mediaPaths = [], accidentPolygon } = incidentData;

  logger.info(`🚨 INCIDENT DETECTED - Node ${nodeId} at (${lat}, ${long}), Lane ${lanNumber}`);

  // Generate unique incident ID
  const incidentId = `incident_${nodeId}_${Date.now()}`;
  
  // Store incident data for later retrieval
  incidentDataMap.set(incidentId, {
    lat,
    long,
    lanNumber,
    nodeId,
    timestamp: Date.now(),
  });

  // Build media list with type and URL
  const videoExtensions = ['mp4', 'webm', 'mpeg', 'mov', 'avi'];
  const mediaList = mediaPaths.map((p) => {
    const ext = p.split('.').pop().toLowerCase();
    const type = videoExtensions.includes(ext) ? 'video' : 'image';
    const url = `/uploads/incidents/${p.split('/').pop()}`;
    return { url, type };
  });

  let aiResults = null;
  let decisionResults = null;
  
  try {
    // ========================================
    // STEP 1: AI MODULE - Analyze Accident
    // ========================================
    logger.info(`📊 STEP 1/2: AI Analysis for ${incidentId}`);
    
    aiResults = await aiService.analyzeAccident({
      mediaPath: mediaPaths[0] || '',
      mediaPaths,
      accidentPolygon,
      location: { lat, long }
    });
    
    logger.info(`✅ AI Analysis Complete - Severity: ${aiResults.severity}/5, Type: ${aiResults.accidentType}, Confidence: ${(aiResults.confidence * 100).toFixed(1)}%`);
    
    // ========================================
    // STEP 2: DECISION MODULE - Apply Logic
    // ========================================
    logger.info(`⚖️  STEP 2/2: Decision Analysis for ${incidentId}`);
    
    decisionResults = await decisionService.makeDecision({
      nodeId,
      lanNumber,
      accidentPolygon,
      location: { lat, long },
      aiResults // Decision module uses AI results
    });
    
    logger.info(`✅ Decision Complete - Blocked Lanes: ${decisionResults.blockedLanes.length}, Speed: ${decisionResults.speedLimit} km/h`);
    
    // ========================================
    // STEP 3: PERSIST TO DATABASE
    // ========================================
    logger.info(`💾 Persisting incident ${incidentId} to database`);
    
    await prisma.incident.create({
      data: {
        incidentId,
        nodeId: nodeId,
        location: {
          latitude: parseFloat(lat),
          longitude: parseFloat(long),
        },
        accidentPolygon,
        mediaUrls: mediaList,
        severityLevel: aiResults.severity,
        blockedLanes: decisionResults.blockedLanes,
        laneConfiguration: decisionResults.laneConfiguration,
        originalSpeedLimit: decisionResults.originalSpeedLimit,
        adjustedSpeedLimit: decisionResults.speedLimit,
        adminDecision: null, // Will be updated when admin responds
        // Note: Full AI and Decision analysis stored in-memory for dashboard
        // Only summary fields persisted to database
      },
    });
    
    logger.info(`✅ Incident ${incidentId} persisted to database`);
    
  } catch (error) {
    logger.error(`❌ Error during AI/Decision analysis`, {
      error: error.message,
      stack: error.stack,
      incidentId,
    });
    
    // Use fallback values if analysis fails
    aiResults = {
      severity: 3,
      confidence: 0.5,
      accidentType: 'unknown',
      vehicleCount: 1,
      injuryRisk: 'medium',
      recommendations: [],
      mode: 'FALLBACK'
    };
    
    decisionResults = {
      blockedLanes: [{ id: lanNumber, name: `Lane ${lanNumber}`, laneNumber: lanNumber }],
      laneConfiguration: '',
      speedLimit: 60,
      originalSpeedLimit: 80,
      speedReduction: 20,
      actions: ['MONITOR_SITUATION'],
      nodeDisplay: { message: 'ACCIDENT AHEAD', speedLimit: 60 }
    };
  }

  // ========================================
  // STEP 4: FETCH NODE DATA & SEND TO DASHBOARD
  // ========================================
  // Get node data to include lane polygons and defaults
  const node = await prisma.node.findUnique({
    where: { nodeId },
    select: {
      nodeId: true,
      name: true,
      speedLimit: true,
      defaultLaneCount: true,
      lanePolygons: true,
      lanes: true,
      roadRules: true,  // ← Add roadRules to get full lane data
      streetName: true,
      latitude: true,
      longitude: true,
    }
  });

  // Read lanes from roadRules (same as decision module) - this is the source of truth
  const roadRulesLanes = node?.roadRules?.lanes || [];
  const laneDefaults = Array.isArray(node?.lanes) && node.lanes.length > 0 ? node.lanes : roadRulesLanes;
  const laneCount = roadRulesLanes.length || node?.defaultLaneCount || laneDefaults.length || 4;
  
  logger.info('🔍 Node Lane Debug', {
    nodeId,
    nodeLanes: node?.lanes,
    roadRulesLanes: roadRulesLanes,
    roadRulesLanesLength: roadRulesLanes.length,
    laneDefaultsLength: laneDefaults.length,
    nodeDefaultLaneCount: node?.defaultLaneCount,
    calculatedLaneCount: laneCount
  });
  
  const defaultLaneConfiguration = laneDefaults.length > 0
    ? laneDefaults.map((lane, index) => ({
        lane: lane.id || index + 1,
        name: lane.name || `Lane ${index + 1}`,
        state: (lane.status || 'open').toLowerCase(),
        type: lane.type || 'Standard'
      }))
    : Array.from({ length: laneCount }, (_, index) => ({
        lane: index + 1,
        name: `Lane ${index + 1}`,
        state: 'open',
        type: 'Standard'
      }));
  
  logger.info('🔍 Default Lane Configuration Created', {
    configLength: defaultLaneConfiguration.length,
    config: defaultLaneConfiguration
  });

  const dashboardPayload = {
    incidentId,
    nodeId,
    latitude: parseFloat(lat),
    longitude: parseFloat(long),
    lanNumber,
    locationName: node?.streetName || `Highway Node ${nodeId}`,
    mediaList,
    timestamp: Date.now(),
    
    // Polygons for visualization
    accidentPolygon,
    nodePolygons: node?.lanePolygons || [],
    
    // Node defaults for UI
    node: {
      name: node?.name || `Node ${nodeId}`,
      roadName: node?.streetName || `Highway Node ${nodeId}`,
      defaultSpeedLimit: node?.roadRules?.speedLimit || node?.speedLimit || 80,
      defaultLaneCount: laneCount,
      defaultLaneConfiguration,
      lanePolygons: node?.lanePolygons || [],
    },
    
    // AI Analysis Results
    ai: {
      severity: aiResults.severity,
      confidence: aiResults.confidence,
      accidentType: aiResults.accidentType,
      vehicleCount: aiResults.vehicleCount,
      injuryRisk: aiResults.injuryRisk,
      recommendations: aiResults.recommendations,
      mode: aiResults.mode
    },
    
    // Decision Results
    decision: {
      blockedLanes: decisionResults.blockedLanes,
      laneConfiguration: decisionResults.laneConfiguration,
      speedLimit: decisionResults.speedLimit,
      originalSpeedLimit: decisionResults.originalSpeedLimit,
      speedReduction: decisionResults.speedReduction,
      actions: decisionResults.actions,
      influencedByAI: decisionResults.influencedByAI
    },
    
    // Combined severity for quick dashboard display
    severity: aiResults.severity >= 4 ? 'CRITICAL' : aiResults.severity >= 3 ? 'HIGH' : 'MODERATE',
  };

  logger.info(`📡 Emitting to dashboard: ${incidentId}`, {
    severity: dashboardPayload.severity,
    aiType: aiResults.accidentType,
    blockedLanes: decisionResults.blockedLanes.length,
    nodeDefaultLaneCount: dashboardPayload.node.defaultLaneCount,
    nodeDefaultLaneConfigLength: dashboardPayload.node.defaultLaneConfiguration.length
  });
  
  io.emit('accident-detected', dashboardPayload);

  // ========================================
  // STEP 5: RETURN IMMEDIATELY TO NODE
  // ========================================
  // Node can continue its operations while admin makes decision
  // Admin decision will be applied via separate HTTP endpoint
  logger.info(`✅ Accident analysis complete for ${incidentId}. Waiting for admin decision asynchronously...`);

  return {
    status: 'success',
    incidentId,
    message: 'Accident detected and forwarded to admin dashboard',
    aiResults: {
      severity: aiResults.severity,
      type: aiResults.accidentType,
      confidence: aiResults.confidence,
      injuryRisk: aiResults.injuryRisk
    },
    decisionResults: {
      blockedLanes: decisionResults.blockedLanes.length,
      speedLimit: decisionResults.speedLimit,
      originalSpeedLimit: decisionResults.originalSpeedLimit
    }
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
 * Register an incident that originated from an external server (mobile)
 * Stores minimal incident context so admin decisions can reference it later.
 */
function registerExternalIncident(incidentId, data) {
  incidentDataMap.set(incidentId, data);
}

module.exports.registerExternalIncident = registerExternalIncident;

// Export helpers for mobile notification tracking
module.exports.addRecentMobileNotification = addRecentMobileNotification;
module.exports.isRecentMobileNotification = isRecentMobileNotification;

/**
 * Process operator/admin decision for an accident.
 * Logs audit trail, persists decision to database, and prepares control responses to nodes.
 * @param {Object} decisionData
 * @param {string} decisionData.incidentId
 * @param {number} decisionData.nodeId
 * @param {('CONFIRMED'|'REJECTED')} decisionData.status
 * @param {string[]} [decisionData.actions]
 * @param {string} [decisionData.message]
 * @returns {Object} structured decision result
 */
async function processAccidentDecision(decisionData) {
  const { incidentId, nodeId, status, actions = [], message, io } = decisionData;

  // Resolve the pending decision
  const resolved = resolveDecision(incidentId, { status, actions, message });
  
  if (!resolved) {
    logger.warn(`No pending decision found for incident ${incidentId}`);
  }

  // Persist admin decision to database
  try {
    await prisma.incident.update({
      where: { incidentId },
      data: {
        adminDecision: status,
        adminDecisionTime: new Date(),
      },
    });
    logger.info(`[ADMIN DECISION] Persisted to database: ${incidentId} - ${status}`);
  } catch (dbError) {
    logger.error(`[ADMIN DECISION] Failed to persist decision to database`, {
      error: dbError.message,
      incidentId,
    });
    // Continue with decision processing even if DB update fails
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
    const incident = incidentDataMap.get(incidentId);
    if (incident) {
      logger.info(`[MOBILE APP NOTIFY] Triggering request to Mobile App Server for Node ${incident.nodeId} Lane ${incident.lanNumber} (incidentId: ${incidentId})`);
      await mobileAppNotificationService.notifyAccident({
        centralUnitAccidentId: incidentId,
        occurredAt: new Date(incident.timestamp).toISOString(),
        location: {
          lat: typeof incident.lat === 'string' ? parseFloat(incident.lat) : incident.lat,
          lng: typeof incident.long === 'string' ? parseFloat(incident.long) : incident.long,
        },
      });
      // Mark this notification so we can ignore the mobile server's callback duplicate
      try {
        addRecentMobileNotification({
          latitude: typeof incident.lat === 'string' ? parseFloat(incident.lat) : incident.lat,
          longitude: typeof incident.long === 'string' ? parseFloat(incident.long) : incident.long,
          nodeId: incident.nodeId,
          timestamp: Date.now(),
        });
      } catch (e) {
        logger.error('Failed to add recent mobile notification marker', e.message || e);
      }
      logger.info(`Mobile App Server notified for Node ${incident.nodeId} Lane ${incident.lanNumber} after admin confirmation.`);
      incidentDataMap.delete(incidentId);
    } else {
      logger.error(`No incident data found for ${incidentId}, cannot notify Mobile App Server.`);
    }

  // ========================================
  // EMIT DECISION CONFIRMATION TO DASHBOARD
  // ========================================
  if (io) {
    io.emit('decision-confirmed', {
      incidentId,
      nodeId,
      status,
      message,
      timestamp: new Date().toISOString(),
      actions
    });
    logger.info(`📢 Decision confirmation emitted for incident ${incidentId}: ${status}`);
  }

  return {
    incidentId,
    nodeId,
    status,
    actions,
    message: 'Decision applied successfully',
  };
}
