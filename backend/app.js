const express = require('express');
const cors = require('cors');
const expressRateLimit = require('express-rate-limit');

// Legacy grammar routes removed
const orchestratorRoutes = require('./routes/orchestrator.routes');
const enhancementRoutes = require('./routes/enhancement.routes');
const careerRoutes = require('./routes/career.routes');
const modelRoutes = require('./routes/model.routes');
const humanizeRoutes = require('./routes/humanize.routes');
const chatRoutes = require('./routes/chat.routes');
const testConnectionRoutes = require('./routes/test-connection.routes');

const errorHandler = require('./middleware/error.middleware');
const validationMiddleware = require('./middleware/validation.middleware');

const app = express();

// General rate limiting (100 requests per 15 minutes)
const generalLimiter = expressRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

// Strict rate limiting for AI endpoints (10 requests per hour)
const aiLimiter = expressRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many AI requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Very strict rate limiting for model endpoints (5 requests per hour)
const modelLimiter = expressRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many model requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware
const corsOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.CORS_ORIGIN || 'https://ai-gc.vercel.app']
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: process.env.CORS_CREDENTIALS === 'true' || true
}));
app.use(express.json({ limit: '10mb' }));
app.use(generalLimiter);

// Routes with specific rate limiting
// Legacy grammar routes removed - using AI-only orchestrator
app.use('/api/orchestrator', orchestratorRoutes);
app.use('/api/enhance', aiLimiter, enhancementRoutes);
app.use('/api/career', aiLimiter, careerRoutes);
app.use('/api/models', modelLimiter, modelRoutes);
app.use('/api/humanize', aiLimiter, humanizeRoutes);
app.use('/api/chat', aiLimiter, chatRoutes);
app.use('/api/ai', aiLimiter, testConnectionRoutes);

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
