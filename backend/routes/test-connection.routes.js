const express = require('express');
const router = express.Router();
const axios = require('axios');

const { testConnection } = require('../controllers/test-connection.controller');
const { validateApiKey } = require('../middleware/validation.middleware');

// Test connection endpoint for any provider
router.post('/test-connection', validateApiKey, testConnection);

// Test Ollama connection (legacy endpoint)
router.get('/test-ollama', async (req, res) => {
  try {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const response = await axios.get(ollamaUrl);
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
