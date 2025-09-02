import React, { lazy } from 'react';
import { useAppContent } from '../hooks/useAppContent';
import Layout from './Layout';
import InputPanel from './InputPanel';
import SimpleSuggestionsPanel from './SimpleSuggestionsPanel';
import SwipeableTabNavigation from './mobile/SwipeableTabNavigation';
import FloatingActionMenu from './mobile/FloatingActionMenu';
import Onboarding from './Onboarding';
import { modelProviderService } from '../services/modelProvider';

// Lazy load modals
const ModelConfigModalLazy = lazy(() => import('./lazy/ModelConfigModalLazy'));
const WritingScoreModalLazy = lazy(() => import('./lazy/WritingScoreModalLazy'));
const CareerToolsModalLazy = lazy(() => import('./lazy/CareerToolsModalLazy'));

export const AppContent: React.FC = () => {
  const {
    state,
    dispatch,
    isLoading,
    isHumanizing,
    isCareerToolsLoading,
    isModelConfigOpen,
    isWritingScoreOpen,
    isCareerToolsOpen,
    showOnboarding,
    hasError,
    errorMessage,
    handleModelChange,
    handleConfigureProvider,
    handleModelConfigurationUpdate,
    handleCareerToolsClose,
    handleTextChange,
    handleClear,
    handleApplyCorrectedText,
    handleCheckWrapper,
    handleHumanizeOptionsChange,
    handleRequestHumanizeWrapper,
    handleAcceptHumanized,
    handleRejectHumanized,
    handleCareerToolsSubmit,
    handleOnboardingComplete,
    getAllSuggestions,
    resetError,
  } = useAppContent();

  // Calculate suggestion count for mobile tab
  const suggestionCount = getAllSuggestions().length;

  // Error boundary fallback
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <button
            onClick={resetError}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }



  return (
    <Layout>
      
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen">
        <div className="w-3/5 border-r border-gray-200/60">
          <InputPanel
            text={state.editor.text}
            onTextChange={handleTextChange}
            onClear={handleClear}
            onCheck={handleCheckWrapper}
            isLoading={isLoading}
            autoCheckEnabled={state.settings.autoCheckEnabled}
            onAutoCheckToggle={(enabled) => dispatch({ type: 'SET_AUTO_CHECK', payload: enabled })}
            suggestions={getAllSuggestions()}
            humanizeOptions={state.humanize.options}
            onHumanizeOptionsChange={handleHumanizeOptionsChange}
            onRequestHumanize={handleRequestHumanizeWrapper}
            isHumanizing={isHumanizing}
            canHumanize={!!state.editor.text.trim()}
            onAcceptHumanized={handleAcceptHumanized}
            onRejectHumanized={handleRejectHumanized}
          />
        </div>
      
        <div className="w-2/5">
          {/* Use the simplified suggestions panel */}
          <SimpleSuggestionsPanel
            results={state.editor.results}
            isLoading={isLoading}
            text={state.editor.text}
            onTextChange={handleTextChange}
            onApplyCorrectedText={handleApplyCorrectedText}
            error={state.editor.error}
          />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <SwipeableTabNavigation
          activeTab={state.ui.activeTab}
          onTabChange={(tab) => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab })}
          suggestionCount={suggestionCount}
        />
      
        <div className="h-[calc(100vh-12rem)]">
          {state.ui.activeTab === 'input' ? (
             <InputPanel
               text={state.editor.text}
               onTextChange={handleTextChange}
               onClear={handleClear}
               onCheck={handleCheckWrapper}
               isLoading={isLoading}
               autoCheckEnabled={state.settings.autoCheckEnabled}
               onAutoCheckToggle={(enabled) => dispatch({ type: 'SET_AUTO_CHECK', payload: enabled })}
               suggestions={getAllSuggestions()}
               humanizeOptions={state.humanize.options}
               onHumanizeOptionsChange={handleHumanizeOptionsChange}
               onRequestHumanize={handleRequestHumanizeWrapper}
               isHumanizing={isHumanizing}
               canHumanize={!!state.editor.text.trim()}
               onAcceptHumanized={handleAcceptHumanized}
               onRejectHumanized={handleRejectHumanized}
             />
          ) : (
            /* Use the simplified suggestions panel */
            <SimpleSuggestionsPanel
              results={state.editor.results}
              isLoading={isLoading}
              text={state.editor.text}
              onTextChange={handleTextChange}
              onApplyCorrectedText={handleApplyCorrectedText}
              error={state.editor.error}
            />
          )}
        </div>

        <FloatingActionMenu
          onCheck={handleCheckWrapper}
          onClear={handleClear}
          onSettings={() => dispatch({ type: 'TOGGLE_MODAL', payload: 'modelConfig' })}
          isLoading={isLoading}
          canCheck={!!state.editor.text.trim()}
        />
      </div>

      {/* Modals */}
      {isModelConfigOpen && (
        <ModelConfigModalLazy
          isOpen={isModelConfigOpen}
          onClose={() => dispatch({ type: 'TOGGLE_MODAL', payload: 'modelConfig' })}
          onConfigurationUpdate={handleModelConfigurationUpdate}
        />
      )}
      
      {isWritingScoreOpen && (
        <WritingScoreModalLazy
          isOpen={isWritingScoreOpen}
          onClose={() => dispatch({ type: 'TOGGLE_MODAL', payload: 'writingScore' })}
          writingScore={null}
          toneAnalysis={undefined}
        />
      )}
      
      {isCareerToolsOpen && (
        <CareerToolsModalLazy
          isOpen={isCareerToolsOpen}
          onClose={handleCareerToolsClose}
          onSubmit={handleCareerToolsSubmit}
          results={state.careerTools.results}
          isLoading={isCareerToolsLoading}
          selectedModel={state.settings.selectedModel}
          availableModels={modelProviderService.getAllModelsForUI()}
          onModelChange={handleModelChange}
          onConfigureProvider={handleConfigureProvider}
        />
      )}
      

      
      {/* Onboarding */}
      <Onboarding
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </Layout>
  );
};