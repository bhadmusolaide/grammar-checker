import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { modelProviderService } from '../services/modelProvider';
import { 
  GrammarResult, 
  UnifiedModel,
  CareerToolsResult,
  HumanizeOptions,
  HumanizeResult,
  ChatState,
  ChatSession,
  ChatMessage,
  SavedAnalysis
} from '../types';

// Define the state structure
export interface AppState {
  editor: {
    text: string;
    results: GrammarResult | null;
    isLoading: boolean;
    error: string | null;
  };
  humanize: {
    isHumanizing: boolean;
    options: HumanizeOptions;
    result: HumanizeResult | null;
    error: string | null;
  };
  settings: {
    language: string;
    autoCheckEnabled: boolean;
    selectedModel: UnifiedModel | null;
    aiAnalysisEnabled: boolean;
    selectedServices: string[];
  };
  ui: {
    activeTab: 'input' | 'suggestions';
    modals: {
      modelConfig: boolean;
      writingScore: boolean;
      careerTools: boolean;
      chat: boolean;
    };
    isMobileMenuOpen: boolean;
  };
  careerTools: {
    loading: boolean;
    results: CareerToolsResult | undefined;
  };
  savedAnalyses: {
    analyses: SavedAnalysis[];
    loading: boolean;
    error: string | null;
  };
  chat: ChatState;
}

// Define action types
export type AppAction =
  // Editor actions
  | { type: 'SET_TEXT'; payload: string }
  | { type: 'SET_RESULTS'; payload: GrammarResult | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_EDITOR' }
  
  // Humanize actions
  | { type: 'SET_HUMANIZE_OPTIONS'; payload: HumanizeOptions }
  | { type: 'HUMANIZE_START' }
  | { type: 'HUMANIZE_SUCCESS'; payload: HumanizeResult }
  | { type: 'HUMANIZE_ERROR'; payload: string }
  | { type: 'HUMANIZE_CLEAR' }
  | { type: 'APPLY_HUMANIZED_TEXT' }

  // Settings actions
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'SET_AUTO_CHECK'; payload: boolean }
  | { type: 'SET_SELECTED_MODEL'; payload: UnifiedModel | null }
  | { type: 'SET_AI_ANALYSIS'; payload: boolean }
  | { type: 'SET_SELECTED_SERVICES'; payload: string[] }
  
  // UI actions
  | { type: 'SET_ACTIVE_TAB'; payload: 'input' | 'suggestions' }
  | { type: 'TOGGLE_MODAL'; payload: keyof AppState['ui']['modals'] }
  | { type: 'CLOSE_ALL_MODALS' }
  | { type: 'TOGGLE_MOBILE_MENU' }
  | { type: 'CLOSE_MOBILE_MENU' }
  
  // Career tools actions
  | { type: 'SET_CAREER_TOOLS_LOADING'; payload: boolean }
  | { type: 'SET_CAREER_TOOLS_RESULTS'; payload: CareerToolsResult | undefined }
  
  // Saved analyses actions
  | { type: 'SET_SAVED_ANALYSES'; payload: SavedAnalysis[] }
  | { type: 'ADD_SAVED_ANALYSIS'; payload: SavedAnalysis }
  | { type: 'UPDATE_SAVED_ANALYSIS'; payload: { id: string; updates: Partial<SavedAnalysis> } }
  | { type: 'DELETE_SAVED_ANALYSIS'; payload: string }
  | { type: 'SET_SAVED_ANALYSES_LOADING'; payload: boolean }
  | { type: 'SET_SAVED_ANALYSES_ERROR'; payload: string | null }
  
  // Chat actions
  | { type: 'CREATE_CHAT_SESSION'; payload: { title?: string; model?: UnifiedModel } }
  | { type: 'SET_CURRENT_SESSION'; payload: string | null }
  | { type: 'SET_CURRENT_CHAT_SESSION'; payload: string | null }
  | { type: 'ADD_CHAT_SESSION'; payload: ChatSession }
  | { type: 'SET_CHAT_SESSIONS'; payload: ChatSession[] }
  | { type: 'UPDATE_CHAT_SESSION'; payload: { sessionId: string; updates: Partial<ChatSession> } }
  | { type: 'ADD_CHAT_MESSAGE'; payload: { sessionId: string; message: Omit<ChatMessage, 'id' | 'timestamp'> } }
  | { type: 'UPDATE_CHAT_MESSAGE'; payload: { sessionId: string; messageId: string; updates: Partial<ChatMessage> } }
  | { type: 'DELETE_CHAT_SESSION'; payload: string }
  | { type: 'CLEAR_CHAT_HISTORY' }
  | { type: 'SET_CHAT_LOADING'; payload: boolean }
  | { type: 'SET_CHAT_ERROR'; payload: string | null }
  | { type: 'SET_CHAT_TYPING'; payload: boolean };

// Initial state
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
    language: 'en-US',
    autoCheckEnabled: true,
    selectedModel: null,
    aiAnalysisEnabled: true,
    selectedServices: [],
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

// Reducer function
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // Editor actions
    case 'SET_TEXT':
      return {
        ...state,
        editor: {
          ...state.editor,
          text: action.payload,
        },
      };
      
    case 'SET_RESULTS':
      return {
        ...state,
        editor: {
          ...state.editor,
          results: action.payload,
        },
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        editor: {
          ...state.editor,
          isLoading: action.payload,
        },
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        editor: {
          ...state.editor,
          error: action.payload,
        },
      };
      
    case 'CLEAR_EDITOR':
      return {
        ...state,
        editor: {
          ...state.editor,
          text: '',
          results: null,
          error: null,
        },
      };
      
    // Humanize actions
    case 'SET_HUMANIZE_OPTIONS':
      return {
        ...state,
        humanize: {
          ...state.humanize,
          options: action.payload,
        },
      };
    case 'HUMANIZE_START':
      return {
        ...state,
        humanize: {
          ...state.humanize,
          isHumanizing: true,
          error: null,
          result: null,
        },
      };
    case 'HUMANIZE_SUCCESS':
      return {
        ...state,
        humanize: {
          ...state.humanize,
          isHumanizing: false,
          result: action.payload,
        },
      };
    case 'HUMANIZE_ERROR':
      return {
        ...state,
        humanize: {
          ...state.humanize,
          isHumanizing: false,
          error: action.payload,
        },
      };
    case 'APPLY_HUMANIZED_TEXT':
      if (!state.humanize.result) return state;
      return {
        ...state,
        editor: {
          ...state.editor,
          text: state.humanize.result.text,
        },
        humanize: {
          ...state.humanize,
          result: null, // Clear result after applying
        },
      };
    case 'HUMANIZE_CLEAR':
      return {
        ...state,
        humanize: {
          ...state.humanize,
          result: null,
          error: null,
        },
      };

    // Settings actions
    case 'SET_LANGUAGE':
      return {
        ...state,
        settings: {
          ...state.settings,
          language: action.payload,
        },
      };
      
    case 'SET_AUTO_CHECK':
      return {
        ...state,
        settings: {
          ...state.settings,
          autoCheckEnabled: action.payload,
        },
      };
      
    case 'SET_SELECTED_MODEL':
      return {
        ...state,
        settings: {
          ...state.settings,
          selectedModel: action.payload,
        },
      };
      
    case 'SET_AI_ANALYSIS':
      return {
        ...state,
        settings: {
          ...state.settings,
          aiAnalysisEnabled: action.payload,
        },
      };
    case 'SET_SELECTED_SERVICES':
      return {
        ...state,
        settings: {
          ...state.settings,
          selectedServices: action.payload,
        },
      };
      
    // UI actions
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        ui: {
          ...state.ui,
          activeTab: action.payload,
        },
      };
      

      
    case 'TOGGLE_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          modals: {
            ...state.ui.modals,
            [action.payload]: !state.ui.modals[action.payload],
          },
        },
      };
      
    case 'CLOSE_ALL_MODALS':
      return {
        ...state,
        ui: {
          ...state.ui,
          modals: {
            modelConfig: false,
            writingScore: false,
            careerTools: false,
            chat: false,
          },
        },
      };

    case 'TOGGLE_MOBILE_MENU':
      return {
        ...state,
        ui: {
          ...state.ui,
          isMobileMenuOpen: !state.ui.isMobileMenuOpen,
        },
      };

    case 'CLOSE_MOBILE_MENU':
      return {
        ...state,
        ui: {
          ...state.ui,
          isMobileMenuOpen: false,
        },
      };
      
    // Career tools actions
    case 'SET_CAREER_TOOLS_LOADING':
      return {
        ...state,
        careerTools: {
          ...state.careerTools,
          loading: action.payload,
        },
      };
      
    case 'SET_CAREER_TOOLS_RESULTS':
      return {
        ...state,
        careerTools: {
          ...state.careerTools,
          results: action.payload,
        },
      };
      
    // Saved analyses actions
    case 'SET_SAVED_ANALYSES':
      return {
        ...state,
        savedAnalyses: {
          ...state.savedAnalyses,
          analyses: action.payload,
        },
      };
      
    case 'ADD_SAVED_ANALYSIS':
      return {
        ...state,
        savedAnalyses: {
          ...state.savedAnalyses,
          analyses: [...state.savedAnalyses.analyses, action.payload],
        },
      };
      
    case 'UPDATE_SAVED_ANALYSIS':
      return {
        ...state,
        savedAnalyses: {
          ...state.savedAnalyses,
          analyses: state.savedAnalyses.analyses.map(analysis =>
            analysis.id === action.payload.id
              ? { ...analysis, ...action.payload.updates, updatedAt: new Date() }
              : analysis
          ),
        },
      };
      
    case 'DELETE_SAVED_ANALYSIS':
      return {
        ...state,
        savedAnalyses: {
          ...state.savedAnalyses,
          analyses: state.savedAnalyses.analyses.filter(analysis => analysis.id !== action.payload),
        },
      };
      
    case 'SET_SAVED_ANALYSES_LOADING':
      return {
        ...state,
        savedAnalyses: {
          ...state.savedAnalyses,
          loading: action.payload,
        },
      };
      
    case 'SET_SAVED_ANALYSES_ERROR':
      return {
        ...state,
        savedAnalyses: {
          ...state.savedAnalyses,
          error: action.payload,
        },
      };
      
    // Chat actions
    case 'CREATE_CHAT_SESSION': {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: action.payload.title || 'New Chat',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        model: action.payload.model,
      };
      return {
        ...state,
        chat: {
          ...state.chat,
          sessions: [...state.chat.sessions, newSession],
          currentSessionId: newSession.id,
        },
      };
    }
    
    case 'SET_CURRENT_SESSION':
    case 'SET_CURRENT_CHAT_SESSION':
      return {
        ...state,
        chat: {
          ...state.chat,
          currentSessionId: action.payload,
        },
      };
      
    case 'ADD_CHAT_SESSION':
      return {
        ...state,
        chat: {
          ...state.chat,
          sessions: [...state.chat.sessions, action.payload],
        },
      };
      
    case 'SET_CHAT_SESSIONS':
      return {
        ...state,
        chat: {
          ...state.chat,
          sessions: action.payload,
        },
      };
      
    case 'UPDATE_CHAT_SESSION': {
      const { sessionId, updates } = action.payload;
      return {
        ...state,
        chat: {
          ...state.chat,
          sessions: state.chat.sessions.map(session =>
            session.id === sessionId
              ? { ...session, ...updates, updatedAt: new Date() }
              : session
          ),
        },
      };
    }
      
    case 'ADD_CHAT_MESSAGE': {
      const { sessionId, message } = action.payload;
      const newMessage: ChatMessage = {
        ...message,
        id: Date.now().toString(),
        timestamp: new Date(),
      };
      
      return {
        ...state,
        chat: {
          ...state.chat,
          sessions: state.chat.sessions.map(session =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: [...(session.messages || []), newMessage],
                  updatedAt: new Date(),
                }
              : session
          ),
        },
      };
    }
    
    case 'UPDATE_CHAT_MESSAGE': {
      const { sessionId, messageId, updates } = action.payload;
      return {
        ...state,
        chat: {
          ...state.chat,
          sessions: state.chat.sessions.map(session =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: (session.messages || []).map(message =>
                    message.id === messageId
                      ? { ...message, ...updates }
                      : message
                  ),
                  updatedAt: new Date(),
                }
              : session
          ),
        },
      };
    }
    
    case 'DELETE_CHAT_SESSION':
      return {
        ...state,
        chat: {
          ...state.chat,
          sessions: state.chat.sessions.filter(session => session.id !== action.payload),
          currentSessionId: state.chat.currentSessionId === action.payload ? null : state.chat.currentSessionId,
        },
      };
      
    case 'CLEAR_CHAT_HISTORY':
      return {
        ...state,
        chat: {
          ...state.chat,
          sessions: [],
          currentSessionId: null,
        },
      };
      
    case 'SET_CHAT_LOADING':
      return {
        ...state,
        chat: {
          ...state.chat,
          isLoading: action.payload,
        },
      };
      
    case 'SET_CHAT_ERROR':
      return {
        ...state,
        chat: {
          ...state.chat,
          error: action.payload,
        },
      };
      
    case 'SET_CHAT_TYPING':
      return {
        ...state,
        chat: {
          ...state.chat,
          isTyping: action.payload,
        },
      };
      
    default:
      return state;
  }
}

// Create context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const initialize = async () => {
      await modelProviderService.init();
      const models = modelProviderService.getAvailableModels();
      if (models.length > 0) {
        dispatch({ type: 'SET_SELECTED_MODEL', payload: models[0] });
      }
    };
    initialize();
  }, []);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}