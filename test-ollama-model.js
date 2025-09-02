const axios = require('axios');

async function testOllamaModel() {
  try {
    // Test if gemma3:1b model exists
    console.log('Testing if gemma3:1b model exists...');
    
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    
    // First get available models
    const modelsResponse = await axios.get(`${ollamaUrl}/api/tags`);
    console.log('Available models:', modelsResponse.data.models.map(m => m.name));
    
    // Check if gemma3:1b is available
    const gemmaModel = modelsResponse.data.models.find(m => m.name === 'gemma3:1b');
    if (!gemmaModel) {
      console.log('gemma3:1b model not found!');
      const firstModel = modelsResponse.data.models[0];
      console.log('First available model:', firstModel.name);
      
      // Try to use the first available model instead
      console.log('Testing first available model...');
      const testResponse = await axios.post(`${ollamaUrl}/api/generate`, {
        model: firstModel.name,
        prompt: 'Say hello',
        stream: false
      });
      
      console.log('Test response:', testResponse.data.response);
    } else {
      console.log('gemma3:1b model found, testing...');
      const testResponse = await axios.post(`${ollamaUrl}/api/generate`, {
        model: 'gemma3:1b',
        prompt: 'Say hello',
        stream: false
      });
      
      console.log('Test response:', testResponse.data.response);
    }
  } catch (error) {
    console.error('Error testing Ollama model:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testOllamaModel();