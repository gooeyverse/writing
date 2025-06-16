import React from 'react';
import { Agent } from '../types';
import { Settings, Trash2, BookOpen, Check } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  isSelected: boolean;
  onSelect: () => void;
  onTrain: () => void;
  onEdit: () => void;
  onDelete: () => void;
  multiSelect?: boolean;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  isSelected,
  onSelect,
  onTrain,
  onEdit,
  onDelete,
  multiSelect = false
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  const hasTrainingData = agent.trainingData && agent.trainingData.samples.length > 0;

  return (
    <div
      className={`
        relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg group
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
        }
      `}
      onClick={onSelect}
    >
      {/* Selection indicator for multi-select */}
      {multiSelect && (
        <div className="absolute top-3 right-3 z-10">
          <div className={`
            w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
            ${isSelected 
              ? 'bg-blue-500 border-blue-500 text-white' 
              : 'border-gray-300 bg-white group-hover:border-blue-300'
            }
          `}>
            {isSelected && <Check className="w-4 h-4" />}
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">{agent.avatar}</div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{agent.name}</h3>
            <p className="text-sm text-gray-600">{agent.personality}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <span className="text-xs font-medium text-gray-700">{agent.accuracy}%</span>
            <div className={`w-2 h-2 rounded-full ${agent.active ? 'bg-green-400' : 'bg-gray-300'}`} />
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title="Edit agent"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
              title="Delete agent"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{agent.description}</p>
      
      {/* Training Status */}
      {hasTrainingData && (
        <div className="mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-3 h-3 text-green-600" />
            <span className="text-xs text-green-700 font-medium">
              Trained with {agent.trainingData!.samples.length} samples
            </span>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{agent.totalRewrites.toLocaleString()} rewrites</span>
        <span>Created {formatDate(agent.createdAt)}</span>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTrain();
          }}
          className={`w-full px-3 py-2 text-sm rounded-lg transition-colors ${
            hasTrainingData
              ? 'bg-blue-100 hover:bg-blue-200 text-blue-700'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          {hasTrainingData ? 'Update Training' : 'Train Agent'}
        </button>
      </div>
    </div>
  );
};