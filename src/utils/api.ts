import { Channel, Category, AppSettings, AppNotification, DatabaseState, AdminAuthResponse, Match, ChannelIssueReport, IssueType } from '../types';
import { defaultAppSettings, defaultCategories, defaultChannels, defaultNotifications, defaultMatches } from '../data/defaultData';

const LOCAL_STORAGE_KEY = 'bd_live_sports_tv_db_v1';
const ADMIN_TOKEN_KEY = 'bd_live_sports_admin_token';

// Helper to get local DB cache
export function getLocalCache(): DatabaseState {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.channels) && parsed.channels.length > 0) {
        if (!parsed.matches || !Array.isArray(parsed.matches)) {
          parsed.matches = defaultMatches;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read local cache', e);
  }
  return {
    channels: defaultChannels,
    categories: defaultCategories,
    matches: defaultMatches,
    appSettings: defaultAppSettings,
    notifications: defaultNotifications,
    lastSyncTime: Date.now(),
  };
}

export function saveLocalCache(state: DatabaseState) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save local cache', e);
  }
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

// Fetch public data with automatic local cache fallback
export async function fetchAppData(): Promise<DatabaseState> {
  try {
    const res = await fetch('/api/data', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      saveLocalCache(data);
      return data;
    }
  } catch (err) {
    console.warn('Server API not reachable, using offline cache', err);
  }
  return getLocalCache();
}

// Admin login
export async function adminLogin(username: string, password: string): Promise<AdminAuthResponse> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json();
    if (res.ok && json.token) {
      setAdminToken(json.token);
    }
    return json;
  } catch (err) {
    // Offline simulation fallback for demo
    if (password === 'admin123') {
      const dummyToken = `admin_tok_${Date.now()}`;
      setAdminToken(dummyToken);
      return { authenticated: true, token: dummyToken, user: { username, role: 'superadmin' } };
    }
    return { authenticated: false, message: 'Server connection error' };
  }
}

// Verify admin token
export async function verifyAdmin(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;
  try {
    const res = await fetch('/api/admin/verify', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) return true;
  } catch (e) {
    return true; // allow offline session if token exists
  }
  return false;
}

// Admin mutation headers
function getAdminHeaders() {
  const token = getAdminToken() || 'admin_tok_dev';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// Channel mutations
export async function apiAddChannel(channel: Partial<Channel>): Promise<{ success: boolean; channel?: Channel; error?: string; message?: string }> {
  try {
    const res = await fetch('/api/admin/channels', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(channel),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.channel) {
        const cache = getLocalCache();
        const existingIdx = cache.channels.findIndex(c => c.id === data.channel.id);
        if (existingIdx >= 0) {
          cache.channels[existingIdx] = data.channel;
        } else {
          cache.channels.push(data.channel);
        }
        const catName = (data.channel.category || 'SPORTS').toUpperCase();
        if (!cache.categories.some(cat => cat.name.toUpperCase() === catName)) {
          cache.categories.push({
            id: `cat-${Date.now()}`,
            name: catName,
            slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            icon: 'Tv',
            sortOrder: cache.categories.length + 1,
            color: '#0ea5e9'
          });
        }
        saveLocalCache(cache);
      }
      return data;
    }
  } catch (err: any) {
    console.warn('Network error adding channel, saving locally:', err);
  }

  // Resilient fallback: Save to local cache immediately
  try {
    const cache = getLocalCache();
    const nextNumber = cache.channels.length > 0 
      ? Math.max(...cache.channels.map(c => c.channelNumber || 0)) + 1 
      : 1;
    const catName = (channel.category || 'SPORTS').trim().toUpperCase();
    const newChan: Channel = {
      id: `ch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      channelNumber: Number(channel.channelNumber) || nextNumber,
      name: channel.name?.trim() || 'New Live Channel',
      logo: channel.logo || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&auto=format&fit=crop&q=80',
      category: catName,
      streamUrl: channel.streamUrl?.trim() || '',
      backupStreamUrl: channel.backupStreamUrl?.trim() || '',
      description: channel.description || '',
      country: channel.country || 'Bangladesh',
      language: channel.language || 'Bangla',
      quality: (channel.quality as any) || 'Full HD',
      status: 'online',
      isFeatured: Boolean(channel.isFeatured),
      sortOrder: Number(channel.sortOrder) || cache.channels.length + 1,
      enabled: channel.enabled !== false,
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    cache.channels.push(newChan);
    if (!cache.categories.some(cat => cat.name.toUpperCase() === catName)) {
      cache.categories.push({
        id: `cat-${Date.now()}`,
        name: catName,
        slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        icon: 'Tv',
        sortOrder: cache.categories.length + 1,
        color: '#0ea5e9'
      });
    }
    saveLocalCache(cache);
    return { success: true, channel: newChan, message: 'Channel added successfully' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function apiUpdateChannel(id: string, update: Partial<Channel>): Promise<{ success: boolean; channel?: Channel; error?: string }> {
  try {
    const res = await fetch(`/api/admin/channels/${id}`, {
      method: 'PUT',
      headers: getAdminHeaders(),
      body: JSON.stringify(update),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.channel) {
        const cache = getLocalCache();
        const idx = cache.channels.findIndex(c => c.id === id);
        if (idx >= 0) {
          cache.channels[idx] = data.channel;
          saveLocalCache(cache);
        }
      }
      return data;
    }
  } catch (err: any) {
    console.warn('Network error updating channel, updating locally:', err);
  }

  // Local fallback
  try {
    const cache = getLocalCache();
    const idx = cache.channels.findIndex(c => c.id === id);
    if (idx >= 0) {
      cache.channels[idx] = {
        ...cache.channels[idx],
        ...update,
        updatedAt: new Date().toISOString(),
      };
      saveLocalCache(cache);
      return { success: true, channel: cache.channels[idx] };
    }
    return { success: false, error: 'Channel not found' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function apiDeleteChannel(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/admin/channels/${id}`, {
      method: 'DELETE',
      headers: getAdminHeaders(),
    });
    if (res.ok) {
      const cache = getLocalCache();
      cache.channels = cache.channels.filter(c => c.id !== id);
      saveLocalCache(cache);
      return await res.json();
    }
  } catch (err: any) {
    console.warn('Network error deleting channel, deleting locally:', err);
  }

  // Local fallback
  try {
    const cache = getLocalCache();
    cache.channels = cache.channels.filter(c => c.id !== id);
    saveLocalCache(cache);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function apiDeleteAllChannels(): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/admin/channels/clear-all', {
      method: 'POST',
      headers: getAdminHeaders(),
    });
    if (res.ok) {
      const cache = getLocalCache();
      cache.channels = [];
      saveLocalCache(cache);
      return await res.json();
    }
  } catch (err: any) {
    console.warn('Network error clearing channels:', err);
  }

  // Local fallback
  try {
    const cache = getLocalCache();
    cache.channels = [];
    saveLocalCache(cache);
    return { success: true, message: 'All channels deleted successfully' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function apiToggleChannel(id: string, field: 'status' | 'enabled' | 'isFeatured'): Promise<{ success: boolean; channel?: Channel }> {
  try {
    const res = await fetch(`/api/admin/channels/toggle/${id}`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ field }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.channel) {
        const cache = getLocalCache();
        const idx = cache.channels.findIndex(c => c.id === id);
        if (idx >= 0) {
          cache.channels[idx] = data.channel;
          saveLocalCache(cache);
        }
      }
      return data;
    }
  } catch (err: any) {
    console.warn('Network error toggling channel:', err);
  }

  // Local fallback
  try {
    const cache = getLocalCache();
    const idx = cache.channels.findIndex(c => c.id === id);
    if (idx >= 0) {
      if (field === 'status') {
        cache.channels[idx].status = cache.channels[idx].status === 'online' ? 'offline' : 'online';
      } else if (field === 'enabled') {
        cache.channels[idx].enabled = !cache.channels[idx].enabled;
      } else if (field === 'isFeatured') {
        cache.channels[idx].isFeatured = !cache.channels[idx].isFeatured;
      }
      saveLocalCache(cache);
      return { success: true, channel: cache.channels[idx] };
    }
  } catch (e) {
    // pass
  }
  return { success: false };
}

export async function apiReorderChannels(orderedIds: string[]): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/channels-reorder', {
      method: 'PUT',
      headers: getAdminHeaders(),
      body: JSON.stringify({ orderedIds }),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// Category mutations
export async function apiAddCategory(category: { name: string; icon?: string; color?: string }) {
  try {
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(category),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function apiUpdateCategory(id: string, category: Partial<Category>) {
  try {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'PUT',
      headers: getAdminHeaders(),
      body: JSON.stringify(category),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function apiDeleteCategory(id: string) {
  try {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: getAdminHeaders(),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// App Settings & Logo update
export async function apiUpdateAppSettings(settings: Partial<AppSettings>) {
  try {
    const res = await fetch('/api/admin/app-settings', {
      method: 'PUT',
      headers: getAdminHeaders(),
      body: JSON.stringify(settings),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Notifications
export async function apiCreateNotification(notif: Partial<AppNotification>) {
  try {
    const res = await fetch('/api/admin/notifications', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(notif),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function apiDeleteNotification(id: string) {
  try {
    const res = await fetch(`/api/admin/notifications/${id}`, {
      method: 'DELETE',
      headers: getAdminHeaders(),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Import & Export Database
export async function apiImportDatabase(dbData: any, mode: 'merge' | 'replace' = 'merge'): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  count?: number;
  added?: number;
  updated?: number;
  totalChannels?: number;
  warnings?: string[];
}> {
  try {
    const res = await fetch(`/api/admin/import-db?mode=${mode}`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(dbData),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Bulk Import M3U Playlist Text or File with automated group-title category mapping
export async function apiImportM3U(
  m3uContent: string, 
  mode: 'prepend' | 'append' | 'replace' = 'prepend',
  autoMapCategories: boolean = true,
  customMappings?: Record<string, string>
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  importedCount?: number;
  totalChannels?: number;
  categoryBreakdown?: Record<string, number>;
  mappedGroups?: Array<{ groupTitle: string; mappedCategory: string; count: number }>;
}> {
  try {
    const res = await fetch('/api/admin/channels/m3u-import', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ m3uContent, mode, autoMapCategories, customMappings }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Automated M3U Category Sync Script Execution
export async function apiSyncCategories(forceReCategorize: boolean = false): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  report?: any;
  channels?: any[];
}> {
  try {
    const res = await fetch('/api/admin/channels/sync-categories', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ forceReCategorize }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Get Predefined Category Rules
export async function apiGetCategoryMappingRules(): Promise<{
  success: boolean;
  rules?: any[];
  error?: string;
}> {
  try {
    const res = await fetch('/api/admin/category-mapping-rules');
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function apiChangePassword(currentPassword: string, newPassword: string) {
  try {
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Health Monitor API Endpoints
export async function apiGetHealthStats(): Promise<{
  success: boolean;
  stats?: import('../types').HealthCheckStats;
  error?: string;
}> {
  try {
    const res = await fetch('/api/admin/health-check/stats', {
      headers: getAdminHeaders(),
      cache: 'no-store'
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function apiRunHealthCheck(): Promise<{
  success: boolean;
  message?: string;
  stats?: import('../types').HealthCheckStats;
  channels?: import('../types').Channel[];
  error?: string;
}> {
  try {
    const res = await fetch('/api/admin/health-check/run', {
      method: 'POST',
      headers: getAdminHeaders(),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function apiCheckSingleStream(url: string, backupUrl?: string): Promise<{
  success: boolean;
  primary?: { ok: boolean; status: number; latencyMs: number; error?: string };
  backup?: { ok: boolean; status: number; latencyMs: number; error?: string } | null;
  status?: 'online' | 'offline';
  latencyMs?: number;
  error?: string;
}> {
  try {
    const res = await fetch('/api/admin/health-check/check-single', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ url, backupUrl }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Matches Management APIs
export async function apiAddMatch(match: Partial<Match>): Promise<{ success: boolean; match?: Match; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/admin/matches', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(match),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function apiUpdateMatch(id: string, match: Partial<Match>): Promise<{ success: boolean; match?: Match; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/admin/matches/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAdminHeaders(),
      body: JSON.stringify(match),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function apiDeleteMatch(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/admin/matches/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAdminHeaders(),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function apiToggleMatchNotify(id: string): Promise<{ success: boolean; isUserNotified?: boolean; match?: Match; error?: string }> {
  try {
    const res = await fetch(`/api/matches/${encodeURIComponent(id)}/toggle-notify`, {
      method: 'POST',
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Stream Issue Reporting APIs
export interface SubmitReportPayload {
  channelId: string;
  channelName: string;
  channelNumber: number;
  streamUrl?: string;
  activeServer?: number;
  issueType: IssueType;
  description?: string;
  userDeviceInfo?: string;
}

export async function submitChannelReport(payload: SubmitReportPayload): Promise<{ success: boolean; message?: string; report?: ChannelIssueReport; error?: string }> {
  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      // Also cache locally if needed
      const cache = getLocalCache();
      cache.reports = cache.reports || [];
      if (data.report) {
        cache.reports.unshift(data.report);
        saveLocalCache(cache);
      }
      return data;
    }
    return { success: false, error: data.error || 'Failed to submit report' };
  } catch (err: any) {
    // Offline resilient fallback
    const offlineReport: ChannelIssueReport = {
      id: `rep-${Date.now()}`,
      channelId: payload.channelId,
      channelName: payload.channelName,
      channelNumber: payload.channelNumber,
      streamUrl: payload.streamUrl,
      activeServer: payload.activeServer,
      issueType: payload.issueType,
      description: payload.description,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    const cache = getLocalCache();
    cache.reports = cache.reports || [];
    cache.reports.unshift(offlineReport);
    saveLocalCache(cache);
    return {
      success: true,
      message: 'Report recorded locally. Our team will review this channel stream.',
      report: offlineReport
    };
  }
}

export async function apiGetReports(): Promise<{ success: boolean; reports: ChannelIssueReport[]; error?: string }> {
  try {
    const res = await fetch('/api/admin/reports');
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn('Network error getting reports:', err);
  }
  const cache = getLocalCache();
  return { success: true, reports: cache.reports || [] };
}

export async function apiUpdateReportStatus(id: string, status: 'pending' | 'investigating' | 'resolved' | 'dismissed'): Promise<{ success: boolean; report?: ChannelIssueReport; error?: string }> {
  try {
    const res = await fetch(`/api/admin/reports/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: getAdminHeaders(),
      body: JSON.stringify({ status }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function apiDeleteReport(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/admin/reports/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAdminHeaders(),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function apiClearResolvedReports(): Promise<{ success: boolean; removedCount?: number; error?: string }> {
  try {
    const res = await fetch('/api/admin/reports/clear-resolved', {
      method: 'POST',
      headers: getAdminHeaders(),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}


