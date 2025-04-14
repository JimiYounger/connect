'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, Pencil, UploadCloud, X, FileText, Clock, Trash2, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RoleSelector } from '@/features/carousel/components/RoleSelector'
import { triggerDocumentParse } from '@/features/documentLibrary/upload/triggerDocumentParse'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

// Types
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

// Main page component
export default function DocumentEditPage() {
  const params = useParams<{ id: string }>()
  const documentId = params.id
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // State for file upload
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [versionLabel, setVersionLabel] = useState('')
  const [uploading, setUploading] = useState(false)
  
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
  const { data: document, isLoading: isLoadingDocument, isError: isErrorDocument, refetch } = useQuery({
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
      const supabase = createClient()
      
      // First update the document record
      const { error: documentError } = await supabase
        .from('documents')
        .update({
          title: documentData.title,
          description: documentData.description,
          category_id: documentData.category_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
      
      if (documentError) throw new Error(documentError.message)
      
      // Then handle tags if provided
      if (documentData.tags) {
        // First remove all existing tag assignments
        const { error: deleteTagsError } = await supabase
          .from('document_tag_assignments')
          .delete()
          .eq('document_id', documentId)
        
        if (deleteTagsError) throw new Error(deleteTagsError.message)
        
        // Then add the new tag assignments
        if (documentData.tags.length > 0) {
          const tagAssignments = documentData.tags.map(tag => ({
            document_id: documentId,
            tag_id: tag.id
          }))
          
          const { error: insertTagsError } = await supabase
            .from('document_tag_assignments')
            .insert(tagAssignments)
          
          if (insertTagsError) throw new Error(insertTagsError.message)
        }
      }
      
      // Finally handle visibility settings if provided
      if (documentData.visibility) {
        const visibility = documentData.visibility
        
        // Format visibility for database
        const conditions: Record<string, any> = {}
        
        if (visibility.roleTypes?.length) {
          conditions.role_type = visibility.roleTypes[0]
        }
        
        if (visibility.teams?.length) {
          conditions.teams = visibility.teams
        }
        
        if (visibility.areas?.length) {
          conditions.areas = visibility.areas
        }
        
        if (visibility.regions?.length) {
          conditions.regions = visibility.regions
        }
        
        // Delete existing visibility settings
        const { error: deleteVisibilityError } = await supabase
          .from('document_visibility')
          .delete()
          .eq('document_id', documentId)
        
        if (deleteVisibilityError) throw new Error(deleteVisibilityError.message)
        
        // Insert new visibility settings
        const { error: insertVisibilityError } = await supabase
          .from('document_visibility')
          .insert({
            document_id: documentId,
            conditions
          })
        
        if (insertVisibilityError) throw new Error(insertVisibilityError.message)
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
      const supabase = createClient()
      
      const { error } = await supabase
        .from('documents')
        .update({
          current_version_id: versionId,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
      
      if (error) throw new Error(error.message)
      
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
      const supabase = createClient()
      
      // Check if this is the active version
      if (document?.current_version_id === versionId) {
        throw new Error('Cannot delete the active version.')
      }
      
      // Get file path to remove from storage
      const version = document?.versions?.find(v => v.id === versionId)
      if (!version) throw new Error('Version not found.')
      
      // Delete version record
      const { error: versionError } = await supabase
        .from('document_versions')
        .delete()
        .eq('id', versionId)
      
      if (versionError) throw new Error(versionError.message)
      
      // Delete chunks associated with this version
      const { error: chunksError } = await supabase
        .from('document_chunks')
        .delete()
        .eq('version_id', versionId)
      
      if (chunksError) throw new Error(chunksError.message)
      
      // Delete file from storage
      // Files may be uploaded to a user-specific directory
      // In a production system, we would likely use a background job for this cleanup
      
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
      const supabase = createClient()
      
      // Delete dependent records first
      
      // 1. Delete all versions and related chunks
      for (const version of document?.versions || []) {
        // Delete chunks
        const { error: chunksError } = await supabase
          .from('document_chunks')
          .delete()
          .eq('version_id', version.id)
        
        if (chunksError) throw new Error(chunksError.message)
        
        // Delete version
        const { error: versionError } = await supabase
          .from('document_versions')
          .delete()
          .eq('id', version.id)
        
        if (versionError) throw new Error(versionError.message)
      }
      
      // 2. Delete tag assignments
      const { error: tagAssignmentsError } = await supabase
        .from('document_tag_assignments')
        .delete()
        .eq('document_id', documentId)
      
      if (tagAssignmentsError) throw new Error(tagAssignmentsError.message)
      
      // 3. Delete visibility settings
      const { error: visibilityError } = await supabase
        .from('document_visibility')
        .delete()
        .eq('document_id', documentId)
      
      if (visibilityError) throw new Error(visibilityError.message)
      
      // 4. Finally delete the document itself
      const { error: documentError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
      
      if (documentError) throw new Error(documentError.message)
      
      return true
    },
    onSuccess: () => {
      toast({
        title: 'Document deleted',
        description: 'The document has been permanently deleted.',
        variant: 'default'
      })
      
      router.push('/admin/document-library')
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'An error occurred while deleting the document.',
        variant: 'destructive'
      })
    }
  })
  
  // Handle file upload for new version
  const handleFileUpload = async () => {
    if (!uploadFile) return
    
    setUploading(true)
    
    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Authentication required')
      
      // Generate a file path similar to our upload function
      const timestamp = Date.now()
      const sanitizedFilename = uploadFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `user-${user.id}/${timestamp}-${sanitizedFilename}`
      
      // Upload file to storage
      const { error: uploadError } = await supabase
        .storage
        .from('documents')
        .upload(filePath, uploadFile, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (uploadError) throw new Error(`Error uploading file: ${uploadError.message}`)
      
      // Get the public URL for the file
      const { data: urlData } = supabase
        .storage
        .from('documents')
        .getPublicUrl(filePath)
      
      // Create a new version record
      const { data: versionData, error: versionError } = await supabase
        .from('document_versions')
        .insert({
          document_id: documentId,
          file_path: filePath,
          file_type: uploadFile.type,
          version_label: versionLabel || `Version ${(document?.versions?.length || 0) + 1}`,
          uploaded_at: new Date().toISOString()
        })
        .select('id')
        .single()
      
      if (versionError) throw new Error(`Error creating version: ${versionError.message}`)
      
      // Update the document with the new current version ID
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          current_version_id: versionData.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
      
      if (updateError) throw new Error(`Error updating document: ${updateError.message}`)
      
      // Trigger document parsing
      await triggerDocumentParse({
        documentId,
        fileUrl: urlData.publicUrl
      })
      
      // Reset form
      setUploadFile(null)
      setVersionLabel('')
      
      // Show success message
      toast({
        title: 'Version uploaded',
        description: 'The new document version has been uploaded and is now active.',
        variant: 'default'
      })
      
      // Refresh document data
      refetch()
    } catch (error) {
      console.error('Upload error:', error)
      
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An error occurred during upload.',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }
  
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
  const handleSaveMetadata = () => {
    updateDocumentMutation.mutate({
      title,
      description,
      category_id: categoryId,
      tags: selectedTags.map(id => ({ id, name: allTags.find(tag => tag.id === id)?.name || '' })),
      visibility
    })
  }
  
  // Handle tag selection
  const handleTagChange = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId))
    } else {
      setSelectedTags([...selectedTags, tagId])
    }
  }
  
  // Render loading state
  if (isLoadingDocument) {
    return (
      <div className="container mx-auto p-4 space-y-8">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-10 w-20" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-60" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-60" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }
  
  // Render error state
  if (isErrorDocument) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load document. Please try again or contact support.
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-center mt-8">
          <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
          <Button variant="outline" className="ml-2" asChild>
            <Link href="/admin/document-library">Back to Library</Link>
          </Button>
        </div>
      </div>
    )
  }
  
  // Main content render
  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button variant="outline" size="icon" className="mr-4" asChild>
            <Link href="/admin/document-library">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit Document</h1>
        </div>
        
        <Button 
          variant="destructive" 
          onClick={() => {
            if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
              deleteDocumentMutation.mutate()
            }
          }}
          disabled={deleteDocumentMutation.isPending}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Document
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Document Summary</CardTitle>
              <CardDescription>Created on {document?.created_at ? format(new Date(document.created_at), 'MMM d, yyyy') : 'Unknown'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h2 className="text-xl font-semibold">{document?.title}</h2>
              
              <div className="text-sm text-muted-foreground">
                {document?.description || 'No description provided.'}
              </div>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {document?.tags?.map(tag => (
                  <Badge key={tag.id} variant="outline">{tag.name}</Badge>
                ))}
                {(!document?.tags || document.tags.length === 0) && (
                  <span className="text-sm text-muted-foreground">No tags</span>
                )}
              </div>
              
              <div className="pt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/api/document-library/view/${documentId}`} target="_blank">
                    <FileText className="h-4 w-4 mr-2" />
                    View Document
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="metadata">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="metadata">Document Metadata</TabsTrigger>
              <TabsTrigger value="versions">Version Management</TabsTrigger>
            </TabsList>
            
            {/* Metadata Section */}
            <TabsContent value="metadata">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Document Metadata</CardTitle>
                    <CardDescription>Edit basic information about the document</CardDescription>
                  </div>
                  
                  {isEditingMetadata ? (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsEditingMetadata(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      
                      <Button onClick={handleSaveMetadata} disabled={updateDocumentMutation.isPending}>
                        <Check className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => setIsEditingMetadata(true)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Metadata
                    </Button>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Document Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={!isEditingMetadata}
                    />
                  </div>
                  
                  {/* Document Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={!isEditingMetadata}
                      rows={4}
                    />
                  </div>
                  
                  {/* Document Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={categoryId} 
                      onValueChange={setCategoryId}
                      disabled={!isEditingMetadata}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Document Tags */}
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                      {allTags.map(tag => (
                        <Badge 
                          key={tag.id} 
                          variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => isEditingMetadata && handleTagChange(tag.id)}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                      
                      {allTags.length === 0 && (
                        <div className="text-sm text-muted-foreground p-2">No tags available</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Document Visibility */}
                  <div className="space-y-2">
                    <Label>Visibility</Label>
                    <div className="border rounded-md overflow-hidden">
                      <RoleSelector
                        value={visibility}
                        onChange={isEditingMetadata ? setVisibility : () => {}}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Versions Section */}
            <TabsContent value="versions">
              <Card>
                <CardHeader>
                  <CardTitle>Version Management</CardTitle>
                  <CardDescription>Upload new versions or manage existing ones</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-8">
                  {/* Upload new version */}
                  <div className="border rounded-md p-4">
                    <h3 className="text-lg font-medium mb-4">Upload New Version</h3>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="version-label">Version Label</Label>
                          <Input
                            id="version-label"
                            placeholder="e.g., v2.0 or 'Final Draft'"
                            value={versionLabel}
                            onChange={(e) => setVersionLabel(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="version-file">File</Label>
                          <Input
                            id="version-file"
                            type="file"
                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          onClick={handleFileUpload} 
                          disabled={!uploadFile || uploading}
                        >
                          <UploadCloud className="h-4 w-4 mr-2" />
                          {uploading ? 'Uploading...' : 'Upload New Version'}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Version list */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Version History</h3>
                    
                    {document?.versions && document.versions.length > 0 ? (
                      <div className="space-y-4">
                        {document.versions.map((version) => (
                          <div key={version.id} className="border rounded-md p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="mr-3">
                                  <FileText className="h-8 w-8 text-blue-500" />
                                </div>
                                
                                <div>
                                  <h4 className="font-medium">{version.version_label || 'Untitled Version'}</h4>
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {version.uploaded_at ? 
                                      format(new Date(version.uploaded_at), 'MMM d, yyyy h:mm a') : 
                                      'Unknown date'}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {document.current_version_id === version.id ? (
                                  <Badge variant="default">Active Version</Badge>
                                ) : (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setActiveVersionMutation.mutate(version.id)}
                                      disabled={setActiveVersionMutation.isPending}
                                    >
                                      Set as Active
                                    </Button>
                                    
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this version?')) {
                                          deleteVersionMutation.mutate(version.id)
                                        }
                                      }}
                                      disabled={deleteVersionMutation.isPending}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  asChild
                                >
                                  <Link href={`/api/document-library/view/${documentId}?versionId=${version.id}`} target="_blank">
                                    View
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-6 text-muted-foreground">
                        No versions found. Upload a new version to get started.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}