import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Users, Highlighter, Undo, Redo, HelpCircle, Edit3, FileText, Type, X } from 'lucide-react';
import { Agent } from '../types';

interface TextEditorProps {
  originalText: string;
  onOriginalChange: (text: string) => void;
  onGetFeedback: () => void;
  isProcessing: boolean;
  selectedAgents: Agent[];
  onSendMessage?: (message: string, mentionedAgentIds: string[], messageType?: 'feedback' | 'chat' | 'rewrite') => void;
  onFirstHighlight?: () => void;
}

interface ContextMenuPosition {
  x: number;
  y: number;
}

interface HighlightRange {
  start: number;
  end: number;
  id: string;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  originalText,
  onOriginalChange,
  onGetFeedback,
  isProcessing,
  selectedAgents,
  onSendMessage,
  onFirstHighlight
}) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [highlights, setHighlights] = useState<HighlightRange[]>([]);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
  const [hasHighlightedBefore, setHasHighlightedBefore] = useState(false);

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

  // Check if a range overlaps with any existing highlights
  const findOverlappingHighlight = (start: number, end: number): HighlightRange | null => {
    return highlights.find(highlight => 
      // Check for any overlap
      (start < highlight.end && end > highlight.start)
    ) || null;
  };

  // Check if a range is completely contained within an existing highlight
  const findContainingHighlight = (start: number, end: number): HighlightRange | null => {
    return highlights.find(highlight => 
      start >= highlight.start && end <= highlight.end
    ) || null;
  };

  const applyHighlight = () => {
    if (!selectionRange || !textareaRef.current) return;

    const { start, end } = selectionRange;
    
    // If no text is selected, do nothing
    if (start === end) return;

    // Check if the selection is completely within an existing highlight
    const containingHighlight = findContainingHighlight(start, end);
    
    if (containingHighlight) {
      // Remove the containing highlight
      setHighlights(prev => prev.filter(h => h.id !== containingHighlight.id));
    } else {
      // Check for overlapping highlights and remove them
      const overlappingHighlights = highlights.filter(highlight => 
        start < highlight.end && end > highlight.start
      );
      
      // Remove overlapping highlights
      const remainingHighlights = highlights.filter(highlight => 
        !(start < highlight.end && end > highlight.start)
      );
      
      // Add new highlight
      const newHighlight: HighlightRange = {
        start,
        end,
        id: Date.now().toString()
      };
      
      setHighlights([...remainingHighlights, newHighlight]);

      // Trigger first highlight callback if this is the first time highlighting
      if (!hasHighlightedBefore && onFirstHighlight) {
        setHasHighlightedBefore(true);
        onFirstHighlight();
      }
    }

    // Restore focus and selection
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(end, end);
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

  // Handle clicks on highlighted text to remove highlights
  const handleHighlightClick = (e: React.MouseEvent) => {
    if (!textareaRef.current) return;

    // Get click position in textarea
    const rect = textareaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Get character position from click coordinates
    const clickPosition = getCharacterPositionFromCoordinates(x, y);
    
    if (clickPosition !== null) {
      // Find highlight at this position
      const clickedHighlight = highlights.find(highlight => 
        clickPosition >= highlight.start && clickPosition < highlight.end
      );
      
      if (clickedHighlight) {
        // Remove the clicked highlight
        setHighlights(prev => prev.filter(h => h.id !== clickedHighlight.id));
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };

  // Helper function to get character position from coordinates (approximate)
  const getCharacterPositionFromCoordinates = (x: number, y: number): number | null => {
    if (!textareaRef.current) return null;

    // Create a temporary element to measure text
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    temp.style.whiteSpace = 'pre-wrap';
    temp.style.font = window.getComputedStyle(textareaRef.current).font;
    temp.style.width = textareaRef.current.clientWidth + 'px';
    temp.style.padding = window.getComputedStyle(textareaRef.current).padding;
    temp.style.border = window.getComputedStyle(textareaRef.current).border;
    temp.style.lineHeight = window.getComputedStyle(textareaRef.current).lineHeight;
    
    document.body.appendChild(temp);

    // Estimate character position based on coordinates
    const lineHeight = parseInt(window.getComputedStyle(textareaRef.current).lineHeight);
    const estimatedLine = Math.floor(y / lineHeight);
    
    // Split text into lines
    const lines = originalText.split('\n');
    let characterPosition = 0;
    
    // Add characters from previous lines
    for (let i = 0; i < estimatedLine && i < lines.length; i++) {
      characterPosition += lines[i].length + 1; // +1 for newline
    }
    
    // Estimate position within the current line
    if (estimatedLine < lines.length) {
      const currentLine = lines[estimatedLine];
      temp.textContent = currentLine;
      const lineWidth = temp.offsetWidth;
      const estimatedCharInLine = Math.round((x / lineWidth) * currentLine.length);
      characterPosition += Math.min(estimatedCharInLine, currentLine.length);
    }
    
    document.body.removeChild(temp);
    
    return Math.min(characterPosition, originalText.length);
  };

  // Render text with highlights (no markdown syntax)
  const renderHighlightedText = (text: string) => {
    if (!text || highlights.length === 0) return text;

    // Sort highlights by start position
    const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);
    
    let result = [];
    let lastIndex = 0;

    sortedHighlights.forEach((highlight, index) => {
      // Add text before highlight
      if (highlight.start > lastIndex) {
        result.push(
          <span key={`text-${index}`}>
            {text.substring(lastIndex, highlight.start)}
          </span>
        );
      }

      // Add highlighted text with click handler
      result.push(
        <span 
          key={highlight.id} 
          className="bg-yellow-200 rounded px-1 cursor-pointer hover:bg-yellow-300 transition-colors"
          onClick={handleHighlightClick}
          title="Click to remove highlight"
        >
          {text.substring(highlight.start, highlight.end)}
        </span>
      );

      lastIndex = highlight.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      result.push(
        <span key="text-end">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return result;
  };

  // Calculate dynamic styling based on state
  const isEmpty = !originalText.trim();
  const isInteractive = isHovered && !isFocused; // Only show hover effects when not focused
  
  // Check if current selection overlaps with existing highlights
  const selectionOverlapsHighlight = selectionRange ? 
    findOverlappingHighlight(selectionRange.start, selectionRange.end) !== null : false;
  
  const selectionWithinHighlight = selectionRange ? 
    findContainingHighlight(selectionRange.start, selectionRange.end) !== null : false;

  return (
    <div className="flex flex-col h-full">
      {/* Rich Text Editor - Takes full height without header */}
      <div className="bg-white flex-1 flex flex-col min-h-0">
        {/* Enhanced Toolbar with Writing Indicator */}
        <div className="toolbar-container px-4 py-3 border-b border-gray-300 flex items-center justify-between bg-gray-50 flex-shrink-0">
          <div className="flex items-center space-x-1">
            {/* Writing Indicator - Updated to Gray Theme */}
            <div className="flex items-center space-x-2 mr-4">
              <div className={`p-2 rounded-lg transition-all duration-200 ${
                isEmpty ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-700'
              }`}>
                <Type className="w-4 h-4" />
              </div>
              <div className="text-sm">
                <div className={`font-medium transition-colors ${
                  isEmpty ? 'text-gray-600' : 'text-gray-700'
                }`}>
                  {isEmpty ? 'Ready to Write' : 'Writing in Progress'}
                </div>
                <div className="text-xs text-gray-500">
                  {isEmpty ? 'Click below to start typing' : `${originalText.length} characters`}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-gray-300 mx-2" />

            {/* Undo/Redo */}
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 mx-2" />

            {/* Yellow Highlight Button - Updated with X icon for removal */}
            <button
              onClick={applyHighlight}
              disabled={!selectedText}
              className={`p-2 rounded transition-colors relative ${
                !selectedText 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : selectionWithinHighlight
                    ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 bg-yellow-50'
                    : 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100'
              }`}
              title={
                !selectedText 
                  ? 'Select text to highlight' 
                  : selectionWithinHighlight
                    ? 'Remove highlight from selected text'
                    : 'Highlight selected text'
              }
            >
              {selectionWithinHighlight ? (
                <div className="relative">
                  <Highlighter className="w-4 h-4" />
                  <X className="w-2 h-2 absolute -top-0.5 -right-0.5 text-yellow-800 bg-yellow-200 rounded-full" />
                </div>
              ) : (
                <Highlighter className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Status Info with Help Tooltip */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            {selectedText && (
              <span className={`font-medium ${
                selectionWithinHighlight ? 'text-yellow-600' : 'text-yellow-600'
              }`}>
                "{selectedText.length > 15 ? selectedText.substring(0, 15) + '...' : selectedText}" selected
                {selectionWithinHighlight && ' (will remove highlight)'}
              </span>
            )}
            
            {/* Highlight count */}
            {highlights.length > 0 && (
              <span className="text-yellow-600 font-medium">
                {highlights.length} highlight{highlights.length > 1 ? 's' : ''}
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
                <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 text-white text-xs rounded-lg p-3 shadow-lg z-50">
                  <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-800 transform rotate-45"></div>
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
                    <li>• Click on highlighted text to remove the highlight</li>
                    <li className="flex items-center space-x-1">
                      <span>• Selecting text within a highlight shows</span>
                      <div className="relative inline-flex">
                        <Highlighter className="w-3 h-3 text-yellow-400" />
                        <X className="w-1.5 h-1.5 absolute -top-0.5 -right-0.5 text-yellow-200 bg-yellow-600 rounded-full" />
                      </div>
                      <span>to remove</span>
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
                    <li>• Highlights are visual only - no special syntax added to text</li>
                    <li>• <strong>First highlight opens the chat panel automatically!</strong></li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Enhanced Text Area Container with Visual Cues */}
        <div 
          className={`p-6 flex-1 flex flex-col relative min-h-0 transition-all duration-200 ${
            isEmpty && !isFocused ? 'bg-gradient-to-br from-gray-50 to-gray-100' : 'bg-white'
          }`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Enhanced Text Editor with Minimal Styling */}
          <div 
            className={`relative flex-1 min-h-0 transition-all duration-200 ${
              isInteractive ? 'transform scale-[1.002]' : ''
            }`}
          >
            {/* Rich Text Background Layer - Shows highlighted text */}
            <div 
              className={`absolute inset-0 p-4 rounded-lg pointer-events-none overflow-hidden whitespace-pre-wrap break-words z-0 transition-all duration-200`}
              style={{ 
                fontFamily: 'JetBrains Mono, Courier New, monospace',
                fontSize: '14px',
                lineHeight: '1.6',
                color: 'transparent',
                backgroundColor: 'transparent'
              }}
            >
              {renderHighlightedText(originalText)}
            </div>

            {/* Editable Textarea Overlay with Blinking Cursor */}
            <div className={`relative w-full h-full ${isFocused ? 'text-editor-focused' : 'text-editor-unfocused'}`}>
              <textarea
                ref={textareaRef}
                value={originalText}
                onChange={(e) => onOriginalChange(e.target.value)}
                onSelect={handleTextSelection}
                onMouseUp={handleTextSelection}
                onKeyUp={handleTextSelection}
                onKeyDown={handleKeyDown}
                onContextMenu={handleContextMenu}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={`Start writing here... ${selectedAgents.length > 0 ? `Your ${selectedAgents.length} selected agent${selectedAgents.length > 1 ? 's' : ''} will help you improve your writing.` : 'Select agents to get writing assistance.'}`}
                className={`text-editor-cursor relative w-full h-full p-4 rounded-lg resize-none bg-transparent text-gray-700 font-mono leading-relaxed focus:outline-none z-10 border-0 transition-all duration-200 ${
                  isInteractive && !isFocused
                    ? 'ring-1 ring-gray-300 ring-opacity-30 bg-gray-50 bg-opacity-10' 
                    : 'bg-transparent'
                }`}
                style={{ 
                  fontFamily: 'JetBrains Mono, Courier New, monospace',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: isEmpty && !isFocused ? 'rgba(55, 65, 81, 0.4)' : 'rgba(55, 65, 81, 0.9)'
                }}
              />
            </div>
          </div>

          {/* Enhanced Bottom Controls - Only Get Feedback Button */}
          <div className="flex justify-end items-center mt-4 flex-shrink-0">
            {/* Enhanced Get Feedback Button */}
            <button
              onClick={onGetFeedback}
              disabled={!originalText.trim() || isProcessing || selectedAgents.length === 0}
              className={`px-6 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 border-2 ${
                !originalText.trim() || selectedAgents.length === 0
                  ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed'
                  : isProcessing
                    ? 'bg-gray-600 text-white border-gray-600 cursor-wait'
                    : 'bg-gray-800 text-white border-gray-800 hover:bg-gray-700 hover:scale-105 shadow-lg hover:shadow-xl'
              }`}
            >
              {isProcessing ? (
                <MessageSquare className="w-4 h-4 animate-pulse" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              <span>
                {isProcessing 
                  ? 'Getting feedback...' 
                  : !originalText.trim()
                    ? 'Write something first'
                    : selectedAgents.length === 0
                      ? 'Select agents first'
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
          className="fixed bg-white border-2 border-gray-800 rounded-lg shadow-lg py-2 z-50 min-w-64"
          style={{
            left: `${Math.min(contextMenu.position.x, window.innerWidth - 280)}px`,
            top: `${Math.min(contextMenu.position.y, window.innerHeight - 200)}px`
          }}
        >
          {/* Context Menu Header */}
          <div className="px-4 py-2 border-b border-gray-300 bg-gray-50">
            <div className="text-xs text-gray-600 font-medium">
              {contextMenu.selectedText.length > 30 
                ? `"${contextMenu.selectedText.substring(0, 30)}..."` 
                : `"${contextMenu.selectedText}"`
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
                  <span className="font-medium text-gray-800 text-sm">{agent.name}</span>
                  <span className="text-xs text-gray-600">({agent.personality})</span>
                </div>
                
                {/* Action Buttons */}
                <div className="px-4 py-2 space-y-1">
                  <button
                    onClick={() => handleAgentAction(agent, 'feedback')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Ask {agent.name} for feedback</span>
                  </button>
                  <button
                    onClick={() => handleAgentAction(agent, 'rewrite')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-100 rounded transition-colors"
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