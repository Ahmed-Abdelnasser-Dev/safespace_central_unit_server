/**
 * AI Module Routes
 * 
 * Routes for AI analysis endpoints (testing/debugging)
 * 
 * @module modules/ai/ai.routes
 */

const express = require('express');
const aiController = require('./ai.controller');
const validate = require('../../middleware/validate');
const { aiAnalyzeSchema } = require('./ai.schema');

const router = express.Router();

/**
 * POST /api/ai/analyze
 * Test AI analysis
 */
router.post('/analyze', validate(aiAnalyzeSchema), aiController.analyzeAccident);

module.exports = router;
