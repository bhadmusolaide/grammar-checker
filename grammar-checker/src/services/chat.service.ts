import { ChatSession, ChatMessage, ChatAttachment, UnifiedModel } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ChatService {
  private apiKey: string | null = null;

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'X-API-Key': this.apiKey }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getSessions(): Promise<ChatSession[]> {
    const data = await this.makeRequest('/api/chat/sessions');
    if (!data || !Array.isArray(data.sessions)) {
      return [];
    }
    return data.sessions.map((session: any) => ({
      ...session,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      messages: Array.isArray(session.messages) ? session.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })) : []
    }));
  }

  async createSession(title?: string): Promise<ChatSession> {
    const data = await this.makeRequest('/api/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ title: title || 'New Chat' })
    });
    return {
      ...data.session,
      createdAt: new Date(data.session.createdAt),
      updatedAt: new Date(data.session.updatedAt),
      messages: []
    };
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.makeRequest(`/api/chat/sessions/${sessionId}`, {
      method: 'DELETE'
    });
  }

  async updateSessionTitle(sessionId: string, title: string): Promise<void> {
    await this.makeRequest(`/api/chat/sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title })
    });
  }

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    const data = await this.makeRequest(`/api/chat/sessions/${sessionId}/messages`);
    if (!data || !Array.isArray(data.messages)) {
      return [];
    }
    return data.messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
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
    
    const hasFileAttachments = attachments.some(att => att.file);
    
    if (hasFileAttachments) {
      // Use FormData for file uploads
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
        ...(this.apiKey && { 'X-API-Key': this.apiKey }),
      };

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData
      });

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
    } else {
      // Use JSON for text-only messages
      const data = await this.makeRequest(`/api/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          message,
          modelConfig: {
            provider: model.provider,
            model: model.config.model,
            apiKey: model.config.apiKey
          },
          attachments: attachments.map(att => ({
            name: att.name,
            type: att.type,
            size: att.size,
            content: att.content
          }))
        })
      });

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
    }
  }

  async clearHistory(): Promise<void> {
    await this.makeRequest('/api/chat/history', {
      method: 'DELETE'
    });
  }
}

export const chatService = new ChatService();
export default chatService;