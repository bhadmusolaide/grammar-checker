import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';

interface SwipeableTabNavigationProps {
  activeTab: 'input' | 'suggestions';
  onTabChange: (tab: 'input' | 'suggestions') => void;
  suggestionCount: number;
}

const SwipeableTabNavigation: React.FC<SwipeableTabNavigationProps> = ({
  activeTab,
  onTabChange,
  suggestionCount
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handlers = useSwipeable({
    onSwipeStart: () => setIsDragging(true),
    onSwiped: (eventData) => {
      setIsDragging(false);
      if (eventData.dir === 'Left' && activeTab === 'input') {
        onTabChange('suggestions');
      } else if (eventData.dir === 'Right' && activeTab === 'suggestions') {
        onTabChange('input');
      }
    },
    trackMouse: true,
  });

  const handleTabPress = (tab: 'input' | 'suggestions') => {
    if (!isDragging) {
      onTabChange(tab);
    }
  };

  return (
    <div className="md:hidden">
      {/* Tab Navigation */}
      <div {...handlers} className="bg-white border-b border-gray-200/60">
        <div className="flex px-4 py-2">
          <div className="flex-1 flex">
            {/* Write Tab */}
            <motion.button
              onClick={() => handleTabPress('input')}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg transition-all ${
                activeTab === 'input'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex flex-col items-center space-y-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-xs">Write</span>
              </div>
            </motion.button>

            {/* Suggestions Tab */}
            <motion.button
              onClick={() => handleTabPress('suggestions')}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg transition-all relative ${
                activeTab === 'suggestions'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex flex-col items-center space-y-1">
                <div className="relative">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {suggestionCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full"
                    >
                      {suggestionCount > 99 ? '99+' : suggestionCount}
                    </motion.span>
                  )}
                </div>
                <span className="text-xs">Fixes</span>
              </div>
            </motion.button>
          </div>
        </div>

        {/* Swipe hint */}
        <div className="flex justify-center pb-2">
          <motion.div
            className="text-xs text-gray-400 flex items-center space-x-1"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            <span>Swipe to switch</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SwipeableTabNavigation;