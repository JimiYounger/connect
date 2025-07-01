 
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
  chunk_id: string;
  chunk_index: number;
  content: string;
  similarity: number;
  timestamp_start?: number;
  timestamp_end?: number;
  // Video metadata
  video_title: string;
  video_description?: string;
  vimeo_id?: string;
  vimeo_duration?: number;
  vimeo_thumbnail_url?: string;
  custom_thumbnail_url?: string;
  thumbnail_source?: string;
  video_created_at?: string;
  video_updated_at?: string;
  embedding_status?: string;
  // Category info
  category_id?: string;
  category_name?: string;
  subcategory_id?: string;
  subcategory_name?: string;
  // Visibility info
  visibility_conditions?: any;
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