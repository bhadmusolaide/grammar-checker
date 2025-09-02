const { AIEngine } = require('../engines/AIEngine.js');
const { sanitizeText, deduplicateSuggestions } = require('../services/postprocess.service');

/**
 * Apply suggestions to text to generate corrected version
 */
const applySuggestionsToText = (originalText, suggestions) => {
  if (!suggestions || suggestions.length === 0) {
    return originalText;
  }

  // Sort suggestions by index in descending order to avoid index shifting
  const sortedSuggestions = suggestions
    .filter(s => s.index !== undefined && s.endIndex !== undefined && s.suggested)
    .sort((a, b) => b.index - a.index);

  let correctedText = originalText;

  for (const suggestion of sortedSuggestions) {
    const { index, endIndex, suggested } = suggestion;
    if (index >= 0 && endIndex > index && endIndex <= correctedText.length) {
      correctedText = correctedText.substring(0, index) + suggested + correctedText.substring(endIndex);
    }
  }

  return correctedText;
};

// Initialize AI engine directly in the controller
const aiEngine = new AIEngine();

/**
 * Check text using AI mode with provider selection
 */
const checkWithOrchestrator = async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      text,
      language = 'en-US',
      modelConfig,
      userApiKey,
      // Enhanced parameters
      dialect,
      serialComma,
      titleCaseStyle,
      targetGrade
    } = req.body;

    // Sanitize input text
    const sanitizedText = sanitizeText(text);

    // Set default model configuration if none provided
    const defaultModelConfig = {
      provider: 'ollama',
      model: 'gemma3:1b'
    };

    const finalModelConfig = modelConfig || defaultModelConfig;

    console.log(`[Controller] Processing AI check with provider: ${finalModelConfig.provider}`);

    // Run the check using the AI engine directly
    let suggestions = [];
    try {
      // Create enhanced model config with user API key if provided
      const enhancedModelConfig = {
        ...finalModelConfig,
        userApiKey: userApiKey
      };

      suggestions = await aiEngine.check(sanitizedText, enhancedModelConfig);
    } catch (error) {
      console.error(`Error running ${aiEngine.name} engine:`, error.message);
      suggestions = [];
    }

    // Deduplicate suggestions
    const deduplicatedSuggestions = deduplicateSuggestions(suggestions);

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Generate corrected text by applying suggestions
    console.log('Original text:', sanitizedText);
    console.log('Number of suggestions to apply:', deduplicatedSuggestions.length);
    console.log('Sample suggestions:', deduplicatedSuggestions.slice(0, 3));

    const correctedText = applySuggestionsToText(sanitizedText, deduplicatedSuggestions);

    console.log('Generated corrected text:', correctedText);
    console.log('Text changed:', sanitizedText !== correctedText);

    // Return response with only the essential fields
    const response = {
      suggestions: deduplicatedSuggestions.map(suggestion => ({
        original: suggestion.original,
        suggested: suggestion.suggested,
        message: suggestion.message,
        category: suggestion.category,
        severity: suggestion.severity,
        index: suggestion.index,
        endIndex: suggestion.endIndex,
        // Add offset and length for frontend compatibility
        offset: suggestion.index,
        length: suggestion.endIndex - suggestion.index
      })),
      corrected_text: correctedText,
      metadata: {
        processingTime,
        provider: finalModelConfig.provider,
        model: finalModelConfig.model,
        language
      }
    };

    console.log('Sending response:', response);

    res.json(response);

  } catch (error) {
    console.error('Orchestrator check error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to perform check with orchestrator' });
  }
};

module.exports = {
  checkWithOrchestrator
};
