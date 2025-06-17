// src/features/videoViewer/services/videoLibraryService.ts

import type { UserPermissions } from '@/features/permissions/types'
import type { VideoForViewing } from '../types'

export interface VideoCategory {
  id: string
  name: string
  subcategories: VideoSubcategory[]
}

export interface VideoSubcategory {
  id: string
  name: string
  thumbnailUrl?: string
  thumbnailColor?: string
  videoCount: number
}

/**
 * Video Library Service using Supabase data
 */
export class VideoLibraryService {
  
  /**
   * Get all categories with their subcategories and video counts
   */
  static async getCategoriesWithSubcategories(): Promise<VideoCategory[]> {
    // Use manual query
    return await this.getCategoriesManually()
  }

  /**
   * Get categories manually - Now uses protected API to get videos and builds categories
   */
  static async getCategoriesManually(): Promise<VideoCategory[]> {
    try {
      // Call our protected video list API to get all videos the user can access
      const response = await fetch('/api/video-library/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'API returned error')
      }

      const videos = data.data || []

      // Build categories from the filtered videos
      const categoryMap = new Map<string, {
        id: string
        name: string
        subcategories: Map<string, { id: string, name: string, count: number, thumbnailUrl?: string, thumbnailColor?: string }>
      }>()

      // Group videos by category and subcategory
      videos.forEach((video: any) => {
        if (video.category && video.subcategory) {
          // Get or create category
          if (!categoryMap.has(video.category.id)) {
            categoryMap.set(video.category.id, {
              id: video.category.id,
              name: video.category.name,
              subcategories: new Map()
            })
          }

          const category = categoryMap.get(video.category.id)!
          
          // Get or create subcategory
          if (!category.subcategories.has(video.subcategory.id)) {
            category.subcategories.set(video.subcategory.id, {
              id: video.subcategory.id,
              name: video.subcategory.name,
              count: 0,
              thumbnailUrl: video.subcategory.thumbnailUrl,
              thumbnailColor: video.subcategory.thumbnailColor
            })
          }

          // Increment count
          const subcategory = category.subcategories.get(video.subcategory.id)!
          subcategory.count++
        }
      })

      // Convert to the expected format
      const result: VideoCategory[] = Array.from(categoryMap.values()).map(category => ({
        id: category.id,
        name: category.name,
        subcategories: Array.from(category.subcategories.values()).map(sub => ({
          id: sub.id,
          name: sub.name,
          thumbnailUrl: sub.thumbnailUrl,
          thumbnailColor: sub.thumbnailColor,
          videoCount: sub.count
        }))
      }))

      return result
      
    } catch (err) {
      console.error('Error fetching categories:', err)
      return []
    }
  }

  /**
   * Get videos for a specific subcategory - Now uses protected API
   */
  static async getVideosForSubcategory(
    subcategoryId: string,
    _userPermissions: UserPermissions
  ): Promise<VideoForViewing[]> {
    try {
      // Call our protected video list API with subcategory filter
      const response = await fetch('/api/video-library/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_subcategory_id: subcategoryId
        })
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'API returned error')
      }

      const videos = data.data || []

      // Transform to VideoForViewing format
      const transformedVideos: VideoForViewing[] = videos.map((video: any) => ({
        id: video.id,
        title: video.title,
        description: video.description || undefined,
        vimeoId: video.vimeoId || undefined,
        vimeoDuration: video.vimeoDuration || undefined,
        vimeoThumbnailUrl: video.vimeoThumbnailUrl || undefined,
        customThumbnailUrl: video.customThumbnailUrl || undefined,
        thumbnailSource: video.thumbnailSource as 'vimeo' | 'upload' | 'url',
        category: video.category,
        subcategory: video.subcategory,
        libraryStatus: video.libraryStatus || 'pending',
        publicSharingEnabled: video.publicSharingEnabled || false,
        visibilityConditions: video.permissions || {
          roleTypes: [],
          teams: [],
          areas: [],
          regions: []
        },
        createdAt: video.createdAt || '',
        updatedAt: video.updatedAt || '',
        tags: video.tags || []
      }))

      return transformedVideos
    } catch (err) {
      console.error('Error in getVideosForSubcategory:', err)
      return []
    }
  }

  /**
   * Get a specific video by ID - Now uses protected API
   */
  static async getVideoById(
    videoId: string,
    _userPermissions: UserPermissions
  ): Promise<VideoForViewing | null> {
    try {
      // Call our protected individual video API
      const response = await fetch(`/api/video-library/video/${videoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        if (response.status === 403 || response.status === 404) {
          return null
        }
        throw new Error(`API call failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        return null
      }

      const video = data.data

      // Transform to VideoForViewing format
      const transformedVideo: VideoForViewing = {
        id: video.id,
        title: video.title,
        description: video.description || undefined,
        vimeoId: video.vimeoId || undefined,
        vimeoDuration: video.vimeoDuration || undefined,
        vimeoThumbnailUrl: video.vimeoThumbnailUrl || undefined,
        customThumbnailUrl: video.customThumbnailUrl || undefined,
        thumbnailSource: video.thumbnailSource as 'vimeo' | 'upload' | 'url',
        category: video.category,
        subcategory: video.subcategory,
        libraryStatus: video.libraryStatus || 'pending',
        publicSharingEnabled: video.publicSharingEnabled || false,
        visibilityConditions: video.permissions || {
          roleTypes: [],
          teams: [],
          areas: [],
          regions: []
        },
        createdAt: video.createdAt || '',
        updatedAt: video.updatedAt || '',
        tags: video.tags || []
      }

      return transformedVideo
    } catch (err) {
      console.error('Error in getVideoById:', err)
      return null
    }
  }
}