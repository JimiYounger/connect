// my-app/src/features/documentLibrary/viewer/useDocuments.ts

import { useQuery } from '@tanstack/react-query'
import { DocumentFilters, DocumentListResponse, PaginationInfo } from './types'

/**
 * Hook to fetch and filter documents
 * 
 * Uses React Query for data fetching, caching, and background updates.
 * Provides functions for pagination and filtering documents.
 */
export function useDocuments(initialFilters: DocumentFilters = {}) {
  // State is managed through the query key
  const {
    document_category_id,
    tags,
    uploadedBy,
    searchQuery,
    page = 1,
    limit = 20
  } = initialFilters

  // Fetch documents using the list API
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isPending,
    isSuccess
  } = useQuery({
    queryKey: ['documents', { document_category_id, tags, uploadedBy, searchQuery, page, limit }],
    queryFn: async () => {
      const response = await fetch('/api/document-library/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          document_category_id,
          tags,
          uploadedBy,
          searchQuery,
          page,
          limit
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch documents')
      }

      const responseData: DocumentListResponse = await response.json()
      
      if (!responseData.success) {
        throw new Error(responseData.error || 'Unknown error fetching documents')
      }
      
      return responseData
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  })

  // Extract pagination info
  const pagination: PaginationInfo = data ? {
    page: data.page,
    limit: data.limit,
    total: data.total,
    totalPages: data.totalPages
  } : {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  }

  return {
    documents: data?.data || [],
    pagination,
    isLoading,
    isPending,
    isError,
    isSuccess,
    error,
    refetch
  }
}