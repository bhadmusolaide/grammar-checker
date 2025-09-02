/**
 * Prompt templates for AI Mode grammar checking
 */

/**
 * Build Full Mode prompt for standalone AI grammar checking
 * @param {string} text - Text to check
 * @param {Object} opts - Configuration options
 * @param {string} opts.dialect - Language dialect (e.g., 'en-US', 'en-GB')
 * @param {string} opts.serialComma - Serial comma preference ('require', 'optional', 'never')
 * @param {string} opts.titleCaseStyle - Title case style preference
 * @param {number} opts.targetGrade - Target reading grade level
 * @returns {Object} - Object with system and user prompts
 */
function buildFullModePrompt(text, opts = {}) {
  const {
    dialect = 'en-US',
    serialComma = 'require',
    titleCaseStyle = 'Sentence case',
    targetGrade = 9
  } = opts;

  const system = `You are a professional grammar + style correction engine.
Detect grammar, spelling, punctuation, style, tone, readability issues.
Return JSON array only. Follow the schema exactly.

Settings:
- dialect: ${dialect}
- serialComma: ${serialComma}
- titleCaseStyle: ${titleCaseStyle}
- targetGrade: ${targetGrade}

Return a JSON array where each suggestion object has:
- original: string (exact text to replace)
- suggested: string (replacement text)
- explanation: string (max 160 chars, why this change improves the text)
- index: integer (start position in original text)
- endIndex: integer (end position in original text)
- category: string (one of: "grammar", "spelling", "punctuation", "style", "tone", "readability")
- severity: string (one of: "low", "medium", "high")
- confidence: number (0.0 to 1.0, how confident you are in this suggestion)
- sentenceIndex: integer (which sentence this occurs in, starting from 0)
- ruleId: string (identifier for the rule that triggered this suggestion)
- source: string (always "ai" for this mode)

Focus on:
1. Grammar errors and typos
2. Punctuation and capitalization
3. Style improvements for clarity
4. Tone consistency
5. Readability for target grade level

Be precise with index positions. Only suggest changes that genuinely improve the text.`;

  const user = `TEXT:
<<<
${text}
>>>

Return JSON array only. No explanatory text.`;

  return { system, user };
}

// Chain Mode prompt removed - AI mode only

/**
 * Build messages array for chat-based AI models (LM Studio)
 * @param {Object} prompt - Prompt object with system and user properties
 * @returns {Array} - Array of message objects for chat completion
 */
function buildChatMessages(prompt) {
  return [
    { role: 'system', content: prompt.system },
    { role: 'user', content: prompt.user }
  ];
}

/**
 * Build single prompt string for completion-based models (Ollama)
 * @param {Object} prompt - Prompt object with system and user properties
 * @returns {string} - Combined prompt string
 */
function buildCompletionPrompt(prompt) {
  return `${prompt.system}\n\n${prompt.user}`;
}

/**
 * Validate prompt options and set defaults
 * @param {Object} opts - Options object
 * @returns {Object} - Validated options with defaults
 */
function validatePromptOptions(opts = {}) {
  const validDialects = ['en-US', 'en-GB', 'en-CA', 'en-AU'];
  const validSerialComma = ['require', 'optional', 'never'];
  const validTitleCase = ['Sentence case', 'Title Case', 'ALL CAPS', 'lowercase'];

  return {
    dialect: validDialects.includes(opts.dialect) ? opts.dialect : 'en-US',
    serialComma: validSerialComma.includes(opts.serialComma) ? opts.serialComma : 'require',
    titleCaseStyle: validTitleCase.includes(opts.titleCaseStyle) ? opts.titleCaseStyle : 'Sentence case',
    targetGrade: (typeof opts.targetGrade === 'number' && opts.targetGrade >= 1 && opts.targetGrade <= 20)
      ? opts.targetGrade : 9
  };
}

module.exports = {
  buildFullModePrompt,
  buildChatMessages,
  buildCompletionPrompt,
  validatePromptOptions
};
