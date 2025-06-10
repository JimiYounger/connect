// my-app/src/app/api/video-library/vimeo/list/route.ts

import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const VIMEO_API_URL = 'https://api.vimeo.com'

export async function GET(req: Request) {
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

    // Parse query parameters
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('per_page') || '25')

    // Validate parameters
    if (page < 1 || perPage < 1 || perPage > 50) {
      return NextResponse.json(
        { success: false, error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    // Check for Vimeo API token
    if (!process.env.VIMEO_ACCESS_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Vimeo API token not configured. Please set VIMEO_ACCESS_TOKEN environment variable.' },
        { status: 500 }
      )
    }

    // Build Vimeo API parameters
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      sort: 'date',
      direction: 'desc'
    })

    // Fetch videos directly from Vimeo API
    const vimeoApiResponse = await fetch(`${VIMEO_API_URL}/me/videos?${params.toString()}`, {
      headers: {
        'Authorization': `bearer ${process.env.VIMEO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.vimeo.*+json;version=3.4'
      }
    })

    if (!vimeoApiResponse.ok) {
      const errorText = await vimeoApiResponse.text()
      console.error('Vimeo API error:', vimeoApiResponse.status, errorText)
      
      let errorMessage = 'Failed to fetch videos from Vimeo'
      if (vimeoApiResponse.status === 401) {
        errorMessage = 'Vimeo API authentication failed. Please check your VIMEO_ACCESS_TOKEN.'
      } else if (vimeoApiResponse.status === 403) {
        errorMessage = 'Access denied to Vimeo API. Please check your token permissions.'
      } else if (vimeoApiResponse.status === 429) {
        errorMessage = 'Vimeo API rate limit exceeded. Please try again later.'
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: vimeoApiResponse.status }
      )
    }

    const vimeoResponse = await vimeoApiResponse.json()

    if (!vimeoResponse || !vimeoResponse.data) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch videos from Vimeo' },
        { status: 500 }
      )
    }

    // Get existing video files to check which are already imported
    const vimeoIds = vimeoResponse.data.map(video => 
      video.uri.replace('/videos/', '')
    ).filter(Boolean)

    const { data: existingVideos } = await supabase
      .from('video_files')
      .select('vimeo_id, admin_selected, library_status')
      .in('vimeo_id', vimeoIds)

    const existingVideoMap = new Map(
      existingVideos?.map(v => [v.vimeo_id, v]) || []
    )

    // Process Vimeo videos and add import status
    const processedVideos = vimeoResponse.data.map(video => {
      const vimeoId = video.uri.replace('/videos/', '')
      const existing = existingVideoMap.get(vimeoId)
      
      return {
        vimeoId,
        uri: video.uri,
        name: video.name,
        description: video.description,
        duration: video.duration,
        width: video.width,
        height: video.height,
        status: video.status,
        created_time: video.created_time,
        modified_time: video.modified_time,
        pictures: video.pictures,
        link: video.link,
        player_embed_url: video.player_embed_url,
        // Import status fields
        isImported: !!existing,
        adminSelected: existing?.admin_selected || false,
        libraryStatus: existing?.library_status || null
      }
    })

    return NextResponse.json({
      success: true,
      data: processedVideos,
      total: vimeoResponse.total,
      page: vimeoResponse.page,
      per_page: vimeoResponse.per_page,
      paging: vimeoResponse.paging
    })

  } catch (error) {
    console.error('Error fetching Vimeo videos:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to fetch videos from Vimeo'
    if (error instanceof Error) {
      errorMessage = error.message
      // Check for common issues
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'Vimeo API authentication failed. Please check your VIMEO_ACCESS_TOKEN.'
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        errorMessage = 'Access denied to Vimeo API. Please check your token permissions.'
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error connecting to Vimeo API. Please check your connection.'
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    )
  }
}