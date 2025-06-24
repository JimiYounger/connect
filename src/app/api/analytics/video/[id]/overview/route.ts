import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { VideoAnalyticsService } from '@/features/analytics/services/video-analytics-service'
import { validateUUID } from '@/lib/validation'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: Fetch overview statistics for a specific video
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
      .select('role_type')
      .eq('user_id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if user has admin access
    if (userProfile.role_type?.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required for analytics' },
        { status: 403 }
      )
    }

    // Verify video exists and get details
    const { data: video } = await supabase
      .from('video_files')
      .select('id, title, vimeo_duration')
      .eq('id', videoId)
      .single()

    if (!video) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )  
    }

    // Get timeframe from query params (default 30 days)
    const url = new URL(req.url)
    const timeframe = parseInt(url.searchParams.get('timeframe') || '30')
    
    // Fetch video overview statistics
    const overview = await VideoAnalyticsService.getVideoOverview(videoId, timeframe)

    if (!overview) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch video statistics' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        videoId,
        videoTitle: video.title,
        videoDuration: video.vimeo_duration,
        statistics: overview
      }
    })

  } catch (error) {
    console.error('Error in video overview API:', error)
    
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