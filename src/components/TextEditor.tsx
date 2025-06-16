import React from 'react';
import { RefreshCw, Users, FileText } from 'lucide-react';
import { Agent } from '../types';

interface TextEditorProps {
  originalText: string;
  onOriginalChange: (text: string) => void;
  onRewrite: () => void;
  isRewriting: boolean;
  selectedAgents: Agent[];
}

export const TextEditor: React.FC<TextEditorProps> = ({
  originalText,
  onOriginalChange,
  onRewrite,
  isRewriting,
  selectedAgents
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Text Editor</h2>
        <p className="text-gray-600">
          Write your text here and get rewrites from your selected agents, or use the chat panel to have conversations with specific agents.
        </p>
      </div>

      {/* Text Input */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-800">Your Text</h3>
          </div>
          {selectedAgents.length > 1 && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>{selectedAgents.length} agents selected</span>
            </div>
          )}
        </div>
        
        <div className="p-6 flex-1 flex flex-col">
          <textarea
            value={originalText}
            onChange={(e) => onOriginalChange(e.target.value)}
            placeholder="Enter your text here to have it rewritten by your selected agents..."
            className="w-full flex-1 p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-64"
          />
          
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-500">
              {originalText.length} characters
            </span>
            <button
              onClick={onRewrite}
              disabled={!originalText.trim() || isRewriting || selectedAgents.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              {isRewriting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>
                {isRewriting 
                  ? 'Processing...' 
                  : selectedAgents.length === 1 
                    ? `Send to ${selectedAgents[0].name}`
                    : `Send to ${selectedAgents.length} agents`
                }
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use the chat panel to have conversations with specific agents</li>
          <li>• Type <code className="bg-blue-100 px-1 rounded">@AgentName</code> to mention specific agents in chat</li>
          <li>• Selected agents will respond to messages without mentions</li>
          <li>• Give feedback to help agents improve their responses</li>
        </ul>
      </div>
    </div>
  );
};