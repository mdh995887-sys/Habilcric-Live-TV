// Toast notification helper with offline-to-online connectivity transition detection
// File: src/utils/toast.ts

import { useState, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'online' | 'offline';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  timestamp: number;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();
  private wasOffline: boolean = typeof navigator !== 'undefined' ? !navigator.onLine : false;
  private cleanupConnectivity: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAutoConnectivityListener();
    }
  }

  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const copy = [...this.toasts];
    this.listeners.forEach((listener) => {
      try {
        listener(copy);
      } catch (err) {
        console.error('Toast listener error:', err);
      }
    });
  }

  public show(options: {
    message: string;
    type?: ToastType;
    title?: string;
    duration?: number;
    icon?: string;
    action?: { label: string; onClick: () => void };
  }): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const duration = options.duration ?? (options.type === 'online' ? 4000 : 3500);

    const newToast: ToastItem = {
      id,
      type: options.type || 'info',
      title: options.title,
      message: options.message,
      duration,
      timestamp: Date.now(),
      icon: options.icon,
      action: options.action,
    };

    // Limit maximum active toasts to 4
    this.toasts = [newToast, ...this.toasts.slice(0, 3)];
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  public success(message: string, title?: string, duration?: number): string {
    return this.show({ message, title, type: 'success', duration });
  }

  public error(message: string, title?: string, duration?: number): string {
    return this.show({ message, title, type: 'error', duration: duration ?? 5000 });
  }

  public info(message: string, title?: string, duration?: number): string {
    return this.show({ message, title, type: 'info', duration });
  }

  public warning(message: string, title?: string, duration?: number): string {
    return this.show({ message, title, type: 'warning', duration: duration ?? 4500 });
  }

  public online(message?: string, title?: string): string {
    return this.show({
      title: title || 'Connection Restored',
      message: message || "You're back online. Live streams and match updates are active.",
      type: 'online',
      duration: 4000,
    });
  }

  public offline(message?: string, title?: string): string {
    return this.show({
      title: title || 'No Internet Connection',
      message: message || 'You are currently offline. Check your network connection.',
      type: 'offline',
      duration: 6000,
    });
  }

  public dismiss(id: string) {
    const initialLength = this.toasts.length;
    this.toasts = this.toasts.filter((t) => t.id !== id);
    if (this.toasts.length !== initialLength) {
      this.notify();
    }
  }

  public clearAll() {
    this.toasts = [];
    this.notify();
  }

  public getToasts(): ToastItem[] {
    return [...this.toasts];
  }

  /**
   * Initializes network connectivity detection (offline -> online transition helper).
   * Automatically triggers a brief restored toast when the user reconnects to the internet.
   */
  public initAutoConnectivityListener(options?: {
    lang?: 'en' | 'bn';
    customOnlineMessage?: string;
    customOfflineMessage?: string;
    onOnline?: () => void;
    onOffline?: () => void;
  }): () => void {
    if (typeof window === 'undefined') return () => {};

    if (this.cleanupConnectivity) {
      this.cleanupConnectivity();
    }

    const lang = options?.lang || 'en';

    const handleOnline = () => {
      // Transition from offline to online
      if (this.wasOffline) {
        const msg = options?.customOnlineMessage || (
          lang === 'bn'
            ? '✓ ইন্টারনেট সংযোগ পুনরায় স্থাপিত হয়েছে! লাইভ সম্প্রচার সচল আছে।'
            : "✓ Internet connection restored! You are back online."
        );
        const title = lang === 'bn' ? 'সংযোগ স্থাপিত' : 'Back Online';
        
        this.online(msg, title);
        options?.onOnline?.();
      }
      this.wasOffline = false;
    };

    const handleOffline = () => {
      this.wasOffline = true;
      const msg = options?.customOfflineMessage || (
        lang === 'bn'
          ? '⚠️ ইন্টারনেট সংযোগ বিচ্ছিন্ন! আপনি এখন অফলাইনে আছেন।'
          : '⚠️ You are currently offline. Check your network.'
      );
      const title = lang === 'bn' ? 'অফলাইন' : 'Offline';
      
      this.offline(msg, title);
      options?.onOffline?.();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    this.cleanupConnectivity = () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };

    return this.cleanupConnectivity;
  }
}

// Global Singleton Toast Instance
export const toast = new ToastManager();

/**
 * Convenience helper to trigger an online transition toast directly
 */
export function triggerOnlineToast(message?: string, title?: string) {
  return toast.online(message, title);
}

/**
 * Convenience helper to trigger an offline warning toast directly
 */
export function triggerOfflineToast(message?: string, title?: string) {
  return toast.offline(message, title);
}

/**
 * Helper to initialize connectivity toast monitoring with custom options
 */
export function initConnectivityToast(options?: {
  lang?: 'en' | 'bn';
  customOnlineMessage?: string;
  customOfflineMessage?: string;
  onOnline?: () => void;
  onOffline?: () => void;
}) {
  return toast.initAutoConnectivityListener(options);
}

/**
 * React Hook to subscribe to Toast notifications
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>(() => toast.getToasts());

  useEffect(() => {
    const unsubscribe = toast.subscribe((updated) => {
      setToasts(updated);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    toasts,
    toast,
    dismiss: (id: string) => toast.dismiss(id),
    clearAll: () => toast.clearAll(),
    show: toast.show.bind(toast),
    success: toast.success.bind(toast),
    error: toast.error.bind(toast),
    info: toast.info.bind(toast),
    warning: toast.warning.bind(toast),
    online: toast.online.bind(toast),
    offline: toast.offline.bind(toast),
  };
}
