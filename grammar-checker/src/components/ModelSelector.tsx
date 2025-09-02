import React, { useState, useMemo } from 'react';
import { UnifiedModel, ModelProvider } from '../types';

interface ModelSelectorProps {
  selectedModel: UnifiedModel | null;
  availableModels: UnifiedModel[];
  onModelChange: (model: UnifiedModel) => void;
  onConfigureProvider?: (provider: ModelProvider) => void;
  className?: string;
  label?: string;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  availableModels,
  onModelChange,
  onConfigureProvider,
  className = '',
  label = 'AI Model'
}) => {

  const [isOpen, setIsOpen] = useState(false);
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedProviders, setCollapsedProviders] = useState<Set<string>>(new Set());

  // Toggle provider collapse state
  const toggleProviderCollapse = (provider: string) => {
    const newCollapsed = new Set(collapsedProviders);
    if (newCollapsed.has(provider)) {
      newCollapsed.delete(provider);
    } else {
      newCollapsed.add(provider);
    }
    setCollapsedProviders(newCollapsed);
  };

  // Group models by provider
  const groupedModels = useMemo(() => {
    const groups = availableModels.reduce((acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    }, {} as Record<ModelProvider, UnifiedModel[]>);

    // Ensure all providers are represented, even if empty
    const allProviders: ModelProvider[] = ['ollama', 'openai', 'groq', 'deepseek', 'qwen', 'openrouter'];
    allProviders.forEach(provider => {
      if (!groups[provider]) {
        groups[provider] = [];
      }
    });

    // Filter models based on search query
    if (searchQuery) {
      const filteredGroups = {} as Record<ModelProvider, UnifiedModel[]>;
      Object.entries(groups).forEach(([provider, models]) => {
        const filteredModels = models.filter(model => 
          model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          model.displayName.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filteredModels.length > 0) {
          filteredGroups[provider as ModelProvider] = filteredModels;
        }
      });
      return filteredGroups;
    }

    return groups;
  }, [availableModels, searchQuery]);

  const getProviderDisplayName = (provider: ModelProvider): string => {
    const names: Record<ModelProvider, string> = {
      ollama: 'Local (Ollama)',
      openai: 'OpenAI',
      groq: 'Groq',
      deepseek: 'DeepSeek', 
      qwen: 'Qwen',
      openrouter: 'OpenRouter'
    };
    return names[provider] || provider;
  };

  const getProviderIcon = (provider?: ModelProvider) => {
    if (!provider) return '❓';
    return provider === 'ollama' ? '🏠' :
           provider === 'openai' ? '🤖' :
           provider === 'groq' ? '⚡' :
           provider === 'deepseek' ? '🧠' :
           provider === 'qwen' ? '🔮' : '🌐';
  };

  const getPerformanceBadge = (speed: string, quality: string, cost: string) => {
    const speedColors = {
      fast: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      slow: 'bg-red-100 text-red-800'
    };
    
    const qualityIcons = {
      high: '⭐⭐⭐',
      medium: '⭐⭐',
      standard: '⭐'
    } as const;

    const costIcons = {
      free: '🆓',
      low: '💰',
      medium: '💰💰',
      high: '💰💰💰'
    } as const;

    return (
      <div className="flex items-center space-x-2 text-xs">
        <span className={`px-2 py-1 rounded-full font-medium ${speedColors[speed as keyof typeof speedColors]}`}>
          {speed}
        </span>
        <span title={`Quality: ${quality}`}>{qualityIcons[quality as keyof typeof qualityIcons]}</span>
        <span title={`Cost: ${cost}`}>{costIcons[cost as keyof typeof costIcons]}</span>
      </div>
    );
  };

  const hasSelected = !!selectedModel;

  // Calculate total number of available models
  const totalModels = useMemo(() => {
    return Object.values(groupedModels).reduce((total, models) => total + models.length, 0);
  }, [groupedModels]);

  return (
    <div className={`relative ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
      
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border border-gray-300 hover:border-gray-400 rounded-xl px-4 py-3 text-left focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all duration-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {getProviderIcon(selectedModel?.provider)}
              </div>
              <div>
                <div className="font-medium text-gray-900">{hasSelected && selectedModel ? selectedModel.displayName : 'Select a model'}</div>
                <div className="text-xs text-gray-500">
                  {hasSelected && selectedModel?.performance ? (
                    <React.Fragment>
                      {selectedModel.performance.speed} • {selectedModel.performance.quality} quality
                    </React.Fragment>
                  ) : (
                    'No model selected'
                  )}
                </div>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] max-h-[70vh] flex flex-col">
            {/* Search input */}
            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search models..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {/* Models list */}
            <div className="overflow-y-auto flex-1">
              {totalModels === 0 ? (
                <div className="px-4 py-6 text-center text-gray-500">
                  {searchQuery ? 'No models match your search' : 'No models available'}
                </div>
              ) : (
                Object.entries(groupedModels).map(([provider, models]) => {
                  const isCollapsed = collapsedProviders.has(provider);
                  return (
                    <div key={provider} className="py-2">
                    <button
                      onClick={() => toggleProviderCollapse(provider)}
                      className="w-full px-4 py-2 text-sm font-semibold text-gray-700 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <svg
                          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                            isCollapsed ? '-rotate-90' : 'rotate-0'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        <span>{getProviderIcon(provider as ModelProvider)}</span>
                        <span>{getProviderDisplayName(provider as ModelProvider)}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {models.length}
                        </span>
                        {models.length > 0 && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Ready</span>
                          </span>
                        )}
                      </div>
                      {models.length === 0 && onConfigureProvider && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onConfigureProvider(provider as ModelProvider);
                            setIsOpen(false);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          Configure
                        </button>
                      )}
                    </button>
                    {!isCollapsed && (
                      models.length === 0 ? (
                        <div className="px-4 py-4 text-sm text-gray-500 text-center">
                          No models available. Configure API key to enable.
                        </div>
                      ) : (
                        models.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => {
                              if (model.isAvailable) {
                                onModelChange(model);
                                setIsOpen(false);
                              } else if (onConfigureProvider) {
                                // If model is not available, open configuration
                                onConfigureProvider(model.provider);
                                setIsOpen(false);
                              }
                            }}
                            onMouseEnter={() => setHoveredModel(model.id)}
                            onMouseLeave={() => setHoveredModel(null)}
                            className={`w-full text-left px-4 py-3 transition-all duration-200 ${
                              hasSelected && selectedModel?.id === model.id
                                ? 'bg-blue-50 border-l-4 border-blue-500'
                                : hoveredModel === model.id
                                ? model.isAvailable ? 'bg-gray-50' : 'bg-blue-50'
                                : model.isAvailable ? 'hover:bg-gray-25' : 'opacity-60 hover:bg-blue-25'
                            }`}
                            disabled={!model.isAvailable && !onConfigureProvider}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className={`font-medium text-sm ${model.isAvailable ? 'text-gray-900' : 'text-gray-500'}`}>
                                  {model.name}
                                  {!model.isAvailable && (
                                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                      Configure to use
                                    </span>
                                  )}
                                </div>
                                {model.displayName !== model.name && (
                                  <div className={`text-xs mt-1 ${model.isAvailable ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {model.displayName}
                                  </div>
                                )}
                              </div>
                              {model.isAvailable && getPerformanceBadge(
                                model.performance.speed,
                                model.performance.quality,
                                model.performance.cost
                              )}
                            </div>
                            {hasSelected && selectedModel?.id === model.id && (
                              <div className="mt-2 flex items-center space-x-2 text-blue-600">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs font-medium">Selected</span>
                              </div>
                            )}
                          </button>
                        ))
                      )
                    )}
                  </div>
                  )
                })
              )}
            </div>
            
            {/* Quick Stats Footer */}
            <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 rounded-b-xl">
              <div className="text-xs text-gray-500 text-center">
                {totalModels} models available across {Object.keys(groupedModels).filter(provider => groupedModels[provider as ModelProvider].length > 0).length} providers
              </div>
            </div>
          </div>
        )}

        {/* Click outside to close */}
        {isOpen && (
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => {
              setIsOpen(false);
              setSearchQuery('');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ModelSelector;