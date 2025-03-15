/**
 * Messaging Feature Module
 * 
 * This module provides components, hooks, and utilities for the messaging system.
 */

// Components
export { MessageDashboard } from '@/features/messaging/components/admin/MessageDashboard'
export { ConversationList } from '@/features/messaging/components/ConversationList'
export { ConversationView } from '@/features/messaging/components/ConversationView'
export { MessageComposer } from '@/features/messaging/components/MessageComposer'
export { RecipientSelector } from '@/features/messaging/components/RecipientSelector'
export { RecipientPreview } from '@/features/messaging/components/RecipientPreview'
export { MessageBubble } from '@/features/messaging/components/MessageBubble'

// Hooks
export { useMessages } from '@/features/messaging/hooks/useMessages'
export { useRecipients } from '@/features/messaging/hooks/useRecipients'
export { useMessagingSettings } from '@/features/messaging/hooks/useMessagingSettings'

// Types
export { 
  MessageStatus,
  type MessageWithDetails,
  type BulkMessageWithDetails,
  type MessageComposition,
  type MessageSegmentInfo,
  type OrganizationFilter,
  type Recipient,
  type TemplateVariable
} from './types'

/**
 * Note: The following hooks, services, and context providers will be implemented
 * in future phases of the messaging system:
 * 
 * - useConversation
 * - messagingService (sendMessage, sendBulkMessage)
 * - MessagingProvider, useMessagingContext
 */ 