// src/app/api/video-library/subcategory-videos/route.ts

import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import type { UserPermissions, RoleType } from '@/features/permissions/types'
import { memoryCache, CACHE_KEYS, CACHE_TTL } from '@/lib/memory-cache'

/**
 * Optimized endpoint for loading subcategory videos with pagination
 * Reduces initial load time by fetching only what's needed
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { subcategoryId, limit = 50, offset = 0 } = await req.json()

    if (!subcategoryId) {
      return NextResponse.json(
        { success: false, error: 'Subcategory ID is required' },
        { status: 400 }
      )
    }

    // Check cache first
    const cacheKey = `${CACHE_KEYS.SUBCATEGORY_VIDEOS}_${subcategoryId}_${user.id}_${limit}_${offset}`
    const cachedVideos = memoryCache.get(cacheKey)
    
    if (cachedVideos) {
      return NextResponse.json({
        success: true,
        data: cachedVideos,
        cached: true
      })
    }

    // Get user permissions (cached)
    const userPermissionsCacheKey = CACHE_KEYS.USER_PERMISSIONS(user.id)
    let userProfile = memoryCache.get<{
      id: string
      role_type: string | null
      team: string | null
      area: string | null
      region: string | null
    }>(userPermissionsCacheKey)
    
    if (!userProfile) {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('id, role_type, team, area, region')
        .eq('user_id', user.id)
        .single()
      
      if (!profileData) {
        return NextResponse.json(
          { success: false, error: 'User profile not found' },
          { status: 404 }
        )
      }
      
      userProfile = profileData
      memoryCache.set(userPermissionsCacheKey, userProfile, CACHE_TTL.USER_PERMISSIONS)
    }

    const userPermissions: UserPermissions = {
      roleType: (userProfile.role_type || 'Setter') as RoleType,
      role: userProfile.role_type || 'Setter',
      team: userProfile.team || undefined,
      area: userProfile.area || undefined,
      region: userProfile.region || undefined
    }

    const isAdminOrExecutive = userProfile.role_type === 'Admin' || userProfile.role_type === 'Executive'

    // Build optimized query with minimal data transfer
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
        created_at,
        updated_at,
        video_categories!inner(name),
        video_subcategories!inner(name)
      `)
      .eq('video_subcategory_id', subcategoryId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    // Apply permission filtering
    if (!isAdminOrExecutive) {
      query = query.eq('library_status', 'approved')
    }

    const { data: videos, error } = await query

    if (error) {
      console.error('Error fetching subcategory videos:', error)
      return NextResponse.json(
        { success: false, error: `Failed to fetch videos: ${error.message}` },
        { status: 500 }
      )
    }

    if (!videos || videos.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        cached: false
      })
    }

    // For non-admin users, filter by visibility permissions
    let filteredVideos = videos
    
    if (!isAdminOrExecutive) {
      const videoIds = videos.map(v => v.id)
      
      // Get visibility restrictions for these videos
      const { data: visibilityData } = await supabase
        .from('video_visibility')
        .select('video_file_id, conditions')
        .in('video_file_id', videoIds)
      
      const restrictedVideoIds = new Set(visibilityData?.map(v => v.video_file_id) || [])
      
      // Filter out videos that have restrictions user doesn't meet
      filteredVideos = videos.filter(video => {
        // If no restrictions, video is viewable
        if (!restrictedVideoIds.has(video.id)) {
          return true
        }
        
        // Check if user meets restrictions
        const restriction = visibilityData?.find(v => v.video_file_id === video.id)
        if (!restriction?.conditions) {
          return true
        }
        
        const conditions = restriction.conditions as {
          roleTypes?: string[]
          teams?: string[]
          areas?: string[]
          regions?: string[]
        }
        
        // Check role
        if (conditions.roleTypes?.includes(userPermissions.roleType)) {
          return true
        }
        
        // Check team
        if (userPermissions.team && conditions.teams?.includes(userPermissions.team)) {
          return true
        }
        
        // Check area
        if (userPermissions.area && conditions.areas?.includes(userPermissions.area)) {
          return true
        }
        
        // Check region
        if (userPermissions.region && conditions.regions?.includes(userPermissions.region)) {
          return true
        }
        
        return false
      })
    }

    // Transform to expected format
    const transformedVideos = filteredVideos.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description || undefined,
      vimeoId: video.vimeo_id || undefined,
      vimeoDuration: video.vimeo_duration || undefined,
      vimeoThumbnailUrl: video.vimeo_thumbnail_url || undefined,
      customThumbnailUrl: video.custom_thumbnail_url || undefined,
      thumbnailSource: video.thumbnail_source as 'vimeo' | 'upload' | 'url' || 'vimeo',
      category: video.video_categories?.name || '',
      subcategory: video.video_subcategories?.name || '',
      libraryStatus: video.library_status || 'pending',
      publicSharingEnabled: video.public_sharing_enabled || false,
      visibilityConditions: {
        roleTypes: [],
        teams: [],
        areas: [],
        regions: []
      },
      createdAt: video.created_at || '',
      updatedAt: video.updated_at || '',
      tags: []
    }))

    // Cache for 10 minutes
    memoryCache.set(cacheKey, transformedVideos, CACHE_TTL.SUBCATEGORY_VIDEOS)

    return NextResponse.json({
      success: true,
      data: transformedVideos,
      cached: false,
      total: transformedVideos.length
    })

  } catch (error) {
    console.error('Error in subcategory videos API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}