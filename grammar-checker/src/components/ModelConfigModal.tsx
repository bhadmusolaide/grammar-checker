import React, { useState, useEffect } from 'react';
import { ModelProvider, ProviderConfig } from '../types';
import modelProviderService from '../services/modelProvider';

interface ModelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigurationUpdate: () => void;
}

const ModelConfigModal: React.FC<ModelConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigurationUpdate
}) => {
  const [configurations, setConfigurations] = useState<Record<ModelProvider, ProviderConfig>>({} as any);
  const [editingProvider, setEditingProvider] = useState<ModelProvider | null>(null);
  const [tempApiKey, setTempApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState<Record<ModelProvider, boolean>>({} as any);
  const [testingConnection, setTestingConnection] = useState<Record<ModelProvider, boolean>>({} as any);
  const [connectionStatus, setConnectionStatus] = useState<Record<ModelProvider, 'success' | 'error' | null>>({} as any);

  useEffect(() => {
    if (isOpen) {
      loadConfigurations();
    }
  }, [isOpen]);

  const loadConfigurations = () => {
    const providers: ModelProvider[] = ['openai', 'groq', 'deepseek', 'qwen', 'openrouter'];
    const configs: Record<ModelProvider, ProviderConfig> = {} as any;
    
    providers.forEach(provider => {
      const config = modelProviderService.getProviderConfig(provider);
      if (config) {
        configs[provider] = config;
      }
    });
    
    setConfigurations(configs);
  };

  const handleSaveApiKey = async (provider: ModelProvider) => {
    if (tempApiKey.trim()) {
      modelProviderService.configureProvider(provider, tempApiKey.trim(), true);
      setEditingProvider(null);
      setTempApiKey('');
      loadConfigurations();
      onConfigurationUpdate();
      
      // Test the connection
      await testConnection(provider);
    }
  };

  const testConnection = async (provider: ModelProvider) => {
    setTestingConnection(prev => ({ ...prev, [provider]: true }));
    setConnectionStatus(prev => ({ ...prev, [provider]: null }));
    
    try {
      // Get the first available model for the provider, or use provider-specific defaults
      let defaultModel = 'default';
      if (provider === 'openrouter') {
        defaultModel = 'meta-llama/llama-3.1-8b-instruct:free'; // Use a free OpenRouter model
      } else if (provider === 'openai') {
        defaultModel = 'gpt-3.5-turbo';
      } else if (provider === 'groq') {
        defaultModel = 'llama-3.1-8b-instant';
      } else if (provider === 'deepseek') {
        defaultModel = 'deepseek-chat';
      } else if (provider === 'qwen') {
        defaultModel = 'qwen-turbo';
      }
      
      const requestBody: any = {
        provider,
        model: configurations[provider]?.models[0]?.id || defaultModel,
        prompt: 'Test connection'
      };
      
      // Include API key for cloud providers
      if (provider !== 'ollama' && configurations[provider]?.apiKey) {
        requestBody.apiKey = configurations[provider].apiKey;
      }
      
      const response = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        setConnectionStatus(prev => ({ ...prev, [provider]: 'success' }));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Connection test failed for ${provider}:`, errorData);
        setConnectionStatus(prev => ({ ...prev, [provider]: 'error' }));
      }
    } catch (error) {
      console.error(`Connection test error for ${provider}:`, error);
      setConnectionStatus(prev => ({ ...prev, [provider]: 'error' }));
    } finally {
      setTestingConnection(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleRemoveApiKey = (provider: ModelProvider) => {
    modelProviderService.configureProvider(provider, '', false);
    loadConfigurations();
    onConfigurationUpdate();
  };

  const toggleApiKeyVisibility = (provider: ModelProvider) => {
    setShowApiKey(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const getProviderInfo = (provider: ModelProvider) => {
    const info: Record<ModelProvider, {
      name: string;
      icon: string;
      description: string;
      docsUrl: string;
      keyFormat: string;
    }> = {
      ollama: { name: 'Ollama', icon: '🏠', description: 'Local AI models', docsUrl: '', keyFormat: '' },
      openai: {
        name: 'OpenAI',
        icon: '🤖',
        description: 'GPT-4, GPT-3.5 models for high-quality analysis',
        docsUrl: 'https://platform.openai.com/api-keys',
        keyFormat: 'sk-...'
      },
      groq: {
        name: 'Groq',
        icon: '⚡',
        description: 'Ultra-fast inference with Llama and Mixtral models',
        docsUrl: 'https://console.groq.com/keys',
        keyFormat: 'gsk_...'
      },
      deepseek: {
        name: 'DeepSeek',
        icon: '🧠',
        description: 'Cost-effective models with good performance',
        docsUrl: 'https://platform.deepseek.com/api_keys',
        keyFormat: 'sk-...'
      },
      qwen: {
        name: 'Qwen (Alibaba)',
        icon: '🔮',
        description: 'Qwen models via Alibaba Cloud',
        docsUrl: 'https://dashscope.console.aliyun.com/apiKey',
        keyFormat: 'sk-...'
      },
      openrouter: {
        name: 'OpenRouter',
        icon: '🌐',
        description: 'Access to multiple models via one API',
        docsUrl: 'https://openrouter.ai/keys',
        keyFormat: 'sk-...'
      }
    };
    return info[provider];
  };

  const maskApiKey = (apiKey: string) => {
    if (!apiKey) return '';
    if (apiKey.length <= 8) return '***';
    return apiKey.substring(0, 4) + '•'.repeat(apiKey.length - 8) + apiKey.substring(apiKey.length - 4);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200 px-8 py-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 gradient-text">AI Model Configuration</h2>
              <p className="text-gray-600 mt-1">Configure cloud AI providers for enhanced performance</p>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="space-y-6">
            {Object.entries(configurations).map(([provider, config]) => {
              const info = getProviderInfo(provider as ModelProvider);
              const isConfigured = config.enabled && config.apiKey;
              const isEditing = editingProvider === provider;

              return (
                <div
                  key={provider}
                  className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 transition-all duration-200 ${
                    isConfigured ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl">
                        {info.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{info.name}</h3>
                        <p className="text-sm text-gray-600">{info.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            isConfigured 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {isConfigured ? '🟢 Configured' : '⚪ Not configured'}
                          </span>
                          <a
                            href={info.docsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Get API Key →
                          </a>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isConfigured && !isEditing && (
                        <>
                          <button
                            onClick={() => toggleApiKeyVisibility(provider as ModelProvider)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                            title="Toggle API key visibility"
                          >
                            {showApiKey[provider as ModelProvider] ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m-3.122-3.122l-2.847 2.847M12 12l.878-.878m2.847 2.847L18 18" />
                              </svg>
                            ) : (
                              <React.Fragment>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </React.Fragment>
                            )}
                          </button>
                          <button
                            onClick={() => testConnection(provider as ModelProvider)}
                            disabled={testingConnection[provider as ModelProvider]}
                            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center space-x-2"
                          >
                            {testingConnection[provider as ModelProvider] ? (
                              <>
                                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Testing...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>Test</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setEditingProvider(provider as ModelProvider);
                              setTempApiKey(config.apiKey || '');
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveApiKey(provider as ModelProvider)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                          >
                            Remove
                          </button>
                        </>
                      )}
                      
                      {!isConfigured && !isEditing && (
                        <button
                          onClick={() => {
                            setEditingProvider(provider as ModelProvider);
                            setTempApiKey('');
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                          Configure
                        </button>
                      )}
                    </div>
                  </div>

                  {/* API Key Display/Edit */}
                  {isConfigured && !isEditing && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                          <code className="text-sm text-gray-600 font-mono">
                            {showApiKey[provider as ModelProvider] ? config.apiKey : maskApiKey(config.apiKey || '')}
                          </code>
                          {connectionStatus[provider as ModelProvider] && (
                            <div className={`mt-2 text-xs flex items-center space-x-1 ${
                              connectionStatus[provider as ModelProvider] === 'success' 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {connectionStatus[provider as ModelProvider] === 'success' ? (
                                <>
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span>Connection successful</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                  <span>Connection failed</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-green-600 font-medium">
                          ✓ {config.models.length} models available
                        </div>
                      </div>
                    </div>
                  )}

                  {/* API Key Input */}
                  {isEditing && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Key <span className="text-gray-400">({info.keyFormat})</span>
                      </label>
                      <div className="flex space-x-3">
                        <input
                          type="password"
                          value={tempApiKey}
                          onChange={(e) => setTempApiKey(e.target.value)}
                          placeholder={`Enter ${info.name} API key...`}
                          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                        />
                        <button
                          onClick={() => handleSaveApiKey(provider as ModelProvider)}
                          disabled={!tempApiKey.trim()}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingProvider(null);
                            setTempApiKey('');
                          }}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Info Footer */}
          <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">About API Keys</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• API keys are stored locally and never sent to our servers</li>
                  <li>• Each provider offers different models with varying speed, quality, and cost</li>
                  <li>• Groq offers the fastest inference, OpenAI provides highest quality</li>
                  <li>• You can switch between providers anytime in the model selector</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelConfigModal;