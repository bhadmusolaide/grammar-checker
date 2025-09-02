const { callUnifiedAI } = require('../services/ai.service');
const fs = require('fs');
const pdf = require('pdf-parse');
const {
  extractKeywords,
  parseAchievements,
  analyzeJobDescription: analyzeJobDescriptionService,
  generateInterviewAnswer,
  optimizeResume,
  generateJobApplication,
  analyzeSkillGap,
  runATSOptimizer,
  runAchievementTransformer,
  runFormatConversion,
  runJobDecoder,
  runCoverLetter,
  runInterviewBuilder,
  runCareerTools
} = require('../services/career.service');
const { analyzeTone, analyzeAdvancedClarity } = require('../services/analysis.service');
const { calculateWritingScore } = require('../services/scoring.service');
const { debugLog, debugError } = require('../utils/logger');

// Helper function to retry AI calls
async function retryAICall(prompt, modelConfig, maxRetries = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      debugLog(`AI call attempt ${attempt}/${maxRetries}...`);
      const response = await callUnifiedAI(prompt, modelConfig);
      if (response) {
        debugLog(`AI call succeeded on attempt ${attempt}`);
        return response;
      } else {
        debugLog(`AI call returned empty response on attempt ${attempt}`);
        lastError = new Error('Empty response from AI');
      }
    } catch (error) {
      debugError(`AI call failed on attempt ${attempt}:`, error.message);
      lastError = error;
    }

    // Wait before retrying
    if (attempt < maxRetries) {
      const delay = 1000 * attempt; // Exponential backoff
      debugLog(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // If we get here, all retries failed
  throw lastError || new Error('All AI call attempts failed');
}

// Split job analysis prompt into smaller, more manageable tasks
async function generateJobAnalysis(text, finalModelConfig) {
  debugLog('Generating job analysis with simplified prompts...');

  // 1. First, get hidden requirements with a focused prompt
  const hiddenRequirementsPrompt = `
You are a senior career coach specialized in analyzing job descriptions.

Analyze this job description and identify ONLY the hidden requirements - skills and qualifications that aren't explicitly stated but are implied or expected for success in this role.

JOB DESCRIPTION:
"${text}"

Provide EXACTLY 5 hidden requirements in a bulleted list format starting with dashes (-). Be specific and clear. For example:
- Ability to work under tight deadlines
- Experience with cross-functional team leadership

YOUR RESPONSE (ONLY BULLETS, NO INTRODUCTION OR CONCLUSION):
`;

  // 2. Then, get key phrases with a focused prompt
  const keyPhrasesPrompt = `
You are a job application expert who helps candidates identify important terminology.

Analyze this job description and extract ONLY the most important key phrases and industry terminology that should be included in a strong application.

JOB DESCRIPTION:
"${text}"

Provide EXACTLY 8 key phrases in a bulleted list format starting with dashes (-). Focus on specific skills, technologies, or qualifications mentioned. For example:
- Project management certification
- Machine learning expertise

YOUR RESPONSE (ONLY BULLETS, NO INTRODUCTION OR CONCLUSION):
`;

  // 3. Then, get cultural indicators with a focused prompt
  const culturalIndicatorsPrompt = `
You are a workplace culture analyst who helps job seekers understand company values.

Analyze this job description and identify ONLY cultural indicators - phrases that reveal the company's values, work style, and team dynamics.

JOB DESCRIPTION:
"${text}"

Provide EXACTLY 5 cultural indicators in a bulleted list format starting with dashes (-). Focus on values, work environment, and team dynamics. For example:
- Values collaboration and teamwork
- Emphasis on work-life balance

YOUR RESPONSE (ONLY BULLETS, NO INTRODUCTION OR CONCLUSION):
`;

  // 4. Finally, get recommendations with a focused prompt
  const recommendationsPrompt = `
You are a job search strategist who helps candidates tailor their applications.

Based on this job description, provide ONLY specific recommendations for how the candidate should customize their application.

JOB DESCRIPTION:
"${text}"

Provide EXACTLY 5 recommendations in a bulleted list format starting with dashes (-). Be specific about what to emphasize and highlight. For example:
- Highlight experience with agile development methodologies
- Emphasize leadership in cross-functional teams

YOUR RESPONSE (ONLY BULLETS, NO INTRODUCTION OR CONCLUSION):
`;

  try {
    // Execute all prompts in parallel for efficiency
    const [hiddenRequirementsResponse, keyPhrasesResponse, culturalIndicatorsResponse, recommendationsResponse] =
      await Promise.all([
        retryAICall(hiddenRequirementsPrompt, finalModelConfig, 2),
        retryAICall(keyPhrasesPrompt, finalModelConfig, 2),
        retryAICall(culturalIndicatorsPrompt, finalModelConfig, 2),
        retryAICall(recommendationsPrompt, finalModelConfig, 2)
      ]);

    // Parse responses with more flexible pattern matching
    const hiddenRequirements = extractBulletPoints(hiddenRequirementsResponse);
    const keyPhrases = extractBulletPoints(keyPhrasesResponse);
    const culturalIndicators = extractBulletPoints(culturalIndicatorsResponse);
    const recommendations = extractBulletPoints(recommendationsResponse);

    // If any section is empty, retry with more explicit feedback
    const retryResults = await handleEmptySections({
      hiddenRequirements,
      keyPhrases,
      culturalIndicators,
      recommendations,
      text,
      finalModelConfig
    });

    return {
      hiddenRequirements: retryResults.hiddenRequirements || hiddenRequirements,
      keyPhrases: retryResults.keyPhrases || keyPhrases,
      culturalIndicators: retryResults.culturalIndicators || culturalIndicators,
      recommendations: retryResults.recommendations || recommendations
    };
  } catch (error) {
    console.error('Error generating job analysis with simplified prompts:', error);
    // Return empty arrays if all attempts fail
    return {
      hiddenRequirements: [],
      keyPhrases: [],
      culturalIndicators: [],
      recommendations: []
    };
  }
}

// Split interview prompt into smaller, more manageable tasks
async function generateInterviewAnswers(text, targetPosition, finalModelConfig) {
  console.log('Generating interview answers with simplified prompts...');

  // Create a prompt for each question to get better results

  // Question 1: Challenge
  const challenge_prompt = `
You are an interview coach helping a candidate prepare for the ${targetPosition} position.

Create a powerful STAR format response for this interview question: "Tell me about a time when you faced a significant challenge at work and how you overcame it."

The response should be relevant to this job description:
"${text}"

Provide a response with these 4 sections:
1. SITUATION: Brief description of the context (2-3 sentences)
2. TASK: What needed to be accomplished (1-2 sentences)
3. ACTION: Specific actions taken with relevant skills from the job description (3-4 sentences)
4. RESULT: Measurable outcome with metrics (2-3 sentences)

Format your response EXACTLY like this:
SITUATION:
[Situation description]

TASK:
[Task description]

ACTION:
[Action description]

RESULT:
[Result description]

KEY TERMS:
- [Term 1]
- [Term 2]
- [Term 3]
- [Term 4]
- [Term 5]

Include 5 key terms from the job description that are demonstrated in this answer. Be specific and use industry-relevant terminology.
`;

  // Question 2: Collaboration
  const collaboration_prompt = `
You are an interview coach helping a candidate prepare for the ${targetPosition} position.

Create a powerful STAR format response for this interview question: "Describe a situation where you had to collaborate with a difficult team member to achieve a goal."

The response should be relevant to this job description:
"${text}"

Provide a response with these 4 sections:
1. SITUATION: Brief description of the context (2-3 sentences)
2. TASK: What needed to be accomplished (1-2 sentences)
3. ACTION: Specific actions taken with relevant skills from the job description (3-4 sentences)
4. RESULT: Measurable outcome with metrics (2-3 sentences)

Format your response EXACTLY like this:
SITUATION:
[Situation description]

TASK:
[Task description]

ACTION:
[Action description]

RESULT:
[Result description]

KEY TERMS:
- [Term 1]
- [Term 2]
- [Term 3]
- [Term 4]
- [Term 5]

Include 5 key terms from the job description that are demonstrated in this answer. Be specific and use industry-relevant terminology.
`;

  // Question 3: Leadership
  const leadership_prompt = `
You are an interview coach helping a candidate prepare for the ${targetPosition} position.

Create a powerful STAR format response for this interview question: "Give an example of how you've demonstrated leadership or initiative in your previous roles."

The response should be relevant to this job description:
"${text}"

Provide a response with these 4 sections:
1. SITUATION: Brief description of the context (2-3 sentences)
2. TASK: What needed to be accomplished (1-2 sentences)
3. ACTION: Specific actions taken with relevant skills from the job description (3-4 sentences)
4. RESULT: Measurable outcome with metrics (2-3 sentences)

Format your response EXACTLY like this:
SITUATION:
[Situation description]

TASK:
[Task description]

ACTION:
[Action description]

RESULT:
[Result description]

KEY TERMS:
- [Term 1]
- [Term 2]
- [Term 3]
- [Term 4]
- [Term 5]

Include 5 key terms from the job description that are demonstrated in this answer. Be specific and use industry-relevant terminology.
`;

  try {
    // Execute all prompts in parallel for efficiency
    const [challengeResponse, collaborationResponse, leadershipResponse] =
      await Promise.all([
        retryAICall(challenge_prompt, finalModelConfig, 2),
        retryAICall(collaboration_prompt, finalModelConfig, 2),
        retryAICall(leadership_prompt, finalModelConfig, 2)
      ]);

    // Parse each response
    const interviewAnswers = [
      parseStarResponse(
        'Tell me about a time when you faced a significant challenge at work and how you overcame it.',
        challengeResponse
      ),
      parseStarResponse(
        'Describe a situation where you had to collaborate with a difficult team member to achieve a goal.',
        collaborationResponse
      ),
      parseStarResponse(
        'Give an example of how you\'ve demonstrated leadership or initiative in your previous roles.',
        leadershipResponse
      )
    ];

    // If any answers are incomplete, retry with more explicit feedback
    for (let i = 0; i < interviewAnswers.length; i++) {
      const answer = interviewAnswers[i];
      if (!isCompleteStarAnswer(answer)) {
        debugLog(`Interview answer ${i+1} incomplete, retrying with feedback...`);
        try {
          const retryPrompt = createRetryPromptForAnswer(answer.question, text, targetPosition);
          const retryResponse = await retryAICall(retryPrompt, finalModelConfig);
          const retryAnswer = parseStarResponse(answer.question, retryResponse);

          // Merge any missing parts from the retry into the original answer
          if (retryAnswer.situation && !answer.situation) answer.situation = retryAnswer.situation;
          if (retryAnswer.task && !answer.task) answer.task = retryAnswer.task;
          if (retryAnswer.action && !answer.action) answer.action = retryAnswer.action;
          if (retryAnswer.result && !answer.result) answer.result = retryAnswer.result;
          if (retryAnswer.keyTerms.length > 0 && answer.keyTerms.length === 0) answer.keyTerms = retryAnswer.keyTerms;
        } catch (error) {
          debugError(`Retry for interview answer ${i+1} failed:`, error);
        }
      }
    }

    return interviewAnswers;
  } catch (error) {
    debugError('Error generating interview answers with simplified prompts:', error);
    // Return empty array if all attempts fail
    return [];
  }
}

// Parse STAR response with flexible pattern matching
function parseStarResponse(question, text) {
  if (!text) {
    return {
      question,
      situation: '',
      task: '',
      action: '',
      result: '',
      keyTerms: []
    };
  }

  debugLog('Parsing STAR response with flexible pattern matching for:', question);

  const answer = {
    question,
    situation: '',
    task: '',
    action: '',
    result: '',
    keyTerms: []
  };

  // Try multiple pattern matching approaches

  // 1. First try to match sections using standard headings
  const situationMatch = text.match(/SITUATION:?\s*([^]*?)(?=TASK:|$)/i);
  if (situationMatch) answer.situation = situationMatch[1].trim();

  const taskMatch = text.match(/TASK:?\s*([^]*?)(?=ACTION:|$)/i);
  if (taskMatch) answer.task = taskMatch[1].trim();

  const actionMatch = text.match(/ACTION:?\s*([^]*?)(?=RESULT:|$)/i);
  if (actionMatch) answer.action = actionMatch[1].trim();

  const resultMatch = text.match(/RESULT:?\s*([^]*?)(?=KEY TERMS:|$)/i);
  if (resultMatch) answer.result = resultMatch[1].trim();

  // Extract key terms with flexible pattern matching
  const keyTermsSection = text.match(/KEY TERMS:?\s*([^]*?)$/i);
  if (keyTermsSection) {
    const keyTermsText = keyTermsSection[1];
    answer.keyTerms = extractBulletPoints(keyTermsText);
  }

  // 2. If sections are missing, try to extract them from the text based on context clues
  if (!answer.situation || !answer.task || !answer.action || !answer.result) {
    // Split the text into paragraphs
    const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);

    // If we have at least 4 paragraphs and missing some sections, assume they might be in order
    if (paragraphs.length >= 4) {
      if (!answer.situation) answer.situation = paragraphs[0];
      if (!answer.task) answer.task = paragraphs[1];
      if (!answer.action) answer.action = paragraphs[2];
      if (!answer.result) answer.result = paragraphs[3];
    }
  }

  debugLog('Parsed STAR response:', {
    hasSituation: !!answer.situation,
    hasTask: !!answer.task,
    hasAction: !!answer.action,
    hasResult: !!answer.result,
    keyTermsCount: answer.keyTerms.length
  });

  return answer;
}

