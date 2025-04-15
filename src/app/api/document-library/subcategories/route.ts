// src/app/api/document-library/subcategories/route.ts
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

/**
 * GET - Fetch subcategories for a specific category
 */
export async function GET(request: Request) {
  try {
    // Get category ID from URL params
    const url = new URL(request.url)
    const categoryId = url.searchParams.get('categoryId')

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // Get the authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch subcategories for the specified category
    const { data, error } = await supabase
      .from('document_subcategories')
      .select('id, name, document_category_id, description')
      .eq('document_category_id', categoryId)
      .order('name')

    if (error) {
      console.error('Error fetching subcategories:', error)
      return NextResponse.json(
        { success: false, error: `Failed to fetch subcategories: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Error in subcategories API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new subcategory
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    const { name, document_category_id, description } = body

    // Validate required fields
    if (!name || !document_category_id) {
      return NextResponse.json(
        { success: false, error: 'Name and category ID are required' },
        { status: 400 }
      )
    }

    // Get the authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has admin privileges
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role_type')
      .eq('user_id', user.id)
      .single()

    const isAdmin = userProfile?.role_type?.toLowerCase() === 'admin'

    // Only admins can create subcategories
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin privileges required to create subcategories' },
        { status: 403 }
      )
    }

    // Check if category exists
    const { data: categoryExists, error: categoryError } = await supabase
      .from('document_categories')
      .select('id')
      .eq('id', document_category_id)
      .single()

    if (categoryError || !categoryExists) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if subcategory already exists with this name in this category
    const { data: existingSubcategory, error: existingError } = await supabase
      .from('document_subcategories')
      .select('id')
      .eq('document_category_id', document_category_id)
      .ilike('name', name)
      .maybeSingle()

    if (existingSubcategory) {
      return NextResponse.json(
        { success: false, error: 'Subcategory with this name already exists in this category' },
        { status: 409 }
      )
    }

    // Create the subcategory
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('document_subcategories')
      .insert({
        name: name.trim(),
        document_category_id,
        description: description || null,
        created_at: now,
        updated_at: now
      })
      .select('id, name, document_category_id, description')
      .single()

    if (error) {
      console.error('Error creating subcategory:', error)
      return NextResponse.json(
        { success: false, error: `Failed to create subcategory: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    }, { status: 201 })
  } catch (error) {
    console.error('Error in create subcategory API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}