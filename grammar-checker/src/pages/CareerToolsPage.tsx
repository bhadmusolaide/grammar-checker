import React, { useState, Suspense, lazy } from 'react';
import Layout from '../components/Layout';
import { FullPageLoader } from '../components/common/LoadingStates';
import ModelSelector from '../components/ModelSelector';
import { useCareerTools } from '../hooks/useCareerTools';
import { useModalManager } from '../hooks/useModalManager';
import { useAppContext } from '../contexts/AppContext';
import { SavedAnalysisService } from '../services/savedAnalysisService';
import { CareerToolsInput, JobApplicationOptions, ResumeOptimizerOptions, CareerToolsResult, SavedAnalysis } from '../types';

// Lazy load components for better performance
const CareerResultsDisplay = lazy(() => import('../components/CareerResultsDisplay'));
const ResumeOptimizer = lazy(() => import('../components/ResumeOptimizer'));
const JobApplicationAssistant = lazy(() => import('../components/JobApplicationAssistant'));

const CareerToolsPage: React.FC = () => {
  const {
    results,
    loading,
    hasError,
    errorMessage,
    handleCareerToolsSubmit,
    selectedModel,
    availableModels,
  } = useCareerTools();
  
  const { handleModelChange } = useModalManager();
  const { dispatch } = useAppContext();
  const [activeView, setActiveView] = useState<'cards' | 'resume' | 'job'>('cards');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
    handleCareerToolsSubmit(input, type, options, selectedModel || undefined);
  };

  const handleSaveAnalysis = async (
    name: string,
    input: CareerToolsInput,
    options: ResumeOptimizerOptions | JobApplicationOptions,
    results: CareerToolsResult
  ) => {
    try {
      dispatch({ type: 'SET_SAVED_ANALYSES_LOADING', payload: true });
      
      const savedAnalysis = SavedAnalysisService.createAnalysis(
        name,
        activeView as 'resume' | 'job',
        input,
        options,
        results,
        selectedModel || undefined
      );
      
      dispatch({ type: 'ADD_SAVED_ANALYSIS', payload: savedAnalysis });
      
      // Show success message
        showToast(`Analysis "${name}" saved successfully!`, 'success');
    } catch (error) {
      console.error('Failed to save analysis:', error);
      dispatch({ 
        type: 'SET_SAVED_ANALYSES_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to save analysis'
      });
      showToast('Failed to save analysis. Please try again.', 'error');
    } finally {
      dispatch({ type: 'SET_SAVED_ANALYSES_LOADING', payload: false });
    }
  };

  const handleLoadAnalysis = (analysis: SavedAnalysis) => {
    // Set the loaded results to display them
    dispatch({ type: 'SET_CAREER_TOOLS_RESULTS', payload: analysis.results });
  };

  return (
    <Layout>

      {/* Main Content */}
      <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 py-8 max-w-[1400px]">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              AI-Powered Career Tools
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Enhance your career prospects with our powerful suite of AI tools. 
              Optimize your resume, generate cover letters, and prepare for interviews.
            </p>
          </div>
        </div>

        {/* Career Tools Cards - Show when no results and cards view */}
        {!results && activeView === 'cards' && (
          <div className="grid md:grid-cols-2 gap-8 mb-8">
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

        {/* Tool Interfaces */}
        {!results && activeView !== 'cards' && (
          <div className="max-w-7xl mx-auto px-4">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {activeView === 'resume' ? 'Resume Optimizer' : 'Job Application Assistant'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {activeView === 'resume' ? 'Optimize your resume for ATS and recruiters' : 'Get insights and generate application materials'}
                  </p>
                </div>
              </div>
              
              {/* AI Model Selection */}
              {availableModels.length > 0 && (
                <div className="max-w-sm">
                  <ModelSelector
                    selectedModel={selectedModel}
                    availableModels={availableModels}
                    onModelChange={handleModelChange}
                    label="AI Model"
                    className=""
                  />
                </div>
              )}
            </div>

            {/* Tool Content */}
            {activeView === 'resume' && (
              <Suspense fallback={<FullPageLoader />}> 
                <ResumeOptimizer
                  onSubmit={(input: CareerToolsInput, options: ResumeOptimizerOptions) => handleSubmit(input, 'resume', options)}
                  onSaveAnalysis={handleSaveAnalysis}
                  onLoadAnalysis={handleLoadAnalysis}
                  isLoading={loading}
                  results={results}
                  showSavedAnalyses={true}
                />
              </Suspense>
            )}

            {activeView === 'job' && (
              <Suspense fallback={<FullPageLoader />}> 
                <JobApplicationAssistant
                  onSubmit={(input: CareerToolsInput, options: JobApplicationOptions) => handleSubmit(input, 'job', options)}
                  onSaveAnalysis={handleSaveAnalysis}
                  onLoadAnalysis={handleLoadAnalysis}
                  isLoading={loading}
                  results={results}
                  selectedModel={selectedModel}
                  showSavedAnalyses={true}
                />
              </Suspense>
            )}
          </div>
        )}

        {/* Error Display */}
        {hasError && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Error:</span>
                {errorMessage}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-lg shadow-md">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              <span className="text-gray-700 font-medium">Processing your request...</span>
            </div>
          </div>
        )}

        {/* Results Display */}
        {results && !loading && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Results</h3>
              <button
                onClick={() => {
                  setActiveView('cards');
                  // Clear results to allow returning to the main cards view
                  if (results) {
                    window.location.reload();
                  }
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
              >
                New Analysis
              </button>
            </div>
            <Suspense fallback={<FullPageLoader />}> 
              <CareerResultsDisplay
                results={results}
                type={results.type || 'resume'}
                onSave={() => {
                  // Show the save modal for the active type
                  const name = results.type === 'resume' ? 'Resume Optimization' : 'Job Application';
                  // Generate a default name with timestamp
                  const defaultName = `${name} - ${new Date().toLocaleDateString()}`;
                  // Prompt for name or use default
                  const analysisName = window.prompt('Enter a name for this analysis:', defaultName);
                  
                  // If name provided, save the analysis
                  if (analysisName) {
                    const options = results.type === 'resume' 
                      ? { atsOptimization: true, achievementTransformation: true, formatConversion: false } 
                      : { jobDescriptionDecoder: true, coverLetterGenerator: true, interviewAnswerBuilder: true };
                    
                    // Create a minimal valid input object based on the results type
                    // This ensures we meet the SavedAnalysisService requirement for non-empty input
                    const minimalInput: CareerToolsInput = {
                      // Add common fields
                      targetPosition: results.type === 'resume' ? 'Resume Optimization' : 'Job Analysis',
                      companyName: 'Saved from Results',
                      
                      // Add type-specific fields
                      ...(results.type === 'resume' 
                        ? { 
                            jobDescription: results.optimizedResume?.content || 'Optimized Resume'
                          } 
                        : { 
                            jobDescriptionText: results.jobAnalysis ? 'Job Analysis Results' : 'Job Application Results'
                          }
                      )
                    };
                    
                    handleSaveAnalysis(
                      analysisName,
                      minimalInput,
                      options as any,
                      results
                    );
                  }
                }}
              />
            </Suspense>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default CareerToolsPage;