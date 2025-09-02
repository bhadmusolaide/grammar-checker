import React, { useState, useMemo } from 'react';
import { SuggestionsPanelProps, Suggestion } from '../types';
import SuggestionCard from './SuggestionCard';

const SimpleSuggestionsPanel: React.FC<SuggestionsPanelProps> = ({
  results,
  isLoading,
  text,
  onTextChange,
  onApplyCorrectedText,
  error
}) => {
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  // Get all suggestions from the results
  const allSuggestions: Suggestion[] = [];
  
  if (results) {
    // Check if direct suggestions exist first (for compatibility with orchestrator)
    if (results.suggestions) {
      allSuggestions.push(...results.suggestions);
    } else {
      // Check all possible AI provider keys
      const aiProviders = ['ollama', 'openai', 'groq', 'deepseek', 'qwen', 'openrouter'];
      
      for (const provider of aiProviders) {
        const result = results[provider as keyof typeof results] as any;
        if (result?.suggestions) {
          allSuggestions.push(...result.suggestions);
        }
      }
    }
  }
  
  // Filter out dismissed suggestions and duplicates
  const activeSuggestions = useMemo(() => {
    // First, filter out dismissed suggestions
    const undismissedSuggestions = allSuggestions.filter(suggestion => {
      const suggestionId = `${suggestion.type}-${suggestion.message}-${suggestion.offset || 0}`;
      return !dismissedSuggestions.has(suggestionId);
    });
    
    // Then, filter out duplicates by comparing message content and offset
    const uniqueSuggestions: Suggestion[] = [];
    const messageOffsetMap = new Map<string, boolean>();
    
    for (const suggestion of undismissedSuggestions) {
      // Create a unique key for this suggestion
      const originalText = suggestion.original || 
        (suggestion.offset !== undefined && suggestion.length !== undefined ? 
          text.substring(suggestion.offset, suggestion.offset + suggestion.length) : '');
      
      const key = `${originalText}-${suggestion.message}`;
      
      if (!messageOffsetMap.has(key)) {
        messageOffsetMap.set(key, true);
        uniqueSuggestions.push(suggestion);
      }
    }
    
    return uniqueSuggestions;
  }, [allSuggestions, dismissedSuggestions, text]);

  const handleDismiss = (suggestion: Suggestion) => {
    const suggestionId = `${suggestion.type}-${suggestion.message}-${suggestion.offset || 0}`;
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
  };

  const handleAccept = (suggestion: Suggestion) => {
    // Apply the suggestion to the text
    if (suggestion.offset !== undefined && suggestion.length !== undefined && suggestion.replacements && suggestion.replacements.length > 0) {
      const correctedText = suggestion.replacements[0].value;
      const newText = 
        text.substring(0, suggestion.offset) + 
        correctedText + 
        text.substring(suggestion.offset + suggestion.length);
      onTextChange(newText);
    }
    
    // Dismiss the suggestion after accepting
    handleDismiss(suggestion);
  };

  const handleAcceptAll = () => {
    // If we have corrected_text from the backend, apply it directly
    if (results?.corrected_text && onApplyCorrectedText) {
      onApplyCorrectedText();
    } else {
      // Apply all suggestions one by one
      let newText = text;
      const sortedSuggestions = [...activeSuggestions].sort((a, b) => 
        (b.offset || 0) - (a.offset || 0)
      );
      
      for (const suggestion of sortedSuggestions) {
        if (suggestion.offset !== undefined && suggestion.length !== undefined && suggestion.replacements && suggestion.replacements.length > 0) {
          const correctedText = suggestion.replacements[0].value;
          newText = 
            newText.substring(0, suggestion.offset) + 
            correctedText + 
            newText.substring(suggestion.offset + suggestion.length);
        }
      }
      
      onTextChange(newText);
      // Dismiss all suggestions
      const allSuggestionIds = activeSuggestions.map(s => 
        `${s.type}-${s.message}-${s.offset || 0}`
      );
      setDismissedSuggestions(prev => new Set([...prev, ...allSuggestionIds]));
    }
  };

  const handleDismissAll = () => {
    const allSuggestionIds = activeSuggestions.map(s => 
      `${s.type}-${s.message}-${s.offset || 0}`
    );
    setDismissedSuggestions(prev => new Set([...prev, ...allSuggestionIds]));
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p className="text-gray-600">Checking grammar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-white p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
          <h3 className="text-red-800 font-bold mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!results || activeSuggestions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Issues Found</h3>
          <p className="text-gray-600 text-sm">Your text looks good! No grammar issues detected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header with bulk actions */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Suggestions ({activeSuggestions.length})</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleAcceptAll}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
            >
              Accept All
            </button>
            <button
              onClick={handleDismissAll}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
            >
              Dismiss All
            </button>
          </div>
        </div>
      </div>
      
      {/* Suggestions list */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeSuggestions.map((suggestion, index) => (
          <SuggestionCard
            key={index}
            suggestion={suggestion}
            onAccept={handleAccept}
            onDismiss={handleDismiss}
            text={text}
          />
        ))}
      </div>
    </div>
  );
};

export default SimpleSuggestionsPanel;