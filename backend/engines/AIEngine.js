const { callUnifiedAI } = require('../services/ai.service');

class AIEngine {
  constructor() {
    this.id = 'ai';
    this.name = 'AI';
  }

  /**
   * Simple grammar check using AI
   * @param {string} text - Text to check
   * @param {Object} modelConfig - Model configuration
   * @returns {Promise<Array>} Array of suggestions
   */
  async check(text, modelConfig) {
    try {
      const systemPrompt = `You are a comprehensive text analyzer. Analyze the text across 4 main categories and provide specific, actionable suggestions.

**Analysis Categories:**
1. **Grammar** - Grammar errors, spelling mistakes, punctuation issues
2. **Style** - Tone, voice, word choice, sentence variety
3. **Clarity** - Structure, flow, readability, organization
4. **Enhancement** - Engagement, impact, persuasiveness, overall improvements

**Instructions:**
- Focus on the most important issues first
- Provide specific, actionable suggestions
- Include exact text positions (index/endIndex)
- Use appropriate severity levels (high/medium/low)

Return ONLY a valid JSON array. Format:
[
  {
    "original": "text to replace",
    "suggested": "improved text",
    "explanation": "clear reason for change",
    "category": "Grammar|Style|Clarity|Enhancement",
    "severity": "high|medium|low",
    "index": 0,
    "endIndex": 10
  }
]`;

      const userPrompt = `Analyze this text across all 4 categories (Grammar, Style, Clarity, Enhancement):

"${text}"

Provide the most important suggestions for improvement. Return ONLY JSON array.`;

      const response = await callUnifiedAI(`${systemPrompt}\n\n${userPrompt}`, modelConfig);

      // Clean response and parse JSON
      let cleanResponse = response.trim();
      const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) cleanResponse = jsonMatch[0];

      const suggestions = JSON.parse(cleanResponse);

      // Return only the essential fields
      return suggestions.map(suggestion => ({
        original: suggestion.original,
        suggested: suggestion.suggested,
        message: suggestion.explanation,
        category: suggestion.category || 'Grammar',
        severity: suggestion.severity || 'medium',
        index: suggestion.index,
        endIndex: suggestion.endIndex
      }));

    } catch (error) {
      console.error('Grammar check failed:', error.message);
      return []; // Return empty array on error
    }
  }
}

module.exports = { AIEngine };
