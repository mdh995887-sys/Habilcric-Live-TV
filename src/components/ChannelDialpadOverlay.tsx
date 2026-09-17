import React from 'react';
import { Channel } from '../types';
import { Tv, X, Delete, CornerDownLeft, Check, AlertCircle, Radio } from 'lucide-react';

interface ChannelDialpadOverlayProps {
  isOpen: boolean;
  digits: string;
  matchedChannel: Channel | null;
  status: 'idle' | 'tuning' | 'found' | 'not_found';
  onDigitPress: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onCommit: () => void;
  onClose: () => void;
  activeKeyHighlight?: string | null;
}

export const ChannelDialpadOverlay: React.FC<ChannelDialpadOverlayProps> = ({
  isOpen,
  digits,
  matchedChannel,
  status,
  onDigitPress,
  onBackspace,
  onClear,
  onCommit,
  onClose,
  activeKeyHighlight,
}) => {
  if (!isOpen) return null;

  // Split into 3 discrete digit slots
  const slot1 = digits[0] || '';
  const slot2 = digits[1] || '';
  const slot3 = digits[2] || '';

  const keypadButtons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];

  return (
    <aside
      aria-label="Channel Dialpad Tuning Overlay"
      className="fixed top-20 right-4 sm:right-8 z-50 w-72 sm:w-80 bg-[#0a0f1d]/95 backdrop-blur-xl border-2 border-cyan-500/50 rounded-2xl p-4 shadow-2xl shadow-cyan-950/70 text-white animate-in fade-in zoom-in-95 duration-200 select-none"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[11px] font-black tracking-wider text-cyan-400 uppercase font-mono">
            Direct Channel Tuner
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
            3-DIGIT
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition cursor-pointer"
            title="Close Dialpad (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3-Digit Display Boxes */}
      <div className="bg-[#050811] border border-cyan-500/30 rounded-xl p-3 mb-3 text-center relative overflow-hidden shadow-inner">
        {/* Subtle glowing background highlight */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />

        <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1.5 flex items-center justify-center gap-1">
          <Radio className="w-3 h-3 text-cyan-400" />
          <span>Enter Channel Number</span>
        </div>

        {/* 3 Large Digits */}
        <div className="flex items-center justify-center gap-2.5 my-1">
          {[slot1, slot2, slot3].map((char, index) => {
            const isCurrentSlot = digits.length === index;
            return (
              <div
                key={index}
                className={`w-12 h-14 rounded-xl flex items-center justify-center text-2xl font-mono font-black transition-all duration-150 ${
                  char
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/40 border border-cyan-300 scale-105'
                    : isCurrentSlot
                    ? 'bg-slate-900/80 border-2 border-cyan-400 text-cyan-400 animate-pulse ring-2 ring-cyan-500/20'
                    : 'bg-slate-900/40 border border-slate-800 text-slate-600'
                }`}
              >
                {char || (isCurrentSlot ? '_' : '-')}
              </div>
            );
          })}
        </div>

        {/* Matched Channel Preview / Status Indicator */}
        <div className="mt-2 min-h-[2.5rem] flex items-center justify-center text-xs">
          {status === 'tuning' && (
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Tuning to CH: {digits.padStart(3, '0')}...</span>
            </div>
          )}

          {status === 'found' && matchedChannel && (
            <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-lg w-full justify-center animate-in fade-in">
              <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span className="font-bold truncate max-w-[160px]">{matchedChannel.name}</span>
              <span className="text-[10px] bg-emerald-900/60 px-1 py-0.5 rounded font-mono">
                #{matchedChannel.channelNumber}
              </span>
            </div>
          )}

          {status === 'not_found' && (
            <div className="flex items-center gap-1.5 text-amber-400 font-bold bg-amber-950/40 border border-amber-500/40 px-2 py-1 rounded-lg text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Channel #{digits} not found</span>
            </div>
          )}

          {status === 'idle' && matchedChannel && (
            <div className="flex items-center gap-2 text-slate-300 w-full px-2 py-0.5 justify-center">
              {matchedChannel.logo ? (
                <img
                  src={matchedChannel.logo}
                  alt={matchedChannel.name}
                  className="w-5 h-5 object-contain rounded shrink-0 bg-slate-900 p-0.5"
                />
              ) : (
                <Tv className="w-4 h-4 text-cyan-400 shrink-0" />
              )}
              <span className="font-bold text-slate-200 truncate max-w-[140px] text-xs">
                {matchedChannel.name}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono font-bold">
                (CH {matchedChannel.channelNumber})
              </span>
            </div>
          )}

          {status === 'idle' && !matchedChannel && digits.length > 0 && (
            <span className="text-slate-400 text-[11px] font-mono">
              Press {3 - digits.length} more digit{3 - digits.length > 1 ? 's' : ''} to tune...
            </span>
          )}

          {status === 'idle' && digits.length === 0 && (
            <span className="text-slate-500 text-[11px]">
              Press 0-9 on your keyboard or dialpad
            </span>
          )}
        </div>
      </div>

      {/* On-Screen Numeric Keypad Grid */}
      <div className="space-y-1.5">
        {keypadButtons.map((row, rIdx) => (
          <div key={rIdx} className="grid grid-cols-3 gap-1.5">
            {row.map((num) => {
              const isHighlighted = activeKeyHighlight === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => onDigitPress(num)}
                  className={`h-10 rounded-xl text-sm font-mono font-bold transition-all duration-150 active:scale-95 flex items-center justify-center cursor-pointer border ${
                    isHighlighted
                      ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-200 scale-105 border-white shadow-lg shadow-cyan-400/50'
                      : 'bg-slate-900 hover:bg-slate-800 hover:border-cyan-500/50 text-white border-slate-800'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        ))}

        {/* Bottom Row: Backspace, 0, Commit / Tune */}
        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={onBackspace}
            disabled={digits.length === 0}
            className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 hover:border-slate-700 text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition flex items-center justify-center border border-slate-800 cursor-pointer active:scale-95"
            title="Backspace (Delete last digit)"
          >
            <Delete className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onDigitPress('0')}
            className={`h-10 rounded-xl text-sm font-mono font-bold transition-all duration-150 active:scale-95 flex items-center justify-center cursor-pointer border ${
              activeKeyHighlight === '0'
                ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-200 scale-105 border-white shadow-lg shadow-cyan-400/50'
                : 'bg-slate-900 hover:bg-slate-800 hover:border-cyan-500/50 text-white border-slate-800'
            }`}
          >
            0
          </button>

          <button
            type="button"
            onClick={onCommit}
            disabled={digits.length === 0}
            className="h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs disabled:opacity-40 disabled:pointer-events-none transition flex items-center justify-center gap-1 border border-cyan-400 shadow-md shadow-cyan-500/30 cursor-pointer active:scale-95"
            title="Tune to Channel (Enter)"
          >
            <CornerDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>TUNE</span>
          </button>
        </div>
      </div>

      {/* Helper Footer */}
      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <span className="px-1 py-0.2 bg-slate-800 text-slate-300 rounded border border-slate-700">0-9</span>
          <span>digits</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="px-1 py-0.2 bg-slate-800 text-slate-300 rounded border border-slate-700">Enter</span>
          <span>tune</span>
        </span>
        <button
          onClick={onClear}
          className="text-slate-500 hover:text-red-400 transition cursor-pointer"
        >
          Clear
        </button>
      </div>
    </aside>
  );
};
