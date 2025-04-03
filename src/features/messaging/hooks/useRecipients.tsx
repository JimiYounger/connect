'use client';

import { useState } from 'react';
import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { recipientService } from '../services/recipient-service';
import { 
  Recipient, 
  OrganizationFilter 
} from '../types';
import type { OrganizationStructure } from '@/features/organization/types';

interface UseRecipientsOptions {
  initialFilter?: OrganizationFilter;
  pageSize?: number;
  enabled?: boolean;
}

interface RecipientPaginationResult {
  recipients: Recipient[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
}

/**
 * Hook for managing recipient selection and filtering
 */
export function useRecipients(options: UseRecipientsOptions = {}) {
  const { 
    initialFilter = {}, 
    pageSize = 20, 
    enabled = true 
  } = options;
  
  const _queryClient = useQueryClient();
  const [filter, setFilter] = useState<OrganizationFilter>(initialFilter);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch organization structure for filter options
  const organizationQuery = useQuery({
    queryKey: ['organization-structure'],
    queryFn: () => recipientService.getFilterOptions(),
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    enabled,
  });
  
  // Fetch recipients based on filter and pagination
  const recipientsQuery = useQuery({
    queryKey: ['recipients', filter, page, pageSize],
    queryFn: async () => {
      const offset = (page - 1) * pageSize;
      const { recipients, totalCount } = await recipientService.getRecipientsByFilter(
        filter,
        pageSize,
        offset
      );
      
      const pageCount = Math.ceil(totalCount / pageSize);
      
      return {
        recipients,
        totalCount,
        pageCount,
        currentPage: page
      } as RecipientPaginationResult;
    },
    enabled: enabled && (
      // Only fetch if we have a filter or if we're on the first page
      Object.values(filter).some(value => !!value) || page === 1
    ),
  });
  
  // Fetch recipient preview (smaller set for UI display)
  const previewQuery = useQuery({
    queryKey: ['recipients-preview', filter],
    queryFn: () => recipientService.getRecipientsPreview(filter),
    enabled: false, // Only fetch when explicitly requested
  });
  
  // Fetch a single recipient by ID
  const getRecipientById = async (id: string): Promise<Recipient | null> => {
    try {
      return await recipientService.getRecipientById(id);
    } catch (error) {
      console.error('Error fetching recipient:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch recipient');
      return null;
    }
  };
  
  // Fetch recipients by IDs
  const getRecipientsByIds = async (ids: string[]): Promise<Recipient[]> => {
    try {
      return await recipientService.getRecipientsByIds(ids);
    } catch (error) {
      console.error('Error fetching recipients by IDs:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch recipients');
      return [];
    }
  };
  
  // Validate recipients (check if they can receive messages)
  const validateRecipientsMutation = useMutation({
    mutationFn: (recipients: Recipient[]) => recipientService.validateRecipients(recipients),
    onError: (error: Error) => {
      setError(error.message);
    },
  });
  
  // Check if a user has opted out
  const checkOptOutStatus = async (userId: string): Promise<boolean> => {
    try {
      return await recipientService.hasUserOptedOut(userId);
    } catch (error) {
      console.error('Error checking opt-out status:', error);
      return false;
    }
  };
  
  // Get recipient count for the current filter
  const getRecipientCount = async (): Promise<number> => {
    try {
      return await recipientService.getRecipientCount(filter);
    } catch (error) {
      console.error('Error getting recipient count:', error);
      setError(error instanceof Error ? error.message : 'Failed to get recipient count');
      return 0;
    }
  };
  
  // Update filter and reset pagination
  const updateFilter = (newFilter: OrganizationFilter) => {
    setFilter(newFilter);
    setPage(1); // Reset to first page when filter changes
  };
  
  // Request a preview of recipients
  const requestPreview = () => {
    return previewQuery.refetch();
  };
  
  // Get filter options for a specific field
  const getFilterOptions = (field: keyof OrganizationStructure): string[] => {
    if (!organizationQuery.data) return [];
    
    switch (field) {
      case 'roleTypes':
        return organizationQuery.data.roleTypes || [];
      case 'teams':
        return organizationQuery.data.teams || [];
      case 'areas':
        return organizationQuery.data.areas || [];
      case 'regions':
        return organizationQuery.data.regions || [];
      default:
        return [];
    }
  };
  
  return {
    // State
    filter,
    page,
    pageSize,
    
    // Data
    recipients: recipientsQuery.data?.recipients || [],
    totalCount: recipientsQuery.data?.totalCount || 0,
    pageCount: recipientsQuery.data?.pageCount || 0,
    previewRecipients: previewQuery.data?.recipients || [],
    previewCount: previewQuery.data?.totalCount || 0,
    organizationStructure: organizationQuery.data,
    
    // Loading states
    isLoading: recipientsQuery.isLoading,
    isLoadingPreview: previewQuery.isLoading,
    isLoadingOrganization: organizationQuery.isLoading,
    
    // Error states
    isError: recipientsQuery.isError,
    error: error || recipientsQuery.error,
    
    // Actions
    updateFilter,
    setPage,
    requestPreview,
    getRecipientById,
    getRecipientsByIds,
    validateRecipients: validateRecipientsMutation.mutate,
    checkOptOutStatus,
    getRecipientCount,
    getFilterOptions,
    clearError: () => setError(null),
    
    // Refetch functions
    refetch: recipientsQuery.refetch,
    refetchPreview: previewQuery.refetch,
    refetchOrganization: organizationQuery.refetch,
  };
} 