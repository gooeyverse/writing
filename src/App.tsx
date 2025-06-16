import React, { useState } from 'react';
import { Header } from './components/Header';
import { AgentCard } from './components/AgentCard';
import { TextEditor } from './components/TextEditor';
import { TrainingModal } from './components/TrainingModal';
import { CreateAgentModal } from './components/CreateAgentModal';
import { defaultAgents } from './data/agents';
import { TextRewriter } from './utils/rewriter';
import { Agent, TrainingData, RewriteResult } from './types';

function App() {
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>(['sophia']);
  const [originalText, setOriginalText] = useState<string>('');
  const [rewriteResults, setRewriteResults] = useState<RewriteResult[]>([]);
  const [isRewriting, setIsRewriting] = useState<boolean>(false);
  const [trainingModalOpen, setTrainingModalOpen] = useState<boolean>(false);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [trainingAgent, setTrainingAgent] = useState<Agent | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

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

  const handleRewrite = async () => {
    if (!originalText.trim() || selectedAgentIds.length === 0) return;

    setIsRewriting(true);
    setRewriteResults([]);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const results: RewriteResult[] = [];
    
    for (const agentId of selectedAgentIds) {
      const agent = agents.find(a => a.id === agentId);
      if (agent) {
        const rewritten = TextRewriter.rewrite(originalText, agent);
        results.push({
          id: `${agentId}-${Date.now()}`,
          original: originalText,
          rewritten,
          agentId,
          timestamp: new Date()
        });
      }
    }
    
    setRewriteResults(results);
    
    // Update agent statistics
    setAgents(prevAgents => 
      prevAgents.map(agent => 
        selectedAgentIds.includes(agent.id)
          ? { ...agent, totalRewrites: agent.totalRewrites + 1 }
          : agent
      )
    );
    
    setIsRewriting(false);
  };

  const handleFeedback = (resultId: string, rating: 'positive' | 'negative') => {
    const result = rewriteResults.find(r => r.id === resultId);
    if (!result) return;

    // Update agent accuracy based on feedback
    const accuracyChange = rating === 'positive' ? 0.5 : -0.3;
    
    setAgents(prevAgents =>
      prevAgents.map(agent =>
        agent.id === result.agentId
          ? { ...agent, accuracy: Math.max(0, Math.min(100, agent.accuracy + accuracyChange)) }
          : agent
      )
    );

    // Update the result with rating
    setRewriteResults(prev =>
      prev.map(r =>
        r.id === resultId
          ? { ...r, rating: rating === 'positive' ? 1 : -1 }
          : r
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
    <div className="min-h-screen bg-gray-50">
      <Header 
        onShowStats={() => {}}
        onShowSettings={() => {}}
        onCreateAgent={() => setCreateModalOpen(true)}
      />
      
      {/* Agents Horizontal Scroll Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-800">Your Writing Agents</h2>
            <span className="text-sm text-gray-500">
              {selectedAgentIds.length} of {agents.length} selected
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Select One
            </button>
          </div>
        </div>
        
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

      {/* Main Content */}
      <div className="p-6">
        <TextEditor
          originalText={originalText}
          rewriteResults={rewriteResults}
          onOriginalChange={setOriginalText}
          onRewrite={handleRewrite}
          onFeedback={handleFeedback}
          isRewriting={isRewriting}
          selectedAgents={selectedAgents}
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