import React from 'react';
import { 
  Tv, Volume2, Volume1, VolumeX, ChevronUp, ChevronDown, 
  ChevronLeft, ChevronRight, X, Power, Info, RotateCcw,
  Sparkles, Radio, Star, Maximize2, Search, Keyboard, Shield
} from 'lucide-react';

interface TvRemoteControlProps {
  onClose: () => void;
  onChannelUp: () => void;
  onChannelDown: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onMuteToggle: () => void;
  onNumberInput: (num: string) => void;
  onClear: () => void;
  activeBtn: string | null;
  onOpenKeyboard?: (mode?: 'search' | 'admin_login') => void;
}

export const TvRemoteControl: React.FC<TvRemoteControlProps> = ({
  onClose,
  onChannelUp,
  onChannelDown,
  onVolumeUp,
  onVolumeDown,
  onMuteToggle,
  onNumberInput,
  onClear,
  activeBtn,
  onOpenKeyboard,
}) => {
  return (
    <div 
      role="region"
      aria-label="Smart TV Remote Control"
      className="absolute top-3 right-3 sm:right-auto sm:left-4 z-40 w-72 sm:w-80 bg-gradient-to-b from-[#0e1628]/98 via-[#090e1c]/98 to-[#050812]/98 backdrop-blur-2xl border-2 border-cyan-500/40 rounded-[2.5rem] p-4 shadow-2xl shadow-cyan-950/60 flex flex-col gap-3 animate-in fade-in zoom-in-95 select-none"
    >
      {/* Remote Top Bezel & Power / LED Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/90 pb-2.5 pt-0.5 px-1">
        {/* Power Button */}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 border border-red-400/50 active:scale-90 transition cursor-pointer"
          title="Power / Close Remote"
        >
          <Power className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Center IR / Brand Name & Pulsing LED */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/80 rounded-full border border-slate-800 text-[10px] font-black tracking-widest text-cyan-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400" />
          <span>SMART TV REMOTE</span>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition cursor-pointer"
          title="Dismiss Remote"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top Quick Tools: KEYBOARD / SEARCH & ADMIN LOGIN */}
      {onOpenKeyboard && (
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onOpenKeyboard('search')}
            className="py-2 px-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95 transition cursor-pointer border border-cyan-400/40"
          >
            <Keyboard className="w-3.5 h-3.5 text-cyan-200" />
            <span>KEYBOARD</span>
          </button>

          <button
            onClick={() => onOpenKeyboard('admin_login')}
            className="py-2 px-2.5 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-white flex items-center justify-center gap-1.5 border border-amber-500/40 active:scale-95 transition cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>ADMIN</span>
          </button>
        </div>
      )}

      {/* Top Function Controls: MUTE | SOURCE | INFO */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          onClick={onMuteToggle}
          className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 border transition duration-200 active:scale-95 shadow-sm cursor-pointer ${
            activeBtn === 'mute'
              ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-200 scale-105 shadow-amber-400/50 font-black'
              : 'bg-[#121c33] text-amber-300 border-slate-700/80 hover:bg-amber-500 hover:text-slate-950'
          }`}
          title="Mute Audio (M)"
        >
          <VolumeX className="w-4 h-4" />
          <span>MUTE</span>
        </button>

        <button
          onClick={onClear}
          className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 border transition duration-200 active:scale-95 shadow-sm cursor-pointer ${
            activeBtn === 'clr'
              ? 'bg-red-500 text-white ring-2 ring-red-300 scale-105 font-black'
              : 'bg-[#121c33] text-rose-300 border-slate-700/80 hover:bg-rose-600 hover:text-white'
          }`}
          title="Clear Input / Reset (CLR)"
        >
          <RotateCcw className="w-4 h-4" />
          <span>CLR</span>
        </button>

        <button
          onClick={() => onNumberInput('0')}
          className="py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 border border-slate-700/80 bg-[#121c33] text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition duration-200 active:scale-95 shadow-sm cursor-pointer"
          title="TV Mode Quick Channel"
        >
          <Tv className="w-4 h-4" />
          <span>TV CH</span>
        </button>
      </div>

      {/* Rocker Controls: VOL (+/-) and CH (+/-) */}
      <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
        {/* VOL Rocker */}
        <div className="flex flex-col items-center gap-1.5 bg-[#0e1629] p-2 rounded-xl border border-slate-700/70 shadow-inner">
          <span className="text-[10px] font-extrabold text-slate-400 tracking-wider">VOLUME</span>
          <button
            onClick={onVolumeUp}
            className={`w-full py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1 border transition duration-200 active:scale-95 cursor-pointer ${
              activeBtn === 'vol-up'
                ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-200 scale-105 shadow-cyan-400/50'
                : 'bg-slate-800/90 text-cyan-300 border-slate-700 hover:bg-cyan-500 hover:text-slate-950'
            }`}
            title="Volume Up (+)"
          >
            <Volume2 className="w-4 h-4" /> VOL +
          </button>
          <button
            onClick={onVolumeDown}
            className={`w-full py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1 border transition duration-200 active:scale-95 cursor-pointer ${
              activeBtn === 'vol-down'
                ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-200 scale-105 shadow-cyan-400/50'
                : 'bg-slate-800/90 text-cyan-300 border-slate-700 hover:bg-cyan-500 hover:text-slate-950'
            }`}
            title="Volume Down (-)"
          >
            <Volume1 className="w-4 h-4" /> VOL -
          </button>
        </div>

        {/* CH Rocker */}
        <div className="flex flex-col items-center gap-1.5 bg-[#0e1629] p-2 rounded-xl border border-slate-700/70 shadow-inner">
          <span className="text-[10px] font-extrabold text-slate-400 tracking-wider">CHANNEL</span>
          <button
            onClick={onChannelUp}
            className={`w-full py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1 border transition duration-200 active:scale-95 shadow-md cursor-pointer ${
              activeBtn === 'ch-up'
                ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-200 scale-105 shadow-cyan-400/60'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-blue-500/60 hover:from-blue-500 hover:to-cyan-500'
            }`}
            title="Channel Up (CH ▲)"
          >
            <ChevronUp className="w-4 h-4" /> CH ▲
          </button>
          <button
            onClick={onChannelDown}
            className={`w-full py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1 border transition duration-200 active:scale-95 shadow-md cursor-pointer ${
              activeBtn === 'ch-down'
                ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-200 scale-105 shadow-cyan-400/60'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-blue-500/60 hover:from-blue-500 hover:to-cyan-500'
            }`}
            title="Channel Down (CH ▼)"
          >
            <ChevronDown className="w-4 h-4" /> CH ▼
          </button>
        </div>
      </div>

      {/* Ergonomic Circular Navigation D-Pad with 3D OK Button */}
      <div className="flex flex-col items-center justify-center py-2 bg-gradient-to-b from-slate-950/80 to-[#0a101f] rounded-2xl p-2.5 border border-slate-800 relative">
        <button
          onClick={onChannelUp}
          className="w-14 h-9 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 font-black text-xs flex items-center justify-center border border-slate-700 transition active:scale-90 shadow cursor-pointer"
          title="Navigate Up (CH ▲)"
        >
          <ChevronUp className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 my-1">
          <button
            onClick={onChannelDown}
            className="w-12 h-11 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 font-black text-xs flex items-center justify-center border border-slate-700 transition active:scale-90 shadow cursor-pointer"
            title="Navigate Left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => onNumberInput('1')}
            className="w-16 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg shadow-cyan-500/40 border-2 border-cyan-200 active:scale-90 transition cursor-pointer"
            title="OK / Select"
          >
            OK
          </button>

          <button
            onClick={onChannelUp}
            className="w-12 h-11 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 font-black text-xs flex items-center justify-center border border-slate-700 transition active:scale-90 shadow cursor-pointer"
            title="Navigate Right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={onChannelDown}
          className="w-14 h-9 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 font-black text-xs flex items-center justify-center border border-slate-700 transition active:scale-90 shadow cursor-pointer"
          title="Navigate Down (CH ▼)"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Numeric TV Keypad 0-9 */}
      <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/90 space-y-1.5">
        <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider text-center">
          Numeric Channel Keypad
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {[
            { n: '1', sub: '.,-' },
            { n: '2', sub: 'ABC' },
            { n: '3', sub: 'DEF' },
            { n: '4', sub: 'GHI' },
            { n: '5', sub: 'JKL' },
            { n: '6', sub: 'MNO' },
            { n: '7', sub: 'PQRS' },
            { n: '8', sub: 'TUV' },
            { n: '9', sub: 'WXYZ' }
          ].map(({ n, sub }) => (
            <button
              key={n}
              onClick={() => onNumberInput(n)}
              className={`py-2 rounded-xl border transition duration-200 active:scale-90 flex flex-col items-center justify-center cursor-pointer ${
                activeBtn === `num-${n}`
                  ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-200 scale-105 shadow-md shadow-cyan-400/50'
                  : 'bg-[#0f172a] text-white border-slate-800 hover:bg-cyan-500 hover:text-slate-950'
              }`}
            >
              <span className="text-sm font-black font-mono leading-none">{n}</span>
              <span className="text-[8px] text-slate-400 font-semibold group-hover:text-slate-950 leading-none mt-0.5">{sub}</span>
            </button>
          ))}

          {/* Bottom Keypad Row: CLR | 0 | ENTER */}
          <button
            onClick={onClear}
            className={`py-2 rounded-xl text-xs font-black border transition duration-200 active:scale-90 flex flex-col items-center justify-center cursor-pointer ${
              activeBtn === 'clr'
                ? 'bg-red-500 text-white ring-2 ring-red-300 scale-105'
                : 'bg-red-950/50 text-red-400 border-red-900/60 hover:bg-red-600 hover:text-white'
            }`}
          >
            <span className="leading-none">CLR</span>
            <span className="text-[8px] opacity-75 mt-0.5">RESET</span>
          </button>

          <button
            onClick={() => onNumberInput('0')}
            className={`py-2 rounded-xl border transition duration-200 active:scale-90 flex flex-col items-center justify-center cursor-pointer ${
              activeBtn === 'num-0'
                ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-200 scale-105 shadow-md shadow-cyan-400/50'
                : 'bg-[#0f172a] text-white border-slate-800 hover:bg-cyan-500 hover:text-slate-950'
            }`}
          >
            <span className="text-sm font-black font-mono leading-none">0</span>
            <span className="text-[8px] text-slate-400 font-semibold leading-none mt-0.5">SPACE</span>
          </button>

          <button
            onClick={() => onNumberInput('1')}
            className="py-2 rounded-xl text-xs font-black border border-cyan-500/40 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition duration-200 active:scale-90 flex flex-col items-center justify-center cursor-pointer"
          >
            <span className="leading-none">ENT</span>
            <span className="text-[8px] opacity-75 mt-0.5">GO</span>
          </button>
        </div>
      </div>
    </div>
  );
};

