/**
 * Decision Module Routes
 * 
 * Routes for decision-making endpoints (testing/debugging)
 * 
 * @module modules/decision/decision.routes
 */

const express = require('express');
const decisionController = require('./decision.controller');

const router = express.Router();

/**
 * POST /api/decision/analyze
 * Test decision-making
 */
router.post('/analyze', decisionController.makeDecision);

module.exports = router;
