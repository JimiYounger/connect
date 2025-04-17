// /src/app/api/document-library/view/[id]/route.ts
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get document ID from route params
    const { id: documentId } = await params;
    
    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      )
    }
    
    // Check for specific version ID in query params
    const url = new URL(request.url)
    const versionId = url.searchParams.get('versionId')

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

    // Get document details including versions
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select(`
        id,
        title,
        document_category_id,
        current_version_id,
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
    if (userProfile.role_type && userProfile.role_type.toLowerCase() !== 'admin') {
      const { data: visibilityData } = await supabase
        .from('document_visibility')
        .select('conditions')
        .eq('document_id', documentId)
        .single()

      if (visibilityData && visibilityData.conditions) {
        // Treat conditions as a Record with string keys and any values
        const conditions = visibilityData.conditions as {
          roleTypes?: string[];
          teams?: string[];
          areas?: string[];
          regions?: string[];
        };
        
        // Helper function to safely check array length
        const hasItems = (arr: any[] | undefined | null): boolean => 
          Array.isArray(arr) && arr.length > 0;
        
        const hasRoleRestrictions = hasItems(conditions.roleTypes);
        const roleMatches = hasRoleRestrictions ? 
          (Array.isArray(conditions.roleTypes) && conditions.roleTypes.includes(userProfile.role_type)) : 
          false;
          
        const hasNoOtherRestrictions = 
          !hasItems(conditions.teams) && 
          !hasItems(conditions.areas) && 
          !hasItems(conditions.regions);
          
        const hasAccess = 
          !hasRoleRestrictions || // No role restrictions
          roleMatches || // User's role matches
          hasNoOtherRestrictions; // No team/area/region restrictions

        if (!hasAccess) {
          return NextResponse.json(
            { success: false, error: 'Access denied' },
            { status: 403 }
          )
        }
      }
    }
    
    // Get the requested version or default to current version
    let version
    
    if (versionId) {
      // Find the specific version if requested
      version = Array.isArray(document.document_versions) 
        ? document.document_versions.find((v: { id: string }) => v.id === versionId)
        : null
        
      if (!version) {
        return NextResponse.json(
          { success: false, error: 'Version not found' },
          { status: 404 }
        )
      }
    } else {
      // Use the current version
      version = Array.isArray(document.document_versions) 
        ? document.document_versions.find((v: { id: string }) => v.id === document.current_version_id) || document.document_versions[0]
        : document.document_versions
    }
    
    if (!version || !version.file_path) {
      return NextResponse.json(
        { success: false, error: 'Document file not found' },
        { status: 404 }
      )
    }

    // Log the view activity
    await supabase
      .from('activity_logs')
      .insert({
        type: 'document',
        action: 'view',
        user_id: userProfile.id,
        status: 'success',
        details: {
          document_id: documentId,
          title: document.title,
          version_id: version.id,
          version_label: version.version_label
        },
        metadata: {
          document_id: documentId,
          version_id: version.id,
        },
        timestamp: Date.now(),
      })

    // Use the Supabase client to get a signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('documents')
      .createSignedUrl(version.file_path, 60 * 60) // 1 hour expiry
    
    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Error creating signed URL:', signedUrlError)
      return NextResponse.json(
        { success: false, error: 'Could not generate access URL for document' },
        { status: 500 }
      )
    }
    
    // Redirect to the signed URL
    return NextResponse.redirect(signedUrlData.signedUrl)
  } catch (error) {
    console.error('Error viewing document:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}