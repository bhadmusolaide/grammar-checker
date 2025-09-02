import { renderHook, act } from '@testing-library/react';
import { useModalManager } from '../useModalManager';
import { AppState } from '../../contexts/AppContext';
import { ModelProvider } from '../../types';

// Mock the useAppContext hook
jest.mock('../../contexts/AppContext', () => ({
  useAppContext: jest.fn(),
}));

const mockUseAppContext = require('../../contexts/AppContext').useAppContext;

const mockState: AppState = {
  editor: {
    text: 'Test text',
    results: null,
    isLoading: false,
    error: null,
  },
  humanize: {
    isHumanizing: false,
    options: { tone: 'neutral', strength: 'medium' },
    result: null,
    error: null,
  },
  settings: {
    selectedServices: ['ollama'],
    language: 'en-US',
    autoCheckEnabled: true,
    selectedModel: { id: 'test-model', name: 'Test Model', provider: 'openai' as ModelProvider, displayName: 'Test Model', config: { provider: 'openai' as ModelProvider, model: 'test-model' }, isAvailable: true, performance: { speed: 'fast' as const, quality: 'high' as const, cost: 'medium' as const } },
    aiAnalysisEnabled: false,
  },
  ui: {
    activeTab: 'input',
    modals: {
      modelConfig: false,
      writingScore: false,
      careerTools: false,
      chat: false,
    },
    isMobileMenuOpen: false,
  },
  careerTools: {
    loading: false,
    results: undefined,
  },
  savedAnalyses: {
    analyses: [],
    loading: false,
    error: null,
  },
  chat: {
    sessions: [],
    currentSessionId: null,
    isLoading: false,
    error: null,
    isTyping: false,
  },
};

describe('useModalManager', () => {
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockUseAppContext.mockReturnValue({
      state: mockState,
      dispatch: mockDispatch,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return all modal management functions', () => {
    const { result } = renderHook(() => useModalManager());

    expect(result.current).toHaveProperty('handleConfigureProvider');
    expect(result.current).toHaveProperty('handleModelChange');
    expect(result.current).toHaveProperty('handleAiAnalysisToggle');
    expect(result.current).toHaveProperty('handleViewWritingScoreDetails');
    expect(result.current).toHaveProperty('handleCareerToolsOpen');
    expect(result.current).toHaveProperty('handleCareerToolsClose');
  });

  describe('modal handlers', () => {
    it('should open model config modal', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.handleConfigureProvider();
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'TOGGLE_MODAL', payload: 'modelConfig' });
    });

    it('should handle model change', () => {
      const { result } = renderHook(() => useModalManager());
      const newModel = { id: 'new-model', name: 'New Model', provider: 'openai' as ModelProvider, displayName: 'New Model', config: { provider: 'openai' as ModelProvider, model: 'new-model' }, isAvailable: true, performance: { speed: 'fast' as const, quality: 'high' as const, cost: 'medium' as const } };

      act(() => {
        result.current.handleModelChange(newModel);
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_SELECTED_MODEL', payload: newModel });
    });

    it('should toggle AI analysis', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.handleAiAnalysisToggle(true);
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_AI_ANALYSIS', payload: true });
    });

    it('should open writing score modal', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.handleViewWritingScoreDetails();
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'TOGGLE_MODAL', payload: 'writingScore' });
    });

    it('should open career tools modal', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.handleCareerToolsOpen();
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'TOGGLE_MODAL', payload: 'careerTools' });
    });
  });

  describe('career tools submission', () => {
    it('should handle career tools submission with valid data', async () => {
      const { result } = renderHook(() => useModalManager());
      act(() => {
        result.current.handleCareerToolsOpen();
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'TOGGLE_MODAL', payload: 'careerTools' });
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_CAREER_TOOLS_RESULTS', payload: undefined });
    });

    it('should handle career tools close', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.handleCareerToolsClose();
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'TOGGLE_MODAL', payload: 'careerTools' });
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_CAREER_TOOLS_LOADING', payload: false });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'CLOSE_ALL_MODALS' });
    });
  });
});