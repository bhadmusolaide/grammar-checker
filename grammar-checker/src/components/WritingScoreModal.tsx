import React from 'react';
import { WritingScore as WritingScoreType, ToneAnalysis, ActionableInsight } from '../types';
import { getScoreColorWithBackground, getBenchmarkColor, getScoreIcon, getPriorityIcon, getPriorityColor, getDocumentTypeIcon, getLevelIcon } from '../utils/scoreUtils';

interface WritingScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  writingScore: WritingScoreType | null;
  toneAnalysis?: ToneAnalysis;
}

const WritingScoreModal: React.FC<WritingScoreModalProps> = ({
  isOpen,
  onClose,
  writingScore,
  toneAnalysis
}) => {
  if (!isOpen || !writingScore) return null;



  const MetricComparison: React.FC<{ 
    label: string; 
    value: number; 
    benchmark: { excellent: number; good: number; acceptable: number };
    icon: string;
  }> = ({ label, value, benchmark, icon }) => (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{icon}</span>
          <span className="font-medium text-gray-700">{label}</span>
        </div>
        <span className="text-xl font-bold text-gray-900">{value}</span>
      </div>
      
      {/* Benchmark comparison */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-600">
          <span>Acceptable</span>
          <span>Good</span>
          <span>Excellent</span>
        </div>
        <div className="relative h-2 bg-gray-200 rounded-full">
          <div 
            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ${
              getBenchmarkColor(value, benchmark)
            }`}
            style={{ width: `${Math.min(100, (value / benchmark.excellent) * 100)}%` }}
          ></div>
          {/* Benchmark markers */}
          <div 
            className="absolute top-0 w-0.5 h-full bg-gray-400"
            style={{ left: `${(benchmark.acceptable / benchmark.excellent) * 100}%` }}
          ></div>
          <div 
            className="absolute top-0 w-0.5 h-full bg-gray-400"
            style={{ left: `${(benchmark.good / benchmark.excellent) * 100}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 text-center">
          {value >= benchmark.excellent ? 'Exceeds industry standards' :
           value >= benchmark.good ? 'Meets professional standards' :
           value >= benchmark.acceptable ? 'Acceptable for most purposes' :
           'Below recommended standards'}
        </div>
      </div>
    </div>
  );

  const InsightCard: React.FC<{ insight: ActionableInsight }> = ({ insight }) => (
    <div className={`rounded-xl p-4 border-2 ${getPriorityColor(insight.priority)}`}>
      <div className="flex items-start space-x-3">
        <span className="text-xl flex-shrink-0">{getPriorityIcon(insight.priority)}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">{insight.category}</h4>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/50">
              {insight.impact}
            </span>
          </div>
          <p className="text-sm font-medium mb-2">{insight.issue}</p>
          <p className="text-sm opacity-90">{insight.action}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl">{getScoreIcon(writingScore.overall)}</span>
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold text-gray-900">Writing Analysis</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getDocumentTypeIcon(writingScore.documentType)}</span>
                  <span className="text-sm font-medium text-gray-600 capitalize">{writingScore.documentType}</span>
                </div>
              </div>
              <p className="text-gray-600">{writingScore.benchmarks.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Overall Score & Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="text-center">
              <div className={`inline-flex items-center space-x-4 px-6 py-4 rounded-2xl border-2 ${getScoreColorWithBackground(writingScore.overall)}`}>
                <span className="text-5xl font-bold">{writingScore.overall}</span>
                <div className="text-left">
                  <div className="text-xl font-bold capitalize">{writingScore.level}</div>
                  <div className="text-sm opacity-75">Overall Score</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-3xl">{getLevelIcon(writingScore.level)}</span>
                  <span className="text-lg font-semibold text-gray-700">Writing Level</span>
                </div>
                <p className="text-gray-600 text-sm max-w-xs">
                  Target Audience: <span className="font-medium">{writingScore.targetAudience}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Metrics with Benchmarks */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Performance vs Industry Standards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricComparison 
                label="Grammar & Mechanics" 
                value={writingScore.breakdown.grammar} 
                benchmark={writingScore.benchmarks.grammar}
                icon="📝"
              />
              <MetricComparison 
                label="Clarity & Flow" 
                value={writingScore.breakdown.clarity} 
                benchmark={writingScore.benchmarks.clarity}
                icon="💡"
              />
              <MetricComparison 
                label="Style & Flow" 
                value={writingScore.breakdown.style} 
                benchmark={writingScore.benchmarks.style}
                icon="✨"
              />
              <MetricComparison 
                label="Structure & Organization" 
                value={writingScore.breakdown.structure} 
                benchmark={writingScore.benchmarks.structure}
                icon="🏧"
              />
              <MetricComparison 
                label="Audience Engagement" 
                value={writingScore.breakdown.engagement} 
                benchmark={writingScore.benchmarks.engagement}
                icon="🎯"
              />
            </div>
          </div>

          {/* Actionable Insights */}
          {writingScore.insights && writingScore.insights.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Actionable Improvement Recommendations</h3>
              <div className="space-y-4">
                {writingScore.insights.map((insight, index) => (
                  <InsightCard key={index} insight={insight} />
                ))}
              </div>
            </div>
          )}

          {/* Tone Analysis */}
          {toneAnalysis && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🎭</span>
                </div>
                <h3 className="font-bold text-purple-900">Tone Analysis</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/50 rounded-xl p-3 text-center">
                  <div className="text-sm font-medium text-purple-700 mb-1">Formality</div>
                  <div className="font-bold text-purple-900 capitalize">{toneAnalysis.overall.formality.replace('_', ' ')}</div>
                </div>
                <div className="bg-white/50 rounded-xl p-3 text-center">
                  <div className="text-sm font-medium text-purple-700 mb-1">Sentiment</div>
                  <div className="font-bold text-purple-900 capitalize">{toneAnalysis.overall.sentiment.replace('_', ' ')}</div>
                </div>
                <div className="bg-white/50 rounded-xl p-3 text-center">
                  <div className="text-sm font-medium text-purple-700 mb-1">Emotion</div>
                  <div className="font-bold text-purple-900 capitalize">{toneAnalysis.overall.emotion}</div>
                </div>
                <div className="bg-white/50 rounded-xl p-3 text-center">
                  <div className="text-sm font-medium text-purple-700 mb-1">Consistency</div>
                  <div className="font-bold text-purple-900">
                    {toneAnalysis.consistency.toneVariation < 20 ? 'Excellent' :
                     toneAnalysis.consistency.toneVariation < 40 ? 'Good' : 'Variable'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg font-medium"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
};

export default WritingScoreModal;