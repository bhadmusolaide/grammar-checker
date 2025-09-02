const { callUnifiedAI } = require('./ai.service');
const { analyzeTone, analyzeAdvancedClarity } = require('./analysis.service');
const { calculateWritingScore, generateActionableInsights } = require('./scoring.service');

/**
 * Text enhancement and improvement service
 */

// Full text enhancement service
async function enhanceFullText(text, options = {}, modelConfig) {
  try {
    const {
      tone = 'professional',
      style = 'clear',
      audience = 'general',
      purpose = 'inform',
      preserveLength = false,
      focusAreas = ['grammar', 'clarity', 'style']
    } = options;

    // Analyze current text
    const toneAnalysis = analyzeTone(text);
    const clarityAnalysis = analyzeAdvancedClarity(text);

    // Create enhancement prompt
    const prompt = `
Enhance this text with the following requirements:

ORIGINAL TEXT:
${text}

ENHANCEMENT REQUIREMENTS:
- Target tone: ${tone}
- Writing style: ${style}
- Target audience: ${audience}
- Purpose: ${purpose}
- Preserve length: ${preserveLength ? 'Yes' : 'No'}
- Focus areas: ${focusAreas.join(', ')}

Current analysis:
- Tone: ${toneAnalysis.overallTone}
- Formality: ${toneAnalysis.formalityLevel}
- Clarity score: ${clarityAnalysis.clarityScore || 'N/A'}

Provide:
1. Enhanced version of the text
2. Key improvements made
3. Explanation of changes
4. Alternative suggestions

Maintain the original meaning while improving ${focusAreas.join(', ')}.
`;

    const response = await callUnifiedAI(prompt, modelConfig, null, false);

    // Parse the response
    const enhancedText = extractEnhancedText(response);
    const improvements = extractImprovements(response);
    const explanation = extractExplanation(response);
    const alternatives = extractAlternatives(response);

    // Analyze enhanced text
    const enhancedToneAnalysis = analyzeTone(enhancedText);
    const enhancedClarityAnalysis = analyzeAdvancedClarity(enhancedText);

    return {
      success: true,
      original: {
        text,
        analysis: {
          tone: toneAnalysis,
          clarity: clarityAnalysis,
          wordCount: text.split(' ').length
        }
      },
      enhanced: {
        text: enhancedText,
        analysis: {
          tone: enhancedToneAnalysis,
          clarity: enhancedClarityAnalysis,
          wordCount: enhancedText.split(' ').length
        }
      },
      improvements,
      explanation,
      alternatives,
      options
    };
  } catch (error) {
    console.error('Text enhancement error:', error);
    throw new Error('Failed to enhance text');
  }
}

// Extract enhanced text from AI response
function extractEnhancedText(response) {
  try {
    // Look for enhanced text section
    const enhancedMatch = response.match(/(?:enhanced|improved|revised).*?text[:\s]*([\s\S]*?)(?:\n\n|\n\d+\.|\nKey|\nExplanation|$)/i);
    if (enhancedMatch) {
      return enhancedMatch[1].trim();
    }

    // Fallback: look for quoted text
    const quotedMatch = response.match(/["'`]([\s\S]*?)["'`]/);
    if (quotedMatch) {
      return quotedMatch[1].trim();
    }

    // Last resort: take first substantial paragraph
    const paragraphs = response.split('\n\n');
    for (const paragraph of paragraphs) {
      if (paragraph.trim().length > 50 && !paragraph.toLowerCase().includes('enhance')) {
        return paragraph.trim();
      }
    }

    return response.substring(0, 500).trim();
  } catch (error) {
    return response.substring(0, 500).trim();
  }
}

// Extract improvements from AI response
function extractImprovements(response) {
  try {
    const improvements = [];
    const lines = response.split('\n');
    let inImprovementsSection = false;

    lines.forEach(line => {
      if (line.toLowerCase().includes('improvement') || line.toLowerCase().includes('changes made')) {
        inImprovementsSection = true;
      } else if (inAlternativesSection && /^\s*[\d•\-\*]/.test(line)) {
        const improvement = line.replace(/^\s*[\d•\-\*\.\)\s]+/, '').trim();
        if (improvement.length > 10) {
          improvements.push(improvement);
        }
      } else if (inImprovementsSection && line.trim() === '') {
        // Continue in section
      } else if (inImprovementsSection && /^[A-Z]/.test(line.trim())) {
        // New section started
        inImprovementsSection = false;
      }
    });

    return improvements.slice(0, 8);
  } catch (error) {
    return [];
  }
}

// Extract explanation from AI response
function extractExplanation(response) {
  try {
    const explanationMatch = response.match(/(?:explanation|rationale)[:\s]*([\s\S]*?)(?:\n\n|\n\d+\.|\nAlternative|$)/i);
    if (explanationMatch) {
      return explanationMatch[1].trim();
    }
    return '';
  } catch (error) {
    return '';
  }
}

// Extract alternatives from AI response
function extractAlternatives(response) {
  try {
    const alternatives = [];
    const lines = response.split('\n');
    let inAlternativesSection = false;

    lines.forEach(line => {
      if (line.toLowerCase().includes('alternative') || line.toLowerCase().includes('suggestion')) {
        inAlternativesSection = true;
      } else if (inAlternativesSection && /^\s*[\d•\-\*]/.test(line)) {
        const alternative = line.replace(/^\s*[\d•\-\*\.\)\s]+/, '').trim();
        if (alternative.length > 10) {
          alternatives.push(alternative);
        }
      } else if (inAlternativesSection && line.trim() === '') {
        // Continue in section
      } else if (inAlternativesSection && /^[A-Z]/.test(line.trim())) {
        // New section started
        inAlternativesSection = false;
      }
    });

    return alternatives.slice(0, 5);
  } catch (error) {
    return [];
  }
}

