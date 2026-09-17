// Bilingual Translations: Bengali (বাংলা) & English
export type Language = 'bn' | 'en';

export interface Translations {
  // App Titles
  appName: string;
  tagline: string;
  dthBanner: string;
  dthBannerAction: string;
  proBadge: string;
  liveBadge: string;

  // Header
  searchPlaceholder: string;
  tvMode: string;
  refresh: string;
  notifications: string;
  settings: string;
  admin: string;
  favorites: string;
  share: string;
  update: string;
  langName: string;

  // Player & Controls
  previous: string;
  next: string;
  nowPlaying: string;
  selectChannelPrompt: string;
  server: string;
  quality: string;
  fullScreen: string;
  exitFullScreen: string;
  retry: string;
  streamOffline: string;
  reconnecting: string;

  // Categories
  all: string;
  liveNow: string;
  cricket: string;
  football: string;
  motorsport: string;
  tennis: string;
  basketball: string;
  sportsNews: string;
  international: string;
  bangladeshSports: string;
  indiaSports: string;
  worldSports: string;
  banglaNews: string;
  banglaMovies: string;
  hindiMovies: string;
  movies: string;
  songs: string;
  wwe: string;

  // Matches & Fixtures
  matchesTitle: string;
  matchesSubtitle: string;
  filterAll: string;
  filterRecent: string;
  filterLive: string;
  filterUpcoming: string;
  watchLive: string;
  setAlert: string;
  alertActive: string;
  matchFinished: string;
  noMatchesFound: string;
  soundTest: string;
  enableAlerts: string;

  // App Settings (Screenshot 1 Exact Labels)
  settingsTitle: string;
  nightMode: string;
  autoTheme: string;
  autoThemeDesc: string;
  autoThemeSystem: string;
  autoThemeSolar: string;
  dataSaving: string;
  onlyActive: string;
  showStatusDots: string;
  autoReconnect: string;
  autoPlay: string;
  autoFullscreen: string;
  hevc: string;
  hwAcceleration: string;
  retryDelay: string;
  ourOtherApps: string;
  aboutApp: string;
  contactDeveloper: string;
  joinTelegram: string;
  checkLatestVersion: string;
  shareCopyAppLink: string;
  showEpg: string;
  appLanguage: string;
  copiedToClipboard: string;

  // Share Modal
  shareModalTitle: string;
  shareModalSubtitle: string;
  copyLink: string;
  shareOnWhatsApp: string;
  shareOnTelegram: string;
  shareOnFacebook: string;
  moreShareOptions: string;

  // Update Modal
  updateModalTitle: string;
  checkingForUpdates: string;
  updateAvailable: string;
  upToDate: string;
  currentVersion: string;
  latestVersion: string;
  whatsNewTitle: string;
  updateNowBtn: string;
  closeBtn: string;

  // Bottom Navigation
  navHome: string;
  navLive: string;
  navTvMode: string;
  navCategories: string;
  navMatches: string;
  navAdmin: string;
}

