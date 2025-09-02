const express = require('express');
const router = express.Router();

const enhancementController = require('../controllers/enhancement.controller');
const { validateText, validateModelConfig, validateApiKey } = require('../middleware/validation.middleware');

// Full-text AI enhancement endpoint
router.post('/full-text', validateApiKey, validateText, validateModelConfig, enhancementController.enhanceFullText);

// AI model integration (unified)
router.post('/ollama', validateApiKey, validateText, enhancementController.checkWithOllama);

// New enhancement endpoints
router.post('/humanize', validateApiKey, validateText, validateModelConfig, enhancementController.humanizeTextController);
router.post('/simplify', validateApiKey, validateText, validateModelConfig, enhancementController.simplifyTextController);
router.post('/expand', validateApiKey, validateText, validateModelConfig, enhancementController.expandTextController);
router.post('/condense', validateApiKey, validateText, validateModelConfig, enhancementController.condenseTextController);

module.exports = router;
