// my-app/src/features/documentLibrary/search/types.ts

/**
 * Types for the document library semantic search feature
 */

// Document chunk from search results
export interface DocumentChunk {
  chunk_index: number;
  content: string;
  similarity: number;
}

// Main search result object
export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  similarity: number;
  highlight: string; // Snippet from the most relevant chunk
  matching_chunks: DocumentChunk[];
  visibility?: {
    role_type?: string;
    [key: string]: any;
  };
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  embedding_status: string;
  [key: string]: any; // Allow for additional fields from the database
}

// API response shape
export interface SearchResponse {
  success: boolean;
  query: string;
  result_count: number;
  searched_at: string;
  filters_used: Record<string, any>;
  sort_by: 'similarity' | 'created_at' | 'title';
  results: SearchResult[];
}

// API request shape
export interface SearchRequest {
  query: string;
  filters?: Record<string, any>;
  match_threshold?: number;
  match_count?: number;
  sort_by?: 'similarity' | 'created_at' | 'title';
  log_search?: boolean; // Flag to control whether to log this search
}

// Props for the SemanticSearch component
export interface SemanticSearchProps {
  placeholder?: string;
  onResults?: (results: SearchResult[]) => void;
  filters?: Record<string, any>;
  autoFocus?: boolean;
  matchThreshold?: number;
  matchCount?: number;
  initialSortBy?: 'similarity' | 'created_at' | 'title';
  className?: string;
  initialQuery?: string;
}

// Error state
export interface SearchError {
  message: string;
} 