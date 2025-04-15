// /src/app/api/document-library/versions/set-active/[id]/route.ts
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get version ID from route params
    const versionId = params.id
    
    if (!versionId) {
      return NextResponse.json(
        { success: false, error: 'Version ID is required' },
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
    
    // Get user profile for permission check
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
    
    // Fetch the version to get the document ID
    const { data: version, error: versionError } = await supabase
      .from('document_versions')
      .select('id, document_id')
      .eq('id', versionId)
      .single()
    
    if (versionError || !version) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      )
    }
    
    // Check if document exists and user has permissions to edit
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('id, uploaded_by')
      .eq('id', version.document_id)
      .single()
    
    if (documentError || !document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }
    
    // Only allow editing if user is an admin or the document uploader
    const isAdmin = userProfile.role_type === 'admin' || userProfile.role_type === 'Admin'
    const isUploader = document.uploaded_by === userProfile.id
    
    if (!isAdmin && !isUploader) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to change the active version' },
        { status: 403 }
      )
    }
    
    // Update the document with the new active version
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        current_version_id: versionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', version.document_id)
    
    if (updateError) {
      return NextResponse.json(
        { success: false, error: `Failed to update document: ${updateError.message}` },
        { status: 500 }
      )
    }
    
    // Log the update activity
    await supabase
      .from('activity_logs')
      .insert({
        type: 'document',
        action: 'set_active_version',
        user_id: userProfile.id,
        status: 'success',
        details: {
          document_id: document.id,
          version_id: versionId
        },
        metadata: {
          document_id: document.id,
          version_id: versionId
        },
        timestamp: Date.now(),
      })
    
    return NextResponse.json({
      success: true,
      data: {
        id: versionId,
        document_id: version.document_id,
        message: 'Active version updated successfully'
      }
    })
    
  } catch (error) {
    console.error('Error updating active version:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}