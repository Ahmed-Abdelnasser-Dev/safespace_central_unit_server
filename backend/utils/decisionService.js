/**
 * Decision Service
 * 
 * Automated decision logic for accident response:
 * - Calculate lane configuration based on blocked lanes
 * - Determine adjusted speed limits
 * - Apply traffic management rules
 * 
 * @module utils/decisionService
 */

const { logger } = require('./logger');

// Configuration Constants
const MIN_SPEED_LIMIT = 40; // km/h - Never reduce below this
const SPEED_REDUCTION_FACTOR = 0.5; // Reduce by up to 50% based on blocked lanes
const MAX_SPEED_LIMIT = 200; // km/h - Sanity check

/**
 * Calculate lane configuration string based on blocked lanes
 * 
 * Rules:
 * - Blocked lanes are marked as "blocked"
 * - Lane immediately to the right of blocked lane(s) is marked "right" (merge right)
 * - All other lanes remain "open"
 * 
 * Example: Lanes [1, 2, 3, 4]
 * - If lanes 1, 2 are blocked → "blocked,blocked,right,open"
 * - If lane 3 is blocked → "open,open,blocked,right"
 * 
 * @param {Array} blockedLanes - Array of blocked lane objects [{id, name, laneNumber}]
 * @param {Array} allLanes - All lanes from node's roadRules.lanes [{id, name, ...}]
 * @returns {string} Lane configuration string (comma-separated)
 */
function calculateLaneConfiguration(blockedLanes, allLanes) {
  logger.info('Calculating lane configuration', {
    blockedLanes: blockedLanes.map(l => l.name),
    totalLanes: allLanes.length
  });
  
  if (!allLanes || allLanes.length === 0) {
    logger.warn('No lanes provided for configuration calculation');
    return '';
  }
  
  // Sort lanes by ID to ensure consistent left-to-right order
  const sortedLanes = [...allLanes].sort((a, b) => a.id - b.id);
  
  // Create set of blocked lane NUMBERS (1, 2, 3...) for matching
  // blockedLanes from geospatial service have laneNumber field
  const blockedLaneNumbers = new Set(
    blockedLanes.map(lane => lane.laneNumber)
  );
  
  // Build configuration array
  const laneConfig = sortedLanes.map((lane, index) => {
    // Match by lane position (1-based index), not by polygon ID
    const laneNumber = index + 1;
    
    // Check if this lane is blocked
    if (blockedLaneNumbers.has(laneNumber)) {
      return 'blocked';
    }
    
    const leftLaneNumber = index; // Lane to the left is at (index - 1) + 1 = index
    const rightLaneNumber = index + 2; // Lane to the right is at (index + 1) + 1 = index + 2
    const isLeftBlocked = index > 0 && blockedLaneNumbers.has(leftLaneNumber);
    const isRightBlocked = index < sortedLanes.length - 1 && blockedLaneNumbers.has(rightLaneNumber);
    
    // Prefer merging away from blocked adjacent lanes
    if (isLeftBlocked && !isRightBlocked) {
      return 'right';
    }
    
    if (isRightBlocked && !isLeftBlocked) {
      return 'left';
    }
    
    // Otherwise lane is open
    return 'open';
  });
  
  const configString = laneConfig.join(',');
  
  logger.info('Lane configuration calculated', {
    configuration: configString,
    breakdown: sortedLanes.map((lane, i) => ({
      lane: lane.name,
      status: laneConfig[i]
    }))
  });
  
  return configString;
}

/**
 * Calculate adjusted speed limit based on blocked lanes
 * 
 * Formula: newSpeed = currentSpeed * (1 - (blockedLanes / totalLanes) * reductionFactor)
 * 
 * Examples (80 km/h base, 4 lanes):
 * - 1 blocked: 80 * (1 - (1/4) * 0.5) = 80 * 0.875 = 70 km/h
 * - 2 blocked: 80 * (1 - (2/4) * 0.5) = 80 * 0.75 = 60 km/h
 * - 3 blocked: 80 * (1 - (3/4) * 0.5) = 80 * 0.625 = 50 km/h
 * 
 * @param {number} currentSpeedLimit - Current speed limit (km/h)
 * @param {Array} blockedLanes - Array of blocked lane objects
 * @param {number} totalLanes - Total number of lanes
 * @returns {number} Adjusted speed limit (km/h)
 */
