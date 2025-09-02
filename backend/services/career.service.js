const { callUnifiedAI } = require('./ai.service');
const nlp = require('compromise');
// Note: All career tool functions are now implemented locally in this file
// const { ... } = require('./careerToolsService'); // Removed to avoid conflicts

/**
 * Career-related services for resume optimization and job assistance
 */

// Extract keywords from text
function extractKeywords(text) {
  try {
    const doc = nlp(text);

    // Extract nouns, adjectives, and important verbs
    const nouns = doc.nouns().out('array');
    const adjectives = doc.adjectives().out('array');
    const verbs = doc.verbs().out('array');

    // Filter for relevant keywords (longer than 2 characters)
    const keywords = [...nouns, ...adjectives, ...verbs]
      .filter(word => word.length > 2)
      .map(word => word.toLowerCase())
      .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
      .slice(0, 20); // Limit to top 20

    return keywords;
  } catch (error) {
    console.error('Keyword extraction error:', error);
    return [];
  }
}

// Parse achievements from AI response
function parseAchievements(response) {
  try {
    // Look for numbered lists or bullet points
    const lines = response.split('\n').filter(line => line.trim());
    const achievements = [];

    // Track original and enhanced pairs
    let currentOriginal = null;

    lines.forEach(line => {
      // Match patterns like "1.", "•", "-", etc.
      if (/^\s*[\d•\-\*]/.test(line)) {
        const achievement = line.replace(/^\s*[\d•\-\*\.\)\s]+/, '').trim();
        if (achievement.length > 10) {
          // Check if this looks like an original responsibility or an enhanced achievement
          if (currentOriginal === null) {
            // This might be an original responsibility
            currentOriginal = achievement;
          } else {
            // This is likely the enhanced version
            achievements.push({
              original: currentOriginal,
              enhanced: achievement
            });
            currentOriginal = null;
          }
        }
      }
    });

    // If we have any leftover original items, create a basic enhanced version
    if (currentOriginal && achievements.length === 0) {
      achievements.push({
        original: currentOriginal,
        enhanced: `Enhanced version of: ${currentOriginal} with quantifiable metrics and stronger action verbs`
      });
    }

    // If no achievements were parsed, try a different approach
    if (achievements.length === 0) {
      // Look for any lines that seem like they could be achievements
      lines.forEach(line => {
        if (line.length > 20 && !line.startsWith('**') && !line.includes('provide') && !line.includes('format')) {
          // Skip lines that look like instructions or headers
          if (!line.toLowerCase().includes('example') && !line.toLowerCase().includes('resume') &&
              !line.toLowerCase().includes('job') && !line.toLowerCase().includes('description')) {
            achievements.push({
              original: line.trim(),
              enhanced: `Enhanced version: ${line.trim()} with specific metrics and business impact`
            });
          }
        }
      });
    }

    if (achievements.length === 0) {
      throw new Error('No achievements could be extracted from the resume. Please ensure your resume contains clear accomplishments and responsibilities.');
    }

    return achievements.slice(0, 10);
  } catch (error) {
    console.error('Achievement parsing error:', error);
    throw new Error('Failed to parse achievements from resume. Please check that your resume contains clear accomplishments and try again.');
  }
}

