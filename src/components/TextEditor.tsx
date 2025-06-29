import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Users, Bold, Italic, Underline, Highlighter, Type, AlignLeft, AlignCenter, AlignRight, Undo, Redo, Copy, Cast as Paste } from 'lucide-react';
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

  const applyFormatting = (formatType: string) => {
    if (!selectionRange || !textareaRef.current) return;

    const { start, end } = selectionRange;
    const beforeText = originalText.substring(0, start);
    const selectedText = originalText.substring(start, end);
    const afterText = originalText.substring(end);

    let formattedText = selectedText;
    
    switch (formatType) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      case 'highlight':
        formattedText = `==${selectedText}==`;
        break;
      case 'uppercase':
        formattedText = selectedText.toUpperCase();
        break;
      case 'lowercase':
        formattedText = selectedText.toLowerCase();
        break;
    }

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

  const handleCopy = async () => {
    if (selectedText) {
      await navigator.clipboard.writeText(selectedText);
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (selectionRange && textareaRef.current) {
        const { start, end } = selectionRange;
        const beforeText = originalText.substring(0, start);
        const afterText = originalText.substring(end);
        const newText = beforeText + clipboardText + afterText;
        onOriginalChange(newText);
        
        // Set cursor position after pasted text
        setTimeout(() => {
          if (textareaRef.current) {
            const newPosition = start + clipboardText.length;
            textareaRef.current.setSelectionRange(newPosition, newPosition);
            textareaRef.current.focus();
          }
        }, 0);
      }
    } catch (error) {
      console.error('Failed to paste:', error);
    }
  };

  const insertTemplate = (template: string) => {
    const cursorPosition = textareaRef.current?.selectionStart || originalText.length;
    const beforeText = originalText.substring(0, cursorPosition);
    const afterText = originalText.substring(cursorPosition);
    const newText = beforeText + template + afterText;
    onOriginalChange(newText);
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = cursorPosition + template.length;
        textareaRef.current.setSelectionRange(newPosition, newPosition);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const wordCount = originalText.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = originalText.length;
  const charCountNoSpaces = originalText.replace(/\s/g, '').length;

  return (
    <div className="flex flex-col h-full">
      {/* Rich Text Editor */}
      <div className="bg-white rounded-xl border-2 border-black shadow-sm flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-gray-300 flex items-center justify-between bg-gray-50">
          <div className="flex items-center space-x-1">
            {/* History Controls */}
            <div className="flex items-center space-x-1 mr-3 pr-3 border-r border-gray-300">
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
            </div>

            {/* Clipboard Controls */}
            <div className="flex items-center space-x-1 mr-3 pr-3 border-r border-gray-300">
              <button
                onClick={handleCopy}
                disabled={!selectedText}
                className="p-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Copy selected text"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={handlePaste}
                className="p-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded transition-colors"
                title="Paste"
              >
                <Paste className="w-4 h-4" />
              </button>
            </div>

            {/* Text Formatting */}
            <div className="flex items-center space-x-1 mr-3 pr-3 border-r border-gray-300">
              <button
                onClick={() => applyFormatting('bold')}
                disabled={!selectedText}
                className="p-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Bold (wrap with **)"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => applyFormatting('italic')}
                disabled={!selectedText}
                className="p-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Italic (wrap with *)"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => applyFormatting('underline')}
                disabled={!selectedText}
                className="p-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Underline (wrap with __)"
              >
                <Underline className="w-4 h-4" />
              </button>
              <button
                onClick={() => applyFormatting('highlight')}
                disabled={!selectedText}
                className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Highlight (wrap with ==)"
              >
                <Highlighter className="w-4 h-4" />
              </button>
            </div>

            {/* Text Case */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => applyFormatting('uppercase')}
                disabled={!selectedText}
                className="p-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-bold"
                title="UPPERCASE"
              >
                AA
              </button>
              <button
                onClick={() => applyFormatting('lowercase')}
                disabled={!selectedText}
                className="p-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
                title="lowercase"
              >
                aa
              </button>
            </div>
          </div>

          {/* Quick Templates */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Quick:</span>
            <button
              onClick={() => insertTemplate('# Heading\n\n')}
              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            >
              Heading
            </button>
            <button
              onClick={() => insertTemplate('• ')}
              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            >
              Bullet
            </button>
            <button
              onClick={() => insertTemplate('1. ')}
              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            >
              Number
            </button>
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
            placeholder="Start writing here... Select text to apply formatting."
            className="w-full flex-1 p-4 border-2 border-gray-400 rounded-lg resize-none focus:ring-2 focus:ring-black focus:border-black min-h-64 bg-white text-black font-mono leading-relaxed"
            style={{ 
              fontFamily: 'JetBrains Mono, Courier New, monospace',
              fontSize: '14px',
              lineHeight: '1.6'
            }}
          />
          
          {/* Status Bar */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-300">
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span>{wordCount} words</span>
              <span>{charCount} characters</span>
              <span>{charCountNoSpaces} characters (no spaces)</span>
              {selectedText && (
                <span className="text-blue-600 font-medium">
                  "{selectedText.length > 20 ? selectedText.substring(0, 20) + '...' : selectedText}" selected
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {selectedAgents.length > 1 && (
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <Users className="w-4 h-4" />
                  <span>{selectedAgents.length} agents selected</span>
                </div>
              )}
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
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg border-2 border-gray-400">
        <h4 className="font-medium text-black mb-2">💡 Editor Tips</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Select text and use toolbar buttons to apply formatting</li>
          <li>• <strong>Bold:</strong> **text**, <em>Italic:</em> *text*, <u>Underline:</u> __text__, <mark>Highlight:</mark> ==text==</li>
          <li>• Use Ctrl+Z/Ctrl+Y (or Cmd+Z/Cmd+Y) for undo/redo</li>
          <li>• Quick templates help you start with common structures</li>
        </ul>
      </div>
    </div>
  );
};