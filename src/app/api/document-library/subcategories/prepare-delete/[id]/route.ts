// my-app/src/app/api/document-library/subcategories/prepare-delete/[id]/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Adding underscore prefix to unused interfaces to satisfy linter
interface _Document {
  id: string;
  title: string;
  document_subcategory_id: string;
}

interface _Subcategory {
  id: string;
  name: string;
  order: number;
  document_category_id: string;
}

/**
 * Prepares for subcategory deletion by retrieving:
 * 1. Details about the subcategory
 * 2. Documents assigned to the subcategory
 * 3. Other subcategories in the same parent category for reassignment
 * 
 * Requires admin role
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subcategoryId } = await params;
    
    if (!subcategoryId) {
      return NextResponse.json(
        { success: false, error: 'Subcategory ID is required' },
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

    // Get subcategory details
    const { data: subcategory, error: subcategoryError } = await supabase
      .from('document_subcategories')
      .select('id, name, document_category_id')
      .eq('id', subcategoryId)
      .single();

    if (subcategoryError) {
      console.error('Error fetching subcategory:', subcategoryError);
      return NextResponse.json(
        { success: false, error: 'Subcategory not found' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Get documents assigned to this subcategory
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('id, title, document_subcategory_id')
      .eq('document_subcategory_id', subcategoryId)
      .order('title');

    if (documentsError) {
      console.error('Error fetching documents:', documentsError);
      return NextResponse.json(
        { success: false, error: 'Error fetching documents' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Get other subcategories in the same parent category
    const { data: availableSubcategories, error: subcategoriesError } = await supabase
      .from('document_subcategories')
      .select('id, name, order')
      .eq('document_category_id', subcategory.document_category_id)
      .neq('id', subcategoryId)
      .order('order', { ascending: true });

    if (subcategoriesError) {
      console.error('Error fetching available subcategories:', subcategoriesError);
      return NextResponse.json(
        { success: false, error: 'Error fetching available subcategories' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Return the subcategory details, documents, and available subcategories
    return NextResponse.json({
      success: true,
      data: {
        subcategory,
        documents: documents || [],
        availableSubcategories: availableSubcategories || [],
      }
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Unexpected error during prepare-delete:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
} 