import React, { useState, useEffect } from 'react';
import { Match, Channel } from '../types';
import { notificationManager } from '../utils/notificationManager';
import { BellRing, Play, X, Tv } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface RealTimeNotificationBannerProps {
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
}

interface ActiveInAppAlert {
  id: string;
  title: string;
  message: string;
  match: Match;
  type: string;
  time: number;
}

export const RealTimeNotificationBanner: React.FC<RealTimeNotificationBannerProps> = ({
  channels,
  onSelectChannel
}) => {
  const { language } = useTranslation();
  const [activeAlerts, setActiveAlerts] = useState<ActiveInAppAlert[]>([]);

  useEffect(() => {
    // Subscribe to notificationManager in-app events
    const unsubscribe = notificationManager.subscribeInAppNotifications((alert) => {
      const newAlert: ActiveInAppAlert = {
        id: `${alert.match.id}-${alert.type}-${Date.now()}`,
        title: alert.title,
        message: alert.message,
        match: alert.match,
        type: alert.type,
        time: Date.now()
      };

      setActiveAlerts(prev => [newAlert, ...prev.slice(0, 2)]);

      // Auto dismiss after 10 seconds
      setTimeout(() => {
        setActiveAlerts(prev => prev.filter(a => a.id !== newAlert.id));
      }, 10000);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const dismissAlert = (id: string) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleWatch = (match: Match, alertId: string) => {
    let targetChannel: Channel | undefined;
    if (match.channelId) {
      targetChannel = channels.find(c => c.id === match.channelId);
    }
    if (!targetChannel && match.broadcastChannel) {
      const bc = match.broadcastChannel.toLowerCase();
      targetChannel = channels.find(c => 
        c.name.toLowerCase().includes(bc) || bc.includes(c.name.toLowerCase())
      );
    }
    if (targetChannel) {
      onSelectChannel(targetChannel);
      const playerEl = document.getElementById('main-video-player');
      if (playerEl) {
        playerEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
    dismissAlert(alertId);
  };

  if (activeAlerts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none">
      {activeAlerts.map(alert => {
        const isLive = alert.type === 'live';
        return (
          <div
            key={alert.id}
            className={`pointer-events-auto rounded-2xl p-4 shadow-2xl border backdrop-blur-xl transition-all transform duration-300 animate-in slide-in-from-top-4 ${
              isLive 
                ? 'bg-red-950/95 border-red-500/80 shadow-red-900/40 text-white'
                : 'bg-slate-900/95 border-sky-500/80 shadow-sky-900/30 text-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl flex items-center justify-center ${
                  isLive ? 'bg-red-600 text-white animate-pulse' : 'bg-sky-500 text-white'
                }`}>
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full ${
                    isLive ? 'bg-red-500 text-white' : 'bg-sky-500/20 text-sky-300'
                  }`}>
                    {isLive ? '🔴 LIVE NOW' : '🔔 MATCH ALERT'}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1 leading-snug">
                    {alert.title}
                  </h4>
                </div>
              </div>

              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mt-2 line-clamp-2">
              {alert.message}
            </p>

            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <Tv className="w-3.5 h-3.5 text-sky-400" />
                <span className="truncate max-w-[130px]">{alert.match.broadcastChannel || 'T Sports HD'}</span>
              </div>

              <button
                onClick={() => handleWatch(alert.match, alert.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition ${
                  isLive
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/50'
                    : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/40'
                }`}
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{language === 'bn' ? 'সরাসরি দেখুন' : 'Watch Live'}</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
