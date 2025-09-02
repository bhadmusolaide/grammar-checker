import React from 'react';
import { WritingScore as WritingScoreType, ToneAnalysis } from '../types';
import { getScoreColor, getScoreTextColor, getLevelIcon, getAudienceIcon } from '../utils/scoreUtils';

interface WritingScoreProps {
  writingScore: WritingScoreType;
  toneAnalysis?: ToneAnalysis;
  className?: string;
}

const WritingScore: React.FC<WritingScoreProps> = ({ writingScore, toneAnalysis, className = '' }) => {


  const CircularProgress: React.FC<{ value: number; size?: number; strokeWidth?: number; color: string }> = ({ 
    value, size = 80, strokeWidth = 8, color 
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    // Extract gradient colors for stroke
    const getStrokeColor = (colorClass: string) => {
      if (colorClass.includes('emerald')) return '#059669';
      if (colorClass.includes('blue')) return '#3b82f6';
      if (colorClass.includes('yellow')) return '#eab308';
      if (colorClass.includes('red')) return '#ef4444';
      return '#6b7280';
    };

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getStrokeColor(color)}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${getScoreTextColor(value)}`}>
            {value}
          </span>
        </div>
      </div>
    );
  };

  const MetricBar: React.FC<{ label: string; value: number; icon: string }> = ({ label, value, icon }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className={`text-sm font-bold ${getScoreTextColor(value)}`}>{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full bg-gradient-to-r ${getScoreColor(value)} transition-all duration-1000 ease-out`}
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Writing Score</h3>
          <p className="text-sm text-gray-600">AI-powered analysis of your writing quality</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl mb-1">{getLevelIcon(writingScore.level)}</div>
            <div className="text-xs font-medium text-gray-600 capitalize">{writingScore.level}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">{getAudienceIcon(writingScore.targetAudience)}</div>
            <div className="text-xs font-medium text-gray-600 capitalize">{writingScore.targetAudience}</div>
          </div>
        </div>
      </div>

      {/* Overall Score */}
      <div className="flex items-center justify-center mb-8">
        <div className="text-center">
          <CircularProgress 
            value={writingScore.overall} 
            size={120} 
            strokeWidth={10}
            color={getScoreColor(writingScore.overall)}
          />
          <div className="mt-3">
            <div className="text-lg font-bold text-gray-900">Overall Score</div>
            <div className={`text-sm font-medium ${getScoreTextColor(writingScore.overall)}`}>
              {writingScore.overall >= 90 ? 'Excellent' :
               writingScore.overall >= 75 ? 'Good' :
               writingScore.overall >= 60 ? 'Fair' : 'Needs Improvement'}
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Metrics */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Detailed Breakdown</h4>
        
        <MetricBar 
          label="Grammar" 
          value={writingScore.breakdown.grammar} 
          icon="📝" 
        />
        
        <MetricBar 
          label="Clarity" 
          value={writingScore.breakdown.clarity} 
          icon="💡" 
        />
        
        <MetricBar 
          label="Style" 
          value={writingScore.breakdown.style} 
          icon="✨" 
        />
        
        <MetricBar 
          label="Structure" 
          value={writingScore.breakdown.structure} 
          icon="🏧" 
        />
        
        <MetricBar 
          label="Engagement" 
          value={writingScore.breakdown.engagement} 
          icon="🚀" 
        />
      </div>

      {/* Tone Analysis Summary */}
      {toneAnalysis && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Tone Analysis</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Formality</span>
                <span className="text-sm font-bold text-gray-900 capitalize">
                  {toneAnalysis.overall.formality.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Sentiment</span>
                <span className="text-sm font-bold text-gray-900 capitalize">
                  {toneAnalysis.overall.sentiment.replace('_', ' ')}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Emotion</span>
                <span className="text-sm font-bold text-gray-900 capitalize">
                  {toneAnalysis.overall.emotion}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Politeness</span>
                <span className="text-sm font-bold text-gray-900 capitalize">
                  {toneAnalysis.overall.politeness.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Consistency Indicator */}
          <div className="mt-4 p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Tone Consistency</span>
              <span className={`text-sm font-bold ${
                toneAnalysis.consistency.toneVariation < 20 ? 'text-green-600' :
                toneAnalysis.consistency.toneVariation < 40 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {toneAnalysis.consistency.toneVariation < 20 ? 'Excellent' :
                 toneAnalysis.consistency.toneVariation < 40 ? 'Good' : 'Inconsistent'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingScore;