// src/app/api/document-library/tags/route.ts
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

/**
 * GET - Fetch all document tags
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

    // Fetch tags
    const { data, error } = await supabase
      .from('document_tags')
      .select('id, name')
      .order('name')

    if (error) {
      console.error('Error fetching tags:', error)
      return NextResponse.json(
        { success: false, error: `Failed to fetch tags: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Error in tags API:', error)
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
 * POST - Create a new tag
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    const { name } = body

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

    // Check if tag already exists with this name
    const { data: existingTag, error: existingError } = await supabase
      .from('document_tags')
      .select('id')
      .ilike('name', name)
      .maybeSingle()

    if (existingTag) {
      return NextResponse.json(
        { success: false, error: 'Tag with this name already exists' },
        { status: 409 }
      )
    }

    // Create the tag
    const { data, error } = await supabase
      .from('document_tags')
      .insert({
        name: name.trim()
      })
      .select('id, name')
      .single()

    if (error) {
      console.error('Error creating tag:', error)
      return NextResponse.json(
        { success: false, error: `Failed to create tag: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    }, { status: 201 })
  } catch (error) {
    console.error('Error in create tag API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}