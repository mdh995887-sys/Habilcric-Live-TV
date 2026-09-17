import { useState, useEffect, useCallback } from 'react';
import { DatabaseState, Channel, Category, AppSettings, AppNotification } from '../types';
import { fetchAppData, getLocalCache, saveLocalCache } from '../utils/api';

export function useRealtimeDb() {
  const [data, setData] = useState<DatabaseState>(getLocalCache);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  const refreshData = useCallback(async () => {
    try {
      const fresh = await fetchAppData();
      setData(fresh);
      setLastUpdated(fresh.lastSyncTime || Date.now());
      
      // Update browser document title & icon dynamically if appName/logo changed
      if (fresh.appSettings?.appName) {
        document.title = `${fresh.appSettings.appName} - Live Cricket, Football & TV`;
      }
      if (fresh.appSettings?.appLogo) {
        const favicon = document.getElementById('app-favicon') as HTMLLinkElement;
        if (favicon && fresh.appSettings.appLogo.startsWith('data:') || fresh.appSettings.appLogo.startsWith('http') || fresh.appSettings.appLogo.startsWith('/')) {
          favicon.href = fresh.appSettings.appLogo;
        }
      }
    } catch (e) {
      console.warn('Realtime sync fetch error', e);
    }
  }, []);

  useEffect(() => {
    refreshData();
    // Background polling every 8 seconds for real-time sync with admin changes
    const interval = setInterval(() => {
      refreshData();
    }, 8000);

    return () => clearInterval(interval);
  }, [refreshData]);

  // Direct optimistic local state updater
  const updateLocalState = useCallback((updater: (prev: DatabaseState) => DatabaseState) => {
    setData((prev) => {
      const next = updater(prev);
      saveLocalCache(next);
      return next;
    });
  }, []);

  return {
    data,
    channels: data.channels || [],
    categories: data.categories || [],
    matches: data.matches || [],
    appSettings: data.appSettings,
    notifications: data.notifications || [],
    loading,
    lastUpdated,
    refreshData,
    updateLocalState,
  };
}
