/**
 * Decision Module Routes
 * 
 * Routes for decision-making endpoints (testing/debugging)
 * 
 * @module modules/decision/decision.routes
 */

const express = require('express');
const decisionController = require('./decision.controller');
const validate = require('../../middleware/validate');
const { decisionAnalyzeSchema } = require('./decision.schema');

const router = express.Router();

/**
 * POST /api/decisions/analyze
 * Test decision-making
 */
router.post('/analyze', validate(decisionAnalyzeSchema), decisionController.makeDecision);

module.exports = router;
