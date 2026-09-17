// Web Notification API and Real-Time Match Alerts Manager
import { Match, Channel } from '../types';

export interface NotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
}

// In-app alert subscriber
export type AlertListener = (alert: {
  id: string;
  title: string;
  body: string;
  sport: string;
  channelId?: string;
  broadcastChannel?: string;
  type: '30m' | '15m' | '5m' | 'live';
  timestamp: number;
}) => void;

class NotificationManager {
  private listeners: Set<AlertListener> = new Set();
  private audioCtx: AudioContext | null = null;
  private sentAlerts: Set<string> = new Set();

  constructor() {
    this.loadSentAlerts();
  }

  private loadSentAlerts() {
    try {
      const stored = localStorage.getItem('bd_sports_sent_alerts');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.sentAlerts = new Set(parsed);
      }
    } catch {
      this.sentAlerts = new Set();
    }
  }

  private persistSentAlert(key: string) {
    this.sentAlerts.add(key);
    try {
      // Keep only recent 100 alerts
      const list = Array.from(this.sentAlerts).slice(-100);
      localStorage.setItem('bd_sports_sent_alerts', JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const perm = await Notification.requestPermission();
      return perm;
    } catch {
      return 'denied';
    }
  }

  public subscribe(listener: AlertListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Play subtle sports notification sound chime using Web Audio
  public playChime(isLive = false) {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      if (isLive) {
        // High alert whistle/chime for LIVE NOW
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
        osc2.frequency.setValueAtTime(880, now + 0.15);
        osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6
      } else {
        // Double ding for upcoming countdown
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.setValueAtTime(659.25, now + 0.12); // E5
        osc2.frequency.setValueAtTime(783.99, now + 0.24); // G5
      }

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isLive ? 0.6 : 0.45));

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch {
      // Audio autoplay may be guarded by user gesture
    }
  }

  // Parse match timestamp
  public getMatchStartTime(match: Match): number | null {
    try {
      if (!match.date || !match.startTime) return null;
      // Format: YYYY-MM-DD and HH:mm
      const [year, month, day] = match.date.split('-').map(Number);
      const [hours, minutes] = match.startTime.split(':').map(Number);
      if (!year || !month || !day) return null;
      const d = new Date(year, month - 1, day, hours || 0, minutes || 0, 0);
      return d.getTime();
    } catch {
      return null;
    }
  }

  // Check matches and trigger notifications
  public checkMatchSchedule(matches: Match[], onSelectChannel?: (channelId: string) => void) {
    const nowMs = Date.now();

    matches.forEach(match => {
      // If user disabled notify for this match, skip
      if (match.isUserNotified === false) return;

      const startTimeMs = this.getMatchStartTime(match);
      if (!startTimeMs) return;

      const diffMs = startTimeMs - nowMs;
      const diffMinutes = Math.floor(diffMs / (60 * 1000));

      const matchKeyBase = `${match.id}_${match.date}_${match.startTime}`;

      // 1. LIVE NOW ALERT (between 0 and 2 hours after start)
      if (diffMinutes <= 0 && diffMinutes >= -120) {
        const alertKey = `${matchKeyBase}_live`;
        if (!this.sentAlerts.has(alertKey) && match.notifyLive !== false) {
          this.triggerAlert({
            id: alertKey,
            title: `🔴 LIVE NOW: ${match.title}`,
            body: `${match.tournament ? match.tournament + ' • ' : ''}The match is playing live now! Watch on ${match.broadcastChannel || 'Live Sports'}.`,
            sport: match.sport,
            channelId: match.channelId,
            broadcastChannel: match.broadcastChannel,
            type: 'live',
            timestamp: nowMs
          }, onSelectChannel);
          this.persistSentAlert(alertKey);
        }
      }

      // 2. 5 MINUTES REMAINING ALERT (between 3 and 5 minutes before)
      else if (diffMinutes <= 5 && diffMinutes >= 3 && match.notify5 !== false) {
        const alertKey = `${matchKeyBase}_5m`;
        if (!this.sentAlerts.has(alertKey)) {
          this.triggerAlert({
            id: alertKey,
            title: `⚡ 5 Minutes to Kickoff: ${match.title}`,
            body: `Starting in 5 minutes! Live coverage starting on ${match.broadcastChannel || 'Sports TV'}.`,
            sport: match.sport,
            channelId: match.channelId,
            broadcastChannel: match.broadcastChannel,
            type: '5m',
            timestamp: nowMs
          }, onSelectChannel);
          this.persistSentAlert(alertKey);
        }
      }

      // 3. 15 MINUTES REMAINING ALERT (between 13 and 16 minutes before)
      else if (diffMinutes <= 15 && diffMinutes >= 13 && match.notify15 !== false) {
        const alertKey = `${matchKeyBase}_15m`;
        if (!this.sentAlerts.has(alertKey)) {
          this.triggerAlert({
            id: alertKey,
            title: `⏱️ 15 Minutes to Match: ${match.title}`,
            body: `${match.tournament || match.sport} starts in 15 minutes on ${match.broadcastChannel || 'Live Channel'}.`,
            sport: match.sport,
            channelId: match.channelId,
            broadcastChannel: match.broadcastChannel,
            type: '15m',
            timestamp: nowMs
          }, onSelectChannel);
          this.persistSentAlert(alertKey);
        }
      }

      // 4. 30 MINUTES REMAINING ALERT (between 28 and 32 minutes before)
      else if (diffMinutes <= 30 && diffMinutes >= 28 && match.notify30 !== false) {
        const alertKey = `${matchKeyBase}_30m`;
        if (!this.sentAlerts.has(alertKey)) {
          this.triggerAlert({
            id: alertKey,
            title: `🔔 Upcoming Match (30 Min): ${match.title}`,
            body: `${match.tournament ? match.tournament + ' • ' : ''}Starts in 30 minutes on ${match.broadcastChannel || 'Sports Channel'}.`,
            sport: match.sport,
            channelId: match.channelId,
            broadcastChannel: match.broadcastChannel,
            type: '30m',
            timestamp: nowMs
          }, onSelectChannel);
          this.persistSentAlert(alertKey);
        }
      }
    });
  }

  private triggerAlert(alert: {
    id: string;
    title: string;
    body: string;
    sport: string;
    channelId?: string;
    broadcastChannel?: string;
    type: '30m' | '15m' | '5m' | 'live';
    timestamp: number;
  }, onSelectChannel?: (channelId: string) => void) {
    // 1. Play audio chime
    this.playChime(alert.type === 'live');

    // 2. Notify in-app subscribers (Toast notification banner)
    this.listeners.forEach(fn => fn(alert));

    // 3. Trigger Browser Web Notification API
    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        const notif = new Notification(alert.title, {
          body: alert.body,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: alert.id,
          silent: false,
          requireInteraction: alert.type === 'live'
        });

        notif.onclick = () => {
          window.focus();
          if (alert.channelId && onSelectChannel) {
            onSelectChannel(alert.channelId);
          }
          notif.close();
        };
      } catch (err) {
        console.warn('Web Notification dispatch error:', err);
      }
    }
  }

  // Clear sent alert history for testing
  public resetHistory() {
    this.sentAlerts.clear();
    localStorage.removeItem('bd_sports_sent_alerts');
  }

  private schedulerInterval: any = null;

  public startScheduler(matches: Match[], onSelectChannel?: (channelId: string) => void) {
    this.stopScheduler();
    this.checkMatchSchedule(matches, onSelectChannel);
    this.schedulerInterval = setInterval(() => {
      this.checkMatchSchedule(matches, onSelectChannel);
    }, 15000); // Check every 15 seconds
  }

  public stopScheduler() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
  }

  public subscribeInAppNotifications(listener: (alert: { title: string; message: string; match: Match; type: string }) => void): () => void {
    const internalListener: AlertListener = (item) => {
      const dummyMatch: Match = {
        id: item.channelId || item.id,
        title: item.title,
        sport: item.sport,
        tournament: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        broadcastChannel: item.broadcastChannel || '',
        channelId: item.channelId || '',
        notify30: true,
        notify15: true,
        notify5: true,
        notifyLive: true,
        isUserNotified: true,
        status: item.type === 'live' ? 'live' : 'upcoming'
      };
      listener({
        title: item.title,
        message: item.body,
        match: dummyMatch,
        type: item.type
      });
    };
    return this.subscribe(internalListener);
  }

  public testNotification(onSelectChannel?: (channelId: string) => void) {
    this.triggerAlert({
      id: `test-alert-${Date.now()}`,
      title: '🔴 LIVE NOW: India vs Australia',
      body: 'ICC Champions Trophy 2026 Live Broadcast is starting on T Sports HD!',
      sport: 'Cricket',
      channelId: 'ch-1',
      broadcastChannel: 'T Sports HD',
      type: 'live',
      timestamp: Date.now()
    }, onSelectChannel);
  }
}

export const notificationManager = new NotificationManager();
