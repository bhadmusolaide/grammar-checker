import React, { memo } from 'react';
import HighlightedTextEditor from '../HighlightedTextEditor';
import { Suggestion } from '../../types';

interface TextEditorProps {
  text: string;
  onChange: (text: string) => void;
  suggestions: Suggestion[];
  isLoading: boolean;
  humanizedText?: string;
  showDiff?: boolean;
  onAcceptHumanized?: () => void;
  onRejectHumanized?: () => void;
}

const TextEditor: React.FC<TextEditorProps> = ({ 
  text, 
  onChange, 
  suggestions,

  humanizedText,
  showDiff,
  onAcceptHumanized,
  onRejectHumanized
}) => {
  return (
    <HighlightedTextEditor
      text={text}
      onTextChange={(newText) => onChange(newText)}
      suggestions={suggestions}
      placeholder="Start writing or paste your text here..."
      autoCheckEnabled={false}
      humanizedText={humanizedText}
      showDiff={showDiff}
      onAcceptHumanized={onAcceptHumanized}
      onRejectHumanized={onRejectHumanized}
    />
  );
};

// Custom comparison function for React.memo
const areEqual = (prevProps: TextEditorProps, nextProps: TextEditorProps) => {
  return (
    prevProps.text === nextProps.text &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.suggestions === nextProps.suggestions &&
    prevProps.onChange === nextProps.onChange
  );
};

export default memo(TextEditor, areEqual);