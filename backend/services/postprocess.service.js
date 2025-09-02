/**
 * Post-processing utilities for grammar checking results
 * Handles sanitization, deduplication, overlap detection, and result formatting
 */

const DOMPurify = require('isomorphic-dompurify');

/**
 * Sanitize text input to prevent XSS and other security issues
 * @param {string} text - Input text to sanitize
 * @returns {string} - Sanitized text
 */
function sanitizeText(text) {
  if (typeof text !== 'string') return '';

  // Remove HTML tags and potentially dangerous content
  const cleaned = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });

  // Additional sanitization for common issues
  return cleaned
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n')
    .trim();
}

/**
 * Check if two suggestions overlap in their text positions
 * @param {Object} suggestion1 - First suggestion
 * @param {Object} suggestion2 - Second suggestion
 * @returns {boolean} - True if suggestions overlap
 */
function suggestionsOverlap(suggestion1, suggestion2) {
  const start1 = suggestion1.index;
  const end1 = suggestion1.endIndex;
  const start2 = suggestion2.index;
  const end2 = suggestion2.endIndex;

  // Check for any overlap
  return !(end1 <= start2 || end2 <= start1);
}

/**
 * Remove duplicate suggestions based on position and content
 * @param {Array} suggestions - Array of suggestion objects
 * @returns {Array} - Deduplicated suggestions
 */
function deduplicateSuggestions(suggestions) {
  if (!Array.isArray(suggestions)) return [];

  const seen = new Set();
  const result = [];

  for (const suggestion of suggestions) {
    // Create a unique key based on position and suggested text
    const key = `${suggestion.index}-${suggestion.endIndex}-${suggestion.suggested}`;

    if (!seen.has(key)) {
      seen.add(key);
      result.push(suggestion);
    }
  }

  return result;
}

/**
 * Resolve overlapping suggestions by keeping the highest confidence one
 * @param {Array} suggestions - Array of suggestion objects
 * @returns {Array} - Suggestions with overlaps resolved
 */
function resolveOverlaps(suggestions) {
  if (!Array.isArray(suggestions) || suggestions.length <= 1) return suggestions;

  // Sort by position first
  const sorted = [...suggestions].sort((a, b) => a.index - b.index);
  const result = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    let shouldKeep = true;

    // Check against already accepted suggestions
    for (const accepted of result) {
      if (suggestionsOverlap(current, accepted)) {
        // Keep the one with higher confidence
        if (current.confidence > accepted.confidence) {
          // Remove the lower confidence one
          const index = result.indexOf(accepted);
          result.splice(index, 1);
        } else {
          shouldKeep = false;
          break;
        }
      }
    }

    if (shouldKeep) {
      result.push(current);
    }
  }

  return result.sort((a, b) => a.index - b.index);
}

/**
 * Validate and normalize a single suggestion object
 * @param {Object} suggestion - Suggestion to validate
 * @param {string} originalText - Original text for validation
 * @returns {Object|null} - Normalized suggestion or null if invalid
 */
function validateSuggestion(suggestion, originalText) {
  if (!suggestion || typeof suggestion !== 'object') return null;

  const {
    original,
    suggested,
    explanation,
    index,
    endIndex,
    category,
    severity,
    confidence,
    sentenceIndex,
    ruleId,
    source
  } = suggestion;

  // Required fields validation
  if (typeof original !== 'string' ||
      typeof suggested !== 'string' ||
      typeof explanation !== 'string' ||
      typeof index !== 'number' ||
      typeof endIndex !== 'number') {
    return null;
  }

  // Position validation
  if (index < 0 || endIndex <= index || endIndex > originalText.length) {
    return null;
  }

  // Check if original text matches
  const actualText = originalText.substring(index, endIndex);
  if (actualText !== original) {
    return null;
  }

  // Validate enums
  const validCategories = ['grammar', 'spelling', 'punctuation', 'style', 'tone', 'readability'];
  const validSeverities = ['low', 'medium', 'high'];
  const validSources = ['ai', 'rb', 'merged']; // Removed deprecated services - AI mode only

  return {
    original,
    suggested,
    explanation: explanation.substring(0, 160), // Limit explanation length
    index,
    endIndex,
    category: validCategories.includes(category) ? category : 'style',
    severity: validSeverities.includes(severity) ? severity : 'medium',
    confidence: Math.max(0, Math.min(1, Number(confidence) || 0.5)),
    sentenceIndex: Math.max(0, Number(sentenceIndex) || 0),
    ruleId: String(ruleId || 'unknown'),
    source: validSources.includes(source) ? source : 'unknown'
  };
}

