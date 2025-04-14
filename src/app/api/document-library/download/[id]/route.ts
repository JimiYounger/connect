// /src/app/api/document-library/download/[id]/route.ts
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(
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

    // Get user profile for role-based access control
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id, role_type, team, area, region')
      .eq('user_id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Get document details including current version
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select(`
        id,
        title,
        category_id,
        document_versions (
          id,
          file_path,
          file_type,
          version_label
        )
      `)
      .eq('id', documentId)
      .single()
    
    if (documentError || !document) {
      console.error('Error fetching document:', documentError)
      return NextResponse.json(
        { success: false, error: documentError?.message || 'Document not found' },
        { status: documentError?.code === 'PGRST116' ? 404 : 500 }
      )
    }

    // Check document visibility (access control)
    // Skip for admins
    if (userProfile.role_type !== 'Admin') {
      const { data: visibilityData } = await supabase
        .from('document_visibility')
        .select('conditions')
        .eq('document_id', documentId)
        .single()

      if (visibilityData) {
        const conditions = visibilityData.conditions
        const hasAccess = 
          !conditions.roleTypes?.length || // No role restrictions
          conditions.roleTypes.includes(userProfile.role_type) || // User's role matches
          (
            !conditions.teams?.length && 
            !conditions.areas?.length && 
            !conditions.regions?.length
          ) // No team/area/region restrictions

        if (!hasAccess) {
          return NextResponse.json(
            { success: false, error: 'Access denied' },
            { status: 403 }
          )
        }
      }
    }

    // Get the current version file path
    const currentVersion = Array.isArray(document.document_versions) 
      ? document.document_versions[0] 
      : document.document_versions

    if (!currentVersion || !currentVersion.file_path) {
      return NextResponse.json(
        { success: false, error: 'Document file not found' },
        { status: 404 }
      )
    }

    // Log the download activity
    await supabase
      .from('activity_logs')
      .insert({
        type: 'document',
        action: 'download',
        user_id: userProfile.id,
        status: 'success',
        details: {
          document_id: documentId,
          title: document.title,
        },
        metadata: {
          document_id: documentId,
          version_id: currentVersion.id,
        },
        timestamp: Date.now(),
      })

    // For direct downloads, we'll download the file from Supabase and stream it back
    // with appropriate headers to force download rather than display
    
    try {
      // Get the file data directly
      const { data: fileData, error: fileError } = await supabase
        .storage
        .from('documents')
        .download(currentVersion.file_path)
      
      if (fileError || !fileData) {
        console.error('Error downloading file from storage:', fileError)
        return NextResponse.json(
          { success: false, error: 'Could not retrieve document file' },
          { status: 500 }
        )
      }
      
      // Get filename from the path
      const filename = currentVersion.file_path.split('/').pop() || 'document'
      
      // Create response with appropriate headers for download
      const headers = new Headers()
      headers.set('Content-Disposition', `attachment; filename="${filename}"`)
      headers.set('Content-Type', currentVersion.file_type || 'application/octet-stream')
      
      // Return the file as a downloadable attachment
      return new NextResponse(fileData, {
        status: 200,
        headers
      })
    } catch (downloadError) {
      console.error('Error processing download:', downloadError)
      return NextResponse.json(
        { success: false, error: 'Error processing download' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error downloading document:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}