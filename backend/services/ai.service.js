const axios = require('axios');
const fs = require('fs');

// Add timeout configuration
const AI_TIMEOUT = parseInt(process.env.AI_TIMEOUT_MS || '90000', 10);
const LMSTUDIO_URL = process.env.LMSTUDIO_URL || null;

// Unified AI service that can call different providers
async function callUnifiedAI(promptOrMessages, modelConfig, ollamaPrompt = null, isGrammarCheck = false) {
  try {
    console.log('=== callUnifiedAI START ===');
    
    // Handle both string prompts and message arrays
    const isMessagesFormat = typeof promptOrMessages === 'object' && promptOrMessages.messages;
    const prompt = isMessagesFormat ? promptOrMessages.messages[promptOrMessages.messages.length - 1].content : promptOrMessages;
    const messages = isMessagesFormat ? promptOrMessages.messages : null;
    
    console.log('callUnifiedAI called with prompt length:', prompt?.length || 0);
    console.log('Model config:', JSON.stringify(modelConfig, null, 2));
    
    if (isMessagesFormat) {
      console.log('Using messages format with', messages.length, 'messages');
    }

    // Validate modelConfig
    if (!modelConfig || !modelConfig.provider) {
      throw new Error('Model configuration with provider is required');
    }

    let { provider, model, apiKey } = modelConfig;

    // Environment detection: automatically use cloud models in production when Ollama is requested
    const isProduction = process.env.NODE_ENV === 'production';
    const isRenderEnvironment = process.env.RENDER === 'true' || process.env.RENDER_SERVICE_ID;
    
    if (provider.toLowerCase() === 'ollama' && (isProduction || isRenderEnvironment)) {
      console.log('Production environment detected. Checking for cloud model alternatives...');
      
      // Try Groq first as it's fast and reliable
      const groqKey = process.env.GROQ_API_KEY;
      if (groqKey) {
        console.log('Switching from Ollama to Groq for production environment');
        provider = 'groq';
        model = 'llama-3.1-8b-instant'; // Fast, reliable model for production
      } else {
        // Try OpenAI as secondary fallback
        const openaiKey = process.env.OPENAI_API_KEY;
        if (openaiKey) {
          console.log('Switching from Ollama to OpenAI for production environment');
          provider = 'openai';
          model = 'gpt-3.5-turbo'; // Cost-effective model for production
        } else {
          console.warn('No cloud API keys available in production. Attempting Ollama connection...');
        }
      }
    }

    // Log the provider being used for debugging
    console.log(`Using AI provider: ${provider} with model: ${model}`);

    // Get API key from modelConfig or fallback to environment variables
    const getApiKey = (providerName) => {
      if (apiKey) {
        console.log(`Using provided API key for ${providerName}`);
        return apiKey;
      }
      const envKey = `${providerName.toUpperCase()}_API_KEY`;
      const envValue = process.env[envKey];
      console.log(`Looking for env key: ${envKey}, found: ${envValue ? 'YES' : 'NO'}`);
      return envValue;
    };

    switch (provider.toLowerCase()) {
    case 'ollama':
      console.log('Routing to Ollama API');
      return await callOllamaAPI(ollamaPrompt || prompt, model, isGrammarCheck);
    case 'openai':
      console.log('Routing to OpenAI API');
      const openaiKey = getApiKey('openai');
      if (!openaiKey) {
        throw new Error('OpenAI API key is required. Please provide an API key or configure OPENAI_API_KEY in your environment.');
      }
      // Handle messages format for OpenAI
      if (isMessagesFormat) {
        return await callOpenAIWithMessages(messages, model, openaiKey);
      } else {
        return await callOpenAI(prompt, model, openaiKey);
      }
    case 'groq':
      console.log('Routing to Groq API');
      const groqKey = getApiKey('groq');
      if (!groqKey) {
        // Fallback to Ollama if Groq key is not available
        console.warn('Groq API key not found, falling back to Ollama');
        return await callOllamaAPI(ollamaPrompt || prompt, 'gemma3:1b', isGrammarCheck);
      }
      const groqResult = await callGroq(prompt, model, groqKey);
      console.log('Groq API call completed successfully');
      return groqResult;
    case 'deepseek':
      console.log('Routing to DeepSeek API');
      const deepseekKey = getApiKey('deepseek');
      if (!deepseekKey) {
        throw new Error('DeepSeek API key is required. Please provide an API key or configure DEEPSEEK_API_KEY in your environment.');
      }
      return await callDeepSeek(prompt, model, deepseekKey);
    case 'qwen':
      console.log('Routing to Qwen API');
      const qwenKey = getApiKey('qwen');
      if (!qwenKey) {
        throw new Error('Qwen API key is required. Please provide an API key or configure QWEN_API_KEY in your environment.');
      }
      return await callQwen(prompt, model, qwenKey);
    case 'openrouter':
      console.log('Routing to OpenRouter API');
      const openrouterKey = getApiKey('openrouter');
      if (!openrouterKey) {
        throw new Error('OpenRouter API key is required. Please provide an API key or configure OPENROUTER_API_KEY in your environment.');
      }
      return await callOpenRouter(prompt, model, openrouterKey);
    case 'lmstudio':
      console.log('Routing to LM Studio API');
      // For LM Studio, we don't require an API key
      const lmStudioMessages = [
        { role: 'user', content: prompt }
      ];
      return await callLMStudio(lmStudioMessages, model);
    default:
      throw new Error(`Unsupported AI provider: ${provider}. Supported providers: ollama, openai, groq, deepseek, qwen, openrouter, lmstudio`);
    }
  } catch (error) {
    console.error('=== callUnifiedAI ERROR ===');
    console.error('Unified AI call error:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

// Ollama API call
async function callOllamaAPI(prompt, model = 'gemma3:1b', isGrammarCheck = false) {
  try {
    console.log('Attempting to write to ollama_debug.log from ai.service.js');
    fs.appendFileSync('ollama_debug.log', `\n--- Ollama Prompt ---\n${prompt}\n`);

    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Invalid or empty prompt provided to Ollama API');
    }

    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    console.log(`Calling Ollama API at ${ollamaUrl} with model: ${model}`);

    // First, check if the model is available
    try {
      const modelsResponse = await axios.get(`${ollamaUrl}/api/tags`, {
        timeout: 5000
      });
      console.log('Available Ollama models:', modelsResponse.data.models.map(m => m.name));

      const modelExists = modelsResponse.data.models.some(m => m.name === model);
      if (!modelExists) {
        console.warn(`Model ${model} not found in Ollama. Available models:`, modelsResponse.data.models.map(m => m.name));
        // Try to pull the model
        console.log(`Attempting to pull model ${model}...`);
        await axios.post(`${ollamaUrl}/api/pull`, {
          name: model,
          stream: false
        }, {
          timeout: 300000 // 5 minute timeout for pulling
        });
        console.log(`Successfully pulled model ${model}`);
      }
    } catch (modelCheckError) {
      console.warn('Could not check Ollama models:', modelCheckError.message);
      // Continue anyway, as the generate endpoint might still work
    }

    // Use longer timeout for local models to prevent premature timeouts
    const timeout = isGrammarCheck ? 180000 : 180000; // 180s for both grammar and chat

    const response = await axios.post(`${ollamaUrl}/api/generate`, {
      model: model,
      prompt: prompt,
      stream: false
    }, {
      timeout: timeout,
      // Add connection keep-alive headers
      headers: {
        'Connection': 'keep-alive',
        'Content-Type': 'application/json'
      }
    });

    const rawResponse = response.data.response;
    fs.appendFileSync('ollama_debug.log', `\n--- Raw Ollama Response ---\n${JSON.stringify(response.data, null, 2)}\n`);

    // Clean up markdown code blocks from the response
    let cleanedResponse = rawResponse;
    const codeBlockMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      cleanedResponse = codeBlockMatch[1].trim();
    }

    // For grammar checking, parse for suggestions; for chat, return raw text
    if (isGrammarCheck) {
      return parseOllamaResponse(cleanedResponse);
    } else {
      return cleanedResponse;
    }
  } catch (error) {
    console.error('Ollama API error:', {
      message: error.message,
      code: error.code,
      timeout: error.code === 'ECONNABORTED',
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method
    });

    // Provide more specific error messages
    if (error.code === 'ECONNABORTED') {
      throw new Error('Ollama request timed out - please try again');
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to Ollama. Please ensure Ollama is running on your system.');
    } else if (error.code === 'ECONNRESET') {
      throw new Error('Connection to Ollama was reset - please try again');
    } else if (error.response?.status === 404) {
      throw new Error(`Ollama model not found. Please ensure the model "${model}" is available in Ollama.`);
    } else if (error.response?.status) {
      // Handle HTTP errors properly
      throw new Error(`Ollama API returned ${error.response.status}: ${error.response.statusText}`);
    } else {
      throw new Error(`Failed to call Ollama API: ${error.message}`);
    }
  }
}

// OpenAI API call
async function callOpenAI(prompt, model, apiKey) {
  try {
    console.log(`Calling OpenAI API with model: ${model}`);
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    console.log('OpenAI API call successful');
    const rawContent = response.data.choices[0].message.content;

    // Clean up markdown code blocks from the response
    let cleanedResponse = rawContent;
    const codeBlockMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      cleanedResponse = codeBlockMatch[1].trim();
    }

    return cleanedResponse;
  } catch (error) {
    console.error('OpenAI API error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw new Error(`Failed to call OpenAI API: ${error.response?.data?.error?.message || error.message}`);
  }
}

// OpenAI API call with messages format
async function callOpenAIWithMessages(messages, model, apiKey) {
  try {
    // Use the correct endpoint and model format
    const endpoint = 'https://api.openai.com/v1/chat/completions';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    console.log(`Calling OpenAI API with model: ${model} and messages format`);

    const response = await axios.post(endpoint, {
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1
    }, {
      headers,
      timeout: AI_TIMEOUT
    });

    console.log('OpenAI API response status:', response.status);
    
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const content = response.data.choices[0].message.content;
      return content;
    } else {
      throw new Error('Unexpected response format from OpenAI API');
    }
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    
    if (error.response) {
      console.error('OpenAI API error details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    throw new Error(`Failed to call OpenAI API: ${error.message}`);
  }
}

// Groq API call
async function callGroq(prompt, model, apiKey) {
  try {
    console.log(`Calling Groq API with model: ${model}`);

    // Validate inputs
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Invalid or empty prompt provided to Groq API');
    }

    if (!model || typeof model !== 'string' || model.trim().length === 0) {
      throw new Error('Invalid or empty model provided to Groq API');
    }

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      throw new Error('Invalid or empty API key provided to Groq API');
    }

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    console.log('Groq API call successful');
    const rawContent = response.data.choices[0].message.content;

    // Clean up markdown code blocks from the response
    let cleanedResponse = rawContent;
    const codeBlockMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      cleanedResponse = codeBlockMatch[1].trim();
    }

    return cleanedResponse;
  } catch (error) {
    console.error('Groq API error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      code: error.code,
      url: error.config?.url
    });

    // Provide more specific error messages
    if (error.code === 'ECONNABORTED') {
      throw new Error('Groq API request timed out - please try again');
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to Groq API. Please check your network connection.');
    } else if (error.response?.status === 401) {
      throw new Error('Invalid Groq API key. Please check your API key configuration.');
    } else if (error.response?.status === 404) {
      throw new Error(`Groq model "${model}" not found. Please check the model name.`);
    } else if (error.response?.status === 400) {
      throw new Error(`Bad request to Groq API: ${error.response?.data?.error?.message || error.message}`);
    } else if (error.response?.status) {
      // Handle HTTP errors properly
      throw new Error(`Groq API returned ${error.response.status}: ${error.response.statusText}`);
    } else {
      throw new Error(`Failed to call Groq API: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

// DeepSeek API call
async function callDeepSeek(prompt, model, apiKey) {
  try {
    console.log(`Calling DeepSeek API with model: ${model}`);
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    console.log('DeepSeek API call successful');
    const rawContent = response.data.choices[0].message.content;

    // Clean up markdown code blocks from the response
    let cleanedResponse = rawContent;
    const codeBlockMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      cleanedResponse = codeBlockMatch[1].trim();
    }

    return cleanedResponse;
  } catch (error) {
    console.error('DeepSeek API error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw new Error(`Failed to call DeepSeek API: ${error.response?.data?.error?.message || error.message}`);
  }
}

// Qwen API call
async function callQwen(prompt, model, apiKey) {
  try {
    console.log(`Calling Qwen API with model: ${model}`);
    const response = await axios.post('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      model: model,
      input: { prompt: prompt },
      parameters: {
        max_tokens: 2000,
        temperature: 0.7
      }
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    console.log('Qwen API call successful');
    const rawContent = response.data.output.text;

    // Clean up markdown code blocks from the response
    let cleanedResponse = rawContent;
    const codeBlockMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      cleanedResponse = codeBlockMatch[1].trim();
    }

    return cleanedResponse;
  } catch (error) {
    console.error('Qwen API error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw new Error(`Failed to call Qwen API: ${error.response?.data?.error?.message || error.message}`);
  }
}

// OpenRouter API call
async function callOpenRouter(prompt, model, apiKey) {
  try {
    console.log(`Calling OpenRouter API with model: ${model}`);
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai-grammar-web.com',
        'X-Title': 'AI Grammar Web'
      },
      timeout: 30000 // 30 second timeout
    });

    console.log('OpenRouter API call successful');
    const rawContent = response.data.choices[0].message.content;

    // Clean up markdown code blocks from the response
    let cleanedResponse = rawContent;
    const codeBlockMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      cleanedResponse = codeBlockMatch[1].trim();
    }

    return cleanedResponse;
  } catch (error) {
    console.error('OpenRouter API error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw new Error(`Failed to call OpenRouter API: ${error.response?.data?.error?.message || error.message}`);
  }
}

// Add the tryParseJSON function from enhanced-ai.service.js
function tryParseJSON(text) {
  // Common LLM issues: code fences, backticks. Strip leading/trailing text until first '['
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');

  if (start === -1 || end === -1) {
    console.warn('[JSON Parse] No JSON array found in response');
    return null;
  }

  const jsonStr = text.slice(start, end + 1);

  try {
    const parsed = JSON.parse(jsonStr);
    console.log(`[JSON Parse] Successfully parsed ${Array.isArray(parsed) ? parsed.length : 'non-array'} items`);
    return parsed;
  } catch (e) {
    console.error('[JSON Parse] Failed to parse JSON:', e.message);
    console.error('[JSON Parse] Raw JSON string:', jsonStr.substring(0, 200) + '...');
    return null;
  }
}

// Add LM Studio API call function
async function callLMStudio(messages, model = 'local') {
  if (!LMSTUDIO_URL) throw new Error('LMSTUDIO_URL not configured');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT);

  try {
    const response = await axios.post(LMSTUDIO_URL, {
      model: model,
      messages: messages
    }, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      timeout: AI_TIMEOUT
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`LM Studio ${response.status}: ${response.statusText}`);
    }

    // Adapt depending on LM Studio response shape
    // Assume chat completions shape: { choices: [{ message: { content } }] }
    const content = (response.data.choices && response.data.choices[0] &&
                    response.data.choices[0].message && response.data.choices[0].message.content) || '';

    console.log(`[LM Studio] Response length: ${content.length} chars`);
    return content;
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[LM Studio] Error:', err.message);
    throw err;
  }
}

// Enhance the parseOllamaResponse function to use tryParseJSON
function parseOllamaResponse(rawResponse) {
  try {
    console.log('AI Engine raw response:', rawResponse);

    // First, try to extract JSON from markdown code blocks
    let jsonString = rawResponse;

    // Handle markdown code blocks with or without language specifiers
    const codeBlockMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1].trim();
      console.log('Extracted JSON from code block:', jsonString);
    }

    // Clean up the JSON string by removing any leading/trailing whitespace
    jsonString = jsonString.trim();

    // Try to find and parse a JSON array from the response
    let suggestions = [];

    try {
      // First try parsing the entire response as JSON
      suggestions = JSON.parse(jsonString);
    } catch (parseError) {
      // If that fails, try to find a JSON array within the response
      const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        // Use the enhanced tryParseJSON function
        const parsed = tryParseJSON(rawResponse);
        if (parsed) {
          suggestions = parsed;
        } else {
          // If we still can't parse, try to create a minimal valid response
          console.log('Failed to parse as JSON, creating empty suggestions array');
          suggestions = [];
        }
      }
    }

    // Ensure it's an array
    if (Array.isArray(suggestions)) {
      console.log('AI Engine found', suggestions.length, 'suggestions');
      return { suggestions };
    } else {
      console.log('Parsed result is not an array, returning empty suggestions');
      return { suggestions: [] };
    }
  } catch (error) {
    console.error('Failed to parse AI response as JSON:', error.message, 'Response:', rawResponse.substring(0, 200) + '...');
    return { suggestions: [] };
  }
}

module.exports = {
  callUnifiedAI,
  callOllamaAPI,
  callOpenAI,
  callGroq,
  callDeepSeek,
  callQwen,
  callOpenRouter,
  callLMStudio,
  tryParseJSON
};
