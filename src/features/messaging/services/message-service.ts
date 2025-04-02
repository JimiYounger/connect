import { createClient } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { 
  MessageStatus, 
  MessageComposition, 
  Recipient, 
  OrganizationFilter,
  BulkMessageRow,
  MessageWithDetails
} from '../types';
import { twilioService, processTemplateVariables } from './twilio-service';

// Add debug logging
if (typeof window === 'undefined') {
  console.log('[MessageService] Server-side execution detected');
}

/**
 * MessageService class for handling message operations
 */
export class MessageService {
  private supabase: SupabaseClient;
  
  constructor(existingClient?: SupabaseClient) {
    // Use the provided client or create a new one
    this.supabase = existingClient || createClient();
    
    if (typeof window === 'undefined') {
      console.log('[MessageService] Using Supabase client', 
                 existingClient ? '(provided from API route)' : '(created with createClient)');
    }
  }
  
  /**
   * Sends a single message to a recipient
   */
  async sendMessage(
    content: string,
    recipientId: string,
    senderId: string,
    templateVariables?: Record<string, string>,
    bulkMessageId?: string
  ): Promise<{ success: boolean; messageId: string; error?: string }> {
    // Early return if this code is running on the client side
    if (typeof window !== 'undefined') {
      console.warn('[MessageService] Direct message sending from client-side is not supported.');
      console.warn('[MessageService] Use the API endpoints (/api/messaging/send or /api/messaging/bulk-send) instead.');
      return { 
        success: false, 
        messageId: '', 
        error: 'Client-side message sending is not supported. Use the messaging API instead.' 
      };
    }
    
    try {
      // FIXED QUERY: Get recipient details
      console.log(`[MessageService] Looking up recipient with ID: ${recipientId}`);
      const { data: recipientData, error: recipientError } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', recipientId);
        
      // Handle cases where no recipient is found or multiple are returned
      if (recipientError) {
        console.error(`[MessageService] Database error fetching recipient:`, recipientError);
        throw new Error(`Database error fetching recipient: ${recipientError.message}`);
      }
      
      if (!recipientData || recipientData.length === 0) {
        console.error(`[MessageService] Recipient not found with ID: ${recipientId}`);
        throw new Error(`Recipient not found with ID: ${recipientId}`);
      }
      
      // Use the first recipient if multiple are returned (shouldn't happen with ID lookup)
      const recipient = recipientData[0];
      console.log(`[MessageService] Found recipient: ${recipient.first_name} ${recipient.last_name}`);
      
      // Check if recipient has opted out
      const { data: preferences, error: preferencesError } = await this.supabase
        .from('user_message_preferences')
        .select('*')
        .eq('user_id', recipientId)
        .single();
        
      if (!preferencesError && preferences?.opted_out) {
        throw new Error('Recipient has opted out of messages');
      }
      
      // Check if recipient has a phone number
      if (!recipient.phone) {
        throw new Error('Recipient does not have a phone number');
      }
      
      // Process template variables
      const recipientObj: Recipient = {
        id: recipient.id || recipientId, // Ensure we have a valid ID
        firstName: recipient.first_name,
        lastName: recipient.last_name,
        email: recipient.email,
        phone: recipient.phone,
        roleType: recipient.role_type,
        team: recipient.team,
        area: recipient.area,
        region: recipient.region
      };
      
      const processedContent = processTemplateVariables(content, recipientObj, templateVariables);
      
      // Create message record in database
      const messageId = uuidv4();
      
      // First, check if an RPC function exists for message insertion
      try {
        const { error: rpcError } = await this.supabase.rpc('insert_message', {
          p_id: messageId,
          p_sender_id: senderId,
          p_recipient_id: recipientId,
          p_content: processedContent,
          p_bulk_message_id: bulkMessageId,
          p_status: 'pending',
          p_is_outbound: true
        });
        
        if (rpcError) {
          console.error('[MessageService] RPC Error:', rpcError);
          // Fall through to the next approach
        } else {
          // RPC succeeded
          return { success: true, messageId };
        }
      } catch (rpcError) {
        console.error('[MessageService] RPC Error:', rpcError);
        // Fall through to the next approach
      }
      
      // Try inserting using the standard approach
      try {
        // Standard insert approach
        const { error: insertError } = await this.supabase
          .from('messages')
          .insert({
            id: messageId,
            sender_id: senderId,
            recipient_id: recipientId,
            content: processedContent,
            bulk_message_id: bulkMessageId || null,
            status: 'pending', 
            is_outbound: true
          })
          .select('id')
          .single();
        
        if (insertError) {
          console.error('[MessageService] Insert Error:', insertError);
          return {
            success: false,
            messageId,
            error: `Failed to insert message: ${insertError.message}`
          };
        }
        
        // Success with database insert, now try to send via Twilio
      } catch (insertError) {
        console.error('[MessageService] Error during insert:', insertError);
        return {
          success: false,
          messageId,
          error: insertError instanceof Error ? insertError.message : 'Unknown error'
        };
      }
      
      // Send message via Twilio (server-side only)
      if (typeof window === 'undefined' && twilioService) {
        console.log(`[MessageService] Sending message via Twilio to ${recipient.phone} (${recipient.first_name} ${recipient.last_name})`);
        
        try {
          const twilioResponse = await twilioService.sendSms({
            to: recipient.phone,
            body: processedContent,
            statusCallback: `${process.env.NEXT_PUBLIC_API_URL}/api/webhooks/twilio/status`
          });
          
          console.log(`[MessageService] Twilio response:`, {
            sid: twilioResponse.sid,
            status: twilioResponse.status,
            hasError: !!twilioResponse.error
          });
          
          // Update message with Twilio SID and status
          await this.supabase
            .from('messages')
            .update({
              twilio_sid: twilioResponse.sid,
              status: twilioResponse.error ? 'failed' : 'sent',
              error_message: twilioResponse.error?.message || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', messageId);
          
          if (twilioResponse.error) {
            return { 
              success: false, 
              messageId, 
              error: twilioResponse.error.message 
            };
          }
        } catch (twilioError) {
          console.error('[MessageService] Error calling Twilio service:', twilioError);
          
          // Update message status to failed
          await this.supabase
            .from('messages')
            .update({
              status: 'failed',
              error_message: twilioError instanceof Error ? twilioError.message : 'Unknown Twilio error',
              updated_at: new Date().toISOString()
            })
            .eq('id', messageId);
            
          return {
            success: false,
            messageId,
            error: twilioError instanceof Error ? twilioError.message : 'Unknown Twilio error'
          };
        }
      }
      
      return { success: true, messageId };
    } catch (error) {
      console.error('Error sending message:', error);
      return { 
        success: false, 
        messageId: '', 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
  
  /**
   * Sends a bulk message to multiple recipients
   */
  async sendBulkMessage(
    messageComposition: MessageComposition
  ): Promise<{ success: boolean; bulkMessageId: string; error?: string; successCount: number }> {
    // Early return if this code is running on the client side
    if (typeof window !== 'undefined') {
      console.warn('[MessageService] Direct bulk message sending from client-side is not supported.');
      console.warn('[MessageService] Use the API endpoint /api/messaging/bulk-send instead.');
      return { 
        success: false, 
        bulkMessageId: '', 
        error: 'Client-side bulk message sending is not supported. Use the messaging API instead.',
        successCount: 0
      };
    }
    
    try {
      const { content, templateVariables, recipients, senderId } = messageComposition;
      
      // Create bulk message record
      const bulkMessageId = uuidv4();
      
      const { error } = await this.supabase
        .from('bulk_messages')
        .insert({
          id: bulkMessageId,
          content,
          sender_id: senderId,
          total_recipients: recipients.length,
          query_parameters: {}, // Required field - can't be null
          template_variables: templateVariables || null,
          created_at: new Date().toISOString()
        });
        
      if (error) {
        throw new Error(`Failed to create bulk message record: ${error.message}`);
      }
      
      // Send messages to each recipient
      // In a production environment, this would be handled by a background job
      // or serverless function to avoid timeout issues with large recipient lists
      const messagePromises = recipients.map(recipient => 
        this.sendMessage(
          content, 
          recipient.id, 
          senderId, 
          templateVariables, 
          bulkMessageId
        )
      );
      
      // Wait for all messages to be sent
      const results = await Promise.all(messagePromises);
      
      // Count successes and failures
      const successCount = results.filter(result => result.success).length;
      const failureCount = results.length - successCount;
      
      // Update bulk message with results
      await this.supabase
        .from('bulk_messages')
        .update({
          total_recipients: recipients.length,
          success_count: successCount, // Store the success count in the database
          failure_count: failureCount  // Store the failure count in the database
        })
        .eq('id', bulkMessageId);
      
      return { 
        success: successCount > 0, 
        bulkMessageId,
        error: failureCount > 0 ? `${failureCount} messages failed to send` : undefined,
        successCount
      };
    } catch (error) {
      console.error('Error sending bulk message:', error);
      return { 
        success: false, 
        bulkMessageId: '', 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        successCount: 0
      };
    }
  }
  
  /**
   * Fetches recipients based on organization filters
   */
  async getRecipientsByFilter(
    filter: OrganizationFilter
  ): Promise<Recipient[]> {
    try {
      let query = this.supabase
        .from('user_profiles')
        .select('*');
      
      // Apply filters
      if (filter.roleType) {
        query = query.eq('role_type', filter.roleType);
      }
      
      if (filter.team) {
        query = query.eq('team', filter.team);
      }
      
      if (filter.area) {
        query = query.eq('area', filter.area);
      }
      
      if (filter.region) {
        query = query.eq('region', filter.region);
      }
      
      // Only include users with phone numbers
      query = query.not('phone', 'is', null);
      
      // Exclude opted-out users
      const { data: optedOutUsers, error: optedOutError } = await this.supabase
        .from('user_message_preferences')
        .select('user_id')
        .eq('opted_out', true);
        
      if (!optedOutError && optedOutUsers && optedOutUsers.length > 0) {
        const optedOutIds = optedOutUsers.map(user => user.user_id);
        query = query.not('id', 'in', optedOutIds);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch recipients: ${error.message}`);
      }
      
      // Map to Recipient interface
      return (data || []).map(user => ({
        id: user.id || `temp-${Date.now()}`, // Ensure we have a valid ID
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        roleType: user.role_type,
        team: user.team,
        area: user.area,
        region: user.region
      }));
    } catch (error) {
      console.error('Error fetching recipients:', error);
      throw error;
    }
  }
  
  /**
   * Updates message status based on Twilio webhook
   */
  async updateMessageStatus(
    twilioSid: string,
    status: MessageStatus | string,
    errorMessage?: string
  ): Promise<void> {
    try {
      // Ensure status is lowercase to match database constraint
      let formattedStatus: string;
      if (typeof status === 'string') {
        formattedStatus = status.toLowerCase();
      } else {
        formattedStatus = String(status).toLowerCase();
      }
      
      const { error } = await this.supabase
        .from('messages')
        .update({
          status: formattedStatus,
          error_message: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('twilio_sid', twilioSid);
        
      if (error) {
        throw new Error(`Failed to update message status: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating message status:', error);
      throw error;
    }
  }
  
  /**
   * Fetches conversation history with a specific user
   */
  async getConversationHistory(
    userId: string,
    otherUserId: string,
    limit = 50,
    offset = 0
  ): Promise<MessageWithDetails[]> {
    try {
      // Get messages between the two users
      const query = this.supabase
        .from('messages')
        .select(`
          *,
          recipient:recipient_id(id, first_name, last_name, email, phone, profile_pic_url),
          sender:sender_id(id, first_name, last_name, email, phone, profile_pic_url)
        `)
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`)
        .order('created_at', { ascending: false })
        .limit(limit);
        
      // Use range instead of offset for pagination
      const { data, error } = await query.range(offset, offset + limit - 1);
        
      if (error) {
        throw new Error(`Failed to fetch conversation history: ${error.message}`);
      }
      
      return data as unknown as MessageWithDetails[] || [];
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      throw error;
    }
  }
  
  /**
   * Fetches all conversations for a user
   */
  async getUserConversations(userId: string): Promise<Record<string, MessageWithDetails>> {
    try {
      // Since the RPC function doesn't exist in the database schema,
      // we'll use a direct query instead
      const { data, error } = await this.supabase
        .from('messages')
        .select(`
          *,
          recipient:recipient_id(id, first_name, last_name, email, phone, profile_pic_url),
          sender:sender_id(id, first_name, last_name, email, phone, profile_pic_url)
        `)
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw new Error(`Failed to fetch user conversations: ${error.message}`);
      }
      
      // Group by conversation partner and take the most recent
      const conversations: Record<string, MessageWithDetails> = {};
      (data as unknown as MessageWithDetails[])?.forEach(message => {
        const partnerId = message.sender_id === userId ? message.recipient_id : message.sender_id;
        if (!conversations[partnerId] || new Date(message.created_at) > new Date(conversations[partnerId].created_at)) {
          conversations[partnerId] = message;
        }
      });
      
      return conversations;
    } catch (error) {
      console.error('Error fetching user conversations:', error);
      throw error;
    }
  }
  
  /**
   * Marks a message as read
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('messages')
        .update({
          status: 'read',
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);
        
      if (error) {
        throw new Error(`Failed to mark message as read: ${error.message}`);
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }
  
  /**
   * Updates user message preferences (opt-out status)
   */
  async updateUserMessagePreferences(
    userId: string,
    optedOut: boolean
  ): Promise<void> {
    try {
      // Check if preferences record exists
      const { data, error } = await this.supabase
        .from('user_message_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw new Error(`Failed to check user preferences: ${error.message}`);
      }
      
      const timestamp = new Date().toISOString();
      
      if (data) {
        // Update existing record
        const { error: updateError } = await this.supabase
          .from('user_message_preferences')
          .update({
            opted_out: optedOut,
            opted_out_at: optedOut ? timestamp : null
          })
          .eq('user_id', userId);
          
        if (updateError) {
          throw new Error(`Failed to update user preferences: ${updateError.message}`);
        }
      } else {
        // Create new record
        const { error: insertError } = await this.supabase
          .from('user_message_preferences')
          .insert({
            user_id: userId,
            opted_out: optedOut,
            opted_out_at: optedOut ? timestamp : null
          });
          
        if (insertError) {
          throw new Error(`Failed to create user preferences: ${insertError.message}`);
        }
      }
    } catch (error) {
      console.error('Error updating user message preferences:', error);
      throw error;
    }
  }
  
  /**
   * Gets a single message by ID
   */
  async getMessageById(messageId: string): Promise<MessageWithDetails | null> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select(`
          *,
          recipient:recipient_id(id, first_name, last_name, email, phone, profile_pic_url),
          sender:sender_id(id, first_name, last_name, email, phone, profile_pic_url)
        `)
        .eq('id', messageId)
        .single();
        
      if (error) {
        throw new Error(`Failed to fetch message: ${error.message}`);
      }
      
      return data as unknown as MessageWithDetails;
    } catch (error) {
      console.error('Error fetching message:', error);
      return null;
    }
  }
  
  /**
   * Gets a bulk message with details
   */
  async getBulkMessageById(bulkMessageId: string): Promise<BulkMessageRow | null> {
    try {
      const { data, error } = await this.supabase
        .from('bulk_messages')
        .select('*')
        .eq('id', bulkMessageId)
        .single();
        
      if (error) {
        throw new Error(`Failed to fetch bulk message: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching bulk message:', error);
      return null;
    }
  }
}

// Export a singleton instance for use throughout the application
export const messageService = new MessageService(); 