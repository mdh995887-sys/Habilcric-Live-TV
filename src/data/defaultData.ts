import { Channel, Category, AppSettings, AppNotification, Match } from '../types';
import rawChannels from './channels.json';

export const defaultAppSettings: AppSettings = {
  appName: "BD LIVE SPORTS TV",
  appLogo: "/icon.svg",
  tagline: "200 Live Cricket, Football, News, Movies & International Sports Channels",
  noticeText: "⚡ Welcome to BD LIVE SPORTS TV! 200 Live Channels across Cricket, Football, Bangla News, Movies, Hindi Movies, Songs & World Sports.",
  noticeEnabled: true,
  footerText: "© 2026 BD LIVE SPORTS TV. High Quality Sports & Entertainment Streaming.",
  themeColor: "#0ea5e9",
  defaultCategory: "LIVE NOW",
  autoPlay: true,
  defaultQuality: "Auto",
  contactEmail: "support@bdlivesportstv.com",
  telegramLink: "https://t.me/bdlivesportstv",
  facebookLink: "https://facebook.com/bdlivesportstv",
  version: "4.0.0",
  lastUpdated: new Date().toISOString(),
  appStatus: "active"
};

export const defaultCategories: Category[] = [
  { id: "cat-all", name: "All", slug: "all", icon: "Layers", sortOrder: 0, color: "#38bdf8" },
  { id: "cat-most-watched", name: "🔥 Most Watched", slug: "most-watched", icon: "Flame", sortOrder: 1, color: "#f59e0b" },
  { id: "cat-bd", name: "Bangladeshi", slug: "bangladesh", icon: "Tv", sortOrder: 2, color: "#10b981" },
  { id: "cat-islamic", name: "Islamic", slug: "islamic", icon: "Award", sortOrder: 3, color: "#059669" },
  { id: "cat-sports", name: "Sports", slug: "sports", icon: "Trophy", sortOrder: 4, color: "#0ea5e9" },
  { id: "cat-news", name: "News", slug: "news", icon: "Tv", sortOrder: 5, color: "#ec4899" },
  { id: "cat-movies", name: "Movies", slug: "movies", icon: "Clapperboard", sortOrder: 6, color: "#a855f7" },
  { id: "cat-entertainment", name: "Entertainment", slug: "entertainment", icon: "Theater", sortOrder: 7, color: "#f59e0b" },
  { id: "cat-indian", name: "Indian", slug: "indian", icon: "Globe", sortOrder: 8, color: "#f97316" },
  { id: "cat-international", name: "International", slug: "international", icon: "Globe", sortOrder: 9, color: "#6366f1" }
];

// Helper to arrange channels according to the Screenshot (1: T Sports HD, 2: PTV, 3: A Sports HD, 4: Willow Sports, 5: Euro Sports HD, 6: Bein Sports 1)
function buildOrderedChannels(): Channel[] {
  const all = (rawChannels as any[]) as Channel[];
  const findAndFormat = (predicate: (c: Channel) => boolean, targetName: string, chNum: number): Channel | null => {
    const found = all.find(predicate);
    if (!found) return null;
    return {
      ...found,
      name: targetName,
      channelNumber: chNum,
      sortOrder: chNum,
      isFeatured: true,
      status: 'online'
    };
  };

  const c1 = findAndFormat(c => c.name.toLowerCase().includes('t sports') || c.id === 'ch-tsports', 'T Sports HD', 1);
  const c2 = findAndFormat(c => c.name.toLowerCase().includes('ptv'), 'PTV', 2);
  const c3 = findAndFormat(c => c.name.toLowerCase().includes('a sports'), 'A Sports HD', 3);
  const c4 = findAndFormat(c => c.name.toLowerCase().includes('willow'), 'Willow Sports', 4);
  const c5 = findAndFormat(c => c.name.toLowerCase().includes('eurosport') || c.name.toLowerCase().includes('euro sport'), 'Euro Sports HD', 5);
  const c6 = findAndFormat(c => c.name.toLowerCase().includes('bein') && !c.name.includes('2') && !c.name.includes('3'), 'Bein Sports 1', 6);

  const top6 = [c1, c2, c3, c4, c5, c6].filter(Boolean) as Channel[];
  const topIds = new Set(top6.map(c => c.id));
  
  let currentNum = top6.length + 1;
  const rest = all.filter(c => !topIds.has(c.id)).map(c => ({
    ...c,
    channelNumber: currentNum++,
    sortOrder: currentNum
  }));

  return [...top6, ...rest];
}

export const defaultChannels: Channel[] = buildOrderedChannels();

// Helper to format ISO date & time relative to now for dynamic testing
const now = new Date();
const pad = (n: number) => n.toString().padStart(2, '0');
const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

// Match 1 in ~24 minutes
const timeIn24m = new Date(now.getTime() + 24 * 60 * 1000);
const start1 = `${pad(timeIn24m.getHours())}:${pad(timeIn24m.getMinutes())}`;

