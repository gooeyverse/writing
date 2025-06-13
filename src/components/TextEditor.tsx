import React from 'react';
import { Copy, Download, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react';

interface TextEditorProps {
  originalText: string;
  rewrittenText: string;
  onOriginalChange: (text: string) => void;
  onRewrite: () => void;
  onFeedback: (rating: 'positive' | 'negative') => void;
  isRewriting: boolean;
  selectedAgentName: string;
  selectedAgentAvatar: string;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  originalText,
  rewrittenText,
  onOriginalChange,
  onRewrite,
  onFeedback,
  isRewriting,
  selectedAgentName,
  selectedAgentAvatar
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadText = (text: string, filename: string) => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex-1 flex flex-col space-y-6">
      {/* Original Text Input */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Original Text</h2>
        </div>
        <div className="p-6">
          <textarea
            value={originalText}
            onChange={(e) => onOriginalChange(e.target.value)}
            placeholder="Enter your text here to have it rewritten by your selected agent..."
            className="w-full h-64 p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-500">
              {originalText.length} characters
            </span>
            <button
              onClick={onRewrite}
              disabled={!originalText.trim() || isRewriting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              {isRewriting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{isRewriting ? 'Rewriting...' : `Rewrite with ${selectedAgentName}`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Rewritten Text Output */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{selectedAgentAvatar}</span>
            <h2 className="text-lg font-semibold text-gray-800">
              {selectedAgentName}'s Rewrite
            </h2>
          </div>
          {rewrittenText && (
            <div className="flex space-x-2">
              <button
                onClick={() => copyToClipboard(rewrittenText)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => downloadText(rewrittenText, `${selectedAgentName.toLowerCase()}-rewrite.txt`)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Download text"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="p-6">
          <div className="w-full h-64 p-4 border border-gray-200 rounded-lg bg-gray-50">
            {rewrittenText ? (
              <div className="whitespace-pre-wrap text-gray-800">{rewrittenText}</div>
            ) : (
              <div className="text-gray-400 italic">
                {selectedAgentName} will rewrite your text here after you click "Rewrite"
              </div>
            )}
          </div>
          {rewrittenText && (
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-500">
                {rewrittenText.length} characters
              </span>
              <div className="flex space-x-2">
                <button 
                  onClick={() => onFeedback('positive')}
                  className="px-4 py-2 text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors flex items-center space-x-2"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Good</span>
                </button>
                <button 
                  onClick={() => onFeedback('negative')}
                  className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center space-x-2"
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>Needs Work</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};