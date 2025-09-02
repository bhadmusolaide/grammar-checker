const { callUnifiedAI } = require('./ai.service');

// LLM call wrapper using the unified AI service
async function callLLM(systemPrompt, userPrompt, modelConfig = null) {
  // Use default model config with proper fallback if none provided
  const defaultModelConfig = modelConfig || {
    provider: 'ollama',
    model: 'gemma3:1b'
  };

  // Log the model configuration being used
  console.log('Using model config:', {
    provider: defaultModelConfig.provider,
    model: defaultModelConfig.model,
    hasApiKey: !!defaultModelConfig.apiKey
  });

  // Combine system and user prompts for the unified AI service
  const combinedPrompt = systemPrompt + '\n\n' + userPrompt;

  return await callUnifiedAI(combinedPrompt, defaultModelConfig);
}

// =========================
// Resume Optimizer Features
// =========================
// Note: All functions are now implemented in career.service.js

async function runAchievementTransformer(resume, roleInfo, modelConfig = null) {
  const system = 'You are a resume coach who turns duties into quantified achievements. Return results in Markdown with these sections only: ### Original Duties ### Reframed Achievements (STAR format: Situation, Task, Action, Result)';
  const user = 'Role: ' + roleInfo + '\nOriginal Resume Text:\n' + resume + '\n\nTask: Rewrite each responsibility into achievement-focused bullets with metrics or impact.';
  return await callLLM(system, user, modelConfig);
}

async function runFormatConversion(resume, modelConfig = null) {
  const system = 'You are a professional resume formatter. Convert resumes into clean, modern sections. Always return results in Markdown with these sections: ### Professional Resume Format ### Formatting Notes';
  const user = 'Convert the following resume into a professional modern format:\n' + resume;
  return await callLLM(system, user, modelConfig);
}

// ================================
// Job Application Assistant Features
// ================================

async function runJobDecoder(jobDescription, modelConfig = null) {
  const system = 'You are a hiring manager reading between the lines of job descriptions. Return results in Markdown with these sections: ### Key Skills & Experience ### Hidden Requirements ### Red Flags or Unusual Phrases ### Phrases to Mirror in Resume/Cover Letter';
  const user = 'Job Description:\n' + jobDescription + '\n\nTask: Analyze and decode what the company actually values, not just what they wrote.';
  return await callLLM(system, user, modelConfig);
}

async function runCoverLetter(resume, jobDescription, modelConfig = null) {
  const system = 'You are a hiring manager writing a tailored, persuasive cover letter. Always use professional but approachable tone. Return results in Markdown with these sections: ### Cover Letter Draft ### Tailoring Notes';
  const user = 'Candidate Resume:\n' + resume + '\n\nJob Description:\n' + jobDescription + '\n\nTask: Write a cover letter tailored to this role, linking candidate\'s experience to company needs. End with a strong call to action.';
  return await callLLM(system, user, modelConfig);
}

async function runInterviewBuilder(resume, question, jobDescription, modelConfig = null) {
  const system = 'You are an interview coach. You build STAR (Situation, Task, Action, Result) stories that are concise and compelling. Return results in Markdown with these sections only: ### Interview Question ### STAR Answer';
  const user = 'Question:\n' + question + '\n\nCandidate Resume:\n' + resume + '\n\nJob Description:\n' + jobDescription + '\n\nTask: Craft a STAR-format response using resume evidence and aligning to the job description.';
  return await callLLM(system, user, modelConfig);
}

// =========================
// Orchestration Function
// =========================

async function runCareerTools(selectedFeatures, inputs, modelConfig = null) {
  const results = {};

  if (selectedFeatures.includes('atsOptimization')) {
    // Note: runATSOptimizer is now implemented in career.service.js
    // We need to import it if we want to use it here
    const { runATSOptimizer } = require('./career.service');
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

module.exports = {
  runAchievementTransformer,
  runFormatConversion,
  runJobDecoder,
  runCoverLetter,
  runInterviewBuilder,
  runCareerTools
};
