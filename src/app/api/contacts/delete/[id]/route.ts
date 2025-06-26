// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: contactId } = await params;
    
    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' }, 
        { status: 400 }
      );
    }
    
    // Initialize server-side Supabase client
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Check if contact exists
    const { data: existingContact, error: checkError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .single();
    
    if (checkError || !existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' }, 
        { status: 404 }
      );
    }
    
    // Delete the contact - tag assignments will be deleted automatically (cascade)
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);
    
    if (deleteError) {
      console.error('Error deleting contact:', deleteError);
      return NextResponse.json(
        { error: deleteError.message }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Contact deleted successfully' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error in contact deletion:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact' }, 
      { status: 500 }
    );
  }
} 