// /src/app/api/document-library/delete/[id]/route.ts
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get document ID from route params
    const documentId = params.id
    
    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
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
    
    // Get document with versions
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select(`
        id, 
        title,
        uploaded_by,
        document_versions (
          id, 
          file_path
        )
      `)
      .eq('id', documentId)
      .single()
    
    if (documentError || !document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }
    
    // Only allow deletion if user is an admin or the document uploader
    const isAdmin = userProfile.role_type === 'admin' || userProfile.role_type === 'Admin'
    const isUploader = document.uploaded_by === userProfile.id
    
    if (!isAdmin && !isUploader) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete this document' },
        { status: 403 }
      )
    }
    
    // Now delete the document and all related data
    
    // 1. Delete document chunks for all versions
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId)
    
    if (chunksError) {
      console.error('Error deleting document chunks:', chunksError)
      // Continue anyway, as this is not critical
    }
    
    // 2. Delete document content
    const { error: contentError } = await supabase
      .from('document_content')
      .delete()
      .eq('document_id', documentId)
    
    if (contentError) {
      console.error('Error deleting document content:', contentError)
      // Continue anyway, as this is not critical
    }
    
    // 3. Delete tag assignments
    const { error: tagAssignmentsError } = await supabase
      .from('document_tag_assignments')
      .delete()
      .eq('document_id', documentId)
    
    if (tagAssignmentsError) {
      console.error('Error deleting tag assignments:', tagAssignmentsError)
      // Continue anyway, as this is not critical
    }
    
    // 4. Delete visibility settings
    const { error: visibilityError } = await supabase
      .from('document_visibility')
      .delete()
      .eq('document_id', documentId)
    
    if (visibilityError) {
      console.error('Error deleting visibility settings:', visibilityError)
      // Continue anyway, as this is not critical
    }
    
    // 5. Delete files from storage
    if (document.document_versions && document.document_versions.length > 0) {
      const filePaths = document.document_versions
        .map(v => v.file_path)
        .filter(Boolean) // Remove any undefined or null paths
      
      if (filePaths.length > 0) {
        const { error: storageError } = await supabase
          .storage
          .from('documents')
          .remove(filePaths)
        
        if (storageError) {
          console.error('Error deleting files from storage:', storageError)
          // Continue anyway, as this is not critical
        }
      }
    }
    
    // 6. Delete versions
    const { error: versionsError } = await supabase
      .from('document_versions')
      .delete()
      .eq('document_id', documentId)
    
    if (versionsError) {
      console.error('Error deleting document versions:', versionsError)
      // Continue anyway, as this is not critical
    }
    
    // 7. Finally delete the document itself
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
    
    if (deleteError) {
      return NextResponse.json(
        { success: false, error: `Failed to delete document: ${deleteError.message}` },
        { status: 500 }
      )
    }
    
    // Log the deletion activity
    await supabase
      .from('activity_logs')
      .insert({
        type: 'document',
        action: 'delete',
        user_id: userProfile.id,
        status: 'success',
        details: {
          document_id: documentId,
          title: document.title
        },
        metadata: {
          document_id: documentId
        },
        timestamp: Date.now(),
      })
    
    return NextResponse.json({
      success: true,
      data: {
        id: documentId,
        message: 'Document deleted successfully'
      }
    })
    
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}