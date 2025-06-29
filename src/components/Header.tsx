import React, { useState, useEffect } from 'react';
import { Bot, Settings, BarChart3, Plus, Zap, ZapOff, MessageCircle, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  onShowStats: () => void;
  onShowSettings: () => void;
  onCreateAgent: () => void;
  onClearChatHistory?: () => void;
  chatMessageCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ 
  onShowStats, 
  onShowSettings, 
  onCreateAgent, 
  onClearChatHistory,
  chatMessageCount = 0
}) => {
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Test Supabase connection by calling a simple function
        const { error } = await supabase.functions.invoke('openai-rewrite', {
          body: { test: true }
        });
        
        // If we get a response (even an error), Supabase is connected
        setSupabaseStatus('connected');
      } catch (error) {
        console.error('Supabase connection test failed:', error);
        setSupabaseStatus('disconnected');
      }
    };

    checkConnection();
  }, []);

  const handleClearChat = () => {
    if (onClearChatHistory) {
      onClearChatHistory();
      setShowClearConfirm(false);
    }
  };

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
          {/* Chat History Status & Clear Button */}
          {chatMessageCount > 0 && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-3 py-1 rounded-lg border border-gray-400 bg-gray-100">
                <MessageCircle className="w-4 h-4 text-gray-600" />
                <span className="text-xs text-gray-700">
                  {chatMessageCount} messages
                </span>
              </div>
              
              {/* Clear Chat Button with Confirmation */}
              <div className="relative">
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-300"
                  title="Clear chat history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                {/* Confirmation Dropdown */}
                {showClearConfirm && (
                  <div className="absolute right-0 top-full mt-2 bg-white border-2 border-black rounded-lg shadow-lg p-4 z-50 min-w-64">
                    <div className="text-sm text-black mb-3">
                      <div className="font-medium mb-1">Clear chat history?</div>
                      <div className="text-gray-600">This will permanently delete all {chatMessageCount} messages.</div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleClearChat}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="px-3 py-1 bg-gray-200 text-black rounded text-sm hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Supabase Status Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg border border-gray-400 bg-gray-100">
            {supabaseStatus === 'checking' ? (
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" />
            ) : supabaseStatus === 'connected' ? (
              <Zap className="w-4 h-4 text-green-600" />
            ) : (
              <ZapOff className="w-4 h-4 text-red-600" />
            )}
            <span className="text-xs text-gray-700">
              {supabaseStatus === 'checking' ? 'Checking...' : 
               supabaseStatus === 'connected' ? 'AI Connected' : 'AI Disconnected'}
            </span>
          </div>

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
      
      {/* Click outside to close confirmation */}
      {showClearConfirm && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowClearConfirm(false)}
        />
      )}
    </header>
  );
};