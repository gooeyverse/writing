import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Agent } from '../types';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: Omit<Agent, 'id' | 'accuracy' | 'totalRewrites' | 'createdAt'>) => void;
  editingAgent?: Agent | null;
}

const avatarOptions = [
  '👩‍💼', '👨‍💼', '🧑‍🎨', '👩‍🎨', '👨‍🎨', '🎯', '👩‍🏫', '👨‍🏫', 
  '🌙', '⭐', '🚀', '💡', '👩‍💻', '👨‍💻', '🧑‍💻', '📝', '✍️', '📚',
  '🎭', '🎪', '🎨', '🔬', '⚡', '🌟', '💫', '🦋', '🌺', '🍃'
];

export const CreateAgentModal: React.FC<CreateAgentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingAgent
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    avatar: '👤',
    personality: '',
    writingStyle: '',
    customInstructions: '',
    active: true
  });

  // Update form data when editingAgent changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingAgent) {
        setFormData({
          name: editingAgent.name,
          description: editingAgent.description,
          avatar: editingAgent.avatar,
          personality: editingAgent.personality,
          writingStyle: editingAgent.writingStyle,
          customInstructions: editingAgent.customInstructions || '',
          active: editingAgent.active
        });
      } else {
        // Reset form for new agent
        setFormData({
          name: '',
          description: '',
          avatar: '👤',
          personality: '',
          writingStyle: '',
          customInstructions: '',
          active: true
        });
      }
    }
  }, [isOpen, editingAgent]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) return;
    
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden border-2 border-black">
        <div className="flex items-center justify-between p-6 border-b-2 border-black">
          <h2 className="text-xl font-semibold text-black">
            {editingAgent ? 'Edit Agent' : 'Create New Agent'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg border border-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-6">
            {/* Avatar Selection */}
            <div>
              <label className="block text-sm font-medium text-black mb-3">
                Choose Avatar
              </label>
              <div className="grid grid-cols-10 gap-2">
                {avatarOptions.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar })}
                    className={`
                      p-2 text-2xl rounded-lg border-2 transition-all hover:scale-110
                      ${formData.avatar === avatar 
                        ? 'border-black bg-gray-100' 
                        : 'border-gray-400 hover:border-black'
                      }
                    `}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Agent Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sarah, Marcus, Dr. Smith"
                  className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-black focus:border-black bg-white text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Personality
                </label>
                <input
                  type="text"
                  value={formData.personality}
                  onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                  placeholder="e.g., Professional and polished"
                  className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-black focus:border-black bg-white text-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Description *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of what this agent does"
                className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-black focus:border-black bg-white text-black"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Writing Style
              </label>
              <input
                type="text"
                value={formData.writingStyle}
                onChange={(e) => setFormData({ ...formData, writingStyle: e.target.value })}
                placeholder="e.g., Formal business communication with clear structure"
                className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-black focus:border-black bg-white text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Custom Instructions
              </label>
              <textarea
                value={formData.customInstructions}
                onChange={(e) => setFormData({ ...formData, customInstructions: e.target.value })}
                placeholder="Specific instructions for how this agent should rewrite text..."
                rows={4}
                className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-black focus:border-black resize-none bg-white text-black"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="mr-3 w-4 h-4 text-black border-gray-400 rounded focus:ring-black"
              />
              <label htmlFor="active" className="text-sm text-black">
                Agent is active and available for use
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t-2 border-gray-300">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-black border-2 border-gray-400 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors border-2 border-black"
            >
              {editingAgent ? 'Update Agent' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};