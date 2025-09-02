const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

// Middleware to log requests
router.use((req, res, next) => {
  console.log(`[Chat Router] Received request: ${req.method} ${req.originalUrl}`);
  next();
});

const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const { validateApiKey, validateModelConfig } = require('../middleware/validation.middleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create uploads directory if it doesn't exist
    fs.mkdir(uploadDir, { recursive: true }).then(() => {
      cb(null, uploadDir);
    }).catch(cb);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: function (req, file, cb) {
    // Allow specific file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|txt|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed'));
    }
  }
});

// File paths for chat data storage
const CHAT_SESSIONS_FILE = path.join(__dirname, '../data/chat-sessions.json');
const CHAT_MESSAGES_FILE = path.join(__dirname, '../data/chat-messages.json');

// Ensure data directory exists
const ensureDataDirectory = async () => {
  const dataDir = path.join(__dirname, '../data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
};

// Validation middleware for chat messages
const validateChatMessage = (req, res, next) => {
  const { message, sessionId } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      error: 'Invalid message format',
      message: 'Message must be a non-empty string'
    });
  }

  if (message.length > 10000) {
    return res.status(400).json({
      error: 'Message too long',
      message: 'Message must be less than 10,000 characters'
    });
  }

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({
      error: 'Invalid session ID',
      message: 'Session ID must be a non-empty string'
    });
  }

  next();
};


router.get('/sessions', chatController.getAllSessions);
router.post('/sessions', validateApiKey, chatController.createSession);
router.get('/sessions/:sessionId/messages', chatController.getSessionMessages);
router.post('/sessions/:sessionId/messages', upload.array('attachments'), validateApiKey, validateModelConfig, chatController.postMessage);
router.delete('/sessions/:sessionId', validateApiKey, chatController.deleteSession);
router.delete('/history', validateApiKey, chatController.clearHistory);
router.patch('/sessions/:sessionId', validateApiKey, chatController.updateSessionTitle);

module.exports = router;
