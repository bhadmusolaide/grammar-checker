// Text validation middleware
const validateText = (req, res, next) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({
      error: 'Text is required',
      message: 'Please provide the text content to process'
    });
  }

  if (typeof text !== 'string') {
    return res.status(400).json({
      error: 'Invalid text format',
      message: 'Text must be a string'
    });
  }

  if (text.length > 50000) { // 50KB limit
    return res.status(400).json({
      error: 'Text too long',
      message: 'Text must be less than 50,000 characters'
    });
  }

  // Sanitize input to prevent XSS
  const sanitizedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  req.body.text = sanitizedText;

  next();
};

const { debugLog, debugError } = require('../utils/logger');

// Enhanced validation for AI-only check endpoint parameters
const validateCheckParams = (req, res, next) => {
  const {
    provider,
    model,
    userApiKey,
    dialect,
    serialComma,
    titleCaseStyle,
    targetGrade
  } = req.body;

  // Validate provider (required for AI mode)
  if (provider && !['ollama', 'openai', 'groq', 'deepseek', 'qwen', 'openrouter', 'anthropic'].includes(provider.toLowerCase())) {
    return res.status(400).json({
      error: 'Invalid provider',
      message: 'Provider must be one of: ollama, openai, groq, deepseek, qwen, openrouter, anthropic'
    });
  }

  // Validate model (optional, depends on provider)
  if (model && typeof model !== 'string') {
    return res.status(400).json({
      error: 'Invalid model',
      message: 'Model must be a string'
    });
  }

  // Validate userApiKey (optional)
  if (userApiKey && typeof userApiKey !== 'string') {
    return res.status(400).json({
      error: 'Invalid userApiKey',
      message: 'userApiKey must be a string'
    });
  }

  // Validate dialect
  if (dialect && typeof dialect !== 'string') {
    return res.status(400).json({
      error: 'Invalid dialect',
      message: 'Dialect must be a string (e.g., en-US, en-GB)'
    });
  }

  // Validate serialComma
  if (serialComma && !['require', 'optional', 'never'].includes(serialComma)) {
    return res.status(400).json({
      error: 'Invalid serialComma',
      message: 'serialComma must be one of: require, optional, never'
    });
  }

  // Validate titleCaseStyle
  if (titleCaseStyle && !['Sentence case', 'Title Case', 'ALL CAPS', 'lowercase'].includes(titleCaseStyle)) {
    return res.status(400).json({
      error: 'Invalid titleCaseStyle',
      message: 'titleCaseStyle must be one of: Sentence case, Title Case, ALL CAPS, lowercase'
    });
  }

  // Validate targetGrade
  if (targetGrade !== undefined) {
    const grade = Number(targetGrade);
    if (isNaN(grade) || grade < 1 || grade > 20) {
      return res.status(400).json({
        error: 'Invalid targetGrade',
        message: 'targetGrade must be a number between 1 and 20'
      });
    }
    req.body.targetGrade = grade;
  }

  // No additional validation needed for AI-only mode

  next();
};

// Model configuration validation middleware
const validateModelConfig = (req, res, next) => {
  try {
    debugLog('=== validateModelConfig START ===');
    debugLog('validateModelConfig called with req.body:', JSON.stringify(req.body, null, 2));
    let { modelConfig } = req.body;

    debugLog('Initial modelConfig:', modelConfig);
    debugLog('Initial modelConfig type:', typeof modelConfig);

    // If modelConfig is a string, parse it as JSON
    if (typeof modelConfig === 'string') {
      try {
        modelConfig = JSON.parse(modelConfig);
        debugLog('Parsed modelConfig from string:', JSON.stringify(modelConfig, null, 2));
        req.body.modelConfig = modelConfig; // Overwrite for downstream use
      } catch (error) {
        debugError('Error parsing modelConfig string:', error);
        return res.status(400).json({
          error: 'Invalid model configuration format',
          message: 'Model configuration must be a valid JSON object string'
        });
      }
    }

    // If modelConfig is already an object, use it directly
    if (modelConfig && typeof modelConfig === 'object') {
      debugLog('modelConfig is already an object, using directly');
      req.body.modelConfig = modelConfig;
    }

    // Now validate the modelConfig
    const finalModelConfig = req.body.modelConfig;
    debugLog('Final modelConfig:', finalModelConfig);

    if (finalModelConfig) {
      if (typeof finalModelConfig !== 'object') {
        debugLog('Invalid modelConfig type:', typeof finalModelConfig);
        return res.status(400).json({
          error: 'Invalid model configuration',
          message: 'Model configuration must be an object'
        });
      }

      if (finalModelConfig.provider && typeof finalModelConfig.provider !== 'string') {
        debugLog('Invalid provider type:', typeof finalModelConfig.provider);
        return res.status(400).json({
          error: 'Invalid provider',
          message: 'Provider must be a string'
        });
      }

      if (finalModelConfig.model && typeof finalModelConfig.model !== 'string') {
        debugLog('Invalid model type:', typeof finalModelConfig.model);
        return res.status(400).json({
          error: 'Invalid model',
          message: 'Model must be a string'
        });
      }

      // Validate allowed providers
      const allowedProviders = ['ollama', 'openai', 'groq', 'deepseek', 'qwen', 'openrouter', 'lmstudio'];
      if (finalModelConfig.provider && !allowedProviders.includes(finalModelConfig.provider.toLowerCase())) {
        debugLog('Invalid provider:', finalModelConfig.provider);
        return res.status(400).json({
          error: 'Invalid provider',
          message: `Provider must be one of: ${allowedProviders.join(', ')}`
        });
      }
    }

    debugLog('validateModelConfig passed');
    debugLog('=== validateModelConfig END ===');
    next();
  } catch (error) {
    debugError('=== validateModelConfig ERROR ===');
    debugError('Validation middleware error:', error);
    next(error); // Pass error to error handler
  }
};

// API key validation middleware
const validateApiKey = (req, res, next) => {
  try {
    debugLog('=== validateApiKey START ===');
    debugLog('validateApiKey called');
    // In a production environment, you would check against a database or secure storage
    // For now, we'll use environment variables
    const expectedApiKey = process.env.API_KEY;

    // If no API key is configured or it's the default placeholder, allow the request (development mode)
    if (!expectedApiKey || expectedApiKey === 'your_secret_api_key_here') {
      debugLog('No API key configured or using default, allowing request');
      debugLog('=== validateApiKey END ===');
      return next();
    }

    const providedApiKey = req.headers['x-api-key'] || req.query.apiKey;
    debugLog('Expected API key:', expectedApiKey);
    debugLog('Provided API key:', providedApiKey);

    if (!providedApiKey) {
      debugLog('No API key provided');
      debugLog('=== validateApiKey END ===');
      return res.status(401).json({
        error: 'API key required',
        message: 'Please provide an API key in the x-api-key header or apiKey query parameter'
      });
    }

    if (providedApiKey !== expectedApiKey) {
      debugLog('API key mismatch');
      debugLog('=== validateApiKey END ===');
      return res.status(403).json({
        error: 'Invalid API key',
        message: 'The provided API key is invalid'
      });
    }

    debugLog('API key validation passed');
    debugLog('=== validateApiKey END ===');
    next();
  } catch (error) {
    debugError('=== validateApiKey ERROR ===');
    debugError('API key validation error:', error);
    next(error); // Pass error to error handler
  }
};

module.exports = {
  validateText,
  validateCheckParams,
  validateModelConfig,
  validateApiKey
};
