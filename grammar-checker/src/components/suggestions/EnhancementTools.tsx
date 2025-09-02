import React, { memo } from 'react';

interface EnhancementToolsProps {
  onEnhance: (type: 'formal' | 'casual') => void;
  isEnhancing: boolean;
  hasText: boolean;
}

const EnhancementTools: React.FC<EnhancementToolsProps> = ({ 
  onEnhance, 
  isEnhancing, 
  hasText 
}) => {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-purple-900 text-xl">AI Text Enhancement</h3>
          <p className="text-purple-700">Choose how you'd like to enhance your text</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => onEnhance('formal')}
          disabled={isEnhancing || !hasText}
          className="bg-white hover:bg-gray-50 border-2 border-purple-200 hover:border-purple-300 rounded-xl p-4 text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-2xl mb-2">👔</div>
          <h4 className="font-semibold text-gray-900 mb-1">Professional</h4>
          <p className="text-sm text-gray-600">Make text more formal and professional</p>
        </button>
        
        <button
          onClick={() => onEnhance('casual')}
          disabled={isEnhancing || !hasText}
          className="bg-white hover:bg-gray-50 border-2 border-purple-200 hover:border-purple-300 rounded-xl p-4 text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-2xl mb-2">💬</div>
          <h4 className="font-semibold text-gray-900 mb-1">Conversational</h4>
          <p className="text-sm text-gray-600">Make text more casual and engaging</p>
        </button>
      </div>
      
      {isEnhancing && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-3 bg-white/50 rounded-xl px-4 py-3">
            <div className="w-5 h-5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
            <span className="text-purple-700 font-medium">Enhancing your text...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom comparison function for React.memo
const areEqual = (prevProps: EnhancementToolsProps, nextProps: EnhancementToolsProps) => {
  return (
    prevProps.isEnhancing === nextProps.isEnhancing &&
    prevProps.hasText === nextProps.hasText &&
    prevProps.onEnhance === nextProps.onEnhance
  );
};

export default memo(EnhancementTools, areEqual);