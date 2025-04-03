import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { messageService } from '@/features/messaging/services/message-service';
import { checkPermission } from '@/features/permissions/utils/checkPermissions';
import { z } from 'zod';
import { ErrorLogger } from '@/lib/logging/error-logger';
import { ErrorSeverity, ErrorSource } from '@/lib/types/errors';

/**
 * Schema for conversation request query parameters
 */
const conversationQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0)
});

/**
 * GET handler for retrieving all conversations for admin inbox
 * 
 * Query parameters:
 * - limit: Optional. Number of conversations to return (default: 50, max: 100)
 * - offset: Optional. Pagination offset (default: 0)
 * 
 * Response format:
 * {
 *   success: boolean,
 *   conversations?: Record<string, MessageWithDetails>,
 *   error?: string
 * }
 */
export async function GET(request: NextRequest) {
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
        new Error('Unauthorized attempt to view message conversations'),
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

    // Parse and validate query parameters
    const url = new URL(request.url);
    const params = {
      limit: url.searchParams.get('limit') || undefined,
      offset: url.searchParams.get('offset') || undefined
    };
    
    const validationResult = conversationQuerySchema.safeParse(params);
    
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

    // Get all conversations for the admin
    const conversations = await messageService.getUserConversations(profile.id);

    console.log(`[API] Retrieved ${Object.keys(conversations).length} conversations for user ${profile.id}`);
    console.log(`[API] Sample conversation:`, Object.entries(conversations).length > 0 
      ? JSON.stringify(Object.entries(conversations)[0][1])
      : 'No conversations found');

    return NextResponse.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Error retrieving conversations:', error);
    
    await ErrorLogger.log(error, {
      severity: ErrorSeverity.MEDIUM,
      source: ErrorSource.SERVER,
      context: { route: '/api/messaging/conversations' }
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