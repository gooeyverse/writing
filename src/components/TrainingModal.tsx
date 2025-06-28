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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[95vh] flex flex-col border-2 border-black">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b-2 border-black flex-shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{agent.avatar}</span>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-black">
                Train {agent.name}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {agent.trainingData ? 'Update training data' : 'Add writing samples'} to improve {agent.name}'s style
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg flex-shrink-0 border border-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Training Status - Fixed */}
        <div className="px-4 sm:px-6 py-3 bg-gray-100 border-b border-gray-400 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-2">
            <span className="text-black">
              Currently {validSampleCount} training samples
            </span>
            {lastSaved && (
              <span className="text-gray-700 text-xs sm:text-sm">
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

        {/* Save Confirmation - Fixed */}
        {showSaveConfirmation && (
          <div className="px-4 sm:px-6 py-2 bg-gray-100 border-b border-gray-400 flex-shrink-0">
            <div className="flex items-center space-x-2 text-sm text-black">
              <Check className="w-4 h-4" />
              <span>Training data saved successfully!</span>
            </div>
          </div>
        )}

        {/* Tabs - Fixed */}
        <div className="flex border-b-2 border-black flex-shrink-0 overflow-x-auto">
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
              <BookOpen className="w-4 h-4" />
              <span>Style Preferences</span>
            </div>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            {activeTab === 'samples' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-gray-700 text-sm sm:text-base">
                    Add examples of writing you want {agent.name} to learn from. These can be your own writing or examples you admire.
                  </p>
                  <button
                    onClick={addSample}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap border-2 border-black"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Sample</span>
                  </button>
                </div>

                {samples.length === 0 && (
                  <div className="text-center py-8 sm:py-12 bg-gray-100 rounded-lg border border-gray-400">
                    <Upload className="w-8 sm:w-12 h-8 sm:h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-black mb-2">No samples yet</h3>
                    <p className="text-gray-600 mb-4 text-sm sm:text-base">Add your first writing sample to start training {agent.name}</p>
                    <button
                      onClick={addSample}
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors border-2 border-black"
                    >
                      Add First Sample
                    </button>
                  </div>
                )}

                <div className="space-y-6">
                  {samples.map((sample, index) => (
                    <div key={sample.id} className="bg-gray-100 rounded-lg p-4 sm:p-6 border border-gray-400">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-black">Sample {index + 1}</h3>
                        <button
                          onClick={() => removeSample(sample.id)}
                          className="p-1 text-gray-500 hover:text-black hover:bg-gray-200 rounded border border-gray-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">
                            Title (Optional)
                          </label>
                          <input
                            type="text"
                            value={sample.title}
                            onChange={(e) => updateSample(sample.id, 'title', e.target.value)}
                            placeholder="e.g., Welcome Email"
                            className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-black focus:border-black bg-white text-black"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-black mb-2">
                            Category
                          </label>
                          <select
                            value={sample.category}
                            onChange={(e) => updateSample(sample.id, 'category', e.target.value)}
                            className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-black focus:border-black bg-white text-black"
                          >
                            <option value="">Select category</option>
                            {sampleCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-black mb-2">
                            Source (Optional)
                          </label>
                          <input
                            type="text"
                            value={sample.source}
                            onChange={(e) => updateSample(sample.id, 'source', e.target.value)}
                            placeholder="e.g., Company newsletter"
                            className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-black focus:border-black bg-white text-black"
                          />
                        </div>
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
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium text-black mb-4">Style Preferences</h3>
                  <p className="text-gray-700 mb-6">
                    Set general preferences for how {agent.name} should approach rewriting tasks.
                  </p>
                </div>

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
                      Describe the overall tone you want {agent.name} to use
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 sm:p-6 border-t-2 border-black gap-4 flex-shrink-0">
          <div className="text-sm text-gray-600 order-2 sm:order-1">
            {activeTab === 'samples' && (
              <span>{validSampleCount} valid samples ready</span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 order-1 sm:order-2">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-black border-2 border-gray-400 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Done
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="w-full sm:w-auto px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-2 border-black"
            >
              Save Training Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};