// Define types for chat messages and references

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface Reference {
  document_id: string;
  title?: string;
  chunk_index: number;
  similarity: number;
  snippet: string;
}

export interface UserContext {
  role_type: string;
  teams: string[];
  areas?: string[];
  regions?: string[];
} 