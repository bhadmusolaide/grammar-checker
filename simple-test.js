// Simple test using Node.js built-in modules
const http = require('http');

const postData = JSON.stringify({
  text: "They're going to the park, and I'm going too. I saw a bird, and it flew away. The sun is shining bright today. She likes to read books, especially about history. He forgot his keys, so he couldn't get into the house. The cat is sleeping on the sofa. We should eat dinner quickly, because it's getting late.",
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
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('\nResponse:');
      console.log(`Suggestions found: ${jsonData.suggestions ? jsonData.suggestions.length : 0}`);
      
      if (jsonData.suggestions && jsonData.suggestions.length > 0) {
        console.log('\nSuggestions:');
        jsonData.suggestions.forEach((suggestion, index) => {
          console.log(`${index + 1}. "${suggestion.original}" -> "${suggestion.suggested}"`);
          console.log(`   Explanation: ${suggestion.explanation}`);
          console.log(`   Category: ${suggestion.category}`);
        });
      } else {
        console.log('\nNo suggestions were returned.');
        console.log('This is likely because the sentences are grammatically correct,');
        console.log('or the AI model did not detect significant issues with them.');
      }
    } catch (error) {
      console.error('Error parsing JSON:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error(`Request error: ${error.message}`);
});

req.write(postData);
req.end();