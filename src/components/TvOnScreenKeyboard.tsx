import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Channel } from '../types';
import { 
  Search, Lock, User, KeyRound, X, Check, 
  Delete, CornerDownLeft, Sparkles, Tv, ArrowLeft,
  Eye, EyeOff, Shield, Radio, Volume2, Globe, Flame
} from 'lucide-react';
import { getCleanChannelLogo } from '../utils/channelLogos';

export type TvKeyboardMode = 'search' | 'admin_login' | 'text';

interface TvOnScreenKeyboardProps {
  isOpen: boolean;
  mode?: TvKeyboardMode;
  initialValue?: string;
  placeholder?: string;
  channels?: Channel[];
  onClose: () => void;
  onSubmit?: (value: string) => void;
  onSelectChannel?: (channel: Channel) => void;
  onAdminLoginSuccess?: () => void;
  title?: string;
}

// Audio synth for TV D-Pad clicks and key presses
function playTvClickSound(type: 'navigate' | 'press' | 'backspace' | 'success' | 'error' = 'navigate') {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'navigate') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'press') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587, now);
      osc.frequency.exponentialRampToValueAtTime(1174, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'backspace') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.07);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.start(now);
      osc.stop(now + 0.07);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.06);
      osc.frequency.setValueAtTime(783.99, now + 0.12);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'error') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.setValueAtTime(150, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    }
  } catch {
    // Ignore audio context autoplay restrictions
  }
}

