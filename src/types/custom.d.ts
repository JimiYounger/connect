// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { SupabaseClient } from '@supabase/supabase-js';

// Augment the SupabaseClient type to include our custom RPC function
declare module '@supabase/supabase-js' {
  interface SupabaseClient {
    rpc<T>(
      fn: 'match_documents' | string,
      params?: {
        query_embedding?: number[];
        match_threshold?: number;
        match_count?: number;
        [key: string]: any;
      }
    ): { data: T; error: Error };
  }
} 