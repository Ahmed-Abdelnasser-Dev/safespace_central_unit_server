/**
 * Decision Module Service
 * 
 * Automated decision-making logic for accident response.
 * Determines lane configurations, speed limits, and traffic management actions.
 * 
 * @module modules/decision/decision.service
 */

const { logger } = require('../../utils/logger');
const geospatialService = require('../../utils/geospatialService');
const { prisma } = require('../../utils/prisma');

// Configuration Constants
const MIN_SPEED_LIMIT = 40; // km/h - Never reduce below this
const SPEED_REDUCTION_FACTOR = 0.5; // Reduce by up to 50% based on severity
const MAX_SPEED_LIMIT = 200; // km/h - Sanity check

/**
 * Main decision-making process for accident response
 * 
 * @param {Object} params - Decision parameters
 * @param {string} params.nodeId - Node identifier
 * @param {number} params.lanNumber - Lane number where accident occurred
 * @param {Object} params.accidentPolygon - Accident area polygon
 * @param {Object} params.location - {lat, long}
 * @param {Object} params.aiResults - AI analysis results (optional, for informed decisions)
 * @returns {Promise<Object>} Decision results
 */
async function makeDecision({ nodeId, lanNumber, accidentPolygon, location, aiResults = null }) {
  logger.info('⚖️  Decision Module - Starting analysis', { 
    nodeId, 
    lanNumber,
    aiSeverity: aiResults?.severity 
  });
  
  // Step 1: Fetch Node Configuration
  const node = await prisma.node.findUnique({
    where: { nodeId: nodeId },
  });
  
  if (!node) {
    throw new Error(`Node ${nodeId} not found`);
  }
  
  const lanes = node.roadRules?.lanes || [];
  const lanePolygons = node.lanePolygons || [];
  const originalSpeedLimit = node.roadRules?.speedLimit || node.speedLimit || 80;
  
  logger.info('⚖️  Decision Module - Node configuration loaded', {
    totalLanes: lanes.length,
    originalSpeedLimit,
    hasPolygons: lanePolygons.length > 0
  });
  
  // Step 2: Determine Blocked Lanes (Geospatial Analysis)
  let blockedLanes = [];
  
  if (lanePolygons.length > 0 && accidentPolygon) {
    blockedLanes = geospatialService.findIntersectedLanes(accidentPolygon, lanePolygons);
    logger.info('⚖️  Decision Module - Geospatial analysis complete', {
      blockedLanesCount: blockedLanes.length,
      blockedLanes: blockedLanes.map(l => l.name)
    });
  } else {
    // Fallback: if no polygons, assume reported lane is blocked
    const reportedLane = lanes.find(l => l.id === lanNumber);
    if (reportedLane) {
      blockedLanes = [{ ...reportedLane, laneNumber: lanNumber }];
      logger.warn('⚖️  Decision Module - No polygons available, using reported lane', {
        reportedLane: reportedLane.name
      });
    }
  }
  
  // Step 3: Calculate Lane Configuration
  const laneConfiguration = calculateLaneConfiguration(blockedLanes, lanes);
  
  // Step 4: Calculate Adjusted Speed Limit
  const adjustedSpeedLimit = calculateAdjustedSpeedLimit({
    originalSpeedLimit,
    blockedLanes,
    totalLanes: lanes.length,
    severity: aiResults?.severity,
    aiRecommendations: aiResults?.recommendations
  });
  
  // Step 5: Determine Required Actions
  const actions = determineActions({
    blockedLanes,
    severity: aiResults?.severity,
    laneConfiguration,
    speedReduction: originalSpeedLimit - adjustedSpeedLimit
  });
  
  // Step 6: Generate Node Display Instructions
  const nodeDisplay = generateNodeDisplay({
    blockedLanes,
    laneConfiguration,
    adjustedSpeedLimit,
    originalSpeedLimit
  });
  
  const decision = {
    blockedLanes: blockedLanes.map(l => ({ id: l.id, name: l.name, laneNumber: l.laneNumber })),
    laneConfiguration,
    speedLimit: adjustedSpeedLimit,
    originalSpeedLimit,
    speedReduction: originalSpeedLimit - adjustedSpeedLimit,
    actions,
    nodeDisplay,
    timestamp: new Date().toISOString(),
    influencedByAI: aiResults ? true : false,
    aiSeverity: aiResults?.severity || null
  };
  
  logger.info('⚖️  Decision Module - Decision complete', {
    blockedLanes: blockedLanes.length,
    speedLimit: `${originalSpeedLimit} → ${adjustedSpeedLimit} km/h`,
    actions: actions.length
  });
  
  return decision;
}

