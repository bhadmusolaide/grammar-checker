import { ChatSession, ChatMessage } from '../types';

const CHAT_STORAGE_KEY = 'ai-grammar-chat-data';
const CURRENT_SESSION_KEY = 'ai-grammar-current-session';

export interface ChatStorageData {
  sessions: ChatSession[];
  lastUpdated: string;
}

/**
 * Chat localStorage utility for persisting chat sessions and messages
 */
export class ChatStorage {
  /**
   * Load chat sessions from localStorage
   */
  static loadSessions(): ChatSession[] {
    try {
      const data = localStorage.getItem(CHAT_STORAGE_KEY);
      if (!data) return [];
      
      const parsed: ChatStorageData = JSON.parse(data);
      
      // Convert date strings back to Date objects
      return parsed.sessions.map(session => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: (session.messages || []).map(message => ({
          ...message,
          timestamp: new Date(message.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Failed to load chat sessions from localStorage:', error);
      return [];
    }
  }

  /**
   * Save chat sessions to localStorage
   */
  static saveSessions(sessions: ChatSession[]): void {
    try {
      const data: ChatStorageData = {
        sessions,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save chat sessions to localStorage:', error);
    }
  }

  /**
   * Load current session ID from localStorage
   */
  static loadCurrentSessionId(): string | null {
    try {
      return localStorage.getItem(CURRENT_SESSION_KEY);
    } catch (error) {
      console.error('Failed to load current session ID from localStorage:', error);
      return null;
    }
  }

  /**
   * Save current session ID to localStorage
   */
  static saveCurrentSessionId(sessionId: string | null): void {
    try {
      if (sessionId) {
        localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
      } else {
        localStorage.removeItem(CURRENT_SESSION_KEY);
      }
    } catch (error) {
      console.error('Failed to save current session ID to localStorage:', error);
    }
  }

  /**
   * Add a new session to localStorage
   */
  static addSession(session: ChatSession): void {
    const sessions = this.loadSessions();
    sessions.push(session);
    this.saveSessions(sessions);
  }

  /**
   * Update an existing session in localStorage
   */
  static updateSession(sessionId: string, updates: Partial<ChatSession>): void {
    const sessions = this.loadSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex !== -1) {
      sessions[sessionIndex] = {
        ...sessions[sessionIndex],
        ...updates,
        updatedAt: new Date()
      };
      this.saveSessions(sessions);
    }
  }

  /**
   * Delete a session from localStorage
   */
  static deleteSession(sessionId: string): void {
    const sessions = this.loadSessions();
    const filteredSessions = sessions.filter(s => s.id !== sessionId);
    this.saveSessions(filteredSessions);
    
    // Clear current session if it was deleted
    const currentSessionId = this.loadCurrentSessionId();
    if (currentSessionId === sessionId) {
      this.saveCurrentSessionId(null);
    }
  }

  /**
   * Add a message to a session in localStorage
   */
  static addMessage(sessionId: string, message: ChatMessage): void {
    const sessions = this.loadSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex !== -1) {
      if (!sessions[sessionIndex].messages) {
        sessions[sessionIndex].messages = [];
      }
      sessions[sessionIndex].messages.push(message);
      sessions[sessionIndex].updatedAt = new Date();
      this.saveSessions(sessions);
    }
  }

  /**
   * Clear all chat data from localStorage
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
      localStorage.removeItem(CURRENT_SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear chat data from localStorage:', error);
    }
  }

  /**
   * Get storage usage information
   */
  static getStorageInfo(): { size: number; sessionCount: number } {
    try {
      const data = localStorage.getItem(CHAT_STORAGE_KEY);
      const sessions = this.loadSessions();
      
      return {
        size: data ? data.length : 0,
        sessionCount: sessions.length
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { size: 0, sessionCount: 0 };
    }
  }
}

export default ChatStorage;