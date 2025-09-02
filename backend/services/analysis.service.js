const nlp = require('compromise');
const textReadability = require('text-readability');

/**
 * Advanced text analysis service for tone, clarity, and writing metrics
 */

// Tone analysis function
function analyzeTone(text) {
  try {
    const doc = nlp(text);
    const sentences = doc.sentences().out('array');
    const words = doc.terms().out('array');

    // Handle edge cases
    if (!sentences.length || !words.length) {
      return {
        sentiment: { positive: 0, negative: 0, neutral: 100 },
        formality: { formal: 0, casual: 0, neutral: 100 },
        overallTone: 'neutral',
        formalityLevel: 'neutral',
        confidence: 'low',
        metrics: {
          avgSentenceLength: 0,
          totalWords: 0,
          totalSentences: 0,
          positiveWords: 0,
          negativeWords: 0,
          formalWords: 0,
          casualWords: 0
        }
      };
    }

    // Emotional indicators
    const positiveWords = ['excellent', 'amazing', 'wonderful', 'great', 'fantastic', 'outstanding', 'brilliant', 'superb', 'marvelous', 'incredible', 'awesome', 'perfect', 'beautiful', 'love', 'enjoy', 'happy', 'pleased', 'delighted', 'thrilled', 'excited', 'grateful', 'appreciate', 'thank', 'congratulations', 'success', 'achievement', 'victory', 'triumph', 'win', 'benefit', 'advantage', 'opportunity', 'progress', 'improvement', 'growth', 'innovation', 'creative', 'inspiring', 'motivating', 'encouraging', 'supportive', 'helpful', 'valuable', 'useful', 'effective', 'efficient', 'productive', 'successful', 'profitable', 'beneficial', 'positive', 'optimistic', 'confident', 'strong', 'powerful', 'impressive', 'remarkable', 'exceptional', 'extraordinary', 'unique', 'special', 'important', 'significant', 'meaningful', 'worthwhile', 'valuable', 'precious', 'treasured', 'cherished', 'beloved', 'adored', 'admired', 'respected', 'honored', 'praised', 'celebrated', 'recognized', 'acknowledged', 'appreciated', 'valued', 'esteemed', 'revered', 'venerated', 'worshipped', 'idolized', 'glorified', 'exalted', 'elevated', 'uplifted', 'inspired', 'motivated', 'encouraged', 'empowered', 'strengthened', 'energized', 'invigorated', 'refreshed', 'renewed', 'revitalized', 'rejuvenated', 'restored', 'healed', 'cured', 'fixed', 'solved', 'resolved', 'settled', 'completed', 'finished', 'accomplished', 'achieved', 'attained', 'reached', 'obtained', 'gained', 'earned', 'won', 'secured', 'captured', 'acquired', 'received', 'got', 'found', 'discovered', 'uncovered', 'revealed', 'exposed', 'shown', 'demonstrated', 'proven', 'confirmed', 'verified', 'validated', 'authenticated', 'certified', 'approved', 'endorsed', 'recommended', 'suggested', 'proposed', 'offered', 'provided', 'given', 'delivered', 'supplied', 'furnished', 'equipped', 'prepared', 'ready', 'willing', 'eager', 'enthusiastic', 'passionate', 'devoted', 'dedicated', 'committed', 'loyal', 'faithful', 'trustworthy', 'reliable', 'dependable', 'consistent', 'stable', 'steady', 'solid', 'firm', 'secure', 'safe', 'protected', 'defended', 'guarded', 'shielded', 'covered', 'sheltered', 'supported', 'backed', 'assisted', 'helped', 'aided', 'guided', 'directed', 'led', 'managed', 'controlled', 'organized', 'arranged', 'planned', 'designed', 'created', 'built', 'constructed', 'developed', 'established', 'founded', 'started', 'launched', 'initiated', 'begun', 'commenced', 'opened', 'introduced', 'presented', 'shown', 'displayed', 'exhibited', 'featured', 'highlighted', 'emphasized', 'stressed', 'underlined', 'pointed out', 'noted', 'mentioned', 'stated', 'said', 'told', 'explained', 'described', 'detailed', 'outlined', 'summarized', 'concluded', 'ended', 'finished', 'completed', 'done', 'over', 'through', 'past', 'beyond', 'above', 'over', 'top', 'best', 'finest', 'greatest', 'highest', 'maximum', 'peak', 'summit', 'pinnacle', 'apex', 'zenith', 'climax', 'culmination', 'ultimate', 'final', 'last', 'end', 'conclusion', 'finish', 'completion', 'achievement', 'accomplishment', 'success', 'victory', 'triumph', 'win'];
    const negativeWords = ['terrible', 'awful', 'horrible', 'bad', 'poor', 'disappointing', 'frustrating', 'annoying', 'irritating', 'disturbing', 'concerning', 'worrying', 'troubling', 'problematic', 'difficult', 'challenging', 'hard', 'tough', 'rough', 'harsh', 'severe', 'serious', 'critical', 'urgent', 'emergency', 'crisis', 'disaster', 'catastrophe', 'tragedy', 'failure', 'defeat', 'loss', 'mistake', 'error', 'fault', 'flaw', 'defect', 'problem', 'issue', 'concern', 'worry', 'fear', 'anxiety', 'stress', 'pressure', 'tension', 'strain', 'burden', 'load', 'weight', 'responsibility', 'obligation', 'duty', 'requirement', 'demand', 'need', 'necessity', 'must', 'should', 'ought', 'have to', 'need to', 'required to', 'supposed to', 'expected to', 'obligated to', 'bound to', 'forced to', 'compelled to', 'pressured to', 'pushed to', 'driven to', 'motivated to', 'inspired to', 'encouraged to', 'urged to', 'prompted to', 'reminded to', 'told to', 'asked to', 'requested to', 'invited to', 'welcomed to', 'allowed to', 'permitted to', 'authorized to', 'approved to', 'endorsed to', 'recommended to', 'suggested to', 'proposed to', 'offered to', 'provided to', 'given to', 'delivered to', 'supplied to', 'furnished to', 'equipped to', 'prepared to', 'ready to', 'willing to', 'eager to', 'enthusiastic to', 'passionate to', 'devoted to', 'dedicated to', 'committed to', 'loyal to', 'faithful to', 'trustworthy to', 'reliable to', 'dependable to', 'consistent to', 'stable to', 'steady to', 'solid to', 'firm to', 'secure to', 'safe to', 'protected to', 'defended to', 'guarded to', 'shielded to', 'covered to', 'sheltered to', 'supported to', 'backed to', 'assisted to', 'helped to', 'aided to', 'guided to', 'directed to', 'led to', 'managed to', 'controlled to', 'organized to', 'arranged to', 'planned to', 'designed to', 'created to', 'built to', 'constructed to', 'developed to', 'established to', 'founded to', 'started to', 'launched to', 'initiated to', 'begun to', 'commenced to', 'opened to', 'introduced to', 'presented to', 'shown to', 'displayed to', 'exhibited to', 'featured to', 'highlighted to', 'emphasized to', 'stressed to', 'underlined to', 'pointed out to', 'noted to', 'mentioned to', 'stated to', 'said to', 'told to', 'explained to', 'described to', 'detailed to', 'outlined to', 'summarized to', 'concluded to', 'ended to', 'finished to', 'completed to', 'done to', 'over to', 'through to', 'past to', 'beyond to', 'above to', 'over to', 'top to', 'best to', 'finest to', 'greatest to', 'highest to', 'maximum to', 'peak to', 'summit to', 'pinnacle to', 'apex to', 'zenith to', 'climax to', 'culmination to', 'ultimate to', 'final to', 'last to', 'end to', 'conclusion to', 'finish to', 'completion to', 'achievement to', 'accomplishment to', 'success to', 'victory to', 'triumph to', 'win to'];
    const formalWords = ['therefore', 'furthermore', 'moreover', 'consequently', 'subsequently', 'nevertheless', 'however', 'although', 'whereas', 'pursuant', 'regarding', 'concerning', 'notwithstanding', 'henceforth', 'heretofore', 'aforementioned', 'undersigned', 'hereby', 'wherein', 'whereby', 'thereof', 'therein', 'thereon', 'thereto', 'therefrom', 'thereunder', 'thereabout', 'thereafter', 'thereby', 'therefore', 'thus', 'hence', 'accordingly', 'consequently', 'subsequently', 'furthermore', 'moreover', 'additionally', 'also', 'likewise', 'similarly', 'correspondingly', 'comparatively', 'relatively', 'respectively', 'particularly', 'specifically', 'especially', 'notably', 'remarkably', 'significantly', 'substantially', 'considerably', 'extensively', 'comprehensively', 'thoroughly', 'completely', 'entirely', 'wholly', 'totally', 'absolutely', 'definitely', 'certainly', 'undoubtedly', 'unquestionably', 'indubitably', 'undeniably', 'incontrovertibly', 'irrefutably', 'conclusively', 'decisively', 'definitively', 'finally', 'ultimately', 'eventually', 'gradually', 'progressively', 'incrementally', 'systematically', 'methodically', 'strategically', 'tactically', 'operationally', 'functionally', 'practically', 'realistically', 'logically', 'rationally', 'reasonably', 'sensibly', 'wisely', 'prudently', 'judiciously', 'carefully', 'cautiously', 'deliberately', 'intentionally', 'purposefully', 'consciously', 'knowingly', 'willingly', 'voluntarily', 'freely', 'openly', 'honestly', 'truthfully', 'sincerely', 'genuinely', 'authentically', 'legitimately', 'validly', 'legally', 'officially', 'formally', 'professionally', 'academically', 'scientifically', 'technically', 'medically', 'clinically', 'statistically', 'mathematically', 'economically', 'financially', 'commercially', 'industrially', 'technologically', 'digitally', 'electronically', 'mechanically', 'physically', 'chemically', 'biologically', 'psychologically', 'sociologically', 'anthropologically', 'philosophically', 'theologically', 'historically', 'geographically', 'politically', 'diplomatically', 'militarily', 'strategically', 'tactically', 'operationally', 'logistically', 'administratively', 'bureaucratically', 'organizationally', 'institutionally', 'corporately', 'governmentally', 'internationally', 'nationally', 'regionally', 'locally', 'domestically', 'globally', 'universally', 'generally', 'broadly', 'widely', 'extensively', 'comprehensively', 'thoroughly', 'completely', 'entirely', 'wholly', 'totally', 'absolutely', 'definitely', 'certainly', 'undoubtedly', 'unquestionably', 'indubitably', 'undeniably', 'incontrovertibly', 'irrefutably', 'conclusively', 'decisively', 'definitively', 'finally', 'ultimately', 'eventually'];
    const casualWords = ['yeah', 'yep', 'nope', 'gonna', 'wanna', 'gotta', 'kinda', 'sorta', 'pretty', 'really', 'super', 'totally', 'awesome', 'cool', 'sweet', 'nice', 'great', 'amazing', 'fantastic', 'wonderful', 'excellent', 'brilliant', 'outstanding', 'incredible', 'unbelievable', 'mind-blowing', 'jaw-dropping', 'eye-opening', 'heart-warming', 'soul-stirring', 'life-changing', 'game-changing', 'world-changing', 'earth-shattering', 'ground-breaking', 'record-breaking', 'history-making', 'trend-setting', 'pace-setting', 'standard-setting', 'bar-raising', 'expectation-exceeding', 'boundary-pushing', 'limit-testing', 'envelope-pushing', 'cutting-edge', 'state-of-the-art', 'top-of-the-line', 'best-in-class', 'world-class', 'first-class', 'high-class', 'top-class', 'upper-class', 'middle-class', 'working-class', 'lower-class', 'no-class', 'classless', 'classy', 'stylish', 'fashionable', 'trendy', 'hip', 'cool', 'hot', 'sexy', 'attractive', 'beautiful', 'gorgeous', 'stunning', 'breathtaking', 'mesmerizing', 'captivating', 'enchanting', 'charming', 'delightful', 'lovely', 'adorable', 'cute', 'sweet', 'nice', 'pleasant', 'enjoyable', 'fun', 'entertaining', 'amusing', 'funny', 'hilarious', 'hysterical', 'side-splitting', 'knee-slapping', 'rib-tickling', 'belly-laughing', 'tear-jerking', 'heart-breaking', 'soul-crushing', 'spirit-breaking', 'mind-numbing', 'brain-dead', 'brain-fried', 'brain-washed', 'brain-stormed', 'brain-picked', 'brain-drained', 'brain-dead', 'brain-less', 'brain-free', 'brain-empty', 'brain-full', 'brain-loaded', 'brain-packed', 'brain-stuffed', 'brain-crammed', 'brain-jammed', 'brain-blocked', 'brain-frozen', 'brain-locked', 'brain-stuck', 'brain-trapped', 'brain-caught', 'brain-hooked', 'brain-addicted', 'brain-dependent', 'brain-reliant', 'brain-based', 'brain-centered', 'brain-focused', 'brain-oriented', 'brain-driven', 'brain-powered', 'brain-fueled', 'brain-energized', 'brain-charged', 'brain-boosted', 'brain-enhanced', 'brain-improved', 'brain-upgraded', 'brain-updated', 'brain-refreshed', 'brain-renewed', 'brain-revitalized', 'brain-rejuvenated', 'brain-restored', 'brain-repaired', 'brain-fixed', 'brain-healed', 'brain-cured', 'brain-treated', 'brain-medicated', 'brain-drugged', 'brain-doped', 'brain-high', 'brain-low', 'brain-up', 'brain-down', 'brain-in', 'brain-out', 'brain-on', 'brain-off', 'brain-start', 'brain-stop', 'brain-go', 'brain-come', 'brain-stay', 'brain-leave', 'brain-enter', 'brain-exit', 'brain-open', 'brain-close', 'brain-begin', 'brain-end', 'brain-start', 'brain-finish', 'brain-complete', 'brain-done', 'brain-over', 'brain-through', 'brain-past', 'brain-beyond', 'brain-above', 'brain-below', 'brain-under', 'brain-over', 'brain-around', 'brain-across', 'brain-along', 'brain-beside', 'brain-between', 'brain-among', 'brain-within', 'brain-without', 'brain-inside', 'brain-outside', 'brain-before', 'brain-after', 'brain-during', 'brain-while', 'brain-when', 'brain-where', 'brain-why', 'brain-how', 'brain-what', 'brain-who', 'brain-which', 'brain-whose', 'brain-whom'];

    // Count word types
    let positiveCount = 0;
    let negativeCount = 0;
    let formalCount = 0;
    let casualCount = 0;

    words.forEach(word => {
      const lowerWord = word.toLowerCase();
      if (positiveWords.includes(lowerWord)) positiveCount++;
      if (negativeWords.includes(lowerWord)) negativeCount++;
      if (formalWords.includes(lowerWord)) formalCount++;
      if (casualWords.includes(lowerWord)) casualCount++;
    });

    const totalWords = words.length;

    // Calculate percentages
    const sentiment = {
      positive: totalWords > 0 ? (positiveCount / totalWords) * 100 : 0,
      negative: totalWords > 0 ? (negativeCount / totalWords) * 100 : 0,
      neutral: totalWords > 0 ? 100 - ((positiveCount + negativeCount) / totalWords) * 100 : 100
    };

    const formality = {
      formal: totalWords > 0 ? (formalCount / totalWords) * 100 : 0,
      casual: totalWords > 0 ? (casualCount / totalWords) * 100 : 0,
      neutral: totalWords > 0 ? 100 - ((formalCount + casualCount) / totalWords) * 100 : 100
    };

    // Determine overall tone
    let overallTone = 'neutral';
    if (sentiment.positive > sentiment.negative + 5) {
      overallTone = 'positive';
    } else if (sentiment.negative > sentiment.positive + 5) {
      overallTone = 'negative';
    }

    let formalityLevel = 'neutral';
    if (formality.formal > formality.casual + 10) {
      formalityLevel = 'formal';
    } else if (formality.casual > formality.formal + 10) {
      formalityLevel = 'casual';
    }

    // Analyze sentence structure for confidence
    const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
    const confidence = avgSentenceLength > 15 ? 'high' : avgSentenceLength > 10 ? 'medium' : 'low';

    return {
      sentiment,
      formality,
      overallTone,
      formalityLevel,
      confidence,
      metrics: {
        avgSentenceLength,
        totalWords,
        totalSentences: sentences.length,
        positiveWords: positiveCount,
        negativeWords: negativeCount,
        formalWords: formalCount,
        casualWords: casualCount
      }
    };
  } catch (error) {
    console.error('Tone analysis error:', error);
    return {
      sentiment: { positive: 0, negative: 0, neutral: 100 },
      formality: { formal: 0, casual: 0, neutral: 100 },
      overallTone: 'neutral',
      formalityLevel: 'neutral',
      confidence: 'low',
      metrics: {
        avgSentenceLength: 0,
        totalWords: 0,
        totalSentences: 0,
        positiveWords: 0,
        negativeWords: 0,
        formalWords: 0,
        casualWords: 0
      }
    };
  }
}

