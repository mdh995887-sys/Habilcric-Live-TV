import { useState, useEffect, useRef } from 'react';
import { Channel } from '../types';
import { getCleanChannelLogo } from '../utils/channelLogos';

export interface UseChannelLogoOptions {
  preferSvg?: boolean;
  preloadHighRes?: boolean;
}

export interface UseChannelLogoResult {
  logoUrl: string;
  isCustomLogo: boolean;
  isLoading: boolean;
  hasError: boolean;
  dominantColor?: string;
  reloadLogo: () => void;
}

// In-memory persistent cache for verified high-res logos
const logoCache = new Map<string, string>();

/**
 * useChannelLogo: Automatically fetches, validates, and maps the crispest high-resolution channel logo
 * when a user tunes into a stream. Handles image preloading, SVG vector fallbacks, and persistent safe-area visibility.
 */
export function useChannelLogo(
  channel: Channel | null | undefined,
  options: UseChannelLogoOptions = {}
): UseChannelLogoResult {
  const { preloadHighRes = true } = options;
  const channelId = channel?.id || '';
  const channelName = channel?.name || '';
  const customLogoUrl = channel?.logo?.trim() || '';

  const [logoUrl, setLogoUrl] = useState<string>(() => {
    if (!channel) return '';
    if (channelId && logoCache.has(channelId)) {
      return logoCache.get(channelId)!;
    }
    // High-res SVG vector logo by default
    const vectorLogo = getCleanChannelLogo(channel);
    if (customLogoUrl && customLogoUrl.startsWith('http')) {
      return customLogoUrl;
    }
    return vectorLogo;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isCustomLogo, setIsCustomLogo] = useState<boolean>(Boolean(customLogoUrl));
  const activeChannelRef = useRef<string>(channelId);

  useEffect(() => {
    activeChannelRef.current = channelId;
    if (!channel) {
      setLogoUrl('');
      setIsLoading(false);
      setHasError(false);
      return;
    }

    const vectorLogo = getCleanChannelLogo(channel);
    
    // Check cache first for zero-latency safe area switching
    if (logoCache.has(channelId)) {
      setLogoUrl(logoCache.get(channelId)!);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    // If channel has a remote HTTP logo, test preloading
    if (customLogoUrl && (customLogoUrl.startsWith('http://') || customLogoUrl.startsWith('https://')) && preloadHighRes) {
      setIsLoading(true);
      setHasError(false);

      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.src = customLogoUrl;

      img.onload = () => {
        if (activeChannelRef.current === channelId) {
          logoCache.set(channelId, customLogoUrl);
          setLogoUrl(customLogoUrl);
          setIsCustomLogo(true);
          setIsLoading(false);
        }
      };

      img.onerror = () => {
        if (activeChannelRef.current === channelId) {
          // Graceful fallback to verified ultra-HD vector SVG
          logoCache.set(channelId, vectorLogo);
          setLogoUrl(vectorLogo);
          setIsCustomLogo(false);
          setIsLoading(false);
          setHasError(false);
        }
      };
    } else {
      // Direct vector badge
      logoCache.set(channelId, vectorLogo);
      setLogoUrl(vectorLogo);
      setIsCustomLogo(false);
      setIsLoading(false);
      setHasError(false);
    }
  }, [channelId, channelName, customLogoUrl, preloadHighRes]);

  const reloadLogo = () => {
    if (!channel) return;
    logoCache.delete(channelId);
    const vectorLogo = getCleanChannelLogo(channel);
    setLogoUrl(vectorLogo);
    setIsCustomLogo(false);
  };

  return {
    logoUrl: logoUrl || (channel ? getCleanChannelLogo(channel) : ''),
    isCustomLogo,
    isLoading,
    hasError,
    reloadLogo,
  };
}
