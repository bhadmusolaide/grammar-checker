import { SavedAnalysis, CareerToolsInput, CareerToolsResult, ResumeOptimizerOptions, JobApplicationOptions, UnifiedModel } from '../types';

const SAVED_ANALYSIS_STORAGE_KEY = 'ai-grammar-saved-analysis';

export interface SavedAnalysisStorageData {
  analyses: SavedAnalysis[];
  lastUpdated: string;
}

/**
 * SavedAnalysesService for managing saved career tool analyses in localStorage
 */
export class SavedAnalysisService {
  /**
   * Get all saved analyses (alias for loadAnalyses)
   */
  static getAllAnalyses(): SavedAnalysis[] {
    return this.loadAnalyses();
  }

  /**
   * Load saved analyses from localStorage
   */
  static loadAnalyses(): SavedAnalysis[] {
    try {
      const data = localStorage.getItem(SAVED_ANALYSIS_STORAGE_KEY);
      if (!data) return [];
      
      const parsed: SavedAnalysisStorageData = JSON.parse(data);
      
      // Validate parsed data structure
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.analyses)) {
        console.warn('Invalid saved analyses data structure, returning empty array');
        return [];
      }
      
      // Convert date strings back to Date objects and validate each analysis
      return parsed.analyses
        .map(analysis => {
          try {
            return {
              ...analysis,
              createdAt: new Date(analysis.createdAt),
              updatedAt: new Date(analysis.updatedAt)
            };
          } catch (dateError) {
            console.warn(`Invalid date format in analysis ${analysis.id || 'unknown'}, skipping`);
            return null;
          }
        })
        .filter((analysis): analysis is SavedAnalysis => {
          if (!analysis) return false;
          if (!this.validateAnalysis(analysis)) {
            console.warn(`Invalid analysis data for ${(analysis as any).name || 'unknown'}, skipping`);
            return false;
          }
          return true;
        });
    } catch (error) {
      console.error('Failed to load saved analyses from localStorage:', error);
      // Try to clear corrupted data
      try {
        localStorage.removeItem(SAVED_ANALYSIS_STORAGE_KEY);
        console.info('Cleared corrupted analyses data from localStorage');
      } catch (clearError) {
        console.error('Failed to clear corrupted data:', clearError);
      }
      return [];
    }
  }

  /**
   * Save analyses to localStorage
   */
  static saveAnalyses(analyses: SavedAnalysis[]): void {
    try {
      // Validate analyses array
      if (!Array.isArray(analyses)) {
        throw new Error('Invalid analyses data: must be an array');
      }
      
      // Validate each analysis
      for (const analysis of analyses) {
        if (!this.validateAnalysis(analysis)) {
          throw new Error(`Invalid analysis data for: ${(analysis as any).name || 'unnamed analysis'}`);
        }
      }
      
      const data: SavedAnalysisStorageData = {
        analyses,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(SAVED_ANALYSIS_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save analyses to localStorage:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to save analysis. Please check your data and try again.');
    }
  }

  /**
   * Create a new saved analysis
   */
  static createAnalysis(
    name: string,
    type: 'resume' | 'job',
    input: CareerToolsInput,
    options: ResumeOptimizerOptions | JobApplicationOptions,
    results: CareerToolsResult,
    model?: UnifiedModel,
    description?: string
  ): SavedAnalysis {
    // Validate required parameters
    if (!name || !name.trim()) {
      throw new Error('Analysis name is required and cannot be empty');
    }
    
    if (!type || (type !== 'resume' && type !== 'job')) {
      throw new Error('Analysis type must be either "resume" or "job"');
    }
    
    // Create a default input if none provided or empty
    if (!input || Object.keys(input).length === 0) {
      console.warn('Empty input provided to SavedAnalysisService.createAnalysis, creating default input');
      
      input = {
        targetPosition: type === 'resume' ? 'Resume Optimization' : 'Job Analysis',
        companyName: 'Saved Analysis'
      };
      
      // Add type-specific default fields
      if (type === 'resume') {
        input.jobDescription = results.optimizedResume?.content || 'Optimized Resume';
      } else {
        input.jobDescriptionText = 'Job Analysis Results';
      }
    }
    
    if (!results) {
      throw new Error('Analysis results are required');
    }
    
    const analyses = this.loadAnalyses();
    
    // Check for duplicate names
    const duplicateName = analyses.find(existing => 
      existing.name.toLowerCase() === name.trim().toLowerCase() && 
      existing.type === type
    );
    
    if (duplicateName) {
      throw new Error(`An analysis with the name "${name.trim()}" already exists for this type`);
    }
    
    const analysis: SavedAnalysis = {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      type,
      createdAt: new Date(),
      updatedAt: new Date(),
      input,
      options,
      results,
      model,
      description
    };

    analyses.push(analysis);
    this.saveAnalyses(analyses);

    return analysis;
  }

  /**
   * Update an existing saved analysis
   */
  static updateAnalysis(id: string, updates: Partial<SavedAnalysis>): SavedAnalysis | null {
    try {
      const analyses = this.loadAnalyses();
      const index = analyses.findIndex(analysis => analysis.id === id);
      
      if (index === -1) {
        throw new Error('Analysis not found');
      }

      const updatedAnalysis = {
        ...analyses[index],
        ...updates,
        updatedAt: new Date()
      };

      analyses[index] = updatedAnalysis;
      this.saveAnalyses(analyses);

      return updatedAnalysis;
    } catch (error) {
      console.error('Failed to update analysis:', error);
      return null;
    }
  }

  /**
   * Delete a saved analysis
   */
  static deleteAnalysis(id: string): void {
    try {
      if (!id || !id.trim()) {
        throw new Error('Analysis ID is required for deletion');
      }
      
      const analyses = this.loadAnalyses();
      const analysisToDelete = analyses.find(analysis => analysis.id === id);
      
      if (!analysisToDelete) {
        throw new Error(`Analysis with ID "${id}" not found`);
      }
      
      const filteredAnalyses = analyses.filter(analysis => analysis.id !== id);
      this.saveAnalyses(filteredAnalyses);
    } catch (error) {
      console.error('Error deleting analysis:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete analysis. Please try again.');
    }
  }

  /**
   * Get a specific saved analysis by ID
   */
  static getAnalysisById(id: string): SavedAnalysis | null {
    try {
      const analyses = this.loadAnalyses();
      return analyses.find(analysis => analysis.id === id) || null;
    } catch (error) {
      console.error('Failed to get analysis by ID:', error);
      return null;
    }
  }

  /**
   * Get analyses by type
   */
  static getAnalysesByType(type: 'resume' | 'job'): SavedAnalysis[] {
    try {
      const analyses = this.loadAnalyses();
      return analyses.filter(analysis => analysis.type === type);
    } catch (error) {
      console.error('Failed to get analyses by type:', error);
      return [];
    }
  }

  /**
   * Clear all saved analyses
   */
  static clearAllAnalyses(): void {
    try {
      localStorage.removeItem(SAVED_ANALYSIS_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear saved analyses:', error);
      throw new Error('Failed to clear analyses');
    }
  }

  /**
   * Validate analysis data before saving
   */
  private static validateAnalysis(analysis: any): analysis is SavedAnalysis {
    return (
      analysis &&
      typeof analysis === 'object' &&
      typeof analysis.id === 'string' &&
      analysis.id.trim().length > 0 &&
      typeof analysis.name === 'string' &&
      analysis.name.trim().length > 0 &&
      typeof analysis.type === 'string' &&
      (analysis.type === 'resume' || analysis.type === 'job') &&
      analysis.input &&
      typeof analysis.input === 'object' &&
      analysis.results &&
      typeof analysis.results === 'object' &&
      analysis.createdAt instanceof Date &&
      analysis.updatedAt instanceof Date
    );
  }

  /**
   * Generate a unique name for an analysis if none provided
   */
  static generateAnalysisName(type: 'resume' | 'job', input: CareerToolsInput): string {
    const timestamp = new Date().toLocaleDateString();
    
    if (type === 'resume') {
      const position = input.targetPosition || 'Position';
      return `Resume Analysis - ${position} (${timestamp})`;
    } else {
      const company = input.companyName || 'Company';
      const position = input.targetPosition || 'Position';
      return `Job Analysis - ${company} ${position} (${timestamp})`;
    }
  }
}