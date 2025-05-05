// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { z } from 'zod';

// Schema for validation
const updateOrderSchema = z.object({
  contacts: z.array(
    z.object({
      id: z.string().uuid(),
      order_index: z.number().int().min(0)
    })
  ),
  departmentId: z.string()
});

export async function POST(req: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await req.json();
    const validatedData = updateOrderSchema.parse(body);
    
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
    
    // Profile ID to use for updated_by
    const profileId = userProfile?.id || null;
    
    // Perform all updates in a transaction if possible
    const { error: updateError } = await supabase.rpc('update_contact_order', {
      contact_updates: validatedData.contacts.map(c => ({
        id: c.id,
        order_index: c.order_index,
        updated_by: profileId,
        updated_at: new Date().toISOString()
      }))
    });
    
    // If RPC not available, fall back to individual updates
    if (updateError) {
      console.log('RPC not available, falling back to individual updates');
      
      for (const contact of validatedData.contacts) {
        const { error } = await supabase
          .from('contacts')
          .update({
            order_index: contact.order_index,
            updated_by: profileId,
            updated_at: new Date().toISOString()
          })
          .eq('id', contact.id);
        
        if (error) {
          console.error('Error updating contact order:', error);
          return NextResponse.json(
            { error: 'Failed to update contact order' }, 
            { status: 500 }
          );
        }
      }
    }
    
    return NextResponse.json(
      { message: 'Contact order updated successfully' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error updating contact order:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update contact order' }, 
      { status: 500 }
    );
  }
} 