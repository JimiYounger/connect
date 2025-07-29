// API route for creating/updating LTD document custom metadata
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { LTD_CONSTANTS } from '@/features/ltd/types'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { document_id, presented_by, meeting_date } = body

    if (!document_id) {
      return NextResponse.json(
        { success: false, error: 'document_id is required' },
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

    // Get user profile to check admin permissions
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id, role_type')
      .eq('user_id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if user is admin
    if (!userProfile.role_type || userProfile.role_type.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Verify the document exists and is a Leadership Training > Decks document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, document_category_id, document_subcategory_id')
      .eq('id', document_id)
      .eq('document_category_id', LTD_CONSTANTS.CATEGORY_ID)
      .eq('document_subcategory_id', LTD_CONSTANTS.SUBCATEGORY_ID)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { success: false, error: 'Document not found or not a Leadership Training Deck' },
        { status: 404 }
      )
    }

    // Upsert the custom metadata (insert or update if exists)
    const { data, error } = await (supabase as any)
      .from('document_custom_metadata')
      .upsert({
        document_id,
        metadata_type: LTD_CONSTANTS.METADATA_TYPE,
        presented_by: presented_by || null,
        meeting_date: meeting_date || null,
        created_by: userProfile.id,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'document_id,metadata_type'
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting custom metadata:', error)
      return NextResponse.json(
        { success: false, error: `Failed to save metadata: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })
    
  } catch (error) {
    console.error('Error in LTD metadata API:', error)
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
  // PUT uses the same logic as POST for upsert behavior
  return POST(req)
}