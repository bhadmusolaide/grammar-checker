import React, { useState, useRef, useEffect, ReactElement, memo } from 'react';
import { Suggestion } from '../types';
import { diffWords } from 'diff';

interface HighlightedTextEditorProps {
  text: string;
  onTextChange: (text: string, isPaste?: boolean) => void;
  suggestions: Suggestion[];
  placeholder?: string;
  onSuggestionClick?: (suggestion: Suggestion) => void;
  autoCheckEnabled?: boolean;
  humanizedText?: string;
  showDiff?: boolean;
  onAcceptHumanized?: () => void;
  onRejectHumanized?: () => void;
  readOnly?: boolean;
}

interface HighlightRange {
  start: number;
  end: number;
  suggestion: Suggestion;
  color: string;
  id: string;
  icon: string;
}

const HighlightedTextEditor: React.FC<HighlightedTextEditorProps> = ({
  text,
  onTextChange,
  suggestions,
  placeholder,
  onSuggestionClick,
  autoCheckEnabled = false,
  humanizedText,
  showDiff = false,
  onAcceptHumanized,
  onRejectHumanized,
  readOnly = false
}) => {
  const [highlightRanges, setHighlightRanges] = useState<HighlightRange[]>([]);
  const [hoveredSuggestion, setHoveredSuggestion] = useState<Suggestion | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Enhanced color mapping with suggestion type-based styling
  const getHighlightStyle = (suggestion: Suggestion) => {
    const suggestionType = suggestion.suggestionType || 
      (suggestion.isError ? 'error' : 'improvement');
    const severity = suggestion.severity || 'medium';
    
    // Suggestion type-based styles (highest priority)
    const suggestionTypeStyles: Record<string, Record<string, string>> = {
      critical_error: {
        high: 'border-b-2 border-red-700 bg-red-200/90 text-red-950 decoration-wavy decoration-red-700 underline-offset-2 shadow-sm',
        medium: 'border-b-2 border-red-600 bg-red-100/80 text-red-900 decoration-wavy decoration-red-600 underline-offset-2',
        low: 'border-b-2 border-red-500 bg-red-50/60 text-red-800 decoration-wavy decoration-red-500 underline-offset-2'
      },
      error: {
        high: 'border-b-2 border-red-600 bg-red-100/80 text-red-900 decoration-wavy decoration-red-600 underline-offset-2',
        medium: 'border-b-2 border-red-500 bg-red-50/60 text-red-800 decoration-wavy decoration-red-500 underline-offset-2',
        low: 'border-b border-red-400 bg-red-50/40 text-red-700 decoration-dotted decoration-red-400 underline-offset-2'
      },
      improvement: {
        high: 'border-b-2 border-blue-500 bg-blue-100/60 text-blue-900 decoration-wavy decoration-blue-500 underline-offset-2',
        medium: 'border-b-2 border-blue-400 bg-blue-50/40 text-blue-800 decoration-dotted decoration-blue-400 underline-offset-2',
        low: 'border-b border-blue-300 bg-blue-50/20 text-blue-700'
      },
      style_suggestion: {
        high: 'border-b-2 border-purple-500 bg-purple-100/60 text-purple-900 decoration-wavy decoration-purple-500 underline-offset-2',
        medium: 'border-b-2 border-purple-400 bg-purple-50/40 text-purple-800 decoration-dotted decoration-purple-400 underline-offset-2',
        low: 'border-b border-purple-300 bg-purple-50/20 text-purple-700'
      },
      enhancement: {
        high: 'border-b-2 border-emerald-500 bg-emerald-100/60 text-emerald-900 decoration-wavy decoration-emerald-500 underline-offset-2',
        medium: 'border-b-2 border-emerald-400 bg-emerald-50/40 text-emerald-800 decoration-dotted decoration-emerald-400 underline-offset-2',
        low: 'border-b border-emerald-300 bg-emerald-50/20 text-emerald-700'
      }
    };
    
    // Use suggestion type styles if available
    if (suggestionTypeStyles[suggestionType]) {
      return suggestionTypeStyles[suggestionType][severity] || suggestionTypeStyles[suggestionType].medium;
    }
    
    // Fallback to category-based styles
    const categoryStyles: Record<string, Record<string, string>> = {
      grammar: {
        high: 'border-b-2 border-red-500 bg-red-50/60 text-red-800 decoration-wavy decoration-red-500 underline-offset-2',
        medium: 'border-b-2 border-red-400 bg-red-50/40 text-red-700 decoration-dotted decoration-red-400 underline-offset-2',
        low: 'border-b border-red-300 bg-red-50/20 text-red-600'
      },
      clarity: {
        high: 'border-b-2 border-amber-500 bg-amber-100/60 text-amber-900 decoration-wavy decoration-amber-500 underline-offset-2',
        medium: 'border-b-2 border-amber-400 bg-amber-50/40 text-amber-800 decoration-dotted decoration-amber-400 underline-offset-2',
        low: 'border-b border-amber-300 bg-amber-50/20 text-amber-700'
      },
      tone: {
        high: 'border-b-2 border-purple-500 bg-purple-100/60 text-purple-900 decoration-wavy decoration-purple-500 underline-offset-2',
        medium: 'border-b-2 border-purple-400 bg-purple-50/40 text-purple-800 decoration-dotted decoration-purple-400 underline-offset-2',
        low: 'border-b border-purple-300 bg-purple-50/20 text-purple-700'
      },
      style: {
        high: 'border-b-2 border-blue-500 bg-blue-100/60 text-blue-900 decoration-wavy decoration-blue-500 underline-offset-2',
        medium: 'border-b-2 border-blue-400 bg-blue-50/40 text-blue-800 decoration-dotted decoration-blue-400 underline-offset-2',
        low: 'border-b border-blue-300 bg-blue-50/20 text-blue-700'
      },
      spelling: {
        high: 'border-b-2 border-red-600 bg-red-100/80 text-red-900 decoration-wavy decoration-red-600 underline-offset-2',
        medium: 'border-b-2 border-red-500 bg-red-50/60 text-red-800 decoration-wavy decoration-red-500 underline-offset-2',
        low: 'border-b border-red-400 bg-red-50/40 text-red-700'
      }
    };
    
    const category = suggestion.category?.toLowerCase() || suggestion.type || 'style';
    return categoryStyles[category]?.[severity] || categoryStyles.style[severity] || 'border-b border-gray-400 bg-gray-50/20 text-gray-700';
  };
  
  // Get icon for suggestion type with enhanced categorization
  const getSuggestionIcon = (suggestion: Suggestion): string => {
    // Use suggestionType if available, otherwise fall back to detection
    const suggestionType = suggestion.suggestionType || 
      (suggestion.isError ? 'error' : 'improvement');
    
    switch (suggestionType) {
      case 'critical_error': return '🚨';
      case 'error': return '⚠️';
      case 'improvement': return '💡';
      case 'style_suggestion': return '✨';
      case 'enhancement': return '🚀';
      default: break;
    }
    
    // Fallback to category-based icons
    const category = suggestion.category?.toLowerCase() || suggestion.type || 'style';
    switch (category) {
      case 'grammar': return '📝';
      case 'spelling': return '🔤';
      case 'clarity': return '💡';
      case 'tone': return '🎭';
      case 'style': return '✨';
      case 'engagement': return '🎯';
      default: return '💭';
    }
  };

  // Generate highlight ranges from suggestions
  useEffect(() => {
    const ranges: HighlightRange[] = suggestions
      .filter(suggestion => 
        suggestion.offset !== undefined && 
        suggestion.length !== undefined &&
        suggestion.offset >= 0 &&
        suggestion.length > 0 &&
        suggestion.offset + suggestion.length <= text.length
      )
      .map((suggestion, index) => ({
        start: suggestion.offset!,
        end: suggestion.offset! + suggestion.length!,
        suggestion,
        color: getHighlightStyle(suggestion),
        id: `highlight-${index}-${suggestion.offset}`,
        icon: getSuggestionIcon(suggestion)
      }))
      .sort((a, b) => a.start - b.start);

    setHighlightRanges(ranges);
  }, [suggestions, text]);

  // Generate diff segments
  const generateDiffSegments = () => {
    if (!showDiff || !humanizedText) {
      return text ? createHighlightedContent() : null;
    }

    const changes = diffWords(text, humanizedText);
    const segments: ReactElement[] = [];

    changes.forEach((change, index) => {
      if (change.added) {
        segments.push(
          <span
            key={`add-${index}`}
            className="bg-green-100 text-green-900 border-b-2 border-green-400 px-0.5 rounded-sm"
          >
            {change.value}
          </span>
        );
      } else if (change.removed) {
        segments.push(
          <span
            key={`remove-${index}`}
            className="bg-red-100 text-red-900 border-b-2 border-red-400 px-0.5 rounded-sm line-through"
          >
            {change.value}
          </span>
        );
      } else {
        segments.push(
          <span key={`same-${index}`}>
            {change.value}
          </span>
        );
      }
    });

    return segments;
  };

  // Create highlighted text segments
  const createHighlightedContent = () => {
    if (highlightRanges.length === 0) {
      return text || '';
    }

    const segments: ReactElement[] = [];
    let lastIndex = 0;

    highlightRanges.forEach((range) => {
      // Add text before highlight
      if (lastIndex < range.start) {
        segments.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, range.start)}
          </span>
        );
      }

      // Add highlighted text with enhanced styling
      const highlightedText = text.substring(range.start, range.end);
      const isHighSeverity = range.suggestion.severity === 'high';
      const isError = range.suggestion.message?.toLowerCase().includes('error');
      
      segments.push(
        <span
          key={range.id}
          className={`relative inline-block cursor-pointer rounded-sm px-1 py-0.5 ${range.color} transition-all duration-300 hover:shadow-lg hover:scale-105 hover:z-10 group`}
          onMouseEnter={(e) => {
            setHoveredSuggestion(range.suggestion);
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltipPosition({
              x: rect.left + rect.width / 2,
              y: rect.top - 10
            });
            setShowTooltip(true);
          }}
          onMouseLeave={() => {
            setShowTooltip(false);
            setHoveredSuggestion(null);
          }}
          onClick={() => onSuggestionClick?.(range.suggestion)}
        >
          {highlightedText}
          {/* Severity indicator */}
          {(isHighSeverity || isError) && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white shadow-sm animate-pulse"></span>
          )}
          {/* Hover indicator */}
          <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs bg-gray-800 text-white px-2 py-1 rounded whitespace-nowrap pointer-events-none">
            {range.icon} {range.suggestion.category || range.suggestion.type}
          </span>
        </span>
      );

      lastIndex = range.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }

    return segments;
  };

  // Handle textarea changes
  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTextChange(e.target.value, false);
  };

  // Handle paste events
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    
    // Get pasted text and sanitize it
    const text = e.clipboardData.getData('text/plain')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\r\n/g, '\n');
    
    // Insert sanitized text at cursor position
    const cursorPos = e.currentTarget.selectionStart;
    const textBefore = e.currentTarget.value.substring(0, cursorPos);
    const textAfter = e.currentTarget.value.substring(cursorPos);
    
    const newText = textBefore + text + textAfter;
    onTextChange(newText, true);
    
    // Set cursor position after pasted text
    setTimeout(() => {
      e.currentTarget.selectionStart = cursorPos + text.length;
      e.currentTarget.selectionEnd = cursorPos + text.length;
    }, 0);
  };

  // Sync scroll positions
  const handleScroll = () => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  return (
    <div className="relative h-full w-full">
      {/* Highlighted Text Overlay */}
      <div
        ref={overlayRef}
        data-testid="highlighted-overlay"
        className="absolute inset-0 overflow-hidden pointer-events-none z-10 p-4 text-base leading-relaxed font-sans whitespace-pre-wrap break-words text-gray-900"
        style={{
          background: 'transparent',
          border: '1px solid transparent',
          borderRadius: '0.75rem'
        }}
      >
        <div className="pointer-events-auto">
          {text ? (showDiff ? generateDiffSegments() : createHighlightedContent()) : null}
        </div>
      </div>

      {/* Actual Textarea */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextAreaChange}
        onPaste={handlePaste}
        onScroll={handleScroll}
        placeholder={autoCheckEnabled ? 
          `${placeholder || 'Start writing or paste your text here...'} (Auto-check enabled)` : 
          placeholder || 'Start writing or paste your text here...'
        }
        readOnly={readOnly}
        className="w-full h-full resize-none border border-gray-300 hover:border-gray-400 focus:border-blue-500 rounded-xl p-4 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all duration-200 placeholder-gray-400 relative z-20 bg-transparent font-sans text-gray-900"
        style={{ 
          color: highlightRanges.length > 0 ? 'transparent' : '#0f172a',
          caretColor: '#475569', // Ensure cursor is visible
          minHeight: '300px' // Add minimum height to ensure enough space
        }}
      />

      {/* Empty State Overlay */}
      {!text && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
          <div className="text-center max-w-xs">
            <div className="text-3xl mb-2 opacity-20">✍️</div>
            <p className="text-gray-400 text-base font-medium">Start writing your masterpiece</p>
            <p className="text-gray-300 text-sm mt-1">Write or paste your text to begin grammar checking</p>
          </div>
        </div>
      )}

      {/* Diff Controls Overlay */}
      {showDiff && humanizedText && (
        <div className="absolute bottom-4 right-4 z-40 flex space-x-2">
          <button
            onClick={onRejectHumanized}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg font-medium"
            title="Reject changes"
          >
            Reject
          </button>
          <button
            onClick={onAcceptHumanized}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg font-medium"
            title="Accept changes"
          >
            Accept
          </button>
        </div>
      )}

      {/* Enhanced Tooltip */}
      {showTooltip && hoveredSuggestion && (
        <div
          className="fixed z-50 max-w-sm bg-white border border-gray-200 rounded-xl shadow-2xl pointer-events-none overflow-hidden"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
        >
          {/* Header */}
          <div className={`px-4 py-3 border-b ${
            hoveredSuggestion.severity === 'high' ? 'bg-red-50 border-red-200' :
            hoveredSuggestion.severity === 'medium' ? 'bg-amber-50 border-amber-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {getSuggestionIcon(hoveredSuggestion)}
                </span>
                <div>
                  <h4 className="font-semibold text-sm text-gray-900 capitalize">
                    {hoveredSuggestion.category || hoveredSuggestion.type}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      hoveredSuggestion.severity === 'high' ? 'bg-red-100 text-red-700' :
                      hoveredSuggestion.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {hoveredSuggestion.severity?.toUpperCase() || 'MEDIUM'}
                    </span>
                    {hoveredSuggestion.confidence && (
                      <span className={`text-xs font-medium ${
                        hoveredSuggestion.confidence >= 0.8 ? 'text-green-600' :
                        hoveredSuggestion.confidence >= 0.6 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {Math.round(hoveredSuggestion.confidence * 100)}% confident
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4 space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              {hoveredSuggestion.message}
            </p>
            
            {hoveredSuggestion.replacements && hoveredSuggestion.replacements.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Suggested Changes:</p>
                <div className="space-y-1">
                  {hoveredSuggestion.replacements.slice(0, 3).map((replacement, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors group"
                      onClick={() => {
                        console.log('Replace with:', replacement.value);
                      }}
                    >
                      <span className="text-sm text-green-800 font-medium">
                        "{replacement.value}"
                      </span>
                      <span className="text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to apply
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Explanation */}
            {hoveredSuggestion.explanation && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Why this matters:</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {hoveredSuggestion.explanation}
                </p>
              </div>
            )}
            
            {/* Confidence Bar */}
            {hoveredSuggestion.confidence && (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">AI Confidence</span>
                  <span className="text-xs text-gray-600 font-medium">
                    {Math.round(hoveredSuggestion.confidence * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      hoveredSuggestion.confidence >= 0.8 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                      hoveredSuggestion.confidence >= 0.6 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                      'bg-gradient-to-r from-red-400 to-red-500'
                    }`}
                    style={{ width: `${hoveredSuggestion.confidence * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Custom comparison function for React.memo
const areEqual = (prevProps: HighlightedTextEditorProps, nextProps: HighlightedTextEditorProps) => {
  return (
    prevProps.text === nextProps.text &&
    prevProps.suggestions === nextProps.suggestions &&
    prevProps.onTextChange === nextProps.onTextChange &&
    prevProps.humanizedText === nextProps.humanizedText &&
    prevProps.showDiff === nextProps.showDiff &&
    prevProps.readOnly === nextProps.readOnly
  );
};

export default memo(HighlightedTextEditor, areEqual);