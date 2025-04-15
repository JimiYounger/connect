/**
 * Helper to trigger document parsing after upload
 * 
 * This function handles calling the document parsing API endpoint,
 * which extracts text content, chunks it, and prepares it for semantic search.
 * 
 * Design note: This implementation is structured to be easily replaceable
 * with a background job system like Upstash QStash in the future.
 */

import { createClient } from '@/lib/supabase'

interface DocumentParseInput {
  documentId: string;
  fileUrl: string;
}

interface DocumentParseResult {
  success: boolean;
  error?: string;
}

/**
 * Triggers document content extraction and processing
 * 
 * @param params Object containing document ID and file URL
 * @returns Object with success status and optional error message
 */
export async function triggerDocumentParse(
  params: DocumentParseInput
): Promise<DocumentParseResult> {
  const { documentId, fileUrl } = params;
  
  try {
    console.log('Triggering document parsing for document ID:', documentId);
    
    // This direct fetch call could be replaced with a background job implementation
    // such as Upstash QStash in the future
    console.log('Making parse request for document:', documentId, 'with URL:', fileUrl);
    const parseResponse = await fetch('/api/document-library/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileUrl,
        documentId
      })
    });
    
    console.log('Parse response status:', parseResponse.status, parseResponse.statusText);
    
    if (parseResponse.ok) {
      // Try to log the successful response for debugging
      try {
        const responseData = await parseResponse.json();
        console.log('Document parsing response:', responseData);
      } catch (e) {
        console.log('Document parsing initiated successfully (no json response)');
      }
      return { success: true };
    } else {
      // Attempt to extract detailed error message
      let errorDetail: string;
      let fullResponse: any = {};
      
      try {
        fullResponse = await parseResponse.json();
        console.error('Full error response:', fullResponse);
        errorDetail = fullResponse.error || `HTTP ${parseResponse.status}`;
      } catch (e) {
        console.error('Could not parse error response as JSON:', e);
        errorDetail = `HTTP ${parseResponse.status}`;
        
        // Try to get text content if JSON parsing failed
        try {
          const textContent = await parseResponse.text();
          console.error('Error response text:', textContent);
        } catch {
          console.error('Could not get error response as text');
        }
      }
      
      console.warn(
        `Document parsing API returned an error: ${errorDetail}. ` +
        'Document was uploaded successfully but content extraction may have failed.'
      );
      
      return { 
        success: false, 
        error: `Parse API error: ${errorDetail}`
      };
    }
  } catch (parseError) {
    const errorMessage = parseError instanceof Error 
      ? parseError.message 
      : 'Unknown error';
    
    // Log error but don't throw
    console.error('Error triggering document parsing:', errorMessage);
    console.warn(
      'Document was uploaded successfully but automatic content extraction failed. ' +
      'Manual parsing may be required.'
    );
    
    return {
      success: false,
      error: `Failed to initiate parsing: ${errorMessage}`
    };
  }
}