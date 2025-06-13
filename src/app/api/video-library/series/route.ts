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

    // Fetch series with count of videos
    const { data: series, error } = await supabase
      .from('video_series')
      .select(`
        id,
        name,
        description,
        created_at,
        updated_at,
        video_files (count)
      `)
      .order('name')

    if (error) {
      console.error('Error fetching video series:', error)
      return NextResponse.json(
        { success: false, error: `Failed to fetch series: ${error.message}` },
        { status: 500 }
      )
    }

    // Process the data to include counts
    const processedSeries = series.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      created_at: s.created_at,
      updated_at: s.updated_at,
      video_count: Array.isArray(s.video_files) ? s.video_files.length : 0
    }))

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

    const { name, description } = await req.json()

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Series name is required' },
        { status: 400 }
      )
    }

    // Create the series
    const { data: newSeries, error } = await supabase
      .from('video_series')
      .insert({
        name: name.trim(),
        description: description?.trim() || null
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