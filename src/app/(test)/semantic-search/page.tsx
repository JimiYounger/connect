// src/app/(test)/semantic-search/page.tsx

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { SemanticSearch, SearchResult } from '@/features/documentLibrary/search';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 as _Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useDocumentFilters } from '@/features/documentLibrary/hooks';
import { Skeleton } from '@/components/ui/skeleton';

export default function SemanticSearchTestPage() {
  // State
  const [_results, setResults] = useState<SearchResult[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<SearchResult | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Filter state
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('all');
  const [selectedTagId, setSelectedTagId] = useState('all');
  
  // Get filter data from our hook
  const { 
    categories, 
    subcategories, 
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
    setSelectedSubcategoryId('all');
  }, [selectedCategoryId]);
  
  // Format categories and tags for the dropdowns
  const formattedCategories = useMemo(() => {
    return [{ id: 'all', name: 'All Categories' }, ...categories];
  }, [categories]);
  
  const formattedTags = useMemo(() => {
    return [{ id: 'all', name: 'All Tags' }, ...tags];
  }, [tags]);
  
  // Get the selected category/subcategory/tag names for filters
  const selectedCategoryName = useMemo(() => {
    if (selectedCategoryId === 'all') return null;
    const category = categories.find(c => c.id === selectedCategoryId);
    console.log('Selected category:', category?.name);
    return category?.name || null;
  }, [selectedCategoryId, categories]);
  
  const selectedSubcategoryName = useMemo(() => {
    if (selectedSubcategoryId === 'all') return null;
    const subcategory = subcategories.find(s => s.id === selectedSubcategoryId);
    console.log('Selected subcategory:', subcategory?.name);
    return subcategory?.name || null;
  }, [selectedSubcategoryId, subcategories]);
  
  const selectedTagName = useMemo(() => {
    if (selectedTagId === 'all') return null;
    const tag = tags.find(t => t.id === selectedTagId);
    console.log('Selected tag:', tag?.name);
    return tag?.name || null;
  }, [selectedTagId, tags]);
  
  // Memoize the filters object to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => {
    const filters: Record<string, any> = {};
    
    if (selectedCategoryName) {
      filters.category = selectedCategoryName;
    }
    
    if (selectedSubcategoryName) {
      filters.subcategory = selectedSubcategoryName;
    }
    
    if (selectedTagName) {
      filters.tags = [selectedTagName]; // Ensure tags are always an array
    }
    
    console.log('Memoized filters updated:', JSON.stringify(filters));
    return filters;
  }, [selectedCategoryName, selectedSubcategoryName, selectedTagName]);
  
  // Handle document click
  const handleDocumentClick = useCallback((document: SearchResult) => {
    setSelectedDocument(document);
    setDialogOpen(true);
  }, []);
  
  // Handle results callback
  const handleResults = useCallback((results: SearchResult[]) => {
    setResults(results);
  }, []);
  
  // Build filters based on selections (keep for potential direct use, but memoizedFilters is preferred for props)
  /* // Removing unused function
  const buildFilters = useCallback(() => {
    const filters: Record<string, any> = {};
    
    if (selectedCategoryName) {
      filters.category = selectedCategoryName;
    }
    
    if (selectedSubcategoryName) {
      filters.subcategory = selectedSubcategoryName;
    }
    
    if (selectedTagName) {
      filters.tags = [selectedTagName];
    }
    
    console.log('Applied filters (buildFilters):', JSON.stringify(filters)); // Keep log if needed
    return filters;
  }, [selectedCategoryName, selectedSubcategoryName, selectedTagName]);
  */

  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
        {/* Filters */}
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

        {/* Search */}
        <SemanticSearch
          placeholder="What are you looking for?"
          autoFocus={true}
          matchThreshold={0.5}
          matchCount={20}
          initialSortBy="similarity"
          onResults={handleResults}
          filters={memoizedFilters}
          onDocumentClick={handleDocumentClick}
          className="mt-6 w-full"
        />
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
