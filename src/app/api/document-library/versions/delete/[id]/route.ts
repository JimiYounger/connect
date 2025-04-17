// /src/app/api/document-library/versions/delete/[id]/route.ts
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get version ID from route params
    const { id: versionId } = await params;
    
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
      .select('id, document_id, file_path')
      .eq('id', versionId)
      .single()
    
    if (versionError || !version || !version.document_id) {
      return NextResponse.json(
        { success: false, error: 'Version not found or has no associated document' },
        { status: 404 }
      )
    }
    
    // Check if document exists and user has permissions to edit
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('id, uploaded_by, current_version_id')
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
        { success: false, error: 'You do not have permission to delete this version' },
        { status: 403 }
      )
    }
    
    // Prevent deletion of the active version
    if (document.current_version_id === versionId) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the active version' },
        { status: 400 }
      )
    }
    
    // Now delete the version and related data
    // 1. Delete chunks associated with this version
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .delete()
      .eq('version_id', versionId)
    
    if (chunksError) {
      console.error('Error deleting document chunks:', chunksError)
      // Continue anyway, as this is not critical
    }
    
    // 2. Delete the version record
    const { error: deleteError } = await supabase
      .from('document_versions')
      .delete()
      .eq('id', versionId)
    
    if (deleteError) {
      return NextResponse.json(
        { success: false, error: `Failed to delete version: ${deleteError.message}` },
        { status: 500 }
      )
    }
    
    // 3. Delete the file from storage (if path exists)
    if (version.file_path) {
      const { error: storageError } = await supabase
        .storage
        .from('documents')
        .remove([version.file_path])
      
      if (storageError) {
        console.error('Error deleting file from storage:', storageError)
        // Don't fail the entire operation if storage deletion fails
      }
    }
    
    // Log the deletion activity
    await supabase
      .from('activity_logs')
      .insert({
        type: 'document',
        action: 'delete_version',
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
        message: 'Document version deleted successfully'
      }
    })
    
  } catch (error) {
    console.error('Error deleting document version:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}