/**
 * Calculate lane configuration string based on blocked lanes
 * 
 * @param {Array} blockedLanes - Blocked lane objects
 * @param {Array} allLanes - All lanes from node configuration
 * @returns {string} Lane configuration (e.g., "open,blocked,right,open")
 */
function calculateLaneConfiguration(blockedLanes, allLanes) {
  if (!allLanes || allLanes.length === 0) {
    return '';
  }
  
  const sortedLanes = [...allLanes].sort((a, b) => a.id - b.id);
  const blockedLaneNumbers = new Set(blockedLanes.map(lane => lane.laneNumber));
  
  const laneConfig = sortedLanes.map((lane, index) => {
    const laneNumber = index + 1;
    
    if (blockedLaneNumbers.has(laneNumber)) {
      return 'blocked';
    }
    
    const leftLaneNumber = index;
    const rightLaneNumber = index + 2;
    const isLeftBlocked = index > 0 && blockedLaneNumbers.has(leftLaneNumber);
    const isRightBlocked = index < sortedLanes.length - 1 && blockedLaneNumbers.has(rightLaneNumber);
    
    if (isLeftBlocked && !isRightBlocked) {
      return 'right';
    }
    
    if (isRightBlocked && !isLeftBlocked) {
      return 'left';
    }
    
    return 'open';
  });
  
  return laneConfig.join(',');
}

/**
 * Calculate adjusted speed limit based on conditions
 * 
 * @param {Object} params - Calculation parameters
 * @returns {number} Adjusted speed limit in km/h
 */
function calculateAdjustedSpeedLimit({ originalSpeedLimit, blockedLanes, totalLanes, severity, aiRecommendations = [] }) {
  let reductionFactor = 0;
  
  // Base reduction on blocked lanes
  if (totalLanes > 0) {
    const blockedRatio = blockedLanes.length / totalLanes;
    reductionFactor = blockedRatio * SPEED_REDUCTION_FACTOR;
  }
  
  // AI-influenced adjustment
  if (severity) {
    const severityAdjustment = (severity / 5) * 0.3; // Up to 30% additional reduction
    reductionFactor = Math.min(reductionFactor + severityAdjustment, 0.7); // Max 70% reduction
  }
  
  // AI recommendations override
  if (aiRecommendations.includes('REDUCE_SPEED_LIMIT_50_PERCENT')) {
    reductionFactor = Math.max(reductionFactor, 0.5);
  } else if (aiRecommendations.includes('REDUCE_SPEED_LIMIT_30_PERCENT')) {
    reductionFactor = Math.max(reductionFactor, 0.3);
  }
  
  const adjustedSpeed = Math.round(originalSpeedLimit * (1 - reductionFactor));
  
  // Apply bounds
  return Math.max(MIN_SPEED_LIMIT, Math.min(adjustedSpeed, MAX_SPEED_LIMIT));
}

/**
 * Determine required actions based on decision
 * 
 * @param {Object} params - Action determination parameters
 * @returns {Array<string>} Required actions
 */
function determineActions({ blockedLanes, severity, laneConfiguration, speedReduction }) {
  const actions = [];
  
  if (blockedLanes.length > 0) {
    actions.push('CLOSE_LANES');
  }
  
  if (speedReduction > 20) {
    actions.push('REDUCE_SPEED_LIMIT');
  }
  
  if (severity >= 4) {
    actions.push('ALERT_EMERGENCY_SERVICES');
  }
  
  if (laneConfiguration.includes('right') || laneConfiguration.includes('left')) {
    actions.push('DISPLAY_MERGE_SIGNS');
  }
  
  return actions;
}

/**
 * Generate node display instructions
 * 
 * @param {Object} params - Display parameters
 * @returns {Object} Display instructions
 */
function generateNodeDisplay({ blockedLanes, laneConfiguration, adjustedSpeedLimit, originalSpeedLimit }) {
  return {
    message: blockedLanes.length > 0 
      ? `ACCIDENT AHEAD - ${blockedLanes.length} LANE(S) BLOCKED` 
      : 'ACCIDENT AHEAD - REDUCE SPEED',
    speedLimit: adjustedSpeedLimit,
    laneStatus: laneConfiguration,
    alertLevel: blockedLanes.length >= 2 ? 'HIGH' : 'MEDIUM',
    displayDuration: 300 // seconds
  };
}

module.exports = {
  makeDecision,
  calculateLaneConfiguration,
  calculateAdjustedSpeedLimit,
};
