import React, { useState, useRef, useEffect } from 'react';
import { Send, ThumbsUp, ThumbsDown, Copy, Download, MessageCircle, Sparkles, Edit3, MessageSquare, Trash2, FileText } from 'lucide-react';
import { Agent, ChatMessage } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  agents: Agent[];
  selectedAgents: Agent[];
  onSendMessage: (message: string, mentionedAgentIds: string[], messageType?: 'feedback' | 'chat' | 'rewrite') => void;
  onFeedback: (messageId: string, rating: 'positive' | 'negative') => void;
  isProcessing: boolean;
  showMessagesArea?: boolean;
  showInputArea?: boolean;
  onClearChatHistory?: () => void;
  isEmpty?: boolean;
  selectedText?: string; // Add selectedText prop
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  agents,
  selectedAgents,
  onSendMessage,
  onFeedback,
  isProcessing,
  showMessagesArea = true,
  showInputArea = true,
  onClearChatHistory,
  isEmpty = false,
  selectedText = '' // Default to empty string
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isInputHovered, setIsInputHovered] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (showMessagesArea) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showMessagesArea]);

  // Handle @ mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    
    setInputMessage(value);
    setCursorPosition(position);

    // Check for @ mentions
    const beforeCursor = value.substring(0, position);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1].toLowerCase());
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setMentionQuery('');
    }
  };

  const insertMention = (agentName: string) => {
    const beforeCursor = inputMessage.substring(0, cursorPosition);
    const afterCursor = inputMessage.substring(cursorPosition);
    
    // Replace the partial mention with the full mention
    const beforeMention = beforeCursor.replace(/@\w*$/, '');
    const newValue = `${beforeMention}@${agentName} ${afterCursor}`;
    
    setInputMessage(newValue);
    setShowSuggestions(false);
    setMentionQuery('');
    
    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus();
      const newPosition = beforeMention.length + agentName.length + 2;
      inputRef.current?.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const extractMentions = (message: string): string[] => {
    const mentions = message.match(/@(\w+)/g) || [];
    const mentionedAgentIds: string[] = [];
    
    mentions.forEach(mention => {
      const agentName = mention.substring(1); // Remove @
      // Only allow mentions of selected agents
      const agent = selectedAgents.find(a => a.name.toLowerCase() === agentName.toLowerCase());
      if (agent) {
        mentionedAgentIds.push(agent.id);
      }
    });
    
    return mentionedAgentIds;
  };

  const detectMessageIntent = (message: string): 'feedback' | 'chat' | 'rewrite' => {
    const feedbackKeywords = [
      'feedback', 'analyze', 'review', 'critique', 'assess', 'evaluate', 
      'what do you think', 'how is this', 'thoughts on', 'opinion on',
      'check this', 'look at this', 'rate this', 'judge this'
    ];
    
    const rewriteKeywords = [
      'rewrite', 'rephrase', 'reword', 'revise', 'edit', 'improve',
      'make it', 'change it to', 'turn this into', 'convert this',
      'make this more', 'make this less', 'simplify', 'formalize',
      'casualize', 'shorten', 'expand', 'professional version',
      'casual version', 'better version'
    ];
    
    const isRequestingFeedback = feedbackKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
    
    const isRequestingRewrite = rewriteKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (isRequestingRewrite) return 'rewrite';
    if (isRequestingFeedback) return 'feedback';
    return 'chat';
  };

  const handleSend = () => {
    if (!inputMessage.trim() || isProcessing) return;
    
    const mentionedAgentIds = extractMentions(inputMessage);
    const messageType = detectMessageIntent(inputMessage);
    
    onSendMessage(inputMessage, mentionedAgentIds, messageType);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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

  const handleClearChat = () => {
    if (onClearChatHistory) {
      onClearChatHistory();
      setShowClearConfirm(false);
    }
  };

  // Handle quick action clicks
  const handleQuickAction = (action: string, agent?: Agent) => {
    if (agent) {
      // Use selected text if available, otherwise use a generic message
      const textToUse = selectedText.trim() || 'my writing';
      
      let message = '';
      let messageType: 'feedback' | 'rewrite' | 'chat' = 'chat';
      
      if (action.includes('feedback')) {
        message = selectedText.trim() ? selectedText : 'Can you give me feedback on my writing?';
        messageType = 'feedback';
      } else if (action.includes('rewrite')) {
        message = selectedText.trim() ? selectedText : 'Can you help me rewrite this to be more professional?';
        messageType = 'rewrite';
      }
      
      onSendMessage(message, [agent.id], messageType);
    }
  };

  // Only show selected agents in mention suggestions
  const filteredAgents = selectedAgents.filter(agent => 
    agent.name.toLowerCase().includes(mentionQuery)
  );

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getResponseIcon = (responseType?: string) => {
    switch (responseType) {
      case 'feedback':
        return <MessageSquare className="w-3 h-3" />;
      case 'rewrite':
        return <Edit3 className="w-3 h-3" />;
      case 'conversation':
        return <MessageCircle className="w-3 h-3" />;
      default:
        return <Sparkles className="w-3 h-3" />;
    }
  };

  const getResponseLabel = (responseType?: string) => {
    switch (responseType) {
      case 'feedback':
        return 'Feedback';
      case 'rewrite':
        return 'Rewrite';
      case 'conversation':
        return 'Chat';
      default:
        return 'Response';
    }
  };

  // Calculate border weight - 2px default, 3px on hover/focus (1px increase)
  const borderWeight = (isInputHovered || isInputFocused) ? 3 : 2;

  // Quick action suggestions
  const quickActions = [
    { text: "Can you give me feedback on this?", icon: MessageSquare, type: 'feedback' as const },
    { text: "Please rewrite this to be more professional", icon: Edit3, type: 'rewrite' as const },
    { text: "Make this more casual and friendly", icon: MessageCircle, type: 'rewrite' as const },
    { text: "How can I improve this writing?", icon: Sparkles, type: 'feedback' as const }
  ];

  // Determine if we should show quick actions
  const shouldShowQuickActions = messages.length === 0 && selectedText.trim().length > 0 && selectedAgents.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Messages - Only show if messages area is visible */}
      {showMessagesArea && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {/* Clear Chat Button - Only show when there are messages */}
          {messages.length > 0 && (
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <div className="text-sm text-gray-600">
                {messages.length} messages in conversation
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center space-x-2 px-3 py-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-300 text-sm"
                  title="Clear chat history"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Chat</span>
                </button>
                
                {/* Confirmation Dropdown */}
                {showClearConfirm && (
                  <>
                    <div className="absolute right-0 top-full mt-2 bg-white border-2 border-gray-800 rounded-lg shadow-lg p-4 z-50 min-w-64">
                      <div className="text-sm text-gray-800 mb-3">
                        <div className="font-medium mb-1">Clear chat history?</div>
                        <div className="text-gray-600">This will permanently delete all {messages.length} messages.</div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleClearChat}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                        >
                          Clear All
                        </button>
                        <button
                          onClick={() => setShowClearConfirm(false)}
                          className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                    {/* Click outside to close */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowClearConfirm(false)}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Messages or Empty State with Conditional Quick Actions */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              {/* Only show quick actions when there's selected text */}
              {shouldShowQuickActions ? (
                <div className="w-full max-w-md space-y-4">
                  <div className="mb-6 text-center">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Selected Text Ready</h3>
                    <p className="text-gray-500 text-sm">
                      "{selectedText.length > 50 ? selectedText.substring(0, 50) + '...' : selectedText}"
                    </p>
                  </div>
                  
                  {selectedAgents.map(agent => (
                    <div key={agent.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-lg">{agent.avatar}</span>
                        <span className="font-medium text-gray-800">{agent.name}</span>
                        <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded-full">
                          {agent.personality}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleQuickAction('feedback', agent)}
                          className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:border-gray-800 hover:bg-gray-100 transition-colors text-sm text-left"
                        >
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-gray-800">Get Feedback</span>
                        </button>
                        <button
                          onClick={() => handleQuickAction('rewrite', agent)}
                          className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:border-gray-800 hover:bg-gray-100 transition-colors text-sm text-left"
                        >
                          <Edit3 className="w-4 h-4 text-green-600" />
                          <span className="text-gray-800">Help Rewrite</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-500 mb-2">Ready to Help</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    {selectedAgents.length === 0 
                      ? 'Select agents from the panel above to get started.'
                      : 'Select text in the editor or type a message below to begin.'
                    }
                  </p>
                  
                  {/* Selected agents indicator */}
                  {selectedAgents.length > 0 && (
                    <div className="mt-6 text-xs text-gray-500">
                      {selectedAgents.length} agent{selectedAgents.length > 1 ? 's' : ''} ready to help
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                    {message.type === 'user' ? (
                      <div className="bg-gray-800 text-white rounded-2xl rounded-br-md px-4 py-3 border-2 border-gray-800">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-300">
                          <span>{formatTime(message.timestamp)}</span>
                          {message.mentionedAgents && message.mentionedAgents.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <span>→</span>
                              {message.mentionedAgents.map(agentId => {
                                const agent = agents.find(a => a.id === agentId);
                                return agent ? (
                                  <span key={agentId} className="text-xs">{agent.avatar}</span>
                                ) : null;
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border-2 border-gray-400 rounded-2xl rounded-bl-md shadow-sm">
                        <div className="px-4 py-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg">{agents.find(a => a.id === message.agentId)?.avatar}</span>
                            <span className="font-medium text-gray-800">
                              {agents.find(a => a.id === message.agentId)?.name}
                            </span>
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full border border-gray-300 flex items-center space-x-1">
                              {getResponseIcon(message.responseType)}
                              <span>{getResponseLabel(message.responseType)}</span>
                            </span>
                            {message.rating && (
                              <div className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                message.rating > 0 
                                  ? 'bg-gray-100 text-gray-800 border-gray-400' 
                                  : 'bg-gray-200 text-gray-800 border-gray-500'
                              }`}>
                                {message.rating > 0 ? 'Helpful' : 'Needs work'}
                              </div>
                            )}
                          </div>
                          <div className="text-gray-700 whitespace-pre-wrap mb-3 prose prose-sm max-w-none">
                            {message.content.split('\n').map((line, index) => (
                              <div key={index}>
                                {line.startsWith('**') && line.endsWith('**') ? (
                                  <strong className="text-gray-800">{line.slice(2, -2)}</strong>
                                ) : line.startsWith('• ') ? (
                                  <div className="ml-4">• {line.slice(2)}</div>
                                ) : line.startsWith('- ') ? (
                                  <div className="ml-4">- {line.slice(2)}</div>
                                ) : (
                                  line
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">{formatTime(message.timestamp)}</span>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => copyToClipboard(message.content)}
                                className="p-1 text-gray-500 hover:text-gray-800 rounded border border-gray-300"
                                title="Copy response"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => downloadText(message.content, `${agents.find(a => a.id === message.agentId)?.name.toLowerCase()}-response.txt`)}
                                className="p-1 text-gray-500 hover:text-gray-800 rounded border border-gray-300"
                                title="Download response"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => onFeedback(message.id, 'positive')}
                                className={`p-1 rounded transition-colors border ${
                                  message.rating === 1
                                    ? 'text-gray-800 bg-gray-100 border-gray-400'
                                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 border-gray-300'
                                }`}
                                title="Helpful response"
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => onFeedback(message.id, 'negative')}
                                className={`p-1 rounded transition-colors border ${
                                  message.rating === -1
                                    ? 'text-gray-800 bg-gray-100 border-gray-400'
                                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 border-gray-300'
                                }`}
                                title="Needs improvement"
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 border border-gray-400">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-800 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-800 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-800 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-700">Agents are thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      )}

      {/* Input Area - Only show if input area is visible */}
      {showInputArea && (
        <div 
          className="flex flex-col p-4 transition-all duration-200 bg-gray-50"
          style={{
            borderTop: `${borderWeight}px solid ${(isInputHovered || isInputFocused) ? '#6b7280' : '#d1d5db'}`,
          }}
          onMouseEnter={() => setIsInputHovered(true)}
          onMouseLeave={() => setIsInputHovered(false)}
        >
          {/* Mention Suggestions - Only show selected agents */}
          {showSuggestions && filteredAgents.length > 0 && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border-2 border-gray-800 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
              <div className="px-3 py-2 text-xs text-gray-600 border-b border-gray-300 bg-gray-100">
                Selected agents only
              </div>
              {filteredAgents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => insertMention(agent.name)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-3 border-b border-gray-200 last:border-b-0"
                >
                  <span className="text-lg">{agent.avatar}</span>
                  <div>
                    <div className="font-medium text-gray-800">{agent.name}</div>
                    <div className="text-xs text-gray-600">{agent.personality}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Main input area */}
          <div className="flex flex-col space-y-3">
            {/* Text input */}
            <div className="relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder={`Ask for feedback, request rewrites, or chat naturally... Use @AgentName to mention specific agents (${selectedAgents.map(a => a.name).join(', ')})`}
                className="w-full h-24 p-4 border-2 border-gray-400 rounded-lg resize-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800 bg-white text-gray-700"
              />
            </div>
            
            {/* Bottom controls */}
            <div className="flex items-center justify-between">
              {/* Agent info and examples */}
              <div className="flex flex-col space-y-1">
                {selectedAgents.length > 0 && (
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <span>Available agents:</span>
                    {selectedAgents.slice(0, 3).map(agent => (
                      <span key={agent.id} className="flex items-center space-x-1">
                        <span>{agent.avatar}</span>
                        <span>{agent.name}</span>
                      </span>
                    ))}
                    {selectedAgents.length > 3 && (
                      <span>+{selectedAgents.length - 3} more</span>
                    )}
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  Try: "Give me feedback", "Rewrite this professionally", "Make it more casual"
                </div>
              </div>
              
              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={!inputMessage.trim() || isProcessing}
                className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 border-2 border-gray-800"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};