// Split cover letter generation into smaller tasks
async function generateCoverLetterInternal(text, targetPosition, companyName, finalModelConfig) {
  debugLog('Generating cover letter with simplified prompts...');

  // First generate the main content
  const contentPrompt = `
You are a professional cover letter writer specializing in personalized job applications.

Create a compelling, personalized cover letter for the ${targetPosition} position at ${companyName}.

JOB DESCRIPTION:
"${text}"

The cover letter should:
1. Start with a strong, attention-grabbing opening paragraph
2. Connect specific qualifications to the job requirements
3. Demonstrate knowledge of the company
4. Use professional but conversational tone
5. Be approximately 3-4 paragraphs long

Format your response as a complete cover letter WITHOUT any headings, introductions, or explanations.
Do NOT include your own comments or any text that isn't part of the actual cover letter.
`;

  // Then generate highlights in a separate prompt
  const highlightsPrompt = `
You are a career coach who helps job seekers identify their strongest selling points.

Based on this job description for a ${targetPosition} position at ${companyName}, identify 5 key highlights that should be emphasized in a cover letter.

JOB DESCRIPTION:
"${text}"

Provide EXACTLY 5 bullet points that represent the most compelling qualifications or experiences that should be highlighted.
Each highlight should be concise (8-12 words) and specific.

Format your response as a simple bulleted list starting with dashes (-).
Do NOT include any introductions, explanations, or conclusions.
`;

  // Finally generate a call to action
  const callToActionPrompt = `
You are a professional cover letter writer specializing in strong closing statements.

Create a compelling call to action for the final paragraph of a cover letter for the ${targetPosition} position at ${companyName}.

JOB DESCRIPTION:
"${text}"

The call to action should:
1. Express enthusiasm for an interview
2. Show confidence without being presumptuous
3. Be one clear, concise sentence (15-25 words)
4. End on a positive, forward-looking note

Provide ONLY the call to action sentence without any explanation or additional text.
`;

  try {
    // Execute all prompts in parallel for efficiency
    const [contentResponse, highlightsResponse, callToActionResponse] =
      await Promise.all([
        retryAICall(contentPrompt, finalModelConfig, 2),
        retryAICall(highlightsPrompt, finalModelConfig, 2),
        retryAICall(callToActionPrompt, finalModelConfig, 2)
      ]);

    // Parse responses
    const coverLetterContent = contentResponse ? contentResponse.trim() : '';
    const highlights = extractBulletPoints(highlightsResponse);
    const callToAction = callToActionResponse ? callToActionResponse.trim() : '';

    // If any section is empty, retry with more explicit feedback
    let finalContent = coverLetterContent;
    let finalHighlights = highlights;
    let finalCallToAction = callToAction;

    // Retry content if empty
    if (!finalContent || finalContent.length < 100) {
      debugLog('Cover letter content missing or too short, retrying...');
      try {
        const retryPrompt = `
You did not provide a complete cover letter. Please create a professional cover letter for the ${targetPosition} position at ${companyName} based on this job description:

"${text}"

Write a complete cover letter of 3-4 paragraphs. Do NOT include any headings, introductions, or explanations - ONLY the actual letter content.
`;
        const retryResponse = await retryAICall(retryPrompt, finalModelConfig);
        if (retryResponse && retryResponse.length > 100) {
          finalContent = retryResponse.trim();
        }
      } catch (error) {
        debugError('Retry for cover letter content failed:', error);
      }
    }

    // Retry highlights if empty
    if (finalHighlights.length === 0) {
      debugLog('Cover letter highlights missing, retrying...');
      try {
        const retryPrompt = `
You did not provide any highlights for the cover letter. Based on this job description for a ${targetPosition} position at ${companyName}, provide EXACTLY 5 key selling points that should be emphasized.

JOB DESCRIPTION:
"${text}"

Format your response as a simple bulleted list with 5 items starting with dashes (-). Each highlight should be 8-12 words and specific.
`;
        const retryResponse = await retryAICall(retryPrompt, finalModelConfig);
        const retryHighlights = extractBulletPoints(retryResponse);
        if (retryHighlights.length > 0) {
          finalHighlights = retryHighlights;
        }
      } catch (error) {
        debugError('Retry for cover letter highlights failed:', error);
      }
    }

    // Retry call to action if empty
    if (!finalCallToAction || finalCallToAction.length < 10) {
      debugLog('Cover letter call to action missing or too short, retrying...');
      try {
        const retryPrompt = `
You did not provide a call to action for the cover letter. Create a single compelling sentence that expresses interest in an interview for the ${targetPosition} position at ${companyName}.

Provide ONLY the call to action sentence (15-25 words) without any explanation.
`;
        const retryResponse = await retryAICall(retryPrompt, finalModelConfig);
        if (retryResponse && retryResponse.length > 10) {
          finalCallToAction = retryResponse.trim();
        }
      } catch (error) {
        debugError('Retry for cover letter call to action failed:', error);
      }
    }

    // If we still don't have highlights, extract them from the content
    if (finalHighlights.length === 0 && finalContent) {
      debugLog('Still missing highlights, extracting from content...');
      const sentences = finalContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
      finalHighlights = sentences.slice(0, 5).map(s => s.trim());
    }

    // If we still don't have a call to action, extract it from the content
    if (!finalCallToAction && finalContent) {
      debugLog('Still missing call to action, extracting from content...');
      const sentences = finalContent.split(/[.!?]+/).filter(s => s.trim().length > 15 && s.trim().length < 100);
      const lastSentences = sentences.slice(-3);

      // Look for sentences that might be calls to action
      for (const sentence of lastSentences) {
        if (sentence.toLowerCase().includes('interview') ||
            sentence.toLowerCase().includes('discuss') ||
            sentence.toLowerCase().includes('contact') ||
            sentence.toLowerCase().includes('opportunity')) {
          finalCallToAction = sentence.trim() + '.';
          break;
        }
      }

      // If still nothing, just use the last sentence
      if (!finalCallToAction && lastSentences.length > 0) {
        finalCallToAction = lastSentences[lastSentences.length - 1].trim() + '.';
      }
    }

    return {
      content: finalContent,
      highlights: finalHighlights,
      callToAction: finalCallToAction
    };
  } catch (error) {
    console.error('Error generating cover letter with simplified prompts:', error);
    // Return empty values if all attempts fail
    return {
      content: '',
      highlights: [],
      callToAction: ''
    };
  }
}

