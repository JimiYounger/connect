import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { messageService } from '@/features/messaging/services/message-service';
import { MessageStatus, StatusWebhookPayload, InboundMessagePayload } from '@/features/messaging/types';
import { ErrorLogger } from '@/lib/logging/error-logger';
import { ErrorSeverity, ErrorSource } from '@/lib/types/errors';
import { v4 as uuidv4 } from 'uuid';

/**
 * Twilio webhook handler for status updates and incoming messages
 * 
 * This endpoint is publicly accessible (no auth) because Twilio needs to call it
 * 
 * POST request formats from Twilio:
 * 
 * Status update:
 * {
 *   MessageSid: string,
 *   MessageStatus: string, // 'sent', 'delivered', 'failed', etc.
 *   ErrorCode?: string,
 *   ErrorMessage?: string
 * }
 * 
 * Incoming message:
 * {
 *   MessageSid: string,
 *   From: string, // Phone number in E.164 format
 *   To: string,   // Your Twilio number
 *   Body: string  // Message content
 * }
 * 
 * Response:
 * - 200 OK with empty response for successful processing
 * - 400 Bad Request for invalid payloads
 * - 500 Internal Server Error for processing errors
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw form data from Twilio (application/x-www-form-urlencoded)
    const formData = await request.formData();
    
    // Convert FormData to a regular object
    const payload: Record<string, string> = {};
    formData.forEach((value, key) => {
      payload[key] = value.toString();
    });

    // Determine if this is a status update or an incoming message
    if (payload.MessageStatus) {
      // This is a status update
      await handleStatusUpdate(payload as unknown as StatusWebhookPayload);
    } else if (payload.Body && payload.From) {
      // This is an incoming message
      await handleIncomingMessage(payload as unknown as InboundMessagePayload);
    } else {
      // Unknown payload type
      return NextResponse.json(
        { success: false, error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    // Return a 200 OK to acknowledge receipt
    return new NextResponse('', { status: 200 });
  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    
    await ErrorLogger.log(error, {
      severity: ErrorSeverity.HIGH,
      source: ErrorSource.SERVER,
      context: { route: '/api/messaging/webhook' }
    });
    
    // Still return 200 to Twilio to prevent retries
    // Twilio expects a 200 response even if there's an error on our side
    return new NextResponse('', { status: 200 });
  }
}

/**
 * Handle status update webhooks from Twilio
 */
async function handleStatusUpdate(payload: StatusWebhookPayload): Promise<void> {
  const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = payload;
  
  if (!MessageSid || !MessageStatus) {
    throw new Error('Missing required fields in status update webhook');
  }
  
  // Map Twilio status to our internal status
  let status: MessageStatus;
  switch (MessageStatus.toLowerCase()) {
    case 'queued':
      status = 'queued' as MessageStatus;
      break;
    case 'sending':
      status = 'sending' as MessageStatus;
      break;
    case 'sent':
      status = 'sent' as MessageStatus;
      break;
    case 'delivered':
      status = 'delivered' as MessageStatus;
      break;
    case 'undelivered':
    case 'failed':
      status = 'failed' as MessageStatus;
      break;
    case 'read':
      status = 'read' as MessageStatus;
      break;
    default:
      status = 'sent' as MessageStatus; // Default to sent for unknown statuses
  }
  
  // Update message status in database
  await messageService.updateMessageStatus(
    MessageSid,
    status,
    ErrorCode && ErrorMessage ? `${ErrorCode}: ${ErrorMessage}` : undefined
  );
  
  // Log status update for debugging
  console.log(`Message ${MessageSid} status updated to ${status}`);
}

/**
 * Handle incoming message webhooks from Twilio
 */
async function handleIncomingMessage(payload: InboundMessagePayload): Promise<void> {
  const { MessageSid, From, To, Body } = payload;
  
  if (!MessageSid || !From || !To || Body === undefined) {
    throw new Error('Missing required fields in incoming message webhook');
  }
  
  // Initialize Supabase client
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
  
  // Find the user profile by phone number
  const { data: userProfile, error: userError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('phone', From)
    .single();
    
  if (userError || !userProfile) {
    throw new Error(`User not found for phone number ${From}`);
  }
  
  // Find an admin to receive this message (for now, just get the first admin)
  const { data: adminProfiles, error: adminError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('role_type', 'Admin')
    .limit(1);
    
  if (adminError || !adminProfiles || adminProfiles.length === 0) {
    throw new Error('No admin found to receive the message');
  }
  
  const adminProfile = adminProfiles[0];
  
  // Create a new message record
  const timestamp = new Date().toISOString();
  const messageId = uuidv4();
  
  const { error: insertError } = await supabase
    .from('messages')
    .insert({
      id: messageId,
      content: Body,
      sender_id: userProfile.id,
      recipient_id: adminProfile.id,
      is_outbound: false, // This is an inbound message
      status: 'delivered' as MessageStatus, // Already delivered since we received it
      twilio_sid: MessageSid,
      created_at: timestamp,
      updated_at: timestamp
    });
    
  if (insertError) {
    throw new Error(`Failed to insert incoming message: ${insertError.message}`);
  }
  
  // Log the incoming message for debugging
  console.log(`Received message from ${From} to ${To}: ${Body.substring(0, 50)}${Body.length > 50 ? '...' : ''}`);
}

/**
 * Handle GET requests (for Twilio validation)
 * Twilio sometimes sends GET requests to validate the webhook URL
 */
export async function GET() {
  return new NextResponse('Twilio webhook endpoint is active', { status: 200 });
}