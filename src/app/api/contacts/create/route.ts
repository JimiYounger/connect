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
const contactCreateSchema = z.object({
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

export async function POST(req: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await req.json();
    const validatedData = contactCreateSchema.parse(body);
    
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
    
    // Check if user has an email
    if (!user.email) {
      return NextResponse.json(
        { error: 'User email not found' }, 
        { status: 400 }
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
    
    // Profile ID to use for created_by/updated_by
    // If profile doesn't exist, we'll use null (will need to modify your foreign key constraint)
    const profileId = userProfile?.id || null;
    
    // Extract selectedTagIds and remove from values before insertion
    const { selectedTagIds, ...contactValues } = formattedData;
    
    // Insert the contact with explicit type casting
    const insertOperation = supabase
      .from('contacts')
      .insert({
        ...contactValues,
        created_by: profileId,
        updated_by: profileId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any) // Use type assertion to bypass type checking
      .select()
      .single();
    
    const { data: newContact, error: insertError } = await insertOperation;
    
    if (insertError) {
      console.error('Error creating contact:', insertError);
      return NextResponse.json(
        { error: insertError.message }, 
        { status: 500 }
      );
    }
    
    // Insert tag assignments if any
    if (selectedTagIds.length > 0) {
      const tagAssignments = selectedTagIds.map(tagId => ({
        contact_id: newContact.id,
        tag_id: tagId,
        created_at: new Date().toISOString()
      }));
      
      const { error: assignmentError } = await supabase
        .from('contact_tag_assignments')
        .insert(tagAssignments);
      
      if (assignmentError) {
        console.error('Error creating tag assignments:', assignmentError);
        // We don't want to fail the whole operation if tag assignment fails
        // Just log it and continue
      }
    }
    
    return NextResponse.json(
      { message: 'Contact created successfully', contact: newContact },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error in contact creation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create contact' }, 
      { status: 500 }
    );
  }
} 