import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseConnectionListenerOptions {
  onRefreshData?: () => void | Promise<void>;
  checkIntervalMs?: number;
  lang?: 'bn' | 'en';
}

export interface ConnectionListenerState {
  isOnline: boolean;
  isChecking: boolean;
  isRetrying: boolean;
  showReconnected: boolean;
  lastChecked: number | null;
  offlineSince: number | null;
  errorMessage: string | null;
  retryConnection: () => Promise<boolean>;
  probeReachability: () => Promise<boolean>;
}

export function useConnectionListener(options?: UseConnectionListenerOptions): ConnectionListenerState {
  const onRefreshDataRef = useRef(options?.onRefreshData);
  useEffect(() => {
    onRefreshDataRef.current = options?.onRefreshData;
  }, [options?.onRefreshData]);

  const lang = options?.lang || 'bn';

  // Initial online state from browser
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const [offlineSince, setOfflineSince] = useState<number | null>(() => {
    return typeof navigator !== 'undefined' && !navigator.onLine ? Date.now() : null;
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reconnectedTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerReconnectedBanner = useCallback(() => {
    setShowReconnected(true);
    if (reconnectedTimerRef.current) {
      clearTimeout(reconnectedTimerRef.current);
    }
    reconnectedTimerRef.current = setTimeout(() => {
      setShowReconnected(false);
    }, 4500);
  }, []);

  /**
   * Active Reachability Probe:
   * Actually validates whether network packets can reach our application backend,
   * bypassing stale navigator.onLine false positives.
   */
  const probeReachability = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const probeUrl = `/api/health?_t=${Date.now()}`;
      const res = await fetch(probeUrl, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setLastChecked(Date.now());
      setIsChecking(false);

      if (res.ok) {
        return true;
      }
      return false;
    } catch {
      clearTimeout(timeoutId);
      setLastChecked(Date.now());
      setIsChecking(false);
      return false;
    }
  }, []);

  /**
   * Manual 'Retry Connection' handler triggered by the user button.
   * Performs real probe, triggers manual data refresh, and updates state.
   */
  const retryConnection = useCallback(async (): Promise<boolean> => {
    setIsRetrying(true);
    setErrorMessage(null);

    try {
      const reached = await probeReachability();

      if (reached) {
        // Connection is confirmed active!
        setIsOnline(true);
        setOfflineSince(null);
        setErrorMessage(null);
        triggerReconnectedBanner();

        // Trigger manual data refresh callback
        if (onRefreshDataRef.current) {
          try {
            await onRefreshDataRef.current();
          } catch (err) {
            console.warn('Manual refresh data callback failed:', err);
          }
        }

        setIsRetrying(false);
        return true;
      } else {
        // Still offline
        setIsOnline(false);
        if (!offlineSince) {
          setOfflineSince(Date.now());
        }
        setErrorMessage(
          lang === 'bn'
            ? 'সংযোগ পাওয়া যায়নি। আপনার ইন্টারনেট বা ওয়াই-ফাই সংযোগ চেক করে আবার চেষ্টা করুন।'
            : 'Unable to establish server connection. Please verify your internet or Wi-Fi network and try again.'
        );
        setIsRetrying(false);
        return false;
      }
    } catch {
      setIsOnline(false);
      setErrorMessage(
        lang === 'bn'
          ? 'সংযোগ যাচাইয়ে ত্রুটি হয়েছে। পুনরায় চেষ্টা করুন।'
          : 'Network check encountered an error. Please retry.'
      );
      setIsRetrying(false);
      return false;
    }
  }, [lang, offlineSince, probeReachability, triggerReconnectedBanner]);

  // Network Event Listeners & Periodic Polling when offline
  useEffect(() => {
    const handleBrowserOnline = async () => {
      // Browser reports online, verify with active probe
      const reached = await probeReachability();
      if (reached) {
        setIsOnline(true);
        setOfflineSince(null);
        setErrorMessage(null);
        triggerReconnectedBanner();

        if (onRefreshDataRef.current) {
          try {
            await onRefreshDataRef.current();
          } catch (e) {
            console.warn('Auto refresh on reconnect failed', e);
          }
        }
      }
    };

    const handleBrowserOffline = () => {
      setIsOnline(false);
      setOfflineSince(Date.now());
      setShowReconnected(false);
    };

    const handleWindowFocus = async () => {
      // When user returns to the tab, probe if currently marked offline
      if (!navigator.onLine || !isOnline) {
        const reached = await probeReachability();
        if (reached) {
          setIsOnline(true);
          setOfflineSince(null);
          setErrorMessage(null);
          triggerReconnectedBanner();
          if (onRefreshDataRef.current) {
            onRefreshDataRef.current();
          }
        }
      }
    };

    window.addEventListener('online', handleBrowserOnline);
    window.addEventListener('offline', handleBrowserOffline);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('online', handleBrowserOnline);
      window.removeEventListener('offline', handleBrowserOffline);
      window.removeEventListener('focus', handleWindowFocus);
      if (reconnectedTimerRef.current) {
        clearTimeout(reconnectedTimerRef.current);
      }
    };
  }, [isOnline, probeReachability, triggerReconnectedBanner]);

  // Periodic fallback probe every 12 seconds ONLY while offline
  useEffect(() => {
    if (isOnline) return;

    const interval = setInterval(async () => {
      if (navigator.onLine) {
        const reached = await probeReachability();
        if (reached) {
          setIsOnline(true);
          setOfflineSince(null);
          setErrorMessage(null);
          triggerReconnectedBanner();
          if (onRefreshDataRef.current) {
            onRefreshDataRef.current();
          }
        }
      }
    }, options?.checkIntervalMs || 12000);

    return () => clearInterval(interval);
  }, [isOnline, options?.checkIntervalMs, probeReachability, triggerReconnectedBanner]);

  return {
    isOnline,
    isChecking,
    isRetrying,
    showReconnected,
    lastChecked,
    offlineSince,
    errorMessage,
    retryConnection,
    probeReachability,
  };
}
