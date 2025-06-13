export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar: string; // emoji or avatar character
  personality: string;
  writingStyle: string;
  active: boolean;
  accuracy: number;
  totalRewrites: number;
  createdAt: Date;
  customInstructions?: string;
  trainingData?: TrainingData; // Add training data to agent
}

export interface RewriteResult {
  id: string;
  original: string;
  rewritten: string;
  agentId: string;
  timestamp: Date;
  rating?: number;
}

export interface WritingSample {
  id: string;
  text: string;
  title?: string;
  source?: string;
  category?: string;
  notes?: string;
  addedAt: Date;
}

export interface TrainingData {
  samples: WritingSample[];
  preferences: {
    tone: string;
    formality: 'formal' | 'casual' | 'mixed';
    length: 'concise' | 'detailed' | 'balanced';
    voice: 'active' | 'passive' | 'mixed';
  };
  lastUpdated: Date;
}