/**
 * @typedef {Object} Suggestion
 * @property {'grammar' | 'clarity' | 'tone' | 'style' | 'ai_suggestion'} type
 * @property {string} message
 * @property {string} [shortMessage]
 * @property {number} [offset]
 * @property {number} [length]
 * @property {string[]} [replacements]
 * @property {string} [rule]
 * @property {string} category
 * @property {'low' | 'medium' | 'high'} [severity]
 * @property {number} [confidence]
 */

/**
 * GrammarEngine interface
 * @interface
 */
class GrammarEngine {
  /**
   * Unique identifier for the engine
   * @type {string}
   */
  id;

  /**
   * Display name for the engine
   * @type {string}
   */
  name;

  /**
   * Check text for grammar issues
   * @param {string} text - Text to check
   * @returns {Promise<Suggestion[]>} Array of suggestions
   */
  async check(text) {
    throw new Error('Method not implemented');
  }
}

module.exports = { GrammarEngine };
