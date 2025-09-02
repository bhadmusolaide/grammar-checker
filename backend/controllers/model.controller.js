const axios = require('axios');

// Get available Ollama models
const getOllamaModels = async (req, res) => {
  try {
    const response = await axios.get('http://localhost:11434/api/tags');
    const models = response.data.models.map(model => ({
      name: model.name,
      size: model.size,
      modified_at: model.modified_at
    }));
    res.json({ models });
  } catch (error) {
    console.error('Failed to fetch Ollama models:', error.message);
    res.status(500).json({ error: 'Failed to fetch Ollama models. Make sure Ollama is running on localhost:11434' });
  }
};

module.exports = {
  getOllamaModels
};
