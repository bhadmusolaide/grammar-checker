const { default: fetch } = require('node-fetch');

async function testCoverLetterGeneration() {
  try {
    const response = await fetch('http://localhost:3001/api/career/job-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'your_secret_api_key_here'
      },
      body: JSON.stringify({
        jobDescriptionText: "We are looking for a Senior Software Engineer with experience in React, Node.js, and cloud technologies. The candidate should have strong problem-solving skills and experience with agile development methodologies.",
        targetPosition: "Senior Software Engineer",
        companyName: "TechCorp",
        options: JSON.stringify({
          coverLetterGenerator: true
        }),
        modelConfig: {
          model: "gpt-3.5-turbo"
        }
      })
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.data && data.data.coverLetter) {
      console.log('\nGenerated Cover Letter:');
      console.log(data.data.coverLetter.content);
    } else {
      console.log('\nNo cover letter generated');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testCoverLetterGeneration();