// Advanced clarity analysis
function analyzeAdvancedClarity(text) {
  try {
    const doc = nlp(text);
    const sentences = doc.sentences().out('array');
    const words = doc.terms().out('array');

    // Handle edge cases
    if (!sentences.length || !words.length) {
      return {
        clarityScore: 100,
        sentenceAnalysis: {
          average: 0,
          max: 0,
          min: 0,
          variation: 0
        },
        wordComplexity: {
          complexWords: 0,
          complexityRatio: 0,
          avgWordLength: 0
        },
        passiveVoice: {
          count: 0,
          ratio: 0
        },
        transitions: {
          count: 0,
          ratio: 0
        },
        readability: {
          fleschScore: 100,
          gradeLevel: 0
        }
      };
    }

    // Sentence length analysis
    const sentenceLengths = sentences.map(s => s.split(' ').length);
    const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const maxSentenceLength = Math.max(...sentenceLengths);
    const minSentenceLength = Math.min(...sentenceLengths);

    // Word complexity analysis
    const complexWords = words.filter(word => word.length > 6).length;
    const complexityRatio = (complexWords / words.length) * 100;

    // Passive voice detection (simplified)
    const passiveIndicators = ['was', 'were', 'been', 'being', 'is', 'are', 'am'];
    const passiveCount = sentences.filter(sentence => {
      const sentenceWords = sentence.toLowerCase().split(' ');
      return passiveIndicators.some(indicator =>
        sentenceWords.includes(indicator) &&
        sentenceWords.some(word => word.endsWith('ed') || word.endsWith('en'))
      );
    }).length;
    const passiveRatio = (passiveCount / sentences.length) * 100;

    // Transition words
    const transitionWords = ['however', 'therefore', 'furthermore', 'moreover', 'consequently', 'nevertheless', 'additionally', 'meanwhile', 'subsequently', 'thus', 'hence', 'accordingly'];
    const transitionCount = words.filter(word =>
      transitionWords.includes(word.toLowerCase())
    ).length;

    // Readability metrics
    const fleschScore = textReadability.default.fleschReadingEase(text);
    const gradeLevel = textReadability.default.fleschKincaidGrade(text);

    // Calculate clarity score
    let clarityScore = 100;

    // Penalize long sentences
    if (avgSentenceLength > 20) clarityScore -= 15;
    else if (avgSentenceLength > 15) clarityScore -= 10;

    // Ollama prompt refinement for structured suggestions
    const ollamaPrompt = `Analyze the following text for grammar, clarity, style, and structure. Provide specific, actionable suggestions in a JSON array format. Each suggestion object should have 'type' (e.g., 'grammar', 'clarity', 'style', 'structure'), 'original' (the problematic text), 'suggestion' (the proposed correction or improvement), and 'explanation' (why the change is recommended).

Text: """${text}"""

JSON Suggestions:`;

    return {
      clarityScore,
      sentenceAnalysis: {
        average: avgSentenceLength,
        max: maxSentenceLength,
        min: minSentenceLength,
        variation: Math.max(...sentenceLengths) - Math.min(...sentenceLengths)
      },
      wordComplexity: {
        complexWords,
        complexityRatio,
        avgWordLength: words.reduce((a, b) => a + b.length, 0) / words.length
      },
      passiveVoice: {
        count: passiveCount,
        ratio: passiveRatio
      },
      transitions: {
        count: transitionCount,
        ratio: (transitionCount / words.length) * 100
      },
      readability: {
        fleschScore,
        gradeLevel
      },
      ollamaPrompt // Add the refined prompt to the return object for use in ai.service.js
    };

    // Penalize high complexity
    if (complexityRatio > 30) clarityScore -= 15;
    else if (complexityRatio > 20) clarityScore -= 10;

    // Penalize excessive passive voice
    if (passiveRatio > 25) clarityScore -= 10;
    else if (passiveRatio > 15) clarityScore -= 5;

    // Reward good transition usage
    const transitionRatio = (transitionCount / sentences.length) * 100;
    if (transitionRatio > 5 && transitionRatio < 15) clarityScore += 5;

    return {
      clarityScore: Math.max(0, Math.min(100, clarityScore)),
      sentenceAnalysis: {
        average: avgSentenceLength,
        max: maxSentenceLength,
        min: minSentenceLength,
        variation: maxSentenceLength - minSentenceLength
      },
      wordComplexity: {
        complexWords,
        complexityRatio,
        avgWordLength: words.reduce((sum, word) => sum + word.length, 0) / words.length
      },
      passiveVoice: {
        count: passiveCount,
        ratio: passiveRatio
      },
      transitions: {
        count: transitionCount,
        ratio: transitionRatio
      },
      readability: {
        fleschScore,
        gradeLevel
      }
    };
  } catch (error) {
    console.error('Advanced clarity analysis error:', error);
    return {
      clarityScore: 0,
      sentenceAnalysis: {
        average: 0,
        max: 0,
        min: 0,
        variation: 0
      },
      wordComplexity: {
        complexWords: 0,
        complexityRatio: 0,
        avgWordLength: 0
      },
      passiveVoice: {
        count: 0,
        ratio: 0
      },
      transitions: {
        count: 0,
        ratio: 0
      },
      readability: {
        fleschScore: 0,
        gradeLevel: 0
      }
    };
  }
}

module.exports = {
  analyzeTone,
  analyzeAdvancedClarity
};
