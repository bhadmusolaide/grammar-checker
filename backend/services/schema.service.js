/**
 * JSON Schema validation service for grammar checking responses
 * Uses Ajv for fast and reliable schema validation
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Initialize Ajv with strict mode and formats
const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: true
});
addFormats(ajv);

/**
 * JSON Schema for individual suggestion objects
 */
const suggestionSchema = {
  type: 'object',
  properties: {
    original: {
      type: 'string',
      minLength: 1,
      description: 'Exact text to replace from the original text'
    },
    suggested: {
      type: 'string',
      description: 'Replacement text (can be empty for deletions)'
    },
    explanation: {
      type: 'string',
      minLength: 1,
      maxLength: 160,
      description: 'Clear explanation of why this change improves the text'
    },
    index: {
      type: 'integer',
      minimum: 0,
      description: 'Start position in original text (0-based)'
    },
    endIndex: {
      type: 'integer',
      minimum: 0,
      description: 'End position in original text (exclusive)'
    },
    category: {
      type: 'string',
      enum: ['grammar', 'spelling', 'punctuation', 'style', 'tone', 'readability'],
      description: 'Type of issue this suggestion addresses'
    },
    severity: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
      description: 'Severity level of the issue'
    },
    confidence: {
      type: 'number',
      minimum: 0.0,
      maximum: 1.0,
      description: 'Confidence level in this suggestion (0.0 to 1.0)'
    },
    sentenceIndex: {
      type: 'integer',
      minimum: 0,
      description: 'Which sentence this occurs in (0-based)'
    },
    ruleId: {
      type: 'string',
      minLength: 1,
      description: 'Identifier for the rule that triggered this suggestion'
    },
    source: {
      type: 'string',
      enum: ['ai', 'rb', 'merged'], // Removed deprecated services - AI mode only
      description: 'Source of this suggestion'
    }
  },
  required: [
    'original',
    'suggested',
    'explanation',
    'index',
    'endIndex',
    'category',
    'severity',
    'confidence',
    'sentenceIndex',
    'ruleId',
    'source'
  ],
  additionalProperties: false
};

/**
 * JSON Schema for the complete suggestions array response
 */
const suggestionsArraySchema = {
  type: 'array',
  items: suggestionSchema,
  maxItems: 100, // Reasonable limit to prevent abuse
  description: 'Array of grammar/style suggestions'
};

/**
 * JSON Schema for the complete API response
 */
const apiResponseSchema = {
  type: 'object',
  properties: {
    suggestions: suggestionsArraySchema,
    writingScore: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
      description: 'Overall writing quality score'
    },
    metadata: {
      type: 'object',
      properties: {
        totalSuggestions: {
          type: 'integer',
          minimum: 0
        },
        textLength: {
          type: 'integer',
          minimum: 0
        },
        wordCount: {
          type: 'integer',
          minimum: 0
        },
        processingTime: {
          type: 'number',
          minimum: 0
        },
        mode: {
          type: 'string',
          enum: ['full', 'chain']
        },
        strategy: {
          type: 'string',
          enum: ['merge', 'ai-priority', 'fallback']
        }
      },
      required: ['totalSuggestions', 'textLength', 'wordCount'],
      additionalProperties: true
    }
  },
  required: ['suggestions', 'writingScore', 'metadata'],
  additionalProperties: false
};

// Compile validators for better performance
const validateSuggestion = ajv.compile(suggestionSchema);
const validateSuggestionsArray = ajv.compile(suggestionsArraySchema);
const validateApiResponse = ajv.compile(apiResponseSchema);

/**
 * Validate a single suggestion object
 * @param {Object} suggestion - Suggestion object to validate
 * @returns {Object} - Validation result with isValid and errors
 */
function validateSuggestionObject(suggestion) {
  const isValid = validateSuggestion(suggestion);
  return {
    isValid,
    errors: isValid ? [] : validateSuggestion.errors || []
  };
}

/**
 * Validate an array of suggestions
 * @param {Array} suggestions - Array of suggestion objects
 * @returns {Object} - Validation result with isValid and errors
 */
