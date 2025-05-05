// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { Contact } from '@/features/contacts/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Explicitly declaring the response types
interface ContactResponse {
  data: (Contact & { departments?: { name: string } }) | null;
  error: any;
}

interface TagResponse {
  data: Array<{ tag_id: string; tags: { id: string; name: string } }> | null;
  error: any;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
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
    
    // Use type assertions to prevent TypeScript from analyzing too deeply
    const contactResponse = await supabase
      .from('contacts')
      .select('*, departments:department_id (name)')
      .eq('id', contactId)
      .single();
      
    // Cast the response to our explicitly defined type
    const { data: contact, error: contactError } = contactResponse as ContactResponse;
    
    if (contactError) {
      console.error('Error fetching contact:', contactError);
      return NextResponse.json(
        { error: contactError.message }, 
        { status: contactError.code === 'PGRST116' ? 404 : 500 }
      );
    }
    
    // Fetch tags for this contact
    const tagResponse = await supabase
      .from('contact_tag_assignments')
      .select('tag_id, tags:tag_id (id, name)')
      .eq('contact_id', contactId);
      
    // Cast the response to our explicitly defined type
    const { data: tagAssignments, error: tagAssignmentsError } = tagResponse as TagResponse;
    
    if (tagAssignmentsError) {
      console.error('Error fetching tag assignments:', tagAssignmentsError);
      // Continue without tags if there's an error
    }
    
    // Add tags to contact
    const contactWithTags = {
      ...contact,
      tags: tagAssignments?.map(assignment => assignment.tags) || []
    };
    
    return NextResponse.json(contactWithTags);
    
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact' }, 
      { status: 500 }
    );
  }
} 