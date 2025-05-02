/**
 * Utility functions for creating text snippets from content
 */

const SNIPPET_LENGTH = 200;

/**
 * Extract a ~200 character snippet around the first occurrence of any query term,
 * attempting to trim at sentence boundaries for readability
 */
export function createHighlight(content: string, query: string): string {
  // Break query into terms, removing common stop words
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 2 && !['the', 'and', 'for', 'with', 'that', 'this', 'are', 'you'].includes(term));
  
  // Find the first occurrence of any query term
  const contentLower = content.toLowerCase();
  let firstIndex = -1;
  let matchedTerm = '';
  
  for (const term of queryTerms) {
    const index = contentLower.indexOf(term);
    if (index !== -1 && (firstIndex === -1 || index < firstIndex)) {
      firstIndex = index;
      matchedTerm = term;
    }
  }
  
  // If no term found, return the first ~SNIPPET_LENGTH chars with sentence boundary
  if (firstIndex === -1) {
    let snippetEnd = Math.min(SNIPPET_LENGTH, content.length);
    
    // Try to find a sentence boundary
    const nextPeriod = content.indexOf('.', snippetEnd - 30);
    if (nextPeriod > 0 && nextPeriod < snippetEnd + 30) {
      snippetEnd = nextPeriod + 1;
    }
    
    return content.slice(0, snippetEnd) + (content.length > snippetEnd ? '...' : '');
  }
  
  // Extract snippet around the matched term (about SNIPPET_LENGTH chars)
  let snippetStart = Math.max(0, firstIndex - SNIPPET_LENGTH / 2);
  let snippetEnd = Math.min(content.length, firstIndex + matchedTerm.length + SNIPPET_LENGTH / 2);
  
  // Try to expand to sentence boundaries if nearby
  const prevPeriod = content.lastIndexOf('.', firstIndex);
  if (prevPeriod >= 0 && prevPeriod > snippetStart - 30) {
    snippetStart = prevPeriod + 2; // +2 to skip period and space
  }
  
  const nextPeriod = content.indexOf('.', snippetEnd - 30);
  if (nextPeriod > 0 && nextPeriod < snippetEnd + 30) {
    snippetEnd = nextPeriod + 1;
  }
  
  let snippet = content.slice(snippetStart, snippetEnd);
  
  // Add ellipsis if we're not including the beginning/end
  if (snippetStart > 0) snippet = '...' + snippet;
  if (snippetEnd < content.length) snippet += '...';
  
  return snippet;
} 