// API route for deleting LTD document custom metadata
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Metadata ID is required' },
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

    // Verify the metadata exists before deleting
    const { data: existingMetadata, error: checkError } = await (supabase as any)
      .from('document_custom_metadata')
      .select('id, document_id')
      .eq('id', id)
      .single()

    if (checkError || !existingMetadata) {
      return NextResponse.json(
        { success: false, error: 'Metadata not found' },
        { status: 404 }
      )
    }

    // Delete the metadata
    const { error } = await (supabase as any)
      .from('document_custom_metadata')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting custom metadata:', error)
      return NextResponse.json(
        { success: false, error: `Failed to delete metadata: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Metadata deleted successfully'
    })
    
  } catch (error) {
    console.error('Error in LTD metadata delete API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}