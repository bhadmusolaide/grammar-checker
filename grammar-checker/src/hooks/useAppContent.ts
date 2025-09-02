import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useGrammarApi } from './useGrammarApi';
import { useModalManager } from './useModalManager';
import { modelProviderService } from '../services/modelProvider';
import { UnifiedModel, ServiceResult } from '../types';

export const useAppContent = () => {
  const { state, dispatch } = useAppContext();
  const {
    handleCheck,
    handleHumanize,
    handleCareerTools,
    isLoading,
    isHumanizing,
    isCareerToolsLoading,
  } = useGrammarApi();

  const {
    isModelConfigOpen,
    isWritingScoreOpen,
    isCareerToolsOpen,
    handleModelChange,
    handleConfigureProvider,
    handleModelConfigurationUpdate,
    handleAiAnalysisToggle,
    handleCareerToolsOpen,
    handleCareerToolsClose,
    handleViewWritingScoreDetails,
  } = useModalManager();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await modelProviderService.refreshAvailableModels();
        const models = modelProviderService.getAllModelsForUI();
        if (!state.settings.selectedModel && models.length > 0) {
          const firstAvailableModel = models.find(model => model.isAvailable) || models[0];
          dispatch({ type: 'SET_SELECTED_MODEL', payload: firstAvailableModel || null });
        }
      } catch (error) {
        console.error('Failed to load models:', error);
        setHasError(true);
        setErrorMessage(`Failed to load models: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    try {
      loadModels();
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error in useEffect:', error);
      setHasError(true);
        setErrorMessage(`Error initializing app: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
  }, [dispatch, state.settings.selectedModel]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const getAllSuggestions = useCallback(() => {
    if (!state.editor.results) return [];
    const allSuggestions = [];
    
    // Check all AI providers for suggestions
    const aiProviders: (keyof typeof state.editor.results)[] = ['ollama', 'openai', 'groq', 'deepseek', 'qwen', 'openrouter'];
    for (const provider of aiProviders) {
      const result = state.editor.results[provider] as ServiceResult | undefined;
      if (result?.suggestions) {
        allSuggestions.push(...result.suggestions);
      }
    }
    
    return allSuggestions;
  }, [state.editor.results]);

  // Debounced grammar check to prevent race conditions
  const debouncedGrammarCheck = useCallback((text: string, model: UnifiedModel, language: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      handleCheck(text, model, language);
    }, 500); // 500ms debounce delay
  }, [handleCheck]);

  const handleTextChange = (newText: string, isPaste = false) => {
    dispatch({ type: 'SET_TEXT', payload: newText });
    if (state.settings.autoCheckEnabled && newText.trim()) {
      let modelToUse: UnifiedModel | null = state.settings.selectedModel;
      if (!modelToUse) {
        const availableModels = modelProviderService.getAvailableModels();
        modelToUse = availableModels.length > 0 ? availableModels[0] : null;
        if (modelToUse) {
          dispatch({ type: 'SET_SELECTED_MODEL', payload: modelToUse });
        }
      }
      if (modelToUse) {
        if (isPaste) {
          // For paste events, use a shorter delay but still debounce
          setTimeout(() => {
            debouncedGrammarCheck(newText, modelToUse!, state.settings.language);
          }, 100);
        } else if (newText.trim().length > 10) {
          // For regular typing, use debounced check to prevent race conditions
          debouncedGrammarCheck(newText, modelToUse, state.settings.language);
        }
      }
    }
  };

  const handleClear = () => {
    dispatch({ type: 'CLEAR_EDITOR' });
  };

  const handleApplyCorrectedText = () => {
    console.log('handleApplyCorrectedText called');
    console.log('Current editor results:', state.editor.results);
    console.log('Corrected text available:', state.editor.results?.corrected_text);
    
    if (state.editor.results?.corrected_text) {
      const originalText = state.editor.text;
      const correctedText = state.editor.results.corrected_text;
      
      console.log('Original text:', originalText);
      console.log('Corrected text:', correctedText);
      console.log('Text changed:', originalText !== correctedText);
      
      dispatch({ type: 'SET_TEXT', payload: correctedText });
      console.log('Applied corrected text to editor successfully');
    } else {
      console.log('No corrected text available to apply');
    }
  };

  const handleCheckWrapper = () => {
    let modelToUse: UnifiedModel | null = state.settings.selectedModel;
    if (!modelToUse) {
      modelProviderService.refreshAvailableModels().then(() => {
        const availableModels = modelProviderService.getAvailableModels();
        modelToUse = availableModels.length > 0 ? availableModels[0] : null;
        if (modelToUse) {
          dispatch({ type: 'SET_SELECTED_MODEL', payload: modelToUse });
          handleCheck(state.editor.text, modelToUse, state.settings.language);
        } else {
          setHasError(true);
          setErrorMessage('No AI model available. Please configure a model in the settings.');
        }
      }).catch(() => {
        const availableModels = modelProviderService.getAvailableModels();
        modelToUse = availableModels.length > 0 ? availableModels[0] : null;
        if (modelToUse) {
          dispatch({ type: 'SET_SELECTED_MODEL', payload: modelToUse });
          handleCheck(state.editor.text, modelToUse, state.settings.language);
        } else {
          setHasError(true);
          setErrorMessage('No AI model available. Please configure a model in the settings.');
        }
      });
    } else {
      handleCheck(state.editor.text, modelToUse, state.settings.language);
    }
  };

  const handleHumanizeOptionsChange = (options: any) => {
    dispatch({ type: 'SET_HUMANIZE_OPTIONS', payload: options });
  };

  const handleRequestHumanizeWrapper = () => {
    let modelToUse: UnifiedModel | null = state.settings.selectedModel;
    if (!modelToUse) {
      const availableModels = modelProviderService.getAvailableModels();
      modelToUse = availableModels.length > 0 ? availableModels[0] : null;
      if (modelToUse) {
        dispatch({ type: 'SET_SELECTED_MODEL', payload: modelToUse });
      }
    }
    if (modelToUse) {
      handleHumanize(
        state.editor.text,
        state.humanize.options.tone,
        state.humanize.options.strength,
        modelToUse
      );
    } else {
      setHasError(true);
      setErrorMessage('No AI model available for humanization. Please configure a model in the settings.');
    }
  };

  const handleAcceptHumanized = () => {
    if (state.humanize.result) {
      dispatch({ type: 'APPLY_HUMANIZED_TEXT' });
      dispatch({
        type: 'SET_HUMANIZE_OPTIONS',
        payload: {
          ...state.humanize.options,
          humanizedText: undefined,
          showDiff: false,
        },
      });
    }
  };

  const handleRejectHumanized = () => {
    dispatch({ type: 'HUMANIZE_CLEAR' });
    dispatch({
      type: 'SET_HUMANIZE_OPTIONS',
      payload: {
        ...state.humanize.options,
        humanizedText: undefined,
        showDiff: false,
      },
    });
  };

  const handleCareerToolsSubmit = async (
    input: any,
    type: any,
    options: any,
    selectedCareerModel: any
  ) => {
    let modelToUse = selectedCareerModel || state.settings.selectedModel;
    if (!modelToUse) {
      const availableModels = modelProviderService.getAvailableModels();
      modelToUse = availableModels.length > 0 ? availableModels[0] : null;
      if (modelToUse) {
        dispatch({ type: 'SET_SELECTED_MODEL', payload: modelToUse });
      }
    }
    if (modelToUse) {
      await handleCareerTools(
        input,
        type,
        options,
        modelToUse
      );
    } else {
      setHasError(true);
      setErrorMessage('No AI model available for career tools. Please configure a model in the settings.');
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  const resetError = () => {
    setHasError(false);
    setErrorMessage('');
  };

  return {
    // State
    state,
    dispatch,
    isLoading,
    isHumanizing,
    isCareerToolsLoading,
    isModelConfigOpen,
    isWritingScoreOpen,
    isCareerToolsOpen,
    showOnboarding,
    hasError,
    errorMessage,
    
    // Handlers
    handleModelChange,
    handleConfigureProvider,
    handleModelConfigurationUpdate,
    handleAiAnalysisToggle,
    handleCareerToolsOpen,
    handleCareerToolsClose,
    handleViewWritingScoreDetails,
    handleTextChange,
    handleClear,
    handleApplyCorrectedText,
    handleCheckWrapper,
    handleHumanizeOptionsChange,
    handleRequestHumanizeWrapper,
    handleAcceptHumanized,
    handleRejectHumanized,
    handleCareerToolsSubmit,
    handleOnboardingComplete,
    getAllSuggestions,
    resetError,
  };
};