// my-app/src/app/api/video-library/process/route.ts

import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { processVideoFile } from '@/features/videoLibrary/services/video-processing-service'

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

    const { videoFileId } = await req.json()

    if (!videoFileId) {
      return NextResponse.json(
        { success: false, error: 'Video file ID is required' },
        { status: 400 }
      )
    }

    // Verify the video file exists
    const { data: videoFile, error: videoError } = await supabase
      .from('video_files')
      .select('id, title, admin_selected')
      .eq('id', videoFileId)
      .single()

    if (videoError || !videoFile) {
      return NextResponse.json(
        { success: false, error: 'Video file not found' },
        { status: 404 }
      )
    }

    if (!videoFile.admin_selected) {
      return NextResponse.json(
        { success: false, error: 'Video must be admin selected before processing' },
        { status: 400 }
      )
    }

    // Process the video file
    const result = await processVideoFile(videoFileId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        videoFileId,
        chunkCount: result.chunkCount,
        message: 'Video processing initiated successfully'
      }
    })

  } catch (error) {
    console.error('Error in video processing API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process video' 
      },
      { status: 500 }
    )
  }
}