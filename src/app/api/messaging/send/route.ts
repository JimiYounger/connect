import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { messageService } from '@/features/messaging/services/message-service';
import { recipientService } from '@/features/messaging/services/recipient-service';
import { checkPermission } from '@/features/permissions/utils/checkPermissions';
import { z } from 'zod';
import { ErrorLogger } from '@/lib/logging/error-logger';
import { ErrorSeverity, ErrorSource } from '@/lib/types/errors';
import { Recipient } from '@/features/messaging/types';
import { DEFAULT_ADMIN_ID } from '@/features/messaging/constants';

/**
 * Schema for individual message requests
 */
const sendMessageSchema = z.object({
  content: z.string().min(1).max(1600),
  recipientId: z.string().uuid(),
  templateVariables: z.record(z.string()).optional(),
  testMode: z.boolean().optional().default(false)
});

/**
 * Schema for bulk message requests
 */
const sendBulkMessageSchema = z.object({
  content: z.string().min(1).max(1600),
  recipients: z.array(z.string().uuid()).min(1),
  templateVariables: z.record(z.string()).optional(),
  filter: z.object({
    roleType: z.string().nullable().optional(),
    team: z.string().nullable().optional(),
    area: z.string().nullable().optional(),
    region: z.string().nullable().optional()
  }).optional(),
  testMode: z.boolean().optional().default(false)
});

/**
 * Union type for message requests
 */
const messageRequestSchema = z.object({
  type: z.enum(['individual', 'bulk']),
  payload: z.union([sendMessageSchema, sendBulkMessageSchema])
});

/**
 * POST handler for sending messages
 * 
 * Request format:
 * {
 *   type: 'individual' | 'bulk',
 *   payload: {
 *     // For individual messages
 *     content: string,
 *     recipientId: string,
 *     templateVariables?: Record<string, string>,
 *     testMode?: boolean
 *     
 *     // For bulk messages
 *     content: string,
 *     recipients: string[],
 *     templateVariables?: Record<string, string>,
 *     filter?: {
 *       roleType?: string | null,
 *       team?: string | null,
 *       area?: string | null,
 *       region?: string | null
 *     },
 *     testMode?: boolean
 *   }
 * }
 * 
 * Response format:
 * {
 *   success: boolean,
 *   messageId?: string,
 *   bulkMessageId?: string,
 *   error?: string,
 *   recipientCount?: number
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
        new Error('Unauthorized attempt to send messages'),
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
    const validationResult = messageRequestSchema.safeParse(body);
    
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

    const { type, payload } = validationResult.data;

    // Handle individual message
    if (type === 'individual') {
      const individualPayload = payload as z.infer<typeof sendMessageSchema>;
      
      // In test mode, send to the sender instead
      const actualRecipientId = individualPayload.testMode 
        ? profile.id 
        : individualPayload.recipientId;
      
      const result = await messageService.sendMessage(
        individualPayload.content,
        actualRecipientId,
        DEFAULT_ADMIN_ID,
        individualPayload.templateVariables
      );

      return NextResponse.json({
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        testMode: individualPayload.testMode
      });
    }
    
    // Handle bulk message
    if (type === 'bulk') {
      const bulkPayload = payload as z.infer<typeof sendBulkMessageSchema>;
      
      // If in test mode, only send to the sender
      if (bulkPayload.testMode) {
        const result = await messageService.sendMessage(
          bulkPayload.content,
          profile.id,
          DEFAULT_ADMIN_ID,
          bulkPayload.templateVariables
        );

        return NextResponse.json({
          success: result.success,
          messageId: result.messageId,
          error: result.error,
          testMode: true,
          recipientCount: 1
        });
      }
      
      // Get recipients based on filter or explicit list
      let recipients: Recipient[] = [];
      
      if (bulkPayload.filter) {
        const result = await recipientService.getRecipientsByFilter(
          bulkPayload.filter
        );
        recipients = result.recipients;
      } else if (bulkPayload.recipients && bulkPayload.recipients.length > 0) {
        // Get recipient details for the provided IDs
        recipients = await recipientService.getRecipientsByIds(
          bulkPayload.recipients
        );
      }
      
      if (recipients.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No valid recipients found' },
          { status: 400 }
        );
      }
      
      // Send bulk message
      const result = await messageService.sendBulkMessage({
        content: bulkPayload.content,
        recipients,
        senderId: DEFAULT_ADMIN_ID,
        templateVariables: bulkPayload.templateVariables
      });

      return NextResponse.json({
        success: result.success,
        bulkMessageId: result.bulkMessageId,
        error: result.error,
        recipientCount: recipients.length
      });
    }

    // This should never happen due to the enum validation
    return NextResponse.json(
      { success: false, error: 'Invalid message type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error sending message:', error);
    
    await ErrorLogger.log(error, {
      severity: ErrorSeverity.HIGH,
      source: ErrorSource.SERVER,
      context: { route: '/api/messaging/send' }
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