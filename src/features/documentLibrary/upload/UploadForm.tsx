'use client'

import { useRef, ChangeEvent } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Check, Upload, File, AlertTriangle, Plus, Search, Tag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { RoleSelector } from '@/features/carousel/components/RoleSelector'
import { DocumentUploadSchema, DocumentUploadInput } from './schema'
import { useUploadFormManager } from './useUploadFormManager'

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
  
  const filteredTags = availableTags.filter(tag => 
    tag.toLowerCase().includes(searchQuery.toLowerCase()) && 
    !selectedTags.includes(tag)
  )
  
  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag))
    } else {
      onChange([...selectedTags, tag])
    }
  }
  
  const handleCreateTag = () => {
    if (!newTagInput.trim()) return
    
    const newTag = newTagInput.trim()
    setNewTagInput('')
    
    if (!selectedTags.includes(newTag) && !availableTags.includes(newTag)) {
      onChange([...selectedTags, newTag])
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput) {
      e.preventDefault()
      handleCreateTag()
    }
  }
  
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

export type UploadFormProps = {
  categories: { id: string; name: string }[]
  allTags: string[]
  onSubmit: (documents: DocumentUploadInput[]) => void
}

export function UploadForm({ categories, allTags, onSubmit }: UploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { 
    documentForms, 
    handleFileChange, 
    removeFile, 
    updateFormData, 
    clearAll 
  } = useUploadFormManager()
  
  const handleSubmit = async () => {
    try {
      // Create an array to collect valid document data
      const validDocuments: DocumentUploadInput[] = []
      
      // Collect and validate form data for each document
      for (const formControl of document.querySelectorAll<HTMLFormElement>(`form[data-document-form]`)) {
        const formId = formControl.dataset.documentId
        const formEntry = documentForms.find(f => f.id === formId)
        
        if (!formEntry) continue
        
        // Get form data
        const formData = new FormData(formControl)
        const title = formData.get('title') as string
        const description = formData.get('description') as string
        const categoryId = formData.get('categoryId') as string
        const versionLabel = formData.get('versionLabel') as string
        
        // Get selected tags from the form state
        const tags = formEntry.data.selectedTags
        
        // Get visibility from the form's visibility field
        const visibilityFieldJson = formData.get('visibility') as string
        const visibility = visibilityFieldJson ? JSON.parse(visibilityFieldJson) : undefined
        
        // Create document data object
        const documentData = {
          title,
          description,
          categoryId,
          tags,
          versionLabel,
          visibility,
          file: formEntry.file
        }
        
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
      
      // If all documents are valid, submit them
      if (validDocuments.length === documentForms.length) {
        onSubmit(validDocuments)
      }
    } catch (error) {
      console.error('Error submitting documents:', error)
    }
  }
  
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }
  
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
        <Button onClick={triggerFileInput}>Select Files</Button>
      </div>
      
      {documentForms.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Document Details</h3>
          
          <div className="grid gap-6">
            {documentForms.map((formEntry) => (
              <Card key={formEntry.id} className="relative">
                <form data-document-form data-document-id={formEntry.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center">
                        <File className="mr-2 h-5 w-5" />
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
                      <FormLabel htmlFor={`title-${formEntry.id}`}>Title <span className="text-red-500">*</span></FormLabel>
                      <Input id={`title-${formEntry.id}`} name="title" placeholder="Document title" required />
                    </div>
                    
                    <div className="grid gap-2">
                      <FormLabel htmlFor={`description-${formEntry.id}`}>Description</FormLabel>
                      <Textarea id={`description-${formEntry.id}`} name="description" placeholder="Add a description..." />
                    </div>
                    
                    <div className="grid gap-2">
                      <FormLabel htmlFor={`category-${formEntry.id}`}>Category <span className="text-red-500">*</span></FormLabel>
                      <Select name="categoryId" required>
                        <SelectTrigger id={`category-${formEntry.id}`}>
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
                    
                    <div className="grid gap-2">
                      <FormLabel>Tags</FormLabel>
                      <TagSelector 
                        availableTags={allTags}
                        selectedTags={formEntry.data.selectedTags}
                        onChange={(tags) => updateFormData(formEntry.id, { selectedTags: tags })}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <FormLabel htmlFor={`version-${formEntry.id}`}>Version Label</FormLabel>
                      <Input id={`version-${formEntry.id}`} name="versionLabel" placeholder="v1.0" />
                    </div>
                    
                    <div className="grid gap-2">
                      <FormLabel>Visibility</FormLabel>
                      <div className="border rounded-md overflow-hidden">
                        <RoleSelector
                          value={{
                            roleTypes: [],
                            teams: [],
                            areas: [],
                            regions: []
                          }}
                          onChange={(value) => {
                            // Store visibility as a hidden field that will be submitted with the form
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
                          value="{}" 
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
                </form>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-end mt-8 gap-4">
            <Button 
              variant="outline" 
              onClick={clearAll}
              disabled={documentForms.length === 0}
            >
              Clear All
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={documentForms.length === 0}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Submit Documents
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}