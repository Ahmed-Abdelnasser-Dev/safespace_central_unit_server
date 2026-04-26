/**
 * activityLog.routes.js — Activity log routes
 */

const express   = require('express');
const router    = express.Router();
const protect   = require('../../middleware/protect');
const validate = require('../../middleware/validate');
const controller = require('./activityLog.controller');
const { listActivityLogsSchema } = require('./activityLog.schema');

router.use(protect);

router.get('/', validate(listActivityLogsSchema), controller.listLogs);

module.exports = router;