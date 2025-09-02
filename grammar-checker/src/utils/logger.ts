/**
 * Conditional logger that only outputs in development mode
 * This helps reduce noise in production while maintaining debugging capabilities during development
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Log a message only in development mode
 * @param args - Arguments to pass to console.log
 */
export function debugLog(...args: any[]) {
  if (isDevelopment) {
    console.log(...args);
  }
}

/**
 * Log an error only in development mode
 * @param args - Arguments to pass to console.error
 */
export function debugError(...args: any[]) {
  if (isDevelopment) {
    console.error(...args);
  }
}

/**
 * Log a warning only in development mode
 * @param args - Arguments to pass to console.warn
 */
export function debugWarn(...args: any[]) {
  if (isDevelopment) {
    console.warn(...args);
  }
}

export { isDevelopment };