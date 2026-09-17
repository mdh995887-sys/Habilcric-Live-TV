import React, { useEffect, useRef, useState } from 'react';
import { Channel } from '../types';
import { getCleanChannelLogo } from '../utils/channelLogos';
import { Wifi, Zap, AlertTriangle } from 'lucide-react';

interface ChannelCardProps {
  channel: Channel;
  isActive: boolean;
  isFocused?: boolean;
  onSelect: (channel: Channel) => void;
  onFocus?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (channelId: string, e: React.MouseEvent) => void;
  showStatusDots?: boolean;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  isActive,
  isFocused = false,
  onSelect,
  onFocus,
  isFavorite = false,
  onToggleFavorite,
  showStatusDots = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);

  // Auto scroll focused card into view if focused via D-pad
  useEffect(() => {
    if (isFocused && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [isFocused]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Select' || (e as any).keyCode === 13) {
      e.preventDefault();
      onSelect(channel);
    }
  };

  const logoSrc = imgError ? getCleanChannelLogo(channel) : (channel.logo || getCleanChannelLogo(channel));

  // Determine signal quality based on latencyMs
  const latency = channel.latencyMs ?? 45;
  const isOnline = channel.status === 'online' && latency < 4000;
  
  let signalBars = 4;
  let signalColor = 'text-emerald-500 bg-emerald-500';
  let signalLabel = 'Ultra Fast';

  if (!isOnline) {
    signalBars = 0;
    signalColor = 'text-rose-500 bg-rose-500';
    signalLabel = 'Offline';
  } else if (latency < 80) {
    signalBars = 4;
    signalColor = 'text-emerald-500 bg-emerald-500';
    signalLabel = `${latency}ms (Excellent)`;
  } else if (latency < 200) {
    signalBars = 3;
    signalColor = 'text-cyan-500 bg-cyan-500';
    signalLabel = `${latency}ms (Good)`;
  } else if (latency < 500) {
    signalBars = 2;
    signalColor = 'text-amber-500 bg-amber-500';
    signalLabel = `${latency}ms (Fair)`;
  } else {
    signalBars = 1;
    signalColor = 'text-orange-500 bg-orange-500';
    signalLabel = `${latency}ms (Slow)`;
  }

  return (
    <div
      ref={cardRef}
      onClick={() => onSelect(channel)}
      onFocus={onFocus}
      onMouseEnter={onFocus}
      onKeyDown={handleKeyDown}
      id={`channel-card-${channel.id}`}
      tabIndex={0}
      role="button"
      aria-pressed={isActive}
      aria-label={`Channel ${channel.channelNumber}: ${channel.name}`}
      className={`group relative bg-white rounded-2xl p-2.5 sm:p-3 transition-all duration-200 cursor-pointer flex flex-col justify-between items-center text-center overflow-hidden outline-none select-none min-h-[135px] sm:min-h-[150px] shadow-sm ${
        isFocused
          ? 'ring-4 ring-cyan-400 scale-[1.03] z-20 shadow-2xl shadow-cyan-500/50'
          : isActive
          ? 'ring-2 ring-cyan-500 border border-cyan-400 shadow-lg shadow-cyan-500/20'
          : 'border border-slate-200/90 hover:border-slate-300 hover:shadow-md hover:scale-[1.02]'
      }`}
    >
      {/* Top Left: Online Status Green Dot matching Screenshot */}
      <div className="absolute top-2.5 left-2.5 flex items-center z-10">
        <span 
          className="w-2.5 h-2.5 rounded-full bg-[#34c759] shadow-sm shrink-0"
          title="Online"
        />
      </div>

      {/* Top Right: Channel Number matching Screenshot */}
      <span className="font-extrabold text-black text-xs sm:text-sm absolute top-2 right-2.5 font-sans">
        {channel.channelNumber}
      </span>

      {/* Center: Logo & BONGO FLIX subtag matching Screenshot */}
      <div className="w-full flex flex-col items-center justify-center pt-5 pb-1 flex-1">
        <div className="h-10 sm:h-12 w-full flex items-center justify-center px-1">
          <img
            src={logoSrc}
            alt={channel.name}
            className="max-h-full max-w-[85%] object-contain transition-transform duration-200 group-hover:scale-105"
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        </div>

        {/* BONGO FLIX / Category sub-badge */}
        <span className="text-[8px] sm:text-[9px] font-bold text-rose-500/90 uppercase tracking-tight mt-1">
          BONGO FLIX
        </span>
      </div>

      {/* Bottom: Channel Name */}
      <div className="w-full pt-1">
        <h3 className="text-slate-900 font-extrabold text-xs sm:text-[13px] leading-tight truncate text-center w-full">
          {channel.name}
        </h3>
      </div>
    </div>
  );
};