/**
 * Process and clean an array of suggestions
 * @param {Array} suggestions - Raw suggestions array
 * @param {string} originalText - Original text for validation
 * @returns {Array} - Processed and cleaned suggestions
 */
function processSuggestions(suggestions, originalText) {
  if (!Array.isArray(suggestions)) return [];

  // Step 1: Validate and normalize each suggestion
  const validated = suggestions
    .map(s => validateSuggestion(s, originalText))
    .filter(s => s !== null);

  // Step 2: Remove duplicates
  const deduplicated = deduplicateSuggestions(validated);

  // Step 3: Resolve overlaps
  const resolved = resolveOverlaps(deduplicated);

  // Step 4: Sort by position
  return resolved.sort((a, b) => a.index - b.index);
}

/**
 * Calculate writing score based on suggestions
 * @param {Array} suggestions - Array of processed suggestions
 * @param {string} text - Original text
 * @returns {number} - Writing score from 0-100
 */
function calculateWritingScore(suggestions, text) {
  if (!text || text.length === 0) return 0;

  const wordCount = text.split(/\s+/).length;
  const suggestionCount = suggestions.length;

  // Weight suggestions by severity
  const weightedErrors = suggestions.reduce((sum, s) => {
    const weights = { low: 0.5, medium: 1.0, high: 2.0 };
    return sum + (weights[s.severity] || 1.0);
  }, 0);

  // Calculate error rate per 100 words
  const errorRate = (weightedErrors / Math.max(wordCount, 1)) * 100;

  // Convert to score (lower error rate = higher score)
  const baseScore = Math.max(0, 100 - (errorRate * 10));

  // Apply confidence adjustment
  const avgConfidence = suggestions.length > 0
    ? suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length
    : 1.0;

  return Math.round(baseScore * avgConfidence);
}

/**
 * Format the final response object
 * @param {Array} suggestions - Processed suggestions
 * @param {string} originalText - Original text
 * @param {Object} metadata - Additional metadata
 * @returns {Object} - Formatted response
 */
function formatResponse(suggestions, originalText, metadata = {}) {
  const writingScore = calculateWritingScore(suggestions, originalText);

  return {
    suggestions,
    writingScore,
    metadata: {
      totalSuggestions: suggestions.length,
      textLength: originalText.length,
      wordCount: originalText.split(/\s+/).length,
      processingTime: metadata.processingTime || 0,
      mode: metadata.mode || 'unknown',
      strategy: metadata.strategy || 'unknown',
      ...metadata
    }
  };
}

/**
 * Safe JSON parsing with error handling
 * @param {string} jsonString - JSON string to parse
 * @returns {Array|null} - Parsed array or null if invalid
 */
function safeParseJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.error('JSON parsing error:', error.message);
    return null;
  }
}

/**
 * Extract JSON from AI response that might contain extra text
 * @param {string} response - AI response text
 * @returns {Array|null} - Extracted suggestions array or null
 */
function extractJSONFromResponse(response) {
  if (!response || typeof response !== 'string') return null;

  // Try to find JSON array in the response
  const jsonMatch = response.match(/\[.*\]/s);
  if (jsonMatch) {
    return safeParseJSON(jsonMatch[0]);
  }

  // Try parsing the entire response
  return safeParseJSON(response);
}

module.exports = {
  sanitizeText,
  suggestionsOverlap,
  deduplicateSuggestions,
  resolveOverlaps,
  validateSuggestion,
  processSuggestions,
  calculateWritingScore,
  formatResponse,
  safeParseJSON,
  extractJSONFromResponse
};
