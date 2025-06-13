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
      
      <div className="flex">
        {/* Sidebar with Agents */}
        <div className="w-80 p-6 bg-white border-r border-gray-200 h-[calc(100vh-80px)] overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Writing Agents</h2>
          <div className="space-y-3">
            {agents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isSelected={selectedAgentId === agent.id}
                onSelect={() => setSelectedAgentId(agent.id)}
                onTrain={() => handleTrainAgent(agent)}
                onEdit={() => handleEditAgent(agent)}
                onDelete={() => handleDeleteAgent(agent.id)}
              />
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
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