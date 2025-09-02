const axios = require('axios');
const { callUnifiedAI } = require('../services/ai.service');

// Test connection for any provider
const testConnection = async (req, res) => {
  try {
    const { provider, model, apiKey } = req.body;

    console.log(`Testing connection for provider: ${provider}, model: ${model}`);

    // Create a minimal test prompt
    const testPrompt = 'Respond with \'OK\' to confirm connection is working.';

    // Create model configuration based on provider
    const modelConfig = {
      provider,
      model,
      apiKey
    };

    // Test the connection by making a simple AI call
    switch (provider.toLowerCase()) {
    case 'ollama':
      // For Ollama, we can directly test the endpoint
      try {
        const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
        const response = await axios.get(`${ollamaUrl}/api/tags`, {
          timeout: 5000
        });
        return res.json({
          success: true,
          message: 'Ollama connection successful',
          data: response.data
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: `Ollama connection failed: ${error.message}`
        });
      }

    case 'openai':
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'API key is required for OpenAI'
        });
      }
      break;

    case 'groq':
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'API key is required for Groq'
        });
      }
      break;

    case 'deepseek':
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'API key is required for DeepSeek'
        });
      }
      break;

    case 'qwen':
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'API key is required for Qwen'
        });
      }
      break;

    case 'openrouter':
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'API key is required for OpenRouter'
        });
      }
      break;

    default:
      return res.status(400).json({
        success: false,
        error: `Unsupported provider: ${provider}`
      });
    }

    // For cloud providers, make a minimal AI call
    try {
      const response = await callUnifiedAI(testPrompt, modelConfig);
      console.log(`Test response from ${provider}:`, response.substring(0, 100) + '...');

      return res.json({
        success: true,
        message: `${provider} connection successful`,
        response: response.substring(0, 100) + '...'
      });
    } catch (error) {
      console.error(`Test connection failed for ${provider}:`, error.message);
      return res.status(500).json({
        success: false,
        error: `${provider} connection failed: ${error.message}`
      });
    }
  } catch (error) {
    console.error('Test connection error:', error);
    return res.status(500).json({
      success: false,
      error: `Test connection failed: ${error.message}`
    });
  }
};

module.exports = {
  testConnection
};
