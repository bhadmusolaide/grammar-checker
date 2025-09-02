import React, { memo } from 'react';
import { Suggestion } from '../../types';
import SuggestionCard from './SuggestionCard';

interface SuggestionsListProps {
  suggestions: Suggestion[];
  onApply: (suggestion: Suggestion) => void;
  onIgnore: (suggestion: Suggestion) => void;
  text: string;
}

const SuggestionsList: React.FC<SuggestionsListProps> = ({
  suggestions,
  onApply,
  onIgnore,
  text
}) => {
  if (suggestions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Perfect!</h3>
        <p className="text-gray-600 font-medium">No issues found in this category.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {suggestions.map((suggestion, index) => (
        <SuggestionCard
          key={index}
          suggestion={suggestion}
          onApply={onApply}
          onIgnore={onIgnore}
          text={text}
        />
      ))}
    </div>
  );
};

// Custom comparison function for React.memo
const areEqual = (prevProps: SuggestionsListProps, nextProps: SuggestionsListProps) => {
  return (
    prevProps.suggestions === nextProps.suggestions &&
    prevProps.text === nextProps.text &&
    prevProps.onApply === nextProps.onApply &&
    prevProps.onIgnore === nextProps.onIgnore
  );
};

export default memo(SuggestionsList, areEqual);