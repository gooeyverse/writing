import React, { useState } from 'react';
import { Header } from './components/Header';
import { AgentCard } from './components/AgentCard';
import { TextEditor } from './components/TextEditor';
import { ChatPanel } from './components/ChatPanel';
import { TrainingModal } from './components/TrainingModal';
import { CreateAgentModal } from './components/CreateAgentModal';
import { defaultAgents } from './data/agents';
import { TextRewriter } from './utils/rewriter';
import { Agent, TrainingData, ChatMessage } from './types';
import { ChevronDown, ChevronUp } from 'lucide-react';

function App() {
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>(['sophia']);
  const [originalText, setOriginalText] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [trainingModalOpen, setTrainingModalOpen] = useState<boolean>(false);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [trainingAgent, setTrainingAgent] = useState<Agent | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agentsSectionCollapsed, setAgentsSectionCollapsed] = useState<boolean>(false);

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

  const handleSendMessage = async (message: string, mentionedAgentIds: string[]) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date(),
      mentionedAgents: mentionedAgentIds
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Determine which agents to respond
    const respondingAgentIds = mentionedAgentIds.length > 0 ? mentionedAgentIds : selectedAgentIds;
    
    // Generate responses from mentioned or selected agents
    for (const agentId of respondingAgentIds) {
      const agent = agents.find(a => a.id === agentId);
      if (agent) {
        const rewritten = TextRewriter.rewrite(message, agent);
        
        const agentMessage: ChatMessage = {
          id: `${agentId}-${Date.now()}-${Math.random()}`,
          type: 'agent',
          content: rewritten,
          timestamp: new Date(),
          agentId,
          originalMessage: message
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

        // Add small delay between agent responses for better UX
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    setIsProcessing(false);
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

  const handleRewrite = async () => {
    if (!originalText.trim() || selectedAgentIds.length === 0) return;
    
    await handleSendMessage(originalText, []);
    setOriginalText(''); // Clear the text editor after sending
  };

  const handleTrainAgent = (agent: Agent) => {
    setTrainingAgent(agent);
    setTrainingModalOpen(true);
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

  const handleSaveTraining = (trainingData: TrainingData) => {
    if (!trainingAgent) return;
    
    // Save the training data to the agent
    const updatedTrainingData = {
      ...trainingData,
      lastUpdated: new Date()
    };
    
    // Update agent accuracy based on training data quality
    const sampleCount = trainingData.samples.length;
    const accuracyBoost = Math.min(8, sampleCount * 1.5); // More samples = better training
    
    setAgents(prevAgents =>
      prevAgents.map(agent =>
        agent.id === trainingAgent.id
          ? { 
              ...agent, 
              accuracy: Math.min(100, agent.accuracy + accuracyBoost),
              trainingData: updatedTrainingData
            }
          : agent
      )
    );
  };

  const handleCloseTrainingModal = () => {
    setTrainingModalOpen(false);
    setTrainingAgent(null);
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

  const handleSelectAll = () => {
    const activeAgents = agents.filter(agent => agent.active);
    setSelectedAgentIds(activeAgents.map(agent => agent.id));
  };

  const handleDeselectAll = () => {
    if (agents.length > 0) {
      setSelectedAgentIds([agents[0].id]); // Keep at least one selected
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        onShowStats={() => {}}
        onShowSettings={() => {}}
        onCreateAgent={() => setCreateModalOpen(true)}
      />
      
      {/* Agents Horizontal Scroll Section - Collapsible */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-6 py-4">
          <button
            onClick={() => setAgentsSectionCollapsed(!agentsSectionCollapsed)}
            className="flex items-center justify-between w-full group"
          >
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-800">Your Writing Agents</h2>
              <span className="text-sm text-gray-500">
                {selectedAgentIds.length} of {agents.length} selected
              </span>
            </div>
            <div className="flex items-center space-x-3">
              {!agentsSectionCollapsed && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAll();
                    }}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeselectAll();
                    }}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Select One
                  </button>
                </div>
              )}
              <div className="p-1 rounded-lg group-hover:bg-gray-100 transition-colors">
                {agentsSectionCollapsed ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </div>
          </button>
        </div>
        
        {!agentsSectionCollapsed && (
          <div className="px-6 pb-6">
            <div className="relative">
              <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                {agents.map(agent => (
                  <div key={agent.id} className="flex-shrink-0 w-80">
                    <AgentCard
                      agent={agent}
                      isSelected={selectedAgentIds.includes(agent.id)}
                      onSelect={() => handleAgentSelect(agent.id)}
                      onTrain={() => handleTrainAgent(agent)}
                      onEdit={() => handleEditAgent(agent)}
                      onDelete={() => handleDeleteAgent(agent.id)}
                      multiSelect={true}
                    />
                  </div>
                ))}
              </div>
              
              {/* Scroll indicators */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Text Editor */}
        <div className="flex-1 p-6 overflow-y-auto">
          <TextEditor
            originalText={originalText}
            onOriginalChange={setOriginalText}
            onRewrite={handleRewrite}
            isRewriting={isProcessing}
            selectedAgents={selectedAgents}
          />
        </div>

        {/* Right Panel - Chat Interface */}
        <div className="w-1/2 border-l border-gray-200 bg-white flex flex-col">
          <ChatPanel
            messages={chatMessages}
            agents={agents}
            selectedAgents={selectedAgents}
            onSendMessage={handleSendMessage}
            onFeedback={handleFeedback}
            isProcessing={isProcessing}
          />
        </div>
      </div>

      {/* Training Modal */}
      {trainingAgent && (
        <TrainingModal
          agent={trainingAgent}
          isOpen={trainingModalOpen}
          onClose={handleCloseTrainingModal}
          onSave={handleSaveTraining}
        />
      )}

      {/* Create/Edit Agent Modal */}
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