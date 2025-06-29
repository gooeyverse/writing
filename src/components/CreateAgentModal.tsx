import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, BookOpen, FileText, Check, Settings } from 'lucide-react';
import { Agent, WritingSample, TrainingData } from '../types';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: Omit<Agent, 'id' | 'accuracy' | 'totalRewrites' | 'createdAt'>) => void;
  editingAgent?: Agent | null;
}

const avatarOptions = [
  '👩‍💼', '👨‍💼', '🧑‍🎨', '👩‍🎨', '👨‍🎨', '🎯', '👩‍🏫', '👨‍🏫', 
  '🌙', '⭐', '🚀', '💡', '👩‍💻', '👨‍💻', '🧑‍💻', '📝', '✍️', '📚',
  '🎭', '🎪', '🎨', '🔬', '⚡', '🌟', '💫', '🦋', '🌺', '🍃', '🌀'
];

export const CreateAgentModal: React.FC<CreateAgentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingAgent
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'samples' | 'preferences'>('basic');
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  
  // Basic agent data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    avatar: '👤',
    personality: '',
    writingStyle: '',
    customInstructions: '',
    active: true
  });

  // Training data
  const [samples, setSamples] = useState<WritingSample[]>([]);
  const [preferences, setPreferences] = useState({
    tone: '',
    formality: 'mixed' as const,
    length: 'balanced' as const,
    voice: 'mixed' as const
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

        // Load training data if it exists
        if (editingAgent.trainingData) {
          setSamples(editingAgent.trainingData.samples || []);
          setPreferences(editingAgent.trainingData.preferences || {
            tone: '',
            formality: 'mixed',
            length: 'balanced',
            voice: 'mixed'
          });
        } else {
          setSamples([]);
          setPreferences({
            tone: '',
            formality: 'mixed',
            length: 'balanced',
            voice: 'mixed'
          });
        }
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
        setSamples([]);
        setPreferences({
          tone: '',
          formality: 'mixed',
          length: 'balanced',
          voice: 'mixed'
        });
      }
      setActiveTab('basic');
      setShowSaveConfirmation(false);
    }
  }, [isOpen, editingAgent]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) return;
    
    // Prepare training data
    const validSamples = samples.filter(sample => sample.text.trim());
    const hasPreferences = preferences.tone.trim() || 
                          preferences.formality !== 'mixed' || 
                          preferences.length !== 'balanced' || 
                          preferences.voice !== 'mixed';
    
    const trainingData: TrainingData | undefined = (validSamples.length > 0 || hasPreferences) ? {
      samples: validSamples,
      preferences,
      lastUpdated: new Date()
    } : undefined;

    // Combine basic data with training data
    const agentData = {
      ...formData,
      trainingData
    };
    
    onSave(agentData);
    setShowSaveConfirmation(true);
    
    // Hide confirmation and close modal after 2 seconds
    setTimeout(() => {
      setShowSaveConfirmation(false);
      onClose();
    }, 2000);
  };

  // Training sample functions
  const addSample = () => {
    const newSample: WritingSample = {
      id: Date.now().toString(),
      text: '',
      title: '',
      source: '',
      category: '',
      notes: '',
      addedAt: new Date()
    };
    setSamples([...samples, newSample]);
  };

  const removeSample = (id: string) => {
    setSamples(samples.filter(sample => sample.id !== id));
  };

  const updateSample = (id: string, field: keyof WritingSample, value: string) => {
    setSamples(samples.map(sample =>
      sample.id === id ? { ...sample, [field]: value } : sample
    ));
  };

  const validSampleCount = samples.filter(s => s.text.trim()).length;
  const hasPreferences = preferences.tone.trim() || 
                        preferences.formality !== 'mixed' || 
                        preferences.length !== 'balanced' || 
                        preferences.voice !== 'mixed';
  const hasTrainingData = validSampleCount > 0 || hasPreferences;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-5xl h-full max-h-[95vh] flex flex-col border-2 border-black">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b-2 border-black flex-shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{formData.avatar}</span>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-black">
                {editingAgent ? `Edit ${editingAgent.name}` : 'Create New Agent'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {editingAgent ? 'Update agent settings and training' : 'Set up a new writing agent'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg border border-gray-300 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Save Confirmation - Fixed */}
        {showSaveConfirmation && (
          <div className="px-4 sm:px-6 py-3 bg-gray-100 border-b border-gray-400 flex-shrink-0">
            <div className="flex items-center space-x-2 text-sm text-black">
              <Check className="w-4 h-4" />
              <span>Agent {editingAgent ? 'updated' : 'created'} successfully!</span>
            </div>
          </div>
        )}

        {/* Tabs - Fixed */}
        <div className="flex border-b-2 border-black overflow-x-auto flex-shrink-0">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'basic'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">{formData.avatar}</span>
              <span>Basic Settings</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('samples')}
            className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'samples'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Writing Samples ({validSampleCount})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'preferences'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Style Preferences</span>
              {hasPreferences && (
                <div className="w-2 h-2 bg-black rounded-full" />
              )}
            </div>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            {/* Scrollable Content Area */}
            <div className="flex-1 p-4 sm:p-6">
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  {/* Avatar Selection */}
                  <div>
                    <label className="block text-sm font-medium text-black mb-3">
                      Choose Avatar
                    </label>
                    <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
                      {avatarOptions.map((avatar) => (
                        <button
                          key={avatar}
                          type="button"
                          onClick={() => setFormData({ ...formData, avatar })}
                          className={`
                            p-2 text-xl sm:text-2xl rounded-lg border-2 transition-all hover:scale-110
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
                      placeholder="Specific instructions for how this agent should approach writing tasks..."
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
              )}

              {activeTab === 'samples' && (
                <div className="space-y-6">
                  {/* Training Overview */}
                  <div className="bg-gray-100 rounded-lg p-4 border border-gray-400">
                    <h3 className="font-medium text-black mb-2">Writing Samples Overview</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Samples:</span>
                        <div className="font-medium text-black">{samples.length}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Valid Samples:</span>
                        <div className="font-medium text-black">{validSampleCount}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Training Status:</span>
                        <div className="font-medium text-black">
                          {validSampleCount > 0 ? 'Has samples' : 'No samples'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Writing Samples Section */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                      <div>
                        <h3 className="text-lg font-medium text-black">Writing Samples</h3>
                        <p className="text-sm text-gray-600">
                          Add examples of writing you want {formData.name || 'this agent'} to learn from
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addSample}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors border-2 border-black whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Sample</span>
                      </button>
                    </div>

                    {samples.length === 0 ? (
                      <div className="text-center py-8 sm:py-12 bg-gray-100 rounded-lg border border-gray-400">
                        <Upload className="w-8 sm:w-12 h-8 sm:h-12 text-gray-500 mx-auto mb-4" />
                        <h4 className="text-base sm:text-lg font-medium text-black mb-2">No samples yet</h4>
                        <p className="text-gray-600 mb-4 text-sm sm:text-base">Add writing samples to train {formData.name || 'this agent'}</p>
                        <button
                          type="button"
                          onClick={addSample}
                          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors border-2 border-black"
                        >
                          Add First Sample
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {samples.map((sample, index) => (
                          <div key={sample.id} className="bg-gray-100 rounded-lg p-4 sm:p-6 border border-gray-400">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium text-black">Sample {index + 1}</h4>
                              <button
                                type="button"
                                onClick={() => removeSample(sample.id)}
                                className="p-1 text-gray-500 hover:text-black hover:bg-gray-200 rounded border border-gray-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Title input only */}
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-black mb-2">
                                Title (Optional)
                              </label>
                              <input
                                type="text"
                                value={sample.title}
                                onChange={(e) => updateSample(sample.id, 'title', e.target.value)}
                                placeholder="e.g., Welcome Email, Blog Post Introduction, Product Description"
                                className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-black focus:border-black bg-white text-black"
                              />
                            </div>

                            <div className="mb-4">
                              <label className="block text-sm font-medium text-black mb-2">
                                Writing Sample *
                              </label>
                              <textarea
                                value={sample.text}
                                onChange={(e) => updateSample(sample.id, 'text', e.target.value)}
                                placeholder="Paste your writing sample here..."
                                rows={6}
                                className="w-full p-3 border-2 border-gray-400 rounded-lg resize-none focus:ring-2 focus:ring-black focus:border-black bg-white text-black"
                              />
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-xs text-gray-600">
                                  {sample.text.length} characters
                                </span>
                                <span className="text-xs text-gray-600">
                                  ~{Math.ceil(sample.text.split(' ').length / 200)} min read
                                </span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-black mb-2">
                                Notes (Optional)
                              </label>
                              <textarea
                                value={sample.notes}
                                onChange={(e) => updateSample(sample.id, 'notes', e.target.value)}
                                placeholder="What makes this writing effective? Any specific techniques to note?"
                                rows={2}
                                className="w-full p-3 border-2 border-gray-400 rounded-lg resize-none focus:ring-2 focus:ring-black focus:border-black bg-white text-black"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  {/* Preferences Overview */}
                  <div className="bg-gray-100 rounded-lg p-4 border border-gray-400">
                    <h3 className="font-medium text-black mb-2">Style Preferences Overview</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Formality:</span>
                        <div className="font-medium text-black capitalize">{preferences.formality}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Length:</span>
                        <div className="font-medium text-black capitalize">{preferences.length}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Voice:</span>
                        <div className="font-medium text-black capitalize">{preferences.voice}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Custom Tone:</span>
                        <div className="font-medium text-black">
                          {preferences.tone ? 'Set' : 'Not set'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Style Preferences Section */}
                  <div>
                    <h3 className="text-lg font-medium text-black mb-4">Style Preferences</h3>
                    <p className="text-gray-700 mb-6">
                      Set general preferences for how {formData.name || 'this agent'} should approach writing tasks.
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-sm font-medium text-black mb-3">
                          Formality Level
                        </label>
                        <div className="space-y-3">
                          {[
                            { value: 'formal', label: 'Formal', desc: 'Professional, structured language' },
                            { value: 'casual', label: 'Casual', desc: 'Conversational, relaxed tone' },
                            { value: 'mixed', label: 'Adaptive', desc: 'Match the context and audience' }
                          ].map(option => (
                            <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                              <input
                                type="radio"
                                name="formality"
                                value={option.value}
                                checked={preferences.formality === option.value}
                                onChange={(e) => setPreferences({...preferences, formality: e.target.value as any})}
                                className="mt-1 w-4 h-4 text-black border-gray-400 focus:ring-black"
                              />
                              <div>
                                <div className="font-medium text-black">{option.label}</div>
                                <div className="text-sm text-gray-600">{option.desc}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-3">
                          Writing Length
                        </label>
                        <div className="space-y-3">
                          {[
                            { value: 'concise', label: 'Concise', desc: 'Shorter, more direct writing' },
                            { value: 'detailed', label: 'Detailed', desc: 'Comprehensive, thorough explanations' },
                            { value: 'balanced', label: 'Balanced', desc: 'Appropriate length for context' }
                          ].map(option => (
                            <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                              <input
                                type="radio"
                                name="length"
                                value={option.value}
                                checked={preferences.length === option.value}
                                onChange={(e) => setPreferences({...preferences, length: e.target.value as any})}
                                className="mt-1 w-4 h-4 text-black border-gray-400 focus:ring-black"
                              />
                              <div>
                                <div className="font-medium text-black">{option.label}</div>
                                <div className="text-sm text-gray-600">{option.desc}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-3">
                          Voice Preference
                        </label>
                        <div className="space-y-3">
                          {[
                            { value: 'active', label: 'Active Voice', desc: 'Direct, action-oriented sentences' },
                            { value: 'passive', label: 'Passive Voice', desc: 'More formal, indirect approach' },
                            { value: 'mixed', label: 'Mixed', desc: 'Use what fits best' }
                          ].map(option => (
                            <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                              <input
                                type="radio"
                                name="voice"
                                value={option.value}
                                checked={preferences.voice === option.value}
                                onChange={(e) => setPreferences({...preferences, voice: e.target.value as any})}
                                className="mt-1 w-4 h-4 text-black border-gray-400 focus:ring-black"
                              />
                              <div>
                                <div className="font-medium text-black">{option.label}</div>
                                <div className="text-sm text-gray-600">{option.desc}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-3">
                          Desired Tone
                        </label>
                        <input
                          type="text"
                          value={preferences.tone}
                          onChange={(e) => setPreferences({...preferences, tone: e.target.value})}
                          placeholder="e.g., Friendly but professional, Authoritative, Empathetic"
                          className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-black focus:border-black bg-white text-black"
                        />
                        <p className="text-xs text-gray-600 mt-2">
                          Describe the overall tone you want {formData.name || 'this agent'} to use
                        </p>
                      </div>
                    </div>

                    {/* Additional Preferences */}
                    <div className="mt-8 p-4 bg-gray-100 rounded-lg border border-gray-400">
                      <h4 className="font-medium text-black mb-3">Quick Tips</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• <strong>Formality:</strong> Choose "Adaptive" if you want the agent to match different contexts</li>
                        <li>• <strong>Length:</strong> "Balanced" works well for most use cases</li>
                        <li>• <strong>Voice:</strong> Active voice is generally more engaging and direct</li>
                        <li>• <strong>Tone:</strong> Be specific about the emotional quality you want (e.g., "warm and encouraging")</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer - Fixed */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 sm:p-6 border-t-2 border-black gap-4 flex-shrink-0">
              <div className="text-sm text-gray-600 order-2 sm:order-1">
                {activeTab === 'samples' && (
                  <span>{validSampleCount} valid samples</span>
                )}
                {activeTab === 'preferences' && (
                  <span>{hasPreferences ? 'Preferences configured' : 'Using default preferences'}</span>
                )}
                {activeTab === 'basic' && (
                  <span>Basic agent configuration</span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 order-1 sm:order-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2 text-black border-2 border-gray-400 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formData.name.trim() || !formData.description.trim()}
                  className="w-full sm:w-auto px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-2 border-black"
                >
                  {editingAgent ? 'Update Agent' : 'Create Agent'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};