# 📚 documentLibrary Feature — Combined

## File Structure
 - .DS_Store
 - components/DeleteCategoryModal.tsx
 - components/index.ts
 - hooks/index.ts
 - hooks/useDocumentEditor.ts
 - hooks/useDocumentFilters.ts
 - index.ts
 - management/CategoryManagementModal.tsx
 - search/SemanticSearch.tsx
 - search/index.ts
 - search/types.ts
 - search/useSemanticSearch.ts
 - upload/UploadForm.tsx
 - upload/UploadModal.tsx
 - upload/handleUploadDocuments.ts
 - upload/insertDocumentWithRelations.ts
 - upload/schema.ts
 - upload/triggerDocumentParse.ts
 - upload/useUploadFormManager.ts
 - viewer/DocumentViewer.tsx
 - viewer/index.ts
 - viewer/types.ts
 - viewer/useDocuments.ts



---
### File: `src/features/documentLibrary/.DS_Store`
---

   Bud1            �                                                           a ddsclbool                                           u p l o a ddsclbool                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         @      �                                        @      �                                          @      �                                          @                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   E   �                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       DSDB                                 `      �                                               @      �                                          @      �                                          @                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

---
### File: `src/features/documentLibrary/components/DeleteCategoryModal.tsx`
---

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

---
### File: `src/features/documentLibrary/components/index.ts`
---

export { DeleteCategoryModal } from './DeleteCategoryModal' 

---
### File: `src/features/documentLibrary/hooks/index.ts`
---

// src/features/documentLibrary/hooks/index.ts

export * from './useDocumentEditor'
export * from './useDocumentFilters'

---
### File: `src/features/documentLibrary/hooks/useDocumentEditor.ts`
---

// src/features/documentLibrary/hooks/useDocumentEditor.ts

import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface DocumentVersion {
  id: string
  document_id: string
  file_path: string
  file_type: string
  version_label: string
  uploaded_at: string
}

interface DocumentData {
  id: string
  title: string
  description: string | null
  document_category_id: string
  // TODO: Add document_subcategory_id when implemented
  current_version_id: string
  uploaded_by: string
  created_at: string
  updated_at: string
  versions?: DocumentVersion[]
  tags?: { id: string; name: string }[]
  visibility?: {
    roleTypes?: string[]
    teams?: string[]
    areas?: string[]
    regions?: string[]
  }
}

interface DocumentEditorProps {
  documentId: string
}

/**
 * Hook to manage document editing functionality
 * 
 * Provides:
 * - Document data fetching
 * - Metadata editing
 * - Version management
 * - Form state management
 */
export function useDocumentEditor({ documentId }: DocumentEditorProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [document_category_id, setDocumentCategoryId] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [visibility, setVisibility] = useState<any>({
    roleTypes: [],
    teams: [],
    areas: [],
    regions: []
  })
  
  // Edit mode state
  const [isEditingMetadata, setIsEditingMetadata] = useState(false)
  
  // Fetch document data
  const { 
    data: document, 
    isLoading: isLoadingDocument, 
    isError: isErrorDocument, 
    refetch 
  } = useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      const supabase = createClient()
      
      // Fetch document metadata
      const { data: documentData, error: documentError } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          description,
          document_category_id,
          current_version_id,
          uploaded_by,
          created_at,
          updated_at
        `)
        .eq('id', documentId)
        .single()
      
      if (documentError) throw new Error(documentError.message)
      
      // Fetch document versions
      const { data: versionsData, error: versionsError } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('uploaded_at', { ascending: false })
      
      if (versionsError) throw new Error(versionsError.message)
      
      // Fetch document tags
      const { data: tagAssignments, error: tagAssignmentsError } = await supabase
        .from('document_tag_assignments')
        .select(`
          tag_id,
          document_tags (
            id,
            name
          )
        `)
        .eq('document_id', documentId)
      
      if (tagAssignmentsError) throw new Error(tagAssignmentsError.message)
      
      // Format tags for easier consumption
      const tags = tagAssignments.map(assignment => ({
        id: assignment.tag_id,
        name: assignment.document_tags?.name || "Unknown"
      }))
      
      // Fetch document visibility settings
      const { data: visibilityData, error: visibilityError } = await supabase
        .from('document_visibility')
        .select('conditions')
        .eq('document_id', documentId)
        .single()
        
      // Transform visibility data to our expected format
      let formattedVisibility: {
        roleTypes: string[];
        teams: string[];
        areas: string[];
        regions: string[];
      } = {
        roleTypes: [],
        teams: [],
        areas: [],
        regions: []
      }
      
      if (!visibilityError && visibilityData?.conditions) {
        const conditions = visibilityData.conditions as Record<string, any>;
        
        if (conditions.role_type) {
          formattedVisibility.roleTypes = [conditions.role_type as string]
        }
        
        if (conditions.teams && Array.isArray(conditions.teams)) {
          formattedVisibility.teams = conditions.teams as string[]
        }
        
        if (conditions.areas && Array.isArray(conditions.areas)) {
          formattedVisibility.areas = conditions.areas as string[]
        }
        
        if (conditions.regions && Array.isArray(conditions.regions)) {
          formattedVisibility.regions = conditions.regions as string[]
        }
      }
      
      // Combine all data
      return {
        ...documentData,
        versions: versionsData,
        tags,
        visibility: formattedVisibility
      }
    },
    enabled: !!documentId
  })
  
  // Fetch categories for select dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['documentCategories'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('document_categories')
        .select('id, name')
        .order('name')
      
      if (error) throw new Error(error.message)
      return data || []
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
  
  // Fetch all tags for tag selector
  const { data: allTags = [] } = useQuery({
    queryKey: ['documentTags'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('document_tags')
        .select('id, name')
        .order('name')
      
      if (error) throw new Error(error.message)
      return data || []
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
  
  // Mutation to update document metadata
  const updateDocumentMutation = useMutation({
    mutationFn: async (documentData: Partial<DocumentData>) => {
      // Use the dedicated API endpoint to handle updates atomically
      const response = await fetch(`/api/document-library/update/${documentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: documentData.title,
          description: documentData.description,
          document_category_id: documentData.document_category_id,
          tags: documentData.tags,
          visibility: documentData.visibility
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update document')
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error during document update')
      }
      
      return true
    },
    onSuccess: () => {
      toast({
        title: 'Document updated',
        description: 'The document metadata has been updated successfully.',
        variant: 'default'
      })
      
      setIsEditingMetadata(false)
      queryClient.invalidateQueries({ queryKey: ['document', documentId] })
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'An error occurred while updating the document.',
        variant: 'destructive'
      })
    }
  })
  
  // Mutation to set active version
  const setActiveVersionMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const response = await fetch(`/api/document-library/versions/set-active/${versionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to set active version')
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error setting active version')
      }
      
      return true
    },
    onSuccess: () => {
      toast({
        title: 'Version updated',
        description: 'The active document version has been updated.',
        variant: 'default'
      })
      
      queryClient.invalidateQueries({ queryKey: ['document', documentId] })
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'An error occurred while updating the active version.',
        variant: 'destructive'
      })
    }
  })
  
  // Mutation to delete a version
  const deleteVersionMutation = useMutation({
    mutationFn: async (versionId: string) => {
      // Check if this is the active version (client-side pre-check for better UX)
      if (document?.current_version_id === versionId) {
        throw new Error('Cannot delete the active version.')
      }
      
      const response = await fetch(`/api/document-library/versions/delete/${versionId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete version')
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error deleting version')
      }
      
      return true
    },
    onSuccess: () => {
      toast({
        title: 'Version deleted',
        description: 'The document version has been deleted.',
        variant: 'default'
      })
      
      queryClient.invalidateQueries({ queryKey: ['document', documentId] })
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'An error occurred while deleting the version.',
        variant: 'destructive'
      })
    }
  })
  
  // Mutation to delete the document
  const deleteDocumentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/document-library/delete/${documentId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete document')
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error deleting document')
      }
      
      return true
    },
    onSuccess: () => {
      toast({
        title: 'Document deleted',
        description: 'The document has been permanently deleted.',
        variant: 'default'
      })
      
      return '/admin/document-library' // Return redirect path
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'An error occurred while deleting the document.',
        variant: 'destructive'
      })
    }
  })
  
  // Set form values when document data loads
  useEffect(() => {
    if (document) {
      setTitle(document.title || '')
      setDescription(document.description || '')
      setDocumentCategoryId(document.document_category_id || '')
      // Filter out any null values from tag IDs and ensure string type
      const tagIds = document.tags?.map(tag => tag.id)
        .filter((id): id is string => id !== null && id !== undefined) || []
      setSelectedTags(tagIds)
      setVisibility(document.visibility || {
        roleTypes: [],
        teams: [],
        areas: [],
        regions: []
      })
    }
  }, [document])
  
  // Handle save metadata changes
  const handleSaveMetadata = useCallback(() => {
    updateDocumentMutation.mutate({
      title,
      description,
      document_category_id,
      tags: selectedTags.map(id => ({ id, name: allTags.find(tag => tag.id === id)?.name || '' })),
      visibility
    })
  }, [title, description, document_category_id, selectedTags, visibility, allTags, updateDocumentMutation])
  
  // Handle tag selection
  const handleTagChange = useCallback((tagId: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId)
      } else {
        return [...prev, tagId]
      }
    })
  }, [])
  
  return {
    // Data
    document,
    categories,
    allTags,
    
    // Loading states
    isLoadingDocument,
    isErrorDocument,
    
    // Form state
    title,
    setTitle,
    description,
    setDescription,
    document_category_id,
    setDocumentCategoryId,
    selectedTags,
    setSelectedTags,
    visibility,
    setVisibility,
    isEditingMetadata,
    setIsEditingMetadata,
    
    // Mutations
    updateDocumentMutation,
    setActiveVersionMutation,
    deleteVersionMutation,
    deleteDocumentMutation,
    
    // Helper functions
    handleSaveMetadata,
    handleTagChange,
    refetch
  }
}

---
### File: `src/features/documentLibrary/hooks/useDocumentFilters.ts`
---

// src/features/documentLibrary/hooks/useDocumentFilters.ts

import { useCallback, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';

// Types for our filter data
export interface DocumentCategory {
  id: string;
  name: string;
  order: number;
}

export interface DocumentSubcategory {
  id: string;
  name: string;
  document_category_id: string;
  description: string | null;
  order: number | null;
}

export interface DocumentTag {
  id: string;
  name: string;
}

// Default empty arrays for useQuery initialData or placeholders
const EMPTY_CATEGORY_ARRAY: DocumentCategory[] = [];
const EMPTY_SUBCATEGORY_ARRAY: DocumentSubcategory[] = [];
const EMPTY_TAG_ARRAY: DocumentTag[] = [];

// Function to fetch categories
const fetchCategories = async () => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('document_categories')
    .select('*')
    .order('order');
  if (error) {
    console.error('Error fetching categories:', error);
    // For development/testing, provide fallback data if needed
    if (process.env.NODE_ENV === 'development') {
      return [
        { id: 'cat-1', name: 'Energy', order: 1 },
        { id: 'cat-2', name: 'Technology', order: 2 },
        { id: 'cat-3', name: 'Finance', order: 3 },
        { id: 'cat-4', name: 'HR', order: 4 }
      ];
    }
    throw new Error(error.message);
  }
  return data || EMPTY_CATEGORY_ARRAY;
};

// Function to fetch subcategories
const fetchSubcategories = async () => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('document_subcategories')
    .select('*')
    .order('order');
  if (error) {
    console.error('Error fetching subcategories:', error);
    // For development/testing, provide fallback data if needed
    if (process.env.NODE_ENV === 'development') {
      return [
        { id: 'sub-1', name: 'Renewable', document_category_id: 'cat-1', description: null, order: 1 },
        { id: 'sub-2', name: 'Electronics', document_category_id: 'cat-2', description: null, order: 1 },
        { id: 'sub-3', name: 'Investment', document_category_id: 'cat-3', description: null, order: 1 },
        { id: 'sub-4', name: 'Training', document_category_id: 'cat-4', description: null, order: 1 }
      ];
    }
    throw new Error(error.message);
  }
  return data || EMPTY_SUBCATEGORY_ARRAY;
};

// Function to fetch tags
const fetchTags = async () => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('document_tags')
    .select('*')
    .order('name');
  if (error) {
    console.error('Error fetching tags:', error);
     // For development/testing, provide fallback data if needed
     if (process.env.NODE_ENV === 'development') {
       return [
         { id: 'tag-1', name: 'Solar' },
         { id: 'tag-2', name: 'Inverter' },
         { id: 'tag-3', name: 'Energy' },
         { id: 'tag-4', name: 'Important' },
         { id: 'tag-5', name: 'Draft' }
       ];
     }
    throw new Error(error.message);
  }
  return data || EMPTY_TAG_ARRAY;
};

export function useDocumentFilters() {
  // Use React Query to fetch and cache data
  const results = useQueries({
    queries: [
      { 
        queryKey: ['documentCategories'], 
        queryFn: fetchCategories,
        staleTime: 15 * 60 * 1000, // Cache for 15 minutes
        refetchOnWindowFocus: false, // Don't refetch just because window regained focus
        retry: 1, // Retry once on error
      },
      { 
        queryKey: ['documentSubcategories'], 
        queryFn: fetchSubcategories,
        staleTime: 15 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      { 
        queryKey: ['documentTags'], 
        queryFn: fetchTags,
        staleTime: 15 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    ]
  });

  const categoriesQuery = results[0];
  const subcategoriesQuery = results[1];
  const tagsQuery = results[2];

  // Extract data, defaulting to empty arrays if data is not yet available
  const categories = useMemo(() => categoriesQuery.data ?? EMPTY_CATEGORY_ARRAY, [categoriesQuery.data]);
  const subcategories = useMemo(() => subcategoriesQuery.data ?? EMPTY_SUBCATEGORY_ARRAY, [subcategoriesQuery.data]);
  const tags = useMemo(() => tagsQuery.data ?? EMPTY_TAG_ARRAY, [tagsQuery.data]);

  // Combine loading states
  const loading = useMemo(() => results.some(query => query.isLoading), [results]);

  // Combine error states - find the first error
  const error = useMemo(() => results.find(query => query.isError)?.error as Error | null ?? null, [results]);

  // Function to get subcategories for a specific category
  const getSubcategoriesForCategory = useCallback(
    (categoryId: string) => {
      if (categoryId === 'all') {
        return subcategories;
      }
      return subcategories.filter(
        (subcat) => subcat.document_category_id === categoryId
      );
    },
    [subcategories]
  );

  return {
    categories,
    subcategories,
    tags,
    getSubcategoriesForCategory,
    loading,
    error,
  };
}

---
### File: `src/features/documentLibrary/index.ts`
---

// Export components
export * from './components'

// You can add other exports as needed
// export * from './hooks'
// export * from './utils'
// etc. 

---
### File: `src/features/documentLibrary/management/CategoryManagementModal.tsx`
---

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Pencil } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the Categories page to avoid SSR issues
const CategoriesPage = dynamic(
  () => import('@/app/(auth)/admin/document-library/categories/page'),
  { ssr: false }
);

interface CategoryManagementModalProps {
  type: 'categories' | 'subcategories';
  className?: string;
}

export function CategoryManagementModal({ type, className }: CategoryManagementModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`h-6 w-6 p-0 opacity-70 hover:opacity-100 hover:bg-transparent ${className || ''}`}
        >
          <Pencil size={14} />
          <span className="sr-only">Manage {type}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Manage {type === 'categories' ? 'Categories' : 'Subcategories'}
          </DialogTitle>
          <DialogDescription>
            {type === 'categories' 
              ? 'Create, edit, and organize document categories' 
              : 'Manage subcategories within your document categories'}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-auto flex-1 -mx-6 px-6 pb-6">
          <CategoriesPage />
        </div>
      </DialogContent>
    </Dialog>
  );
} 

---
### File: `src/features/documentLibrary/search/SemanticSearch.tsx`
---

// my-app/src/features/documentLibrary/search/SemanticSearch.tsx

'use client';

import { useEffect, useRef, KeyboardEvent, useMemo, useState, useCallback } from 'react';
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
  viewUrlPrefix = '/documents',
  onTitleClick
}: { 
  result: SearchResult; 
  viewUrlPrefix?: string;
  onTitleClick?: (result: SearchResult) => void;
}) => {
  const [shareFeedback, setShareFeedback] = useState('');
  
  const documentUrl = useMemo(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''; 
    return `${baseUrl}${viewUrlPrefix}/${result.id}`;
  }, [result.id, viewUrlPrefix]);
  
  // Debug log to inspect result data
  useEffect(() => {
    console.log('ResultCard rendering with data:', {
      id: result.id,
      title: result.title,
      description: result.description,
      summary: result.summary,
      highlight: result.highlight
    });
  }, [result]);
  
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
          <CardTitle 
            className="text-base font-medium cursor-pointer hover:text-primary transition-colors"
            onClick={() => onTitleClick?.(result)}
          >
            {result.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="px-4 py-2 pb-4">
          {(result.description || result.summary || result.highlight) && (
            <div className="text-sm text-muted-foreground mb-3">
              {result.description || result.summary || result.highlight}
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
  initialQuery,
  onDocumentSelect
}: SemanticSearchProps & {
  documentUrlPrefix?: string;
  onDocumentSelect?: (document: SearchResult) => void;
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

  // Handle document title click
  const handleDocumentTitleClick = useCallback((document: SearchResult) => {
    if (onDocumentSelect) {
      onDocumentSelect(document);
    }
  }, [onDocumentSelect]);
  
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
                  onTitleClick={handleDocumentTitleClick}
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

---
### File: `src/features/documentLibrary/search/index.ts`
---

// my-app/src/features/documentLibrary/search/index.ts

/**
 * Semantic search feature for document library
 */

// Export main component
export { SemanticSearch } from './SemanticSearch';

// Export hook for custom implementations
export { useSemanticSearch } from './useSemanticSearch';

// Export types
export * from './types'; 

---
### File: `src/features/documentLibrary/search/types.ts`
---

// my-app/src/features/documentLibrary/search/types.ts

/**
 * Types for the document library semantic search feature
 */

// Document chunk from search results
export interface DocumentChunk {
  chunk_index: number;
  content: string;
  similarity: number;
}

// Main search result object
export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  summary?: string;
  similarity: number;
  highlight: string; // Snippet from the most relevant chunk
  matching_chunks: DocumentChunk[];
  visibility?: {
    role_type?: string;
    [key: string]: any;
  };
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  embedding_status: string;
  [key: string]: any; // Allow for additional fields from the database
}

// API response shape
export interface SearchResponse {
  success: boolean;
  query: string;
  result_count: number;
  searched_at: string;
  filters_used: Record<string, any>;
  sort_by: 'similarity' | 'created_at' | 'title';
  results: SearchResult[];
}

// API request shape
export interface SearchRequest {
  query: string;
  filters?: Record<string, any>;
  match_threshold?: number;
  match_count?: number;
  sort_by?: 'similarity' | 'created_at' | 'title';
  log_search?: boolean; // Flag to control whether to log this search
}

// Props for the SemanticSearch component
export interface SemanticSearchProps {
  placeholder?: string;
  onResults?: (results: SearchResult[]) => void;
  filters?: Record<string, any>;
  autoFocus?: boolean;
  matchThreshold?: number;
  matchCount?: number;
  initialSortBy?: 'similarity' | 'created_at' | 'title';
  className?: string;
  initialQuery?: string;
  onDocumentSelect?: (document: SearchResult) => void;
}

// Error state
export interface SearchError {
  message: string;
} 

---
### File: `src/features/documentLibrary/search/useSemanticSearch.ts`
---

// my-app/src/features/documentLibrary/search/useSemanticSearch.ts

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { 
  SearchRequest, 
  SearchResponse, 
  SearchResult,
  SearchError
} from './types';
import { DocumentListParams } from '@/app/api/document-library/list/route'; // Import list types

// Helper to map List API response to SearchResult
function mapListResultToSearchResult(item: any): SearchResult {
  return {
    id: item.id,
    title: item.title || 'Untitled Document',
    description: item.description,
    summary: item.summary,
    highlight: item.contentPreview || '', // Use content preview as highlight
    similarity: 1, // Assign a default similarity score for list items
    tags: item.tags ? item.tags.map((t: any) => t.name) : [], // Extract tag names
    category_name: item.category?.name,
    subcategory_name: item.subcategory?.name,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
    // Add other fields if needed, ensuring they conform to SearchResult
    matching_chunks: [], // List results don't have chunks
    embedding_status: 'complete', // Assume complete for listed items
  };
}

/**
 * Custom hook for semantic search functionality
 */
export const useSemanticSearch = ({
  initialFilters = {},
  initialMatchThreshold = 0.5,
  initialMatchCount = 10,
  initialSortBy = 'similarity',
  onResults,
  initialQuery = ''
}: {
  initialFilters?: Record<string, any>;
  initialMatchThreshold?: number;
  initialMatchCount?: number;
  initialSortBy?: 'similarity' | 'created_at' | 'title';
  onResults?: (results: SearchResult[]) => void;
  initialQuery?: string;
}) => {
  console.log('[useSemanticSearch] Hook initialized. Received initialQuery:', initialQuery);
  // State management
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);
  const [matchThreshold, setMatchThreshold] = useState(initialMatchThreshold);
  const [matchCount, setMatchCount] = useState(initialMatchCount);
  const [sortBy, setSortBy] = useState<'similarity' | 'created_at' | 'title'>(initialSortBy);
  const [lastLoggedQuery, setLastLoggedQuery] = useState<string>(''); // Track what we've already logged
  
  // Results and state management
  const [results, setResults] = useState<SearchResult[]>([]);
  const [response, setResponse] = useState<SearchResponse | null>(null); // Keep original search response
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<SearchError | null>(null);
  
  // Memoize a stable string representation of filters to use as useEffect dependency
  const filtersString = useMemo(() => JSON.stringify(filters), [filters]);
  
  // State and ref for debounced logging decision
  const [shouldLogNextSearch, setShouldLogNextSearch] = useState(false);
  const logDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to update query state if initialQuery prop changes AFTER mount
  useEffect(() => {
    // Only update if the prop has a value and differs from current query
    if (initialQuery && initialQuery !== query) {
      console.log(`[useSemanticSearch] initialQuery prop changed to '${initialQuery}', updating internal state.`);
      setQuery(initialQuery);
      setDebouncedQuery(initialQuery); // Also update debouncedQuery to trigger search
    }
    // We only want this effect to react to changes in the initialQuery prop itself.
  }, [initialQuery, query]); // <-- Add query dependency

  // Debounce input by 500ms for triggering search/list
  useEffect(() => {
    // If the query is the initial query, the debouncedQuery is already set.
    // Only apply debounce for subsequent user changes.
    if (query === initialQuery && debouncedQuery === initialQuery) {
      // If query hasn't changed from initial, ensure debounced is also set (safe redundancy)
      if (debouncedQuery !== initialQuery) setDebouncedQuery(initialQuery);
      return; // Don't start debounce timer for the initial value
    }
    
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500); // Search debounce
    
    return () => {
      clearTimeout(handler);
    };
  }, [query, initialQuery, debouncedQuery]);

  // Debounce logging decision by 2000ms
  useEffect(() => {
    if (logDebounceTimerRef.current) {
      clearTimeout(logDebounceTimerRef.current);
    }

    // Only set up logging debounce if the query is potentially valid for logging
    if (debouncedQuery && debouncedQuery.trim() !== '') {
      logDebounceTimerRef.current = setTimeout(() => {
        // Check if the query is actually different from the last logged one
        if (debouncedQuery !== lastLoggedQuery) {
          console.log(`[useSemanticSearch] Log debounce fired. Query "${debouncedQuery}" is different from last logged "${lastLoggedQuery}". Flagging next search for logging.`);
          setShouldLogNextSearch(true);
        } else {
          console.log(`[useSemanticSearch] Log debounce fired. Query "${debouncedQuery}" is SAME as last logged. Not flagging.`);
          setShouldLogNextSearch(false); // Ensure it's false if query hasn't changed
        }
      }, 2000); // Logging debounce (longer)
    } else {
      // If query becomes empty, reset logging flag
      setShouldLogNextSearch(false);
    }

    return () => {
      if (logDebounceTimerRef.current) {
        clearTimeout(logDebounceTimerRef.current);
      }
    };
  }, [debouncedQuery, lastLoggedQuery]); // Depend on debouncedQuery and lastLoggedQuery

  // Function to fetch list based on filters only
  const fetchList = useCallback(async () => {
    setIsLoading(true);
    console.log('[useSemanticSearch] fetchList CALLED.');
    setError(null);
    setResults([]); // Clear previous results
    setResponse(null);

    try {
      const listParams: DocumentListParams = {
        document_category_id: filters.categoryId,
        document_subcategory_id: filters.subcategoryId,
        tags: filters.tagId ? [filters.tagId] : undefined, // List API expects array of tag IDs
        limit: matchCount, // Use matchCount for limit
        // Add pagination if needed: page: 1
      };

      console.log('Sending list request with params:', JSON.stringify(listParams));

      const listResponse = await fetch('/api/document-library/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listParams),
      });

      if (!listResponse.ok) {
        const errorData = await listResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to list documents: ${listResponse.status}`);
      }

      const data = await listResponse.json();
      console.log('List response received:', data);

      if (!data.success) {
        throw new Error(data.error || 'Listing documents was unsuccessful');
      }

      const mappedResults = data.data.map(mapListResultToSearchResult);
      setResults(mappedResults);
      
      // No SearchResponse equivalent for list, set to null or a custom object
      setResponse(null); 

      if (onResults) {
        onResults(mappedResults);
      }
    } catch (err) {
      console.error('List fetch error:', err);
      setError({
        message: err instanceof Error ? err.message : 'An unknown error occurred while fetching list',
      });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, matchCount, onResults]); // Depend on filters object, matchCount, onResults
  
  // Function to perform the semantic search
  const performSearch = useCallback(async () => {
    // If query is empty, do nothing (handled by the main useEffect)
    console.log('[useSemanticSearch] performSearch CALLED.');
    if (!debouncedQuery) return;
    
    setIsLoading(true);
    setError(null);
    setResults([]); // Clear previous results
    setResponse(null);
    
    try {
      // Logging decision is now based on the debounced flag
      const logThisSearch = shouldLogNextSearch;
      
      // Use filter IDs from the state
      const requestBody: SearchRequest = {
        query: debouncedQuery,
        filters: filters, // Pass the filters state directly (now contains IDs)
        match_threshold: matchThreshold,
        match_count: matchCount,
        sort_by: sortBy,
        log_search: logThisSearch // Use the debounced flag
      };
      
      console.log('Sending search request:', JSON.stringify(requestBody, null, 2));
      
      let data;
      try {
        const searchApiResponse = await fetch('/api/document-library/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!searchApiResponse.ok) {
          const errorData = await searchApiResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to search documents: ${searchApiResponse.status}`);
        }
        
        const contentType = searchApiResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Received non-JSON response from search API');
        }
      
        data = await searchApiResponse.json();
        console.log('Search response received:', data);
        
        if (!data.success) {
          throw new Error(data.error || 'Search was unsuccessful');
        }
      } catch (fetchError) {
        console.error('Error during search request:', fetchError);
        const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
        throw new Error(`Search request failed: ${errorMessage}`);
      }
      
      let searchResults: SearchResult[] = [];
      if (Array.isArray(data.results)) {
        searchResults = data.results;
      }
      
      console.log(`Processing ${searchResults.length} search results`);
      
      searchResults = searchResults.map(result => ({
        ...result,
        id: result.id || `unknown-${Math.random().toString(36).substring(2, 9)}`,
        title: result.title || 'Untitled Document',
        similarity: result.similarity || 0,
        highlight: result.highlight || '',
        matching_chunks: result.matching_chunks || [],
        embedding_status: result.embedding_status || 'complete'
      }));
      
      setResults(searchResults);
      setResponse(data); // Store the full search response
      
      if (requestBody.log_search) {
        setLastLoggedQuery(debouncedQuery);
        setShouldLogNextSearch(false); // Reset flag after logging
        console.log('Search logged:', debouncedQuery);
      }
      
      if (onResults) {
        onResults(searchResults);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError({ 
        message: err instanceof Error ? err.message : 'An unknown error occurred during search' 
      });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, filters, matchThreshold, matchCount, sortBy, onResults, shouldLogNextSearch]); // Removed lastLoggedQuery dependency
  
  // Main effect to trigger search or list fetch
  useEffect(() => {
    const hasFilters = Object.values(filters).some(v => v && v !== 'all'); // Check if any filters are active
    console.log('[useSemanticSearch] Main effect triggered. Debounced Query:', debouncedQuery, 'Has Filters:', hasFilters);

    if (debouncedQuery.trim() !== '') {
      console.log('[useSemanticSearch] Main effect -> Calling performSearch');
      performSearch();
    } else if (hasFilters) {
      console.log('No query, but filters detected, fetching list...');
      fetchList();
    } else {
      // No query and no filters, clear results
      console.log('No query and no filters, clearing results.');
      setResults([]);
      setResponse(null);
      setError(null);
      setIsLoading(false); // Ensure loading is false
    }
    // Use filtersString as dependency to react to filter changes
     
    // We intentionally only want this effect to run when the core inputs (query/filters) change,
    // not when the callback functions themselves change identity due to internal state updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, filtersString]); // ONLY depend on the inputs that drive the decision
  
  // Function to clear the search
  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setError(null);
    setLastLoggedQuery(''); // Clear the logged query tracking
    setShouldLogNextSearch(false); // Reset logging flag on clear
  }, []);
  
  // Function to update filters (simplified, direct set)
  const updateFilters = useCallback((newFilters: Record<string, any>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);
  
  // Manually trigger search (if needed, ensures debouncedQuery is updated)
  const searchNow = useCallback(() => {
    setDebouncedQuery(query);
  }, [query]);
  
  return {
    // State
    query,
    filters,
    results,
    response,
    isLoading,
    error,
    sortBy,
    matchThreshold,
    matchCount,
    
    // Actions
    setQuery,
    updateFilters, // Keep if used elsewhere
    setFilters, // Expose setFilters directly
    setSortBy,
    setMatchThreshold,
    setMatchCount,
    clearSearch,
    searchNow
  };
}; 

---
### File: `src/features/documentLibrary/upload/UploadForm.tsx`
---

// my-app/src/features/documentLibrary/upload/UploadForm.tsx

'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { X, Upload, File as FileIcon, AlertTriangle, Plus, Search, Tag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
// Don't use FormLabel component since we're not using react-hook-form
// import { FormLabel } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { useDebounce } from '@/hooks/use-debounce'
import { RoleSelector } from '@/features/carousel/components/RoleSelector'
import { DocumentUploadSchema, DocumentUploadInput } from './schema'
import { useUploadFormManager } from './useUploadFormManager'
import { handleUploadDocuments } from './handleUploadDocuments'
import { Progress } from '@/components/ui/progress'

// Multi-select tag component with search and creation
function TagSelector({ 
  availableTags, 
  selectedTags, 
  onChange 
}: { 
  availableTags: string[], 
  selectedTags: string[], 
  onChange: (tags: string[]) => void 
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [newTagInput, setNewTagInput] = useState('')
  
  // Use the imported useDebounce hook
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  
  const filteredTags = availableTags.filter(tag => 
    tag.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) && 
    !selectedTags.includes(tag)
  )
  
  const handleToggleTag = useCallback((tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag))
    } else {
      onChange([...selectedTags, tag])
    }
  }, [selectedTags, onChange])
  
  const handleCreateTag = useCallback(() => {
    if (!newTagInput.trim()) return
    
    const newTag = newTagInput.trim()
    setNewTagInput('')
    
    if (!selectedTags.includes(newTag) && !availableTags.includes(newTag)) {
      onChange([...selectedTags, newTag])
    }
  }, [newTagInput, selectedTags, availableTags, onChange, setNewTagInput])
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput) {
      e.preventDefault()
      handleCreateTag()
    }
  }, [newTagInput, handleCreateTag])
  
  return (
    <div className="w-full">
      <div className="relative">
        <div 
          className="flex flex-wrap gap-1 min-h-10 p-2 border rounded-md cursor-text"
          onClick={() => setIsOpen(true)}
        >
          {selectedTags.map(tag => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-2 py-1">
              <Tag className="h-3 w-3" />
              {tag}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleTag(tag)
                }} 
              />
            </Badge>
          ))}
          
          {selectedTags.length === 0 && (
            <span className="text-sm text-muted-foreground">Select or create tags...</span>
          )}
        </div>
        
        {isOpen && (
          <div className="absolute top-full left-0 w-full z-10 bg-background border rounded-md mt-1 shadow-md">
            <div className="p-2">
              <div className="relative mb-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tags..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="max-h-[200px] overflow-y-auto">
                {filteredTags.length > 0 ? (
                  <div className="space-y-1">
                    {filteredTags.map(tag => (
                      <div 
                        key={tag} 
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer"
                        onClick={() => handleToggleTag(tag)}
                      >
                        <Tag className="h-4 w-4" />
                        <span>{tag}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  searchQuery && (
                    <div className="p-2 text-sm text-muted-foreground">
                      No matching tags found.
                    </div>
                  )
                )}
              </div>
              
              <div className="border-t mt-2 pt-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Create new tag..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCreateTag}
                    disabled={!newTagInput.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end p-2 border-t">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Hidden input to store the selected tags */}
      <input 
        type="hidden" 
        name="tags" 
        value={JSON.stringify(selectedTags)} 
      />
    </div>
  )
}

// New component for subcategory selection with "Create New" option
function SubcategorySelectWithCreate({ 
  formEntryId,
  categoryId,
  value,
  onChange
}: { 
  formEntryId: string;
  categoryId: string;
  value?: string;
  onChange: (value: string) => void;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { subcategories, loading, error, refetch } = useSubcategories(categoryId);
  
  // Debug logging
  console.log(`SubcategorySelectWithCreate for ${formEntryId}:`, {
    categoryId,
    value,
    subcategories,
    loading,
    error
  });
  
  // Add one-time event listener to monitor fetch requests when component mounts
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      // Check if this is a request to the document_subcategories endpoint
      const url = args[0]?.toString() || '';
      if (url.includes('document_subcategories')) {
        console.log('🔍 Intercepted fetch request to document_subcategories:', {
          url,
          method: args[1]?.method || 'GET',
          body: args[1]?.body ? JSON.parse(args[1].body.toString()) : null
        });
        
        return originalFetch.apply(this, args)
          .then(response => {
            // Clone the response so we can read it twice
            const clone = response.clone();
            clone.json().then(data => {
              console.log('📊 document_subcategories fetch response:', {
                status: response.status,
                statusText: response.statusText,
                data
              });
            }).catch(err => {
              console.log('❌ Failed to parse response as JSON:', err);
            });
            return response;
          })
          .catch(err => {
            console.error('❌ Fetch error:', err);
            throw err;
          });
      }
      
      return originalFetch.apply(this, args);
    };
    
    // Clean up
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
  
  // Focus the input when entering creation mode
  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);
  
  const handleCreateTrigger = useCallback(() => {
    setIsCreating(true);
    setNewSubcategoryName('');
  }, []);
  
  const handleCancel = useCallback(() => {
    setIsCreating(false);
    setNewSubcategoryName('');
  }, []);
  
  const handleCreateSubcategory = useCallback(async (name: string): Promise<string | null> => {
    console.log('🔍 handleCreateSubcategory called with:', { name, categoryId });
    if (!name.trim() || !categoryId) {
      console.error('❌ Missing name or categoryId:', { name, categoryId });
      return null;
    }
    
    try {
      setIsSubmitting(true);
      
      // Use the new API route instead of direct Supabase access
      const response = await fetch('/api/document-library/subcategories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          document_category_id: categoryId,
          description: null // Optional
        }),
      });
      
      console.log('📊 API response status:', response.status);
      
      const result = await response.json();
      console.log('📊 API response data:', result);
      
      if (!response.ok || !result.success) {
        const errorMessage = result.error || 'Failed to create subcategory';
        
        // Handle specific error cases
        if (response.status === 409) {
          toast({
            title: "Subcategory already exists",
            description: "A subcategory with this name already exists for this category.",
            variant: "destructive"
          });
        } else {
          console.error('❌ Error creating subcategory:', errorMessage);
          toast({
            title: "Failed to create subcategory",
            description: errorMessage,
            variant: "destructive"
          });
        }
        return null;
      }
      
      console.log('✅ Subcategory created successfully:', result.data);
      
      // Refresh the subcategories list
      refetch();
      
      toast({
        title: "Subcategory created",
        description: `"${name}" subcategory was successfully created.`
      });
      
      return result.data.id;
    } catch (err) {
      console.error('❌ Exception creating subcategory:', err);
      toast({
        title: "Error",
        description: "Failed to create new subcategory. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [categoryId, refetch]);
  
  const handleSubmit = useCallback(async () => {
    if (!newSubcategoryName.trim()) return;
    
    console.log('🔍 handleSubmit called with:', { newSubcategoryName });
    const newSubcategoryId = await handleCreateSubcategory(newSubcategoryName.trim());
    console.log('🔍 handleCreateSubcategory returned:', { newSubcategoryId });
    
    if (newSubcategoryId) {
      // Wait for a tiny bit to let the list refresh
      setTimeout(() => {
        console.log('🔍 Setting subcategory value to:', newSubcategoryId);
        onChange(newSubcategoryId);
        setIsCreating(false);
        
        // Force a refetch after a successful creation
        refetch();
      }, 300); // Increased timeout to ensure server has time to process
    }
  }, [newSubcategoryName, onChange, handleCreateSubcategory, refetch]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSubmit, handleCancel]);
  
  if (loading) {
    return (
      <div className="mt-2">
        <Label htmlFor={`subcategory-${formEntryId}`}>Subcategory</Label>
        <Select disabled name="document_subcategory_id">
          <SelectTrigger id={`subcategory-${formEntryId}`}>
            <SelectValue placeholder="Loading subcategories..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_loading" disabled>Loading...</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="mt-2">
        <Label htmlFor={`subcategory-${formEntryId}`}>Subcategory</Label>
        <div className="text-sm text-red-500">Error loading subcategories</div>
      </div>
    );
  }
  
  if (isCreating) {
    return (
      <div className="mt-2">
        <Label htmlFor={`new-subcategory-${formEntryId}`}>Subcategory</Label>
        <div className="flex gap-2 items-center">
          <Input
            id={`new-subcategory-${formEntryId}`}
            ref={inputRef}
            value={newSubcategoryName}
            onChange={(e) => setNewSubcategoryName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter new subcategory name"
            disabled={isSubmitting}
            className="flex-1"
          />
          <Button 
            type="button" 
            size="sm" 
            onClick={handleSubmit} 
            disabled={!newSubcategoryName.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving</span>
              </span>
            ) : "Save"}
          </Button>
          <Button 
            type="button" 
            size="sm" 
            variant="outline" 
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
        <input 
          type="hidden" 
          name="document_subcategory_id" 
          value={value || ''} 
        />
      </div>
    );
  }
  
  return (
    <div className="mt-2">
      <Label htmlFor={`subcategory-${formEntryId}`}>Subcategory</Label>
      <Select 
        name="document_subcategory_id"
        value={value || '_none'}
        onValueChange={(value) => {
          console.log('🔍 Subcategory select onValueChange:', { value });
          if (value === '_create_new') {
            handleCreateTrigger();
          } else {
            onChange(value === '_none' ? '' : value);
          }
        }}
      >
        <SelectTrigger id={`subcategory-${formEntryId}`}>
          <SelectValue placeholder="Select a subcategory" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_create_new" className="text-primary font-medium">
            ➕ Create New Subcategory
          </SelectItem>
          <SelectItem value="_none" key="_none">None</SelectItem>
          {subcategories.length > 0 ? (
            subcategories.map(subcategory => (
              <SelectItem key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="_empty" disabled className="text-muted-foreground italic">
              No subcategories yet - create one above
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

// Hook to fetch subcategories based on selected category ID
function useSubcategories(categoryId?: string) {
  const [subcategories, setSubcategories] = useState<{ id: string; name: string; document_category_id: string }[]>([])
  const [loading, setLoading] = useState(true) // Start with loading=true
  const [error, setError] = useState<string | null>(null)
  
  const fetchSubcategories = useCallback(async () => {
    console.log('🔄 fetchSubcategories called with categoryId:', categoryId);
    if (!categoryId) {
      setSubcategories([])
      setLoading(false) // Make sure to set loading to false
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Making API request for subcategories with categoryId:', categoryId);
      
      // Use the API route instead of direct Supabase access
      const response = await fetch(`/api/document-library/subcategories?categoryId=${categoryId}`);
      const result = await response.json();
      
      console.log('🔄 API response for subcategories:', result);
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch subcategories');
      }
      
      setSubcategories(result.data || [])
    } catch (err) {
      console.error('❌ Error fetching subcategories:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setSubcategories([])
    } finally {
      setLoading(false)
    }
  }, [categoryId])
  
  // Initial fetch
  useEffect(() => {
    fetchSubcategories()
  }, [fetchSubcategories])
  
  return { 
    subcategories, 
    loading, 
    error,
    refetch: fetchSubcategories
  }
}

export type UploadFormProps = {
  categories: { id: string; name: string }[]
  allTags: string[]
  userId: string
  onUploadSuccess?: () => void
  onCategoryCreated?: () => void
}

// New component for category selection with "Create New" option
function CategorySelectWithCreate({ 
  formEntryId,
  categories,
  value,
  onChange,
  onCreateNew
}: { 
  formEntryId: string;
  categories: { id: string; name: string }[];
  value?: string;
  onChange: (value: string) => void;
  onCreateNew: (name: string) => Promise<string | null>;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus the input when entering creation mode
  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);
  
  const handleCreateTrigger = useCallback(() => {
    setIsCreating(true);
    setNewCategoryName('');
  }, []);
  
  const handleCancel = useCallback(() => {
    setIsCreating(false);
    setNewCategoryName('');
  }, []);
  
  const handleSubmit = useCallback(async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      setIsSubmitting(true);
      const newCategoryId = await onCreateNew(newCategoryName.trim());
      
      if (newCategoryId) {
        // Wait for a tiny bit to let the parent component update the categories list
        setTimeout(() => {
          onChange(newCategoryId);
          setIsCreating(false);
        }, 100);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [newCategoryName, onChange, onCreateNew]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSubmit, handleCancel]);
  
  if (isCreating) {
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={`new-category-${formEntryId}`}>Category <span className="text-red-500">*</span></Label>
        <div className="flex gap-2 items-center">
          <Input
            id={`new-category-${formEntryId}`}
            ref={inputRef}
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter new category name"
            disabled={isSubmitting}
            className="flex-1"
          />
          <Button 
            type="button" 
            size="sm" 
            onClick={handleSubmit} 
            disabled={!newCategoryName.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving</span>
              </span>
            ) : "Save"}
          </Button>
          <Button 
            type="button" 
            size="sm" 
            variant="outline" 
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
        <input 
          type="hidden" 
          name="document_category_id" 
          value={value || ''} 
        />
      </div>
    );
  }
  
  return (
    <div className="grid gap-2">
      <Label htmlFor={`category-${formEntryId}`}>Category <span className="text-red-500">*</span></Label>
      <Select 
        name="document_category_id" 
        required
        value={value}
        onValueChange={(value) => {
          if (value === '_create_new') {
            handleCreateTrigger();
          } else {
            onChange(value);
          }
        }}
      >
        <SelectTrigger id={`category-${formEntryId}`}>
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_create_new" className="text-primary font-medium">
            ➕ Create New Category
          </SelectItem>
          {categories.map(category => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Add a helper function to handle document parsing failures and log details
const logParsingError = (file: File, error: any) => {
  console.error('DOCUMENT PARSING ERROR', {
    fileName: file.name,
    fileType: file.type,
    fileSize: `${Math.round(file.size / 1024)} KB`,
    error: error instanceof Error ? error.message : error
  });
  
  // Try to determine the cause based on file properties
  if (file.size > 10 * 1024 * 1024) { // 10 MB
    console.warn('File size may be too large for parsing', file.size);
  }
  
  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!['pdf', 'docx', 'jpg', 'jpeg', 'png'].includes(extension || '')) {
    console.warn('Unsupported file type for parsing:', extension);
  }
};

export function UploadForm({ categories, allTags, userId, onUploadSuccess, onCategoryCreated }: UploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localCategories, setLocalCategories] = useState(categories);
  const { 
    documentForms, 
    handleFileChange, 
    removeFile, 
    updateFormData, 
    clearAll 
  } = useUploadFormManager()
  
  // Update local categories when prop changes
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);
  
  // Add state for tracking upload progress
  const [isUploading, setIsUploading] = useState(false);
  const [fileProgress, setFileProgress] = useState<{ 
    [index: number]: {
      progress: number;
      fileName: string;
      error: boolean;
    } 
  }>({});
  const [overallProgress, setOverallProgress] = useState(0);
  
  // Handler to create a new category in the database
  const handleCreateCategory = useCallback(async (name: string): Promise<string | null> => {
    try {
      // Use the new API route instead of direct Supabase access
      const response = await fetch('/api/document-library/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim()
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        const errorMessage = result.error || 'Failed to create category';
        
        // Handle specific error cases
        if (response.status === 409) {
          toast({
            title: "Category already exists",
            description: "A category with this name already exists.",
            variant: "destructive"
          });
        } else {
          console.error('Error creating category:', errorMessage);
          toast({
            title: "Failed to create category",
            description: errorMessage,
            variant: "destructive"
          });
        }
        return null;
      }
      
      // Update local categories state with the new one
      setLocalCategories(prev => [...prev, result.data]);
      
      // Notify parent component to refresh categories
      if (onCategoryCreated) {
        onCategoryCreated();
      }
      
      toast({
        title: "Category created",
        description: `"${name}" category was successfully created.`
      });
      
      return result.data.id;
    } catch (err) {
      console.error('Error creating category:', err);
      toast({
        title: "Error",
        description: "Failed to create new category. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  }, [onCategoryCreated]);
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsUploading(true);
      setFileProgress({});
      setOverallProgress(0);
      
      // Create an array to collect valid document data
      const validDocuments: DocumentUploadInput[] = []
      
      // Collect and validate form data for each document - now looking for div elements instead of form elements
      for (const formControl of document.querySelectorAll<HTMLDivElement>(`div[data-document-form]`)) {
        const formId = formControl.dataset.documentId
        const formEntry = documentForms.find(f => f.id === formId)
        
        if (!formEntry) continue
        
        // Get form data - since we're not using actual form elements anymore, we need to collect values differently
        const title = formControl.querySelector<HTMLInputElement>('input[name="title"]')?.value || '';
        const description = formControl.querySelector<HTMLTextAreaElement>('textarea[name="description"]')?.value || '';
        const document_category_id = formControl.querySelector<HTMLInputElement>('input[name="document_category_id"]')?.value || 
                                    formEntry.data.selectedCategoryId || '';
        
        let document_subcategory_id = formControl.querySelector<HTMLInputElement>('input[name="document_subcategory_id"]')?.value || 
                                    formEntry.data.selectedSubcategoryId || undefined;
        
        // Convert empty string or "_none" value to undefined
        if (!document_subcategory_id || document_subcategory_id === "" || document_subcategory_id === "_none") {
          console.log('🔄 Converting document_subcategory_id to undefined:', document_subcategory_id);
          document_subcategory_id = undefined;
        }
        
        const versionLabel = formControl.querySelector<HTMLInputElement>('input[name="versionLabel"]')?.value || '';
        
        // Get selected tags from the form state
        const tags = formEntry.data.selectedTags
        
        // Get visibility from the form's visibility field
        const visibilityField = formControl.querySelector<HTMLInputElement>('input[name="visibility"]');
        const visibilityFieldJson = visibilityField?.value || '{}';
        const visibility = visibilityFieldJson ? JSON.parse(visibilityFieldJson) : undefined;

        // Create document data object
        const documentData = {
          title,
          description,
          document_category_id,
          document_subcategory_id,
          tags,
          versionLabel,
          visibility,
          file: formEntry.file
        }
        
        console.log('Document data before validation:', documentData)
        
        // Validate with Zod schema
        const result = DocumentUploadSchema.safeParse(documentData)
        
        if (result.success) {
          validDocuments.push(result.data)
        } else {
          // Show validation errors on the form
          console.error(`Validation failed for ${formEntry.file.name}:`, result.error)
          formControl.querySelector('.validation-errors')?.setAttribute('data-visible', 'true')
          // Could display specific validation errors here
          return // Stop submission if validation fails
        }
      }
      
      // If all documents are valid, upload them
      if (validDocuments.length > 0) {
        console.log('Final valid documents before upload:', JSON.stringify(validDocuments, (key, value) =>
          value instanceof File ? value.name : value))
          
        console.log('🔑 UploadForm passing userId to handleUploadDocuments:', userId, 'type:', typeof userId)
        
        // Track progress during upload
        const uploadResults = await handleUploadDocuments(
          validDocuments, 
          userId,
          (fileIndex, progress, fileName) => {
            setFileProgress(prev => ({
              ...prev,
              [fileIndex]: {
                progress: progress < 0 ? 0 : progress,
                fileName,
                error: progress < 0
              }
            }));
            
            // Calculate overall progress
            const progressValues = Object.values({
              ...fileProgress, 
              [fileIndex]: { 
                progress: progress < 0 ? 0 : progress, 
                fileName, 
                error: progress < 0 
              }
            });
            
            const total = progressValues.reduce((sum, item) => sum + item.progress, 0);
            const overall = Math.round(total / (validDocuments.length * 100) * 100);
            setOverallProgress(overall);
            
            // Add additional logging for parse errors
            if (progress === 90) {
              console.log(`Document parsing started for file: ${fileName}`);
            } else if (progress === 100) {
              console.log(`Document parsing completed successfully for file: ${fileName}`);
            } else if (progress < 0) {
              // Find the document this error belongs to
              const document = validDocuments[fileIndex];
              if (document) {
                logParsingError(document.file, "Processing failed");
              }
            }
          }
        );

        const { successful, failed } = uploadResults
        
        // Clear the form after upload
        clearAll()
        
        // Show appropriate toast notification based on results
        if (successful.length > 0 && failed.length === 0) {
          // All uploads succeeded
          toast({ 
            title: "Upload Complete", 
            description: `${successful.length} documents were successfully uploaded.` 
          })
          // Call the success callback if provided
          if (onUploadSuccess) {
            onUploadSuccess();
          }
        } else if (successful.length > 0 && failed.length > 0) {
          // Some uploads succeeded, some failed
          toast({ 
            title: "Partial Upload", 
            description: `${successful.length} documents uploaded, ${failed.length} failed.`,
            variant: "default"
          })
          // Call the success callback if provided since some uploads succeeded
          if (onUploadSuccess) {
            onUploadSuccess();
          }
        } else {
          // All uploads failed
          toast({ 
            title: "Upload Failed", 
            description: "All document uploads failed. Check console for details.", 
            variant: "destructive" 
          })
        }
      }
    } catch (uploadError) {
      console.error('Error uploading documents:', uploadError)
      
      // Show error toast notification
      toast({ 
        title: "Upload Failed", 
        description: "Something went wrong during upload.", 
        variant: "destructive" 
      })
    } finally {
      setIsUploading(false);
    }
  }, [
    documentForms, 
    userId, 
    clearAll, 
    onUploadSuccess,
    fileProgress
  ]);
  
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click()
  }, [fileInputRef])
  
  // Add this section in the form before the submit button
  const renderProgressSection = () => {
    if (!isUploading && Object.keys(fileProgress).length === 0) {
      return null;
    }
    
    // Get the currently uploading file name, if any
    const currentUploads = Object.entries(fileProgress);
    const currentFile = currentUploads.length > 0 
      ? currentUploads[currentUploads.length - 1][1].fileName 
      : '';
    
    return (
      <div className="mt-8 mb-4 border rounded-lg p-4 bg-background/50">
        <h3 className="text-sm font-medium mb-2">Upload Progress</h3>
        
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1 text-sm">
            <span>{currentFile 
              ? `Uploading ${currentFile}${currentUploads.length > 1 ? ` (${currentUploads.length} files)` : ''}`
              : 'Uploading files...'}
            </span>
            <span>{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </div>
    );
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12">
        <Upload className="h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Upload Documents</h2>
        <p className="text-sm text-gray-500 mb-4">Click to browse or drag and drop files</p>
        <input
          type="file"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <Button type="button" onClick={triggerFileInput}>Select Files</Button>
      </div>
      
      {documentForms.length > 0 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-lg font-medium">Document Details</h3>
          
          <div className="grid gap-6">
            {documentForms.map((formEntry) => (
              <Card key={formEntry.id} className="relative">
                <div data-document-form data-document-id={formEntry.id} className="space-y-6">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center">
                        <FileIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                        <span className="text-base truncate max-w-[280px]">{formEntry.file.name}</span>
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => removeFile(formEntry.id)}
                        className="h-8 w-8 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor={`title-${formEntry.id}`}>Title <span className="text-red-500">*</span></Label>
                      <Input id={`title-${formEntry.id}`} name="title" placeholder="Document title" required />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor={`description-${formEntry.id}`}>Description</Label>
                      <Textarea id={`description-${formEntry.id}`} name="description" placeholder="Add a description..." />
                    </div>
                    
                    <div className="grid gap-2">
                      <CategorySelectWithCreate
                        formEntryId={formEntry.id}
                        categories={localCategories}
                        value={formEntry.data.selectedCategoryId}
                        onChange={(value) => {
                          // Reset subcategory when category changes
                          console.log('🔍 Category changed to:', value);
                          updateFormData(formEntry.id, { 
                            selectedCategoryId: value,
                            selectedSubcategoryId: undefined
                          });
                          console.log('🔍 Form data updated with new category:', value);
                        }}
                        onCreateNew={handleCreateCategory}
                      />
                      
                      {/* Subcategory field - only shown if a category is selected */}
                      {formEntry.data.selectedCategoryId && (
                        <SubcategorySelectWithCreate
                          formEntryId={formEntry.id}
                          categoryId={formEntry.data.selectedCategoryId}
                          value={formEntry.data.selectedSubcategoryId}
                          onChange={(value) => {
                            console.log('🔍 Subcategory changed to:', value);
                            updateFormData(formEntry.id, { selectedSubcategoryId: value });
                            console.log('🔍 Form data updated with new subcategory:', value);
                          }}
                        />
                      )}
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>Tags</Label>
                      <TagSelector 
                        availableTags={allTags}
                        selectedTags={formEntry.data.selectedTags}
                        onChange={(tags) => updateFormData(formEntry.id, { selectedTags: tags })}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor={`version-${formEntry.id}`}>Version Label</Label>
                      <Input id={`version-${formEntry.id}`} name="versionLabel" placeholder="v1.0" />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>Visibility</Label>
                      <div className="border rounded-md overflow-hidden">
                        <RoleSelector
                          value={formEntry.data.visibility || {
                            roleTypes: [],
                            teams: [],
                            areas: [],
                            regions: []
                          }}
                          onChange={(value) => {
                            console.log('RoleSelector onChange called with:', value)
                            // Update form data state
                            updateFormData(formEntry.id, { visibility: value })
                            
                            // Also update hidden field for form submission
                            const hiddenField = document.getElementById(`visibility-${formEntry.id}`) as HTMLInputElement
                            if (hiddenField) {
                              hiddenField.value = JSON.stringify(value)
                            }
                          }}
                        />
                        <input 
                          type="hidden" 
                          id={`visibility-${formEntry.id}`} 
                          name="visibility" 
                          value={JSON.stringify(formEntry.data.visibility || {})} 
                        />
                      </div>
                    </div>
                    
                    <div className="validation-errors hidden text-red-500 p-2 rounded-md" data-visible="false">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Please fix the validation errors before submitting.</span>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Progress section */}
          {renderProgressSection()}
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={clearAll}
              disabled={documentForms.length === 0 || isUploading}
            >
              Clear All
            </Button>
            
            <Button
              type="submit"
              disabled={documentForms.length === 0 || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Documents'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

---
### File: `src/features/documentLibrary/upload/UploadModal.tsx`
---

// my-app/src/features/documentLibrary/upload/UploadModal.tsx

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { UploadForm } from './UploadForm'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface UploadModalProps {
  onUploadSuccess: () => void
}

interface Tag {
  id: string; // Or the correct type for id
  name: string;
}

export function UploadModal({ onUploadSuccess }: UploadModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  // Get current user using the API route
  const { data: userId } = useQuery({
    queryKey: ['currentUserId'],
    queryFn: async () => {
      const response = await fetch('/api/users/current')
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch current user')
      }
      
      return result.data.id || ''
    }
  })

  // Fetch categories using the API route
  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ['documentCategories'],
    queryFn: async () => {
      const response = await fetch('/api/document-library/categories')
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch categories')
      }
      
      return result.data || []
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Fetch all available tags using the API route
  const { data: tagData = [] } = useQuery<Tag[]>({
    queryKey: ['documentTags'],
    queryFn: async () => {
      const response = await fetch('/api/document-library/tags')
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch tags')
      }
      
      return result.data || []
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  const allTags = tagData.map((tag: Tag) => tag.name)

  const handleUploadSuccess = () => {
    // Close modal
    setIsOpen(false)
    
    // Trigger callback to refresh documents immediately
    onUploadSuccess()
    
    // Add success toast
    toast({
      title: "Success",
      description: "Document uploaded successfully.",
      variant: "default"
    })
  }
  
  // Pass the success handler to the UploadForm

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        {userId && (
          <UploadForm 
            categories={categories} 
            allTags={allTags} 
            userId={userId}
            onUploadSuccess={handleUploadSuccess}
            onCategoryCreated={() => refetchCategories()}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

---
### File: `src/features/documentLibrary/upload/handleUploadDocuments.ts`
---

// my-app/src/features/documentLibrary/upload/handleUploadDocuments.ts

import { createClient } from '@/lib/supabase'
import { DocumentUploadInput } from './schema'
import { insertDocumentWithRelations } from './insertDocumentWithRelations'
import { triggerDocumentParse } from './triggerDocumentParse'

/**
 * Generates a storage path for a document file
 * @param userId ID of the user uploading the document
 * @param filename Name of the file being uploaded
 * @returns Formatted storage path
 */
function getStoragePath(userId: string, filename: string): string {
  const timestamp = Date.now()
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `user-${userId}/${timestamp}-${sanitizedFilename}`
}

type UploadResult = {
  success: boolean;
  file: string;
  error?: any;
  documentId?: string;
}

type UploadSummary = {
  successful: UploadResult[];
  failed: UploadResult[];
}

// Add a type for the progress callback
type ProgressCallback = (fileIndex: number, progress: number, fileName: string) => void;

/**
 * Uploads multiple documents to Supabase storage and creates metadata records
 * @param documents Array of document upload inputs with metadata and file
 * @param userId The authenticated user ID (auth.uid()) - not the profile ID
 * @param onProgress Optional callback to report upload progress (0-100)
 * @returns Upload summary with successful and failed uploads
 */
export async function handleUploadDocuments(
  documents: DocumentUploadInput[],
  userId: string, // This is auth.uid() - the authentication user ID
  onProgress?: ProgressCallback
): Promise<UploadSummary> {
  const supabase = createClient()
  
  // Check if the documents bucket exists and is accessible
  try {
    // Check for the documents bucket
    try {
      const { data: bucketFiles, error: bucketError } = await supabase.storage
        .from('documents')
        .list()
      
      if (bucketError) {
        console.error('Error accessing documents bucket:', bucketError.message)
        throw new Error(`Storage bucket access error: ${bucketError.message}`)
      }
      
      console.log('Documents bucket is accessible, contains files:', bucketFiles?.length || 0)
    } catch (storageError) {
      console.error('Error checking storage bucket:', storageError)
      throw new Error('Storage bucket error: ' + (storageError as Error).message)
    }
  
    try {
      // Process all document uploads in parallel for better performance
      const results = await Promise.all(
        documents.map(async (document, index) => {
          try {
            const filePath = getStoragePath(userId, document.file.name)
            
            // Initialize progress for this file
            if (onProgress) {
              onProgress(index, 0, document.file.name);
            }
            
            // 1. Upload the file to storage with progress reporting
            // Note: Supabase's upload doesn't directly support progress reporting,
            // so we'll simulate progress updates based on file size
            
            // Report starting upload
            if (onProgress) {
              onProgress(index, 10, document.file.name);
            }
            
            const { error: uploadError } = await supabase
              .storage
              .from('documents')
              .upload(filePath, document.file, {
                cacheControl: '3600',
                upsert: false
              })
              
            if (uploadError) {
              throw new Error(`Error uploading file: ${uploadError.message}`)
            }
            
            // Report file upload complete
            if (onProgress) {
              onProgress(index, 50, document.file.name);
            }
            
            // 2. Get the public URL for the file
            const { data: urlData } = supabase
              .storage
              .from('documents')
              .getPublicUrl(filePath)
              
            const fileUrl = urlData.publicUrl
            
            console.log('File uploaded successfully:', filePath)
            console.log('Public URL:', fileUrl)
            
            // Report metadata processing
            if (onProgress) {
              onProgress(index, 75, document.file.name);
            }
            
            // 3. Insert document metadata and relationships using our specialized function
            const insertResult = await insertDocumentWithRelations({
              document,
              fileUrl,
              filePath,
              userId
            })
            
            if (!insertResult.success) {
              throw new Error(`Failed to insert document metadata: ${insertResult.error}`)
            }
            
            console.log('Document metadata stored in database successfully with ID:', insertResult.documentId)
            
            // Report document parsing
            if (onProgress) {
              onProgress(index, 90, document.file.name);
            }
            
            // 4. Trigger document parsing API to extract and chunk content
            const parseResult = await triggerDocumentParse({
              documentId: insertResult.documentId,
              fileUrl: urlData.publicUrl
            })
            
            if (!parseResult.success) {
              // Enhanced error logging for parse failures
              console.warn(
                'Document parsing was triggered but encountered an issue: ' +
                (parseResult.error || 'Unknown error')
              );
              
              // Log file details for debugging
              console.warn('File details:', {
                name: document.file.name,
                type: document.file.type,
                size: `${Math.round(document.file.size / 1024)} KB`,
                url: urlData.publicUrl
              });
              
              // Check for common issues
              const fileExtension = document.file.name.split('.').pop()?.toLowerCase();
              if (!['pdf', 'docx', 'jpg', 'jpeg', 'png'].includes(fileExtension || '')) {
                console.error(`Unsupported file type for parsing: ${fileExtension}. Only PDF, DOCX, JPG, JPEG, and PNG are supported.`);
              } else if (document.file.size > 10 * 1024 * 1024) { // 10 MB
                console.warn('File may be too large for efficient parsing:', `${Math.round(document.file.size / 1024 / 1024)} MB`);
              }
            }
            
            // Report completion
            if (onProgress) {
              onProgress(index, 100, document.file.name);
            }
            
            // Even if parsing failed, we can still consider the upload itself successful
            // since the file is in storage and metadata is in the database
            // Return success with document ID
            return {
              success: true,
              file: document.file.name,
              documentId: insertResult.documentId
            }
            
          } catch (docError) {
            console.error('Error processing document:', document.title, docError)
            
            // Report error
            if (onProgress) {
              onProgress(index, -1, document.file.name); // -1 indicates error
            }
            
            // Don't throw here - try to continue with other files if possible
            return {
              success: false,
              file: document.file.name,
              error: docError
            }
          }
        })
      )
      
      // Process the results to see what succeeded and what failed
      const successfulUploads = results.filter(r => r.success)
      const failedUploads = results.filter(r => !r.success)
      
      console.log(`Upload summary: ${successfulUploads.length} succeeded, ${failedUploads.length} failed`)
      
      if (failedUploads.length > 0) {
        console.warn('Failed uploads:', failedUploads.map(f => f.file))
        
        // Only throw if ALL uploads failed
        if (successfulUploads.length === 0) {
          throw new Error('All document uploads failed')
        }
      }
      
      // Return the results so the caller can handle successes and failures
      return {
        successful: successfulUploads,
        failed: failedUploads
      }
      
    } catch (error) {
      console.error('Document upload operation failed:', error)
      throw new Error('Failed to upload one or more documents')
    }
  } catch (error) {
    console.error('Storage bucket error:', error)
    throw error
  }
}

---
### File: `src/features/documentLibrary/upload/insertDocumentWithRelations.ts`
---

// my-app/src/features/documentLibrary/upload/insertDocumentWithRelations.ts

import { createClient } from '@/lib/supabase'
import { DocumentUploadInput } from './schema'

type InsertInput = {
  document: DocumentUploadInput
  fileUrl: string // public URL of the file in storage
  filePath: string // storage path of the uploaded file
  userId: string // auth.uid() - the authentication user ID, not the profile ID
}

type InsertResult =
  | { success: true; documentId: string }
  | { success: false; error: string }

/**
 * Inserts document metadata and relationships into the database after upload
 * 
 * This function handles inserting a document record and all its relationships:
 * - Document metadata in the documents table
 * - Document version in document_versions
 * - Document visibility settings in document_visibility
 * - Document tags in document_tags and document_tag_assignments
 * 
 * @param input Object containing document data, file info, and user ID (auth.uid())
 * @returns Object with success status and document ID or error message
 */
export async function insertDocumentWithRelations(input: InsertInput): Promise<InsertResult> {
  const { document, filePath, userId } = input // fileUrl not used locally
  const supabase = createClient()
  
  console.log('📌 insertDocumentWithRelations received userId (auth user id):', userId)
  console.log('📌 userId type:', typeof userId)
  
  // First, check if this auth user ID has a profile in user_profiles table
  // IMPORTANT: userId is auth.uid(), which maps to user_profiles.user_id, NOT user_profiles.id
  try {
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('id, email, first_name, last_name')
      .eq('user_id', userId) // FIXED: Use user_id instead of id to match RLS policy
      .single()
    
    if (userProfileError) {
      console.error('❌ Error checking user profile:', userProfileError.message)
      
      // If user profile not found, try to create a basic one
      if (userProfileError.message.includes('no rows')) {
        console.log('🔄 Attempting to create a basic user profile for auth user ID:', userId)
        
        // Get current user data using the auth API
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('❌ Error fetching user data for profile creation:', userError?.message || 'No user data found')
          throw new Error('Failed to get user data for profile creation')
        }
        
        const userEmail = user.email
        
        if (!userEmail) {
          console.error('❌ User has no email address for profile creation')
          throw new Error('User email not available for profile creation')
        }
        
        // Create a basic user profile with minimal information
        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: userId, // This is the auth user ID
            email: userEmail,
            first_name: 'User', // Placeholder
            last_name: user.user_metadata?.name || userEmail.split('@')[0] || 'User',
            airtable_record_id: 'pending-sync', // Required field
            role_type: 'Setter', // Default role type
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_airtable_sync: new Date().toISOString()
          })
          .select('id, email')
          .single()
        
        if (insertError) {
          console.error('❌ Failed to create user profile:', insertError.message)
          throw new Error(`Failed to create user profile: ${insertError.message}`)
        }
        
        console.log('✅ Created basic user profile:', newProfile)
        // Don't return here, just continue with the process
      }
    }
    
    if (!userProfile) {
      console.warn('⚠️ User profile not found for auth user ID:', userId)
    } else {
      console.log('✅ User profile found:', userProfile)
    }
  } catch (profileCheckError) {
    console.error('❌ Exception checking user profile:', profileCheckError)
    throw new Error(`Profile check error: ${profileCheckError instanceof Error ? profileCheckError.message : 'Unknown error'}`)
  }
  
  // NOTE: This helper was prepared for future use but is not currently used
  // Prefix with _ to indicate intentionally unused
  const _getFileExtension = (filename: string): string => {
    const parts = filename.split('.')
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : ''
  }
  
  // Get the actual user profile ID based on the auth user ID
  const { data: userProfileData, error: userProfileLookupError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', userId)
    .single()
    
  if (userProfileLookupError || !userProfileData) {
    console.error('❌ Fatal error: Could not find user profile for auth user:', userId, userProfileLookupError?.message || 'No profile found')
    throw new Error(`Cannot proceed with document upload: No user profile found for this account`)
  }
  
  // Use the actual profile ID for document insertion
  const profileId = userProfileData.id
  console.log('✅ Found user profile ID:', profileId, 'for auth user ID:', userId)
  
  try {
    // Log the document data we're about to insert
    console.log('📝 Attempting to insert document with:', {
      title: document.title,
      document_category_id: document.document_category_id,
      uploaded_by: profileId  // Log the profile ID we're using
    })
    
    // 1. Insert document record
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert({
        title: document.title,
        description: document.description || null,
        document_category_id: document.document_category_id,
        document_subcategory_id: document.document_subcategory_id || null,
        uploaded_by: profileId, // Use profile ID instead of auth user ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
        // Content field will be filled later with actual document text
      })
      .select('id')
      .single()
    
    if (documentError) {
      console.error('❌ Document insert error details:', documentError)
      throw new Error(`Failed to insert document: ${documentError.message || 'Unknown error'}`)
    }
    
    if (!documentData) {
      throw new Error('Document was inserted but no ID was returned')
    }
    
    const documentId = documentData.id
    
    // 2. Insert document version
    const { data: versionData, error: versionError } = await supabase
      .from('document_versions')
      .insert({
        document_id: documentId,
        file_path: filePath,
        file_type: document.file.type,
        version_label: document.versionLabel || 'Initial version',
        uploaded_at: new Date().toISOString()
      })
      .select('id') // Get the version ID
      .single()
    
    if (versionError) {
      throw new Error(`Failed to insert document version: ${versionError.message || 'Unknown error'}`)
    }
    
    if (!versionData) {
      throw new Error('Document version was inserted but no ID was returned')
    }
    
    // 3. Update the document with the current_version_id
    console.log('✅ Document version created with ID:', versionData.id)
    
    const { data: updateData, error: updateError } = await supabase
      .from('documents')
      .update({
        current_version_id: versionData.id
      })
      .eq('id', documentId)
      .select('id, title, current_version_id')
      .single()
    
    if (updateError) {
      console.error('❌ Error updating document with version ID:', updateError)
      throw new Error(`Failed to update document with version ID: ${updateError.message || 'Unknown error'}`)
    }
    
    console.log('✅ Document updated with version ID:', updateData)
    
    // 3. Insert visibility settings using the new JSONB conditions column
    if (document.visibility && typeof document.visibility === 'object') {
      // Create a single structured conditions object for visibility
      const conditions: Record<string, any> = {}
      
      // Take the first role type (we only support one role type at a time)
      if (document.visibility.roleTypes && Array.isArray(document.visibility.roleTypes) && document.visibility.roleTypes.length) {
        conditions.role_type = document.visibility.roleTypes[0]
      }
      
      // Add arrays for other location-based filters
      if (document.visibility.teams && Array.isArray(document.visibility.teams) && document.visibility.teams.length) {
        conditions.teams = document.visibility.teams
      }
      
      if (document.visibility.areas && Array.isArray(document.visibility.areas) && document.visibility.areas.length) {
        conditions.areas = document.visibility.areas
      }
      
      if (document.visibility.regions && Array.isArray(document.visibility.regions) && document.visibility.regions.length) {
        conditions.regions = document.visibility.regions
      }
      
      // Log the conditions object for debugging
      console.log('📊 Document visibility conditions:', conditions)
      
      // Insert a single visibility record with the conditions JSON
      const { error: visibilityError } = await supabase
        .from('document_visibility')
        .insert({
          document_id: documentId,
          conditions: conditions
        })
      
      if (visibilityError) {
        throw new Error(`Failed to insert document visibility: ${visibilityError.message || 'Unknown error'}`)
      }
    }
    
    // 4. Handle tags if provided
    if (document.tags && Array.isArray(document.tags) && document.tags.length > 0) {
      // First, try to find existing tags to avoid duplicates
      const { data: existingTags, error: tagsQueryError } = await supabase
        .from('document_tags')
        .select('id, name')
        .in('name', document.tags)
      
      if (tagsQueryError) {
        throw new Error(`Failed to query existing tags: ${tagsQueryError.message || 'Unknown error'}`)
      }
      
      // Map existing tags by name for easy lookup
      const existingTagsByName = new Map<string, string>()
      existingTags?.forEach(tag => {
        existingTagsByName.set(tag.name, tag.id)
      })
      
      // Create any tags that don't already exist
      const newTags = document.tags.filter(tagName => !existingTagsByName.has(tagName))
      
      // Insert new tags if needed
      if (newTags.length > 0) {
        const tagsToInsert = newTags.map(name => ({ name }))
        const { data: newTagsData, error: newTagsError } = await supabase
          .from('document_tags')
          .insert(tagsToInsert)
          .select('id, name')
        
        if (newTagsError) {
          throw new Error(`Failed to insert new tags: ${newTagsError.message || 'Unknown error'}`)
        }
        
        // Add newly created tags to our map
        newTagsData?.forEach(tag => {
          existingTagsByName.set(tag.name, tag.id)
        })
      }
      
      // Now create relationships between document and all tags
      const tagAssignments = document.tags.map(tagName => ({
        document_id: documentId,
        tag_id: existingTagsByName.get(tagName)
      }))
      
      const { error: tagAssignmentError } = await supabase
        .from('document_tag_assignments')
        .insert(tagAssignments)
      
      if (tagAssignmentError) {
        throw new Error(`Failed to insert tag assignments: ${tagAssignmentError.message || 'Unknown error'}`)
      }
    }
    
    // If we got here, everything succeeded
    return {
      success: true,
      documentId
    }
    
  } catch (error: unknown) {
    console.error('Error in insertDocumentWithRelations:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

---
### File: `src/features/documentLibrary/upload/schema.ts`
---

import { z } from "zod";

// Schema for document upload validation
export const DocumentUploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  document_category_id: z.string().min(1, "Category is required"),
  document_subcategory_id: z.string().optional(),
  tags: z.array(z.string()).optional(),
  versionLabel: z.string().optional(),
  visibility: z.object({
    roleTypes: z.array(z.string()).optional(),
    teams: z.array(z.string()).optional(),
    areas: z.array(z.string()).optional(),
    regions: z.array(z.string()).optional(),
  }).optional(),
  // Content field removed - will be populated later with actual document text
  file: z.instanceof(File),
});

export type DocumentUploadInput = z.infer<typeof DocumentUploadSchema>;

---
### File: `src/features/documentLibrary/upload/triggerDocumentParse.ts`
---

// my-app/src/features/documentLibrary/upload/triggerDocumentParse.ts

/**
 * Helper to trigger document parsing after upload
 * 
 * This function handles calling the document parsing API endpoint,
 * which extracts text content, chunks it, and prepares it for semantic search.
 * 
 * Design note: This implementation is structured to be easily replaceable
 * with a background job system like Upstash QStash in the future.
 */

// Import removed as it's unused
// import { createClient } from '@/lib/supabase'

interface DocumentParseInput {
  documentId: string;
  fileUrl: string;
}

interface DocumentParseResult {
  success: boolean;
  error?: string;
  details?: any;
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
    
    // Get file extension for logging and debugging
    const fileExtension = fileUrl.split('.').pop()?.toLowerCase();
    console.log(`File appears to be a ${fileExtension} document`);
    
    // Validate file extension first
    if (!fileExtension || !['pdf', 'docx', 'jpg', 'jpeg', 'png'].includes(fileExtension)) {
      console.error(`Unsupported file type for parsing: ${fileExtension || 'unknown'}`);
      return {
        success: false,
        error: `Unsupported file type: ${fileExtension || 'unknown'}`,
        details: { supportedTypes: ['pdf', 'docx', 'jpg', 'jpeg', 'png'] }
      };
    }
    
    // This direct fetch call could be replaced with a background job implementation
    // such as Upstash QStash in the future
    console.log('Making parse request for document:', documentId, 'with URL:', fileUrl);
    
    // Add timeout to fetch to avoid hanging indefinitely
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const parseResponse = await fetch('/api/document-library/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileUrl,
          documentId
        }),
        signal: controller.signal
      });
      
      // Clear the timeout since fetch completed
      clearTimeout(timeoutId);
      
      console.log('Parse response status:', parseResponse.status, parseResponse.statusText);
      
      if (parseResponse.ok) {
        // Try to log the successful response for debugging
        try {
          const responseData = await parseResponse.json();
          console.log('Document parsing response:', responseData);
        } catch (_jsonError) {
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
          error: `Parse API error: ${errorDetail}`,
          details: fullResponse
        };
      }
    } catch (error: unknown) {
      // Clear timeout if fetch threw an error
      clearTimeout(timeoutId);
      
      // Type check for AbortError
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Parse request timed out after 30 seconds');
        return {
          success: false,
          error: 'Parse request timed out after 30 seconds',
          details: { timeout: true }
        };
      }
      
      throw error; // Re-throw to be caught by outer try/catch
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
      error: `Failed to initiate parsing: ${errorMessage}`,
      details: { 
        errorType: parseError instanceof Error ? parseError.name : typeof parseError,
        stack: parseError instanceof Error ? parseError.stack : undefined
      }
    };
  }
}

---
### File: `src/features/documentLibrary/upload/useUploadFormManager.ts`
---

// my-app/src/features/documentLibrary/upload/useUploadFormManager.ts

import { useState, ChangeEvent } from 'react'
import type { RoleAssignments } from '@/features/carousel/types'

type DocumentFormData = {
  selectedTags: string[]
  visibility: RoleAssignments
  selectedCategoryId?: string
  selectedSubcategoryId?: string
}

export type DocumentForm = {
  id: string
  file: File
  data: DocumentFormData
}

export function useUploadFormManager() {
  const [documentForms, setDocumentForms] = useState<DocumentForm[]>([])
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    
    const newFiles = Array.from(e.target.files)
    
    // Create a form entry for each new file
    const newFormEntries = newFiles.map(file => ({
      id: `${file.name}-${Date.now()}`,
      file,
      data: {
        selectedTags: [],
        selectedCategoryId: undefined,
        selectedSubcategoryId: undefined,
        visibility: {
          roleTypes: [],
          teams: [],
          areas: [],
          regions: []
        }
      }
    }))
    
    setDocumentForms(prev => [...prev, ...newFormEntries])
  }

  const removeFile = (id: string) => {
    setDocumentForms(prev => prev.filter(form => form.id !== id))
  }
  
  const updateFormData = (id: string, update: Partial<DocumentFormData>) => {
    setDocumentForms(prev => 
      prev.map(form => 
        form.id === id ? { ...form, data: { ...form.data, ...update } } : form
      )
    )
  }
  
  const clearAll = () => {
    setDocumentForms([])
  }
  
  return {
    documentForms,
    handleFileChange,
    removeFile,
    updateFormData,
    clearAll
  }
}

---
### File: `src/features/documentLibrary/viewer/DocumentViewer.tsx`
---

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
  // We're keeping isAdmin param for future use
  const _ = isAdmin;
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
  
  // If refetchRef is provided, update it to point to our refetch function
  useEffect(() => {
    if (onRefetchNeeded) {
      onRefetchNeeded.refetch = refetch;
      console.log('DocumentViewer: Set refetch function in shared reference');
    }
  }, [onRefetchNeeded, refetch])
  
  
  
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
      <div className="col-span-4 flex flex-col justify-center relative">
        <div className="flex items-center">
          <div className="mr-2 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div>
            <h3 className="font-medium truncate group-hover:underline cursor-pointer">
              {document.title}
            </h3>
            <div className="text-xs text-muted-foreground">
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
        
        {/* Content preview - displaying summary if available, otherwise contentPreview */}
        {(document.summary || document.contentPreview) && (
          <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {document.summary || document.contentPreview}
            {document.summaryStatus === 'processing' && (
              <Badge variant="secondary" className="ml-1 text-[10px] py-0 h-4">Summarizing...</Badge>
            )}
          </div>
        )}
        
        {/* Description tooltip on hover */}
        {document.description && (
          <div className="opacity-0 group-hover:opacity-100 absolute z-10 bg-popover text-popover-foreground border rounded-md p-3 shadow-md 
                        top-full left-0 mt-1 w-64 transition-opacity duration-200 pointer-events-none">
            <p className="text-sm">{document.description}</p>
          </div>
        )}
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
          <Skeleton className="h-3 w-40 mt-1" />
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
      </div>
    </div>
  )

  return (
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
  )
}

---
### File: `src/features/documentLibrary/viewer/index.ts`
---

// my-app/src/features/documentLibrary/viewer/index.ts

// Export all components and hooks for easier imports
export * from './DocumentViewer'
export * from './useDocuments'
export * from './types'

---
### File: `src/features/documentLibrary/viewer/types.ts`
---

// my-app/src/features/documentLibrary/viewer/types.ts
/**
 * Type definitions for Document Library Viewer
 */

// Document category
export interface DocumentCategory {
  id: string;
  name: string;
}

// Document tag
export interface DocumentTag {
  id: string;
  name: string;
}

// User who uploaded the document
export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

// Processed document with all required info
export interface Document {
  id: string;
  title: string;
  description: string | null;
  category: DocumentCategory | null;
  subcategory: DocumentCategory | null;
  summary?: string | null;      // AI-generated document summary
  contentPreview: string | null; // Fallback preview of content
  tags: DocumentTag[];
  uploadedBy: UserProfile | null;
  createdAt: string;
  updatedAt: string;
  chunksCount: number;
  summaryStatus?: 'pending' | 'processing' | 'complete' | 'failed' | null;
}

// Filter parameters for document list
export interface DocumentFilters {
  document_category_id?: string;
  document_subcategory_id?: string;
  tags?: string[];
  uploadedBy?: string;
  searchQuery?: string;
  page?: number;
  limit?: number;
}

// Pagination info
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// API response from document list endpoint
export interface DocumentListResponse {
  success: boolean;
  data: Document[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
}

---
### File: `src/features/documentLibrary/viewer/useDocuments.ts`
---

// my-app/src/features/documentLibrary/viewer/useDocuments.ts

import { useQuery } from '@tanstack/react-query'
import { DocumentFilters, DocumentListResponse, PaginationInfo } from './types'

/**
 * Hook to fetch and filter documents
 * 
 * Uses React Query for data fetching, caching, and background updates.
 * Provides functions for pagination and filtering documents.
 */
export function useDocuments(initialFilters: DocumentFilters = {}) {
  // State is managed through the query key
  const {
    document_category_id,
    tags,
    uploadedBy,
    searchQuery,
    page = 1,
    limit = 20
  } = initialFilters

  // Fetch documents using the list API
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isPending,
    isSuccess
  } = useQuery({
    queryKey: ['documents', { document_category_id, tags, uploadedBy, searchQuery, page, limit }],
    queryFn: async () => {
      const response = await fetch('/api/document-library/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          document_category_id,
          tags,
          uploadedBy,
          searchQuery,
          page,
          limit
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch documents')
      }

      const responseData: DocumentListResponse = await response.json()
      
      if (!responseData.success) {
        throw new Error(responseData.error || 'Unknown error fetching documents')
      }
      
      return responseData
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  })

  // Extract pagination info
  const pagination: PaginationInfo = data ? {
    page: data.page,
    limit: data.limit,
    total: data.total,
    totalPages: data.totalPages
  } : {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  }

  return {
    documents: data?.data || [],
    pagination,
    isLoading,
    isPending,
    isError,
    isSuccess,
    error,
    refetch
  }
}