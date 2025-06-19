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
   * Get categories manually - Now uses optimized categories summary API for faster loading
   */
  static async getCategoriesManually(): Promise<VideoCategory[]> {
    try {
      // Call our optimized categories summary API for faster loading
      const response = await fetch('/api/video-library/categories-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'API returned error')
      }

      return data.data || []
      
    } catch (err) {
      console.error('Error fetching categories:', err)
      return []
    }
  }

  /**
   * Get videos for a specific subcategory - Optimized with pagination and reduced payload
   */
  static async getVideosForSubcategory(
    subcategoryId: string,
    _userPermissions: UserPermissions,
    limit: number = 50,
    offset: number = 0
  ): Promise<VideoForViewing[]> {
    try {
      // Use optimized subcategory videos endpoint with pagination
      const response = await fetch('/api/video-library/subcategory-videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subcategoryId,
          limit,
          offset
        })
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'API returned error')
      }

      return data.data || []
    } catch (err) {
      console.error('Error in getVideosForSubcategory:', err)
      return []
    }
  }

  /**
   * Get total video count for a subcategory
   */
  static async getSubcategoryVideoCount(
    subcategoryId: string
  ): Promise<number> {
    try {
      const response = await fetch('/api/video-library/subcategory-count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subcategoryId })
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.success ? (data.count || 0) : 0
    } catch (err) {
      console.error('Error getting subcategory video count:', err)
      return 0
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