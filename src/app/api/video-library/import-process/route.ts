import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { processVideoFile } from '@/features/videoLibrary/services/video-processing-service'

interface ProcessRequestBody {
  vimeoId: string
  title: string
  description: string
  vimeoUri?: string
  vimeoDuration?: number
  vimeoThumbnailUrl?: string
}

export async function POST(req: Request) {
  try {
    console.log('Import-process API called')
    const body: ProcessRequestBody = await req.json()
    console.log('Request body:', body)
    
    const { 
      vimeoId, 
      title, 
      description, 
      vimeoUri, 
      vimeoDuration, 
      vimeoThumbnailUrl 
    } = body

    // Validate required fields
    if (!vimeoId || !title) {
      console.log('Missing required fields')
      return NextResponse.json(
        { success: false, error: 'Missing required fields: vimeoId and title' },
        { status: 400 }
      )
    }
    
    console.log('Fields validated, creating Supabase client')

    // Create Supabase client
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

    // Check if video already exists and handle it properly
    let videoFileId: string
    let _alreadyProcessed = false

    try {
      // First, try to insert a new video file
      const { data: newVideo, error: createError } = await supabase
        .from('video_files')
        .insert({
          vimeo_id: vimeoId,
          title,
          description,
          vimeo_uri: vimeoUri,
          vimeo_duration: vimeoDuration,
          vimeo_thumbnail_url: vimeoThumbnailUrl,
          admin_selected: true,
          library_status: 'pending',
          transcript_status: 'pending',
          embedding_status: 'pending',
          summary_status: 'pending'
        })
        .select('id')
        .single()

      if (createError) {
        // If it's a unique constraint violation, the video already exists
        if (createError.code === '23505' && createError.message.includes('vimeo_id')) {
          console.log(`Video ${vimeoId} already exists, fetching existing record`)
          
          // Fetch the existing video
          const { data: existingVideo, error: fetchError } = await supabase
            .from('video_files')
            .select('id, embedding_status, transcript_status')
            .eq('vimeo_id', vimeoId)
            .single()

          if (fetchError || !existingVideo) {
            console.error('Error fetching existing video:', fetchError)
            return NextResponse.json(
              { success: false, error: 'Video exists but could not be retrieved' },
              { status: 500 }
            )
          }

          // Check if already fully processed
          if (existingVideo.embedding_status === 'completed' && existingVideo.transcript_status === 'completed') {
            console.log(`Video ${vimeoId} is already fully processed`)
            return NextResponse.json({
              success: true,
              videoFileId: existingVideo.id,
              message: 'Video already processed',
              alreadyProcessed: true
            })
          }

          // Update the existing video with new metadata
          videoFileId = existingVideo.id
          const { error: updateError } = await supabase
            .from('video_files')
            .update({
              title,
              description,
              vimeo_uri: vimeoUri,
              vimeo_duration: vimeoDuration,
              vimeo_thumbnail_url: vimeoThumbnailUrl,
              admin_selected: true,
              library_status: 'pending',
              transcript_status: 'pending',
              embedding_status: 'pending',
              summary_status: 'pending',
              updated_at: new Date().toISOString()
            })
            .eq('id', videoFileId)

          if (updateError) {
            console.error('Error updating existing video file:', updateError)
            return NextResponse.json(
              { success: false, error: 'Failed to update existing video file' },
              { status: 500 }
            )
          }
          
          console.log(`Updated existing video ${videoFileId} for reprocessing`)
        } else {
          // Some other database error
          console.error('Error creating video file:', createError)
          return NextResponse.json(
            { success: false, error: 'Failed to create video file' },
            { status: 500 }
          )
        }
      } else if (newVideo) {
        // Successfully created new video
        videoFileId = newVideo.id
        console.log(`Created new video file: ${videoFileId}`)
      } else {
        console.error('No video created and no error returned')
        return NextResponse.json(
          { success: false, error: 'Failed to create video file' },
          { status: 500 }
        )
      }
    } catch (error) {
      console.error('Unexpected error during video file creation:', error)
      return NextResponse.json(
        { success: false, error: 'Unexpected error during video creation' },
        { status: 500 }
      )
    }

    // Start the video processing
    console.log(`Starting video processing for video file ID: ${videoFileId}`)
    
    const result = await processVideoFile(videoFileId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        videoFileId: videoFileId,
        message: 'Video processing started successfully'
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in video processing API:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Video processing failed',
        details: error instanceof Error ? error.stack : 'No error details'
      },
      { status: 500 }
    )
  }
}