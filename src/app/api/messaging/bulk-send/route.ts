import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { MessageService } from '@/features/messaging/services/message-service';
import { checkPermission } from '@/features/permissions/utils/checkPermissions';
import { z } from 'zod';
import { ErrorLogger } from '@/lib/logging/error-logger';
import { ErrorSeverity, ErrorSource } from '@/lib/types/errors';
import { DEFAULT_ADMIN_ID } from '@/features/messaging/constants';

/**
 * Schema for bulk message requests
 */
const bulkSendSchema = z.object({
  content: z.string().min(1).max(1600),
  recipientIds: z.array(z.string().uuid()).min(1),
  templateVariables: z.record(z.string()).optional(),
  testMode: z.boolean().optional().default(false)
});

/**
 * POST handler for sending bulk messages
 * 
 * Request format:
 * {
 *   content: string,
 *   recipientIds: string[],
 *   templateVariables?: Record<string, string>,
 *   testMode?: boolean
 * }
 * 
 * Response format:
 * {
 *   success: boolean,
 *   bulkMessageId?: string,
 *   successCount?: number,
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // DEBUG: Check if Twilio environment variables are available
    console.log('[DEBUG] Twilio Environment Variables:', {
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Not set',
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Not set',
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ? 'Set' : 'Not set',
      NODE_ENV: process.env.NODE_ENV
    });
    
    // Initialize Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    // Verify Supabase client is working
    const { count } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true });
    console.log(`[DEBUG] Supabase connection test: Found ${count || 'unknown'} user profiles`);
    
    // Verify Twilio environment variables
    console.log('[DEBUG] Twilio environment variables:', {
      accountSid: process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Not set',
      authToken: process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Not set', 
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    });
    
    // Enable debug mode for messaging services
    const messageService = new MessageService(supabase);
    console.log('[DEBUG] Created MessageService with authenticated Supabase client');
    
    // Authenticate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile for permission check
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 403 }
      );
    }

    // Check if user has permission to send messages
    const userPermissions = {
      roleType: profile.role_type || 'Setter',
      role: profile.role || '',
      team: profile.team || undefined,
      area: profile.area || undefined,
      region: profile.region || undefined
    };

    const hasPermission = checkPermission(userPermissions, 'manage_users');
    if (!hasPermission) {
      await ErrorLogger.log(
        new Error('Unauthorized attempt to send bulk messages'),
        {
          severity: ErrorSeverity.HIGH,
          source: ErrorSource.SERVER,
          context: {
            userId: user.id,
            email: user.email,
            roleType: profile.role_type
          }
        }
      );
      
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = bulkSendSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request format',
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }

    const { content, recipientIds, templateVariables, testMode } = validationResult.data;
    
    // If in test mode, only send to the sender
    if (testMode) {
      const result = await messageService.sendMessage(
        content,
        profile.id,
        profile.id,
        templateVariables
      );

      return NextResponse.json({
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        testMode: true,
        successCount: result.success ? 1 : 0
      });
    }
    
    if (recipientIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No recipients specified' },
        { status: 400 }
      );
    }
    
    // Get recipient details directly from the database
    const { data: recipients, error: recipientsError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, email, phone, role_type, team, area, region')
      .in('id', recipientIds);
    
    if (recipientsError) {
      console.error('Error fetching recipients:', recipientsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch recipient details' },
        { status: 500 }
      );
    }
    
    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid recipients found' },
        { status: 400 }
      );
    }
    
    // Transform to the expected format
    const transformedRecipients = recipients.map(r => ({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      name: `${r.first_name} ${r.last_name}`,
      email: r.email,
      phone: r.phone,
      roleType: r.role_type,
      team: r.team,
      area: r.area,
      region: r.region,
      optedOut: false // We're not checking opt-out status for now
    }));
    
    // Send bulk message
    const result = await messageService.sendBulkMessage({
      content,
      recipients: transformedRecipients,
      senderId: DEFAULT_ADMIN_ID,
      templateVariables
    });

    // Determine success based on actual results, not just presence of error
    const successCount = result.successCount || 0;
    const hasSuccesses = successCount > 0;
    
    // Return a response that accurately represents the state
    return NextResponse.json({
      success: hasSuccesses, // Success is true if at least one message sent successfully
      bulkMessageId: result.bulkMessageId,
      error: result.error,
      successCount: successCount,
      totalCount: transformedRecipients.length
    });
  } catch (error) {
    console.error('Error sending bulk message:', error);
    
    await ErrorLogger.log(error, {
      severity: ErrorSeverity.HIGH,
      source: ErrorSource.SERVER,
      context: { route: '/api/messaging/bulk-send' }
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 