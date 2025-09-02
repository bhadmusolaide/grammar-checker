import React, { useState } from 'react';
import { Suggestion } from '../types';
import { Tabs } from '../design-system/components';

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAccept: (suggestion: Suggestion) => void;
  onDismiss: (suggestion: Suggestion) => void;
  text: string;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ 
  suggestion, 
  onAccept, 
  onDismiss,
  text
}) => {
  // Extract the original text from the full text using offset and length
  // or use the 'original' field provided by the backend
  const originalText = suggestion.offset !== undefined && suggestion.length !== undefined
    ? text.substring(suggestion.offset, suggestion.offset + suggestion.length)
    : suggestion.original || '';

  // Get the corrected text from replacements or from the 'suggested' field
  const correctedText = suggestion.replacements && suggestion.replacements.length > 0
    ? suggestion.replacements[0].value
    : suggestion.suggested || '';

  // Normalize the category format for consistency
  const normalizeCategory = (category: string | undefined): string => {
    if (!category) return 'Grammar';
    
    // Check if it's already pipe-separated
    if (category.includes('|')) return category;
    
    // Try to map single categories to the standard format
    const lowerCat = category.toLowerCase();
    if (lowerCat.includes('grammar') || lowerCat.includes('spell')) {
      return 'Grammar|Style|Clarity|Enhancement';
    } else if (lowerCat.includes('style') || lowerCat.includes('tone')) {
      return 'Style|Clarity|Enhancement';
    } else if (lowerCat.includes('clarity') || lowerCat.includes('structure')) {
      return 'Clarity|Enhancement';
    } else if (lowerCat.includes('enhance') || lowerCat.includes('improve')) {
      return 'Enhancement';
    }
    
    // Default to all categories if we can't determine
    return 'Grammar|Style|Clarity|Enhancement';
  };
  
  // Normalize the category
  const normalizedCategory = normalizeCategory(suggestion.category);

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-white shadow-sm">
      {/* Category section - moved to the top */}
      <div className="mb-3">
        <div className="text-sm font-medium text-gray-500 mb-1">Category:</div>
        <CategoryTabs categoryString={normalizedCategory} />
      </div>
      
      <div className="mb-3">
        <div className="text-sm font-medium text-gray-500 mb-1">Error:</div>
        <div className="text-red-600 font-mono bg-red-50 p-2 rounded">
          {originalText || 'N/A'}
        </div>
      </div>
      
      <div className="mb-3">
        <div className="text-sm font-medium text-gray-500 mb-1">Suggestion:</div>
        <div className="text-green-600 font-mono bg-green-50 p-2 rounded">
          {correctedText || 'N/A'}
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-500 mb-1">Explanation:</div>
        <div className="text-gray-700">
          {suggestion.message || suggestion.explanation || 'No explanation provided'}
        </div>
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={() => onAccept(suggestion)}
          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
        >
          Accept
        </button>
        <button
          onClick={() => onDismiss(suggestion)}
          className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

// Component to handle category tabs - these are visual indicators only
const CategoryTabs: React.FC<{ categoryString: string }> = ({ categoryString }) => {
  // Parse categories from the pipe-separated string and ensure we have valid categories
  const validCategories = ['Grammar', 'Style', 'Clarity', 'Enhancement'];
  let categories = categoryString.split('|')
    .map(cat => cat.trim())
    .filter(cat => cat.length > 0);
  
  // Ensure we have at least one category
  if (categories.length === 0) {
    categories = ['Grammar']; // Default to Grammar if no categories
  }
  
  // Filter to only include valid categories and ensure correct capitalization
  categories = categories
    .filter(cat => validCategories.some(valid => valid.toLowerCase() === cat.toLowerCase()))
    .map(cat => {
      const matchingValid = validCategories.find(valid => valid.toLowerCase() === cat.toLowerCase());
      return matchingValid || cat; // Use the properly capitalized version
    });
  
  // Set active tab (this is for visual indication only, doesn't change content)
  const [activeTab, setActiveTab] = useState(categories[0]);
  
  const tabs = categories.map(category => ({
    id: category,
    label: category
  }));

  // Add all valid tabs if there's only one provided
  const displayTabs = tabs.length < 2 ? validCategories.map(cat => ({ id: cat, label: cat })) : tabs;

  return (
    <>
      <Tabs 
        tabs={displayTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="mt-1"
      />
      <div className="mt-1 text-xs text-gray-500 italic">
        This suggestion addresses all highlighted categories
      </div>
    </>
  );
};

export default SuggestionCard;