import React, { useState, useEffect, useMemo } from 'react';
import { Match, Channel } from '../types';
import { 
  Calendar, Clock, Bell, BellRing, Tv, 
  Play, Radio, Volume2, CheckCircle2,
  Flame, Award, Trophy, Zap, Timer, Sparkles
} from 'lucide-react';
import { notificationManager } from '../utils/notificationManager';
import { apiToggleMatchNotify } from '../utils/api';
import { getTeamLogo } from '../utils/teamLogos';
import { useTranslation } from '../contexts/LanguageContext';
import { toast } from '../utils/toast';

interface UpcomingMatchesProps {
  matches: Match[];
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  onNotificationToggle?: (matchId: string) => void;
  onOpenAdmin?: () => void;
}

type SubFilter = 'all' | 'recent' | 'live' | 'upcoming';

export interface MatchTimeInfo {
  isLive: boolean;
  isFinished: boolean;
  isUpcoming: boolean;
  diffSecs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isUrgent: boolean;
  isCritical: boolean;
  countdownText: string;
  formattedTime: string;
}

export const UpcomingMatches: React.FC<UpcomingMatchesProps> = ({
  matches = [],
  channels = [],
  onSelectChannel,
  onNotificationToggle,
  onOpenAdmin
}) => {
  const { language, t } = useTranslation();
  const [selectedSport, setSelectedSport] = useState<string>('ALL');
  const [subFilter, setSubFilter] = useState<SubFilter>('all');
  const [now, setNow] = useState<Date>(new Date());
  const [tick, setTick] = useState<boolean>(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    notificationManager.getPermission()
  );
  const [requestingPerm, setRequestingPerm] = useState(false);
  const [localMatches, setLocalMatches] = useState<Match[]>(matches);

  // Sync with incoming prop
  useEffect(() => {
    setLocalMatches(matches);
  }, [matches]);

  // 1-second interval for real-time live countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
      setTick(prev => !prev);
      setNotificationPermission(notificationManager.getPermission());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sport category metadata with circular icons and counts
  const sportCategories = [
    { id: 'ALL', name: language === 'bn' ? 'সকল' : 'All', icon: Zap },
    { id: 'Cricket', name: language === 'bn' ? 'ক্রিকেট' : 'Cricket', icon: Award },
    { id: 'Football', name: language === 'bn' ? 'ফুটবল' : 'Football', icon: Trophy },
    { id: 'Motorsport', name: language === 'bn' ? 'মোটরস্পোর্ট' : 'Motorsport', icon: Flame },
    { id: 'WWE', name: 'WWE', icon: Zap },
    { id: 'Tennis', name: language === 'bn' ? 'টেনিস' : 'Tennis', icon: Award }
  ];

  // Helper to parse match teams
  const getTeams = (match: Match) => {
    let t1 = match.team1Name;
    let t2 = match.team2Name;

    if (!t1 || !t2) {
      const parts = match.title.split(/\s+(?:vs|VS|v)\s+/i);
      t1 = parts[0]?.trim() || match.title;
      t2 = parts[1]?.trim() || 'Opponent';
    }

    const logo1 = match.team1Logo || getTeamLogo(t1);
    const logo2 = match.team2Logo || getTeamLogo(t2);

    return { team1: t1, team2: t2, logo1, logo2 };
  };

  // Calculate match start target Date based primarily on stored 'matchTime' field
  const getMatchTargetDate = (match: Match): Date => {
    // Read the stored 'matchTime' field (with graceful fallback to startTime)
    const storedTime = (match.matchTime || match.startTime || '').trim();
    const storedDate = (match.date || '').trim();

    // 1. Check if matchTime is a numeric epoch timestamp (ms or seconds)
    if (/^\d{10,13}$/.test(storedTime)) {
      const num = Number(storedTime);
      return new Date(num < 1e11 ? num * 1000 : num);
    }

    // 2. Check if matchTime is a full ISO or parseable date-time string (e.g. "2026-09-16T20:00:00Z" or "2026-09-16 20:00")
    if (storedTime.includes('T') || (storedTime.includes('-') && (storedTime.includes(':') || storedTime.includes(' ')))) {
      const parsed = new Date(storedTime);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // 3. Extract hours, minutes, seconds from time string (e.g. "20:00", "08:30 PM", "8:30pm")
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    if (storedTime.toLowerCase().includes('am') || storedTime.toLowerCase().includes('pm')) {
      const isPm = storedTime.toLowerCase().includes('pm');
      const clean = storedTime.replace(/am|pm/gi, '').trim();
      const [h, m, s] = clean.split(':').map(Number);
      hours = isPm && h < 12 ? h + 12 : (!isPm && h === 12 ? 0 : (h || 0));
      minutes = m || 0;
      seconds = s || 0;
    } else if (storedTime.includes(':')) {
      const [h, m, s] = storedTime.split(':').map(Number);
      hours = h || 0;
      minutes = m || 0;
      seconds = s || 0;
    }

    // Combine with match.date (YYYY-MM-DD) or current date
    if (storedDate && storedDate.includes('-')) {
      const [y, mon, d] = storedDate.split('-').map(Number);
      return new Date(y, (mon || 1) - 1, d || 1, hours, minutes, seconds, 0);
    } else {
      const d = new Date();
      d.setHours(hours, minutes, seconds, 0);
      return d;
    }
  };

  // Calculate remaining time and countdown components based on stored 'matchTime'
  const getMatchTimeInfo = (match: Match): MatchTimeInfo => {
    try {
      const targetDate = getMatchTargetDate(match);
      const diffMs = targetDate.getTime() - now.getTime();
      const diffSecs = Math.floor(diffMs / 1000);

      const isExplicitLive = match.status === 'live';
      const isExplicitFinished = match.status === 'finished';
      const displayTime = match.matchTime || match.startTime || '00:00';

      // 3 hours duration assumption for match live window
      if (isExplicitLive || (diffSecs <= 0 && diffSecs > -180 * 60 && !isExplicitFinished)) {
        return {
          isLive: true,
          isFinished: false,
          isUpcoming: false,
          diffSecs: 0,
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isUrgent: false,
          isCritical: false,
          countdownText: language === 'bn' ? '🔴 লাইভ' : '🔴 LIVE NOW',
          formattedTime: `${displayTime} • ${match.date}`
        };
      } else if (isExplicitFinished || diffSecs <= -180 * 60) {
        return {
          isLive: false,
          isFinished: true,
          isUpcoming: false,
          diffSecs: 0,
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isUrgent: false,
          isCritical: false,
          countdownText: t.matchFinished || (language === 'bn' ? 'খেলা সমাপ্ত' : 'Finished'),
          formattedTime: `${displayTime} • ${match.date}`
        };
      } else {
        const positiveSecs = Math.max(0, diffSecs);
        const days = Math.floor(positiveSecs / 86400);
        const hoursLeft = Math.floor((positiveSecs % 86400) / 3600);
        const minutesLeft = Math.floor((positiveSecs % 3600) / 60);
        const secondsLeft = positiveSecs % 60;
        const isUrgent = positiveSecs > 0 && positiveSecs <= 30 * 60; // < 30 mins
        const isCritical = positiveSecs > 0 && positiveSecs <= 10 * 60; // < 10 mins

        const pad = (n: number) => String(n).padStart(2, '0');

        let countdownText = '';
        if (days > 0) {
          countdownText = `${days}d ${pad(hoursLeft)}h ${pad(minutesLeft)}m`;
        } else {
          countdownText = `${pad(hoursLeft)}:${pad(minutesLeft)}:${pad(secondsLeft)}`;
        }

        return {
          isLive: false,
          isFinished: false,
          isUpcoming: true,
          diffSecs: positiveSecs,
          days,
          hours: hoursLeft,
          minutes: minutesLeft,
          seconds: secondsLeft,
          isUrgent,
          isCritical,
          countdownText,
          formattedTime: `${displayTime} • ${match.date}`
        };
      }
    } catch {
      const fallbackDisplayTime = match.matchTime || match.startTime || '00:00';
      return {
        isLive: match.status === 'live',
        isFinished: match.status === 'finished',
        isUpcoming: match.status !== 'live' && match.status !== 'finished',
        diffSecs: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isUrgent: false,
        isCritical: false,
        countdownText: fallbackDisplayTime,
        formattedTime: `${fallbackDisplayTime} • ${match.date}`
      };
    }
  };

  // Sport counts
  const getSportCount = (sportId: string) => {
    if (sportId === 'ALL') return localMatches.length;
    return localMatches.filter(m => m.sport.toLowerCase() === sportId.toLowerCase()).length;
  };

  // Filter matches
  const filteredMatches = useMemo(() => {
    return localMatches.filter(m => {
      // Sport filter
      if (selectedSport !== 'ALL' && m.sport.toLowerCase() !== selectedSport.toLowerCase()) {
        return false;
      }

      const timeInfo = getMatchTimeInfo(m);
      if (subFilter === 'recent') return timeInfo.isFinished;
      if (subFilter === 'live') return timeInfo.isLive;
      if (subFilter === 'upcoming') return timeInfo.isUpcoming;
      return true;
    }).sort((a, b) => {
      const aInfo = getMatchTimeInfo(a);
      const bInfo = getMatchTimeInfo(b);
      // Put live matches first, then upcoming by shortest time remaining, then finished
      if (aInfo.isLive && !bInfo.isLive) return -1;
      if (!aInfo.isLive && bInfo.isLive) return 1;
      if (aInfo.isUpcoming && bInfo.isUpcoming) return aInfo.diffSecs - bInfo.diffSecs;
      if (aInfo.isUpcoming && !bInfo.isUpcoming) return -1;
      if (!aInfo.isUpcoming && bInfo.isUpcoming) return 1;
      return 0;
    });
  }, [localMatches, selectedSport, subFilter, now]);

  // Nearest upcoming match for the spotlight countdown banner
  const nextUpcomingMatch = useMemo(() => {
    const upcomingList = localMatches
      .filter(m => {
        const info = getMatchTimeInfo(m);
        return info.isUpcoming && info.diffSecs > 0;
      })
      .sort((a, b) => {
        const aInfo = getMatchTimeInfo(a);
        const bInfo = getMatchTimeInfo(b);
        return aInfo.diffSecs - bInfo.diffSecs;
      });
    return upcomingList[0] || null;
  }, [localMatches, now]);

  // Counts for sub filters
  const recentCount = localMatches.filter(m => getMatchTimeInfo(m).isFinished).length;
  const liveCount = localMatches.filter(m => getMatchTimeInfo(m).isLive).length;
  const upcomingCount = localMatches.filter(m => getMatchTimeInfo(m).isUpcoming).length;

  const handleRequestPermission = async () => {
    setRequestingPerm(true);
    const perm = await notificationManager.requestPermission();
    setNotificationPermission(perm);
    setRequestingPerm(false);
  };

  const handleToggleNotify = async (matchId: string) => {
    if (notificationPermission !== 'granted') {
      const perm = await notificationManager.requestPermission();
      setNotificationPermission(perm);
    }

    setLocalMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        const next = !m.isUserNotified;
        if (next) {
          toast.success(`⏰ Reminder set for "${m.title}" at ${m.matchTime || m.startTime}`);
        } else {
          toast.info(`🔔 Reminder cancelled for "${m.title}"`);
        }
        return { ...m, isUserNotified: next };
      }
      return m;
    }));

    if (onNotificationToggle) onNotificationToggle(matchId);
    await apiToggleMatchNotify(matchId);
  };

  const handlePlayMatchChannel = (match: Match) => {
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
    if (!targetChannel && channels.length > 0) {
      targetChannel = channels[0];
    }

    if (targetChannel) {
      onSelectChannel(targetChannel);
      const playerEl = document.getElementById('main-video-player');
      if (playerEl) {
        playerEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section 
      id="upcoming-matches-section" 
      className="my-6 bg-[#0a0f1d] border border-slate-800/90 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden"
    >
      {/* Background ambient accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Alert Bar */}
      <div className="relative z-10 mb-4 bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-800/40 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <span className="flex h-3 w-3 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
          <div>
            <p className="text-white text-xs sm:text-sm font-black tracking-wide flex items-center gap-1.5 justify-center sm:justify-start">
              <Timer className="w-4 h-4 text-cyan-400 inline" />
              <span>{language === 'bn' ? 'আসন্ন ম্যাচ ও লাইভ ইভেন্ট কাউন্টডাউন' : 'Live Match Fixtures & Event Countdown'}</span>
            </p>
            <p className="text-slate-400 text-[11px]">
              {language === 'bn' ? 'সরাসরি সম্প্রচার শুরুর ৩০ মি., ১৫ মি., ৫ মি. পূর্বে ও LIVE হলে স্বয়ংক্রিয় রিয়েল-টাইম সাউন্ড অ্যালার্ট' : 'Automatic real-time sound alerts 30m, 15m, 5m before match and when LIVE'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {notificationPermission === 'granted' ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t.alertActive || (language === 'bn' ? 'অ্যালার্ট সক্রিয়' : 'Alerts Active')}</span>
            </div>
          ) : (
            <button
              onClick={handleRequestPermission}
              disabled={requestingPerm}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{requestingPerm ? (language === 'bn' ? 'অনুরোধ হচ্ছে...' : 'Requesting...') : (t.enableAlerts || (language === 'bn' ? 'অ্যালার্ট চালু করুন' : 'Enable Alerts'))}</span>
            </button>
          )}

          <button
            onClick={() => notificationManager.testNotification()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer"
            title="Notification Sound Test"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.soundTest || (language === 'bn' ? 'সাউন্ড টেস্ট' : 'Sound Test')}</span>
          </button>
        </div>
      </div>

      {/* Sport Categories Circular Bar */}
      <div className="relative z-10 flex items-center gap-4 sm:gap-6 overflow-x-auto py-2 no-scrollbar border-b border-slate-800/80 mb-4 px-2">
        {sportCategories.map(cat => {
          const isSelected = selectedSport.toLowerCase() === cat.id.toLowerCase();
          const count = getSportCount(cat.id);
          const Icon = cat.icon;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedSport(cat.id)}
              className="flex flex-col items-center gap-1.5 cursor-pointer group focus:outline-none shrink-0"
            >
              <div className="relative">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 border-2 shadow-lg ${
                  isSelected 
                    ? 'bg-gradient-to-tr from-cyan-600 to-blue-500 border-cyan-300 ring-2 ring-cyan-400/40 scale-105' 
                    : 'bg-[#111a2e] border-slate-700 hover:border-slate-500 group-hover:bg-[#182440]'
                }`}>
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'}`} />
                </div>

                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[20px] h-5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-[#0a0f1d] shadow-md">
                  {count}
                </span>
              </div>

              <span className={`text-xs font-bold transition ${
                isSelected ? 'text-cyan-400 font-extrabold' : 'text-slate-400 group-hover:text-slate-200'
              }`}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sub-Filters: All | Recent | Live | Upcoming */}
      <div className="relative z-10 flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
        <button
          onClick={() => setSubFilter('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
            subFilter === 'all'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700'
          }`}
        >
          {language === 'bn' ? 'সকল' : 'All'} ({localMatches.length})
        </button>

        <button
          onClick={() => setSubFilter('live')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            subFilter === 'live'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700'
          }`}
        >
          {liveCount > 0 && <span className="w-2 h-2 rounded-full bg-white animate-ping" />}
          {language === 'bn' ? 'লাইভ' : 'Live'} ({liveCount})
        </button>

        <button
          onClick={() => setSubFilter('upcoming')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            subFilter === 'upcoming'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700'
          }`}
        >
          <Timer className="w-3.5 h-3.5" />
          {language === 'bn' ? 'আসন্ন কাউন্টডাউন' : 'Upcoming Countdown'} ({upcomingCount})
        </button>

        <button
          onClick={() => setSubFilter('recent')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
            subFilter === 'recent'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700'
          }`}
        >
          {language === 'bn' ? 'সমাপ্ত' : 'Recent'} ({recentCount})
        </button>
      </div>

      {/* Featured Next Event Anticipation Spotlight Banner */}
      {(subFilter === 'all' || subFilter === 'upcoming') && nextUpcomingMatch && (
        (() => {
          const info = getMatchTimeInfo(nextUpcomingMatch);
          const { team1, team2, logo1, logo2 } = getTeams(nextUpcomingMatch);
          const isUrgent = info.isUrgent;

          return (
            <div className={`relative z-10 mb-6 p-4 sm:p-5 rounded-2xl border shadow-2xl transition-all duration-500 overflow-hidden ${
              isUrgent 
                ? 'bg-gradient-to-br from-amber-950/60 via-slate-900 to-rose-950/60 border-amber-500/50 ring-1 ring-amber-500/30' 
                : 'bg-gradient-to-br from-cyan-950/50 via-slate-900 to-blue-950/60 border-cyan-500/40'
            }`}>
              {/* Top Accent Ribbon */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${
                    isUrgent
                      ? 'bg-amber-500 text-slate-950 animate-pulse'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  }`}>
                    {isUrgent ? <Flame className="w-3.5 h-3.5 fill-current" /> : <Sparkles className="w-3.5 h-3.5 text-cyan-300" />}
                    {isUrgent 
                      ? (language === 'bn' ? '⚡ খেলা খুব শীঘ্রই শুরু হচ্ছে!' : '⚡ KICKOFF IMMINENT - STARTING SOON')
                      : (language === 'bn' ? 'পরবর্তী লাইভ ইভেন্ট কাউন্টডাউন' : 'NEXT LIVE EVENT COUNTDOWN')
                    }
                  </span>

                  <span className="text-xs font-bold text-slate-400">
                    {nextUpcomingMatch.tournament || nextUpcomingMatch.sport}
                  </span>
                </div>

                <span className="text-xs font-bold text-cyan-300 font-mono">
                  {nextUpcomingMatch.matchTime || nextUpcomingMatch.startTime} • {nextUpcomingMatch.date}
                </span>
              </div>

              {/* Match Details + Live Countdown Display */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                {/* Teams Showcase (5 cols) */}
                <div className="lg:col-span-5 flex items-center justify-between gap-3">
                  <div className="flex-1 flex items-center gap-3 overflow-hidden">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-slate-950 border-2 border-slate-700 shrink-0 p-0.5 shadow-md flex items-center justify-center">
                      <img 
                        src={logo1} 
                        alt={team1} 
                        className="w-full h-full object-cover rounded-full" 
                        referrerPolicy="no-referrer"
                        loading="lazy" 
                      />
                    </div>
                    <div className="truncate">
                      <h3 className="text-sm sm:text-base font-black text-white leading-tight truncate">{team1}</h3>
                      <p className="text-[11px] text-slate-400 font-semibold">{nextUpcomingMatch.sport}</p>
                    </div>
                  </div>

                  <div className="px-2 py-1 bg-slate-800/90 rounded-lg border border-slate-700 text-slate-300 font-black text-xs uppercase tracking-widest shrink-0 shadow-sm">
                    VS
                  </div>

                  <div className="flex-1 flex items-center justify-end gap-3 text-right overflow-hidden">
                    <div className="truncate">
                      <h3 className="text-sm sm:text-base font-black text-white leading-tight truncate">{team2}</h3>
                      <p className="text-[11px] text-slate-400 font-semibold">{nextUpcomingMatch.broadcastChannel || 'Live HD'}</p>
                    </div>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-slate-950 border-2 border-slate-700 shrink-0 p-0.5 shadow-md flex items-center justify-center">
                      <img 
                        src={logo2} 
                        alt={team2} 
                        className="w-full h-full object-cover rounded-full" 
                        referrerPolicy="no-referrer"
                        loading="lazy" 
                      />
                    </div>
                  </div>
                </div>

                {/* Digital Countdown Timer Clock (5 cols) */}
                <div className="lg:col-span-5">
                  <div className="flex items-center justify-center gap-2 sm:gap-3 font-mono">
                    {/* Days */}
                    {info.days > 0 && (
                      <>
                        <div className="flex flex-col items-center">
                          <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-xl bg-slate-950/90 border border-cyan-500/30 flex items-center justify-center text-xl sm:text-2xl font-black text-cyan-300 shadow-inner">
                            {pad(info.days)}
                          </div>
                          <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 mt-1">
                            {language === 'bn' ? 'দিন' : 'DAYS'}
                          </span>
                        </div>
                        <span className={`text-xl sm:text-2xl font-black text-cyan-400/60 pb-5 ${tick ? 'opacity-100' : 'opacity-30'}`}>:</span>
                      </>
                    )}

                    {/* Hours */}
                    <div className="flex flex-col items-center">
                      <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-xl bg-slate-950/90 border border-cyan-500/30 flex items-center justify-center text-xl sm:text-2xl font-black text-cyan-300 shadow-inner">
                        {pad(info.hours)}
                      </div>
                      <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 mt-1">
                        {language === 'bn' ? 'ঘণ্টা' : 'HOURS'}
                      </span>
                    </div>

                    <span className={`text-xl sm:text-2xl font-black text-cyan-400/60 pb-5 ${tick ? 'opacity-100' : 'opacity-30'}`}>:</span>

                    {/* Minutes */}
                    <div className="flex flex-col items-center">
                      <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-xl bg-slate-950/90 border border-cyan-500/30 flex items-center justify-center text-xl sm:text-2xl font-black text-cyan-300 shadow-inner">
                        {pad(info.minutes)}
                      </div>
                      <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 mt-1">
                        {language === 'bn' ? 'মিনিট' : 'MINS'}
                      </span>
                    </div>

                    <span className={`text-xl sm:text-2xl font-black text-cyan-400/60 pb-5 ${tick ? 'opacity-100' : 'opacity-30'}`}>:</span>

                    {/* Seconds */}
                    <div className="flex flex-col items-center">
                      <div className={`w-14 sm:w-16 h-14 sm:h-16 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-black shadow-inner transition-colors ${
                        isUrgent 
                          ? 'bg-amber-950/80 border-2 border-amber-500 text-amber-300 animate-pulse' 
                          : 'bg-slate-950/90 border border-cyan-400 text-cyan-200'
                      }`}>
                        {pad(info.seconds)}
                      </div>
                      <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 mt-1">
                        {language === 'bn' ? 'সেকেন্ড' : 'SECS'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action CTA (2 cols) */}
                <div className="lg:col-span-2 flex flex-row lg:flex-col items-center justify-center gap-2">
                  <button
                    onClick={() => handlePlayMatchChannel(nextUpcomingMatch)}
                    className="flex-1 lg:w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition shadow-lg shadow-cyan-500/20 cursor-pointer"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>{nextUpcomingMatch.broadcastChannel || (language === 'bn' ? 'চ্যানেল প্রস্তুত' : 'Tune Channel')}</span>
                  </button>

                  <button
                    onClick={() => handleToggleNotify(nextUpcomingMatch.id)}
                    className={`flex-1 lg:w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      nextUpcomingMatch.isUserNotified !== false
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                    }`}
                  >
                    {nextUpcomingMatch.isUserNotified !== false ? (
                      <>
                        <BellRing className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'অ্যালার্ট সক্রিয়' : 'Alert Set'}</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'অ্যালার্ট দিন' : 'Notify Me'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* Match Cards Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMatches.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-2 text-slate-600" />
            <p className="text-base font-bold text-slate-300">
              {language === 'bn' ? 'কোনো ম্যাচ পাওয়া যায়নি' : 'No matches found'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'bn' ? 'অন্য ক্যাটাগরি বা ফিল্টার নির্বাচন করুন' : 'Try selecting another sport or filter'}
            </p>
          </div>
        ) : (
          filteredMatches.map(match => {
            const timeInfo = getMatchTimeInfo(match);
            const { team1, team2, logo1, logo2 } = getTeams(match);
            const isLive = timeInfo.isLive;
            const isUpcoming = timeInfo.isUpcoming;
            const isUrgent = timeInfo.isUrgent;
            const isNotified = match.isUserNotified !== false;

            return (
              <div
                key={match.id}
                className={`relative rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                  isLive
                    ? 'bg-gradient-to-b from-[#190e18] via-[#0d1424] to-[#0a0f1d] border-red-500/60 shadow-xl shadow-red-950/40 ring-1 ring-red-500/30'
                    : isUrgent
                    ? 'bg-gradient-to-b from-[#1c1209] via-[#0f172a] to-[#0a0f1d] border-amber-500/50 shadow-lg ring-1 ring-amber-500/20'
                    : 'bg-[#0f172a] hover:bg-[#141f38] border-slate-800 hover:border-slate-700 shadow-lg'
                }`}
              >
                {/* Match Card Top Row */}
                <div className="px-4 py-3 border-b border-slate-800/70 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate max-w-[45%]">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 truncate">
                      {match.tournament || `${match.sport} 2026`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Direct 1-Click 'Notify Me' Bell Icon on Card */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleNotify(match.id);
                      }}
                      className={`p-1.5 rounded-lg border transition-all duration-200 cursor-pointer flex items-center gap-1 text-xs font-bold ${
                        isNotified
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-sm shadow-emerald-500/20 ring-1 ring-emerald-500/30'
                          : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700/80 text-slate-400 hover:text-amber-300'
                      }`}
                      title={
                        isNotified
                          ? (language === 'bn' ? `🔔 "${match.title}" অ্যালার্ট চালু আছে (ক্লিক করে বন্ধ করুন)` : `🔔 Alert set for "${match.title}" (Click to turn off)`)
                          : (language === 'bn' ? `⏰ "${match.title}" শুরুর আগে অ্যালার্ট পেতে ক্লিক করুন` : `⏰ Notify me before "${match.title}" starts`)
                      }
                      aria-label="Toggle match notification alert"
                    >
                      {isNotified ? (
                        <BellRing className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                      ) : (
                        <Bell className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[10px] hidden sm:inline">
                        {isNotified 
                          ? (language === 'bn' ? 'অ্যালার্ট সক্রিয়' : 'Alert Set') 
                          : (language === 'bn' ? 'নোটিফাই' : 'Notify Me')}
                      </span>
                    </button>

                    {isLive ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-black animate-pulse shadow-sm shadow-red-600/40 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        LIVE NOW
                      </span>
                    ) : isUrgent ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black animate-pulse shadow-sm shadow-amber-500/40 shrink-0">
                        <Flame className="w-3 h-3 fill-current" />
                        {pad(timeInfo.minutes)}m {pad(timeInfo.seconds)}s
                      </span>
                    ) : isUpcoming ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 tracking-wide font-mono shrink-0">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>{timeInfo.countdownText}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                        {language === 'bn' ? 'সমাপ্ত' : 'Finished'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Card Middle Row: Teams & Logos */}
                <div className="p-4 flex items-center justify-between gap-2">
                  {/* Team 1 */}
                  <div className="flex-1 flex items-center gap-3 overflow-hidden">
                    <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full overflow-hidden bg-slate-900 border-2 border-slate-700 shrink-0 shadow-md p-0.5 flex items-center justify-center">
                      <img
                        src={logo1}
                        alt={team1}
                        className="w-full h-full object-cover rounded-full"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-sm sm:text-base font-black text-white tracking-tight leading-tight truncate">
                        {team1}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400">{language === 'bn' ? 'দল ১' : 'Team 1'}</span>
                    </div>
                  </div>

                  {/* VS Badge */}
                  <div className="px-2 shrink-0 flex flex-col items-center">
                    <span className="text-xs font-black text-slate-400 tracking-widest uppercase bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 shadow-sm">
                      VS
                    </span>
                  </div>

                  {/* Team 2 */}
                  <div className="flex-1 flex items-center justify-end gap-3 overflow-hidden text-right">
                    <div className="overflow-hidden">
                      <h4 className="text-sm sm:text-base font-black text-white tracking-tight leading-tight truncate">
                        {team2}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400">{language === 'bn' ? 'দল ২' : 'Team 2'}</span>
                    </div>
                    <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full overflow-hidden bg-slate-900 border-2 border-slate-700 shrink-0 shadow-md p-0.5 flex items-center justify-center">
                      <img
                        src={logo2}
                        alt={team2}
                        className="w-full h-full object-cover rounded-full"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                </div>

                {/* DEDICATED COUNTDOWN TIMER DISPLAY MODULE */}
                {isUpcoming && (
                  <div className={`mx-4 mb-3 p-2.5 sm:p-3 rounded-xl border shadow-inner transition-colors ${
                    isUrgent
                      ? 'bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-amber-950/40 border-amber-500/40'
                      : 'bg-gradient-to-r from-slate-900/90 via-[#0a1426] to-slate-900/90 border-cyan-500/20'
                  }`}>
                    {/* Header line */}
                    <div className="flex items-center justify-between mb-2 text-[10px] font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isUrgent ? 'bg-amber-400 animate-ping' : 'bg-cyan-400'}`} />
                        <span className={isUrgent ? 'text-amber-300 font-extrabold' : 'text-slate-300'}>
                          {isUrgent
                            ? (language === 'bn' ? '🔥 শীঘ্রই শুরু হচ্ছে' : '🔥 KICKOFF IMMINENT')
                            : (language === 'bn' ? 'ম্যাচ শুরু হতে বাকি' : 'STARTS IN')
                          }
                        </span>
                      </div>

                      <span className="text-slate-400 font-mono">
                        {match.matchTime || match.startTime}
                      </span>
                    </div>

                    {/* Segmented Digital Countdown Digits */}
                    {timeInfo.days > 0 ? (
                      /* 4 Columns (Days, Hours, Mins, Secs) */
                      <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
                        <div className="bg-slate-950/80 border border-slate-800 rounded-lg py-1 px-1">
                          <div className="text-base sm:text-lg font-black text-cyan-300 leading-tight">
                            {pad(timeInfo.days)}
                          </div>
                          <div className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">
                            {language === 'bn' ? 'দিন' : 'DAYS'}
                          </div>
                        </div>

                        <div className="bg-slate-950/80 border border-slate-800 rounded-lg py-1 px-1">
                          <div className="text-base sm:text-lg font-black text-cyan-300 leading-tight">
                            {pad(timeInfo.hours)}
                          </div>
                          <div className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">
                            {language === 'bn' ? 'ঘণ্টা' : 'HRS'}
                          </div>
                        </div>

                        <div className="bg-slate-950/80 border border-slate-800 rounded-lg py-1 px-1">
                          <div className="text-base sm:text-lg font-black text-cyan-300 leading-tight">
                            {pad(timeInfo.minutes)}
                          </div>
                          <div className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">
                            {language === 'bn' ? 'মিনিট' : 'MIN'}
                          </div>
                        </div>

                        <div className={`rounded-lg py-1 px-1 border transition-colors ${
                          isUrgent
                            ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 animate-pulse'
                            : 'bg-slate-950/80 border-cyan-500/30 text-cyan-400'
                        }`}>
                          <div className="text-base sm:text-lg font-black leading-tight">
                            {pad(timeInfo.seconds)}
                          </div>
                          <div className="text-[8px] sm:text-[9px] font-bold uppercase opacity-80">
                            {language === 'bn' ? 'সেকেন্ড' : 'SEC'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* 3 Columns (Hours, Mins, Secs) with wider boxes */
                      <div className="grid grid-cols-3 gap-2 text-center font-mono">
                        <div className="bg-slate-950/80 border border-slate-800 rounded-lg py-1.5 px-1">
                          <div className="text-lg sm:text-xl font-black text-cyan-300 leading-tight">
                            {pad(timeInfo.hours)}
                          </div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase">
                            {language === 'bn' ? 'ঘণ্টা' : 'HOURS'}
                          </div>
                        </div>

                        <div className="bg-slate-950/80 border border-slate-800 rounded-lg py-1.5 px-1">
                          <div className="text-lg sm:text-xl font-black text-cyan-300 leading-tight">
                            {pad(timeInfo.minutes)}
                          </div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase">
                            {language === 'bn' ? 'মিনিট' : 'MINS'}
                          </div>
                        </div>

                        <div className={`rounded-lg py-1.5 px-1 border transition-colors ${
                          isUrgent
                            ? 'bg-amber-950/60 border-amber-500/60 text-amber-300 animate-pulse'
                            : 'bg-slate-950/80 border-cyan-500/40 text-cyan-400'
                        }`}>
                          <div className="text-lg sm:text-xl font-black leading-tight">
                            {pad(timeInfo.seconds)}
                          </div>
                          <div className="text-[9px] font-bold uppercase opacity-80">
                            {language === 'bn' ? 'সেকেন্ড' : 'SECS'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Live Match Notification Bar */}
                {isLive && (
                  <div className="mx-4 mb-3 p-2 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-black text-red-300">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      {language === 'bn' ? 'সরাসরি সম্প্রচার চলছে' : 'LIVE BROADCAST IN PROGRESS'}
                    </span>
                    <span className="text-[10px] font-bold text-red-400 bg-red-900/50 px-2 py-0.5 rounded border border-red-500/30">
                      {match.broadcastChannel || 'Live'}
                    </span>
                  </div>
                )}

                {/* Match Card Bottom Row */}
                <div className="px-4 py-3 bg-[#0a0f1d]/80 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {/* Broadcast Channel Badge */}
                  <button
                    onClick={() => handlePlayMatchChannel(match)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition border border-slate-700/60 truncate max-w-[140px] cursor-pointer"
                    title={language === 'bn' ? 'চ্যানেল দেখতে ক্লিক করুন' : 'Click to watch channel'}
                  >
                    <Tv className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{match.broadcastChannel || 'T Sports HD'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Remind Me / Notification Toggle Button */}
                    <button
                      onClick={() => handleToggleNotify(match.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        isNotified 
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                      title={isNotified ? (language === 'bn' ? 'রিমাইন্ডার সক্রিয়' : 'Reminder Set') : (language === 'bn' ? 'রিমাইন্ড সেট করুন' : 'Remind Me')}
                    >
                      {isNotified ? <BellRing className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Bell className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                      <span>
                        {isNotified 
                          ? (language === 'bn' ? 'অ্যালার্ট চালু' : 'Reminder Set') 
                          : (language === 'bn' ? 'রিমাইন্ড মি' : 'Remind Me')
                        }
                      </span>
                    </button>

                    {/* Watch Live / Channel Button */}
                    <button
                      onClick={() => handlePlayMatchChannel(match)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition shadow cursor-pointer ${
                        isLive
                          ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 animate-pulse'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isLive ? (t.watchLive || 'Watch Live') : (language === 'bn' ? 'চ্যানেল' : 'Channel')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="relative z-10 mt-5 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          {language === 'bn' ? (
            <span>অ্যালার্ট শিডিউল: খেলা শুরুর <strong>৩০ মি.</strong>, <strong>১৫ মি.</strong>, <strong>৫ মি.</strong> পূর্বে এবং <strong>🔴 লাইভ</strong> হলে নোটিফিকেশন প্রদান করা হয়।</span>
          ) : (
            <span>Alert Schedule: <strong>30m</strong>, <strong>15m</strong>, <strong>5m</strong> before kickoff and when <strong>🔴 LIVE</strong>.</span>
          )}
        </div>

        {onOpenAdmin && (
          <button
            onClick={onOpenAdmin}
            className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
          >
            {language === 'bn' ? 'এডমিন প্যানেলে নতুন ম্যাচ যুক্ত করুন' : 'Add new match in Admin Panel'}
          </button>
        )}
      </div>
    </section>
  );
};