// Match 2 in ~48 minutes
const timeIn48m = new Date(now.getTime() + 48 * 60 * 1000);
const start2 = `${pad(timeIn48m.getHours())}:${pad(timeIn48m.getMinutes())}`;

// Match 3 in 2 hours
const timeIn2h = new Date(now.getTime() + 120 * 60 * 1000);
const start3 = `${pad(timeIn2h.getHours())}:${pad(timeIn2h.getMinutes())}`;

export const defaultMatches: Match[] = [
  {
    id: "match-cpl-01",
    title: "Namibia vs South Africa",
    sport: "Cricket",
    tournament: "CRICKET // 2026",
    date: todayStr,
    startTime: "10:00 am",
    channelId: "ch-1",
    broadcastChannel: "T Sports HD",
    logo: "🏏",
    team1Name: "Namibia",
    team2Name: "South Africa",
    notify30: true,
    notify15: true,
    notify5: true,
    notifyLive: true,
    isUserNotified: true,
    status: "upcoming"
  },
  {
    id: "match-cpl-02",
    title: "Guyana Amazon Warriors vs Antigua & Barbuda Falcons",
    sport: "Cricket",
    tournament: "Caribbean Premier League, 2026",
    date: todayStr,
    startTime: "02:00 am",
    channelId: "ch-2",
    broadcastChannel: "Willow Cricket HD",
    logo: "🏏",
    team1Name: "Guyana Amazon Warriors",
    team2Name: "Antigua & Barbuda Falcons",
    notify30: true,
    notify15: true,
    notify5: true,
    notifyLive: true,
    isUserNotified: true,
    status: "upcoming"
  },
  {
    id: "match-etpl-03",
    title: "ETPL vs ETPL",
    sport: "Cricket",
    tournament: "T20 Premier League",
    date: todayStr,
    startTime: "04:15 pm",
    channelId: "ch-3",
    broadcastChannel: "Star Sports 1",
    logo: "🏏",
    team1Name: "ETPL",
    team2Name: "ETPL",
    notify30: true,
    notify15: true,
    notify5: true,
    notifyLive: true,
    isUserNotified: true,
    status: "upcoming"
  },
  {
    id: "match-wt20-04",
    title: "Bangladesh Women vs United Arab Emirates",
    sport: "Cricket",
    tournament: "Women's T20, 2026",
    date: todayStr,
    startTime: "05:30 pm",
    channelId: "ch-1",
    broadcastChannel: "T Sports HD",
    logo: "🏏",
    team1Name: "Bangladesh Women",
    team2Name: "United Arab Emirates",
    notify30: true,
    notify15: true,
    notify5: true,
    notifyLive: true,
    isUserNotified: true,
    status: "upcoming"
  },
  {
    id: "match001",
    title: "India vs Australia",
    sport: "Cricket",
    tournament: "ICC Champions Trophy 2026",
    date: todayStr,
    startTime: start1,
    channelId: "ch-1",
    broadcastChannel: "T Sports HD",
    logo: "🏏",
    team1Name: "India",
    team2Name: "Australia",
    notify30: true,
    notify15: true,
    notify5: true,
    notifyLive: true,
    isUserNotified: true,
    status: "upcoming"
  },
  {
    id: "match002",
    title: "Real Madrid vs Barcelona",
    sport: "Football",
    tournament: "La Liga El Clásico",
    date: todayStr,
    startTime: start2,
    channelId: "ch-12",
    broadcastChannel: "beIN Sports 1",
    logo: "⚽",
    team1Name: "Real Madrid",
    team2Name: "Barcelona",
    notify30: true,
    notify15: true,
    notify5: true,
    notifyLive: true,
    isUserNotified: true,
    status: "upcoming"
  },
  {
    id: "match003",
    title: "Bangladesh vs Sri Lanka",
    sport: "Cricket",
    tournament: "Bilateral ODI Series",
    date: todayStr,
    startTime: start3,
    channelId: "ch-2",
    broadcastChannel: "GTV Live Sports",
    logo: "🏏",
    team1Name: "Bangladesh",
    team2Name: "Sri Lanka",
    notify30: true,
    notify15: true,
    notify5: true,
    notifyLive: true,
    isUserNotified: true,
    status: "upcoming"
  },
  {
    id: "match004",
    title: "Arsenal vs Manchester City",
    sport: "Football",
    tournament: "Premier League Super Match",
    date: todayStr,
    startTime: "21:30",
    channelId: "ch-13",
    broadcastChannel: "Sky Sports Premier League",
    logo: "⚽",
    team1Name: "Arsenal",
    team2Name: "Manchester City",
    notify30: true,
    notify15: true,
    notify5: true,
    notifyLive: true,
    isUserNotified: false,
    status: "upcoming"
  },
  {
    id: "match005",
    title: "Lewis Hamilton vs Max Verstappen",
    sport: "Motorsport",
    tournament: "Formula 1 Grand Prix",
    date: todayStr,
    startTime: "22:00",
    channelId: "ch-15",
    broadcastChannel: "Sky Sports F1 HD",
    logo: "🏎️",
    team1Name: "Lewis Hamilton",
    team2Name: "Max Verstappen",
    notify30: true,
    notify15: true,
    notify5: true,
    notifyLive: true,
    isUserNotified: false,
    status: "upcoming"
  },
  {
    id: "match008",
    title: "Roman Reigns vs Cody Rhodes",
    sport: "WWE",
    tournament: "WWE SmackDown Live",
    date: todayStr,
    startTime: "20:00",
    channelId: "ch-14",
    broadcastChannel: "Sony Sports Ten 1",
    logo: "🥊",
    team1Name: "Roman Reigns",
    team2Name: "Cody Rhodes",
    notify30: true,
    notify15: true,
    notify5: true,
    notifyLive: true,
    isUserNotified: true,
    status: "upcoming"
  },
  {
    id: "match006",
    title: "Novak Djokovic vs Carlos Alcaraz",
    sport: "Tennis",
    tournament: "US Open Men's Grand Slam Final",
    date: todayStr,
    startTime: "23:00",
    channelId: "ch-16",
    broadcastChannel: "Euro Sports HD",
    logo: "🎾",
    notify30: true,
    notify15: true,
    notify5: true,
    notifyLive: true,
    isUserNotified: false,
    status: "upcoming"
  },
  {
    id: "match007",
    title: "LA Lakers vs Golden State Warriors",
    sport: "Basketball",
    tournament: "NBA Championship Showcase",
    date: todayStr,
    startTime: "23:45",
    channelId: "ch-17",
    broadcastChannel: "ESPN Sports HD",
    logo: "🏀",
    notify30: true,
    notify15: true,
    notify5: true,
    notifyLive: true,
    isUserNotified: false,
    status: "upcoming"
  }
];

