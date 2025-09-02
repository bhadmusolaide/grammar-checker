import { renderHook, act } from '@testing-library/react';
import { useGrammarApi } from '../useGrammarApi';
import { AppState } from '../../contexts/AppContext';
import { ModelProvider } from '../../types';

// Mock the useAppContext hook
jest.mock('../../contexts/AppContext', () => ({
  useAppContext: jest.fn(),
}));

// Mock the model provider service
jest.mock('../../services/modelProviderService', () => ({
  checkGrammar: jest.fn(),
  humanizeText: jest.fn(),
  careerTools: jest.fn(),
}));

const mockModelProviderService = require('../../services/modelProviderService');
const mockUseAppContext = require('../../contexts/AppContext').useAppContext;

describe('useGrammarApi', () => {
  const mockDispatch = jest.fn();
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppContext.mockReturnValue({
      state: mockState,
      dispatch: mockDispatch,
    });
  });

  describe('handleCheck', () => {
    it('should not call API when no text is provided', async () => {
      const { result } = renderHook(() => useGrammarApi());

      await act(async () => {
        await result.current.handleCheck('', mockState.settings.selectedModel!, 'en-US');
      });

      expect(mockModelProviderService.checkGrammar).not.toHaveBeenCalled();
    });

    it('should not call API when no model is selected', async () => {
      const { result } = renderHook(() => useGrammarApi());

      await act(async () => {
        await result.current.handleCheck('Test text', null as any, 'en-US');
      });

      expect(mockModelProviderService.checkGrammar).not.toHaveBeenCalled();
    });

    it('should call API with correct parameters', async () => {
      const mockResults = { suggestions: [], score: 85 };
      mockModelProviderService.checkGrammar.mockResolvedValue(mockResults);

      const { result } = renderHook(() => useGrammarApi());

        await act(async () => {
          await result.current.handleCheck('Test text', mockState.settings.selectedModel!, 'en-US');
        });

        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_LOADING', payload: true });
        expect(mockModelProviderService.checkGrammar).toHaveBeenCalledWith(
          'Test text',
          'en-US',
          'ollama',
         { id: 'test-model', name: 'Test Model', provider: 'openai' }
        );
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_RESULTS', payload: mockResults });
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_LOADING', payload: false });
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockModelProviderService.checkGrammar.mockRejectedValue(error);

      const { result } = renderHook(() => useGrammarApi());

      await act(async () => {
        await result.current.handleCheck('Test text', mockState.settings.selectedModel!, 'en-US');
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_ERROR', payload: 'API Error' });
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_LOADING', payload: false });
    });
  });

  describe('handleHumanize', () => {
    it('should not call API when no text is provided', async () => {
      const { result } = renderHook(() => useGrammarApi());

      await act(async () => {
        await result.current.handleHumanize('Test text', 'neutral', 'medium', mockState.settings.selectedModel!);
      });

      expect(mockModelProviderService.humanizeText).not.toHaveBeenCalled();
    });

    it('should call humanize API with correct parameters', async () => {
      const mockResult = { text: 'Humanized text', changes: [] };
      mockModelProviderService.humanizeText.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useGrammarApi());

      await act(async () => {
        await result.current.handleHumanize('Test text', 'neutral', 'medium', mockState.settings.selectedModel!);
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'HUMANIZE_START' });
      expect(mockModelProviderService.humanizeText).toHaveBeenCalledWith(
        'Test text',
        { tone: 'neutral', strength: 'medium' },
        { id: 'test-model', name: 'Test Model', provider: 'openai' }
      );
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'HUMANIZE_SUCCESS', payload: mockResult });
    });
  });

  describe('handleCareerTools', () => {
    it('should call career tools API with correct parameters', async () => {
      const mockResults = { suggestions: [] };
      mockModelProviderService.careerTools.mockResolvedValue(mockResults);

      const { result } = renderHook(() => useGrammarApi());

      const careerInput = {
        resumeFile: new File(['test'], 'resume.pdf', { type: 'application/pdf' }),
        targetPosition: 'Software Engineer'
      };
      const options = {
        atsOptimization: true,
        achievementTransformation: true,
        formatConversion: false
      };

      await act(async () => {
        await result.current.handleCareerTools(careerInput, 'resume', options, mockState.settings.selectedModel!);
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_CAREER_TOOLS_LOADING', payload: true });
      expect(mockModelProviderService.careerTools).toHaveBeenCalledWith(
        careerInput,
        'resume',
        options,
        { id: 'test-model', name: 'Test Model', provider: 'openai' }
      );
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_CAREER_TOOLS_RESULTS', payload: mockResults });
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_CAREER_TOOLS_LOADING', payload: false });
    });
  });
});