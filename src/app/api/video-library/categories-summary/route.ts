// src/app/api/video-library/categories-summary/route.ts

import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import type { UserPermissions, RoleType } from '@/features/permissions/types'
import { memoryCache, CACHE_KEYS, CACHE_TTL } from '@/lib/memory-cache'

/**
 * Lightweight endpoint for building category structure with counts
 * Optimized for fast initial page load
 */
export async function POST() {
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

    // Check cache first for user's categories
    const userCacheKey = `${CACHE_KEYS.CATEGORIES_SUMMARY}_${user.id}`
    const cachedCategories = memoryCache.get(userCacheKey)
    
    if (cachedCategories) {
      console.log('Cache HIT: Returning cached categories for user', user.id)
      return NextResponse.json({
        success: true,
        data: cachedCategories,
        cached: true,
        timestamp: new Date().toISOString()
      })
    }

    console.log('Cache MISS: Computing categories for user', user.id)

    // Get user profile for permission checking (also cache this)
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
      // Cache user permissions for 30 minutes
      memoryCache.set(userPermissionsCacheKey, userProfile, CACHE_TTL.USER_PERMISSIONS)
    }

    // Build user permissions object
    const userPermissions: UserPermissions = {
      roleType: (userProfile.role_type || 'Setter') as RoleType,
      role: userProfile.role_type || 'Setter',
      team: userProfile.team || undefined,
      area: userProfile.area || undefined,
      region: userProfile.region || undefined
    }

    // Admin and Executive users can see all videos (including non-approved)
    const isAdminOrExecutive = userProfile.role_type === 'Admin' || userProfile.role_type === 'Executive'

    // OPTIMIZED: More efficient permission filtering approach
    // Key insight: Most videos have NO restrictions (no video_visibility row = everyone can see)
    // Only some videos have restrictions (video_visibility row exists = check permissions)
    
    let viewableVideoIds: string[] = []
    
    if (isAdminOrExecutive) {
      // Admin/Executive: Get all video IDs (no permission filtering needed)
      const { data: allVideos } = await supabase
        .from('video_files')
        .select('id')
        .not('video_category_id', 'is', null)
        .not('video_subcategory_id', 'is', null)
      
      viewableVideoIds = allVideos?.map(v => v.id) || []
    } else {
      // Regular users: Need to check permissions
      
      // Step 1: Get ALL videos that are approved and have categories
      const { data: allApprovedVideos } = await supabase
        .from('video_files')
        .select('id')
        .eq('library_status', 'approved')
        .not('video_category_id', 'is', null)
        .not('video_subcategory_id', 'is', null)
      
      if (!allApprovedVideos || allApprovedVideos.length === 0) {
        viewableVideoIds = []
      } else {
        const allVideoIds = allApprovedVideos.map(v => v.id)
        
        // Step 2: Get videos that HAVE restrictions (exist in video_visibility table)
        const { data: restrictedVideos } = await supabase
          .from('video_visibility')
          .select('video_file_id, conditions')
          .in('video_file_id', allVideoIds)
        
        const restrictedVideoIds = new Set(restrictedVideos?.map(v => v.video_file_id) || [])
        
        // Step 3: Videos without restrictions are automatically viewable
        const openVideoIds = allVideoIds.filter(id => !restrictedVideoIds.has(id))
        
        // Step 4: Check permissions for restricted videos
        const allowedRestrictedIds = new Set<string>()
        
        if (restrictedVideos && restrictedVideos.length > 0) {
          restrictedVideos.forEach(video => {
            const conditions = video.conditions as {
              roleTypes?: string[]
              teams?: string[]
              areas?: string[]
              regions?: string[]
            } | null
            let hasAccess = false
            
            // Skip if conditions is null or empty
            if (!conditions) {
              return
            }
            
            // Check if user's role matches
            if (conditions.roleTypes && conditions.roleTypes.includes(userPermissions.roleType)) {
              hasAccess = true
            }
            
            // Check if user's team matches (if they have a team)
            if (!hasAccess && userPermissions.team && conditions.teams && conditions.teams.includes(userPermissions.team)) {
              hasAccess = true
            }
            
            // Check if user's area matches (if they have an area)
            if (!hasAccess && userPermissions.area && conditions.areas && conditions.areas.includes(userPermissions.area)) {
              hasAccess = true
            }
            
            // Check if user's region matches (if they have a region)
            if (!hasAccess && userPermissions.region && conditions.regions && conditions.regions.includes(userPermissions.region)) {
              hasAccess = true
            }
            
            if (hasAccess) {
              allowedRestrictedIds.add(video.video_file_id)
            }
          })
        }
        
        // Combine open videos + restricted videos user has access to
        viewableVideoIds = [...openVideoIds, ...Array.from(allowedRestrictedIds)]
      }
    }
    
    // Now get the full video data for viewable videos only
    const { data: viewableVideos, error } = await supabase
      .from('video_files')
      .select(`
        id,
        video_category_id,
        video_subcategory_id,
        library_status,
        video_categories (id, name),
        video_subcategories (id, name, thumbnail_url, thumbnail_color, thumbnail_source)
      `)
      .in('id', viewableVideoIds)

    if (error) {
      console.error('Error fetching videos for categories:', error)
      return NextResponse.json(
        { success: false, error: `Failed to fetch videos: ${error.message}` },
        { status: 500 }
      )
    }

    // Build category structure from filtered videos
    const categoryMap = new Map<string, {
      id: string
      name: string
      subcategories: Map<string, { 
        id: string, 
        name: string, 
        count: number, 
        thumbnailUrl?: string, 
        thumbnailColor?: string,
        thumbnailSource?: string
      }>
    }>()

    viewableVideos.forEach(video => {
      if (video.video_categories && video.video_subcategories) {
        // Get or create category
        if (!categoryMap.has(video.video_categories.id)) {
          categoryMap.set(video.video_categories.id, {
            id: video.video_categories.id,
            name: video.video_categories.name,
            subcategories: new Map()
          })
        }

        const category = categoryMap.get(video.video_categories.id)!
        
        // Get or create subcategory
        if (!category.subcategories.has(video.video_subcategories.id)) {
          category.subcategories.set(video.video_subcategories.id, {
            id: video.video_subcategories.id,
            name: video.video_subcategories.name,
            count: 0,
            thumbnailUrl: video.video_subcategories.thumbnail_url || undefined,
            thumbnailColor: video.video_subcategories.thumbnail_color || undefined,
            thumbnailSource: video.video_subcategories.thumbnail_source || undefined
          })
        }

        // Increment count
        const subcategory = category.subcategories.get(video.video_subcategories.id)!
        subcategory.count++
      }
    })

    // Convert to response format
    const categories = Array.from(categoryMap.values()).map(category => ({
      id: category.id,
      name: category.name,
      subcategories: Array.from(category.subcategories.values()).map(sub => ({
        id: sub.id,
        name: sub.name,
        thumbnailUrl: sub.thumbnailUrl,
        thumbnailColor: sub.thumbnailColor,
        thumbnailSource: sub.thumbnailSource,
        videoCount: sub.count
      }))
    }))

    // Cache the computed categories for this user (4 hours TTL)
    memoryCache.set(userCacheKey, categories, CACHE_TTL.CATEGORIES)
    
    console.log('Cached categories for user', user.id, '- expires in', CACHE_TTL.CATEGORIES / 1000 / 60, 'minutes')

    return NextResponse.json({
      success: true,
      data: categories,
      cached: false,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in categories summary API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}