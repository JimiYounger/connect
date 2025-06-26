// src/app/api/video-library/subcategory-count/route.ts

import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
// No unused imports needed for this file
import { memoryCache, CACHE_KEYS, CACHE_TTL } from '@/lib/memory-cache'

/**
 * Fast endpoint to get video count for a subcategory
 * Uses efficient COUNT query with caching
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

    const { subcategoryId } = await req.json()

    if (!subcategoryId) {
      return NextResponse.json(
        { success: false, error: 'Subcategory ID is required' },
        { status: 400 }
      )
    }

    // Check cache first
    const cacheKey = `${CACHE_KEYS.SUBCATEGORY_COUNT}_${subcategoryId}_${user.id}`
    const cachedCount = memoryCache.get(cacheKey)
    
    if (cachedCount !== undefined) {
      return NextResponse.json({
        success: true,
        count: cachedCount,
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

    const isAdminOrExecutive = userProfile.role_type === 'Admin' || userProfile.role_type === 'Executive'

    // Use efficient COUNT query
    let countQuery = supabase
      .from('video_files')
      .select('id', { count: 'exact', head: true })
      .eq('video_subcategory_id', subcategoryId)

    // Apply permission filtering
    if (!isAdminOrExecutive) {
      countQuery = countQuery.eq('library_status', 'approved')
    }

    const { count, error } = await countQuery

    if (error) {
      console.error('Error counting subcategory videos:', error)
      return NextResponse.json(
        { success: false, error: `Failed to count videos: ${error.message}` },
        { status: 500 }
      )
    }

    const videoCount = count || 0

    // For non-admin users, we need to also consider visibility restrictions
    // This is a simplified approach - for exact counts we'd need more complex logic
    let finalCount = videoCount
    
    if (!isAdminOrExecutive && videoCount > 0) {
      // Get a quick sample to estimate restriction impact
      const { data: sampleVideos } = await supabase
        .from('video_files')
        .select('id')
        .eq('video_subcategory_id', subcategoryId)
        .eq('library_status', 'approved')
        .limit(Math.min(20, videoCount))
      
      if (sampleVideos && sampleVideos.length > 0) {
        const { data: restrictedSample } = await supabase
          .from('video_visibility')
          .select('video_file_id')
          .in('video_file_id', sampleVideos.map(v => v.id))
        
        const restrictionRatio = (restrictedSample?.length || 0) / sampleVideos.length
        
        // Estimate final count (this is approximate for performance)
        // For exact counts, we'd need to check all restrictions
        finalCount = Math.floor(videoCount * (1 - restrictionRatio * 0.5))
      }
    }

    // Cache for 15 minutes
    memoryCache.set(cacheKey, finalCount, CACHE_TTL.SUBCATEGORY_COUNT)

    return NextResponse.json({
      success: true,
      count: finalCount,
      cached: false
    })

  } catch (error) {
    console.error('Error in subcategory count API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}