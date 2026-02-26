/**
 * activityLogs.routes.js — Activity log routes
 */

const express   = require('express');
const router    = express.Router();
const protect   = require('../../middleware/protect');
const catchAsync = require('../../middleware/catchAsync');
const { getLogs } = require('./activitylogs.service');

router.use(protect);

router.get('/', catchAsync(async (req, res) => {
  const { page, limit, userId, eventType, success } = req.query;
  const result = await getLogs({
    requestingUser: req.user,
    page:      page      ? parseInt(page, 10)      : 1,
    limit:     limit     ? parseInt(limit, 10)     : 50,
    userId,
    eventType,
    success:   success !== undefined ? success === 'true' : undefined,
  });
  res.status(200).json({ status: 'success', data: result });
}));

module.exports = router;