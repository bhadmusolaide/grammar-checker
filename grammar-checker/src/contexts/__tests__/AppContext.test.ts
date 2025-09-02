import { appReducer, AppState } from '../AppContext';

const initialState: AppState = {
  editor: {
    text: '',
    results: null,
    isLoading: false,
    error: null,
  },
  humanize: {
    isHumanizing: false,
    options: {
      tone: 'neutral',
      strength: 'medium',
    },
    result: null,
    error: null,
  },
  settings: {
    selectedServices: ['ollama'],
    language: 'en-US',
    autoCheckEnabled: true,
    selectedModel: null,
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

describe('appReducer', () => {
  it('should return initial state when undefined', () => {
    const state = appReducer(initialState, { type: 'UNKNOWN' } as any);
    expect(state).toBeDefined();
    expect(state.editor.text).toBe('');
    expect(state.editor.isLoading).toBe(false);
  });

  it('should handle SET_TEXT action', () => {
    const action = { type: 'SET_TEXT', payload: 'Hello world' };
    const newState = appReducer(initialState, action as any);
    
    expect(newState.editor.text).toBe('Hello world');
  });

  it('should handle SET_LOADING action', () => {
    const action = { type: 'SET_LOADING', payload: true };
    const newState = appReducer(initialState, action as any);
    
    expect(newState.editor.isLoading).toBe(true);
  });

  it('should handle SET_ACTIVE_TAB action', () => {
    const action = { type: 'SET_ACTIVE_TAB', payload: 'suggestions' };
    const newState = appReducer(initialState, action as any);
    
    expect(newState.ui.activeTab).toBe('suggestions');
  });

  it('should handle TOGGLE_MODAL action', () => {
    const action = { type: 'TOGGLE_MODAL', payload: 'modelConfig' };
    const newState = appReducer(initialState, action as any);
    
    expect(newState.ui.modals.modelConfig).toBe(true);
  });

  it('should handle TOGGLE_MOBILE_MENU action', () => {
    const action = { type: 'TOGGLE_MOBILE_MENU' };
    const newState = appReducer(initialState, action as any);
    
    expect(newState.ui.isMobileMenuOpen).toBe(true);
  });

  it('should handle CLOSE_MOBILE_MENU action', () => {
    const toggleAction = { type: 'TOGGLE_MOBILE_MENU' };
    const closeAction = { type: 'CLOSE_MOBILE_MENU' };
    
    const stateWithMenu = appReducer(initialState, toggleAction as any);
    expect(stateWithMenu.ui.isMobileMenuOpen).toBe(true);
    
    const stateAfterClose = appReducer(stateWithMenu, closeAction as any);
    expect(stateAfterClose.ui.isMobileMenuOpen).toBe(false);
  });

  it('should handle CLEAR_EDITOR action', () => {
    const setTextAction = { type: 'SET_TEXT', payload: 'some text' };
    const clearAction = { type: 'CLEAR_EDITOR' };
    
    const stateWithText = appReducer(initialState, setTextAction as any);
    expect(stateWithText.editor.text).toBe('some text');
    
    const stateAfterClear = appReducer(stateWithText, clearAction as any);
    expect(stateAfterClear.editor.text).toBe('');
    expect(stateAfterClear.editor.results).toBe(null);
  });
});