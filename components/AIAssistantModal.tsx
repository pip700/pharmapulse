import React, { useState } from 'react';
import { X, Send, Bot, Loader2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);
    const answer = await geminiService.askAssistant(query);
    setResponse(answer);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Bot size={24} />
            <h2 className="font-bold text-lg">AI Pharmacist</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto bg-gray-50">
          {!response && !loading && (
            <div className="text-center text-gray-500 mt-8">
              <Bot size={48} className="mx-auto mb-4 text-indigo-300" />
              <p>Ask about drug interactions, side effects, or business tips.</p>
            </div>
          )}
          
          {loading && (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
          )}

          {response && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{response}</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="Ask me anything..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button
              onClick={handleAsk}
              disabled={loading || !query.trim()}
              className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
