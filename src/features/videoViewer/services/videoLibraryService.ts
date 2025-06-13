// src/features/videoViewer/services/videoLibraryService.ts

import { createClient } from '@/lib/supabase'
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
   * Get categories manually
   */
  static async getCategoriesManually(): Promise<VideoCategory[]> {
    try {
      const supabase = createClient()
      
      console.log('Fetching video categories...')
      
      // First, get all categories
      const { data: categories, error: categoriesError } = await supabase
        .from('video_categories')
        .select('id, name')
        .order('name')

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError)
        return []
      }

      console.log('Categories found:', categories?.length)

      // Get all subcategories with their categories
      const { data: subcategories, error: subcategoriesError } = await supabase
        .from('video_subcategories')
        .select(`
          id,
          name,
          thumbnail_url,
          thumbnail_color,
          video_category_id
        `)
        .order('name')

      if (subcategoriesError) {
        console.error('Error fetching subcategories:', subcategoriesError)
        return []
      }

      console.log('Subcategories found:', subcategories?.length)

      // Get video counts for each subcategory
      const subcategoryIds = subcategories?.map(sub => sub.id) || []

      const { data: videoCounts, error: countError } = await supabase
        .from('video_files')
        .select('video_subcategory_id')
        .eq('library_status', 'approved')
        .in('video_subcategory_id', subcategoryIds)

      if (countError) {
        console.error('Error fetching video counts:', countError)
      }

      console.log('Video files found:', videoCounts?.length)

      // Create count map
      const countMap = new Map<string, number>()
      videoCounts?.forEach(video => {
        if (video.video_subcategory_id) {
          const count = countMap.get(video.video_subcategory_id) || 0
          countMap.set(video.video_subcategory_id, count + 1)
        }
      })

      // Transform data
      const result: VideoCategory[] = categories?.map(category => {
        const categorySubcategories = subcategories?.filter(sub => 
          sub.video_category_id === category.id
        ) || []

        return {
          id: category.id,
          name: category.name,
          subcategories: categorySubcategories.map(sub => ({
            id: sub.id,
            name: sub.name,
            thumbnailUrl: sub.thumbnail_url || undefined,
            thumbnailColor: sub.thumbnail_color || undefined,
            videoCount: countMap.get(sub.id) || 0
          }))
        }
      }) || []

      console.log('Final result:', result.length, 'categories')
      return result
    } catch (err) {
      console.error('Error in getCategoriesManually:', err)
      return []
    }
  }

  /**
   * Get videos for a specific subcategory
   */
  static async getVideosForSubcategory(
    subcategoryId: string,
    _userPermissions: UserPermissions
  ): Promise<VideoForViewing[]> {
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
          )
        `)
        .eq('video_subcategory_id', subcategoryId)
        .eq('library_status', 'approved')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching videos for subcategory:', error)
        return []
      }

      // Transform to VideoForViewing format
      const videos: VideoForViewing[] = data?.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description || undefined,
        vimeoId: video.vimeo_id || undefined,
        vimeoDuration: video.vimeo_duration || undefined,
        vimeoThumbnailUrl: video.vimeo_thumbnail_url || undefined,
        customThumbnailUrl: video.custom_thumbnail_url || undefined,
        thumbnailSource: video.thumbnail_source as 'vimeo' | 'upload' | 'url',
        category: video.video_categories ? {
          id: video.video_categories.id,
          name: video.video_categories.name
        } : undefined,
        subcategory: video.video_subcategories ? {
          id: video.video_subcategories.id,
          name: video.video_subcategories.name
        } : undefined,
        libraryStatus: (video.library_status as 'pending' | 'approved' | 'rejected' | 'archived') || 'pending',
        publicSharingEnabled: video.public_sharing_enabled || false,
        visibilityConditions: video.visibility_conditions as any || {
          roleTypes: [],
          teams: [],
          areas: [],
          regions: []
        },
        createdAt: video.created_at || '',
        updatedAt: video.updated_at || ''
      })) || []

      // TODO: Apply permission filtering based on userPermissions
      // For now, return all approved videos
      return videos
    } catch (err) {
      console.error('Error in getVideosForSubcategory:', err)
      return []
    }
  }

  /**
   * Get a specific video by ID
   */
  static async getVideoById(
    videoId: string,
    _userPermissions: UserPermissions
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
          )
        `)
        .eq('id', videoId)
        .eq('library_status', 'approved')
        .single()

      if (error) {
        console.error('Error fetching video by ID:', error)
        return null
      }

      // Transform to VideoForViewing format
      const video: VideoForViewing = {
        id: data.id,
        title: data.title,
        description: data.description || undefined,
        vimeoId: data.vimeo_id || undefined,
        vimeoDuration: data.vimeo_duration || undefined,
        vimeoThumbnailUrl: data.vimeo_thumbnail_url || undefined,
        customThumbnailUrl: data.custom_thumbnail_url || undefined,
        thumbnailSource: data.thumbnail_source as 'vimeo' | 'upload' | 'url',
        category: data.video_categories ? {
          id: data.video_categories.id,
          name: data.video_categories.name
        } : undefined,
        subcategory: data.video_subcategories ? {
          id: data.video_subcategories.id,
          name: data.video_subcategories.name
        } : undefined,
        libraryStatus: (data.library_status as 'pending' | 'approved' | 'rejected' | 'archived') || 'pending',
        publicSharingEnabled: data.public_sharing_enabled || false,
        visibilityConditions: data.visibility_conditions as any || {
          roleTypes: [],
          teams: [],
          areas: [],
          regions: []
        },
        createdAt: data.created_at || '',
        updatedAt: data.updated_at || ''
      }

      // TODO: Apply permission checking based on userPermissions
      // For now, return the video if it's approved
      return video
    } catch (err) {
      console.error('Error in getVideoById:', err)
      return null
    }
  }
}