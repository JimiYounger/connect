import { Database } from '@/types/supabase';

// Type aliases from Supabase schema
export type BulkMessageRow = Database['public']['Tables']['bulk_messages']['Row'];
export type MessageRow = Database['public']['Tables']['messages']['Row'];
export type UserMessagePreferencesRow = Database['public']['Tables']['user_message_preferences']['Row'];
export type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];

// Message status types
export enum MessageStatus {
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  READ = 'read',
}

// Template variable types
export interface TemplateVariable {
  key: string;
  value: string;
}

// Organization filter criteria
export interface OrganizationFilter {
  roleType?: string | null;
  team?: string | null;
  area?: string | null;
  region?: string | null;
}

// Recipient interface
export interface Recipient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  roleType: string | null;
  team: string | null;
  area: string | null;
  region: string | null;
}

// Message with recipient details
export interface MessageWithDetails extends MessageRow {
  recipient?: UserProfileRow;
  sender?: UserProfileRow;
}

// Bulk message with additional metadata
export interface BulkMessageWithDetails extends BulkMessageRow {
  messages?: MessageRow[];
  successCount?: number;
  failureCount?: number;
  pendingCount?: number;
}

// Message composition interface
export interface MessageComposition {
  content: string;
  templateVariables?: Record<string, string>;
  recipients: Recipient[];
  senderId: string;
}

// Message segment calculation
export interface MessageSegmentInfo {
  content: string;
  segmentCount: number;
  characterCount: number;
  remainingCharacters: number;
  isOverLimit: boolean;
}

// Twilio message response
export interface TwilioMessageResponse {
  sid: string;
  status: string;
  error?: {
    code: string;
    message: string;
  };
}

// Webhook payload for status updates
export interface StatusWebhookPayload {
  MessageSid: string;
  MessageStatus: string;
  ErrorCode?: string;
  ErrorMessage?: string;
}

// Webhook payload for inbound messages
export interface InboundMessagePayload {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
} 