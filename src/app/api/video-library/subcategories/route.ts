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

    // Fetch subcategories with their parent categories
    const { data: subcategories, error } = await supabase
      .from('video_subcategories')
      .select(`
        id,
        name,
        description,
        video_category_id,
        created_at,
        video_categories (
          id,
          name
        )
      `)
      .order('name')

    if (error) {
      console.error('Error fetching video subcategories:', error)
      return NextResponse.json(
        { success: false, error: `Failed to fetch subcategories: ${error.message}` },
        { status: 500 }
      )
    }

    // Process the data to flatten the structure
    const processedSubcategories = subcategories.map(subcategory => ({
      id: subcategory.id,
      name: subcategory.name,
      description: subcategory.description,
      category_id: subcategory.video_category_id,
      category: subcategory.video_categories,
      created_at: subcategory.created_at
    }))

    return NextResponse.json({
      success: true,
      data: processedSubcategories
    })

  } catch (error) {
    console.error('Error in video subcategories API:', error)
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

    const { name, description, category_id } = await req.json()

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Subcategory name is required' },
        { status: 400 }
      )
    }

    if (!category_id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // Create the subcategory
    const { data: newSubcategory, error } = await supabase
      .from('video_subcategories')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        video_category_id: category_id
      })
      .select(`
        id,
        name,
        description,
        video_category_id,
        created_at,
        video_categories (
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error('Error creating video subcategory:', error)
      return NextResponse.json(
        { success: false, error: `Failed to create subcategory: ${error.message}` },
        { status: 500 }
      )
    }

    // Process the response to match expected format
    const processedSubcategory = {
      id: newSubcategory.id,
      name: newSubcategory.name,
      description: newSubcategory.description,
      category_id: newSubcategory.video_category_id,
      category: newSubcategory.video_categories,
      created_at: newSubcategory.created_at
    }

    return NextResponse.json({
      success: true,
      data: processedSubcategory
    })

  } catch (error) {
    console.error('Error in video subcategory creation API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}