function validateSuggestionsArrayObject(suggestions) {
  const isValid = validateSuggestionsArray(suggestions);
  return {
    isValid,
    errors: isValid ? [] : validateSuggestionsArray.errors || []
  };
}

/**
 * Validate the complete API response
 * @param {Object} response - Complete API response object
 * @returns {Object} - Validation result with isValid and errors
 */
function validateCompleteResponse(response) {
  const isValid = validateApiResponse(response);
  return {
    isValid,
    errors: isValid ? [] : validateApiResponse.errors || []
  };
}

/**
 * Validate and sanitize AI response from raw JSON
 * @param {string|Object} rawResponse - Raw AI response (JSON string or object)
 * @returns {Object} - Validation result with parsed data or errors
 */
function validateAIResponse(rawResponse) {
  let parsed;

  // Parse JSON if it's a string
  if (typeof rawResponse === 'string') {
    try {
      parsed = JSON.parse(rawResponse);
    } catch (error) {
      return {
        isValid: false,
        errors: [{ message: 'Invalid JSON format', details: error.message }],
        data: null
      };
    }
  } else {
    parsed = rawResponse;
  }

  // Validate the parsed data
  const validation = validateSuggestionsArrayObject(parsed);

  return {
    isValid: validation.isValid,
    errors: validation.errors,
    data: validation.isValid ? parsed : null
  };
}

/**
 * Format validation errors for logging and debugging
 * @param {Array} errors - Ajv validation errors
 * @returns {string} - Formatted error message
 */
function formatValidationErrors(errors) {
  if (!errors || errors.length === 0) return 'No errors';

  return errors.map(error => {
    const path = error.instancePath || 'root';
    const message = error.message || 'Unknown error';
    const value = error.data !== undefined ? ` (got: ${JSON.stringify(error.data)})` : '';
    return `${path}: ${message}${value}`;
  }).join('; ');
}

/**
 * Check if suggestion positions are valid for given text
 * @param {Object} suggestion - Suggestion object
 * @param {string} originalText - Original text to validate against
 * @returns {Object} - Validation result
 */
function validateSuggestionPositions(suggestion, originalText) {
  const { index, endIndex, original } = suggestion;

  // Check bounds
  if (index < 0 || endIndex > originalText.length || endIndex <= index) {
    return {
      isValid: false,
      error: `Invalid position: index=${index}, endIndex=${endIndex}, textLength=${originalText.length}`
    };
  }

  // Check if original text matches
  const actualText = originalText.substring(index, endIndex);
  if (actualText !== original) {
    return {
      isValid: false,
      error: `Text mismatch: expected "${original}", got "${actualText}" at position ${index}-${endIndex}`
    };
  }

  return { isValid: true };
}

/**
 * Validate all suggestions against the original text
 * @param {Array} suggestions - Array of suggestions
 * @param {string} originalText - Original text
 * @returns {Object} - Validation result with valid suggestions and errors
 */
function validateSuggestionsAgainstText(suggestions, originalText) {
  const validSuggestions = [];
  const errors = [];

  for (let i = 0; i < suggestions.length; i++) {
    const suggestion = suggestions[i];

    // First validate the schema
    const schemaValidation = validateSuggestionObject(suggestion);
    if (!schemaValidation.isValid) {
      errors.push({
        index: i,
        type: 'schema',
        message: formatValidationErrors(schemaValidation.errors)
      });
      continue;
    }

    // Then validate positions
    const positionValidation = validateSuggestionPositions(suggestion, originalText);
    if (!positionValidation.isValid) {
      errors.push({
        index: i,
        type: 'position',
        message: positionValidation.error
      });
      continue;
    }

    validSuggestions.push(suggestion);
  }

  return {
    validSuggestions,
    errors,
    isValid: errors.length === 0
  };
}

module.exports = {
  // Schemas
  suggestionSchema,
  suggestionsArraySchema,
  apiResponseSchema,

  // Validation functions
  validateSuggestionObject,
  validateSuggestionsArrayObject,
  validateCompleteResponse,
  validateAIResponse,
  validateSuggestionPositions,
  validateSuggestionsAgainstText,

  // Utility functions
  formatValidationErrors
};
