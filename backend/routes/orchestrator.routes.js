const express = require('express');
const router = express.Router();
const { checkWithOrchestrator } = require('../controllers/orchestrator.controller');
const { validateText, validateModelConfig } = require('../middleware/validation.middleware');

// POST /api/orchestrator/check - Main AI checking endpoint
router.post('/check', validateText, validateModelConfig, checkWithOrchestrator);

module.exports = router;