// Parse job analysis from AI response
function parseJobAnalysis(response) {
  try {
    // Extract hidden requirements
    const hiddenRequirements = [];
    const requirementsMatch = response.match(/Hidden requirements[\s\S]*?(?=\n{2}|$)/i);
    if (requirementsMatch) {
      const requirementsText = requirementsMatch[0];
      const requirementLines = requirementsText.split('\n');
      requirementLines.forEach(line => {
        if (/^\s*[\d\-\*\•]/.test(line) || line.includes(':')) {
          const requirement = line.replace(/^[\d\-\*\•\s\.:]+/, '').trim();
          if (requirement.length > 5) {
            hiddenRequirements.push(requirement);
          }
        }
      });
    }

    // Extract key phrases
    const keyPhrases = [];
    const phrasesMatch = response.match(/Key phrases[\s\S]*?(?=\n{2}|$)/i);
    if (phrasesMatch) {
      const phrasesText = phrasesMatch[0];
      const phraseLines = phrasesText.split('\n');
      phraseLines.forEach(line => {
        if (/^\s*[\d\-\*\•]/.test(line) || line.includes(':')) {
          const phrase = line.replace(/^[\d\-\*\•\s\.:]+/, '').trim();
          if (phrase.length > 5) {
            keyPhrases.push(phrase);
          }
        }
      });
    }

    // Extract recommendations
    const recommendations = [];
    const recommendationsMatch = response.match(/Recommendations[\s\S]*?(?=\n{2}|$)/i);
    if (recommendationsMatch) {
      const recommendationsText = recommendationsMatch[0];
      const recommendationLines = recommendationsText.split('\n');
      recommendationLines.forEach(line => {
        if (/^\s*[\d\-\*\•]/.test(line) || line.includes(':')) {
          const recommendation = line.replace(/^[\d\-\*\•\s\.:]+/, '').trim();
          if (recommendation.length > 5) {
            recommendations.push(recommendation);
          }
        }
      });
    }

    return {
      summary: response.substring(0, 500),
      keyRequirements: hiddenRequirements.length > 0 ? hiddenRequirements : extractKeywords(response),
      recommendations: recommendations.length > 0 ? recommendations : response.split('\n').filter(line =>
        line.includes('recommend') || line.includes('suggest') || line.includes('should')
      ).slice(0, 5)
    };
  } catch (error) {
    console.error('Job analysis parsing error:', error);
    return { summary: '', keyRequirements: [], recommendations: [] };
  }
}

// Extract key phrases from text
function extractKeyPhrases(text) {
  const doc = nlp(text);
  return doc.match('#Noun+ #Adjective?').out('array').slice(0, 10);
}

// Parse interview answers from AI response
function parseInterviewAnswers(response) {
  try {
    const sections = response.split(/\n\s*\n/);
    const answers = [];

    sections.forEach(section => {
      if (section.trim().length > 50) {
        // Look for question-answer patterns
        const lines = section.split('\n');
        if (lines.length >= 2) {
          const question = lines[0].replace(/^\s*[\d•\-\*\.\)\s]*/, '').trim();
          const answer = lines.slice(1).join(' ').trim();

          if (question.includes('?') && answer.length > 20) {
            answers.push({ question, answer });
          }
        }
      }
    });

    return answers.slice(0, 5);
  } catch (error) {
    console.error('Interview answer parsing error:', error);
    return [];
  }
}

