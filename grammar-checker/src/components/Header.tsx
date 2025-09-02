import React from 'react';
import { Link } from 'react-router-dom';
import { UnifiedModel, ModelProvider, WritingScore, ToneAnalysis, Language } from '../types';
import ModelSelector from './ModelSelector';
import UserProfile from './UserProfile';


interface HeaderProps {
  // Model controls
  selectedModel?: UnifiedModel | null;
  availableModels: UnifiedModel[];
  onModelChange: (model: UnifiedModel) => void;
  onConfigureProvider?: (provider: ModelProvider) => void;
  // Language settings
  language: Language;
  onLanguageChange: (language: Language) => void;
  // Writing Score display
  writingScore?: WritingScore | null;
  toneAnalysis?: ToneAnalysis;
  onViewWritingScoreDetails?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  selectedModel,
  availableModels,
  onModelChange,
  onConfigureProvider,
  language,
  onLanguageChange,
}) => {

  
  return (
    <header className="bg-white backdrop-blur-xl border-b border-gray-200/60 h-16 flex items-center px-6 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center space-x-4">
        <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xl">G</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">GrammarFlow</h1>
            <p className="text-xs text-gray-500">AI-Powered Writing Assistant</p>
          </div>
        </Link>
      </div>
      
      <div className="ml-auto flex items-center space-x-4">
        {/* Model Selector - Always visible */}
        {selectedModel !== undefined && (
          <div className="min-w-[180px]">
            <ModelSelector
              selectedModel={selectedModel || null}
              availableModels={availableModels}
              onModelChange={onModelChange}
              onConfigureProvider={onConfigureProvider}
              label=""
              className=""
            />
          </div>
        )}
        
        {/* Chat Button */}
        <Link
          to="/chat"
          className="group bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>AI Chat</span>
        </Link>
        
        {/* Career Tools Button */}
        <Link
          to="/career-tools"
          className="group bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM8 14v4a2 2 0 002 2h4a2 2 0 002-2v-4" />
          </svg>
          <span>Career Tools</span>
        </Link>
        
        {/* Humanizer Button */}
        <Link
          to="/humanizer"
          className="group bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>AI Humanizer</span>
        </Link>
        
        {/* User Profile with Language Selection */}
        <UserProfile
          language={language}
          onLanguageChange={onLanguageChange}
        />
      </div>
    </header>
  );
};

export default Header;