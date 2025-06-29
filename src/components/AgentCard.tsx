import React from 'react';
import { Agent } from '../types';
import { Settings, Trash2, BookOpen } from 'lucide-react';
import { OpenPeepsAvatar } from './OpenPeepsAvatar';

interface AgentCardProps {
  agent: Agent;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  multiSelect?: boolean;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  multiSelect = false
}) => {
  const hasTrainingData = agent.trainingData && agent.trainingData.samples.length > 0;

  return (
    <div
      className={`
        relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg group h-48 flex flex-col
        ${isSelected 
          ? 'border-4 border-gray-700 bg-gray-100 shadow-lg' 
          : 'border-2 border-gray-400 bg-white hover:border-gray-700 hover:shadow-md'
        }
      `}
      onClick={onSelect}
    >
      {/* Selection indicator for multi-select - only show circle on hover when not selected */}
      {multiSelect && !isSelected && (
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-6 h-6 rounded-full border-2 border-gray-400 bg-white group-hover:border-gray-700" />
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <OpenPeepsAvatar variant={agent.avatar} size={48} />
          <div>
            <h3 className="font-semibold text-lg text-gray-800">{agent.name}</h3>
            <p className="text-sm text-gray-600">{agent.personality}</p>
          </div>
        </div>
        
        {/* Only show status dot for selected agents */}
        {isSelected && (
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${agent.active ? 'bg-gray-700' : 'bg-gray-400'}`} />
          </div>
        )}
      </div>
      
      {/* Description - flex-1 to take available space */}
      <div className="flex-1 mb-4">
        <p className="text-sm text-gray-700 line-clamp-3">{agent.description}</p>
      </div>
      
      {/* Training Status - Fixed at bottom */}
      <div className="mt-auto">
        {hasTrainingData && (
          <div className="mb-3 p-2 bg-gray-100 rounded-lg border border-gray-400">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-3 h-3 text-gray-700" />
              <span className="text-xs text-gray-700 font-medium">
                Trained with {agent.trainingData!.samples.length} samples
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Hover Action Buttons - Bottom Left */}
      <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 shadow-sm bg-white"
          title="Edit agent"
        >
          <Settings className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 shadow-sm bg-white"
          title="Delete agent"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};