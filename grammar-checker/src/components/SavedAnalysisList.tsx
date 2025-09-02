import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { SavedAnalysisService } from '../services/savedAnalysisService';
import { SavedAnalysis } from '../types';

interface SavedAnalysesListProps {
  onLoadAnalysis?: (analysis: SavedAnalysis) => void;
  type?: 'resume' | 'job' | 'all';
}

const SavedAnalysesList: React.FC<SavedAnalysesListProps> = ({ onLoadAnalysis, type = 'all' }) => {
  const { state, dispatch } = useAppContext();
  const { savedAnalyses } = state;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [analysisToDelete, setAnalysisToDelete] = useState<SavedAnalysis | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadSavedAnalyses();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadSavedAnalyses = async () => {
    try {
      dispatch({ type: 'SET_SAVED_ANALYSES_LOADING', payload: true });
      const analyses = await SavedAnalysisService.getAllAnalyses();
      dispatch({ type: 'SET_SAVED_ANALYSES', payload: analyses });
    } catch (error) {
      console.error('Failed to load saved analyses:', error);
      dispatch({ 
        type: 'SET_SAVED_ANALYSES_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to load saved analyses'
      });
    } finally {
      dispatch({ type: 'SET_SAVED_ANALYSES_LOADING', payload: false });
    }
  };

  const handleDeleteAnalysis = async (id: string) => {
    try {
      dispatch({ type: 'DELETE_SAVED_ANALYSIS', payload: id });
      
      // Show success feedback
      const analysisName = analysisToDelete?.name || 'Analysis';
      showToast(`${analysisName} deleted successfully!`, 'success');
    } catch (error) {
      console.error('Failed to delete analysis:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete analysis';
      showToast(`Error: ${errorMessage}`, 'error');
    }
  };

  const handleLoadAnalysis = (analysis: SavedAnalysis) => {
    if (onLoadAnalysis) {
      try {
        // Validate analysis data before loading
        if (!analysis.input || Object.keys(analysis.input).length === 0) {
          throw new Error('Analysis input data is missing or invalid');
        }
        
        if (!analysis.results) {
          throw new Error('Analysis results are missing');
        }
        
        onLoadAnalysis(analysis);
        showToast(`Analysis "${analysis.name}" loaded successfully!`, 'success');
      } catch (error) {
        console.error('Error loading analysis:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load analysis';
        showToast(`Error: ${errorMessage}`, 'error');
      }
    }
  };

  const filteredAnalyses = type === 'all' 
    ? savedAnalyses.analyses 
    : savedAnalyses.analyses.filter(analysis => analysis.type === type);

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeIcon = (analysisType: string) => {
    switch (analysisType) {
      case 'resume':
        return (
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'job':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  if (savedAnalyses.loading) {
    return (
      <div className="bg-white rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading saved analyses...</span>
        </div>
      </div>
    );
  }

  if (savedAnalyses.error) {
    return (
      <div className="bg-white rounded-2xl p-6">
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Analyses</h3>
          <p className="text-gray-600 mb-4">{savedAnalyses.error}</p>
          <button
            onClick={loadSavedAnalyses}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (filteredAnalyses.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Analyses</h3>
          <p className="text-gray-600">
            {type === 'all' 
              ? 'You haven\'t saved any analyses yet. Generate and save an analysis to see it here.'
              : `You haven\'t saved any ${type} analyses yet.`
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          Saved Analyses {type !== 'all' && `(${type.charAt(0).toUpperCase() + type.slice(1)})`}
        </h3>
        <span className="text-sm text-gray-500">
          {filteredAnalyses.length} {filteredAnalyses.length === 1 ? 'analysis' : 'analyses'}
        </span>
      </div>

      <div className="space-y-4">
        {filteredAnalyses.map((analysis) => (
          <div key={analysis.id} className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  {getTypeIcon(analysis.type)}
                  <h4 className="font-semibold text-gray-900">{analysis.name}</h4>
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                    {analysis.type}
                  </span>
                </div>
                
                {analysis.description && (
                  <p className="text-sm text-gray-600 mb-2">{analysis.description}</p>
                )}
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Created: {formatDate(analysis.createdAt)}</span>
                  {analysis.updatedAt !== analysis.createdAt && (
                    <span>Updated: {formatDate(analysis.updatedAt)}</span>
                  )}
                  {analysis.model && (
                    <span>Model: {analysis.model.name}</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {onLoadAnalysis && (
                  <button
                    onClick={() => handleLoadAnalysis(analysis)}
                    className="px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Load
                  </button>
                )}
                <button
                  onClick={() => {
                    setAnalysisToDelete(analysis);
                    setShowDeleteConfirm(analysis.id);
                  }}
                  className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && analysisToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Analysis</h3>
            </div>
            
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete the analysis:
            </p>
            <p className="font-semibold text-gray-900 mb-4">
              "{analysisToDelete.name}"
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(null);
                  setAnalysisToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteAnalysis(showDeleteConfirm);
                  setShowDeleteConfirm(null);
                  setAnalysisToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Analysis
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

export default SavedAnalysesList;