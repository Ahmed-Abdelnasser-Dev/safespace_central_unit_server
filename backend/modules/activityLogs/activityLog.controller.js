/**
 * Activity logs controller
 */

const catchAsync = require('../../middleware/catchAsync');
const { getLogs } = require('./activityLog.service');

const listLogs = catchAsync(async (req, res) => {
  const { page, limit, userId, eventType, success } = req.query;
  const result = await getLogs({
    requestingUser: req.user,
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 50,
    userId,
    eventType,
    success: success !== undefined ? success === 'true' : undefined,
  });

  res.status(200).json({ status: 'success', data: result });
});

module.exports = {
  listLogs,
};