function calculateSpeedLimit(currentSpeedLimit, blockedLanes, totalLanes) {
  logger.info('Calculating adjusted speed limit', {
    currentSpeed: currentSpeedLimit,
    blockedCount: blockedLanes.length,
    totalLanes
  });
  
  // Validate inputs
  if (!currentSpeedLimit || currentSpeedLimit <= 0) {
    logger.warn('Invalid current speed limit', { currentSpeedLimit });
    return MIN_SPEED_LIMIT;
  }
  
  if (!totalLanes || totalLanes <= 0) {
    logger.warn('Invalid total lanes count', { totalLanes });
    return currentSpeedLimit;
  }
  
  if (!blockedLanes || blockedLanes.length === 0) {
    logger.info('No blocked lanes - maintaining current speed', { currentSpeedLimit });
    return currentSpeedLimit;
  }
  
  // Calculate reduction ratio
  const blockedRatio = blockedLanes.length / totalLanes;
  const reductionRatio = blockedRatio * SPEED_REDUCTION_FACTOR;
  
  // Apply reduction
  const adjustedSpeed = Math.round(currentSpeedLimit * (1 - reductionRatio));
  
  // Apply constraints
  let finalSpeed = adjustedSpeed;
  
  if (finalSpeed < MIN_SPEED_LIMIT) {
    logger.warn('Calculated speed below minimum, capping', {
      calculated: adjustedSpeed,
      minimum: MIN_SPEED_LIMIT
    });
    finalSpeed = MIN_SPEED_LIMIT;
  }
  
  if (finalSpeed > MAX_SPEED_LIMIT) {
    logger.warn('Calculated speed above maximum, capping', {
      calculated: adjustedSpeed,
      maximum: MAX_SPEED_LIMIT
    });
    finalSpeed = MAX_SPEED_LIMIT;
  }
  
  logger.info('Speed limit adjustment calculated', {
    original: currentSpeedLimit,
    adjusted: finalSpeed,
    reduction: currentSpeedLimit - finalSpeed,
    reductionPercent: Math.round((1 - finalSpeed / currentSpeedLimit) * 100)
  });
  
  return finalSpeed;
}

/**
 * Determine recommended action based on severity and blocked lanes
 * 
 * @param {number} severity - AI severity level (1-5)
 * @param {Array} blockedLanes - Blocked lanes
 * @param {number} totalLanes - Total lanes
 * @returns {string} Recommended action ('reduce-speed', 'normal-operation', 'emergency-stop')
 */
function determineRecommendedAction(severity, blockedLanes, totalLanes) {
  const blockedCount = blockedLanes.length;
  const blockedRatio = blockedCount / totalLanes;
  
  logger.info('Determining recommended action', {
    severity,
    blockedCount,
    blockedRatio
  });
  
  // Critical severity or all lanes blocked
  if (severity >= 4 || blockedRatio >= 1.0) {
    return 'emergency-stop';
  }
  
  // High severity or majority lanes blocked
  if (severity >= 3 || blockedRatio >= 0.5) {
    return 'reduce-speed';
  }
  
  // Minor incident
  if (blockedCount > 0) {
    return 'reduce-speed';
  }
  
  return 'normal-operation';
}

/**
 * Generate decision summary for logging and audit
 * 
 * @param {object} decisionData - All decision parameters
 * @returns {object} Decision summary
 */
function generateDecisionSummary(decisionData) {
  const {
    incidentId,
    severity,
    blockedLanes,
    laneConfiguration,
    originalSpeed,
    adjustedSpeed,
    recommendedAction
  } = decisionData;
  
  return {
    incidentId,
    timestamp: new Date().toISOString(),
    analysis: {
      severity,
      blockedLanes: blockedLanes.map(l => l.name),
      blockedCount: blockedLanes.length
    },
    decisions: {
      laneConfiguration,
      speedAdjustment: {
        from: originalSpeed,
        to: adjustedSpeed,
        reduction: originalSpeed - adjustedSpeed
      },
      recommendedAction
    }
  };
}

module.exports = {
  calculateLaneConfiguration,
  calculateSpeedLimit,
  determineRecommendedAction,
  generateDecisionSummary,
  
  // Export constants for testing
  MIN_SPEED_LIMIT,
  SPEED_REDUCTION_FACTOR,
  MAX_SPEED_LIMIT,
};
