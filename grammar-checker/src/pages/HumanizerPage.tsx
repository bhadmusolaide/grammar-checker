import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useAppContent } from '../hooks/useAppContent';
import Layout from '../components/Layout';
import { FullPageLoader } from '../components/common/LoadingStates';
import { modelProviderService } from '../services/modelProvider';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

import Button from '../design-system/components/Button';
import Card from '../design-system/components/Card';
import Tabs from '../design-system/components/Tabs';

// Lazy load components for better performance
const DiffView = lazy(() => import('../components/DiffView'));
const HumanizedResultView = lazy(() => import('../components/HumanizedResultView'));
const SimpleTextEditor = lazy(() => import('../components/SimpleTextEditor'));

// Define the HumanizeOptions type (expand based on existing implementation)
interface HumanizeOptions {
  tone: 'neutral' | 'friendly' | 'professional' | 'casual' | 'academic';
  strength: 'light' | 'medium' | 'strong';
  humanizedText?: string;
  showDiff?: boolean;
  modelPreference?: 'default' | 'powerful' | 'balanced' | 'fast';
}

const HumanizerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  const [inputText, setInputText] = useState('');
  const [humanizeOptions, setHumanizeOptions] = useState<HumanizeOptions>({
    tone: 'neutral',
    strength: 'medium',
    modelPreference: 'balanced'
  });
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [humanizedText, setHumanizedText] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [viewMode, setViewMode] = useState<'diff' | 'clean'>('diff');
  const [history, setHistory] = useState<Array<{id: string; date: Date; original: string; humanized: string}>>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    state,

  } = useAppContent();

  // Function to handle humanize action
  const handleHumanize = async () => {
    if (!inputText.trim()) return;
    
    setIsHumanizing(true);
    setError(null); // Clear any previous errors
    
    try {
      // Determine the best model based on user preference
      const getModelConfig = () => {
        // Use user's selected model as base config
        const baseConfig = {
          provider: state.settings.selectedModel?.provider || 'ollama',
          model: state.settings.selectedModel?.name || 'gemma3:1b'
        };
        
        // Get API key from model provider service
        const getApiKeyForProvider = (provider: string) => {
          const providerConfig = modelProviderService.getProviderConfig(provider as any);
          return providerConfig?.apiKey;
        };
        
        // Enhance model selection based on preference
        switch (humanizeOptions.modelPreference) {
          case 'powerful':
            // If OpenAI is available, use GPT-4
            const openaiKey = getApiKeyForProvider('openai');
            if (openaiKey) {
              return {
                provider: 'openai',
                model: 'gpt-4',
                apiKey: openaiKey
              };
            }
            // If Groq is available, use Mixtral
            const groqKey = getApiKeyForProvider('groq');
            if (groqKey) {
              return {
                provider: 'groq',
                model: 'mixtral-8x7b-32768',
                apiKey: groqKey
              };
            }
            // Otherwise use the best available Ollama model
            else if (baseConfig.provider === 'ollama') {
              return {
                ...baseConfig,
                model: 'llama3:70b' // Use the largest model available or fallback
              };
            }
            return baseConfig;
            
          case 'fast':
            // If Groq is available, use Llama 3
            const groqKeyFast = getApiKeyForProvider('groq');
            if (groqKeyFast) {
              return {
                provider: 'groq',
                model: 'llama-3.1-8b-instant',
                apiKey: groqKeyFast
              };
            }
            // Otherwise use the fastest available Ollama model
            else if (baseConfig.provider === 'ollama') {
              return {
                ...baseConfig,
                model: 'gemma2:9b' // Use a smaller, faster model
              };
            }
            return baseConfig;
            
          case 'balanced':
          default:
            // Use whatever model the user has selected
            return baseConfig;
        }
      };
      
      const modelConfig = getModelConfig();
      console.log('Using model config for humanization:', modelConfig);
      console.log('API_BASE_URL for humanize request:', API_BASE_URL);
      
      // Call the humanize API
      const response = await fetch(`${API_BASE_URL}/api/enhance/humanize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          modelConfig,
          tone: humanizeOptions.tone,
          strength: humanizeOptions.strength
        }),
      });
      
      console.log('Humanize API response status:', response.status);
      console.log('Humanize API response headers:', [...response.headers.entries()]);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Humanize API error data:', errorData);
        throw new Error(`Failed to humanize text: ${response.status} ${response.statusText}. ${errorData.error || ''}`);
      }
      
      const data = await response.json();
      console.log('Humanize API response:', data);
      
      // Extract the humanized text from the response
      // The API may return the humanized text in different properties
      const humanizedText = data.humanized || data.humanizedText || data.text;
      
      if (!humanizedText) {
        throw new Error('No humanized text returned from API');
      }
      
      // Update state with humanized text
      setHumanizedText(humanizedText);
      setShowDiff(true);
      
      // Add to history
      const historyItem = {
        id: Date.now().toString(),
        date: new Date(),
        original: inputText,
        humanized: humanizedText,
        settings: {
          tone: humanizeOptions.tone,
          strength: humanizeOptions.strength,
          modelPreference: humanizeOptions.modelPreference
        }
      };
      
      setHistory(prev => [historyItem, ...prev]);
      
    } catch (error) {
      console.error('Humanization error:', error);
      // Show a more specific error message based on the response
      let errorMessage = 'Failed to humanize text. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setIsHumanizing(false);
    }
  };

  // Function to accept humanized text
  const handleAcceptHumanized = () => {
    if (humanizedText) {
      setInputText(humanizedText);
      setHumanizedText(null);
      setShowDiff(false);
    }
  };

  // Function to reject humanized text
  const handleRejectHumanized = () => {
    setHumanizedText(null);
    setShowDiff(false);
  };

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('humanizer-history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed);
      } catch (e) {
        console.error('Failed to parse humanizer history', e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('humanizer-history', JSON.stringify(history));
    }
  }, [history]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
              AI Humanizer
            </h1>
            <p className="text-gray-600 mt-1">
              Refine your writing to sound more natural and less AI-generated
            </p>
          </div>

          <Tabs
            tabs={[
              { id: 'editor', label: 'Humanizer' },
              { id: 'history', label: 'History' }
            ]}
            activeTab={activeTab}
            onTabChange={(id: string) => setActiveTab(id as 'editor' | 'history')}
            className=""
          />
        </div>

        {activeTab === 'editor' ? (
          <div className="space-y-6">
            {/* Settings Panel at the top */}
            <Card className="p-6 bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm border border-gray-200/60 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1 space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800">Humanize Settings</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
                      <select
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200"
                        value={humanizeOptions.tone}
                        onChange={(e) => setHumanizeOptions(prev => ({
                          ...prev,
                          tone: e.target.value as HumanizeOptions['tone']
                        }))}
                      >
                        <option value="neutral">Neutral</option>
                        <option value="friendly">Friendly</option>
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="academic">Academic</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        How the text should sound to readers
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Strength</label>
                      <select
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200"
                        value={humanizeOptions.strength}
                        onChange={(e) => setHumanizeOptions(prev => ({
                          ...prev,
                          strength: e.target.value as HumanizeOptions['strength']
                        }))}
                      >
                        <option value="light">Light</option>
                        <option value="medium">Medium</option>
                        <option value="strong">Strong</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        How extensively to modify the text
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Model Preference</label>
                      <select
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200"
                        value={humanizeOptions.modelPreference}
                        onChange={(e) => setHumanizeOptions(prev => ({
                          ...prev,
                          modelPreference: e.target.value as HumanizeOptions['modelPreference']
                        }))}
                      >
                        <option value="powerful">Powerful (Best Results)</option>
                        <option value="balanced">Balanced (Default)</option>
                        <option value="fast">Fast (Quickest Response)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        More powerful models provide better humanization but may take longer
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-medium mb-1">Anti-Detection Humanizer</p>
                        <p>Transforms AI-generated text with natural human patterns that bypass AI detectors while preserving your meaning.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Best Practices for Maximum Effectiveness
                    </h3>
                    <ul className="space-y-2 text-xs text-amber-900">
                      <li className="flex items-start">
                        <svg className="w-3.5 h-3.5 text-amber-600 mt-0.5 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span><strong>Use Strong Transformation:</strong> The "Strong" strength setting applies more extensive changes, which is typically better for evading AI detection.</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-3.5 h-3.5 text-amber-600 mt-0.5 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span><strong>Choose the Right Tone:</strong> Match the tone to your intended audience and purpose. This creates more natural-sounding text.</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-3.5 h-3.5 text-amber-600 mt-0.5 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span><strong>Use More Powerful Models:</strong> When available, models like GPT-4 or Claude will produce better humanization results than smaller models.</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-3.5 h-3.5 text-amber-600 mt-0.5 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span><strong>Post-Edit If Necessary:</strong> For critical content, make a few manual edits after humanization for an extra layer of uniqueness.</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-3.5 h-3.5 text-amber-600 mt-0.5 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span><strong>Test with AI Detectors:</strong> Periodically test your humanized content with different AI detection tools to ensure it's effective.</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <Button
                    onClick={handleHumanize}
                    disabled={isHumanizing || !inputText.trim()}
                    className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    {isHumanizing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Humanizing...
                      </>
                    ) : 'Humanize Text'}
                  </Button>
                </div>
              </div>
              
              {/* Error Display */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-2 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-medium">Error</p>
                      <p className="mt-1">{error}</p>
                      <div className="mt-2">
                        <p className="text-xs">Possible solutions:</p>
                        <ul className="list-disc list-inside text-xs mt-1">
                          <li>Check if the backend server is running</li>
                          <li>Make sure a valid AI model is selected</li>
                          <li>Try with shorter text or different options</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Two-column layout for Input and Result */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Area */}
              <Card className="p-6 bg-white border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 h-[500px] flex flex-col">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                  Original Text
                </h2>
                <div className="flex-1 overflow-hidden">
                  <Suspense fallback={<FullPageLoader />}>
                    <SimpleTextEditor
                      text={inputText}
                      onTextChange={setInputText}
                      placeholder="Enter your text here to humanize..."
                    />
                  </Suspense>
                </div>
              </Card>

              {/* Output Area */}
              <Card className="p-6 bg-white border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 h-[500px] flex flex-col">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    Humanized Result
                  </div>
                  
                  {showDiff && humanizedText && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setViewMode('diff')}
                        className={`px-2 py-1 text-xs rounded-md ${
                          viewMode === 'diff' 
                            ? 'bg-orange-100 text-orange-700 font-medium' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Show Diff
                      </button>
                      <button
                        onClick={() => setViewMode('clean')}
                        className={`px-2 py-1 text-xs rounded-md ${
                          viewMode === 'clean' 
                            ? 'bg-green-100 text-green-700 font-medium' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Clean View
                      </button>
                    </div>
                  )}
                </h2>
                <div className="flex-1 overflow-hidden relative">
                  {showDiff && humanizedText ? (
                    <div className="h-full flex flex-col">
                      <div className="flex-1 overflow-auto p-3 bg-white rounded-xl">
                        <Suspense fallback={<FullPageLoader />}>
                          {viewMode === 'diff' ? (
                            <DiffView 
                              originalText={inputText} 
                              newText={humanizedText} 
                              className="min-h-[300px]"
                            />
                          ) : (
                            <HumanizedResultView
                              humanizedText={humanizedText}
                              className="min-h-[300px]"
                            />
                          )}
                        </Suspense>
                      </div>
                      
                      <div className="flex justify-end space-x-3 mt-4 border-t border-gray-100 pt-4">
                        <Button
                          onClick={handleRejectHumanized}
                          variant="secondary"
                          className="px-5"
                        >
                          Reject
                        </Button>
                        <Button
                          onClick={handleAcceptHumanized}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center p-6 rounded-2xl bg-gray-50/80 backdrop-blur-sm border border-gray-100 max-w-sm">
                        {inputText.trim() ? (
                          isHumanizing ? (
                            <div className="text-center">
                              <div className="w-12 h-12 border-4 border-amber-300 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                              <p className="text-gray-700 font-medium">AI is processing your text...</p>
                              <p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
                            </div>
                          ) : (
                            <>
                              <div className="text-4xl mb-3">✨</div>
                              <h3 className="text-lg font-medium text-gray-800 mb-1">Ready to Humanize</h3>
                              <p className="text-gray-600 text-sm">Click "Humanize Text" to transform your content</p>
                            </>
                          )
                        ) : (
                          <>
                            <div className="text-4xl mb-3">📝</div>
                            <h3 className="text-lg font-medium text-gray-800 mb-1">Enter Some Text</h3>
                            <p className="text-gray-600 text-sm">Add content in the original text panel to get started</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        ) : (
          // History Tab
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                Humanization History
              </h2>
              
              {history.length > 0 && (
                <Button
                  onClick={() => setHistory([])}
                  variant="danger"
                  size="small"
                  className="text-xs"
                >
                  Clear History
                </Button>
              )}
            </div>
            
            {history.length === 0 ? (
              <div className="bg-gray-50/80 backdrop-blur-sm border border-gray-100 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📂</span>
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No History Yet</h3>
                <p className="text-gray-600 max-w-md mx-auto">Humanize some text to build your collection of transformations.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {history.map(item => (
                  <Card 
                    key={item.id} 
                    className="p-0 overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
                      <span className="text-sm text-gray-500 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(item.date).toLocaleString()}
                      </span>
                      <div className="flex space-x-2">
                        <Button 
                          size="small"
                          variant="secondary"
                          onClick={() => {
                            setInputText(item.original);
                            setHumanizedText(item.humanized);
                            setShowDiff(true);
                            setActiveTab('editor');
                          }}
                          className="text-xs"
                        >
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Load
                        </Button>
                        <Button 
                          size="small"
                          variant="danger"
                          onClick={() => {
                            setHistory(prev => prev.filter(h => h.id !== item.id));
                          }}
                          className="text-xs"
                        >
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                      <div className="p-4">
                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                          <span className="inline-block w-1.5 h-1.5 bg-amber-400 rounded-full mr-1"></span>
                          Original
                        </h3>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap max-h-36 overflow-y-auto bg-white p-3 rounded-lg border border-gray-100">
                          {item.original}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50">
                        <h3 className="text-xs font-medium text-orange-600 uppercase tracking-wider mb-2 flex items-center">
                          <span className="inline-block w-1.5 h-1.5 bg-orange-500 rounded-full mr-1"></span>
                          Humanized
                        </h3>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap max-h-36 overflow-y-auto bg-white p-3 rounded-lg border border-green-100">
                          {item.humanized}
                        </p>
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.humanized);
                              // Visual feedback would be added here in a production app
                            }}
                            className="text-xs text-orange-600 hover:text-orange-800 flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002-2h2a2 2 0 002 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HumanizerPage;