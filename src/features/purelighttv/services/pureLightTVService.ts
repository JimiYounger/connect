// src/features/purelighttv/services/pureLightTVService.ts

import type { PureLightTVResponse, PureLightTVVideo, ProcessedPureLightTVVideo } from '../types'

/**
 * Service for fetching and processing PureLightTV videos from Vimeo
 */
export class PureLightTVService {
  
  /**
   * Fetch videos from PureLightTV showcase
   */
  static async getVideos(page: number = 1, perPage: number = 10): Promise<PureLightTVResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    });

    const response = await fetch(`/api/vimeo/showcase/purelighttv?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch PureLightTV videos: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Process raw Vimeo video data for display
   */
  static processVideo(video: PureLightTVVideo): ProcessedPureLightTVVideo {
    const videoId = video.uri.split('/').pop() || '';
    
    // Get the best thumbnail
    const thumbnailUrl = video.pictures?.sizes
      ?.sort((a, b) => b.width - a.width)
      ?.[0]?.link;

    return {
      id: videoId,
      title: video.name,
      description: video.description || undefined,
      duration: video.duration,
      createdAt: video.created_time,
      modifiedAt: video.modified_time,
      releaseDate: video.release_time || undefined,
      thumbnailUrl,
      embedUrl: video.player_embed_url,
      embedHtml: video.embed?.html,
      playCount: video.stats?.plays,
      tags: video.tags?.map(tag => tag.name)
    };
  }

  /**
   * Get featured video (most recent) and previous videos
   */
  static async getFeaturedAndPreviousVideos(): Promise<{
    featuredVideo: ProcessedPureLightTVVideo | null;
    previousVideos: ProcessedPureLightTVVideo[];
  }> {
    const response = await this.getVideos(1, 4); // Get first 4 videos
    
    if (!response.data || response.data.length === 0) {
      return {
        featuredVideo: null,
        previousVideos: []
      };
    }

    const processedVideos = response.data.map(video => this.processVideo(video));
    
    return {
      featuredVideo: processedVideos[0] || null,
      previousVideos: processedVideos.slice(1, 4) // Videos 2-4
    };
  }

  /**
   * Format duration in minutes and seconds
   */
  static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Format date for display
   */
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}