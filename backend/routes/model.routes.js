const express = require('express');
const router = express.Router();

const modelController = require('../controllers/model.controller');
const { validateApiKey } = require('../middleware/validation.middleware');

// Get available Ollama models
router.get('/ollama', validateApiKey, modelController.getOllamaModels);

module.exports = router;
