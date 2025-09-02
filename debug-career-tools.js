const { callUnifiedAI } = require('./backend/services/ai.service');

async function debugCareerTools() {
  try {
    console.log('Testing career tools job description analysis...');
    
    // Sample job description that might cause issues
    const jobDescription = `Software Engineer - AI/ML
    
We are seeking a talented Software Engineer with expertise in AI/ML to join our innovative team. The ideal candidate will have experience with machine learning frameworks, cloud platforms, and modern software development practices.

Key Responsibilities:
- Design and implement machine learning models
- Collaborate with cross-functional teams to deliver AI-powered solutions
- Optimize algorithms for performance and scalability
- Participate in code reviews and technical discussions

Requirements:
- Bachelor's degree in Computer Science or related field
- 3+ years of experience in software development
- Proficiency in Python, TensorFlow, and cloud platforms (AWS/GCP)
- Experience with containerization technologies (Docker, Kubernetes)
- Strong problem-solving skills and attention to detail`;

    // Use the same prompt as in the career controller
    const jobAnalysisPrompt = `Job Description Decoder

You are a senior career coach specializing in analyzing job descriptions to uncover hidden requirements and key insights that help candidates stand out.

Analyze this job posting and identify the hidden requirements, actual expectations, and specific phrases that indicate what the hiring manager truly values beyond the stated qualifications.

JOB DESCRIPTION:
"${jobDescription}"

Please provide your analysis in the following format ONLY:

**HIDDEN REQUIREMENTS:**
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]
- [Requirement 4]
- [Requirement 5]

**KEY PHRASES:**
- [Phrase 1]
- [Phrase 2]
- [Phrase 3]
- [Phrase 4]
- [Phrase 5]
- [Phrase 6]
- [Phrase 7]
- [Phrase 8]

**CULTURAL INDICATORS:**
- [Indicator 1]
- [Indicator 2]
- [Indicator 3]
- [Indicator 4]
- [Indicator 5]

**RECOMMENDATIONS:**
- [Recommendation 1]
- [Recommendation 2]
- [Recommendation 3]
- [Recommendation 4]
- [Recommendation 5]

It is CRITICAL that you provide at least 3 items in each section, even if you need to infer information from the job description.`;

    // Test with the default model config that's used in career tools
    const modelConfig = {
      provider: 'ollama',
      model: 'gemma3:1b'
    };

    console.log('Calling Ollama with gemma3:1b model...');
    const response = await callUnifiedAI(jobAnalysisPrompt, modelConfig);
    console.log('Response received:', response.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('Error in career tools:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    console.error('Stack trace:', error.stack);
  }
}

debugCareerTools();