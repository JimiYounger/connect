// my-app/src/app/api/video-library/tags/route.ts

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

    // Fetch tags with count of videos
    const { data: tags, error } = await supabase
      .from('video_tags')
      .select(`
        id,
        name,
        description,
        created_at,
        updated_at,
        video_tag_assignments (count)
      `)
      .order('name')

    if (error) {
      console.error('Error fetching video tags:', error)
      return NextResponse.json(
        { success: false, error: `Failed to fetch tags: ${error.message}` },
        { status: 500 }
      )
    }

    // Process the data to include counts
    const processedTags = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      description: tag.description,
      created_at: tag.created_at,
      updated_at: tag.updated_at,
      video_count: Array.isArray(tag.video_tag_assignments) ? tag.video_tag_assignments.length : 0
    }))

    return NextResponse.json({
      success: true,
      data: processedTags
    })

  } catch (error) {
    console.error('Error in video tags API:', error)
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
        { success: false, error: 'Tag name is required' },
        { status: 400 }
      )
    }

    // Create the tag
    const { data: newTag, error } = await supabase
      .from('video_tags')
      .insert({
        name: name.trim(),
        description: description?.trim() || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating video tag:', error)
      return NextResponse.json(
        { success: false, error: `Failed to create tag: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: newTag
    })

  } catch (error) {
    console.error('Error in video tag creation API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}