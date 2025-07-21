// src/features/purelighttv/services/pureLightTVSyncService.ts

import type { ProcessedPureLightTVVideo } from '../types'
import { PureLightTVService } from './pureLightTVService'

/**
 * Service for syncing PureLightTV videos with the main video library
 * Enables full analytics tracking for showcase videos
 */
export class PureLightTVSyncService {
  
  /**
   * Sync PureLightTV videos to the main video library
   */
  static async syncToVideoLibrary(): Promise<{
    added: number;
    updated: number;
    errors: string[];
  }> {
    try {
      // Get all PureLightTV videos
      const response = await PureLightTVService.getVideos(1, 50); // Get up to 50 videos
      const videos = response.data.map(video => PureLightTVService.processVideo(video));
      
      const result = {
        added: 0,
        updated: 0,
        errors: [] as string[]
      };

      // Process each video
      for (const video of videos) {
        try {
          const syncResult = await this.syncSingleVideo(video);
          if (syncResult.action === 'added') result.added++;
          if (syncResult.action === 'updated') result.updated++;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          result.errors.push(`Failed to sync video ${video.title}: ${errorMessage}`);
        }
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to sync PureLightTV videos: ${errorMessage}`);
    }
  }

  /**
   * Sync a single video to the library
   */
  private static async syncSingleVideo(video: ProcessedPureLightTVVideo): Promise<{
    action: 'added' | 'updated' | 'skipped';
    videoFileId?: string;
  }> {
    const response = await fetch('/api/admin/video-library/sync-purelighttv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vimeoId: video.id,
        title: video.title,
        description: video.description,
        duration: video.duration,
        createdAt: video.createdAt,
        thumbnailUrl: video.thumbnailUrl,
        tags: video.tags
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Get PureLightTV category ID (create if doesn't exist)
   */
  static async getPureLightTVCategory(): Promise<string> {
    const response = await fetch('/api/admin/video-library/categories/purelighttv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'PureLightTV',
        description: 'Videos from the PureLightTV showcase'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get/create PureLightTV category: ${response.status}`);
    }

    const data = await response.json();
    return data.categoryId;
  }

  /**
   * Schedule automatic sync (daily)
   */
  static async scheduleAutoSync(): Promise<void> {
    const response = await fetch('/api/admin/cron/schedule-purelighttv-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to schedule auto-sync: ${response.status}`);
    }
  }
}