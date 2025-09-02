require('dotenv').config({ path: './backend/.env' });

const { runJobDecoder } = require('./backend/services/careerToolsService');

async function testCareerToolsFix() {
  try {
    console.log('Testing career tools fix...');
    console.log('GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);
    
    // Sample job description
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

    // Test with no model config (should use Groq since API key is available)
    console.log('\n=== Testing with default Groq model ===');
    const response1 = await runJobDecoder(jobDescription);
    console.log('Groq response received (first 200 chars):', response1.substring(0, 200) + '...');
    
    // Test with Ollama model config
    console.log('\n=== Testing with Ollama model ===');
    const modelConfig = {
      provider: 'ollama',
      model: 'gemma3:1b'
    };
    const response2 = await runJobDecoder(jobDescription, modelConfig);
    console.log('Ollama response received (first 200 chars):', response2.substring(0, 200) + '...');
    
    console.log('\n=== All tests passed! ===');
    
  } catch (error) {
    console.error('Error in career service test:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    console.error('Stack trace:', error.stack);
  }
}

testCareerToolsFix();