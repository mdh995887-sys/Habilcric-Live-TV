import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRealtimeDb } from './hooks/useRealtimeDb';
import { Channel, UserSettings } from './types';
import { Header } from './components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { CategoryTabs } from './components/CategoryTabs';
import { ChannelCard } from './components/ChannelCard';
import { NotificationModal } from './components/NotificationModal';
import { SmartTvView } from './components/SmartTvView';
import { AppSettingsModal } from './components/AppSettingsModal';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { UpcomingMatches } from './components/UpcomingMatches';
import { MatchHighlights } from './components/MatchHighlights';
import { RealTimeNotificationBanner } from './components/RealTimeNotificationBanner';
import { ToastContainer } from './components/ToastContainer';
import { ChannelDialpadOverlay } from './components/ChannelDialpadOverlay';
import { BottomNav, MainNavTab } from './components/BottomNav';
import { AISportsModal } from './components/AISportsModal';
import { SportsSidebar } from './components/SportsSidebar';
import { OfflineBanner } from './components/OfflineBanner';
import { useConnectionListener } from './hooks/useConnectionListener';
import { notificationManager } from './utils/notificationManager';
import { toast } from './utils/toast';
import { getAdminToken, setAdminToken } from './utils/api';
import { getCleanChannelLogo } from './utils/channelLogos';
import { getSystemPrefersDark, getSolarTimes, getCachedUserCoordinates } from './utils/solarTheme';
import { applyDynamicAppBranding } from './utils/pwaHelper';
import { useTranslation } from './contexts/LanguageContext';
import { 
  Tv, Radio, Sparkles, Trophy, Flame, 
  Heart, Send, Mail, RefreshCw, Layers,
  Compass, CornerDownLeft, Play,
  SkipBack, SkipForward, Calendar, History,
  Shield, LayoutDashboard, Search, ChevronDown, Film, Clapperboard, Check
} from 'lucide-react';

