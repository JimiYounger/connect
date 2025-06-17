// src/app/api/video-library/categories-summary/route.ts

import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import type { UserPermissions, RoleType } from '@/features/permissions/types'
import { VideoPermissionService } from '@/features/videoViewer/services/permissionService'

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

    // Get user profile for permission checking
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

    // Build user permissions object
    const userPermissions: UserPermissions = {
      roleType: userProfile.role_type as RoleType,
      role: userProfile.role_type || 'Setter',
      team: userProfile.team || undefined,
      area: userProfile.area || undefined,
      region: userProfile.region || undefined
    }

    // Admin and Executive users can see all videos (including non-approved)
    const isAdminOrExecutive = userProfile.role_type === 'Admin' || userProfile.role_type === 'Executive'

    // Get minimal video data for category building
    let query = supabase
      .from('video_files')
      .select(`
        id,
        video_category_id,
        video_subcategory_id,
        visibility_conditions,
        library_status,
        video_categories (id, name),
        video_subcategories (id, name, thumbnail_url, thumbnail_color, thumbnail_source)
      `)

    // For non-admin users, only show approved videos
    if (!isAdminOrExecutive) {
      query = query.eq('library_status', 'approved')
    }

    const { data: videos, error } = await query

    if (error) {
      console.error('Error fetching videos for categories:', error)
      return NextResponse.json(
        { success: false, error: `Failed to fetch videos: ${error.message}` },
        { status: 500 }
      )
    }

    // Bulk fetch visibility conditions for permission filtering
    const videoIds = videos.map(v => v.id)
    const { data: allVisibilityData } = await supabase
      .from('video_visibility')
      .select('video_file_id, conditions')
      .in('video_file_id', videoIds)

    // Create visibility map
    const visibilityMap = new Map<string, any>()
    allVisibilityData?.forEach(item => {
      visibilityMap.set(item.video_file_id, item.conditions)
    })

    // Filter videos by permissions first
    const viewableVideos = videos.filter(video => {
      const permissions = visibilityMap.get(video.id) || video.visibility_conditions || { roleTypes: [], teams: [], areas: [], regions: [] }
      
      // Create minimal video object for permission checking
      const videoForViewing = {
        id: video.id,
        title: '',
        libraryStatus: (video.library_status as 'pending' | 'approved' | 'rejected' | 'archived') || 'pending',
        publicSharingEnabled: false,
        visibilityConditions: permissions,
        createdAt: '',
        updatedAt: '',
        tags: []
      }

      const permissionResult = VideoPermissionService.checkVideoPermission(videoForViewing, userPermissions)
      return permissionResult.canView
    })

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

    return NextResponse.json({
      success: true,
      data: categories
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