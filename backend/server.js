const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// Local grammar checking packages
// writeGood, alex, and textReadability imports removed - AI mode only
const nlp = require('compromise');

// Enhanced spell checker with typo-js integration
const commonMisspellings = {
  'taht': 'that',
  'teh': 'the',
  'adn': 'and',
  'nad': 'and',
  'hte': 'the',
  'recieve': 'receive',
  'seperate': 'separate',
  'definately': 'definitely',
  'occured': 'occurred',
  'accomodate': 'accommodate',
  'begining': 'beginning',
  'beleive': 'believe',
  'calender': 'calendar',
  'cemetary': 'cemetery',
  'changable': 'changeable',
  'collectible': 'collectible',
  'comming': 'coming',
  'commitee': 'committee',
  'concious': 'conscious',
  'droped': 'dropped',
  'enviroment': 'environment',
  'exellent': 'excellent',
  'existance': 'existence',
  'experiance': 'experience',
  'futher': 'further',
  'goverment': 'government',
  'independant': 'independent',
  'neccessary': 'necessary',
  'occassion': 'occasion',
  'persistant': 'persistent',
  'prefered': 'preferred',
  'probaly': 'probably',
  'refered': 'referred',
  'relevent': 'relevant',
  'resistence': 'resistance',
  'seperately': 'separately',
  'succesful': 'successful',
  'suprised': 'surprised',
  'untill': 'until',
  'usualy': 'usually',
  'wether': 'whether',
  'wich': 'which'
};

const spellChecker = {
  checkWord: function(word) {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');

    // Check common misspellings first (fastest)
    const commonCorrection = commonMisspellings[cleanWord];
    if (commonCorrection) {
      return commonCorrection;
    }

    // Add more sophisticated checking here if needed
    return null;
  }
};

// writeGood helper functions removed - AI mode only


// Import routes
const enhancementRoutes = require('./routes/enhancement.routes');
const careerRoutes = require('./routes/career.routes');
const modelRoutes = require('./routes/model.routes');
const humanizeRoutes = require('./routes/humanize.routes');

const upload = multer({ dest: 'uploads/' });
const chatRoutes = require('./routes/chat.routes');
const testConnectionRoutes = require('./routes/test-connection.routes');

// Import middleware
const errorMiddleware = require('./middleware/error.middleware');
const { validateApiKey } = require('./middleware/validation.middleware');

// Import services
const { callUnifiedAI, callOllamaAPI } = require('./services/ai.service');
// readability service import removed - AI mode only
const { analyzeTone, analyzeAdvancedClarity } = require('./services/analysis.service');
const { calculateWritingScore, generateActionableInsights, determineWritingLevel, determineTargetAudience, getIndustryBenchmarks } = require('./services/scoring.service');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'https://grammar-checker.vercel.app', // Replace with your actual Vercel domain
    'http://localhost:5173' // For local development
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Ollama models endpoint
app.get('/api/models/ollama', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:11434/api/tags');
    const models = response.data.models.map(model => ({
      name: model.name,
      size: model.size,
      modified_at: model.modified_at
    }));
    res.json({ models });
  } catch (error) {
    console.error('Failed to fetch Ollama models:', error.message);
    res.status(500).json({ error: 'Failed to fetch available models' });
  }
});

// Legacy endpoints for backward compatibility
app.post('/api/check/ollama', async (req, res) => {
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
      // Use unified model system
      response = await callUnifiedAI(prompt, modelConfig);
    } else {
      // Fallback to legacy Ollama
      const apiResponse = await axios.post('http://localhost:11434/api/generate', {
        model: model,
        prompt: prompt,
        stream: false
      });
      response = apiResponse.data.response;
    }

    res.json({
      source: modelConfig?.provider ? `${modelConfig.provider.charAt(0).toUpperCase() + modelConfig.provider.slice(1)}` : 'Ollama',
      model: model,
      analysis: response,
      suggestions: [{
        type: 'ai-analysis',
        message: response,
        offset: 0,
        length: text.length
      }]
    });
  } catch (error) {
    console.error('Ollama API error:', error.message);
    res.status(500).json({ error: 'Failed to analyze with Ollama' });
  }
});

// Full-text AI enhancement endpoint
app.post('/api/enhance/full-text', async (req, res) => {
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
      // Fallback to default Ollama model
      const apiResponse = await axios.post('http://localhost:11434/api/generate', {
        model: 'gemma3:1b',
        prompt: prompt,
        stream: false
      });
      response = apiResponse.data.response;
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
});

// Readability analysis endpoint removed - AI mode only

// Write-Good checker endpoint removed - AI mode only

// Alex checker endpoint removed - AI mode only

// Enhanced readability analysis removed - AI mode only

// Comprehensive analysis endpoint removed - AI mode only