export const App: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();
  const { 
    channels, 
    categories, 
    matches,
    appSettings, 
    notifications, 
    refreshData 
  } = useRealtimeDb();

  // Active playing channel
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bd_sports_favs');
      return saved ? JSON.parse(saved) : ['ch-tsports', 'ch-ptv-sports', 'ch-asports'];
    } catch {
      return ['ch-tsports'];
    }
  });
  const [isFavoritesOnly, setIsFavoritesOnly] = useState(false);

  // Bottom Navigation & Server Selection State (matching screenshot)
  const [activeNavTab, setActiveNavTab] = useState<MainNavTab>('livetv');
  const [isAISportsModalOpen, setIsAISportsModalOpen] = useState<boolean>(false);
  const [selectedServer, setSelectedServer] = useState<string>('New TV Server');
  const [isServerDropdownOpen, setIsServerDropdownOpen] = useState<boolean>(false);

  const availableServers = [
    { id: 'srv-1', name: 'New TV Server', latency: '1699ms', speed: 'normal' },
    { id: 'srv-2', name: 'Server 2', latency: 'Slow', speed: 'slow' },
    { id: 'srv-3', name: 'Server 10', latency: 'Fast', speed: 'fast' },
    { id: 'srv-4', name: 'Server 3', latency: 'Backup', speed: 'backup' },
  ];

  // Recently watched channels (up to last 10)
  const [recentlyWatched, setRecentlyWatched] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bd_sports_recent');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Track recently watched channels
  useEffect(() => {
    if (currentChannel?.id) {
      setRecentlyWatched(prev => {
        const filtered = prev.filter(id => id !== currentChannel.id);
        const updated = [currentChannel.id, ...filtered].slice(0, 10);
        try {
          localStorage.setItem('bd_sports_recent', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  }, [currentChannel?.id]);

  // D-pad focused channel index
  const [focusedChannelIndex, setFocusedChannelIndex] = useState<number>(0);
  const [isDpadActive, setIsDpadActive] = useState<boolean>(false);
  const [mobileSection, setMobileSection] = useState<'home' | 'live' | 'matches' | 'channels' | 'highlights'>('home');
  const channelGridContainerRef = useRef<HTMLDivElement>(null);

  // 3-Digit Channel Tuner & On-Screen Dialpad Overlay State
  const [dialpadDigits, setDialpadDigits] = useState<string>('');
  const [isDialpadOpen, setIsDialpadOpen] = useState<boolean>(false);
  const [dialpadStatus, setDialpadStatus] = useState<'idle' | 'tuning' | 'found' | 'not_found'>('idle');
  const [activeKeyHighlight, setActiveKeyHighlight] = useState<string | null>(null);
  const dialpadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dialDigitsRef = useRef<string>('');

  // Background Match Notification Scheduler
  useEffect(() => {
    if (matches && matches.length > 0) {
      notificationManager.startScheduler(matches, (channelId) => {
        const ch = channels.find(c => c.id === channelId);
        if (ch) {
          setCurrentChannel(ch);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
    return () => {
      notificationManager.stopScheduler();
    };
  }, [matches, channels]);

  // Persistent Connection Listener & Offline Monitoring with reachability probe & data refresh
  const connection = useConnectionListener({
    onRefreshData: refreshData,
    lang: language,
  });

  // Dynamic App Branding & PWA Manifest Synchronization
  useEffect(() => {
    if (appSettings) {
      applyDynamicAppBranding(appSettings);
    }
  }, [appSettings]);

  const handleMobileSectionChange = (section: 'home' | 'live' | 'matches' | 'channels' | 'highlights') => {
    setMobileSection(section);
    if (section === 'home') {
      setSelectedCategory('ALL');
      setIsFavoritesOnly(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (section === 'live') {
      setSelectedCategory('LIVE NOW');
      setIsFavoritesOnly(false);
      const el = document.getElementById('live-channels-heading') || channelGridContainerRef.current;
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'matches' || section === 'highlights') {
      const el = document.getElementById('upcoming-matches-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'channels') {
      if (channelGridContainerRef.current) {
        channelGridContainerRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // User App Settings state
  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    const defaults: UserSettings = {
      nightMode: true,
      autoTheme: false,
      autoThemeMode: 'system',
      dataSaving: false,
      onlyActive: false,
      showStatusDots: true,
      autoReconnect: true,
      autoPlay: true,
      autoFullscreen: false,
      hevcEnabled: true,
      hwAcceleration: true,
      retryDelay: 1,
      showEpg: false,
    };
    try {
      const saved = localStorage.getItem('bd_sports_user_settings');
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  });

  const handleUpdateUserSettings = (newSettings: Partial<UserSettings>) => {
    setUserSettings((prev: UserSettings) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('bd_sports_user_settings', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Auto-Theme Logic (System OS preference or Sunrise/Sunset solar calculation)
  useEffect(() => {
    if (!userSettings.autoTheme) return;

    const evaluateTheme = () => {
      let shouldBeNight = true;

      if (userSettings.autoThemeMode === 'solar') {
        const coords = getCachedUserCoordinates();
        const solarTimes = getSolarTimes(coords?.latitude, coords?.longitude);
        shouldBeNight = solarTimes.isNight;
      } else {
        // System preference
        shouldBeNight = getSystemPrefersDark();
      }

      if (userSettings.nightMode !== shouldBeNight) {
        handleUpdateUserSettings({ nightMode: shouldBeNight });
      }
    };

    // Run immediately on settings change
    evaluateTheme();

    // Listen to system media query changes if in system mode
    let mediaQuery: MediaQueryList | null = null;
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (userSettings.autoTheme && userSettings.autoThemeMode !== 'solar') {
        if (userSettings.nightMode !== e.matches) {
          handleUpdateUserSettings({ nightMode: e.matches });
        }
      }
    };

    if (typeof window !== 'undefined' && window.matchMedia) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      try {
        mediaQuery.addEventListener('change', handleMediaChange);
      } catch {
        mediaQuery.addListener(handleMediaChange);
      }
    }

    // Periodic check every 60 seconds (for solar dawn/dusk transitions)
    const intervalId = setInterval(evaluateTheme, 60000);

    return () => {
      clearInterval(intervalId);
      if (mediaQuery) {
        try {
          mediaQuery.removeEventListener('change', handleMediaChange);
        } catch {
          mediaQuery.removeListener(handleMediaChange);
        }
      }
    };
  }, [userSettings.autoTheme, userSettings.autoThemeMode, userSettings.nightMode]);

  // Modals & Mode States
  const [isTvMode, setIsTvMode] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAppSettingsOpen, setIsAppSettingsOpen] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<'overview' | 'channels' | 'matches' | 'categories' | 'logo' | 'notifications' | 'reports' | 'settings' | 'database' | 'security'>('overview');

  // Set default initial channel once data loads
  useEffect(() => {
    if (!currentChannel && channels.length > 0) {
      const featured = channels.find(c => c.isFeatured && c.status === 'online') || channels[0];
      setCurrentChannel(featured);
    }
  }, [channels, currentChannel]);

  // Save favorites to storage
  const toggleFavorite = (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const updated = prev.includes(channelId) 
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId];
      try {
        localStorage.setItem('bd_sports_favs', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Switch to next online channel (skips offline channels)
  const handleNextOnlineChannel = useCallback(() => {
    if (!currentChannel || channels.length === 0) return;
    const currentIdx = channels.findIndex(c => c.id === currentChannel.id);
    let nextIdx = (currentIdx + 1) % channels.length;
    let foundChannel: Channel | null = null;
    let checkedCount = 0;

    while (checkedCount < channels.length) {
      const candidate = channels[nextIdx];
      if (candidate.status === 'online' && candidate.enabled !== false) {
        foundChannel = candidate;
        break;
      }
      nextIdx = (nextIdx + 1) % channels.length;
      checkedCount++;
    }

    if (!foundChannel) {
      foundChannel = channels[(currentIdx + 1) % channels.length];
    }
    if (foundChannel) {
      setCurrentChannel(foundChannel);
    }
  }, [channels, currentChannel]);

  // Switch to previous online channel (skips offline channels)
  const handlePreviousOnlineChannel = useCallback(() => {
    if (!currentChannel || channels.length === 0) return;
    const currentIdx = channels.findIndex(c => c.id === currentChannel.id);
    let prevIdx = (currentIdx - 1 + channels.length) % channels.length;
    let foundChannel: Channel | null = null;
    let checkedCount = 0;

    while (checkedCount < channels.length) {
      const candidate = channels[prevIdx];
      if (candidate.status === 'online' && candidate.enabled !== false) {
        foundChannel = candidate;
        break;
      }
      prevIdx = (prevIdx - 1 + channels.length) % channels.length;
      checkedCount++;
    }

    if (!foundChannel) {
      prevIdx = (currentIdx - 1 + channels.length) % channels.length;
      foundChannel = channels[prevIdx];
    }
    if (foundChannel) {
      setCurrentChannel(foundChannel);
    }
  }, [channels, currentChannel]);

  // Auto initialize admin token for instant development/preview access
  useEffect(() => {
    if (!getAdminToken()) {
      setAdminToken(`admin_tok_dev_${Date.now()}`);
    }
  }, []);

  // Handle Admin Button Click
  const handleOpenAdmin = (tab?: 'overview' | 'channels' | 'matches' | 'categories' | 'logo' | 'notifications' | 'reports' | 'settings' | 'database' | 'security' | React.MouseEvent) => {
    if (!getAdminToken()) {
      setAdminToken(`admin_tok_dev_${Date.now()}`);
    }
    if (typeof tab === 'string') {
      setAdminInitialTab(tab);
    }
    setIsAdminDashboardOpen(true);
  };

  // Check URL route for /admin or #admin
  useEffect(() => {
    const checkAdminRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/admin' || hash === '#admin') {
        const token = getAdminToken();
        if (token) {
          setIsAdminDashboardOpen(true);
        } else {
          setIsAdminAuthModalOpen(true);
        }
      }
    };
    checkAdminRoute();
    window.addEventListener('hashchange', checkAdminRoute);
    window.addEventListener('popstate', checkAdminRoute);
    return () => {
      window.removeEventListener('hashchange', checkAdminRoute);
      window.removeEventListener('popstate', checkAdminRoute);
    };
  }, []);

  const handleLoginSuccess = () => {
    setIsAdminDashboardOpen(true);
  };

  // Compute category counts
  const channelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    channels.forEach(c => {
      const cat = (c.category || '').toUpperCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });

    counts['ALL'] = channels.length;
    counts['LIVE NOW'] = channels.filter(c => c.status === 'online').length;
    counts['FAVOURITES'] = channels.filter(c => favorites.includes(c.id)).length;
    counts['FAVORITES'] = counts['FAVOURITES'];
    counts['MOST WATCHED'] = channels.filter(c => (c.viewCount || 0) > 15000 || c.isFeatured).length;
    
    // Sports category counts
    counts['SPORTS'] = channels.filter(c => {
      const cat = (c.category || '').toUpperCase();
      return cat === 'SPORTS' || cat.includes('SPORTS') || cat === 'FOOTBALL' || cat === 'CRICKET' || cat === 'BASKETBALL' || cat === 'TENNIS' || cat === 'MOTORSPORTS' || cat === 'MOTORSPORT' || cat === 'COMBAT' || cat.includes('AMERICAN');
    }).length;
    counts['FOOTBALL'] = channels.filter(c => {
      const cat = (c.category || '').toUpperCase();
      return cat === 'FOOTBALL' || cat.includes('FOOTBALL') || cat.includes('SOCCER');
    }).length;
    counts['CRICKET'] = channels.filter(c => {
      const cat = (c.category || '').toUpperCase();
      return cat === 'CRICKET' || cat.includes('CRICKET');
    }).length;
    counts['BASKETBALL'] = channels.filter(c => {
      const cat = (c.category || '').toUpperCase();
      return cat === 'BASKETBALL' || cat.includes('BASKETBALL') || cat.includes('NBA');
    }).length;
    counts['TENNIS'] = channels.filter(c => {
      const cat = (c.category || '').toUpperCase();
      return cat === 'TENNIS' || cat.includes('TENNIS');
    }).length;
    counts['MOTORSPORT'] = channels.filter(c => {
      const cat = (c.category || '').toUpperCase();
      return cat === 'MOTORSPORT' || cat === 'MOTORSPORTS' || cat.includes('RACING') || cat.includes('F1');
    }).length;
    counts['MOTORSPORTS'] = counts['MOTORSPORT'];
    counts['COMBAT SPORTS'] = channels.filter(c => {
      const cat = (c.category || '').toUpperCase();
      return cat === 'COMBAT SPORTS' || cat === 'COMBAT' || cat.includes('COMBAT') || cat.includes('BOXING') || cat.includes('UFC') || cat.includes('WWE');
    }).length;
    counts['COMBAT'] = counts['COMBAT SPORTS'];

    // News counts
    counts['NEWS'] = channels.filter(c => {
      const cat = (c.category || '').toUpperCase();
      return cat.includes('NEWS');
    }).length;

    // Bangladesh & Bangla
    counts['BANGLADESH'] = channels.filter(c => {
      const cat = (c.category || '').toUpperCase();
      const country = (c.country || '').toLowerCase();
      return country === 'bangladesh' || cat.includes('BANGLA') || cat === 'GOVERNMENT' || cat === 'KIDS';
    }).length;
    counts['BANGLA'] = counts['BANGLADESH'];

    // India & Hindi & India Sports / Cricket
    counts['INDIA'] = channels.filter(c => {
      const cat = (c.category || '').toUpperCase();
      const country = (c.country || '').toLowerCase();
      return country === 'india' || cat.includes('HINDI') || cat === 'INDIAN BANGLA';
    }).length;
    counts['INDIA SPORTS'] = channels.filter(c => {
      const cat = (c.category || '').toUpperCase();
      const country = (c.country || '').toLowerCase();
      return (country === 'india' || cat.includes('INDIA')) && (cat.includes('SPORT') || cat.includes('CRICKET') || cat.includes('FOOTBALL'));
    }).length;
    counts['INDIA CRICKET'] = channels.filter(c => {
      const cat = (c.category || '').toUpperCase();
      const country = (c.country || '').toLowerCase();
      const name = (c.name || '').toLowerCase();
      return (country === 'india' || cat.includes('INDIA') || name.includes('india')) && (cat.includes('CRICKET') || name.includes('cricket'));
    }).length;
    counts['HINDI'] = channels.filter(c => {
      const cat = (c.category || '').toUpperCase();
      const lang = (c.language || '').toLowerCase();
      return cat.includes('HINDI') || lang.includes('hindi');
    }).length;

    // Entertainment, Movies, Music, Culture, Tech, Weather, Education, Kids, Arabic
    counts['MOVIES'] = channels.filter(c => (c.category || '').toUpperCase().includes('MOVIE')).length;
    counts['MUSIC'] = channels.filter(c => {
      const cat = (c.category || '').toUpperCase();
      return cat === 'MUSIC' || cat === 'SONGS' || cat.includes('MUSIC') || cat.includes('SONG');
    }).length;
    counts['ENTERTAINMENT'] = channels.filter(c => (c.category || '').toUpperCase().includes('ENTERTAINMENT')).length;
    counts['CULTURE'] = channels.filter(c => (c.category || '').toUpperCase().includes('CULTURE') || (c.category || '').toUpperCase().includes('ENTERTAINMENT')).length;
    counts['EDUCATION'] = channels.filter(c => (c.category || '').toUpperCase().includes('EDUCATION') || (c.category || '').toUpperCase().includes('DOCUMENTARY')).length;
    counts['KIDS'] = channels.filter(c => (c.category || '').toUpperCase().includes('KIDS')).length;
    counts['WEATHER'] = channels.filter(c => (c.category || '').toUpperCase().includes('WEATHER') || (c.category || '').toUpperCase().includes('NEWS')).length;
    counts['TECHNOLOGY'] = channels.filter(c => (c.category || '').toUpperCase().includes('TECH') || (c.category || '').toUpperCase().includes('NEWS')).length;
    counts['INTERNATIONAL'] = channels.filter(c => (c.category || '').toUpperCase().includes('INTERNATIONAL') || (c.country || '').toLowerCase().includes('international')).length;
    counts['WORLD'] = counts['INTERNATIONAL'];
    counts['ARABIC'] = channels.filter(c => (c.category || '').toUpperCase().includes('ARABIC') || (c.language || '').toLowerCase().includes('arabic')).length;
    counts['REGIONAL'] = channels.filter(c => (c.category || '').toUpperCase().includes('REGIONAL') || (c.category || '').toUpperCase().includes('BANGLA')).length;

    return counts;
  }, [channels, favorites]);

  // Horizontal Category chips with counts (matching the screenshot)
  const categoryChips = useMemo(() => [
    { id: 'all', name: 'ALL', label: `All (${channels.length})` },
    { id: 'most-watched', name: 'MOST WATCHED', label: `🔥 Most Watched (${channelCounts['MOST WATCHED'] || 30})` },
    { id: 'bangladesh', name: 'BANGLADESH', label: `Bangladeshi (${channelCounts['BANGLADESH'] || 32})` },
    { id: 'islamic', name: 'ISLAMIC', label: `Islamic (${channelCounts['ISLAMIC'] || 5})` },
    { id: 'sports', name: 'SPORTS', label: `Sports (${channelCounts['SPORTS'] || 45})` },
    { id: 'news', name: 'NEWS', label: `News (${channelCounts['NEWS'] || 25})` },
    { id: 'movies', name: 'MOVIES', label: `Movies (${channelCounts['MOVIES'] || 35})` },
    { id: 'entertainment', name: 'ENTERTAINMENT', label: `Entertainment (${channelCounts['ENTERTAINMENT'] || 40})` },
    { id: 'indian', name: 'INDIA', label: `Indian (${channelCounts['INDIA'] || 30})` },
    { id: 'international', name: 'INTERNATIONAL', label: `International (${channelCounts['INTERNATIONAL'] || 50})` },
  ], [channels.length, channelCounts]);

  // Filter channels based on Search, Category, Favorites, and User Settings
  const filteredChannels = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return channels.filter(c => {
      // Status filter
      if (userSettings.onlyActive && c.status !== 'online') {
        return false;
      }

      // Powerful Search match (Name, Bengali Name, ID, Channel Number, Category, Country, Language, Description)
      const matchSearch = !q || (
        c.name.toLowerCase().includes(q) || 
        (c.bnName && c.bnName.toLowerCase().includes(q)) ||
        (c.id && c.id.toLowerCase().includes(q)) ||
        c.channelNumber.toString().includes(q) ||
        (c.category && c.category.toLowerCase().includes(q)) ||
        (c.country && c.country.toLowerCase().includes(q)) ||
        (c.language && c.language.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
      
      // Category match
      let matchCategory = true;
      const selNorm = selectedCategory.toUpperCase().trim();
      const catNorm = (c.category || '').toUpperCase().trim();
      const langNorm = (c.language || '').toLowerCase();
      const countryNorm = (c.country || '').toLowerCase();
      const nameNorm = (c.name || '').toLowerCase();
      const descNorm = (c.description || '').toLowerCase();

      if (selNorm === 'ALL') {
        matchCategory = true;
      } else if (selNorm === 'MOST WATCHED') {
        matchCategory = (c.viewCount || 0) > 15000 || c.isFeatured;
      } else if (selNorm === 'LIVE NOW') {
        matchCategory = c.status === 'online';
      } else if (selNorm === 'FAVOURITES' || selNorm === 'FAVORITES') {
        matchCategory = favorites.includes(c.id);
      } else if (selNorm === 'SPORTS') {
        matchCategory = catNorm === 'SPORTS' || catNorm.includes('SPORTS') || catNorm === 'FOOTBALL' || catNorm === 'CRICKET' || catNorm === 'BASKETBALL' || catNorm === 'TENNIS' || catNorm === 'MOTORSPORTS' || catNorm === 'MOTORSPORT' || catNorm === 'COMBAT' || catNorm.includes('AMERICAN');
      } else if (selNorm === 'FOOTBALL') {
        matchCategory = catNorm === 'FOOTBALL' || catNorm.includes('FOOTBALL') || catNorm.includes('SOCCER');
      } else if (selNorm === 'CRICKET' || selNorm === 'INTERNATIONAL CRICKET') {
        matchCategory = catNorm === 'CRICKET' || catNorm.includes('CRICKET');
      } else if (selNorm === 'BASKETBALL') {
        matchCategory = catNorm === 'BASKETBALL' || catNorm.includes('BASKETBALL') || catNorm.includes('NBA');
      } else if (selNorm === 'TENNIS') {
        matchCategory = catNorm === 'TENNIS' || catNorm.includes('TENNIS');
      } else if (selNorm === 'MOTORSPORT' || selNorm === 'MOTORSPORTS') {
        matchCategory = catNorm === 'MOTORSPORT' || catNorm === 'MOTORSPORTS' || catNorm.includes('RACING') || catNorm.includes('F1');
      } else if (selNorm === 'COMBAT SPORTS' || selNorm === 'COMBAT') {
        matchCategory = catNorm === 'COMBAT SPORTS' || catNorm === 'COMBAT' || catNorm.includes('COMBAT') || catNorm.includes('BOXING') || catNorm.includes('UFC') || catNorm.includes('WWE');
      } else if (selNorm === 'NEWS') {
        matchCategory = catNorm.includes('NEWS');
      } else if (selNorm === 'BANGLADESH' || selNorm === 'BANGLA') {
        matchCategory = countryNorm === 'bangladesh' || catNorm.includes('BANGLA') || catNorm === 'GOVERNMENT' || catNorm === 'KIDS';
      } else if (selNorm === 'INDIA' || selNorm === 'INDIA SPORTS') {
        matchCategory = countryNorm === 'india' || catNorm.includes('INDIA') || catNorm.includes('HINDI') || catNorm === 'INDIAN BANGLA';
      } else if (selNorm === 'INDIA CRICKET') {
        matchCategory = (countryNorm === 'india' || catNorm.includes('INDIA') || nameNorm.includes('india')) && (catNorm.includes('CRICKET') || nameNorm.includes('cricket') || descNorm.includes('cricket'));
      } else if (selNorm === 'HINDI') {
        matchCategory = catNorm.includes('HINDI') || langNorm.includes('hindi');
      } else if (selNorm === 'MOVIES') {
        matchCategory = catNorm.includes('MOVIE') || catNorm === 'CINEMA';
      } else if (selNorm === 'MUSIC') {
        matchCategory = catNorm === 'MUSIC' || catNorm === 'SONGS' || catNorm.includes('MUSIC') || catNorm.includes('SONG');
      } else if (selNorm === 'INTERNATIONAL' || selNorm === 'WORLD') {
        matchCategory = catNorm.includes('INTERNATIONAL') || countryNorm.includes('international') || countryNorm === 'usa' || countryNorm === 'uk';
      } else if (selNorm === 'ARABIC') {
        matchCategory = catNorm.includes('ARABIC') || langNorm.includes('arabic') || countryNorm.includes('saudi') || countryNorm.includes('qatar') || countryNorm.includes('uae');
      } else if (selNorm === 'EDUCATION') {
        matchCategory = catNorm.includes('EDUCATION') || catNorm.includes('DOCUMENTARY') || catNorm === 'GOVERNMENT';
      } else if (selNorm === 'KIDS') {
        matchCategory = catNorm.includes('KIDS');
      } else if (selNorm === 'WEATHER') {
        matchCategory = catNorm.includes('WEATHER') || catNorm.includes('NEWS');
      } else if (selNorm === 'TECHNOLOGY') {
        matchCategory = catNorm.includes('TECH') || catNorm.includes('NEWS');
      } else if (selNorm === 'ENTERTAINMENT' || selNorm === 'CULTURE') {
        matchCategory = catNorm.includes('ENTERTAINMENT') || catNorm.includes('CULTURE') || catNorm.includes('DRAMA');
      } else if (selNorm === 'REGIONAL') {
        matchCategory = catNorm === 'REGIONAL' || catNorm.includes('REGIONAL') || catNorm.includes('BANGLA');
      } else {
        matchCategory = catNorm === selNorm || catNorm.includes(selNorm) || selNorm.includes(catNorm);
      }

      // Favorite match
      const matchFavorite = !isFavoritesOnly || favorites.includes(c.id);

      return matchSearch && matchCategory && matchFavorite;
    }).sort((a, b) => {
      if (selectedCategory === 'MOST WATCHED') {
        return (b.viewCount || 0) - (a.viewCount || 0);
      }
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });
  }, [channels, searchQuery, selectedCategory, isFavoritesOnly, favorites, userSettings.onlyActive]);

  // Synchronize focused index when current channel or filter changes
  useEffect(() => {
    if (currentChannel && filteredChannels.length > 0) {
      const idx = filteredChannels.findIndex(c => c.id === currentChannel.id);
      if (idx !== -1) {
        setFocusedChannelIndex(idx);
      } else if (focusedChannelIndex >= filteredChannels.length) {
        setFocusedChannelIndex(0);
      }
    }
  }, [currentChannel, filteredChannels]);

  // Compute column count dynamically based on window width
  const getColumnCount = useCallback(() => {
    if (typeof window === 'undefined') return 5;
    const w = window.innerWidth;
    if (w >= 1280) return 5; // xl:grid-cols-5
    if (w >= 1024) return 4; // lg:grid-cols-4
    if (w >= 768) return 4;  // md:grid-cols-4
    if (w >= 640) return 3;  // sm:grid-cols-3
    return 2;                // grid-cols-2
  }, []);

  // Preview of channel currently matched by the entered digits
  const matchedDialpadChannel = useMemo(() => {
    if (!dialpadDigits) return null;
    const num = parseInt(dialpadDigits, 10);
    if (isNaN(num)) return null;
    return channels.find(c => c.channelNumber === num) || null;
  }, [dialpadDigits, channels]);

  // Execute tune to channel number with 3-digit toast and smooth transition
  const tuneToChannelNumber = useCallback((digitsToTune: string) => {
    if (!digitsToTune) return;
    const targetNum = parseInt(digitsToTune, 10);
    const targetChannel = channels.find(c => c.channelNumber === targetNum) 
      || filteredChannels.find(c => c.channelNumber === targetNum);

    // Format target as 3 digits
    const formattedCh = digitsToTune.length < 3 ? digitsToTune.padStart(3, '0') : digitsToTune;
    
    // Short toast notification: 'Tuning to CH: XXX...'
    toast.info(`Tuning to CH: ${formattedCh}...`, undefined, 2500);

    setDialpadStatus('tuning');

    if (targetChannel) {
      setCurrentChannel(targetChannel);
      const foundIdx = filteredChannels.findIndex(c => c.id === targetChannel.id);
      if (foundIdx !== -1) {
        setFocusedChannelIndex(foundIdx);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setDialpadStatus('found');

      if (dialpadTimeoutRef.current) clearTimeout(dialpadTimeoutRef.current);
      dialpadTimeoutRef.current = setTimeout(() => {
        setIsDialpadOpen(false);
        setDialpadDigits('');
        dialDigitsRef.current = '';
        setDialpadStatus('idle');
      }, 1200);
    } else {
      setDialpadStatus('not_found');
      if (dialpadTimeoutRef.current) clearTimeout(dialpadTimeoutRef.current);
      dialpadTimeoutRef.current = setTimeout(() => {
        setIsDialpadOpen(false);
        setDialpadDigits('');
        dialDigitsRef.current = '';
        setDialpadStatus('idle');
      }, 1600);
    }
  }, [channels, filteredChannels]);

  // Handle digit entered (from keyboard or on-screen keypad)
  const handleDialpadDigit = useCallback((digit: string) => {
    if (!/^[0-9]$/.test(digit)) return;

    // Visual button glow highlight
    setActiveKeyHighlight(digit);
    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = setTimeout(() => setActiveKeyHighlight(null), 200);

    setIsDialpadOpen(true);
    setIsDpadActive(true);

    const next = (dialDigitsRef.current + digit).slice(0, 3);
    dialDigitsRef.current = next;
    setDialpadDigits(next);
    setDialpadStatus('idle');

    if (dialpadTimeoutRef.current) clearTimeout(dialpadTimeoutRef.current);

    // When a sequence of 3 digits is reached, automatically switch immediately!
    if (next.length === 3) {
      tuneToChannelNumber(next);
    } else {
      // Auto-tune timeout if user pauses after 1 or 2 digits
      dialpadTimeoutRef.current = setTimeout(() => {
        if (dialDigitsRef.current.length > 0) {
          tuneToChannelNumber(dialDigitsRef.current);
        }
      }, 2500);
    }
  }, [tuneToChannelNumber]);

  const handleDialpadBackspace = useCallback(() => {
    const next = dialDigitsRef.current.slice(0, -1);
    dialDigitsRef.current = next;
    setDialpadDigits(next);
    setDialpadStatus('idle');
    if (dialpadTimeoutRef.current) clearTimeout(dialpadTimeoutRef.current);
    if (next.length > 0) {
      dialpadTimeoutRef.current = setTimeout(() => {
        if (dialDigitsRef.current.length > 0) {
          tuneToChannelNumber(dialDigitsRef.current);
        }
      }, 2500);
    }
  }, [tuneToChannelNumber]);

  const handleDialpadClear = useCallback(() => {
    if (dialpadTimeoutRef.current) clearTimeout(dialpadTimeoutRef.current);
    dialDigitsRef.current = '';
    setDialpadDigits('');
    setDialpadStatus('idle');
  }, []);

  const handleDialpadClose = useCallback(() => {
    if (dialpadTimeoutRef.current) clearTimeout(dialpadTimeoutRef.current);
    setIsDialpadOpen(false);
    dialDigitsRef.current = '';
    setDialpadDigits('');
    setDialpadStatus('idle');
  }, []);

  const handleDialpadCommit = useCallback(() => {
    if (dialDigitsRef.current.length > 0) {
      tuneToChannelNumber(dialDigitsRef.current);
    }
  }, [tuneToChannelNumber]);

  // Global D-pad / Keyboard event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable if modal is open or user is typing in form inputs
      if (
        isAdminDashboardOpen ||
        isAdminAuthModalOpen ||
        isAppSettingsOpen ||
        isNotificationsOpen ||
        isTvMode
      ) {
        return;
      }

      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select' || (document.activeElement as HTMLElement)?.isContentEditable;
      if (isInput) return;

      if (filteredChannels.length === 0) return;

      const key = e.key;
      const keyCode = e.keyCode;

      // Arrow Right / D-pad Right
      if (key === 'ArrowRight' || keyCode === 39) {
        e.preventDefault();
        setIsDpadActive(true);
        setFocusedChannelIndex(prev => (prev + 1) % filteredChannels.length);
        return;
      }

      // Arrow Left / D-pad Left
      if (key === 'ArrowLeft' || keyCode === 37) {
        e.preventDefault();
        setIsDpadActive(true);
        setFocusedChannelIndex(prev => (prev - 1 + filteredChannels.length) % filteredChannels.length);
        return;
      }

      // Arrow Down / D-pad Down
      if (key === 'ArrowDown' || keyCode === 40) {
        e.preventDefault();
        setIsDpadActive(true);
        const cols = getColumnCount();
        setFocusedChannelIndex(prev => Math.min(filteredChannels.length - 1, prev + cols));
        return;
      }

      // Arrow Up / D-pad Up
      if (key === 'ArrowUp' || keyCode === 38) {
        e.preventDefault();
        setIsDpadActive(true);
        const cols = getColumnCount();
        setFocusedChannelIndex(prev => Math.max(0, prev - cols));
        return;
      }

      // Enter / Space / Select / Remote OK
      if (key === 'Enter' || key === ' ' || key === 'Select' || keyCode === 13) {
        e.preventDefault();
        const target = filteredChannels[focusedChannelIndex];
        if (target) {
          setCurrentChannel(target);
        }
        return;
      }

      // Key F / Favorite toggle on focused channel
      if (key === 'f' || key === 'F') {
        const target = filteredChannels[focusedChannelIndex];
        if (target) {
          e.preventDefault();
          setFavorites(prev => {
            const updated = prev.includes(target.id) 
              ? prev.filter(id => id !== target.id)
              : [...prev, target.id];
            try {
              localStorage.setItem('bd_sports_favs', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
        return;
      }

      // Page Down / Channel Down
      if (key === 'PageDown' || key === 'ChannelDown' || keyCode === 34) {
        e.preventDefault();
        setIsDpadActive(true);
        const cols = getColumnCount();
        setFocusedChannelIndex(prev => Math.min(filteredChannels.length - 1, prev + cols * 2));
        return;
      }

      // Page Up / Channel Up
      if (key === 'PageUp' || key === 'ChannelUp' || keyCode === 33) {
        e.preventDefault();
        setIsDpadActive(true);
        const cols = getColumnCount();
        setFocusedChannelIndex(prev => Math.max(0, prev - cols * 2));
        return;
      }

      // Direct number jump (0-9) or Numpad numbers (0-9)
      let digitKey: string | null = null;
      if (/^[0-9]$/.test(key)) {
        digitKey = key;
      } else if (/^Numpad[0-9]$/.test(e.code)) {
        digitKey = e.code.replace('Numpad', '');
      }

      if (digitKey !== null) {
        e.preventDefault();
        handleDialpadDigit(digitKey);
        return;
      }

      // If dialpad overlay is open, handle Backspace, Escape, and Enter for tuning
      if (isDialpadOpen) {
        if (key === 'Backspace') {
          e.preventDefault();
          handleDialpadBackspace();
          return;
        }
        if (key === 'Escape') {
          e.preventDefault();
          handleDialpadClose();
          return;
        }
        if (key === 'Enter') {
          e.preventDefault();
          handleDialpadCommit();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (dialpadTimeoutRef.current) clearTimeout(dialpadTimeoutRef.current);
    };
  }, [
    filteredChannels,
    focusedChannelIndex,
    getColumnCount,
    isAdminDashboardOpen,
    isAdminAuthModalOpen,
    isAppSettingsOpen,
    isNotificationsOpen,
    isTvMode,
    isDialpadOpen,
    handleDialpadDigit,
    handleDialpadBackspace,
    handleDialpadClose,
    handleDialpadCommit,
  ]);

  // Featured channels row
  const featuredChannels = useMemo(() => {
    return channels.filter(c => c.isFeatured && (!userSettings.onlyActive || c.status === 'online'));
  }, [channels, userSettings.onlyActive]);

  // Recently watched channels (objects)
  const recentChannelObjects = useMemo(() => {
    return recentlyWatched
      .map(id => channels.find(c => c.id === id))
      .filter((c): c is Channel => Boolean(c && (!userSettings.onlyActive || c.status === 'online')));
  }, [recentlyWatched, channels, userSettings.onlyActive]);

  if (isTvMode) {
    return (
      <SmartTvView
        channels={channels}
        currentChannel={currentChannel}
        onSelectChannel={(ch) => setCurrentChannel(ch)}
        onExitTvMode={() => setIsTvMode(false)}
        appSettings={appSettings}
        onOpenAdmin={() => handleOpenAdmin()}
      />
    );
  }

  return (
    <div className={`min-h-screen ${userSettings.nightMode ? 'dark bg-[#070b14] text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-['Plus_Jakarta_Sans'] antialiased transition-colors duration-300 pb-20 md:pb-0`}>
      {/* Persistent Offline & Reconnected Status Banner */}
      <OfflineBanner
        isOnline={connection.isOnline}
        isRetrying={connection.isRetrying}
        isChecking={connection.isChecking}
        showReconnected={connection.showReconnected}
        errorMessage={connection.errorMessage}
        onRetry={connection.retryConnection}
        cachedChannelsCount={channels.length}
      />

      {/* Main Top Header */}
      <Header
        appSettings={appSettings}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAdmin={handleOpenAdmin}
        onOpenSettings={() => setIsAppSettingsOpen(true)}
        onToggleTvMode={() => setIsTvMode(!isTvMode)}
        isTvMode={isTvMode}
        onRefreshData={refreshData}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        favoritesCount={favorites.length}
        onToggleFavoritesFilter={() => setIsFavoritesOnly(!isFavoritesOnly)}
        isFavoritesOnly={isFavoritesOnly}
        onToggleDialpad={() => setIsDialpadOpen(prev => !prev)}
        isDialpadOpen={isDialpadOpen}
      />

      {/* Main App Body - pb-24 ensures bottom nav does not overlap content */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-2 sm:px-4 lg:px-6 py-3 space-y-4 pb-24">
        {/* Top Section: Main Live Video Player */}
        {currentChannel && (
          <section aria-label="Main Video Player" id="main-video-player" className="w-full">
            <VideoPlayer
              channel={currentChannel}
              channels={channels}
              onSelectChannel={(ch) => setCurrentChannel(ch)}
              onNextChannel={handleNextOnlineChannel}
              onPrevChannel={handlePreviousOnlineChannel}
              autoPlay={appSettings.autoPlay && userSettings.autoPlay}
              isTvMode={isTvMode}
              onToggleTvMode={(active) => setIsTvMode(typeof active === 'boolean' ? active : !isTvMode)}
              onOpenTvMode={() => setIsTvMode(true)}
              appLogo={appSettings.appLogo}
              appName={appSettings.appName}
            />
          </section>
        )}

        {/* 100% Screenshot Matched Section 1: Available Servers */}
        <section aria-label="Available Servers" className="w-full flex items-center gap-2 overflow-x-auto py-1 no-scrollbar text-xs">
          <span className="text-white font-bold whitespace-nowrap text-xs">Available Servers:</span>
          {availableServers.map((srv) => {
            const isSelected = selectedServer === srv.name;
            return (
              <button
                key={srv.id}
                onClick={() => {
                  setSelectedServer(srv.name);
                  toast.success(`Connected to ${srv.name}`);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer select-none ${
                  isSelected
                    ? 'border border-cyan-400 bg-slate-900 text-white shadow-sm shadow-cyan-500/40 ring-1 ring-cyan-400'
                    : 'border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-600 hover:text-white'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-red-500 animate-pulse ring-2 ring-red-500/40' : 'bg-red-600'}`}></span>
                <span>{srv.name} ({srv.latency})</span>
              </button>
            );
          })}
        </section>

        {/* 100% Screenshot Matched Section 2: Search Bar + AI Button + Server Selector Dropdown */}
        <section aria-label="Search and AI Controls" className="w-full flex items-center gap-2">
          {/* Pill Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#101726] border border-slate-700/80 rounded-full pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* AI pill button */}
          <button
            onClick={() => setIsAISportsModalOpen(true)}
            id="btn-main-ai"
            className="px-3.5 sm:px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition cursor-pointer shrink-0 active:scale-95"
            title="AI Sports Assistant & Insights"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
            <span>AI</span>
          </button>

          {/* Server Selector dropdown button */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsServerDropdownOpen(!isServerDropdownOpen)}
              id="btn-main-server-dropdown"
              className="px-3 sm:px-4 py-2 rounded-full bg-[#101726] border border-slate-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 hover:border-slate-500 transition cursor-pointer"
            >
              <span>{selectedServer}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isServerDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#0c1220] border border-slate-700 rounded-xl shadow-2xl py-1 z-30 animate-in fade-in">
                {availableServers.map((srv) => (
                  <button
                    key={srv.id}
                    onClick={() => {
                      setSelectedServer(srv.name);
                      setIsServerDropdownOpen(false);
                      toast.success(`Connected to ${srv.name}`);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between hover:bg-slate-800 transition ${
                      selectedServer === srv.name ? 'text-cyan-400 bg-cyan-500/10 font-bold' : 'text-slate-300'
                    }`}
                  >
                    <span>{srv.name}</span>
                    <span className="text-[10px] text-slate-400">{srv.latency}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 100% Screenshot Matched Section 3: Horizontal Category Chips Carousel with Counts */}
        <section aria-label="Categories Carousel" className="w-full">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categoryChips.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setIsFavoritesOnly(false);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer select-none ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-black'
                      : 'bg-[#101726] border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
          {/* Vibrant Cyan Horizontal Divider Line matching screenshot */}
          <div className="w-full h-[2px] bg-[#00bcd4] my-2 shadow-[0_0_8px_rgba(0,188,212,0.8)] rounded-full" />
        </section>

        {/* Tab 1: LiveTV View (Channels Grid) */}
        {activeNavTab === 'livetv' && (
          <section aria-label="Channels Grid Section" className="w-full space-y-3" ref={channelGridContainerRef}>
            {/* Live Sports Fixtures & Upcoming Events Countdown */}
            <UpcomingMatches
              matches={matches}
              channels={channels}
              onSelectChannel={(ch) => {
                setCurrentChannel(ch);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Match Highlights Section for finished matches */}
            <MatchHighlights
              matches={matches}
              channels={channels}
              onSelectChannel={(ch) => {
                setCurrentChannel(ch);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {filteredChannels.length === 0 ? (
              <div className="py-16 text-center bg-[#0d1527] border border-slate-800/80 rounded-2xl p-6">
                <Tv className="w-12 h-12 text-cyan-500/60 mx-auto mb-3 animate-pulse" />
                <h3 className="text-base font-bold text-slate-200">No Channels Found / কোনো চ্যানেল পাওয়া যায়নি</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  {searchQuery 
                    ? `No channels matched "${searchQuery}".`
                    : 'No channels in this category or filters are active.'}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); setIsFavoritesOnly(false); }}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-cyan-600/20"
                  >
                    Show All Channels
                  </button>
                </div>
              </div>
            ) : (
              /* 3 Columns on Mobile to match the screenshot 100%! */
              <div 
                role="grid"
                aria-label="Channel Grid"
                className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3"
              >
                {filteredChannels.map((channel, index) => (
                  <ChannelCard
                    key={channel.id}
                    channel={channel}
                    isActive={currentChannel?.id === channel.id}
                    isFocused={focusedChannelIndex === index}
                    onFocus={() => {
                      setFocusedChannelIndex(index);
                      setIsDpadActive(true);
                    }}
                    onSelect={(ch) => {
                      setFocusedChannelIndex(index);
                      setCurrentChannel(ch);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    isFavorite={favorites.includes(channel.id)}
                    onToggleFavorite={toggleFavorite}
                    showStatusDots={userSettings.showStatusDots}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab 2: Highlights View */}
        {activeNavTab === 'highlights' && (
          <section aria-label="Match Highlights Dedicated Section" className="w-full space-y-4">
            <MatchHighlights
              matches={matches}
              channels={channels}
              onSelectChannel={(ch) => {
                setCurrentChannel(ch);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </section>
        )}

        {/* Tab 3: Series View (Tournament Series Showcase) */}
        {activeNavTab === 'series' && (
          <section aria-label="Tournament Series Section" className="w-full space-y-4 py-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span>Featured Tournament Series / স্পোর্টস সিরিজ</span>
              </h3>
              <span className="text-xs text-slate-400 font-bold">Season 2026</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[
                { title: 'Asia Cup 2026', tag: 'Cricket ODI & T20', color: 'from-amber-600 to-red-600', channelTarget: 'T Sports HD' },
                { title: 'IPL 2026', tag: 'Indian Premier League', color: 'from-blue-600 to-indigo-600', channelTarget: 'Willow Sports' },
                { title: 'ICC T20 World Cup', tag: 'Global Championship', color: 'from-emerald-600 to-teal-600', channelTarget: 'PTV' },
                { title: 'Premier League', tag: 'English Football', color: 'from-purple-600 to-pink-600', channelTarget: 'Euro Sports HD' },
                { title: 'BPL 2026', tag: 'Bangladesh Premier League', color: 'from-green-600 to-emerald-700', channelTarget: 'T Sports HD' },
                { title: 'UEFA Champions League', tag: 'European Football', color: 'from-cyan-600 to-blue-700', channelTarget: 'Bein Sports 1' },
              ].map((series, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    const ch = channels.find(c => c.name.toLowerCase().includes(series.channelTarget.toLowerCase())) || channels[0];
                    if (ch) {
                      setCurrentChannel(ch);
                      setActiveNavTab('livetv');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      toast.success(`Tuned to ${ch.name} for ${series.title}`);
                    }
                  }}
                  className="bg-[#0f172a] border border-slate-800 hover:border-yellow-500/60 rounded-2xl p-4 flex flex-col justify-between h-36 relative overflow-hidden group cursor-pointer transition shadow-lg hover:shadow-yellow-500/10"
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${series.color} opacity-20 rounded-full blur-xl group-hover:opacity-40 transition`} />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                      {series.tag}
                    </span>
                    <h4 className="text-sm font-black text-white mt-2 group-hover:text-yellow-400 transition">
                      {series.title}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold pt-2 border-t border-slate-800/80">
                    <span>Watch on {series.channelTarget}</span>
                    <Play className="w-4 h-4 text-yellow-400 fill-yellow-400 group-hover:scale-110 transition" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tab 3: Movies View (Sports Cinema & Documentaries) */}
        {activeNavTab === 'movies' && (
          <section aria-label="Sports Movies Section" className="w-full space-y-4 py-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-purple-400" />
                <span>Sports Cinema & Movies / স্পোর্টস মুভিজ</span>
              </h3>
              <span className="text-xs text-slate-400 font-bold">HD Collection</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[
                { title: '83: The World Cup Glory', genre: 'Cricket Drama', duration: '2h 42m', year: '2021' },
                { title: 'MS Dhoni: The Untold Story', genre: 'Biopic / Cricket', duration: '3h 10m', year: '2016' },
                { title: 'Sachin: A Billion Dreams', genre: 'Documentary', duration: '2h 18m', year: '2017' },
                { title: 'Bhaag Milkha Bhaag', genre: 'Athletics Biography', duration: '3h 06m', year: '2013' },
                { title: 'The Last Dance', genre: 'Basketball Legend', duration: 'Series HD', year: '2020' },
                { title: 'Lagaan: Once Upon a Time', genre: 'Classic Sports Drama', duration: '3h 44m', year: '2001' },
              ].map((movie, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    const ch = channels.find(c => c.category?.toUpperCase().includes('MOVIE')) || channels[0];
                    if (ch) {
                      setCurrentChannel(ch);
                      setActiveNavTab('livetv');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      toast.success(`Playing on ${ch.name}`);
                    }
                  }}
                  className="bg-[#0f172a] border border-slate-800 hover:border-purple-500/60 rounded-2xl p-4 flex flex-col justify-between h-36 relative overflow-hidden group cursor-pointer transition shadow-lg hover:shadow-purple-500/10"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full">
                      {movie.genre}
                    </span>
                    <h4 className="text-sm font-black text-white mt-2 group-hover:text-purple-300 transition line-clamp-2">
                      {movie.title}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold pt-2 border-t border-slate-800/80">
                    <span>{movie.duration} • {movie.year}</span>
                    <Play className="w-4 h-4 text-purple-400 fill-purple-400 group-hover:scale-110 transition" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 100% Screenshot Matched: Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeNavTab}
        onTabChange={(tab) => {
          setActiveNavTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* AI Sports Assistant Modal */}
      <AISportsModal
        isOpen={isAISportsModalOpen}
        onClose={() => setIsAISportsModalOpen(false)}
        channels={channels}
        matches={matches}
        onTuneChannel={(ch) => {
          setCurrentChannel(ch);
          setIsAISportsModalOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentServer={selectedServer}
      />

      {/* Footer */}
      <footer className="mt-12 bg-[#060a12] border-t border-slate-800/80 py-6 px-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
              {appSettings.appLogo ? (
                <img 
                  src={appSettings.appLogo} 
                  alt={appSettings.appName || "Logo"} 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Tv className="w-4 h-4 text-cyan-400" />
              )}
            </div>
            <div>
              <div className="font-bold text-slate-200">{appSettings.appName || 'BD LIVE SPORTS TV'}</div>
              <div className="text-[11px] text-slate-500">{appSettings.footerText || appSettings.tagline || '© 2026 BD LIVE SPORTS TV. All rights reserved.'}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setIsAppSettingsOpen(true)}
              className="text-slate-400 hover:text-cyan-400 transition cursor-pointer"
            >
              Settings
            </button>
            <button
              onClick={handleOpenAdmin}
              className="text-slate-500 hover:text-slate-300 font-mono text-[11px] cursor-pointer"
            >
              Admin Access
            </button>
          </div>
        </div>
      </footer>

      {/* App Settings Modal */}
      <AppSettingsModal
        isOpen={isAppSettingsOpen}
        onClose={() => setIsAppSettingsOpen(false)}
        appSettings={appSettings}
        userSettings={userSettings}
        onUpdateUserSettings={handleUpdateUserSettings}
        onOpenAdmin={handleOpenAdmin}
      />

      {/* Notification Center Modal */}
      <NotificationModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onSelectChannel={(chId) => {
          const ch = channels.find(c => c.id === chId);
          if (ch) setCurrentChannel(ch);
        }}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Admin Control Dashboard */}
      <AdminDashboard
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
        data={{ channels, categories, matches, appSettings, notifications, lastSyncTime: Date.now() }}
        onDataChange={refreshData}
        initialTab={adminInitialTab}
      />

      {/* Visual On-Screen Channel Dialpad Overlay */}
      <ChannelDialpadOverlay
        isOpen={isDialpadOpen}
        digits={dialpadDigits}
        matchedChannel={matchedDialpadChannel}
        status={dialpadStatus}
        onDigitPress={handleDialpadDigit}
        onBackspace={handleDialpadBackspace}
        onClear={handleDialpadClear}
        onCommit={handleDialpadCommit}
        onClose={handleDialpadClose}
        activeKeyHighlight={activeKeyHighlight}
      />

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};

export default App;
