/**
 * AI Module Controller
 * 
 * HTTP endpoints for AI analysis (if needed for testing/debugging)
 * 
 * @module modules/ai/ai.controller
 */

const catchAsync = require('../../middleware/catchAsync');
const aiService = require('./ai.service');

/**
 * Test AI analysis endpoint
 * 
 * @route POST /api/ai/analyze
 * @access Internal/Testing
 */
exports.analyzeAccident = catchAsync(async (req, res) => {
  const { mediaPath, mediaPaths, accidentPolygon, location } = req.body;
  
  const result = await aiService.analyzeAccident({
    mediaPath,
    mediaPaths,
    accidentPolygon,
    location
  });
  
  res.status(200).json({
    status: 'success',
    data: result
  });
});
