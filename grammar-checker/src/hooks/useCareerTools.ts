import { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { modelProviderService } from '../services/modelProvider';
import { CareerToolsInput, ResumeOptimizerOptions, JobApplicationOptions, UnifiedModel } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useCareerTools = () => {
  const { state, dispatch } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCareerToolsOpen = () => {
    setShowModal(true);
    setHasError(false);
    setErrorMessage('');
  };

  const handleCareerToolsClose = () => {
    setShowModal(false);
  };

  const handleCareerTools = async (
    input: CareerToolsInput,
    type: 'resume' | 'job',
    options: ResumeOptimizerOptions | JobApplicationOptions,
    modelConfig: UnifiedModel
  ) => {
    try {
      dispatch({ type: 'SET_CAREER_TOOLS_LOADING', payload: true });
      setHasError(false);
      setErrorMessage('');

      let endpoint = '';
      
      if (type === 'resume') {
        endpoint = '/api/career/resume-optimize';
        
        // For resume optimization, we need to send form data (multipart/form-data) to handle file uploads
        const formData = new FormData();
        
        // Add model configuration as a JSON string
        formData.append('modelConfig', JSON.stringify({
          model: modelConfig.config.model,
          provider: modelConfig.config.provider,
          apiKey: modelConfig.config.apiKey
        }));
        
        // Add resume file if available
        if (input.resumeFile) {
          formData.append('resumeFile', input.resumeFile);
        }
        
        // Add job description (required)
        if (input.jobDescription) {
          formData.append('jobDescription', input.jobDescription);
        } else {
          // Provide a default job description if not provided
          formData.append('jobDescription', 'General job description for resume optimization');
        }
        
        // Add optional fields
        if (input.targetPosition) {
          formData.append('targetPosition', input.targetPosition);
        }
        if (input.companyName) {
          formData.append('companyName', input.companyName);
        }
        
        // Add options as a JSON string
        formData.append('options', JSON.stringify(options));

        console.log('Sending request to:', `${API_BASE_URL}${endpoint}`);
        console.log('Request formData keys:', Array.from(formData.keys()));
        // Log the values of the form data (be careful with sensitive data)
        for (const pair of formData.entries()) {
          if (pair[0] !== 'resumeFile') { // Don't log file content
            console.log(pair[0] + ': ' + pair[1]);
          } else {
            console.log(pair[0] + ': [File Object]');
          }
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          // Don't set Content-Type header - let the browser set it with the correct boundary
          body: formData,
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.log('Error response data:', errorData);
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Success response data:', result);
        
        // Add debug information for AI response
        console.log('Full career tools API response:', JSON.stringify(result, null, 2));
        
        // Handle both old and new response formats
        if (result.success || result.source) {
          // Add the type to both the result and result.data for UI processing
          if (result.data) {
            result.data.type = type;
            console.log('Career tools response contains data object with keys:', Object.keys(result.data));
            
            // Check for analysis data
            if (result.data.analysis) {
              console.log('Analysis data contains:', Object.keys(result.data.analysis));
              console.log('Hidden requirements count:', result.data.analysis.hiddenRequirements?.length || 0);
              console.log('Key phrases count:', result.data.analysis.keyPhrases?.length || 0);
            } else {
              console.log('WARNING: No analysis data found in the response');
            }
            
            // Check for interview data
            if (result.data.interviewPrep) {
              console.log('Interview prep data contains:', Object.keys(result.data.interviewPrep));
              console.log('Interview answers count:', result.data.interviewPrep.answers?.length || 0);
            } else {
              console.log('WARNING: No interview prep data found in the response');
            }
          } else {
            console.log('WARNING: Response does not contain a data object');
          }
          
          result.type = type;
          
          dispatch({ type: 'SET_CAREER_TOOLS_RESULTS', payload: result });
          setShowModal(false);
        } else {
          throw new Error(result.error || 'Career tools request failed');
        }
      } else {
        // Handle job analysis (existing implementation)
        endpoint = '/api/career/job-analysis';
        
        const requestBody: any = {};
        
        // Add model configuration
        requestBody.modelConfig = {
          model: modelConfig.config.model,
          provider: modelConfig.config.provider,
          apiKey: modelConfig.config.apiKey
        };
        
        // Add job assistant fields
        if (input.jobUrl) {
          requestBody.jobUrl = input.jobUrl;
          requestBody.jobDescriptionText = input.jobUrl; // For validation middleware
        }
        if (input.jobDescriptionText) {
          requestBody.jobDescriptionText = input.jobDescriptionText;
          requestBody.text = input.jobDescriptionText; // For validation middleware
        }
        if (input.targetPosition) {
          requestBody.targetPosition = input.targetPosition;
        }
        if (input.companyName) {
          requestBody.companyName = input.companyName;
        }
        
        requestBody.options = options;

        console.log('Sending request to:', `${API_BASE_URL}${endpoint}`);
        console.log('Request body:', requestBody);

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.log('Error response data:', errorData);
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Success response data:', result);
        
        // Add debug information for AI response
        console.log('Full career tools API response:', JSON.stringify(result, null, 2));
        
        // Handle both old and new response formats
        if (result.success || result.source) {
          // Add the type to both the result and result.data for UI processing
          if (result.data) {
            result.data.type = type;
            console.log('Career tools response contains data object with keys:', Object.keys(result.data));
            
            // Check for analysis data
            if (result.data.analysis) {
              console.log('Analysis data contains:', Object.keys(result.data.analysis));
              console.log('Hidden requirements count:', result.data.analysis.hiddenRequirements?.length || 0);
              console.log('Key phrases count:', result.data.analysis.keyPhrases?.length || 0);
            } else {
              console.log('WARNING: No analysis data found in the response');
            }
            
            // Check for interview data
            if (result.data.interviewPrep) {
              console.log('Interview prep data contains:', Object.keys(result.data.interviewPrep));
              console.log('Interview answers count:', result.data.interviewPrep.answers?.length || 0);
            } else {
              console.log('WARNING: No interview prep data found in the response');
            }
          } else {
            console.log('WARNING: Response does not contain a data object');
          }
          
          result.type = type;
          
          dispatch({ type: 'SET_CAREER_TOOLS_RESULTS', payload: result });
          setShowModal(false);
        } else {
          throw new Error(result.error || 'Career tools request failed');
        }
      }
    } catch (error) {
      console.error('Career tools error:', error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      dispatch({ type: 'SET_CAREER_TOOLS_LOADING', payload: false });
    }
  };

  const handleCareerToolsSubmit = async (
    input: CareerToolsInput,
    type: 'resume' | 'job',
    options: ResumeOptimizerOptions | JobApplicationOptions,
    selectedCareerModel?: UnifiedModel
  ) => {
    // Get the selected model or find a default one
    let modelToUse = selectedCareerModel || state.settings.selectedModel;
    
    // If no model is selected, try to get a default one
    if (!modelToUse) {
      const availableModels = modelProviderService.getAvailableModels();
      modelToUse = availableModels.length > 0 ? availableModels[0] : null;
      
      // If we found a model, set it as the selected model
      if (modelToUse) {
        dispatch({ type: 'SET_SELECTED_MODEL', payload: modelToUse });
      }
    }
    
    if (modelToUse) {
      await handleCareerTools(input, type, options, modelToUse);
    } else {
      // If no model is available, show an error or prompt to configure one
      setHasError(true);
      setErrorMessage('No AI model available for career tools. Please configure a model in the settings.');
    }
  };

  return {
    ...state.careerTools,
    showModal,
    hasError,
    errorMessage,
    handleCareerToolsOpen,
    handleCareerToolsClose,
    handleCareerToolsSubmit,
    selectedModel: state.settings.selectedModel,
    availableModels: modelProviderService.getAllModelsForUI(),
  };
};