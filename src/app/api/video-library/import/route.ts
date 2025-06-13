import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

interface ImportRequestBody {
  vimeoId: string
  title: string
  description: string
  categoryId: string
  subcategoryId?: string
  tags: string[]
  permissions: {
    roleTypes: string[]
    teams: string[]
    areas: string[]
    regions: string[]
  }
  publicSharingEnabled: boolean
  customThumbnailUrl?: string
  thumbnailSource?: 'vimeo' | 'upload' | 'url'
  vimeoData: {
    uri?: string
    duration?: number
    thumbnail_url?: string
  }
}

export async function POST(req: Request) {
  try {
    const body: ImportRequestBody = await req.json()
    const { 
      vimeoId,
      title,
      description,
      categoryId,
      subcategoryId,
      tags,
      permissions,
      publicSharingEnabled,
      customThumbnailUrl,
      thumbnailSource,
      vimeoData: _vimeoData
    } = body

    if (!vimeoId || !title || !categoryId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if video file already exists
    const { data: existingVideo } = await supabase
      .from('video_files')
      .select('id')
      .eq('vimeo_id', vimeoId)
      .single()

    let videoFileId: string

    if (existingVideo) {
      // Update existing video
      videoFileId = existingVideo.id
      
      const { error: updateError } = await supabase
        .from('video_files')
        .update({
          title,
          description,
          video_category_id: categoryId,
          video_subcategory_id: subcategoryId || null,
          library_status: 'approved',
          admin_selected: true,
          public_sharing_enabled: publicSharingEnabled,
          custom_thumbnail_url: customThumbnailUrl || null,
          thumbnail_source: thumbnailSource || 'vimeo',
          updated_at: new Date().toISOString()
        })
        .eq('id', videoFileId)

      if (updateError) {
        console.error('Error updating video file:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to update video' },
          { status: 500 }
        )
      }
    } else {
      // This shouldn't happen if processing was completed, but handle it gracefully
      return NextResponse.json(
        { success: false, error: 'Video file not found - processing may not be complete' },
        { status: 400 }
      )
    }

    // Handle tags
    if (tags && tags.length > 0) {
      // Get or create tags
      const tagRecords = []
      for (const tagName of tags) {
        const { data: existingTag } = await supabase
          .from('video_tags')
          .select('id')
          .eq('name', tagName)
          .single()

        if (existingTag) {
          tagRecords.push(existingTag.id)
        } else {
          const { data: newTag, error: tagError } = await supabase
            .from('video_tags')
            .insert({ name: tagName })
            .select('id')
            .single()

          if (!tagError && newTag) {
            tagRecords.push(newTag.id)
          }
        }
      }

      // Create tag assignments
      if (tagRecords.length > 0) {
        const tagAssignments = tagRecords.map(tagId => ({
          video_file_id: videoFileId,
          tag_id: tagId
        }))

        await supabase
          .from('video_tag_assignments')
          .insert(tagAssignments)
      }
    }

    // Handle permissions/visibility
    if (permissions && (
      permissions.roleTypes?.length > 0 || 
      permissions.teams?.length > 0 || 
      permissions.areas?.length > 0 || 
      permissions.regions?.length > 0
    )) {
      const { error: visibilityError } = await supabase
        .from('video_visibility')
        .insert({
          video_file_id: videoFileId,
          conditions: permissions
        })

      if (visibilityError) {
        console.error('Error creating video visibility:', visibilityError)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      videoFileId,
      message: 'Video imported successfully'
    })

  } catch (error) {
    console.error('Error importing video:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to import video' },
      { status: 500 }
    )
  }
}