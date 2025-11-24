/**
 * Higher-Order Function to Catch Async Errors
 * 
 * Wraps async controller functions and automatically forwards
 * any rejected promises to the Express error handler.
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
