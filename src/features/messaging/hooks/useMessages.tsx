'use client';

import { useState } from 'react';
import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  UseQueryResult 
} from '@tanstack/react-query';
import { messageService } from '../services/message-service';
import { 
  MessageWithDetails, 
  MessageStatus, 
  Recipient 
} from '../types';
import { useAuth } from '@/features/auth/context/auth-context';

interface UseMessagesOptions {
  userId?: string;
  limit?: number;
  enabled?: boolean;
}

interface SendMessageParams {
  recipientId: string;
  content: string;
  templateVariables?: Record<string, string>;
}

interface SendBulkMessageParams {
  content: string;
  recipientIds: string[];
  templateVariables?: Record<string, string>;
}

/**
 * Hook for managing messages and conversations
 */
export function useMessages(options: UseMessagesOptions = {}) {
  const { userId, limit = 50, enabled = true } = options;
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  
  // Get current user ID from session
  const currentUserId = session?.user?.id;
  
  // Fetch conversation history with a specific user
  const conversationQuery = useQuery({
    queryKey: ['conversation', userId, currentUserId],
    queryFn: () => {
      if (!userId || !currentUserId) {
        return Promise.resolve([]);
      }
      return messageService.getConversationHistory(currentUserId, userId, limit);
    },
    enabled: enabled && !!userId && !!currentUserId,
  });
  
  // Fetch all conversations for the current user
  const conversationsQuery = useQuery({
    queryKey: ['conversations', currentUserId],
    queryFn: () => {
      if (!currentUserId) {
        return Promise.resolve({});
      }
      return messageService.getUserConversations(currentUserId);
    },
    enabled: enabled && !!currentUserId,
  });
  
  // Fetch unread message count
  const unreadCountQuery = useQuery({
    queryKey: ['unreadCount', currentUserId],
    queryFn: async () => {
      if (!currentUserId) {
        return 0;
      }
      
      try {
        const response = await fetch('/api/messaging/unread-count');
        if (!response.ok) {
          throw new Error('Failed to fetch unread count');
        }
        const data = await response.json();
        return data.count || 0;
      } catch (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }
    },
    enabled: enabled && !!currentUserId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Send a message to a single recipient
  const sendMessageMutation = useMutation({
    mutationFn: async ({ recipientId, content, templateVariables }: SendMessageParams) => {
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
      
      if (!content.trim()) {
        throw new Error('Message content cannot be empty');
      }
      
      const result = await messageService.sendMessage(
        content,
        recipientId,
        currentUserId,
        templateVariables
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }
      
      return result;
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.recipientId, currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUserId] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
  
  // Send a bulk message to multiple recipients
  const sendBulkMessageMutation = useMutation({
    mutationFn: async ({ content, recipientIds, templateVariables }: SendBulkMessageParams) => {
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
      
      if (!content.trim()) {
        throw new Error('Message content cannot be empty');
      }
      
      if (!recipientIds.length) {
        throw new Error('No recipients selected');
      }
      
      // Fetch recipient details for all recipient IDs
      const recipients = await messageService.getRecipientsByFilter({});
      const selectedRecipients = recipients.filter(r => recipientIds.includes(r.id));
      
      const result = await messageService.sendBulkMessage({
        content,
        templateVariables,
        recipients: selectedRecipients,
        senderId: currentUserId
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send bulk message');
      }
      
      return result;
    },
    onSuccess: () => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUserId] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
  
  // Mark a message as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await messageService.markMessageAsRead(messageId);
      return messageId;
    },
    onSuccess: (messageId) => {
      // Update the message in the cache
      queryClient.setQueryData(
        ['conversation', userId, currentUserId],
        (oldData: MessageWithDetails[] | undefined) => {
          if (!oldData) return [];
          
          return oldData.map(message => {
            if (message.id === messageId) {
              return {
                ...message,
                status: MessageStatus.READ,
                read_at: new Date().toISOString()
              };
            }
            return message;
          });
        }
      );
      
      // Also invalidate unread count
      queryClient.invalidateQueries({ queryKey: ['unreadCount', currentUserId] });
    },
  });
  
  // Mark all messages in a conversation as read
  const markConversationAsReadMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
      
      try {
        const response = await fetch(`/api/messaging/conversations/${otherUserId}/read`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          throw new Error('Failed to mark conversation as read');
        }
        
        return otherUserId;
      } catch (error) {
        console.error('Error marking conversation as read:', error);
        throw error;
      }
    },
    onSuccess: (otherUserId) => {
      // Update the messages in the cache
      queryClient.setQueryData(
        ['conversation', otherUserId, currentUserId],
        (oldData: MessageWithDetails[] | undefined) => {
          if (!oldData) return [];
          
          return oldData.map(message => {
            if (!message.is_outbound && message.status !== MessageStatus.READ) {
              return {
                ...message,
                status: MessageStatus.READ,
                read_at: new Date().toISOString()
              };
            }
            return message;
          });
        }
      );
      
      // Also invalidate conversations and unread count
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', currentUserId] });
    },
  });
  
  // Update user message preferences (opt-out status)
  const updatePreferencesMutation = useMutation({
    mutationFn: async ({ userId, optedOut }: { userId: string; optedOut: boolean }) => {
      await messageService.updateUserMessagePreferences(userId, optedOut);
      return { userId, optedOut };
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUserId] });
    },
  });
  
  return {
    // Queries
    conversation: conversationQuery.data || [],
    conversations: conversationsQuery.data || {},
    unreadCount: unreadCountQuery.data || 0,
    isLoadingConversation: conversationQuery.isLoading,
    isLoadingConversations: conversationsQuery.isLoading,
    isLoadingUnreadCount: unreadCountQuery.isLoading,
    isErrorConversation: conversationQuery.isError,
    isErrorConversations: conversationsQuery.isError,
    errorConversation: conversationQuery.error,
    errorConversations: conversationsQuery.error,
    
    // Mutations
    sendMessage: sendMessageMutation.mutate,
    sendBulkMessage: sendBulkMessageMutation.mutate,
    markAsRead: markAsReadMutation.mutate,
    markConversationAsRead: markConversationAsReadMutation.mutate,
    updatePreferences: updatePreferencesMutation.mutate,
    
    // Mutation states
    isSending: sendMessageMutation.isPending,
    isSendingBulk: sendBulkMessageMutation.isPending,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingConversationAsRead: markConversationAsReadMutation.isPending,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
    
    // Error state
    error,
    clearError: () => setError(null),
    
    // Refetch functions
    refetchConversation: conversationQuery.refetch,
    refetchConversations: conversationsQuery.refetch,
    refetchUnreadCount: unreadCountQuery.refetch,
  };
} 