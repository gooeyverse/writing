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
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';

function App() {
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>(['sophia']);
  const [originalText, setOriginalText] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agentsSectionCollapsed, setAgentsSectionCollapsed] = useState<boolean>(false);
  
  // Layout state - Chat panel now defaults to 33%
  const [editorWidth, setEditorWidth] = useState<number>(67);
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

  const handleSendMessage = async (message: string, mentionedAgentIds: string[], messageType: 'feedback' | 'chat' = 'chat') => {
    if (!message.trim()) return;

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
          
          // Determine response type based on message content and type
          if (messageType === 'feedback' || isRequestingFeedback(message)) {
            response = await TextRewriter.provideFeedback(message, agent);
          } else if (isRequestingRewrite(message)) {
            response = await TextRewriter.rewrite(message, agent);
          } else {
            // For general chat, provide conversational feedback/advice
            response = await TextRewriter.provideConversationalResponse(message, agent, chatMessages);
          }
          
          const agentMessage: ChatMessage = {
            id: `${agentId}-${Date.now()}-${Math.random()}`,
            type: 'agent',
            content: response,
            timestamp: new Date(),
            agentId,
            originalMessage: message,
            responseType: messageType === 'feedback' || isRequestingFeedback(message) ? 'feedback' : 
                         isRequestingRewrite(message) ? 'rewrite' : 'conversation'
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
    <div className="min-h-screen bg-white flex flex-col">
      <Header 
        onShowStats={() => {}}
        onShowSettings={() => {}}
        onCreateAgent={() => setCreateModalOpen(true)}
      />
      
      {/* Agents Horizontal Scroll Section - Collapsible */}
      <div className="bg-white border-b border-black flex-shrink-0">
        <div className="px-6 py-4">
          <button
            onClick={() => setAgentsSectionCollapsed(!agentsSectionCollapsed)}
            className="flex items-center justify-between w-full group"
          >
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-black">Your Writing Agents</h2>
              <span className="text-sm text-gray-600">
                {selectedAgentIds.length} of {agents.length} selected
              </span>
            </div>
            <div className="p-1 rounded-lg group-hover:bg-gray-100 transition-colors">
              {agentsSectionCollapsed ? (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              )}
            </div>
          </button>
        </div>
        
        {!agentsSectionCollapsed && (
          <div className="px-6 pb-6 relative">
            {/* Scrollable agents container with custom styled scrollbar */}
            <div 
              ref={agentsScrollRef}
              className="agents-scroll-container"
            >
              <div className="agents-scroll-content">
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
              </div>
            </div>
            
            {/* Arrow buttons positioned at bottom right */}
            <div className="absolute bottom-0 right-0 flex items-center space-x-2 bg-white p-2 rounded-tl-lg shadow-md">
              <button
                onClick={scrollLeft}
                className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
                title="Scroll left"
              >
                <ChevronLeft className="w-4 h-4 text-black" />
              </button>
              
              <button
                onClick={scrollRight}
                className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
                title="Scroll right"
              >
                <ChevronRight className="w-4 h-4 text-black" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Resizable Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Text Editor (Resizable) - Now defaults to 67% */}
        <ResizablePanel
          direction="horizontal"
          initialSize={editorWidth}
          minSize={30}
          maxSize={70}
          onResize={setEditorWidth}
          className="overflow-y-auto"
        >
          <div className="p-6 h-full">
            <TextEditor
              originalText={originalText}
              onOriginalChange={setOriginalText}
              onGetFeedback={handleGetFeedback}
              isProcessing={isProcessing}
              selectedAgents={selectedAgents}
              onSendMessage={handleSendMessage}
            />
          </div>
        </ResizablePanel>

        {/* Right Panel - Chat Interface (Resizable) - Now defaults to 33% */}
        <div className="flex-1 border-l border-black bg-white flex flex-col overflow-hidden">
          {/* Chat Messages Area (Resizable) */}
          <ResizablePanel
            direction="vertical"
            initialSize={chatHeight}
            minSize={40}
            maxSize={85}
            onResize={setChatHeight}
            className="flex flex-col"
          >
            <ChatPanel
              messages={chatMessages}
              agents={agents}
              selectedAgents={selectedAgents}
              onSendMessage={handleSendMessage}
              onFeedback={handleFeedback}
              isProcessing={isProcessing}
              showInputArea={false}
            />
          </ResizablePanel>

          {/* Chat Input Area (Fixed at bottom) */}
          <div className="flex-1 border-t-2 border-black bg-white">
            <ChatPanel
              messages={[]}
              agents={agents}
              selectedAgents={selectedAgents}
              onSendMessage={handleSendMessage}
              onFeedback={handleFeedback}
              isProcessing={isProcessing}
              showMessagesArea={false}
              showInputArea={true}
            />
          </div>
        </div>
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