export const translations: Record<Language, Translations> = {
  bn: {
    // App Titles
    appName: "বিডি লাইভ স্পোর্টস টিভি",
    tagline: "লাইভ ক্রিকেট, ফুটবল এবং ২০০+ এইচডি টিভি চ্যানেল স্ট্রিমিং",
    dthBanner: "DTH এর মতো ২০০+ লাইভ টিভি চ্যানেল দেখুন।",
    dthBannerAction: "এখানে ক্লিক করুন",
    proBadge: "প্রো",
    liveBadge: "লাইভ",

    // Header
    searchPlaceholder: "২০০+ স্পোর্টস, ক্রিকেট, খবর ও সিনেমা চ্যানেল খুঁজুন...",
    tvMode: "টিভি মুড",
    refresh: "রিফ্রেশ",
    notifications: "নোটিফিকেশন",
    settings: "সেটিংস",
    admin: "এডমিন",
    favorites: "প্রিয় চ্যানেল",
    share: "শেয়ার",
    update: "আপডেট",
    langName: "বাংলা",

    // Player & Controls
    previous: "পূর্ববর্তী",
    next: "পরবর্তী",
    nowPlaying: "এখন চলছে",
    selectChannelPrompt: "লাইভ দেখতে একটি চ্যানেল নির্বাচন করুন",
    server: "সার্ভার",
    quality: "কোয়ালিটি",
    fullScreen: "ফুল স্ক্রিন",
    exitFullScreen: "ফুল স্ক্রিন বন্ধ",
    retry: "পুনরায় চেষ্টা",
    streamOffline: "স্ট্রিম অফলাইন",
    reconnecting: "পুনরায় সংযোগ করা হচ্ছে...",

    // Categories
    all: "সব চ্যানেল",
    liveNow: "লাইভ চলছে",
    cricket: "ক্রিকেট",
    football: "ফুটবল",
    motorsport: "মোটরস্পোর্ট",
    tennis: "টেনিস",
    basketball: "বাস্কেটবল",
    sportsNews: "স্পোর্টস খবর",
    international: "আন্তর্জাতিক",
    bangladeshSports: "বাংলাদেশ স্পোর্টস",
    indiaSports: "ইন্ডিয়া স্পোর্টস",
    worldSports: "ওয়ার্ল্ড স্পোর্টস",
    banglaNews: "বাংলা খবর",
    banglaMovies: "বাংলা সিনেমা",
    hindiMovies: "হিন্দি সিনেমা",
    movies: "সিনেমা",
    songs: "গান ও মিউজিক",
    wwe: "ডব্লিউডব্লিউই",

    // Matches & Fixtures
    matchesTitle: "লাইভ স্পোর্টস ও আসন্ন ম্যাচের লাইভ সময়সূচী (Live Fixtures)",
    matchesSubtitle: "খেলা শুরুর ৩০ মি., ১৫ মি., ৫ মি. পূর্বে ও LIVE হলে স্বয়ংক্রিয় নোটিফিকেশন ও সাউন্ড অ্যালার্ট",
    filterAll: "সব ম্যাচ",
    filterRecent: "রিসেন্ট",
    filterLive: "লাইভ",
    filterUpcoming: "আসন্ন",
    watchLive: "লাইভ দেখুন",
    setAlert: "অ্যালার্ট সেট করুন",
    alertActive: "অ্যালার্ট সক্রিয়",
    matchFinished: "ম্যাচ সমাপ্ত",
    noMatchesFound: "কোনো ম্যাচ পাওয়া যায়নি",
    soundTest: "সাউন্ড টেস্ট",
    enableAlerts: "অ্যালার্ট চালু করুন",

    // App Settings (Screenshot 1 Exact Labels)
    settingsTitle: "App Settings",
    nightMode: "Night Mode",
    autoTheme: "Auto-Theme (স্বয়ংক্রিয় থিম)",
    autoThemeDesc: "সিস্টেম বা সূর্যোদয়-সূর্যাস্তের ভিত্তিতে স্বয়ংক্রিয়ভাবে থিম পরিবর্তন",
    autoThemeSystem: "সিস্টেম পছন্দ (OS System Preference)",
    autoThemeSolar: "সূর্যোদয় / সূর্যাস্ত (Sunrise / Sunset)",
    dataSaving: "Data Saving Mode (Lowest Quality)",
    onlyActive: "Only Active Channels",
    showStatusDots: "Show Channel Status Dots",
    autoReconnect: "Auto-Reconnect on Error",
    autoPlay: "Auto-play on Startup",
    autoFullscreen: "Auto Fullscreen on Channel Tap",
    hevc: "HEVC / H.265",
    hwAcceleration: "HW Acceleration",
    retryDelay: "Retry Delay",
    ourOtherApps: "Our others apps",
    aboutApp: "About app",
    contactDeveloper: "Contact Developer",
    joinTelegram: "Join Telegram Group",
    checkLatestVersion: "Check Latest Version",
    shareCopyAppLink: "Share & Copy App Link",
    showEpg: "Show EPG (TV Guide)",
    appLanguage: "App Language (ভাষা পরিবর্তন)",
    copiedToClipboard: "লিংক কপি করা হয়েছে!",

    // Share Modal
    shareModalTitle: "অ্যাপ শেয়ার করুন (Share App)",
    shareModalSubtitle: "বন্ধুবান্ধবদের সাথে অ্যাপ লিংক শেয়ার করুন এবং বাফারিং ছাড়া ২০০+ লাইভ চ্যানেল উপভোগ করুন!",
    copyLink: "অ্যাপ লিংক কপি করুন",
    shareOnWhatsApp: "হোয়াটসঅ্যাপে শেয়ার",
    shareOnTelegram: "টেলিগ্রামে শেয়ার",
    shareOnFacebook: "ফেসবুকে শেয়ার",
    moreShareOptions: "অন্যান্য মাধ্যমে শেয়ার",

    // Update Modal
    updateModalTitle: "সফটওয়্যার আপডেট (App Update)",
    checkingForUpdates: "আপডেট সার্ভার যাচাই করা হচ্ছে...",
    updateAvailable: "নতুন সংস্করণ উপলব্ধ!",
    upToDate: "আপনি অ্যাপটির সর্বশেষ ভার্সন ব্যবহার করছেন",
    currentVersion: "বর্তমান সংস্করণ",
    latestVersion: "সর্বশেষ সংস্করণ",
    whatsNewTitle: "নতুন যা যা যুক্ত হয়েছে (Changelog):",
    updateNowBtn: "এখনই আপডেট করুন (Reload)",
    closeBtn: "বন্ধ করুন",

    // Bottom Navigation
    navHome: "হোম",
    navLive: "লাইভ",
    navTvMode: "টিভি মুড",
    navCategories: "চ্যানেল",
    navMatches: "ফিক্সচার",
    navAdmin: "এডমিন"
  },
  en: {
    // App Titles
    appName: "BD LIVE SPORTS TV",
    tagline: "Live Cricket, Football, News & 200+ HD TV Channels Streaming",
    dthBanner: "Watch 200+ Live Tv Channels Like DTH.",
    dthBannerAction: "Click Here",
    proBadge: "PRO",
    liveBadge: "LIVE",

    // Header
    searchPlaceholder: "Search 200+ sports channels, news, movies...",
    tvMode: "TV Mode",
    refresh: "Refresh",
    notifications: "Notifications",
    settings: "Settings",
    admin: "Admin",
    favorites: "Favorites",
    share: "Share",
    update: "Update",
    langName: "English",

    // Player & Controls
    previous: "PREVIOUS",
    next: "NEXT",
    nowPlaying: "Now Playing",
    selectChannelPrompt: "Select a sports channel to start playback",
    server: "Server",
    quality: "Quality",
    fullScreen: "Full Screen",
    exitFullScreen: "Exit Full Screen",
    retry: "Retry Connection",
    streamOffline: "Stream Offline",
    reconnecting: "Reconnecting...",

    // Categories
    all: "ALL",
    liveNow: "LIVE NOW",
    cricket: "CRICKET",
    football: "FOOTBALL",
    motorsport: "MOTORSPORT",
    tennis: "TENNIS",
    basketball: "BASKETBALL",
    sportsNews: "SPORTS NEWS",
    international: "INTERNATIONAL",
    bangladeshSports: "BANGLADESH SPORTS",
    indiaSports: "INDIA SPORTS",
    worldSports: "WORLD SPORTS",
    banglaNews: "BANGLA NEWS",
    banglaMovies: "BANGLA MOVIES",
    hindiMovies: "HINDI MOVIES",
    movies: "MOVIES",
    songs: "SONGS",
    wwe: "WWE",

    // Matches & Fixtures
    matchesTitle: "Live Sports & Upcoming Match Fixtures Schedule",
    matchesSubtitle: "Automatic real-time sound alert & notification 30m, 15m, 5m before start and when LIVE",
    filterAll: "All",
    filterRecent: "Recent",
    filterLive: "Live",
    filterUpcoming: "Upcoming",
    watchLive: "Watch Live",
    setAlert: "Set Alert",
    alertActive: "Alert Active",
    matchFinished: "Match Finished",
    noMatchesFound: "No matches found",
    soundTest: "Sound Test",
    enableAlerts: "Enable Alerts",

    // App Settings (Screenshot 1 Exact Labels)
    settingsTitle: "App Settings",
    nightMode: "Night Mode",
    autoTheme: "Auto-Theme",
    autoThemeDesc: "Automatically toggle dark and light modes via system preference or sunrise/sunset",
    autoThemeSystem: "System Preference (OS)",
    autoThemeSolar: "Sunrise / Sunset (Local Sun Times)",
    dataSaving: "Data Saving Mode (Lowest Quality)",
    onlyActive: "Only Active Channels",
    showStatusDots: "Show Channel Status Dots",
    autoReconnect: "Auto-Reconnect on Error",
    autoPlay: "Auto-play on Startup",
    autoFullscreen: "Auto Fullscreen on Channel Tap",
    hevc: "HEVC / H.265",
    hwAcceleration: "HW Acceleration",
    retryDelay: "Retry Delay",
    ourOtherApps: "Our others apps",
    aboutApp: "About app",
    contactDeveloper: "Contact Developer",
    joinTelegram: "Join Telegram Group",
    checkLatestVersion: "Check Latest Version",
    shareCopyAppLink: "Share & Copy App Link",
    showEpg: "Show EPG (TV Guide)",
    appLanguage: "App Language (Change Language)",
    copiedToClipboard: "Link copied to clipboard!",

    // Share Modal
    shareModalTitle: "Share BD LIVE SPORTS TV",
    shareModalSubtitle: "Share app link with friends and family to enjoy 200+ live sports and TV channels without buffering!",
    copyLink: "Copy App Link",
    shareOnWhatsApp: "Share on WhatsApp",
    shareOnTelegram: "Share on Telegram",
    shareOnFacebook: "Share on Facebook",
    moreShareOptions: "More Share Options",

    // Update Modal
    updateModalTitle: "App Update Center",
    checkingForUpdates: "Checking update server...",
    updateAvailable: "New Update Available!",
    upToDate: "You are using the latest version",
    currentVersion: "Current Version",
    latestVersion: "Latest Version",
    whatsNewTitle: "What's New in this version (Changelog):",
    updateNowBtn: "Update Now (Reload)",
    closeBtn: "Close",

    // Bottom Navigation
    navHome: "Home",
    navLive: "Live",
    navTvMode: "TV Mode",
    navCategories: "Categories",
    navMatches: "Highlights",
    navAdmin: "Admin"
  }
};
