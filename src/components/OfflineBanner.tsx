import React from 'react';
import { WifiOff, Wifi, RefreshCw, AlertCircle, Database } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

export interface OfflineBannerProps {
  isOnline: boolean;
  isRetrying: boolean;
  isChecking?: boolean;
  showReconnected?: boolean;
  errorMessage?: string | null;
  onRetry: () => void | Promise<any>;
  cachedChannelsCount?: number;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  isRetrying,
  isChecking = false,
  showReconnected = false,
  errorMessage,
  onRetry,
  cachedChannelsCount = 0,
}) => {
  const { language } = useTranslation();
  const isBn = language === 'bn';

  // Do not render anything if the user is stably online and no transition toast is active
  if (isOnline && !showReconnected) {
    return null;
  }

  // 1. Reconnected Notification Banner (Green/Emerald, temporary)
  if (isOnline && showReconnected) {
    return (
      <div 
        id="connection-restored-banner"
        role="status"
        aria-live="polite"
        className="sticky top-0 z-50 w-full bg-gradient-to-r from-emerald-950 via-[#062c1d] to-[#041d13] border-b border-emerald-500/50 text-white shadow-xl shadow-emerald-950/40 transition-all duration-300 animate-fadeIn"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0">
              <Wifi className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-emerald-300">
                {isBn ? '✓ ইন্টারনেট সংযোগ পুনঃস্থাপিত' : '✓ Connection Restored'}
              </span>
              <span className="hidden sm:inline text-slate-300 text-[11px]">
                {isBn 
                  ? '— লাইভ টিভি স্ট্রিমিং ও ম্যাচের তথ্য রিফ্রেশ করা হয়েছে।' 
                  : '— Live streams and real-time match data are refreshed.'}
              </span>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-mono text-[10px] font-bold tracking-wider shrink-0 uppercase">
            {isBn ? 'অনলাইন' : 'ONLINE'}
          </span>
        </div>
      </div>
    );
  }

  // 2. Specific Persistent Offline Banner (Red/Rose, persistent until reconnected)
  return (
    <div
      id="persistent-offline-banner"
      role="alert"
      aria-live="assertive"
      className="sticky top-0 z-50 w-full bg-gradient-to-r from-red-950 via-[#230910] to-[#14060a] border-b-2 border-rose-500/60 text-white shadow-2xl shadow-red-950/50 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Status Indicator & Message */}
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <div className="relative shrink-0 mt-0.5 sm:mt-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-600 to-red-700 text-white flex items-center justify-center shadow-lg shadow-rose-900/50">
                <WifiOff className="w-4 h-4" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-red-950 animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-xs sm:text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                  <span>{isBn ? 'ইন্টারনেট সংযোগ বিচ্ছিন্ন' : 'No Internet Connection'}</span>
                  <span className="px-1.5 py-0.2 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[9px] font-mono uppercase font-bold">
                    {isBn ? 'অফলাইন' : 'OFFLINE'}
                  </span>
                </span>

                {cachedChannelsCount > 0 && (
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700/70 text-slate-300 text-[10px]">
                    <Database className="w-3 h-3 text-cyan-400" />
                    <span>{cachedChannelsCount} {isBn ? 'চ্যানেল ক্যাশ থেকে সক্রিয়' : 'Cached channels ready'}</span>
                  </span>
                )}
              </div>

              <p className="text-[11px] text-rose-200/80 leading-tight mt-0.5 truncate sm:whitespace-normal">
                {isBn 
                  ? 'আপনি বর্তমানে অফলাইনে আছেন। লাইভ ভিডিও সম্প্রচার ও স্কোর আপডেটের জন্য ইন্টারনেট প্রয়োজন।' 
                  : 'You are currently offline. Live streaming and real-time score feeds require an active connection.'}
              </p>
            </div>
          </div>

          {/* Action Button: Retry Connection */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              id="btn-retry-connection"
              onClick={onRetry}
              disabled={isRetrying || isChecking}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5 select-none active:scale-95 ${
                isRetrying || isChecking
                  ? 'bg-rose-900/60 border border-rose-700/50 text-rose-200 cursor-wait'
                  : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border border-rose-400/40 hover:shadow-rose-600/30'
              }`}
              title={isBn ? 'ইন্টারনেট সংযোগ যাচাই ও ডেটা রিফ্রেশ করুন' : 'Test network connection and refresh live data'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying || isChecking ? 'animate-spin text-amber-300' : ''}`} />
              <span>
                {isRetrying || isChecking 
                  ? (isBn ? 'যাচাই করা হচ্ছে...' : 'Checking...') 
                  : (isBn ? 'পুনরায় চেষ্টা করুন' : 'Retry Connection')}
              </span>
            </button>
          </div>
        </div>

        {/* Granular Error Diagnostic Alert if a manual check failed */}
        {errorMessage && (
          <div className="mt-2 pt-2 border-t border-rose-900/50 flex items-center gap-2 text-[11px] text-amber-200 animate-fadeIn">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
