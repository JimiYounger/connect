// src/app/(test)/semantic-search/page.tsx

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { SemanticSearch, SearchResult } from '@/features/documentLibrary/search';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 as _Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useDocumentFilters } from '@/features/documentLibrary/hooks';
import { Skeleton } from '@/components/ui/skeleton';

// Helper function to manage prefetch links
const PREFETCH_LINK_SELECTOR = 'link[data-prefetch-for="wiki-search"]';

function removeExistingPrefetchLinks() {
  document.querySelectorAll(PREFETCH_LINK_SELECTOR).forEach(link => link.remove());
}

async function addPrefetchLink(documentId: string) {
  try {
    const response = await fetch(`/api/document-library/get-secure-url/${documentId}`);
    if (!response.ok) {
      // Don't throw error for individual failures, just log and skip
      console.warn(`Prefetch failed for ${documentId}: ${response.status}`);
      return;
    }
    const data = await response.json();
    if (data.url) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = data.url;
      link.as = 'fetch'; // Hint the type of content being fetched
      link.crossOrigin = 'anonymous'; // Important for cross-origin resources to be reusable
      link.setAttribute('data-prefetch-for', 'wiki-search'); // Custom attribute for cleanup
      document.head.appendChild(link);
      // console.log(`Prefetch link added for ${documentId}`);
    } else {
       console.warn(`Prefetch skipped for ${documentId}: No URL returned.`);
    }
  } catch (error) {
    console.error(`Error prefetching ${documentId}:`, error);
  }
}

