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
        thumbnail_url,
        thumbnail_source,
        thumbnail_color,
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
      thumbnail_url: subcategory.thumbnail_url,
      thumbnail_source: subcategory.thumbnail_source,
      thumbnail_color: subcategory.thumbnail_color,
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

    const { name, description, category_id, thumbnail_url, thumbnail_source, thumbnail_color } = await req.json()

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
        video_category_id: category_id,
        thumbnail_url: thumbnail_url || null,
        thumbnail_source: thumbnail_source || 'default',
        thumbnail_color: thumbnail_color || '#3b82f6'
      })
      .select(`
        id,
        name,
        description,
        video_category_id,
        thumbnail_url,
        thumbnail_source,
        thumbnail_color,
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
      thumbnail_url: newSubcategory.thumbnail_url,
      thumbnail_source: newSubcategory.thumbnail_source,
      thumbnail_color: newSubcategory.thumbnail_color,
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

export async function DELETE(req: Request) {
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

    const { subcategoryId, newCategoryId, newSubcategoryId } = await req.json()

    if (!subcategoryId) {
      return NextResponse.json(
        { success: false, error: 'Subcategory ID is required' },
        { status: 400 }
      )
    }

    // Check if subcategory has videos
    const { data: videos, error: videosError } = await supabase
      .from('video_files')
      .select('id')
      .eq('video_subcategory_id', subcategoryId)

    if (videosError) {
      console.error('Error checking subcategory videos:', videosError)
      return NextResponse.json(
        { success: false, error: 'Failed to check subcategory usage' },
        { status: 500 }
      )
    }

    // If there are videos, reassign them if new category is provided
    if (videos && videos.length > 0) {
      if (!newCategoryId) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot delete subcategory that contains videos. Please provide a new category to reassign videos to.',
            requiresReassignment: true,
            videoCount: videos.length
          },
          { status: 400 }
        )
      }

      // Reassign videos to new category/subcategory
      const { error: reassignError } = await supabase
        .from('video_files')
        .update({ 
          video_category_id: newCategoryId,
          video_subcategory_id: newSubcategoryId || null
        })
        .eq('video_subcategory_id', subcategoryId)

      if (reassignError) {
        console.error('Error reassigning videos:', reassignError)
        return NextResponse.json(
          { success: false, error: `Failed to reassign videos: ${reassignError.message}` },
          { status: 500 }
        )
      }
    }

    // Delete the subcategory
    const { error: deleteError } = await supabase
      .from('video_subcategories')
      .delete()
      .eq('id', subcategoryId)

    if (deleteError) {
      console.error('Error deleting subcategory:', deleteError)
      return NextResponse.json(
        { success: false, error: `Failed to delete subcategory: ${deleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Subcategory deleted successfully'
    })

  } catch (error) {
    console.error('Error in video subcategory deletion API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
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

    const { id, name, description, category_id, thumbnail_url, thumbnail_source, thumbnail_color } = await req.json()

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Subcategory ID is required' },
        { status: 400 }
      )
    }

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

    // Update the subcategory
    const { data: newSubcategory, error } = await supabase
      .from('video_subcategories')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        video_category_id: category_id,
        thumbnail_url: thumbnail_url || null,
        thumbnail_source: thumbnail_source || 'default',
        thumbnail_color: thumbnail_color || '#6366f1'
      })
      .eq('id', id)
      .select(`
        id,
        name,
        description,
        video_category_id,
        thumbnail_url,
        thumbnail_source,
        thumbnail_color,
        created_at,
        video_categories (
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error('Error updating video subcategory:', error)
      return NextResponse.json(
        { success: false, error: `Failed to update subcategory: ${error.message}` },
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
      thumbnail_url: newSubcategory.thumbnail_url,
      thumbnail_source: newSubcategory.thumbnail_source,
      thumbnail_color: newSubcategory.thumbnail_color,
      created_at: newSubcategory.created_at
    }

    return NextResponse.json({
      success: true,
      data: processedSubcategory
    })

  } catch (error) {
    console.error('Error in video subcategory update API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}