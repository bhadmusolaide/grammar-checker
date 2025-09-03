import React, { useState, useRef } from 'react';

interface SimpleTextEditorProps {
  text: string;
  onTextChange: (text: string) => void;
  placeholder?: string;
  className?: string;
}

const SimpleTextEditor: React.FC<SimpleTextEditorProps> = ({ 
  text, 
  onTextChange, 
  placeholder = 'Start writing or paste your text here...',
  className = ''
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Handle paste events with text sanitization
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    
    // Get pasted text and sanitize it
    const pastedText = e.clipboardData.getData('text/plain')
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces and other invisible characters
      .replace(/\r\n/g, '\n'); // Normalize line endings
    
    // Insert sanitized text at cursor position
    const cursorPos = e.currentTarget.selectionStart;
    const textBefore = e.currentTarget.value.substring(0, cursorPos);
    const textAfter = e.currentTarget.value.substring(cursorPos);
    
    const newText = textBefore + pastedText + textAfter;
    onTextChange(newText);
    
    // Set cursor position after pasted text
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = cursorPos + pastedText.length;
        textareaRef.current.selectionEnd = cursorPos + pastedText.length;
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Handle keyboard input
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTextChange(e.target.value);
  };

  return (
    <div className={`relative h-full w-full ${className}`}>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onPaste={handlePaste}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full h-full resize-none border ${
          isFocused 
            ? 'border-orange-500 ring-2 ring-orange-100' 
            : 'border-gray-300 hover:border-gray-400'
        } rounded-xl p-4 text-base leading-relaxed focus:outline-none transition-all duration-200 placeholder-gray-400 font-sans text-gray-900`}
        style={{
          minHeight: '300px',
        }}
      />
      
      {/* Empty State Overlay */}
      {!text && !isFocused && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="text-center max-w-xs">
            <div className="text-3xl mb-2 opacity-20">✍️</div>
            <p className="text-gray-400 text-base font-medium">Start writing your masterpiece</p>
            <p className="text-gray-300 text-sm mt-1">Write or paste your text to begin humanizing</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleTextEditor;