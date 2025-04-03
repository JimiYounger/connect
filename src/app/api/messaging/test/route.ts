import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { messageService } from '@/features/messaging/services/message-service';
import { calculateMessageSegments } from '@/features/messaging/services/twilio-service';
import { checkPermission } from '@/features/permissions/utils/checkPermissions';
import { z } from 'zod';
import { ErrorLogger } from '@/lib/logging/error-logger';
import { ErrorSeverity, ErrorSource } from '@/lib/types/errors';

/**
 * Schema for test message request
 */
const testMessageSchema = z.object({
  content: z.string().min(1).max(1600),
  templateVariables: z.record(z.string()).optional()
});

/**
 * POST handler for sending a test message to the admin's own phone
 * 
 * Request format:
 * {
 *   content: string,
 *   templateVariables?: Record<string, string>
 * }
 * 
 * Response format:
 * {
 *   success: boolean,
 *   messageId?: string,
 *   segmentInfo?: {
 *     segmentCount: number,
 *     characterCount: number,
 *     remainingCharacters: number,
 *     isOverLimit: boolean
 *   },
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
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
        new Error('Unauthorized attempt to send test message'),
        {
          severity: ErrorSeverity.MEDIUM,
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

    // Check if user has a phone number
    if (!profile.phone) {
      return NextResponse.json(
        { success: false, error: 'You do not have a phone number set in your profile' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = testMessageSchema.safeParse(body);
    
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

    const { content, templateVariables } = validationResult.data;

    // Calculate message segments for cost estimation
    const segmentInfo = calculateMessageSegments(content);
    
    if (segmentInfo.isOverLimit) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Message exceeds maximum length of 1600 characters (${segmentInfo.characterCount} provided)`,
          segmentInfo
        },
        { status: 400 }
      );
    }

    // Send test message to the admin's own phone
    const result = await messageService.sendMessage(
      content,
      profile.id, // Send to self
      profile.id, // From self
      templateVariables
    );

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      segmentInfo,
      error: result.error
    });
  } catch (error) {
    console.error('Error sending test message:', error);
    
    await ErrorLogger.log(error, {
      severity: ErrorSeverity.MEDIUM,
      source: ErrorSource.SERVER,
      context: { route: '/api/messaging/test' }
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