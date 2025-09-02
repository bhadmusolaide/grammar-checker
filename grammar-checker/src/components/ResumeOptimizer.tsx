import React, { useState, useRef } from 'react';
import { CareerToolsInput, ResumeOptimizerOptions, CareerToolsResult, SavedAnalysis } from '../types';
import CareerResultsDisplay from './CareerResultsDisplay';
import SavedAnalysisList from './SavedAnalysisList';
import { formatFileSize } from '../utils/scoreUtils';

interface ResumeOptimizerProps {
  onSubmit: (input: CareerToolsInput, options: ResumeOptimizerOptions) => void;
  onSaveAnalysis?: (name: string, input: CareerToolsInput, options: ResumeOptimizerOptions, results: CareerToolsResult) => void;
  onLoadAnalysis?: (analysis: SavedAnalysis) => void;
  isLoading: boolean;
  results?: CareerToolsResult;
  showSavedAnalyses?: boolean;
}

const ResumeOptimizer: React.FC<ResumeOptimizerProps> = ({ 
  onSubmit, 
  onSaveAnalysis, 
  onLoadAnalysis, 
  isLoading, 
  results,
  showSavedAnalyses = false
 }) => {
  const [input, setInput] = useState<CareerToolsInput>({});
  const [options, setOptions] = useState<ResumeOptimizerOptions>({
    atsOptimization: true,
    achievementTransformation: true,
    formatConversion: false
  });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [analysisName, setAnalysisName] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, Word document, or text file.');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB.');
      return;
    }
    
    setInput(prev => ({ ...prev, resumeFile: file }));
  };

  const handleOptionToggle = (option: keyof ResumeOptimizerOptions) => {
    setOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  const handleSubmit = () => {
    if (!input.resumeFile) {
      alert('Please upload a resume file.');
      return;
    }
    
    onSubmit(input, options);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveAnalysis = () => {
    if (!results || !onSaveAnalysis) {
      alert('No optimization results to save.');
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
    // Only load if this is a resume analysis
    if (analysis.type === 'resume') {
      // Populate form fields with saved data
      setInput(analysis.input);
      setOptions(analysis.options as ResumeOptimizerOptions);
      
      // Call parent component's load handler if provided
      if (onLoadAnalysis) {
        onLoadAnalysis(analysis);
        showToast(`Analysis "${analysis.name}" loaded successfully!`, 'success');
      }
    }
  };



  return (
    <div className="space-y-8">
      {/* File Upload Section */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Upload Your Resume</h3>
        
        <div
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : input.resumeFile 
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400 bg-white'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
          />
          
          {input.resumeFile ? (
            <div className="space-y-3">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{input.resumeFile.name}</p>
                <p className="text-sm text-gray-600">{formatFileSize(input.resumeFile.size)}</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Choose different file
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">Drop your resume here</p>
                <p className="text-sm text-gray-600 mb-4">or click to browse files</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
                >
                  Choose File
                </button>
              </div>
              <p className="text-xs text-gray-500">Supports PDF, Word, and text files (max 10MB)</p>
            </div>
          )}
        </div>
      </div>

      {/* Optional Job Description */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Target Job (Optional)</h3>
        <p className="text-sm text-gray-600 mb-4">Provide job details for targeted optimization</p>
        
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Position Title</label>
            <input
              type="text"
              value={input.targetPosition || ''}
              onChange={(e) => setInput(prev => ({ ...prev, targetPosition: e.target.value }))}
              placeholder="e.g., Senior Software Engineer"
              className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input
              type="text"
              value={input.companyName || ''}
              onChange={(e) => setInput(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="e.g., Google"
              className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
          <textarea
            value={input.jobDescription || ''}
            onChange={(e) => setInput(prev => ({ ...prev, jobDescription: e.target.value }))}
            placeholder="Paste the job description here for targeted keyword optimization..."
            rows={4}
            className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200 resize-none"
          />
        </div>
      </div>

      {/* Feature Selection */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Optimization Features</h3>
        <p className="text-sm text-gray-600 mb-6">Select the features you'd like to apply to your resume</p>
        
        <div className="space-y-4">
          <label className="flex items-start space-x-4 cursor-pointer group">
            <div className="relative mt-1">
              <input
                type="checkbox"
                checked={options.atsOptimization}
                onChange={() => handleOptionToggle('atsOptimization')}
                className="sr-only"
              />
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                options.atsOptimization
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 bg-white group-hover:border-gray-400'
              }`}>
                {options.atsOptimization && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">ATS Optimization</div>
              <p className="text-sm text-gray-600">Incorporate strategic keywords and format for Applicant Tracking Systems</p>
            </div>
          </label>

          <label className="flex items-start space-x-4 cursor-pointer group">
            <div className="relative mt-1">
              <input
                type="checkbox"
                checked={options.achievementTransformation}
                onChange={() => handleOptionToggle('achievementTransformation')}
                className="sr-only"
              />
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                options.achievementTransformation
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 bg-white group-hover:border-gray-400'
              }`}>
                {options.achievementTransformation && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">Achievement Transformation</div>
              <p className="text-sm text-gray-600">Convert job duties into powerful achievement statements with metrics</p>
            </div>
          </label>

          <label className="flex items-start space-x-4 cursor-pointer group">
            <div className="relative mt-1">
              <input
                type="checkbox"
                checked={options.formatConversion}
                onChange={() => handleOptionToggle('formatConversion')}
                className="sr-only"
              />
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                options.formatConversion
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 bg-white group-hover:border-gray-400'
              }`}>
                {options.formatConversion && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">Format Conversion</div>
              <p className="text-sm text-gray-600">Convert to modern, professional resume format</p>
            </div>
          </label>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={handleSubmit}
          disabled={!input.resumeFile || isLoading}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-12 py-4 rounded-2xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-md transform hover:scale-[1.02] disabled:scale-100"
        >
          {isLoading ? (
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <div className="text-left">
                <div>Optimizing Resume with AI...</div>
                <div className="text-xs opacity-75">This may take 1-2 minutes depending on model</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Optimize Resume</span>
            </div>
          )}
        </button>
        
        {results && (
          <button
            onClick={handleSaveAnalysis}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
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
        <CareerResultsDisplay results={results} type="resume" />
      )}

      {/* Saved Analyses List */}
      {showSavedAnalyses && (
        <div className="mt-8">
          <SavedAnalysisList
            type="resume"
            onLoadAnalysis={handleLoadAnalysis}
          />
        </div>
      )}
      
      {/* Save Analysis Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Save Optimization</h3>
            <p className="text-gray-600 mb-6">Give your resume optimization a name to save it for future reference.</p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analysis Name
              </label>
              <input
                type="text"
                value={analysisName}
                onChange={(e) => setAnalysisName(e.target.value)}
                placeholder="e.g., Software Engineer Resume for Google"
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

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center space-x-3">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:opacity-75"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeOptimizer;