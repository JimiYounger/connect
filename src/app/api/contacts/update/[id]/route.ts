// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { z } from 'zod';

// Function to format phone numbers to E.164 format
function formatPhoneToE164(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If empty after removing non-digits, return null
  if (!digits) return null;
  
  // If it doesn't start with 1, assume it's a US number and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If it already has country code (11 digits starting with 1)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If it's already in E.164 format with the plus
  if (phone.startsWith('+1') && digits.length >= 10) {
    return `+1${digits.substring(digits.length - 10)}`;
  }
  
  // Default: assume it's a US number
  return `+1${digits.substring(Math.max(0, digits.length - 10))}`;
}

// Schema for validation
const contactUpdateSchema = z.object({
  first_name: z.string().min(1, { message: 'First name is required' }),
  last_name: z.string().min(1, { message: 'Last name is required' }),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  job_title: z.string().optional().nullable(),
  department_id: z.string().optional().nullable(),
  selectedTagIds: z.array(z.string()).default([]),
  can_text: z.boolean().default(false),
  profile_image_url: z.string().optional().nullable(),
  google_user_id: z.string().optional().nullable(),
  company_id: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: contactId } = await params;
    
    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' }, 
        { status: 400 }
      );
    }
    
    // Parse and validate the request body
    const body = await req.json();
    const validatedData = contactUpdateSchema.parse(body);
    
    // Format phone number to E.164
    const formattedData = {
      ...validatedData,
      phone: formatPhoneToE164(validatedData.phone)
    };
    
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
    
    // Get the user profile ID for the authenticated user
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Error fetching user profile' }, 
        { status: 500 }
      );
    }
    
    // Profile ID to use for updated_by
    // If profile doesn't exist, we'll use null (will need to modify your foreign key constraint)
    const profileId = userProfile?.id || null;
    
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
    
    // Extract selectedTagIds and remove from values before update
    const { selectedTagIds, ...contactValues } = formattedData;
    
    // Update the contact
    const { data: updatedContact, error: updateError } = await supabase
      .from('contacts')
      .update({
        ...contactValues,
        updated_by: profileId,
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating contact:', updateError);
      return NextResponse.json(
        { error: updateError.message }, 
        { status: 500 }
      );
    }
    
    // Delete existing tag assignments
    const { error: deleteError } = await supabase
      .from('contact_tag_assignments')
      .delete()
      .eq('contact_id', contactId);
    
    if (deleteError) {
      console.error('Error deleting existing tag assignments:', deleteError);
      // Continue despite error
    }
    
    // Insert new tag assignments if any
    if (selectedTagIds.length > 0) {
      const tagAssignments = selectedTagIds.map(tagId => ({
        contact_id: contactId,
        tag_id: tagId,
        created_at: new Date().toISOString()
      }));
      
      const { error: assignmentError } = await supabase
        .from('contact_tag_assignments')
        .insert(tagAssignments);
      
      if (assignmentError) {
        console.error('Error creating tag assignments:', assignmentError);
        // Continue despite error
      }
    }
    
    return NextResponse.json(
      { message: 'Contact updated successfully', contact: updatedContact },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error in contact update:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update contact' }, 
      { status: 500 }
    );
  }
} 