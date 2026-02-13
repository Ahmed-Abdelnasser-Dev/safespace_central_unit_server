/**
 * Decision Module Controller
 * 
 * HTTP endpoints for decision-making (if needed for testing/debugging)
 * 
 * @module modules/decision/decision.controller
 */

const catchAsync = require('../../middleware/catchAsync');
const decisionService = require('./decision.service');

/**
 * Test decision-making endpoint
 * 
 * @route POST /api/decision/analyze
 * @access Internal/Testing
 */
exports.makeDecision = catchAsync(async (req, res) => {
  const { nodeId, lanNumber, accidentPolygon, location, aiResults } = req.body;
  
  const result = await decisionService.makeDecision({
    nodeId,
    lanNumber,
    accidentPolygon,
    location,
    aiResults
  });
  
  res.status(200).json({
    status: 'success',
    data: result
  });
});