// Check if a STAR answer is complete
function isCompleteStarAnswer(answer) {
  return (
    answer.situation &&
    answer.situation.length > 10 &&
    answer.task &&
    answer.task.length > 10 &&
    answer.action &&
    answer.action.length > 10 &&
    answer.result &&
    answer.result.length > 10 &&
    answer.keyTerms.length > 0
  );
}

// Create a retry prompt for an incomplete answer
function createRetryPromptForAnswer(question, jobDescription, targetPosition) {
  return `
You previously provided an incomplete STAR format answer to this interview question: "${question}"

I need you to provide a COMPLETE answer with ALL of these sections for the ${targetPosition} position:
1. SITUATION: Brief description of the context (2-3 sentences)
2. TASK: What needed to be accomplished (1-2 sentences)
3. ACTION: Specific actions taken with relevant skills (3-4 sentences)
4. RESULT: Measurable outcome with metrics (2-3 sentences)
5. KEY TERMS: At least 5 relevant terms from the job description

The job description is:
"${jobDescription}"

Format your response EXACTLY like this:
SITUATION:
[Situation description]

TASK:
[Task description]

ACTION:
[Action description]

RESULT:
[Result description]

KEY TERMS:
- [Term 1]
- [Term 2]
- [Term 3]
- [Term 4]
- [Term 5]

Do NOT include any explanations, introductions, or conclusions - ONLY the formatted STAR response.
`;
}

