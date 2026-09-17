import React, { useEffect, useState } from 'react';
import { Channel, AppSettings } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { TvRemoteControl } from './TvRemoteControl';
import { TvOnScreenKeyboard, TvKeyboardMode } from './TvOnScreenKeyboard';
import { 
  Tv, ArrowLeft, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Volume2, VolumeX, Volume1, Maximize2, Radio, Activity, Grid, 
  Settings, Sliders, Power, List, Search, Keyboard, Shield, KeyRound
} from 'lucide-react';
import { getCleanChannelLogo } from '../utils/channelLogos';
import { useTranslation } from '../contexts/LanguageContext';

interface SmartTvViewProps {
  channels: Channel[];
  currentChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  onExitTvMode: () => void;
  appSettings: AppSettings;
  onOpenAdmin?: () => void;
}

export const SmartTvView: React.FC<SmartTvViewProps> = ({
  channels,
  currentChannel,
  onSelectChannel,
  onExitTvMode,
  appSettings,
  onOpenAdmin,
}) => {
  const { language } = useTranslation();
  const [showChannelDrawer, setShowChannelDrawer] = useState(true);
  const [showVirtualRemote, setShowVirtualRemote] = useState(true);
  const [typedChannelNum, setTypedChannelNum] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [searchQuery, setSearchQuery] = useState('');

  // On-Screen TV Keyboard State
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardMode, setKeyboardMode] = useState<TvKeyboardMode>('search');
  const [keyboardTitle, setKeyboardTitle] = useState<string>('');

  const openSearchKeyboard = () => {
    setKeyboardMode('search');
    setKeyboardTitle('🔍 TV Channel Search & Direct Tune');
    setIsKeyboardOpen(true);
  };

  const openAdminKeyboard = () => {
    setKeyboardMode('admin_login');
    setKeyboardTitle('🔐 TV Admin Authentication Login');
    setIsKeyboardOpen(true);
  };

  // Clock updater
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleNextChannel = () => {
    const currentIndex = channels.findIndex(c => c.id === currentChannel?.id);
    if (currentIndex !== -1 && currentIndex < channels.length - 1) {
      onSelectChannel(channels[currentIndex + 1]);
    } else if (channels.length > 0) {
      onSelectChannel(channels[0]);
    }
  };

  const handlePrevChannel = () => {
    const currentIndex = channels.findIndex(c => c.id === currentChannel?.id);
    if (currentIndex > 0) {
      onSelectChannel(channels[currentIndex - 1]);
    } else if (channels.length > 0) {
      onSelectChannel(channels[channels.length - 1]);
    }
  };

  const [activeBtn, setActiveBtn] = useState<string | null>(null);

  const triggerFlash = (btnName: string) => {
    setActiveBtn(btnName);
    setTimeout(() => setActiveBtn(null), 2500);
  };

  const handlePrevChannelWithFlash = () => {
    triggerFlash('ch-up');
    handlePrevChannel();
  };

  const handleNextChannelWithFlash = () => {
    triggerFlash('ch-down');
    handleNextChannel();
  };

  const handleVolUp = () => {
    triggerFlash('vol-up');
    window.dispatchEvent(new CustomEvent('tv-volume-up'));
  };

  const handleVolDown = () => {
    triggerFlash('vol-down');
    window.dispatchEvent(new CustomEvent('tv-volume-down'));
  };

  const handleMuteToggle = () => {
    triggerFlash('mute');
    window.dispatchEvent(new CustomEvent('tv-mute-toggle'));
  };

  const handleNumberInput = (numStr: string) => {
    const nextNum = typedChannelNum + numStr;
    setTypedChannelNum(nextNum);

    const match = channels.find(c => c.channelNumber === parseInt(nextNum, 10));
    if (match) {
      onSelectChannel(match);
    }

    setTimeout(() => setTypedChannelNum(''), 2500);
  };

  const handleNumberInputWithFlash = (numStr: string) => {
    triggerFlash(`num-${numStr}`);
    handleNumberInput(numStr);
  };

  // Keyboard / D-Pad listener for physical TV Remote when keyboard modal is NOT active
  useEffect(() => {
    if (isKeyboardOpen) return; // Yield key events to on-screen keyboard when open

    const handleKeyDown = (e: KeyboardEvent) => {
      // Numbers for channel jump
      if (/^[0-9]$/.test(e.key)) {
        handleNumberInputWithFlash(e.key);
        return;
      }

      // Quick Search shortcut (Key S or /)
      if (e.key === 's' || e.key === 'S' || e.key === '/') {
        e.preventDefault();
        openSearchKeyboard();
        return;
      }

      // Quick Admin shortcut (Key A)
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        openAdminKeyboard();
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'ChannelUp') {
        e.preventDefault();
        handlePrevChannelWithFlash();
      } else if (e.key === 'ArrowDown' || e.key === 'ChannelDown') {
        e.preventDefault();
        handleNextChannelWithFlash();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleVolUp();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleVolDown();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleMuteToggle();
      } else if (e.key === 'Escape' || e.key === 'Back') {
        onExitTvMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [channels, currentChannel, typedChannelNum, onSelectChannel, onExitTvMode, isKeyboardOpen]);

  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.channelNumber.toString().includes(searchQuery)
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#040711] text-white flex flex-col overflow-hidden select-none">
      {/* Top TV Bar */}
      <div className="px-4 sm:px-6 py-3 bg-gradient-to-b from-black/95 via-black/70 to-transparent flex items-center justify-between z-20 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <button
            onClick={onExitTvMode}
            id="tv-exit-btn"
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-2 border border-slate-700 transition cursor-pointer active:scale-95 shadow"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>টিভি মুড ত্যাগ করুন (ESC)</span>
          </button>

          <div className="flex items-center gap-2 font-black text-sm text-cyan-400">
            <Radio className="w-4 h-4 animate-pulse text-red-500" />
            <span className="hidden sm:inline">{appSettings.appName}</span>
            <span className="text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-lg border border-yellow-500/30 text-xs">
              SMART TV REMOTE MODE
            </span>
          </div>
        </div>

        {/* Typed Channel Indicator Overlay */}
        {typedChannelNum && (
          <div className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-black text-lg rounded-2xl animate-bounce shadow-2xl border-2 border-white">
            CH {typedChannelNum}
          </div>
        )}

        {/* Right TV Controls & Real-time Clock */}
        <div className="flex items-center gap-2.5 sm:gap-3 text-sm">
          {/* On-Screen Keyboard Search Button */}
          <button
            onClick={openSearchKeyboard}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black flex items-center gap-1.5 transition border border-cyan-400/50 shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer"
            title="Open On-Screen D-Pad Keyboard (Key S)"
          >
            <Keyboard className="w-3.5 h-3.5 text-cyan-200" />
            <span>কীবোর্ড সার্চ (Search)</span>
          </button>

          {/* TV Admin Login Button */}
          <button
            onClick={openAdminKeyboard}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-white text-xs font-black flex items-center gap-1.5 transition border border-amber-500/40 active:scale-95 cursor-pointer"
            title="TV Admin Authentication"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>অ্যাডমিন</span>
          </button>

          {/* Virtual Remote Toggle Button */}
          <button
            onClick={() => setShowVirtualRemote(!showVirtualRemote)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition border cursor-pointer ${
              showVirtualRemote 
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20' 
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showVirtualRemote ? 'রিমোট বন্ধ' : 'রিমোট কন্ট্রোল'}</span>
          </button>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-bold text-slate-300 font-mono">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>4K Ultra HD</span>
          </div>

          <span className="font-mono font-bold text-white text-xs sm:text-sm bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-800">
            {currentTime}
          </span>
        </div>
      </div>

      {/* Main TV Screen Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left/Center Video Player Section */}
        <div className="flex-1 h-full flex flex-col justify-center items-center p-2 sm:p-4 bg-[#03060e] relative overflow-y-auto">
          <div className="w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80 my-auto">
            <VideoPlayer 
              channel={currentChannel}
              autoPlay={true}
              onNextChannel={handleNextChannel}
              onPrevChannel={handlePrevChannel}
            />
          </div>
        </div>

        {/* Floating / Docked Virtual TV Remote Overlay Component */}
        {showVirtualRemote && (
          <TvRemoteControl
            onClose={() => setShowVirtualRemote(false)}
            onChannelUp={handlePrevChannelWithFlash}
            onChannelDown={handleNextChannelWithFlash}
            onVolumeUp={handleVolUp}
            onVolumeDown={handleVolDown}
            onMuteToggle={handleMuteToggle}
            onNumberInput={handleNumberInputWithFlash}
            onClear={() => {
              triggerFlash('clr');
              setTypedChannelNum('');
            }}
            activeBtn={activeBtn}
            onOpenKeyboard={(mode) => {
              if (mode === 'admin_login') openAdminKeyboard();
              else openSearchKeyboard();
            }}
          />
        )}

        {/* Right TV Channel Quick-Picker Drawer (Screenshot 1 Style) */}
        {showChannelDrawer && (
          <div className="w-80 sm:w-96 bg-[#080d1a]/95 border-l border-slate-800/90 flex flex-col h-full z-20 backdrop-blur-xl shadow-2xl">
            {/* Drawer Top Header */}
            <div className="p-3 border-b border-slate-800/80 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowChannelDrawer(false)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                    title="Close Drawer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="font-black text-sm text-slate-100 flex items-center gap-1.5">
                    <span>Channels</span>
                    <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800/60">
                      {filteredChannels.length}
                    </span>
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={openSearchKeyboard}
                    className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white transition cursor-pointer border border-cyan-500/40"
                    title="Open On-Screen D-Pad Keyboard"
                  >
                    <Keyboard className="w-3.5 h-3.5 text-cyan-300" />
                  </button>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                    title="Clear Search"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (channels.length > 0) onSelectChannel(channels[0]);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                    title="Reload channels"
                  >
                    <Activity className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Search input if query active - click to open D-pad keyboard */}
              <div className="relative group">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'চ্যানেল খুঁজুন (ক্লিক করে কীবোর্ড খুলুন)' : 'Search channels (Click for keyboard)...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={openSearchKeyboard}
                  className="w-full pl-8 pr-8 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={openSearchKeyboard}
                  className="absolute right-2 top-2 text-slate-400 hover:text-cyan-400"
                  title="Open On-Screen Keyboard"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Horizontal Category Sub-Filter Pills (Screenshot 1 Style) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {[
                  { id: 'ALL', label: 'All Channels' },
                  { id: 'SPORTS', label: 'Sports Channels' },
                  { id: 'CRICKET', label: 'Cricket' },
                  { id: 'FOOTBALL', label: 'Football' },
                  { id: 'NEWS', label: 'News' },
                  { id: 'MOVIES', label: 'Movies' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if (cat.id === 'ALL') setSearchQuery('');
                      else setSearchQuery(cat.label);
                    }}
                    className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold shrink-0 transition border border-slate-700/60 cursor-pointer"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Tune Action Card (Screenshot 1 Style) */}
            <div className="p-2 border-b border-slate-800/80">
              <button
                onClick={() => {
                  if (channels.length > 0) onSelectChannel(channels[0]);
                }}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-950/80 to-slate-900 border border-cyan-500/30 hover:border-cyan-400/60 text-left flex items-center justify-between text-xs font-bold text-cyan-300 transition cursor-pointer group shadow"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Auto tune — from first channel</span>
                </div>
                <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition" />
              </button>
            </div>

            {/* Channel List Items (Exact Screenshot 1 Style) */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredChannels.map((chan) => {
                const isSelected = chan.id === currentChannel?.id;
                const cleanLogo = chan.logo || getCleanChannelLogo(chan);

                return (
                  <button
                    key={chan.id}
                    onClick={() => onSelectChannel(chan)}
                    className={`w-full p-2.5 rounded-2xl text-left transition flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-600/90 to-blue-600/90 text-white font-black shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-300'
                        : 'bg-[#0f172a]/90 hover:bg-[#152342] text-slate-300 border border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    {/* Channel Number */}
                    <span className={`font-mono text-xs px-2 py-1 rounded-xl font-black shrink-0 ${
                      isSelected ? 'bg-slate-950/50 text-yellow-300' : 'bg-slate-950 text-cyan-400 border border-slate-800'
                    }`}>
                      {chan.channelNumber.toString().padStart(2, '0')}
                    </span>

                    {/* Circular Logo Badge */}
                    <div className="w-10 h-10 rounded-full bg-slate-950 p-1 overflow-hidden shrink-0 border-2 border-slate-700 flex items-center justify-center shadow">
                      <img 
                        src={cleanLogo} 
                        alt={chan.name} 
                        className="w-full h-full object-contain rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Title and Subtitle */}
                    <div className="flex-1 truncate">
                      <div className="text-xs font-black truncate">{chan.name}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-slate-100' : 'text-slate-400'} truncate`}>
                        {chan.category} Channels • <span className="font-bold">{chan.quality || '1080p HD'}</span>
                      </div>
                    </div>

                    {/* Green Online Dot */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-yellow-300 animate-ping" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Remote Hints Bar */}
      <div className="px-4 sm:px-6 py-2.5 bg-[#080d1a] border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-cyan-400 rounded font-mono font-bold">▲ / ▼</kbd> {language === 'bn' ? 'পূর্ববর্তী / পরবর্তী চ্যানেল' : 'Prev / Next Channel'}</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-cyan-400 rounded font-mono font-bold">০ - ৯</kbd> {language === 'bn' ? 'সরাসরি চ্যানেল নাম্বার' : 'Direct Channel Number'}</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-cyan-400 rounded font-mono font-bold">S / কীবোর্ড</kbd> {language === 'bn' ? 'অন-স্ক্রিন কীবোর্ড' : 'On-Screen Keyboard'}</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-cyan-400 rounded font-mono font-bold">ESC</kbd> {language === 'bn' ? 'টিভি মুড বন্ধ' : 'Exit TV Mode'}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openSearchKeyboard}
            className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <Keyboard className="w-3 h-3" />
            <span>{language === 'bn' ? 'কীবোর্ড খুলুন' : 'Open Keyboard'}</span>
          </button>
          <span>•</span>
          <button
            onClick={() => setShowVirtualRemote(!showVirtualRemote)}
            className="text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
          >
            {showVirtualRemote ? (language === 'bn' ? 'রিমোট লুকান' : 'Hide Remote') : (language === 'bn' ? 'অন-স্ক্রিন রিমোট খুলুন' : 'Open On-screen Remote')}
          </button>
          <span>•</span>
          <button
            onClick={() => setShowChannelDrawer(!showChannelDrawer)}
            className="text-cyan-400 hover:underline cursor-pointer font-bold"
          >
            {showChannelDrawer ? (language === 'bn' ? 'চ্যানেল লিস্ট লুকান' : 'Hide Channel List') : (language === 'bn' ? 'চ্যানেল লিস্ট দেখুন' : 'Show Channel List')}
          </button>
        </div>
      </div>

      {/* Full-Screen D-Pad Navigable On-Screen TV Keyboard Overlay */}
      <TvOnScreenKeyboard
        isOpen={isKeyboardOpen}
        mode={keyboardMode}
        initialValue={searchQuery}
        placeholder={keyboardMode === 'search' ? 'Type channel name (e.g. T Sports, PTV, Sony)...' : 'Enter text...'}
        channels={channels}
        title={keyboardTitle}
        onClose={() => setIsKeyboardOpen(false)}
        onSubmit={(val) => {
          setSearchQuery(val);
          if (val) setShowChannelDrawer(true);
        }}
        onSelectChannel={(chan) => {
          onSelectChannel(chan);
          setIsKeyboardOpen(false);
        }}
        onAdminLoginSuccess={() => {
          if (onOpenAdmin) onOpenAdmin();
        }}
      />
    </div>
  );
};
