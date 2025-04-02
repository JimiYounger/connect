import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase-server';
import { SupabaseClient } from '@supabase/supabase-js';
import { InboundMessagePayload as _InboundMessagePayload } from '@/features/messaging/types';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * System user ID representing all admins
 * This user will be the recipient for all inbound messages
 */
const SYSTEM_USER_ID = process.env.SYSTEM_USER_ID || '74dde36e-f406-4d1d-a6c5-f91cca505cae';

/**
 * Interface for inbound SMS message parameters from Twilio
 * Reference: https://www.twilio.com/docs/messaging/webhooks/sms-webhook
 */
interface TwilioInboundSmsParams {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia?: string;
  NumSegments?: string;
  SmsStatus?: string;
  AccountSid?: string;
  FromCountry?: string;
  FromState?: string;
  FromCity?: string;
}

/**
 * Simplified user profile structure
 */
interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
}

/**
 * Message conversation participant
 */
interface ConversationParticipant {
  id: string;
  name: string;
  isAdmin: boolean;
}

/**
 * Default admin user to receive messages when no specific admin is found
 * In production, this should be configured via environment variables or database settings
 */
const DEFAULT_ADMIN_ID = process.env.DEFAULT_ADMIN_ID || '';

// Create an admin client with service role access
function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Twilio webhook for handling inbound SMS messages
 * 
 * This endpoint receives SMS messages sent to our Twilio phone number,
 * identifies the sender if possible, and stores the message in our database
 * with the system user as the recipient.
 */
export async function POST(request: NextRequest) {
  console.log('[TwilioInbound] Processing inbound SMS message');
  
  try {
    // Parse form data from Twilio
    const formData = await request.formData();
    const params = Object.fromEntries(formData.entries()) as unknown as TwilioInboundSmsParams;
    
    // Extract key parameters with validation
    const { MessageSid, From, To, Body } = params;
    
    // Validate required parameters
    if (!MessageSid || !From || !Body) {
      console.error('[TwilioInbound] Missing required parameters:', { MessageSid, From, Body });
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 200 } // Still return 200 to prevent Twilio retries
      );
    }
    
    // Log relevant information for debugging
    console.log('[TwilioInbound] Received message:', {
      messageSid: MessageSid,
      from: From,
      to: To,
      bodyLength: Body.length,
      numSegments: params.NumSegments
    });
    
    // Use the admin client directly for webhook access
    const supabase = createAdminClient();
    
    // Process the incoming message
    const result = await processInboundMessage(supabase, {
      messageSid: MessageSid,
      from: From,
      to: To,
      body: Body
    });
    
    if (!result.success) {
      console.error('[TwilioInbound] Failed to process message:', result.error);
      // Still return 200 OK to Twilio to prevent retries
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 200 }
      );
    }
    
    console.log(`[TwilioInbound] Successfully processed message from ${From} with ID ${result.messageId}`);
    
    // Return 200 OK to acknowledge receipt
    return NextResponse.json({ success: true, messageId: result.messageId });
    
  } catch (error) {
    // Log the error with stack trace if available
    console.error('[TwilioInbound] Unhandled error processing webhook:', 
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
    
    // Always return 200 to Twilio to prevent retries
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 200 }
    );
  }
}

/**
 * Process an inbound SMS message
 * 
 * This function:
 * 1. Attempts to find the sender by phone number (may be unknown)
 * 2. Uses the system user as the recipient
 * 3. Creates a database record for the message
 */
async function processInboundMessage(
  supabase: SupabaseClient,
  params: {
    messageSid: string;
    from: string;
    to: string;
    body: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { messageSid, from, body } = params;
  
  try {
    // 1. Normalize the phone number and find the sender
    const normalizedPhone = normalizePhoneNumber(from);
    console.log(`[TwilioInbound] Looking up user with phone: ${normalizedPhone}`);
    
    // 2. Find the sender (may be null if unknown)
    const sender = await findUserByPhone(supabase, normalizedPhone);
    
    if (!sender) {
      console.warn(`[TwilioInbound] No user found with phone number: ${normalizedPhone}`);
      console.log(`[TwilioInbound] This will appear as "Unknown" in the UI`);
    } else {
      console.log(`[TwilioInbound] Found user: ${sender.first_name} ${sender.last_name}`);
    }
    
    // 3. Create message record in database
    const messageId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // 4. Prepare message data - use the system user ID as recipient
    // For unknown senders, we'll still use system user ID for the sender,
    // and the UI will display "Unknown" based on the is_outbound=false flag and missing user
    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        id: messageId,
        sender_id: sender?.id || SYSTEM_USER_ID, // Use system ID if no sender found
        recipient_id: SYSTEM_USER_ID, // System user is always the recipient
        content: body,
        twilio_sid: messageSid,
        status: 'delivered', // Inbound messages are already delivered
        is_outbound: false,  // This is an inbound message
        created_at: timestamp,
        updated_at: timestamp
      });
    
    if (insertError) {
      console.error('[TwilioInbound] Database insert error:', insertError);
      return {
        success: false,
        error: `Failed to insert message: ${insertError.message}`
      };
    }
    
    // 5. If the sender wasn't found by phone, log additional information
    if (!sender) {
      console.log('[TwilioInbound] Additional information for unknown sender:', {
        phone: normalizedPhone,
        messageSid
      });
      
      // Consider storing this phone number in another table for tracking unknown senders
      // This would be a good enhancement in the future
    }
    
    return { success: true, messageId };
    
  } catch (error) {
    console.error('[TwilioInbound] Error processing message:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error processing message' 
    };
  }
}

