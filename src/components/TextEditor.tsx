import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Users, Highlighter, Undo, Redo, HelpCircle, Edit3, FileText, Type, X, ChevronRight, Send } from 'lucide-react';
import { Agent } from '../types';

interface TextEditorProps {
  originalText: string;
  onOriginalChange: (text: string) => void;
  onGetFeedback: () => void;
  isProcessing: boolean;
  selectedAgents: Agent[];
  onSendMessage?: (message: string, mentionedAgentIds: string[], messageType?: 'feedback' | 'chat' | 'rewrite') => void;
  onTextSelection?: (selectedText: string) => void; // Add callback for text selection
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
  onTextSelection
}) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [highlights, setHighlights] = useState<HighlightRange[]>([]);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ 
    show: boolean; 
    position: ContextMenuPosition; 
    selectedText: string;
    hoveredAgent: string | null;
    submenuPosition: ContextMenuPosition | null;
    showQuestionInput: boolean;
    questionText: string;
    questionAgent: Agent | null;
  }>({
    show: false,
    position: { x: 0, y: 0 },
    selectedText: '',
    hoveredAgent: null,
    submenuPosition: null,
    showQuestionInput: false,
    questionText: '',
    questionAgent: null
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const questionInputRef = useRef<HTMLTextAreaElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node) &&
          (!submenuRef.current || !submenuRef.current.contains(event.target as Node))) {
        setContextMenu({ 
          show: false, 
          position: { x: 0, y: 0 }, 
          selectedText: '',
          hoveredAgent: null,
          submenuPosition: null,
          showQuestionInput: false,
          questionText: '',
          questionAgent: null
        });
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (contextMenu.showQuestionInput) {
          // If question input is open, just close it
          setContextMenu(prev => ({
            ...prev,
            showQuestionInput: false,
            questionText: '',
            questionAgent: null
          }));
        } else {
          // Otherwise close the entire menu
          setContextMenu({ 
            show: false, 
            position: { x: 0, y: 0 }, 
            selectedText: '',
            hoveredAgent: null,
            submenuPosition: null,
            showQuestionInput: false,
            questionText: '',
            questionAgent: null
          });
        }
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
  }, [contextMenu.show, contextMenu.showQuestionInput]);

  // Focus question input when it opens
  useEffect(() => {
    if (contextMenu.showQuestionInput && questionInputRef.current) {
      questionInputRef.current.focus();
    }
  }, [contextMenu.showQuestionInput]);

  // Cleanup hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleTextSelection = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selected = originalText.substring(start, end);
      
      setSelectedText(selected);
      setSelectionRange({ start, end });
      
      // Notify parent component about text selection
      if (onTextSelection) {
        onTextSelection(selected);
      }
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
        selectedText: textToUse,
        hoveredAgent: null,
        submenuPosition: null,
        showQuestionInput: false,
        questionText: '',
        questionAgent: null
      });
    }
  };

  const handleAgentHover = (agentId: string, event: React.MouseEvent) => {
    // Don't show submenu if question input is open
    if (contextMenu.showQuestionInput) return;

    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const submenuX = rect.right + 4; // Smaller gap for easier navigation
    const submenuY = rect.top;
    
    // Check if submenu would go off-screen and adjust position
    const submenuWidth = 180; // Approximate submenu width
    const submenuHeight = 140; // Height for 3 actions + header
    
    let adjustedX = submenuX;
    let adjustedY = submenuY;
    
    if (submenuX + submenuWidth > window.innerWidth) {
      adjustedX = rect.left - submenuWidth - 4; // Show on left side instead
    }
    
    if (submenuY + submenuHeight > window.innerHeight) {
      adjustedY = window.innerHeight - submenuHeight - 10;
    }

    // Immediate hover response for better UX
    setContextMenu(prev => ({
      ...prev,
      hoveredAgent: agentId,
      submenuPosition: { x: adjustedX, y: adjustedY }
    }));
  };

  const handleAgentLeave = (event: React.MouseEvent) => {
    // Don't hide submenu if question input is open
    if (contextMenu.showQuestionInput) return;

    // Check if mouse is moving towards the submenu area
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    // If mouse is moving towards the right (towards submenu), delay hiding
    const isMovingTowardsSubmenu = mouseX > rect.right - 10;
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Longer delay if moving towards submenu, shorter if moving away
    const delay = isMovingTowardsSubmenu ? 300 : 150;
    
    hoverTimeoutRef.current = setTimeout(() => {
      setContextMenu(prev => ({
        ...prev,
        hoveredAgent: null,
        submenuPosition: null
      }));
    }, delay);
  };

  const handleSubmenuEnter = () => {
    // Clear any pending hide timeout when entering submenu
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleSubmenuLeave = () => {
    // Don't hide submenu if question input is open
    if (contextMenu.showQuestionInput) return;

    // Immediate hide when leaving submenu
    setContextMenu(prev => ({
      ...prev,
      hoveredAgent: null,
      submenuPosition: null
    }));
  };

  const handleMenuContainerMouseLeave = () => {
    // Don't hide menu if question input is open
    if (contextMenu.showQuestionInput) return;

    // Only hide if not hovering over submenu
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      setContextMenu(prev => ({
        ...prev,
        hoveredAgent: null,
        submenuPosition: null
      }));
    }, 200);
  };

  const handleShowQuestionInput = (agent: Agent) => {
    setContextMenu(prev => ({
      ...prev,
      showQuestionInput: true,
      questionAgent: agent,
      questionText: '',
      hoveredAgent: null,
      submenuPosition: null
    }));
  };

  const handleQuestionSubmit = () => {
    if (!onSendMessage || !contextMenu.questionText.trim() || !contextMenu.questionAgent) return;

    // Format the question with the selected text
    const message = `I have a question about this text: "${contextMenu.selectedText}"\n\n${contextMenu.questionText.trim()}`;
    
    onSendMessage(message, [contextMenu.questionAgent.id], 'chat');
    
    // Close the entire context menu
    setContextMenu({ 
      show: false, 
      position: { x: 0, y: 0 }, 
      selectedText: '',
      hoveredAgent: null,
      submenuPosition: null,
      showQuestionInput: false,
      questionText: '',
      questionAgent: null
    });
  };

  const handleQuestionKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleQuestionSubmit();
    }
  };

  const handleAgentAction = (agent: Agent, action: 'feedback' | 'rewrite' | 'question') => {
    if (!onSendMessage || !contextMenu.selectedText) return;

    if (action === 'question') {
      handleShowQuestionInput(agent);
      return;
    }

    // Send the text directly with the correct message type for feedback/rewrite
    const message = contextMenu.selectedText;
    const messageType = action; // Use the action directly as the message type
    
    onSendMessage(message, [agent.id], messageType);
    setContextMenu({ 
      show: false, 
      position: { x: 0, y: 0 }, 
      selectedText: '',
      hoveredAgent: null,
      submenuPosition: null,
      showQuestionInput: false,
      questionText: '',
      questionAgent: null
    });
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

      {/* Two-Layer Context Menu with Question Input */}
      {contextMenu.show && (
        <div onMouseLeave={handleMenuContainerMouseLeave}>
          {/* Question Input Modal */}
          {contextMenu.showQuestionInput && contextMenu.questionAgent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white border-2 border-gray-800 rounded-lg shadow-lg w-full max-w-md">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-300 bg-gray-50">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{contextMenu.questionAgent.avatar}</span>
                    <span className="font-medium text-gray-800">Ask {contextMenu.questionAgent.name}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    About: "{contextMenu.selectedText.length > 40 
                      ? contextMenu.selectedText.substring(0, 40) + '...' 
                      : contextMenu.selectedText}"
                  </div>
                </div>

                {/* Question Input */}
                <div className="p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your question:
                  </label>
                  <textarea
                    ref={questionInputRef}
                    value={contextMenu.questionText}
                    onChange={(e) => setContextMenu(prev => ({ ...prev, questionText: e.target.value }))}
                    onKeyDown={handleQuestionKeyPress}
                    placeholder="What would you like to ask about this text?"
                    rows={4}
                    className="w-full p-3 border-2 border-gray-400 rounded-lg resize-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800 bg-white text-gray-700"
                  />
                  <div className="text-xs text-gray-500 mt-2">
                    Press Ctrl+Enter to send, or use the button below
                  </div>
                </div>

                {/* Actions */}
                <div className="px-4 py-3 border-t border-gray-300 bg-gray-50 flex justify-end space-x-3">
                  <button
                    onClick={() => setContextMenu(prev => ({ 
                      ...prev, 
                      showQuestionInput: false, 
                      questionText: '', 
                      questionAgent: null 
                    }))}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleQuestionSubmit}
                    disabled={!contextMenu.questionText.trim()}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Ask Question</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Menu - Agent List (hidden when question input is open) */}
          {!contextMenu.showQuestionInput && (
            <div
              ref={contextMenuRef}
              className="fixed bg-white border-2 border-gray-800 rounded-lg shadow-lg py-2 z-50 min-w-48"
              style={{
                left: `${Math.min(contextMenu.position.x, window.innerWidth - 200)}px`,
                top: `${Math.min(contextMenu.position.y, window.innerHeight - (selectedAgents.length * 50 + 80))}px`
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
                  Choose an agent to help
                </div>
              </div>

              {/* Agent List */}
              <div className="max-h-64 overflow-y-auto">
                {selectedAgents.map((agent) => (
                  <div 
                    key={agent.id} 
                    className="relative"
                    onMouseEnter={(e) => handleAgentHover(agent.id, e)}
                    onMouseLeave={handleAgentLeave}
                  >
                    <div className="px-4 py-3 hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{agent.avatar}</span>
                        <div>
                          <div className="font-medium text-gray-800 text-sm">{agent.name}</div>
                          <div className="text-xs text-gray-600">{agent.personality}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-gray-300 bg-gray-50">
                <div className="text-xs text-gray-500">
                  Hover over an agent to see actions
                </div>
              </div>
            </div>
          )}

          {/* Submenu - Actions (hidden when question input is open) */}
          {!contextMenu.showQuestionInput && contextMenu.hoveredAgent && contextMenu.submenuPosition && (
            <div
              ref={submenuRef}
              className="fixed bg-white border-2 border-gray-800 rounded-lg shadow-lg py-2 z-50 min-w-44"
              style={{
                left: `${contextMenu.submenuPosition.x}px`,
                top: `${contextMenu.submenuPosition.y}px`
              }}
              onMouseEnter={handleSubmenuEnter}
              onMouseLeave={handleSubmenuLeave}
            >
              {(() => {
                const agent = selectedAgents.find(a => a.id === contextMenu.hoveredAgent);
                if (!agent) return null;

                return (
                  <>
                    {/* Submenu Header */}
                    <div className="px-4 py-2 border-b border-gray-300 bg-gray-50">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{agent.avatar}</span>
                        <span className="font-medium text-gray-800 text-sm">{agent.name}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="py-1">
                      <button
                        onClick={() => handleAgentAction(agent, 'feedback')}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-100 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>Get Feedback</span>
                      </button>
                      <button
                        onClick={() => handleAgentAction(agent, 'rewrite')}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-100 transition-colors"
                      >
                        <Edit3 className="w-4 h-4 text-green-600" />
                        <span>Help Rewrite</span>
                      </button>
                      <button
                        onClick={() => handleAgentAction(agent, 'question')}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-100 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 text-purple-600" />
                        <span>Ask Question</span>
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};