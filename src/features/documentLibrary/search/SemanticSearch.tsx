// my-app/src/features/documentLibrary/search/SemanticSearch.tsx

'use client';

import { useEffect, useRef, KeyboardEvent } from 'react';
import { Search, AlertCircle, Calendar, Percent, FileText, ExternalLink } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useSemanticSearch } from './useSemanticSearch';
import { SemanticSearchProps, SearchResult } from './types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

/**
 * Formats a date string into a more readable format
 */
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (_e) {
    return dateString;
  }
};

/**
 * Result card component to display a single search result
 */
const ResultCard = ({ 
  result, 
  onClick,
  onView,
  viewUrlPrefix = '/documents'
}: { 
  result: SearchResult; 
  onClick?: (result: SearchResult) => void;
  onView?: (result: SearchResult) => void;
  viewUrlPrefix?: string;
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(result);
    }
  };
  
  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    if (onView) {
      onView(result);
    }
  };
  
  const documentUrl = `${viewUrlPrefix}/${result.id}`;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="mb-4 overflow-hidden border hover:border-primary/50 transition-colors cursor-pointer hover:shadow-md"
        onClick={handleClick}
      >
        <CardHeader className="px-6 py-4 bg-muted/50">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <CardTitle className="text-lg font-medium group flex items-center gap-2">
                {result.title}
                <Link href={documentUrl} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                </Link>
              </CardTitle>
              {result.description && (
                <CardDescription className="mt-1 line-clamp-1">{result.description}</CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge className="flex items-center gap-1 whitespace-nowrap">
                <Percent className="h-3 w-3" />
                {(result.similarity * 100).toFixed(0)}%
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-2 flex gap-1 items-center"
                onClick={handleViewClick}
                asChild
              >
                <Link href={documentUrl}>
                  <span>View</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-6 py-4">
          {result.highlight && (
            <div className="text-sm text-muted-foreground mb-2">
              <span className="font-medium text-foreground">Excerpt: </span>
              <span className="italic">{result.highlight}</span>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="px-6 py-3 bg-muted/20 flex flex-wrap justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" /> 
            <span>{result.created_at ? formatDate(result.created_at) : 'Unknown date'}</span>
          </div>
          
          {result.tags && result.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {result.tags.slice(0, 3).map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
              ))}
              {result.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">+{result.tags.length - 3}</Badge>
              )}
            </div>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};

/**
 * Skeleton loader for the search results
 */
const ResultSkeleton = () => (
  <div className="mb-4">
    <Card className="overflow-hidden">
      <CardHeader className="px-6 py-4">
        <Skeleton className="h-6 w-4/5 mb-2" />
        <Skeleton className="h-4 w-3/5" />
      </CardHeader>
      <CardContent className="px-6 py-4">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter className="px-6 py-4 flex justify-between">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </CardFooter>
    </Card>
  </div>
);

/**
 * Summary bar component to display search metadata
 */
const SearchSummary = ({ 
  query, 
  count, 
  searchedAt, 
  filters 
}: { 
  query: string; 
  count: number; 
  searchedAt: string; 
  filters: Record<string, any> 
}) => {
  return (
    <div className="bg-muted/30 rounded-md p-3 mb-4 text-sm">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">Results:</span> 
          <Badge variant="secondary">{count}</Badge> 
          <span className="text-muted-foreground">for &quot;<span className="italic">{query}</span>&quot;</span>
        </div>
        
        <div className="text-muted-foreground text-xs">
          {searchedAt && `Searched at ${formatDate(searchedAt)}`}
        </div>
      </div>
      
      {Object.keys(filters).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground">Filters:</span>
          {Object.entries(filters).map(([key, value]) => (
            <Badge key={key} variant="outline" className="text-xs">
              {key}: {Array.isArray(value) ? value.join(', ') : value.toString()}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Main semantic search component
 */
export function SemanticSearch({
  placeholder = "Search documents...",
  onResults,
  filters = {},
  autoFocus = false,
  matchThreshold = 0.5,
  matchCount = 10,
  initialSortBy = 'similarity',
  className = '',
  onDocumentClick,
  onDocumentView,
  documentUrlPrefix = '/documents'
}: SemanticSearchProps & {
  onDocumentClick?: (result: SearchResult) => void;
  onDocumentView?: (result: SearchResult) => void;
  documentUrlPrefix?: string;
}) {
  // Use the search hook
  const {
    query,
    setQuery,
    results,
    response,
    isLoading,
    error,
    sortBy,
    setSortBy,
    clearSearch
  } = useSemanticSearch({
    initialFilters: filters,
    initialMatchThreshold: matchThreshold,
    initialMatchCount: matchCount,
    initialSortBy,
    onResults
  });
  
  // Ref for input field
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus input on mount if autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  // Handle keyboard events
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Clear search on Escape
    if (e.key === 'Escape') {
      clearSearch();
    }
  };
  
  return (
    <div className={`w-full ${className}`}>
      {/* Search input with sort selection */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
            aria-label="Search documents"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 px-2"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              ×
            </Button>
          )}
        </div>
        
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
          <SelectTrigger className="w-[160px]" aria-label="Sort by">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="similarity">Relevance</SelectItem>
            <SelectItem value="created_at">Newest</SelectItem>
            <SelectItem value="title">Title (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-4 mb-6 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error.message}</span>
        </div>
      )}
      
      {/* Results section */}
      <div>
        {/* Summary of search results */}
        {response && (
          <SearchSummary
            query={response.query}
            count={response.result_count}
            searchedAt={response.searched_at}
            filters={response.filters_used}
          />
        )}
        
        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <ResultSkeleton key={i} />
            ))}
          </div>
        )}
        
        {/* No results message */}
        {!isLoading && results.length === 0 && query.trim() !== '' && (
          <div className="text-center py-12 bg-muted/20 rounded-md">
            <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
            <h3 className="text-lg font-medium">No documents found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters to find what you&apos;re looking for.
            </p>
          </div>
        )}
        
        {/* Results list */}
        {!isLoading && results.length > 0 && (
          <ScrollArea className="max-h-[70vh]">
            <AnimatePresence mode="popLayout">
              {results.map((result) => (
                <ResultCard 
                  key={result.id} 
                  result={result} 
                  onClick={onDocumentClick}
                  onView={onDocumentView}
                  viewUrlPrefix={documentUrlPrefix}
                />
              ))}
            </AnimatePresence>
          </ScrollArea>
        )}
      </div>
    </div>
  );
} 