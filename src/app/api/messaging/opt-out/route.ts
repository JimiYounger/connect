import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { messageService } from '@/features/messaging/services/message-service';
import { checkPermission } from '@/features/permissions/utils/checkPermissions';
import { z } from 'zod';
import { ErrorLogger } from '@/lib/logging/error-logger';
import { ErrorSeverity, ErrorSource } from '@/lib/types/errors';

/**
 * Schema for opt-out request
 */
const optOutRequestSchema = z.object({
  userId: z.string().uuid(),
  optedOut: z.boolean(),
  reason: z.string().optional()
});

/**
 * Schema for self opt-out request (no auth required)
 */
const selfOptOutRequestSchema = z.object({
  phone: z.string().min(10),
  optedOut: z.boolean(),
  reason: z.string().optional(),
  token: z.string() // Security token to prevent abuse
});

/**
 * POST handler for updating user opt-out preferences
 * 
 * Request format (admin updating a user):
 * {
 *   userId: string,
 *   optedOut: boolean,
 *   reason?: string
 * }
 * 
 * Request format (user self opt-out):
 * {
 *   phone: string,
 *   optedOut: boolean,
 *   reason?: string,
 *   token: string
 * }
 * 
 * Response format:
 * {
 *   success: boolean,
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Check if this is a self opt-out request (contains phone and token)
    if (body.phone && body.token) {
      return handleSelfOptOut(body);
    }
    
    // Otherwise, this is an admin updating a user's preferences
    return handleAdminOptOut(request, body);
  } catch (error) {
    console.error('Error handling opt-out request:', error);
    
    await ErrorLogger.log(error, {
      severity: ErrorSeverity.MEDIUM,
      source: ErrorSource.SERVER,
      context: { route: '/api/messaging/opt-out' }
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

/**
 * Handle admin updating a user's opt-out preferences
 */
async function handleAdminOptOut(request: NextRequest, body: any): Promise<NextResponse> {
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

  // Check if user has permission to manage users
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
      new Error('Unauthorized attempt to update opt-out preferences'),
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

  // Validate request body
  const validationResult = optOutRequestSchema.safeParse(body);
  
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

  const { userId, optedOut, reason } = validationResult.data;

  // Check if target user exists
  const { data: targetUser, error: targetUserError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', userId)
    .single();
    
  if (targetUserError || !targetUser) {
    return NextResponse.json(
      { success: false, error: 'Target user not found' },
      { status: 404 }
    );
  }

  // Update user preferences
  try {
    await messageService.updateUserMessagePreferences(userId, optedOut);
    
    // Log the opt-out action
    if (reason) {
      await supabase.from('activity_logs').insert({
        action: optedOut ? 'opt_out' : 'opt_in',
        type: 'messaging',
        status: 'completed',
        details: { reason, updatedBy: profile.id },
        user_id: userId,
        timestamp: Date.now()
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update preferences' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle user self opt-out (no auth required, but token validated)
 */
async function handleSelfOptOut(body: any): Promise<NextResponse> {
  // Validate request body
  const validationResult = selfOptOutRequestSchema.safeParse(body);
  
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

  const { phone, optedOut, reason, token } = validationResult.data;

  // Validate security token
  const expectedToken = process.env.OPT_OUT_SECURITY_TOKEN;
  if (!expectedToken || token !== expectedToken) {
    await ErrorLogger.log(
      new Error('Invalid opt-out security token'),
      {
        severity: ErrorSeverity.HIGH,
        source: ErrorSource.SERVER,
        context: { phone }
      }
    );
    
    return NextResponse.json(
      { success: false, error: 'Invalid security token' },
      { status: 403 }
    );
  }

  // Initialize Supabase client (server-side only)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get() { return undefined; }, // No cookies in server-to-server context
        set() { return; },
        remove() { return; }
      },
    }
  );

  // Find user by phone number
  const { data: user, error: userError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('phone', phone)
    .single();
    
  if (userError || !user) {
    return NextResponse.json(
      { success: false, error: 'User not found with this phone number' },
      { status: 404 }
    );
  }

  // Update user preferences
  try {
    await messageService.updateUserMessagePreferences(user.id, optedOut);
    
    // Log the opt-out action
    if (reason) {
      await supabase.from('activity_logs').insert({
        action: optedOut ? 'opt_out' : 'opt_in',
        type: 'messaging',
        status: 'completed',
        details: { reason, selfRequested: true },
        user_id: user.id,
        timestamp: Date.now()
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update preferences' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for checking a user's opt-out status
 * 
 * Query parameters:
 * - userId: The ID of the user to check
 * 
 * Response format:
 * {
 *   success: boolean,
 *   optedOut?: boolean,
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

    // Parse query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // If checking own status, no permission check needed
    // Otherwise, check if user has permission to manage users
    if (userId !== profile.id) {
      const userPermissions = {
        roleType: profile.role_type || 'Setter',
        role: profile.role || '',
        team: profile.team || undefined,
        area: profile.area || undefined,
        region: profile.region || undefined
      };

      const hasPermission = checkPermission(userPermissions, 'manage_users');
      if (!hasPermission) {
        return NextResponse.json(
          { success: false, error: 'Permission denied' },
          { status: 403 }
        );
      }
    }

    // Check if target user exists
    const { data: targetUser, error: targetUserError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (targetUserError || !targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from('user_message_preferences')
      .select('opted_out')
      .eq('user_id', userId)
      .single();
      
    if (preferencesError && preferencesError.code !== 'PGRST116') { // PGRST116 is "not found"
      throw new Error(`Failed to check user preferences: ${preferencesError.message}`);
    }
    
    // If no preferences record exists, user is not opted out
    const optedOut = preferences?.opted_out || false;
    
    return NextResponse.json({
      success: true,
      optedOut
    });
  } catch (error) {
    console.error('Error checking opt-out status:', error);
    
    await ErrorLogger.log(error, {
      severity: ErrorSeverity.MEDIUM,
      source: ErrorSource.SERVER,
      context: { route: '/api/messaging/opt-out' }
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