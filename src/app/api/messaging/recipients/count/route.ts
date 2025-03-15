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
 * Schema for recipient count request
 */
const recipientCountSchema = z.object({
  filter: z.object({
    // Support both old and new formats
    roleType: z.string().nullable().optional(),
    team: z.string().nullable().optional(),
    area: z.string().nullable().optional(),
    region: z.string().nullable().optional(),
    // New multi-select format
    roleTypes: z.array(z.string()).optional(),
    teams: z.array(z.string()).optional(),
    areas: z.array(z.string()).optional(),
    regions: z.array(z.string()).optional()
  })
});

/**
 * POST handler for counting recipients based on filter criteria
 * 
 * Request format:
 * {
 *   filter: {
 *     // Legacy format (single values)
 *     roleType?: string | null,
 *     team?: string | null,
 *     area?: string | null,
 *     region?: string | null,
 *     // New format (arrays)
 *     roleTypes?: string[],
 *     teams?: string[],
 *     areas?: string[],
 *     regions?: string[]
 *   }
 * }
 * 
 * Response format:
 * {
 *   success: boolean,
 *   count?: number,
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

    // Check if user has permission to send messages (which implies they can count recipients)
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
        new Error('Unauthorized attempt to count message recipients'),
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
    const validationResult = recipientCountSchema.safeParse(body);
    
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

    const { filter } = validationResult.data;

    // Convert filter to the format expected by the recipient service
    // Prioritize the new array format if provided
    const normalizedFilter: OrganizationFilter = {
      roleType: filter.roleTypes && filter.roleTypes.length > 0 
        ? filter.roleTypes[0] // Use first item if array provided
        : filter.roleType,
      team: filter.teams && filter.teams.length > 0 
        ? filter.teams[0] 
        : filter.team,
      area: filter.areas && filter.areas.length > 0 
        ? filter.areas[0] 
        : filter.area,
      region: filter.regions && filter.regions.length > 0 
        ? filter.regions[0] 
        : filter.region
    };

    // Apply additional permission-based filtering based on user's role
    const effectiveFilter: OrganizationFilter = { ...normalizedFilter };
    
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

    // Get count of recipients based on filter
    const count = await recipientService.getRecipientCount(effectiveFilter);

    return NextResponse.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error counting recipients:', error);
    
    await ErrorLogger.log(error, {
      severity: ErrorSeverity.MEDIUM,
      source: ErrorSource.SERVER,
      context: { route: '/api/messaging/recipients/count' }
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