export const defaultNotifications: AppNotification[] = [
  {
    id: "notif-1",
    title: "🏏 Bangladesh vs Sri Lanka Live Series",
    message: "Watch Bangladesh Cricket Tour Live in 1080p 60fps on T Sports and GTV Sports. Server 1 & Server 2 active with zero lag!",
    date: "2026-09-07",
    time: "14:30",
    status: "active",
    isFeatured: true,
    createdAt: "2026-09-07T15:43:03.522Z",
    eventStartTime: new Date(Date.now() + 3600 * 1000 * 2).toISOString(),
    channelId: "ch-tsports",
    isScheduled: true
  },
  {
    id: "notif-2",
    title: "🏆 Champions League Matchday Highlights",
    message: "Real Madrid vs Manchester City & Arsenal vs Bayern fixtures streaming live across European Sports servers.",
    date: "2026-09-07",
    time: "20:00",
    status: "active",
    isFeatured: true,
    createdAt: "2026-09-07T15:43:03.522Z",
    eventStartTime: new Date(Date.now() + 3600 * 1000 * 5).toISOString(),
    channelId: "ch-star-sports-1",
    isScheduled: true
  },
  {
    id: "notif-3",
    title: "📺 Welcome to BD LIVE SPORTS TV v3.4",
    message: "New high-speed streaming infrastructure deployed with auto quality switching, multi-server backup, and TV remote navigation.",
    date: "2026-09-07",
    time: "09:00",
    status: "active",
    isFeatured: false,
    createdAt: "2026-09-07T15:43:03.522Z"
  }
];

export const defaultAIMessages: import('../types').AIMessage[] = [
  {
    id: "ai-msg-1",
    type: "match_alert",
    title: "🏏 Bangladesh vs India Mega Clash Today!",
    description: "Catch the high-voltage clash live in crystal clear Full HD on T Sports & GTV Live. Don't miss a single ball!",
    channelId: "ch-tsports",
    channelName: "T Sports",
    category: "CRICKET",
    buttonText: "Watch Live",
    buttonUrl: "",
    publishTime: new Date().toISOString(),
    status: "published",
    createdAt: new Date().toISOString()
  },
  {
    id: "ai-msg-2",
    type: "channel_notice",
    title: "⚡ Ultra-Fast 60fps HD Servers Active",
    description: "All sports streams are optimized with low latency buffering. If you face any buffering, switch backup server.",
    category: "SPORTS",
    buttonText: "Explore Channels",
    publishTime: new Date().toISOString(),
    status: "published",
    createdAt: new Date().toISOString()
  }
];

export const defaultImages: import('../types').AdminImageItem[] = [
  {
    id: "img-1",
    name: "T Sports HD Official Logo",
    url: "/logos/tsports.svg",
    type: "logo",
    createdAt: new Date().toISOString()
  },
  {
    id: "img-2",
    name: "Bein Sports Official Logo",
    url: "/logos/beinsports1.svg",
    type: "logo",
    createdAt: new Date().toISOString()
  },
  {
    id: "img-3",
    name: "Willow TV Cricket Logo",
    url: "/logos/willowtv.svg",
    type: "logo",
    createdAt: new Date().toISOString()
  },
  {
    id: "img-4",
    name: "App Default Icon",
    url: "/icon.svg",
    type: "logo",
    createdAt: new Date().toISOString()
  }
];
