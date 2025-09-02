const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const careerController = require('../controllers/career.controller');
const { validateText, validateApiKey, validateModelConfig } = require('../middleware/validation.middleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    console.log('Upload directory:', uploadDir);
    // Create uploads directory if it doesn't exist
    fs.mkdir(uploadDir, { recursive: true }).then(() => {
      console.log('Upload directory created or already exists');
      cb(null, uploadDir);
    }).catch((err) => {
      console.error('Error creating upload directory:', err);
      cb(err);
    });
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Maximum 1 file
  },
  fileFilter: function (req, file, cb) {
    console.log('File filter called with file:', file);
    // Allow specific file types
    const allowedExtensions = /\.(pdf|txt|doc|docx)$/i;
    const allowedMimeTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const extname = allowedExtensions.test(file.originalname.toLowerCase());
    const mimetype = allowedMimeTypes.includes(file.mimetype.toLowerCase());

    console.log('File extension:', path.extname(file.originalname).toLowerCase());
    console.log('File mimetype:', file.mimetype);
    console.log('Extname match:', extname);
    console.log('Mimetype match:', mimetype);

    if (mimetype && extname) {
      console.log('File accepted');
      return cb(null, true);
    } else {
      console.log('File rejected');
      cb(new Error('Only PDF, TXT, and DOC/DOCX files are allowed'));
    }
  }
});

// Add error handling for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'The uploaded file exceeds the maximum allowed size of 10MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Only one file can be uploaded at a time'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected field',
        message: 'Unexpected file field in request'
      });
    }
    return res.status(400).json({
      error: 'File upload error',
      message: err.message
    });
  } else if (err) {
    console.error('File filter error:', err);
    return res.status(400).json({
      error: 'File type not allowed',
      message: err.message
    });
  }
  next();
};

// Custom validation middleware for resume optimizer
const validateResumeOptimizer = (req, res, next) => {
  console.log('validateResumeOptimizer - Request body:', JSON.stringify(req.body, null, 2));
  const { resumeText } = req.body;

  // Allow empty resumeText - user might want to optimize without providing a resume
  if (resumeText !== undefined && resumeText !== null) {
    if (typeof resumeText !== 'string') {
      console.log('validateResumeOptimizer - Invalid resumeText type:', typeof resumeText);
      return res.status(400).json({
        error: 'Invalid resume format',
        message: 'Resume text must be a string'
      });
    }

    if (resumeText.length > 50000) { // 50KB limit
      console.log('validateResumeOptimizer - resumeText too long:', resumeText.length);
      return res.status(400).json({
        error: 'Resume too long',
        message: 'Resume text must be less than 50,000 characters'
      });
    }

    // Sanitize input to prevent XSS
    const sanitizedText = resumeText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    req.body.resumeText = sanitizedText;
  } else {
    // Set empty string if not provided
    req.body.resumeText = '';
  }

  next();
};

// Custom validation middleware for job assistant
const validateJobAssistant = (req, res, next) => {
  const { jobUrl, jobDescriptionText } = req.body;

  // Either jobUrl or jobDescriptionText is required
  if (!jobUrl && !jobDescriptionText) {
    return res.status(400).json({
      error: 'Job information required',
      message: 'Please provide either a job URL or job description text'
    });
  }

  // If jobUrl is provided, it should be a valid URL
  if (jobUrl && typeof jobUrl !== 'string') {
    return res.status(400).json({
      error: 'Invalid job URL format',
      message: 'Job URL must be a string'
    });
  }

  // If jobDescriptionText is provided, it should be a string
  if (jobDescriptionText && typeof jobDescriptionText !== 'string') {
    return res.status(400).json({
      error: 'Invalid job description format',
      message: 'Job description must be a string'
    });
  }

  // If jobDescriptionText is provided, check its length
  if (jobDescriptionText && jobDescriptionText.length > 50000) { // 50KB limit
    return res.status(400).json({
      error: 'Job description too long',
      message: 'Job description must be less than 50,000 characters'
    });
  }

  next();
};

// Middleware to extract text from FormData for validation
const extractTextFromFormData = (req, res, next) => {
  // For job analysis, extract jobDescriptionText or jobUrl
  if (req.body.jobDescriptionText) {
    req.body.text = req.body.jobDescriptionText;
  } else if (req.body.jobUrl) {
    req.body.text = req.body.jobUrl;
  }
  // For resume optimization, extract resumeText
  else if (req.body.resumeText) {
    req.body.text = req.body.resumeText;
  }

  next();
};

// Career tools endpoints with modelConfig validation
router.post('/resume-enhancement', validateApiKey, validateText, validateModelConfig, careerController.enhanceResume);
router.post('/cover-letter', validateApiKey, validateText, validateModelConfig, careerController.generateCoverLetter);
router.post('/linkedin-summary', validateApiKey, validateText, validateModelConfig, careerController.enhanceLinkedInSummary);
router.post('/achievements', validateApiKey, validateText, validateModelConfig, careerController.extractAchievements);
router.post('/job-analysis', upload.none(), validateApiKey, extractTextFromFormData, validateText, validateModelConfig, careerController.analyzeJobDescription);
router.post('/interview-prep', validateApiKey, validateText, validateModelConfig, careerController.prepareInterviewAnswers);

// New career service endpoints
router.post('/keywords', validateApiKey, validateText, validateModelConfig, careerController.extractKeywordsController);
router.post('/resume-optimize', upload.single('resumeFile'), handleMulterError, (req, res, next) => {
  try {
    console.log('=== Resume optimize route middleware START ===');
    // Middleware to ensure form data is properly parsed
    console.log('Resume optimize route - req.body:', JSON.stringify(req.body, null, 2));
    console.log('Resume optimize route - req.file:', req.file);

    // Handle modelConfig if it's a JSON string
    if (req.body.modelConfig && typeof req.body.modelConfig === 'string') {
      try {
        const parsedModelConfig = JSON.parse(req.body.modelConfig);
        console.log('Parsed modelConfig:', JSON.stringify(parsedModelConfig, null, 2));
        req.body.modelConfig = parsedModelConfig;
      } catch (parseError) {
        console.error('Error parsing modelConfig:', parseError);
        // If parsing fails, we'll let the validation middleware handle it
      }
    }

    console.log('=== Resume optimize route middleware END ===');
    next();
  } catch (error) {
    console.error('=== Resume optimize route middleware ERROR ===');
    console.error('Route middleware error:', error);
    next(error); // Pass error to error handler
  }
}, validateApiKey, validateModelConfig, careerController.optimizeResumeController);
router.post('/interview-answer', validateApiKey, validateText, validateModelConfig, careerController.generateInterviewAnswerController);

// New endpoints to match frontend expectations
// These routes are commented out and not in use
// router.post('/resume-optimizer', validateApiKey, validateResumeOptimizer, validateModelConfig, careerController.resumeOptimizer);
// router.post('/job-assistant', validateApiKey, validateJobAssistant, validateModelConfig, careerController.jobAssistant);

// New routes for career tools
router.post('/ats-optimizer', validateApiKey, validateText, validateModelConfig, careerController.atsOptimizerController);
router.post('/achievement-transformer', validateApiKey, validateText, validateModelConfig, careerController.achievementTransformerController);

// Error handling middleware for career routes
router.use((err, req, res, next) => {
  console.error('=== Career Routes Error Handler ===');
  console.error('Career route error:', err);
  console.error('Error stack:', err.stack);
  console.error('============================');

  // Pass to global error handler
  next(err);
});

module.exports = router;
