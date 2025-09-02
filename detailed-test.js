// Detailed test to verify backend to frontend JSON delivery
const http = require('http');

function testGrammarCheck() {
  const postData = JSON.stringify({
    text: "This is a sample text with some grammatical errors. It's purpose is to test the grammar checking functionality.",
    language: 'en-US'
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/orchestrator/check',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\n--- Response Body ---');
      console.log(data);
      
      try {
        const jsonData = JSON.parse(data);
        console.log('\n--- Parsed JSON ---');
        console.log(JSON.stringify(jsonData, null, 2));
        
        console.log('\n--- JSON Structure Analysis ---');
        console.log(`Has suggestions: ${!!jsonData.suggestions}`);
        console.log(`Suggestions count: ${jsonData.suggestions ? jsonData.suggestions.length : 0}`);
        console.log(`Has corrected_text: ${!!jsonData.corrected_text}`);
        console.log(`Has metadata: ${!!jsonData.metadata}`);
        
        if (jsonData.suggestions) {
          console.log('\n--- First Suggestion ---');
          console.log(JSON.stringify(jsonData.suggestions[0], null, 2));
        }
        
        console.log('\n✅ Backend to frontend JSON delivery: SUCCESS');
        console.log('The backend is successfully delivering JSON data to the frontend.');
        
      } catch (error) {
        console.error('❌ Failed to parse JSON:', error.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error(`❌ Request failed: ${error.message}`);
  });

  req.write(postData);
  req.end();
}

console.log('Testing backend to frontend JSON delivery...\n');
testGrammarCheck();