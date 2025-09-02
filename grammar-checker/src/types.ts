export type Language = 'en-US' | 'en-GB' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'nl' | 'pl' | 'ru' | 'zh' | 'ja' | 'ko' | 'ar' | 'hi';

export interface Suggestion {
  type: 'grammar' | 'clarity' | 'tone' | 'style' | 'ai_suggestion';
  suggestionType?: 'critical_error' | 'error' | 'improvement' | 'style_suggestion' | 'enhancement';
  message: string;
  shortMessage?: string;
  offset?: number;
  length?: number;
  replacements?: Array<{ value: string; confidence?: number }>;
  rule?: string;
  category: string;
  severity?: 'low' | 'medium' | 'high';
  confidence?: number;
  explanation?: string;
  impact?: 'grammar' | 'clarity' | 'style' | 'tone' | 'engagement' | 'readability';
  priority?: number; // 1-10, higher is more important
  isError?: boolean; // Quick check for error vs suggestion
  // Backend-specific properties
  original?: string; // Original text from backend
  suggested?: string; // Suggested correction from backend
  index?: number; // Backend index (same as offset)
  endIndex?: number; // Backend end index
}

export interface ToneAnalysis {
  overall: {
    formality: 'very_formal' | 'formal' | 'neutral' | 'informal' | 'very_informal';
    sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
    emotion: 'confident' | 'uncertain' | 'enthusiastic' | 'analytical' | 'concerned' | 'neutral';
    politeness: 'very_polite' | 'polite' | 'neutral' | 'direct' | 'blunt';
  };
  scores: {
    formalityScore: number; // 0-100
    sentimentScore: number; // -100 to 100
    confidenceScore: number; // 0-100
    politenessScore: number; // 0-100
  };
  consistency: {
    toneVariation: number; // 0-100, lower is more consistent
    audienceAlignment: number; // 0-100
  };
}

// Removed AdvancedClarityAnalysis - no longer needed in AI-only mode

export interface WritingScore {
  overall: number; // 0-100
  breakdown: {
    grammar: number;
    clarity: number;
    style: number;
    structure: number;
    engagement: number;
  };
  level: 'developing' | 'intermediate' | 'advanced' | 'expert';
  targetAudience: 'academic' | 'professional' | 'general public' | 'consumers';
  documentType: 'academic' | 'business' | 'blog' | 'marketing' | 'general';
  insights: ActionableInsight[];
  benchmarks: IndustryBenchmarks;
}

export interface ActionableInsight {
  category: string;
  priority: 'high' | 'medium' | 'low';
  issue: string;
  action: string;
  impact: string;
}

export interface IndustryBenchmarks {
  description: string;
  grammar: BenchmarkLevels;
  clarity: BenchmarkLevels;
  style: BenchmarkLevels;
  structure: BenchmarkLevels;
  engagement: BenchmarkLevels;
}

export interface BenchmarkLevels {
  excellent: number;
  good: number;
  acceptable: number;
}

// Removed ReadabilityAnalysis interface - no longer needed in AI-only mode

export interface ServiceResult {
  source: string;
  suggestions?: Suggestion[];
  toneAnalysis?: ToneAnalysis;
  writingScore?: WritingScore;
  error?: string;
}

export interface GrammarResult {
  ollama?: ServiceResult;
  openai?: ServiceResult;
  groq?: ServiceResult;
  deepseek?: ServiceResult;
  qwen?: ServiceResult;
  openrouter?: ServiceResult;
  // Enhancement results
  enhancement?: EnhancementResult;
  // Direct suggestions from backend (for compatibility)
  suggestions?: Suggestion[];
  // Corrected text from backend
  corrected_text?: string;
  // Metadata from API response
  metadata?: {
    provider?: string;
    totalSuggestions?: number;
    textLength?: number;
    wordCount?: number;
    processingTime?: number;
    mode?: string;
    strategy?: string;
    writingScore?: WritingScore;
    [key: string]: any;
  };
}

export interface EnhancementResult {
  source: string;
  originalText: string;
  enhancedText: string;
  improvementSummary: string;
  metrics: EnhancementMetrics;
  enhancementType: 'formal' | 'casual';
  timestamp: string;
}

export interface EnhancementMetrics {
  originalWordCount: number;
  enhancedWordCount: number;
  wordCountChange: number;
  characterCountChange: number;
}

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

// Cloud Provider Types
export type ModelProvider = 'ollama' | 'openai' | 'groq' | 'deepseek' | 'qwen' | 'openrouter';

export interface CloudModel {
  id: string;
  name: string;
  provider: ModelProvider;
  description?: string;
  contextLength?: number;
  costPer1kTokens?: number;
  speed: 'fast' | 'medium' | 'slow';
  quality: 'high' | 'medium' | 'standard';
}

export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  apiKey?: string;
}

export interface ProviderConfig {
  name: string;
  provider: ModelProvider;
  apiKey?: string;
  baseUrl?: string;
  enabled: boolean;
  models: CloudModel[];
}

// Unified model selection
export interface UnifiedModel {
  id: string;
  name: string;
  displayName: string;
  provider: ModelProvider;
  config: ModelConfig;
  isAvailable: boolean;
  performance: {
    speed: 'fast' | 'medium' | 'slow';
    quality: 'high' | 'medium' | 'standard';
    cost: 'free' | 'low' | 'medium' | 'high';
  };
}

