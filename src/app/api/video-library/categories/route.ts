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

    // Fetch categories with subcategories
    const { data: categories, error } = await supabase
      .from('video_categories')
      .select(`
        id,
        name,
        description,
        thumbnail_url,
        thumbnail_source,
        thumbnail_color,
        created_at,
        updated_at,
        video_subcategories (
          id,
          name,
          description,
          thumbnail_url,
          thumbnail_source,
          thumbnail_color
        )
      `)
      .order('name')

    if (error) {
      console.error('Error fetching video categories:', error)
      return NextResponse.json(
        { success: false, error: `Failed to fetch categories: ${error.message}` },
        { status: 500 }
      )
    }

    // OPTIMIZATION: Get video counts in bulk to avoid N+1 queries
    const categoryIds = categories.map(cat => cat.id)
    const allSubcategoryIds = categories.flatMap(cat => 
      (cat.video_subcategories || []).map((sub: any) => sub.id)
    )

    // Bulk fetch category video counts
    const { data: categoryVideos } = await supabase
      .from('video_files')
      .select('video_category_id')
      .in('video_category_id', categoryIds)

    // Create category count map
    const categoryCountMap = new Map<string, number>()
    categoryVideos?.forEach(video => {
      if (video.video_category_id) {
        const currentCount = categoryCountMap.get(video.video_category_id) || 0
        categoryCountMap.set(video.video_category_id, currentCount + 1)
      }
    })

    // Bulk fetch subcategory video counts
    const { data: subcategoryVideos } = await supabase
      .from('video_files')
      .select('video_subcategory_id')
      .in('video_subcategory_id', allSubcategoryIds)

    // Create subcategory count map
    const subcategoryCountMap = new Map<string, number>()
    subcategoryVideos?.forEach(video => {
      if (video.video_subcategory_id) {
        const currentCount = subcategoryCountMap.get(video.video_subcategory_id) || 0
        subcategoryCountMap.set(video.video_subcategory_id, currentCount + 1)
      }
    })

    // Process categories using pre-fetched counts
    const processedCategories = categories.map(category => {
      const categoryVideoCount = categoryCountMap.get(category.id) || 0

      // Process subcategories with their video counts
      const subcategoriesWithCounts = (category.video_subcategories || []).map((sub: any) => {
        const subVideoCount = subcategoryCountMap.get(sub.id) || 0

        return {
          id: sub.id,
          name: sub.name,
          description: sub.description,
          thumbnail_url: sub.thumbnail_url,
          thumbnail_source: sub.thumbnail_source,
          thumbnail_color: sub.thumbnail_color,
          category_id: category.id,
          video_count: subVideoCount
        }
      })

      return {
        id: category.id,
        name: category.name,
        description: category.description,
        thumbnail_url: category.thumbnail_url,
        thumbnail_source: category.thumbnail_source,
        thumbnail_color: category.thumbnail_color,
        created_at: category.created_at,
        updated_at: category.updated_at,
        video_count: categoryVideoCount,
        subcategories: subcategoriesWithCounts
      }
    })

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

    const { name, description, thumbnail_url, thumbnail_source, thumbnail_color } = await req.json()

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
        description: description?.trim() || null,
        thumbnail_url: thumbnail_url || null,
        thumbnail_source: thumbnail_source || 'default',
        thumbnail_color: thumbnail_color || '#3b82f6'
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

    const { categoryId, newCategoryId, newSubcategoryId } = await req.json()

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // Check if category has videos
    const { data: videos, error: videosError } = await supabase
      .from('video_files')
      .select('id')
      .eq('video_category_id', categoryId)

    if (videosError) {
      console.error('Error checking category videos:', videosError)
      return NextResponse.json(
        { success: false, error: 'Failed to check category usage' },
        { status: 500 }
      )
    }

    // If there are videos, reassign them if new category is provided
    if (videos && videos.length > 0) {
      if (!newCategoryId) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot delete category that contains videos. Please provide a new category to reassign videos to.',
            requiresReassignment: true,
            videoCount: videos.length
          },
          { status: 400 }
        )
      }

      // Reassign videos to new category
      const { error: reassignError } = await supabase
        .from('video_files')
        .update({ 
          video_category_id: newCategoryId,
          video_subcategory_id: newSubcategoryId || null
        })
        .eq('video_category_id', categoryId)

      if (reassignError) {
        console.error('Error reassigning videos:', reassignError)
        return NextResponse.json(
          { success: false, error: `Failed to reassign videos: ${reassignError.message}` },
          { status: 500 }
        )
      }
    }

    // Delete all subcategories first
    const { error: subcategoriesError } = await supabase
      .from('video_subcategories')
      .delete()
      .eq('video_category_id', categoryId)

    if (subcategoriesError) {
      console.error('Error deleting subcategories:', subcategoriesError)
      return NextResponse.json(
        { success: false, error: `Failed to delete subcategories: ${subcategoriesError.message}` },
        { status: 500 }
      )
    }

    // Delete the category
    const { error: deleteError } = await supabase
      .from('video_categories')
      .delete()
      .eq('id', categoryId)

    if (deleteError) {
      console.error('Error deleting category:', deleteError)
      return NextResponse.json(
        { success: false, error: `Failed to delete category: ${deleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Category and its subcategories deleted successfully'
    })

  } catch (error) {
    console.error('Error in video category deletion API:', error)
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

    const { id, name, description, thumbnail_url, thumbnail_source, thumbnail_color } = await req.json()

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      )
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      )
    }

    // Update the category
    const { data: category, error } = await supabase
      .from('video_categories')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        thumbnail_url: thumbnail_url || null,
        thumbnail_source: thumbnail_source || 'default',
        thumbnail_color: thumbnail_color || '#3b82f6'
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating video category:', error)
      return NextResponse.json(
        { success: false, error: `Failed to update category: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: category
    })

  } catch (error) {
    console.error('Error in video category update API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}