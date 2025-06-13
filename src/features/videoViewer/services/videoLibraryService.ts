// src/features/videoViewer/services/videoLibraryService.ts

import { createClient } from '@/lib/supabase'
import type { UserPermissions } from '@/features/permissions/types'
import type { VideoForViewing, VideoRoleAssignments } from '../types'
import { VideoPermissionService } from './permissionService'

/**
 * Video Library Service for User Viewing
 * 
 * Fetches videos that users can view based on their permissions
 * Separate from admin video management
 */
export class VideoLibraryService {
  
  /**
   * Get all videos accessible to the user
   */
  static async getUserAccessibleVideos(
    userPermissions: UserPermissions,
    options: {
      categoryId?: string
      subcategoryId?: string
      seriesId?: string
      searchQuery?: string
      limit?: number
      offset?: number
      tags?: string[]
    } = {}
  ): Promise<{
    videos: VideoForViewing[]
    total: number
    hasMore: boolean
  }> {
    try {
      const supabase = createClient()
      const {
        categoryId,
        subcategoryId,
        seriesId,
        searchQuery,
        limit = 20,
        offset = 0,
        tags
      } = options

      // Build query for approved videos only
      let query = supabase
        .from('video_files')
        .select(`
          id,
          title,
          description,
          vimeo_id,
          vimeo_duration,
          vimeo_thumbnail_url,
          custom_thumbnail_url,
          thumbnail_source,
          library_status,
          public_sharing_enabled,
          visibility_conditions,
          created_at,
          updated_at,
          video_categories:video_category_id (
            id,
            name
          ),
          video_subcategories:video_subcategory_id (
            id,
            name
          ),
          video_series:video_series_id (
            id,
            name
          )
        `)
        .eq('library_status', 'approved') // Only approved videos for users
        .order('updated_at', { ascending: false })

      // Apply filters
      if (categoryId) {
        query = query.eq('video_category_id', categoryId)
      }
      
      if (subcategoryId) {
        query = query.eq('video_subcategory_id', subcategoryId)
      }
      
      if (seriesId) {
        query = query.eq('video_series_id', seriesId)
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching user videos:', error)
        return { videos: [], total: 0, hasMore: false }
      }

      // Transform and filter by permissions
      const videos = this.transformVideoData(data || [])
      const accessibleVideos = VideoPermissionService.filterViewableVideos(videos, userPermissions)

      // Filter by tags if specified (done client-side for now)
      let filteredVideos = accessibleVideos
      if (tags && tags.length > 0) {
        filteredVideos = accessibleVideos.filter(video =>
          video.tags?.some(tag => tags.includes(tag))
        )
      }

      return {
        videos: filteredVideos,
        total: count || 0,
        hasMore: offset + limit < (count || 0)
      }
    } catch (error) {
      console.error('Error in getUserAccessibleVideos:', error)
      return { videos: [], total: 0, hasMore: false }
    }
  }

  /**
   * Get a specific video if user has access
   */
  static async getVideoForUser(
    videoId: string,
    userPermissions: UserPermissions
  ): Promise<VideoForViewing | null> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('video_files')
        .select(`
          id,
          title,
          description,
          vimeo_id,
          vimeo_duration,
          vimeo_thumbnail_url,
          custom_thumbnail_url,
          thumbnail_source,
          library_status,
          public_sharing_enabled,
          visibility_conditions,
          created_at,
          updated_at,
          video_categories:video_category_id (
            id,
            name
          ),
          video_subcategories:video_subcategory_id (
            id,
            name
          ),
          video_series:video_series_id (
            id,
            name
          )
        `)
        .eq('id', videoId)
        .single()

      if (error) {
        console.error('Error fetching video:', error)
        return null
      }

      const video = this.transformVideoData([data])[0]
      
      // Check if user can view this video
      const permissionResult = VideoPermissionService.checkVideoPermission(video, userPermissions)
      
      if (!permissionResult.canView) {
        return null
      }

      return video
    } catch (error) {
      console.error('Error in getVideoForUser:', error)
      return null
    }
  }

  /**
   * Get videos by category with permission filtering
   */
  static async getVideosByCategory(
    categoryId: string,
    userPermissions: UserPermissions,
    limit = 20
  ): Promise<VideoForViewing[]> {
    const result = await this.getUserAccessibleVideos(userPermissions, {
      categoryId,
      limit
    })
    return result.videos
  }

  /**
   * Get videos by series with permission filtering
   */
  static async getVideosBySeries(
    seriesId: string,
    userPermissions: UserPermissions
  ): Promise<VideoForViewing[]> {
    const result = await this.getUserAccessibleVideos(userPermissions, {
      seriesId,
      limit: 100 // Series videos should all be loaded
    })
    return result.videos
  }

  /**
   * Search videos with permission filtering
   */
  static async searchVideos(
    searchQuery: string,
    userPermissions: UserPermissions,
    options: {
      categoryId?: string
      tags?: string[]
      limit?: number
    } = {}
  ): Promise<VideoForViewing[]> {
    const result = await this.getUserAccessibleVideos(userPermissions, {
      searchQuery,
      ...options
    })
    return result.videos
  }

  /**
   * Get recently added videos for user
   */
  static async getRecentVideos(
    userPermissions: UserPermissions,
    limit = 10
  ): Promise<VideoForViewing[]> {
    const result = await this.getUserAccessibleVideos(userPermissions, {
      limit
    })
    return result.videos
  }

  /**
   * Transform raw video data to our interface
   */
  private static transformVideoData(rawData: any[]): VideoForViewing[] {
    return rawData.map((video: any) => ({
      id: video.id,
      title: video.title,
      description: video.description,
      vimeoId: video.vimeo_id,
      vimeoDuration: video.vimeo_duration,
      vimeoThumbnailUrl: video.vimeo_thumbnail_url,
      customThumbnailUrl: video.custom_thumbnail_url,
      thumbnailSource: video.thumbnail_source,
      category: video.video_categories ? {
        id: video.video_categories.id,
        name: video.video_categories.name
      } : undefined,
      subcategory: video.video_subcategories ? {
        id: video.video_subcategories.id,
        name: video.video_subcategories.name
      } : undefined,
      series: video.video_series ? {
        id: video.video_series.id,
        name: video.video_series.name
      } : undefined,
      tags: video.tags || [],
      libraryStatus: video.library_status,
      publicSharingEnabled: video.public_sharing_enabled,
      visibilityConditions: video.visibility_conditions as VideoRoleAssignments,
      createdAt: video.created_at,
      updatedAt: video.updated_at
    }))
  }
}