// Enhanced Analytics for Riverside + Mux Integration
// Provides specific tracking for live streams from Riverside

interface RiversideStreamMetrics {
  streamKey?: string;
  ingestUrl?: string;
  sourceBitrate?: number;
  sourceResolution?: string;
  audioCodec?: string;
  videoCodec?: string;
}

interface StreamQualityMetrics {
  currentBitrate: number;
  currentResolution: string;
  bufferHealth: number;
  droppedFrames: number;
  bandwidth: number;
}

export class RiversideAnalytics {
  private static instance: RiversideAnalytics;
  private streamMetrics: RiversideStreamMetrics = {};
  private qualityChecks: StreamQualityMetrics[] = [];
  private qualityCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): RiversideAnalytics {
    if (!RiversideAnalytics.instance) {
      RiversideAnalytics.instance = new RiversideAnalytics();
    }
    return RiversideAnalytics.instance;
  }

  // Initialize stream metrics from Riverside
  initializeStreamMetrics(metrics: RiversideStreamMetrics): void {
    this.streamMetrics = metrics;
  }

  // Start monitoring stream quality
  startQualityMonitoring(playerRef: any): void {
    if (this.qualityCheckInterval) {
      clearInterval(this.qualityCheckInterval);
    }

    this.qualityCheckInterval = setInterval(() => {
      this.checkStreamQuality(playerRef);
    }, 5000); // Check every 5 seconds
  }

  // Stop quality monitoring
  stopQualityMonitoring(): void {
    if (this.qualityCheckInterval) {
      clearInterval(this.qualityCheckInterval);
      this.qualityCheckInterval = null;
    }
  }

  // Check current stream quality metrics
  private checkStreamQuality(playerRef: any): void {
    if (!playerRef) return;

    try {
      // Get quality metrics from Mux player
      const videoElement = playerRef.media;
      if (!videoElement) return;

      const quality: StreamQualityMetrics = {
        currentBitrate: this.estimateBitrate(videoElement),
        currentResolution: `${videoElement.videoWidth}x${videoElement.videoHeight}`,
        bufferHealth: this.getBufferHealth(videoElement),
        droppedFrames: this.getDroppedFrames(videoElement),
        bandwidth: this.estimateBandwidth()
      };

      this.qualityChecks.push(quality);

      // Keep only last 20 quality checks to prevent memory bloat
      if (this.qualityChecks.length > 20) {
        this.qualityChecks = this.qualityChecks.slice(-20);
      }

    } catch (_error) {
      // Silently handle quality check errors
    }
  }

  // Estimate current bitrate
  private estimateBitrate(videoElement: HTMLVideoElement): number {
    try {
      // This is an estimation - Mux player might expose this more directly
      const width = videoElement.videoWidth;
      const height = videoElement.videoHeight;
      const fps = 30; // Assume 30fps for live streams

      // Rough bitrate estimation based on resolution
      const pixelsPerSecond = width * height * fps;
      return Math.round(pixelsPerSecond * 0.1); // Very rough estimate
    } catch {
      return 0;
    }
  }

  // Get buffer health (0-1 scale)
  private getBufferHealth(videoElement: HTMLVideoElement): number {
    try {
      const buffered = videoElement.buffered;
      if (buffered.length === 0) return 0;

      const currentTime = videoElement.currentTime;
      const bufferEnd = buffered.end(buffered.length - 1);
      const bufferHealth = Math.min((bufferEnd - currentTime) / 10, 1); // 10 seconds = full health

      return Math.max(bufferHealth, 0);
    } catch {
      return 0;
    }
  }

  // Get dropped frames count
  private getDroppedFrames(videoElement: HTMLVideoElement): number {
    try {
      // Modern browsers expose this through getVideoPlaybackQuality
      const quality = (videoElement as any).getVideoPlaybackQuality?.();
      return quality?.droppedVideoFrames || 0;
    } catch {
      return 0;
    }
  }

  // Estimate bandwidth
  private estimateBandwidth(): number {
    try {
      // Use Network Information API if available
      const connection = (navigator as any).connection;
      if (connection) {
        return connection.downlink * 1000; // Convert to Kbps
      }
      return 0;
    } catch {
      return 0;
    }
  }

  // Get stream health summary
  getStreamHealthSummary(): {
    averageQuality: StreamQualityMetrics | null;
    issues: string[];
    totalChecks: number;
    sourceMetrics: RiversideStreamMetrics;
  } {
    if (this.qualityChecks.length === 0) {
      return {
        averageQuality: null,
        issues: [],
        totalChecks: 0,
        sourceMetrics: this.streamMetrics
      };
    }

    const avg = this.qualityChecks.reduce(
      (acc, curr) => ({
        currentBitrate: acc.currentBitrate + curr.currentBitrate,
        currentResolution: curr.currentResolution, // Use latest
        bufferHealth: acc.bufferHealth + curr.bufferHealth,
        droppedFrames: acc.droppedFrames + curr.droppedFrames,
        bandwidth: acc.bandwidth + curr.bandwidth
      }),
      { currentBitrate: 0, currentResolution: '', bufferHealth: 0, droppedFrames: 0, bandwidth: 0 }
    );

    const count = this.qualityChecks.length;
    const averageQuality: StreamQualityMetrics = {
      currentBitrate: avg.currentBitrate / count,
      currentResolution: avg.currentResolution,
      bufferHealth: avg.bufferHealth / count,
      droppedFrames: avg.droppedFrames / count,
      bandwidth: avg.bandwidth / count
    };

    // Identify issues
    const issues: string[] = [];
    if (averageQuality.bufferHealth < 0.5) issues.push('Low buffer health');
    if (averageQuality.droppedFrames > 5) issues.push('High dropped frame rate');
    if (averageQuality.bandwidth < 1000) issues.push('Low bandwidth detected');

    return {
      averageQuality,
      issues,
      totalChecks: count,
      sourceMetrics: this.streamMetrics
    };
  }

  // Reset metrics
  reset(): void {
    this.qualityChecks = [];
    this.streamMetrics = {};
    this.stopQualityMonitoring();
  }
}

// Hook for easy React integration
export function useRiversideAnalytics() {
  return RiversideAnalytics.getInstance();
}