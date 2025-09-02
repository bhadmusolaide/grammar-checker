import React from 'react';

// Simple spinner component
export const Spinner: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <div className={`${className} border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin`}></div>
);

// Full page loading component
export const FullPageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="text-center">
      <div className="relative mb-6">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary-400 rounded-full animate-pulse mx-auto"></div>
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">Loading</h3>
      <p className="text-gray-600">Please wait while we prepare everything for you...</p>
    </div>
  </div>
);

// Card skeleton for suggestion cards
export const SuggestionCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-5 mb-4 border-2 border-gray-200 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-gray-200"></div>
          <div className="flex items-center space-x-2">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-12"></div>
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
        
        <div className="bg-gray-100 rounded-xl p-4 mb-4">
          <div className="h-3 bg-gray-200 rounded w-1/4 mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mb-4">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-6 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      
      <div className="ml-4 flex flex-col space-y-2">
        <div className="h-10 bg-gray-200 rounded-xl w-24"></div>
        <div className="h-10 bg-gray-200 rounded-xl w-24"></div>
      </div>
    </div>
  </div>
);

// Tab navigation skeleton
export const TabNavigationSkeleton: React.FC = () => (
  <div className="flex space-x-1 p-1 bg-gray-100 rounded-xl animate-pulse">
    {[1, 2, 3].map((item) => (
      <div key={item} className="flex-1 h-12 bg-gray-200 rounded-lg"></div>
    ))}
  </div>
);

// Text editor skeleton
export const TextEditorSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
    <div className="flex justify-between items-center mb-6">
      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
      <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
    </div>
    
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((line) => (
        <div 
          key={line} 
          className="h-4 bg-gray-200 rounded"
          style={{ width: `${Math.max(70, 100 - line * 10)}%` }}
        ></div>
      ))}
    </div>
    
    <div className="mt-8 flex justify-end">
      <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
    </div>
  </div>
);

// Dashboard skeleton
export const DashboardSkeleton: React.FC = () => (
  <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex flex-col">
    {/* Header skeleton */}
    <div className="pl-8 pr-8 py-6 border-b border-gray-200 bg-white/50">
      <div className="mb-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="h-5 bg-gray-200 rounded w-2/5"></div>
      </div>
      
      <TabNavigationSkeleton />
    </div>
    
    {/* Content skeleton */}
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <SuggestionCardSkeleton key={item} />
        ))}
      </div>
    </div>
  </div>
);