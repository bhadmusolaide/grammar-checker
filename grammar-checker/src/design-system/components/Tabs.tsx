import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: string;
  count?: number;
}

interface TabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: Tab[];
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ 
  activeTab, 
  onTabChange, 
  tabs, 
  className = '' 
}) => {
  return (
    <div className={`flex space-x-1 bg-gray-50 p-1 rounded-xl ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${getCategoryStyle(tab.id, activeTab === tab.id)}`}
        >
          {tab.icon && <span>{tab.icon}</span>}
          <span>{tab.label}</span>
          {tab.count !== undefined && tab.count > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'}`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

// Helper function to get the appropriate style based on category type
const getCategoryStyle = (category: string, isActive: boolean): string => {
  const baseStyles = 'transition-all duration-200';
  const activeBase = `${baseStyles} font-semibold shadow-sm`;
  const inactiveBase = `${baseStyles} opacity-70 hover:opacity-90`;
  
  switch (category.toLowerCase()) {
    case 'grammar':
      return isActive 
        ? `${activeBase} bg-red-50 text-red-800 border border-red-200` 
        : `${inactiveBase} text-red-700 hover:bg-red-50/50`;
    case 'clarity':
      return isActive 
        ? `${activeBase} bg-yellow-50 text-yellow-800 border border-yellow-200` 
        : `${inactiveBase} text-yellow-700 hover:bg-yellow-50/50`;
    case 'style':
      return isActive 
        ? `${activeBase} bg-blue-50 text-blue-800 border border-blue-200` 
        : `${inactiveBase} text-blue-700 hover:bg-blue-50/50`;
    case 'enhancement':
      return isActive 
        ? `${activeBase} bg-purple-50 text-purple-800 border border-purple-200` 
        : `${inactiveBase} text-purple-700 hover:bg-purple-50/50`;
    default:
      return isActive 
        ? `${activeBase} bg-white text-gray-900 border border-gray-200` 
        : `${inactiveBase} text-gray-600 hover:bg-gray-100`;
  }
};

export default Tabs;