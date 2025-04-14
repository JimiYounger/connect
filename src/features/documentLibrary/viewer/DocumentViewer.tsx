'use client'

import { useState, useCallback } from 'react'
import { useDocuments } from './useDocuments'
import { DocumentFilters, Document, DocumentTag } from './types'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDistanceToNow } from 'date-fns'

interface DocumentViewerProps {
  initialFilters?: DocumentFilters
  categories?: Array<{ id: string; name: string }>
  availableTags?: DocumentTag[]
  isAdmin?: boolean
}

export function DocumentViewer({
  initialFilters = {},
  categories = [],
  availableTags = [],
  isAdmin = false
}: DocumentViewerProps) {
  // State for filters
  const [filters, setFilters] = useState<DocumentFilters>(initialFilters)
  const [searchInput, setSearchInput] = useState(initialFilters.searchQuery || '')
  
  // Fetch documents with current filters
  const { 
    documents, 
    pagination, 
    isLoading, 
    isError, 
    error,
    refetch
  } = useDocuments(filters)
  
  // Update filter handlers
  const handleCategoryChange = useCallback((value: string) => {
    setFilters(prev => ({
      ...prev,
      categoryId: value || undefined,
      page: 1 // Reset to first page when changing filters
    }))
  }, [])
  
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
  
  // Render functions
  const renderDocumentCard = (document: Document) => (
    <Card key={document.id} className="mb-4 overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-medium">{document.title}</CardTitle>
            {document.category && (
              <CardDescription className="text-sm">
                Category: {document.category.name}
              </CardDescription>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Updated {formatDistanceToNow(new Date(document.updatedAt))} ago
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        {document.description && (
          <p className="text-sm text-muted-foreground mb-3">{document.description}</p>
        )}
        
        {document.contentPreview && (
          <div className="text-sm bg-muted p-3 rounded-md mb-3 max-h-24 overflow-hidden">
            {document.contentPreview}
          </div>
        )}
        
        {document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {document.tags.map(tag => (
              <Badge 
                key={tag.id} 
                variant="outline" 
                className="cursor-pointer hover:bg-secondary"
                onClick={() => handleTagSelect(tag.id)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2 text-xs text-muted-foreground">
        <div>
          {document.uploadedBy ? (
            <span>Uploaded by {document.uploadedBy.first_name} {document.uploadedBy.last_name}</span>
          ) : (
            <span>Unknown uploader</span>
          )}
        </div>
        <div>
          {document.chunksCount} chunks
        </div>
      </CardFooter>
    </Card>
  )
  
  const renderSkeletonCard = () => (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-16 w-full mb-3" />
        
        <div className="flex gap-1 mt-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-20" />
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </CardFooter>
    </Card>
  )

  return (
    <div className="container mx-auto p-4">
      {/* Filters and Search */}
      <div className="bg-card rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Document Library</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Category Filter */}
          <div>
            <label className="text-sm font-medium mb-1 block">Category</label>
            <Select 
              value={filters.categoryId || ''} 
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
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
              disabled={!filters.categoryId && !filters.tags?.length && !filters.searchQuery}
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
      
      {/* Document List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>{renderSkeletonCard()}</div>
          ))
        ) : isError ? (
          // Error state
          <div className="col-span-full text-center py-8">
            <div className="text-red-500 mb-2">Error loading documents</div>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        ) : documents.length === 0 ? (
          // Empty state
          <div className="col-span-full text-center py-8">
            <h3 className="text-lg font-medium mb-2">No documents found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your filters or uploading new documents
            </p>
            <Button onClick={resetFilters} variant="outline">Reset Filters</Button>
          </div>
        ) : (
          // Document cards
          documents.map(doc => (
            <div key={doc.id}>
              {renderDocumentCard(doc)}
            </div>
          ))
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
  )
}