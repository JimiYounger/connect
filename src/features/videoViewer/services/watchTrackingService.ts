// src/features/videoViewer/services/watchTrackingService.ts

import { createClient } from '@/lib/supabase'
import type { VideoWatchProgress, VideoWatchEvent, UpdateWatchProgressParams } from '../types'

/**
 * Watch Tracking Service
 * 
 * Handles video watch progress, analytics, and resume functionality
 * Uses the existing video_watches table structure
 */
export class WatchTrackingService {
  
  /**
   * Get user's watch progress for a specific video
   */
  static async getWatchProgress(
    videoFileId: string,
    userId: string
  ): Promise<VideoWatchProgress | null> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('video_watches')
        .select('*')
        .eq('video_file_id', videoFileId)
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching watch progress:', error)
        return null
      }

      if (!data) return null

      // Transform snake_case to camelCase
      return {
        videoFileId: data.video_file_id,
        userId: data.user_id,
        watchedSeconds: data.watched_seconds || 0,
        totalDuration: data.total_duration || 0,
        percentComplete: data.percent_complete || 0,
        lastPosition: data.last_position || 0,
        completed: data.completed || false,
        completedAt: data.completed_at || undefined,
        events: (data.events as unknown as VideoWatchEvent[]) || [],
        deviceType: data.device_type || undefined,
        userAgent: data.user_agent || undefined,
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || new Date().toISOString()
      }
    } catch (error) {
      console.error('Error in getWatchProgress:', error)
      return null
    }
  }

  /**
   * Update watch progress with new position and analytics
   */
  static async updateWatchProgress(
    params: UpdateWatchProgressParams
  ): Promise<VideoWatchProgress | null> {
    try {
      const supabase = createClient()
      const {
        videoFileId,
        userId,
        currentPosition,
        totalDuration,
        events = [],
        deviceType,
        userAgent
      } = params

      // Skip expensive existing record fetch if we only have simple events
      const simpleEventTypes = ['play', 'pause', 'seek']
      const hasOnlySimpleEvents = events.every(e => simpleEventTypes.includes(e.type))
      
      let existing = null
      let watchedSeconds = currentPosition
      
      // Only fetch existing record if we need to merge complex data
      if (!hasOnlySimpleEvents || events.length === 0) {
        existing = await this.getWatchProgress(videoFileId, userId)
        watchedSeconds = existing ? Math.max(currentPosition, existing.watchedSeconds) : currentPosition
      }
      
      const percentComplete = totalDuration > 0 ? (watchedSeconds / totalDuration) * 100 : 0
      const isCompleted = percentComplete >= 90

      // Simplified event handling - only keep last 50 events for performance
      const existingEvents = existing?.events || []
      const allEvents = [...(existingEvents.slice(-40)), ...events].slice(-50)

      const updateData = {
        video_file_id: videoFileId,
        user_id: userId,
        watched_seconds: watchedSeconds,
        total_duration: totalDuration,
        percent_complete: percentComplete,
        last_position: currentPosition,
        completed: isCompleted,
        completed_at: isCompleted && !existing?.completed ? new Date().toISOString() : existing?.completedAt,
        events: allEvents as any,
        device_type: deviceType || existing?.deviceType,
        user_agent: userAgent || existing?.userAgent,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('video_watches')
        .upsert(updateData, {
          onConflict: 'video_file_id,user_id'
        })
        .select()
        .single()

      if (error) {
        console.error('Error updating watch progress:', error)
        return null
      }

      if (!data) return null

      // Transform snake_case to camelCase
      return {
        videoFileId: data.video_file_id,
        userId: data.user_id,
        watchedSeconds: data.watched_seconds || 0,
        totalDuration: data.total_duration || 0,
        percentComplete: data.percent_complete || 0,
        lastPosition: data.last_position || 0,
        completed: data.completed || false,
        completedAt: data.completed_at || undefined,
        events: (data.events as unknown as VideoWatchEvent[]) || [],
        deviceType: data.device_type || undefined,
        userAgent: data.user_agent || undefined,
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || new Date().toISOString()
      }
    } catch (error) {
      console.error('Error in updateWatchProgress:', error)
      return null
    }
  }

  /**
   * Record a specific watch event (play, pause, seek, etc.)
   */
  static async recordWatchEvent(
    videoFileId: string,
    userId: string,
    event: VideoWatchEvent
  ): Promise<void> {
    try {
      const existing = await this.getWatchProgress(videoFileId, userId)
      
      if (existing) {
        await this.updateWatchProgress({
          videoFileId,
          userId,
          currentPosition: event.position,
          totalDuration: existing.totalDuration,
          events: [event]
        })
      }
    } catch (error) {
      console.error('Error recording watch event:', error)
    }
  }

  /**
   * Get watch progress for multiple videos for a user
   */
  static async getUserWatchHistory(
    userId: string,
    videoIds?: string[]
  ): Promise<VideoWatchProgress[]> {
    try {
      const supabase = createClient()
      
      let query = supabase
        .from('video_watches')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (videoIds && videoIds.length > 0) {
        query = query.in('video_file_id', videoIds)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching watch history:', error)
        return []
      }

      // Transform snake_case to camelCase for each record
      return (data || []).map(item => ({
        videoFileId: item.video_file_id,
        userId: item.user_id,
        watchedSeconds: item.watched_seconds || 0,
        totalDuration: item.total_duration || 0,
        percentComplete: item.percent_complete || 0,
        lastPosition: item.last_position || 0,
        completed: item.completed || false,
        completedAt: item.completed_at || undefined,
        events: (item.events as unknown as VideoWatchEvent[]) || [],
        deviceType: item.device_type || undefined,
        userAgent: item.user_agent || undefined,
        createdAt: item.created_at || new Date().toISOString(),
        updatedAt: item.updated_at || new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error in getUserWatchHistory:', error)
      return []
    }
  }

  /**
   * Get analytics data for a specific video
   */
  static async getVideoAnalytics(
    videoFileId: string
  ): Promise<{
    totalViews: number
    totalWatchTime: number
    averageWatchTime: number
    completionRate: number
    uniqueViewers: number
  }> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('video_watches')
        .select('watched_seconds, completed, user_id')
        .eq('video_file_id', videoFileId)

      if (error) {
        console.error('Error fetching video analytics:', error)
        return {
          totalViews: 0,
          totalWatchTime: 0,
          averageWatchTime: 0,
          completionRate: 0,
          uniqueViewers: 0
        }
      }

      const watches = data || []
      const totalViews = watches.length
      const uniqueViewers = new Set(watches.map(w => w.user_id)).size
      const totalWatchTime = watches.reduce((sum, w) => sum + (w.watched_seconds || 0), 0)
      const completedCount = watches.filter(w => w.completed).length
      
      return {
        totalViews,
        totalWatchTime,
        averageWatchTime: totalViews > 0 ? totalWatchTime / totalViews : 0,
        completionRate: totalViews > 0 ? (completedCount / totalViews) * 100 : 0,
        uniqueViewers
      }
    } catch (error) {
      console.error('Error in getVideoAnalytics:', error)
      return {
        totalViews: 0,
        totalWatchTime: 0,
        averageWatchTime: 0,
        completionRate: 0,
        uniqueViewers: 0
      }
    }
  }

  /**
   * Mark a video as completed manually
   */
  static async markAsCompleted(
    videoFileId: string,
    userId: string
  ): Promise<VideoWatchProgress | null> {
    try {
      const existing = await this.getWatchProgress(videoFileId, userId)
      
      if (!existing) {
        return null
      }

      return await this.updateWatchProgress({
        videoFileId,
        userId,
        currentPosition: existing.totalDuration || existing.lastPosition,
        totalDuration: existing.totalDuration,
        events: [{
          type: 'complete',
          timestamp: Date.now(),
          position: existing.totalDuration || existing.lastPosition,
          metadata: { manual: true }
        }]
      })
    } catch (error) {
      console.error('Error marking video as completed:', error)
      return null
    }
  }

  /**
   * Reset watch progress for a video
   */
  static async resetProgress(
    videoFileId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('video_watches')
        .delete()
        .eq('video_file_id', videoFileId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error resetting watch progress:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in resetProgress:', error)
      return false
    }
  }
}