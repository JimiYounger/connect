// my-app/src/app/api/video-library/categories/route.ts

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

    // Fetch categories with subcategories and count of videos
    const { data: categories, error } = await supabase
      .from('video_categories')
      .select(`
        id,
        name,
        description,
        created_at,
        updated_at,
        video_subcategories (
          id,
          name,
          description,
          video_files (count)
        ),
        video_files (count)
      `)
      .order('name')

    if (error) {
      console.error('Error fetching video categories:', error)
      return NextResponse.json(
        { success: false, error: `Failed to fetch categories: ${error.message}` },
        { status: 500 }
      )
    }

    // Process the data to include counts
    const processedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      created_at: category.created_at,
      updated_at: category.updated_at,
      video_count: Array.isArray(category.video_files) ? category.video_files.length : 0,
      subcategories: category.video_subcategories.map((sub: any) => ({
        id: sub.id,
        name: sub.name,
        description: sub.description,
        video_count: Array.isArray(sub.video_files) ? sub.video_files.length : 0
      }))
    }))

    return NextResponse.json({
      success: true,
      data: processedCategories,
      categories: processedCategories // Also include as 'categories' for backward compatibility
    })

  } catch (error) {
    console.error('Error in video categories API:', error)
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
        { success: false, error: 'Category name is required' },
        { status: 400 }
      )
    }

    // Create the category
    const { data: category, error } = await supabase
      .from('video_categories')
      .insert({
        name: name.trim(),
        description: description?.trim() || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating video category:', error)
      return NextResponse.json(
        { success: false, error: `Failed to create category: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: category
    })

  } catch (error) {
    console.error('Error in video category creation API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}