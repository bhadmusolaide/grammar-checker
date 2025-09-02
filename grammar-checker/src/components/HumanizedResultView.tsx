import React from 'react';

interface HumanizedResultViewProps {
  humanizedText: string;
  className?: string;
}

const HumanizedResultView: React.FC<HumanizedResultViewProps> = ({ 
  humanizedText, 
  className = '' 
}) => {
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(humanizedText)
      .then(() => {
        // Show a brief visual feedback when copied
        const copyButton = document.getElementById('copy-button');
        if (copyButton) {
          copyButton.innerText = 'Copied!';
          copyButton.classList.replace('bg-green-100', 'bg-blue-100');
          copyButton.classList.replace('text-green-800', 'text-blue-800');
          
          setTimeout(() => {
            copyButton.innerText = 'Copy to Clipboard';
            copyButton.classList.replace('bg-blue-100', 'bg-green-100');
            copyButton.classList.replace('text-blue-800', 'text-green-800');
          }, 2000);
        }
      })
      .catch(err => console.error('Failed to copy text: ', err));
  };

  return (
    <div className={`font-sans text-base leading-relaxed whitespace-pre-wrap break-words p-4 bg-white rounded-lg border border-green-100 shadow-sm ${className}`}>
      <div className="mb-4 pb-3 border-b border-green-100 flex justify-between items-center">
        <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
          ✨ AI Humanized Text
        </span>
        <button
          id="copy-button"
          onClick={handleCopyToClipboard}
          className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-md text-xs font-medium hover:bg-green-200 transition-colors"
        >
          Copy to Clipboard
        </button>
      </div>
      <div className="text-gray-800">
        {humanizedText}
      </div>
    </div>
  );
};

export default HumanizedResultView;