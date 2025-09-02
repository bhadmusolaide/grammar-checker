/**
 * Writing scoring and evaluation service
 */

// Calculate overall writing score
function calculateWritingScore(analysis, toneAnalysis, advancedClarity, grammarSuggestions = []) {
  try {
    const wordCount = analysis.lexiconCount || 0;
    const documentType = determineDocumentType(analysis, toneAnalysis);
    const targetComplexity = getTargetComplexity(documentType, wordCount);

    // Component scores (0-100)
    const grammarScore = calculateGrammarScore(grammarSuggestions, wordCount);
    const clarityScore = calculateClarityScore(analysis, advancedClarity, targetComplexity);
    const styleScore = calculateStyleScore(advancedClarity, toneAnalysis, documentType);
    const structureScore = calculateStructureScore(advancedClarity, analysis);
    const engagementScore = calculateEngagementScore(toneAnalysis, documentType, analysis);

    // Weighted overall score
    const weights = {
      grammar: 0.25,
      clarity: 0.25,
      style: 0.20,
      structure: 0.15,
      engagement: 0.15
    };

    const overallScore = Math.round(
      grammarScore * weights.grammar +
      clarityScore * weights.clarity +
      styleScore * weights.style +
      structureScore * weights.structure +
      engagementScore * weights.engagement
    );

    return {
      overall: overallScore,
      components: {
        grammar: grammarScore,
        clarity: clarityScore,
        style: styleScore,
        structure: structureScore,
        engagement: engagementScore
      },
      weights,
      documentType,
      targetComplexity,
      wordCount
    };
  } catch (error) {
    console.error('Writing score calculation error:', error);
    return {
      overall: 0,
      components: {
        grammar: 0,
        clarity: 0,
        style: 0,
        structure: 0,
        engagement: 0
      },
      error: 'Calculation failed'
    };
  }
}

// Determine document type based on analysis
function determineDocumentType(analysis, toneAnalysis) {
  const wordCount = analysis.lexiconCount || 0;
  const formalityLevel = toneAnalysis.formalityLevel || 'neutral';

  if (wordCount < 100) return 'email';
  if (wordCount < 500 && formalityLevel === 'casual') return 'blog';
  if (wordCount < 1000 && formalityLevel === 'formal') return 'business';
  if (wordCount >= 1000) return 'academic';

  return 'general';
}

// Get target complexity for document type
function getTargetComplexity(documentType, wordCount) {
  const complexityTargets = {
    email: { min: 5, max: 10 },
    blog: { min: 8, max: 12 },
    business: { min: 10, max: 15 },
    academic: { min: 12, max: 18 },
    general: { min: 8, max: 14 }
  };

  return complexityTargets[documentType] || complexityTargets.general;
}

// Calculate enhanced grammar score with AI suggestion analysis
function calculateGrammarScore(grammarSuggestions, wordCount) {
  if (wordCount === 0) return 100;

  // Categorize suggestions by severity and impact
  const criticalErrors = grammarSuggestions.filter(s =>
    s.severity === 'high' ||
    s.category === 'Critical Errors' ||
    s.impact === 'Critical'
  ).length;

  const mediumErrors = grammarSuggestions.filter(s =>
    s.severity === 'medium' ||
    s.category === 'Clarity & Structure' ||
    s.impact === 'Clarity'
  ).length;

  const minorIssues = grammarSuggestions.filter(s =>
    s.severity === 'low' ||
    s.category === 'Style & Tone' ||
    s.impact === 'Style'
  ).length;

  // Weighted error calculation
  const weightedErrors = (criticalErrors * 3) + (mediumErrors * 2) + (minorIssues * 1);
  const errorRate = (weightedErrors / Math.max(wordCount, 1)) * 100;

  // Enhanced scoring with confidence consideration
  let baseScore = 100;

  if (criticalErrors > 0) {
    baseScore -= Math.min(30, criticalErrors * 8);
  }

  if (mediumErrors > 0) {
    baseScore -= Math.min(20, mediumErrors * 4);
  }

  if (minorIssues > 0) {
    baseScore -= Math.min(15, minorIssues * 2);
  }

  // Confidence adjustment
  const avgConfidence = grammarSuggestions.length > 0
    ? grammarSuggestions.reduce((sum, s) => sum + (s.confidence || 0.8), 0) / grammarSuggestions.length
    : 1.0;

  const confidenceAdjustment = (avgConfidence - 0.5) * 10; // -5 to +5 adjustment

  return Math.max(40, Math.min(100, Math.round(baseScore + confidenceAdjustment)));
}