/**
 * Normalize a phone number to match our database format
 * 
 * Twilio sends phone numbers in E.164 format (+15551234567)
 * This function ensures it matches how phone numbers are stored in our database
 */
function normalizePhoneNumber(phone: string): string {
  // If the phone number already has a '+' prefix, it's likely already in E.164 format
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // For US numbers (10 digits), add +1 prefix
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  }
  
  // If it's already an 11-digit number starting with 1 (US/Canada),
  // just add the '+' prefix
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  }
  
  // For other cases, add a '+' prefix and return (assuming it's an international number)
  return `+${digitsOnly}`;
}

/**
 * Find a user by phone number
 * 
 * Looks up a user in the database by their phone number
 */
async function findUserByPhone(
  supabase: SupabaseClient,
  phone: string
): Promise<UserProfile | null> {
  console.log(`[TwilioInbound] Searching for user with phone: ${phone}`);
  
  // Try exact match with the normalized phone number
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, phone, email')
    .eq('phone', phone)
    .limit(1);
    
  if (error) {
    console.error('[TwilioInbound] Database error while looking up user:', error);
    throw new Error(`Database error: ${error.message}`);
  }
  
  console.log('[TwilioInbound] Exact match query result:', data);
  
  if (data && data.length > 0) {
    console.log(`[TwilioInbound] Found user with exact phone match: ${data[0].first_name} ${data[0].last_name}`);
    return data[0];
  }
  
  // Get ALL users to see what's in the database
  console.log('[TwilioInbound] Getting ALL users from database:');
  const { data: allUsersList, error: allError } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, phone')
    .limit(20); // Get up to 20 users to see what's there
    
  if (allError) {
    console.error('[TwilioInbound] Error retrieving ALL users:', allError);
  } else {
    console.log(`[TwilioInbound] Found ${allUsersList?.length || 0} total users in database`);
    allUsersList?.forEach(u => {
      console.log(`- User: ${u.first_name} ${u.last_name}, Phone: ${u.phone || 'none'}`);
    });
  }
  
  // Get users with non-null phone numbers
  console.log('[TwilioInbound] User not found with exact match, listing all users with phone numbers:');
  const { data: allUsers, error: allUsersError } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, phone')
    .not('phone', 'is', null);
    
  if (allUsersError) {
    console.error('[TwilioInbound] Error retrieving all users with phones:', allUsersError);
  } else {
    console.log(`[TwilioInbound] Found ${allUsers?.length || 0} users with phone numbers`);
    
    // Try direct SQL search for the phone number to check if it exists
    const { data: rawSearchResult, error: rawSearchError } = await supabase
      .rpc('search_user_by_phone', { search_phone: phone });
      
    if (rawSearchError) {
      console.error('[TwilioInbound] Error with direct SQL search:', rawSearchError);
    } else {
      console.log('[TwilioInbound] Raw SQL search result:', rawSearchResult);
    }
    
    // Using find to capture the return value
    const matchedUser = allUsers?.find(user => {
      console.log(`- User: ${user.first_name} ${user.last_name}, Phone: "${user.phone}"`);
      
      // Direct comparison
      if (user.phone === phone) {
        console.log(`[TwilioInbound] Found DIRECT match: ${user.first_name} ${user.last_name}`);
        return true;
      }
      
      // Try to find a match using string includes or other patterns
      const userPhone = user.phone?.replace(/\s+/g, '') || '';
      const searchPhone = phone.replace(/\s+/g, '');
      
      if (userPhone === searchPhone) {
        console.log(`[TwilioInbound] Found whitespace normalized match: ${user.first_name} ${user.last_name}`);
        return true;
      }
      
      // Check if the numbers match after removing all non-digit characters
      const userDigits = userPhone.replace(/\D/g, '');
      const searchDigits = searchPhone.replace(/\D/g, '');
      
      if (userDigits === searchDigits) {
        console.log(`[TwilioInbound] Found digits-only match: ${user.first_name} ${user.last_name}`);
        return true;
      }
      
      return false;
    });
    
    if (matchedUser) {
      return matchedUser;
    }
  }
  
  // Try a direct query with ILIKE
  console.log('[TwilioInbound] Trying ILIKE search for:', phone);
  const { data: ilikeData, error: ilikeError } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, phone, email')
    .ilike('phone', `%${phone}%`)
    .limit(1);
    
  if (ilikeError) {
    console.error('[TwilioInbound] Error with ILIKE search:', ilikeError);
  } else if (ilikeData && ilikeData.length > 0) {
    console.log(`[TwilioInbound] Found user with ILIKE: ${ilikeData[0].first_name} ${ilikeData[0].last_name}`);
    return ilikeData[0];
  } else {
    console.log('[TwilioInbound] No results from ILIKE search');
  }
  
  // If we've gotten this far, try the flexible search as before...
  return null; // Explicitly return null as the fallback
}

