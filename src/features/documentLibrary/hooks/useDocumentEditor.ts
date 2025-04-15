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
  category_id: string
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
  const [categoryId, setCategoryId] = useState('')
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
          category_id,
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
          category_id: documentData.category_id,
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
      setCategoryId(document.category_id || '')
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
      category_id: categoryId,
      tags: selectedTags.map(id => ({ id, name: allTags.find(tag => tag.id === id)?.name || '' })),
      visibility
    })
  }, [title, description, categoryId, selectedTags, visibility, allTags, updateDocumentMutation])
  
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
    categoryId,
    setCategoryId,
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