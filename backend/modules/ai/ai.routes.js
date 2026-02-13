/**
 * AI Module Routes
 * 
 * Routes for AI analysis endpoints (testing/debugging)
 * 
 * @module modules/ai/ai.routes
 */

const express = require('express');
const aiController = require('./ai.controller');

const router = express.Router();

/**
 * POST /api/ai/analyze
 * Test AI analysis
 */
router.post('/analyze', aiController.analyzeAccident);

module.exports = router;
