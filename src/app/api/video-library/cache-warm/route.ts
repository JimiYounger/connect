// src/app/api/video-library/cache-warm/route.ts

import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { memoryCache, CACHE_KEYS, CACHE_TTL } from '@/lib/memory-cache'

/**
 * Cache warming endpoint to preload popular subcategories
 * Can be called periodically or after data updates
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

    // Get user profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id, role_type, team, area, region')
      .eq('user_id', user.id)
      .single()
    
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    const isAdminOrExecutive = userProfile.role_type === 'Admin' || userProfile.role_type === 'Executive'

    // Get all subcategories with video counts
    const { data: subcategories } = await supabase
      .from('video_subcategories')
      .select(`
        id,
        name,
        video_category_id,
        video_files!inner(id)
      `)
      .limit(20) // Warm cache for top 20 subcategories
    
    if (!subcategories || subcategories.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subcategories to warm',
        warmed: 0
      })
    }

    let warmedCount = 0
    const warmPromises = subcategories.map(async (subcategory) => {
      try {
        // Get videos for this subcategory
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
          .eq('video_subcategory_id', subcategory.id)
          .order('created_at', { ascending: false })
          .limit(100) // Cache first 100 videos

        // Apply permission filtering
        if (!isAdminOrExecutive) {
          query = query.eq('library_status', 'approved')
        }

        const { data: videos } = await query

        if (videos && videos.length > 0) {
          // Transform to expected format
          const transformedVideos = videos.map(video => ({
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

          // Cache the first batch
          const cacheKey = `${CACHE_KEYS.SUBCATEGORY_VIDEOS}_${subcategory.id}_${user.id}_100_0`
          memoryCache.set(cacheKey, transformedVideos, CACHE_TTL.SUBCATEGORY_VIDEOS)
          
          // Also cache the count
          const countCacheKey = `${CACHE_KEYS.SUBCATEGORY_COUNT}_${subcategory.id}_${user.id}`
          memoryCache.set(countCacheKey, videos.length, CACHE_TTL.SUBCATEGORY_COUNT)
          
          warmedCount++
        }
      } catch (err) {
        console.error(`Error warming cache for subcategory ${subcategory.id}:`, err)
      }
    })

    await Promise.all(warmPromises)

    return NextResponse.json({
      success: true,
      message: `Cache warmed for ${warmedCount} subcategories`,
      warmed: warmedCount,
      total: subcategories.length
    })

  } catch (error) {
    console.error('Error in cache warming API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}