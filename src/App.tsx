import React, { useState } from 'react';
import { Header } from './components/Header';
import { AgentCard } from './components/AgentCard';
import { TextEditor } from './components/TextEditor';
import { TrainingModal } from './components/TrainingModal';
import { CreateAgentModal } from './components/CreateAgentModal';
import { defaultAgents } from './data/agents';
import { TextRewriter } from './utils/rewriter';
import { Agent, TrainingData } from './types';

function App() {
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('sophia');
  const [originalText, setOriginalText] = useState<string>('');
  const [rewrittenText, setRewrittenText] = useState<string>('');
  const [isRewriting, setIsRewriting] = useState<boolean>(false);
  const [trainingModalOpen, setTrainingModalOpen] = useState<boolean>(false);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [trainingAgent, setTrainingAgent] = useState<Agent | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  const selectedAgent = agents.find(agent => agent.id === selectedAgentId) || agents[0];

  const handleRewrite = async () => {
    if (!originalText.trim()) return;

    setIsRewriting(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const rewritten = TextRewriter.rewrite(originalText, selectedAgent);
    setRewrittenText(rewritten);
    
    // Update agent statistics
    setAgents(prevAgents => 
      prevAgents.map(agent => 
        agent.id === selectedAgentId 
          ? { ...agent, totalRewrites: agent.totalRewrites + 1 }
          : agent
      )
    );
    
    setIsRewriting(false);
  };

  const handleFeedback = (rating: 'positive' | 'negative') => {
    // Update agent accuracy based on feedback
    const accuracyChange = rating === 'positive' ? 0.5 : -0.3;
    
    setAgents(prevAgents =>
      prevAgents.map(agent =>
        agent.id === selectedAgentId
          ? { ...agent, accuracy: Math.max(0, Math.min(100, agent.accuracy + accuracyChange)) }
          : agent
      )
    );
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
    
    // If we deleted the selected agent, select the first remaining one
    if (selectedAgentId === agentId) {
      const remainingAgents = agents.filter(agent => agent.id !== agentId);
      if (remainingAgents.length > 0) {
        setSelectedAgentId(remainingAgents[0].id);
      }
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

    // Don't close the modal automatically - let user continue adding samples
    // The modal will be closed when user clicks "Done" or "Close"
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onShowStats={() => {}}
        onShowSettings={() => {}}
        onCreateAgent={() => setCreateModalOpen(true)}
      />
      
      {/* Agents Horizontal Scroll Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Your Writing Agents</h2>
          <span className="text-sm text-gray-500">{agents.length} agents</span>
        </div>
        
        <div className="relative">
          <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
            {agents.map(agent => (
              <div key={agent.id} className="flex-shrink-0 w-80">
                <AgentCard
                  agent={agent}
                  isSelected={selectedAgentId === agent.id}
                  onSelect={() => setSelectedAgentId(agent.id)}
                  onTrain={() => handleTrainAgent(agent)}
                  onEdit={() => handleEditAgent(agent)}
                  onDelete={() => handleDeleteAgent(agent.id)}
                />
              </div>
            ))}
          </div>
          
          {/* Scroll indicators */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <TextEditor
          originalText={originalText}
          rewrittenText={rewrittenText}
          onOriginalChange={setOriginalText}
          onRewrite={handleRewrite}
          onFeedback={handleFeedback}
          isRewriting={isRewriting}
          selectedAgentName={selectedAgent.name}
          selectedAgentAvatar={selectedAgent.avatar}
        />
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