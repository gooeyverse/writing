import React, { useState, useEffect } from 'react';
import { Plus, Zap, ZapOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  onShowStats: () => void;
  onShowSettings: () => void;
  onCreateAgent: () => void;
}

// Custom SVG Icon Component with increased stroke weight
const CustomIcon: React.FC<{ className?: string }> = ({ className = "w-16 h-16" }) => (
  <svg 
    className={className} 
    viewBox="0 0 100 100" 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="2"
    stroke="currentColor"
  >
    <path 
      d="m36.984 28.531c-15.727 16.68-19.137 31.102-19.184 40.359-0.042969 8.4492 2.625 14.219 3.6016 16.047 11.531-2.9102 22.395-15.035 25.309-18.496l-5.3633-3.1211c-0.35938-0.21094-0.55859-0.61719-0.5-1.0312 0.058594-0.41406 0.35547-0.75 0.76172-0.85547l11.418-2.9531c1.0508-0.26953 2.0039-0.89062 2.6797-1.7422l10.992-13.887-6.7266-1.4102c-0.42969-0.089844-0.75391-0.44531-0.80859-0.87891-0.054687-0.43359 0.17188-0.85547 0.56641-1.0508l11.742-5.7461c9.6133-10.223 10.633-22.996 10.723-26.5-14.465-0.8125-25.855 3.6406-33.871 13.246-6.1094 7.3203-7.8516 15.012-7.8672 15.09-0.10156 0.47266-0.51953 0.80469-1.0039 0.80469h-0.007813c-0.48437 0-0.90234-0.34375-1-0.82031l-1.4609-7.0586zm-16.094 58.613c-0.34375 0-0.67188-0.17188-0.86328-0.47266-0.17578-0.27344-4.3008-6.8008-4.2812-17.652 0.011718-6.3359 1.4492-12.844 4.2695-19.336 3.5078-8.0703 9.1758-16.141 16.848-23.992 0.26562-0.26953 0.66016-0.375 1.0234-0.26953s0.64062 0.40625 0.71875 0.77734l1.0586 5.1172c1.1797-3.0938 3.3477-7.6445 7.0859-12.121 3.7852-4.5312 8.3906-8.0312 13.691-10.398 6.6016-2.9492 14.297-4.1328 22.863-3.5195 0.52344 0.039062 0.93359 0.46094 0.95312 0.98438 0.007813 0.16797 0.14453 4.1875-1.1875 9.7891-1.2305 5.168-4 12.707-10.23 19.266-0.085938 0.085938-0.18359 0.16016-0.29297 0.21484l-9.2227 4.5117 5.4258 1.1367c0.34766 0.074218 0.63281 0.32031 0.75391 0.65625 0.12109 0.33594 0.058594 0.70703-0.16016 0.98828l-12.02 15.191c-0.95312 1.2031-2.293 2.0742-3.7773 2.457l-9 2.332 4.2461 2.4727c0.38672 0.22656 0.58594 0.67969 0.48438 1.1172-0.035156 0.15625-0.10547 0.30078-0.20312 0.41797-1.4219 1.793-14.031 17.277-27.957 20.309-0.074219 0.015625-0.14453 0.023437-0.21875 0.023437z" 
      fillRule="evenodd"
      strokeWidth="1.5"
    />
    <path 
      d="m19.578 94.879c-0.046875 0-0.089844-0.003906-0.13672-0.007812-0.5625-0.074219-0.95703-0.59375-0.88281-1.1523 0.33203-2.5 0.77734-5.125 1.3242-7.8047 5.793-28.43 25.977-50.941 41.883-64.816 0.42578-0.37109 1.0781-0.32812 1.4492 0.097656 0.375 0.42969 0.32812 1.0781-0.097656 1.4492-15.668 13.668-35.543 35.809-41.223 63.676-0.53516 2.6328-0.97266 5.2109-1.3008 7.6641-0.070312 0.51562-0.51172 0.89062-1.0156 0.89062z" 
      fillRule="evenodd"
      strokeWidth="1.5"
    />
    <path 
      d="m24.988 19.582m-0.77344 1.5938 1.2656 0.69141c0.17188 0.09375 0.3125 0.23437 0.41016 0.41016l0.69141 1.2656 0.69141-1.2656c0.09375-0.17188 0.23437-0.3125 0.40625-0.41016l1.2656-0.69141-1.2656-0.69141c-0.17188-0.09375-0.3125-0.23438-0.41016-0.41016l-0.69141-1.2656-0.69141 1.2656c-0.09375 0.17188-0.23438 0.3125-0.41016 0.41016l-1.2656 0.69141zm2.3672 5.5352c-0.375 0-0.72266-0.20703-0.90234-0.53516l-1.4492-2.6523-2.6523-1.4492c-0.32812-0.17969-0.53516-0.52344-0.53516-0.90234 0-0.375 0.20703-0.72266 0.53516-0.90234l2.6484-1.4492 1.4492-2.6484c0.17969-0.32812 0.52734-0.53516 0.90234-0.53516s0.72266 0.20703 0.90234 0.53516l1.4492 2.6523 2.6523 1.4492c0.32812 0.17969 0.53516 0.52344 0.53516 0.90234 0 0.375-0.20313 0.72266-0.53516 0.90234l-2.6523 1.4531-1.4492 2.6484c-0.17969 0.32812-0.52734 0.53516-0.90234 0.53516z" 
      fillRule="evenodd"
      strokeWidth="2"
    />
    <path 
      d="m64.824 62.566 1.2656 0.69531c0.17188 0.09375 0.3125 0.23438 0.40625 0.41016l0.69141 1.2656 0.69141-1.2656c0.09375-0.17188 0.23438-0.3125 0.41016-0.41016l1.2695-0.69531-1.2695-0.69141c-0.17187-0.09375-0.31641-0.23828-0.41016-0.41016l-0.69141-1.2656-0.69141 1.2656c-0.09375 0.17188-0.23438 0.3125-0.40625 0.41016zm2.3672 5.5391c-0.375 0-0.72266-0.20703-0.90234-0.53516l-1.4492-2.6484-2.6523-1.4492c-0.32812-0.17969-0.53516-0.52734-0.53516-0.90234s0.20312-0.72266 0.53516-0.90234l2.6523-1.4492 1.4492-2.6484c0.17969-0.32812 0.52734-0.53516 0.90234-0.53516s0.72266 0.20703 0.90234 0.53516l1.4492 2.6484 2.6523 1.4492c0.32813 0.17969 0.53516 0.52734 0.53516 0.90234s-0.20312 0.72266-0.53516 0.90234l-2.6523 1.4492-1.4492 2.6484c-0.17969 0.32812-0.52734 0.53516-0.90234 0.53516z" 
      fillRule="evenodd"
      strokeWidth="2"
    />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({ 
  onShowStats, 
  onShowSettings, 
  onCreateAgent
}) => {
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

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

  return (
    <header className="bg-white border-b-2 border-black px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CustomIcon className="w-16 h-16 text-black" />
          <div>
            <h1 className="text-2xl font-bold text-black typewriter-effect">Writing Agents</h1>
            <p className="text-sm text-gray-600">Train personalized AI agents to rewrite your text</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
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
        </div>
      </div>
    </header>
  );
};