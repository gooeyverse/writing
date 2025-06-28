import React from 'react';
import { Bot, Settings, BarChart3, Plus } from 'lucide-react';

interface HeaderProps {
  onShowStats: () => void;
  onShowSettings: () => void;
  onCreateAgent: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onShowStats, onShowSettings, onCreateAgent }) => {
  return (
    <header className="bg-white border-b-2 border-black px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-black rounded-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black typewriter-effect">Writing Agents</h1>
            <p className="text-sm text-gray-600">Train personalized AI agents to rewrite your text</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={onCreateAgent}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2 border-2 border-black"
          >
            <Plus className="w-4 h-4" />
            <span>New Agent</span>
          </button>
          <button
            onClick={onShowStats}
            className="p-2 text-black hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-black"
            title="View statistics"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
          <button
            onClick={onShowSettings}
            className="p-2 text-black hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-black"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};