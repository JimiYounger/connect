// my-app/src/app/api/video-library/vimeo/import/route.ts

import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const VIMEO_API_URL = 'https://api.vimeo.com'

interface ImportVideoRequest {
  vimeoId: string
  title?: string
  description?: string
  categoryId?: string
  subcategoryId?: string
  seriesId?: string
  tags?: string[]
}

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

    const requestData = await req.json() as ImportVideoRequest

    if (!requestData.vimeoId) {
      return NextResponse.json(
        { success: false, error: 'Vimeo ID is required' },
        { status: 400 }
      )
    }

    // Check if video already exists
    const { data: existingVideo } = await supabase
      .from('video_files')
      .select('id, admin_selected')
      .eq('vimeo_id', requestData.vimeoId)
      .single()

    if (existingVideo) {
      // If already exists but not selected, mark as selected
      if (!existingVideo.admin_selected) {
        const { error: updateError } = await supabase
          .from('video_files')
          .update({
            admin_selected: true,
            library_status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingVideo.id)

        if (updateError) {
          return NextResponse.json(
            { success: false, error: `Failed to update video: ${updateError.message}` },
            { status: 500 }
          )
        }
      }

      return NextResponse.json({
        success: true,
        data: { id: existingVideo.id, message: 'Video already imported and selected' }
      })
    }

    // Fetch video details from Vimeo API
    let vimeoVideo
    try {
      if (!process.env.VIMEO_ACCESS_TOKEN) {
        throw new Error('Vimeo API token not configured')
      }

      const vimeoApiResponse = await fetch(`${VIMEO_API_URL}/videos/${requestData.vimeoId}`, {
        headers: {
          'Authorization': `bearer ${process.env.VIMEO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.vimeo.*+json;version=3.4'
        }
      })

      if (!vimeoApiResponse.ok) {
        throw new Error(`Vimeo API error: ${vimeoApiResponse.status}`)
      }

      vimeoVideo = await vimeoApiResponse.json()
    } catch (vimeoError) {
      console.error('Error fetching video from Vimeo:', vimeoError)
      // Fall back to basic video data if API call fails
      vimeoVideo = {
        uri: `/videos/${requestData.vimeoId}`,
        name: requestData.title || 'Untitled Video',
        description: requestData.description || null,
        duration: null,
        pictures: null,
        link: `https://vimeo.com/${requestData.vimeoId}`
      }
    }

    // Create video record
    const { data: newVideo, error: insertError } = await supabase
      .from('video_files')
      .insert({
        title: requestData.title || vimeoVideo.name,
        description: requestData.description || vimeoVideo.description,
        vimeo_id: requestData.vimeoId,
        vimeo_uri: vimeoVideo.uri,
        vimeo_duration: vimeoVideo.duration,
        vimeo_thumbnail_url: vimeoVideo.pictures?.sizes?.[0]?.link,
        vimeo_metadata: vimeoVideo,
        video_category_id: requestData.categoryId || null,
        video_subcategory_id: requestData.subcategoryId || null,
        video_series_id: requestData.seriesId || null,
        admin_selected: true,
        library_status: 'pending',
        transcript_status: 'pending',
        embedding_status: 'pending',
        summary_status: 'pending',
        created_by: userProfile.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating video record:', insertError)
      return NextResponse.json(
        { success: false, error: `Failed to create video: ${insertError.message}` },
        { status: 500 }
      )
    }

    // Add tags if provided
    if (requestData.tags && requestData.tags.length > 0) {
      const tagAssignments = requestData.tags.map(tagId => ({
        video_file_id: newVideo.id,
        tag_id: tagId
      }))

      const { error: tagError } = await supabase
        .from('video_tag_assignments')
        .insert(tagAssignments)

      if (tagError) {
        console.warn('Error adding tags to video:', tagError)
        // Don't fail the entire operation for tag errors
      }
    }

    // TODO: Trigger video processing (transcript extraction, etc.)
    // This would be done via a background job or edge function
    // For now, we'll just mark it as imported

    return NextResponse.json({
      success: true,
      data: {
        id: newVideo.id,
        message: 'Video imported successfully and queued for processing'
      }
    })

  } catch (error) {
    console.error('Error importing video:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to import video' 
      },
      { status: 500 }
    )
  }
}