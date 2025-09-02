const express = require('express');
const router = express.Router();
const aiService = require('../services/ai.service');

// POST /api/humanize - Humanize text endpoint
router.post('/', async (req, res) => {
  try {
    const { text, tone, strength, modelConfig } = req.body;

    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Text is required and cannot be empty'
      });
    }

    if (!['neutral', 'friendly', 'professional'].includes(tone)) {
      return res.status(400).json({
        error: 'Invalid tone. Must be neutral, friendly, or professional'
      });
    }

    if (!['light', 'medium', 'strong'].includes(strength)) {
      return res.status(400).json({
        error: 'Invalid strength. Must be light, medium, or strong'
      });
    }

    if (!modelConfig) {
      return res.status(400).json({
        error: 'Model configuration is required'
      });
    }

    // Construct the prompt based on tone and strength
    const getToneInstruction = (tone) => {
      switch (tone) {
      case 'friendly':
        return 'Use a warm, conversational tone that sounds natural and approachable.';
      case 'professional':
        return 'Use a polished, professional tone appropriate for business communication.';
      default: // neutral
        return 'Use a natural, neutral tone that sounds human and authentic.';
      }
    };

    const getStrengthInstruction = (strength) => {
      switch (strength) {
      case 'light':
        return 'Make minimal changes - only adjust phrasing that clearly sounds AI-generated.';
      case 'strong':
        return 'Make substantial changes to achieve a more natural human voice.';
      default: // medium
        return 'Make moderate changes to improve naturalness while preserving the original flow.';
      }
    };

    const prompt = `Please humanize the following text by making it sound less AI-generated while preserving the original meaning. 

${getToneInstruction(tone)}
${getStrengthInstruction(strength)}

Preserve the original meaning and key information. Make minimal necessary edits to achieve a natural human voice.

Original text:
"""
${text}
"""

Return only the humanized text without any explanations or additional formatting.`;

    // Call AI service
    const result = await aiService.callUnifiedAI({
      prompt,
      modelConfig,
      systemPrompt: 'You are a skilled editor who specializes in making AI-generated text sound more natural and human. Focus on preserving meaning while improving naturalness.',
      maxTokens: Math.min(text.length * 2, 4000),
      temperature: 0.7
    });

    if (!result.success) {
      return res.status(500).json({
        error: result.error || 'Failed to humanize text'
      });
    }

    res.json({
      source: 'AI Humanization',
      original: text,
      humanized: result.text.trim(),
      model: result.model || 'unknown',
      meta: {
        originalLength: text.length,
        newLength: result.text.trim().length,
        tone,
        strength,
        tokensUsed: result.tokensUsed || 0,
        model: result.model || 'unknown'
      }
    });

  } catch (error) {
    console.error('Humanize route error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

module.exports = router;
