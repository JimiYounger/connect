// my-app/src/app/api/video-library/series/route.ts

import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
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

    // Fetch series with enhanced metadata
    const { data: series, error } = await supabase
      .from('video_series')
      .select(`
        id,
        name,
        description,
        series_type,
        has_seasons,
        thumbnail_url,
        thumbnail_source,
        thumbnail_color,
        is_public,
        is_active,
        content_count,
        total_duration,
        tags,
        created_at,
        updated_at,
        order_index
      `)
      .order('name')

    if (error) {
      console.error('Error fetching video series:', error)
      return NextResponse.json(
        { success: false, error: `Failed to fetch series: ${error.message}` },
        { status: 500 }
      )
    }

    // Process the data to include all new fields
    const processedSeries = series

    return NextResponse.json({
      success: true,
      data: processedSeries
    })

  } catch (error) {
    console.error('Error in video series API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
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

    const { 
      name, 
      description, 
      series_type = 'playlist', 
      has_seasons = false,
      thumbnail_url,
      thumbnail_source = 'default',
      thumbnail_color = '#3b82f6',
      is_public = false,
      is_active = true,
      tags
    } = await req.json()

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Series name is required' },
        { status: 400 }
      )
    }

    // Validate series_type
    const validTypes = ['playlist', 'course', 'collection']
    if (series_type && !validTypes.includes(series_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid series type. Must be: playlist, course, or collection' },
        { status: 400 }
      )
    }

    // Create the series
    const { data: newSeries, error } = await supabase
      .from('video_series')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        series_type,
        has_seasons,
        thumbnail_url: thumbnail_url?.trim() || null,
        thumbnail_source,
        thumbnail_color,
        is_public,
        is_active,
        tags: tags || [],
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating video series:', error)
      return NextResponse.json(
        { success: false, error: `Failed to create series: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: newSeries
    })

  } catch (error) {
    console.error('Error in video series creation API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}