// Calculate clarity score
function calculateClarityScore(analysis, advancedClarity, targetComplexity) {
  let score = 100;

  if (advancedClarity && advancedClarity.clarityScore) {
    score = advancedClarity.clarityScore;
  } else {
    // Fallback calculation
    const avgSentenceLength = analysis.avgSentenceLength || 15;
    const gradeLevel = analysis.fleschKincaidGrade || 10;

    // Penalize overly long sentences
    if (avgSentenceLength > 25) score -= 20;
    else if (avgSentenceLength > 20) score -= 10;

    // Check if grade level is appropriate
    if (gradeLevel > targetComplexity.max + 3) score -= 15;
    else if (gradeLevel < targetComplexity.min - 2) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

// Calculate style score
function calculateStyleScore(advancedClarity, toneAnalysis, documentType) {
  let score = 80; // Base score

  // Tone appropriateness
  const styleAppropriatenesss = calculateStyleAppropriateness(toneAnalysis, documentType);
  score += styleAppropriatenesss;

  // Passive voice penalty
  if (advancedClarity && advancedClarity.passiveVoice) {
    const passiveRatio = advancedClarity.passiveVoice.ratio || 0;
    if (passiveRatio > 25) score -= 15;
    else if (passiveRatio > 15) score -= 10;
  }

  // Transition usage bonus
  if (advancedClarity && advancedClarity.transitions) {
    const transitionRatio = advancedClarity.transitions.ratio || 0;
    if (transitionRatio > 5 && transitionRatio < 15) score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

// Calculate style appropriateness
function calculateStyleAppropriateness(toneAnalysis, documentType) {
  const formalityLevel = toneAnalysis.formalityLevel || 'neutral';
  const overallTone = toneAnalysis.overallTone || 'neutral';

  let appropriatenessScore = 0;

  // Document type expectations
  const expectations = {
    email: { formality: ['casual', 'neutral'], tone: ['positive', 'neutral'] },
    blog: { formality: ['casual', 'neutral'], tone: ['positive', 'neutral'] },
    business: { formality: ['formal', 'neutral'], tone: ['neutral', 'positive'] },
    academic: { formality: ['formal'], tone: ['neutral'] },
    general: { formality: ['neutral'], tone: ['neutral'] }
  };

  const expected = expectations[documentType] || expectations.general;

  // Check formality appropriateness
  if (expected.formality.includes(formalityLevel)) {
    appropriatenessScore += 10;
  } else {
    appropriatenessScore -= 5;
  }

  // Check tone appropriateness
  if (expected.tone.includes(overallTone)) {
    appropriatenessScore += 10;
  } else if (overallTone === 'negative') {
    appropriatenessScore -= 10;
  }

  return appropriatenessScore;
}

// Calculate structure score
function calculateStructureScore(advancedClarity, analysis) {
  let score = 80; // Base score

  if (advancedClarity && advancedClarity.sentenceAnalysis) {
    const variation = advancedClarity.sentenceAnalysis.variation || 0;
    const avgLength = advancedClarity.sentenceAnalysis.average || 15;

    // Reward sentence variety
    if (variation > 10) score += 10;
    else if (variation > 5) score += 5;

    // Optimal sentence length
    if (avgLength >= 12 && avgLength <= 18) score += 5;
  }

  // Paragraph structure (estimated)
  const sentenceCount = analysis.sentenceCount || 1;
  const estimatedParagraphs = Math.ceil(sentenceCount / 4);
  const wordsPerParagraph = (analysis.lexiconCount || 0) / estimatedParagraphs;

  if (wordsPerParagraph >= 50 && wordsPerParagraph <= 150) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

// Calculate engagement score
function calculateEngagementScore(toneAnalysis, documentType, analysis) {
  let score = 70; // Base score

  // Sentiment impact
  if (toneAnalysis.sentiment) {
    const positiveRatio = toneAnalysis.sentiment.positive || 0;
    const negativeRatio = toneAnalysis.sentiment.negative || 0;

    if (documentType === 'blog' || documentType === 'email') {
      // These benefit from positive sentiment
      if (positiveRatio > 10) score += 15;
      else if (positiveRatio > 5) score += 10;

      if (negativeRatio > 15) score -= 10;
    }
  }

  // Confidence level
  const confidence = toneAnalysis.confidence || 'low';
  if (confidence === 'high') score += 10;
  else if (confidence === 'medium') score += 5;

  // Word variety (estimated)
  const wordCount = analysis.lexiconCount || 0;
  const uniqueWordRatio = wordCount > 0 ? Math.min(1, wordCount / (wordCount * 0.7)) : 0;
  if (uniqueWordRatio > 0.8) score += 10;
  else if (uniqueWordRatio > 0.6) score += 5;

  return Math.max(0, Math.min(100, score));
}

// Generate enhanced actionable insights with AI-powered recommendations
function generateActionableInsights(scores, grammarSuggestions, advancedClarity, toneAnalysis, documentType) {
  const insights = [];
  const priorities = [];

  // Analyze AI suggestions by category and impact
  const suggestionsByCategory = {
    critical: grammarSuggestions.filter(s => s.severity === 'high' || s.impact === 'Critical'),
    clarity: grammarSuggestions.filter(s => s.category === 'Clarity & Structure' || s.impact === 'Clarity'),
    style: grammarSuggestions.filter(s => s.category === 'Style & Tone' || s.impact === 'Style'),
    engagement: grammarSuggestions.filter(s => s.category === 'Engagement & Impact' || s.impact === 'Engagement'),
    delivery: grammarSuggestions.filter(s => s.category === 'Delivery & Flow' || s.impact === 'Flow')
  };

  // Critical errors insights
  if (suggestionsByCategory.critical.length > 0) {
    insights.push({
      category: 'Critical Issues',
      severity: 'high',
      message: `${suggestionsByCategory.critical.length} critical errors need immediate attention`,
      suggestion: 'Fix grammar, spelling, and punctuation errors that affect meaning and credibility',
      impact: 'High - Essential for professional communication',
      actionItems: suggestionsByCategory.critical.slice(0, 3).map(s => s.detailedExplanation || s.message)
    });
    priorities.push('critical');
  }

  // Grammar insights with specific recommendations
  if (scores.components.grammar < 80) {
    const grammarTypes = {};
    grammarSuggestions.forEach(s => {
      const type = s.ruleId || 'general';
      grammarTypes[type] = (grammarTypes[type] || 0) + 1;
    });

    const topIssue = Object.entries(grammarTypes).sort((a, b) => b[1] - a[1])[0];

    insights.push({
      category: 'Grammar & Mechanics',
      severity: scores.components.grammar < 60 ? 'high' : 'medium',
      message: `${grammarSuggestions.length} grammar issues detected`,
      suggestion: topIssue ? `Focus on ${topIssue[0].replace('_', ' ')} issues (${topIssue[1]} occurrences)` : 'Review and fix grammar errors',
      impact: 'High - Affects credibility and readability',
      actionItems: grammarSuggestions.slice(0, 3).map(s => s.detailedExplanation || s.message)
    });
    priorities.push('grammar');
  }

  // Clarity insights with enhanced analysis
  if (scores.components.clarity < 75 || suggestionsByCategory.clarity.length > 0) {
    const avgSentenceLength = advancedClarity?.sentenceAnalysis?.average || 0;
    const clarityIssues = [];

    if (avgSentenceLength > 20) {
      clarityIssues.push(`Average sentence length is ${Math.round(avgSentenceLength)} words (ideal: 12-18)`);
    }

    if (suggestionsByCategory.clarity.length > 0) {
      clarityIssues.push(`${suggestionsByCategory.clarity.length} clarity improvements suggested`);
    }

    insights.push({
      category: 'Clarity & Readability',
      severity: 'medium',
      message: clarityIssues.join('; '),
      suggestion: 'Simplify complex sentences and improve word choice for better understanding',
      impact: 'Medium - Improves reader comprehension',
      actionItems: suggestionsByCategory.clarity.slice(0, 3).map(s => s.detailedExplanation || s.message)
    });
    priorities.push('clarity');
  }

  // Style insights with specific recommendations
  if (scores.components.style < 75 || suggestionsByCategory.style.length > 0) {
    const styleIssues = [];
    const passiveRatio = advancedClarity?.passiveVoice?.ratio || 0;

    if (passiveRatio > 20) {
      styleIssues.push(`${Math.round(passiveRatio)}% passive voice usage`);
    }

    if (suggestionsByCategory.style.length > 0) {
      styleIssues.push(`${suggestionsByCategory.style.length} style improvements available`);
    }

    insights.push({
      category: 'Style & Tone',
      severity: 'medium',
      message: styleIssues.join('; '),
      suggestion: 'Use more active voice and varied sentence structures for engaging writing',
      impact: 'Medium - Enhances writing flow and engagement',
      actionItems: suggestionsByCategory.style.slice(0, 3).map(s => s.detailedExplanation || s.message)
    });
    priorities.push('style');
  }

  // Engagement insights
  if (scores.components.engagement < 75 || suggestionsByCategory.engagement.length > 0) {
    insights.push({
      category: 'Engagement & Impact',
      severity: 'low',
      message: `${suggestionsByCategory.engagement.length} opportunities to increase reader engagement`,
      suggestion: 'Use stronger verbs, compelling language, and emotional resonance',
      impact: 'Medium - Increases reader interest and retention',
      actionItems: suggestionsByCategory.engagement.slice(0, 3).map(s => s.detailedExplanation || s.message)
    });
    priorities.push('engagement');
  }

  // Document-specific insights
  const docInsights = getDocumentTypeInsights(documentType, scores, toneAnalysis);
  insights.push(...docInsights);

  return {
    insights,
    priorities,
    overallRecommendation: generateOverallRecommendation(scores, priorities),
    suggestionSummary: {
      total: grammarSuggestions.length,
      bySeverity: {
        high: suggestionsByCategory.critical.length,
        medium: suggestionsByCategory.clarity.length + suggestionsByCategory.style.length,
        low: suggestionsByCategory.engagement.length + suggestionsByCategory.delivery.length
      },
      byCategory: {
        critical: suggestionsByCategory.critical.length,
        clarity: suggestionsByCategory.clarity.length,
        style: suggestionsByCategory.style.length,
        engagement: suggestionsByCategory.engagement.length,
        delivery: suggestionsByCategory.delivery.length
      }
    }
  };
}

// Get document type specific insights
function getDocumentTypeInsights(documentType, scores, toneAnalysis) {
  const insights = [];

  switch (documentType) {
  case 'email':
    if (toneAnalysis.formalityLevel === 'formal') {
      insights.push({
        category: 'Tone',
        severity: 'low',
        message: 'Consider a more conversational tone for emails',
        suggestion: 'Use contractions and casual language where appropriate',
        impact: 'Low - improves relatability'
      });
    }
    break;

  case 'business':
    if (toneAnalysis.formalityLevel === 'casual') {
      insights.push({
        category: 'Tone',
        severity: 'medium',
        message: 'Business documents benefit from formal tone',
        suggestion: 'Use professional language and avoid casual expressions',
        impact: 'Medium - improves professionalism'
      });
    }
    break;

  case 'academic':
    if (scores.components.structure < 80) {
      insights.push({
        category: 'Structure',
        severity: 'high',
        message: 'Academic writing requires strong structure',
        suggestion: 'Ensure clear thesis, supporting arguments, and conclusion',
        impact: 'High - essential for academic credibility'
      });
    }
    break;
  }

  return insights;
}

// Generate overall recommendation
function generateOverallRecommendation(scores, priorities) {
  if (scores.overall >= 90) {
    return 'Excellent writing! Minor refinements could make it even better.';
  } else if (scores.overall >= 80) {
    return 'Good writing with room for improvement. Focus on ' + priorities.slice(0, 2).join(' and ') + '.';
  } else if (scores.overall >= 70) {
    return 'Decent writing that needs attention. Prioritize ' + priorities.slice(0, 2).join(' and ') + '.';
  } else {
    return 'Significant improvements needed. Start with ' + priorities[0] + ' issues.';
  }
}

// Determine writing level
function determineWritingLevel(score, documentType) {
  try {
    // Handle edge cases
    if (typeof score !== 'number' || isNaN(score)) {
      return 'Beginner';
    }

    const thresholds = {
      email: { expert: 85, proficient: 75, developing: 65 },
      blog: { expert: 88, proficient: 78, developing: 68 },
      business: { expert: 90, proficient: 80, developing: 70 },
      academic: { expert: 92, proficient: 82, developing: 72 },
      general: { expert: 87, proficient: 77, developing: 67 }
    };

    const threshold = thresholds[documentType] || thresholds.general;

    if (score >= threshold.expert) return 'Expert';
    if (score >= threshold.proficient) return 'Proficient';
    if (score >= threshold.developing) return 'Developing';
    return 'Beginner';
  } catch (error) {
    console.error('Error in determineWritingLevel:', error);
    return 'Beginner'; // Safe fallback
  }
}

// Determine target audience
function determineTargetAudience(toneAnalysis, documentType) {
  try {
    // Handle edge cases
    if (!toneAnalysis) {
      return 'General';
    }

    const formality = toneAnalysis.formalityLevel || 'neutral';
    const tone = toneAnalysis.overallTone || 'neutral';

    if (documentType === 'academic') return 'Academic/Professional';
    if (documentType === 'business' && formality === 'formal') return 'Business/Corporate';
    if (formality === 'casual' && tone === 'positive') return 'General/Consumer';
    if (formality === 'formal') return 'Professional';

    return 'General';
  } catch (error) {
    console.error('Error in determineTargetAudience:', error);
    return 'General'; // Safe fallback
  }
}

// Get industry benchmarks
function getIndustryBenchmarks(documentType) {
  const benchmarks = {
    email: {
      averageScore: 78,
      topPercentile: 90,
      commonIssues: ['Grammar errors', 'Unclear subject lines', 'Too formal tone']
    },
    blog: {
      averageScore: 82,
      topPercentile: 93,
      commonIssues: ['Weak engagement', 'Poor structure', 'Inconsistent tone']
    },
    business: {
      averageScore: 85,
      topPercentile: 95,
      commonIssues: ['Passive voice', 'Jargon overuse', 'Poor clarity']
    },
    academic: {
      averageScore: 88,
      topPercentile: 96,
      commonIssues: ['Complex sentences', 'Weak arguments', 'Citation issues']
    },
    general: {
      averageScore: 80,
      topPercentile: 92,
      commonIssues: ['Grammar errors', 'Unclear messaging', 'Inconsistent style']
    }
  };

  return benchmarks[documentType] || benchmarks.general;
}

module.exports = {
  calculateWritingScore,
  determineDocumentType,
  getTargetComplexity,
  calculateGrammarScore,
  calculateClarityScore,
  calculateStyleScore,
  calculateStyleAppropriateness,
  calculateStructureScore,
  calculateEngagementScore,
  generateActionableInsights,
  getDocumentTypeInsights,
  determineWritingLevel,
  determineTargetAudience,
  getIndustryBenchmarks
};