app.post('/api/check/all', async (req, res) => {
  try {
    const { text, language = 'en-US', enabledServices = ['ollama'], modelConfig } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const { ollamaPrompt, ...clarityAnalysis } = analyzeAdvancedClarity(text);
    const results = {};

    // Process each enabled service
    const servicePromises = [];

    // Comprehensive analysis removed - AI mode only

    // Readability analysis removed - AI mode only

    // LanguageTool integration removed - AI mode only

    // AI Analysis with Ollama/Unified AI
    if (enabledServices.includes('ollama')) {
      servicePromises.push(
        new Promise(async (resolve) => {
          try {
            const prompt = `Analyze the following text for grammar, clarity, and style. Provide specific suggestions for improvement. Format your response as a JSON object with a single key "suggestions", which is an array of objects. Each object in the array should have "source", "category", and "message" fields. For example: {"suggestions": [{"source": "Ollama", "category": "Grammar", "message": "Change 'grammer' to 'grammar'."}]}. Text: "${text}"`;

            // AI Analysis
            if (enabledServices.includes('ollama')) {
              try {
                const ollamaPrompt = `Please analyze the following text and provide structured writing suggestions. Organize your response with clear sections:\n\n**Grammar & Spelling:**\n- List any grammar errors, spelling mistakes, or punctuation issues\n\n**Style & Tone:**\n- Suggest improvements to writing style, tone, or word choice\n\n**Clarity & Structure:**\n- Recommend ways to improve readability and organization\n\n**Additional Suggestions:**\n- Any other recommendations for enhancement\n\nText to analyze:\n\"${text}\"\n\nProvide specific, actionable feedback. If no issues are found in a category, you may omit that section.`;

                let ollamaResponse;
                if (modelConfig && modelConfig.provider) {
                  // Use unified model system
                  ollamaResponse = await callUnifiedAI(ollamaPrompt, modelConfig);
                } else {
                  // Fallback to default Ollama model if modelConfig is not provided
                  ollamaResponse = await callOllamaAPI(ollamaPrompt, 'gemma3:1b');
                }

                results.aiAnalysis = {
                  source: modelConfig?.provider ? `${modelConfig.provider.charAt(0).toUpperCase() + modelConfig.provider.slice(1)}` : 'Ollama',
                  model: modelConfig?.model || 'gemma3:1b',
                  analysis: ollamaResponse,
                  suggestions: [{
                    type: 'ai-analysis',
                    message: ollamaResponse,
                    offset: 0,
                    length: text.length
                  }]
                };
                console.log('Raw Ollama Response:', ollamaResponse); // Log the raw response
              } catch (error) {
                console.error('AI Analysis (Ollama) error:', error.message);
                results.aiAnalysis = { error: `Failed to perform AI Analysis: ${error.message}` };
              }
            }

            let ollamaSuggestions = [];
            try {
              // Attempt to parse the response as JSON
              const parsedResponse = JSON.parse(ollamaResponse);
              if (parsedResponse.suggestions && Array.isArray(parsedResponse.suggestions)) {
                ollamaSuggestions = parsedResponse.suggestions;
              } else if (parsedResponse.error) {
                console.error('Ollama API returned an error:', parsedResponse.error);
                // Handle error case, maybe add a suggestion about the error
                ollamaSuggestions.push({
                  source: 'Ollama API Error',
                  category: 'Error',
                  message: parsedResponse.error,
                  severity: 'high'
                });
              }
            } catch (parseError) {
              // If parsing fails, treat the response as a single suggestion message
              ollamaSuggestions.push({
                source: 'Ollama AI',
                category: 'General',
                message: ollamaResponse,
                severity: 'low'
              });
            }

            resolve({
              ollama: {
                suggestions: ollamaSuggestions
              }
            });
          } catch (error) {
            resolve({ ollama: { error: error.message } });
          }
        })
      );
    }

    // Wait for all services to complete
    const serviceResults = await Promise.all(servicePromises);

    // Combine results
    serviceResults.forEach(result => {
      Object.assign(results, result);
    });

    // Writing score generation removed - AI mode only

    // Comprehensive integration removed - AI mode only

    res.json(results);
  } catch (error) {
    console.error('AI analysis error:', error.message);
    res.status(500).json({ error: 'Failed to perform AI analysis' });
  }
});

// Use modular routes
// Legacy grammar routes removed - using AI-only orchestrator
app.use('/api/enhance', enhancementRoutes);

// Use career routes without global file upload middleware
app.use('/api/career', careerRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/humanize', humanizeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', testConnectionRoutes);
app.use('/api/orchestrator', require('./routes/orchestrator.routes'));

// Error handling middleware
app.use(errorMiddleware);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server with production-ready configuration
const server = app.listen(PORT, () => {
  const env = process.env.NODE_ENV || 'development';
  console.log(`🚀 AI Grammar Web Backend Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${env}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 API endpoints available at: http://localhost:${PORT}/api/`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;
