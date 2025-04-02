import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

/**
 * Webhook handler for Twilio message status updates
 * 
 * Documentation: https://www.twilio.com/docs/sms/tutorials/how-to-confirm-delivery
 * 
 * Expected parameters from Twilio:
 * - MessageSid: The SID of the message
 * - MessageStatus: The new status of the message
 * - ErrorCode: Error code if applicable
 * - ErrorMessage: Error message if applicable
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data from Twilio
    const formData = await request.formData();
    
    const messageSid = formData.get('MessageSid') as string;
    const messageStatus = formData.get('MessageStatus') as string;
    const errorCode = formData.get('ErrorCode') as string;
    const errorMessage = formData.get('ErrorMessage') as string;
    
    // Log the incoming webhook for debugging
    console.log('[TwilioWebhook] Received status update:', {
      messageSid,
      messageStatus,
      errorCode,
      errorMessage,
      allParams: Object.fromEntries(formData.entries())
    });
    
    // Validate required parameters
    if (!messageSid || !messageStatus) {
      console.error('[TwilioWebhook] Missing required parameters:', { messageSid, messageStatus });
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Create a Supabase client
    const supabase = createClient();
    
    // Update the message status in the database
    const { error } = await supabase
      .from('messages')
      .update({
        status: messageStatus.toLowerCase(),
        error_message: errorMessage || null,
        updated_at: new Date().toISOString()
      })
      .eq('twilio_sid', messageSid);
      
    if (error) {
      console.error('[TwilioWebhook] Database update error:', error);
      // Still return 200 OK to Twilio to prevent retries
      // but log the error for our debugging
      return NextResponse.json(
        { success: false, error: 'Database update failed' },
        { status: 200 }
      );
    }
    
    console.log(`[TwilioWebhook] Successfully updated message status for ${messageSid} to "${messageStatus}"`);
    
    // Return 200 OK to acknowledge receipt
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[TwilioWebhook] Error handling webhook:', error);
    
    // Return 200 OK to prevent Twilio from retrying
    // Even though there was an error, we don't want Twilio to keep retrying
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 200 }
    );
  }
} 