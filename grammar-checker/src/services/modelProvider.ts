import { ModelProvider, CloudModel, UnifiedModel, ProviderConfig } from '../types';

// Default cloud models configuration
const DEFAULT_MODELS: Record<ModelProvider, CloudModel[]> = {
  ollama: [], // Will be populated dynamically
  openai: [
    {
      id: 'gpt-4o-mini',
      name: 'gpt-4o-mini',
      provider: 'openai',
      description: 'Most cost-effective GPT-4 model - excellent for grammar checking',
      contextLength: 128000,
      costPer1kTokens: 0.00015,
      speed: 'fast',
      quality: 'high'
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'gpt-3.5-turbo',
      provider: 'openai',
      description: 'Budget-friendly legacy option - good for basic tasks',
      contextLength: 16385,
      costPer1kTokens: 0.0005,
      speed: 'fast',
      quality: 'medium'
    },
    {
      id: 'gpt-4o',
      name: 'gpt-4o',
      provider: 'openai',
      description: 'Most advanced GPT-4 model - best for complex analysis',
      contextLength: 128000,
      costPer1kTokens: 0.005,
      speed: 'medium',
      quality: 'high'
    }
  ],
  groq: [
    {
      id: 'llama-3.1-8b-instant',
      name: 'Llama 3.1 8B Instant',
      provider: 'groq',
      description: 'Ultra-fast Llama 3.1 model - lightning speed inference',
      contextLength: 131072,
      costPer1kTokens: 0.0005,
      speed: 'fast',
      quality: 'medium'
    },
    {
      id: 'llama-3.3-70b-versatile',
      name: 'Llama 3.3 70B Versatile',
      provider: 'groq',
      description: 'High-quality Llama 3.3 model - best for complex analysis',
      contextLength: 131072,
      costPer1kTokens: 0.0005,
      speed: 'medium',
      quality: 'high'
    }
  ],
  deepseek: [
    {
      id: 'deepseek-chat',
      name: 'deepseek-chat',
      provider: 'deepseek',
      description: 'Cost-effective general model - good balance',
      contextLength: 32768,
      costPer1kTokens: 0.0001,
      speed: 'medium',
      quality: 'medium'
    },
    {
      id: 'deepseek-coder',
      name: 'deepseek-coder',
      provider: 'deepseek',
      description: 'Specialized for technical content and coding',
      contextLength: 16384,
      costPer1kTokens: 0.0001,
      speed: 'medium',
      quality: 'high'
    }
  ],
  qwen: [
    {
      id: 'qwen-turbo',
      name: 'qwen-turbo',
      provider: 'qwen',
      description: 'Fast Qwen model for quick processing',
      contextLength: 8192,
      costPer1kTokens: 0.0003,
      speed: 'fast',
      quality: 'medium'
    },
    {
      id: 'qwen-plus',
      name: 'qwen-plus',
      provider: 'qwen',
      description: 'Higher quality Qwen for better analysis',
      contextLength: 32768,
      costPer1kTokens: 0.0008,
      speed: 'medium',
      quality: 'high'
    }
  ],
  openrouter: [
    {
      id: 'meta-llama/llama-4-maverick:free',
      name: 'Llama 4 Maverick (Free)',
      provider: 'openrouter',
      description: 'Advanced Llama 4 with sparse mixture-of-experts architecture - completely free',
      contextLength: 32768,
      costPer1kTokens: 0,
      speed: 'medium',
      quality: 'high'
    },
    {
      id: 'meta-llama/llama-4-scout:free',
      name: 'Llama 4 Scout (Free)',
      provider: 'openrouter',
      description: 'Efficient Llama 4 variant optimized for speed - completely free',
      contextLength: 16384,
      costPer1kTokens: 0,
      speed: 'fast',
      quality: 'medium'
    },
    {
      id: 'deepseek/deepseek-r1:free',
      name: 'DeepSeek R1 (Free)',
      provider: 'openrouter',
      description: 'Latest DeepSeek reasoning model - completely free',
      contextLength: 32768,
      costPer1kTokens: 0,
      speed: 'medium',
      quality: 'high'
    },
    {
      id: 'google/gemini-2.0-flash-exp:free',
      name: 'Gemini 2.0 Flash Experimental (Free)',
      provider: 'openrouter',
      description: 'Google\'s latest experimental Gemini model - completely free',
      contextLength: 32768,
      costPer1kTokens: 0,
      speed: 'fast',
      quality: 'high'
    },
    {
      id: 'meta-llama/llama-3.3-70b-instruct:free',
      name: 'Llama 3.3 70B Instruct (Free)',
      provider: 'openrouter',
      description: 'Large Llama 3.3 model for complex tasks - completely free',
      contextLength: 131072,
      costPer1kTokens: 0,
      speed: 'slow',
      quality: 'high'
    },
    {
      id: 'qwen/qwq-32b:free',
      name: 'Qwen QwQ 32B (Free)',
      provider: 'openrouter',
      description: 'Qwen reasoning model optimized for problem solving - completely free',
      contextLength: 32768,
      costPer1kTokens: 0,
      speed: 'medium',
      quality: 'high'
    }
  ]
};

