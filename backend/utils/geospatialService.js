/**
 * Geospatial Service
 * 
 * Handles polygon intersection calculations to determine which lanes
 * are affected by an accident based on polygon geometries.
 * 
 * Uses Turf.js for robust geospatial operations.
 * 
 * @module utils/geospatialService
 */

const turf = require('@turf/turf');
const { logger } = require('./logger');

/**
 * Find which lane polygons intersect with the accident polygon
 * 
 * Converts pixel-coordinate polygons to Turf Polygon format,
 * then checks for intersections.
 * 
 * @param {object} accidentPolygon - Accident polygon { points: [{x, y}], baseWidth, baseHeight }
 * @param {Array} lanePolygons - Array of lane polygons with same format + metadata
 * @returns {Array} Array of intersected lane objects [{id, name, laneNumber}]
 */
function findIntersectedLanes(accidentPolygon, lanePolygons) {
  logger.info('Starting lane intersection analysis', {
    accidentPolygonPoints: accidentPolygon?.points?.length || 0,
    totalLanes: lanePolygons?.length || 0
  });
  
  // Validate inputs
  if (!accidentPolygon || !accidentPolygon.points || accidentPolygon.points.length < 3) {
    logger.warn('Invalid accident polygon - insufficient points', { accidentPolygon });
    return [];
  }
  
  if (!lanePolygons || lanePolygons.length === 0) {
    logger.warn('No lane polygons configured for intersection analysis');
    return [];
  }
  
  const intersectedLanes = [];
  
  try {
    // Convert accident polygon to Turf format
    const accidentTurfPolygon = convertPixelPolygonToTurf(accidentPolygon);

    if (!accidentTurfPolygon) {
      logger.error('Failed to convert accident polygon to Turf format');
      return [];
    }

    // Use accidentPolygon's baseWidth/baseHeight for all lane polygons
    const { baseWidth, baseHeight } = accidentPolygon;

    lanePolygons.forEach((lanePolygon, index) => {
      try {
        if (!lanePolygon.points || lanePolygon.points.length < 3) {
          logger.warn(`Lane polygon ${index} has insufficient points`, { lanePolygon });
          return;
        }

        // Clone lanePolygon and override baseWidth/baseHeight for normalization
        const normalizedLanePolygon = {
          ...lanePolygon,
          baseWidth: baseWidth || lanePolygon.baseWidth,
          baseHeight: baseHeight || lanePolygon.baseHeight
        };

        const laneTurfPolygon = convertPixelPolygonToTurf(normalizedLanePolygon);

        if (!laneTurfPolygon) {
          logger.warn(`Failed to convert lane polygon ${index}`, { lanePolygon });
          return;
        }

        // Check for intersection using Turf.js
        const intersects = turf.booleanIntersects(accidentTurfPolygon, laneTurfPolygon);

        if (intersects) {
          // Extract lane number from name (e.g., "Lane 1" -> 1)
          const laneNumberMatch = lanePolygon.name?.match(/\d+/);
          const laneNumber = laneNumberMatch ? parseInt(laneNumberMatch[0]) : index + 1;

          intersectedLanes.push({
            id: lanePolygon.id,
            name: lanePolygon.name || `Lane ${index + 1}`,
            laneNumber: laneNumber
          });

          logger.info(`Lane intersection detected`, {
            laneId: lanePolygon.id,
            laneName: lanePolygon.name,
            laneNumber
          });
        }
      } catch (laneError) {
        logger.error(`Error checking lane ${index} for intersection`, {
          error: laneError.message,
          lanePolygon
        });
      }
    });
    
    logger.info('Lane intersection analysis complete', {
      totalIntersected: intersectedLanes.length,
      lanes: intersectedLanes.map(l => l.name)
    });
    
  } catch (error) {
    logger.error('Error during lane intersection analysis', {
      error: error.message,
      stack: error.stack
    });
    return [];
  }
  
  return intersectedLanes;
}

/**
 * Convert pixel-coordinate polygon to Turf.js Polygon format
 * 
 * Normalizes coordinates to a standard coordinate system (0-1000 range)
 * to ensure consistent intersection calculations regardless of image resolution.
 * 
 * @param {object} polygon - { points: [{x, y}], baseWidth, baseHeight }
 * @returns {object|null} Turf Polygon object or null if invalid
 */
function convertPixelPolygonToTurf(polygon) {
  try {
    if (!polygon.points || polygon.points.length < 3) {
      return null;
    }
    
    const baseWidth = polygon.baseWidth || 1920;
    const baseHeight = polygon.baseHeight || 1080;
    
    // Normalize coordinates to 0-1000 range for consistent comparison
    const normalizedPoints = polygon.points.map(point => {
      const normalizedX = (point.x / baseWidth) * 1000;
      const normalizedY = (point.y / baseHeight) * 1000;
      return [normalizedX, normalizedY];
    });
    
    // Close the polygon if not already closed
    const firstPoint = normalizedPoints[0];
    const lastPoint = normalizedPoints[normalizedPoints.length - 1];
    
    if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
      normalizedPoints.push([...firstPoint]);
    }
    
    // Create Turf polygon (coordinates array must be wrapped in another array)
    return turf.polygon([normalizedPoints]);
    
  } catch (error) {
    logger.error('Error converting polygon to Turf format', {
      error: error.message,
      polygon
    });
    return null;
  }
}

/**
 * Calculate the area of intersection between accident and lane polygons
 * 
 * Useful for determining severity of lane blockage.
 * 
 * @param {object} accidentPolygon - Accident polygon data
 * @param {object} lanePolygon - Lane polygon data
 * @returns {number} Intersection area (normalized units)
 */
function calculateIntersectionArea(accidentPolygon, lanePolygon) {
  try {
    const accidentTurf = convertPixelPolygonToTurf(accidentPolygon);
    const laneTurf = convertPixelPolygonToTurf(lanePolygon);
    
    if (!accidentTurf || !laneTurf) {
      return 0;
    }
    
    const intersection = turf.intersect(accidentTurf, laneTurf);
    
    if (!intersection) {
      return 0;
    }
    
    return turf.area(intersection);
    
  } catch (error) {
    logger.error('Error calculating intersection area', { error: error.message });
    return 0;
  }
}

module.exports = {
  findIntersectedLanes,
  convertPixelPolygonToTurf,
  calculateIntersectionArea,
};
