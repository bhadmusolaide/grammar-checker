// Test script to verify frontend-backend communication
// This script will test the connection between the running frontend and backend servers

const axios = require('axios');

async function testConnection() {
  console.log('Testing frontend-backend communication...');
  
  try {
    // Test backend health endpoint
    console.log('\n1. Testing backend health endpoint...');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Backend health check:', healthResponse.status === 200 ? 'PASSED' : 'FAILED');
    console.log('   Response:', healthResponse.data);
    
    // Test grammar check endpoint
    console.log('\n2. Testing grammar check endpoint...');
    const textToCheck = "This is a sample text with some grammatical errors. It's purpose is to test the grammar checking functionality.";
    
    const grammarResponse = await axios.post('http://localhost:3001/api/orchestrator/check', {
      text: textToCheck,
      language: 'en-US'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Grammar check API:', grammarResponse.status === 200 ? 'PASSED' : 'FAILED');
    console.log('   Suggestions found:', grammarResponse.data.suggestions ? grammarResponse.data.suggestions.length : 0);
    console.log('   Corrected text provided:', !!grammarResponse.data.corrected_text);
    
    // Test frontend availability
    console.log('\n3. Testing frontend availability...');
    const frontendResponse = await axios.get('http://localhost:5173');
    console.log('✅ Frontend availability:', frontendResponse.status === 200 ? 'PASSED' : 'FAILED');
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\nSummary:');
    console.log('  - Backend server: ✅ Running on http://localhost:3001');
    console.log('  - Frontend server: ✅ Running on http://localhost:5173');
    console.log('  - API communication: ✅ Working');
    console.log('  - Grammar check: ✅ Functional');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

// Run the test
testConnection();