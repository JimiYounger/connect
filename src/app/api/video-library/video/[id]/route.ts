import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: Fetch single video details
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
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
      .eq('id', id)
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
      .eq('video_file_id', id)
      .single()

    const permissions = visibilityData?.conditions || { roleTypes: [], teams: [], areas: [], regions: [] }

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
    const body = await req.json()
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
    } = body

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
      .eq('id', id)

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
        .eq('video_file_id', id)

      // Create new tag assignments
      if (tags.length > 0) {
        const tagRecords = []
        for (const tagName of tags) {
          // Get or create tag
          let { data: existingTag } = await supabase
            .from('video_tags')
            .select('id')
            .eq('name', tagName)
            .single()

          if (!existingTag) {
            const { data: newTag, error: tagError } = await supabase
              .from('video_tags')
              .insert({ name: tagName })
              .select('id')
              .single()

            if (!tagError && newTag) {
              existingTag = newTag
            }
          }

          if (existingTag) {
            tagRecords.push({
              video_file_id: id,
              tag_id: existingTag.id
            })
          }
        }

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
        .eq('video_file_id', id)

      // Create new visibility settings if permissions are specified
      if (permissions.roleTypes?.length > 0 || 
          permissions.teams?.length > 0 || 
          permissions.areas?.length > 0 || 
          permissions.regions?.length > 0) {
        await supabase
          .from('video_visibility')
          .insert({
            video_file_id: id,
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
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}