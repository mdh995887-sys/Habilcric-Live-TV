import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, Play, Zap, Trophy, HelpCircle } from 'lucide-react';
import { Channel, Match } from '../types';

interface AISportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  matches: Match[];
  onTuneChannel: (channel: Channel) => void;
  currentServer: string;
}

export const AISportsModal: React.FC<AISportsModalProps> = ({
  isOpen,
  onClose,
  channels,
  matches,
  onTuneChannel,
  currentServer
}) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; actionChannel?: Channel }>>([
    {
      sender: 'ai',
      text: 'Hello! I am your AI Sports Assistant. Ask me about upcoming matches, match predictions, or which live channel to tune into right now!'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    '🏏 When is Bangladesh next cricket match?',
    '⚡ Find fastest live sports channel',
    '🏆 Pakistan vs India Asia Cup match stream',
    '📊 Predict winner for today match'
  ];

  const handleSend = (textToSend?: string) => {
    const q = (textToSend || query).trim();
    if (!q) return;

    setMessages((prev) => [...prev, { sender: 'user', text: q }]);
    setQuery('');
    setIsLoading(true);

    setTimeout(() => {
      const lower = q.toLowerCase();
      let responseText = '';
      let matchedChannel: Channel | undefined;

      if (lower.includes('bangladesh') || lower.includes('cricket') || lower.includes('t sports')) {
        matchedChannel = channels.find((c) => c.name.toLowerCase().includes('t sports') || c.category === 'sports');
        responseText = '🏏 Bangladesh cricket streams are broadcasting live on T Sports HD & GTV! The Asia Cup 2026 matches are streaming in high bitrate with low latency.';
      } else if (lower.includes('fast') || lower.includes('server') || lower.includes('speed')) {
        matchedChannel = channels.find((c) => (c.latencyMs || 50) < 100) || channels[0];
        responseText = `⚡ Server latency test complete! Your current server is ${currentServer}. The lowest latency stream right now is ${matchedChannel?.name || 'PTV Sports'} with ultra-low buffer time.`;
      } else if (lower.includes('predict') || lower.includes('win') || lower.includes('winner')) {
        responseText = '📊 AI Win Probability: Based on recent pitch conditions, team head-to-head records and bowling death-over economy, India holds a 58% win probability vs Pakistan, with spin bowling playing a decisive role in the middle overs.';
      } else if (lower.includes('india') || lower.includes('pakistan') || lower.includes('asia cup')) {
        matchedChannel = channels.find((c) => c.name.toLowerCase().includes('ptv') || c.name.toLowerCase().includes('a sports') || c.name.toLowerCase().includes('willow'));
        responseText = '🏆 Live coverage for India vs Pakistan Asia Cup is streaming on PTV Sports, A Sports HD, and Willow Sports.';
      } else {
        matchedChannel = channels.find((c) => c.name.toLowerCase().includes(lower)) || channels[0];
        responseText = `Here is the best live broadcast for "${q}". Tune in directly below to enjoy uninterrupted HD playback:`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: responseText,
          actionChannel: matchedChannel
        }
      ]);
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0e1320] border border-purple-500/40 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-900 px-5 py-4 border-b border-purple-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                Live TV AI Assistant
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Gemini Smart
                </span>
              </h2>
              <p className="text-xs text-slate-400">Match Insights, AI Predictions & Channel Tuner</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 flex gap-2 overflow-x-auto no-scrollbar">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="text-[11px] font-semibold text-purple-300 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/50 rounded-full px-3 py-1 whitespace-nowrap transition cursor-pointer shrink-0"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-purple-600 text-white font-medium rounded-tr-none'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none'
                }`}
              >
                {m.text}

                {/* Direct Channel Tune Action */}
                {m.actionChannel && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-bold text-white truncate">{m.actionChannel.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        onTuneChannel(m.actionChannel!);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-500/20 shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Watch Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold p-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Analyzing live matches and stream servers...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask AI: 'Who will win today?' or 'Fastest stream'..."
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500 transition"
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
