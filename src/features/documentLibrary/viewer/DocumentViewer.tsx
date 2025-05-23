'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useDocuments } from './useDocuments'
import { DocumentFilters, Document, DocumentTag } from './types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Label } from '@/components/ui/label'
import { CategoryManagementModal } from '../management/CategoryManagementModal'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface DocumentViewerProps {
  initialFilters?: DocumentFilters
  categories?: Array<{ id: string; name: string }>
  subcategories?: Array<{ id: string; name: string; document_category_id: string }>
  availableTags?: DocumentTag[]
  isAdmin?: boolean
  onRefetchNeeded?: { refetch: () => void }
}

export function DocumentViewer({
  initialFilters = {},
  categories = [],
  subcategories = [],
  availableTags = [],
  isAdmin = false,
  onRefetchNeeded
}: DocumentViewerProps) {
  // State for filters
  const [filters, setFilters] = useState<DocumentFilters>(initialFilters)
  const [searchInput, setSearchInput] = useState(initialFilters.searchQuery || '')
  const { toast } = useToast()
  
  // Fetch documents with current filters
  const { 
    documents, 
    pagination, 
    isLoading, 
    isError, 
    error,
    refetch
  } = useDocuments(filters)
  
  // If refetchRef is provided, update it to point to our refetch function
  useEffect(() => {
    if (onRefetchNeeded) {
      onRefetchNeeded.refetch = refetch;
      console.log('DocumentViewer: Set refetch function in shared reference');
    }
  }, [onRefetchNeeded, refetch])
  
  // Handle document deletion
  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/document-library/delete/${documentId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Document deleted successfully"
        });
        refetch(); // Refresh the document list
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete document",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the document",
        variant: "destructive"
      });
    }
  };
  
  // Update filter handlers
  const handleCategoryChange = useCallback((value: string) => {
    setFilters(prev => ({
      ...prev,
      document_category_id: value === 'all' ? undefined : value,
      document_subcategory_id: undefined, // Reset subcategory when category changes
      page: 1 // Reset to first page when changing filters
    }))
  }, [])
  
  const handleSubcategoryChange = useCallback((value: string) => {
    setFilters(prev => ({
      ...prev,
      document_subcategory_id: value === 'all' ? undefined : value,
      page: 1 // Reset to first page when changing filters
    }))
  }, [])
  
  // Get filtered subcategories for the selected category
  const filteredSubcategories = useMemo(() => {
    if (!filters.document_category_id) return [];
    return subcategories.filter(
      subcategory => subcategory.document_category_id === filters.document_category_id
    );
  }, [subcategories, filters.document_category_id])
  
  const handleTagSelect = useCallback((tagId: string) => {
    setFilters(prev => {
      const currentTags = prev.tags || []
      const newTags = currentTags.includes(tagId)
        ? currentTags.filter(id => id !== tagId)
        : [...currentTags, tagId]
      
      return {
        ...prev,
        tags: newTags.length > 0 ? newTags : undefined,
        page: 1
      }
    })
  }, [])
  
  const handleSearch = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      searchQuery: searchInput.trim() || undefined,
      page: 1
    }))
  }, [searchInput])
  
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }, [handleSearch])
  
  const handlePageChange = useCallback((newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }))
  }, [])
  
  const resetFilters = useCallback(() => {
    setFilters({})
    setSearchInput('')
  }, [])
  
  // Handle category click in the document list
  const handleCategoryClick = useCallback((categoryId: string) => {
    setFilters(prev => ({
      ...prev,
      document_category_id: categoryId,
      document_subcategory_id: undefined, // Reset subcategory when changing category
      page: 1 // Reset to first page when changing filters
    }));
  }, []);
  
  // Handle subcategory click in the document list
  const handleSubcategoryClick = useCallback((categoryId: string, subcategoryId: string) => {
    setFilters(prev => ({
      ...prev,
      document_category_id: categoryId,
      document_subcategory_id: subcategoryId,
      page: 1 // Reset to first page when changing filters
    }));
  }, []);
  
  // Add individual filter reset handlers - prefixing with _ to indicate they're not used currently
  const _clearCategoryFilter = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      document_category_id: undefined,
      document_subcategory_id: undefined, // Also clear subcategory since it depends on category
      page: 1
    }));
  }, []);

  const _clearSubcategoryFilter = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      document_subcategory_id: undefined,
      page: 1
    }));
  }, []);
  
  // Render functions
  const renderDocumentListItem = (document: Document) => (
    <div className="grid grid-cols-12 gap-3 p-3 border-b hover:bg-accent/5 transition-colors group relative">
      {/* Document title and category */}
      <div className="col-span-4 flex flex-col justify-center">
        <div className="flex items-center">
          <div className="mr-2 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div className="flex items-center">
            <h3 className="font-medium truncate">
              <Link href={`/admin/document-library/edit/${document.id}`} className="hover:underline">
                {document.title}
              </Link>
            </h3>
            
            {/* Info icon with tooltip for description */}
            {document.description && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="ml-2 cursor-help text-muted-foreground hover:text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs text-xs bg-popover text-popover-foreground border shadow-md">
                    <p>{document.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <div className="text-xs text-muted-foreground ml-2">
              {document.category && (
                <span 
                  className={`hover:underline cursor-pointer ${
                    filters.document_category_id === document.category.id 
                      ? 'text-primary font-medium' 
                      : 'hover:text-primary'
                  }`}
                  onClick={() => document.category && handleCategoryClick(document.category.id)}
                  title={`Filter by ${document.category.name} category`}
                >
                  {document.category.name}
                </span>
              )}
              {document.category && document.subcategory && " -> "}
              {document.subcategory && (
                <span 
                  className={`hover:underline cursor-pointer ${
                    filters.document_subcategory_id === document.subcategory.id 
                      ? 'text-primary font-medium' 
                      : 'hover:text-primary'
                  }`}
                  onClick={() => document.category && document.subcategory && handleSubcategoryClick(document.category.id, document.subcategory.id)}
                  title={`Filter by ${document.subcategory.name} subcategory`}
                >
                  {document.subcategory.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tags */}
      <div className="col-span-3 flex items-center flex-wrap gap-1">
        {document.tags.slice(0, 3).map(tag => (
          <Badge 
            key={tag.id} 
            variant="outline" 
            className="cursor-pointer hover:bg-secondary text-xs"
            onClick={() => handleTagSelect(tag.id)}
          >
            {tag.name}
          </Badge>
        ))}
        {document.tags.length > 3 && (
          <Badge variant="outline" className="text-xs">+{document.tags.length - 3}</Badge>
        )}
      </div>
      
      {/* Upload date */}
      <div className="col-span-2 flex items-center text-xs text-muted-foreground">
        <div>
          <div>{formatDistanceToNow(new Date(document.updatedAt))} ago</div>
          {document.uploadedBy && (
            <div>by {document.uploadedBy.first_name} {document.uploadedBy.last_name}</div>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="col-span-3 flex items-center justify-end gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          asChild
          title="Edit document"
        >
          <Link href={`/admin/document-library/edit/${document.id}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              <path d="m15 5 4 4"/>
            </svg>
            <span className="sr-only">Edit</span>
          </Link>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          title="View document"
          asChild
        >
          <Link href={`/api/document-library/view/${document.id}`} target="_blank">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span className="sr-only">View</span>
          </Link>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          title="Download document"
          asChild
        >
          <Link href={`/api/document-library/download/${document.id}`} target="_blank">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
            <span className="sr-only">Download</span>
          </Link>
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
              title="Delete document"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
              <span className="sr-only">Delete</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;{document.title}&rdquo;? This action cannot be undone and will permanently remove the document and all its associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => handleDeleteDocument(document.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
  
  const renderSkeletonListItem = () => (
    <div className="grid grid-cols-12 gap-3 p-3 border-b">
      {/* Document title and category */}
      <div className="col-span-4 flex items-center">
        <div className="mr-2 opacity-30">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-24 mt-1" />
        </div>
      </div>
      
      {/* Tags */}
      <div className="col-span-3 flex items-center gap-1">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-12" />
      </div>
      
      {/* Upload date */}
      <div className="col-span-2 flex items-center">
        <div>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16 mt-1" />
        </div>
      </div>
      
      {/* Actions */}
      <div className="col-span-3 flex items-center justify-end gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  )

  return (
    <TooltipProvider delayDuration={0}>
      <div className="container mx-auto p-4">
        {/* Filters and Search */}
        <div className="bg-card rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Document Library</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Category Filter */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Label htmlFor="category-filter" className="text-sm font-medium">Category</Label>
                {isAdmin && <CategoryManagementModal type="categories" />}
              </div>
              <Select 
                value={filters.document_category_id || 'all'} 
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger id="category-filter" className="w-full">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Subcategory Filter */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Label htmlFor="subcategory-filter" className="text-sm font-medium">Subcategory</Label>
                {isAdmin && <CategoryManagementModal type="subcategories" />}
              </div>
              <Select 
                value={filters.document_subcategory_id || 'all'} 
                onValueChange={handleSubcategoryChange}
              >
                <SelectTrigger id="subcategory-filter" className="w-full">
                  <SelectValue placeholder={filters.document_category_id ? "All subcategories" : "Select a category first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subcategories</SelectItem>
                  {filteredSubcategories.map(subcategory => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Search */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Search in document content</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search documents..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
                <Button onClick={handleSearch} variant="secondary">Search</Button>
              </div>
            </div>
            
            {/* Reset Filters */}
            <div className="flex items-end">
              <Button 
                onClick={resetFilters} 
                variant="outline" 
                className="w-full"
                disabled={!filters.document_category_id && !filters.document_subcategory_id && !filters.tags?.length && !filters.searchQuery}
              >
                Reset Filters
              </Button>
            </div>
          </div>
          
          {/* Tag Filters */}
          {availableTags.length > 0 && (
            <div className="mt-4">
              <label className="text-sm font-medium mb-1 block">Filter by tags</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {availableTags.map(tag => (
                  <Badge 
                    key={tag.id} 
                    variant={filters.tags?.includes(tag.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleTagSelect(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Results Summary */}
        <div className="flex justify-between items-center mb-4">
          <div>
            {!isLoading && (
              <p className="text-sm text-muted-foreground">
                {pagination.total === 0 ? 'No documents found' : 
                 `Showing ${documents.length} of ${pagination.total} documents`}
              </p>
            )}
          </div>
        </div>
        
        {/* Document List Table View */}
        <div className="w-full bg-card border rounded-md overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-3 bg-muted p-3 border-b font-medium text-sm">
            <div className="col-span-4">Document</div>
            <div className="col-span-3">Tags</div>
            <div className="col-span-2">Uploaded</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>
          
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>{renderSkeletonListItem()}</div>
            ))
          ) : isError ? (
            // Error state
            <div className="w-full text-center py-8">
              <div className="text-red-500 mb-2">Error loading documents</div>
              <p className="text-sm text-muted-foreground mb-4">
                {error && typeof error === 'object' && 'message' in error ? error.message : 'Unknown error occurred'}
              </p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </div>
          ) : documents.length === 0 ? (
            // Empty state
            <div className="w-full text-center py-8">
              <h3 className="text-lg font-medium mb-2">No documents found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your filters or uploading new documents
              </p>
              <Button onClick={resetFilters} variant="outline">Reset Filters</Button>
            </div>
          ) : (
            // Document list items
            documents.map(doc => renderDocumentListItem(doc))
          )}
        </div>
        
        {/* Pagination */}
        {!isLoading && pagination.totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
              >
                First
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center px-4 text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages}
              >
                Last
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}