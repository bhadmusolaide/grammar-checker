// Test for LM Studio integration
const { callLMStudio } = require('./backend/services/ai.service.js');

// Simple test to verify the function exists and can be called
console.log('Testing LM Studio integration...');

// Mock messages array
const messages = [
  { role: 'user', content: 'Hello, this is a test message.' }
];

console.log('Function callLMStudio exists:', typeof callLMStudio === 'function');

// Test the tryParseJSON function
const { tryParseJSON } = require('./backend/services/ai.service.js');
console.log('Function tryParseJSON exists:', typeof tryParseJSON === 'function');

// Test with sample JSON text
const sampleResponse = 'Here is some text before [{"suggestion": "test"}] and after';
const parsed = tryParseJSON(sampleResponse);
console.log('tryParseJSON result:', parsed);

console.log('LM Studio integration test completed.');