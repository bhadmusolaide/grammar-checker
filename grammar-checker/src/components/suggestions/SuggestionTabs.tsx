import React, { memo } from 'react';

interface SuggestionTabsProps {
  activeTab: 'grammar' | 'clarity' | 'enhancement';
  onTabChange: (tab: 'grammar' | 'clarity' | 'enhancement') => void;
  tabs: {
    id: 'grammar' | 'clarity' | 'enhancement';
    label: string;
    icon: string;
    count: number;
  }[];
}

const SuggestionTabs: React.FC<SuggestionTabsProps> = ({
  activeTab,
  onTabChange,
  tabs
}) => {
  return (
    <div className="flex space-x-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
            activeTab === tab.id
              ? 'bg-white text-primary-600 shadow-md border border-primary-200'
              : 'bg-transparent text-gray-600 hover:bg-white/50 hover:text-gray-800'
          }`}
        >
          <span className="text-lg">{tab.icon}</span>
          <span>{tab.label}</span>
          {tab.count > 0 && (
            <span className={`text-xs px-2 py-1 rounded-full font-bold ${
              activeTab === tab.id
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-200 text-gray-700'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

// Custom comparison function for React.memo
const areEqual = (prevProps: SuggestionTabsProps, nextProps: SuggestionTabsProps) => {
  return (
    prevProps.activeTab === nextProps.activeTab &&
    prevProps.tabs === nextProps.tabs &&
    prevProps.onTabChange === nextProps.onTabChange
  );
};

export default memo(SuggestionTabs, areEqual);