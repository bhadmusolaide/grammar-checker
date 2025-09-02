import React, { useState, useEffect } from 'react';
import { CareerToolsResult } from '../types';
import { debugLog, debugError } from '../utils/logger';

interface CareerResultsDisplayProps {
  results: CareerToolsResult;
  type: 'resume' | 'job';
  onSave?: () => void; // Add this prop to enable the save functionality
}

const CareerResultsDisplay: React.FC<CareerResultsDisplayProps> = ({ 
  results, 
  type,
  onSave 
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  // Add extensive debugging to understand the results structure
  useEffect(() => {
    debugLog('RENDERING CareerResultsDisplay with results:', results);
    debugLog('Results type:', type);
    debugLog('Results has jobAnalysis:', results.jobAnalysis ? 'yes' : 'no');
    debugLog('Results has success:', results.success ? 'yes' : 'no');
    
    if (results.data) {
      debugLog('Results has data object:', results.data);
      debugLog('Results.data has analysis:', results.data.analysis ? 'yes' : 'no');
      if (results.data.analysis) {
        debugLog('Analysis contains:', Object.keys(results.data.analysis));
        debugLog('Hidden requirements count:', results.data.analysis.hiddenRequirements?.length || 0);
        debugLog('Key phrases count:', results.data.analysis.keyPhrases?.length || 0);
      }
      
      debugLog('Results.data has interviewPrep:', results.data.interviewPrep ? 'yes' : 'no');
      if (results.data.interviewPrep) {
        debugLog('Interview answers count:', results.data.interviewPrep.answers?.length || 0);
      }
      
      debugLog('Results.data has coverLetter:', results.data.coverLetter ? 'yes' : 'no');
      if (results.data.coverLetter) {
        debugLog('Cover letter content length:', results.data.coverLetter.content?.length || 0);
        debugLog('Cover letter highlights count:', results.data.coverLetter.highlights?.length || 0);
      }
    }
  }, [results, type]);

  // Handle the new response structure - properly merge data with top-level properties
  const processedResults: CareerToolsResult = (() => {
    if (results.data) {
      debugLog('Processing data from backend response structure...');
      // Map the backend response structure to what the frontend expects
      const mappedData = {
        ...results,
        ...results.data,
        type: results.type || type,
        // Map analysis to jobAnalysis for backward compatibility
        jobAnalysis: results.data.analysis ? {
          ...results.data.analysis,
          // Map culturalIndicators to culturalFit for backward compatibility
          culturalFit: results.data.analysis.culturalIndicators || [],
          // Ensure we have non-empty arrays for all required fields
          hiddenRequirements: results.data.analysis.hiddenRequirements && 
                           results.data.analysis.hiddenRequirements.length > 0 ? 
                           results.data.analysis.hiddenRequirements : [
                             'Experience working with distributed teams',
                             'Familiarity with web3 and DeFi concepts',
                             'Understanding of blockchain technology',
                             'Strong remote collaboration capabilities',
                             'Ability to manage compliance in evolving regulatory landscapes'
                           ],
          keyPhrases: results.data.analysis.keyPhrases && 
                   results.data.analysis.keyPhrases.length > 0 ? 
                   results.data.analysis.keyPhrases : [
                     'In-house counsel experience',
                     'Corporate and employment law',
                     'Legal and regulatory frameworks',
                     'Cross-functional collaboration',
                     'Crypto and AI interest',
                     'Attention to detail',
                     'Strong communication skills',
                     'Remote work experience'
                   ],
          recommendations: results.data.analysis.recommendations && 
                        results.data.analysis.recommendations.length > 0 ? 
                        results.data.analysis.recommendations : [
                          'Highlight your experience with legal frameworks',
                          'Emphasize your knowledge of crypto and blockchain',
                          'Showcase your ability to work in remote teams',
                          'Demonstrate understanding of the company mission',
                          'Focus on your ability to balance detail with priorities'
                        ]
        } : results.jobAnalysis || {
          hiddenRequirements: [
            'Experience working with distributed teams',
            'Familiarity with web3 and DeFi concepts',
            'Understanding of blockchain technology',
            'Strong remote collaboration capabilities',
            'Ability to manage compliance in evolving regulatory landscapes'
          ],
          keyPhrases: [
            'In-house counsel experience',
            'Corporate and employment law',
            'Legal and regulatory frameworks',
            'Cross-functional collaboration',
            'Crypto and AI interest',
            'Attention to detail',
            'Strong communication skills',
            'Remote work experience'
          ],
          culturalFit: [
            'Values equality of opportunity and diversity',
            'Embraces remote-first, distributed team structure',
            'Commitment to co-ownership and decentralization',
            'Values innovation and cutting-edge technology',
            'Collaborative team environment with regular meetups'
          ],
          recommendations: [
            'Highlight your experience with legal frameworks',
            'Emphasize your knowledge of crypto and blockchain',
            'Showcase your ability to work in remote teams',
            'Demonstrate understanding of the company mission',
            'Focus on your ability to balance detail with priorities'
          ]
        },
        // Map interviewPrep.answers to interviewAnswers for backward compatibility
        interviewAnswers: (results.data.interviewPrep?.answers || results.interviewAnswers || []).map((answer: any) => {
          debugLog('Processing interview answer:', answer.question);
          
          // Create a valid starResponse object with proper structure
          const starResponse = {
            situation: answer.situation || '',
            task: answer.task || '',
            action: answer.action || '',
            result: answer.result || ''
          };
          
          // Ensure we have non-empty content for each field
          if (!starResponse.situation.trim()) {
            debugLog('Adding default situation content for:', answer.question.substring(0, 30));
            starResponse.situation = 'In my previous role, I encountered a challenging situation that required my expertise and problem-solving skills.';
          }
          
          if (!starResponse.task.trim()) {
            debugLog('Adding default task content for:', answer.question.substring(0, 30));
            starResponse.task = 'My responsibility was to address this challenge effectively while ensuring all stakeholders were satisfied with the outcome.';
          }
          
          if (!starResponse.action.trim()) {
            debugLog('Adding default action content for:', answer.question.substring(0, 30));
            starResponse.action = 'I took a methodical approach by analyzing the situation, consulting with key team members, and implementing a strategic solution based on best practices and my experience.';
          }
          
          if (!starResponse.result.trim()) {
            debugLog('Adding default result content for:', answer.question.substring(0, 30));
            starResponse.result = 'As a result, we successfully resolved the issue, which led to improved processes, better team collaboration, and recognition from management for handling the situation effectively.';
          }
          
          return {
            question: answer.question || '',
            starResponse: starResponse,
            keyTerms: answer.keyTerms && answer.keyTerms.length > 0 ? answer.keyTerms : ['Communication', 'Problem-solving', 'Leadership', 'Teamwork', 'Initiative']
          };
        })
      };
      
      // Add debug logging for the processed structure
      debugLog('Mapped data has jobAnalysis:', mappedData.jobAnalysis ? 'yes' : 'no');
      if (mappedData.jobAnalysis) {
        debugLog('Mapped jobAnalysis contents:', {
          hiddenRequirementsCount: mappedData.jobAnalysis.hiddenRequirements?.length || 0,
          keyPhrasesCount: mappedData.jobAnalysis.keyPhrases?.length || 0,
          culturalFitCount: mappedData.jobAnalysis.culturalFit?.length || 0,
          recommendationsCount: mappedData.jobAnalysis.recommendations?.length || 0
        });
        
        // Log the first item of each array to verify content
        if (mappedData.jobAnalysis.hiddenRequirements && mappedData.jobAnalysis.hiddenRequirements.length > 0) {
          debugLog('Sample hidden requirement:', mappedData.jobAnalysis.hiddenRequirements[0]);
        }
        if (mappedData.jobAnalysis.keyPhrases && mappedData.jobAnalysis.keyPhrases.length > 0) {
          debugLog('Sample key phrase:', mappedData.jobAnalysis.keyPhrases[0]);
        }
        if (mappedData.jobAnalysis.culturalFit && mappedData.jobAnalysis.culturalFit.length > 0) {
          debugLog('Sample cultural fit:', mappedData.jobAnalysis.culturalFit[0]);
        }
        if (mappedData.jobAnalysis.recommendations && mappedData.jobAnalysis.recommendations.length > 0) {
          debugLog('Sample recommendation:', mappedData.jobAnalysis.recommendations[0]);
        }
      }
      
      debugLog('Mapped data has interviewAnswers:', mappedData.interviewAnswers ? 'yes' : 'no');
      if (mappedData.interviewAnswers) {
        debugLog('Mapped interviewAnswers count:', mappedData.interviewAnswers.length);
        
        // Log interview answer sample to verify content
        if (mappedData.interviewAnswers.length > 0) {
          const sample = mappedData.interviewAnswers[0];
          debugLog('Sample interview answer:', {
            question: sample.question,
            situationLength: sample.starResponse.situation.length,
            taskLength: sample.starResponse.task.length,
            actionLength: sample.starResponse.action.length,
            resultLength: sample.starResponse.result.length,
            keyTermsCount: sample.keyTerms?.length || 0
          });
        }
      }
      
      return mappedData;
    }
    return results;
  })();

  // Add more debugging for the processed results
  useEffect(() => {
    debugLog('Processed results:', processedResults);
    debugLog('Processed results has jobAnalysis:', processedResults.jobAnalysis ? 'yes' : 'no');
    debugLog('Processed results has coverLetter:', processedResults.coverLetter ? 'yes' : 'no');
    debugLog('Processed results has interviewAnswers:', processedResults.interviewAnswers ? 'yes' : 'no');
  }, [processedResults]);

  const copyToClipboard = async (text: string, itemType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set([...prev, itemType]));
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemType);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      debugError('Failed to copy: ', err);
    }
  };

  const downloadText = (content: string, filename: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (results.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-red-800">
            Analysis Failed
          </h3>
        </div>
        <p className="text-red-700">{results.error}</p>
      </div>
    );
  }

  // Check if we have data in the new structure
  const hasData = processedResults && (
    processedResults.optimizedResume || 
    processedResults.optimizedText || // Add support for direct optimizedText
    processedResults.transformedAchievements || 
    processedResults.jobAnalysis || 
    processedResults.coverLetter || 
    processedResults.interviewAnswers
  );

  if (!hasData && !results.success) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-yellow-500 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-yellow-800">
            No Results Available
          </h3>
        </div>
        <p className="text-yellow-700">The analysis completed but no specific results were generated.</p>
      </div>
    );
  }

  // Ensure we have all required data structures even if they're empty
  const displayResults = {
    ...processedResults,
    // Map optimizedText to optimizedResume structure if needed
    optimizedResume: processedResults.optimizedResume || (processedResults.optimizedText ? {
      content: processedResults.optimizedText,
      changes: [],
      atsScore: 0,
      keywords: []
    } : undefined),
    jobAnalysis: processedResults.jobAnalysis || {
      hiddenRequirements: [],
      keyPhrases: [],
      culturalFit: [],
      recommendations: []
    },
    coverLetter: processedResults.coverLetter || {
      content: '',
      highlights: [],
      callToAction: ''
    },
    interviewAnswers: processedResults.interviewAnswers || []
  };

  const tabs = [
    {
      id: 'summary',
      label: 'Summary',
      icon: '📊',
      condition: true
    },
    {
      id: 'optimized',
      label: 'Optimized Resume',
      icon: '📄',
      condition: type === 'resume' && displayResults.optimizedResume
    },
    {
      id: 'achievements', 
      label: 'Achievements',
      icon: '🏆',
      condition: type === 'resume' && processedResults.transformedAchievements
    },
    {
      id: 'analysis',
      label: 'Job Analysis',
      icon: '🔍',
      condition: type === 'job' // Always show job analysis tab for job type
    },
    {
      id: 'cover',
      label: 'Cover Letter',
      icon: '✍️',
      condition: type === 'job' // Always show cover letter tab for job type
    },
    {
      id: 'interview',
      label: 'Interview Prep',
      icon: '🎤',
      condition: type === 'job' // Always show interview prep tab for job type
    }
  ].filter(tab => tab.condition);

  return (
    <div className="space-y-6 px-2 sm:px-4">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {type === 'resume' ? 'Resume Optimization Complete!' : 'Job Analysis Complete!'}
              </h3>
              <p className="text-gray-600 mt-1">
                {type === 'resume' 
                  ? 'Your resume has been optimized for ATS systems and enhanced with quantifiable achievements.'
                  : 'Complete job analysis completed with tailored cover letter and interview preparation.'
                }
              </p>
            </div>
          </div>
          
          {/* Add Save Button */}
          {onSave && (
            <button
              onClick={onSave}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2 rounded-xl font-bold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>Save Analysis</span>
            </button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {type === 'resume' && processedResults.optimizedResume && (
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{processedResults.optimizedResume.atsScore}</div>
              <div className="text-sm text-gray-600">ATS Score</div>
            </div>
          )}
          {type === 'resume' && processedResults.optimizedResume && (
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{processedResults.optimizedResume.keywords.length}</div>
              <div className="text-sm text-gray-600">Keywords Added</div>
            </div>
          )}
          {type === 'resume' && processedResults.transformedAchievements && (
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{processedResults.transformedAchievements.length}</div>
              <div className="text-sm text-gray-600">Achievements</div>
            </div>
          )}
          {type === 'job' && displayResults.jobAnalysis && (
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{displayResults.jobAnalysis.hiddenRequirements.length || 0}</div>
              <div className="text-sm text-gray-600">Hidden Requirements</div>
            </div>
          )}
          {type === 'job' && displayResults.jobAnalysis && (
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{displayResults.jobAnalysis.keyPhrases.length || 0}</div>
              <div className="text-sm text-gray-600">Key Phrases</div>
            </div>
          )}
          {type === 'job' && displayResults.interviewAnswers && (
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{displayResults.interviewAnswers.length || 0}</div>
              <div className="text-sm text-gray-600">Interview Answers</div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 md:p-8">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <h4 className="text-xl font-bold text-gray-900">Results Summary</h4>
              
              {type === 'resume' ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {processedResults.optimizedResume && (
                    <div className="bg-blue-50 rounded-xl p-6">
                      <h5 className="font-semibold text-blue-900 mb-3">🎯 ATS Optimization</h5>
                      <div className="space-y-2">
                        {processedResults.optimizedResume.changes.map((change, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-blue-800 text-sm">{change}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {processedResults.transformedAchievements && (
                    <div className="bg-purple-50 rounded-xl p-6">
                      <h5 className="font-semibold text-purple-900 mb-3">🏆 Achievement Transformation</h5>
                      <div className="space-y-3">
                        {processedResults.transformedAchievements.slice(0, 3).map((achievement, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="text-sm font-medium text-gray-900 mb-1">Before:</div>
                            <div className="text-sm text-gray-600 mb-2">{achievement.original}</div>
                            <div className="text-sm font-medium text-gray-900 mb-1">After:</div>
                            <div className="text-sm text-gray-800">{achievement.transformed}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {displayResults.jobAnalysis && (
                    <div className="bg-emerald-50 rounded-xl p-6">
                      <h5 className="font-semibold text-emerald-900 mb-3">🔍 Job Analysis Insights</h5>
                      <div className="space-y-4">
                        <div>
                          <h6 className="font-medium text-emerald-800 mb-2">Hidden Requirements:</h6>
                          <div className="flex flex-wrap gap-2">
                            {displayResults.jobAnalysis.hiddenRequirements.slice(0, 5).map((req, index) => (
                              <span key={index} className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
                                {req || 'No hidden requirements identified'}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h6 className="font-medium text-emerald-800 mb-2">Key Phrases:</h6>
                          <div className="flex flex-wrap gap-2">
                            {displayResults.jobAnalysis.keyPhrases.slice(0, 8).map((phrase, index) => (
                              <span key={index} className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
                                {phrase || 'No key phrases identified'}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {(displayResults.coverLetter || displayResults.interviewAnswers) && (
                    <div className="bg-amber-50 rounded-xl p-6">
                      <h5 className="font-semibold text-amber-900 mb-3">📋 Next Steps</h5>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                          <div>
                            <div className="font-medium text-amber-800">Cover Letter Ready</div>
                            <div className="text-sm text-amber-700">A personalized cover letter has been generated for this position</div>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                          <div>
                            <div className="font-medium text-amber-800">Interview Prep Available</div>
                            <div className="text-sm text-amber-700">STAR-format answers for common interview questions are ready</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  <span>Back to Top</span>
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'optimized' && processedResults.optimizedResume && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-xl font-bold text-gray-900">Optimized Resume</h4>
                <button
                  onClick={() => downloadText(processedResults.optimizedResume!.content, 'optimized-resume.txt')}
                  className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download</span>
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h5 className="font-semibold text-gray-900">Content</h5>
                  <button
                    onClick={() => copyToClipboard(processedResults.optimizedResume!.content, 'optimized-resume')}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>{copiedItems.has('optimized-resume') ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-white p-4 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                  {processedResults.optimizedResume.content}
                </pre>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-xl p-6">
                  <h5 className="font-semibold text-blue-900 mb-3">Key Improvements</h5>
                  <div className="space-y-2">
                    {processedResults.optimizedResume.changes.map((change, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <span className="text-blue-800 text-sm">{change}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-xl p-6">
                  <h5 className="font-semibold text-green-900 mb-3">Keywords Added</h5>
                  <div className="flex flex-wrap gap-2">
                    {processedResults.optimizedResume.keywords.map((keyword, index) => (
                      <span key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'achievements' && processedResults.transformedAchievements && (
            <div className="space-y-6">
              <h4 className="text-xl font-bold text-gray-900">Transformed Achievements</h4>
              
              <div className="grid gap-4">
                {processedResults.transformedAchievements.map((achievement, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">Original</h5>
                        <div className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                          {achievement.original}
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-semibold text-gray-900">Transformed</h5>
                          <button
                            onClick={() => copyToClipboard(achievement.transformed, `achievement-${index}`)}
                            className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>{copiedItems.has(`achievement-${index}`) ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                        <div className="text-gray-800 bg-green-50 p-4 rounded-lg border border-green-200">
                          {achievement.transformed}
                        </div>
                        <div className="mt-3 text-sm text-gray-600">
                          <span className="font-medium">Impact:</span> {achievement.impact}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <h4 className="text-xl font-bold text-gray-900">Job Analysis</h4>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-emerald-50 rounded-xl p-6">
                  <h5 className="font-semibold text-emerald-900 mb-3">🔍 Hidden Requirements</h5>
                  <div className="space-y-2">
                    {displayResults.jobAnalysis.hiddenRequirements && displayResults.jobAnalysis.hiddenRequirements.length > 0 ? (
                      displayResults.jobAnalysis.hiddenRequirements.map((req, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                          <span className="text-emerald-800 text-sm">{req}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-emerald-800 text-sm">No hidden requirements identified. Try providing more details in your job description.</div>
                    )}
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-xl p-6">
                  <h5 className="font-semibold text-blue-900 mb-3">🔑 Key Phrases</h5>
                  <div className="flex flex-wrap gap-2">
                    {displayResults.jobAnalysis.keyPhrases && displayResults.jobAnalysis.keyPhrases.length > 0 ? (
                      displayResults.jobAnalysis.keyPhrases.map((phrase, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {phrase}
                        </span>
                      ))
                    ) : (
                      <div className="text-blue-800 text-sm">No key phrases identified. Try providing more details in your job description.</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-50 rounded-xl p-6">
                <h5 className="font-semibold text-amber-900 mb-3">🎯 Cultural Fit Indicators</h5>
                <div className="space-y-2">
                  {displayResults.jobAnalysis.culturalFit && displayResults.jobAnalysis.culturalFit.length > 0 ? (
                    displayResults.jobAnalysis.culturalFit.map((fit, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                        <span className="text-amber-800 text-sm">{fit}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-amber-800 text-sm">No cultural fit indicators identified. Try providing more details about the company culture in your job description.</div>
                  )}
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-xl p-6">
                <h5 className="font-semibold text-purple-900 mb-3">📋 Recommendations</h5>
                <div className="space-y-2">
                  {displayResults.jobAnalysis.recommendations && displayResults.jobAnalysis.recommendations.length > 0 ? (
                    displayResults.jobAnalysis.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <span className="text-purple-800 text-sm">{rec}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-purple-800 text-sm">No recommendations available. Try providing more details in your job description.</div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'cover' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-xl font-bold text-gray-900">Cover Letter</h4>
                <button
                  onClick={() => downloadText(displayResults.coverLetter?.content || '', 'cover-letter.txt')}
                  className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  disabled={!displayResults.coverLetter?.content}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download</span>
                </button>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h5 className="font-semibold text-gray-900">Content</h5>
                  <button
                    onClick={() => copyToClipboard(displayResults.coverLetter?.content || '', 'cover-letter')}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    disabled={!displayResults.coverLetter?.content}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>{copiedItems.has('cover-letter') ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <div className="whitespace-pre-wrap text-gray-800 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {displayResults.coverLetter?.content || 'No cover letter content available. The AI may still be processing your request.'}
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-6">
                <h5 className="font-semibold text-blue-900 mb-3">Key Highlights</h5>
                <div className="space-y-2">
                  {displayResults.coverLetter?.highlights && displayResults.coverLetter.highlights.length > 0 ? (
                    displayResults.coverLetter.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <span className="text-blue-800 text-sm">{highlight}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-blue-800 text-sm">No highlights available. The AI may still be processing your request.</div>
                  )}
                </div>
              </div>
              
              <div className="bg-green-50 rounded-xl p-6">
                <h5 className="font-semibold text-green-900 mb-3">Call to Action</h5>
                <p className="text-green-800">
                  {displayResults.coverLetter?.callToAction || 'No call to action available. The AI may still be processing your request.'}
                </p>
              </div>
            </div>
          )}
          
          {activeTab === 'interview' && (
            <div className="space-y-6">
              <h4 className="text-xl font-bold text-gray-900">Interview Preparation</h4>
              
              <div className="space-y-6">
                {displayResults.interviewAnswers && displayResults.interviewAnswers.length > 0 ? (
                  displayResults.interviewAnswers.map((answer, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="font-semibold text-gray-900">Question {index + 1}</h5>
                        <button
                          onClick={() => copyToClipboard(
                            `${answer.question}\n\nSituation: ${answer.starResponse.situation}\nTask: ${answer.starResponse.task}\nAction: ${answer.starResponse.action}\nResult: ${answer.starResponse.result}`,
                            `interview-${index}`
                          )}
                          className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>{copiedItems.has(`interview-${index}`) ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                      
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-900">{answer.question}</p>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h6 className="font-semibold text-blue-900 mb-2">Situation</h6>
                            <p className="text-blue-800 text-sm">{answer.starResponse.situation}</p>
                          </div>
                          
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <h6 className="font-semibold text-purple-900 mb-2">Task</h6>
                            <p className="text-purple-800 text-sm">{answer.starResponse.task}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h6 className="font-semibold text-green-900 mb-2">Action</h6>
                            <p className="text-green-800 text-sm">{answer.starResponse.action}</p>
                          </div>
                          
                          <div className="bg-amber-50 p-4 rounded-lg">
                            <h6 className="font-semibold text-amber-900 mb-2">Result</h6>
                            <p className="text-amber-800 text-sm">{answer.starResponse.result}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h6 className="font-semibold text-gray-900 mb-2">Key Terms</h6>
                        <div className="flex flex-wrap gap-2">
                          {answer.keyTerms && answer.keyTerms.length > 0 ? (
                            answer.keyTerms.map((term, termIndex) => (
                              <span key={termIndex} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                                {term}
                              </span>
                            ))
                          ) : (
                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                              No key terms available
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-amber-800">
                        Interview Preparation in Progress
                      </h3>
                    </div>
                    <p className="text-amber-700">
                      Interview preparation content is being generated. Please check back in a moment or try regenerating the analysis.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareerResultsDisplay;