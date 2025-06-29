import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { AgentCard } from './components/AgentCard';
import { TextEditor } from './components/TextEditor';
import { ChatPanel } from './components/ChatPanel';
import { CreateAgentModal } from './components/CreateAgentModal';
import { ResizablePanel } from './components/ResizablePanel';
import { defaultAgents } from './data/agents';
import { TextRewriter } from './utils/rewriter';
import { Agent, TrainingData, ChatMessage } from './types';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Plus, MessageCircle, ChevronDoubleLeft, ChevronDoubleRight } from 'lucide-react';

function App() {
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>(['sophia']);
  const [originalText, setOriginalText] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agentsSectionCollapsed, setAgentsSectionCollapsed] = useState<boolean>(false);
  
  // Chat panel state - collapsed by default
  const [chatCollapsed, setChatCollapsed] = useState<boolean>(true);
  const [hasOpenedChatOnce, setHasOpenedChatOnce] = useState<boolean>(false);
  
  // Layout state - When chat is collapsed, editor takes full width
  const [editorWidth, setEditorWidth] = useState<number>(65);
  const [chatHeight, setChatHeight] = useState<number>(70);

  // Scroll control ref
  const agentsScrollRef = useRef<HTMLDivElement>(null);

  const selectedAgents = agents.filter(agent => selectedAgentIds.includes(agent.id));

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentIds(prev => {
      if (prev.includes(agentId)) {
        // Don't allow deselecting if it's the only selected agent
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== agentId);
      } else {
        return [...prev, agentId];
      }
    });
  };

  const handleSendMessage = async (message: string, mentionedAgentIds: string[], messageType: 'feedback' | 'chat' | 'rewrite' = 'chat') => {
    if (!message.trim()) return;

    // Open chat panel if it's collapsed and this is the first interaction
    if (chatCollapsed) {
      setChatCollapsed(false);
      setHasOpenedChatOnce(true);
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date(),
      mentionedAgents: mentionedAgentIds,
      messageType
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    // Determine which agents to respond
    const respondingAgentIds = mentionedAgentIds.length > 0 ? mentionedAgentIds : selectedAgentIds;
    
    // Generate responses from mentioned or selected agents
    for (const agentId of respondingAgentIds) {
      const agent = agents.find(a => a.id === agentId);
      if (agent) {
        try {
          let response: string;
          let responseType: 'feedback' | 'rewrite' | 'conversation' | 'error';
          
          // Determine response type based on message type and content
          if (messageType === 'rewrite') {
            response = await TextRewriter.rewrite(message, agent);
            responseType = 'rewrite';
          } else if (messageType === 'feedback' || isRequestingFeedback(message)) {
            response = await TextRewriter.provideFeedback(message, agent);
            responseType = 'feedback';
          } else if (isRequestingRewrite(message)) {
            response = await TextRewriter.rewrite(message, agent);
            responseType = 'rewrite';
          } else {
            // For general chat, provide conversational feedback/advice
            response = await TextRewriter.provideConversationalResponse(message, agent, chatMessages);
            responseType = 'conversation';
          }
          
          const agentMessage: ChatMessage = {
            id: `${agentId}-${Date.now()}-${Math.random()}`,
            type: 'agent',
            content: response,
            timestamp: new Date(),
            agentId,
            originalMessage: message,
            responseType
          };

          setChatMessages(prev => [...prev, agentMessage]);
          
          // Update agent statistics
          setAgents(prevAgents => 
            prevAgents.map(a => 
              a.id === agentId
                ? { ...a, totalRewrites: a.totalRewrites + 1 }
                : a
            )
          );
        } catch (error) {
          console.error(`Error getting response from agent ${agent.name}:`, error);
          
          // Add error message
          const errorMessage: ChatMessage = {
            id: `${agentId}-error-${Date.now()}-${Math.random()}`,
            type: 'agent',
            content: `Sorry, I encountered an error while processing your request. Please try again.`,
            timestamp: new Date(),
            agentId,
            originalMessage: message,
            responseType: 'error'
          };

          setChatMessages(prev => [...prev, errorMessage]);
        }

        // Add small delay between agent responses for better UX
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    setIsProcessing(false);
  };

  // Helper functions to detect message intent
  const isRequestingFeedback = (message: string): boolean => {
    const feedbackKeywords = [
      'feedback', 'analyze', 'review', 'critique', 'assess', 'evaluate', 
      'what do you think', 'how is this', 'thoughts on', 'opinion on',
      'check this', 'look at this', 'rate this', 'judge this'
    ];
    return feedbackKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  const isRequestingRewrite = (message: string): boolean => {
    const rewriteKeywords = [
      'rewrite', 'rephrase', 'reword', 'revise', 'edit', 'improve',
      'make it', 'change it to', 'turn this into', 'convert this',
      'make this more', 'make this less', 'simplify', 'formalize',
      'casualize', 'shorten', 'expand', 'professional version',
      'casual version', 'better version'
    ];
    return rewriteKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  const handleFeedback = (messageId: string, rating: 'positive' | 'negative') => {
    const message = chatMessages.find(m => m.id === messageId);
    if (!message || message.type !== 'agent') return;

    // Update agent accuracy based on feedback
    const accuracyChange = rating === 'positive' ? 0.5 : -0.3;
    
    setAgents(prevAgents =>
      prevAgents.map(agent =>
        agent.id === message.agentId
          ? { ...agent, accuracy: Math.max(0, Math.min(100, agent.accuracy + accuracyChange)) }
          : agent
      )
    );

    // Update the message with rating
    setChatMessages(prev =>
      prev.map(m =>
        m.id === messageId
          ? { ...m, rating: rating === 'positive' ? 1 : -1 }
          : m
      )
    );
  };

  const handleGetFeedback = async () => {
    if (!originalText.trim() || selectedAgentIds.length === 0) return;
    
    // Send message as feedback type but DON'T clear the text editor
    await handleSendMessage(originalText, [], 'feedback');
  };

  // Handle highlighting text for the first time - opens chat
  const handleFirstHighlight = () => {
    if (chatCollapsed && !hasOpenedChatOnce) {
      setChatCollapsed(false);
      setHasOpenedChatOnce(true);
    }
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setCreateModalOpen(true);
  };

  const handleDeleteAgent = (agentId: string) => {
    if (agents.length <= 1) return; // Don't delete the last agent
    
    setAgents(prevAgents => prevAgents.filter(agent => agent.id !== agentId));
    
    // Remove from selected agents if it was selected
    setSelectedAgentIds(prev => prev.filter(id => id !== agentId));
    
    // If no agents are selected after deletion, select the first remaining one
    const remainingAgents = agents.filter(agent => agent.id !== agentId);
    if (selectedAgentIds.includes(agentId) && selectedAgentIds.length === 1 && remainingAgents.length > 0) {
      setSelectedAgentIds([remainingAgents[0].id]);
    }
  };

  const handleCreateAgent = (agentData: Omit<Agent, 'id' | 'accuracy' | 'totalRewrites' | 'createdAt'>) => {
    const newAgent: Agent = {
      ...agentData,
      id: Date.now().toString(),
      accuracy: 75, // Starting accuracy
      totalRewrites: 0,
      createdAt: new Date()
    };
    
    setAgents(prevAgents => [...prevAgents, newAgent]);
  };

  const handleUpdateAgent = (agentData: Omit<Agent, 'id' | 'accuracy' | 'totalRewrites' | 'createdAt'>) => {
    if (!editingAgent) return;
    
    setAgents(prevAgents =>
      prevAgents.map(agent =>
        agent.id === editingAgent.id
          ? { ...agent, ...agentData }
          : agent
      )
    );
    
    setEditingAgent(null);
  };

  // Clear chat history function
  const handleClearChatHistory = () => {
    setChatMessages([]);
  };

  // Toggle chat panel
  const toggleChatPanel = () => {
    setChatCollapsed(!chatCollapsed);
    if (!chatCollapsed) {
      // If closing, mark as opened once
      setHasOpenedChatOnce(true);
    }
  };

  // Scroll control functions
  const scrollLeft = () => {
    if (agentsScrollRef.current) {
      agentsScrollRef.current.scrollBy({
        left: -320, // Scroll by approximately one agent card width
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (agentsScrollRef.current) {
      agentsScrollRef.current.scrollBy({
        left: 320, // Scroll by approximately one agent card width
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <Header 
        onShowStats={() => {}}
        onShowSettings={() => {}}
        onCreateAgent={() => setCreateModalOpen(true)}
      />
      
      {/* Agents Accordion Section - Light Gray Background */}
      <div className="bg-gray-100 flex-shrink-0">
        {/* Accordion Header - Always Visible */}
        <div className="px-6 py-4">
          <button
            onClick={() => setAgentsSectionCollapsed(!agentsSectionCollapsed)}
            className="flex items-center justify-between w-full group"
          >
            <div className="flex items-center space-x-4">
              <h2 className={`${agentsSectionCollapsed ? 'text-base font-normal' : 'text-xl font-semibold'} text-gray-800 transition-all duration-200`}>
                Your Writing Agents
              </h2>
              <span className="text-sm text-gray-600">
                {selectedAgentIds.length} of {agents.length} selected
              </span>
            </div>
            
            {/* Simple Chevron Button */}
            <div className="p-1 rounded-lg group-hover:bg-gray-200 transition-colors">
              {agentsSectionCollapsed ? (
                <ChevronDown className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
              ) : (
                <ChevronUp className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
              )}
            </div>
          </button>
        </div>
        
        {/* Accordion Content - Collapsible */}
        {!agentsSectionCollapsed && (
          <div className="px-6 pb-6 relative">
            {/* Scrollable agents container with custom styled scrollbar */}
            <div 
              ref={agentsScrollRef}
              className="agents-scroll-container"
            >
              <div className="agents-scroll-content">
                {/* Existing agents */}
                {agents.map(agent => (
                  <div key={agent.id} className="flex-shrink-0 w-80">
                    <AgentCard
                      agent={agent}
                      isSelected={selectedAgentIds.includes(agent.id)}
                      onSelect={() => handleAgentSelect(agent.id)}
                      onEdit={() => handleEditAgent(agent)}
                      onDelete={() => handleDeleteAgent(agent.id)}
                      multiSelect={true}
                    />
                  </div>
                ))}
                
                {/* Add New Agent Tile - With text */}
                <div className="flex-shrink-0 w-80">
                  <div
                    onClick={() => setCreateModalOpen(true)}
                    className="h-48 p-5 rounded-xl border-2 border-dashed border-gray-400 cursor-pointer transition-all duration-200 hover:border-gray-700 hover:bg-gray-50 group flex flex-col items-center justify-center bg-white"
                  >
                    <div className="w-16 h-16 rounded-full border-2 border-gray-400 group-hover:border-gray-700 flex items-center justify-center transition-colors bg-gray-100 group-hover:bg-gray-200 mb-4">
                      <Plus className="w-8 h-8 text-gray-600 group-hover:text-gray-800 transition-colors" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-700 group-hover:text-gray-800 transition-colors mb-1">
                        New Agent
                      </h3>
                      <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                        Create a custom writing assistant
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Arrow buttons positioned at bottom right */}
            <div className="absolute bottom-0 right-0 flex items-center space-x-2 bg-white p-2 rounded-tl-lg shadow-md">
              <button
                onClick={scrollLeft}
                className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
                title="Scroll left"
              >
                <ChevronLeft className="w-4 h-4 text-gray-800" />
              </button>
              
              <button
                onClick={scrollRight}
                className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
                title="Scroll right"
              >
                <ChevronRight className="w-4 h-4 text-gray-800" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Dynamic Layout based on chat state */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel - Text Editor */}
        {chatCollapsed ? (
          // When chat is collapsed, editor takes full width
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <div className="p-6 h-full">
                <TextEditor
                  originalText={originalText}
                  onOriginalChange={setOriginalText}
                  onGetFeedback={handleGetFeedback}
                  isProcessing={isProcessing}
                  selectedAgents={selectedAgents}
                  onSendMessage={handleSendMessage}
                  onFirstHighlight={handleFirstHighlight}
                />
              </div>
            </div>
          </div>
        ) : (
          // When chat is open, use resizable layout
          <ResizablePanel
            direction="horizontal"
            initialSize={editorWidth}
            minSize={30}
            maxSize={70}
            onResize={setEditorWidth}
            className="overflow-hidden"
          >
            <div className="h-full overflow-y-auto">
              <div className="p-6 h-full">
                <TextEditor
                  originalText={originalText}
                  onOriginalChange={setOriginalText}
                  onGetFeedback={handleGetFeedback}
                  isProcessing={isProcessing}
                  selectedAgents={selectedAgents}
                  onSendMessage={handleSendMessage}
                  onFirstHighlight={handleFirstHighlight}
                />
              </div>
            </div>
          </ResizablePanel>
        )}

        {/* Chat Panel Toggle Button - Always visible */}
        <div className="flex-shrink-0 flex flex-col">
          <button
            onClick={toggleChatPanel}
            className={`w-12 h-full bg-gray-100 hover:bg-gray-200 transition-colors flex flex-col items-center justify-center space-y-2 border-l border-gray-300 group ${
              chatCollapsed ? 'border-r border-gray-300' : ''
            }`}
            title={chatCollapsed ? 'Open chat panel' : 'Close chat panel'}
          >
            <div className="flex flex-col items-center space-y-1">
              {chatCollapsed ? (
                <ChevronDoubleLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
              ) : (
                <ChevronDoubleRight className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
              )}
              <MessageCircle className="w-4 h-4 text-gray-600 group-hover:text-gray-800 transition-colors" />
              {chatMessages.length > 0 && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </div>
            <div className="text-xs text-gray-600 group-hover:text-gray-800 transition-colors transform -rotate-90 whitespace-nowrap">
              {chatCollapsed ? 'Chat' : 'Hide'}
            </div>
          </button>
        </div>

        {/* Right Panel - Chat Interface (Only when not collapsed) */}
        {!chatCollapsed && (
          <div className="flex-1 border-l border-gray-800 bg-white flex flex-col overflow-hidden min-w-0">
            {/* Chat Messages Area (Resizable) */}
            <ResizablePanel
              direction="vertical"
              initialSize={chatHeight}
              minSize={40}
              maxSize={85}
              onResize={setChatHeight}
              className="flex flex-col overflow-hidden"
            >
              <ChatPanel
                messages={chatMessages}
                agents={agents}
                selectedAgents={selectedAgents}
                onSendMessage={handleSendMessage}
                onFeedback={handleFeedback}
                isProcessing={isProcessing}
                showInputArea={false}
                onClearChatHistory={handleClearChatHistory}
                isEmpty={chatMessages.length === 0}
              />
            </ResizablePanel>

            {/* Chat Input Area (Fixed at bottom) */}
            <div className="flex-shrink-0 border-t-2 border-gray-800 bg-white">
              <ChatPanel
                messages={[]}
                agents={agents}
                selectedAgents={selectedAgents}
                onSendMessage={handleSendMessage}
                onFeedback={handleFeedback}
                isProcessing={isProcessing}
                showMessagesArea={false}
                showInputArea={true}
                isEmpty={chatMessages.length === 0}
              />
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Agent Modal with Training */}
      <CreateAgentModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingAgent(null);
        }}
        onSave={editingAgent ? handleUpdateAgent : handleCreateAgent}
        editingAgent={editingAgent}
      />
    </div>
  );
}

export default App;