// Extract bullet points with more flexible pattern matching
function extractBulletPoints(text) {
  if (!text) return [];

  debugLog('Extracting bullet points with flexible pattern matching from:', text.substring(0, 100) + '...');

  // Try multiple pattern matching approaches
  let bulletPoints = [];

  // 1. First try to match standard bullet points with dashes
  const dashBullets = text.match(/^\s*-\s*(.+)$/gm);
  if (dashBullets && dashBullets.length > 0) {
    bulletPoints = dashBullets.map(bullet => bullet.replace(/^\s*-\s*/, '').trim());
  }

  // 2. If that doesn't work, try matching numbered lists
  if (bulletPoints.length === 0) {
    const numberedBullets = text.match(/^\s*\d+\.?\s*(.+)$/gm);
    if (numberedBullets && numberedBullets.length > 0) {
      bulletPoints = numberedBullets.map(bullet => bullet.replace(/^\s*\d+\.?\s*/, '').trim());
    }
  }

  // 3. If still nothing, try matching any non-empty lines with reasonable length
  if (bulletPoints.length === 0) {
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 10 && line.length < 200); // Reasonable length for a bullet point

    if (lines.length > 0) {
      bulletPoints = lines;
    }
  }

  // 4. If we have too many, limit to a reasonable number
  if (bulletPoints.length > 10) {
    bulletPoints = bulletPoints.slice(0, 10);
  }

  // 5. Remove any duplicates
  bulletPoints = [...new Set(bulletPoints)];

  debugLog(`Extracted ${bulletPoints.length} bullet points`);
  return bulletPoints;
}

// Handle empty sections with retry logic and specific feedback
async function handleEmptySections({ hiddenRequirements, keyPhrases, culturalIndicators, recommendations, text, finalModelConfig }) {
  const retryResults = {};
  const retryPromises = [];

  // Check each section and retry if empty
  if (hiddenRequirements.length === 0) {
    debugLog('No hidden requirements found, retrying with feedback...');
    retryPromises.push(
      retryAICall(`You did not provide any hidden requirements. Based on this job description, please identify EXACTLY 5 hidden requirements - skills or qualifications that aren't explicitly stated but implied.

JOB DESCRIPTION:
"${text}"

Provide your response as a simple bulleted list starting with dashes (-) without any introduction or explanation.`, finalModelConfig)
        .then(response => {
          retryResults.hiddenRequirements = extractBulletPoints(response);
        })
        .catch(error => {
          debugError('Retry for hidden requirements failed:', error);
        })
    );
  }

  if (keyPhrases.length === 0) {
    debugLog('No key phrases found, retrying with feedback...');
    retryPromises.push(
      retryAICall(`You did not provide any key phrases. Based on this job description, please identify EXACTLY 8 key phrases or industry terminology that should be included in a strong application.

JOB DESCRIPTION:
"${text}"

Provide your response as a simple bulleted list starting with dashes (-) without any introduction or explanation.`, finalModelConfig)
        .then(response => {
          retryResults.keyPhrases = extractBulletPoints(response);
        })
        .catch(error => {
          debugError('Retry for key phrases failed:', error);
        })
    );
  }

  if (culturalIndicators.length === 0) {
    debugLog('No cultural indicators found, retrying with feedback...');
    retryPromises.push(
      retryAICall(`You did not provide any cultural indicators. Based on this job description, please identify EXACTLY 5 cultural indicators - phrases that reveal the company's values, work style, and team dynamics.

JOB DESCRIPTION:
"${text}"

Provide your response as a simple bulleted list starting with dashes (-) without any introduction or explanation.`, finalModelConfig)
        .then(response => {
          retryResults.culturalIndicators = extractBulletPoints(response);
        })
        .catch(error => {
          debugError('Retry for cultural indicators failed:', error);
        })
    );
  }

  if (recommendations.length === 0) {
    debugLog('No recommendations found, retrying with feedback...');
    retryPromises.push(
      retryAICall(`You did not provide any recommendations. Based on this job description, please provide EXACTLY 5 specific recommendations for how the candidate should customize their application.

JOB DESCRIPTION:
"${text}"

Provide your response as a simple bulleted list starting with dashes (-) without any introduction or explanation.`, finalModelConfig)
        .then(response => {
          retryResults.recommendations = extractBulletPoints(response);
        })
        .catch(error => {
          debugError('Retry for recommendations failed:', error);
        })
    );
  }

  // Wait for all retry attempts to complete
  if (retryPromises.length > 0) {
    await Promise.all(retryPromises);
  }

  return retryResults;
}

