// my-app/src/features/documentLibrary/search/useSemanticSearch.ts

import { useState, useCallback, useEffect } from 'react';
import { 
  SearchRequest, 
  SearchResponse, 
  SearchResult,
  SearchError
} from './types';

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
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<SearchError | null>(null);
  
  // Debounce input by 500ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    
    return () => {
      clearTimeout(handler);
    };
  }, [query]);
  
  // Function to perform the search
  const performSearch = useCallback(async () => {
    if (!debouncedQuery) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Determine if we should log this search based on:
      // 1. Has the user stopped typing (we use debounce for this)
      // 2. Is this a new query or just a refinement of the last one
      // 3. Only log each unique query once
      
      // Check if it's a completely new search vs refinement of previous search
      const isNewSearch = !lastLoggedQuery || 
        // Either completely different query
        (!debouncedQuery.includes(lastLoggedQuery) && !lastLoggedQuery.includes(debouncedQuery)) ||
        // Or significant addition (more than 50% change)
        (debouncedQuery.length > lastLoggedQuery.length * 1.5);
      
      // We should log if it's a new search or user has stopped typing for a while
      const shouldLogSearch = isNewSearch;
      
      const requestBody: SearchRequest = {
        query: debouncedQuery,
        filters,
        match_threshold: matchThreshold,
        match_count: matchCount,
        sort_by: sortBy,
        log_search: shouldLogSearch
      };
      
      console.log('Sending search request:', JSON.stringify(requestBody, null, 2));
      console.log('With filters:', JSON.stringify(filters));
      
      let data;
      try {
        const response = await fetch('/api/document-library/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to search documents: ${response.status}`);
        }
        
        // Verify we have a valid response body
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Received non-JSON response from search API');
        }
      
        data = await response.json();
        console.log('Search response received:', data);
        
        if (!data.success) {
          throw new Error(data.error || 'Search was unsuccessful');
        }
      } catch (fetchError) {
        console.error('Error during search request:', fetchError);
        // Type check before accessing .message
        const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
        throw new Error(`Search request failed: ${errorMessage}`);
      }
      
      // Handle different API response formats gracefully
      let searchResults: SearchResult[] = [];
      
      if (Array.isArray(data.results)) {
        searchResults = data.results;
      } else if (data.results && typeof data.results === 'object') {
        // Handle case where results might be in a different format
        searchResults = [data.results];
      }
      
      console.log(`Processing ${searchResults.length} search results`);
      
      // Ensure all results have the required fields
      searchResults = searchResults.map(result => ({
        ...result, // Keep original fields first
        // Default values for missing fields only if they don't exist
        id: result.id || `unknown-${Math.random().toString(36).substring(2, 9)}`,
        title: result.title || 'Untitled Document',
        similarity: result.similarity || 0,
        highlight: result.highlight || '',
        matching_chunks: result.matching_chunks || [],
        embedding_status: result.embedding_status || 'complete'
      }));
      
      setResults(searchResults);
      setResponse(data);
      
      // Track this query as logged if we sent log_search=true
      if (requestBody.log_search) {
        setLastLoggedQuery(debouncedQuery);
        console.log('Search logged:', debouncedQuery);
      }
      
      // Call the optional callback
      if (onResults) {
        onResults(searchResults);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError({ 
        message: err instanceof Error ? err.message : 'An unknown error occurred' 
      });
      
      // Clear results if there's an error
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, filters, matchThreshold, matchCount, sortBy, onResults, lastLoggedQuery]);
  
  // Execute search when debounced query changes
  useEffect(() => {
    // Don't search on empty query
    if (!debouncedQuery) {
      setResults([]);
      setResponse(null);
      return;
    }
    
    console.log('Triggering search with filters:', JSON.stringify(filters));
    performSearch();
  }, [debouncedQuery, filters, matchThreshold, matchCount, sortBy, performSearch]);
  
  // Function to clear the search
  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setResults([]);
    setResponse(null);
    setError(null);
    setLastLoggedQuery(''); // Clear the logged query tracking
  }, []);
  
  // Function to update filters
  const updateFilters = useCallback((newFilters: Record<string, any>) => {
    // Only update if filters have actually changed to prevent loops
    setFilters(prev => {
      const prevJSON = JSON.stringify(prev);
      const nextFilters = { ...prev, ...newFilters };
      const nextJSON = JSON.stringify(nextFilters);
      
      // Only update state if there's an actual change
      return prevJSON !== nextJSON ? nextFilters : prev;
    });
  }, []);
  
  // Manually trigger search (for forms with submit button)
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
    updateFilters,
    setFilters,
    setSortBy,
    setMatchThreshold,
    setMatchCount,
    clearSearch,
    searchNow
  };
}; 