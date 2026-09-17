import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Channel, Category, AppSettings, AppNotification, DatabaseState, VideoQuality,
  HealthCheckStats, HealthCheckLog
} from '../../types';
import { 
  apiAddChannel, apiUpdateChannel, apiDeleteChannel, apiDeleteAllChannels, apiToggleChannel, 
  apiAddCategory, apiUpdateCategory, apiDeleteCategory, 
  apiUpdateAppSettings, apiCreateNotification, apiDeleteNotification, 
  apiImportDatabase, apiImportM3U, apiSyncCategories, apiChangePassword, clearAdminToken, apiReorderChannels,
  apiGetHealthStats, apiRunHealthCheck, apiCheckSingleStream, fetchAppData
} from '../../utils/api';
import { 
  mapM3uGroupToPredefinedCategory, 
  runAutomatedCategorySync, 
  PREDEFINED_CATEGORY_RULES, 
  CategorySyncReport,
  parseM3uWithAutomatedMapping,
  assignGroupMappingOverride,
  M3uAutomatedMappingResult
} from '../../utils/m3uCategorySync';
import { 
  LayoutDashboard, Tv, Layers, Image as ImageIcon, Bell, 
  Settings, Database, Lock, LogOut, Plus, Edit3, Trash2, 
  Copy, Check, X, Search, Upload, Camera, RefreshCw, 
  ShieldCheck, AlertTriangle, Eye, EyeOff, Radio, Server,
  Download, FileJson, ArrowUp, ArrowDown, ChevronRight, Activity,
  FileText, CheckCircle2, AlertCircle, HelpCircle, Code,
  Zap, Gauge, Wifi, Globe2, Globe, Flame, Trophy, Award, Film,
  Clapperboard, Music, Sparkles, Terminal, Clock, CheckCircle, XCircle, Calendar, Flag
} from 'lucide-react';
import { AdminMatchesTab } from './AdminMatchesTab';
import { AdminReportsTab } from './AdminReportsTab';
import { AppLogoManager } from './AppLogoManager';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  data: DatabaseState;
  onDataChange: () => void;
  initialTab?: AdminTab;
}

type AdminTab = 'overview' | 'channels' | 'matches' | 'categories' | 'logo' | 'notifications' | 'reports' | 'settings' | 'database' | 'security';

// Core Priority Category Badges for quick visual selection
const CORE_CATEGORY_BADGES = [
  {
    name: 'INTERNATIONAL',
    label: 'International',
    subLabel: 'আন্তর্জাতিক',
    icon: Globe,
    accent: 'indigo',
    activeClass: 'bg-gradient-to-br from-indigo-950/90 to-slate-900 border-indigo-400 text-white ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20',
    inactiveClass: 'bg-slate-900/80 hover:bg-indigo-950/40 border-slate-700/80 text-slate-300 hover:border-indigo-400/60 hover:text-white',
    iconColor: 'text-indigo-400',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
  },
  {
    name: 'SPORTS',
    label: 'Sports',
    subLabel: 'স্পোর্টস',
    icon: Flame,
    accent: 'cyan',
    activeClass: 'bg-gradient-to-br from-cyan-950/90 to-slate-900 border-cyan-400 text-white ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/20',
    inactiveClass: 'bg-slate-900/80 hover:bg-cyan-950/40 border-slate-700/80 text-slate-300 hover:border-cyan-400/60 hover:text-white',
    iconColor: 'text-cyan-400',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
  },
  {
    name: 'NEWS',
    label: 'News & Live',
    subLabel: 'খবর ও সংবাদ',
    icon: Tv,
    accent: 'rose',
    activeClass: 'bg-gradient-to-br from-rose-950/90 to-slate-900 border-rose-400 text-white ring-2 ring-rose-500/50 shadow-lg shadow-rose-500/20',
    inactiveClass: 'bg-slate-900/80 hover:bg-rose-950/40 border-slate-700/80 text-slate-300 hover:border-rose-400/60 hover:text-white',
    iconColor: 'text-rose-400',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  },
  {
    name: 'MOVIES',
    label: 'Movies & Cinema',
    subLabel: 'সিনেমা',
    icon: Clapperboard,
    accent: 'purple',
    activeClass: 'bg-gradient-to-br from-purple-950/90 to-slate-900 border-purple-400 text-white ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/20',
    inactiveClass: 'bg-slate-900/80 hover:bg-purple-950/40 border-slate-700/80 text-slate-300 hover:border-purple-400/60 hover:text-white',
    iconColor: 'text-purple-400',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  }
];

// Secondary popular categories
const POPULAR_CATEGORY_CHIPS = [
  { name: 'CRICKET', label: 'Cricket', icon: Award, color: 'text-blue-400' },
  { name: 'FOOTBALL', label: 'Football', icon: Trophy, color: 'text-emerald-400' },
  { name: 'BANGLA NEWS', label: 'Bangla News', icon: Tv, color: 'text-sky-400' },
  { name: 'BANGLA MOVIES', label: 'Bangla Movies', icon: Film, color: 'text-emerald-400' },
  { name: 'HINDI MOVIES', label: 'Hindi Movies', icon: Film, color: 'text-pink-400' },
  { name: 'SONGS', label: 'Songs & Music', icon: Music, color: 'text-fuchsia-400' },
  { name: 'MOTORSPORT', label: 'Motorsport', icon: Flame, color: 'text-orange-400' },
  { name: 'TENNIS', label: 'Tennis', icon: Award, color: 'text-lime-400' }
];

