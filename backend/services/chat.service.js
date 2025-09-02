const fs = require('fs').promises;
const path = require('path');

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

// Helper functions for data persistence
const loadChatSessions = async () => {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(CHAT_SESSIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Return empty array if file doesn't exist
    return [];
  }
};

const saveChatSessions = async (sessions) => {
  await ensureDataDirectory();
  await fs.writeFile(CHAT_SESSIONS_FILE, JSON.stringify(sessions, null, 2));
};

const loadChatMessages = async () => {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(CHAT_MESSAGES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Return empty array if file doesn't exist
    return [];
  }
};

const saveChatMessages = async (messages) => {
  await ensureDataDirectory();
  await fs.writeFile(CHAT_MESSAGES_FILE, JSON.stringify(messages, null, 2));
};

module.exports = {
  loadChatSessions,
  saveChatSessions,
  loadChatMessages,
  saveChatMessages
};
