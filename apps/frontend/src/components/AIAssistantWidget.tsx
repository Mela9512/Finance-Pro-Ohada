import React, { useState } from 'react';
import { Bot, X, Send, Loader2, Sparkles } from 'lucide-react';
import { api, ApiError } from '../services/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantWidgetProps {
  currentScreen: string;
}

export const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({ currentScreen }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;
    const q = question.trim();
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setQuestion('');
    setError(null);
    setLoading(true);
    try {
      const { answer } = await api.aiChat(q, currentScreen);
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de l'appel à l'assistant IA");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-xl shadow-indigo-900/40 transition-all"
        title="Assistant IA"
      >
        <Bot className="w-5 h-5" />
        <span className="text-xs font-bold hidden sm:inline">Assistant IA</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[360px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-6rem)] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-[#0f2d5e] border-b border-blue-900/40">
        <div className="flex items-center gap-2 text-white">
          <Bot className="w-4 h-4" />
          <span className="text-xs font-bold">Assistant IA</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-blue-200 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 py-1.5 bg-slate-800/60 border-b border-slate-800 text-[10px] text-slate-400 flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-indigo-400" />
        <span>Contexte : {currentScreen}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-[11px] text-slate-500 italic p-2">
            Posez une question sur vos données réelles — Bilan, trésorerie, écarts budgétaires, clients en retard...
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-xs rounded-lg p-2.5 max-w-[90%] ${m.role === 'user' ? 'ml-auto bg-[#0f2d5e] text-white' : 'bg-slate-800 text-slate-100'}`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Réflexion en cours...
          </div>
        )}
      </div>

      {error && <div className="mx-3 mb-2 bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px] rounded-lg p-2">{error}</div>}

      <form onSubmit={handleAsk} className="flex items-center gap-2 p-3 border-t border-slate-800">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Votre question..."
          className="flex-1 glass-input rounded-lg px-3 py-2 text-xs"
        />
        <button type="submit" disabled={loading} className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
