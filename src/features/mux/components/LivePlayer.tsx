'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import MuxPlayer from '@mux/mux-player-react';
import { useAuth } from '@/features/auth/context/auth-context';
import { useMuxAnalytics, createUserContext, createEnhancedMuxMetadata } from '../services/analytics';
import { useRiversideAnalytics } from '../services/riverisideAnalytics';
import { useFallbackAnalytics, detectMuxBlocking } from '../services/fallbackAnalytics';
import StreamHealthIndicator from './StreamHealthIndicator';
import type { LiveStatus } from '../getLiveStatus';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Generate unique viewer session ID for analytics
const generateViewerId = () => {
  return `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export default function LivePlayer() {
  const [viewerId] = useState(() => generateViewerId());
  const [deviceType, setDeviceType] = useState<string>('unknown');
  const [sessionStartTime] = useState(() => Date.now());
  const [isWatching, setIsWatching] = useState(false);
  const [playerId] = useState(() => `p3-live-player-${viewerId}`);
  const [showHealthIndicator, setShowHealthIndicator] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Get current user information for analytics
  const { session, profile } = useAuth();
  const analytics = useMuxAnalytics();
  const riversideAnalytics = useRiversideAnalytics();
  const fallbackAnalytics = useFallbackAnalytics();
  const userContext = createUserContext(session, profile);
  const [isMuxBlocked, setIsMuxBlocked] = useState(false);

  const { data, error, isLoading } = useSWR<LiveStatus>(
    '/api/mux/live',
    fetcher,
    { 
      refreshInterval: 3_000, // Poll every 3 seconds for faster detection
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // Detect device type and Mux blocking status
  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent;
      const width = window.innerWidth;
      
      if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        setDeviceType(width < 768 ? 'mobile' : 'tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    // Check if Mux beacons are being blocked
    detectMuxBlocking().then(isBlocked => {
      setIsMuxBlocked(isBlocked);
    });

    detectDevice();
    window.addEventListener('resize', detectDevice);
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  // Track when user starts/stops watching live stream
  useEffect(() => {
    if (data?.isLive && !isWatching) {
      setIsWatching(true);
      analytics.trackWatchStart(userContext);
    } else if (!data?.isLive && isWatching) {
      setIsWatching(false);
      analytics.trackWatchEnd(userContext);
    }
  }, [data?.isLive, isWatching, analytics, userContext]);

  // Track page visibility changes (user switching tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      analytics.trackVisibilityChange(isVisible, userContext);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [analytics, userContext]);

  // Auto-hide controls on mobile
  useEffect(() => {
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    setShowControls(true);
    
    // Only auto-hide on mobile when playing
    if (deviceType === 'mobile' && isPlaying) {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      setControlsTimeout(timeout);
    }

    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [isPlaying, deviceType]);

  // Show controls on user interaction
  const handleUserInteraction = () => {
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    setShowControls(true);
    
    if (deviceType === 'mobile' && isPlaying) {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      setControlsTimeout(timeout);
    }
  };

  // Cleanup analytics when component unmounts
  useEffect(() => {
    return () => {
      if (isWatching) {
        analytics.trackWatchEnd(userContext);
      }
      
      // Stop quality monitoring and track summary
      const healthSummary = riversideAnalytics.getStreamHealthSummary();
      if (healthSummary.totalChecks > 0) {
        const healthEventData = {
          average_buffer_health: healthSummary.averageQuality?.bufferHealth,
          total_dropped_frames: healthSummary.averageQuality?.droppedFrames,
          issues: healthSummary.issues,
          total_quality_checks: healthSummary.totalChecks,
          playback_id: data?.playbackId,
          user_id: userContext.userId,
          device_type: deviceType,
          user_role: userContext.role
        };

        analytics.trackCustomEvent('stream_health_summary', healthEventData, userContext);
        
        // Use fallback analytics if Mux is blocked
        if (isMuxBlocked) {
          fallbackAnalytics.trackEvent('stream_health_summary', healthEventData);
        }
      }
      
      riversideAnalytics.stopQualityMonitoring();
      riversideAnalytics.reset();
      
      // Cleanup fallback analytics
      if (isMuxBlocked) {
        fallbackAnalytics.cleanup();
      }
    };
  }, [analytics, userContext, isWatching, riversideAnalytics, fallbackAnalytics, isMuxBlocked, data?.playbackId, deviceType]);

  if (isLoading) {
    return (
      <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/20 border-t-white mx-auto mb-4"></div>
          <p className="text-white/70 text-sm">Connecting to live stream...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center">
        <div className="text-center text-white px-6">
          <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="font-medium text-xl mb-3">Stream Unavailable</p>
          <p className="text-white/70 text-sm mb-6 max-w-sm mx-auto">Unable to connect to the live stream</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors backdrop-blur-sm border border-white/10"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!data?.isLive) {
    return (
      <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center">
        <div className="text-center text-white px-6">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-12 h-12 text-white/40" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <h3 className="text-2xl font-light mb-4">Going Live Soon</h3>
          <p className="text-white/60 text-sm leading-relaxed max-w-sm mx-auto mb-8">
            Stream will start automatically when we go live
          </p>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
            <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  // Mux Data custom options to prevent ad blocker issues
  const muxDataOptions = {
    // Use custom beacon collection domain if configured
    beaconCollectionDomain: process.env.NEXT_PUBLIC_MUX_BEACON_DOMAIN,
    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',
    // Disable cookies for privacy compliance
    disableCookies: true
  };

  // Enhanced player metadata using the utility function
  const baseMetadata = createEnhancedMuxMetadata(
    userContext,
    sessionStartTime,
    viewerId,
    deviceType,
    data.isLive
  );

  // Add Mux Data options to metadata
  const playerMetadata = {
    ...baseMetadata,
    // Add beacon collection domain to prevent ad blocker issues
    ...(muxDataOptions.beaconCollectionDomain && {
      beacon_collection_domain: muxDataOptions.beaconCollectionDomain
    }),
    // Add privacy settings
    disable_cookies: muxDataOptions.disableCookies
  };

  // Player event handlers for enhanced analytics
  const handlePlayerReady = (event: any) => {
    const player = event.target;
    analytics.setPlayer(player, playerId);
    
    analytics.trackCustomEvent('player_ready', { 
      playback_id: data.playbackId,
      custom_domain_configured: !!muxDataOptions.beaconCollectionDomain
    }, userContext);
    
    // Initialize Riverside stream metrics
    riversideAnalytics.initializeStreamMetrics({
      sourceBitrate: 2500000,
      sourceResolution: "1920x1080", 
      audioCodec: "aac",
      videoCodec: "h264"
    });
    
    // Start quality monitoring
    riversideAnalytics.startQualityMonitoring(player);
  };

  const handlePlay = () => {
    const eventData = {
      stream_type: 'live',
      playback_id: data.playbackId,
      user_id: userContext.userId,
      device_type: deviceType,
      user_role: userContext.role
    };

    analytics.trackCustomEvent('play_initiated', eventData, userContext);
    
    // Use fallback analytics if Mux is blocked
    if (isMuxBlocked) {
      fallbackAnalytics.trackEvent('play_initiated', eventData);
    }
    
    // Optional: Show health indicator for admin users only
    if (userContext.role === 'admin') {
      setShowHealthIndicator(true);
    }
  };

  const handlePause = () => {
    analytics.trackPlayerInteraction('pause', userContext);
  };

  const handleLoadStart = () => {
    analytics.trackCustomEvent('load_start', { 
      timestamp: Date.now(),
      playback_id: data.playbackId 
    }, userContext);
  };

  const handleWaiting = () => {
    analytics.trackCustomEvent('buffering_start', { 
      timestamp: Date.now() 
    }, userContext);
  };

  const handleCanPlay = () => {
    analytics.trackCustomEvent('can_play', { 
      timestamp: Date.now() 
    }, userContext);
  };

  return (
    <div 
      id={`player-container-${playerId}`}
      className="w-full h-full relative bg-black flex flex-col overflow-hidden md:rounded-lg"
      onClick={handleUserInteraction}
      onTouchStart={handleUserInteraction}
    >
      {/* Video container - full height on mobile, aspect ratio on desktop */}
      <div className="relative flex-1 md:aspect-video md:flex-none overflow-hidden">
        <MuxPlayer
          streamType="live"
          playbackId={data.playbackId}
          autoPlay
          muted={false}
          className="w-full h-full"
          envKey={process.env.NEXT_PUBLIC_MUX_ENV_KEY}
          metadata={playerMetadata}
          onLoadedData={handlePlayerReady}
          onPlay={() => {
            handlePlay();
            setIsPlaying(true);
          }}
          onPause={() => {
            handlePause();
            setIsPlaying(false);
          }}
          onVolumeChange={(e: any) => {
            setIsMuted(e.target.muted);
          }}
          onLoadStart={handleLoadStart}
          onWaiting={handleWaiting}
          onCanPlay={handleCanPlay}
          preload="metadata"
          crossOrigin="anonymous"
          title="P3 Live Stream"
          aria-label="Live video stream"
          nohotkeys={false}
          style={{
            '--media-object-fit': 'cover',
            '--media-object-position': 'center',
            '--controls': 'none',
          } as React.CSSProperties}
        />
        
        {/* Overlay controls that appear on interaction */}
        <div 
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Play/Pause button overlay */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const player = document.querySelector('mux-player');
              if (player) {
                // @ts-ignore
                player.paused ? player.play() : player.pause();
              }
            }}
            className="w-16 h-16 md:w-20 md:h-20 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center transition-all touch-manipulation"
            aria-label="Play/Pause"
          >
            {isPlaying ? (
              <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
        </div>
        
        {/* Bottom controls bar */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              {/* Left - Live indicator */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-red-600/90 backdrop-blur-sm px-2 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white text-xs font-medium">LIVE</span>
                </div>
              </div>
              
              {/* Right controls */}
              <div className="flex items-center space-x-3">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const player = document.querySelector('mux-player');
                    if (player) {
                      // @ts-ignore
                      player.muted = !player.muted;
                      setIsMuted(!isMuted);
                    }
                  }}
                  className="w-10 h-10 md:w-12 md:h-12 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors touch-manipulation"
                  aria-label="Mute/Unmute"
                >
                  {isMuted ? (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  )}
                </button>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const container = document.getElementById(`player-container-${playerId}`) as HTMLElement;
                    
                    if (container) {
                      try {
                        // @ts-ignore
                        if (container.requestFullscreen) {
                          // @ts-ignore
                          container.requestFullscreen();
                        // @ts-ignore  
                        } else if (container.webkitRequestFullscreen) {
                          // @ts-ignore
                          container.webkitRequestFullscreen();
                        // @ts-ignore
                        } else if (container.msRequestFullscreen) {
                          // @ts-ignore
                          container.msRequestFullscreen();
                        }
                      } catch (error) {
                        console.warn('Fullscreen not supported or failed:', error);
                      }
                    }
                  }}
                  className="w-10 h-10 md:w-12 md:h-12 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors touch-manipulation"
                  aria-label="Fullscreen"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Admin diagnostics - positioned absolutely */}
      {userContext.role === 'admin' && (
        <>
          <StreamHealthIndicator isVisible={showHealthIndicator} />
          <button
            onClick={() => setShowHealthIndicator(!showHealthIndicator)}
            className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white/70 p-2 rounded-full w-8 h-8 flex items-center justify-center text-xs transition-all opacity-50 hover:opacity-100"
            title="Toggle diagnostics"
          >
            ⚡
          </button>
        </>
      )}
    </div>
  );
} 