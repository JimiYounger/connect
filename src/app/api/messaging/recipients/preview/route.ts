import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { recipientService } from '@/features/messaging/services/recipient-service';
import { checkPermission } from '@/features/permissions/utils/checkPermissions';
import { z } from 'zod';
import { ErrorLogger } from '@/lib/logging/error-logger';
import { ErrorSeverity, ErrorSource } from '@/lib/types/errors';
import { OrganizationFilter } from '@/features/messaging/types';

/**
 * Schema for recipient preview request
 */
const recipientPreviewSchema = z.object({
  filter: z.object({
    roleType: z.string().nullable().optional(),
    team: z.string().nullable().optional(),
    area: z.string().nullable().optional(),
    region: z.string().nullable().optional()
  }),
  limit: z.number().min(1).max(100).optional().default(10)
});

/**
 * POST handler for previewing recipients based on filter criteria
 * 
 * Request format:
 * {
 *   filter: {
 *     roleType?: string | null,
 *     team?: string | null,
 *     area?: string | null,
 *     region?: string | null
 *   },
 *   limit?: number // Optional, default: 10, max: 100
 * }
 * 
 * Response format:
 * {
 *   success: boolean,
 *   recipients?: Recipient[],
 *   totalCount?: number,
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

    // Check if user has permission to send messages (which implies they can preview recipients)
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
        new Error('Unauthorized attempt to preview message recipients'),
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = recipientPreviewSchema.safeParse(body);
    
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

    const { filter, limit } = validationResult.data;

    // Apply additional permission-based filtering based on user's role
    // For example, managers might only be able to message their own team
    const effectiveFilter: OrganizationFilter = { ...filter };
    
    // If user is not an admin or executive, restrict to their own team/area/region
    if (userPermissions.roleType !== 'Admin' && userPermissions.roleType !== 'Executive') {
      if (userPermissions.roleType === 'Manager') {
        // Managers can message across teams but only in their area
        if (userPermissions.area) {
          effectiveFilter.area = userPermissions.area;
        }
      } else {
        // Other roles can only message within their team
        if (userPermissions.team) {
          effectiveFilter.team = userPermissions.team;
        }
      }
    }

    // Get preview of recipients based on filter
    const { recipients, totalCount } = await recipientService.getRecipientsPreview(
      effectiveFilter,
      limit
    );

    return NextResponse.json({
      success: true,
      recipients,
      totalCount
    });
  } catch (error) {
    console.error('Error previewing recipients:', error);
    
    await ErrorLogger.log(error, {
      severity: ErrorSeverity.MEDIUM,
      source: ErrorSource.SERVER,
      context: { route: '/api/messaging/recipients/preview' }
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