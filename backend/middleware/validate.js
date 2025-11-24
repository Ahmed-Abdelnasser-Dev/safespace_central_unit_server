/**
 * Zod Validation Middleware
 * 
 * Validates request data against a Zod schema.
 * Used for input validation on all endpoints.
 * 
 * @module middleware/validate
 */

const AppError = require('../utils/AppError');

/**
 * Creates a validation middleware for a given Zod schema
 * @param {Object} schema - Zod schema object with body, params, query properties
 * @returns {Function} Express middleware function
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Validate request body if schema.body exists
      if (schema.body) {
        schema.body.parse(req.body);
      }

      // Validate request params if schema.params exists
      if (schema.params) {
        schema.params.parse(req.params);
      }

      // Validate request query if schema.query exists
      if (schema.query) {
        schema.query.parse(req.query);
      }

      next();
    } catch (error) {
      // Zod validation error - format and return
      if (error.errors) {
        const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        return next(new AppError(messages.join(', '), 400));
      }
      
      next(new AppError('Validation failed', 400));
    }
  };
};

module.exports = validate;
