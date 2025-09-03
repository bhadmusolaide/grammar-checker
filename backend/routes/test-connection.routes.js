const express = require('express');
const router = express.Router();

// Minimal test connection endpoint
router.get('/test', (req, res) => {
  res.json({ status: 'OK', message: 'Test connection successful' });
});

module.exports = router;
