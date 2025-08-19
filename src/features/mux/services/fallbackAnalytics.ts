// Fallback Analytics for when Mux Data beacons are blocked
// Sends analytics data to your own API endpoint

interface FallbackEventData {
  event_type: string;
  timestamp: number;
  session_id: string;
  user_id?: string;
  playback_id: string;
  metadata?: Record<string, any>;
  custom_data?: Record<string, any>;
}

export class FallbackAnalytics {
  private static instance: FallbackAnalytics;
  private eventQueue: FallbackEventData[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private sessionId: string;

  private constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.startFlushInterval();
  }

  static getInstance(): FallbackAnalytics {
    if (!FallbackAnalytics.instance) {
      FallbackAnalytics.instance = new FallbackAnalytics();
    }
    return FallbackAnalytics.instance;
  }

  // Track event with fallback to your own API
  trackEvent(eventType: string, data: Record<string, any>): void {
    const event: FallbackEventData = {
      event_type: eventType,
      timestamp: Date.now(),
      session_id: this.sessionId,
      user_id: data.user_id,
      playback_id: data.playback_id || 'unknown',
      metadata: {
        device_type: data.device_type,
        user_role: data.user_role,
        stream_type: data.stream_type
      },
      custom_data: data
    };

    this.eventQueue.push(event);

    // If queue gets too large, flush immediately
    if (this.eventQueue.length >= 10) {
      this.flushEvents();
    }
  }

  // Send queued events to your API endpoint
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch('/api/analytics/fallback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: eventsToFlush,
          source: 'fallback_analytics'
        })
      });

      if (!response.ok) {
        // Silently handle failed analytics requests
      }
    } catch (_error) {
      // Silently handle analytics errors
    }
  }

  // Start periodic flushing
  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flushEvents();
    }, 15000); // Flush every 15 seconds
  }

  // Stop analytics and flush remaining events
  cleanup(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flushEvents();
  }
}

// Check if Mux beacons are being blocked
export function detectMuxBlocking(): Promise<boolean> {
  return new Promise((resolve) => {
    const testUrl = 'https://litix.io/test';
    const img = new Image();
    
    const timeout = setTimeout(() => {
      resolve(true); // Assume blocked if no response in 3 seconds
    }, 3000);

    img.onload = () => {
      clearTimeout(timeout);
      resolve(false); // Not blocked
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve(true); // Blocked
    };

    img.src = testUrl;
  });
}

// Hook for React integration
export function useFallbackAnalytics() {
  return FallbackAnalytics.getInstance();
}