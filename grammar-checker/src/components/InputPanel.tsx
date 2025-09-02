import React from 'react';
import HighlightedTextEditor from './HighlightedTextEditor';
import EditorToolbar from './editor/EditorToolbar';
import { InputPanelProps } from '../types';

const InputPanel: React.FC<InputPanelProps> = ({
  text,
  onTextChange,
  onClear,
  onCheck,
  isLoading,
  autoCheckEnabled,
  onAutoCheckToggle,
  suggestions,

  humanizeOptions,
  onHumanizeOptionsChange,
  onRequestHumanize,
  isHumanizing,
  canHumanize,
  onAcceptHumanized,
  onRejectHumanized
}) => {

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-6 pt-2 pb-3 relative z-0">
        <EditorToolbar
          text={text}
          onClear={onClear}
          onCheck={onCheck}
          isLoading={isLoading}
          autoCheckEnabled={autoCheckEnabled}
          onAutoCheckToggle={onAutoCheckToggle}
          humanizeOptions={humanizeOptions}
          onHumanizeOptionsChange={onHumanizeOptionsChange}
          onRequestHumanize={onRequestHumanize}
          isHumanizing={isHumanizing}
          canHumanize={canHumanize}
        />
      </div>
      
      <div className="flex-1 px-6 pt-2 pb-6">
        <HighlightedTextEditor
          text={text}
          onTextChange={onTextChange}
          suggestions={suggestions || []}
          placeholder="Start writing or paste your text here..."
          autoCheckEnabled={false}
          humanizedText={humanizeOptions?.humanizedText}
          showDiff={humanizeOptions?.showDiff}
          onAcceptHumanized={onAcceptHumanized}
          onRejectHumanized={onRejectHumanized}
        />
      </div>
    </div>
  );
};

export default InputPanel;