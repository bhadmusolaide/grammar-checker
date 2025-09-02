
import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import { AppProvider } from './contexts/AppContext';
import { AppContent } from './components/AppContent';
import { FullPageLoader } from './components/common/LoadingStates';
import { modelProviderService } from './services/modelProvider';

// Lazy load pages for better performance
const ChatPage = lazy(() => import('./pages/ChatPage'));
const CareerToolsPage = lazy(() => import('./pages/CareerToolsPage'));
const HumanizerPage = lazy(() => import('./pages/HumanizerPage'));

// Main App component with providers and routing
function App() {
  useEffect(() => {
    // Initialize the model provider service on app startup
    modelProviderService.init();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AppProvider>
            <Router>
              <Routes>
                <Route path="/" element={<AppContent />} />
                <Route path="/chat" element={
                  <Suspense fallback={<FullPageLoader />}> 
                    <ChatPage />
                  </Suspense>
                } />
                <Route path="/career-tools" element={
                  <Suspense fallback={<FullPageLoader />}> 
                    <CareerToolsPage />
                  </Suspense>
                } />
                <Route path="/humanizer" element={
                  <Suspense fallback={<FullPageLoader />}> 
                    <HumanizerPage />
                  </Suspense>
                } />
              </Routes>
            </Router>
          </AppProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;