// Optimize resume for ATS
async function optimizeResume(resumeText, jobDescription, modelConfig = null) {
  try {
    console.log('=== optimizeResume START ===');
    console.log('Input resumeText length:', resumeText?.length || 0);
    console.log('Input jobDescription length:', jobDescription?.length || 0);
    console.log('Input modelConfig:', JSON.stringify(modelConfig, null, 2));
    console.log('Input modelConfig type:', typeof modelConfig);

    // Validate inputs
    if (!resumeText || typeof resumeText !== 'string') {
      throw new Error('Invalid resume text provided: ' + typeof resumeText);
    }

    if (!jobDescription || typeof jobDescription !== 'string') {
      throw new Error('Invalid job description provided: ' + typeof jobDescription);
    }

    // Check for empty or whitespace-only inputs
    if (resumeText.trim().length === 0) {
      throw new Error('Resume text cannot be empty');
    }

    if (jobDescription.trim().length === 0) {
      throw new Error('Job description cannot be empty');
    }

    const prompt = `ATS Resume Optimizer

Optimize this resume to pass through Applicant Tracking Systems (ATS) while maintaining all original content and achievements.

RESUME:
"${resumeText}"

TARGET JOB DESCRIPTION:
"${jobDescription}"

Instructions:
1. Preserve all original content and achievements
2. Incorporate relevant keywords from the job description naturally
3. Use standard section headers that ATS recognizes
4. Maintain clean formatting without complex layouts
5. Quantify achievements where possible
6. Use standard action verbs

Format your response EXACTLY as follows with clear section breaks:

**OPTIMIZED RESUME:**
[Provide ONLY the optimized resume text here. DO NOT include any section headers, formatting markers, "CHANGES MADE", or "KEYWORDS ADDED" sections within this content.]

**CHANGES MADE:**
- [List 3-5 key improvements you made to the resume]

**KEYWORDS ADDED:**
- [List 5-8 keywords you incorporated from the job description]

IMPORTANT: 
- The OPTIMIZED RESUME section should contain ONLY the resume text with no additional formatting or section markers
- Do NOT include "**CHANGES MADE:**" or "**KEYWORDS ADDED:**" within the optimized resume content
- Do NOT include any other sections or text in the OPTIMIZED RESUME section
- Keep section headers exactly as shown: **OPTIMIZED RESUME:**, **CHANGES MADE:**, **KEYWORDS ADDED:**`;

    // Handle model configuration
    let finalModelConfig;
    if (modelConfig && typeof modelConfig === 'object') {
      // modelConfig is already parsed
      finalModelConfig = modelConfig;
      console.log('Using parsed modelConfig directly in service');
    } else if (modelConfig && typeof modelConfig === 'string') {
      // modelConfig is a JSON string, parse it
      try {
        finalModelConfig = JSON.parse(modelConfig);
        console.log('Parsed modelConfig from string in service');
      } catch (parseError) {
        console.error('Error parsing modelConfig string in service:', parseError);
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
      console.log('Using default modelConfig in service');
    }

    console.log('Calling AI service with prompt length:', prompt.length);
    console.log('Using final model config:', JSON.stringify(finalModelConfig, null, 2));

    // Validate that we have a valid prompt
    if (prompt.length === 0) {
      throw new Error('Generated prompt is empty');
    }

    console.log('About to call callUnifiedAI');
    const response = await callUnifiedAI(prompt, finalModelConfig);
    console.log('AI service response received, length:', response?.length || 0);

    // Validate response
    if (response === undefined || response === null) {
      throw new Error('AI service returned undefined or null response');
    }

    // Parse the response
    // First, check if the response contains our expected format markers
    const optimizedTextMatch = response.match(/\*\*OPTIMIZED RESUME:\*\*\s*([\s\S]*?)(?=\*\*CHANGES MADE:|$)/i);
    const changesMatch = response.match(/\*\*CHANGES MADE:\*\*\s*([\s\S]*?)(?=\*\*KEYWORDS ADDED:|$)/i);
    const keywordsMatch = response.match(/\*\*KEYWORDS ADDED:\*\*\s*([\s\S]*)/i);

    console.log('Response parsing results:');
    console.log('optimizedTextMatch:', optimizedTextMatch ? 'FOUND' : 'NOT FOUND');
    console.log('changesMatch:', changesMatch ? 'FOUND' : 'NOT FOUND');
    console.log('keywordsMatch:', keywordsMatch ? 'FOUND' : 'NOT FOUND');
    console.log('Full response:', response);

    // Extract the content or use defaults
    let optimizedText = '';
    if (optimizedTextMatch) {
      console.log('Raw optimizedTextMatch[1]:', optimizedTextMatch[1]);
      // Remove any remaining formatting markers that might have been included
      optimizedText = optimizedTextMatch[1].trim()
        .replace(/\*\*KEYWORDS ADDED:\*\*[\s\S]*$/i, '') // Remove any keywords section that was incorrectly included
        .replace(/\*\*CHANGES MADE:\*\*[\s\S]*$/i, '') // Remove any changes section that was incorrectly included
        .replace(/\*\*OPTIMIZED RESUME:\*\*/gi, '') // Remove any duplicate headers that might have been included
        .replace(/\*\*.*\*\*/g, '') // Remove any remaining bold markers
        .trim();
      console.log('Cleaned optimizedText:', optimizedText);
    } else {
      optimizedText = response;
      console.log('Using full response as optimizedText');
    }

    const changesText = changesMatch ? changesMatch[1].trim() : '';
    const keywordsText = keywordsMatch ? keywordsMatch[1].trim() : '';
    console.log('changesText:', changesText);
    console.log('keywordsText:', keywordsText);

    // Parse changes and keywords into arrays with careful filtering
    const changes = changesText.split('\n')
      .map(line => line.replace(/^\s*-\s*/, '').trim())
      .filter(line => {
        // Filter out empty lines, formatting markers, and any content that doesn't belong
        const isValid = line.length > 0 &&
           !line.includes('**') &&
           !line.match(/^\*\*KEYWORDS ADDED:\*\*/i) &&
           !line.toLowerCase().includes('keywords added') &&
           !line.toLowerCase().includes('optimized resume') &&
           line.replace(/^\s*-\s*/, '').trim().length > 0;
        console.log('Change line filter result:', isValid, 'Line:', line);
        return isValid;
      });

    const keywords = keywordsText.split('\n')
      .map(line => line.replace(/^\s*-\s*/, '').trim())
      .filter(line => {
        // Filter out empty lines and any lines that look like they belong to changes
        const isValid = line.length > 0 &&
           !line.includes('**') &&
           !line.match(/^\*\*CHANGES MADE:\*\*/i) &&
           !line.toLowerCase().includes('changes made') &&
           !line.toLowerCase().includes('optimized resume') &&
           !line.match(/^\d+\.\s+/) && // Numbered list items likely from changes
           !line.match(/^standardized section headers/i) && // Common change item
           !line.match(/^incorporated relevant keywords/i) && // Common change item
           !line.match(/^quantified achievements/i) && // Common change item
           !line.match(/^improved clarity/i) && // Common change item
           !line.match(/^used standard action/i) && // Common change item
           line.replace(/^\s*-\s*/, '').trim().length > 0;
        console.log('Keyword line filter result:', isValid, 'Line:', line);
        return isValid;
      });

    console.log('Final parsed changes:', changes);
    console.log('Final parsed keywords:', keywords);

    // Additional cleaning to ensure no section headers remain in the optimized text
    optimizedText = optimizedText
      .replace(/\*\*CHANGES MADE:\*\*/gi, '')
      .replace(/\*\*KEYWORDS ADDED:\*\*/gi, '')
      .replace(/\*\*.*\*\*/g, '') // Remove any other bold markers
      .trim();

    // Create a structured response object that matches frontend expectations
    // Add fallback handling for when sections are not properly parsed
    const structuredResponse = {
      optimizedResume: {
        content: optimizedText || resumeText, // Fallback to original resume if parsing failed
        changes: changes.length > 0 ? changes : [
          'Incorporated relevant keywords from the job description',
          'Standardized section headers for better ATS recognition',
          'Improved action verbs for stronger impact',
          'Quantified achievements where possible',
          'Optimized formatting for ATS parsing'
        ],
        keywords: keywords.length > 0 ? keywords : extractKeywords(jobDescription).slice(0, 8),
        atsScore: 85 // Default score
      },
      success: true,
      type: 'resume',
      source: 'AI Career Assistant',
      originalText: resumeText,
      timestamp: new Date().toISOString()
    };

    console.log('Final structured response:', JSON.stringify(structuredResponse, null, 2));
    console.log('=== optimizeResume END SUCCESS ===');
    return structuredResponse;
  } catch (error) {
    console.error('=== optimizeResume ERROR ===');
    console.error('ATS optimization error:', error);
    console.error('Error stack:', error.stack);
    throw new Error(`Failed to optimize resume for ATS: ${error.message}`);
  }
}

// Generate interview answer
async function generateInterviewAnswer(resume, jobDescription, question, modelConfig = null) {
  try {
    const prompt = `Interview Answer Generator

Create a compelling STAR-format (Situation, Task, Action, Result) response to the interview question using relevant experience from the resume and aligning with key requirements from the job description.

INTERVIEW QUESTION:
"${question}"

RESUME:
"${resume}"

JOB DESCRIPTION:
"${jobDescription}"

Instructions:
1. Use the STAR format (Situation, Task, Action, Result)
2. Incorporate specific examples from the resume
3. Align with key requirements from the job description
4. Include quantifiable results where possible
5. Keep the response concise but detailed (3-5 sentences)
6. Use professional language

Return ONLY the interview answer without any additional formatting or explanations.`;

    const defaultModelConfig = modelConfig || {
      provider: 'ollama',
      model: 'gemma3:1b'
    };

    const response = await callUnifiedAI(prompt, defaultModelConfig);
    return response;
  } catch (error) {
    console.error('Interview answer generation error:', error);
    throw new Error(`Failed to generate interview answer: ${error.message}`);
  }
}

// Run ATS optimizer
async function runATSOptimizer(resume, jobDescription, modelConfig = null) {
  try {
    const prompt = `ATS Resume Optimizer

Optimize this resume to pass through Applicant Tracking Systems (ATS) while maintaining all original content and achievements.

RESUME:
"${resume}"

TARGET JOB DESCRIPTION:
"${jobDescription}"

Instructions:
1. Preserve all original content and achievements
2. Incorporate relevant keywords from the job description naturally
3. Use standard section headers that ATS recognizes
4. Maintain clean formatting without complex layouts
5. Quantify achievements where possible
6. Use standard action verbs

Return ONLY the optimized resume text without any additional formatting or explanations.`;

    const defaultModelConfig = modelConfig || {
      provider: 'ollama',
      model: 'gemma3:1b'
    };

    const response = await callUnifiedAI(prompt, defaultModelConfig);
    return response;
  } catch (error) {
    console.error('ATS optimization error:', error);
    throw new Error(`Failed to run ATS optimizer: ${error.message}`);
  }
}

// Run achievement transformer
async function runAchievementTransformer(resume, roleInfo, modelConfig = null) {
  try {
    const prompt = `Achievement Transformer

Convert the following basic job responsibilities into powerful achievement statements with specific metrics, challenges overcome, and business impact that grab recruiters' attention.

ROLE INFORMATION:
"${roleInfo}"

RESUME:
"${resume}"

Instructions:
1. Transform each responsibility into an achievement-focused statement
2. Include specific metrics, numbers, or percentages where possible
3. Highlight challenges that were overcome
4. Emphasize business impact and value delivered
5. Use strong action verbs
6. Keep each achievement concise but impactful

Return ONLY the transformed achievements as a list without any additional formatting or explanations.`;

    const defaultModelConfig = modelConfig || {
      provider: 'ollama',
      model: 'gemma3:1b'
    };

    const response = await callUnifiedAI(prompt, defaultModelConfig);
    return response;
  } catch (error) {
    console.error('Achievement transformation error:', error);
    throw new Error(`Failed to transform achievements: ${error.message}`);
  }
}

// Run format conversion
async function runFormatConversion(resume, modelConfig = null) {
  try {
    const prompt = `Resume Format Converter

Convert the following resume into a clean, professional format that is optimized for both ATS systems and human readability.

RESUME:
"${resume}"

Instructions:
1. Organize content into clear, standard sections
2. Use standard section headers that ATS recognizes
3. Maintain clean formatting without complex layouts
4. Ensure consistent formatting throughout
5. Preserve all original content and achievements
6. Use bullet points for better readability

Return ONLY the formatted resume without any additional formatting or explanations.`;

    const defaultModelConfig = modelConfig || {
      provider: 'ollama',
      model: 'gemma3:1b'
    };

    const response = await callUnifiedAI(prompt, defaultModelConfig);
    return response;
  } catch (error) {
    console.error('Format conversion error:', error);
    throw new Error(`Failed to convert resume format: ${error.message}`);
  }
}

// Run job decoder
async function runJobDecoder(jobDescription, modelConfig = null) {
  try {
    const prompt = `Job Description Decoder

Analyze this job posting and identify the hidden requirements, actual expectations, and specific phrases that indicate what the hiring manager truly values beyond the stated qualifications.

JOB DESCRIPTION:
"${jobDescription}"

Instructions:
1. Identify hidden requirements not explicitly stated
2. List key phrases that should be mirrored in application materials
3. Note cultural indicators about the company
4. Provide actionable recommendations for applicants

Return ONLY the analysis in a clear, structured format without any additional formatting or explanations.`;

    const defaultModelConfig = modelConfig || {
      provider: 'ollama',
      model: 'gemma3:1b'
    };

    const response = await callUnifiedAI(prompt, defaultModelConfig);
    return response;
  } catch (error) {
    console.error('Job decoding error:', error);
    throw new Error(`Failed to decode job description: ${error.message}`);
  }
}

// Run cover letter generator
async function runCoverLetter(resume, jobDescription, modelConfig = null) {
  try {
    const prompt = `Cover Letter Generator

Create a compelling cover letter that connects specific experience from the resume to key requirements in the job description, demonstrates cultural fit, and includes a strong call to action.

RESUME:
"${resume}"

JOB DESCRIPTION:
"${jobDescription}"

Instructions:
1. Start with a strong, personalized opening
2. Connect specific qualifications to key requirements
3. Demonstrate cultural fit and knowledge of the company
4. Include a strong call to action for next steps
5. Maintain professional but conversational tone
6. Keep it approximately 3-4 paragraphs long

Return ONLY the cover letter without any additional formatting or explanations.`;

    const defaultModelConfig = modelConfig || {
      provider: 'ollama',
      model: 'gemma3:1b'
    };

    const response = await callUnifiedAI(prompt, defaultModelConfig);
    return response;
  } catch (error) {
    console.error('Cover letter generation error:', error);
    throw new Error(`Failed to generate cover letter: ${error.message}`);
  }
}

// Run interview builder
async function runInterviewBuilder(resume, question, jobDescription, modelConfig = null) {
  try {
    const prompt = `Interview Answer Builder

Craft a powerful STAR-format (Situation, Task, Action, Result) response to the interview question using relevant experience from the resume and aligning with key requirements from the job description.

QUESTION:
"${question}"

RESUME:
"${resume}"

JOB DESCRIPTION:
"${jobDescription}"

Instructions:
1. Use the STAR format (Situation, Task, Action, Result)
2. Incorporate specific examples from the resume
3. Align with key requirements from the job description
4. Include quantifiable results where possible
5. Keep the response concise but detailed (3-5 sentences)
6. Use professional language

Return ONLY the interview answer without any additional formatting or explanations.`;

    const defaultModelConfig = modelConfig || {
      provider: 'ollama',
      model: 'gemma3:1b'
    };

    const response = await callUnifiedAI(prompt, defaultModelConfig);
    return response;
  } catch (error) {
    console.error('Interview building error:', error);
    throw new Error(`Failed to build interview answer: ${error.message}`);
  }
}

// Run career tools orchestration function
async function runCareerTools(selectedFeatures, inputs, modelConfig = null) {
  const results = {};

  if (selectedFeatures.includes('atsOptimization')) {
    results.atsOptimization = await runATSOptimizer(inputs.resume, inputs.jobDescription, modelConfig);
  }
  if (selectedFeatures.includes('achievementTransformer')) {
    results.achievementTransformer = await runAchievementTransformer(inputs.resume, inputs.roleInfo, modelConfig);
  }
  if (selectedFeatures.includes('formatConversion')) {
    results.formatConversion = await runFormatConversion(inputs.resume, modelConfig);
  }
  if (selectedFeatures.includes('jobDecoder')) {
    results.jobDecoder = await runJobDecoder(inputs.jobDescription, modelConfig);
  }
  if (selectedFeatures.includes('coverLetter')) {
    results.coverLetter = await runCoverLetter(inputs.resume, inputs.jobDescription, modelConfig);
  }
  if (selectedFeatures.includes('interviewBuilder')) {
    results.interviewBuilder = await runInterviewBuilder(inputs.resume, inputs.question, inputs.jobDescription, modelConfig);
  }

  return results;
}

// Extract match score from AI response
function extractMatchScore(response) {
  try {
    const scoreMatch = response.match(/(?:match|score|rating).*?(\d{1,3})(?:%|\s*(?:out of|\/)\s*100)?/i);
    if (scoreMatch) {
      const score = parseInt(scoreMatch[1]);
      return score <= 100 ? score : Math.min(score, 100);
    }
    return 75; // Default score
  } catch (error) {
    return 75;
  }
}

// Generate cover letter
async function generateCoverLetter(resumeText, jobDescription, companyName, targetPosition, modelConfig) {
  try {
    const prompt = `Cover Letter Generator

Create a compelling cover letter for the position at the company that connects specific experience to their needs, demonstrates cultural fit, and includes a strong call to action that gets the application noticed.

POSITION: ${targetPosition || 'Role'}
COMPANY: ${companyName || 'Company'}

JOB DESCRIPTION:
"${jobDescription}"

RESUME INFORMATION:
"${resumeText}"

The cover letter should:
1. Connect specific experience from the resume to key requirements in the job description
2. Demonstrate cultural fit and knowledge of the company
3. Include a strong call to action for next steps
4. Be approximately 3-4 paragraphs long
5. Be written in a professional tone

Format your response as follows:

**COVER LETTER:**
[Provide the complete cover letter here]
`;

    // Set default model configuration if none provided
    const defaultModelConfig = modelConfig || {
      provider: 'ollama',
      model: 'gemma3:1b'
    };

    const response = await callUnifiedAI(prompt, defaultModelConfig);

    // Parse the response
    const letterMatch = response.match(/\*\*COVER LETTER:\*\*\s*([\s\S]*)/i);
    return letterMatch ? letterMatch[1].trim() : response;
  } catch (error) {
    console.error('Cover letter generation error:', error);
    throw new Error(`Failed to generate cover letter: ${error.message}`);
  }
}

// Extract cover letter outline from AI response
function extractCoverLetterOutline(response) {
  try {
    const lines = response.split('\n');
    const outline = [];
    let inCoverLetterSection = false;

    lines.forEach(line => {
      // Look for cover letter section headers
      if (line.toLowerCase().includes('cover letter') || line.toLowerCase().includes('coverletter')) {
        inCoverLetterSection = true;
        return;
      }

      // If we're in the cover letter section, look for bullet points or numbered items
      if (inCoverLetterSection) {
        // Stop if we hit a new section (indicated by a line starting with a capital letter)
        if (/^[A-Z][a-z]/.test(line.trim()) && line.trim().length > 10) {
          // Only stop if it's not just a continuation of the current section
          if (!line.includes(':') && outline.length > 0) {
            inCoverLetterSection = false;
            return;
          }
        }

        // Extract bullet points or numbered items
        if (/^\s*[\d•\-\*]/.test(line)) {
          const point = line.replace(/^\s*[\d•\-\*\.\)\s]+/, '').trim();
          if (point.length > 10) {
            outline.push(point);
          }
        }

        // Also capture lines that look like they're part of a list but don't have markers
        if (outline.length > 0 && line.trim().length > 15 && !/^[A-Z]/.test(line.trim())) {
          // Check if this line seems to continue the previous point
          const lastPoint = outline[outline.length - 1];
          if (lastPoint && !lastPoint.endsWith('.') && !line.trim().startsWith('-')) {
            outline[outline.length - 1] = lastPoint + ' ' + line.trim();
          }
        }
      }
    });

    return outline.length > 0 ? outline.slice(0, 8) : ['Include specific achievements from your experience', 'Highlight relevant skills from the job description', 'Show enthusiasm for the company and role', 'End with a strong call to action'];
  } catch (error) {
    console.error('Cover letter outline parsing error:', error);
    return ['Include specific achievements from your experience', 'Highlight relevant skills from the job description', 'Show enthusiasm for the company and role', 'End with a strong call to action'];
  }
}