// Humanize text service
async function humanizeText(text, options = {}, modelConfig) {
  try {
    // Validate inputs
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input: must be a non-empty string');
    }

    if (!modelConfig || typeof modelConfig !== 'object') {
      throw new Error('Invalid model configuration: must be an object');
    }

    if (!modelConfig.provider || typeof modelConfig.provider !== 'string') {
      throw new Error('Invalid provider: must be a non-empty string');
    }

    const {
      tone = 'conversational',
      strength = 'moderate',
      preserveMeaning = true,
      targetAudience = 'general'
    } = options;

    console.log('Humanize text called with:', { text, options, modelConfig });

    // Enhanced anti-detection prompt with specific techniques
    const prompt = `
You are an expert in creating natural human-written content that cannot be detected by AI-detection tools.

ORIGINAL TEXT:
"""
${text}
"""

Your task is to transform this text to be completely undetectable by AI detection algorithms while maintaining its core meaning. Apply these techniques:

1. STRUCTURAL VARIATION:
   - Vary sentence structures dramatically (simple, compound, complex)
   - Use occasional fragments or rhetorical questions
   - Create natural paragraph breaks and transitions
   - Add some brief sentences between longer ones
   - Incorporate authentic human inconsistencies in formatting

2. LINGUISTIC HUMANIZATION:
   - Use ${tone} tone with natural expressions
   - Add human-like interjections, idioms or colloquialisms where appropriate
   - Incorporate ${targetAudience}-friendly language and references
   - Use imperfect grammar occasionally (like real humans do)
   - Vary word choice - avoid repetitive patterns or vocabulary

3. PATTERN DISRUPTION:
   - Disrupt predictable language patterns that AI detectors look for
   - Insert occasional ambiguity or minor tangential thoughts
   - Use contractions inconsistently (like humans do)
   - Add personality markers like personal opinions or perspective shifts
   - Include casual transitions between ideas (e.g., "anyway", "you know", "actually")

4. AUTHENTICITY MARKERS:
   - Add small personal anecdotes or examples if appropriate
   - Use first-person perspective if it fits the context
   - Include minor tangential thoughts
   - Insert some mild emotional reactions or value judgments

Apply ${strength} transformation level - if strong, make extensive changes while preserving core meaning.

Return ONLY the humanized text without explanations or formatting. Write exactly as a human would write with natural imperfections.
`;

    // If OpenAI is available, include system message
    let response;
    if (modelConfig.provider.toLowerCase() === 'openai') {
      response = await callUnifiedAI({
        messages: [
          { 
            role: 'system', 
            content: 'You are a skilled writer who specializes in creating authentic human-written content that passes AI detection tools. You maintain meaning while making text appear completely natural and human-written.'
          },
          { 
            role: 'user', 
            content: prompt 
          }
        ]
      }, modelConfig);
    } else {
      response = await callUnifiedAI(prompt, modelConfig);
    }
    
    console.log('AI service response:', response);

    // For humanization, we expect the AI to return just the humanized text
    // So we can use the response directly, with some basic cleanup
    const humanizedText = typeof response === 'string' ? response.trim() : String(response).trim();
    console.log('Extracted humanized text:', humanizedText);

    return {
      success: true,
      original: text,
      humanized: humanizedText,
      humanizedText: humanizedText,  // Added for compatibility
      options,
      changes: [
        'Applied varied sentence structures and patterns',
        'Incorporated natural language patterns and inconsistencies',
        'Added authentic human writing characteristics',
        'Reduced AI-detectable patterns and repetition',
        'Adjusted phrasing for more natural flow'
      ],
      analysis: {
        readability: 'Optimized for natural human reading patterns',
        detection: 'Enhanced to minimize AI detection signatures',
        tone: `Adapted to ${tone} tone for target audience`,
        authenticity: 'Increased human writing markers'
      }
    };
  } catch (error) {
    console.error('Text humanization error:', error);
    console.error('Error stack:', error.stack);
    throw new Error(`Failed to humanize text: ${error.message}`);
  }
}

