import { useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { UnifiedModel } from '../types';
import modelProviderService from '../services/modelProvider';

export const useModalManager = () => {
  const { state, dispatch } = useAppContext();

  const openModal = useCallback((modalName: keyof typeof state.ui.modals) => {
    dispatch({ type: 'TOGGLE_MODAL', payload: modalName });
  }, [dispatch]);

  const closeModal = useCallback((modalName: keyof typeof state.ui.modals) => {
    dispatch({ type: 'TOGGLE_MODAL', payload: modalName });
  }, [dispatch]);

  const toggleModal = useCallback((modalName: keyof typeof state.ui.modals) => {
    dispatch({ type: 'TOGGLE_MODAL', payload: modalName });
  }, [dispatch]);

  const handleModelChange = useCallback((model: UnifiedModel) => {
    if (model.isAvailable) {
      dispatch({ type: 'SET_SELECTED_MODEL', payload: model });
    } else {
      openModal('modelConfig');
    }
  }, [dispatch, openModal]);

  const handleConfigureProvider = useCallback(() => {
    openModal('modelConfig');
  }, [openModal]);

  const handleModelConfigurationUpdate = useCallback(async () => {
    await modelProviderService.refreshAvailableModels();
    const models = modelProviderService.getAllModelsForUI();
    
    // Update selected model if it's no longer available
    if (state.settings.selectedModel && !models.find((m: UnifiedModel) => m.id === state.settings.selectedModel?.id && m.isAvailable)) {
      const defaultModel = modelProviderService.getDefaultModel();
      if (defaultModel) {
        dispatch({ type: 'SET_SELECTED_MODEL', payload: defaultModel });
      } else {
        // Fallback to first available model
        const availableModel = models.find((m: UnifiedModel) => m.isAvailable);
        if (availableModel) {
          dispatch({ type: 'SET_SELECTED_MODEL', payload: availableModel });
        }
      }
    }
  }, [dispatch, state.settings.selectedModel]);

  const handleAiAnalysisToggle = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_AI_ANALYSIS', payload: enabled });
    if (enabled) {
      // Enable ollama service when AI Analysis is turned on
      if (!state.settings.selectedServices.includes('ollama')) {
        dispatch({ 
          type: 'SET_SELECTED_SERVICES', 
          payload: [...state.settings.selectedServices, 'ollama'] 
        });
      }
    } else {
      // Disable ollama service when AI Analysis is turned off
      dispatch({ 
        type: 'SET_SELECTED_SERVICES', 
        payload: state.settings.selectedServices.filter(s => s !== 'ollama') 
      });
    }
  }, [dispatch, state.settings.selectedServices]);

  const handleViewWritingScoreDetails = useCallback(() => {
    openModal('writingScore');
  }, [openModal]);

  const handleCareerToolsOpen = useCallback(() => {
    openModal('careerTools');
    dispatch({ type: 'SET_CAREER_TOOLS_RESULTS', payload: undefined });
  }, [dispatch, openModal]);

  const handleCareerToolsClose = useCallback(() => {
    closeModal('careerTools');
    dispatch({ type: 'SET_CAREER_TOOLS_LOADING', payload: false });
  }, [dispatch, closeModal]);



  return {
    // Modal states
    isModelConfigOpen: state.ui.modals.modelConfig,
    isWritingScoreOpen: state.ui.modals.writingScore,
    isCareerToolsOpen: state.ui.modals.careerTools,
    
    // Modal operations
    openModal,
    closeModal,
    toggleModal,
    
    // Model operations
    handleModelChange,
    handleConfigureProvider,
    handleModelConfigurationUpdate,
    handleAiAnalysisToggle,
    
    // Career tools
    handleCareerToolsOpen,
    handleCareerToolsClose,
    
    // Writing score
    handleViewWritingScoreDetails
  };
};