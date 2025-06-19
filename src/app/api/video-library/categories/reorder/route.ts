// API route for reordering categories and subcategories
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { memoryCache, CACHE_KEYS } from '@/lib/memory-cache'

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

    const body = await req.json()
    const { type, items, categoryId } = body

    if (!type || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Type and items array are required' },
        { status: 400 }
      )
    }

    if (type === 'categories') {
      // Reorder categories
      const updates = items.map((item, index) => ({
        id: item.id,
        order_index: index
      }))

      // Update all categories with new order_index values
      for (const update of updates) {
        const { error } = await supabase
          .from('video_categories')
          .update({ order_index: update.order_index })
          .eq('id', update.id)

        if (error) {
          console.error('Error updating category order:', error)
          return NextResponse.json(
            { success: false, error: `Failed to update category order: ${error.message}` },
            { status: 500 }
          )
        }
      }
    } else if (type === 'subcategories') {
      // Reorder subcategories within a specific category
      
      if (!categoryId) {
        return NextResponse.json(
          { success: false, error: 'Category ID is required for subcategory reordering' },
          { status: 400 }
        )
      }

      const updates = items.map((item, index) => ({
        id: item.id,
        order_index: index
      }))

      // Update all subcategories with new order_index values
      for (const update of updates) {
        const { error } = await supabase
          .from('video_subcategories')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
          .eq('video_category_id', categoryId)

        if (error) {
          console.error('Error updating subcategory order:', error)
          return NextResponse.json(
            { success: false, error: `Failed to update subcategory order: ${error.message}` },
            { status: 500 }
          )
        }
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Must be "categories" or "subcategories"' },
        { status: 400 }
      )
    }

    // Clear category caches to force refresh with new order
    // Clear individual user caches that start with the categories summary key
    const allKeys = memoryCache.keys()
    allKeys.forEach((key: string) => {
      if (key.startsWith(CACHE_KEYS.CATEGORIES_SUMMARY)) {
        memoryCache.delete(key)
      }
    })

    return NextResponse.json({
      success: true,
      message: `${type} reordered successfully`
    })

  } catch (error) {
    console.error('Error in reorder API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}