// Extract interview questions from AI response
function extractInterviewQuestions(response) {
  try {
    const questions = [];
    const lines = response.split('\n');

    lines.forEach(line => {
      // Look for lines that contain question marks and are long enough to be meaningful
      if (line.includes('?') && line.length > 20 && line.length < 300) {
        // Clean up the line to extract just the question
        const question = line.replace(/^[\d•\-\*\.\)\s]+/, '').trim();
        if (question.includes('?') && question.length > 20) {
          questions.push(question);
        }
      }

      // Also look for explicitly labeled interview questions
      if (line.toLowerCase().includes('interview question') && line.includes(':')) {
        const question = line.split(':').slice(1).join(':').trim();
        if (question.includes('?') && question.length > 20) {
          questions.push(question);
        }
      }
    });

    // If we didn't find any questions, provide some generic ones
    if (questions.length === 0) {
      return [
        'Can you describe a challenging project you worked on and how you overcame obstacles?',
        'How do you stay current with developments in AI and blockchain technology?',
        'Tell me about a time you had to navigate complex regulatory requirements.',
        'How would you approach working in a fully distributed team across multiple time zones?'
      ];
    }

    return questions.slice(0, 10);
  } catch (error) {
    console.error('Interview question parsing error:', error);
    return [
      'Can you describe a challenging project you worked on and how you overcame obstacles?',
      'How do you stay current with developments in AI and blockchain technology?',
      'Tell me about a time you had to navigate complex regulatory requirements.',
      'How would you approach working in a fully distributed team across multiple time zones?'
    ];
  }
}

