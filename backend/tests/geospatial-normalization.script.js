#!/usr/bin/env node

/**
 * Regression script for geospatial polygon normalization.
 *
 * Validates that geospatial conversion and lane intersection logic handle:
 * 1) Flat polygon points array
 * 2) Nested polygon rings array
 */

const assert = require('assert');
const geospatialService = require('../utils/geospatialService');

/**
 * Build simple lane polygons across a 640x640 frame.
 * @returns {Array<object>} Lane polygon fixtures
 */
function buildLanePolygons() {
  return [
    {
      id: 1,
      name: 'Lane 1',
      points: [
        { x: 0, y: 0 },
        { x: 160, y: 0 },
        { x: 160, y: 640 },
        { x: 0, y: 640 },
      ],
      baseWidth: 640,
      baseHeight: 640,
    },
    {
      id: 2,
      name: 'Lane 2',
      points: [
        { x: 160, y: 0 },
        { x: 320, y: 0 },
        { x: 320, y: 640 },
        { x: 160, y: 640 },
      ],
      baseWidth: 640,
      baseHeight: 640,
    },
    {
      id: 3,
      name: 'Lane 3',
      points: [
        { x: 320, y: 0 },
        { x: 480, y: 0 },
        { x: 480, y: 640 },
        { x: 320, y: 640 },
      ],
      baseWidth: 640,
      baseHeight: 640,
    },
    {
      id: 4,
      name: 'Lane 4',
      points: [
        { x: 480, y: 0 },
        { x: 640, y: 0 },
        { x: 640, y: 640 },
        { x: 480, y: 640 },
      ],
      baseWidth: 640,
      baseHeight: 640,
    },
  ];
}

/**
 * Run geospatial normalization checks.
 */
function run() {
  const flatPolygon = {
    points: [
      { x: 520, y: 70 },
      { x: 620, y: 70 },
      { x: 620, y: 610 },
      { x: 520, y: 610 },
    ],
    baseWidth: 640,
    baseHeight: 640,
  };

  const nestedPolygon = {
    points: [
      [
        { x: 554, y: 76 },
        { x: 640, y: 76 },
        { x: 640, y: 610 },
        { x: 554, y: 610 },
      ],
      [
        { x: 0, y: 10 },
        { x: 30, y: 10 },
        { x: 30, y: 33 },
        { x: 0, y: 33 },
      ],
    ],
    baseWidth: 640,
    baseHeight: 640,
  };

  const flatFeature = geospatialService.convertPixelPolygonToTurf(flatPolygon);
  assert(flatFeature, 'Flat polygon should convert to Turf geometry');
  assert.strictEqual(flatFeature.geometry.type, 'Polygon', 'Flat polygon should produce Polygon geometry');

  const nestedFeature = geospatialService.convertPixelPolygonToTurf(nestedPolygon);
  assert(nestedFeature, 'Nested polygon should convert to Turf geometry');
  assert.strictEqual(
    nestedFeature.geometry.type,
    'MultiPolygon',
    'Nested polygon should produce MultiPolygon geometry'
  );

  const intersections = geospatialService.findIntersectedLanes(nestedPolygon, buildLanePolygons());
  const laneNumbers = intersections.map((lane) => lane.laneNumber).sort((a, b) => a - b);

  assert.deepStrictEqual(laneNumbers, [1, 4], 'Nested polygon should intersect Lane 1 and Lane 4 only');

  console.log('Geospatial normalization regression checks passed.');
}

run();
