import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import type { UserPermissions, RoleType } from '@/features/permissions/types'
import { VideoPermissionService } from '@/features/videoViewer/services/permissionService'
import { validateUUID, validateVideoUpdateParams } from '@/lib/validation'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: Fetch single video details
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Validate video ID
    const videoId = validateUUID(id, 'Video ID')
    
    const supabase = await createClient()
    
    // Get the authenticated user
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

    // Fetch video with related data
    const { data: video, error } = await supabase
      .from('video_files')
      .select(`
        *,
        video_categories (id, name, description),
        video_subcategories (id, name, description),
        video_series (id, name, description)
      `)
      .eq('id', videoId)
      .single()

    if (error) {
      console.error('Error fetching video:', error)
      return NextResponse.json(
        { success: false, error: `Failed to fetch video: ${error.message}` },
        { status: 500 }
      )
    }

    if (!video) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )
    }

    // Get tags
    const { data: tagData } = await supabase
      .from('video_tag_assignments')
      .select(`
        video_tags (name)
      `)
      .eq('video_file_id', id)

    const tags = tagData?.map(item => item.video_tags?.name).filter(Boolean) || []

    // Get permissions
    const { data: visibilityData } = await supabase
      .from('video_visibility')
      .select('conditions')
      .eq('video_file_id', videoId)
      .single()

    const permissions = visibilityData?.conditions || video.visibility_conditions || { roleTypes: [], teams: [], areas: [], regions: [] }

    // Build user permissions object for permission checking
    const userPermissions: UserPermissions = {
      roleType: userProfile.role_type as RoleType,
      role: userProfile.role_type || 'Setter',
      team: userProfile.team || undefined,
      area: userProfile.area || undefined,
      region: userProfile.region || undefined
    }

    // Admin and Executive users can see all videos (including non-approved)
    const isAdminOrExecutive = userProfile.role_type === 'Admin' || userProfile.role_type === 'Executive'
    
    // For non-admin users, only show approved videos
    if (!isAdminOrExecutive && video.library_status !== 'approved') {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )
    }

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
        name: video.video_subcategories.name
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
    
    if (!permissionResult.canView) {
      return NextResponse.json(
        { success: false, error: 'Access denied: You do not have permission to view this video' },
        { status: 403 }
      )
    }

    // Process the data
    const processedVideo = {
      id: video.id,
      title: video.title,
      description: video.description,
      summary: video.summary,
      vimeoId: video.vimeo_id,
      vimeoUri: video.vimeo_uri,
      vimeoDuration: video.vimeo_duration,
      vimeoThumbnailUrl: video.vimeo_thumbnail_url,
      vimeoMetadata: video.vimeo_metadata,
      category: video.video_categories,
      subcategory: video.video_subcategories,
      series: video.video_series,
      tags,
      libraryStatus: video.library_status,
      transcriptStatus: video.transcript_status,
      embeddingStatus: video.embedding_status,
      summaryStatus: video.summary_status,
      createdAt: video.created_at,
      updatedAt: video.updated_at,
      permissions,
      publicSharingEnabled: video.public_sharing_enabled || false,
      customThumbnailUrl: video.custom_thumbnail_url,
      thumbnailSource: video.thumbnail_source || 'vimeo'
    }

    return NextResponse.json({
      success: true,
      data: processedVideo
    })

  } catch (error) {
    console.error('Error in video API:', error)
    
    // Handle validation errors with 400 status
    if (error instanceof Error && (error.message.includes('Invalid') || error.message.includes('must be a valid UUID'))) {
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

// PUT: Update video details
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Validate video ID
    const videoId = validateUUID(id, 'Video ID')
    
    // Parse and validate request body
    const rawBody = await req.json()
    const validatedBody = validateVideoUpdateParams(rawBody)
    
    const {
      title,
      description,
      categoryId,
      subcategoryId,
      tags,
      libraryStatus,
      permissions,
      publicSharingEnabled,
      customThumbnailUrl,
      thumbnailSource
    } = validatedBody

    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role_type')
      .eq('user_id', user.id)
      .single()

    if (!userProfile || userProfile.role_type?.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Update video basic info
    const { error: updateError } = await supabase
      .from('video_files')
      .update({
        title,
        description,
        video_category_id: categoryId || null,
        video_subcategory_id: subcategoryId || null,
        library_status: libraryStatus,
        public_sharing_enabled: publicSharingEnabled !== undefined ? publicSharingEnabled : false,
        custom_thumbnail_url: customThumbnailUrl || null,
        thumbnail_source: thumbnailSource || 'vimeo',
        updated_at: new Date().toISOString()
      })
      .eq('id', videoId)

    if (updateError) {
      console.error('Error updating video:', updateError)
      return NextResponse.json(
        { success: false, error: `Failed to update video: ${updateError.message}` },
        { status: 500 }
      )
    }

    // Update tags
    if (tags && Array.isArray(tags)) {
      // Delete existing tag assignments
      await supabase
        .from('video_tag_assignments')
        .delete()
        .eq('video_file_id', videoId)

      // Create new tag assignments
      if (tags.length > 0) {
        // OPTIMIZATION: Bulk fetch existing tags to avoid N+1 queries
        const { data: existingTags } = await supabase
          .from('video_tags')
          .select('id, name')
          .in('name', tags)

        const existingTagMap = new Map<string, string>()
        existingTags?.forEach(tag => {
          existingTagMap.set(tag.name, tag.id)
        })

        // Find tags that need to be created
        const newTagNames = tags.filter(tagName => !existingTagMap.has(tagName))
        
        // Bulk create new tags if needed
        if (newTagNames.length > 0) {
          const { data: newTags } = await supabase
            .from('video_tags')
            .insert(newTagNames.map(name => ({ name })))
            .select('id, name')

          // Add new tags to the map
          newTags?.forEach(tag => {
            existingTagMap.set(tag.name, tag.id)
          })
        }

        // Create tag assignment records
        const tagRecords = tags
          .map(tagName => {
            const tagId = existingTagMap.get(tagName)
            return tagId ? {
              video_file_id: videoId,
              tag_id: tagId
            } : null
          })
          .filter((record): record is { video_file_id: string; tag_id: string } => record !== null)

        if (tagRecords.length > 0) {
          await supabase
            .from('video_tag_assignments')
            .insert(tagRecords)
        }
      }
    }

    // Update permissions
    if (permissions) {
      // Delete existing visibility settings
      await supabase
        .from('video_visibility')
        .delete()
        .eq('video_file_id', videoId)

      // Create new visibility settings if permissions are specified
      if ((permissions.roleTypes && permissions.roleTypes.length > 0) || 
          (permissions.teams && permissions.teams.length > 0) || 
          (permissions.areas && permissions.areas.length > 0) || 
          (permissions.regions && permissions.regions.length > 0)) {
        await supabase
          .from('video_visibility')
          .insert({
            video_file_id: videoId,
            conditions: permissions
          })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Video updated successfully'
    })

  } catch (error) {
    console.error('Error updating video:', error)
    
    // Handle validation errors with 400 status
    if (error instanceof Error && (error.message.includes('Invalid') || error.message.includes('must be a valid UUID'))) {
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