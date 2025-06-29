import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Users, Highlighter, Undo, Redo, HelpCircle, Edit3, FileText, Type, Sparkles } from 'lucide-react';
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

  // Quick start suggestions
  const quickStartSuggestions = [
    "Write a professional email to a client...",
    "Draft a blog post about...",
    "Create a product description for...",
    "Write a social media caption for...",
    "Compose a cover letter for...",
    "Draft a press release about..."
  ];

  const handleQuickStart = (suggestion: string) => {
    onOriginalChange(suggestion);
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Position cursor at the end
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(suggestion.length, suggestion.length);
        }
      }, 0);
    }
  };

  // Calculate dynamic styling based on state
  const isEmpty = !originalText.trim();
  const isInteractive = isFocused || isHovered;
  
  return (
    <div className="flex flex-col h-full">
      {/* Rich Text Editor - Takes full height without header */}
      <div className="bg-white flex-1 flex flex-col min-h-0">
        {/* Enhanced Toolbar with Writing Indicator */}
        <div className="toolbar-container px-4 py-3 border-b border-gray-300 flex items-center justify-between bg-gray-50 flex-shrink-0">
          <div className="flex items-center space-x-1">
            {/* Writing Indicator */}
            <div className="flex items-center space-x-2 mr-4">
              <div className={`p-2 rounded-lg transition-all duration-200 ${
                isEmpty ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
              }`}>
                <Type className="w-4 h-4" />
              </div>
              <div className="text-sm">
                <div className={`font-medium transition-colors ${
                  isEmpty ? 'text-blue-600' : 'text-green-600'
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
        
        {/* Enhanced Text Area Container with Visual Cues */}
        <div 
          className={`p-6 flex-1 flex flex-col relative min-h-0 transition-all duration-200 ${
            isEmpty && !isFocused ? 'bg-gradient-to-br from-blue-50 to-indigo-50' : 'bg-white'
          }`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Empty State with Quick Start Options */}
          {isEmpty && !isFocused && (
            <div className="absolute inset-6 flex flex-col items-center justify-center text-center z-5 pointer-events-none">
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Type className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Start Writing Here</h3>
                <p className="text-gray-600 max-w-md">
                  Click anywhere in this area to begin typing. Your selected agents will help you improve your writing.
                </p>
              </div>
              
              {/* Quick Start Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl pointer-events-auto">
                {quickStartSuggestions.slice(0, 4).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickStart(suggestion)}
                    className="flex items-center space-x-2 px-4 py-3 bg-white border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-left group"
                  >
                    <Sparkles className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
                    <span className="text-gray-700 group-hover:text-gray-900 text-sm">{suggestion}</span>
                  </button>
                ))}
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                Or just click and start typing your own content
              </div>
            </div>
          )}

          {/* Enhanced Text Editor with Dynamic Styling */}
          <div 
            className={`relative flex-1 min-h-0 transition-all duration-200 ${
              isInteractive ? 'transform scale-[1.002]' : ''
            }`}
          >
            {/* Rich Text Background Layer - Shows highlighted text without == markers */}
            <div 
              className={`absolute inset-0 p-4 rounded-lg pointer-events-none overflow-hidden whitespace-pre-wrap break-words z-0 transition-all duration-200 ${
                isFocused ? 'ring-2 ring-blue-500 ring-opacity-50' : isHovered ? 'ring-1 ring-blue-300 ring-opacity-30' : ''
              }`}
              style={{ 
                fontFamily: 'JetBrains Mono, Courier New, monospace',
                fontSize: '14px',
                lineHeight: '1.6',
                color: 'transparent',
                backgroundColor: isFocused ? 'rgba(59, 130, 246, 0.02)' : 'transparent'
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

            {/* Editable Textarea Overlay with Enhanced Styling */}
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
              className={`relative w-full h-full p-4 rounded-lg resize-none bg-transparent text-black font-mono leading-relaxed focus:outline-none z-10 border-0 transition-all duration-200 ${
                isFocused 
                  ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 bg-opacity-30' 
                  : isHovered 
                    ? 'ring-1 ring-blue-300 ring-opacity-30 bg-blue-50 bg-opacity-10' 
                    : isEmpty 
                      ? 'bg-transparent cursor-text' 
                      : 'bg-transparent'
              }`}
              style={{ 
                fontFamily: 'JetBrains Mono, Courier New, monospace',
                fontSize: '14px',
                lineHeight: '1.6',
                color: isEmpty && !isFocused ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.8)'
              }}
            />

            {/* Typing Indicator */}
            {isFocused && (
              <div className="absolute top-2 right-2 flex items-center space-x-2 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs z-20">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Ready to type</span>
              </div>
            )}
          </div>

          {/* Enhanced Bottom Controls */}
          <div className="flex justify-between items-center mt-4 flex-shrink-0">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              {/* Character Count with Visual Indicator */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  originalText.length === 0 ? 'bg-gray-400' :
                  originalText.length < 100 ? 'bg-yellow-400' :
                  originalText.length < 500 ? 'bg-green-400' : 'bg-blue-400'
                }`} />
                <span>{originalText.length} characters</span>
                {originalText.length > 0 && (
                  <span className="text-gray-400">• {Math.ceil(originalText.split(' ').length / 200)} min read</span>
                )}
              </div>

              {selectedAgents.length > 1 && (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{selectedAgents.length} agents selected</span>
                </div>
              )}
            </div>
            
            {/* Enhanced Get Feedback Button */}
            <button
              onClick={onGetFeedback}
              disabled={!originalText.trim() || isProcessing || selectedAgents.length === 0}
              className={`px-6 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 border-2 ${
                !originalText.trim() || selectedAgents.length === 0
                  ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed'
                  : isProcessing
                    ? 'bg-blue-600 text-white border-blue-600 cursor-wait'
                    : 'bg-black text-white border-black hover:bg-gray-800 hover:scale-105 shadow-lg hover:shadow-xl'
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