// Generate career insights
function generateCareerInsights(resumeText, jobMarketData) {
  try {
    const keywords = extractKeywords(resumeText);
    const keyPhrases = extractKeyPhrases(resumeText);

    // Analyze skill gaps (simplified)
    const commonSkills = ['javascript', 'python', 'react', 'node', 'sql', 'aws', 'docker', 'git'];
    const missingSkills = commonSkills.filter(skill =>
      !keywords.some(keyword => keyword.toLowerCase().includes(skill))
    );

    return {
      currentSkills: keywords,
      keyPhrases,
      missingSkills: missingSkills.slice(0, 5),
      recommendations: [
        'Consider adding quantified achievements',
        'Include relevant technical skills',
        'Optimize for ATS scanning',
        'Tailor content to target roles'
      ]
    };
  } catch (error) {
    console.error('Career insights error:', error);
    return {
      currentSkills: [],
      keyPhrases: [],
      missingSkills: [],
      recommendations: []
    };
  }
}

// Skill gap analysis
function analyzeSkillGaps(currentSkills, targetRole) {
  try {
    const roleSkillMap = {
      'frontend developer': ['react', 'vue', 'angular', 'javascript', 'typescript', 'css', 'html'],
      'backend developer': ['node.js', 'python', 'java', 'sql', 'mongodb', 'api', 'microservices'],
      'full stack developer': ['react', 'node.js', 'javascript', 'sql', 'mongodb', 'api', 'git'],
      'data scientist': ['python', 'r', 'sql', 'machine learning', 'statistics', 'pandas', 'numpy'],
      'devops engineer': ['aws', 'docker', 'kubernetes', 'jenkins', 'terraform', 'linux', 'git']
    };

    const requiredSkills = roleSkillMap[targetRole.toLowerCase()] || [];
    const currentSkillsLower = currentSkills.map(skill => skill.toLowerCase());

    const gaps = requiredSkills.filter(skill =>
      !currentSkillsLower.some(current => current.includes(skill))
    );

    const matches = requiredSkills.filter(skill =>
      currentSkillsLower.some(current => current.includes(skill))
    );

    return {
      requiredSkills,
      currentMatches: matches,
      skillGaps: gaps,
      matchPercentage: Math.round((matches.length / requiredSkills.length) * 100)
    };
  } catch (error) {
    console.error('Skill gap analysis error:', error);
    return {
      requiredSkills: [],
      currentMatches: [],
      skillGaps: [],
      matchPercentage: 0
    };
  }
}

module.exports = {
  extractKeywords,
  parseAchievements,
  parseJobAnalysis,
  extractKeyPhrases,
  parseInterviewAnswers,
  optimizeResume,
  generateInterviewAnswer,
  generateCoverLetter,
  extractMatchScore,
  extractCoverLetterOutline,
  extractInterviewQuestions,
  generateCareerInsights,
  analyzeSkillGaps,
  runATSOptimizer,
  runAchievementTransformer,
  runFormatConversion,
  runJobDecoder,
  runCoverLetter,
  runInterviewBuilder,
  runCareerTools
};
