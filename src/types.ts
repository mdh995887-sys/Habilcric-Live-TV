export type VideoQuality = '4K' | 'Full HD' | 'HD' | 'SD' | 'Auto';

export interface Channel {
  id: string;
  channelNumber: number;
  name: string;
  bnName?: string;
  logo: string;
  category: string;
  categoryLabel?: string;
  categoryBn?: string;
  streamUrl: string;
  backupStreamUrl?: string;
  streamType?: 'hls' | 'video' | string;
  resolution?: string;
  description?: string;
  country: string;
  language: string;
  quality: VideoQuality;
  status: 'online' | 'offline';
  isFeatured: boolean;
  isPopular?: boolean;
  sortOrder: number;
  enabled: boolean;
  viewCount?: number;
  viewers?: number;
  currentShow?: string;
  currentShowBn?: string;
  nextShow?: string;
  nextShowBn?: string;
  latencyMs?: number;
  lastHealthCheckTime?: string;
  uptimePercentage?: number;
  healthError?: string;
  backupHealthStatus?: 'online' | 'offline' | 'n/a';
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
  color?: string;
}

export interface AppSettings {
  appName: string;
  appLogo: string;
  tagline: string;
  noticeText: string;
  noticeEnabled: boolean;
  footerText: string;
  themeColor: string;
  defaultCategory: string;
  autoPlay: boolean;
  defaultQuality: string;
  contactEmail: string;
  telegramLink: string;
  facebookLink: string;
  version: string;
  lastUpdated: string;
  appStatus: 'active' | 'maintenance';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  image?: string;
  link?: string;
  date: string;
  time: string;
  status: 'active' | 'archived';
  isFeatured: boolean;
  createdAt: string;
  eventStartTime?: string;
  channelId?: string;
  isScheduled?: boolean;
}

export interface MatchHighlight {
  id: string;
  matchId: string;
  title: string;
  type: 'goal' | 'wicket' | 'boundary' | 'highlight' | string;
  videoUrl: string;
  thumbnail?: string;
  duration?: string;
  timestamp?: string;
}

export interface Match {
  id: string;
  title: string; // e.g. "India vs Australia"
  tournament?: string; // e.g. "ICC Champions Trophy 2026"
  sport: 'Cricket' | 'Football' | 'Motorsport' | 'Tennis' | 'Basketball' | 'Sports News' | 'International' | 'WWE' | string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm or "10:00 am"
  matchTime?: string; // Stored match start time or ISO datetime (e.g. "20:00", "2026-09-16T20:00:00")
  channelId?: string;
  broadcastChannel?: string; // e.g. "T Sports HD"
  logo?: string;
  team1Name?: string;
  team1Logo?: string;
  team2Name?: string;
  team2Logo?: string;
  notify30: boolean;
  notify15: boolean;
  notify5: boolean;
  notifyLive?: boolean;
  isUserNotified?: boolean; // user toggled Notify Me
  status?: 'upcoming' | 'live' | 'finished';
  highlights?: MatchHighlight[];
}

export interface AdminAuthResponse {
  authenticated: boolean;
  token?: string;
  user?: {
    username: string;
    role: string;
  };
  message?: string;
  error?: string;
}

export interface AIMessage {
  id: string;
  type: 'match_alert' | 'short_message' | 'channel_notice' | 'breaking_news' | 'sports_update' | 'maintenance_notice';
  title: string;
  description: string;
  channelId?: string;
  channelName?: string;
  category?: string;
  image?: string;
  buttonText?: string;
  buttonUrl?: string;
  publishTime: string;
  expiryTime?: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt?: string;
}

export interface AdminImageItem {
  id: string;
  name: string;
  url: string;
  type: 'logo' | 'banner' | 'notification' | 'general';
  sizeBytes?: number;
  createdAt: string;
}

export type IssueType = 'dead_stream' | 'buffering' | 'metadata' | 'audio_sync' | 'low_quality' | 'other';

export interface ChannelIssueReport {
  id: string;
  channelId: string;
  channelName: string;
  channelNumber: number;
  streamUrl?: string;
  activeServer?: number;
  issueType: IssueType;
  description?: string;
  timestamp: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  userDeviceInfo?: string;
  createdAt?: string;
}

export interface DatabaseState {
  channels: Channel[];
  categories: Category[];
  matches: Match[];
  appSettings: AppSettings;
  notifications: AppNotification[];
  aiMessages?: AIMessage[];
  images?: AdminImageItem[];
  reports?: ChannelIssueReport[];
  lastSyncTime: number;
}

export interface UserSettings {
  nightMode: boolean;
  autoTheme?: boolean;
  autoThemeMode?: 'system' | 'solar';
  dataSaving: boolean;
  onlyActive: boolean;
  showStatusDots: boolean;
  autoReconnect: boolean;
  autoPlay: boolean;
  autoFullscreen: boolean;
  hevcEnabled: boolean;
  hwAcceleration: boolean;
  retryDelay: number;
  showEpg: boolean;
  language?: 'bn' | 'en';
}

export interface HealthCheckLog {
  id: string;
  channelId: string;
  channelName: string;
  channelNumber: number;
  timestamp: string;
  status: 'online' | 'offline';
  latencyMs: number;
  httpStatus?: number;
  error?: string;
  checkedUrl: string;
}

export interface HealthCheckStats {
  lastRunTimestamp: number;
  lastRunFormatted: string;
  totalMonitored: number;
  onlineCount: number;
  offlineCount: number;
  systemUptimePercentage: number;
  averageLatencyMs: number;
  isScanning: boolean;
  activeIntervalSeconds: number;
  recentLogs: HealthCheckLog[];
}


