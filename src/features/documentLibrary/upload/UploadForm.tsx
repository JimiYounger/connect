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

// FileProgressBar component to display upload progress for a single file
function FileProgressBar({ 
  progress, 
  fileName, 
  error 
}: { 
  progress: number; 
  fileName: string; 
  error?: boolean 
}) {
  return (
    <div className="w-full mt-1 mb-3">
      <div className="flex justify-between items-center mb-1 text-xs">
        <span className="truncate max-w-[200px]">{fileName}</span>
        <span>{error ? 'Failed' : `${progress}%`}</span>
      </div>
      <Progress 
        value={error ? 100 : progress} 
        className={error ? 'bg-destructive/10' : ''} 
      />
      {error && (
        <p className="text-xs mt-1 text-destructive">Upload failed</p>
      )}
    </div>
  )
}

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
    
    return (
      <div className="mt-8 mb-4 border rounded-lg p-4 bg-background/50">
        <h3 className="text-sm font-medium mb-2">Upload Progress</h3>
        
        {/* Overall progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1 text-sm">
            <span>Overall Progress</span>
            <span>{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
        
        {/* Individual file progress */}
        {Object.entries(fileProgress).map(([index, { progress, fileName, error }]) => (
          <FileProgressBar 
            key={`file-${index}`}
            progress={progress}
            fileName={fileName}
            error={error}
          />
        ))}
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