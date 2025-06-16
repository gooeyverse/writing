import React, { useState, useRef, useEffect } from 'react';
import { Send, ThumbsUp, ThumbsDown, Copy, Download, MessageCircle, Bot } from 'lucide-react';
import { Agent, ChatMessage } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  agents: Agent[];
  selectedAgents: Agent[];
  onSendMessage: (message: string, mentionedAgentIds: string[]) => void;
  onFeedback: (messageId: string, rating: 'positive' | 'negative') => void;
  isProcessing: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  agents,
  selectedAgents,
  onSendMessage,
  onFeedback,
  isProcessing
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      const agent = agents.find(a => a.name.toLowerCase() === agentName.toLowerCase());
      if (agent) {
        mentionedAgentIds.push(agent.id);
      }
    });
    
    return mentionedAgentIds;
  };

  const handleSend = () => {
    if (!inputMessage.trim() || isProcessing) return;
    
    const mentionedAgentIds = extractMentions(inputMessage);
    onSendMessage(inputMessage, mentionedAgentIds);
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

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(mentionQuery)
  );

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <MessageCircle className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Agent Chat</h2>
            <p className="text-sm text-gray-600">
              Chat with your agents • Use @AgentName to mention specific agents
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
            <p className="text-gray-500 mb-4 max-w-sm">
              Send a message to get rewrites from your selected agents, or mention specific agents using @AgentName
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {selectedAgents.slice(0, 3).map(agent => (
                <div key={agent.id} className="flex items-center space-x-2 px-3 py-1 bg-blue-100 rounded-full text-sm text-blue-700">
                  <span>{agent.avatar}</span>
                  <span>{agent.name}</span>
                </div>
              ))}
              {selectedAgents.length > 3 && (
                <div className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                  +{selectedAgents.length - 3} more
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  {message.type === 'user' ? (
                    <div className="bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-blue-100">
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
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md shadow-sm">
                      <div className="px-4 py-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">{agents.find(a => a.id === message.agentId)?.avatar}</span>
                          <span className="font-medium text-gray-900">
                            {agents.find(a => a.id === message.agentId)?.name}
                          </span>
                          {message.rating && (
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              message.rating > 0 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {message.rating > 0 ? 'Liked' : 'Needs work'}
                            </div>
                          )}
                        </div>
                        <p className="text-gray-800 whitespace-pre-wrap mb-3">{message.content}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => copyToClipboard(message.content)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                              title="Copy"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => downloadText(message.content, `${agents.find(a => a.id === message.agentId)?.name.toLowerCase()}-response.txt`)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                              title="Download"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onFeedback(message.id, 'positive')}
                              className={`p-1 rounded transition-colors ${
                                message.rating === 1
                                  ? 'text-green-600 bg-green-50'
                                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                              }`}
                              title="Good response"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onFeedback(message.id, 'negative')}
                              className={`p-1 rounded transition-colors ${
                                message.rating === -1
                                  ? 'text-red-600 bg-red-50'
                                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
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
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">Agents are thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white relative">
        {/* Mention Suggestions */}
        {showSuggestions && filteredAgents.length > 0 && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
            {filteredAgents.map(agent => (
              <button
                key={agent.id}
                onClick={() => insertMention(agent.name)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
              >
                <span className="text-lg">{agent.avatar}</span>
                <div>
                  <div className="font-medium text-gray-900">{agent.name}</div>
                  <div className="text-xs text-gray-500">{agent.personality}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message... Use @AgentName to mention specific agents"
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32"
              rows={1}
              style={{ minHeight: '44px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isProcessing}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {selectedAgents.length > 0 && (
          <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
            <span>Default recipients:</span>
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
      </div>
    </div>
  );
};