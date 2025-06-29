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
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
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

  // Convert text with ==highlight== to rich text display
  const renderRichText = (text: string) => {
    if (!text) return <span className="text-gray-400">Start writing here...</span>;

    const parts = text.split(/(==.*?==)/g);
    return parts.map((part, index) => {
      if (part.startsWith('==') && part.endsWith('==')) {
        const highlightedText = part.slice(2, -2);
        return (
          <span key={index} className="bg-yellow-200 px-1 rounded">
            {highlightedText}
          </span>
        );
      }
      return part;
    });
  };

  const handleDisplayClick = () => {
    setIsEditing(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleTextareaBlur = () => {
    // Small delay to allow for toolbar interactions
    setTimeout(() => {
      if (!document.activeElement?.closest('.toolbar-container')) {
        setIsEditing(false);
      }
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      textareaRef.current?.blur();
    }
    // Handle Ctrl+Z and Ctrl+Y
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
      }
    }
  };

  const wordCount = originalText.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = originalText.length;

  return (
    <div className="flex flex-col h-full">
      {/* Rich Text Editor */}
      <div className="bg-white rounded-xl border-2 border-black shadow-sm flex-1 flex flex-col">
        {/* Simplified Toolbar */}
        <div className="toolbar-container px-4 py-3 border-b border-gray-300 flex items-center justify-between bg-gray-50">
          <div className="flex items-center space-x-1">
            {/* Undo/Redo */}
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 mx-2" />

            {/* Yellow Highlight */}
            <button
              onClick={applyHighlight}
              disabled={!selectedText || !isEditing}
              className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Highlight selected text"
            >
              <Highlighter className="w-4 h-4" />
            </button>
          </div>

          {/* Status Info */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            {selectedText && isEditing && (
              <span className="text-yellow-600 font-medium">
                "{selectedText.length > 15 ? selectedText.substring(0, 15) + '...' : selectedText}" selected
              </span>
            )}
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
          </div>
        </div>
        
        {/* Text Area Container */}
        <div className="p-6 flex-1 flex flex-col relative">
          {/* Rich Text Display */}
          {!isEditing && (
            <div
              ref={displayRef}
              onClick={handleDisplayClick}
              className="w-full flex-1 p-4 border-2 border-gray-400 rounded-lg min-h-64 bg-white text-black font-mono leading-relaxed cursor-text overflow-y-auto whitespace-pre-wrap"
              style={{ 
                fontFamily: 'JetBrains Mono, Courier New, monospace',
                fontSize: '14px',
                lineHeight: '1.6'
              }}
            >
              {renderRichText(originalText)}
            </div>
          )}

          {/* Raw Text Editor (hidden when not editing) */}
          {isEditing && (
            <textarea
              ref={textareaRef}
              value={originalText}
              onChange={(e) => onOriginalChange(e.target.value)}
              onSelect={handleTextSelection}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              onKeyDown={handleKeyDown}
              onBlur={handleTextareaBlur}
              placeholder="Start writing here... Select text and click the highlight button to apply yellow highlighting."
              className="w-full flex-1 p-4 border-2 border-black rounded-lg resize-none focus:ring-2 focus:ring-black focus:border-black min-h-64 bg-white text-black font-mono leading-relaxed focus:outline-none"
              style={{ 
                fontFamily: 'JetBrains Mono, Courier New, monospace',
                fontSize: '14px',
                lineHeight: '1.6'
              }}
            />
          )}
          
          {/* Edit Mode Indicator */}
          {isEditing && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-black text-white text-xs rounded">
              Editing - Press Esc to finish
            </div>
          )}

          {/* Bottom Controls */}
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              {selectedAgents.length > 1 && (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{selectedAgents.length} agents selected</span>
                </div>
              )}
              {!isEditing && (
                <button
                  onClick={handleDisplayClick}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Click to edit
                </button>
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
          <li>• Click anywhere in the text area to start editing</li>
          <li>• Select text and click <Highlighter className="w-3 h-3 inline text-yellow-600" /> to apply yellow highlighting</li>
          <li>• Use Ctrl+Z/Ctrl+Y or the <Undo className="w-3 h-3 inline" />/<Redo className="w-3 h-3 inline" /> buttons for undo/redo</li>
          <li>• Press Escape to finish editing and see rich text formatting</li>
          <li>• Highlighted text is preserved when sharing with agents</li>
        </ul>
      </div>
    </div>
  );
};