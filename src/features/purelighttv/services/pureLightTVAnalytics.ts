// src/features/purelighttv/services/pureLightTVAnalytics.ts

import type { ProcessedPureLightTVVideo } from '../types'

interface PureLightTVWatchEvent {
  type: 'play' | 'pause' | 'seek' | 'complete' | 'progress'
  timestamp: number
  position: number
  videoId: string
  videoTitle: string
  metadata?: Record<string, any>
}

/**
 * Analytics service for PureLightTV videos
 * Tracks watch progress without requiring videos to be in the main library
 */
export class PureLightTVAnalytics {
  
  /**
   * Save watch progress for a PureLightTV video
   */
  static async saveProgress(
    video: ProcessedPureLightTVVideo,
    position: number,
    events: PureLightTVWatchEvent[] = []
  ): Promise<void> {
    try {
      const response = await fetch('/api/purelighttv/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save',
          vimeoId: video.id,
          videoTitle: video.title,
          videoDuration: video.duration,
          currentPosition: position,
          events,
          deviceType: this.getDeviceType(),
          userAgent: navigator.userAgent
        })
      });

      if (!response.ok) {
        console.error('Failed to save PureLightTV progress:', response.status);
      }
    } catch (error) {
      console.error('Error saving PureLightTV progress:', error);
    }
  }

  /**
   * Get watch progress for a PureLightTV video
   */
  static async getProgress(video: ProcessedPureLightTVVideo): Promise<{
    position: number;
    percentComplete: number;
    completed: boolean;
  }> {
    try {
      const response = await fetch('/api/purelighttv/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get',
          vimeoId: video.id
        })
      });

      if (!response.ok) {
        console.error('Failed to get PureLightTV progress:', response.status);
        return { position: 0, percentComplete: 0, completed: false };
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting PureLightTV progress:', error);
      return { position: 0, percentComplete: 0, completed: false };
    }
  }

  /**
   * Track video event
   */
  static async trackEvent(
    video: ProcessedPureLightTVVideo,
    type: PureLightTVWatchEvent['type'],
    position: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const event: PureLightTVWatchEvent = {
      type,
      timestamp: Date.now(),
      position,
      videoId: video.id,
      videoTitle: video.title,
      metadata
    };

    // For now, we'll save progress with the event
    // In the future, you could send events to a separate analytics endpoint
    await this.saveProgress(video, position, [event]);
  }

  /**
   * Mark video as completed
   */
  static async markCompleted(video: ProcessedPureLightTVVideo): Promise<void> {
    await this.trackEvent(video, 'complete', video.duration, {
      completedAt: new Date().toISOString()
    });
  }

  /**
   * Get device type for analytics
   */
  private static getDeviceType(): string {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }
}