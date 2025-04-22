import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const documentId = resolvedParams.id;
    
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user profile for role-based access control
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id, role_type, team, area, region')
      .eq('user_id', user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Get document details including versions
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select(`
        id,
        title,
        current_version_id,
        document_versions (
          id,
          file_path,
          file_type,
          version_label
        )
      `)
      .eq('id', documentId)
      .single();
    
    if (documentError || !document) {
      console.error('Error fetching document:', documentError);
      return NextResponse.json(
        { error: documentError?.message || 'Document not found' },
        { status: 404 }
      );
    }

    // Check document visibility (access control)
    // Skip for admins
    if (userProfile.role_type && userProfile.role_type.toLowerCase() !== 'admin') {
      const { data: visibilityData } = await supabase
        .from('document_visibility')
        .select('conditions')
        .eq('document_id', documentId)
        .single();

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
            { error: 'Access denied' },
            { status: 403 }
          );
        }
      }
    }
    
    // Get the current version
    let version = Array.isArray(document.document_versions) 
      ? document.document_versions.find((v: { id: string }) => v.id === document.current_version_id) || document.document_versions[0]
      : document.document_versions;
    
    if (!version || !version.file_path) {
      return NextResponse.json(
        { error: 'Document file not found' },
        { status: 404 }
      );
    }

    // Generate a signed URL with short expiration time
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('documents')
      .createSignedUrl(version.file_path, 300); // 5 minutes expiration
    
    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Error creating signed URL:', signedUrlError);
      return NextResponse.json(
        { error: 'Failed to generate signed URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: signedUrlData.signedUrl });
  } catch (error) {
    console.error('Error getting document URL:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 