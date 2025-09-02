import React, { useState } from 'react';
import { 
  CareerToolsModalProps, 
  CareerToolsInput, 
  ResumeOptimizerOptions, 
  JobApplicationOptions 
} from '../types';
import ResumeOptimizer from './ResumeOptimizer';
import JobApplicationAssistant from './JobApplicationAssistant';
import ModelSelector from './ModelSelector';

const CareerToolsModal: React.FC<CareerToolsModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSaveAnalysis,
  isLoading,
  results,
  selectedModel,
  availableModels,
  onModelChange,
  onConfigureProvider,
  onLoadAnalysis
}) => {
  const [activeView, setActiveView] = useState<'cards' | 'resume' | 'job'>('cards');

  if (!isOpen) return null;

  const handleCardSelect = (type: 'resume' | 'job') => {
    setActiveView(type);
  };

  const handleBack = () => {
    setActiveView('cards');
  };

  const handleSubmit = (
    input: CareerToolsInput, 
    type: 'resume' | 'job', 
    options: ResumeOptimizerOptions | JobApplicationOptions
  ) => {
    onSubmit(input, type, options, selectedModel || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200 px-8 py-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {activeView !== 'cards' && (
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 gradient-text">
                  {activeView === 'cards' ? 'Career Tools' : 
                   activeView === 'resume' ? 'Resume Optimizer' : 'Job Application Assistant'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {activeView === 'cards' ? 'AI-powered tools to boost your career prospects' :
                   activeView === 'resume' ? 'Optimize your resume for ATS and recruiters' : 
                   'Get insights and generate application materials'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* AI Model Selection */}
              {availableModels.length > 0 && (
                <div className="flex-1 max-w-sm">
                  <ModelSelector
                    selectedModel={selectedModel}
                    availableModels={availableModels}
                    onModelChange={onModelChange}
                    onConfigureProvider={onConfigureProvider}
                    label="AI Model"
                    className=""
                  />
                </div>
              )}
              
              <button
                onClick={onClose}
                className="p-3 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {activeView === 'cards' && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Resume Optimizer Card */}
              <div 
                onClick={() => handleCardSelect('resume')}
                className="group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-200 hover:border-blue-300 rounded-3xl p-8 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl"
              >
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">📄</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Resume Optimizer</h3>
                    <p className="text-blue-700 font-medium">Enhance your resume for maximum impact</p>
                  </div>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-700">ATS Optimization with keyword integration</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-700">Transform duties into achievements</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-700">Professional format conversion</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-600 font-semibold">Upload Resume • Select Features • Generate</span>
                  <div className="p-2 bg-blue-200 group-hover:bg-blue-300 rounded-xl transition-colors duration-200">
                    <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Job Application Assistant Card */}
              <div 
                onClick={() => handleCardSelect('job')}
                className="group bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 border-2 border-emerald-200 hover:border-emerald-300 rounded-3xl p-8 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl"
              >
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">💼</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Job Application Assistant</h3>
                    <p className="text-emerald-700 font-medium">Decode jobs & craft winning applications</p>
                  </div>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-gray-700">Job description analysis & insights</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-gray-700">Personalized cover letter generation</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-gray-700">STAR-format interview answers</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-600 font-semibold">Add Job Info • Select Tools • Generate</span>
                  <div className="p-2 bg-emerald-200 group-hover:bg-emerald-300 rounded-xl transition-colors duration-200">
                    <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'resume' && (
            <ResumeOptimizer
              onSubmit={(input: CareerToolsInput, options: ResumeOptimizerOptions) => handleSubmit(input, 'resume', options)}
              isLoading={isLoading}
              results={results}
            />
          )}

          {activeView === 'job' && (
            <JobApplicationAssistant
                onSubmit={(input: CareerToolsInput, options: JobApplicationOptions) => handleSubmit(input, 'job', options)}
                onSaveAnalysis={onSaveAnalysis}
                onLoadAnalysis={onLoadAnalysis}
                isLoading={isLoading}
                results={results}
                selectedModel={selectedModel}
                showSavedAnalyses={true}
              />
          )}
        </div>
      </div>
    </div>
  );
};

export default CareerToolsModal;