/**
 * Conditional logger that only outputs in development mode
 * This helps reduce noise in production while maintaining debugging capabilities during development
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Log a message only in development mode
 * @param {...any} args - Arguments to pass to console.log
 */
function debugLog(...args) {
  if (isDevelopment) {
    console.log(...args);
  }
}

/**
 * Log an error only in development mode
 * @param {...any} args - Arguments to pass to console.error
 */
function debugError(...args) {
  if (isDevelopment) {
    console.error(...args);
  }
}

/**
 * Log a warning only in development mode
 * @param {...any} args - Arguments to pass to console.warn
 */
function debugWarn(...args) {
  if (isDevelopment) {
    console.warn(...args);
  }
}

module.exports = {
  debugLog,
  debugError,
  debugWarn,
  isDevelopment
};
