import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { messageService } from '@/features/messaging/services/message-service';
import { checkPermission } from '@/features/permissions/utils/checkPermissions';
import { z } from 'zod';
import { ErrorLogger } from '@/lib/logging/error-logger';
import { ErrorSeverity, ErrorSource } from '@/lib/types/errors';

/**
 * Schema for conversation history query parameters
 */
const conversationHistorySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
  markAsRead: z.coerce.boolean().optional().default(false)
});

/**
 * GET handler for retrieving conversation history with a specific user
 * 
 * Path parameters:
 * - userId: The ID of the user to get conversation history with
 * 
 * Query parameters:
 * - limit: Optional. Number of messages to return (default: 50, max: 100)
 * - offset: Optional. Pagination offset (default: 0)
 * - markAsRead: Optional. Whether to mark unread messages as read (default: false)
 * 
 * Response format:
 * {
 *   success: boolean,
 *   messages?: MessageWithDetails[],
 *   error?: string
 * }
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const routeParams = await context.params;
    const { userId } = routeParams;
    
    // Validate userId format
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

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

    // Check if user has permission to view messages
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
        new Error('Unauthorized attempt to view message conversation history'),
        {
          severity: ErrorSeverity.MEDIUM,
          source: ErrorSource.SERVER,
          context: {
            userId: user.id,
            email: user.email,
            roleType: profile.role_type,
            conversationUserId: userId
          }
        }
      );
      
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      limit: url.searchParams.get('limit') || undefined,
      offset: url.searchParams.get('offset') || undefined,
      markAsRead: url.searchParams.get('markAsRead') || undefined
    };
    
    const validationResult = conversationHistorySchema.safeParse(queryParams);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }

    const { limit, offset, markAsRead } = validationResult.data;

    // Get conversation history with the specified user
    const messages = await messageService.getConversationHistory(
      profile.id,
      userId,
      limit,
      offset
    );

    // Mark messages as read if requested
    if (markAsRead && messages.length > 0) {
      // Only mark inbound messages as read
      const inboundMessageIds = messages
        .filter(msg => !msg.is_outbound && msg.status !== 'read')
        .map(msg => msg.id);
        
      if (inboundMessageIds.length > 0) {
        // Mark each message as read
        await Promise.all(
          inboundMessageIds.map(id => messageService.markMessageAsRead(id))
        );
      }
    }

    return NextResponse.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error retrieving conversation history:', error);
    
    await ErrorLogger.log(error, {
      severity: ErrorSeverity.MEDIUM,
      source: ErrorSource.SERVER,
      context: { route: '/api/messaging/conversations/[userId]' }
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