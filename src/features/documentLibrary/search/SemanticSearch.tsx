// my-app/src/features/documentLibrary/search/SemanticSearch.tsx

'use client';

import { useEffect, useRef, KeyboardEvent, useMemo, useState } from 'react';
import { Search, AlertCircle, FileText, ExternalLink, Share2, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSemanticSearch } from './useSemanticSearch';
import { SemanticSearchProps, SearchResult } from './types';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

/**
 * Result card component to display a single search result
 */
const ResultCard = ({ 
  result, 
  viewUrlPrefix = '/documents'
}: { 
  result: SearchResult; 
  viewUrlPrefix?: string;
}) => {
  const [shareFeedback, setShareFeedback] = useState('');
  
  const documentUrl = useMemo(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''; 
    return `${baseUrl}${viewUrlPrefix}/${result.id}`;
  }, [result.id, viewUrlPrefix]);
  
  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShareFeedback('');

    if (navigator.share) {
      try {
        await navigator.share({
          title: result.title,
          text: `Check out this document: ${result.title}`,
          url: documentUrl,
        });
        console.log('Shared successfully');
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(documentUrl);
        setShareFeedback('Copied!');
        setTimeout(() => setShareFeedback(''), 2000);
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        setShareFeedback('Failed!');
        setTimeout(() => setShareFeedback(''), 2000); 
      }
    } else {
      alert("Sharing/Copying is not supported on your browser.");
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="mb-4 overflow-hidden border transition-colors hover:shadow-sm"
      >
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-base font-medium">{result.title}</CardTitle>
        </CardHeader>
        
        <CardContent className="px-4 py-2 pb-4">
          {(result.summary || result.highlight) && (
            <div className="text-sm text-muted-foreground mb-3">
              <span className="italic">{result.summary || result.highlight}</span>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-3 flex gap-1 items-center"
              onClick={handleShareClick}
              title={shareFeedback || "Share document link"}
            >
              {shareFeedback === 'Copied!' ? (
                <Check className="h-3 w-3" />
              ) : shareFeedback === 'Failed!' ? (
                <AlertCircle className="h-3 w-3 text-destructive" />
              ) : (
                <Share2 className="h-3 w-3" />
              )}
              <span className="ml-1">{shareFeedback || 'Share'}</span>
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-3 flex gap-1 items-center"
              asChild
            >
              <Link href={documentUrl}>
                <span>Open</span>
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * Skeleton loader for the search results
 */
const ResultSkeleton = () => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
    className="mb-4"
  >
    <Card className="overflow-hidden border hover:border-primary/50 transition-colors hover:shadow-sm">
      <CardHeader className="px-4 py-3">
        <Skeleton className="h-6 w-4/5" />
      </CardHeader>
      <CardContent className="px-4 py-2 pb-4">
        <div className="text-sm text-muted-foreground mb-3">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-8 w-20" />
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

/**
 * Main semantic search component
 */
export function SemanticSearch({
  placeholder = "What are you looking for?",
  onResults,
  filters = {},
  autoFocus = true,
  matchThreshold = 0.5,
  matchCount = 10,
  initialSortBy = 'similarity',
  className = '',
  documentUrlPrefix = '/documents',
  initialQuery
}: SemanticSearchProps & {
  documentUrlPrefix?: string;
}) {
  console.log('[SemanticSearch Component] Props received. initialQuery:', initialQuery);
  // Use the search hook
  const {
    query,
    setQuery,
    setFilters, // Add setFilters to update filters when they change
    results,
    isLoading,
    error,
    clearSearch
  } = useSemanticSearch({
    initialFilters: filters,
    initialMatchThreshold: matchThreshold,
    initialMatchCount: matchCount,
    initialSortBy,
    onResults,
    initialQuery
  });
  
  console.log('[SemanticSearch Component] State from hook. query:', query);
  
  // Ref for input field
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus input on mount if autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  // Memoize a stable string representation of the filters prop
  const filtersString = useMemo(() => {
    try {
      if (typeof filters === 'object' && filters !== null && filters.properties) {
        // Handle DevTools object format
        return JSON.stringify(filters.properties.map((p: any) => `${p?.name}:${p?.value}`).sort());
      } else {
        // Regular object
        return JSON.stringify(filters);
      }
    } catch (e) {
      console.error('Error stringifying filters:', e);
      return '{}'; // Return a default value on error
    }
  }, [filters]); // Dependency is the filters object itself
  
  // Update internal filters state when the memoized string changes
  useEffect(() => {
    console.log('Filters prop changed, updating internal state:', filtersString);
    try {
      const parsedFilters = JSON.parse(filtersString);
      
      // Handle the DevTools format case if needed (though parsing the stringified version might be enough)
      // This logic might need adjustment depending on how `useSemanticSearch` expects filters
      let filtersToSet = parsedFilters;
      if (typeof filters === 'object' && filters !== null && filters.properties) {
        // Reconstruct if necessary, or assume parsedFilters is okay
        filtersToSet = filters.properties.reduce((obj: any, prop: any) => {
          if (prop && prop.name && 'value' in prop) {
            obj[prop.name] = prop.value;
          }
          return obj;
        }, {});
      }
      
      setFilters(filtersToSet);
    } catch (e) {
      console.error('Error parsing filters string:', e);
      setFilters({}); // Reset filters on error
    }
  }, [filtersString, setFilters, filters]); // Use the memoized string, setFilters, and filters
  
  // Handle keyboard events
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Clear search on Escape
    if (e.key === 'Escape') {
      clearSearch();
    }
  };
  
  return (
    <div className={`w-full max-w-3xl mx-auto flex flex-col ${className}`}>
      {/* Search input */}
      <div className="flex flex-col space-y-4 mb-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 py-6 text-lg rounded-full border-muted w-full"
            aria-label="Search documents"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full flex items-center justify-center z-10"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              ×
            </Button>
          )}
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-4 mb-6 flex items-center gap-2 w-full">
          <AlertCircle className="h-5 w-5" />
          <span>{error.message}</span>
        </div>
      )}
      
      {/* Results container - Change height to flex-1 */}
      <div className="w-full flex-1 flex flex-col relative overflow-hidden"> {/* Changed h-[70vh] to flex-1 */}
        
        {/* Always render ScrollArea */}
        <ScrollArea className="h-full w-full"> {/* h-full will fill the flex-1 parent */}
          {/* Conditionally render skeletons inside ScrollArea */}
          {isLoading && (
            <AnimatePresence mode="popLayout">
              {Array.from({ length: 3 }).map((_, i) => (
                <ResultSkeleton key={i} />
              ))}
            </AnimatePresence>
          )}
          
          {/* Conditionally render results inside ScrollArea */}          
          {!isLoading && results.length > 0 && (
            <AnimatePresence mode="popLayout">
              {results.map((result) => (
                <ResultCard 
                  key={result.id} 
                  result={result} 
                  viewUrlPrefix={documentUrlPrefix}
                />
              ))}
            </AnimatePresence>
          )}

          {/* No results message - Render inside ScrollArea */}
          {!isLoading && results.length === 0 && query.trim() !== '' && (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4"> {/* Centered within scroll area */}
              <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <h3 className="text-lg font-medium">No documents found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters to find what you&apos;re looking for.
              </p>
            </div>
          )}
          
          {/* Welcome message when no search - Render inside ScrollArea */}
          {!isLoading && query.trim() === '' && results.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4"> {/* Centered within scroll area */}
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-medium mb-2">Search your documents</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Type your query above to search through documents. Use the filters to narrow your results.
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
} 