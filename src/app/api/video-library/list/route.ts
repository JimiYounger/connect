// my-app/src/app/api/video-library/list/route.ts

// API route for fetching videos with filters
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import type { UserPermissions, RoleType } from '@/features/permissions/types'
import { VideoPermissionService } from '@/features/videoViewer/services/permissionService'
import { validateVideoListParams } from '@/lib/validation'

export interface VideoListParams {
  video_category_id?: string
  video_subcategory_id?: string
  video_series_id?: string
  tags?: string[]
  admin_selected?: boolean
  library_status?: 'pending' | 'processing' | 'completed' | 'error'
  searchQuery?: string
  page?: number
  limit?: number
}

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const rawParams = await req.json()
    
    // Validate and sanitize parameters
    const params = validateVideoListParams(rawParams)
    
    const {
      video_category_id,
      video_subcategory_id,
      video_series_id,
      tags: _tags,
      admin_selected,
      library_status,
      searchQuery: _searchQuery,
      page = 1,
      limit = 20
    } = params

    // Calculate offset for pagination
    const offset = (page - 1) * limit
    
    // Track IDs from filtering for counting
    let _matchingTranscriptIds: string[] | undefined
    let _matchingTagIds: string[] | undefined
    let _visibleVideoIds: string[] = []

    // Get the authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user profile to check permissions
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

    // Start building the query - simplified to avoid foreign key errors
    let query = supabase
      .from('video_files')
      .select(`
        *,
        video_categories (id, name),
        video_subcategories (id, name, thumbnail_url, thumbnail_color, thumbnail_source),
        video_series (id, name)
      `)
      
    // Apply category filter
    if (video_category_id) {
      query = query.eq('video_category_id', video_category_id)
    }
    
    // Apply subcategory filter
    if (video_subcategory_id) {
      query = query.eq('video_subcategory_id', video_subcategory_id)
    }
    
    // Apply series filter
    if (video_series_id) {
      query = query.eq('video_series_id', video_series_id)
    }
    
    // Apply admin_selected filter
    if (admin_selected !== undefined) {
      query = query.eq('admin_selected', admin_selected)
    }
    
    // Apply library_status filter
    if (library_status) {
      query = query.eq('library_status', library_status)
    }
    
    // Build user permissions object for filtering
    const userPermissions: UserPermissions = {
      roleType: userProfile.role_type as RoleType,
      role: userProfile.role_type || 'Setter', // Using role_type as role, fallback to Setter
      team: userProfile.team || undefined,
      area: userProfile.area || undefined,
      region: userProfile.region || undefined
    }

    // Admin and Executive users can see all videos (including non-approved)
    const isAdminOrExecutive = userProfile.role_type === 'Admin' || userProfile.role_type === 'Executive'
    
    // For non-admin users, only show approved videos by default
    if (!isAdminOrExecutive && !library_status) {
      query = query.eq('library_status', 'approved')
    }
    
    // Skip search and tag filtering for now - will implement later
    // Focus on basic listing first
    
    // Create a simple count query
    let countQuery = supabase
      .from('video_files')
      .select('*', { count: 'exact', head: true })

    // Apply the same basic filters as the main query
    if (video_category_id) {
      countQuery = countQuery.eq('video_category_id', video_category_id)
    }
    
    if (video_subcategory_id) {
      countQuery = countQuery.eq('video_subcategory_id', video_subcategory_id)
    }
    
    if (video_series_id) {
      countQuery = countQuery.eq('video_series_id', video_series_id)
    }
    
    if (admin_selected !== undefined) {
      countQuery = countQuery.eq('admin_selected', admin_selected)
    }
    
    if (library_status) {
      countQuery = countQuery.eq('library_status', library_status)
    }
    
    // Apply the same admin/approved filtering to count query
    if (!isAdminOrExecutive && !library_status) {
      countQuery = countQuery.eq('library_status', 'approved')
    }
    
    // Execute the count query
    const { count, error: countError } = await countQuery
    
    if (countError) {
      console.error('Error getting video count:', countError)
      return NextResponse.json(
        { success: false, error: `Failed to get video count: ${countError.message}` },
        { status: 500 }
      )
    }
    
    // Use the count (will be null if no rows match)
    const _rawTotal = count || 0
    
    // Apply pagination
    query = query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // Execute the query
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching videos:', error)
      return NextResponse.json(
        { success: false, error: `Failed to fetch videos: ${error.message}` },
        { status: 500 }
      )
    }
    
    // OPTIMIZATION: Fetch all related data in bulk to avoid N+1 queries
    const videoIds = data.map(video => video.id)
    
    // Bulk fetch chunks counts
    const { data: chunksData } = await supabase
      .from('video_chunks')
      .select('video_file_id')
      .in('video_file_id', videoIds)
    
    // Create chunks count map
    const chunksCountMap = new Map<string, number>()
    chunksData?.forEach(chunk => {
      const currentCount = chunksCountMap.get(chunk.video_file_id) || 0
      chunksCountMap.set(chunk.video_file_id, currentCount + 1)
    })

    // Bulk fetch tags
    const { data: allTagData } = await supabase
      .from('video_tag_assignments')
      .select(`
        video_file_id,
        video_tags (name)
      `)
      .in('video_file_id', videoIds)

    // Create tags map
    const tagsMap = new Map<string, string[]>()
    allTagData?.forEach(item => {
      if (item.video_tags?.name) {
        const existingTags = tagsMap.get(item.video_file_id) || []
        tagsMap.set(item.video_file_id, [...existingTags, item.video_tags.name])
      }
    })

    // Bulk fetch visibility conditions
    const { data: allVisibilityData } = await supabase
      .from('video_visibility')
      .select('video_file_id, conditions')
      .in('video_file_id', videoIds)

    // Create visibility map
    const visibilityMap = new Map<string, any>()
    allVisibilityData?.forEach(item => {
      visibilityMap.set(item.video_file_id, item.conditions)
    })

    // Process videos using the pre-fetched data
    const processedData = await Promise.all(data.map(async (video) => {
      const chunksCount = chunksCountMap.get(video.id) || 0
      const tags = tagsMap.get(video.id) || []
      const permissions = visibilityMap.get(video.id) || video.visibility_conditions || { roleTypes: [], teams: [], areas: [], regions: [] }

      // Use summary if available for the truncated response
      let summary = video.summary || null;
      
      // Transform to VideoForViewing format for permission checking
      const videoForViewing = {
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
          name: video.video_subcategories.name,
          thumbnailUrl: video.video_subcategories.thumbnail_url,
          thumbnailColor: video.video_subcategories.thumbnail_color,
          thumbnailSource: video.video_subcategories.thumbnail_source
        } : undefined,
        libraryStatus: (video.library_status as 'pending' | 'approved' | 'rejected' | 'archived') || 'pending',
        publicSharingEnabled: video.public_sharing_enabled || false,
        visibilityConditions: permissions as any || {
          roleTypes: [],
          teams: [],
          areas: [],
          regions: []
        },
        createdAt: video.created_at || '',
        updatedAt: video.updated_at || '',
        tags: tags
      }

      // Check if user has permission to view this video
      const permissionResult = VideoPermissionService.checkVideoPermission(videoForViewing, userPermissions)
      
      return {
        video: {
          id: video.id,
          title: video.title,
          // Only include description preview for listing (limit 150 chars)
          description: video.description ? video.description.substring(0, 150) + (video.description.length > 150 ? '...' : '') : null,
          vimeoId: video.vimeo_id,
          vimeoDuration: video.vimeo_duration,
          vimeoThumbnailUrl: video.vimeo_thumbnail_url,
          customThumbnailUrl: video.custom_thumbnail_url,
          thumbnailSource: video.thumbnail_source,
          category: video.video_categories,
          subcategory: video.video_subcategories ? {
            id: video.video_subcategories.id,
            name: video.video_subcategories.name,
            thumbnailUrl: video.video_subcategories.thumbnail_url,
            thumbnailColor: video.video_subcategories.thumbnail_color,
            thumbnailSource: video.video_subcategories.thumbnail_source
          } : undefined,
          // Only include summary preview for listing (limit 200 chars)
          summary: summary ? summary.substring(0, 200) + (summary.length > 200 ? '...' : '') : null,
          tags,
          adminSelected: video.admin_selected,
          libraryStatus: video.library_status,
          createdAt: video.created_at,
          updatedAt: video.updated_at,
          chunksCount: chunksCount,
          permissions
        },
        canView: permissionResult.canView,
        permissionReason: permissionResult.reason || permissionResult.restrictionReason
      }
    }))
    
    // Filter out videos the user can't view
    const viewableVideoData = processedData
      .filter(item => item.canView)
      .map(item => item.video)
    
    return NextResponse.json({
      success: true,
      data: viewableVideoData,
      total: viewableVideoData.length, // Use filtered count for pagination
      page,
      limit,
      totalPages: Math.ceil(viewableVideoData.length / limit)
    })
    
  } catch (error) {
    console.error('Error in video list API:', error)
    
    // Handle validation errors with 400 status
    if (error instanceof Error && error.message.includes('Invalid parameters')) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}