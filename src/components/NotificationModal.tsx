import React from 'react';
import { AppNotification } from '../types';
import { Bell, X, Calendar, Clock, ExternalLink, Flame, Sparkles, Tv } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onSelectChannel?: (channelId: string) => void;
}

const CountdownTimer: React.FC<{ eventStartTime: string }> = ({ eventStartTime }) => {
  const [timeLeft, setTimeLeft] = React.useState<{ hours: number; minutes: number; seconds: number; isLive: boolean }>({ hours: 0, minutes: 0, seconds: 0, isLive: false });

  React.useEffect(() => {
    const target = new Date(eventStartTime).getTime();
    const update = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isLive: true });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, isLive: false });
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [eventStartTime]);

  if (timeLeft.isLive) {
    return (
      <span className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse shadow-md shadow-red-600/30">
        <span className="w-2 h-2 rounded-full bg-white animate-ping"></span> LIVE NOW
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-slate-900/90 border border-cyan-500/30 px-3 py-1.5 rounded-xl text-xs font-mono text-cyan-300 shadow-inner">
      <Clock className="w-3.5 h-3.5 text-cyan-400" />
      <span>Starts in:</span>
      <span className="font-bold text-white">
        {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
      </span>
    </div>
  );
};

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onSelectChannel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        id="notification-modal"
        className="bg-[#0b1222] border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-[#0b1222] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Live Announcements & Fixtures</h2>
              <p className="text-xs text-slate-400">Matchday broadcasts & stream notices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="close-notif-modal-btn"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center">
              <Bell className="w-12 h-12 text-slate-700 mb-2" />
              <p className="font-semibold text-sm">No new announcements at this moment</p>
              <p className="text-xs text-slate-500">Live match notices will appear here automatically</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-xl border transition ${
                  n.isFeatured
                    ? 'bg-gradient-to-br from-cyan-950/40 via-[#0e172a] to-slate-900 border-cyan-500/40 shadow-lg shadow-cyan-950/20'
                    : 'bg-[#0e172a] border-slate-800/90 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {n.isFeatured && (
                      <span className="px-2 py-0.5 bg-red-600/90 text-white rounded text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                        <Flame className="w-3 h-3" /> MATCH ALERT
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-slate-100">{n.title}</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">{n.message}</p>

                {/* Scheduled Countdown Timer if eventStartTime is provided */}
                {n.eventStartTime && (
                  <div className="mb-3">
                    <CountdownTimer eventStartTime={n.eventStartTime} />
                  </div>
                )}

                {n.image && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-slate-800 aspect-video max-h-48 bg-slate-950">
                    <img src={n.image} alt={n.title} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" /> {n.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> {n.time}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {n.channelId && onSelectChannel && (
                      <button
                        onClick={() => {
                          onSelectChannel(n.channelId!);
                          onClose();
                        }}
                        className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow cursor-pointer transition"
                      >
                        <Tv className="w-3.5 h-3.5" /> Watch Channel
                      </button>
                    )}

                    {n.link && (
                      <a
                        href={n.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                      >
                        <span>Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900/80 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