export default function SemanticSearchTestPage() {
  // State
  const [_results, setResults] = useState<SearchResult[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<SearchResult | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Get search params
  const searchParams = useSearchParams();
  
  // Filter state - Initialize with defaults or URL params
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('all');
  const [selectedTagId, setSelectedTagId] = useState('all');
  const [initialSearchQuery, setInitialSearchQuery] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Get filter data from our hook
  const { 
    categories, 
    // subcategories: _unusedSubcategories, // Not directly used here
    tags, 
    getSubcategoriesForCategory,
    loading: filtersLoading 
  } = useDocumentFilters();
  
  // Get current subcategories based on selected category
  const currentSubcategories = useMemo(() => {
    if (selectedCategoryId === 'all') {
      return [{ id: 'all', name: 'All Subcategories' }];
    }
    const filtered = getSubcategoriesForCategory(selectedCategoryId);
    return [{ id: 'all', name: 'All Subcategories' }, ...filtered];
  }, [selectedCategoryId, getSubcategoriesForCategory]);
  
  // Reset subcategory when category changes
  useEffect(() => {
    if (searchParams.get('subcategory')) return;
    setSelectedSubcategoryId('all');
  }, [selectedCategoryId, searchParams]);
  
  // COMBINED Effect to initialize ALL state from URL parameters AFTER filters load and params available
  useEffect(() => {
    console.log('[Combined Init Effect] Running. Dependencies:', { filtersLoading, searchParamsExists: !!searchParams, categoriesLoaded: !!categories, tagsLoaded: !!tags, isInitialized });

    // Only run once, and only when filters are loaded and searchParams is available
    if (isInitialized || filtersLoading || !searchParams || !categories || !tags) {
      console.log('[Combined Init Effect] Skipping: Not ready or already initialized.');
      return;
    }

    console.log('[Combined Init Effect] Initializing state from URL params...');

    // --- Initialize Search Query --- 
    const searchParam = searchParams.get('search');
    if (searchParam) {
      console.log('[Combined Init Effect] Setting initial search query from URL:', searchParam);
      setInitialSearchQuery(searchParam);
    }

    // --- Initialize Filters --- 
    const categoryParam = searchParams.get('category');
    const subcategoryParam = searchParams.get('subcategory');
    const tagParam = searchParams.get('tag');

    if (categoryParam) {
      const category = categories.find(c => c.id === categoryParam || c.name.toLowerCase() === categoryParam.toLowerCase());
      if (category) {
        console.log('[Combined Init Effect] Setting category from URL:', category.id);
        setSelectedCategoryId(category.id);
      } else {
        console.warn('[Combined Init Effect] Category from URL not found:', categoryParam);
      }
    }
    if (subcategoryParam) {
      // Subcategory needs category to be set first for validation if needed, but we set directly here
      console.log('[Combined Init Effect] Setting subcategory from URL:', subcategoryParam);
      setSelectedSubcategoryId(subcategoryParam);
    }
    if (tagParam) {
      const tag = tags.find(t => t.id === tagParam || t.name.toLowerCase() === tagParam.toLowerCase());
      if (tag) {
        console.log('[Combined Init Effect] Setting tag from URL:', tag.id);
        setSelectedTagId(tag.id);
      } else {
        console.warn('[Combined Init Effect] Tag from URL not found:', tagParam);
      }
    }

    console.log('[Combined Init Effect] Initialization complete.');
    setIsInitialized(true); // Mark as initialized

  }, [searchParams, categories, tags, filtersLoading, getSubcategoriesForCategory, isInitialized]);
  
  // Format categories and tags for the dropdowns
  const formattedCategories = useMemo(() => {
    return [{ id: 'all', name: 'All Categories' }, ...categories];
  }, [categories]);
  
  const formattedTags = useMemo(() => {
    return [{ id: 'all', name: 'All Tags' }, ...tags];
  }, [tags]);
  
  // Memoize the filters object to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => {
    const filters: Record<string, any> = {};
    
    if (selectedCategoryId && selectedCategoryId !== 'all') {
      filters.categoryId = selectedCategoryId;
    }
    
    if (selectedSubcategoryId && selectedSubcategoryId !== 'all') {
      filters.subcategoryId = selectedSubcategoryId;
    }
    
    if (selectedTagId && selectedTagId !== 'all') {
      filters.tagId = selectedTagId;
    }
    
    console.log('Memoized filters updated (using IDs):', JSON.stringify(filters));
    return filters;
  }, [selectedCategoryId, selectedSubcategoryId, selectedTagId]);
  
  // Handle document click
  const _handleDocumentClick = useCallback((document: SearchResult) => {
    setSelectedDocument(document);
    setDialogOpen(true);
  }, []);
  
  // Handle results callback
  const handleResults = useCallback((results: SearchResult[]) => {
    setResults(results);
  }, [setResults]);
  
  // Effect to prefetch top results when results change
  useEffect(() => {
    // Clean up previous links first
    removeExistingPrefetchLinks();

    if (_results && _results.length > 0) {
      const topResults = _results.slice(0, 4); // Get top 4
      console.log(`Prefetching top ${topResults.length} results...`);
      topResults.forEach(result => {
        addPrefetchLink(result.id);
      });
    }
    
    // Cleanup function for when the component unmounts or _results change again
    return () => {
      removeExistingPrefetchLinks();
    };
  }, [_results]); // Run when results change

  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full">
        {/* Filters - Allow natural height */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-muted/20 p-4 rounded-lg w-full">
          {filtersLoading ? (
            <>
              <div className="w-full md:w-auto flex-1">
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="w-full md:w-auto flex-1">
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="w-full md:w-auto flex-1">
                <Skeleton className="h-10 w-full" />
              </div>
            </>
          ) : (
            <>
              <div className="w-full md:w-auto flex-1">
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {formattedCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-auto flex-1">
                <Select 
                  value={selectedSubcategoryId} 
                  onValueChange={setSelectedSubcategoryId}
                  disabled={selectedCategoryId === 'all'}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentSubcategories.map((subcat) => (
                      <SelectItem key={subcat.id} value={subcat.id}>
                        {subcat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-auto flex-1">
                <Select value={selectedTagId} onValueChange={setSelectedTagId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {formattedTags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        {/* Conditionally render Search based on initialization */} 
        {isInitialized ? (
          <SemanticSearch
            placeholder="What are you looking for?"
            autoFocus={true}
            matchThreshold={0.5}
            matchCount={20}
            initialSortBy="similarity"
            onResults={handleResults}
            filters={memoizedFilters}
            className="w-full"
            initialQuery={initialSearchQuery}
          />
        ) : (
          <div className="w-full flex items-center justify-center h-60"> 
            <p className="text-muted-foreground">Initializing search...</p>
          </div>
        )}
      </div>
      
      {/* Document Preview Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedDocument?.title || 'Document Preview'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {selectedDocument ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted/20 rounded-md">
                  <h3 className="font-medium mb-2">Excerpt</h3>
                  <p className="italic text-sm">{selectedDocument.highlight || 'No excerpt available'}</p>
                </div>
                
                {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Tags</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedDocument.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No document selected
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                window.open(`/documents/${selectedDocument?.id}`, '_blank');
              }}
            >
              Open Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