const getCategoryIcon = (categoryName: string) => {
  const upper = (categoryName || '').toUpperCase();
  if (upper.includes('CRICKET')) return <Award className="w-3.5 h-3.5 text-blue-400" />;
  if (upper.includes('FOOTBALL')) return <Trophy className="w-3.5 h-3.5 text-emerald-400" />;
  if (upper.includes('MOTOR') || upper.includes('FLAME')) return <Flame className="w-3.5 h-3.5 text-orange-400" />;
  if (upper.includes('TENNIS')) return <Award className="w-3.5 h-3.5 text-lime-400" />;
  if (upper.includes('BASKET')) return <Trophy className="w-3.5 h-3.5 text-amber-400" />;
  if (upper.includes('INTERNATIONAL') || upper.includes('GLOBE') || upper.includes('USA') || upper.includes('UK') || upper.includes('INDIA') || upper.includes('BANGLADESH')) {
    return <Globe className="w-3.5 h-3.5 text-indigo-400" />;
  }
  if (upper.includes('NEWS') || upper.includes('TV')) return <Tv className="w-3.5 h-3.5 text-rose-400" />;
  if (upper.includes('MOVIE') || upper.includes('CINEMA') || upper.includes('CLAPPERBOARD')) return <Clapperboard className="w-3.5 h-3.5 text-purple-400" />;
  if (upper.includes('FILM')) return <Film className="w-3.5 h-3.5 text-pink-400" />;
  if (upper.includes('SONG') || upper.includes('MUSIC')) return <Music className="w-3.5 h-3.5 text-fuchsia-400" />;
  if (upper.includes('SPARKLE')) return <Sparkles className="w-3.5 h-3.5 text-yellow-400" />;
  if (upper.includes('SPORTS')) return <Flame className="w-3.5 h-3.5 text-cyan-400" />;
  return <Layers className="w-3.5 h-3.5 text-slate-400" />;
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  data,
  onDataChange,
  initialTab = 'overview',
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Channel Form Modal States
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [channelForm, setChannelForm] = useState<Partial<Channel>>({
    name: '',
    channelNumber: 1,
    category: 'SPORTS',
    streamUrl: '',
    backupStreamUrl: '',
    logo: '',
    description: '',
    country: 'Bangladesh',
    language: 'Bangla',
    quality: 'Full HD',
    status: 'online',
    isFeatured: false,
    enabled: true,
  });

  // Category Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: 'Tv', color: '#0ea5e9' });

  // Notification Modal States
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [notifForm, setNotifForm] = useState({ title: '', message: '', image: '', link: '', isFeatured: true, eventStartTime: '', channelId: '' });

  // App Settings Local State
  const [settingsForm, setSettingsForm] = useState<AppSettings>(data?.appSettings || {
    appName: 'BD LIVE SPORTS TV',
    appLogo: '/icon.svg',
    tagline: 'Watch Live Sports & Bangla TV',
    noticeText: '',
    noticeEnabled: false,
    footerText: '© 2026 BD LIVE SPORTS TV',
    themeColor: '#0ea5e9',
    defaultCategory: 'LIVE NOW',
    autoPlay: true,
    defaultQuality: 'Auto',
    contactEmail: 'support@bdlivesportstv.com',
    telegramLink: '',
    facebookLink: '',
    version: '3.4.0',
    lastUpdated: new Date().toISOString(),
    appStatus: 'active'
  });

  useEffect(() => {
    if (data?.appSettings) {
      setSettingsForm(data.appSettings);
    }
  }, [data?.appSettings]);

  // Security Form
  const [securityForm, setSecurityForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Delete Confirmation Modal
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'channel' | 'category' | 'notif' | 'clear_all_channels'; id: string; name: string } | null>(null);

  // File Input Ref for Mobile Logo & Image uploads
  const fileInputRef = useRef<HTMLInputElement>(null);
  const appLogoInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // Import / Export Database Tab States
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importMethod, setImportMethod] = useState<'file' | 'text'>('file');
  const [importRawText, setImportRawText] = useState<string>('');
  const [importedFileName, setImportedFileName] = useState<string>('');
  const [isImportLoading, setIsImportLoading] = useState<boolean>(false);
  const [previewFilter, setPreviewFilter] = useState<string>('');
  const [parsedDataToImport, setParsedDataToImport] = useState<any | null>(null);
  const [validationReport, setValidationReport] = useState<{
    isValid: boolean;
    count: number;
    errors: string[];
    warnings: string[];
    previewChannels: any[];
  } | null>(null);

  // Dedicated M3U Import Modal States
  const [isM3uModalOpen, setIsM3uModalOpen] = useState<boolean>(false);
  const [m3uText, setM3uText] = useState<string>('');
  const [m3uMode, setM3uMode] = useState<'prepend' | 'append' | 'replace'>('prepend');
  const [isM3uSubmitting, setIsM3uSubmitting] = useState<boolean>(false);
  const [autoMapM3uCategories, setAutoMapM3uCategories] = useState<boolean>(true);
  const [m3uMappingResult, setM3uMappingResult] = useState<M3uAutomatedMappingResult | null>(null);
  const [m3uCustomOverrides, setM3uCustomOverrides] = useState<Record<string, string>>({});
  const [m3uActiveSubTab, setM3uActiveSubTab] = useState<'mapping' | 'channels' | 'raw'>('mapping');
  const [m3uSearchFilter, setM3uSearchFilter] = useState<string>('');
  const [m3uImportSuccessReport, setM3uImportSuccessReport] = useState<{
    importedCount: number;
    totalChannels: number;
    categoryBreakdown?: Record<string, number>;
    mappedGroups?: Array<{ groupTitle: string; mappedCategory: string; count: number }>;
  } | null>(null);
  const m3uFileInputRef = useRef<HTMLInputElement>(null);

  // Group-title Live Tester States (Categories Tab)
  const [testGroupTitleInput, setTestGroupTitleInput] = useState<string>('Cricket Live HD');
  const [testChannelNameInput, setTestChannelNameInput] = useState<string>('T Sports');

  // Automated Category Sync States
  const [isSyncingCategories, setIsSyncingCategories] = useState<boolean>(false);
  const [syncReport, setSyncReport] = useState<CategorySyncReport | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [forceReCategorize, setForceReCategorize] = useState<boolean>(false);
  const [showRulesTable, setShowRulesTable] = useState<boolean>(false);

  // Health Check & Uptime States
  const [healthStats, setHealthStats] = useState<HealthCheckStats | null>(null);
  const [isHealthChecking, setIsHealthChecking] = useState<boolean>(false);
  const [healthFilter, setHealthFilter] = useState<'all' | 'online' | 'offline' | 'slow'>('all');
  const [healthSearch, setHealthSearch] = useState<string>('');
  const [streamTesterUrl, setStreamTesterUrl] = useState<string>('');
  const [streamTesterBackupUrl, setStreamTesterBackupUrl] = useState<string>('');
  const [streamTesterResult, setStreamTesterResult] = useState<any | null>(null);
  const [isTestingStream, setIsTestingStream] = useState<boolean>(false);
  const [testingChannelId, setTestingChannelId] = useState<string | null>(null);

  // Auto load health stats on open & periodically
  useEffect(() => {
    if (isOpen) {
      loadHealthStats();
      const interval = setInterval(() => {
        loadHealthStats();
      }, 20000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Live Automated Mapping calculation for M3U bulk import
  useEffect(() => {
    if (m3uText.trim()) {
      const result = parseM3uWithAutomatedMapping(m3uText, m3uCustomOverrides);
      setM3uMappingResult(result);
    } else {
      setM3uMappingResult(null);
    }
  }, [m3uText]);

  const loadHealthStats = async () => {
    const res = await apiGetHealthStats();
    if (res.success && res.stats) {
      setHealthStats(res.stats);
    }
  };

  const handleRunHealthCheck = async () => {
    setIsHealthChecking(true);
    showToast('🔍 Running server-side health check across all channels...');
    const res = await apiRunHealthCheck();
    setIsHealthChecking(false);
    if (res.success && res.stats) {
      setHealthStats(res.stats);
      onDataChange();
      showToast(`✅ Health check completed: ${res.stats.onlineCount} online, ${res.stats.offlineCount} offline (${res.stats.systemUptimePercentage}% availability)`);
    } else {
      showToast('⚠️ Health check failed to complete');
    }
  };

  const handleRunStreamDiagnosis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!streamTesterUrl.trim()) {
      showToast('⚠️ Please enter a stream URL to diagnose');
      return;
    }
    setIsTestingStream(true);
    setStreamTesterResult(null);
    const res = await apiCheckSingleStream(streamTesterUrl.trim(), streamTesterBackupUrl.trim() || undefined);
    setIsTestingStream(false);
    if (res.success) {
      setStreamTesterResult(res);
      showToast(`Stream is ${res.status?.toUpperCase()} (${res.latencyMs}ms)`);
    } else {
      showToast('⚠️ Stream check failed: ' + (res.error || 'Unknown error'));
    }
  };

  const handleTestChannelStream = async (channel: Channel) => {
    setTestingChannelId(channel.id);
    const res = await apiCheckSingleStream(channel.streamUrl, channel.backupStreamUrl);
    setTestingChannelId(null);
    if (res.success) {
      showToast(`CH ${channel.channelNumber} (${channel.name}) is ${res.status?.toUpperCase()} (${res.latencyMs}ms)`);
      // Update local state and trigger refresh
      onDataChange();
      loadHealthStats();
    } else {
      showToast(`⚠️ Check failed for ${channel.name}`);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLogout = () => {
    clearAdminToken();
    onClose();
  };

  // ================= CHANNEL ACTIONS =================
  const handleOpenAddChannel = () => {
    setEditingChannel(null);
    const nextNumber = data.channels.length > 0 
      ? Math.max(...data.channels.map(c => c.channelNumber || 0)) + 1 
      : 1;

    setChannelForm({
      name: '',
      channelNumber: nextNumber,
      category: data.categories[0]?.name || 'SPORTS',
      streamUrl: '',
      backupStreamUrl: '',
      logo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&auto=format&fit=crop&q=80',
      description: '',
      country: 'Bangladesh',
      language: 'Bangla',
      quality: 'Full HD',
      status: 'online',
      isFeatured: false,
      enabled: true,
    });
    setIsChannelModalOpen(true);
  };

  const handleOpenEditChannel = (channel: Channel) => {
    setEditingChannel(channel);
    setChannelForm({ ...channel });
    setIsChannelModalOpen(true);
  };

  const handleSaveChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelForm.name || !channelForm.streamUrl) {
      showToast('⚠️ Channel Name and Stream URL are required!');
      return;
    }

    if (editingChannel) {
      const res = await apiUpdateChannel(editingChannel.id, channelForm);
      if (res.success) {
        showToast(`✅ Channel "${channelForm.name}" updated successfully.`);
      }
    } else {
      const res = await apiAddChannel(channelForm);
      if (res.success) {
        showToast(`✅ Channel "${channelForm.name}" added successfully.`);
      }
    }

    setIsChannelModalOpen(false);
    onDataChange();
  };

  const handleDuplicateChannel = async (channel: Channel) => {
    const duplicate: Partial<Channel> = {
      ...channel,
      name: `${channel.name} (Copy)`,
      channelNumber: (channel.channelNumber || 0) + 1,
    };
    await apiAddChannel(duplicate);
    showToast(`✅ Duplicated "${channel.name}"`);
    onDataChange();
  };

  const handleToggleChannel = async (id: string, field: 'status' | 'enabled' | 'isFeatured') => {
    await apiToggleChannel(id, field);
    showToast(`Status updated`);
    onDataChange();
  };

  const handleMoveChannelOrder = async (index: number, direction: 'up' | 'down') => {
    const list = [...data.channels];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const orderedIds = list.map(c => c.id);
    await apiReorderChannels(orderedIds);
    onDataChange();
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'channel') {
      await apiDeleteChannel(deleteConfirm.id);
      showToast(`Channel deleted.`);
    } else if (deleteConfirm.type === 'category') {
      await apiDeleteCategory(deleteConfirm.id);
      showToast(`Category deleted.`);
    } else if (deleteConfirm.type === 'notif') {
      await apiDeleteNotification(deleteConfirm.id);
      showToast(`Notification deleted.`);
    } else if (deleteConfirm.type === 'clear_all_channels') {
      const res = await apiDeleteAllChannels();
      if (res.success) {
        showToast(`🗑️ All channels deleted successfully.`);
      } else {
        showToast(`⚠️ Failed to clear channels: ${res.error || 'Unknown error'}`);
      }
    }
    setDeleteConfirm(null);
    onDataChange();
  };

  // Image Upload helper (Converts mobile photo/file to Base64)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'channel' | 'appLogo' | 'notif') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast('⚠️ Image size must be under 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (target === 'channel') {
        setChannelForm(prev => ({ ...prev, logo: base64 }));
      } else if (target === 'appLogo') {
        setSettingsForm(prev => ({ ...prev, appLogo: base64 }));
      } else if (target === 'notif') {
        setNotifForm(prev => ({ ...prev, image: base64 }));
      }
      showToast('📸 Image loaded into preview');
    };
    reader.readAsDataURL(file);
  };

  // ================= CATEGORY ACTIONS =================
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name) return;

    if (editingCategory) {
      await apiUpdateCategory(editingCategory.id, categoryForm);
      showToast(`Category updated.`);
    } else {
      await apiAddCategory(categoryForm);
      showToast(`Category added.`);
    }

    setIsCategoryModalOpen(false);
    onDataChange();
  };

  // ================= APP SETTINGS & LOGO =================
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiUpdateAppSettings(settingsForm);
    showToast(`✅ App Settings & Logo saved! Header, title & icon updated.`);
    onDataChange();
  };

  // ================= NOTIFICATIONS =================
  const handleSaveNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifForm.title || !notifForm.message) return;
    await apiCreateNotification(notifForm);
    showToast(`✅ Broadcast Announcement posted.`);
    setIsNotifModalOpen(false);
    setNotifForm({ title: '', message: '', image: '', link: '', isFeatured: true, eventStartTime: '', channelId: '' });
    onDataChange();
  };

  // ================= SECURITY =================
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      showToast('⚠️ New passwords do not match');
      return;
    }
    const res = await apiChangePassword(securityForm.currentPassword, securityForm.newPassword);
    if (res.success) {
      showToast('✅ Password changed successfully!');
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      showToast(`⚠️ ${res.error || 'Failed to update password'}`);
    }
  };

  // ================= DATABASE IMPORT / EXPORT & BULK UPDATE =================
  const handleExportFullDatabase = async () => {
    let currentData = data;
    try {
      const fresh = await fetchAppData();
      if (fresh && Array.isArray(fresh.channels) && fresh.channels.length > 0) {
        currentData = fresh;
      }
    } catch (e) {
      console.warn('Using current state for export', e);
    }

    const exportPayload = {
      app: "BD LIVE SPORTS TV",
      version: "3.5.0",
      exportDate: new Date().toISOString(),
      summary: {
        totalChannels: currentData.channels.length,
        totalCategories: currentData.categories.length,
        totalAiMessages: (currentData.aiMessages || []).length,
        totalNotifications: (currentData.notifications || []).length,
      },
      channels: currentData.channels,
      categories: currentData.categories,
      aiMessages: currentData.aiMessages || [],
      notifications: currentData.notifications || [],
      appSettings: currentData.appSettings || {},
      matches: currentData.matches || [],
      images: currentData.images || []
    };

    const jsonString = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    const todayStr = new Date().toISOString().split('T')[0];
    downloadAnchor.href = url;
    downloadAnchor.setAttribute('download', `bd-live-sports-tv-database-export-${todayStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);

    showToast(`📥 Database Exported! (${currentData.channels.length} channels, ${currentData.categories.length} categories, ${(currentData.aiMessages || []).length} AI msgs, ${(currentData.notifications || []).length} notifs)`);
  };

  const handleExportChannelsOnly = () => {
    const channelsPayload = data.channels.map(c => ({
      channelNumber: c.channelNumber,
      name: c.name,
      category: c.category,
      streamUrl: c.streamUrl,
      backupStreamUrl: c.backupStreamUrl || '',
      logo: c.logo || '',
      quality: c.quality || 'Full HD',
      status: c.status || 'online',
      description: c.description || '',
      country: c.country || 'Bangladesh',
      language: c.language || 'Bangla',
      isFeatured: c.isFeatured || false,
    }));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(channelsPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `bd-live-sports-channels-only-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`📥 Exported ${data.channels.length} channels as JSON`);
  };

  const handleDownloadSampleTemplate = () => {
    const sampleTemplate = [
      {
        channelNumber: 1,
        name: "T Sports HD (Sample)",
        category: "CRICKET",
        streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        backupStreamUrl: "https://test-streams.mux.dev/test_001/stream.m3u8",
        logo: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200&auto=format&fit=crop&q=80",
        quality: "Full HD",
        status: "online",
        description: "Official sports channel of Bangladesh broadcasting live cricket, football, and domestic leagues.",
        country: "Bangladesh",
        language: "Bangla",
        isFeatured: true
      },
      {
        channelNumber: 2,
        name: "Sky Sports Football HD (Sample)",
        category: "FOOTBALL",
        streamUrl: "https://test-streams.mux.dev/test_001/stream.m3u8",
        backupStreamUrl: "",
        logo: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=200&auto=format&fit=crop&q=80",
        quality: "4K",
        status: "online",
        description: "Premier League and European football live coverage.",
        country: "United Kingdom",
        language: "English",
        isFeatured: false
      }
    ];

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sampleTemplate, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sample-channels-template.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('📥 Sample Channels JSON template downloaded');
  };

  const validateAndParseJson = (rawContent: string, fileName?: string) => {
    if (fileName) setImportedFileName(fileName);
    setImportRawText(rawContent);

    if (!rawContent.trim()) {
      setParsedDataToImport(null);
      setValidationReport(null);
      return;
    }

    const trimmed = rawContent.trim();

    // Check if content is M3U playlist format
    if (trimmed.startsWith('#EXTM3U') || trimmed.includes('#EXTINF:')) {
      const mappingResult = parseM3uWithAutomatedMapping(trimmed);
      const errors = [...mappingResult.errors];
      const warnings = [...mappingResult.warnings];

      setParsedDataToImport({ 
        type: 'm3u', 
        m3uContent: rawContent, 
        channels: mappingResult.channels,
        mappingResult 
      });
      setValidationReport({
        isValid: errors.length === 0 && mappingResult.channels.length > 0,
        count: mappingResult.channels.length,
        errors,
        warnings,
        previewChannels: mappingResult.channels
      });
      return;
    }

    try {
      const parsed = JSON.parse(rawContent);
      const rawChannels = Array.isArray(parsed) 
        ? parsed 
        : Array.isArray(parsed.channels) 
          ? parsed.channels 
          : null;

      if (!rawChannels) {
        setParsedDataToImport(null);
        setValidationReport({
          isValid: false,
          count: 0,
          errors: ['Invalid structure: JSON must either be an array of channel objects or a database object containing a "channels" array.'],
          warnings: [],
          previewChannels: []
        });
        return;
      }

      const errors: string[] = [];
      const warnings: string[] = [];
      const previewChannels: any[] = [];

      rawChannels.forEach((ch: any, idx: number) => {
        const rowNum = idx + 1;
        if (!ch || typeof ch !== 'object') {
          errors.push(`Row #${rowNum}: Item is not a valid JSON object.`);
          return;
        }
        if (!ch.name || typeof ch.name !== 'string' || !ch.name.trim()) {
          errors.push(`Row #${rowNum}: Missing mandatory 'name' attribute.`);
          return;
        }
        if (!ch.streamUrl || typeof ch.streamUrl !== 'string' || !ch.streamUrl.trim()) {
          errors.push(`Row #${rowNum} ("${ch.name || 'Unnamed'}"): Missing mandatory 'streamUrl' attribute.`);
          return;
        }
        if (!ch.streamUrl.startsWith('http://') && !ch.streamUrl.startsWith('https://')) {
          warnings.push(`Row #${rowNum} ("${ch.name}"): streamUrl should preferably use HTTP/HTTPS protocol.`);
        }
        if (!ch.logo) {
          warnings.push(`Row #${rowNum} ("${ch.name}"): Missing channel logo; a default fallback icon will be assigned.`);
        }

        previewChannels.push({
          id: ch.id || `ch-import-${Date.now()}-${idx}`,
          channelNumber: Number(ch.channelNumber) || rowNum,
          name: ch.name.trim(),
          category: (ch.category || 'SPORTS').toUpperCase(),
          streamUrl: ch.streamUrl.trim(),
          backupStreamUrl: ch.backupStreamUrl || '',
          logo: ch.logo || '',
          quality: ['4K', 'Full HD', 'HD', 'SD', 'Auto'].includes(ch.quality) ? ch.quality : 'Full HD',
          status: ch.status === 'offline' ? 'offline' : 'online',
          description: ch.description || '',
          country: ch.country || 'Bangladesh',
          language: ch.language || 'Bangla',
          isFeatured: Boolean(ch.isFeatured),
        });
      });

      setParsedDataToImport(parsed);
      setValidationReport({
        isValid: errors.length === 0 && previewChannels.length > 0,
        count: previewChannels.length,
        errors,
        warnings,
        previewChannels
      });
    } catch (err: any) {
      setParsedDataToImport(null);
      setValidationReport({
        isValid: false,
        count: 0,
        errors: [`JSON Syntax Error: ${err.message}`],
        warnings: [],
        previewChannels: []
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      validateAndParseJson(reader.result as string, file.name);
    };
    reader.readAsText(file);
  };

  const handleExecuteBulkImport = async () => {
    if (!parsedDataToImport || !validationReport?.isValid) {
      showToast('⚠️ Please upload or paste a valid file or M3U playlist first.');
      return;
    }

    setIsImportLoading(true);
    try {
      if (parsedDataToImport.type === 'm3u') {
        const mode = importMode === 'replace' ? 'replace' : 'prepend';
        const res = await apiImportM3U(parsedDataToImport.m3uContent, mode);
        if (res.success) {
          showToast(`✅ ${res.message || 'M3U Playlist imported successfully!'}`);
          setValidationReport(null);
          setParsedDataToImport(null);
          setImportRawText('');
          setImportedFileName('');
          onDataChange();
        } else {
          showToast(`⚠️ Import failed: ${res.error || 'Server error'}`);
        }
        return;
      }

      const res = await apiImportDatabase(parsedDataToImport, importMode);
      if (res.success) {
        showToast(`✅ ${res.message || 'Bulk channel update completed successfully!'}`);
        setValidationReport(null);
        setParsedDataToImport(null);
        setImportRawText('');
        setImportedFileName('');
        onDataChange();
      } else {
        showToast(`⚠️ Import failed: ${res.error || 'Unknown server error'}`);
      }
    } catch (err: any) {
      showToast(`⚠️ Error applying import: ${err.message}`);
    } finally {
      setIsImportLoading(false);
    }
  };

  const handleM3uGroupOverride = (groupTitle: string, targetCategory: string) => {
    const updated = { ...m3uCustomOverrides, [groupTitle]: targetCategory };
    setM3uCustomOverrides(updated);
    if (m3uMappingResult) {
      const newResult = assignGroupMappingOverride(m3uMappingResult, groupTitle, targetCategory);
      setM3uMappingResult(newResult);
    }
  };

  const handleExecuteM3uImport = async () => {
    if (!m3uText.trim()) {
      showToast('⚠️ Please enter or paste an M3U playlist');
      return;
    }

    setIsM3uSubmitting(true);
    try {
      const res = await apiImportM3U(m3uText, m3uMode, autoMapM3uCategories, m3uCustomOverrides);
      if (res.success) {
        showToast(`✅ ${res.message || 'M3U channels imported successfully!'}`);
        setM3uImportSuccessReport({
          importedCount: res.importedCount || (m3uMappingResult?.totalChannels || 0),
          totalChannels: res.totalChannels || (data.channels.length + (res.importedCount || 0)),
          categoryBreakdown: res.categoryBreakdown || m3uMappingResult?.categoryBreakdown,
          mappedGroups: res.mappedGroups || (m3uMappingResult?.groupMappings.map(g => ({
            groupTitle: g.groupTitle,
            mappedCategory: g.mappedCategory,
            count: g.channelCount
          })))
        });
        setIsM3uModalOpen(false);
        setM3uText('');
        setM3uMappingResult(null);
        setM3uCustomOverrides({});
        onDataChange();
      } else {
        showToast(`⚠️ Import failed: ${res.error || 'Server rejected playlist'}`);
      }
    } catch (err: any) {
      showToast(`⚠️ Error importing playlist: ${err.message}`);
    } finally {
      setIsM3uSubmitting(false);
    }
  };

  // Automated Category Sync Script: Maps all channels' M3U group-title / categories to predefined canonical categories
  const handleRunAutomatedCategorySync = async (force: boolean = forceReCategorize) => {
    setIsSyncingCategories(true);
    try {
      // 1. Calculate the mapping using our client-side sync engine
      const { updatedChannels, report } = runAutomatedCategorySync(data.channels, { forceReCategorize: force });
      setSyncReport(report);
      setIsSyncModalOpen(true);

      // 2. Persist changes to server database / Firestore
      const res = await apiSyncCategories(force);
      if (res.success) {
        showToast(`✅ ${res.message || `Automated sync mapped ${report.updatedCount} channels!`}`);
        onDataChange();
      } else {
        // Fallback: Save updated channels array through database import endpoint
        const fallbackRes = await apiImportDatabase({ channels: updatedChannels }, 'merge');
        if (fallbackRes.success) {
          showToast(`✅ Synced & normalized ${report.updatedCount} channels to predefined categories!`);
          onDataChange();
        } else {
          showToast(`⚠️ Server sync warning: ${res.error || 'Changes applied locally'}`);
        }
      }
    } catch (err: any) {
      showToast(`⚠️ Category sync error: ${err.message}`);
    } finally {
      setIsSyncingCategories(false);
    }
  };

  // Filtered Channels for Admin view
  const filteredChannels = data.channels.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || (
      c.name.toLowerCase().includes(q) || 
      c.channelNumber.toString().includes(q) ||
      (c.category && c.category.toLowerCase().includes(q)) ||
      (c.country && c.country.toLowerCase().includes(q)) ||
      (c.language && c.language.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
    const matchCat = filterCategory === 'ALL' || c.category.toUpperCase() === filterCategory.toUpperCase() || 
      (filterCategory === 'MOVIES' && (c.category.toUpperCase().includes('MOVIE') || c.category.toUpperCase().includes('CINEMA'))) ||
      (filterCategory === 'CRICKET' && c.category.toUpperCase().includes('CRICKET')) ||
      (filterCategory === 'NEWS' && c.category.toUpperCase().includes('NEWS'));
    return matchSearch && matchCat;
  });

  const onlineCount = data.channels.filter(c => c.status === 'online').length;
  const offlineCount = data.channels.length - onlineCount;

  // Exact 11 Requested Dashboard KPI Metrics:
  const sportsChannelsCount = data.channels.filter(c => {
    const cat = (c.category || '').toUpperCase();
    return cat.includes('SPORT') || cat.includes('CRICKET') || cat.includes('FOOTBALL') || cat.includes('TENNIS') || cat.includes('RACING') || cat.includes('COMBAT') || cat.includes('MOTOR');
  }).length;

  const newsChannelsCount = data.channels.filter(c => (c.category || '').toUpperCase().includes('NEWS')).length;

  const banglaChannelsCount = data.channels.filter(c => {
    const cat = (c.category || '').toUpperCase();
    const lang = (c.language || '').toLowerCase();
    const ctry = (c.country || '').toLowerCase();
    return cat.includes('BANGLA') || lang.includes('bangla') || ctry.includes('bangladesh');
  }).length;

  const hindiChannelsCount = data.channels.filter(c => {
    const cat = (c.category || '').toUpperCase();
    const lang = (c.language || '').toLowerCase();
    return cat.includes('HINDI') || lang.includes('hindi');
  }).length;

  const bangladeshChannelsCount = data.channels.filter(c => {
    const ctry = (c.country || '').toLowerCase();
    const cat = (c.category || '').toUpperCase();
    return ctry.includes('bangladesh') || cat.includes('BANGLADESH') || cat.includes('BD');
  }).length;

  const musicChannelsCount = data.channels.filter(c => {
    const cat = (c.category || '').toUpperCase();
    return cat.includes('MUSIC') || cat.includes('SONG') || cat.includes('GANA');
  }).length;

  const moviesChannelsCount = data.channels.filter(c => {
    const cat = (c.category || '').toUpperCase();
    return cat.includes('MOVIE') || cat.includes('CINEMA') || cat.includes('FILM');
  }).length;

  const internationalChannelsCount = data.channels.filter(c => {
    const cat = (c.category || '').toUpperCase();
    const ctry = (c.country || '').toLowerCase();
    return cat.includes('INTERNATIONAL') || cat.includes('WORLD') || (!ctry.includes('bangladesh') && !ctry.includes('india'));
  }).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-60 px-5 py-3 bg-slate-900/95 border border-cyan-500/60 text-cyan-200 text-xs sm:text-sm font-bold rounded-2xl shadow-2xl flex items-center gap-2 backdrop-blur-md transition-all duration-200">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Admin Window */}
      <div 
        id="admin-dashboard-container"
        className="bg-[#080d1a] border border-slate-700/80 rounded-2xl sm:rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Top Navigation Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-slate-900 via-[#0d162b] to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-cyan-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-white tracking-tight">BD SPORTS ADMIN PANEL</h1>
                <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold rounded-full">
                  ONLINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Full administrative control, channel stream management & branding</p>
            </div>
          </div>

          {/* Quick Actions & Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
            <button
              onClick={onClose}
              id="close-admin-panel-btn"
              className="p-2 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="bg-[#0b1222] border-b border-slate-800 px-3 sm:px-6 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center gap-1 min-w-max py-2 text-xs font-bold">
            <button
              onClick={() => setActiveTab('overview')}
              id="admin-tab-overview"
              className={`px-3 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'overview' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('channels')}
              id="admin-tab-channels"
              className={`px-3 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'channels' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>Channels ({data.channels.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('matches')}
              id="admin-tab-matches"
              className={`px-3 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'matches' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Matches ({(data.matches || []).length})</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              id="admin-tab-categories"
              className={`px-3 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'categories' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Categories ({data.categories.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('logo')}
              id="admin-tab-logo"
              className={`px-3 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'logo' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>App Name & Logo</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              id="admin-tab-notifications"
              className={`px-3 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'notifications' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifications ({data.notifications.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              id="admin-tab-reports"
              className={`px-3 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'reports' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Flag className="w-4 h-4" />
              <span>Issue Reports</span>
              {Array.isArray((data as any).reports) && (data as any).reports.filter((r: any) => r.status === 'pending').length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black">
                  {(data as any).reports.filter((r: any) => r.status === 'pending').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              id="admin-tab-settings"
              className={`px-3 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'settings' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>App Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              id="admin-tab-database"
              className={`px-3 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'database' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Import/Export Database</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              id="admin-tab-security"
              className={`px-3 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'security' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Admin Security</span>
            </button>
          </div>
        </div>

        {/* Tab Contents Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-full space-y-6"
          >
          {/* ================= TAB 1: OVERVIEW & REAL-TIME UPTIME MONITOR ================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Telemetry & Category Inventory Grid (Exact 11 Dashboard KPI Metrics) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>Real-time Stream & Category Analytics (ড্যাশবোর্ড পরিসংখ্যান)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Live stream inventory: <span className="text-emerald-400 font-mono font-bold">{data.channels.length} Channels</span>
                  </span>
                </div>

                {/* Primary Stream Status (3 Top Cards: TOTAL CHANNELS, WORKING, OFFLINE) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {/* 1. TOTAL CHANNELS */}
                  <div className="bg-[#0d1527] border border-cyan-500/30 p-4 sm:p-5 rounded-2xl relative overflow-hidden shadow-lg shadow-cyan-950/30 group hover:border-cyan-500/60 transition">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-cyan-300">TOTAL CHANNELS</span>
                      <Tv className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="text-3xl font-black text-white">{data.channels.length}</div>
                    <div className="text-[11px] text-cyan-400 font-medium mt-1 flex items-center gap-1.5">
                      <Wifi className="w-3.5 h-3.5" /> সর্বমোট চ্যানেল সংখ্যা
                    </div>
                  </div>

                  {/* 2. WORKING */}
                  <div className="bg-[#0d1527] border border-emerald-500/30 p-4 sm:p-5 rounded-2xl relative overflow-hidden shadow-lg shadow-emerald-950/30 group hover:border-emerald-500/60 transition">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-300">WORKING</span>
                      <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                    </div>
                    <div className="text-3xl font-black text-emerald-400">
                      {onlineCount} <span className="text-xs font-normal text-slate-400">/ {data.channels.length}</span>
                    </div>
                    <div className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> সক্রিয় ও লাইভ স্ট্রিম
                    </div>
                  </div>

                  {/* 3. OFFLINE */}
                  <div className="bg-[#0d1527] border border-rose-500/30 p-4 sm:p-5 rounded-2xl relative overflow-hidden shadow-lg shadow-rose-950/30 group hover:border-rose-500/60 transition">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-rose-300">OFFLINE</span>
                      <XCircle className="w-5 h-5 text-rose-400" />
                    </div>
                    <div className="text-3xl font-black text-rose-400">
                      {offlineCount} <span className="text-xs font-normal text-slate-400">/ {data.channels.length}</span>
                    </div>
                    <div className="text-[11px] text-rose-400 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> অফলাইন বা ডাউন স্ট্রিম
                    </div>
                  </div>
                </div>

                {/* 8 Category Breakdown Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
                  {/* 4. SPORTS */}
                  <div className="bg-[#0b1222] border border-emerald-500/20 p-3 sm:p-4 rounded-xl relative overflow-hidden hover:border-emerald-500/50 transition">
                    <div className="flex items-center justify-between text-slate-400 mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">SPORTS</span>
                      <Trophy className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-white">{sportsChannelsCount}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">খেলাধুলা</div>
                  </div>

                  {/* 5. NEWS */}
                  <div className="bg-[#0b1222] border border-rose-500/20 p-3 sm:p-4 rounded-xl relative overflow-hidden hover:border-rose-500/50 transition">
                    <div className="flex items-center justify-between text-slate-400 mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-300">NEWS</span>
                      <Radio className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-white">{newsChannelsCount}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">সংবাদ</div>
                  </div>

                  {/* 6. BANGLA */}
                  <div className="bg-[#0b1222] border border-cyan-500/20 p-3 sm:p-4 rounded-xl relative overflow-hidden hover:border-cyan-500/50 transition">
                    <div className="flex items-center justify-between text-slate-400 mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">BANGLA</span>
                      <Globe className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-white">{banglaChannelsCount}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">বাংলা চ্যানেল</div>
                  </div>

                  {/* 7. HINDI */}
                  <div className="bg-[#0b1222] border border-amber-500/20 p-3 sm:p-4 rounded-xl relative overflow-hidden hover:border-amber-500/50 transition">
                    <div className="flex items-center justify-between text-slate-400 mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">HINDI</span>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-white">{hindiChannelsCount}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">হিন্দি চ্যানেল</div>
                  </div>

                  {/* 8. BANGLADESH */}
                  <div className="bg-[#0b1222] border border-teal-500/20 p-3 sm:p-4 rounded-xl relative overflow-hidden hover:border-teal-500/50 transition">
                    <div className="flex items-center justify-between text-slate-400 mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-teal-300">BANGLADESH</span>
                      <Tv className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-white">{bangladeshChannelsCount}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">বাংলাদেশ</div>
                  </div>

                  {/* 9. MUSIC */}
                  <div className="bg-[#0b1222] border border-pink-500/20 p-3 sm:p-4 rounded-xl relative overflow-hidden hover:border-pink-500/50 transition">
                    <div className="flex items-center justify-between text-slate-400 mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-pink-300">MUSIC</span>
                      <Music className="w-4 h-4 text-pink-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-white">{musicChannelsCount}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">গান ও মিউজিক</div>
                  </div>

                  {/* 10. MOVIES */}
                  <div className="bg-[#0b1222] border border-purple-500/20 p-3 sm:p-4 rounded-xl relative overflow-hidden hover:border-purple-500/50 transition">
                    <div className="flex items-center justify-between text-slate-400 mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">MOVIES</span>
                      <Film className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-white">{moviesChannelsCount}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">মুভি ও সিনেমা</div>
                  </div>

                  {/* 11. INTERNATIONAL */}
                  <div className="bg-[#0b1222] border border-indigo-500/20 p-3 sm:p-4 rounded-xl relative overflow-hidden hover:border-indigo-500/50 transition">
                    <div className="flex items-center justify-between text-slate-400 mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">INTERNATIONAL</span>
                      <Globe2 className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-white">{internationalChannelsCount}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">আন্তর্জাতিক</div>
                  </div>
                </div>
              </div>

              {/* ================= HEALTH CHECK & UPTIME CONTROL PANEL ================= */}
              <div className="bg-gradient-to-br from-[#0c1324] to-[#0f172a] border border-cyan-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <h3 className="text-base font-black text-white tracking-wide flex items-center gap-2">
                        <span>Server-Side Stream Health & Uptime Monitor</span>
                      </h3>
                      <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Auto-cycle: 60s
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Continuous backend process validates stream URLs, tracks HTTP latency, and calculates live channel availability.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={loadHealthStats}
                      title="Refresh health statistics"
                      className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleRunHealthCheck}
                      disabled={isHealthChecking}
                      id="admin-run-health-check-btn"
                      className={`px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition cursor-pointer ${
                        isHealthChecking ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    >
                      <RefreshCw className={`w-4 h-4 ${isHealthChecking ? 'animate-spin' : ''}`} />
                      <span>{isHealthChecking ? 'Scanning All Streams...' : 'Run Instant Health Scan'}</span>
                    </button>
                  </div>
                </div>

                {/* Uptime Meter & Breakdown */}
                <div className="pt-5 space-y-4">
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold mb-2">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" /> Real-Time Operational Availability
                      </span>
                      <span className="text-emerald-400 font-mono text-sm">
                        {onlineCount}/{data.channels.length} Channels Online ({healthStats?.systemUptimePercentage ?? 100}%)
                      </span>
                    </div>

                    {/* Multi-segment Progress bar */}
                    <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex p-0.5 border border-slate-800">
                      <div 
                        style={{ width: `${(onlineCount / Math.max(1, data.channels.length)) * 100}%` }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-l-full transition-all duration-500 shadow-sm shadow-emerald-500/50"
                      />
                      <div 
                        style={{ width: `${((data.channels.length - onlineCount) / Math.max(1, data.channels.length)) * 100}%` }}
                        className="h-full bg-rose-500 rounded-r-full transition-all duration-500"
                      />
                    </div>
                  </div>

                  {/* Health Stats Pill Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    <div className="bg-[#090f1d] border border-slate-800/80 p-3 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">High Speed (&lt;250ms)</div>
                        <div className="text-lg font-black text-emerald-400">
                          {data.channels.filter(c => c.status === 'online' && (c.latencyMs || 100) < 250).length}
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-emerald-400/50" />
                    </div>

                    <div className="bg-[#090f1d] border border-slate-800/80 p-3 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Moderate (250-800ms)</div>
                        <div className="text-lg font-black text-cyan-300">
                          {data.channels.filter(c => c.status === 'online' && (c.latencyMs || 0) >= 250 && (c.latencyMs || 0) <= 800).length}
                        </div>
                      </div>
                      <Wifi className="w-5 h-5 text-cyan-400/50" />
                    </div>

                    <div className="bg-[#090f1d] border border-slate-800/80 p-3 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Degraded / Slow</div>
                        <div className="text-lg font-black text-amber-400">
                          {data.channels.filter(c => c.status === 'online' && (c.latencyMs || 0) > 800).length}
                        </div>
                      </div>
                      <AlertTriangle className="w-5 h-5 text-amber-400/50" />
                    </div>

                    <div className="bg-[#090f1d] border border-slate-800/80 p-3 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Offline Streams</div>
                        <div className="text-lg font-black text-rose-400">
                          {data.channels.filter(c => c.status === 'offline').length}
                        </div>
                      </div>
                      <XCircle className="w-5 h-5 text-rose-400/50" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      Last health validation scan: <strong className="text-slate-200">{healthStats?.lastRunFormatted || 'Active'}</strong>
                    </span>
                    <span className="text-slate-500 font-mono">
                      Database: synced with db.json
                    </span>
                  </div>
                </div>
              </div>

              {/* ================= REAL-TIME STREAM HEALTH MATRIX ================= */}
              <div className="bg-[#0d1527] border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Tv className="w-4 h-4 text-cyan-400" />
                      <span>Live Channel Health & Latency Telemetry</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Detailed uptime scores, ping latencies, and diagnostic statuses for all active channels.
                    </p>
                  </div>

                  {/* Filters & Search */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={healthSearch}
                        onChange={(e) => setHealthSearch(e.target.value)}
                        placeholder="Filter channels..."
                        className="bg-[#070b14] border border-slate-700 pl-8 pr-3 py-1.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-36 sm:w-48"
                      />
                    </div>

                    <div className="flex items-center bg-[#070b14] border border-slate-700 p-0.5 rounded-xl text-[11px] font-bold">
                      <button
                        onClick={() => setHealthFilter('all')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          healthFilter === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        All ({data.channels.length})
                      </button>
                      <button
                        onClick={() => setHealthFilter('online')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          healthFilter === 'online' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Online ({onlineCount})
                      </button>
                      <button
                        onClick={() => setHealthFilter('offline')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          healthFilter === 'offline' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Offline ({data.channels.length - onlineCount})
                      </button>
                      <button
                        onClick={() => setHealthFilter('slow')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          healthFilter === 'slow' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Slow
                      </button>
                    </div>
                  </div>
                </div>

                {/* Table of Channels */}
                <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#090f1d] text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3">CH #</th>
                        <th className="px-4 py-3">Channel</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Response Latency</th>
                        <th className="px-4 py-3">Uptime Score</th>
                        <th className="px-4 py-3">Backup Stream</th>
                        <th className="px-4 py-3">Last Checked</th>
                        <th className="px-4 py-3 text-right">Quick Diagnostics</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {data.channels
                        .filter(ch => {
                          const matchesSearch = !healthSearch || 
                            ch.name.toLowerCase().includes(healthSearch.toLowerCase()) || 
                            ch.channelNumber.toString().includes(healthSearch);
                          if (!matchesSearch) return false;
                          if (healthFilter === 'online') return ch.status === 'online';
                          if (healthFilter === 'offline') return ch.status === 'offline';
                          if (healthFilter === 'slow') return (ch.latencyMs || 0) > 600;
                          return true;
                        })
                        .map((ch) => {
                          const isOnline = ch.status === 'online';
                          const latency = ch.latencyMs || (isOnline ? 120 : 0);
                          const uptimeScore = ch.uptimePercentage ?? (isOnline ? 99 : 0);
                          const isTesting = testingChannelId === ch.id;

                          return (
                            <tr key={ch.id} className="hover:bg-slate-800/40 transition">
                              <td className="px-4 py-3 font-mono font-bold text-cyan-400">
                                #{ch.channelNumber}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={ch.logo || 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=100&auto=format&fit=crop&q=60'}
                                    alt={ch.name}
                                    className="w-7 h-7 object-contain rounded bg-slate-900 border border-slate-700 p-0.5"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                  <div>
                                    <div className="font-bold text-white flex items-center gap-1.5">
                                      <span>{ch.name}</span>
                                      {ch.isFeatured && (
                                        <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[9px] font-bold rounded">
                                          ★ FEATURED
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-500 truncate max-w-xs font-mono">
                                      {ch.streamUrl}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-3">
                                {isOnline ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full font-bold text-[10px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    ONLINE
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded-full font-bold text-[10px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                                    OFFLINE
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-3 font-mono">
                                {isOnline ? (
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-xs ${
                                    latency < 250 
                                      ? 'bg-emerald-500/10 text-emerald-400' 
                                      : latency < 800 
                                        ? 'bg-cyan-500/10 text-cyan-300' 
                                        : 'bg-amber-500/10 text-amber-300'
                                  }`}>
                                    <Zap className="w-3 h-3" />
                                    {latency} ms
                                  </span>
                                ) : (
                                  <span className="text-rose-400/80 text-[11px] font-sans">
                                    {ch.healthError || 'Unreachable'}
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs font-mono text-slate-200">
                                    {uptimeScore}%
                                  </span>
                                  <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                      style={{ width: `${uptimeScore}%` }} 
                                      className={`h-full ${uptimeScore > 90 ? 'bg-emerald-400' : uptimeScore > 70 ? 'bg-amber-400' : 'bg-rose-400'}`}
                                    />
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-3">
                                {ch.backupStreamUrl ? (
                                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded text-[10px] font-mono">
                                    Configured
                                  </span>
                                ) : (
                                  <span className="text-slate-600 text-[10px]">None</span>
                                )}
                              </td>

                              <td className="px-4 py-3 text-[11px] text-slate-400 font-mono">
                                {ch.lastHealthCheckTime ? new Date(ch.lastHealthCheckTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Auto-monitored'}
                              </td>

                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => handleTestChannelStream(ch)}
                                  disabled={isTesting}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-600/30 text-cyan-300 hover:text-cyan-200 border border-slate-700 hover:border-cyan-500/40 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ml-auto cursor-pointer"
                                >
                                  <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin text-cyan-400' : ''}`} />
                                  <span>{isTesting ? 'Testing...' : 'Ping Stream'}</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ================= LIVE AUDIT LOG & DIAGNOSTIC STREAM TESTER ================= */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Diagnostic Tester */}
                <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 shadow-lg">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span>Instant Stream URL Diagnostic Tester</span>
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Validate any live HLS (.m3u8), RTMP, or direct HTTP video stream and check latency & headers before publishing.
                  </p>

                  <form onSubmit={handleRunStreamDiagnosis} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Primary Stream URL (.m3u8 or video link) *
                      </label>
                      <input
                        type="url"
                        value={streamTesterUrl}
                        onChange={(e) => setStreamTesterUrl(e.target.value)}
                        placeholder="https://example.com/live/stream/index.m3u8"
                        className="w-full bg-[#070b14] border border-slate-700 px-3 py-2 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Backup Stream URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={streamTesterBackupUrl}
                        onChange={(e) => setStreamTesterBackupUrl(e.target.value)}
                        placeholder="https://backup.example.com/stream/index.m3u8"
                        className="w-full bg-[#070b14] border border-slate-700 px-3 py-2 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isTestingStream}
                      className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Zap className={`w-4 h-4 ${isTestingStream ? 'animate-bounce' : ''}`} />
                      <span>{isTestingStream ? 'Diagnosing Stream...' : 'Diagnose Stream Connection'}</span>
                    </button>
                  </form>

                  {/* Test Result Display */}
                  {streamTesterResult && (
                    <div className="mt-4 p-3.5 bg-[#080d19] border border-slate-700 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300">Diagnostic Verdict:</span>
                        <span className={`px-2 py-0.5 rounded font-black text-xs ${
                          streamTesterResult.status === 'online' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}>
                          {streamTesterResult.status?.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                        <div className="bg-[#0b1220] p-2 rounded border border-slate-800">
                          <div className="text-slate-500">Latency</div>
                          <div className="font-bold text-cyan-300">{streamTesterResult.latencyMs} ms</div>
                        </div>
                        <div className="bg-[#0b1220] p-2 rounded border border-slate-800">
                          <div className="text-slate-500">HTTP Status</div>
                          <div className="font-bold text-slate-200">
                            {streamTesterResult.primary?.status || 'Error'}
                          </div>
                        </div>
                      </div>
                      {streamTesterResult.primary?.error && (
                        <div className="text-rose-400 text-[11px] bg-rose-950/30 p-2 rounded border border-rose-800/40 font-mono">
                          {streamTesterResult.primary.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Real-Time Health Check Log Feed */}
                <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <span>Live Health Validation Activity Stream</span>
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">Rolling log</span>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-1">
                    {(healthStats?.recentLogs && healthStats.recentLogs.length > 0) ? (
                      healthStats.recentLogs.slice(0, 15).map((log) => (
                        <div 
                          key={log.id} 
                          className="bg-[#080d19] border border-slate-800/80 p-2.5 rounded-xl flex items-center justify-between text-xs font-sans hover:border-slate-700 transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              log.status === 'online' ? 'bg-emerald-400' : 'bg-rose-400'
                            }`} />
                            <div>
                              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                                <span className="text-cyan-400 font-mono">#{log.channelNumber}</span>
                                <span>{log.channelName}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {log.timestamp} • {log.latencyMs}ms {log.httpStatus ? `(HTTP ${log.httpStatus})` : ''}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                              log.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {log.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-slate-500 text-xs">
                        <Activity className="w-6 h-6 mx-auto mb-2 text-slate-600 animate-pulse" />
                        Health monitor background checks running...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">Quick Administrator Actions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <button
                    onClick={handleOpenAddChannel}
                    className="p-3 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Channel
                  </button>

                  <button
                    onClick={() => { setM3uText(''); setIsM3uModalOpen(true); }}
                    className="p-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <FileText className="w-4 h-4" /> Import M3U
                  </button>

                  <button
                    onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', icon: 'Tv', color: '#0ea5e9' }); setIsCategoryModalOpen(true); }}
                    className="p-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Category
                  </button>

                  <button
                    onClick={() => setActiveTab('logo')}
                    className="p-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4" /> Upload App Logo
                  </button>

                  <button
                    onClick={() => setIsNotifModalOpen(true)}
                    className="p-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer col-span-2 sm:col-span-1"
                  >
                    <Bell className="w-4 h-4" /> Broadcast Notice
                  </button>
                </div>
              </div>

              {/* Server Info Card */}
              <div className="bg-gradient-to-r from-slate-900 to-[#0e172a] border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-cyan-400" /> Database & Persistence Status
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Disk storage: <code className="text-cyan-300 font-mono">./db.json</code> (Persistent across restarts)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">Last sync: {new Date(data.lastSyncTime || Date.now()).toLocaleTimeString()}</span>
                  <button
                    onClick={onDataChange}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Sync Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: CHANNELS MANAGEMENT ================= */}
          {activeTab === 'channels' && (
            <div className="space-y-4">
              {/* Filter & Add Bar */}
              <div className="bg-[#0d1527] p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex flex-1 items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, CH #, category..."
                        className="w-full bg-[#070b14] border border-slate-700 pl-9 pr-4 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="bg-[#070b14] border border-slate-700 px-3 py-2 rounded-xl text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="ALL">All Categories ({data.channels.length})</option>
                      {data.categories.map(c => {
                        const count = data.channels.filter(ch => ch.category.toUpperCase() === c.name.toUpperCase()).length;
                        return (
                          <option key={c.id} value={c.name}>{c.name} ({count})</option>
                        );
                      })}
                    </select>
                  </div>

                  <button
                    onClick={() => setDeleteConfirm({ type: 'clear_all_channels', id: 'all', name: `All ${data.channels.length} Channels` })}
                    id="admin-clear-all-channels-btn"
                    className="px-3.5 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 hover:text-rose-100 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                    title="আগের সব চ্যানেল ডিলিট করে নতুন তালিকা যোগ করুন"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Delete All Channels</span>
                  </button>

                  <button
                    onClick={() => { setM3uText(''); setIsM3uModalOpen(true); }}
                    id="admin-import-m3u-btn"
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
                    title="Import IPTV / M3U playlist file or paste text"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Import M3U Playlist</span>
                  </button>

                  <button
                    onClick={() => handleRunAutomatedCategorySync()}
                    id="admin-sync-categories-toolbar-btn"
                    disabled={isSyncingCategories}
                    className="px-3.5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-500/20 flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 disabled:opacity-50"
                    title="Run automated script to map imported M3U group-title tags to predefined categories"
                  >
                    {isSyncingCategories ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    )}
                    <span>Sync Categories</span>
                  </button>

                  <button
                    onClick={handleOpenAddChannel}
                    id="admin-add-channel-btn"
                    className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Channel</span>
                  </button>
                </div>

                {/* Visual Category Filter Badges */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                  <button
                    type="button"
                    onClick={() => setFilterCategory('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      filterCategory === 'ALL'
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-[#070b14] text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>ALL ({data.channels.length})</span>
                  </button>

                  {/* Core Badges in Channels Filter: INTERNATIONAL, SPORTS, CRICKET, FOOTBALL, NEWS, MOVIES, NATOK & DRAMA */}
                  {['INTERNATIONAL', 'SPORTS', 'CRICKET', 'INTERNATIONAL CRICKET', 'FOOTBALL', 'NEWS', 'BANGLA NEWS', 'MOVIES', 'BANGLA MOVIES', 'HINDI MOVIES', 'NATOK & DRAMA', 'SONGS'].map((catName) => {
                    const isSelected = filterCategory.toUpperCase() === catName;
                    const count = data.channels.filter(ch => {
                      const cat = ch.category.toUpperCase();
                      if (cat === catName) return true;
                      if (catName === 'CRICKET' && cat.includes('CRICKET')) return true;
                      if (catName === 'MOVIES' && (cat.includes('MOVIE') || cat.includes('CINEMA'))) return true;
                      if (catName === 'NEWS' && cat.includes('NEWS')) return true;
                      return false;
                    }).length;
                    if (count === 0 && !data.categories.some(c => c.name.toUpperCase() === catName)) return null;

                    return (
                      <button
                        key={catName}
                        type="button"
                        onClick={() => setFilterCategory(catName)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                            : 'bg-[#070b14] text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800'
                        }`}
                      >
                        {getCategoryIcon(catName)}
                        <span>{catName}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Channels Table / List */}
              <div className="bg-[#0d1527] border border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#090f1d] text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Order</th>
                        <th className="px-4 py-3">CH #</th>
                        <th className="px-4 py-3">Logo</th>
                        <th className="px-4 py-3">Channel Name</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Quality</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Stream URL</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredChannels.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-500">
                            No channels found matching the filter.
                          </td>
                        </tr>
                      ) : (
                        filteredChannels.map((c, index) => (
                          <tr key={c.id} className="hover:bg-slate-800/50 transition">
                            {/* Order movement */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleMoveChannelOrder(index, 'up')}
                                  disabled={index === 0}
                                  className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleMoveChannelOrder(index, 'down')}
                                  disabled={index === data.channels.length - 1}
                                  className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            {/* CH Number */}
                            <td className="px-4 py-3 font-mono font-bold text-cyan-400">
                              CH {c.channelNumber?.toString().padStart(2, '0')}
                            </td>

                            {/* Logo */}
                            <td className="px-4 py-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-700 p-0.5 overflow-hidden flex items-center justify-center">
                                {c.logo ? (
                                  <img src={c.logo} alt={c.name} className="w-full h-full object-contain" />
                                ) : (
                                  <Tv className="w-4 h-4 text-slate-500" />
                                )}
                              </div>
                            </td>

                            {/* Channel Name */}
                            <td className="px-4 py-3 font-bold text-white">
                              {c.name}
                            </td>

                            {/* Category */}
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] font-semibold text-slate-300">
                                {c.category}
                              </span>
                            </td>

                            {/* Quality */}
                            <td className="px-4 py-3">
                              <span className="text-cyan-300 font-mono font-semibold">{c.quality}</span>
                            </td>

                            {/* Status Online/Offline Toggle */}
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleToggleChannel(c.id, 'status')}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition flex items-center gap-1 cursor-pointer ${
                                  c.status === 'online'
                                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                                    : 'bg-red-500/20 border border-red-500/40 text-red-400'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'online' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                {c.status}
                              </button>
                            </td>

                            {/* Stream URL (truncated) */}
                            <td className="px-4 py-3 font-mono text-[10px] text-slate-400 max-w-[150px] truncate" title={c.streamUrl}>
                              {c.streamUrl}
                            </td>

                            {/* Action Buttons */}
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditChannel(c)}
                                  className="p-1.5 bg-slate-800 hover:bg-cyan-600/30 text-slate-300 hover:text-cyan-300 rounded-lg transition cursor-pointer"
                                  title="Edit Channel"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDuplicateChannel(c)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                                  title="Duplicate"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm({ type: 'channel', id: c.id, name: c.name })}
                                  className="p-1.5 bg-slate-800 hover:bg-red-600/30 text-slate-400 hover:text-red-400 rounded-lg transition cursor-pointer"
                                  title="Delete Channel"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB: MATCHES & NOTIFICATION SCHEDULER ================= */}
          {activeTab === 'matches' && (
            <AdminMatchesTab
              matches={data.matches || []}
              channels={data.channels}
              onDataChange={onDataChange}
              showToast={showToast}
            />
          )}

          {/* ================= TAB 3: CATEGORIES MANAGEMENT & AUTOMATED M3U SYNC ================= */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* ================= AUTOMATED M3U CATEGORY SYNC SCRIPT CARD ================= */}
              <div className="bg-gradient-to-br from-[#0c1628] via-[#091122] to-[#060b17] border border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
                {/* Header with Title and Live Sync Button */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/10">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white tracking-wide">
                            Automated M3U Category Sync Engine
                          </h3>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/60">
                            অটো-ক্যাটাগরি স্ক্রিপ্ট
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Maps imported M3U <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded text-[11px]">group-title</code> tags to the app's predefined categories to ensure consistency across the new channel set.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Triggers */}
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/60 border border-slate-800 px-3 py-2 rounded-xl cursor-pointer hover:border-slate-700 transition">
                      <input
                        type="checkbox"
                        checked={forceReCategorize}
                        onChange={(e) => setForceReCategorize(e.target.checked)}
                        className="rounded text-cyan-500 focus:ring-0 cursor-pointer"
                      />
                      <span>Force Re-Categorize All ({data.channels.length})</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowRulesTable(!showRulesTable)}
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{showRulesTable ? 'Hide Mapping Rules' : 'View Mapping Rules Matrix'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSyncingCategories}
                      onClick={() => handleRunAutomatedCategorySync(forceReCategorize)}
                      id="admin-run-category-sync-btn"
                      className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-xl shadow-cyan-500/25 flex items-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSyncingCategories ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                          <span>Syncing Categories...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 fill-slate-950" />
                          <span>Run Automated Sync Script</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Predefined Canonical Categories Distribution Cards */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Predefined Category Distribution ({data.channels.length} Total Channels)</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Standardized canonical groups for Live TV navigation
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                    {PREDEFINED_CATEGORY_RULES.map((rule) => {
                      const count = data.channels.filter(ch => {
                        const chCat = (ch.category || '').toUpperCase().trim();
                        return chCat === rule.category || chCat === rule.categoryLabel.toUpperCase() || chCat.includes(rule.category);
                      }).length;
                      const pct = data.channels.length > 0 ? Math.round((count / data.channels.length) * 100) : 0;

                      return (
                        <div
                          key={rule.id}
                          className="bg-[#070d18] border border-slate-800 hover:border-cyan-500/40 p-2.5 rounded-2xl transition flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: rule.color }}
                            />
                            <span className="text-[10px] font-bold text-slate-400">{pct}%</span>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white truncate" title={rule.categoryLabel}>
                              {rule.categoryLabel}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {rule.categoryBn}
                            </div>
                          </div>
                          <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 font-mono">Channels</span>
                            <span className="text-xs font-black text-cyan-300">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Collapsible Mapping Rules Matrix Table */}
                {showRulesTable && (
                  <div className="bg-[#070b14] border border-slate-800 rounded-2xl p-4 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          M3U 'group-title' Keyword Mapping Heuristics
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Canonical algorithm in <code className="text-cyan-300">src/utils/m3uCategorySync.ts</code>
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                            <th className="py-2 px-3">Predefined Target</th>
                            <th className="py-2 px-3">Bangla Name</th>
                            <th className="py-2 px-3">Matched M3U Keywords & Patterns</th>
                            <th className="py-2 px-3">Sample Channels Handled</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                          {PREDEFINED_CATEGORY_RULES.map((rule) => (
                            <tr key={rule.id} className="hover:bg-slate-900/40">
                              <td className="py-2 px-3 font-bold text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: rule.color }} />
                                <span>{rule.categoryLabel}</span>
                              </td>
                              <td className="py-2 px-3 text-slate-300 font-sans">{rule.categoryBn}</td>
                              <td className="py-2 px-3 text-cyan-300 font-mono text-[10px] max-w-xs truncate" title={rule.patterns.join(', ')}>
                                {rule.patterns.slice(0, 7).join(', ')}{rule.patterns.length > 7 ? ` +${rule.patterns.length - 7} more` : ''}
                              </td>
                              <td className="py-2 px-3 text-slate-400 font-sans text-[11px]">
                                {rule.category === 'SPORTS' && 'T Sports, Sony Ten, Star Sports, Willow, PTV'}
                                {rule.category === 'BANGLADESH' && 'BTV, Channel i, Maasranga, Somoy, Ekattor'}
                                {rule.category === 'ISLAMIC' && 'Makkah Live, Madinah Live, Peace TV, Quran TV'}
                                {rule.category === 'NEWS' && 'Somoy News, BBC News, CNN, Al Jazeera, Jamuna'}
                                {rule.category === 'MOVIES' && 'HBO, Star Movies, Zee Cinema, Sony Max, Bongo'}
                                {rule.category === 'ENTERTAINMENT' && 'Zee Bangla, Star Jalsha, Sony TV, Colors'}
                                {rule.category === 'INDIAN' && 'Star Plus, Sony Entertainment, Zee TV, Aaj Tak'}
                                {rule.category === 'INTERNATIONAL' && 'Discovery, Nat Geo, TLC, Animal Planet'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                    )}
              </div>

              {/* ================= EXISTING / CUSTOM CATEGORIES ================= */}
              <div className="flex items-center justify-between bg-[#0d1527] p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Custom Broadcast Categories</h3>
                  <p className="text-xs text-slate-400">Add custom tags, reorder, or update category appearance</p>
                </div>
                <button
                  onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', icon: 'Tv', color: '#0ea5e9' }); setIsCategoryModalOpen(true); }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Custom Category
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {data.categories.map(cat => (
                  <div key={cat.id} className="bg-[#0d1527] border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{cat.name}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">Icon: {cat.icon}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => { setEditingCategory(cat); setCategoryForm({ name: cat.name, icon: cat.icon, color: cat.color || '#0ea5e9' }); setIsCategoryModalOpen(true); }}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'category', id: cat.id, name: cat.name })}
                        className="p-1.5 bg-slate-800 hover:bg-red-900/40 text-red-400 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 4: APP NAME & LOGO CONTROL ================= */}
          {activeTab === 'logo' && (
            <AppLogoManager
              appSettings={data.appSettings}
              onSettingsUpdated={(updated) => {
                setSettingsForm(prev => ({
                  ...prev,
                  appName: updated.appName || prev.appName,
                  appLogo: updated.appLogo || prev.appLogo,
                  tagline: updated.tagline || prev.tagline
                }));
                onDataChange();
              }}
              showToast={showToast}
            />
          )}

          {/* ================= TAB 5: NOTIFICATIONS ================= */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#0d1527] p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Live Broadcast Notifications</h3>
                  <p className="text-xs text-slate-400">Push real-time match announcements and alerts to all users</p>
                </div>
                <button
                  onClick={() => setIsNotifModalOpen(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Create Broadcast
                </button>
              </div>

              <div className="space-y-3">
                {data.notifications.map(n => (
                  <div key={n.id} className="bg-[#0d1527] border border-slate-800 p-4 rounded-2xl flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {n.isFeatured && (
                          <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold uppercase">
                            FEATURED
                          </span>
                        )}
                        <h4 className="font-bold text-white text-sm">{n.title}</h4>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{n.message}</p>
                      <div className="text-[11px] text-slate-500 mt-2 font-mono">{n.date} {n.time}</div>
                    </div>

                    <button
                      onClick={() => setDeleteConfirm({ type: 'notif', id: n.id, name: n.title })}
                      className="p-2 bg-slate-800 hover:bg-red-900/40 text-red-400 rounded-xl cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB: ISSUE REPORTS ================= */}
          {activeTab === 'reports' && (
            <AdminReportsTab
              channels={data.channels}
              onDataChange={onDataChange}
              showToast={showToast}
            />
          )}

          {/* ================= TAB 6: SETTINGS ================= */}
          {activeTab === 'settings' && (
            <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5">
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Live Marquee & Stream Defaults</h3>

                {/* Notice Marquee */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Top Notice Ticker Text</label>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settingsForm.noticeEnabled}
                        onChange={(e) => setSettingsForm({ ...settingsForm, noticeEnabled: e.target.checked })}
                        className="rounded accent-cyan-500"
                      />
                      Enable Ticker
                    </label>
                  </div>
                  <input
                    type="text"
                    value={settingsForm.noticeText}
                    onChange={(e) => setSettingsForm({ ...settingsForm, noticeText: e.target.value })}
                    className="w-full bg-[#070b14] border border-slate-700 px-4 py-2.5 rounded-xl text-xs text-white"
                    placeholder="⚡ Welcome to BD LIVE SPORTS TV! Watch Live Cricket..."
                  />
                </div>

                {/* Footer Text */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Footer Copyright Text</label>
                  <input
                    type="text"
                    value={settingsForm.footerText}
                    onChange={(e) => setSettingsForm({ ...settingsForm, footerText: e.target.value })}
                    className="w-full bg-[#070b14] border border-slate-700 px-4 py-2.5 rounded-xl text-xs text-white"
                  />
                </div>

                {/* Social & Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Telegram Support Channel</label>
                    <input
                      type="text"
                      value={settingsForm.telegramLink}
                      onChange={(e) => setSettingsForm({ ...settingsForm, telegramLink: e.target.value })}
                      className="w-full bg-[#070b14] border border-slate-700 px-4 py-2 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Support Email</label>
                    <input
                      type="email"
                      value={settingsForm.contactEmail}
                      onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                      className="w-full bg-[#070b14] border border-slate-700 px-4 py-2 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  Save App Settings
                </button>
              </form>
            </div>
          )}

          {/* ================= TAB 7: IMPORT / EXPORT DATABASE & BULK UPDATE ================= */}
          {activeTab === 'database' && (
            <div className="space-y-6 pb-6">
              {/* Database Overview & Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-[#0d1527] border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold uppercase">Total Channels</span>
                    <div className="text-xl font-bold text-cyan-400 mt-1">{data.channels.length}</div>
                  </div>
                  <div className="p-3 bg-cyan-950/60 border border-cyan-800/40 rounded-xl text-cyan-400">
                    <Tv className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-[#0d1527] border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold uppercase">Active Categories</span>
                    <div className="text-xl font-bold text-purple-400 mt-1">{data.categories.length}</div>
                  </div>
                  <div className="p-3 bg-purple-950/60 border border-purple-800/40 rounded-xl text-purple-400">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-[#0d1527] border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold uppercase">Online Streams</span>
                    <div className="text-xl font-bold text-emerald-400 mt-1">{onlineCount} / {data.channels.length}</div>
                  </div>
                  <div className="p-3 bg-emerald-950/60 border border-emerald-800/40 rounded-xl text-emerald-400">
                    <Radio className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-[#0d1527] border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold uppercase">Database Engine</span>
                    <div className="text-xs font-mono font-bold text-slate-200 mt-1">JSON DB (v1.0)</div>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-xl text-slate-400">
                    <Database className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* SECTION 1: EXPORT DATABASE */}
              <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Download className="w-4 h-4 text-cyan-400" /> Export Database & Channel Backups
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Download your live broadcast database as JSON files for off-site backup, migration, or external playlist distribution.</p>
                  </div>
                  <span className="text-[10px] font-mono bg-cyan-950/80 border border-cyan-800/50 text-cyan-300 px-2.5 py-1 rounded-lg shrink-0">
                    UTF-8 JSON Format
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Export Full DB */}
                  <div className="bg-[#070b14] border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between hover:border-cyan-500/40 transition">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Database className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-xs font-bold text-white">Database Backup (.json)</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-3">
                        Downloads complete JSON backup with all {data.channels.length} channels, {data.categories.length} categories, {(data.aiMessages || []).length} AI messages, and {(data.notifications || []).length} notifications.
                      </p>
                    </div>
                    <button
                      onClick={handleExportFullDatabase}
                      id="btn-export-full-db"
                      className="w-full py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-cyan-900/30"
                    >
                      <Download className="w-3.5 h-3.5" /> Export Database (.json)
                    </button>
                  </div>

                  {/* Export Channels Only */}
                  <div className="bg-[#070b14] border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between hover:border-cyan-500/40 transition">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Tv className="w-4 h-4 text-purple-400" />
                        <h4 className="text-xs font-bold text-white">Channels List Only</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-3">
                        Exports an array of stream URLs, logos, quality flags, and channel metadata without system config.
                      </p>
                    </div>
                    <button
                      onClick={handleExportChannelsOnly}
                      id="btn-export-channels-only"
                      className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-purple-900/30"
                    >
                      <FileJson className="w-3.5 h-3.5" /> Download Channels (.json)
                    </button>
                  </div>

                  {/* Download Template */}
                  <div className="bg-[#070b14] border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between hover:border-slate-700 transition">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <FileText className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-bold text-white">Sample Import Template</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-3">
                        Clean starter JSON schema with sample channels to populate and bulk-upload.
                      </p>
                    </div>
                    <button
                      onClick={handleDownloadSampleTemplate}
                      id="btn-download-sample-template"
                      className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Template (.json)
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION 2: IMPORT & BULK-UPDATE CHANNELS WITH VALIDATION */}
              <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Upload className="w-4 h-4 text-cyan-400" /> Upload JSON & Bulk-Update Channels
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Upload a JSON file or paste JSON code to bulk-insert or bulk-update channels with strict client & server validation.</p>
                  </div>

                  {/* Input Method Switcher */}
                  <div className="flex items-center bg-[#070b14] p-1 rounded-xl border border-slate-800 shrink-0">
                    <button
                      onClick={() => setImportMethod('file')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                        importMethod === 'file' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload File (.json / .m3u)
                    </button>
                    <button
                      onClick={() => setImportMethod('text')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                        importMethod === 'text' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" /> Direct Paste (JSON / M3U)
                    </button>
                  </div>
                </div>

                {/* File Upload / Paste Area */}
                {importMethod === 'file' ? (
                  <div className="space-y-3">
                    <input
                      ref={importFileInputRef}
                      type="file"
                      accept=".json,application/json,.m3u,.m3u8,text/plain"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="admin-json-file-input"
                    />
                    <div
                      onClick={() => importFileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 bg-[#070b14] rounded-2xl p-6 text-center cursor-pointer transition group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-cyan-950/50 border border-cyan-800/40 text-cyan-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
                        <Upload className="w-6 h-6" />
                      </div>
                      <h4 className="text-xs font-bold text-white mb-1">
                        {importedFileName ? `Selected: ${importedFileName}` : 'Click to select or drop your channel JSON or M3U file here'}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Supports full database exports, channel JSON arrays, or M3U / M3U8 IPTV playlists (.json, .m3u, .m3u8)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Paste JSON Array or M3U Playlist below:</span>
                      <button
                        onClick={() => {
                          const sample = `#EXTM3U\n#EXTINF:-1 tvg-id="TSports" tvg-name="T Sports" tvg-logo="https://i.ibb.co/68v4f1v/tsports.png" group-title="Cricket",T Sports (HD)\nhttps://playztv-apps.pages.dev/tsports/index.m3u8`;
                          validateAndParseJson(sample, 'sample.m3u');
                        }}
                        className="text-cyan-400 hover:underline text-[11px] cursor-pointer"
                      >
                        Paste Example M3U
                      </button>
                    </div>
                    <textarea
                      value={importRawText}
                      onChange={(e) => validateAndParseJson(e.target.value)}
                      placeholder='#EXTM3U&#10;#EXTINF:-1 tvg-id="TSports" tvg-name="T Sports" tvg-logo="https://..." group-title="Cricket",T Sports (HD)&#10;https://...&#10;&#10;OR paste standard JSON format...'
                      rows={6}
                      className="w-full bg-[#070b14] border border-slate-700 p-3 rounded-xl text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                {/* VALIDATION REPORT CARD */}
                {validationReport && (
                  <div className={`p-4 rounded-xl border space-y-3 ${
                    validationReport.isValid 
                      ? 'bg-emerald-950/20 border-emerald-500/40' 
                      : 'bg-red-950/20 border-red-500/40'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {validationReport.isValid ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                        )}
                        <div>
                          <h4 className={`text-xs font-bold ${validationReport.isValid ? 'text-emerald-300' : 'text-red-300'}`}>
                            {validationReport.isValid 
                              ? `Validation Passed: ${validationReport.count} Valid Channel${validationReport.count > 1 ? 's' : ''} Detected` 
                              : 'Validation Failed: Please fix JSON errors before importing'}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {validationReport.isValid 
                              ? 'All mandatory attributes (name, streamUrl, category) verified.' 
                              : `${validationReport.errors.length} error(s) found in data structure.`}
                          </p>
                        </div>
                      </div>

                      {/* Valid/Warning/Error Badges */}
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-900/40 border border-emerald-700/50 text-emerald-300 text-[10px] font-bold rounded-md">
                          {validationReport.count} Valid
                        </span>
                        {validationReport.warnings.length > 0 && (
                          <span className="px-2 py-0.5 bg-amber-900/40 border border-amber-700/50 text-amber-300 text-[10px] font-bold rounded-md">
                            {validationReport.warnings.length} Warnings
                          </span>
                        )}
                        {validationReport.errors.length > 0 && (
                          <span className="px-2 py-0.5 bg-red-900/40 border border-red-700/50 text-red-300 text-[10px] font-bold rounded-md">
                            {validationReport.errors.length} Errors
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Errors List */}
                    {validationReport.errors.length > 0 && (
                      <div className="bg-[#070b14] p-3 rounded-lg border border-red-800/40 space-y-1 text-[11px] text-red-300 font-mono">
                        {validationReport.errors.slice(0, 5).map((err, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="text-red-500 font-bold">•</span>
                            <span>{err}</span>
                          </div>
                        ))}
                        {validationReport.errors.length > 5 && (
                          <div className="text-[10px] text-slate-500 italic mt-1">
                            ... and {validationReport.errors.length - 5} more error(s).
                          </div>
                        )}
                      </div>
                    )}

                    {/* Warnings List */}
                    {validationReport.warnings.length > 0 && (
                      <div className="bg-[#070b14] p-3 rounded-lg border border-amber-800/40 space-y-1 text-[11px] text-amber-300">
                        {validationReport.warnings.slice(0, 3).map((w, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-500 font-bold">ℹ</span>
                            <span>{w}</span>
                          </div>
                        ))}
                        {validationReport.warnings.length > 3 && (
                          <div className="text-[10px] text-slate-500 italic mt-1">
                            ... and {validationReport.warnings.length - 3} more notice(s).
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* IMPORT MODE SELECTION & ACTIONS */}
                {validationReport?.isValid && (
                  <div className="space-y-4 pt-2">
                    {/* Strategy Selector */}
                    <div className="bg-[#070b14] p-4 rounded-xl border border-slate-800 space-y-3">
                      <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                        Select Import Strategy:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label
                          onClick={() => setImportMode('merge')}
                          className={`p-3 rounded-xl border cursor-pointer flex items-start gap-3 transition ${
                            importMode === 'merge'
                              ? 'bg-cyan-950/40 border-cyan-500 text-white'
                              : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="importMode"
                            checked={importMode === 'merge'}
                            onChange={() => setImportMode('merge')}
                            className="mt-0.5 accent-cyan-500"
                          />
                          <div>
                            <div className="text-xs font-bold text-cyan-300">Merge & Update (Recommended)</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Updates channels with matching name/ID and appends new channels. Existing channels are preserved.
                            </div>
                          </div>
                        </label>

                        <label
                          onClick={() => setImportMode('replace')}
                          className={`p-3 rounded-xl border cursor-pointer flex items-start gap-3 transition ${
                            importMode === 'replace'
                              ? 'bg-red-950/40 border-red-500 text-white'
                              : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="importMode"
                            checked={importMode === 'replace'}
                            onChange={() => setImportMode('replace')}
                            className="mt-0.5 accent-red-500"
                          />
                          <div>
                            <div className="text-xs font-bold text-red-300">Replace Entire Database</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Wipes current channel list and installs the imported {validationReport.count} channels cleanly.
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* PREVIEW TABLE OF CHANNELS TO BE IMPORTED */}
                    <div className="bg-[#070b14] border border-slate-800 rounded-xl overflow-hidden">
                      <div className="p-3 bg-[#090f1d] border-b border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">
                          Pre-Import Channel Inspection ({validationReport.previewChannels.length})
                        </span>
                        <div className="relative w-48">
                          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={previewFilter}
                            onChange={(e) => setPreviewFilter(e.target.value)}
                            placeholder="Filter preview..."
                            className="w-full bg-[#0d1527] border border-slate-700 pl-7 pr-2.5 py-1 rounded-lg text-[11px] text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="max-h-56 overflow-y-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-[#050811] text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800 sticky top-0">
                            <tr>
                              <th className="px-3 py-2">CH #</th>
                              <th className="px-3 py-2">Channel Name</th>
                              <th className="px-3 py-2">Category</th>
                              <th className="px-3 py-2">Quality</th>
                              <th className="px-3 py-2">Status</th>
                              <th className="px-3 py-2">Stream URL</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                            {validationReport.previewChannels
                              .filter(c => !previewFilter || c.name.toLowerCase().includes(previewFilter.toLowerCase()) || c.category.toLowerCase().includes(previewFilter.toLowerCase()))
                              .map((c, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/40">
                                  <td className="px-3 py-2 font-bold text-cyan-400">CH {c.channelNumber}</td>
                                  <td className="px-3 py-2 font-sans font-bold text-white">{c.name}</td>
                                  <td className="px-3 py-2">
                                    <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300 font-sans">{c.category}</span>
                                  </td>
                                  <td className="px-3 py-2 text-cyan-300">{c.quality}</td>
                                  <td className="px-3 py-2">
                                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${c.status === 'online' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                                      {c.status}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-slate-400 max-w-[200px] truncate" title={c.streamUrl}>
                                    {c.streamUrl}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Commit Action Button */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => {
                          setValidationReport(null);
                          setParsedDataToImport(null);
                          setImportRawText('');
                          setImportedFileName('');
                        }}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Cancel & Clear
                      </button>

                      <button
                        onClick={handleExecuteBulkImport}
                        disabled={isImportLoading}
                        id="btn-commit-bulk-import"
                        className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                      >
                        {isImportLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Processing Bulk Import...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Apply Bulk Update ({validationReport.count} Channels)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 8: SECURITY ================= */}
          {activeTab === 'security' && (
            <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 max-w-lg">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" /> Change Administrator Password
              </h3>

              <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 font-bold mb-1">Current Password</label>
                  <input
                    type="password"
                    value={securityForm.currentPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                    required
                    className="w-full bg-[#070b14] border border-slate-700 px-3 py-2 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 font-bold mb-1">New Password</label>
                  <input
                    type="password"
                    value={securityForm.newPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                    required
                    className="w-full bg-[#070b14] border border-slate-700 px-3 py-2 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 font-bold mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={securityForm.confirmPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                    required
                    className="w-full bg-[#070b14] border border-slate-700 px-3 py-2 rounded-xl text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition cursor-pointer mt-2"
                >
                  Update Admin Password
                </button>
              </form>
            </div>
          )}
          </motion.div>
        </div>
      </div>

      {/* ================= ADD/EDIT CHANNEL MODAL ================= */}
      {isChannelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0b1222] border border-cyan-500/40 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingChannel ? `Edit Channel: ${editingChannel.name}` : 'Add New Live Channel'}
              </h3>
              <button
                onClick={() => setIsChannelModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChannel} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Channel Name *</label>
                  <input
                    type="text"
                    required
                    value={channelForm.name}
                    onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
                    className="w-full bg-[#070b14] border border-slate-700 px-3 py-2 rounded-xl text-white"
                    placeholder="e.g. T Sports HD"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Channel Number *</label>
                  <input
                    type="number"
                    required
                    value={channelForm.channelNumber}
                    onChange={(e) => setChannelForm({ ...channelForm, channelNumber: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-[#070b14] border border-slate-700 px-3 py-2 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              {/* ================= VISUAL CATEGORY BADGE SELECTOR ================= */}
              <div className="bg-[#070b14] border border-slate-800 p-3.5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5 text-xs">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Channel Category *</span>
                  </label>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0d162b] border border-cyan-500/40 rounded-xl text-[11px] font-bold text-cyan-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>Selected: <strong>{channelForm.category || 'SPORTS'}</strong></span>
                  </div>
                </div>

                {/* Primary Core Category Badges: INTERNATIONAL, SPORTS, NEWS, MOVIES */}
                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                    <span>Core Categories (Click to Select)</span>
                    <span className="text-slate-500">Preset Badges</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CORE_CATEGORY_BADGES.map((cat) => {
                      const isSelected = (channelForm.category || '').toUpperCase() === cat.name;
                      const IconComponent = cat.icon;

                      return (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => setChannelForm(prev => ({ ...prev, category: cat.name }))}
                          className={`p-2.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between relative cursor-pointer group ${
                            isSelected ? cat.activeClass : cat.inactiveClass
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <div className={`p-1.5 rounded-lg bg-slate-950/60 border border-white/5 ${cat.iconColor}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            {isSelected ? (
                              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-slate-950 shadow">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </span>
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-slate-700 group-hover:bg-slate-500 transition" />
                            )}
                          </div>

                          <div>
                            <div className="text-xs font-black tracking-tight">{cat.label}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{cat.subLabel}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Popular Sub-Categories Chips */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Popular Sports & Entertainment
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_CATEGORY_CHIPS.map((chip) => {
                      const isSelected = (channelForm.category || '').toUpperCase() === chip.name;
                      const ChipIcon = chip.icon;

                      return (
                        <button
                          key={chip.name}
                          type="button"
                          onClick={() => setChannelForm(prev => ({ ...prev, category: chip.name }))}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/25 ring-1 ring-cyan-300'
                              : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80'
                          }`}
                        >
                          <ChipIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : chip.color}`} />
                          <span>{chip.label}</span>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* All Categories Dropdown + Custom Category Input */}
                <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-slate-800/80">
                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">
                      Or Select from All Categories ({data.categories.length})
                    </label>
                    <select
                      value={channelForm.category}
                      onChange={(e) => setChannelForm({ ...channelForm, category: e.target.value })}
                      className="w-full bg-[#0b1220] border border-slate-700 px-3 py-1.5 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-500"
                    >
                      {data.categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">
                      Video Quality *
                    </label>
                    <select
                      value={channelForm.quality}
                      onChange={(e) => setChannelForm({ ...channelForm, quality: e.target.value as VideoQuality })}
                      className="w-full bg-[#0b1220] border border-slate-700 px-3 py-1.5 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-500"
                    >
                      <option value="4K">4K Ultra HD</option>
                      <option value="Full HD">Full HD 1080p</option>
                      <option value="HD">HD 720p</option>
                      <option value="SD">SD 480p</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Stream URL (HLS / m3u8) */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Live Stream URL (HLS .m3u8 / DASH / MP4) *</label>
                <input
                  type="url"
                  required
                  value={channelForm.streamUrl}
                  onChange={(e) => setChannelForm({ ...channelForm, streamUrl: e.target.value })}
                  className="w-full bg-[#070b14] border border-slate-700 px-3 py-2 rounded-xl text-cyan-300 font-mono"
                  placeholder="https://server.domain/stream.m3u8"
                />
              </div>

              {/* Backup Stream URL */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Backup Stream URL (Optional Failover)</label>
                <input
                  type="url"
                  value={channelForm.backupStreamUrl || ''}
                  onChange={(e) => setChannelForm({ ...channelForm, backupStreamUrl: e.target.value })}
                  className="w-full bg-[#070b14] border border-slate-700 px-3 py-2 rounded-xl text-slate-300 font-mono"
                  placeholder="https://backup-server.domain/live.m3u8"
                />
              </div>

              {/* Channel Logo Upload */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Channel Logo</label>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-700 p-0.5 shrink-0 flex items-center justify-center">
                    {channelForm.logo ? (
                      <img src={channelForm.logo} alt="Preview" className="w-full h-full object-contain" />
                    ) : (
                      <Tv className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={channelForm.logo}
                    onChange={(e) => setChannelForm({ ...channelForm, logo: e.target.value })}
                    placeholder="Image URL or Base64"
                    className="flex-1 bg-[#070b14] border border-slate-700 px-3 py-2 rounded-xl text-slate-300"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileUpload(e, 'channel')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl border border-slate-700 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Camera className="w-4 h-4" /> Pick Image
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channelForm.status === 'online'}
                    onChange={(e) => setChannelForm({ ...channelForm, status: e.target.checked ? 'online' : 'offline' })}
                    className="rounded accent-emerald-500"
                  />
                  <span>Online / Live Broadcast</span>
                </label>

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channelForm.isFeatured}
                    onChange={(e) => setChannelForm({ ...channelForm, isFeatured: e.target.checked })}
                    className="rounded accent-cyan-500"
                  />
                  <span>Featured Channel</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsChannelModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD/EDIT CATEGORY MODAL ================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0b1222] border border-purple-500/40 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full bg-[#070b14] border border-slate-700 px-3 py-2 rounded-xl text-white uppercase font-bold"
                  placeholder="e.g. CRICKET"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Icon Name</label>
                <select
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  className="w-full bg-[#070b14] border border-slate-700 px-3 py-2 rounded-xl text-white"
                >
                  <option value="Award">Award (Cricket/Trophy)</option>
                  <option value="Trophy">Trophy (Football)</option>
                  <option value="Flame">Flame (Sports)</option>
                  <option value="Tv">Tv (News)</option>
                  <option value="Film">Film (Entertainment)</option>
                  <option value="Clapperboard">Clapperboard (Movies)</option>
                  <option value="Sparkles">Sparkles (Bangla)</option>
                  <option value="Globe">Globe (International)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= BROADCAST NOTIFICATION MODAL ================= */}
      {isNotifModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0b1222] border border-amber-500/40 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Broadcast Announcement</h3>
            <form onSubmit={handleSaveNotification} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={notifForm.title}
                  onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                  className="w-full bg-[#070b14] border border-slate-700 px-3 py-2 rounded-xl text-white font-bold"
                  placeholder="🏏 Bangladesh vs Sri Lanka Live"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Message *</label>
                <textarea
                  required
                  rows={3}
                  value={notifForm.message}
                  onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
                  className="w-full bg-[#070b14] border border-slate-700 px-3 py-2 rounded-xl text-white"
                  placeholder="Watch Bangladesh Cricket Tour Live in 1080p 60fps on T Sports..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Event Start Time (Optional)</label>
                  <input
                    type="datetime-local"
                    value={notifForm.eventStartTime}
                    onChange={(e) => setNotifForm({ ...notifForm, eventStartTime: e.target.value })}
                    className="w-full bg-[#070b14] border border-slate-700 px-3 py-2 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Link Live Channel</label>
                  <select
                    value={notifForm.channelId}
                    onChange={(e) => setNotifForm({ ...notifForm, channelId: e.target.value })}
                    className="w-full bg-[#070b14] border border-slate-700 px-3 py-2 rounded-xl text-white"
                  >
                    <option value="">-- None (General Notice) --</option>
                    {data.channels.map(ch => (
                      <option key={ch.id} value={ch.id}>{ch.channelNumber}. {ch.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifForm.isFeatured}
                  onChange={(e) => setNotifForm({ ...notifForm, isFeatured: e.target.checked })}
                  className="rounded accent-amber-500"
                />
                <span>Featured Match Alert Badge</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNotifModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DEDICATED M3U / M3U8 IMPORT MODAL ================= */}
      {isM3uModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0b1222] border border-emerald-500/40 rounded-3xl w-full max-w-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Import M3U / M3U8 Playlist</span>
                    <span className="text-xs font-normal text-emerald-400 px-2 py-0.5 bg-emerald-950/60 rounded-full border border-emerald-800/60">
                      M3U প্লেলিস্ট
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Paste raw #EXTM3U content or upload a playlist file to auto-import channels
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsM3uModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions & File Picker */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <input
                  ref={m3uFileInputRef}
                  type="file"
                  accept=".m3u,.m3u8,.txt,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const r = new FileReader();
                    r.onload = () => {
                      if (typeof r.result === 'string') {
                        setM3uText(r.result);
                        showToast(`📄 Loaded file: ${f.name}`);
                      }
                    };
                    r.readAsText(f);
                  }}
                />
                <button
                  type="button"
                  onClick={() => m3uFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Upload .m3u/.m3u8</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sample = `#EXTM3U\n#EXTINF:-1 tvg-id="TSports" tvg-name="T Sports" tvg-logo="https://i.ibb.co/68v4f1v/tsports.png" group-title="Cricket",T Sports (HD)\nhttps://playztv-apps.pages.dev/tsports/index.m3u8\n\n#EXTINF:-1 tvg-id="SonySports1" tvg-name="Sony Sports 1" tvg-logo="https://i.ibb.co/L5k6n21/sony-ten1.png" group-title="Sports",Sony Sports 1\nhttps://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`;
                    setM3uText(sample);
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs rounded-xl border border-slate-800 transition cursor-pointer"
                >
                  Paste Sample
                </button>
              </div>

              {m3uText && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-400 font-bold">
                    ~{(m3uText.match(/#EXTINF:/gi) || []).length || (m3uText.match(/https?:\/\//gi) || []).length} channels detected
                  </span>
                  <button
                    type="button"
                    onClick={() => setM3uText('')}
                    className="text-xs text-red-400 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Mode selection */}
            <div className="bg-[#070b14] p-3 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Channel Placement Mode (স্থান নির্ধারণ):
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label
                  onClick={() => setM3uMode('prepend')}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition flex items-center gap-2 ${
                    m3uMode === 'prepend'
                      ? 'bg-emerald-950/40 border-emerald-500 text-white'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="m3uPlacementMode"
                    checked={m3uMode === 'prepend'}
                    onChange={() => setM3uMode('prepend')}
                    className="accent-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-emerald-300">১ নম্বরে যুক্ত করুন</div>
                    <div className="text-[10px] text-slate-400">Prepend to Top</div>
                  </div>
                </label>

                <label
                  onClick={() => setM3uMode('append')}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition flex items-center gap-2 ${
                    m3uMode === 'append'
                      ? 'bg-cyan-950/40 border-cyan-500 text-white'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="m3uPlacementMode"
                    checked={m3uMode === 'append'}
                    onChange={() => setM3uMode('append')}
                    className="accent-cyan-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-cyan-300">শেষে যুক্ত করুন</div>
                    <div className="text-[10px] text-slate-400">Append to Bottom</div>
                  </div>
                </label>

                <label
                  onClick={() => setM3uMode('replace')}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition flex items-center gap-2 ${
                    m3uMode === 'replace'
                      ? 'bg-red-950/40 border-red-500 text-white'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="m3uPlacementMode"
                    checked={m3uMode === 'replace'}
                    onChange={() => setM3uMode('replace')}
                    className="accent-red-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-red-300">সব প্রতিস্থাপন</div>
                    <div className="text-[10px] text-slate-400">Wipe & Replace All</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Raw Textarea */}
            <div className="flex-1 min-h-[160px] flex flex-col space-y-1">
              <label className="text-[11px] font-bold text-slate-400">
                Paste #EXTM3U Playlist Content:
              </label>
              <textarea
                value={m3uText}
                onChange={(e) => setM3uText(e.target.value)}
                placeholder={'#EXTM3U\n#EXTINF:-1 tvg-id="ChannelID" tvg-name="Channel Name" tvg-logo="https://..." group-title="Bangla Entertainment",Channel Name\nhttps://example.com/live/stream.m3u8'}
                className="w-full flex-1 min-h-[160px] max-h-[300px] bg-[#070b14] border border-slate-800 focus:border-emerald-500 p-3 rounded-2xl text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none resize-y"
              />
            </div>

            {/* Automated Category Mapping Toggle Option */}
            <div className="bg-emerald-950/25 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Automated Predefined Category Mapping</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono border border-emerald-500/30">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Auto-maps incoming M3U 'group-title' tags (e.g. Cricket, BD Natok, Live News, Cinema) to the app's predefined categories.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={autoMapM3uCategories}
                  onChange={(e) => setAutoMapM3uCategories(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsM3uModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!m3uText.trim() || isM3uSubmitting}
                onClick={handleExecuteM3uImport}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isM3uSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Channels...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Import Channels Now (ইম্পোর্ট করুন)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CATEGORY SYNC REPORT MODAL ================= */}
      {isSyncModalOpen && syncReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0b1325] border border-cyan-500/50 rounded-3xl w-full max-w-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
                  <Zap className="w-5 h-5 fill-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>M3U Category Sync Execution Report</span>
                    <span className="text-xs font-normal text-cyan-300 px-2 py-0.5 bg-cyan-950/80 rounded-full border border-cyan-700/60">
                      অটো-সিঙ্ক রিপোর্ট
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Automated mapping results from M3U 'group-title' tags to predefined app categories
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Summary Stat Blocks */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#070c18] border border-slate-800 p-3.5 rounded-2xl">
                <div className="text-[11px] text-slate-400 font-medium">Scanned Channels</div>
                <div className="text-2xl font-black text-white mt-1">{syncReport.totalScanned}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Total channels verified</div>
              </div>

              <div className="bg-[#070c18] border border-cyan-500/40 p-3.5 rounded-2xl shadow-inner">
                <div className="text-[11px] text-cyan-300 font-bold">Categories Re-Mapped</div>
                <div className="text-2xl font-black text-cyan-400 mt-1">{syncReport.updatedCount}</div>
                <div className="text-[10px] text-cyan-500/80 mt-0.5">Normalized to canonical categories</div>
              </div>

              <div className="bg-[#070c18] border border-slate-800 p-3.5 rounded-2xl">
                <div className="text-[11px] text-slate-400 font-medium">Already Standard</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">{syncReport.unchangedCount}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Retained existing category</div>
              </div>
            </div>

            {/* Category Breakdown Chips */}
            <div className="bg-[#070c18] border border-slate-800/80 p-3 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Resulting Predefined Category Breakdown:</span>
                <span className="text-[10px] text-slate-500">Live TV UI Navigation</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(syncReport.breakdown || {}).map(([cat, count]) => (
                  <span
                    key={cat}
                    className="px-2.5 py-1 bg-slate-900 border border-slate-700/80 text-slate-200 text-xs rounded-xl flex items-center gap-1.5 font-medium"
                  >
                    <span className="text-cyan-400 font-bold">{cat}:</span>
                    <span className="font-mono text-white bg-slate-800 px-1.5 py-0.2 rounded text-[11px] font-bold">
                      {String(count)}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* Details Table of Modified Channels */}
            <div className="flex-1 min-h-[160px] max-h-[260px] overflow-y-auto border border-slate-800 rounded-2xl bg-[#070c18]">
              {syncReport.changes && syncReport.changes.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[#0c1426] border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Channel</th>
                      <th className="py-2.5 px-3">Original M3U Group</th>
                      <th className="py-2.5 px-3">Mapped Predefined Category</th>
                      <th className="py-2.5 px-3">Applied Rule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {syncReport.changes.slice(0, 80).map((item, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        <td className="py-2 px-3 font-bold text-white max-w-[180px] truncate">
                          {item.name}
                        </td>
                        <td className="py-2 px-3 text-amber-300/90 font-mono text-[11px]">
                          {item.originalGroup || item.originalCategory || '(None)'}
                        </td>
                        <td className="py-2 px-3 font-bold text-emerald-400 font-mono text-[11px]">
                          {item.newCategoryLabel || item.newCategory}
                        </td>
                        <td className="py-2 px-3 text-slate-400 text-[10px]">
                          {item.matchedRule}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                  <p className="text-xs font-bold text-white">All channels are already aligned!</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    No channels required category reassignment under current rule set.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-500">
                Changes saved to database and live UI state automatically.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                >
                  Done & Close Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0b1222] border border-red-500/50 rounded-2xl w-full max-w-sm p-5 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Confirm Deletion</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to permanently delete <span className="text-white font-bold">"{deleteConfirm.name}"</span>?
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
