import { useState, useCallback, useEffect } from 'react';
import { ChatSession, ChatMessage, ChatAttachment, UnifiedModel } from '../types';
import { simpleChatService } from '../services/simpleChatService';
import { useAppContext } from '../contexts/AppContext';

export const useChatManager = () => {
  const { state } = useAppContext();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeChatService = useCallback(() => {
    const apiKey = state.settings.selectedModel?.config.apiKey;
    if (apiKey) {
      simpleChatService.setApiKey(apiKey);
    }
  }, [state.settings.selectedModel]);

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      initializeChatService();
      
      let loadedSessions = await simpleChatService.getSessions();
      
      if (loadedSessions.length === 0) {
        const newSession = await simpleChatService.createSession('New Chat', state.settings.selectedModel);
        loadedSessions = [newSession];
      }
      
      setSessions(loadedSessions);
      
      if (!currentSessionId && loadedSessions.length > 0) {
        setCurrentSessionId(loadedSessions[0].id);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, initializeChatService, state.settings.selectedModel]);

  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      initializeChatService();
      const loadedMessages = await simpleChatService.getMessages(sessionId);
      setMessages(loadedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError(error instanceof Error ? error.message : 'Failed to load messages');
    }
  }, [initializeChatService]);

  const setCurrentSession = useCallback(async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    await loadMessages(sessionId);
  }, [loadMessages]);

  const createSession = useCallback(async (title: string = 'New Chat') => {
    try {
      setIsLoading(true);
      setError(null);
      initializeChatService();
      
      const newSession = await simpleChatService.createSession(title, state.settings.selectedModel);
      
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
      
      return newSession.id;
    } catch (error) {
      console.error('Failed to create session:', error);
      setError(error instanceof Error ? error.message : 'Failed to create session');
    } finally {
      setIsLoading(false);
    }
  }, [state.settings.selectedModel, initializeChatService]);

  const sendMessage = useCallback(async (
    message: string,
    attachments: ChatAttachment[] = [],
    model?: UnifiedModel
  ) => {
    if (!currentSessionId) {
      setError('No active session. Please create a new chat first.');
      return;
    }

    const selectedModel = model || state.settings.selectedModel;
    
    if (!selectedModel) {
      setError('No AI model selected. Please configure a model first.');
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const tempUserMessage: ChatMessage = {
      id: tempId,
      sessionId: currentSessionId!,
      role: 'user',
      content: message,
      attachments: attachments,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, tempUserMessage]);

    try {
      setIsTyping(true);
      setError(null);
      initializeChatService();
      
      const { userMessage, assistantMessage } = await simpleChatService.sendMessage(
        currentSessionId,
        message,
        selectedModel,
        attachments
      );

      setMessages(prev => {
        const newMessages = prev.filter(m => m.id !== tempId);
        return [...newMessages, userMessage, assistantMessage];
      });
      
      await loadSessions();
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsTyping(false);
    }
  }, [currentSessionId, createSession, state.settings.selectedModel, initializeChatService, loadSessions]);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true);
      initializeChatService();
      
      await simpleChatService.deleteSession(sessionId);
      
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
      
    } catch (error) {
      console.error('Failed to delete session:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete session');
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, initializeChatService]);

  const updateSessionTitle = useCallback(async (sessionId: string, newTitle: string) => {
    try {
      const updatedSession = await simpleChatService.updateSessionTitle(sessionId, newTitle);
      setSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));
    } catch (error) {
      console.error('Failed to update session title:', error);
      setError(error instanceof Error ? error.message : 'Failed to update session title');
    }
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      initializeChatService();
      
      await simpleChatService.clearHistory();
      
      setSessions([]);
      setCurrentSessionId(null);
      setMessages([]);
      
    } catch (error) {
      console.error('Failed to clear history:', error);
      setError(error instanceof Error ? error.message : 'Failed to clear history');
    } finally {
      setIsLoading(false);
    }
  }, [initializeChatService]);

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId, loadMessages]);

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  return {
    sessions,
    currentSessionId,
    currentSession,
    messages,
    isLoading,
    isTyping,
    error,
    loadSessions,
    setCurrentSession,
    createSession,
    sendMessage,
    deleteSession,
    clearHistory,
    updateSessionTitle
  };
};