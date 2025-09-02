const axios = require('axios');

// Test the grammar check endpoint
async function testGrammarCheck() {
  try {
    console.log('Testing grammar check functionality...');
    
    const textToCheck = "This is a sample text with some grammatical errors. It's purpose is to test the grammar checking functionality.";
    
    const response = await axios.post('http://localhost:3001/api/orchestrator/check', {
      text: textToCheck,
      language: 'en-US'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Grammar check response:', response.data);
    console.log('Test completed successfully!');
    
    return response.data;
  } catch (error) {
    console.error('Error testing grammar check:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return null;
  }
}

// Run the test
testGrammarCheck();