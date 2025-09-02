import React, { useState, useEffect, useRef } from 'react';
import { useChatManager } from '../hooks/useChatManager';
import { ChatAttachment } from '../types';
import Button from '../design-system/components/Button';
import Card from '../design-system/components/Card';
import { Trash2, Plus, Send, Paperclip, X, ChevronsLeft, Edit, Check, XCircle, Copy, RotateCcw } from 'lucide-react';

const SimpleChatPage: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const {
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
    updateSessionTitle
  } = useChatManager();

  const [inputMessage, setInputMessage] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  const handleStartEditing = (session: any) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title || '');
  };

  const handleCancelEditing = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const handleSaveTitle = async () => {
    if (editingSessionId && editingTitle) {
      await updateSessionTitle(editingSessionId, editingTitle);
    }
    handleCancelEditing();
  };

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && attachments.length === 0) return;

    const messageToSend = inputMessage;
    const attachmentsToSend = attachments;

    setInputMessage('');
    setAttachments([]);

    await sendMessage(messageToSend, attachmentsToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const retryMessage = async (message: any) => {
    if (!currentSessionId) return;
    
    // Find the user message that preceded this assistant message
    const messageIndex = messages.findIndex(m => m.id === message.id);
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1];
      if (userMessage.role === 'user') {
        // Resend the user's message
        await sendMessage(userMessage.content, userMessage.attachments || []);
      }
    }
  };

  const editMessage = (message: any) => {
    if (message.role === 'user') {
      // Set the input field to the message content for editing
      setInputMessage(message.content);
      // Focus on the input field
      if (textInputRef.current) {
        textInputRef.current.focus();
      }
    }
  };

  // File input handling (currently unused but kept for future functionality)
  // const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const files = Array.from(e.target.files || []);
  //   const newAttachments: ChatAttachment[] = files.map(file => ({
  //     id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  //     name: file.name,
  //     type: file.type.startsWith('image/') ? 'image' : 'document' as 'file' | 'image' | 'document',
  //     size: file.size,
  //     file
  //   }));
  //   setAttachments(prev => [...prev, ...newAttachments]);
  //   
  //   // Reset the file input value to allow selecting the same file again
  //   if (fileInputRef.current) {
  //     fileInputRef.current.value = '';
  //   }
  // };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleNewChat = () => {
    createSession();
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (confirm('Are you sure you want to delete this chat session?')) {
      await deleteSession(sessionId);
    }
  };

  // Clear history functionality (currently unused but kept for future functionality)
  // const handleClearHistory = async () => {
  //   if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
  //     await clearHistory();
  //   }
  // };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-80'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            {!isSidebarCollapsed && <h2 className="text-lg font-semibold text-gray-900">Chat Sessions</h2>}
            <Button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              variant="ghost"
              size="small"
            >
              <ChevronsLeft className={`w-5 h-5 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
            </Button>
          </div>
          <Button
            onClick={handleNewChat}
            size="small"
            className="w-full flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {!isSidebarCollapsed && 'New Chat'}
          </Button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && sessions.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {!isSidebarCollapsed && (
                <>
                  No chat sessions yet.
                  <br />
                  Start a new conversation!
                </>
              )}
            </div>
          ) : (
            <div className="p-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors group ${
                    currentSessionId === session.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => editingSessionId !== session.id && setCurrentSession(session.id)}
                >
                  <div className="flex items-center justify-between">
                    {!isSidebarCollapsed && (
                      <div className="flex-1 min-w-0">
                        {editingSessionId === session.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                              autoFocus
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                            />
                            <Button onClick={handleSaveTitle} variant="ghost" size="small" className="p-1 h-auto text-green-600 hover:text-green-700">
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button onClick={handleCancelEditing} variant="ghost" size="small" className="p-1 h-auto text-red-600 hover:text-red-700">
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {session.title || 'New Chat'}
                          </h3>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(session.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center">
                      {!isSidebarCollapsed && editingSessionId !== session.id && (
                        <Button
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleStartEditing(session);
                          }}
                          variant="ghost"
                          size="small"
                          className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-gray-600 hover:text-gray-700`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {!isSidebarCollapsed && (
                        <Button
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                          variant="ghost"
                          size="small"
                          className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-red-600 hover:text-red-700`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 bg-white border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">
            {currentSession?.title || 'Select a chat session'}
          </h1>
          {currentSession && (
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <span>Created {new Date(currentSession.createdAt).toLocaleDateString()}</span>
              {currentSession.model && (
                <>
                  <span className="mx-2">•</span>
                  <span>Using: {currentSession.model.displayName || currentSession.model.name}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!currentSessionId ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Welcome to Simple Chat</h3>
                <p>Select a chat session or start a new conversation</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Start the conversation</h3>
                <p>Send a message to begin chatting</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <Card
                  className={`max-w-[70%] p-4 group relative ${
                    message.role === 'user'
                      ? 'bg-gray-100'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className={`whitespace-pre-wrap break-words`}>
                    {message.content}
                  </div>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.attachments.map((att) => (
                        <div key={att.id} className="text-sm opacity-75">
                          📎 {att.name}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className={`text-xs opacity-75`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                    {/* Action buttons - show on hover */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Copy button for all messages */}
                      <Button
                        onClick={() => copyToClipboard(message.content)}
                        variant="ghost"
                        size="small"
                        className="p-1 h-auto text-gray-500 hover:text-blue-600"
                        title="Copy message"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      
                      {/* Edit button for user messages */}
                      {message.role === 'user' && (
                        <Button
                          onClick={() => editMessage(message)}
                          variant="ghost"
                          size="small"
                          className="p-1 h-auto text-gray-500 hover:text-orange-600"
                          title="Edit message"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      )}
                      
                      {/* Retry button for assistant messages with technical difficulties */}
                      {message.role === 'assistant' && message.content.includes('technical difficulties') && (
                        <Button
                          onClick={() => retryMessage(message)}
                          variant="ghost"
                          size="small"
                          className="p-1 h-auto text-gray-500 hover:text-green-600"
                          title="Retry message"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            ))
          )}
          
          {isTyping && (
            <div className="flex justify-start">
              <Card className="bg-white border border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-gray-500">AI is typing...</span>
                </div>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {currentSessionId && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <Paperclip className="w-4 h-4 text-gray-600" />
                    <span className="truncate max-w-32">{attachment.name}</span>
                    <Button
                      onClick={() => removeAttachment(attachment.id)}
                      variant="ghost"
                      size="small"
                      className="p-1 h-auto text-gray-500 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Row */}
            <div className="flex items-end gap-2 bg-white border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-blue-500">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="ghost"
                size="small"
                className="flex-shrink-0 text-gray-600 hover:text-blue-600"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              
              <div className="flex-1">
                <textarea
                  ref={textInputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isTyping}
                  className="w-full px-2 py-2 bg-transparent border-none focus:outline-none resize-none"
                  rows={1}
                />
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={(!inputMessage.trim() && attachments.length === 0) || isTyping}
                className="flex-shrink-0 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleChatPage;