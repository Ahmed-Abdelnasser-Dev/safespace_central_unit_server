/**
 * CORS helpers for backend-only origin control.
 *
 * Origins are read from backend environment variables and matched explicitly.
 */

const env = require('./env');

/**
 * Normalize an origin string.
 * Supports legacy /24 CIDR-style entries by converting them to wildcard prefixes.
 * @param {string} value
 * @returns {string}
 */
const normalizeOrigin = (value) => {
  const trimmed = value.trim();

  if (trimmed.endsWith('/24')) {
    const withoutCidr = trimmed.replace(/\/24$/, '');
    if (withoutCidr.endsWith('.0')) {
      return `${withoutCidr.slice(0, -2)}.*`;
    }
    return `${withoutCidr}*`;
  }

  return trimmed;
};

/**
 * Parse comma-separated origins into a unique normalized list.
 * @param {string | undefined} raw
 * @param {string} fallback
 * @returns {string[]}
 */
const parseAllowedOrigins = (raw, fallback) => {
  const source = typeof raw === 'string' && raw.trim().length > 0 ? raw : fallback;
  const normalized = source
    .split(',')
    .map((item) => normalizeOrigin(item))
    .filter((item) => item.length > 0);

  return [...new Set(normalized)];
};

const allowedOrigins = Object.freeze(parseAllowedOrigins(env.ALLOWED_ORIGINS, env.FRONTEND_URL));

/**
 * Check whether an origin is explicitly allowed.
 * Supports exact matches and trailing wildcard prefix matches (e.g. https://app.example.com*).
 * @param {string} origin
 * @returns {boolean}
 */
const isOriginAllowed = (origin) =>
  allowedOrigins.some((allowed) => {
    if (allowed.endsWith('*')) {
      return origin.startsWith(allowed.slice(0, -1));
    }

    return origin === allowed;
  });

module.exports = {
  allowedOrigins,
  isOriginAllowed,
};
