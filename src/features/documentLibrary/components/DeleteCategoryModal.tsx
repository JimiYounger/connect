import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Loader2, UndoIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface DeleteCategoryModalProps {
  open: boolean
  onClose: () => void
  categoryId: string
  onDeleteComplete?: () => void
}

interface Document {
  id: string
  title: string
  current_category_id: string
}

interface Category {
  id: string
  name: string
}

interface PrepareDeleteResponse {
  success: boolean
  data: {
    categoryId: string
    canDelete: boolean
    documents: Document[]
    availableCategories: Category[]
  }
  error?: string
}

export function DeleteCategoryModal({
  open,
  onClose,
  categoryId,
  onDeleteComplete,
}: DeleteCategoryModalProps) {
  const { toast } = useToast()
  
  // State for API data
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PrepareDeleteResponse['data'] | null>(null)
  
  // State for form
  const [masterCategoryId, setMasterCategoryId] = useState<string>('')
  const [documentOverrides, setDocumentOverrides] = useState<Record<string, string>>({})
  
  // Fetch category data from API - memoized with useCallback
  const fetchCategoryData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/document-library/categories/prepare-delete/${categoryId}`)
      const result: PrepareDeleteResponse = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load category data')
      }
      
      setData(result.data)
      
      // If there's only one available category, select it automatically
      if (result.data.availableCategories.length === 1) {
        setMasterCategoryId(result.data.availableCategories[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [categoryId]); // Add categoryId as a dependency since it's used in the fetch URL
  
  // Fetch data when the modal opens and categoryId changes
  useEffect(() => {
    if (open && categoryId) {
      fetchCategoryData()
    }
  }, [open, categoryId, fetchCategoryData]) // Include fetchCategoryData in the dependency array
  
  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setMasterCategoryId('')
      setDocumentOverrides({})
      setError(null)
    }
  }, [open])
  
  // Computed values
  const isDeleteDisabled = useMemo(() => {
    if (!data || !data.canDelete) return true
    if (!masterCategoryId) return true
    
    // Check if all documents have a fallback category selected
    const documents = data.documents || []
    return documents.some(doc => {
      const fallbackId = documentOverrides[doc.id] || masterCategoryId
      return !fallbackId || fallbackId === categoryId
    })
  }, [data, masterCategoryId, documentOverrides, categoryId])
  
  // Summary statistics for confirmation banner
  const reassignmentSummary = useMemo(() => {
    if (!data?.documents || !masterCategoryId) return null
    
    const overrideCount = Object.keys(documentOverrides).length
    const masterCount = data.documents.length - overrideCount
    
    // Group overrides by category for better summary
    const overridesByCategory: Record<string, number> = {}
    
    Object.entries(documentOverrides).forEach(([_, catId]) => {
      overridesByCategory[catId] = (overridesByCategory[catId] || 0) + 1
    })
    
    return {
      masterCount,
      overrideCount,
      overridesByCategory,
    }
  }, [data?.documents, masterCategoryId, documentOverrides])
  
  // Get category name by ID
  const getCategoryNameById = (id: string): string => {
    if (!data?.availableCategories) return ''
    return data.availableCategories.find(cat => cat.id === id)?.name || ''
  }
  
  // Handler for changing master category
  const handleMasterCategoryChange = (value: string) => {
    setMasterCategoryId(value)
    // Reset all overrides to follow master
    setDocumentOverrides({})
  }
  
  // Handler for changing individual document override
  const handleDocumentOverride = (documentId: string, categoryId: string) => {
    setDocumentOverrides(prev => ({
      ...prev,
      [documentId]: categoryId
    }))
  }
  
  // Handler for undoing an individual override
  const handleUndoOverride = (documentId: string) => {
    setDocumentOverrides(prev => {
      const newOverrides = { ...prev }
      delete newOverrides[documentId]
      return newOverrides
    })
  }
  
  // Handle deletion confirmation
  const handleConfirmDelete = async () => {
    if (isDeleteDisabled || !data) return
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const payload = {
        fallbackCategoryId: masterCategoryId,
        documentOverrides: Object.entries(documentOverrides).reduce((acc, [docId, catId]) => {
          // Only include overrides that differ from the master category
          if (catId !== masterCategoryId) {
            acc[docId] = catId
          }
          return acc
        }, {} as Record<string, string>)
      }
      
      const response = await fetch(`/api/document-library/categories/delete/${categoryId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete category')
      }
      
      toast({
        title: 'Category deleted',
        description: 'The category has been successfully deleted and documents reassigned.',
        variant: 'default'
      })
      
      onClose()
      onDeleteComplete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      
      toast({
        title: 'Error deleting category',
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // If category can't be deleted, show a special dialog
  if (data && !data.canDelete) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cannot Delete Category</DialogTitle>
            <DialogDescription>
              This is the only category in the system. At least one category must exist for document organization.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogDescription>
            Deleting this category requires reassigning its documents to another category.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading category data...</span>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : data ? (
          <>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  You are about to delete a category with {data.documents.length} document{data.documents.length !== 1 ? 's' : ''}. 
                  Please select a new category for these documents.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="master-category">Reassign all documents to:</Label>
                <Select value={masterCategoryId} onValueChange={handleMasterCategoryChange}>
                  <SelectTrigger id="master-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.availableCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Confirmation summary banner */}
              {masterCategoryId && reassignmentSummary && (
                <Alert className="bg-muted">
                  <AlertTitle>Reassignment Summary</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-1 text-sm">
                      {reassignmentSummary.masterCount > 0 && (
                        <p>
                          Reassigning {reassignmentSummary.masterCount} document{reassignmentSummary.masterCount !== 1 ? 's' : ''} to{' '}
                          <Badge variant="outline">{getCategoryNameById(masterCategoryId)}</Badge>
                        </p>
                      )}
                      
                      {Object.entries(reassignmentSummary.overridesByCategory).map(([catId, count]) => (
                        <p key={catId}>
                          {count} document{count !== 1 ? 's' : ''} manually reassigned to{' '}
                          <Badge variant="outline">{getCategoryNameById(catId)}</Badge>
                        </p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              {data.documents.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Affected Documents</Label>
                    <Badge variant="outline">{data.documents.length} document{data.documents.length !== 1 ? 's' : ''}</Badge>
                  </div>
                  
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {data.documents.map((document) => {
                      const selectedCategoryId = documentOverrides[document.id] || masterCategoryId;
                      const isInvalidSelection = selectedCategoryId === categoryId;
                      
                      return (
                        <Card key={document.id}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">{document.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <Label htmlFor={`doc-${document.id}`} className="text-xs">
                                  Override category for this document:
                                </Label>
                                
                                {/* Undo button for individual overrides */}
                                {documentOverrides[document.id] && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 px-2" 
                                    onClick={() => handleUndoOverride(document.id)}
                                  >
                                    <UndoIcon className="h-3 w-3 mr-1" />
                                    <span className="text-xs">Reset</span>
                                  </Button>
                                )}
                              </div>
                              
                              <Select 
                                value={selectedCategoryId} 
                                onValueChange={(value) => handleDocumentOverride(document.id, value)}
                                disabled={!masterCategoryId}
                              >
                                <SelectTrigger 
                                  id={`doc-${document.id}`} 
                                  className={`h-8 ${isInvalidSelection ? 'border-destructive' : ''}`}
                                >
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {data.availableCategories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              {/* Per-document validation warning */}
                              {isInvalidSelection && (
                                <p className="text-xs text-destructive mt-1">
                                  Same as current category — please choose another
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmDelete} 
                disabled={isDeleteDisabled || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm & Delete'
                )}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
} 