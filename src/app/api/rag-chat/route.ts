// my-app/src/app/api/rag-chat/route.ts

import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { logSearchActivity } from '@/lib/logSearchActivity'
import { createHighlight } from '@/lib/snippet'
import { safeLog, timeOperation } from '@/lib/utils/logging'

// Validate required environment variables early
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

// Configuration constants
const SIMILARITY_THRESHOLD = 0.85;
const MATCH_COUNT = 3;
const EMBEDDING_MODEL = "text-embedding-3-large";
const CHAT_MODEL = "gpt-4o-mini";
const CHAT_TEMPERATURE = 0.5;
const CHAT_MAX_TOKENS = 500;
const _RATE_LIMIT_INTERVAL_MS = 1000; // 1 second between requests per user

interface RagChatRequest {
  query: string
  userContext: { role_type: string; teams: string[]; areas?: string[]; regions?: string[] }
}

interface RagChatResponse {
  success: boolean;
  answer?: string | null;
  fallback?: boolean;
  references?: Array<{ document_id: string; title?: string; chunk_index: number; similarity: number; snippet: string }>;
  error?: string;
}

interface DocumentChunk {
  document_id: string;
  chunk_index: number;
  content: string;
  similarity: number;
}

interface Document {
  id: string;
  title: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Check if user is rate limited using Redis or another distributed store
 * For now, this is just a placeholder that should be replaced with a Redis implementation
 */
async function isRateLimited(_supabase: any, _userId: string): Promise<boolean> {
  // TODO: Replace with Redis or Supabase KV implementation
  // Redis implementation would look like:
  /*
  const key = `rl:${_userId}`;
  const tooSoon = await redis.set(key, '1', { NX: true, PX: _RATE_LIMIT_INTERVAL_MS });
  return !tooSoon;
  */
  
  // For now, return false to allow all requests
  return false;
}

/**
 * Fetch document titles for a list of document IDs
 */
async function fetchDocumentTitles(
  supabase: any,
  documentIds: string[]
): Promise<Record<string, string>> {
  // Skip if no document IDs
  if (documentIds.length === 0) return {};
  
  // Get unique document IDs
  const uniqueIds = [...new Set(documentIds)];
  
  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, title')
    .in('id', uniqueIds);
  
  if (error || !documents) {
    safeLog('DOCUMENT_TITLE_FETCH_ERROR', { error });
    return {};
  }
  
  // Convert to a map of id -> title
  return documents.reduce((acc: Record<string, string>, doc: Document) => {
    acc[doc.id] = doc.title;
    return acc;
  }, {});
}

/**
 * Deduplicate chunks by document, keeping only the highest similarity chunk per document
 */
function deduplicateChunks(chunks: DocumentChunk[]): DocumentChunk[] {
  const documentMap: Record<string, DocumentChunk> = {};
  
  for (const chunk of chunks) {
    const docId = chunk.document_id;
    
    if (!documentMap[docId] || chunk.similarity > documentMap[docId].similarity) {
      documentMap[docId] = chunk;
    }
  }
  
  return Object.values(documentMap);
}

export async function POST(request: Request) {
  try {
    // 1. Parse JSON body
    const body: RagChatRequest = await request.json();
    const { query, userContext } = body;
    
    if (!query || !userContext) {
      return NextResponse.json<RagChatResponse>(
        { success: false, error: 'Invalid request: query and userContext required' },
        { status: 400 }
      );
    }
    
    // 2. Authenticate user via Supabase
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json<RagChatResponse>(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }
    
    // 3. Check rate limiting
    const isLimited = await isRateLimited(supabase, user.id);
    if (isLimited) {
      return NextResponse.json<RagChatResponse>(
        { success: false, error: 'Rate limit exceeded. Please try again shortly.' },
        { status: 429 }
      );
    }
    
    // 4. Generate embedding for query
    let queryEmbedding: number[];
    try {
      const embeddingResponse = await timeOperation('embedding_generation', async () => {
        return openai.embeddings.create({
          model: EMBEDDING_MODEL,
          input: query,
        });
      });
      
      queryEmbedding = embeddingResponse.data[0].embedding;
    } catch (embeddingError) {
      console.error('OpenAI embedding error:', embeddingError);
      return NextResponse.json<RagChatResponse>(
        { success: false, error: 'Error generating embedding' },
        { status: 500 }
      );
    }
    
    // 5. Search for similar chunks
    let matchedDocs: DocumentChunk[];
    try {
      const { data, error: searchError } = await timeOperation('vector_search', async () => {
        return supabase.rpc<DocumentChunk[]>(
          'search_similar_chunks',
          {
            query_embedding: queryEmbedding,
            user_filters: userContext,
            threshold: SIMILARITY_THRESHOLD,
            match_count: MATCH_COUNT
          }
        );
      });
      
      if (searchError) {
        console.error('Error searching documents:', searchError);
        return NextResponse.json<RagChatResponse>(
          { success: false, error: 'Error searching documents' },
          { status: 500 }
        );
      }
      
      matchedDocs = data || [];
    } catch (searchError) {
      console.error('Search error:', searchError);
      return NextResponse.json<RagChatResponse>(
        { success: false, error: 'Error searching for relevant documents' },
        { status: 500 }
      );
    }
    
    // 6. Handle results - no matches found case
    if (matchedDocs.length === 0) {
      await logSearchActivity(
        supabase,
        user.id,
        query,
        userContext,
        0
      );
      
      return NextResponse.json<RagChatResponse>({
        success: true,
        answer: null,
        fallback: true,
        references: []
      });
    }
    
    // 7. Optionally deduplicate chunks (one per document)
    const dedupedDocs = deduplicateChunks(matchedDocs);
    
    // 8. Get document titles
    const documentIds = dedupedDocs.map(doc => doc.document_id);
    const documentTitles = await fetchDocumentTitles(supabase, documentIds);
    
    // 9. Process matches and create references with titles
    const references = dedupedDocs.map(doc => {
      const snippet = createHighlight(doc.content, query);
      
      return {
        document_id: doc.document_id,
        title: documentTitles[doc.document_id] || doc.document_id, // Fallback to ID if title not found
        chunk_index: doc.chunk_index,
        similarity: doc.similarity,
        snippet
      };
    });
    
    // 10. Build context for ChatGPT with titles
    const contextMessages = references.map((ref, index) => 
      `Snippet ${index + 1} [${ref.title}—${ref.chunk_index}] (similarity: ${ref.similarity.toFixed(2)}):\n${ref.snippet}`
    ).join('\n\n');
    
    // 11. Call ChatGPT for answer
    let answer: string;
    try {
      const chatResponse = await timeOperation('chat_completion', async () => {
        return openai.chat.completions.create({
          model: CHAT_MODEL,
          temperature: CHAT_TEMPERATURE,
          max_tokens: CHAT_MAX_TOKENS,
          messages: [
            {
              role: "system",
              content: "You are an expert assistant. Use the snippets below & cite each answer with [Title—ChunkIndex]."
            },
            {
              role: "user",
              content: `Context information:\n${contextMessages}\n\nQuestion: ${query}`
            }
          ]
        });
      });
      
      answer = chatResponse.choices[0].message.content || '';
    } catch (chatError) {
      console.error('OpenAI chat error:', chatError);
      return NextResponse.json<RagChatResponse>(
        { success: false, error: 'Error generating chat response' },
        { status: 500 }
      );
    }
    
    // 12. Log activity
    await logSearchActivity(
      supabase,
      user.id,
      query,
      userContext,
      references.length
    );
    
    // 13. Return success response
    return NextResponse.json<RagChatResponse>({
      success: true,
      answer,
      references
    });
    
  } catch (error) {
    console.error('Error in RAG chat:', error);
    return NextResponse.json<RagChatResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 