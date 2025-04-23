// my-app/src/features/documentLibrary/search/useSemanticSearch.ts

import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  SearchRequest, 
  SearchResponse, 
  SearchResult,
  SearchError
} from './types';
import { DocumentListParams } from '@/app/api/document-library/list/route'; // Import list types

// Helper to map List API response to SearchResult
function mapListResultToSearchResult(item: any): SearchResult {
  return {
    id: item.id,
    title: item.title || 'Untitled Document',
    highlight: item.contentPreview || '', // Use content preview as highlight
    similarity: 1, // Assign a default similarity score for list items
    tags: item.tags ? item.tags.map((t: any) => t.name) : [], // Extract tag names
    category_name: item.category?.name,
    subcategory_name: item.subcategory?.name,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
    // Add other fields if needed, ensuring they conform to SearchResult
    matching_chunks: [], // List results don't have chunks
    embedding_status: 'complete', // Assume complete for listed items
  };
}

/**
 * Custom hook for semantic search functionality
 */
export const useSemanticSearch = ({
  initialFilters = {},
  initialMatchThreshold = 0.5,
  initialMatchCount = 10,
  initialSortBy = 'similarity',
  onResults
}: {
  initialFilters?: Record<string, any>;
  initialMatchThreshold?: number;
  initialMatchCount?: number;
  initialSortBy?: 'similarity' | 'created_at' | 'title';
  onResults?: (results: SearchResult[]) => void;
}) => {
  // State management
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);
  const [matchThreshold, setMatchThreshold] = useState(initialMatchThreshold);
  const [matchCount, setMatchCount] = useState(initialMatchCount);
  const [sortBy, setSortBy] = useState<'similarity' | 'created_at' | 'title'>(initialSortBy);
  const [lastLoggedQuery, setLastLoggedQuery] = useState<string>(''); // Track what we've already logged
  
  // Results and state management
  const [results, setResults] = useState<SearchResult[]>([]);
  const [response, setResponse] = useState<SearchResponse | null>(null); // Keep original search response
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<SearchError | null>(null);
  
  // Memoize a stable string representation of filters to use as useEffect dependency
  const filtersString = useMemo(() => JSON.stringify(filters), [filters]);
  
  // Debounce input by 500ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    
    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  // Function to fetch list based on filters only
  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResults([]); // Clear previous results
    setResponse(null);

    try {
      const listParams: DocumentListParams = {
        document_category_id: filters.categoryId,
        document_subcategory_id: filters.subcategoryId,
        tags: filters.tagId ? [filters.tagId] : undefined, // List API expects array of tag IDs
        limit: matchCount, // Use matchCount for limit
        // Add pagination if needed: page: 1
      };

      console.log('Sending list request with params:', JSON.stringify(listParams));

      const listResponse = await fetch('/api/document-library/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listParams),
      });

      if (!listResponse.ok) {
        const errorData = await listResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to list documents: ${listResponse.status}`);
      }

      const data = await listResponse.json();
      console.log('List response received:', data);

      if (!data.success) {
        throw new Error(data.error || 'Listing documents was unsuccessful');
      }

      const mappedResults = data.data.map(mapListResultToSearchResult);
      setResults(mappedResults);
      
      // No SearchResponse equivalent for list, set to null or a custom object
      setResponse(null); 

      if (onResults) {
        onResults(mappedResults);
      }
    } catch (err) {
      console.error('List fetch error:', err);
      setError({
        message: err instanceof Error ? err.message : 'An unknown error occurred while fetching list',
      });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, matchCount, onResults]); // Depend on filters object, matchCount, onResults
  
  // Function to perform the semantic search
  const performSearch = useCallback(async () => {
    // If query is empty, do nothing (handled by the main useEffect)
    if (!debouncedQuery) return;
    
    setIsLoading(true);
    setError(null);
    setResults([]); // Clear previous results
    setResponse(null);
    
    try {
      // Logging logic (can be kept or adjusted)
      const isNewSearch = !lastLoggedQuery || 
        (!debouncedQuery.includes(lastLoggedQuery) && !lastLoggedQuery.includes(debouncedQuery)) ||
        (debouncedQuery.length > lastLoggedQuery.length * 1.5);
      const shouldLogSearch = isNewSearch;
      
      // Use filter IDs from the state
      const requestBody: SearchRequest = {
        query: debouncedQuery,
        filters: filters, // Pass the filters state directly (now contains IDs)
        match_threshold: matchThreshold,
        match_count: matchCount,
        sort_by: sortBy,
        log_search: shouldLogSearch
      };
      
      console.log('Sending search request:', JSON.stringify(requestBody, null, 2));
      
      let data;
      try {
        const searchApiResponse = await fetch('/api/document-library/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!searchApiResponse.ok) {
          const errorData = await searchApiResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to search documents: ${searchApiResponse.status}`);
        }
        
        const contentType = searchApiResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Received non-JSON response from search API');
        }
      
        data = await searchApiResponse.json();
        console.log('Search response received:', data);
        
        if (!data.success) {
          throw new Error(data.error || 'Search was unsuccessful');
        }
      } catch (fetchError) {
        console.error('Error during search request:', fetchError);
        const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
        throw new Error(`Search request failed: ${errorMessage}`);
      }
      
      let searchResults: SearchResult[] = [];
      if (Array.isArray(data.results)) {
        searchResults = data.results;
      }
      
      console.log(`Processing ${searchResults.length} search results`);
      
      searchResults = searchResults.map(result => ({
        ...result,
        id: result.id || `unknown-${Math.random().toString(36).substring(2, 9)}`,
        title: result.title || 'Untitled Document',
        similarity: result.similarity || 0,
        highlight: result.highlight || '',
        matching_chunks: result.matching_chunks || [],
        embedding_status: result.embedding_status || 'complete'
      }));
      
      setResults(searchResults);
      setResponse(data); // Store the full search response
      
      if (requestBody.log_search) {
        setLastLoggedQuery(debouncedQuery);
        console.log('Search logged:', debouncedQuery);
      }
      
      if (onResults) {
        onResults(searchResults);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError({ 
        message: err instanceof Error ? err.message : 'An unknown error occurred during search' 
      });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, filters, matchThreshold, matchCount, sortBy, onResults, lastLoggedQuery]); // Keep dependencies
  
  // Main effect to trigger search or list fetch
  useEffect(() => {
    const hasFilters = Object.values(filters).some(v => v && v !== 'all'); // Check if any filters are active

    if (debouncedQuery.trim() !== '') {
      console.log('Debounced query detected, performing semantic search...');
      performSearch();
    } else if (hasFilters) {
      console.log('No query, but filters detected, fetching list...');
      fetchList();
    } else {
      // No query and no filters, clear results
      console.log('No query and no filters, clearing results.');
      setResults([]);
      setResponse(null);
      setError(null);
      setIsLoading(false); // Ensure loading is false
    }
    // Use filtersString as dependency to react to filter changes
  }, [debouncedQuery, filtersString, performSearch, fetchList, filters]); 
  
  // Function to clear the search
  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    // Don't clear results/response immediately, let the main useEffect handle it
    // setResults([]); 
    // setResponse(null);
    setError(null);
    setLastLoggedQuery(''); // Clear the logged query tracking
  }, []);
  
  // Function to update filters (simplified, direct set)
  const updateFilters = useCallback((newFilters: Record<string, any>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);
  
  // Manually trigger search (if needed, ensures debouncedQuery is updated)
  const searchNow = useCallback(() => {
    setDebouncedQuery(query);
  }, [query]);
  
  return {
    // State
    query,
    filters,
    results,
    response,
    isLoading,
    error,
    sortBy,
    matchThreshold,
    matchCount,
    
    // Actions
    setQuery,
    updateFilters, // Keep if used elsewhere
    setFilters, // Expose setFilters directly
    setSortBy,
    setMatchThreshold,
    setMatchCount,
    clearSearch,
    searchNow
  };
}; 