export interface InputPanelProps {
  text: string;
  onTextChange: (text: string, isPaste?: boolean) => void;
  onClear: () => void;
  onCheck: () => void;
  isLoading: boolean;
  autoCheckEnabled: boolean;
  onAutoCheckToggle: (enabled: boolean) => void;
  suggestions?: Suggestion[];
  // Humanizer (Variant A) – optional to avoid breaking existing callers
  humanizeOptions?: HumanizeOptions;
  onHumanizeOptionsChange?: (options: HumanizeOptions) => void;
  onRequestHumanize?: () => void;
  isHumanizing?: boolean;
  canHumanize?: boolean;
  onAcceptHumanized?: () => void;
  onRejectHumanized?: () => void;
}

export interface SuggestionsPanelProps {
  results: GrammarResult | null;
  isLoading: boolean;
  text: string;
  onTextChange: (text: string) => void;
  onApplyCorrectedText?: () => void;
  error?: string | null;
  onAcceptSuggestion?: (suggestion: Suggestion) => void;
  onIgnoreSuggestion?: (suggestion: Suggestion) => void;
  highlightedSuggestions?: Suggestion[];
}

export interface SuggestionAction {
  id: string;
  type: 'accept' | 'ignore';
  suggestion: Suggestion;
  timestamp: number;
}

export interface HighlightRange {
  start: number;
  end: number;
  type: Suggestion['type'];
  suggestion: Suggestion;
  color: string;
}

export interface WritingMetrics {
  totalWords: number;
  totalSentences: number;
  totalParagraphs: number;
  readingTime: number; // in minutes
  lastUpdated: Date;
}

// Humanizer Types
export interface HumanizeOptions {
  tone: 'neutral' | 'friendly' | 'professional';
  strength: 'light' | 'medium' | 'strong';
  humanizedText?: string;
  showDiff?: boolean;
}

export interface HumanizeResult {
  text: string;
  meta: {
    tokens: number;
    model: string;
  };
}

// Career Tools Types
export interface ResumeOptimizerOptions {
  atsOptimization: boolean;
  achievementTransformation: boolean;
  formatConversion: boolean;
}

export interface JobApplicationOptions {
  jobDescriptionDecoder: boolean;
  coverLetterGenerator: boolean;
  interviewAnswerBuilder: boolean;
}

export interface CareerToolsInput {
  // Resume Optimizer
  resumeFile?: File;
  jobDescription?: string; // for targeted optimization
  
  // Job Application Assistant
  jobUrl?: string;
  jobDescriptionText?: string;
  
  // Common
  targetPosition?: string;
  companyName?: string;
}

export interface CareerToolsResult {
  success?: boolean;
  message?: string;
  error?: string;
  data?: any;
  type?: 'resume' | 'job';
  
  // Resume Optimizer Results
  optimizedResume?: {
    content: string;
    changes: string[];
    atsScore: number;
    keywords: string[];
  };
  
  // Direct optimized text result
  optimizedText?: string;
  
  // Achievement Transformation Results
  transformedAchievements?: {
    original: string;
    transformed: string;
    impact: string;
  }[];
  
  // Job Application Results
  jobAnalysis?: {
    hiddenRequirements: string[];
    keyPhrases: string[];
    culturalFit: string[];
    recommendations: string[];
  };
  
  coverLetter?: {
    content: string;
    highlights: string[];
    callToAction: string;
  };
  
  interviewAnswers?: {
    question: string;
    starResponse: {
      situation: string;
      task: string;
      action: string;
      result: string;
    };
    keyTerms: string[];
  }[];
}

export interface CareerToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CareerToolsInput, type: 'resume' | 'job', options: ResumeOptimizerOptions | JobApplicationOptions, selectedModel?: UnifiedModel) => void;
  onSaveAnalysis?: (name: string, input: CareerToolsInput, options: ResumeOptimizerOptions | JobApplicationOptions, results: CareerToolsResult) => void;
  isLoading: boolean;
  results?: CareerToolsResult;
  selectedModel: UnifiedModel | null;
  availableModels: UnifiedModel[];
  onModelChange: (model: UnifiedModel) => void;
  onConfigureProvider?: (providerId: string) => void;
  onLoadAnalysis?: (analysis: SavedAnalysis) => void;
}

export interface ModelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigurationUpdate: () => void;
}

export interface WritingScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  writingScore: WritingScore | null;
  toneAnalysis?: ToneAnalysis;
}

// Chat Types
export interface ChatMessage {
  id: string;
  sessionId?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: ChatAttachment[];
  isLoading?: boolean;
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: 'file' | 'image' | 'document';
  size: number;
  url?: string;
  content?: string; // For text files
  file?: File; // For file uploads
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  model?: UnifiedModel;
}

export interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
  error: string | null;
  isTyping: boolean;
}

export interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: UnifiedModel | null;
  availableModels: UnifiedModel[];
  onModelChange: (model: UnifiedModel) => void;
}

// Saved Analysis Types
export interface SavedAnalysis {
  id: string;
  name: string;
  type: 'resume' | 'job';
  createdAt: Date;
  updatedAt: Date;
  input: CareerToolsInput;
  options: ResumeOptimizerOptions | JobApplicationOptions;
  results: CareerToolsResult;
  model?: UnifiedModel;
  description?: string;
}