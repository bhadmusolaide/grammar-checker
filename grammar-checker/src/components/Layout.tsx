import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { modelProviderService } from '../services/modelProvider';
import Header from './Header';
import { Language } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { state, dispatch } = useAppContext();

  const handleModelChange = (model: any) => {
    dispatch({ type: 'SET_SELECTED_MODEL', payload: model });
  };

  const handleConfigureProvider = () => {
    dispatch({ type: 'TOGGLE_MODAL', payload: 'modelConfig' });
  };

  const handleViewWritingScoreDetails = () => {
    dispatch({ type: 'TOGGLE_MODAL', payload: 'writingScore' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onViewWritingScoreDetails={handleViewWritingScoreDetails}
        selectedModel={state.settings.selectedModel}
        availableModels={modelProviderService.getAllModelsForUI()}
        onModelChange={handleModelChange}
        onConfigureProvider={handleConfigureProvider}
        language={state.settings.language as Language}
        onLanguageChange={(language) => dispatch({ type: 'SET_LANGUAGE', payload: language })}
        writingScore={null}
      />
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;