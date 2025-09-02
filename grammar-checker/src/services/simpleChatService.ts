import { ChatSession, ChatMessage, ChatAttachment, UnifiedModel } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

class SimpleChatService {
  private apiKey: string | null = null;

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Connection': 'keep-alive',
      ...(this.apiKey && { 'x-api-key': this.apiKey }),
      ...options.headers,
    };

    console.log('Making request to:', url, 'with headers:', headers);

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error('Request timeout:', url);
        throw new Error('Request timeout - please try again');
      }
      
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_RESET')) {
        console.error('Connection reset:', url, error.message);
        throw new Error('Connection lost - please check your network and try again');
      }
      
      console.error('Request failed:', url, error.message);
      throw error;
    }
  }

  async getSessions(): Promise<ChatSession[]> {
    try {
      const data = await this.makeRequest('/api/chat/sessions');
      if (!data || !Array.isArray(data.sessions)) {
        return [];
      }
      return data.sessions.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: [] // Messages loaded separately
      }));
    } catch (error) {
      console.error('Failed to load sessions:', error);
      return [];
    }
  }

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const data = await this.makeRequest(`/api/chat/sessions/${sessionId}/messages`);
      if (!data || !Array.isArray(data.messages)) {
        return [];
      }
      return data.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    } catch (error) {
      console.error(`Failed to load messages for session ${sessionId}:`, error);
      return [];
    }
  }

  async sendMessage(
    sessionId: string, 
    message: string, 
    model: UnifiedModel,
    attachments: ChatAttachment[] = []
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
    if (!model || !model.config) {
      throw new Error('Model configuration is required');
    }
    
    // Always use FormData to ensure consistent handling in the backend
    const formData = new FormData();
    formData.append('message', message);
    formData.append('modelConfig', JSON.stringify({
      provider: model.provider,
      model: model.config.model,
      apiKey: model.config.apiKey
    }));
    
    // Add file attachments to FormData
    attachments.forEach((attachment) => {
      if (attachment.file) {
        formData.append('attachments', attachment.file);
      }
    });

    const url = `${API_BASE_URL}/api/chat/sessions/${sessionId}/messages`;
    const headers = {
      'Connection': 'keep-alive',
      ...(this.apiKey && { 'x-api-key': this.apiKey }),
    };

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        userMessage: {
          ...data.userMessage,
          timestamp: new Date(data.userMessage.timestamp)
        },
        assistantMessage: {
          ...data.assistantMessage,
          timestamp: new Date(data.assistantMessage.timestamp)
        }
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error('Request timeout:', url);
        throw new Error('Request timeout - please try again');
      }
      
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_RESET')) {
        console.error('Connection reset:', url, error.message);
        throw new Error('Connection lost - please check your network and try again');
      }
      
      console.error('Request failed:', url, error.message);
      throw error;
    }
  }

  async createSession(title: string, model: UnifiedModel | null): Promise<ChatSession> {
    const data = await this.makeRequest('/api/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ 
        title: title || 'New Chat',
        model: model ? { provider: model.provider, model: model.config.model } : null
      }),
    });
    return data.session;
  }

  async updateSessionTitle(sessionId: string, title: string): Promise<ChatSession> {
    const data = await this.makeRequest(`/api/chat/sessions/${sessionId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      }
    );
    return data.session;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.makeRequest(`/api/chat/sessions/${sessionId}`, {
      method: 'DELETE'
    });
  }

  async clearHistory(): Promise<void> {
    await this.makeRequest('/api/chat/history', {
      method: 'DELETE'
    });
  }
}

export const simpleChatService = new SimpleChatService();
export default simpleChatService;