/**
 * Determine the appropriate admin recipient for an inbound message
 */
async function _determineRecipient(
  supabase: SupabaseClient,
  senderId: string | undefined,
  _senderPhone: string
): Promise<ConversationParticipant | null> {
  // If we have a sender ID, look for the most recent conversation
  if (senderId) {
    // Find the most recent outbound message to this user
    // to determine which admin was talking to them
    const { data: prevMessages, error: messageError } = await supabase
      .from('messages')
      .select(`
        id, 
        sender_id,
        sender:sender_id(id, first_name, last_name)
      `)
      .eq('recipient_id', senderId)
      .eq('is_outbound', true)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (messageError) {
      console.error('[TwilioInbound] Error finding previous conversation:', messageError);
      // Continue to fallback instead of throwing an error
    }
    
    // If we found a previous message, use that sender as our recipient
    if (prevMessages && prevMessages.length > 0 && prevMessages[0].sender) {
      // Instead of casting to a potentially incorrect type, directly access the properties
      // with proper safety checks
      const senderData = prevMessages[0].sender;
      
      // Check if sender is an array (as TypeScript thinks) and get the first item if so
      const sender = Array.isArray(senderData) ? senderData[0] : senderData;
      
      // Add additional null checks for safety
      if (sender && sender.id && sender.first_name && sender.last_name) {
        return {
          id: sender.id,
          name: `${sender.first_name} ${sender.last_name}`,
          isAdmin: true
        };
      } else {
        console.error('[TwilioInbound] Sender data is incomplete:', sender);
      }
    }
  }
  
  // Fallback to default admin if configured
  if (DEFAULT_ADMIN_ID) {
    // Look up the default admin's information
    const { data: adminData, error: adminError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name')
      .eq('id', DEFAULT_ADMIN_ID)
      .single();
      
    if (adminError) {
      console.error('[TwilioInbound] Error finding default admin:', adminError);
      // Continue to the next fallback
    }
    
    if (adminData) {
      return {
        id: adminData.id,
        name: `${adminData.first_name} ${adminData.last_name}`,
        isAdmin: true
      };
    }
  }
  
  // Look for any admin user based on role_type
  // Try the role types in order of preference
  const adminRoles = ['Admin', 'Executive', 'Manager'];
  
  for (const roleType of adminRoles) {
    const { data: adminUsers, error: adminError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name')
      .eq('role_type', roleType)
      .limit(1);
      
    if (adminError) {
      console.error(`[TwilioInbound] Error finding ${roleType} user:`, adminError);
      continue; // Try the next role type
    }
    
    if (adminUsers && adminUsers.length > 0) {
      console.log(`[TwilioInbound] Found ${roleType} user to receive message:`, 
        adminUsers[0].first_name, adminUsers[0].last_name);
      
      return {
        id: adminUsers[0].id,
        name: `${adminUsers[0].first_name} ${adminUsers[0].last_name}`,
        isAdmin: true
      };
    }
  }
  
  // Last resort: Get any user from the database
  console.warn('[TwilioInbound] No admin users found, trying to find any user as recipient');
  
  const { data: anyUser, error: anyUserError } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name')
    .limit(1);
    
  if (anyUserError) {
    console.error('[TwilioInbound] Error finding any user:', anyUserError);
    return null;
  }
  
  if (anyUser && anyUser.length > 0) {
    console.warn('[TwilioInbound] Using non-admin user as recipient due to lack of admin users:', 
      anyUser[0].first_name, anyUser[0].last_name);
    
    return {
      id: anyUser[0].id,
      name: `${anyUser[0].first_name} ${anyUser[0].last_name}`,
      isAdmin: false
    };
  }
  
  // If we can't find any user at all, log an error and return null
  console.error('[TwilioInbound] Could not determine a recipient for message - no users found in database');
  return null;
} 