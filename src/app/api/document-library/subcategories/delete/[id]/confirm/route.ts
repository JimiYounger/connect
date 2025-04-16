// my-app/src/app/api/document-library/subcategories/delete/[id]/confirm/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * Request body for subcategory deletion
 */
interface DeleteSubcategoryRequest {
  fallbackSubcategoryId: string;
}

/**
 * Response from delete_subcategory_and_reassign Supabase function
 */
interface DeleteSubcategoryFunctionResponse {
  documents_updated: number;
}

/**
 * Deletes a subcategory and reassigns its documents to another subcategory
 * 
 * Requires admin role
 * Both subcategories must exist and belong to the same parent category
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate that we have a subcategory ID
    const subcategoryId = params.id;
    if (!subcategoryId) {
      return NextResponse.json(
        { success: false, error: 'Subcategory ID is required' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { fallbackSubcategoryId } = body as DeleteSubcategoryRequest;

    // Validate fallback subcategory ID
    if (!fallbackSubcategoryId) {
      return NextResponse.json(
        { success: false, error: 'Fallback subcategory ID is required' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Create the Supabase client
    const supabase = await createClient();

    // Check if the user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Check if the user is an admin
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role_type')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { success: false, error: 'Error verifying permissions' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (userProfile?.role_type?.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin permissions required' },
        { status: 403, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Call the Supabase function to delete the subcategory and reassign documents
    const { data, error } = await supabase.rpc(
      'delete_subcategory_and_reassign',
      {
        p_subcategory_id: subcategoryId,
        p_fallback_subcategory_id: fallbackSubcategoryId,
      }
    );

    if (error) {
      console.error('Error calling delete_subcategory_and_reassign:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to delete subcategory',
          details: error.message 
        },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const result = data as DeleteSubcategoryFunctionResponse;

    // Return success response with the number of updated documents
    return NextResponse.json({
      success: true,
      message: 'Subcategory deleted successfully',
      documentsUpdated: result.documents_updated,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Unexpected error during subcategory deletion:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
} 