import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Fetch season titles for the series
    const { data: seasons, error } = await supabase
      .from('series_seasons')
      .select('season_number, title')
      .eq('series_id', id)
      .order('season_number')

    if (error) {
      console.error('Error fetching season titles:', error)
      return NextResponse.json(
        { success: false, error: `Failed to fetch season titles: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: seasons || []
    })

  } catch (error) {
    console.error('Error in seasons GET API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const { season_number, title } = await req.json()

    if (!season_number || typeof season_number !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Season number is required and must be a number' },
        { status: 400 }
      )
    }

    // Upsert the season title
    const { data: updatedSeason, error } = await supabase
      .from('series_seasons')
      .upsert({
        series_id: id,
        season_number,
        title: title?.trim() || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'series_id,season_number'
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating season title:', error)
      return NextResponse.json(
        { success: false, error: `Failed to update season title: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedSeason
    })

  } catch (error) {
    console.error('Error in seasons PUT API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}