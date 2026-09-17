import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Channel, IssueType } from '../types';
import { getCleanChannelLogo } from '../utils/channelLogos';
import { useChannelLogo } from '../hooks/useChannelLogo';
import { submitChannelReport } from '../utils/api';
import { toast } from '../utils/toast';
import { 
  ArrowLeft, Play, Pause, RotateCcw, FastForward, SkipBack, SkipForward, 
  Volume2, VolumeX, Maximize, Minimize, RefreshCw, Lock, Unlock, Settings, 
  List, Grid, Sparkles, Tv, HelpCircle, AlertCircle, Server, Check, ShieldCheck, Wifi,
  PictureInPicture2, Flag, AlertTriangle, MessageSquare, Send, CheckCircle2,
  FileText, Share2, Scaling, Monitor, Sun, Sliders, Maximize2
} from 'lucide-react';
import Hls from 'hls.js';

export type ScreenScaleMode = 'fit' | 'stretch' | 'zoom' | '16_9' | '4_3';

interface VideoPlayerProps {
  channel: Channel | null;
  channels?: Channel[];
  onSelectChannel?: (channel: Channel) => void;
  onNextChannel?: () => void;
  onPrevChannel?: () => void;
  autoPlay?: boolean;
  isTvMode?: boolean;
  onToggleTvMode?: (active?: boolean) => void;
  onOpenTvMode?: () => void;
  onBack?: () => void;
  onToggleFavorite?: (channelId: string, e: React.MouseEvent) => void;
  isFavorite?: boolean;
  appLogo?: string;
  appName?: string;
}

// Fallback high-uptime public HLS test stream for graceful degraded playback
const STABLE_FALLBACK_STREAMS = [
  'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  'https://test-streams.mux.dev/test_001/stream.m3u8'
];

/**
 * Validates and normalizes stream URLs to ensure proper M3U8 / HLS format and protocol
 */
function validateAndNormalizeStreamUrl(rawUrl?: string): { isValid: boolean; normalizedUrl: string; isHlsFormat: boolean; reason?: string } {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return { isValid: false, normalizedUrl: '', isHlsFormat: false, reason: 'Empty or undefined stream URL' };
  }

  const trimmed = rawUrl.trim();

  // Basic URL structure validation
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
    return { isValid: false, normalizedUrl: '', isHlsFormat: false, reason: 'Invalid protocol. URL must start with http:// or https://' };
  }

  // Remove potential whitespace and dangerous characters
  let cleanUrl = trimmed;

  // Check format indicators
  const lowerUrl = cleanUrl.toLowerCase();
  const isHls = lowerUrl.includes('.m3u8') || 
                lowerUrl.includes('.m3u') || 
                lowerUrl.includes('/hls/') || 
                lowerUrl.includes('playlist.m3u8') ||
                lowerUrl.includes('manifest') ||
                lowerUrl.includes('application/x-mpegurl');

  return {
    isValid: true,
    normalizedUrl: cleanUrl,
    isHlsFormat: isHls
  };
}

/**
 * Pre-flight validation helper that fetches the M3U8 URL and verifies if the response contains #EXTM3U
 */
async function preflightValidateHlsManifest(url: string, signal?: AbortSignal): Promise<{ isValid: boolean; isCorsRestricted?: boolean; error?: string }> {
  try {
    // Attempt direct fetch with abort timeout to inspect manifest headers/body
    const response = await fetch(url, {
      method: 'GET',
      signal,
      headers: {
        'Accept': 'application/x-mpegURL, application/vnd.apple.mpegurl, text/plain, */*'
      }
    });

    if (!response.ok) {
      return {
        isValid: false,
        error: `HTTP Error: ${response.status} ${response.statusText}`
      };
    }

    const text = await response.text();
    // Valid HLS manifests must start with or contain the #EXTM3U tag
    if (text.includes('#EXTM3U')) {
      return { isValid: true };
    } else {
      return {
        isValid: false,
        error: 'Invalid manifest format: missing #EXTM3U tag'
      };
    }
  } catch (err: any) {
    // If request was explicitly aborted (component unmount or server change), ignore
    if (err.name === 'AbortError') {
      return { isValid: false, error: 'Validation aborted' };
    }

    // CORS or mixed-content browser restrictions can prevent direct JavaScript fetch reads
    // while hls.js or native media elements may still stream it via opaque tags.
    // If the URL has an .m3u8 extension or HLS marker, treat as CORS-restricted and allow player fallback
    const lower = url.toLowerCase();
    if (lower.includes('.m3u8') || lower.includes('playlist') || lower.includes('/hls/')) {
      console.info('[VideoPlayer] Preflight direct fetch restricted by CORS or network, delegating HLS manifest parsing to player engine:', err.message);
      return { isValid: true, isCorsRestricted: true };
    }

    return {
      isValid: false,
      error: err.message || 'Network connectivity error during pre-flight check'
    };
  }
}


