/**
 * Optional API-key auth for node ingestion endpoints.
 *
 * When enabled, requests must provide:
 * - x-node-id
 * - x-node-key
 *
 * Expected key env var format: NODE_<NODE_ID>_KEY
 */

const env = require('../config/env');
const AppError = require('../utils/AppError');

function getNodeId(req) {
  return req.headers['x-node-id'] || req.body.nodeId || req.params.nodeId;
}

function normalizeNodeId(rawNodeId) {
  const str = String(rawNodeId || '').trim();
  return str.toUpperCase().replace(/[^A-Z0-9]/g, '_');
}

function nodeApiKey(req, res, next) {
  if (!env.ENFORCE_NODE_API_KEY) {
    return next();
  }

  const nodeId = getNodeId(req);
  const providedKey = req.headers['x-node-key'];

  if (!nodeId || !providedKey) {
    return next(new AppError('Node authentication required', 401));
  }

  const envVarName = `NODE_${normalizeNodeId(nodeId)}_KEY`;
  const expectedKey = process.env[envVarName];

  if (!expectedKey || providedKey !== expectedKey) {
    return next(new AppError('Node authentication failed', 401));
  }

  return next();
}

module.exports = nodeApiKey;
