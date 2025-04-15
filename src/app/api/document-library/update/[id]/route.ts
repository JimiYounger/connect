// /src/app/api/document-library/update/[id]/route.ts
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

interface DocumentUpdateData {
  title?: string
  description?: string | null
  category_id?: string
  tags?: { id: string; name: string }[]
  visibility?: {
    roleTypes?: string[]
    teams?: string[]
    areas?: string[]
    regions?: string[]
  }
}

export async function PATCH(
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
    
    // Parse the request body
    const updateData: DocumentUpdateData = await request.json()
    
    // Validate the update data
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No update data provided' },
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
    
    // Check if document exists and user has permissions to edit
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('id, uploaded_by')
      .eq('id', documentId)
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
        { success: false, error: 'You do not have permission to edit this document' },
        { status: 403 }
      )
    }
    
    // Perform all updates with direct Supabase operations
    const timestamp = new Date().toISOString()
    let hasError = false
    let errorMessage = ''
    
    // 1. Update the document record
    if (updateData.title || updateData.description || updateData.category_id) {
      const updateFields: any = {
        updated_at: timestamp
      }
      
      if (updateData.title) updateFields.title = updateData.title
      if (updateData.description !== undefined) updateFields.description = updateData.description
      if (updateData.category_id) updateFields.category_id = updateData.category_id
      
      const { error } = await supabase
        .from('documents')
        .update(updateFields)
        .eq('id', documentId)
      
      if (error) {
        hasError = true
        errorMessage = `Failed to update document: ${error.message}`
        console.error('Error updating document:', error)
      }
    }
    
    // 2. Update tags if provided
    if (!hasError && updateData.tags !== undefined) {
      // First delete existing tag assignments
      const { error: deleteError } = await supabase
        .from('document_tag_assignments')
        .delete()
        .eq('document_id', documentId)
      
      if (deleteError) {
        hasError = true
        errorMessage = `Failed to update tags: ${deleteError.message}`
        console.error('Error deleting existing tags:', deleteError)
      } else if (updateData.tags.length > 0) {
        // Then insert new tag assignments
        const tagAssignments = updateData.tags.map(tag => ({
          document_id: documentId,
          tag_id: tag.id
        }))
        
        const { error: insertError } = await supabase
          .from('document_tag_assignments')
          .insert(tagAssignments)
        
        if (insertError) {
          hasError = true
          errorMessage = `Failed to update tags: ${insertError.message}`
          console.error('Error inserting new tags:', insertError)
        }
      }
    }
    
    // 3. Update visibility settings if provided
    if (!hasError && updateData.visibility !== undefined) {
      // Format visibility conditions
      const conditions = formatVisibilityConditions(updateData.visibility)
      
      // Delete existing visibility settings
      const { error: deleteVisibilityError } = await supabase
        .from('document_visibility')
        .delete()
        .eq('document_id', documentId)
      
      if (deleteVisibilityError) {
        hasError = true
        errorMessage = `Failed to update visibility: ${deleteVisibilityError.message}`
        console.error('Error deleting existing visibility:', deleteVisibilityError)
      } else if (conditions && Object.keys(conditions).length > 0) {
        // Insert new visibility settings if there are conditions
        const { error: insertVisibilityError } = await supabase
          .from('document_visibility')
          .insert({
            document_id: documentId,
            conditions
          })
        
        if (insertVisibilityError) {
          hasError = true
          errorMessage = `Failed to update visibility: ${insertVisibilityError.message}`
          console.error('Error inserting new visibility:', insertVisibilityError)
        }
      }
    }
    
    // If any operation failed, return error
    if (hasError) {
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      )
    }
    
    // Log the update activity
    await supabase
      .from('activity_logs')
      .insert({
        type: 'document',
        action: 'update',
        user_id: userProfile.id,
        status: 'success',
        details: {
          document_id: documentId,
          changes: Object.keys(updateData).join(', ')
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
        message: 'Document updated successfully'
      }
    })
    
  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

// Helper function to format visibility conditions for database storage
function formatVisibilityConditions(visibility: DocumentUpdateData['visibility']) {
  if (!visibility) return null
  
  const conditions: Record<string, any> = {}
  
  if (visibility.roleTypes?.length) {
    conditions.role_type = visibility.roleTypes[0]
  }
  
  if (visibility.teams?.length) {
    conditions.teams = visibility.teams
  }
  
  if (visibility.areas?.length) {
    conditions.areas = visibility.areas
  }
  
  if (visibility.regions?.length) {
    conditions.regions = visibility.regions
  }
  
  return conditions
}