class ModelProviderService {
  private providers: Map<ModelProvider, ProviderConfig> = new Map();
  private availableModels: UnifiedModel[] = [];

  constructor() {
    this.initializeProviders();
  }

  async init(): Promise<void> {
    await this.refreshAvailableModels();
  }

  private initializeProviders() {
    // Initialize local Ollama provider
    this.providers.set('ollama', {
      name: 'Local (Ollama)',
      provider: 'ollama',
      enabled: true,
      models: [],
      baseUrl: 'http://localhost:11434'
    });

    // Initialize cloud providers (disabled by default until API keys are provided)
    const cloudProviders: Array<{provider: ModelProvider, name: string, baseUrl?: string}> = [
      { provider: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1' },
      { provider: 'groq', name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1' },
      { provider: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1' },
      { provider: 'qwen', name: 'Qwen', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
      { provider: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1' }
    ];

    cloudProviders.forEach(({provider, name, baseUrl}) => {
      // Check localStorage for saved configuration
      const savedApiKey = localStorage.getItem(`modelProvider_${provider}_apiKey`);
      const savedEnabled = localStorage.getItem(`modelProvider_${provider}_enabled`) === 'true';
      
      this.providers.set(provider, {
        name,
        provider,
        enabled: savedApiKey ? savedEnabled : false, // Only enable if API key is saved and was enabled
        models: DEFAULT_MODELS[provider] || [],
        baseUrl,
        apiKey: savedApiKey || undefined
      });
    });
  }

  // Configure provider with API key
  configureProvider(provider: ModelProvider, apiKey: string, enabled: boolean = true) {
    const config = this.providers.get(provider);
    if (config) {
      config.apiKey = apiKey;
      config.enabled = enabled;
      // Store configuration in localStorage
      localStorage.setItem(`modelProvider_${provider}_apiKey`, apiKey);
      localStorage.setItem(`modelProvider_${provider}_enabled`, enabled.toString());
      this.refreshAvailableModels();
    }
  }

  // Get all available unified models
  getAvailableModels(): UnifiedModel[] {
    return this.availableModels;
  }

  // Get all models including unconfigured cloud providers (for UI display)
  getAllModelsForUI(): UnifiedModel[] {
    const allModels: UnifiedModel[] = [...this.availableModels];
    
    // Add unconfigured cloud providers as disabled options
    for (const [provider, config] of this.providers) {
      if (provider !== 'ollama' && !config.apiKey) {
        // Add disabled cloud models to show in UI with configure option
        const cloudModels = this.convertCloudModelsToUnified(config.models, provider, false);
        // Filter out any models that might already be in availableModels (shouldn't happen but safety check)
        const newCloudModels = cloudModels.filter(newModel => 
          !allModels.some(existingModel => existingModel.id === newModel.id)
        );
        allModels.push(...newCloudModels);
      }
    }
    
    // Sort models by provider priority
    allModels.sort((a, b) => {
      const providerPriority = { ollama: 1, groq: 2, openai: 3, deepseek: 4, qwen: 5, openrouter: 6 };
      return providerPriority[a.provider] - providerPriority[b.provider];
    });
    
    return allModels;
  }

  // Get models for a specific provider
  getModelsForProvider(provider: ModelProvider): UnifiedModel[] {
    return this.availableModels.filter(model => model.provider === provider);
  }

  // Refresh available models from all enabled providers
  async refreshAvailableModels(): Promise<void> {
    this.availableModels = [];

    for (const [provider, config] of this.providers) {
      if (!config.enabled) continue;

      if (provider === 'ollama') {
        // Fetch Ollama models dynamically
        try {
          const ollamaModels = await this.fetchOllamaModels();
          // Filter out duplicates based on model ID
          const newOllamaModels = ollamaModels.filter(newModel => 
            !this.availableModels.some(existingModel => existingModel.id === newModel.id)
          );
          this.availableModels.push(...newOllamaModels);
        } catch (error) {
          console.warn('Failed to fetch Ollama models:', error);
        }
      } else {
        // Add cloud models if provider is configured
        if (config.apiKey) {
          const cloudModels = this.convertCloudModelsToUnified(config.models, provider, true);
          // Filter out duplicates based on model ID
          const newCloudModels = cloudModels.filter(newModel => 
            !this.availableModels.some(existingModel => existingModel.id === newModel.id)
          );
          this.availableModels.push(...newCloudModels);
        }
      }
    }

    // Sort models by provider priority and performance
    this.availableModels.sort((a, b) => {
      const providerPriority = { ollama: 1, groq: 2, openai: 3, deepseek: 4, qwen: 5, openrouter: 6 };
      return providerPriority[a.provider] - providerPriority[b.provider];
    });
  }

  private async fetchOllamaModels(): Promise<UnifiedModel[]> {
    try {
      const response = await fetch('http://localhost:3001/api/models/ollama');
      if (!response.ok) {
        throw new Error(`Failed to fetch Ollama models: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const unifiedModels = data.models.map((model: any) => this.convertOllamaToUnified(model));
      
      // Sort models to prioritize gemma3:1b first
      unifiedModels.sort((a: UnifiedModel, b: UnifiedModel) => {
        if (a.id === 'gemma3:1b') return -1;
        if (b.id === 'gemma3:1b') return 1;
        return a.id.localeCompare(b.id);
      });
      
      return unifiedModels;
    } catch (error) {
      console.warn('Ollama not available:', error);
      return [];
    }
  }

  private convertOllamaToUnified(ollamaModel: any): UnifiedModel {
    return {
      id: `ollama:${ollamaModel.name}`,
      name: ollamaModel.name,
      displayName: `${ollamaModel.name} (Local)`,
      provider: 'ollama',
      config: {
        provider: 'ollama',
        model: ollamaModel.name
      },
      isAvailable: true,
      performance: {
        speed: ollamaModel.name.includes('3b') ? 'fast' : 
               ollamaModel.name.includes('7b') ? 'medium' : 'slow',
        quality: ollamaModel.name.includes('3b') ? 'medium' : 'high',
        cost: 'free'
      }
    };
  }

  private convertCloudModelsToUnified(cloudModels: CloudModel[], provider: ModelProvider, isAvailable: boolean = true): UnifiedModel[] {
    const hasApiKey = this.providers.get(provider)?.apiKey;
    return cloudModels.map(model => ({
      id: `${provider}:${model.id}`,
      name: model.id,
      displayName: `${model.name} (${this.providers.get(provider)?.name})`,
      provider,
      config: {
        provider,
        model: model.id,
        apiKey: hasApiKey
      },
      isAvailable: isAvailable && !!hasApiKey,
      performance: {
        speed: model.speed,
        quality: model.quality,
        cost: model.costPer1kTokens ? 
              (model.costPer1kTokens < 0.001 ? 'low' : 
               model.costPer1kTokens < 0.003 ? 'medium' : 'high') : 'medium'
      }
    }));
  }

  // Get default model (prioritize gemma3:1b, then first available)
  getDefaultModel(): UnifiedModel | null {
    if (this.availableModels.length === 0) return null;
    
    // First try to find gemma3:1b
    const gemmaModel = this.availableModels.find(model => model.id === 'gemma3:1b');
    if (gemmaModel) {
      return gemmaModel;
    }
    
    // Fallback to first available model
    return this.availableModels[0];
  }

  // Find model by ID
  findModelById(id: string): UnifiedModel | null {
    return this.availableModels.find(model => model.id === id) || null;
  }

  // Check if a provider is configured
  isProviderConfigured(provider: ModelProvider): boolean {
    const config = this.providers.get(provider);
    return config ? config.enabled && (provider === 'ollama' || !!config.apiKey) : false;
  }

  // Get provider configuration
  getProviderConfig(provider: ModelProvider): ProviderConfig | null {
    return this.providers.get(provider) || null;
  }
}

// Export singleton instance
export const modelProviderService = new ModelProviderService();
export default modelProviderService;