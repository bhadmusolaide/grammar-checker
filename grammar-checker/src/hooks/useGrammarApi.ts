import { useRef, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { GrammarResult, UnifiedModel, CareerToolsInput, CareerToolsResult, ResumeOptimizerOptions, JobApplicationOptions } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_KEY = import.meta.env.VITE_API_KEY || null;

export const useGrammarApi = () => {
  const { state, dispatch } = useAppContext();
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelPreviousRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const handleCheck = useCallback(async (text: string, model: UnifiedModel, language: string) => {
    console.log('handleCheck called with:', { text: text.substring(0, 50), model, language });
    
    if (!text.trim() || !model) {
      console.log('handleCheck: Text or model missing, returning early');
      return;
    }

    cancelPreviousRequest();
    abortControllerRef.current = new AbortController();

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add API key to headers if available
      if (API_KEY) {
        headers['x-api-key'] = API_KEY;
      }

      const response = await fetch(`${API_BASE_URL}/api/orchestrator/check`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          modelConfig: model.config,
          userApiKey: model.config.apiKey || undefined
        }),
        signal: abortControllerRef.current.signal
      });

      console.log('API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response data:', data);
      
      // Transform the simplified response to match the expected GrammarResult format
      const provider = data.metadata?.provider || 'ollama';
      const transformedData: GrammarResult = {
        // Map suggestions to the appropriate provider based on the metadata
        [provider]: {
          suggestions: data.suggestions || []
        },
        // Include corrected_text from backend response
        corrected_text: data.corrected_text,
        metadata: data.metadata
      } as GrammarResult;
      
      console.log('Provider used:', provider);
      console.log('Suggestions count:', data.suggestions?.length || 0);
      console.log('Sample suggestion:', data.suggestions?.[0]);
      console.log('Corrected text received:', data.corrected_text);
      console.log('Transformed data:', transformedData);
      dispatch({ type: 'SET_RESULTS', payload: transformedData });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      console.error('Error checking grammar:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'An unexpected error occurred' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      abortControllerRef.current = null;
    }
  }, [dispatch, cancelPreviousRequest]);

  const handleHumanize = useCallback(async (text: string, tone: string, strength: string, model: UnifiedModel) => {
    console.log('handleHumanize called with:', { text: text.substring(0, 50), tone, strength, model });
    
    if (!text.trim() || !model) {
      console.log('handleHumanize: Text or model missing, returning early');
      return;
    }

    cancelPreviousRequest();
    abortControllerRef.current = new AbortController();

    dispatch({ type: 'HUMANIZE_START' });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add API key to headers if available
      if (API_KEY) {
        headers['x-api-key'] = API_KEY;
      }

      const response = await fetch(`${API_BASE_URL}/api/enhance/humanize`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          tone,
          strength,
          modelConfig: model.config
        }),
        signal: abortControllerRef.current.signal
      });

      console.log('Humanize API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Humanize API response data:', data);
      dispatch({ type: 'HUMANIZE_SUCCESS', payload: data });
      
      dispatch({
        type: 'SET_HUMANIZE_OPTIONS',
        payload: {
          ...state.humanize.options,
          humanizedText: data.humanized,
          showDiff: true,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Humanize request was aborted');
        return;
      }
      console.error('Error humanizing text:', error);
      dispatch({ type: 'HUMANIZE_ERROR', payload: error instanceof Error ? error.message : 'An unexpected error occurred' });
    } finally {
      abortControllerRef.current = null;
    }
  }, [dispatch, cancelPreviousRequest, state.humanize.options]);

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const handleCareerTools = useCallback(async (
    input: CareerToolsInput,
    type: 'resume' | 'job',
    options: ResumeOptimizerOptions | JobApplicationOptions,
    model: UnifiedModel
  ) => {
    dispatch({ type: 'SET_CAREER_TOOLS_LOADING', payload: true });
    dispatch({ type: 'SET_CAREER_TOOLS_RESULTS', payload: undefined });

    if (!model) {
      dispatch({ 
        type: 'SET_CAREER_TOOLS_RESULTS', 
        payload: { error: 'No AI model selected. Please select a model first.' } 
      });
      dispatch({ type: 'SET_CAREER_TOOLS_LOADING', payload: false });
      return;
    }

    try {
      let result: CareerToolsResult;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      if (type === 'resume') {
        // Extract text from resume file
        let resumeText = '';
        if (input.resumeFile) {
          try {
            resumeText = await readFileAsText(input.resumeFile);
          } catch (fileError) {
            console.error('Error reading resume file:', fileError);
            throw new Error('Failed to read resume file');
          }
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // Add API key to headers if available
        if (API_KEY) {
          headers['x-api-key'] = API_KEY;
        }

        const response = await fetch(`${API_BASE_URL}/api/career/resume-optimizer`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            resumeText,
            jobDescription: input.jobDescription || '',
            targetPosition: input.targetPosition || '',
            companyName: input.companyName || '',
            options,
            modelConfig: model.config
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        result = {
          success: true,
          message: 'Resume optimization completed successfully',
          data: data
        };
      } else {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // Add API key to headers if available
        if (API_KEY) {
          headers['x-api-key'] = API_KEY;
        }

        const response = await fetch(`${API_BASE_URL}/api/career/job-assistant`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            jobUrl: input.jobUrl,
            jobDescriptionText: input.jobDescriptionText,
            targetPosition: input.targetPosition,
            companyName: input.companyName,
            options: JSON.stringify(options),
            modelConfig: model.config
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        result = {
          success: data.success,
          message: data.message,
          data: data.data
        };
      }

      clearTimeout(timeoutId);
      dispatch({ type: 'SET_CAREER_TOOLS_RESULTS', payload: result });
    } catch (error) {
      console.error('Career tools error:', error);
      let errorMessage = 'An unexpected error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch({ type: 'SET_CAREER_TOOLS_RESULTS', payload: { error: errorMessage } });
    } finally {
      dispatch({ type: 'SET_CAREER_TOOLS_LOADING', payload: false });
    }
  }, [dispatch]);

  return {
    handleCheck,
    handleHumanize,
    handleCareerTools,
    cancelPreviousRequest,
    isLoading: state.editor.isLoading,
    isHumanizing: state.humanize.isHumanizing,
    isCareerToolsLoading: state.careerTools.loading
  };
};