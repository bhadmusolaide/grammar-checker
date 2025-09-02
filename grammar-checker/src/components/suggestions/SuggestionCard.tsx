import React, { memo, useState } from 'react';
import { Suggestion } from '../../types';

interface SuggestionCardProps {
  suggestion: Suggestion;
  onApply: (suggestion: Suggestion) => void;
  onIgnore?: (suggestion: Suggestion) => void;
  text?: string;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ 
  suggestion, 
  onApply, 
  onIgnore,
  text 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'high': return 'border-red-400 bg-gradient-to-br from-red-50 to-red-100 shadow-red-100';
      case 'medium': return 'border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-100 shadow-amber-100';
      case 'low': return 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-100 shadow-blue-100';
      default: return 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 shadow-gray-100';
    }
  };

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case 'high': return { icon: '⚠️', label: 'Critical' };
      case 'medium': return { icon: '💡', label: 'Important' };
      case 'low': return { icon: '✨', label: 'Suggestion' };
      default: return { icon: '📝', label: 'Note' };
    }
  };
  
  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('grammar')) return '📝';
    if (cat.includes('spelling')) return '🔤';
    if (cat.includes('style')) return '🎨';
    if (cat.includes('clarity')) return '💎';
    if (cat.includes('tone')) return '🎭';
    if (cat.includes('structure')) return '🏗️';
    if (cat.includes('engagement')) return '🚀';
    return '💡';
  };

  // Enhanced context preview with better formatting
  const getContextPreview = () => {
    if (!text || suggestion.offset === undefined || suggestion.length === undefined) return null;
    
    const start = Math.max(0, suggestion.offset - 50);
    const end = Math.min(text.length, suggestion.offset + suggestion.length + 50);
    const contextText = text.slice(start, end);
    
    const errorStart = suggestion.offset - start;
    const errorEnd = errorStart + suggestion.length;
    
    const beforeError = contextText.slice(0, errorStart);
    const errorText = contextText.slice(errorStart, errorEnd);
    const afterError = contextText.slice(errorEnd);
    
    return {
      before: beforeError.trim(),
      error: errorText.trim(),
      after: afterError.trim(),
      replacement: suggestion.replacements?.[0] || '',
      fullContext: contextText.trim()
    };
  };
  
  // Generate explanation based on suggestion data
  const getDetailedExplanation = () => {
    const category = suggestion.category.toLowerCase();

    
    let explanation = suggestion.message;
    
    // Add category-specific explanations
    if (category.includes('grammar')) {
      explanation += " This helps ensure your writing follows proper grammatical rules and improves readability.";
    } else if (category.includes('style')) {
      explanation += " This suggestion enhances your writing style and makes it more engaging for readers.";
    } else if (category.includes('clarity')) {
      explanation += " This change will make your message clearer and easier to understand.";
    }
    
    return explanation;
  };

  const contextPreview = getContextPreview();
  const severityInfo = getSeverityIcon(suggestion.severity);
  const categoryIcon = getCategoryIcon(suggestion.category);

  return (
    <div className={`group rounded-2xl p-6 mb-4 transition-all duration-300 hover:shadow-xl border-2 shadow-lg ${
      getSeverityColor(suggestion.severity)
    } hover:scale-[1.02] transform`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center border border-gray-200">
                <span className="text-xl">{categoryIcon}</span>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-wide px-3 py-1 bg-white rounded-full shadow-sm border border-gray-200">
                    {suggestion.category}
                  </span>
                  <div className={`flex items-center space-x-1 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                    suggestion.severity === 'high' ? 'text-red-700 bg-red-200 border border-red-300' :
                    suggestion.severity === 'medium' ? 'text-amber-700 bg-amber-200 border border-amber-300' :
                    'text-blue-700 bg-blue-200 border border-blue-300'
                  }`}>
                    <span>{severityInfo.icon}</span>
                    <span>{severityInfo.label}</span>
                  </div>
                </div>
                {suggestion.confidence && (
                  <div className="flex items-center space-x-1 text-xs text-gray-600">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span>{Math.round(suggestion.confidence * 100)}% confidence</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Details Toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-white/50 transition-colors"
              title={showDetails ? 'Hide details' : 'Show details'}
            >
              <svg className={`w-5 h-5 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {/* Main Message */}
          <div className="mb-4">
            <p className="text-gray-800 text-base leading-relaxed font-medium">{suggestion.message}</p>
            
            {/* Detailed Explanation (expandable) */}
            {showDetails && (
              <div className="mt-3 p-4 bg-white/70 rounded-xl border border-white/80">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <span className="mr-2">💡</span>
                  Why this matters:
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">{getDetailedExplanation()}</p>
              </div>
            )}
          </div>
          
          {/* Enhanced Context Preview */}
          {contextPreview && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4 shadow-sm">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-sm font-semibold text-gray-700">📍 In context:</span>
              </div>
              
              {/* Original Text */}
              <div className="mb-4">
                <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Current:</div>
                <div className="text-sm leading-relaxed p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-700">{contextPreview.before}</span>
                  <span className="bg-red-200 text-red-900 px-2 py-1 rounded font-semibold border border-red-300">
                    {contextPreview.error}
                  </span>
                  <span className="text-gray-700">{contextPreview.after}</span>
                </div>
              </div>
              
              {/* Suggested Change Preview */}
              {contextPreview.replacement && (
                <div>
                  <div className="text-xs font-medium text-green-600 mb-2 uppercase tracking-wide flex items-center">
                    <span className="mr-1">✨</span>
                    Suggested:
                  </div>
                  <div className="text-sm leading-relaxed p-3 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-gray-700">{contextPreview.before}</span>
                    <span className="bg-green-200 text-green-900 px-2 py-1 rounded font-semibold border border-green-300">
                      {typeof contextPreview.replacement === 'string' ? contextPreview.replacement : contextPreview.replacement.value}
                    </span>
                    <span className="text-gray-700">{contextPreview.after}</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Enhanced Replacement Suggestions */}
          {suggestion.replacements && suggestion.replacements.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <span className="mr-2">🔄</span>
                Suggested replacement{suggestion.replacements.length > 1 ? 's' : ''}:
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestion.replacements.slice(0, 3).map((replacement, index) => (
                  <button
                    key={index}
                    onClick={() => onApply({...suggestion, replacements: [replacement]})}
                    className="bg-gradient-to-r from-emerald-100 to-green-100 hover:from-emerald-200 hover:to-green-200 text-emerald-800 px-4 py-2 rounded-lg text-sm font-medium border border-emerald-300 transition-all duration-200 hover:shadow-md transform hover:scale-105"
                  >
                    "{replacement.value}"
                  </button>
                ))}
                {suggestion.replacements.length > 3 && (
                  <span className="text-xs text-gray-500 px-2 py-2">
                    +{suggestion.replacements.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-white/50">
          <div className="flex items-center space-x-2">
            {suggestion.replacements && suggestion.replacements.length > 0 && (
              <button
                onClick={() => onApply(suggestion)}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-sm px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold flex items-center space-x-2 border border-emerald-400"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Accept Fix</span>
              </button>
            )}
            
            {onIgnore && (
              <button
                onClick={() => onIgnore(suggestion)}
                className="bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-700 text-sm px-4 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg border border-gray-300 font-medium flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>Dismiss</span>
              </button>
            )}
          </div>
          
          {/* Confidence Indicator */}
          {suggestion.confidence && (
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  suggestion.confidence > 0.8 ? 'bg-green-400' :
                  suggestion.confidence > 0.6 ? 'bg-yellow-400' : 'bg-red-400'
                }`}></div>
                <span className="font-medium">{Math.round(suggestion.confidence * 100)}% sure</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Custom comparison function for React.memo
const areEqual = (prevProps: SuggestionCardProps, nextProps: SuggestionCardProps) => {
  return (
    prevProps.suggestion === nextProps.suggestion &&
    prevProps.text === nextProps.text &&
    // We don't compare functions as they're typically stable
    // but we should be careful with onApply and onIgnore
    prevProps.onApply === nextProps.onApply &&
    prevProps.onIgnore === nextProps.onIgnore
  );
};

export default memo(SuggestionCard, areEqual);