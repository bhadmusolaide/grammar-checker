import React, { memo, useState, useRef, useEffect } from 'react';

interface HumanizeOptions {
  tone: 'neutral' | 'friendly' | 'professional';
  strength: 'light' | 'medium' | 'strong';
}

export interface EditorToolbarProps {
  text: string; // Add this line
  onClear: () => void;
  onCheck: () => void;
  isLoading: boolean;

  // Auto-check
  autoCheckEnabled?: boolean;
  onAutoCheckToggle?: (enabled: boolean) => void;

  // Humanizer Props
  humanizeOptions?: HumanizeOptions;
  onHumanizeOptionsChange?: (options: HumanizeOptions) => void;
  onRequestHumanize?: () => void;
  isHumanizing?: boolean;
  canHumanize?: boolean;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onClear,
  onCheck,
  isLoading,
  text,
  autoCheckEnabled,
  onAutoCheckToggle,
  humanizeOptions,
  onHumanizeOptionsChange,
  onRequestHumanize,
  isHumanizing = false,
  canHumanize = true
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Close popover on outside click and on escape key
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!isPopoverOpen) return;
      
      // Don't close if clicking on the button or inside the popover
      if (buttonRef.current?.contains(e.target as Node)) return;
      if (popoverRef.current?.contains(e.target as Node)) return;
      
      // Close if clicking outside
      setIsPopoverOpen(false);
    };
    
    const onEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPopoverOpen) {
        setIsPopoverOpen(false);
      }
    };
    
    // Use capture phase to handle clicks before they reach the target
    document.addEventListener('mousedown', onDocClick, true);
    document.addEventListener('keydown', onEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', onDocClick, true);
      document.removeEventListener('keydown', onEscapeKey);
    };
  }, [isPopoverOpen]);

  const disableHumanize = isLoading || isHumanizing || !text.trim() || canHumanize === false;

  const updateOption = (key: keyof HumanizeOptions, value: HumanizeOptions[keyof HumanizeOptions]) => {
    if (!onHumanizeOptionsChange) return;
    const next: HumanizeOptions = {
      tone: humanizeOptions?.tone ?? 'neutral',
      strength: humanizeOptions?.strength ?? 'medium',
      [key]: value as any
    } as HumanizeOptions;
    onHumanizeOptionsChange(next);
  };

  const handleApply = () => {
    if (disableHumanize) return;
    if (onRequestHumanize) {
      onRequestHumanize();
    }
    setIsPopoverOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 relative">
      <div className="flex items-center space-x-2">
        {/* Auto-Check First */}
        <div className="flex items-center">
          <span className="text-sm text-gray-600 mr-2">Auto-check:</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={!!autoCheckEnabled}
              onChange={(e) => onAutoCheckToggle && onAutoCheckToggle(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-10 h-6 rounded-full transition-colors duration-200 ${
              autoCheckEnabled ? 'bg-blue-500' : 'bg-gray-300'
            }`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                autoCheckEnabled ? 'translate-x-5' : 'translate-x-1'
              } mt-1`}></div>
            </div>
          </label>
        </div>
        
        {/* Humanize Controls */}
        <div className="relative inline-block" style={{ zIndex: 999 }}>
          <button
            ref={buttonRef}
            onClick={(e) => {
              e.stopPropagation();
              setIsPopoverOpen((v) => !v);
            }}
            disabled={disableHumanize}
            className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 border shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${isPopoverOpen ? 'bg-white border-blue-300' : 'bg-white hover:bg-gray-50 border-gray-200'}`}
            title="Make the text sound less AI-like while preserving meaning"
          >
            {isHumanizing ? (
              <React.Fragment>
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Humanizing...</span>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Humanize</span>
                <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </React.Fragment>
            )}
          </button>

          {isPopoverOpen && (
            <div 
              ref={popoverRef}
              className="absolute mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl p-4"
              style={{ 
                zIndex: 9999,
                position: 'absolute',
                top: '100%',
                left: '0',
                width: '280px'
              }}
            >
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-gray-800">Humanize Settings</h4>
                <p className="text-xs text-gray-500 mt-1 whitespace-normal">Preserve meaning, reduce AI tone, minimal edits</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Tone</label>
                  <select
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    value={humanizeOptions?.tone ?? 'neutral'}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateOption('tone', e.target.value as HumanizeOptions['tone']);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    disabled={disableHumanize || !onHumanizeOptionsChange}
                  >
                    <option value="neutral">Neutral</option>
                    <option value="friendly">Friendly</option>
                    <option value="professional">Professional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Strength</label>
                  <select
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    value={humanizeOptions?.strength ?? 'medium'}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateOption('strength', e.target.value as HumanizeOptions['strength']);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    disabled={disableHumanize || !onHumanizeOptionsChange}
                  >
                    <option value="light">Light</option>
                    <option value="medium">Medium</option>
                    <option value="strong">Strong</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPopoverOpen(false);
                  }}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApply();
                  }}
                  disabled={disableHumanize || !onRequestHumanize}
                  className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Check Grammar */}
        <button
          onClick={onCheck}
          disabled={isLoading || !text.trim()}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading ? (
            <React.Fragment>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Checking...</span>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Check Grammar</span>
            </React.Fragment>
          )}
        </button>

        {/* Clear last */}
        <button
          onClick={onClear}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Clear</span>
        </button>
      </div>
      
      <div className="flex items-center space-x-3">
      </div>
    </div>
  );
};

// Custom comparison function for React.memo
const areEqual = (prevProps: EditorToolbarProps, nextProps: EditorToolbarProps) => {
  return (
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.text === nextProps.text &&
    prevProps.onClear === nextProps.onClear &&
    prevProps.onCheck === nextProps.onCheck &&
    prevProps.isHumanizing === nextProps.isHumanizing &&
    prevProps.canHumanize === nextProps.canHumanize &&
    prevProps.humanizeOptions?.tone === nextProps.humanizeOptions?.tone &&
    prevProps.humanizeOptions?.strength === nextProps.humanizeOptions?.strength
  );
};

export default memo(EditorToolbar, areEqual);