/**
 * Server-to-server auth middleware for Mobile App Server ingress routes.
 *
 * Supports two optional checks controlled via env:
 * 1) Shared secret via x-mobile-shared-secret header
 * 2) Proxy/cert identity headers
 */

const env = require('../config/env');
const AppError = require('../utils/AppError');

function mobileServerAuth(req, res, next) {
  if (!env.ENFORCE_MOBILE_SERVER_AUTH) {
    return next();
  }

  if (env.MOBILE_SERVER_SHARED_SECRET) {
    const providedSecret = req.headers['x-mobile-shared-secret'];
    if (!providedSecret || providedSecret !== env.MOBILE_SERVER_SHARED_SECRET) {
      return next(new AppError('Unauthorized mobile server request', 401));
    }
  }

  if (env.MOBILE_APP_PROXY_HEADER_NAME && env.MOBILE_APP_PROXY_HEADER_VALUE) {
    const proxyHeaderName = env.MOBILE_APP_PROXY_HEADER_NAME.toLowerCase();
    const actualProxyValue = req.headers[proxyHeaderName];
    if (actualProxyValue !== env.MOBILE_APP_PROXY_HEADER_VALUE) {
      return next(new AppError('Unauthorized mobile server request', 401));
    }
  }

  if (env.MOBILE_APP_CLIENT_CERT_HEADER_NAME && env.MOBILE_APP_CLIENT_CERT_HEADER_VALUE) {
    const certHeaderName = env.MOBILE_APP_CLIENT_CERT_HEADER_NAME.toLowerCase();
    const actualCertValue = req.headers[certHeaderName];
    if (actualCertValue !== env.MOBILE_APP_CLIENT_CERT_HEADER_VALUE) {
      return next(new AppError('Unauthorized mobile server request', 401));
    }
  }

  return next();
}

module.exports = mobileServerAuth;
