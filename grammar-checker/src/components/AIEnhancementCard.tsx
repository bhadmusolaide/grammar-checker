import React, { useState } from 'react';
import { EnhancementResult } from '../types';
import { useToast } from '../contexts/ToastContext';

interface AIEnhancementCardProps {
  enhancement: EnhancementResult;
  onApplyText: (text: string) => void;
  onDismiss: () => void;
}

const AIEnhancementCard: React.FC<AIEnhancementCardProps> = ({
  enhancement,
  onApplyText,
  onDismiss
}) => {
  const [activeTab, setActiveTab] = useState<'enhanced' | 'comparison' | 'summary'>('enhanced');
  const [isExpanded, setIsExpanded] = useState(true);
  const { addToast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(enhancement.enhancedText);
      addToast('Enhanced text copied to clipboard!', 'success');
    } catch (error) {
      console.error('Failed to copy text:', error);
      addToast('Failed to copy text to clipboard', 'error');
    }
  };

  const handleApply = () => {
    onApplyText(enhancement.enhancedText);
    addToast('Enhanced text applied to editor!', 'success');
  };

  const formatImprovementSummary = (summary: string) => {
    // Parse the structured summary format
    const sections = summary.split('**').filter(s => s.trim());
    const parsedSections: { [key: string]: string } = {};
    
    for (let i = 0; i < sections.length; i += 2) {
      if (i + 1 < sections.length) {
        const title = sections[i].replace(':', '').trim();
        const content = sections[i + 1].trim();
        parsedSections[title] = content;
      }
    }
    
    return parsedSections;
  };

  const improvementSections = formatImprovementSummary(enhancement.improvementSummary);

  const renderImprovementBadge = () => {
    const { wordCountChange } = enhancement.metrics;
    let badgeColor = 'bg-gray-100 text-gray-700';
    let badgeText = 'No change';
    
    if (wordCountChange > 0) {
      badgeColor = 'bg-blue-100 text-blue-700';
      badgeText = `+${wordCountChange} words`;
    } else if (wordCountChange < 0) {
      badgeColor = 'bg-green-100 text-green-700';
      badgeText = `${wordCountChange} words`;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>
        {badgeText}
      </span>
    );
  };

  if (!isExpanded) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">AI Enhancement Complete</h3>
              <p className="text-sm text-gray-500">
                Enhanced by {enhancement.source} • {renderImprovementBadge()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(true)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Expand"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 mb-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Text Enhancement</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Enhanced by {enhancement.source}</span>
              <span>•</span>
              <span className="capitalize">{enhancement.enhancementType}</span>
              <span>•</span>
              {renderImprovementBadge()}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Collapse"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={onDismiss}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white rounded-lg p-1 mb-4">
        {[
          { id: 'enhanced', label: 'Enhanced Text', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
          { id: 'comparison', label: 'Before & After', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
          { id: 'summary', label: 'Improvements', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-purple-100 text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'enhanced' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Enhanced Version</h4>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                  <button
                    onClick={handleApply}
                    className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Apply
                  </button>
                </div>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{enhancement.enhancedText}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Original Text
              </h4>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{enhancement.originalText}</p>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                {enhancement.metrics.originalWordCount} words • {enhancement.originalText.length} characters
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Enhanced Text
              </h4>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{enhancement.enhancedText}</p>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                {enhancement.metrics.enhancedWordCount} words • {enhancement.enhancedText.length} characters
                {enhancement.metrics.wordCountChange !== 0 && (
                  <span className={enhancement.metrics.wordCountChange > 0 ? 'text-blue-600 ml-2' : 'text-green-600 ml-2'}>
                    ({enhancement.metrics.wordCountChange > 0 ? '+' : ''}{enhancement.metrics.wordCountChange} words)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-4">Improvement Summary</h4>
            <div className="space-y-4">
              {Object.entries(improvementSections).map(([section, content]) => (
                <div key={section} className="border-l-4 border-purple-200 pl-4">
                  <h5 className="font-medium text-purple-900 mb-1">{section}</h5>
                  <p className="text-gray-700 text-sm leading-relaxed">{content}</p>
                </div>
              ))}
              
              {/* Metrics Summary */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h5 className="font-medium text-gray-900 mb-2">Enhancement Metrics</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Word Count:</span>
                    <span className="ml-2 font-medium">
                      {enhancement.metrics.originalWordCount} → {enhancement.metrics.enhancedWordCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Change:</span>
                    <span className={`ml-2 font-medium ${
                      enhancement.metrics.wordCountChange > 0 ? 'text-blue-600' : 
                      enhancement.metrics.wordCountChange < 0 ? 'text-green-600' : 'text-gray-700'
                    }`}>
                      {enhancement.metrics.wordCountChange > 0 ? '+' : ''}{enhancement.metrics.wordCountChange} words
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIEnhancementCard;