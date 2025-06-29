import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Users, Highlighter, Undo, Redo } from 'lucide-react';
import { Agent } from '../types';

interface TextEditorProps {
  originalText: string;
  onOriginalChange: (text: string) => void;
  onGetFeedback: () => void;
  isProcessing: boolean;
  selectedAgents: Agent[];
}

export const TextEditor: React.FC<TextEditorProps> = ({
  originalText,
  onOriginalChange,
  onGetFeedback,
  isProcessing,
  selectedAgents
}) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [history, setHistory] = useState<string[]>([originalText]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Update history when text changes
  useEffect(() => {
    if (originalText !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(originalText);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [originalText]);

  const handleTextSelection = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selected = originalText.substring(start, end);
      
      setSelectedText(selected);
      setSelectionRange({ start, end });
    }
  };

  const applyHighlight = () => {
    if (!selectionRange || !textareaRef.current) return;

    const { start, end } = selectionRange;
    const beforeText = originalText.substring(0, start);
    const selectedText = originalText.substring(start, end);
    const afterText = originalText.substring(end);

    const formattedText = `==${selectedText}==`;
    const newText = beforeText + formattedText + afterText;
    onOriginalChange(newText);

    // Restore focus and selection
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newEnd = start + formattedText.length;
        textareaRef.current.setSelectionRange(newEnd, newEnd);
      }
    }, 0);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onOriginalChange(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onOriginalChange(history[newIndex]);
    }
  };

  const wordCount = originalText.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = originalText.length;

  return (
    <div className="flex flex-col h-full">
      {/* Rich Text Editor */}
      <div className="bg-white rounded-xl border-2 border-black shadow-sm flex-1 flex flex-col">
        {/* Simplified Toolbar */}
        <div className="px-4 py-3 border-b border-gray-300 flex items-center justify-between bg-gray-50">
          <div className="flex items-center space-x-1">
            {/* Undo/Redo */}
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 mx-2" />

            {/* Yellow Highlight */}
            <button
              onClick={applyHighlight}
              disabled={!selectedText}
              className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Highlight selected text"
            >
              <Highlighter className="w-4 h-4" />
            </button>
          </div>

          {/* Status Info */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            {selectedText && (
              <span className="text-yellow-600 font-medium">
                "{selectedText.length > 15 ? selectedText.substring(0, 15) + '...' : selectedText}" selected
              </span>
            )}
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
          </div>
        </div>
        
        {/* Text Area */}
        <div className="p-6 flex-1 flex flex-col">
          <textarea
            ref={textareaRef}
            value={originalText}
            onChange={(e) => onOriginalChange(e.target.value)}
            onSelect={handleTextSelection}
            onMouseUp={handleTextSelection}
            onKeyUp={handleTextSelection}
            placeholder="Start writing here... Select text and click the highlight button to apply yellow highlighting."
            className="w-full flex-1 p-4 border-2 border-gray-400 rounded-lg resize-none focus:ring-2 focus:ring-black focus:border-black min-h-64 bg-white text-black font-mono leading-relaxed"
            style={{ 
              fontFamily: 'JetBrains Mono, Courier New, monospace',
              fontSize: '14px',
              lineHeight: '1.6'
            }}
          />
          
          {/* Bottom Controls */}
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              {selectedAgents.length > 1 && (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{selectedAgents.length} agents selected</span>
                </div>
              )}
            </div>
            
            <button
              onClick={onGetFeedback}
              disabled={!originalText.trim() || isProcessing || selectedAgents.length === 0}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors border-2 border-black"
            >
              {isProcessing ? (
                <MessageSquare className="w-4 h-4 animate-pulse" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              <span>
                {isProcessing 
                  ? 'Getting feedback...' 
                  : selectedAgents.length === 1 
                    ? `Get feedback from ${selectedAgents[0].name}`
                    : `Get feedback from ${selectedAgents.length} agents`
                }
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg border-2 border-gray-400">
        <h4 className="font-medium text-black mb-2">💡 Editor Tips</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Select text and click the <Highlighter className="w-3 h-3 inline text-yellow-600" /> button to apply yellow highlighting</li>
          <li>• Use <Undo className="w-3 h-3 inline" /> and <Redo className="w-3 h-3 inline" /> buttons or Ctrl+Z/Ctrl+Y for undo/redo</li>
          <li>• Highlighted text uses ==text== format for compatibility with agents</li>
          <li>• Use the chat panel to have conversations with specific agents</li>
        </ul>
      </div>
    </div>
  );
};