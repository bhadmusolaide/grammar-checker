const axios = require('axios');
const { callUnifiedAI } = require('../services/ai.service');
const { enhanceText, humanizeText, simplifyText, expandText, condenseText } = require('../services/enhancement.service');
const { analyzeTone, analyzeAdvancedClarity } = require('../services/analysis.service');
// readability service import removed - AI mode only
const { calculateWritingScore } = require('../services/scoring.service');

// Full-text AI enhancement endpoint
const enhanceFullText = async (req, res) => {
  try {
    const { text, modelConfig, enhancementType = 'comprehensive' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const enhancementPrompts = {
      comprehensive: `Please enhance the following text by improving grammar, spelling, style, tone, clarity, and engagement. Provide the enhanced version followed by a detailed summary of improvements.

Format your response exactly as follows:

**ENHANCED TEXT:**
[Provide the complete enhanced version of the text here]

**IMPROVEMENT SUMMARY:**
**Grammar & Spelling:** [List specific fixes made]
**Style & Tone:** [Describe style and tone improvements]
**Clarity & Structure:** [Explain structural and clarity enhancements]
**Engagement:** [Detail engagement improvements]
**Word Count:** Original: X words → Enhanced: Y words

Original text:
"${text}"`,

      formal: `Please rewrite the following text in a more formal, professional tone while maintaining all key information. Provide the enhanced version followed by a summary of changes.

Format your response exactly as follows:

**ENHANCED TEXT:**
[Provide the complete formal version here]

**IMPROVEMENT SUMMARY:**
**Formality:** [Describe formality improvements]
**Professional Language:** [List professional language changes]
**Structure:** [Explain structural improvements]
**Word Count:** Original: X words → Enhanced: Y words

Original text:
"${text}"`,

      casual: `Please rewrite the following text in a more casual, conversational tone while keeping it clear and engaging. Provide the enhanced version followed by a summary of changes.

Format your response exactly as follows:

**ENHANCED TEXT:**
[Provide the complete casual version here]

**IMPROVEMENT SUMMARY:**
**Tone:** [Describe tone improvements]
**Conversational Elements:** [List conversational improvements]
**Engagement:** [Explain engagement enhancements]
**Word Count:** Original: X words → Enhanced: Y words

Original text:
"${text}"`
    };

    const prompt = enhancementPrompts[enhancementType] || enhancementPrompts.comprehensive;

    let response;
    if (modelConfig && modelConfig.provider) {
      response = await callUnifiedAI(prompt, modelConfig);
    } else {
      // Fallback to fast Groq model for better performance
      const defaultModelConfig = {
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        apiKey: process.env.GROQ_API_KEY
      };
      response = await callUnifiedAI(prompt, defaultModelConfig);
    }

    // Parse the response to extract enhanced text and summary
    const enhancedTextMatch = response.match(/\*\*ENHANCED TEXT:\*\*\s*([\s\S]*?)\s*\*\*IMPROVEMENT SUMMARY:\*\*/i);
    const summaryMatch = response.match(/\*\*IMPROVEMENT SUMMARY:\*\*([\s\S]*)/i);

    const enhancedText = enhancedTextMatch ? enhancedTextMatch[1].trim() : text;
    const improvementSummary = summaryMatch ? summaryMatch[1].trim() : 'No specific improvements identified.';

    // Calculate basic metrics
    const originalWordCount = text.trim().split(/\s+/).length;
    const enhancedWordCount = enhancedText.trim().split(/\s+/).length;
    const improvementMetrics = {
      originalWordCount,
      enhancedWordCount,
      wordCountChange: enhancedWordCount - originalWordCount,
      characterCountChange: enhancedText.length - text.length
    };

    res.json({
      source: modelConfig?.provider ? `${modelConfig.provider.charAt(0).toUpperCase() + modelConfig.provider.slice(1)}` : 'Ollama',
      originalText: text,
      enhancedText: enhancedText,
      improvementSummary: improvementSummary,
      metrics: improvementMetrics,
      enhancementType: enhancementType,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Text enhancement error:', error.message);
    res.status(500).json({ error: `Failed to enhance text: ${error.message}` });
  }
};

// AI model integration (unified)
const checkWithOllama = async (req, res) => {
  try {
    const { text, model = 'gemma3:1b', modelConfig } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const prompt = `Please analyze the following text and provide structured writing suggestions. Organize your response with clear sections:

**Grammar & Spelling:**
- List any grammar errors, spelling mistakes, or punctuation issues

**Style & Tone:**
- Suggest improvements to writing style, tone, or word choice

**Clarity & Structure:**
- Recommend ways to improve readability and organization

**Additional Suggestions:**
- Any other recommendations for enhancement

Text to analyze:
"${text}"

Provide specific, actionable feedback. If no issues are found in a category, you may omit that section.`;

    let response;
    if (modelConfig && modelConfig.provider) {
      // Use unified model system (isGrammarCheck = true for grammar analysis)
      response = await callUnifiedAI(prompt, modelConfig, null, true);
    } else {
      // Fallback to fast Groq model for better performance
      const defaultModelConfig = {
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        apiKey: process.env.GROQ_API_KEY
      };
      response = await callUnifiedAI(prompt, defaultModelConfig, null, true);
    }

    // Parse AI suggestions into structured format
    const suggestions = [];

    // Extract grammar and spelling suggestions
    const grammarMatch = response.match(/\*\*Grammar & Spelling:\*\*([\s\S]*?)(?=\*\*|$)/i);
    if (grammarMatch && grammarMatch[1].trim()) {
      const grammarLines = grammarMatch[1].trim().split('\n').filter(line => line.trim() && !line.startsWith('**'));
      grammarLines.forEach(line => {
        const cleanLine = line.replace(/^[\s\-\*]+/, '').trim();
        if (cleanLine) {
          suggestions.push({
            type: 'grammar',
            message: cleanLine,
            category: 'Grammar & Spelling',
            severity: 'high'
          });
        }
      });
    }

    // Extract style and tone suggestions
    const styleMatch = response.match(/\*\*Style & Tone:\*\*([\s\S]*?)(?=\*\*|$)/i);
    if (styleMatch && styleMatch[1].trim()) {
      const styleLines = styleMatch[1].trim().split('\n').filter(line => line.trim() && !line.startsWith('**'));
      styleLines.forEach(line => {
        const cleanLine = line.replace(/^[\s\-\*]+/, '').trim();
        if (cleanLine) {
          suggestions.push({
            type: 'style',
            message: cleanLine,
            category: 'Style & Tone',
            severity: 'medium'
          });
        }
      });
    }

    // Extract clarity and structure suggestions
    const clarityMatch = response.match(/\*\*Clarity & Structure:\*\*([\s\S]*?)(?=\*\*|$)/i);
    if (clarityMatch && clarityMatch[1].trim()) {
      const clarityLines = clarityMatch[1].trim().split('\n').filter(line => line.trim() && !line.startsWith('**'));
      clarityLines.forEach(line => {
        const cleanLine = line.replace(/^[\s\-\*]+/, '').trim();
        if (cleanLine) {
          suggestions.push({
            type: 'clarity',
            message: cleanLine,
            category: 'Clarity & Structure',
            severity: 'medium'
          });
        }
      });
    }

    // Extract additional suggestions
    const additionalMatch = response.match(/\*\*Additional Suggestions:\*\*([\s\S]*?)(?=\*\*|$)/i);
    if (additionalMatch && additionalMatch[1].trim()) {
      const additionalLines = additionalMatch[1].trim().split('\n').filter(line => line.trim() && !line.startsWith('**'));
      additionalLines.forEach(line => {
        const cleanLine = line.replace(/^[\s\-\*]+/, '').trim();
        if (cleanLine) {
          suggestions.push({
            type: 'general',
            message: cleanLine,
            category: 'Additional Suggestions',
            severity: 'low'
          });
        }
      });
    }

    res.json({
      source: modelConfig?.provider ? `${modelConfig.provider.charAt(0).toUpperCase() + modelConfig.provider.slice(1)}` : 'Ollama',
      suggestions: suggestions,
      rawResponse: response
    });
  } catch (error) {
    console.error('Ollama AI error:', error.message);
    res.status(500).json({ error: `Failed to check with AI: ${error.message}` });
  }
};

/**
 * Humanize AI-generated text
 */
const humanizeTextController = async (req, res) => {
  try {
    const { text, modelConfig, options = {} } = req.body;

    console.log('Humanize request body:', req.body);

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await humanizeText(text, options, modelConfig);

    console.log('Humanize result:', result);

    res.json({
      source: 'AI Humanization',
      original: text,
      humanized: result.humanized,  // <-- Fixed: was result.humanizedText
      changes: result.changes,
      analysis: result.analysis,
      model: modelConfig?.model || 'default'
    });
  } catch (error) {
    console.error('Text humanization error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: `Failed to humanize text: ${error.message}` });
  }
};

/**
 * Simplify complex text
 */
const simplifyTextController = async (req, res) => {
  try {
    const { text, modelConfig, targetLevel = 'general' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await simplifyText(text, modelConfig, targetLevel);

    res.json({
      source: 'AI Simplification',
      original: text,
      simplified: result.simplifiedText,
      changes: result.changes,
      readabilityImprovement: result.readabilityImprovement,
      model: modelConfig?.model || 'default'
    });
  } catch (error) {
    console.error('Text simplification error:', error.message);
    res.status(500).json({ error: 'Failed to simplify text' });
  }
};

/**
 * Expand brief text with more detail
 */
const expandTextController = async (req, res) => {
  try {
    const { text, modelConfig, expansionType = 'detailed' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await expandText(text, modelConfig, expansionType);

    res.json({
      source: 'AI Expansion',
      original: text,
      expanded: result.expandedText,
      additions: result.additions,
      analysis: result.analysis,
      model: modelConfig?.model || 'default'
    });
  } catch (error) {
    console.error('Text expansion error:', error.message);
    res.status(500).json({ error: 'Failed to expand text' });
  }
};

/**
 * Condense lengthy text
 */
const condenseTextController = async (req, res) => {
  try {
    const { text, modelConfig, targetLength = 'half' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await condenseText(text, modelConfig, targetLength);

    res.json({
      source: 'AI Condensation',
      original: text,
      condensed: result.condensedText,
      reductions: result.reductions,
      compressionRatio: result.compressionRatio,
      model: modelConfig?.model || 'default'
    });
  } catch (error) {
    console.error('Text condensation error:', error.message);
    res.status(500).json({ error: 'Failed to condense text' });
  }
};

module.exports = {
  enhanceFullText,
  checkWithOllama,
  humanizeTextController,
  simplifyTextController,
  expandTextController,
  condenseTextController
};
