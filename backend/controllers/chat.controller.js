const { callUnifiedAI } = require('../services/ai.service');
const chatService = require('../services/chat.service');
const fs = require('fs').promises;

// Get all chat sessions
const getAllSessions = async (req, res) => {
  try {
    const sessions = await chatService.loadChatSessions();
    // Sort sessions by creation date in descending order (newest first)
    const sortedSessions = sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ sessions: sortedSessions });
  } catch (error) {
    console.error('Error loading chat sessions:', error);
    res.status(500).json({ error: 'Failed to load chat sessions' });
  }
};

const Session = require('../types/Session');

// ... existing code ...

const createSession = async (req, res) => {
  try {
    const { title, model } = req.body;
    const sessions = await chatService.loadChatSessions();

    const newSession = new Session(title, model);

    sessions.push(newSession);
    await chatService.saveChatSessions(sessions);

    res.json({ session: newSession });
  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({ error: 'Failed to create chat session' });
  }
};

const getSessionMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const messages = await chatService.loadChatMessages();
    const sessionMessages = messages.filter(msg => msg.sessionId === sessionId);

    res.json({ messages: sessionMessages });
  } catch (error) {
    console.error('Error loading chat messages:', error);
    res.status(500).json({ error: 'Failed to load chat messages' });
  }
};

const postMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, modelConfig } = req.body;

    // Validate message content
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      // Allow empty message if there are attachments
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Message content is required when no attachments are provided' });
      }
    }

    // Load existing messages and sessions
    const messages = await chatService.loadChatMessages();
    let sessions = await chatService.loadChatSessions();

    // Check if session exists
    let session = sessions.find(s => s.id === sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get conversation history for context
    const conversationHistory = messages
      .filter(msg => msg.sessionId === sessionId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-10); // Keep last 10 messages for context

    // Process attachments if any
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        attachments.push({
          id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
          name: file.originalname,
          type: file.mimetype,
          size: file.size,
          path: file.path,
          url: `/uploads/${file.filename}`
        });
      }
    }

    const Message = require('../types/Message');

    // ... existing code ...

    // Create user message
    const userMessage = new Message(sessionId, 'user', message, attachments.length > 0 ? attachments : undefined);

    // Add user message to storage
    messages.push(userMessage);
    await chatService.saveChatMessages(messages);

    // Build conversation context for AI
    let conversationContext = '';
    if (conversationHistory.length > 0) {
      conversationContext = conversationHistory
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n\n');
      conversationContext += '\n\n';
    }

    // Create AI prompt with conversation context and attachment info
    let attachmentContext = '';
    if (attachments.length > 0) {
      attachmentContext = `\n\nThe user has attached ${attachments.length} file(s):\n`;
      attachments.forEach(att => {
        attachmentContext += `- ${att.name} (${att.type}, ${(att.size / 1024).toFixed(1)}KB)\n`;
      });
      attachmentContext += '\nPlease acknowledge the attachments and provide relevant assistance based on the file types and context.\n';
    }

    const aiPrompt = `You are a helpful AI assistant. Please provide a thoughtful and helpful response to the user\'s message. Keep your responses conversational and engaging.${attachmentContext}\n\n${conversationContext}User: ${message}\n\nAssistant:`;

    // Get AI response (isGrammarCheck = false for chat)
    let response;
    try {
      if (modelConfig && modelConfig.provider) {
        response = await callUnifiedAI(aiPrompt, modelConfig, null, false);
      } else {
        // Fallback to fast Groq model for better performance
        const defaultModelConfig = {
          provider: 'groq',
          model: 'llama-3.1-8b-instant',
          apiKey: process.env.GROQ_API_KEY
        };
        response = await callUnifiedAI(aiPrompt, defaultModelConfig, null, false);
      }
    } catch (aiError) {
      console.error('AI service error:', aiError.message);
      
      // Provide specific error messages based on the error type
      if (aiError.message.includes('Cannot connect to Ollama')) {
        response = 'Local AI models are currently unavailable. The system is attempting to use cloud-based alternatives. If this persists, please contact support.';
      } else if (aiError.message.includes('Ollama request timed out')) {
        response = 'The local AI service is taking longer than expected to respond. Please try again, or the system will automatically switch to faster cloud models.';
      } else if (aiError.message.includes('Invalid') && aiError.message.includes('API key')) {
        response = 'AI service configuration issue detected. Please contact support to resolve API key problems.';
      } else if (aiError.message.includes('model not found') || aiError.message.includes('Model') && aiError.message.includes('not found')) {
        response = 'The requested AI model is not available. The system will attempt to use an alternative model for your request.';
      } else if (aiError.message.includes('rate limit') || aiError.message.includes('quota')) {
        response = 'AI service is currently at capacity. Please wait a moment and try again, or the system will switch to alternative providers.';
      } else {
        // Generic fallback for unknown errors
        response = 'I apologize, but I\'m experiencing technical difficulties right now. Please try again in a moment.';
      }
    }
    const aiResponse = response;

    // Create assistant message
    const assistantMessage = new Message(sessionId, 'assistant', aiResponse);

    // Add assistant message to storage
    messages.push(assistantMessage);
    await chatService.saveChatMessages(messages);

    // Update session timestamp
    session.updatedAt = new Date().toISOString();
    await chatService.saveChatSessions(sessions);

    res.json({
      userMessage,
      assistantMessage
    });

  } catch (error) {
    console.error('Error processing chat message:', error);

    // Clean up uploaded files if there was an error
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      }
    }

    res.status(500).json({ error: 'Failed to process message' });
  }
};

const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Load data
    const sessions = await chatService.loadChatSessions();
    const messages = await chatService.loadChatMessages();

    // Remove session
    const updatedSessions = sessions.filter(s => s.id !== sessionId);

    // Remove all messages for this session
    const updatedMessages = messages.filter(msg => msg.sessionId !== sessionId);

    // Save updated data
    await chatService.saveChatSessions(updatedSessions);
    await chatService.saveChatMessages(updatedMessages);

    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
};

const clearHistory = async (req, res) => {
  try {
    await chatService.saveChatSessions([]);
    await chatService.saveChatMessages([]);

    res.json({ success: true, message: 'Chat history cleared successfully' });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
};

const updateSessionTitle = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title must be a non-empty string' });
    }

    const sessions = await chatService.loadChatSessions();
    const session = sessions.find(s => s.id === sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.title = title;
    session.updatedAt = new Date().toISOString();

    await chatService.saveChatSessions(sessions);

    res.json({ session });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
};

module.exports = {
  getAllSessions,
  createSession,
  getSessionMessages,
  postMessage,
  deleteSession,
  clearHistory,
  updateSessionTitle
};
