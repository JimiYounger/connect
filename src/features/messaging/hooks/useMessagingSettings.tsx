'use client';

import { useState } from 'react';
import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { MessageStatus } from '../types';

interface MessagingSettings {
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  defaultSenderName?: string;
  defaultMessageFooter?: string;
  maxMessagesPerDay?: number;
  enableDeliveryReports?: boolean;
}

interface MessageStats {
  messageVolume: {
    date: string;
    count: number;
  }[];
  deliveryRate: {
    status: string;
    count: number;
  }[];
  messagesByDepartment: {
    department: string;
    count: number;
  }[];
}

interface OptOutUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  optedOut: boolean;
  optOutReason?: string;
  optOutDate?: string;
}

interface FailedMessage {
  id: string;
  recipient: string;
  recipientId: string;
  date: string;
  content: string;
  error: string;
  status: MessageStatus;
  retryCount: number;
}

/**
 * Hook for managing messaging settings and analytics
 */
export function useMessagingSettings() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Fetch messaging settings
  const settingsQuery = useQuery({
    queryKey: ['messaging-settings'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/messaging/settings');
        
        if (!response.ok) {
          throw new Error('Failed to fetch messaging settings');
        }
        
        const data = await response.json();
        return data.settings as MessagingSettings;
      } catch (error) {
        console.error('Error fetching messaging settings:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch messaging settings');
        return {} as MessagingSettings;
      }
    },
  });

  // Update messaging settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<MessagingSettings>) => {
      const response = await fetch('/api/messaging/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch settings
      queryClient.invalidateQueries({ queryKey: ['messaging-settings'] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Fetch messaging statistics
  const statsQuery = useQuery({
    queryKey: ['messaging-stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/messaging/stats');
        
        if (!response.ok) {
          throw new Error('Failed to fetch messaging statistics');
        }
        
        const data = await response.json();
        return data.stats as MessageStats;
      } catch (error) {
        console.error('Error fetching messaging statistics:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch messaging statistics');
        return {
          messageVolume: [],
          deliveryRate: [],
          messagesByDepartment: []
        } as MessageStats;
      }
    },
    // Refresh stats every 5 minutes
    refetchInterval: 5 * 60 * 1000,
  });

  // Fetch users who have opted out
  const optOutUsersQuery = useQuery({
    queryKey: ['opt-out-users'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/messaging/opt-out/users');
        
        if (!response.ok) {
          throw new Error('Failed to fetch opted-out users');
        }
        
        const data = await response.json();
        return data.users as OptOutUser[];
      } catch (error) {
        console.error('Error fetching opted-out users:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch opted-out users');
        return [] as OptOutUser[];
      }
    },
  });

  // Toggle user opt-out status
  const toggleUserOptOutMutation = useMutation({
    mutationFn: async ({ userId, optedOut }: { userId: string; optedOut: boolean }) => {
      const response = await fetch('/api/messaging/opt-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          optedOut,
          reason: optedOut ? 'Admin disabled messaging' : 'Admin enabled messaging'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update opt-out status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch opt-out users
      queryClient.invalidateQueries({ queryKey: ['opt-out-users'] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Fetch failed messages
  const failedMessagesQuery = useQuery({
    queryKey: ['failed-messages'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/messaging/failed');
        
        if (!response.ok) {
          throw new Error('Failed to fetch failed messages');
        }
        
        const data = await response.json();
        return data.messages as FailedMessage[];
      } catch (error) {
        console.error('Error fetching failed messages:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch failed messages');
        return [] as FailedMessage[];
      }
    },
  });

  // Retry a failed message
  const retryMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await fetch(`/api/messaging/retry/${messageId}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to retry message');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch failed messages
      queryClient.invalidateQueries({ queryKey: ['failed-messages'] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Test Twilio configuration
  const testConfigurationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/messaging/test/configuration', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to test configuration');
      }
      
      return response.json();
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  return {
    // Settings
    settings: settingsQuery.data,
    updateSettings: updateSettingsMutation.mutate,
    isUpdatingSettings: updateSettingsMutation.isPending,
    
    // Stats
    stats: statsQuery.data,
    
    // Opt-out users
    optOutUsers: optOutUsersQuery.data,
    toggleUserOptOut: toggleUserOptOutMutation.mutate,
    isTogglingOptOut: toggleUserOptOutMutation.isPending,
    
    // Failed messages
    failedMessages: failedMessagesQuery.data,
    retryMessage: retryMessageMutation.mutate,
    isRetrying: retryMessageMutation.isPending,
    
    // Test configuration
    testConfiguration: testConfigurationMutation.mutate,
    isTesting: testConfigurationMutation.isPending,
    
    // Loading states
    isLoading: settingsQuery.isLoading || statsQuery.isLoading || 
               optOutUsersQuery.isLoading || failedMessagesQuery.isLoading,
    
    // Error handling
    error,
    clearError: () => setError(null),
    
    // Refetch functions
    refetchSettings: settingsQuery.refetch,
    refetchStats: statsQuery.refetch,
    refetchOptOutUsers: optOutUsersQuery.refetch,
    refetchFailedMessages: failedMessagesQuery.refetch,
  };
} 