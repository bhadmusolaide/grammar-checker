// Test script to check why certain sentences are not being flagged for grammar issues
const axios = require('axios');

async function testGrammarSentences() {
  const sentences = [
    "They're going to the park, and I'm going too.",
    "I saw a bird, and it flew away.",
    "The sun is shining bright today.",
    "She likes to read books, especially about history.",
    "He forgot his keys, so he couldn't get into the house.",
    "The cat is sleeping on the sofa.",
    "We should eat dinner quickly, because it's getting late."
  ];

  console.log('Testing grammar checking for the following sentences:\n');
  
  for (let i = 0; i < sentences.length; i++) {
    console.log(`${i + 1}. "${sentences[i]}"`);
  }
  
  console.log('\n--- Sending to Grammar Checker API ---\n');
  
  try {
    const textToCheck = sentences.join(' ');
    
    const response = await axios.post('http://localhost:3001/api/orchestrator/check', {
      text: textToCheck,
      language: 'en-US'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Grammar check response:');
    console.log('Status:', response.status);
    console.log('Suggestions found:', response.data.suggestions ? response.data.suggestions.length : 0);
    
    if (response.data.suggestions && response.data.suggestions.length > 0) {
      console.log('\nSuggestions:');
      response.data.suggestions.forEach((suggestion, index) => {
        console.log(`${index + 1}. Original: "${suggestion.original}"`);
        console.log(`   Suggested: "${suggestion.suggested}"`);
        console.log(`   Explanation: ${suggestion.explanation}`);
        console.log(`   Category: ${suggestion.category}`);
        console.log(`   Severity: ${suggestion.severity}`);
        console.log('');
      });
    } else {
      console.log('\nNo suggestions were returned by the AI engine.');
      console.log('This could be because:');
      console.log('1. The sentences are grammatically correct');
      console.log('2. The AI model did not detect issues with these specific sentences');
      console.log('3. The prompt instructions are too strict or not specific enough');
      console.log('4. The AI model needs more context to identify issues');
    }
    
    console.log('\nCorrected text:');
    console.log(response.data.corrected_text || 'No corrected text provided');
    
  } catch (error) {
    console.error('Error testing grammar check:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

console.log('Testing grammar checking functionality...\n');
testGrammarSentences();