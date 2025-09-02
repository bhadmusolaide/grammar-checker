import React, { useState } from 'react';
import { diffWords, diffChars } from 'diff';

interface DiffViewProps {
  originalText: string;
  newText: string;
  className?: string;
}

const DiffView: React.FC<DiffViewProps> = ({ originalText, newText, className = '' }) => {
  const [diffMode, setDiffMode] = useState<'word' | 'character'>('word');
  
  // Generate the diff between original and new text based on selected mode
  const differences = diffMode === 'word' 
    ? diffWords(originalText, newText)
    : diffChars(originalText, newText);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(newText)
      .then(() => {
        // Show a brief visual feedback when copied
        const copyButton = document.getElementById('diff-copy-button');
        if (copyButton) {
          copyButton.innerText = 'Copied!';
          copyButton.classList.replace('bg-blue-100', 'bg-green-100');
          copyButton.classList.replace('text-blue-800', 'text-green-800');
          
          setTimeout(() => {
            copyButton.innerText = 'Copy Result';
            copyButton.classList.replace('bg-green-100', 'bg-blue-100');
            copyButton.classList.replace('text-green-800', 'text-blue-800');
          }, 2000);
        }
      })
      .catch(err => console.error('Failed to copy text: ', err));
  };

  return (
    <div className={`font-sans text-base leading-relaxed whitespace-pre-wrap break-words p-4 bg-white rounded-lg border border-gray-100 ${className}`}>
      <div className="mb-4 pb-3 border-b border-gray-100 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
            🔄 Diff View
          </span>
          <span className="text-xs text-gray-500 hidden md:inline">
            Green: added text, Red: removed text
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex text-xs bg-gray-100 rounded-md overflow-hidden">
            <button
              onClick={() => setDiffMode('word')}
              className={`px-3 py-1 ${
                diffMode === 'word' 
                  ? 'bg-blue-100 text-blue-800 font-medium' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Word
            </button>
            <button
              onClick={() => setDiffMode('character')}
              className={`px-3 py-1 ${
                diffMode === 'character' 
                  ? 'bg-blue-100 text-blue-800 font-medium' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Character
            </button>
          </div>
          <button
            id="diff-copy-button"
            onClick={handleCopyToClipboard}
            className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-xs font-medium hover:bg-blue-200 transition-colors"
          >
            Copy Result
          </button>
        </div>
      </div>
      
      <div>
        {differences.map((part, index) => {
          // Decide what to render based on if the part was added, removed, or unchanged
          if (part.added) {
            return (
              <span 
                key={`add-${index}`} 
                className="bg-green-100 text-green-800 border-b border-green-300 rounded px-0.5 mx-0.5 relative"
              >
                {part.value}
              </span>
            );
          }
          
          if (part.removed) {
            return (
              <span 
                key={`remove-${index}`} 
                className="bg-red-100 text-red-800 border-b border-red-300 line-through rounded px-0.5 mx-0.5 opacity-75"
              >
                {part.value}
              </span>
            );
          }
          
          // Unchanged text
          return <span key={`unchanged-${index}`}>{part.value}</span>;
        })}
      </div>
    </div>
  );
};

export default DiffView;