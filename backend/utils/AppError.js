/**
 * Custom Error Class for Application-Specific Errors
 * 
 * Extends the native Error class to include an HTTP status code
 * and operational flag for distinguishing expected errors from bugs.
 * 
 * @class AppError
 * @extends Error
 */
class AppError extends Error {
  /**
   * Create an AppError
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code
   */
  constructor(message, statusCode) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
