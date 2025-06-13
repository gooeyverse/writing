import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, BookOpen, Link, FileText, Check } from 'lucide-react';
import { Agent, WritingSample, TrainingData } from '../types';

interface TrainingModalProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
  onSave: (trainingData: TrainingData) => void;
}

export const TrainingModal: React.FC<TrainingModalProps> = ({
  agent,
  isOpen,
  onClose,
  onSave
}) => {
  const [samples, setSamples] = useState<WritingSample[]>([]);
  const [preferences, setPreferences] = useState({
    tone: '',
    formality: 'mixed' as const,
    length: 'balanced' as const,
    voice: 'mixed' as const
  });
  const [activeTab, setActiveTab] = useState<'samples' | 'preferences'>('samples');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  // Load existing training data when modal opens
  useEffect(() => {
    if (isOpen && agent.trainingData) {
      setSamples(agent.trainingData.samples || []);
      setPreferences(agent.trainingData.preferences || {
        tone: '',
        formality: 'mixed',
        length: 'balanced',
        voice: 'mixed'
      });
      setLastSaved(agent.trainingData.lastUpdated || null);
    } else if (isOpen) {
      // Reset to defaults if no training data exists
      setSamples([]);
      setPreferences({
        tone: '',
        formality: 'mixed',
        length: 'balanced',
        voice: 'mixed'
      });
      setLastSaved(null);
    }
    setShowSaveConfirmation(false);
  }, [isOpen, agent]);

  if (!isOpen) return null;

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

  const handleSave = () => {
    const validSamples = samples.filter(sample => sample.text.trim());
    const trainingData = {
      samples: validSamples,
      preferences,
      lastUpdated: new Date()
    };
    
    onSave(trainingData);
    setLastSaved(new Date());
    setShowSaveConfirmation(true);
    
    // Hide confirmation after 3 seconds
    setTimeout(() => {
      setShowSaveConfirmation(false);
    }, 3000);
  };

  const sampleCategories = [
    'Email', 'Blog Post', 'Social Media', 'Report', 'Proposal', 
    'Marketing Copy', 'Technical Writing', 'Creative Writing', 'Other'
  ];

  const validSampleCount = samples.filter(s => s.text.trim()).length;
  const canSave = validSampleCount > 0 || preferences.tone.trim();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{agent.avatar}</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Train {agent.name}
              </h2>
              <p className="text-sm text-gray-500">
                {agent.trainingData ? 'Update training data' : 'Add writing samples'} to improve {agent.name}'s style
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Training Status */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700">
              Currently {validSampleCount} training samples
            </span>
            {lastSaved && (
              <span className="text-blue-600">
                Last saved: {new Intl.DateTimeFormat('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                }).format(lastSaved)}
              </span>
            )}
          </div>
        </div>

        {/* Save Confirmation */}
        {showSaveConfirmation && (
          <div className="px-6 py-2 bg-green-50 border-b border-green-100">
            <div className="flex items-center space-x-2 text-sm text-green-700">
              <Check className="w-4 h-4" />
              <span>Training data saved successfully!</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('samples')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'samples'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Writing Samples ({validSampleCount})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'preferences'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>Style Preferences</span>
            </div>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'samples' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  Add examples of writing you want {agent.name} to learn from. These can be your own writing or examples you admire.
                </p>
                <button
                  onClick={addSample}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Sample</span>
                </button>
              </div>

              {samples.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No samples yet</h3>
                  <p className="text-gray-500 mb-4">Add your first writing sample to start training {agent.name}</p>
                  <button
                    onClick={addSample}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add First Sample
                  </button>
                </div>
              )}

              <div className="space-y-6">
                {samples.map((sample, index) => (
                  <div key={sample.id} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-800">Sample {index + 1}</h3>
                      <button
                        onClick={() => removeSample(sample.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title (Optional)
                        </label>
                        <input
                          type="text"
                          value={sample.title}
                          onChange={(e) => updateSample(sample.id, 'title', e.target.value)}
                          placeholder="e.g., Welcome Email"
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <select
                          value={sample.category}
                          onChange={(e) => updateSample(sample.id, 'category', e.target.value)}
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select category</option>
                          {sampleCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Source (Optional)
                        </label>
                        <input
                          type="text"
                          value={sample.source}
                          onChange={(e) => updateSample(sample.id, 'source', e.target.value)}
                          placeholder="e.g., Company newsletter"
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Writing Sample *
                      </label>
                      <textarea
                        value={sample.text}
                        onChange={(e) => updateSample(sample.id, 'text', e.target.value)}
                        placeholder="Paste your writing sample here..."
                        rows={6}
                        className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {sample.text.length} characters
                        </span>
                        <span className="text-xs text-gray-500">
                          ~{Math.ceil(sample.text.split(' ').length / 200)} min read
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={sample.notes}
                        onChange={(e) => updateSample(sample.id, 'notes', e.target.value)}
                        placeholder="What makes this writing effective? Any specific techniques to note?"
                        rows={2}
                        className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Style Preferences</h3>
                <p className="text-gray-600 mb-6">
                  Set general preferences for how {agent.name} should approach rewriting tasks.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
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
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
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
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
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
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Desired Tone
                  </label>
                  <input
                    type="text"
                    value={preferences.tone}
                    onChange={(e) => setPreferences({...preferences, tone: e.target.value})}
                    placeholder="e.g., Friendly but professional, Authoritative, Empathetic"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Describe the overall tone you want {agent.name} to use
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {activeTab === 'samples' && (
              <span>{validSampleCount} valid samples ready</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Done
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save Training Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};