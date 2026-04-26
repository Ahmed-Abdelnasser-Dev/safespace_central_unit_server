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
 * Validate whether a value is a point-like object with finite numeric coordinates.
 * Accepts numeric strings (e.g., "640") by coercing to Number.
 *
 * @param {unknown} point - Candidate point value
 * @returns {boolean} True when point has finite x/y coordinates
 */
function isFiniteCoordinatePoint(point) {
  if (!point || typeof point !== 'object' || Array.isArray(point)) {
    return false;
  }

  return Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y));
}

/**
 * Extract polygon rings from supported input formats.
 *
 * Supports:
 * 1) Flat ring: [{x, y}, {x, y}, ...]
 * 2) Nested rings: [[{x, y}, ...], [{x, y}, ...]]
 * 3) Mixed arrays: point entries + nested ring entries
 *
 * @param {Array} points - Polygon points payload
 * @returns {Array<Array>} Array of point rings
 */
function extractPointRings(points) {
  if (!Array.isArray(points)) {
    return [];
  }

  const hasNestedRings = points.some((entry) => Array.isArray(entry));

  if (!hasNestedRings) {
    return [points];
  }

  const rings = [];
  const flatPoints = [];

  points.forEach((entry) => {
    if (Array.isArray(entry)) {
      if (entry.length > 0) {
        rings.push(entry);
      }
      return;
    }

    flatPoints.push(entry);
  });

  if (flatPoints.length > 0) {
    rings.unshift(flatPoints);
  }

  return rings;
}

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
  const accidentPointRings = extractPointRings(accidentPolygon?.points);
  const hasValidAccidentRing = accidentPointRings.some(
    (ring) => Array.isArray(ring) && ring.length >= 3
  );

  if (!accidentPolygon || !hasValidAccidentRing) {
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
      logger.error('Failed to convert accident polygon to Turf format', {
        polygon: {
          pointsCount: accidentPolygon?.points?.length,
          baseWidth: accidentPolygon?.baseWidth,
          baseHeight: accidentPolygon?.baseHeight,
          firstPoint: accidentPolygon?.points?.[0],
          lastPoint: accidentPolygon?.points?.[accidentPolygon.points.length - 1]
        }
      });
      return [];
    }

    // Use accidentPolygon's baseWidth/baseHeight for all lane polygons
    const { baseWidth, baseHeight } = accidentPolygon;

    lanePolygons.forEach((lanePolygon, index) => {
      try {
        const lanePointRings = extractPointRings(lanePolygon.points);
        const hasValidLaneRing = lanePointRings.some(
          (ring) => Array.isArray(ring) && ring.length >= 3
        );

        if (!hasValidLaneRing) {
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
 * @returns {object|null} Turf Polygon or MultiPolygon object, or null if invalid
 */
function convertPixelPolygonToTurf(polygon) {
  try {
    if (!polygon || typeof polygon !== 'object') {
      logger.warn('Invalid polygon: not an object', { polygon });
      return null;
    }

    const pointRings = extractPointRings(polygon.points);

    if (pointRings.length === 0) {
      logger.warn('Invalid polygon: insufficient points', { pointsCount: polygon.points?.length });
      return null;
    }

    const baseWidth = Number(polygon.baseWidth ?? 1920);
    const baseHeight = Number(polygon.baseHeight ?? 1080);
    
    // Validate base dimensions
    if (!Number.isFinite(baseWidth) || baseWidth <= 0 || !Number.isFinite(baseHeight) || baseHeight <= 0) {
      logger.warn('Invalid base dimensions', { baseWidth, baseHeight });
      return null;
    }

    // Normalize all rings to 0-1000 range for consistent comparison.
    // Handles negative coordinates by normalizing relative to the base.
    const normalizedRings = [];
    let discardedRings = 0;

    pointRings.forEach((ring, ringIndex) => {
      if (!Array.isArray(ring) || ring.length < 3) {
        discardedRings += 1;
        logger.warn('Invalid polygon ring: insufficient points', {
          ringIndex,
          ringPointsCount: ring?.length,
        });
        return;
      }

      const invalidPointIndex = ring.findIndex((point) => !isFiniteCoordinatePoint(point));

      if (invalidPointIndex !== -1) {
        discardedRings += 1;
        logger.warn('Invalid polygon: point with non-numeric coordinates', {
          ringIndex,
          pointIndex: invalidPointIndex,
          invalidPoint: ring[invalidPointIndex],
        });
        return;
      }

      const normalizedRing = ring.map((point, pointIndex) => {
        const pointX = Number(point.x);
        const pointY = Number(point.y);
        const normalizedX = (pointX / baseWidth) * 1000;
        const normalizedY = (pointY / baseHeight) * 1000;

        if (!Number.isFinite(normalizedX) || !Number.isFinite(normalizedY)) {
          logger.error('Failed to normalize point', {
            ringIndex,
            pointIndex,
            original: point,
            normalized: { normalizedX, normalizedY },
            baseWidth,
            baseHeight,
          });
          throw new Error(`Point normalization failed at ring ${ringIndex}, index ${pointIndex}`);
        }

        return [normalizedX, normalizedY];
      });

      // Close each ring if not already closed
      const firstPoint = normalizedRing[0];
      const lastPoint = normalizedRing[normalizedRing.length - 1];
      const EPSILON = 0.001;
      const isNotClosed = Math.abs(firstPoint[0] - lastPoint[0]) > EPSILON ||
                          Math.abs(firstPoint[1] - lastPoint[1]) > EPSILON;

      if (isNotClosed) {
        normalizedRing.push([...firstPoint]);
      }

      if (normalizedRing.length < 4) {
        discardedRings += 1;
        logger.warn('Invalid polygon ring: fewer than 3 unique points after closing', {
          ringIndex,
          ringPointsCount: normalizedRing.length,
        });
        return;
      }

      normalizedRings.push(normalizedRing);
    });

    if (normalizedRings.length === 0) {
      logger.warn('Invalid polygon: no valid rings after normalization', {
        ringsReceived: pointRings.length,
        discardedRings,
      });
      return null;
    }

    // Create Turf Polygon or MultiPolygon depending on rings count.
    const turfFeature = normalizedRings.length === 1
      ? turf.polygon([normalizedRings[0]])
      : turf.multiPolygon(normalizedRings.map((ring) => [ring]));

    if (!turfFeature || !turfFeature.geometry || !turfFeature.geometry.coordinates) {
      logger.error('Turf geometry creation resulted in invalid structure', { turfFeature });
      return null;
    }

    return turfFeature;
    
  } catch (error) {
    logger.error('Error converting polygon to Turf format', {
      error: error.message,
      errorStack: error.stack,
      polygon: {
        pointsCount: polygon?.points?.length,
        baseWidth: polygon?.baseWidth,
        baseHeight: polygon?.baseHeight
      }
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
