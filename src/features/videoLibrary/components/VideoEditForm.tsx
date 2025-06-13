'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Edit, 
  FolderOpen, 
  Tag, 
  Users, 
  Play,
  ExternalLink,
  Plus,
  X,
  Clock,
  Share2
} from 'lucide-react'
import { RoleSelector } from '@/features/carousel/components/RoleSelector'
import { ThumbnailUpload } from './ThumbnailUpload'
import type { RoleAssignments } from '@/features/carousel/types'

interface VideoData {
  id: string
  title: string
  description?: string
  summary?: string
  vimeoId?: string
  vimeoUri?: string
  vimeoDuration?: number
  vimeoThumbnailUrl?: string
  category?: { id: string; name: string }
  subcategory?: { id: string; name: string }
  series?: { id: string; name: string }
  tags?: string[]
  libraryStatus: 'pending' | 'approved' | 'rejected' | 'archived'
  transcriptStatus: string
  embeddingStatus: string
  summaryStatus: string
  createdAt: string
  updatedAt: string
  permissions?: RoleAssignments
  publicSharingEnabled?: boolean
  customThumbnailUrl?: string
  thumbnailSource?: 'vimeo' | 'upload' | 'url'
}

interface Category {
  id: string
  name: string
  description?: string
  subcategories?: Array<{
    id: string
    name: string
    description?: string
  }>
}

interface VideoEditFormProps {
  videoId: string
}