export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  channel,
  channels = [],
  onSelectChannel,
  onNextChannel,
  onPrevChannel,
  autoPlay = true,
  isTvMode = false,
  onToggleTvMode,
  onOpenTvMode,
  onBack,
  onToggleFavorite,
  isFavorite = false,
  appLogo,
  appName,
}) => {
  const safeChannel = (channel || {
    id: 'default',
    channelNumber: 0,
    name: 'No Channel',
    streamUrl: '',
    backupStreamUrl: '',
    category: 'GENERAL',
    logo: '',
    country: '',
    language: '',
    quality: 'Full HD',
    status: 'online',
    isFeatured: false,
    sortOrder: 0,
    enabled: true,
    viewCount: 0,
    createdAt: '',
    updatedAt: ''
  }) as Channel;

  // Automatically fetch, validate, and cache high-resolution logo when tuning into channel
  const { logoUrl: highResLogoSrc } = useChannelLogo(channel);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [retryCount, setRetryCount] = useState<number>(0);
  const [retryStatusText, setRetryStatusText] = useState<string>('');
  
  // Active Server (Server 1 to Server 5)
  const [activeServer, setActiveServer] = useState<number>(1);
  
  // UI Controls & States
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showLogoOverlay, setShowLogoOverlay] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(isTvMode);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isDataSaver, setIsDataSaver] = useState<boolean>(false);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [isLandscape, setIsLandscape] = useState<boolean>(false);
  const [channelBanner, setChannelBanner] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  
  // Modals inside player
  const [showChannelListModal, setShowChannelListModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showNumberPadModal, setShowNumberPadModal] = useState<boolean>(false);
  const [showQualityModal, setShowQualityModal] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showScreenScaleModal, setShowScreenScaleModal] = useState<boolean>(false);
  const [reportIssueType, setReportIssueType] = useState<IssueType>('dead_stream');
  const [reportDescription, setReportDescription] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);
  const [reportSubmittedSuccess, setReportSubmittedSuccess] = useState<boolean>(false);
  const [selectedQuality, setSelectedQuality] = useState<string>('Auto (HD 1080p)');
  const [numberPadInput, setNumberPadInput] = useState<string>('');

  // Full / Large Screen Scaling & Theater States
  const [screenScaleMode, setScreenScaleMode] = useState<ScreenScaleMode>(() => {
    return (localStorage.getItem('bd_tv_screen_scale') as ScreenScaleMode) || 'fit';
  });
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(() => {
    return localStorage.getItem('bd_tv_theater_mode') === 'true';
  });

  const handleSetScaleMode = (mode: ScreenScaleMode) => {
    setScreenScaleMode(mode);
    localStorage.setItem('bd_tv_screen_scale', mode);
    toast.success(`Screen Mode: ${mode === 'stretch' ? '100% Stretch Fill' : mode === 'zoom' ? 'Cinema Zoom' : mode === '16_9' ? '16:9 Widescreen' : mode === '4_3' ? '4:3 Classic TV' : 'Fit to Screen'}`);
  };

  const handleCycleScaleMode = () => {
    const modes: ScreenScaleMode[] = ['fit', 'stretch', 'zoom', '16_9', '4_3'];
    const nextIdx = (modes.indexOf(screenScaleMode) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    handleSetScaleMode(nextMode);
  };

  const toggleTheaterMode = () => {
    setIsTheaterMode(prev => {
      const next = !prev;
      localStorage.setItem('bd_tv_theater_mode', String(next));
      toast.success(next ? 'Cinema Theater Mode: ON' : 'Cinema Theater Mode: OFF');
      return next;
    });
  };

  const getScaleClasses = () => {
    switch (screenScaleMode) {
      case 'stretch':
        return 'w-full h-full object-fill';
      case 'zoom':
        return 'w-full h-full object-cover scale-[1.03]';
      case '16_9':
        return 'w-full h-full aspect-video object-cover';
      case '4_3':
        return 'max-w-full max-h-full aspect-[4/3] object-contain mx-auto';
      case 'fit':
      default:
        return 'w-full h-full object-contain';
    }
  };

  const [isValidatingManifest, setIsValidatingManifest] = useState<boolean>(false);
  const [manifestValidationStatus, setManifestValidationStatus] = useState<string>('');
  const [isFloatingPiP, setIsFloatingPiP] = useState<boolean>(false);

  // IntersectionObserver to auto-dock into floating PiP when scrolling down past the video player
  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && isPlaying && !isFullscreen && !isFloatingPiP) {
          setIsFloatingPiP(true);
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(currentContainer);
    return () => {
      observer.disconnect();
    };
  }, [isPlaying, isFullscreen, isFloatingPiP]);



  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryAttemptsRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-hide controls after exactly 2 seconds of inactivity (re-appear on tap/mouse move/remote interaction)
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2000);
  }, []);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [safeChannel.id, resetControlsTimeout]);

  // Reset server selection and retry count when channel changes
  useEffect(() => {
    setActiveServer(1);
    setRetryCount(0);
    retryAttemptsRef.current = 0;
    setHasError(false);
    setErrorMessage('');
    setRetryStatusText('');
    setManifestValidationStatus('');
  }, [safeChannel.id]);

  // Clock ticker
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Generate 5 Server Stream URLs for the channel
  const getServerStreamUrl = useCallback((serverNum: number): string => {
    const base = safeChannel.streamUrl;
    if (!base) return '';

    // If backupStreamUrl exists and serverNum is 2
    if (serverNum === 2 && safeChannel.backupStreamUrl) {
      return safeChannel.backupStreamUrl;
    }

    // For Server 3: If backup exists, use it with server token, otherwise use base
    if (serverNum === 3) {
      const streamSource = safeChannel.backupStreamUrl || base;
      return streamSource;
    }

    // For Server 4 & 5: Provide reliable alternate edge nodes or clean base
    if (serverNum === 4 && safeChannel.backupStreamUrl) {
      return safeChannel.backupStreamUrl;
    }

    if (serverNum === 5) {
      // Return primary source or reliable fallback
      return base || STABLE_FALLBACK_STREAMS[0];
    }

    return base;
  }, [safeChannel.streamUrl, safeChannel.backupStreamUrl]);

  const rawStreamUrl = getServerStreamUrl(activeServer);

  // Execute Robust Stream Loading & Error Recovery with Pre-flight HLS Manifest Validation
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Format & URL Validation
    const validation = validateAndNormalizeStreamUrl(rawStreamUrl);
    if (!validation.isValid) {
      setIsLoading(false);
      setIsValidatingManifest(false);
      setHasError(true);
      setErrorMessage(`Invalid Stream URL: ${validation.reason || 'Format error'}`);
      return;
    }

    const validatedUrl = validation.normalizedUrl;
    const isHls = validation.isHlsFormat;

    // Trigger Pre-flight Loading & Validation State
    setIsLoading(true);
    setIsValidatingManifest(true);
    setManifestValidationStatus('Validating HLS manifest (#EXTM3U)...');
    setHasError(false);
    setErrorMessage('');
    setRetryStatusText('');

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    let isDisposed = false;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Helper for automated exponential retry logic
    const handleStreamFailure = (errorDesc: string, isFatal: boolean = true) => {
      if (isDisposed) return;
      console.warn(`[VideoPlayer] Error on Server ${activeServer}:`, errorDesc);

      if (retryAttemptsRef.current < 3) {
        retryAttemptsRef.current += 1;
        const delayMs = retryAttemptsRef.current * 1500; // 1.5s, 3s, 4.5s
        setRetryStatusText(`Stream temporarily unavailable — trying backup (Attempt ${retryAttemptsRef.current}/3)...`);

        retryTimeoutRef.current = setTimeout(() => {
          if (isDisposed) return;
          if (hlsRef.current) {
            hlsRef.current.recoverMediaError();
          } else {
            setRetryCount(prev => prev + 1);
          }
        }, delayMs);
        return;
      }

      // If retries exhausted on this server, auto-switch to next server (1 -> 2 -> 3 -> 4 -> 5)
      if (activeServer < 5) {
        retryAttemptsRef.current = 0;
        setRetryStatusText(`Stream temporarily unavailable — trying backup server (Server ${activeServer + 1})...`);
        
        retryTimeoutRef.current = setTimeout(() => {
          if (isDisposed) return;
          setActiveServer(prev => prev + 1);
          setRetryCount(0);
        }, 1200);
      } else {
        // All servers exhausted
        setIsLoading(false);
        setIsValidatingManifest(false);
        setHasError(true);
        setErrorMessage(
          safeChannel.backupStreamUrl 
            ? `Stream temporarily unavailable — trying backup encountered issues. You can manually retry or switch channels.` 
            : `Stream temporarily unavailable. The broadcast may currently be offline.`
        );
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      }
    };

    // Pre-flight HLS manifest validation before initializing media engines
    const initializePlayerEngine = async () => {
      // 1. Run Pre-flight Manifest Check
      const manifestCheck = await preflightValidateHlsManifest(validatedUrl, abortController.signal);
      if (isDisposed) return;

      if (!manifestCheck.isValid && !manifestCheck.isCorsRestricted) {
        console.warn('[VideoPlayer] Preflight manifest validation failed:', manifestCheck.error);
        handleStreamFailure(`Manifest check failed: ${manifestCheck.error || 'Invalid #EXTM3U structure'}`);
        return;
      }

      // Manifest validation confirmed or permitted
      setIsValidatingManifest(false);
      setManifestValidationStatus('');

      // 2. Initialize HLS.js or Native Video Engine
      if (Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 60 * 1000 * 1000,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 10,
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
          manifestLoadingTimeOut: 15000,
          manifestLoadingMaxRetry: 4,
          manifestLoadingRetryDelay: 1000,
          levelLoadingTimeOut: 15000,
          levelLoadingMaxRetry: 4,
          levelLoadingRetryDelay: 1000,
          fragLoadingTimeOut: 20000,
          fragLoadingMaxRetry: 5,
          fragLoadingRetryDelay: 1000,
        });

        hlsRef.current = hls;
        hls.loadSource(validatedUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (isDisposed) return;
          setIsLoading(false);
          setIsValidatingManifest(false);
          setHasError(false);
          setRetryStatusText('');
          retryAttemptsRef.current = 0;

          if (autoPlay) {
            video.play()
              .then(() => setIsPlaying(true))
              .catch(() => {
                // Browser autoplay policy might require muted start
                video.muted = true;
                setIsMuted(true);
                video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
              });
          }
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (isDisposed) return;
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn('[HLS Network Error] Attempting network recovery:', data.details);
                if (data.details === 'manifestLoadError' || data.details === 'manifestParsingError') {
                  handleStreamFailure(`Network error loading M3U8 manifest (${data.details})`, true);
                } else {
                  hls.startLoad();
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn('[HLS Media Error] Attempting media recovery:', data.details);
                hls.recoverMediaError();
                break;
              default:
                handleStreamFailure(`Fatal HLS error: ${data.details}`, true);
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl') || video.canPlayType('application/x-mpegURL')) {
        // Native Apple / Safari HLS support
        video.src = validatedUrl;
        video.load();

        const onCanPlay = () => {
          if (isDisposed) return;
          setIsLoading(false);
          setIsValidatingManifest(false);
          setHasError(false);
          setRetryStatusText('');
          retryAttemptsRef.current = 0;
          if (autoPlay) {
            video.play().then(() => setIsPlaying(true)).catch(() => {
              video.muted = true;
              setIsMuted(true);
              video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
            });
          }
        };

        const onError = () => {
          if (isDisposed) return;
          handleStreamFailure('Native browser playback error or CORS policy restriction', true);
        };

        video.addEventListener('canplay', onCanPlay, { once: true });
        video.addEventListener('error', onError, { once: true });
      } else {
        // Standard video tag fallback
        video.src = validatedUrl;
        video.load();
        if (autoPlay) {
          video.play().then(() => {
            if (isDisposed) return;
            setIsPlaying(true);
            setIsLoading(false);
            setIsValidatingManifest(false);
          }).catch(() => {
            if (isDisposed) return;
            handleStreamFailure('Direct video format unsupported or stream unavailable', true);
          });
        } else {
          setIsLoading(false);
          setIsValidatingManifest(false);
        }
      }
    };

    initializePlayerEngine();

    return () => {
      isDisposed = true;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [safeChannel.id, rawStreamUrl, retryCount, autoPlay, activeServer, safeChannel.backupStreamUrl]);


  // Handle Play/Pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Handle Volume
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (videoRef.current) videoRef.current.volume = volume || 0.5;
    } else {
      setIsMuted(true);
      if (videoRef.current) videoRef.current.volume = 0;
    }
  };

  // Listen to Fullscreen changes (ESC key, browser UI, orientation)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
      setIsFullscreen(isFs);
      if (onToggleTvMode) onToggleTvMode(isFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [onToggleTvMode]);

  // Fullscreen / TV Mode
  const toggleFullscreen = () => {
    const elem = containerRef.current as any;
    const doc = document as any;
    if (!elem) return;

    const isDocFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
    const currentlyFullscreen = isFullscreen || isDocFs;

    if (!currentlyFullscreen) {
      // Enter Fullscreen mode
      if (elem.requestFullscreen) {
        elem.requestFullscreen().then(() => {
          setIsFullscreen(true);
          if (onToggleTvMode) onToggleTvMode(true);
          if (onOpenTvMode) onOpenTvMode();
          toast.success('ফুল স্ক্রিন সক্রিয় (Fullscreen ON)');
        }).catch((err: any) => {
          console.warn('Standard requestFullscreen fallback to in-page fullscreen:', err);
          setIsFullscreen(true);
          if (onToggleTvMode) onToggleTvMode(true);
          if (onOpenTvMode) onOpenTvMode();
          if (videoRef.current && (videoRef.current as any).webkitEnterFullscreen) {
            try { (videoRef.current as any).webkitEnterFullscreen(); } catch (e) { /* ignore */ }
          }
          toast.success('ফুল স্ক্রিন সক্রিয় (Fullscreen ON)');
        });
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
        setIsFullscreen(true);
        if (onToggleTvMode) onToggleTvMode(true);
        if (onOpenTvMode) onOpenTvMode();
        toast.success('ফুল স্ক্রিন সক্রিয় (Fullscreen ON)');
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
        setIsFullscreen(true);
        if (onToggleTvMode) onToggleTvMode(true);
        if (onOpenTvMode) onOpenTvMode();
        toast.success('ফুল স্ক্রিন সক্রিয় (Fullscreen ON)');
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
        setIsFullscreen(true);
        if (onToggleTvMode) onToggleTvMode(true);
        if (onOpenTvMode) onOpenTvMode();
        toast.success('ফুল স্ক্রিন সক্রিয় (Fullscreen ON)');
      } else if (videoRef.current && (videoRef.current as any).webkitEnterFullscreen) {
        try { (videoRef.current as any).webkitEnterFullscreen(); } catch (e) { /* ignore */ }
        setIsFullscreen(true);
        if (onToggleTvMode) onToggleTvMode(true);
        toast.success('ফুল স্ক্রিন সক্রিয় (Fullscreen ON)');
      } else {
        setIsFullscreen(true);
        if (onToggleTvMode) onToggleTvMode(true);
        toast.success('ফুল স্ক্রিন সক্রিয় (Fullscreen ON)');
      }
    } else {
      // Exit Fullscreen mode
      if (isDocFs) {
        if (doc.exitFullscreen) {
          doc.exitFullscreen().catch((err: any) => console.warn('exitFullscreen error:', err));
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          doc.msExitFullscreen();
        }
      }
      setIsFullscreen(false);
      if (onToggleTvMode) onToggleTvMode(false);
      toast.success('ফুল স্ক্রিন বন্ধ (Fullscreen OFF)');
    }
  };

  // Picture in Picture (PiP)
  const togglePiP = async () => {
    const video = videoRef.current;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (video && document.pictureInPictureEnabled && video.requestPictureInPicture) {
        await video.requestPictureInPicture();
      } else {
        setIsFloatingPiP(prev => !prev);
      }
    } catch (err) {
      console.warn('Picture-in-picture error:', err);
      setIsFloatingPiP(prev => !prev);
    }
  };

  // Share Stream / Deep Link
  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = channel ? `${channel.name} Live Streaming` : 'BD LIVE SPORTS TV';
    const shareText = channel ? `Watch ${channel.name} live in 1080p HD on BD LIVE SPORTS TV!` : 'Watch Live Sports & TV Channels';

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        toast.success('Shared successfully!');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Channel deep link copied to clipboard!');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success('Channel deep link copied to clipboard!');
        } catch {
          toast.error('Failed to copy link.');
        }
      }
    }
  };

  // Channel navigation
  const handlePrev = () => {
    if (onPrevChannel) {
      onPrevChannel();
    } else if (channels.length > 0 && onSelectChannel) {
      const idx = channels.findIndex(c => c.id === safeChannel.id);
      const prevIdx = idx > 0 ? idx - 1 : channels.length - 1;
      onSelectChannel(channels[prevIdx]);
    }
  };

  const handleNext = () => {
    if (onNextChannel) {
      onNextChannel();
    } else if (channels.length > 0 && onSelectChannel) {
      const idx = channels.findIndex(c => c.id === safeChannel.id);
      const nextIdx = idx < channels.length - 1 ? idx + 1 : 0;
      onSelectChannel(channels[nextIdx]);
    }
  };

  // Global Keyboard & TV Remote Shortcuts (OK/Enter = Show/Play, F = Fullscreen, N = Next, P = Prev, Space = Play/Pause, M = Mute)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      const key = e.key.toLowerCase();

      // TV Remote & Player Navigation - OK / Enter / Select / Space
      if (e.key === 'Enter' || e.key === 'Select' || e.key === 'MediaPlayPause' || e.key === ' ' || key === 'k') {
        e.preventDefault();
        if (!showControls) {
          // 1st press/tap: Show OK / Play button and all controls for exactly 2 seconds
          resetControlsTimeout();
        } else {
          // If controls are already visible: toggle play/pause & reset 2-second auto-hide timer
          togglePlay();
          resetControlsTimeout();
        }
        return;
      }

      // TV Remote navigation keys reset the 2-second auto-hide timer
      if (e.key.startsWith('Arrow') || e.key === 'ChannelUp' || e.key === 'ChannelDown') {
        resetControlsTimeout();
      }

      if (key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (key === 't') {
        e.preventDefault();
        toggleTheaterMode();
      } else if (key === 's' || key === 'a') {
        e.preventDefault();
        handleCycleScaleMode();
      } else if (key === 'n' || e.key === 'ArrowRight' || e.key === 'ChannelUp') {
        e.preventDefault();
        handleNext();
      } else if (key === 'p' || e.key === 'ArrowLeft' || e.key === 'ChannelDown') {
        e.preventDefault();
        handlePrev();
      } else if (key === 'm') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isFullscreen, screenScaleMode, isTheaterMode, showControls, resetControlsTimeout]);

  // Issue Reporting Options & Handler
  const ISSUE_TYPE_OPTIONS: { id: IssueType; label: string; subLabel: string; labelBn: string; icon: React.ElementType; color: string }[] = [
    {
      id: 'dead_stream',
      label: 'Dead / Broken Stream',
      subLabel: 'Stream will not play, black screen or error',
      labelBn: 'স্ট্রিম চলছে না / কাজ করছে না',
      icon: AlertCircle,
      color: 'text-rose-400 border-rose-500/40 bg-rose-500/10'
    },
    {
      id: 'buffering',
      label: 'Constant Buffering & Lag',
      subLabel: 'Frequent freezing, stuttering or stutter',
      labelBn: 'বারবার বাফারিং হচ্ছে / আটকে যায়',
      icon: RefreshCw,
      color: 'text-amber-400 border-amber-500/40 bg-amber-500/10'
    },
    {
      id: 'metadata',
      label: 'Incorrect Channel Info / EPG',
      subLabel: 'Wrong channel name, logo, schedule or category',
      labelBn: 'নাম, লোগো বা তথ্য ভুল',
      icon: FileText,
      color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10'
    },
    {
      id: 'audio_sync',
      label: 'Audio / Video Sync Issue',
      subLabel: 'Sound out of sync, delayed or no sound',
      labelBn: 'অডিও ও ভিডিও মিলছে না / শব্দ নেই',
      icon: VolumeX,
      color: 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10'
    },
    {
      id: 'low_quality',
      label: 'Poor Video Quality',
      subLabel: 'Blurry picture, pixelated or low bitrate',
      labelBn: 'ভিডিও কোয়ালিটি খারাপ / ঝাপসা',
      icon: Sparkles,
      color: 'text-purple-400 border-purple-500/40 bg-purple-500/10'
    },
    {
      id: 'other',
      label: 'Other Problem',
      subLabel: 'Other stream issue or feedback',
      labelBn: 'অন্যান্য সমস্যা',
      icon: HelpCircle,
      color: 'text-slate-300 border-slate-600/40 bg-slate-700/20'
    }
  ];

  const handleSubmitIssueReport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!channel) return;

    setIsSubmittingReport(true);
    try {
      const activeStreamUrl = getServerStreamUrl(activeServer);
      const res = await submitChannelReport({
        channelId: channel.id,
        channelName: channel.name,
        channelNumber: channel.channelNumber,
        streamUrl: activeStreamUrl,
        activeServer: activeServer,
        issueType: reportIssueType,
        description: reportDescription,
        userDeviceInfo: typeof navigator !== 'undefined' ? `${navigator.userAgent} (${window.innerWidth}x${window.innerHeight})` : 'Web Browser'
      });

      if (res.success) {
        setReportSubmittedSuccess(true);
        toast.success(`Report submitted for ${channel.name}! Admin notified.`);
        setTimeout(() => {
          setShowReportModal(false);
          setReportSubmittedSuccess(false);
          setReportDescription('');
        }, 1800);
      } else {
        toast.error(res.error || 'Failed to submit report. Please try again.');
      }
    } catch (err) {
      toast.error('Network error submitting report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (!channel) {
    return (
      <div className="w-full aspect-video bg-black flex items-center justify-center text-slate-400">
        No channel selected
      </div>
    );
  }

  const logoSrc = highResLogoSrc || getCleanChannelLogo(safeChannel) || safeChannel.logo;

  return (
    <div 
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onPointerDown={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      onTouchMove={resetControlsTimeout}
      onKeyDown={resetControlsTimeout}
      onDoubleClick={(e) => {
        e.stopPropagation();
        toggleFullscreen();
      }}
      tabIndex={0}
      onClick={() => {
        if (!isLocked) {
          resetControlsTimeout();
        }
      }}
      className={`relative w-full bg-black select-none overflow-hidden flex flex-col items-center justify-center group transition-all duration-300 ${
        isTvMode || isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen' : 
        isFloatingPiP ? 'fixed bottom-20 right-4 z-50 w-80 sm:w-96 aspect-video min-h-0 rounded-2xl shadow-2xl border-2 border-cyan-500/80 animate-in fade-in zoom-in-95' : 
        isTheaterMode ? 'w-full h-[620px] sm:h-[720px] md:h-[800px] lg:h-[86vh] rounded-3xl shadow-2xl border border-cyan-500/50 shadow-cyan-950/50 ring-1 ring-cyan-500/30' :
        'w-full aspect-video min-h-[460px] sm:min-h-[580px] md:min-h-[660px] lg:min-h-[740px] xl:min-h-[820px] rounded-3xl shadow-2xl border border-slate-800'
      }`}
    >
      {/* Floating Picture-in-Picture Header Bar */}
      {isFloatingPiP && (
        <div className="absolute top-2 left-2 right-2 z-30 flex items-center justify-between bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 shadow-md">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className="text-xs font-bold text-white truncate">CH {channel.channelNumber}: {channel.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFloatingPiP(false);
                if (containerRef.current) {
                  containerRef.current.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="p-1 rounded-lg bg-cyan-600/40 hover:bg-cyan-600 text-cyan-200 transition cursor-pointer"
              title="Expand to Full View"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFloatingPiP(false);
              }}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-bold px-1.5 cursor-pointer"
              title="Close PiP"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        playsInline
        autoPlay={autoPlay}
        style={{
          filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
        }}
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentPlaybackTime(videoRef.current.currentTime);
            setDuration(videoRef.current.duration || 0);
          }
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => { 
          setIsLoading(false); 
          setHasError(false); 
          setRetryStatusText(''); 
        }}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
          setErrorMessage(`Server ${activeServer} connection failed. Try Server 1-5.`);
        }}
        className={`${getScaleClasses()} bg-black cursor-pointer transition-all duration-300`}
      />

      {/* Loading Spinner with Reconnection & Pre-flight Validation Feedback */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm z-20 pointer-events-none p-4 text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4 shadow-lg shadow-cyan-500/50" />
          <p className="text-white font-bold text-sm sm:text-base tracking-wide animate-pulse">
            Connecting to {channel.name} (Server {activeServer})...
          </p>
          {isValidatingManifest && (
            <p className="text-cyan-400 text-xs sm:text-sm font-mono mt-2 bg-slate-900/90 px-3.5 py-1.5 rounded-full border border-cyan-500/40 shadow flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400 animate-pulse" />
              {manifestValidationStatus || 'Pre-flight HLS Manifest (#EXTM3U) check...'}
            </p>
          )}
          {retryStatusText && (
            <p className="text-cyan-300 text-xs sm:text-sm font-medium mt-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-cyan-500/30">
              {retryStatusText}
            </p>
          )}
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md z-30 p-6 text-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mb-3 animate-bounce" />
          <h3 className="text-white font-bold text-lg sm:text-xl mb-1">Server {activeServer} Unavailable</h3>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mb-6">{errorMessage}</p>
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <span className="text-xs text-slate-300 mr-2 font-bold">Switch Server:</span>
            {[1, 2, 3, 4, 5].map((srv) => (
              <button
                key={srv}
                onClick={(e) => {
                  e.stopPropagation();
                  retryAttemptsRef.current = 0;
                  setActiveServer(srv);
                  setRetryCount(0);
                }}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition ${
                  activeServer === srv 
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/40' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                Server {srv}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                retryAttemptsRef.current = 0;
                setRetryCount(prev => prev + 1);
              }}
              className="px-4 sm:px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Retry Stream
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setReportIssueType('dead_stream');
                setShowReportModal(true);
              }}
              className="px-4 sm:px-5 py-2.5 bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center gap-2 border border-rose-500/40"
              title="Report broken or dead stream to admin"
            >
              <Flag className="w-4 h-4" /> Report Issue
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="px-4 sm:px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition"
            >
              Next Channel
            </button>
          </div>
        </div>
      )}

      {/* Lock Badge & Floating Unlock Action if Screen is Locked */}
      {isLocked && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 animate-in fade-in">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLocked(false);
              resetControlsTimeout();
              toast.success('Screen Unlocked');
            }}
            className="bg-black/85 hover:bg-black backdrop-blur-md border border-cyan-400/80 px-5 py-2.5 rounded-full text-white text-xs font-bold flex items-center gap-2 shadow-2xl transition cursor-pointer active:scale-95"
            aria-label="Unlock Screen"
          >
            <Unlock className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Tap to Unlock Screen</span>
          </button>
        </div>
      )}

      {/* Permanent TV Broadcast Channel Logo Watermark (Always visible in safe area, even when controls auto-hide) */}
      <div 
        className={`absolute top-4 right-4 z-20 pointer-events-none transition-opacity duration-300 ${
          showControls ? 'opacity-0' : 'opacity-85'
        }`}
        aria-hidden="true"
      >
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 shadow-2xl">
          <img 
            src={logoSrc} 
            alt={channel.name} 
            className="h-6 sm:h-7 w-auto max-w-[80px] object-contain drop-shadow"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span className="text-[10px] font-black text-rose-500 tracking-wider">LIVE</span>
        </div>
      </div>

      {/* Overlay Controls Container */}
      <div 
        className={`absolute inset-0 z-30 flex flex-col justify-between p-4 sm:p-6 transition-all duration-300 bg-gradient-to-b from-black/85 via-black/20 to-black/90 ${
          showControls && !isLocked
            ? 'opacity-100 pointer-events-auto scale-100' 
            : 'opacity-0 pointer-events-none scale-[0.99]'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          resetControlsTimeout();
        }}
      >
        {/* Top Header Bar: Top-Left Channel Info & Top-Right TV Player Icons */}
        <div className="flex items-center justify-between w-full gap-2 sm:gap-4">
          {/* TOP-LEFT CONTROLS: Back, Channel Name, Category/Metadata */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onBack) {
                  onBack();
                } else if (isFullscreen) {
                  toggleFullscreen();
                }
              }}
              className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition shadow-lg shrink-0 cursor-pointer"
              title="Back"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            {/* Channel Info & Meta */}
            <div className="flex items-center gap-2.5 bg-black/60 backdrop-blur-md px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl border border-white/20 shadow-xl min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-900/90 border border-white/15 p-1 flex items-center justify-center shrink-0 shadow-lg overflow-hidden">
                <img 
                  src={logoSrc} 
                  alt={channel.name} 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h2 className="text-white font-extrabold text-xs sm:text-base tracking-wide drop-shadow-md truncate max-w-[140px] sm:max-w-[220px]">
                    {channel.name}
                  </h2>
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-red-600 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" /> LIVE
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                  <span className="text-cyan-300 font-bold text-[10px] sm:text-xs shrink-0">
                    CH {channel.channelNumber < 10 ? `0${channel.channelNumber}` : channel.channelNumber}
                  </span>
                  {safeChannel.bnName && (
                    <span className="text-slate-300 text-[10px] sm:text-xs font-medium truncate hidden xs:inline">
                      • {safeChannel.bnName}
                    </span>
                  )}
                  <span className="text-slate-400 font-mono text-[10px] sm:text-[11px] hidden md:inline">
                    • {currentTime || '00:00:00'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TOP-RIGHT CONTROLS: List, Grid, Refresh, Lock, Display Mode, Settings */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 1. Channel List icon */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowChannelListModal(true);
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition shadow-lg cursor-pointer"
              title="Channel List"
              aria-label="Channel List"
            >
              <List className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* 2. Channel Grid / Number Pad icon */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowNumberPadModal(true);
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition shadow-lg cursor-pointer"
              title="Channel Grid / Number Pad"
              aria-label="Channel Grid / Number Pad"
            >
              <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* 3. Refresh Stream icon */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                retryAttemptsRef.current = 0;
                setRetryCount(prev => prev + 1);
                toast.success(`Refreshing ${channel.name}...`);
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition shadow-lg cursor-pointer"
              title="Refresh Stream"
              aria-label="Refresh Stream"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* 4. Lock Controls icon */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLocked(true);
                setShowControls(false);
                toast.info('Controls Locked. Tap unlock button on screen to restore.');
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 backdrop-blur-md border border-white/20 text-amber-300 flex items-center justify-center transition shadow-lg cursor-pointer"
              title="Lock Screen Controls"
              aria-label="Lock Screen Controls"
            >
              <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* 5. Screen Scale / Display Mode icon */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowScreenScaleModal(true);
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 backdrop-blur-md border border-white/20 text-cyan-400 flex items-center justify-center transition shadow-lg cursor-pointer"
              title="Screen Scaling & Display Settings (S)"
              aria-label="Screen Scaling & Display Settings"
            >
              <Scaling className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* 6. Settings icon */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettingsModal(true);
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition shadow-lg cursor-pointer"
              title="Player Settings"
              aria-label="Player Settings"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* CENTER VIDEO CONTROLS (Previous, Replay 10s, Large Play/Pause, Forward 10s, Next) */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 my-auto">
          {/* 1. Previous Channel Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
              resetControlsTimeout();
            }}
            className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-black/85 active:scale-95 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition shadow-xl group cursor-pointer"
            title="Previous Channel (P or ArrowLeft)"
            aria-label="Previous Channel"
          >
            <SkipBack className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition" />
          </button>

          {/* 2. Replay 10s Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (videoRef.current) videoRef.current.currentTime -= 10;
              resetControlsTimeout();
            }}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/85 active:scale-95 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition shadow-xl cursor-pointer"
            title="Replay 10s"
            aria-label="Replay 10 seconds"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* 3. Prominent Large Play / Pause / OK Button */}
          <div className="relative flex flex-col items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
                resetControlsTimeout();
              }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/75 hover:bg-black/90 active:scale-95 backdrop-blur-md border-2 border-white/30 text-white flex items-center justify-center shadow-2xl shadow-cyan-500/40 transition transform hover:scale-105 cursor-pointer ring-4 ring-cyan-500/20"
              title={isPlaying ? "Pause (OK / Space / Enter)" : "Play (OK / Space / Enter)"}
              aria-label={isPlaying ? "Pause (OK)" : "Play (OK)"}
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
              ) : (
                <Play className="w-7 h-7 sm:w-10 sm:h-10 text-white ml-1" />
              )}
            </button>
            <span className="absolute -bottom-5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-cyan-400/40 text-[9px] sm:text-[10px] font-black text-cyan-300 uppercase tracking-wider pointer-events-none shadow-md">
              OK / {isPlaying ? 'PAUSE' : 'PLAY'}
            </span>
          </div>

          {/* 4. Forward 10s Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (videoRef.current) videoRef.current.currentTime += 10;
              resetControlsTimeout();
            }}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/85 active:scale-95 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition shadow-xl cursor-pointer"
            title="Forward 10s"
            aria-label="Forward 10 seconds"
          >
            <FastForward className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* 5. Next Channel Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
              resetControlsTimeout();
            }}
            className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-black/85 active:scale-95 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition shadow-xl group cursor-pointer"
            title="Next Channel (N or ArrowRight)"
            aria-label="Next Channel"
          >
            <SkipForward className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition" />
          </button>
        </div>

        {/* BOTTOM CONTROLS: Progress/Seek Bar, Volume, Scale, Theater & Fullscreen */}
        <div className="flex flex-col gap-2 w-full bg-black/70 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/15">
          {/* Progress / Seek bar & Live Time */}
          <div className="w-full flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-300">
              {Math.floor(currentPlaybackTime / 60)}:{Math.floor(currentPlaybackTime % 60).toString().padStart(2, '0')}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentPlaybackTime}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setCurrentPlaybackTime(val);
                if (videoRef.current) videoRef.current.currentTime = val;
                resetControlsTimeout();
              }}
              className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-[11px] font-mono text-cyan-400 font-bold">
              LIVE (Server {activeServer})
            </span>
          </div>

          <div className="flex items-center justify-between">
            {/* Volume Control */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                  resetControlsTimeout();
                }} 
                className="text-white hover:text-cyan-400 transition cursor-pointer p-1 rounded-lg" 
                title="Mute/Unmute (M)"
                aria-label="Mute or Unmute"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  handleVolumeChange(parseFloat(e.target.value));
                  resetControlsTimeout();
                }}
                className="w-16 sm:w-28 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Bottom Actions: Next, Scaling, Theater, PiP, Fullscreen */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Quick Next Channel Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                  resetControlsTimeout();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-md shadow-cyan-600/30 cursor-pointer"
                title="Next Channel (N)"
                aria-label="Next Channel"
              >
                <SkipForward className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Next Channel</span>
              </button>

              {/* Screen Scale Mode Quick Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowScreenScaleModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 font-bold text-xs transition shadow cursor-pointer"
                title="Full / Large Screen Scaling (S)"
                aria-label="Screen Scaling"
              >
                <Scaling className="w-3.5 h-3.5 text-cyan-400" />
                <span className="capitalize hidden sm:inline">
                  {screenScaleMode === 'stretch' ? 'Stretch 100%' : screenScaleMode === 'zoom' ? 'Cinema Zoom' : screenScaleMode === '16_9' ? '16:9 Wide' : screenScaleMode === '4_3' ? '4:3 TV' : 'Fit Screen'}
                </span>
              </button>

              {/* Theater Mode Toggle */}
              {!isFullscreen && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTheaterMode();
                    resetControlsTimeout();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition border cursor-pointer ${
                    isTheaterMode 
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/30' 
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                  }`}
                  title="বড় স্ক্রিন / থিয়েটার মোড (T)"
                  aria-label="Theater Mode"
                >
                  <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden md:inline">{isTheaterMode ? 'স্বাভাবিক' : 'বড় স্ক্রিন'}</span>
                </button>
              )}

              {/* Picture in Picture */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePiP();
                  resetControlsTimeout();
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/10 cursor-pointer"
                title="Picture in Picture"
                aria-label="Picture in Picture"
              >
                <PictureInPicture2 className="w-4 h-4" /> <span className="hidden lg:inline">PiP</span>
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                  resetControlsTimeout();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition border cursor-pointer ${
                  isFullscreen 
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/30' 
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                }`}
                title={isFullscreen ? 'ফুল স্ক্রিন বন্ধ করুন (Exit: ESC / F)' : 'ফুল স্ক্রিন করুন (Fullscreen: F)'}
                aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                <span className="hidden sm:inline">{isFullscreen ? 'ফুল স্ক্রিন বন্ধ' : 'ফুল স্ক্রিন'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Channel List Modal */}
      {showChannelListModal && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex flex-col p-4 sm:p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h3 className="text-white font-extrabold text-lg flex items-center gap-2">
              <List className="w-5 h-5 text-cyan-400" /> Select Channel
            </h3>
            <button
              onClick={() => setShowChannelListModal(false)}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {channels.map((ch) => {
              const isSelected = ch.id === channel.id;
              const chLogo = getCleanChannelLogo(ch) || ch.logo;
              return (
                <div
                  key={ch.id}
                  onClick={() => {
                    if (onSelectChannel) onSelectChannel(ch);
                    setShowChannelListModal(false);
                  }}
                  className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition ${
                    isSelected 
                      ? 'bg-cyan-500/20 border-cyan-500 text-white shadow-lg shadow-cyan-500/20' 
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <img src={chLogo} alt={ch.name} className="w-8 h-8 object-contain rounded shrink-0" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                  <div className="flex flex-col truncate">
                    <span className="font-mono text-[10px] text-cyan-400">CH {ch.channelNumber}</span>
                    <span className="font-bold text-xs truncate">{ch.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Number Pad Modal */}
      {showNumberPadModal && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex flex-col items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl w-full max-w-xs flex flex-col items-center">
            <h3 className="text-white font-extrabold text-base mb-2">Enter Channel Number</h3>
            <div className="w-full bg-black/60 border border-slate-700 rounded-2xl py-3 px-4 text-center text-2xl font-mono font-black text-cyan-400 mb-4 tracking-widest min-h-[50px]">
              {numberPadInput || '_'}
            </div>
            <div className="grid grid-cols-3 gap-3 w-full mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'C', 'OK'].map((btn) => (
                <button
                  key={btn}
                  onClick={() => {
                    if (btn === 'C') {
                      setNumberPadInput('');
                    } else if (btn === 'OK') {
                      const num = parseInt(numberPadInput, 10);
                      const found = channels.find(c => c.channelNumber === num);
                      if (found) {
                        if (onSelectChannel) onSelectChannel(found);
                        setShowNumberPadModal(false);
                        setNumberPadInput('');
                      } else {
                        alert(`Channel number ${num} not found`);
                      }
                    } else {
                      setNumberPadInput(prev => prev + btn);
                    }
                  }}
                  className="py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg rounded-xl transition shadow active:scale-95"
                >
                  {btn}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowNumberPadModal(false)}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex flex-col items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="text-white font-extrabold text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" /> Player Settings
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="space-y-3.5 text-sm text-slate-300">
              {/* Screen Scale Setting Link */}
              <div 
                onClick={() => {
                  setShowSettingsModal(false);
                  setShowScreenScaleModal(true);
                }}
                className="p-3 rounded-2xl bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/40 flex items-center justify-between cursor-pointer transition"
              >
                <div className="flex items-center gap-2.5">
                  <Scaling className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="font-bold text-white text-xs block">Full & Large Screen Settings</span>
                    <span className="text-[10px] text-cyan-300">স্ক্রিন সাইজ, স্কেলিং (Fit, Stretch, Zoom) ও ব্রাইটনেস</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-cyan-400 capitalize px-2 py-0.5 rounded-lg bg-cyan-900/60 border border-cyan-700/50">
                  {screenScaleMode}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                <span>Active Server</span>
                <span className="font-bold text-cyan-400">Server {activeServer} (HD)</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                <span>Hardware Acceleration</span>
                <span className="font-bold text-emerald-400">Enabled</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                <span>Buffer Length</span>
                <span className="font-mono text-xs text-slate-400">30 seconds</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">Stream down or buggy?</span>
                <button
                  onClick={() => {
                    setShowSettingsModal(false);
                    setShowReportModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" /> Report Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Full & Large Screen Settings Modal */}
      {showScreenScaleModal && (
        <div 
          onClick={() => setShowScreenScaleModal(false)}
          className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-2xl w-full max-w-lg my-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Scaling className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-extrabold text-base sm:text-lg">Full & Large Screen Settings</h3>
                  <p className="text-[11px] text-slate-400">স্ক্রিন সাইজ, স্ট্রেচ, সিনেমা জুম ও ডিসপ্লে সাইজ কনফিগার করুন</p>
                </div>
              </div>
              <button
                onClick={() => setShowScreenScaleModal(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Screen Scale Modes */}
            <div className="space-y-3 mb-5">
              <label className="block text-xs font-bold text-slate-300">
                Screen Scaling / স্ক্রিন স্কেলিং মোড:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'fit' as ScreenScaleMode,
                    title: 'Fit to Screen (ফিট)',
                    desc: 'Original 16:9 ratio, no cropping or distortion',
                    icon: Maximize
                  },
                  {
                    id: 'stretch' as ScreenScaleMode,
                    title: '100% Stretch (ফুল স্ট্রেচ)',
                    desc: 'Fills entire screen, zero black borders',
                    icon: Scaling
                  },
                  {
                    id: 'zoom' as ScreenScaleMode,
                    title: 'Cinema Zoom (সিনেমা জুম)',
                    desc: 'Proportional smart zoom for ultrawide & TVs',
                    icon: Maximize2
                  },
                  {
                    id: '16_9' as ScreenScaleMode,
                    title: '16:9 Widescreen (১৬:৯)',
                    desc: 'Standard HDTV cinematic widescreen',
                    icon: Monitor
                  },
                  {
                    id: '4_3' as ScreenScaleMode,
                    title: '4:3 Classic TV (৪:৩)',
                    desc: 'Vintage retro television aspect ratio',
                    icon: Tv
                  }
                ].map((mode) => {
                  const isSelected = screenScaleMode === mode.id;
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => handleSetScaleMode(mode.id)}
                      className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-600/30 border-cyan-400 text-white shadow-lg shadow-cyan-500/20'
                          : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${isSelected ? 'bg-cyan-500/40 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white flex items-center justify-between">
                          {mode.title}
                          {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1" />}
                        </span>
                        <span className="text-[10px] text-slate-400 leading-tight mt-0.5">{mode.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Large Theater Mode Toggle & Fullscreen Actions */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Large Cinema Theater Mode</span>
                    <span className="text-[10px] text-slate-400">প্লেয়ারটিকে স্ক্রিনের পূর্ণ উচ্চতায় (82vh) বড় করে দেখুন</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleTheaterMode}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    isTheaterMode 
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400' 
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {isTheaterMode ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Screen Brightness Adjustment */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400" /> Screen Brightness / উজ্জ্বলতা: {brightness}%
                  </span>
                  {brightness !== 100 && (
                    <button
                      type="button"
                      onClick={() => setBrightness(100)}
                      className="text-[10px] text-cyan-400 hover:underline font-bold"
                    >
                      Reset (100%)
                    </button>
                  )}
                </div>
                <input
                  type="range"
                  min={70}
                  max={150}
                  step={5}
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>

            {/* Quick Fullscreen Launch */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-400 font-mono">
                Keyboard: <strong className="text-cyan-400">F</strong> Fullscreen • <strong className="text-cyan-400">S</strong> Scale • <strong className="text-cyan-400">T</strong> Theater
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowScreenScaleModal(false);
                  toggleFullscreen();
                }}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                {isFullscreen ? 'Exit Fullscreen' : 'Launch Fullscreen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quality Selection Modal */}
      {showQualityModal && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex flex-col items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="text-white font-extrabold text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" /> Select Stream Quality
              </h3>
              <button
                onClick={() => setShowQualityModal(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>
            <div className="space-y-2">
              {['Auto (HD 1080p)', 'Full HD (1080p)', 'HD (720p)', 'SD (480p)', 'Low (360p)'].map((quality) => (
                <button
                  key={quality}
                  onClick={() => {
                    setSelectedQuality(quality);
                    setShowQualityModal(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border font-bold text-xs sm:text-sm transition ${
                    selectedQuality === quality
                      ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <span>{quality}</span>
                  {selectedQuality === quality && <Check className="w-4 h-4 text-cyan-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Issue Modal */}
      {showReportModal && (
        <div 
          onClick={() => {
            if (!isSubmittingReport) setShowReportModal(false);
          }}
          className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-2xl w-full max-w-lg my-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <Flag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-extrabold text-base sm:text-lg">Report Channel Issue</h3>
                  <p className="text-[11px] text-slate-400">সমস্যা জানান — অ্যাডমিন টিম চ্যানেলটি চেক করবে</p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                disabled={isSubmittingReport}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-800 transition"
              >
                <ArrowLeft className="w-4 h-4 sm:hidden" />
                <span className="hidden sm:inline px-2 py-1 text-xs font-bold">Close</span>
              </button>
            </div>

            {reportSubmittedSuccess ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-white font-black text-lg">Thank You! / ধন্যবাদ!</h4>
                <p className="text-xs text-slate-300 max-w-sm">
                  Your issue report for <strong className="text-cyan-400">{channel.name}</strong> has been logged. Our monitoring team will inspect and restore the stream immediately.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitIssueReport} className="space-y-4">
                {/* Channel Summary Card */}
                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={logoSrc}
                      alt={channel.name}
                      className="w-9 h-9 object-contain rounded-xl bg-slate-900 p-1 border border-slate-800"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
                          CH {channel.channelNumber}
                        </span>
                        <span className="text-xs font-bold text-white truncate max-w-[160px] sm:max-w-[220px]">
                          {channel.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Category: {channel.category} • Server {activeServer}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    S{activeServer} Active
                  </span>
                </div>

                {/* Issue Type Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    What is wrong with this channel? / সমস্যার ধরণ নির্বাচন করুন:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ISSUE_TYPE_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = reportIssueType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setReportIssueType(opt.id)}
                          className={`p-2.5 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                            isSelected
                              ? 'bg-rose-500/20 border-rose-500 text-white shadow-md shadow-rose-500/20'
                              : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/60 text-slate-300'
                          }`}
                        >
                          <div className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${isSelected ? 'bg-rose-500/30 text-rose-300' : 'bg-slate-800 text-slate-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white flex items-center justify-between">
                              {opt.label}
                              {isSelected && <Check className="w-3.5 h-3.5 text-rose-400 shrink-0 ml-1" />}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">{opt.labelBn}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Details Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Details / অতিরিক্ত মন্তব্য (ঐচ্ছিক):
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="e.g. Stream stopped during 2nd half, audio out of sync, or shows black screen..."
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-2xl p-3 text-xs text-white placeholder-slate-500 outline-none transition resize-none"
                  />
                </div>

                {/* Submit and Cancel Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    disabled={isSubmittingReport}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    id="submit-channel-report-btn"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingReport ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Submit Report
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

