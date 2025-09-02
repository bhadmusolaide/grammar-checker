import React, { useState } from 'react';
import { CareerToolsInput, JobApplicationOptions, CareerToolsResult, UnifiedModel, SavedAnalysis } from '../types';
import CareerResultsDisplay from './CareerResultsDisplay';
import SavedAnalysisList from './SavedAnalysisList';

interface JobApplicationAssistantProps {
  onSubmit: (input: CareerToolsInput, options: JobApplicationOptions) => void;
  onSaveAnalysis?: (name: string, input: CareerToolsInput, options: JobApplicationOptions, results: CareerToolsResult) => void;
  onLoadAnalysis?: (analysis: SavedAnalysis) => void;
  isLoading: boolean;
  results?: CareerToolsResult;
  selectedModel?: UnifiedModel | null;
  showSavedAnalyses?: boolean;
}

const JobApplicationAssistant: React.FC<JobApplicationAssistantProps> = ({ 
  onSubmit, 
  onSaveAnalysis,
  onLoadAnalysis,
  isLoading, 
  results, 
  showSavedAnalyses = false
}) => {
  const [input, setInput] = useState<CareerToolsInput>({});
  const [options, setOptions] = useState<JobApplicationOptions>({
    jobDescriptionDecoder: true,
    coverLetterGenerator: true,
    interviewAnswerBuilder: false
  });
  const [inputMethod, setInputMethod] = useState<'url' | 'text'>('url');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [analysisName, setAnalysisName] = useState('');

  const handleOptionToggle = (option: keyof JobApplicationOptions) => {
    setOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  const handleSubmit = () => {
    if (inputMethod === 'url' && !input.jobUrl?.trim()) {
      alert('Please enter a job URL.');
      return;
    }
    
    if (inputMethod === 'text' && !input.jobDescriptionText?.trim()) {
      alert('Please paste the job description.');
      return;
    }
    
    onSubmit(input, options);
  };

  const handleSaveAnalysis = () => {
    if (!results || !onSaveAnalysis) {
      alert('No analysis results to save.');
      return;
    }
    
    setShowSaveModal(true);
  };

  const handleConfirmSave = () => {
    if (!analysisName.trim()) {
      alert('Please enter a name for the analysis.');
      return;
    }
    
    if (results && onSaveAnalysis) {
      onSaveAnalysis(analysisName, input, options, results);
      setShowSaveModal(false);
      setAnalysisName('');
    }
  };

  const handleLoadAnalysis = (analysis: SavedAnalysis) => {
    // Only load if this is a job application analysis
    if (analysis.type === 'job') {
      // Populate form fields with saved data
      setInput(analysis.input);
      setOptions(analysis.options as JobApplicationOptions);
      
      // Call parent component's load handler if provided
      if (onLoadAnalysis) {
        onLoadAnalysis(analysis);
      }
    }
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const urlInputValid = !input.jobUrl || isValidUrl(input.jobUrl);

  return (
    <div className="space-y-8">
      {/* Input Method Selection */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Job Information Source</h3>
        <p className="text-sm text-gray-600 mb-6">Choose how you'd like to provide the job information</p>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setInputMethod('url')}
            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
              inputMethod === 'url'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <div className="text-left">
                <div className="font-semibold">Job URL</div>
                <div className="text-sm opacity-75">Link to job posting</div>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setInputMethod('text')}
            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
              inputMethod === 'text'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-left">
                <div className="font-semibold">Paste Text</div>
                <div className="text-sm opacity-75">Copy & paste job description</div>
              </div>
            </div>
          </button>
        </div>

        {inputMethod === 'url' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Posting URL</label>
            <input
              type="url"
              value={input.jobUrl || ''}
              onChange={(e) => setInput(prev => ({ ...prev, jobUrl: e.target.value }))}
              placeholder="https://company.com/careers/job-posting"
              className={`w-full border-2 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 transition-all duration-200 ${
                urlInputValid 
                  ? 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-100'
                  : 'border-red-300 focus:border-red-500 focus:ring-red-100'
              }`}
            />
            {!urlInputValid && (
              <p className="text-red-600 text-sm mt-2">Please enter a valid URL</p>
            )}
            <p className="text-gray-500 text-sm mt-2">
              Paste the URL from job boards like LinkedIn, Indeed, or company career pages
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
            <textarea
              value={input.jobDescriptionText || ''}
              onChange={(e) => setInput(prev => ({ ...prev, jobDescriptionText: e.target.value }))}
              placeholder="Paste the complete job description here including requirements, responsibilities, and company information..."
              rows={8}
              className="w-full border-2 border-gray-200 focus:border-emerald-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all duration-200 resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-gray-500 text-sm">
                Include all details for better analysis
              </p>
              <span className={`text-sm ${
                (input.jobDescriptionText?.length || 0) < 100 ? 'text-gray-400' :
                (input.jobDescriptionText?.length || 0) < 500 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {input.jobDescriptionText?.length || 0} characters
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Optional Job Details */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Additional Details (Optional)</h3>
        <p className="text-sm text-gray-600 mb-4">Provide more context for personalized results</p>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Position Title</label>
            <input
              type="text"
              value={input.targetPosition || ''}
              onChange={(e) => setInput(prev => ({ ...prev, targetPosition: e.target.value }))}
              placeholder="e.g., Senior Product Manager"
              className="w-full border-2 border-gray-200 focus:border-emerald-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input
              type="text"
              value={input.companyName || ''}
              onChange={(e) => setInput(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="e.g., Microsoft"
              className="w-full border-2 border-gray-200 focus:border-emerald-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Feature Selection */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Analysis & Generation Tools</h3>
        <p className="text-sm text-gray-600 mb-6">Select the tools you'd like to use</p>
        
        <div className="space-y-6">
          <label className="flex items-start space-x-4 cursor-pointer group">
            <div className="relative mt-1">
              <input
                type="checkbox"
                checked={options.jobDescriptionDecoder}
                onChange={() => handleOptionToggle('jobDescriptionDecoder')}
                className="sr-only"
              />
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                options.jobDescriptionDecoder
                  ? 'border-emerald-500 bg-emerald-500'
                  : 'border-gray-300 bg-white group-hover:border-gray-400'
              }`}>
                {options.jobDescriptionDecoder && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 flex items-center space-x-2">
                <span>Job Description Decoder</span>
                <span className="text-emerald-600">🔍</span>
              </div>
              <p className="text-sm text-gray-600">Analyze hidden requirements, cultural fit indicators, and what the hiring manager really values</p>
            </div>
          </label>

          <label className="flex items-start space-x-4 cursor-pointer group">
            <div className="relative mt-1">
              <input
                type="checkbox"
                checked={options.coverLetterGenerator}
                onChange={() => handleOptionToggle('coverLetterGenerator')}
                className="sr-only"
              />
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                options.coverLetterGenerator
                  ? 'border-emerald-500 bg-emerald-500'
                  : 'border-gray-300 bg-white group-hover:border-gray-400'
              }`}>
                {options.coverLetterGenerator && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 flex items-center space-x-2">
                <span>Cover Letter Generator</span>
                <span className="text-emerald-600">✍️</span>
              </div>
              <p className="text-sm text-gray-600">Create a compelling, personalized cover letter that connects your experience to their needs</p>
            </div>
          </label>

          <label className="flex items-start space-x-4 cursor-pointer group">
            <div className="relative mt-1">
              <input
                type="checkbox"
                checked={options.interviewAnswerBuilder}
                onChange={() => handleOptionToggle('interviewAnswerBuilder')}
                className="sr-only"
              />
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                options.interviewAnswerBuilder
                  ? 'border-emerald-500 bg-emerald-500'
                  : 'border-gray-300 bg-white group-hover:border-gray-400'
              }`}>
                {options.interviewAnswerBuilder && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 flex items-center space-x-2">
                <span>Interview Answer Builder</span>
                <span className="text-emerald-600">💬</span>
              </div>
              <p className="text-sm text-gray-600">Craft powerful STAR-format responses for common interview questions using job-specific keywords</p>
            </div>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={handleSubmit}
          disabled={
            isLoading || 
            (inputMethod === 'url' && (!input.jobUrl?.trim() || !urlInputValid)) ||
            (inputMethod === 'text' && !input.jobDescriptionText?.trim())
          }
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-12 py-4 rounded-2xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-md transform hover:scale-[1.02] disabled:scale-100"
        >
          {isLoading ? (
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <div className="text-left">
                <div>Analyzing Job with AI...</div>
                <div className="text-xs opacity-75">This may take 1-2 minutes depending on model</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Generate Analysis</span>
            </div>
          )}
        </button>
        
        {results && (
          <button
            onClick={handleSaveAnalysis}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>Save Analysis</span>
            </div>
          </button>
        )}
      </div>

      {/* Results Section */}
      {results && (
        <CareerResultsDisplay results={results} type="job" />
      )}
      
      {/* Saved Analyses List */}
      {showSavedAnalyses && (
        <div className="mt-8">
          <SavedAnalysisList
            type="job"
            onLoadAnalysis={handleLoadAnalysis}
          />
        </div>
      )}
      
      {/* Save Analysis Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Save Analysis</h3>
            <p className="text-gray-600 mb-6">Give your analysis a name to save it for future reference.</p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analysis Name
              </label>
              <input
                type="text"
                value={analysisName}
                onChange={(e) => setAnalysisName(e.target.value)}
                placeholder="e.g., Software Engineer at TechCorp"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setAnalysisName('');
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={!analysisName.trim()}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Save Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobApplicationAssistant;