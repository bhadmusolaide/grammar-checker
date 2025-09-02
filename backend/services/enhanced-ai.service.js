const fetch = require('node-fetch');

const AI_TIMEOUT = parseInt(process.env.AI_TIMEOUT_MS || '90000', 10);
const OLLAMA_URL = process.env.OLLAMA_URL || null;
const LMSTUDIO_URL = process.env.LMSTUDIO_URL || null;

console.log('[Enhanced AI Service] Module loaded with:');
console.log('[Enhanced AI Service] OLLAMA_URL:', OLLAMA_URL);
console.log('[Enhanced AI Service] LMSTUDIO_URL:', LMSTUDIO_URL);
console.log('[Enhanced AI Service] AI_TIMEOUT:', AI_TIMEOUT);

/**
 * Send prompt to Ollama (local)
 * @param {string} prompt - The prompt to send
 * @param {string} model - Model name (default: 'local')
 * @param {number} maxTokens - Maximum tokens (default: 1024)
 * @returns {Promise<string>} - Raw response text
 */
async function callOllama(prompt, model = 'gemma3:1b', maxTokens = 1024) {
  if (!OLLAMA_URL) throw new Error('OLLAMA_URL not configured');

  const body = { model, prompt, stream: false };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT);

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Ollama ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    const text = json.response || '';
    console.log(`[Ollama] Response length: ${text.length} chars`);
    return text;
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[Ollama] Error:', err.message);
    throw err;
  }
}

/**
 * Send prompt to LM Studio (OpenAI-compatible)
 * @param {Array} messages - Array of message objects with role and content
 * @param {string} model - Model name (default: 'local')
 * @returns {Promise<string>} - Response content
 */
async function callLMStudio(messages, model = 'local') {
  if (!LMSTUDIO_URL) throw new Error('LMSTUDIO_URL not configured');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT);

  try {
    const response = await fetch(LMSTUDIO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`LM Studio ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();

    // Adapt depending on LM Studio response shape
    // Assume chat completions shape: { choices: [{ message: { content } }] }
    const content = (json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content) || '';

    console.log(`[LM Studio] Response length: ${content.length} chars`);
    return content;
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[LM Studio] Error:', err.message);
    throw err;
  }
}

/**
 * Call AI with automatic fallback between Ollama and LM Studio
 * @param {string|Array} promptOrMessages - String prompt for Ollama or messages array for LM Studio
 * @param {Object} options - Options object
 * @param {string} options.preferredEndpoint - 'ollama' or 'lmstudio'
 * @param {string} options.model - Model name
 * @param {number} options.maxTokens - Max tokens for Ollama
 * @returns {Promise<string>} - Response content
 */
async function callAIWithFallback(promptOrMessages, options = {}) {
  console.log('[Enhanced AI] callAIWithFallback called with options:', JSON.stringify(options, null, 2));
  console.log('[Enhanced AI] OLLAMA_URL:', OLLAMA_URL);
  console.log('[Enhanced AI] LMSTUDIO_URL:', LMSTUDIO_URL);

  const { preferredEndpoint = 'ollama', model = 'local', maxTokens = 1024 } = options;

  let primaryEndpoint, fallbackEndpoint;

  if (preferredEndpoint === 'ollama') {
    primaryEndpoint = { name: 'ollama', available: !!OLLAMA_URL };
    fallbackEndpoint = { name: 'lmstudio', available: !!LMSTUDIO_URL };
  } else {
    primaryEndpoint = { name: 'lmstudio', available: !!LMSTUDIO_URL };
    fallbackEndpoint = { name: 'ollama', available: !!OLLAMA_URL };
  }

  // Try primary endpoint
  if (primaryEndpoint.available) {
    try {
      if (primaryEndpoint.name === 'ollama') {
        const prompt = Array.isArray(promptOrMessages)
          ? promptOrMessages.map(m => `${m.role}: ${m.content}`).join('\n\n')
          : promptOrMessages;
        return await callOllama(prompt, model, maxTokens);
      } else {
        const messages = Array.isArray(promptOrMessages)
          ? promptOrMessages
          : [{ role: 'user', content: promptOrMessages }];
        return await callLMStudio(messages, model);
      }
    } catch (err) {
      console.warn(`[${primaryEndpoint.name}] Failed, trying fallback:`, err.message);
    }
  }

  // Try fallback endpoint
  if (fallbackEndpoint.available) {
    try {
      if (fallbackEndpoint.name === 'ollama') {
        const prompt = Array.isArray(promptOrMessages)
          ? promptOrMessages.map(m => `${m.role}: ${m.content}`).join('\n\n')
          : promptOrMessages;
        return await callOllama(prompt, model, maxTokens);
      } else {
        const messages = Array.isArray(promptOrMessages)
          ? promptOrMessages
          : [{ role: 'user', content: promptOrMessages }];
        return await callLMStudio(messages, model);
      }
    } catch (err) {
      console.error(`[${fallbackEndpoint.name}] Fallback also failed:`, err.message);
      throw err;
    }
  }

  throw new Error('No AI endpoints configured or available');
}

/**
 * Attempt to parse JSON safely from LLM text
 * @param {string} text - Raw LLM response
 * @returns {Object|null} - Parsed JSON or null if failed
 */
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

module.exports = {
  callOllama,
  callLMStudio,
  callAIWithFallback,
  tryParseJSON,
  AI_TIMEOUT,
  OLLAMA_URL,
  LMSTUDIO_URL
};
