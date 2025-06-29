import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Users, Highlighter, Undo, Redo, HelpCircle, Edit3, FileText } from 'lucide-react';
import { Agent } from '../types';

interface TextEditorProps {
  originalText: string;
  onOriginalChange: (text: string) => void;
  onGetFeedback: () => void;
  isProcessing: boolean;
  selectedAgents: Agent[];
  onSendMessage?: (message: string, mentionedAgentIds: string[], messageType?: 'feedback' | 'chat' | 'rewrite') => void;
}

interface ContextMenuPosition {
  x: number;
  y: number;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  originalText,
  onOriginalChange,
  onGetFeedback,
  isProcessing,
  selectedAgents,
  onSendMessage
}) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ show: boolean; position: ContextMenuPosition; selectedText: string }>({
    show: false,
    position: { x: 0, y: 0 },
    selectedText: ''
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
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

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu({ show: false, position: { x: 0, y: 0 }, selectedText: '' });
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextMenu({ show: false, position: { x: 0, y: 0 }, selectedText: '' });
      }
    };

    if (contextMenu.show) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [contextMenu.show]);

  const handleTextSelection = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selected = originalText.substring(start, end);
      
      setSelectedText(selected);
      setSelectionRange({ start, end });
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Get selected text from textarea
    let selected = '';
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      selected = originalText.substring(start, end);
    }

    // Only show context menu if we have selected agents and either selected text or full text
    if (selectedAgents.length > 0 && (selected.trim() || originalText.trim())) {
      const textToUse = selected.trim() || originalText;
      
      setContextMenu({
        show: true,
        position: { x: e.clientX, y: e.clientY },
        selectedText: textToUse
      });
    }
  };

  const handleAgentAction = (agent: Agent, action: 'feedback' | 'rewrite') => {
    if (!onSendMessage || !contextMenu.selectedText) return;

    // Send the text directly with the correct message type
    const message = contextMenu.selectedText;
    const messageType = action; // Use the action directly as the message type
    
    onSendMessage(message, [agent.id], messageType);
    setContextMenu({ show: false, position: { x: 0, y: 0 }, selectedText: '' });
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
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

  // Convert text with ==highlight== to rich text display for preview
  const renderRichTextPreview = (text: string) => {
    if (!text) return '';

    const parts = text.split(/(==.*?==)/g);
    return parts.map((part) => {
      if (part.startsWith('==') && part.endsWith('==')) {
        return part.slice(2, -2); // Remove highlight markers for preview
      }
      return part;
    }).join('');
  };

  // Calculate position mapping between raw text and display text
  const getDisplayPosition = (rawPosition: number): number => {
    let displayPos = 0;
    let rawPos = 0;
    
    while (rawPos < rawPosition && rawPos < originalText.length) {
      if (originalText.substring(rawPos, rawPos + 2) === '==') {
        // Skip the opening ==
        rawPos += 2;
        // Find the closing ==
        const closePos = originalText.indexOf('==', rawPos);
        if (closePos !== -1) {
          // Add the content between == markers
          const contentLength = closePos - rawPos;
          displayPos += contentLength;
          rawPos = closePos + 2; // Skip the closing ==
        } else {
          // No closing ==, treat as regular text
          displayPos++;
          rawPos++;
        }
      } else {
        displayPos++;
        rawPos++;
      }
    }
    
    return displayPos;
  };

  const getRawPosition = (displayPosition: number): number => {
    let displayPos = 0;
    let rawPos = 0;
    
    while (displayPos < displayPosition && rawPos < originalText.length) {
      if (originalText.substring(rawPos, rawPos + 2) === '==') {
        // Skip the opening ==
        rawPos += 2;
        // Find the closing ==
        const closePos = originalText.indexOf('==', rawPos);
        if (closePos !== -1) {
          // Add the content between == markers
          const contentLength = closePos - rawPos;
          if (displayPos + contentLength >= displayPosition) {
            // Position is within this highlighted section
            return rawPos + (displayPosition - displayPos);
          }
          displayPos += contentLength;
          rawPos = closePos + 2; // Skip the closing ==
        } else {
          // No closing ==, treat as regular text
          displayPos++;
          rawPos++;
        }
      } else {
        displayPos++;
        rawPos++;
      }
    }
    
    return rawPos;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <h2 className="text-2xl font-bold text-black">Text Editor</h2>
      </div>

      {/* Rich Text Editor - Takes remaining height */}
      <div className="bg-white rounded-xl border border-gray-300 shadow-sm flex-1 flex flex-col min-h-0">
        {/* Simplified Toolbar */}
        <div className="toolbar-container px-4 py-3 border-b border-gray-300 flex items-center justify-between bg-gray-50 flex-shrink-0">
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
              disabled={!selectedText}
              className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Highlight selected text"
            >
              <Highlighter className="w-4 h-4" />
            </button>
          </div>

          {/* Status Info with Help Tooltip */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            {selectedText && (
              <span className="text-yellow-600 font-medium">
                "{selectedText.length > 15 ? selectedText.substring(0, 15) + '...' : selectedText}" selected
              </span>
            )}
            
            {/* Help Icon with Tooltip */}
            <div className="relative">
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="p-1 text-gray-500 hover:text-gray-700 rounded transition-colors"
                title="Editor tips"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              
              {/* Tooltip */}
              {showTooltip && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-black text-white text-xs rounded-lg p-3 shadow-lg z-50">
                  <div className="absolute -top-1 right-4 w-2 h-2 bg-black transform rotate-45"></div>
                  <h4 className="font-medium text-white mb-2 flex items-center space-x-1">
                    <span>💡</span>
                    <span>Editor Tips</span>
                  </h4>
                  <ul className="space-y-1 text-gray-200">
                    <li className="flex items-center space-x-1">
                      <span>• Select text and click</span>
                      <Highlighter className="w-3 h-3 text-yellow-400" />
                      <span>to apply yellow highlighting</span>
                    </li>
                    <li className="flex items-center space-x-1">
                      <span>• Use Ctrl+Z/Ctrl+Y or the</span>
                      <Undo className="w-3 h-3" />
                      <span>/</span>
                      <Redo className="w-3 h-3" />
                      <span>buttons for undo/redo</span>
                    </li>
                    <li>• Right-click to ask agents for feedback or rewriting help</li>
                    <li>• Highlighted text is preserved when sharing with agents</li>
                    <li>• Use ==text== syntax for manual highlighting</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Text Area Container - Takes remaining height */}
        <div className="p-6 flex-1 flex flex-col relative min-h-0">
          {/* Always-visible Text Editor with Rich Text Background */}
          <div className="relative flex-1 min-h-0">
            {/* Rich Text Background Layer - Shows highlighted text without == markers */}
            <div 
              className="absolute inset-0 p-4 border-2 border-transparent rounded-lg pointer-events-none overflow-hidden whitespace-pre-wrap break-words z-0"
              style={{ 
                fontFamily: 'JetBrains Mono, Courier New, monospace',
                fontSize: '14px',
                lineHeight: '1.6',
                color: 'transparent'
              }}
            >
              {originalText.split(/(==.*?==)/g).map((part, index) => {
                if (part.startsWith('==') && part.endsWith('==')) {
                  return (
                    <span key={index} className="bg-yellow-200 rounded px-1">
                      {part.slice(2, -2)}
                    </span>
                  );
                }
                return <span key={index}>{part}</span>;
              })}
            </div>

            {/* Editable Textarea Overlay - Shows raw text with == markers for editing */}
            <textarea
              ref={textareaRef}
              value={originalText}
              onChange={(e) => onOriginalChange(e.target.value)}
              onSelect={handleTextSelection}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              onKeyDown={handleKeyDown}
              onContextMenu={handleContextMenu}
              placeholder="Start writing here... Select text and click the highlight button to apply yellow highlighting."
              className="relative w-full h-full p-4 border-2 border-gray-400 rounded-lg resize-none focus:ring-2 focus:ring-black focus:border-black bg-transparent text-black font-mono leading-relaxed focus:outline-none z-10"
              style={{ 
                fontFamily: 'JetBrains Mono, Courier New, monospace',
                fontSize: '14px',
                lineHeight: '1.6',
                color: 'rgba(0, 0, 0, 0.8)' // Slightly transparent so background highlights show through
              }}
            />
          </div>

          {/* Bottom Controls */}
          <div className="flex justify-between items-center mt-4 flex-shrink-0">
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

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white border-2 border-black rounded-lg shadow-lg py-2 z-50 min-w-64"
          style={{
            left: `${Math.min(contextMenu.position.x, window.innerWidth - 280)}px`,
            top: `${Math.min(contextMenu.position.y, window.innerHeight - 200)}px`
          }}
        >
          {/* Context Menu Header */}
          <div className="px-4 py-2 border-b border-gray-300 bg-gray-50">
            <div className="text-xs text-gray-600 font-medium">
              {contextMenu.selectedText.length > 30 
                ? `"${renderRichTextPreview(contextMenu.selectedText).substring(0, 30)}..."` 
                : `"${renderRichTextPreview(contextMenu.selectedText)}"`
              }
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Ask selected agents for help
            </div>
          </div>

          {/* Agent Actions */}
          <div className="max-h-64 overflow-y-auto">
            {selectedAgents.map((agent) => (
              <div key={agent.id} className="border-b border-gray-200 last:border-b-0">
                {/* Agent Header */}
                <div className="px-4 py-2 bg-gray-50 flex items-center space-x-2">
                  <span className="text-lg">{agent.avatar}</span>
                  <span className="font-medium text-black text-sm">{agent.name}</span>
                  <span className="text-xs text-gray-600">({agent.personality})</span>
                </div>
                
                {/* Action Buttons */}
                <div className="px-4 py-2 space-y-1">
                  <button
                    onClick={() => handleAgentAction(agent, 'feedback')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left text-sm text-black hover:bg-gray-100 rounded transition-colors"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Ask {agent.name} for feedback</span>
                  </button>
                  <button
                    onClick={() => handleAgentAction(agent, 'rewrite')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left text-sm text-black hover:bg-gray-100 rounded transition-colors"
                  >
                    <Edit3 className="w-4 h-4 text-green-600" />
                    <span>Ask {agent.name} to help me rewrite</span>
                  </button>
                  </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-300 bg-gray-50">
            <div className="text-xs text-gray-500">
              Right-click anywhere to access this menu
            </div>
          </div>
        </div>
      )}
    </div>
  );
};