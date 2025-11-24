/**
 * Global Error Handling Middleware
 * 
 * Central error handler for all Express routes.
 * Handles operational errors, validation errors, and unexpected exceptions.
 * 
 * @module middleware/errorHandler
 */

const { logger } = require('../utils/logger');

/**
 * Send error response in development mode (includes stack trace)
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

/**
 * Send error response in production mode (sanitized)
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      error: err.message,
    });
  } 
  // Programming or unknown error: don't leak details
  else {
    logger.error('ERROR 💥', err);
    
    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log the error
  logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(err, res);
  }
};

module.exports = errorHandler;