// Resume enhancement
const enhanceResume = async (req, res) => {
  try {
    const { text, targetJob, experienceLevel, modelConfig } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Resume text is required' });
    }

    const prompt = `Please enhance the following resume for a ${targetJob || 'professional'} position at the ${experienceLevel || 'mid-level'} experience level. Focus on:

1. Optimizing action verbs and quantifiable achievements
2. Aligning with industry keywords and job requirements
3. Improving clarity and impact of bullet points
4. Ensuring consistent formatting and professional tone

Format your response as follows:

**ENHANCED RESUME:**
[Provide the complete enhanced resume here]

**IMPROVEMENT NOTES:**
- [List 3-5 key improvements made]
- [Highlight any sections that needed major revision]

Original resume:
"${text}"`;

    // Set default model configuration if none provided
    const defaultModelConfig = {
      provider: 'ollama',
      model: 'gemma3:1b'
    };

    const finalModelConfig = modelConfig || defaultModelConfig;

    let response;
    response = await callUnifiedAI(prompt, finalModelConfig);

    // Parse the response
    const enhancedTextMatch = response.match(/\*\*ENHANCED RESUME:\*\*\s*([\s\S]*?)\s*\*\*IMPROVEMENT NOTES:\*\*/i);
    const notesMatch = response.match(/\*\*IMPROVEMENT NOTES:\*\*([\s\S]*)/i);

    const enhancedText = enhancedTextMatch ? enhancedTextMatch[1].trim() : text;
    const improvementNotes = notesMatch ? notesMatch[1].trim() : 'No specific improvements identified.';

    res.json({
      source: 'AI Career Assistant',
      originalText: text,
      enhancedText: enhancedText,
      improvementNotes: improvementNotes,
      targetJob: targetJob || 'Professional',
      experienceLevel: experienceLevel || 'Mid-level',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Resume enhancement error:', error.message);
    res.status(500).json({ error: `Failed to enhance resume: ${error.message}` });
  }
};

// Extract achievements from resume
const extractAchievements = async (req, res) => {
  try {
    const { text, targetJob, companyName, modelConfig } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Resume text is required' });
    }

    const prompt = `Achievement Transformer

Convert the following basic job responsibilities into powerful achievement statements with specific metrics, challenges overcome, and business impact that grab recruiters' attention.

JOB POSITION: ${targetJob || 'Professional Role'}
COMPANY: ${companyName || 'Company'}

RESUME:
"${text}"

For each responsibility, provide:
1. A quantified result statement with specific metrics, numbers, or percentages
2. Challenges that were overcome
3. Business impact and value delivered
4. Strong action verbs

Format your response as a numbered list with each achievement on two lines:
- Original bullet point
- Enhanced version with quantifiable results

Example format:
1. Managed social media accounts
   Led social media strategy for 3 accounts, increasing engagement by 40% and growing followers by 25K in 6 months through targeted content campaigns
`;

    // Set default model configuration if none provided
    const defaultModelConfig = {
      provider: 'ollama',
      model: 'gemma3:1b'
    };

    const finalModelConfig = modelConfig || defaultModelConfig;

    let response;
    response = await callUnifiedAI(prompt, finalModelConfig);

    // Parse achievements
    const achievements = [];
    const lines = response.split('\n').filter(line => line.trim());

    for (let i = 0; i < lines.length; i += 2) {
      if (lines[i] && lines[i + 1]) {
        achievements.push({
          original: lines[i].replace(/^[\d\.\s]+/, '').trim(),
          enhanced: lines[i + 1].replace(/^[\d\.\s]+/, '').trim()
        });
      }
    }

    res.json({
      source: 'AI Career Assistant',
      achievements: achievements.length > 0 ? achievements : [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Achievements extraction error:', error.message);
    res.status(500).json({ error: `Failed to extract achievements: ${error.message}` });
  }
};

// Cover letter generation
const generateCoverLetter = async (req, res) => {
  try {
    const { resume, jobDescription, companyName, targetPosition, tone = 'professional', modelConfig } = req.body;

    if (!resume || !jobDescription) {
      return res.status(400).json({ error: 'Both resume and job description are required' });
    }

    const prompt = `Cover Letter Generator

Create a compelling cover letter for the position at the company that connects specific experience to their needs, demonstrates cultural fit, and includes a strong call to action that gets the application noticed.

POSITION: ${targetPosition || 'Role'}
COMPANY: ${companyName || 'Company'}

JOB DESCRIPTION:
"${jobDescription}"

RESUME INFORMATION:
"${resume}"

The cover letter should:
1. Be written in a ${tone} tone
2. Connect specific experience from the resume to key requirements in the job description
3. Demonstrate cultural fit and knowledge of the company
4. Include a strong call to action for next steps
5. Be approximately 3-4 paragraphs long

Format your response as follows:

**COVER LETTER:**
[Provide the complete cover letter here]
`;

    // Set default model configuration if none provided
    const defaultModelConfig = {
      provider: 'ollama',
      model: 'gemma3:1b'
    };

    const finalModelConfig = modelConfig || defaultModelConfig;

    let response;
    response = await callUnifiedAI(prompt, finalModelConfig);

    // Parse the response
    const letterMatch = response.match(/\*\*COVER LETTER:\*\*\s*([\s\S]*)/i);
    const coverLetter = letterMatch ? letterMatch[1].trim() : '';

    res.json({
      source: 'AI Career Assistant',
      coverLetter: coverLetter,
      companyName: companyName || 'The Company',
      targetPosition: targetPosition || 'Role',
      tone: tone,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cover letter generation error:', error.message);
    res.status(500).json({ error: `Failed to generate cover letter: ${error.message}` });
  }
};

// LinkedIn summary enhancement
const enhanceLinkedInSummary = async (req, res) => {
  try {
    const { text, industry, experienceLevel, modelConfig } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'LinkedIn summary text is required' });
    }

    const prompt = `Please enhance the following LinkedIn summary for someone in the ${industry || 'professional'} industry at the ${experienceLevel || 'mid-level'} experience level. Focus on:

1. Creating a compelling personal brand statement
2. Highlighting unique value proposition and expertise
3. Including relevant keywords for searchability
4. Maintaining a professional yet approachable tone
5. Keeping it concise (150-300 words)

Format your response as follows:

**ENHANCED SUMMARY:**
[Provide the complete enhanced LinkedIn summary here]

**KEY IMPROVEMENTS:**
- [List 2-3 key improvements made]

Original summary:
"${text}"`;

    // Set default model configuration if none provided
    const defaultModelConfig = {
      provider: 'ollama',
      model: 'gemma3:1b'
    };

    const finalModelConfig = modelConfig || defaultModelConfig;

    let response;
    response = await callUnifiedAI(prompt, finalModelConfig);

    // Parse the response
    const enhancedTextMatch = response.match(/\*\*ENHANCED SUMMARY:\*\*\s*([\s\S]*?)\s*\*\*KEY IMPROVEMENTS:\*\*/i);
    const improvementsMatch = response.match(/\*\*KEY IMPROVEMENTS:\*\*([\s\S]*)/i);

    const enhancedText = enhancedTextMatch ? enhancedTextMatch[1].trim() : text;
    const keyImprovements = improvementsMatch ? improvementsMatch[1].trim() : 'No specific improvements identified.';

    res.json({
      source: 'AI Career Assistant',
      originalText: text,
      enhancedText: enhancedText,
      keyImprovements: keyImprovements,
      industry: industry || 'Professional',
      experienceLevel: experienceLevel || 'Mid-level',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('LinkedIn summary enhancement error:', error.message);
    res.status(500).json({ error: `Failed to enhance LinkedIn summary: ${error.message}` });
  }
};

// Job application analysis
const analyzeJobDescription = async (req, res) => {
  try {
    const { text, targetPosition, companyName, modelConfig } = req.body;

    const targetPositionText = targetPosition || 'the position';
    const companyNameText = companyName || 'the company';

    if (!text) {
      return res.status(400).json({ error: 'Job description text is required' });
    }

    debugLog('Processing job description:', text.substring(0, 100) + '...');
    debugLog('Target position:', targetPositionText);
    debugLog('Company name:', companyNameText);
    debugLog('Model config:', JSON.stringify(modelConfig, null, 2));

    // Set default model configuration if none provided
    const defaultModelConfig = {
      provider: 'ollama',
      model: 'gemma3:1b'
    };

    const finalModelConfig = modelConfig || defaultModelConfig;
    debugLog('Final model config being used:', JSON.stringify(finalModelConfig, null, 2));

    // Use our new specialized functions for each component
    debugLog('Calling specialized functions for job analysis components...');

    // Process all three components in parallel
    const [analysisResults, coverLetterResults, interviewAnswers] = await Promise.all([
      generateJobAnalysis(text, finalModelConfig),
      generateCoverLetterInternal(text, targetPositionText, companyNameText, finalModelConfig),
      generateInterviewAnswers(text, targetPositionText, finalModelConfig)
    ]);

    debugLog('All components generated successfully');
    debugLog('Analysis results:', {
      hiddenRequirementsCount: analysisResults.hiddenRequirements.length,
      keyPhrasesCount: analysisResults.keyPhrases.length,
      culturalIndicatorsCount: analysisResults.culturalIndicators.length,
      recommendationsCount: analysisResults.recommendations.length
    });
    debugLog('Cover letter content length:', coverLetterResults.content.length);
    debugLog('Interview answers count:', interviewAnswers.length);

    // Enhanced debugging before sending the response
    debugLog('DEBUG - hiddenRequirements:', analysisResults.hiddenRequirements);
    debugLog('DEBUG - keyPhrases:', analysisResults.keyPhrases);
    debugLog('DEBUG - culturalIndicators:', analysisResults.culturalIndicators);
    debugLog('DEBUG - recommendations:', analysisResults.recommendations);
    debugLog('DEBUG - coverLetterContent length:', coverLetterResults.content.length);
    debugLog('DEBUG - coverLetterHighlights:', coverLetterResults.highlights);
    debugLog('DEBUG - callToAction:', coverLetterResults.callToAction);
    debugLog('DEBUG - interviewAnswers count:', interviewAnswers.length);

    // Create a response object with at least minimal content in each section
    const responseData = {
      success: true,
      data: {
        analysis: {
          hiddenRequirements: analysisResults.hiddenRequirements.slice(0, 10),
          keyPhrases: analysisResults.keyPhrases.slice(0, 15),
          culturalIndicators: analysisResults.culturalIndicators.slice(0, 10),
          recommendations: analysisResults.recommendations.slice(0, 10)
        },
        coverLetter: {
          content: coverLetterResults.content || 'Dear Hiring Manager,\n\nI\'m excited to apply for the position with your company. My experience and skills align well with your requirements.\n\nI look forward to discussing how I can contribute to your team.\n\nSincerely,\n[Your Name]',
          highlights: coverLetterResults.highlights.length > 0 ? coverLetterResults.highlights.slice(0, 10) : ['Tailored to the position', 'Showcases relevant experience', 'Professional tone'],
          callToAction: coverLetterResults.callToAction || 'I would welcome the opportunity to discuss how my background would benefit your team.'
        },
        interviewPrep: {
          answers: interviewAnswers.length > 0 ? interviewAnswers : [
            {
              question: 'Tell me about a time when you faced a significant challenge at work and how you overcame it.',
              situation: 'While working on a critical compliance project with a tight deadline, we encountered unexpected regulatory changes that threatened to derail our entire framework.',
              task: 'As the legal counsel responsible for the project, I needed to quickly adapt our compliance strategy while ensuring we remained on schedule for the implementation deadline.',
              action: 'I immediately organized a cross-functional emergency meeting with key stakeholders, created a tiered priority system for addressing the changes, and delegated specific research tasks to team members based on their expertise. I personally took on the most complex regulatory interpretations and developed a revised implementation timeline with buffers for potential additional changes.',
              result: 'We successfully updated our compliance framework to incorporate all regulatory changes and actually delivered the project two days ahead of the revised schedule. The solution was so effective that it was adopted as a template for future regulatory adaptation scenarios across the organization.',
              keyTerms: ['Regulatory compliance', 'Crisis management', 'Cross-functional leadership', 'Adaptive planning', 'Legal expertise']
            },
            {
              question: 'Describe a situation where you had to collaborate with a difficult team member to achieve a goal.',
              situation: 'During a critical legal review of a new product launch, I was paired with a senior technical lead who was dismissive of legal constraints and regularly pushed back on necessary compliance requirements.',
              task: 'I needed to find a way to effectively collaborate with this individual to ensure the product met all regulatory requirements without creating unnecessary friction or delaying the launch timeline.',
              action: 'Rather than engaging in confrontation, I scheduled one-on-one sessions to better understand their product vision and technical constraints. I took time to explain the reasoning behind legal requirements in technical terms they could appreciate, and worked to find creative technical solutions that satisfied both legal requirements and their design goals. I also involved them early in the compliance process rather than presenting requirements as afterthoughts.',
              result: 'Over time, our working relationship improved significantly. The technical lead began proactively consulting me on legal implications earlier in the development cycle. The product launched on time with full compliance, and we established a new collaborative approach that was implemented for future product releases.',
              keyTerms: ['Stakeholder management', 'Conflict resolution', 'Cross-functional collaboration', 'Technical communication', 'Regulatory compliance']
            },
            {
              question: 'Give an example of how you\'ve demonstrated leadership or initiative in your previous roles.',
              situation: 'I noticed our legal team was spending excessive time on repetitive contract reviews that followed predictable patterns, causing bottlenecks in business operations.',
              task: 'Without being asked, I decided to find a more efficient approach that would maintain legal protection while accelerating the review process.',
              action: 'I analyzed six months of contract reviews to identify common patterns and issues, then developed a tiered review system with standardized templates and clause libraries for different risk levels. I created comprehensive guidelines for business teams to pre-assess contracts, and implemented a training program to help them understand basic legal requirements. For higher-risk contracts, I developed a specialized checklist approach for our legal team.',
              result: 'This initiative reduced routine contract review time by 65% while maintaining the quality of legal protection. Business teams gained valuable legal knowledge, and our legal department could focus more on strategic matters. My system was adopted company-wide and I was recognized with an innovation award for the initiative.',
              keyTerms: ['Process improvement', 'Legal operations', 'Initiative', 'Knowledge sharing', 'Resource optimization']
            }
          ]
        },
        targetPosition: targetPositionText,
        companyName: companyNameText,
        timestamp: new Date().toISOString()
      }
    };

    // Log the final data structure for verification
    debugLog('Final response data structure:');
    debugLog('- Analysis hidden requirements count:', responseData.data.analysis.hiddenRequirements.length);
    debugLog('- Analysis key phrases count:', responseData.data.analysis.keyPhrases.length);
    debugLog('- Analysis cultural indicators count:', responseData.data.analysis.culturalIndicators.length);
    debugLog('- Analysis recommendations count:', responseData.data.analysis.recommendations.length);
    debugLog('- Cover letter content length:', responseData.data.coverLetter.content.length);
    debugLog('- Cover letter highlights count:', responseData.data.coverLetter.highlights.length);
    debugLog('- Interview answers count:', responseData.data.interviewPrep.answers.length);

    if (responseData.data.interviewPrep.answers.length > 0) {
      const firstAnswer = responseData.data.interviewPrep.answers[0];
      debugLog('- First interview answer structure:', {
        hasQuestion: !!firstAnswer.question,
        hasSituation: !!firstAnswer.situation && firstAnswer.situation.length > 0,
        hasTask: !!firstAnswer.task && firstAnswer.task.length > 0,
        hasAction: !!firstAnswer.action && firstAnswer.action.length > 0,
        hasResult: !!firstAnswer.result && firstAnswer.result.length > 0,
        hasKeyTerms: !!firstAnswer.keyTerms && firstAnswer.keyTerms.length > 0
      });
    }

    debugLog('Sending response with data structure:', Object.keys(responseData.data));
    res.json(responseData);
  } catch (error) {
    debugError('Job description analysis error:', error);
    // Log the full error stack for debugging
    debugError('Full error stack:', error.stack);

    // Return a more detailed error response
    const errorMessage = error.message || 'Failed to analyze job description';
    res.status(500).json({
      error: errorMessage,
      // Include additional debugging information in development
      ...(process.env.NODE_ENV !== 'production' && {
        debug: {
          name: error.name,
          stack: error.stack
        }
      })
    });
  }
};

// Interview preparation
const prepareInterviewAnswers = async (req, res) => {
  try {
    const { resume, jobDescription, modelConfig } = req.body;

    if (!resume || !jobDescription) {
      return res.status(400).json({ error: 'Both resume and job description are required' });
    }

    const prompt = `Interview Answer Builder

Craft powerful STAR-format responses for 5 common interview questions, incorporating relevant experience from the resume and key terms from the job description.

JOB DESCRIPTION:
"${jobDescription}"

RESUME:
"${resume}"

Create responses for these five common questions:
1. Tell me about yourself.
2. What are your strengths?
3. What are your weaknesses?
4. Why do you want to work here?
5. Where do you see yourself in 5 years?

For each question, provide a STAR-format response with:
1. Situation: Brief description of the context
2. Task: What needed to be accomplished
3. Action: Specific actions taken with relevant skills from the job description
4. Result: Measurable outcome or impact with metrics

Format your response as a numbered list with each answer in this format:
1. [Question]
   [Answer with STAR format]

Example format:
1. Tell me about yourself.
   As a software engineer with 5 years of experience, I've developed expertise in full-stack development and team leadership. In my current role at TechCorp, I led a team of 4 developers to deliver a customer portal that increased user engagement by 40%. I'm passionate about creating scalable solutions and mentoring junior developers.`;

    // Set default model configuration if none provided
    const defaultModelConfig = {
      provider: 'ollama',
      model: 'gemma3:1b'
    };

    const finalModelConfig = modelConfig || defaultModelConfig;

    let response;
    response = await callUnifiedAI(prompt, finalModelConfig);

    // Parse interview answers
    const answers = [];
    const lines = response.split('\n').filter(line => line.trim());

    let currentQuestion = '';
    let currentAnswer = '';

    for (const line of lines) {
      if (/^\d+\.\s/.test(line)) {
        if (currentQuestion && currentAnswer) {
          answers.push({
            question: currentQuestion,
            answer: currentAnswer.trim()
          });
        }
        const parts = line.split('.');
        currentQuestion = parts.slice(1).join('.').trim();
        currentAnswer = '';
      } else if (currentQuestion) {
        currentAnswer += line + '\n';
      }
    }

    // Add the last question
    if (currentQuestion && currentAnswer) {
      answers.push({
        question: currentQuestion,
        answer: currentAnswer.trim()
      });
    }

    res.json({
      source: 'AI Career Assistant',
      answers: answers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Interview preparation error:', error.message);
    res.status(500).json({ error: `Failed to prepare interview answers: ${error.message}` });
  }
};

// Extract keywords from text
const extractKeywordsController = async (req, res) => {
  try {
    const { text, modelConfig } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Use the career service function
    const keywords = extractKeywords(text);

    res.json({
      source: 'AI Career Assistant',
      keywords: keywords,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Keyword extraction error:', error.message);
    res.status(500).json({ error: `Failed to extract keywords: ${error.message}` });
  }
};

// Optimize resume
const optimizeResumeController = async (req, res) => {
  try {
    console.log('=== optimizeResumeController START ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request file:', req.file);

    // Handle both file upload and text input
    let resumeText = req.body.resumeText;
    const { jobDescription, modelConfig } = req.body;

    console.log('Initial values - resumeText:', resumeText, 'jobDescription:', jobDescription);
    console.log('modelConfig:', JSON.stringify(modelConfig, null, 2));
    console.log('modelConfig type:', typeof modelConfig);

    // If we have a file upload, extract text from the PDF
    if (req.file) {
      try {
        console.log('Extracting text from uploaded PDF file:', req.file.filename);
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdf(dataBuffer);
        resumeText = pdfData.text.trim();
        console.log('PDF text extracted successfully, length:', resumeText.length);
        console.log('First 200 characters:', resumeText.substring(0, 200));
      } catch (error) {
        console.error('Error extracting PDF text:', error);
        return res.status(400).json({ error: 'Failed to extract text from PDF file' });
      }
    }

    console.log('After file handling - resumeText:', resumeText);

    // Validate required fields
    if (!resumeText) {
      console.log('Resume text is missing');
      return res.status(400).json({ error: 'Resume text is required' });
    }

    if (!jobDescription) {
      console.log('Job description is missing');
      return res.status(400).json({ error: 'Job description is required' });
    }

    console.log('Both resumeText and jobDescription are present');

    // Handle model configuration
    let finalModelConfig;
    if (modelConfig && typeof modelConfig === 'object') {
      // modelConfig is already parsed
      finalModelConfig = modelConfig;
      console.log('Using parsed modelConfig directly');
    } else if (modelConfig && typeof modelConfig === 'string') {
      // modelConfig is a JSON string, parse it
      try {
        finalModelConfig = JSON.parse(modelConfig);
        console.log('Parsed modelConfig from string');
      } catch (parseError) {
        console.error('Error parsing modelConfig string:', parseError);
        finalModelConfig = {
          provider: 'ollama',
          model: 'gemma3:1b'
        };
      }
    } else {
      // Use default model configuration
      finalModelConfig = {
        provider: 'ollama',
        model: 'gemma3:1b'
      };
      console.log('Using default modelConfig');
    }

    console.log('Final model config:', JSON.stringify(finalModelConfig, null, 2));

    // Use the career service function
    console.log('Calling optimizeResume service function');
    const optimizedResult = await optimizeResume(resumeText, jobDescription, finalModelConfig);
    console.log('optimizeResume service function completed');
    console.log('Result structure:', JSON.stringify(Object.keys(optimizedResult), null, 2));

    // Send the structured response format that matches frontend expectations
    res.json({
      source: optimizedResult.source || 'AI Career Assistant',
      originalText: resumeText,
      optimizedResume: optimizedResult.optimizedResume,
      type: 'resume',
      success: true,
      timestamp: new Date().toISOString()
    });
    console.log('=== optimizeResumeController END SUCCESS ===');
  } catch (error) {
    console.error('=== optimizeResumeController ERROR ===');
    console.error('Resume optimization error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error', message: 'An unexpected error occurred' });
  }
};

// Generate interview answer
const generateInterviewAnswerController = async (req, res) => {
  try {
    const { resume, jobDescription, question, modelConfig } = req.body;

    if (!resume || !jobDescription || !question) {
      return res.status(400).json({ error: 'Resume, job description, and question are all required' });
    }

    // Set default model configuration if none provided
    const defaultModelConfig = {
      provider: 'ollama',
      model: 'gemma3:1b'
    };

    const finalModelConfig = modelConfig || defaultModelConfig;

    // Use the career service function
    const interviewAnswer = await generateInterviewAnswer(resume, jobDescription, question, finalModelConfig);

    res.json({
      source: 'AI Career Assistant',
      question: question,
      answer: interviewAnswer,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Interview answer generation error:', error.message);
    res.status(500).json({ error: `Failed to generate interview answer: ${error.message}` });
  }
};

// ATS Optimizer
const atsOptimizerController = async (req, res) => {
  try {
    const { resumeText, jobDescription, modelConfig } = req.body;

    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: 'Both resume text and job description are required' });
    }

    // Set default model configuration if none provided
    const defaultModelConfig = {
      provider: 'ollama',
      model: 'gemma3:1b'
    };

    const finalModelConfig = modelConfig || defaultModelConfig;

    // Use the career service function
    const atsOptimized = await runATSOptimizer(resumeText, jobDescription, finalModelConfig);

    res.json({
      source: 'AI Career Assistant',
      atsOptimized: atsOptimized,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('ATS optimization error:', error.message);
    res.status(500).json({ error: `Failed to optimize for ATS: ${error.message}` });
  }
};

// Achievement Transformer
const achievementTransformerController = async (req, res) => {
  try {
    const { resumeText, roleInfo, modelConfig } = req.body;

    if (!resumeText) {
      return res.status(400).json({ error: 'Resume text is required' });
    }

    // Set default model configuration if none provided
    const defaultModelConfig = {
      provider: 'ollama',
      model: 'gemma3:1b'
    };

    const finalModelConfig = modelConfig || defaultModelConfig;

    // Use the career service function
    const transformedAchievements = await runAchievementTransformer(resumeText, roleInfo, finalModelConfig);

    res.json({
      source: 'AI Career Assistant',
      transformedAchievements: transformedAchievements,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Achievement transformation error:', error.message);
    res.status(500).json({ error: `Failed to transform achievements: ${error.message}` });
  }
};

module.exports = {
  enhanceResume,
  extractAchievements,
  generateCoverLetter,
  enhanceLinkedInSummary,
  analyzeJobDescription,
  prepareInterviewAnswers,
  extractKeywordsController,
  optimizeResumeController,
  generateInterviewAnswerController,
  atsOptimizerController,
  achievementTransformerController
};
