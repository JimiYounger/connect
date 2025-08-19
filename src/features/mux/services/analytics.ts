// Mux Data Analytics Service
// Provides utilities for tracking custom events and user engagement
// Compatible with Mux Data v10+ metrics and events

interface UserContext {
  userId?: string;
  email?: string;
  role?: string;
  team?: string;
  area?: string;
  region?: string;
  isAuthenticated: boolean;
}

interface _MuxCustomData {
  custom_1?: string;
  custom_2?: string;
  custom_3?: string;
  custom_4?: string;
  custom_5?: string;
  custom_6?: string;
  custom_7?: string;
  custom_8?: string;
  custom_9?: string;
  custom_10?: string;
}

interface _CustomEventData {
  event_name: string;
  event_data?: Record<string, any>;
  user_context?: UserContext;
}

export class MuxAnalytics {
  private static instance: MuxAnalytics;
  private sessionStartTime: number;
  private watchStartTime: number | null = null;
  private engagementEvents: Array<{ event: string; timestamp: number }> = [];
  private playerRef: any = null; // Reference to Mux player for direct event emission
  private playerId: string | null = null;

  private constructor() {
    this.sessionStartTime = Date.now();
  }

  static getInstance(): MuxAnalytics {
    if (!MuxAnalytics.instance) {
      MuxAnalytics.instance = new MuxAnalytics();
    }
    return MuxAnalytics.instance;
  }

  // Set the Mux player reference for direct event emission
  setPlayer(player: any, playerId: string): void {
    this.playerRef = player;
    this.playerId = playerId;
  }

  // Track when user starts watching
  trackWatchStart(_userContext?: UserContext): void {
    this.watchStartTime = Date.now();
    this.logEngagementEvent('watch_start');
  }

  // Track when user stops watching
  trackWatchEnd(_userContext?: UserContext): number {
    const watchDuration = this.watchStartTime ? Date.now() - this.watchStartTime : 0;
    this.logEngagementEvent('watch_end');
    this.watchStartTime = null;
    return watchDuration;
  }

  // Track page visibility changes (user switching tabs)
  trackVisibilityChange(isVisible: boolean, _userContext?: UserContext): void {
    const event = isVisible ? 'page_visible' : 'page_hidden';
    this.logEngagementEvent(event);
  }

  // Track custom user actions with Mux Data integration
  trackCustomEvent(eventName: string, eventData?: Record<string, any>, userContext?: UserContext): void {
    this.logEngagementEvent(eventName);
    
    // Emit event directly to Mux if player is available
    if (this.playerRef && this.playerId && typeof window !== 'undefined' && (window as any).mux) {
      try {
        (window as any).mux.emit(this.playerId, 'customevent', {
          event_name: eventName,
          event_data: eventData,
          user_id: userContext?.userId,
          user_email: userContext?.email,
          user_role: userContext?.role
        });
      } catch (_error) {
        // Silently handle Mux emission errors in production
        this.logEngagementEvent(`${eventName}_mux_failed`);
      }
    }
  }

  // Check if Mux Data is properly initialized and not blocked
  isMuxDataAvailable(): boolean {
    return !!(typeof window !== 'undefined' && 
             (window as any).mux && 
             this.playerRef && 
             this.playerId);
  }

  // Get Mux Data collection status
  getMuxStatus(): { available: boolean; customDomain: boolean; playerId?: string } {
    return {
      available: this.isMuxDataAvailable(),
      customDomain: !!process.env.NEXT_PUBLIC_MUX_BEACON_DOMAIN,
      playerId: this.playerId || undefined
    };
  }

  // Track live stream quality changes
  trackQualityChange(newQuality: string, userContext?: UserContext): void {
    this.trackCustomEvent('quality_change', { quality: newQuality }, userContext);
  }

  // Track buffering events
  trackBuffering(duration: number, userContext?: UserContext): void {
    this.trackCustomEvent('buffering', { duration_ms: duration }, userContext);
  }

  // Track user interaction with player controls
  trackPlayerInteraction(action: string, userContext?: UserContext): void {
    this.trackCustomEvent('player_interaction', { action }, userContext);
  }

  // Get engagement summary
  getEngagementSummary(): {
    sessionDuration: number;
    watchDuration: number;
    eventsCount: number;
    events: Array<{ event: string; timestamp: number }>;
  } {
    return {
      sessionDuration: Date.now() - this.sessionStartTime,
      watchDuration: this.watchStartTime ? Date.now() - this.watchStartTime : 0,
      eventsCount: this.engagementEvents.length,
      events: [...this.engagementEvents]
    };
  }

  private logEngagementEvent(event: string): void {
    this.engagementEvents.push({
      event,
      timestamp: Date.now()
    });

    // Keep only last 50 events to prevent memory bloat
    if (this.engagementEvents.length > 50) {
      this.engagementEvents = this.engagementEvents.slice(-50);
    }
  }
}

// Hook for easy React integration
export function useMuxAnalytics() {
  return MuxAnalytics.getInstance();
}

// Utility to create user context from auth data
export function createUserContext(session: any, profile: any): UserContext {
  return {
    userId: session?.user?.id,
    email: profile?.email,
    role: profile?.role,
    team: profile?.team,
    area: profile?.area,
    region: profile?.region,
    isAuthenticated: !!session
  };
}

// Create enhanced Mux metadata with proper structure for v10+ compatibility
export function createEnhancedMuxMetadata(
  userContext: UserContext,
  sessionStartTime: number,
  viewerId: string,
  deviceType: string,
  isLive: boolean
): Record<string, any> {
  return {
    // Core video metadata  
    video_title: "P3 Live Stream",
    video_id: `p3-live-${new Date().toISOString().split('T')[0]}`,
    video_stream_type: "live",
    video_content_type: "live_stream",
    video_series: "P3 Live Sessions",
    
    // Player and session metadata
    player_name: "P3 Live Player",
    player_init_time: sessionStartTime,
    viewer_user_id: viewerId,
    
    // User identification and authentication
    viewer_user_email: userContext.isAuthenticated && userContext.email ? userContext.email : undefined,
    viewer_user_name: userContext.isAuthenticated && userContext.email ? `${userContext.role}` : undefined,
    viewer_session_id: userContext.userId || viewerId,
    
    // Experiment and feature tracking
    experiment_name: "p3_live_riverside_integration",
    sub_property_id: "p3_live",
    
    // Enhanced custom dimensions with user data (Mux Data v10+ compatible)
    custom_1: "p3_live_stream",                                    // Stream type
    custom_2: deviceType,                                          // Device category  
    custom_3: "hls_live",                                          // Streaming protocol
    custom_4: isLive ? "live" : "offline",                        // Current status
    custom_5: new Date().getHours().toString(),                   // Hour of day
    custom_6: userContext.isAuthenticated ? "authenticated" : "anonymous", // Auth status
    custom_7: userContext.role || "unknown",                      // User role
    custom_8: userContext.team || "unknown",                      // User team
    custom_9: userContext.area || "unknown",                      // User area/department
    custom_10: userContext.region || "unknown",                   // User region
  };
} 