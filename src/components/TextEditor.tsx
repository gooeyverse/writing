import React from 'react';
import { Copy, Download, RefreshCw, ThumbsUp, ThumbsDown, Users } from 'lucide-react';
import { Agent, RewriteResult } from '../types';

interface TextEditorProps {
  originalText: string;
  rewriteResults: RewriteResult[];
  onOriginalChange: (text: string) => void;
  onRewrite: () => void;
  onFeedback: (resultId: string, rating: 'positive' | 'negative') => void;
  isRewriting: boolean;
  selectedAgents: Agent[];
}

export const TextEditor: React.FC<TextEditorProps> = ({
  originalText,
  rewriteResults,
  onOriginalChange,
  onRewrite,
  onFeedback,
  isRewriting,
  selectedAgents
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

  const downloadAllResults = () => {
    const allText = rewriteResults.map(result => {
      const agent = selectedAgents.find(a => a.id === result.agentId);
      return `=== ${agent?.name || 'Unknown Agent'} ===\n\n${result.rewritten}\n\n`;
    }).join('\n');
    
    downloadText(allText, 'all-rewrites.txt');
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
            placeholder="Enter your text here to have it rewritten by your selected agents..."
            className="w-full h-64 p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-500">
              {originalText.length} characters
            </span>
            <div className="flex items-center space-x-3">
              {selectedAgents.length > 1 && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{selectedAgents.length} agents selected</span>
                </div>
              )}
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
                    ? 'Rewriting...' 
                    : selectedAgents.length === 1 
                      ? `Rewrite with ${selectedAgents[0].name}`
                      : `Rewrite with ${selectedAgents.length} agents`
                  }
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rewritten Text Results */}
      {rewriteResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              Agent Rewrites ({rewriteResults.length})
            </h2>
            {rewriteResults.length > 1 && (
              <button
                onClick={downloadAllResults}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download All</span>
              </button>
            )}
          </div>

          <div className="grid gap-6">
            {rewriteResults.map((result) => {
              const agent = selectedAgents.find(a => a.id === result.agentId);
              if (!agent) return null;

              return (
                <div key={result.id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{agent.avatar}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{agent.name}</h3>
                        <p className="text-sm text-gray-500">{agent.personality}</p>
                      </div>
                      {result.rating && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          result.rating > 0 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {result.rating > 0 ? 'Liked' : 'Needs work'}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(result.rewritten)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadText(result.rewritten, `${agent.name.toLowerCase()}-rewrite.txt`)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Download text"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="w-full min-h-32 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="whitespace-pre-wrap text-gray-800">{result.rewritten}</div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-gray-500">
                        {result.rewritten.length} characters
                      </span>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => onFeedback(result.id, 'positive')}
                          className={`px-4 py-2 border rounded-lg transition-colors flex items-center space-x-2 ${
                            result.rating === 1
                              ? 'bg-green-50 border-green-200 text-green-700'
                              : 'text-green-600 border-green-200 hover:bg-green-50'
                          }`}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span>Good</span>
                        </button>
                        <button 
                          onClick={() => onFeedback(result.id, 'negative')}
                          className={`px-4 py-2 border rounded-lg transition-colors flex items-center space-x-2 ${
                            result.rating === -1
                              ? 'bg-red-50 border-red-200 text-red-700'
                              : 'text-red-600 border-red-200 hover:bg-red-50'
                          }`}
                        >
                          <ThumbsDown className="w-4 h-4" />
                          <span>Needs Work</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state when no results */}
      {rewriteResults.length === 0 && selectedAgents.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Agent Rewrites</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-12">
              <div className="flex justify-center space-x-2 mb-4">
                {selectedAgents.slice(0, 3).map(agent => (
                  <span key={agent.id} className="text-3xl">{agent.avatar}</span>
                ))}
                {selectedAgents.length > 3 && (
                  <span className="text-2xl text-gray-400">+{selectedAgents.length - 3}</span>
                )}
              </div>
              <p className="text-gray-500 mb-2">
                {selectedAgents.length === 1 
                  ? `${selectedAgents[0].name} will rewrite your text here`
                  : `${selectedAgents.length} agents will provide their rewrites here`
                }
              </p>
              <p className="text-sm text-gray-400">
                Enter text above and click "Rewrite" to get started
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};