// Simplify text for better readability
async function simplifyText(text, targetGradeLevel = 8, modelConfig) {
  try {
    const prompt = `
Simplify this text for a ${targetGradeLevel}th grade reading level:

ORIGINAL TEXT:
${text}

SIMPLIFICATION REQUIREMENTS:
- Target reading level: Grade ${targetGradeLevel}
- Use shorter sentences
- Replace complex words with simpler alternatives
- Maintain the original meaning
- Make it more accessible

Provide the simplified version.
`;

    const response = await callUnifiedAI(prompt, modelConfig);
    const simplifiedText = extractEnhancedText(response);

    return {
      success: true,
      original: text,
      simplified: simplifiedText,
      targetGradeLevel,
      improvements: [
        'Reduced sentence complexity',
        'Replaced difficult words',
        'Improved accessibility',
        'Maintained core meaning'
      ]
    };
  } catch (error) {
    console.error('Text simplification error:', error);
    throw new Error('Failed to simplify text');
  }
}

// Expand text with more detail
async function expandText(text, targetLength = 'medium', modelConfig) {
  try {
    const lengthMap = {
      short: '25% longer',
      medium: '50% longer',
      long: '100% longer'
    };

    const targetExpansion = lengthMap[targetLength] || '50% longer';

    const prompt = `
Expand this text to be approximately ${targetExpansion}:

ORIGINAL TEXT:
${text}

EXPANSION REQUIREMENTS:
- Add relevant details and examples
- Maintain the original tone and style
- Include supporting information
- Keep the core message intact
- Make it more comprehensive

Provide the expanded version.
`;

    const response = await callUnifiedAI(prompt, modelConfig);
    const expandedText = extractEnhancedText(response);

    return {
      success: true,
      original: text,
      expanded: expandedText,
      targetLength,
      improvements: [
        'Added relevant details',
        'Included examples',
        'Enhanced comprehensiveness',
        'Maintained original tone'
      ]
    };
  } catch (error) {
    console.error('Text expansion error:', error);
    throw new Error('Failed to expand text');
  }
}

// Condense text while preserving key information
async function condenseText(text, targetLength = 'medium', modelConfig) {
  try {
    const lengthMap = {
      short: '50% shorter',
      medium: '25% shorter',
      summary: '75% shorter'
    };

    const targetReduction = lengthMap[targetLength] || '25% shorter';

    const prompt = `
Condense this text to be approximately ${targetReduction}:

ORIGINAL TEXT:
${text}

CONDENSATION REQUIREMENTS:
- Preserve all key information
- Remove redundancy and filler
- Maintain clarity and flow
- Keep the essential message
- Make it more concise

Provide the condensed version.
`;

    const response = await callUnifiedAI(prompt, modelConfig);
    const condensedText = extractEnhancedText(response);

    return {
      success: true,
      original: text,
      condensed: condensedText,
      targetLength,
      improvements: [
        'Removed redundancy',
        'Preserved key information',
        'Improved conciseness',
        'Maintained clarity'
      ]
    };
  } catch (error) {
    console.error('Text condensation error:', error);
    throw new Error('Failed to condense text');
  }
}

module.exports = {
  enhanceFullText,
  extractEnhancedText,
  extractImprovements,
  extractExplanation,
  extractAlternatives,
  humanizeText,
  simplifyText,
  expandText,
  condenseText
};
