'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  FolderOpen, 
  Plus, 
  Edit, 
  Tag, 
  Users,
  X,
  Loader2,
  Share2
} from 'lucide-react'
import { RoleSelector } from '@/features/carousel/components/RoleSelector'
import { ThumbnailUpload } from '../ThumbnailUpload'
import type { ImportFormData, CategoryData, SubcategoryData } from '../VideoImportWizard'

interface CategorizationStepProps {
  formData: ImportFormData
  updateFormData: (updates: Partial<ImportFormData>) => void
}

interface ExistingCategory {
  id: string
  name: string
  description?: string
}

interface ExistingSubcategory {
  id: string
  name: string
  description?: string
  category_id: string
}

export function CategorizationStep({ formData, updateFormData }: CategorizationStepProps) {
  const [existingCategories, setExistingCategories] = useState<ExistingCategory[]>([])
  const [existingSubcategories, setExistingSubcategories] = useState<ExistingSubcategory[]>([])
  const [existingTags, setExistingTags] = useState<string[]>([])
  const [_loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Category creation/editing state
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [_editingCategory, setEditingCategory] = useState<CategoryData | null>(null)
  const [createCategoryLoading, setCreateCategoryLoading] = useState(false)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  })

  // Subcategory creation/editing state
  const [showCreateSubcategory, setShowCreateSubcategory] = useState(false)
  const [_editingSubcategory, setEditingSubcategory] = useState<SubcategoryData | null>(null)
  const [createSubcategoryLoading, setCreateSubcategoryLoading] = useState(false)
  const [subcategoryForm, setSubcategoryForm] = useState({
    name: '',
    description: '',
    categoryId: ''
  })

  // Tag input state
  const [tagInput, setTagInput] = useState('')

  // Fetch existing data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch categories
      const categoriesResponse = await fetch('/api/video-library/categories')
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        if (categoriesData.success) {
          setExistingCategories(categoriesData.data || [])
        }
      }

      // Fetch subcategories
      const subcategoriesResponse = await fetch('/api/video-library/subcategories')
      if (subcategoriesResponse.ok) {
        const subcategoriesData = await subcategoriesResponse.json()
        if (subcategoriesData.success) {
          setExistingSubcategories(subcategoriesData.data || [])
        }
      }

      // Fetch tags
      const tagsResponse = await fetch('/api/video-library/tags')
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json()
        if (tagsData.success) {
          // Extract tag names from the tag objects
          const tagNames = tagsData.data?.map((tag: any) => tag.name) || []
          setExistingTags(tagNames)
        }
      }

    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load categories and tags')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Category management
  const selectCategory = (category: ExistingCategory) => {
    updateFormData({
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        permissions: { roleTypes: [], teams: [], areas: [], regions: [] }
      },
      subcategory: null // Reset subcategory when category changes
    })
  }

  const startCreateCategory = () => {
    setCategoryForm({
      name: '',
      description: ''
    })
    setEditingCategory(null)
    setShowCreateCategory(true)
  }

  const createCategory = async () => {
    if (!categoryForm.name.trim() || createCategoryLoading) return

    setCreateCategoryLoading(true)
    try {
      const response = await fetch('/api/video-library/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryForm.name,
          description: categoryForm.description
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Fix: Access data.data instead of data.category
          const newCategory = {
            id: data.data.id,
            name: data.data.name,
            description: data.data.description
          }
          setExistingCategories(prev => [...prev, newCategory])
          
          // Auto-select the new category
          updateFormData({
            category: {
              id: newCategory.id,
              name: newCategory.name,
              description: newCategory.description,
              permissions: { roleTypes: [], teams: [], areas: [], regions: [] }
            }
          })
          
          setShowCreateCategory(false)
          setCategoryForm({ name: '', description: '' })
        } else {
          setError(data.error || 'Failed to create category')
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create category')
      }
    } catch (err) {
      console.error('Error creating category:', err)
      setError('Failed to create category')
    } finally {
      setCreateCategoryLoading(false)
    }
  }

  // Subcategory management
  const selectSubcategory = (subcategory: ExistingSubcategory) => {
    updateFormData({
      subcategory: {
        id: subcategory.id,
        name: subcategory.name,
        description: subcategory.description,
        categoryId: subcategory.category_id,
        permissions: { roleTypes: [], teams: [], areas: [], regions: [] }
      }
    })
  }

  const startCreateSubcategory = () => {
    if (!formData.category) {
      setError('Please select a category first')
      return
    }

    setSubcategoryForm({
      name: '',
      description: '',
      categoryId: formData.category.id || ''
    })
    setEditingSubcategory(null)
    setShowCreateSubcategory(true)
  }

  const createSubcategory = async () => {
    if (!subcategoryForm.name.trim() || !subcategoryForm.categoryId || createSubcategoryLoading) return

    setCreateSubcategoryLoading(true)
    try {
      const response = await fetch('/api/video-library/subcategories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: subcategoryForm.name,
          description: subcategoryForm.description,
          category_id: subcategoryForm.categoryId
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Fix: Access data.data instead of data.subcategory
          const newSubcategory = {
            id: data.data.id,
            name: data.data.name,
            description: data.data.description,
            category_id: data.data.category_id
          }
          setExistingSubcategories(prev => [...prev, newSubcategory])
          
          // Auto-select the new subcategory
          updateFormData({
            subcategory: {
              id: newSubcategory.id,
              name: newSubcategory.name,
              description: newSubcategory.description,
              categoryId: newSubcategory.category_id,
              permissions: { roleTypes: [], teams: [], areas: [], regions: [] }
            }
          })
          
          setShowCreateSubcategory(false)
          setSubcategoryForm({ name: '', description: '', categoryId: '' })
        } else {
          setError(data.error || 'Failed to create subcategory')
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create subcategory')
      }
    } catch (err) {
      console.error('Error creating subcategory:', err)
      setError('Failed to create subcategory')
    } finally {
      setCreateSubcategoryLoading(false)
    }
  }

  // Tag management
  const addTag = (tagName: string) => {
    const trimmedTag = tagName.trim()
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      updateFormData({
        tags: [...formData.tags, trimmedTag]
      })
    }
    setTagInput('')
  }

  const removeTag = (tagToRemove: string) => {
    updateFormData({
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  // Get subcategories for selected category
  const availableSubcategories = existingSubcategories.filter(
    sub => formData.category && sub.category_id === formData.category.id
  )

  return (
    <div className="space-y-6">
      {/* Video Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Video Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="video-title">Title</Label>
            <Input
              id="video-title"
              value={formData.videoDetails.title}
              onChange={(e) => updateFormData({
                videoDetails: {
                  ...formData.videoDetails,
                  title: e.target.value
                }
              })}
              placeholder="Enter video title..."
            />
          </div>
          
          {/* Only show description field when we have a description */}
          {formData.videoDetails.description && formData.videoDetails.description.trim() !== '' && (
            <div>
              <Label htmlFor="video-description">Description</Label>
              <Textarea
                id="video-description"
                value={formData.videoDetails.description}
                onChange={(e) => updateFormData({
                  videoDetails: {
                    ...formData.videoDetails,
                    description: e.target.value
                  }
                })}
                placeholder="Enter video description..."
                rows={5}
                className="min-h-[120px]"
              />
            </div>
          )}

          {/* Thumbnail Upload */}
          <div>
            <Label className="text-sm font-medium">Thumbnail</Label>
            <div className="mt-2">
              <ThumbnailUpload
                currentThumbnailUrl={formData.videoDetails.customThumbnailUrl}
                thumbnailSource={formData.videoDetails.thumbnailSource}
                onThumbnailChange={(url, source) => updateFormData({
                  videoDetails: {
                    ...formData.videoDetails,
                    customThumbnailUrl: url,
                    thumbnailSource: source
                  }
                })}
                vimeoThumbnailUrl={formData.selectedVideo?.thumbnail_url}
              />
            </div>
          </div>

          {/* Public Sharing Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center gap-3">
              <Share2 className="h-5 w-5 text-gray-600" />
              <div>
                <div className="font-medium">Public Sharing</div>
                <div className="text-sm text-gray-600">
                  Allow this video to be shared publicly with recruits or customers
                </div>
              </div>
            </div>
            <Switch
              checked={formData.publicSharingEnabled}
              onCheckedChange={(checked) => updateFormData({ publicSharingEnabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Category
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.category ? (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
              <div>
                <div className="font-medium text-green-800">{formData.category.name}</div>
                {formData.category.description && (
                  <div className="text-sm text-green-600">{formData.category.description}</div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFormData({ category: null, subcategory: null })}
              >
                Change
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                {existingCategories.map(category => (
                  <Button
                    key={category.id}
                    variant="outline"
                    className="h-auto p-3 text-left justify-start"
                    onClick={() => selectCategory(category)}
                  >
                    <div>
                      <div className="font-medium">{category.name}</div>
                      {category.description && (
                        <div className="text-sm text-gray-500 mt-1">{category.description}</div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                onClick={startCreateCategory}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Category
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Category Modal */}
      {showCreateCategory && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Create New Category</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateCategory(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter category name..."
              />
            </div>
            
            <div>
              <Label htmlFor="category-description">Description (Optional)</Label>
              <Textarea
                id="category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter category description..."
                rows={2}
              />
            </div>


            <div className="flex gap-2">
              <Button
                onClick={createCategory}
                disabled={!categoryForm.name.trim() || createCategoryLoading}
              >
                {createCategoryLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Category'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateCategory(false)}
                disabled={createCategoryLoading}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subcategory Selection */}
      {formData.category && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Subcategory (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.subcategory ? (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
                <div>
                  <div className="font-medium text-green-800">{formData.subcategory.name}</div>
                  {formData.subcategory.description && (
                    <div className="text-sm text-green-600">{formData.subcategory.description}</div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFormData({ subcategory: null })}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {availableSubcategories.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                    {availableSubcategories.map(subcategory => (
                      <Button
                        key={subcategory.id}
                        variant="outline"
                        className="h-auto p-3 text-left justify-start"
                        onClick={() => selectSubcategory(subcategory)}
                      >
                        <div>
                          <div className="font-medium">{subcategory.name}</div>
                          {subcategory.description && (
                            <div className="text-sm text-gray-500 mt-1">{subcategory.description}</div>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
                
                <Button
                  variant="outline"
                  onClick={startCreateSubcategory}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Subcategory
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Subcategory Modal */}
      {showCreateSubcategory && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Create New Subcategory</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateSubcategory(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="subcategory-name">Subcategory Name</Label>
              <Input
                id="subcategory-name"
                value={subcategoryForm.name}
                onChange={(e) => setSubcategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter subcategory name..."
              />
            </div>
            
            <div>
              <Label htmlFor="subcategory-description">Description (Optional)</Label>
              <Textarea
                id="subcategory-description"
                value={subcategoryForm.description}
                onChange={(e) => setSubcategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter subcategory description..."
                rows={2}
              />
            </div>


            <div className="flex gap-2">
              <Button
                onClick={createSubcategory}
                disabled={!subcategoryForm.name.trim() || createSubcategoryLoading}
              >
                {createSubcategoryLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Subcategory'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateSubcategory(false)}
                disabled={createSubcategoryLoading}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="tag-input">Add Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tag-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Enter tag and press Enter..."
              />
              <Button
                onClick={() => addTag(tagInput)}
                disabled={!tagInput.trim()}
                variant="outline"
              >
                Add
              </Button>
            </div>
          </div>

          {formData.tags.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Tags</Label>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 w-4 h-4"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {existingTags.length > 0 && (
            <div className="space-y-2">
              <Label>Existing Tags (Click to Add)</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {existingTags
                  .filter(tag => !formData.tags.includes(tag))
                  .map(tag => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-blue-50"
                      onClick={() => addTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Video Access Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RoleSelector
            value={formData.permissions}
            onChange={(permissions) => updateFormData({ permissions })}
          />
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800 font-medium">Error: {error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}