export function VideoEditForm({ videoId }: VideoEditFormProps) {
  const router = useRouter()
  const [video, setVideo] = useState<VideoData | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [existingTags, setExistingTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    subcategoryId: '',
    tags: [] as string[],
    libraryStatus: 'pending' as const,
    permissions: { roleTypes: [], teams: [], areas: [], regions: [] } as RoleAssignments,
    publicSharingEnabled: false,
    customThumbnailUrl: '',
    thumbnailSource: 'vimeo' as 'vimeo' | 'upload' | 'url'
  })

  // Tag input
  const [tagInput, setTagInput] = useState('')

  // Create category/subcategory states
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [showCreateSubcategory, setShowCreateSubcategory] = useState(false)
  const [createCategoryLoading, setCreateCategoryLoading] = useState(false)
  const [createSubcategoryLoading, setCreateSubcategoryLoading] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })
  const [subcategoryForm, setSubcategoryForm] = useState({ name: '', description: '', categoryId: '' })

  // Fetch video data
  const fetchVideo = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/video-library/video/${videoId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        const videoData = data.data
        setVideo(videoData)
        
        // Initialize form data
        setFormData({
          title: videoData.title || '',
          description: videoData.description || '',
          categoryId: videoData.category?.id || '',
          subcategoryId: videoData.subcategory?.id || '',
          tags: videoData.tags || [],
          libraryStatus: videoData.libraryStatus || 'pending',
          permissions: videoData.permissions || { roleTypes: [], teams: [], areas: [], regions: [] },
          publicSharingEnabled: videoData.publicSharingEnabled || false,
          customThumbnailUrl: videoData.customThumbnailUrl || '',
          thumbnailSource: videoData.thumbnailSource || 'vimeo'
        })
        
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch video')
      }
    } catch (err) {
      console.error('Error fetching video:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [videoId])

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/video-library/categories')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCategories(data.data || [])
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }, [])

  // Fetch existing tags
  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch('/api/video-library/tags')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const tagNames = data.data?.map((tag: any) => tag.name) || []
          setExistingTags(tagNames)
        }
      }
    } catch (err) {
      console.error('Error fetching tags:', err)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    Promise.all([fetchVideo(), fetchCategories(), fetchTags()])
  }, [fetchVideo, fetchCategories, fetchTags])

  // Handle form submission
  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/video-library/video/${videoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          categoryId: formData.categoryId || null,
          subcategoryId: formData.subcategoryId || null,
          tags: formData.tags,
          libraryStatus: formData.libraryStatus,
          permissions: formData.permissions,
          publicSharingEnabled: formData.publicSharingEnabled,
          customThumbnailUrl: formData.customThumbnailUrl,
          thumbnailSource: formData.thumbnailSource
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to update video: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/admin/video-library')
        }, 1500)
      } else {
        throw new Error(data.error || 'Failed to update video')
      }
    } catch (err) {
      console.error('Error updating video:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  // Tag management
  const addTag = (tagName: string) => {
    const trimmedTag = tagName.trim()
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }))
    }
    setTagInput('')
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  // Category creation
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
          const newCategory = data.data
          setCategories(prev => [...prev, newCategory])
          setFormData(prev => ({ ...prev, categoryId: newCategory.id, subcategoryId: '' }))
          setShowCreateCategory(false)
          setCategoryForm({ name: '', description: '' })
        }
      }
    } catch (err) {
      console.error('Error creating category:', err)
    } finally {
      setCreateCategoryLoading(false)
    }
  }

  // Subcategory creation
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
          const newSubcategory = data.data
          // Update categories with new subcategory
          setCategories(prev => prev.map(cat => 
            cat.id === subcategoryForm.categoryId 
              ? { ...cat, subcategories: [...(cat.subcategories || []), newSubcategory] }
              : cat
          ))
          setFormData(prev => ({ ...prev, subcategoryId: newSubcategory.id }))
          setShowCreateSubcategory(false)
          setSubcategoryForm({ name: '', description: '', categoryId: '' })
        }
      }
    } catch (err) {
      console.error('Error creating subcategory:', err)
    } finally {
      setCreateSubcategoryLoading(false)
    }
  }

  // Get available subcategories
  const availableSubcategories = categories.find(cat => cat.id === formData.categoryId)?.subcategories || []

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading video details...</p>
        </div>
      </div>
    )
  }

  if (error && !video) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (success) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Video updated successfully! Redirecting to library...
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Video Preview */}
      {video && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Video Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <div className="relative">
                <Image
                  src={video.vimeoThumbnailUrl || ''}
                  alt={video.title}
                  width={256}
                  height={144}
                  className="w-64 h-36 object-cover rounded-lg"
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                  {formatDuration(video.vimeoDuration)}
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {video.libraryStatus.charAt(0).toUpperCase() + video.libraryStatus.slice(1)}
                  </Badge>
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDuration(video.vimeoDuration)}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Created:</strong> {new Date(video.createdAt).toLocaleDateString()}</p>
                  <p><strong>Updated:</strong> {new Date(video.updatedAt).toLocaleDateString()}</p>
                  {video.vimeoId && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => window.open(`https://vimeo.com/${video.vimeoId}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View on Vimeo
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">
            <Edit className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="organization">
            <FolderOpen className="h-4 w-4 mr-2" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="tags">
            <Tag className="h-4 w-4 mr-2" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Users className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter video title..."
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter video description..."
                  rows={4}
                />
              </div>

              {/* Thumbnail Upload */}
              <div>
                <Label className="text-sm font-medium">Thumbnail</Label>
                <div className="mt-2">
                  <ThumbnailUpload
                    videoId={video?.id}
                    currentThumbnailUrl={formData.customThumbnailUrl}
                    thumbnailSource={formData.thumbnailSource}
                    onThumbnailChange={(url, source) => setFormData(prev => ({
                      ...prev,
                      customThumbnailUrl: url,
                      thumbnailSource: source
                    }))}
                    vimeoThumbnailUrl={video?.vimeoThumbnailUrl}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Library Status</Label>
                <Select
                  value={formData.libraryStatus}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, libraryStatus: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
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
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, publicSharingEnabled: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Category & Subcategory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Selection */}
              <div>
                <Label>Category</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.categoryId || "none"}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      categoryId: value === "none" ? "" : value, 
                      subcategoryId: "" 
                    }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateCategory(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Create Category Form */}
              {showCreateCategory && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-sm">
                      Create New Category
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCreateCategory(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="Category name..."
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Textarea
                      placeholder="Category description..."
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={createCategory}
                        disabled={!categoryForm.name.trim() || createCategoryLoading}
                        size="sm"
                      >
                        {createCategoryLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          'Create'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateCategory(false)}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Subcategory Selection */}
              {formData.categoryId && (
                <div>
                  <Label>Subcategory</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.subcategoryId || "none"}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        subcategoryId: value === "none" ? "" : value 
                      }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select subcategory..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Subcategory</SelectItem>
                        {availableSubcategories.map((subcategory) => (
                          <SelectItem key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSubcategoryForm(prev => ({ ...prev, categoryId: formData.categoryId }))
                        setShowCreateSubcategory(true)
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Create Subcategory Form */}
              {showCreateSubcategory && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-sm">
                      Create New Subcategory
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCreateSubcategory(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="Subcategory name..."
                      value={subcategoryForm.name}
                      onChange={(e) => setSubcategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Textarea
                      placeholder="Subcategory description..."
                      value={subcategoryForm.description}
                      onChange={(e) => setSubcategoryForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={createSubcategory}
                        disabled={!subcategoryForm.name.trim() || createSubcategoryLoading}
                        size="sm"
                      >
                        {createSubcategoryLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          'Create'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateSubcategory(false)}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Video Tags</CardTitle>
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
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Access Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <RoleSelector
                value={formData.permissions}
                onChange={(permissions) => setFormData(prev => ({ ...prev, permissions }))}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Save Button */}
      <div className="flex gap-4 pt-6">
        <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
        <Button variant="outline" onClick={() => router.push('/admin/video-library')}>
          Cancel
        </Button>
      </div>
    </div>
  )
}