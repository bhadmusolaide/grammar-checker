// Simple test for career tools using Node.js built-in modules
const http = require('http');

const postData = JSON.stringify({
  jobDescriptionText: "We are looking for a software engineer with experience in JavaScript, React, and Node.js. The candidate should have at least 3 years of experience and be familiar with cloud technologies like AWS.",
  targetPosition: "Software Engineer",
  companyName: "Tech Corp",
  modelConfig: {
    provider: "ollama",
    model: "gemma3:1b"
  }
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/career/job-analysis',
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
      console.log(JSON.stringify(jsonData, null, 2));
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