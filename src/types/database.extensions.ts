 
import type { Database } from './supabase';

// Define the return type for the match_documents function
export interface MatchDocumentResult {
  document_id: string;
  chunk_index: number;
  content: string;
  similarity: number;
}

// Define the return type for the match_video_chunks function
export interface MatchVideoResult {
  video_id: string;
  chunk_index: number;
  content: string;
  similarity: number;
  timestamp_start?: number;
  timestamp_end?: number;
}

// Create our extended database type
export interface ExtendedDatabase extends Database {
  public: Database['public'] & {
    Functions: Database['public']['Functions'] & {
      match_documents: {
        Args: {
          query_embedding: number[];
          match_threshold: number;
          match_count: number;
        };
        Returns: MatchDocumentResult[];
      };
      match_video_chunks: {
        Args: {
          query_embedding: number[];
          match_threshold: number;
          match_count: number;
          filter_category_id?: string;
          filter_subcategory_id?: string;
          filter_series_id?: string;
          filter_tag_ids?: string[];
        };
        Returns: MatchVideoResult[];
      };
    };
  };
} 