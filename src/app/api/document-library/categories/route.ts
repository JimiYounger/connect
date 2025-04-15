// src/app/api/document-library/categories/route.ts
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

/**
 * GET - Fetch all document categories
 */
export async function GET() {
  try {
    // Get the authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch categories
    const { data, error } = await supabase
      .from('document_categories')
      .select('id, name')
      .order('name')

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json(
        { success: false, error: `Failed to fetch categories: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Error in categories API:', error)
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
 * POST - Create a new category
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    const { name, description } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
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

    // Only admins can create categories
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin privileges required to create categories' },
        { status: 403 }
      )
    }

    // Check if category already exists with this name
    const { data: existingCategory, error: existingError } = await supabase
      .from('document_categories')
      .select('id')
      .ilike('name', name)
      .maybeSingle()

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category with this name already exists' },
        { status: 409 }
      )
    }

    // Create the category
    const { data, error } = await supabase
      .from('document_categories')
      .insert({
        name: name.trim(),
        description: description || null
      })
      .select('id, name')
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return NextResponse.json(
        { success: false, error: `Failed to create category: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    }, { status: 201 })
  } catch (error) {
    console.error('Error in create category API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}