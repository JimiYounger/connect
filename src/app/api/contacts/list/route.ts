import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(_req: NextRequest) {
  try {
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
    
    // Fetch contacts with department names
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select(`
        *,
        departments:department_id (
          name
        )
      `)
      .order('last_name', { ascending: true });
    
    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      return NextResponse.json(
        { error: contactsError.message }, 
        { status: 500 }
      );
    }
    
    // Fetch tag assignments for all contacts
    const { data: tagAssignments, error: tagAssignmentsError } = await supabase
      .from('contact_tag_assignments')
      .select(`
        contact_id,
        tags:tag_id (
          id,
          name
        )
      `);
    
    if (tagAssignmentsError) {
      console.error('Error fetching tag assignments:', tagAssignmentsError);
      // Continue despite error, just might not have tag data
    }
    
    // Group tags by contact_id
    const tagsByContact: { [contactId: string]: Array<{id: string, name: string}> } = {};
    if (tagAssignments) {
      tagAssignments.forEach(assignment => {
        if (!tagsByContact[assignment.contact_id]) {
          tagsByContact[assignment.contact_id] = [];
        }
        tagsByContact[assignment.contact_id].push(assignment.tags);
      });
    }
    
    // Add tags to contacts
    const contactsWithTags = contacts.map(contact => ({
      ...contact,
      tags: tagsByContact[contact.id] || []
    }));
    
    return NextResponse.json(contactsWithTags);
    
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' }, 
      { status: 500 }
    );
  }
} 