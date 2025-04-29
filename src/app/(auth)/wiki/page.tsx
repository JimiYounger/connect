// src/app/(test)/semantic-search/page.tsx

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { SemanticSearch, SearchResult } from '@/features/documentLibrary/search';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 as _Loader2, Share2, Check, AlertCircle, ExternalLink } from 'lucide-react';
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

interface SummaryContentProps {
  summary: string | null | undefined;
}

// Component to render formatted summary content
const SummaryContent: React.FC<SummaryContentProps> = ({ summary }) => {
  if (!summary) return <p className="text-muted-foreground italic">No summary available</p>;
  
  // First, preserve any existing newlines
  let formattedText = summary.replace(/\\n/g, '\n');
  
  // Split by bullet points
  const parts = formattedText.split('•');
  
  const formattedParts = parts
    .map((section, index) => {
      // Skip empty sections
      if (!section.trim()) return null;
      
      // First section (before any bullets) just gets trimmed
      if (index === 0 && section.trim()) {
        return <p key={`section-${index}`}>{section.trim()}</p>;
      }
      
      // For bullet points, format with proper indentation
      const trimmedSection = section.trim();
      
      // Check if this section has a title/header (like "Title:", "Purpose:", etc.)
      if (trimmedSection.includes(':')) {
        const [header, ...rest] = trimmedSection.split(':');
        return (
          <div key={`section-${index}`} className="ml-2 mb-2">
            <span className="font-medium">• {header.trim()}:</span> {rest.join(':').trim()}
          </div>
        );
      }
      
      return trimmedSection ? (
        <div key={`section-${index}`} className="ml-2 mb-2">• {trimmedSection}</div>
      ) : null;
    })
    .filter(Boolean); // Remove empty sections
  
  return <div className="space-y-2">{formattedParts}</div>;
};

export default function SemanticSearchTestPage() {
  // State
  const [_results, setResults] = useState<SearchResult[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<SearchResult | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');
  
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
  
  // Handle document selection
  const handleDocumentSelect = useCallback((document: SearchResult) => {
    console.log('Selected document for modal:', document);
    setSelectedDocument(document);
    setDialogOpen(true);
  }, []);
  
  // Handle results callback
  const handleResults = useCallback((results: SearchResult[]) => {
    setResults(results);
  }, [setResults]);

  // Handle share button click
  const handleShareClick = useCallback(async () => {
    if (!selectedDocument) return;
    
    setShareFeedback('');
    const documentUrl = `${window.location.origin}/documents/${selectedDocument.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedDocument.title,
          text: `Check out this document: ${selectedDocument.title}`,
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
  }, [selectedDocument]);
  
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
            onDocumentSelect={handleDocumentSelect}
          />
        ) : (
          <div className="w-full flex items-center justify-center h-60"> 
            <p className="text-muted-foreground">Initializing search...</p>
          </div>
        )}
      </div>
      
      {/* Document Summary Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pr-4">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedDocument?.title || 'Document Details'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 overflow-y-auto flex-1">
            {selectedDocument ? (
              <div className="space-y-4">
                {/* Document Summary Section */}
                <div className="p-4 bg-muted/20 rounded-md">
                  <h3 className="font-medium mb-3">Summary</h3>
                  <SummaryContent summary={selectedDocument.summary} />
                </div>
                
                {/* Document Tags Section */}
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
                
                {/* Document Metadata Section */}
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {selectedDocument.category_name && (
                    <div>Category: {selectedDocument.category_name}</div>
                  )}
                  {selectedDocument.subcategory_name && (
                    <div>Subcategory: {selectedDocument.subcategory_name}</div>
                  )}
                  {selectedDocument.created_at && (
                    <div>Created: {new Date(selectedDocument.created_at).toLocaleDateString()}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No document selected
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2 pt-2 border-t">
            <Button 
              variant="outline" 
              className="gap-1 w-full sm:w-auto"
              onClick={handleShareClick}
            >
              {shareFeedback === 'Copied!' ? (
                <Check className="h-4 w-4" />
              ) : shareFeedback === 'Failed!' ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              <span>{shareFeedback || 'Share'}</span>
            </Button>
            
            <Button
              onClick={() => {
                if (selectedDocument) {
                  window.open(`/documents/${selectedDocument.id}`, '_blank');
                }
              }}
              className="gap-1 w-full sm:w-auto"
            >
              <span>Open Document</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