export const TvOnScreenKeyboard: React.FC<TvOnScreenKeyboardProps> = ({
  isOpen,
  mode = 'search',
  initialValue = '',
  placeholder = 'Search channels or enter text...',
  channels = [],
  onClose,
  onSubmit,
  onSelectChannel,
  onAdminLoginSuccess,
  title,
}) => {
  // Input states
  const [inputValue, setInputValue] = useState(initialValue);
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [activeAdminField, setActiveAdminField] = useState<'username' | 'password'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminErrorMessage, setAdminErrorMessage] = useState('');
  const [adminSuccessMessage, setAdminSuccessMessage] = useState('');

  // Keyboard layout state: 'abc' (lowercase), 'ABC' (uppercase), '123' (numbers/symbols), 'bangla' (shortcuts)
  const [keyboardLayout, setKeyboardLayout] = useState<'abc' | 'ABC' | '123' | 'shortcuts'>('abc');
  
  // D-Pad Focus Matrix: 
  // focusArea: 'top_controls' | 'matched_channels' | 'quick_chips' | 'keyboard' | 'bottom_actions'
  const [focusArea, setFocusArea] = useState<'top_controls' | 'matched_channels' | 'quick_chips' | 'keyboard' | 'bottom_actions'>('keyboard');
  const [keyboardFocus, setKeyboardFocus] = useState<{ row: number; col: number }>({ row: 1, col: 0 });
  const [topControlIndex, setTopControlIndex] = useState<number>(0);
  const [matchedChannelIndex, setMatchedChannelIndex] = useState<number>(0);
  const [quickChipIndex, setQuickChipIndex] = useState<number>(0);
  const [bottomActionIndex, setBottomActionIndex] = useState<number>(1); // default on SPACE or SEARCH

  // Sync initial values
  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue);
      setAdminErrorMessage('');
      setAdminSuccessMessage('');
      setFocusArea('keyboard');
      setKeyboardFocus({ row: 1, col: 0 });
      playTvClickSound('navigate');
    }
  }, [isOpen, initialValue]);

  // Current target string for typing
  const currentTargetValue = mode === 'admin_login' 
    ? (activeAdminField === 'username' ? adminUsername : adminPassword)
    : inputValue;

  const setCurrentTargetValue = (val: string) => {
    if (mode === 'admin_login') {
      if (activeAdminField === 'username') setAdminUsername(val);
      else setAdminPassword(val);
    } else {
      setInputValue(val);
    }
  };

  // Keyboard Rows Definitions
  const layoutRows = useMemo(() => {
    if (keyboardLayout === '123') {
      return [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
        ['-', '_', '=', '+', '[', ']', '{', '}', '\\', '|'],
        [';', ':', "'", '"', ',', '.', '<', '>', '/', '?'],
      ];
    }

    if (keyboardLayout === 'shortcuts') {
      return [
        ['T Sports', 'PTV Sports', 'A Sports', 'Sony Ten', 'Star Sports'],
        ['Willow HD', 'EuroSport', 'Sky Sports', 'BeIN Sports', 'Geo Super'],
        ['Live Cricket', 'Football Live', 'BPL 2026', 'IPL 2026', 'FIFA'],
        ['admin', 'admin123', '@gmail.com', '.com', '.org'],
      ];
    }

    const isUpper = keyboardLayout === 'ABC';
    return [
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
      isUpper 
        ? ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']
        : ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      isUpper
        ? ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', '@']
        : ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', '@'],
      isUpper
        ? ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '.', '-', '_']
        : ['z', 'x', 'c', 'v', 'b', 'n', 'm', '.', '-', '_'],
    ];
  }, [keyboardLayout]);

  // Bottom action buttons definition
  const bottomActions = useMemo(() => {
    return [
      { id: 'mode_toggle', label: keyboardLayout === '123' ? 'ABC' : (keyboardLayout === 'shortcuts' ? 'ABC' : '123 / ?#'), icon: 'layout' },
      { id: 'caps_toggle', label: keyboardLayout === 'ABC' ? 'CAPS [ON]' : 'CAPS [OFF]', icon: 'caps' },
      { id: 'shortcuts_toggle', label: '⚡ SHORTCUTS', icon: 'zap' },
      { id: 'space', label: 'SPACE ␣', icon: 'space', wide: true },
      { id: 'backspace', label: '⌫ BACKSPACE', icon: 'backspace' },
      { id: 'clear', label: 'CLEAR ✕', icon: 'clear' },
      { 
        id: 'submit', 
        label: mode === 'admin_login' ? '🔐 LOGIN (ENTER)' : '🔍 SEARCH (ENTER)', 
        icon: 'submit',
        highlight: true 
      },
      { id: 'close', label: 'CLOSE [ESC]', icon: 'close' },
    ];
  }, [keyboardLayout, mode]);

  // Quick category search chips for TV Mode
  const quickSearchChips = useMemo(() => [
    'T Sports', 'PTV Sports', 'A Sports', 'Sony Sports', 'Star Sports', 'Cricket', 'Football', 'News', 'Movies'
  ], []);

  // Filtered channels in real-time
  const matchedChannels = useMemo(() => {
    if (mode !== 'search' || !inputValue.trim()) return [];
    const q = inputValue.toLowerCase().trim();
    return channels.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.channelNumber.toString().includes(q)
    ).slice(0, 8);
  }, [mode, inputValue, channels]);

  // Handle character insertion
  const handleKeyType = useCallback((char: string) => {
    playTvClickSound('press');
    setCurrentTargetValue(currentTargetValue + char);
  }, [currentTargetValue]);

  // Handle Backspace
  const handleBackspace = useCallback(() => {
    playTvClickSound('backspace');
    if (currentTargetValue.length > 0) {
      setCurrentTargetValue(currentTargetValue.slice(0, -1));
    }
  }, [currentTargetValue]);

  // Handle Clear
  const handleClear = useCallback(() => {
    playTvClickSound('backspace');
    setCurrentTargetValue('');
  }, []);

  // Handle Admin Login submission
  const handleAdminSubmit = async () => {
    if (!adminPassword) {
      playTvClickSound('error');
      setAdminErrorMessage('Please enter the admin password');
      return;
    }

    setAdminLoginLoading(true);
    setAdminErrorMessage('');
    setAdminSuccessMessage('');

    try {
      const { adminLogin } = await import('../utils/api');
      const res = await adminLogin(adminUsername, adminPassword);
      setAdminLoginLoading(false);

      if (res.authenticated) {
        playTvClickSound('success');
        setAdminSuccessMessage('Authentication Successful! Welcome Admin.');
        setTimeout(() => {
          if (onAdminLoginSuccess) onAdminLoginSuccess();
          onClose();
        }, 800);
      } else {
        playTvClickSound('error');
        setAdminErrorMessage(res.error || res.message || 'Invalid username or password');
      }
    } catch {
      setAdminLoginLoading(false);
      playTvClickSound('error');
      setAdminErrorMessage('Login connection failed');
    }
  };

  // Handle Commit / Submit
  const handleSubmitAction = () => {
    if (mode === 'admin_login') {
      handleAdminSubmit();
    } else {
      playTvClickSound('success');
      if (onSubmit) onSubmit(inputValue);
      onClose();
    }
  };

  // Handle Auto-Fill Admin Credentials
  const handleAutoFillAdmin = () => {
    playTvClickSound('press');
    setAdminUsername('admin');
    setAdminPassword('admin123');
    setAdminErrorMessage('');
  };

  // 2D D-PAD Navigation Keydown Handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow physical typing directly into input
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== ' ') {
        // Physical keyboard letter
        handleKeyType(e.key);
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        playTvClickSound('navigate');
        onClose();
        return;
      }

      // Space key
      if (e.key === ' ') {
        // Only trigger space if not focusing a specific button with enter
        if (focusArea === 'keyboard') {
          // If we want space to type space directly
          handleKeyType(' ');
          return;
        }
      }

      // D-Pad Navigation Engine
      if (e.key === 'ArrowRight' || e.key === 'Right') {
        e.preventDefault();
        playTvClickSound('navigate');

        if (focusArea === 'matched_channels') {
          setMatchedChannelIndex(prev => Math.min(matchedChannels.length - 1, prev + 1));
        } else if (focusArea === 'quick_chips') {
          setQuickChipIndex(prev => Math.min(quickSearchChips.length - 1, prev + 1));
        } else if (focusArea === 'top_controls') {
          setTopControlIndex(prev => Math.min(3, prev + 1));
        } else if (focusArea === 'bottom_actions') {
          setBottomActionIndex(prev => Math.min(bottomActions.length - 1, prev + 1));
        } else if (focusArea === 'keyboard') {
          const rowKeys = layoutRows[keyboardFocus.row] || [];
          setKeyboardFocus(prev => ({
            ...prev,
            col: (prev.col + 1) % rowKeys.length,
          }));
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
        e.preventDefault();
        playTvClickSound('navigate');

        if (focusArea === 'matched_channels') {
          setMatchedChannelIndex(prev => Math.max(0, prev - 1));
        } else if (focusArea === 'quick_chips') {
          setQuickChipIndex(prev => Math.max(0, prev - 1));
        } else if (focusArea === 'top_controls') {
          setTopControlIndex(prev => Math.max(0, prev - 1));
        } else if (focusArea === 'bottom_actions') {
          setBottomActionIndex(prev => Math.max(0, prev - 1));
        } else if (focusArea === 'keyboard') {
          const rowKeys = layoutRows[keyboardFocus.row] || [];
          setKeyboardFocus(prev => ({
            ...prev,
            col: (prev.col - 1 + rowKeys.length) % rowKeys.length,
          }));
        }
      } else if (e.key === 'ArrowDown' || e.key === 'Down') {
        e.preventDefault();
        playTvClickSound('navigate');

        if (focusArea === 'top_controls') {
          if (matchedChannels.length > 0) {
            setFocusArea('matched_channels');
          } else if (mode === 'search') {
            setFocusArea('quick_chips');
          } else {
            setFocusArea('keyboard');
            setKeyboardFocus({ row: 0, col: 0 });
          }
        } else if (focusArea === 'matched_channels') {
          if (mode === 'search') {
            setFocusArea('quick_chips');
          } else {
            setFocusArea('keyboard');
            setKeyboardFocus({ row: 0, col: 0 });
          }
        } else if (focusArea === 'quick_chips') {
          setFocusArea('keyboard');
          setKeyboardFocus({ row: 0, col: 0 });
        } else if (focusArea === 'keyboard') {
          if (keyboardFocus.row < layoutRows.length - 1) {
            const nextRow = keyboardFocus.row + 1;
            const nextRowCols = layoutRows[nextRow]?.length || 1;
            setKeyboardFocus(prev => ({
              row: nextRow,
              col: Math.min(prev.col, nextRowCols - 1),
            }));
          } else {
            setFocusArea('bottom_actions');
            setBottomActionIndex(3); // Land on Space
          }
        }
      } else if (e.key === 'ArrowUp' || e.key === 'Up') {
        e.preventDefault();
        playTvClickSound('navigate');

        if (focusArea === 'bottom_actions') {
          setFocusArea('keyboard');
          setKeyboardFocus({ row: layoutRows.length - 1, col: 4 });
        } else if (focusArea === 'keyboard') {
          if (keyboardFocus.row > 0) {
            const prevRow = keyboardFocus.row - 1;
            const prevRowCols = layoutRows[prevRow]?.length || 1;
            setKeyboardFocus(prev => ({
              row: prevRow,
              col: Math.min(prev.col, prevRowCols - 1),
            }));
          } else {
            if (mode === 'search') {
              setFocusArea('quick_chips');
            } else if (matchedChannels.length > 0) {
              setFocusArea('matched_channels');
            } else {
              setFocusArea('top_controls');
            }
          }
        } else if (focusArea === 'quick_chips') {
          if (matchedChannels.length > 0) {
            setFocusArea('matched_channels');
          } else {
            setFocusArea('top_controls');
          }
        } else if (focusArea === 'matched_channels') {
          setFocusArea('top_controls');
        }
      } else if (e.key === 'Enter' || e.key === 'Select' || e.key === 'Ok') {
        e.preventDefault();

        // Execute selection based on focusArea
        if (focusArea === 'matched_channels' && matchedChannels[matchedChannelIndex]) {
          playTvClickSound('success');
          const targetChan = matchedChannels[matchedChannelIndex];
          if (onSelectChannel) onSelectChannel(targetChan);
          onClose();
        } else if (focusArea === 'quick_chips') {
          const chip = quickSearchChips[quickChipIndex];
          if (chip) {
            playTvClickSound('press');
            setInputValue(chip);
          }
        } else if (focusArea === 'top_controls') {
          // Top controls action
          if (mode === 'admin_login') {
            if (topControlIndex === 0) setActiveAdminField('username');
            else if (topControlIndex === 1) setActiveAdminField('password');
            else if (topControlIndex === 2) handleAutoFillAdmin();
            else if (topControlIndex === 3) setShowPassword(prev => !prev);
          } else {
            handleClear();
          }
        } else if (focusArea === 'keyboard') {
          const targetChar = layoutRows[keyboardFocus.row]?.[keyboardFocus.col];
          if (targetChar) {
            handleKeyType(targetChar);
          }
        } else if (focusArea === 'bottom_actions') {
          const action = bottomActions[bottomActionIndex];
          if (action) {
            if (action.id === 'mode_toggle') {
              playTvClickSound('navigate');
              setKeyboardLayout(prev => (prev === '123' ? 'abc' : '123'));
            } else if (action.id === 'caps_toggle') {
              playTvClickSound('navigate');
              setKeyboardLayout(prev => (prev === 'ABC' ? 'abc' : 'ABC'));
            } else if (action.id === 'shortcuts_toggle') {
              playTvClickSound('navigate');
              setKeyboardLayout(prev => (prev === 'shortcuts' ? 'abc' : 'shortcuts'));
            } else if (action.id === 'space') {
              handleKeyType(' ');
            } else if (action.id === 'backspace') {
              handleBackspace();
            } else if (action.id === 'clear') {
              handleClear();
            } else if (action.id === 'submit') {
              handleSubmitAction();
            } else if (action.id === 'close') {
              playTvClickSound('navigate');
              onClose();
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    focusArea,
    keyboardFocus,
    topControlIndex,
    matchedChannelIndex,
    quickChipIndex,
    bottomActionIndex,
    layoutRows,
    bottomActions,
    matchedChannels,
    quickSearchChips,
    mode,
    activeAdminField,
    handleKeyType,
    handleBackspace,
    handleClear,
    handleSubmitAction,
    onClose,
    onSelectChannel,
  ]);

  if (!isOpen) return null;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Smart TV On-Screen Keyboard"
      className="fixed inset-0 z-50 bg-[#040713]/96 backdrop-blur-3xl flex flex-col justify-between p-3 sm:p-6 select-none animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
    >
      {/* 1. TOP HEADER & ACTIVE INPUT DISPLAY */}
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-2.5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/30">
              {mode === 'admin_login' ? <Shield className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>{title || (mode === 'admin_login' ? 'TV Admin Authentication Login' : 'TV On-Screen Channel Search')}</span>
                <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-2 py-0.5 rounded-full">
                  D-PAD ACTIVE
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Use your TV Remote arrows [▲ ▼ ◄ ►] and OK button to type and navigate
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <X className="w-4 h-4 text-red-400" />
            <span>Close (ESC)</span>
          </button>
        </div>

        {/* ADMIN MODE: Dual Username & Password Display Bar */}
        {mode === 'admin_login' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
            {/* Username Field Card */}
            <button
              onClick={() => setActiveAdminField('username')}
              className={`p-3 rounded-xl text-left border transition cursor-pointer flex items-center justify-between ${
                activeAdminField === 'username'
                  ? 'bg-cyan-950/60 border-cyan-400 ring-2 ring-cyan-500/30 text-white'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400'
              } ${focusArea === 'top_controls' && topControlIndex === 0 ? 'ring-4 ring-amber-400 bg-amber-500/20' : ''}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <User className={`w-4 h-4 ${activeAdminField === 'username' ? 'text-cyan-400' : 'text-slate-500'}`} />
                <div className="truncate">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Username</div>
                  <div className="text-sm font-mono font-bold text-white truncate">
                    {adminUsername || <span className="text-slate-600">Enter username...</span>}
                  </div>
                </div>
              </div>
              {activeAdminField === 'username' && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              )}
            </button>

            {/* Password Field Card */}
            <button
              onClick={() => setActiveAdminField('password')}
              className={`p-3 rounded-xl text-left border transition cursor-pointer flex items-center justify-between ${
                activeAdminField === 'password'
                  ? 'bg-cyan-950/60 border-cyan-400 ring-2 ring-cyan-500/30 text-white'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400'
              } ${focusArea === 'top_controls' && topControlIndex === 1 ? 'ring-4 ring-amber-400 bg-amber-500/20' : ''}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <KeyRound className={`w-4 h-4 ${activeAdminField === 'password' ? 'text-cyan-400' : 'text-slate-500'}`} />
                <div className="truncate">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Password</div>
                  <div className="text-sm font-mono font-bold text-white truncate">
                    {adminPassword 
                      ? (showPassword ? adminPassword : '•'.repeat(adminPassword.length))
                      : <span className="text-slate-600">Enter admin password...</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPassword(!showPassword);
                  }}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {activeAdminField === 'password' && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                )}
              </div>
            </button>
          </div>
        )}

        {/* GENERAL / SEARCH MODE: Single Main Input Display Box */}
        {mode !== 'admin_login' && (
          <div className="relative bg-[#060a15] border-2 border-cyan-500/40 rounded-2xl p-3.5 shadow-inner flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Search className="w-5 h-5 text-cyan-400 shrink-0" />
              <div className="text-base sm:text-xl font-mono font-black text-white tracking-wide truncate">
                {inputValue ? (
                  <span className="text-white">
                    {inputValue}
                    <span className="inline-block w-2 h-5 bg-cyan-400 ml-1 animate-pulse align-middle" />
                  </span>
                ) : (
                  <span className="text-slate-500 font-sans font-normal text-sm sm:text-base">
                    {placeholder}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {inputValue && (
                <button
                  onClick={handleClear}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Clear (CLR)
                </button>
              )}
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800/60 font-bold">
                {inputValue.length} chars
              </span>
            </div>
          </div>
        )}

        {/* Error / Success message banner */}
        {adminErrorMessage && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center justify-between">
            <span>⚠️ {adminErrorMessage}</span>
            <button
              onClick={handleAutoFillAdmin}
              className="text-cyan-300 underline font-bold text-xs cursor-pointer ml-2"
            >
              Use Default Credentials
            </button>
          </div>
        )}

        {adminSuccessMessage && (
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{adminSuccessMessage}</span>
          </div>
        )}

        {/* 2. MATCHED CHANNELS REAL-TIME CAROUSEL (When in Search Mode) */}
        {mode === 'search' && matchedChannels.length > 0 && (
          <div className="flex flex-col gap-1 bg-slate-950/70 p-2.5 rounded-2xl border border-cyan-500/30">
            <div className="flex items-center justify-between px-1 text-[11px] font-bold text-cyan-300">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Matched Channels ({matchedChannels.length})</span>
              </span>
              <span className="text-slate-400 text-[10px]">Press ▲ from keyboard or click to tune</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {matchedChannels.map((chan, idx) => {
                const isChannelFocused = focusArea === 'matched_channels' && matchedChannelIndex === idx;
                const cleanLogo = chan.logo || getCleanChannelLogo(chan);

                return (
                  <button
                    key={chan.id}
                    onClick={() => {
                      playTvClickSound('success');
                      if (onSelectChannel) onSelectChannel(chan);
                      onClose();
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left shrink-0 transition duration-150 cursor-pointer border ${
                      isChannelFocused
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black ring-4 ring-amber-300 scale-105 shadow-xl shadow-cyan-500/40'
                        : 'bg-slate-900 text-white border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-950 p-0.5 overflow-hidden shrink-0 border border-slate-700">
                      <img src={cleanLogo} alt={chan.name} className="w-full h-full object-contain rounded-full" />
                    </div>
                    <div className="truncate max-w-[120px]">
                      <div className="text-xs font-black truncate">{chan.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">CH {chan.channelNumber}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. QUICK SEARCH CHIPS */}
        {mode === 'search' && matchedChannels.length === 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>Quick:</span>
            </span>
            {quickSearchChips.map((chip, idx) => {
              const isChipFocused = focusArea === 'quick_chips' && quickChipIndex === idx;
              return (
                <button
                  key={chip}
                  onClick={() => {
                    playTvClickSound('press');
                    setInputValue(chip);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition border cursor-pointer ${
                    isChipFocused
                      ? 'bg-cyan-400 text-slate-950 border-cyan-300 ring-2 ring-amber-300 scale-105'
                      : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. MAIN D-PAD KEYBOARD GRID (Rows & High-Contrast Keys) */}
      <div className="w-full max-w-4xl mx-auto my-auto py-2 flex flex-col gap-2">
        {layoutRows.map((row, rIdx) => (
          <div key={rIdx} className="flex items-center justify-center gap-1.5 sm:gap-2">
            {row.map((keyChar, cIdx) => {
              const isKeyFocused = focusArea === 'keyboard' && keyboardFocus.row === rIdx && keyboardFocus.col === cIdx;
              const isShortcutWord = keyChar.length > 2;

              return (
                <button
                  key={cIdx}
                  onClick={() => handleKeyType(keyChar)}
                  className={`h-11 sm:h-13 rounded-xl sm:rounded-2xl font-mono font-black flex items-center justify-center transition-all duration-100 cursor-pointer ${
                    isShortcutWord 
                      ? 'px-3 sm:px-4 text-xs sm:text-sm font-sans flex-1' 
                      : 'w-8 sm:w-16 text-sm sm:text-lg flex-1'
                  } ${
                    isKeyFocused
                      ? 'bg-gradient-to-b from-cyan-400 to-cyan-500 text-slate-950 ring-4 ring-amber-300 shadow-xl shadow-cyan-400/50 scale-110 z-10 font-black border-2 border-white'
                      : 'bg-[#10182c]/90 text-slate-100 border border-slate-700/80 hover:bg-[#1c2a4d] hover:border-cyan-400/50 active:scale-95'
                  }`}
                >
                  {keyChar}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* 5. BOTTOM ACTION CONTROLS ROW */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
        {bottomActions.map((action, aIdx) => {
          const isActionFocused = focusArea === 'bottom_actions' && bottomActionIndex === aIdx;

          return (
            <button
              key={action.id}
              onClick={() => {
                if (action.id === 'mode_toggle') {
                  setKeyboardLayout(prev => (prev === '123' ? 'abc' : '123'));
                } else if (action.id === 'caps_toggle') {
                  setKeyboardLayout(prev => (prev === 'ABC' ? 'abc' : 'ABC'));
                } else if (action.id === 'shortcuts_toggle') {
                  setKeyboardLayout(prev => (prev === 'shortcuts' ? 'abc' : 'shortcuts'));
                } else if (action.id === 'space') {
                  handleKeyType(' ');
                } else if (action.id === 'backspace') {
                  handleBackspace();
                } else if (action.id === 'clear') {
                  handleClear();
                } else if (action.id === 'submit') {
                  handleSubmitAction();
                } else if (action.id === 'close') {
                  onClose();
                }
              }}
              className={`h-11 sm:h-12 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all duration-100 cursor-pointer border ${
                action.wide ? 'flex-grow min-w-[120px]' : 'shrink-0'
              } ${
                action.highlight
                  ? (isActionFocused
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 ring-4 ring-white scale-105 shadow-xl shadow-amber-400/60 font-black'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400/60 hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-600/30')
                  : (isActionFocused
                      ? 'bg-cyan-400 text-slate-950 ring-4 ring-amber-300 scale-105 shadow-xl shadow-cyan-400/50 font-black border-2 border-white'
                      : 'bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800')
              }`}
            >
              {action.label}
            </button>
          );
        })}
      </div>

      {/* 6. REMOTE CONTROL SHORTCUT HINTS FOOTER */}
      <div className="w-full max-w-5xl mx-auto pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-cyan-400 rounded font-mono font-bold">▲ ▼ ◄ ►</kbd> Navigate</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-cyan-400 rounded font-mono font-bold">OK / ENTER</kbd> Select Key</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-cyan-400 rounded font-mono font-bold">ESC / BACK</kbd> Close</span>
        </div>

        {mode === 'admin_login' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoFillAdmin}
              className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
            >
              ⚡ Auto-Fill Credentials (admin / admin123)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
