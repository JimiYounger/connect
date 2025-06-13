'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus,
  Edit,
  Trash2,
  FolderOpen,
  FolderPlus,
  AlertCircle,
  Save,
  Loader2,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ThumbnailUpload } from '@/features/videoLibrary/components/ThumbnailUpload'

interface Category {
  id: string
  name: string
  description?: string
  thumbnail_url?: string
  thumbnail_source?: 'vimeo' | 'upload' | 'url' | 'default'
  thumbnail_color?: string
  video_count: number
  created_at: string
  updated_at: string
  subcategories?: Subcategory[]
}

interface Subcategory {
  id: string
  name: string
  description?: string
  thumbnail_url?: string
  thumbnail_source?: 'vimeo' | 'upload' | 'url' | 'default'
  thumbnail_color?: string
  category_id: string
  video_count: number
  created_at: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [showCreateSubcategory, setShowCreateSubcategory] = useState(false)
  const [showEditCategory, setShowEditCategory] = useState(false)
  const [showEditSubcategory, setShowEditSubcategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null)
  
  // Reassignment modal states
  const [showReassignDialog, setShowReassignDialog] = useState(false)
  const [reassignmentData, setReassignmentData] = useState<{
    type: 'category' | 'subcategory'
    id: string
    name: string
    videoCount: number
  } | null>(null)
  const [reassignForm, setReassignForm] = useState({
    newCategoryId: '',
    newSubcategoryId: ''
  })
  
  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    thumbnail_url: '',
    thumbnail_source: 'default' as 'vimeo' | 'upload' | 'url' | 'default',
    thumbnail_color: '#3b82f6'
  })
  
  const [subcategoryForm, setSubcategoryForm] = useState({
    name: '',
    description: '',
    category_id: '',
    thumbnail_url: '',
    thumbnail_source: 'default' as 'vimeo' | 'upload' | 'url' | 'default',
    thumbnail_color: '#3b82f6'
  })
  
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  
  // Edit form states
  const [editCategoryForm, setEditCategoryForm] = useState({
    name: '',
    description: '',
    thumbnail_url: '',
    thumbnail_source: 'default' as 'vimeo' | 'upload' | 'url' | 'default',
    thumbnail_color: '#3b82f6'
  })
  
  const [editSubcategoryForm, setEditSubcategoryForm] = useState({
    name: '',
    description: '',
    category_id: '',
    thumbnail_url: '',
    thumbnail_source: 'default' as 'vimeo' | 'upload' | 'url' | 'default',
    thumbnail_color: '#6366f1'
  })

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/video-library/categories')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setCategories(data.data || [])
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch categories')
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Reset forms
  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      thumbnail_url: '',
      thumbnail_source: 'default',
      thumbnail_color: '#3b82f6'
    })
  }

  const resetSubcategoryForm = () => {
    setSubcategoryForm({
      name: '',
      description: '',
      category_id: '',
      thumbnail_url: '',
      thumbnail_source: 'default',
      thumbnail_color: '#3b82f6'
    })
  }

  // Create category
  const createCategory = async () => {
    if (!categoryForm.name.trim() || saving) return

    setSaving(true)
    try {
      const response = await fetch('/api/video-library/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryForm.name,
          description: categoryForm.description,
          thumbnail_url: categoryForm.thumbnail_url,
          thumbnail_source: categoryForm.thumbnail_source,
          thumbnail_color: categoryForm.thumbnail_color
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await fetchCategories()
          setShowCreateCategory(false)
          resetCategoryForm()
        } else {
          setError(data.error || 'Failed to create category')
        }
      } else {
        setError('Failed to create category')
      }
    } catch (err) {
      console.error('Error creating category:', err)
      setError('Failed to create category')
    } finally {
      setSaving(false)
    }
  }

  // Create subcategory
  const createSubcategory = async () => {
    if (!subcategoryForm.name.trim() || !subcategoryForm.category_id || saving) return

    setSaving(true)
    try {
      const response = await fetch('/api/video-library/subcategories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: subcategoryForm.name,
          description: subcategoryForm.description,
          category_id: subcategoryForm.category_id,
          thumbnail_url: subcategoryForm.thumbnail_url,
          thumbnail_source: subcategoryForm.thumbnail_source,
          thumbnail_color: subcategoryForm.thumbnail_color
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await fetchCategories()
          setShowCreateSubcategory(false)
          resetSubcategoryForm()
        } else {
          setError(data.error || 'Failed to create subcategory')
        }
      } else {
        setError('Failed to create subcategory')
      }
    } catch (err) {
      console.error('Error creating subcategory:', err)
      setError('Failed to create subcategory')
    } finally {
      setSaving(false)
    }
  }

  // Delete category
  const deleteCategory = async (categoryId: string, categoryName: string) => {
    const category = categories.find(c => c.id === categoryId)
    if (!category) return

    // If category has videos, show reassignment dialog
    if (category.video_count > 0) {
      setReassignmentData({
        type: 'category',
        id: categoryId,
        name: categoryName,
        videoCount: category.video_count
      })
      setReassignForm({ newCategoryId: '', newSubcategoryId: '' })
      setShowReassignDialog(true)
      return
    }

    // No videos, proceed with simple deletion
    if (!confirm(`Are you sure you want to delete "${categoryName}"? This will also delete all its subcategories.`)) {
      return
    }

    setDeleting(categoryId)
    try {
      const response = await fetch('/api/video-library/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await fetchCategories()
        } else {
          setError(data.error || 'Failed to delete category')
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete category')
      }
    } catch (err) {
      console.error('Error deleting category:', err)
      setError('Failed to delete category')
    } finally {
      setDeleting(null)
    }
  }

  // Delete subcategory
  const deleteSubcategory = async (subcategoryId: string, subcategoryName: string) => {
    const subcategory = categories
      .flatMap(c => c.subcategories || [])
      .find(s => s.id === subcategoryId)
    
    if (!subcategory) return

    // If subcategory has videos, show reassignment dialog
    if (subcategory.video_count > 0) {
      setReassignmentData({
        type: 'subcategory',
        id: subcategoryId,
        name: subcategoryName,
        videoCount: subcategory.video_count
      })
      setReassignForm({ newCategoryId: '', newSubcategoryId: '' })
      setShowReassignDialog(true)
      return
    }

    // No videos, proceed with simple deletion
    if (!confirm(`Are you sure you want to delete "${subcategoryName}"?`)) {
      return
    }

    setDeleting(subcategoryId)
    try {
      const response = await fetch('/api/video-library/subcategories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subcategoryId })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await fetchCategories()
        } else {
          setError(data.error || 'Failed to delete subcategory')
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete subcategory')
      }
    } catch (err) {
      console.error('Error deleting subcategory:', err)
      setError('Failed to delete subcategory')
    } finally {
      setDeleting(null)
    }
  }

  // Edit category
  const editCategory = (category: Category) => {
    setEditingCategory(category)
    setEditCategoryForm({
      name: category.name,
      description: category.description || '',
      thumbnail_url: category.thumbnail_url || '',
      thumbnail_source: category.thumbnail_source || 'default',
      thumbnail_color: category.thumbnail_color || '#3b82f6'
    })
    setShowEditCategory(true)
  }

  // Edit subcategory
  const editSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory)
    setEditSubcategoryForm({
      name: subcategory.name,
      description: subcategory.description || '',
      category_id: subcategory.category_id,
      thumbnail_url: subcategory.thumbnail_url || '',
      thumbnail_source: subcategory.thumbnail_source || 'default',
      thumbnail_color: subcategory.thumbnail_color || '#6366f1'
    })
    setShowEditSubcategory(true)
  }

  // Update category
  const updateCategory = async () => {
    if (!editingCategory || !editCategoryForm.name.trim() || saving) return

    setSaving(true)
    try {
      const response = await fetch('/api/video-library/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCategory.id,
          name: editCategoryForm.name,
          description: editCategoryForm.description,
          thumbnail_url: editCategoryForm.thumbnail_url,
          thumbnail_source: editCategoryForm.thumbnail_source,
          thumbnail_color: editCategoryForm.thumbnail_color
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await fetchCategories()
          setShowEditCategory(false)
          setEditingCategory(null)
        } else {
          setError(data.error || 'Failed to update category')
        }
      } else {
        setError('Failed to update category')
      }
    } catch (err) {
      console.error('Error updating category:', err)
      setError('Failed to update category')
    } finally {
      setSaving(false)
    }
  }

  // Update subcategory
  const updateSubcategory = async () => {
    if (!editingSubcategory || !editSubcategoryForm.name.trim() || !editSubcategoryForm.category_id || saving) return

    setSaving(true)
    try {
      const response = await fetch('/api/video-library/subcategories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSubcategory.id,
          name: editSubcategoryForm.name,
          description: editSubcategoryForm.description,
          category_id: editSubcategoryForm.category_id,
          thumbnail_url: editSubcategoryForm.thumbnail_url,
          thumbnail_source: editSubcategoryForm.thumbnail_source,
          thumbnail_color: editSubcategoryForm.thumbnail_color
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await fetchCategories()
          setShowEditSubcategory(false)
          setEditingSubcategory(null)
        } else {
          setError(data.error || 'Failed to update subcategory')
        }
      } else {
        setError('Failed to update subcategory')
      }
    } catch (err) {
      console.error('Error updating subcategory:', err)
      setError('Failed to update subcategory')
    } finally {
      setSaving(false)
    }
  }

  // Handle reassignment and deletion
  const handleReassignAndDelete = async () => {
    if (!reassignmentData || !reassignForm.newCategoryId) {
      setError('Please select a category to reassign videos to')
      return
    }

    setDeleting(reassignmentData.id)
    try {
      const endpoint = reassignmentData.type === 'category' 
        ? '/api/video-library/categories'
        : '/api/video-library/subcategories'
      
      const body = reassignmentData.type === 'category'
        ? {
            categoryId: reassignmentData.id,
            newCategoryId: reassignForm.newCategoryId,
            newSubcategoryId: reassignForm.newSubcategoryId
          }
        : {
            subcategoryId: reassignmentData.id,
            newCategoryId: reassignForm.newCategoryId,
            newSubcategoryId: reassignForm.newSubcategoryId
          }

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await fetchCategories()
          setShowReassignDialog(false)
          setReassignmentData(null)
          setReassignForm({ newCategoryId: '', newSubcategoryId: '' })
        } else {
          setError(data.error || 'Failed to delete and reassign')
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete and reassign')
      }
    } catch (err) {
      console.error('Error during reassignment:', err)
      setError('Failed to delete and reassign')
    } finally {
      setDeleting(null)
    }
  }

  // Get thumbnail display
  const getThumbnailDisplay = (item: Category | Subcategory, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-12 h-12', 
      lg: 'w-16 h-16'
    }
    
    const iconSizes = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8'
    }

    if (item.thumbnail_url && item.thumbnail_source !== 'default') {
      return (
        <Image
          src={item.thumbnail_url}
          alt={item.name}
          width={size === 'lg' ? 64 : size === 'md' ? 48 : 32}
          height={size === 'lg' ? 64 : size === 'md' ? 48 : 32}
          className={`${sizeClasses[size]} object-cover rounded-lg`}
        />
      )
    } else {
      return (
        <div 
          className={`${sizeClasses[size]} rounded-lg flex items-center justify-center`}
          style={{ backgroundColor: item.thumbnail_color || '#3b82f6' }}
        >
          <FolderOpen className={`${iconSizes[size]} text-white`} />
        </div>
      )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/video-library">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Library
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold">Video Categories</h1>
          <p className="text-gray-600">Organize your video library with categories and subcategories</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreateCategory} onOpenChange={setShowCreateCategory}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category-name">Name</Label>
                  <Input
                    id="category-name"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Category name..."
                  />
                </div>
                <div>
                  <Label htmlFor="category-description">Description</Label>
                  <Textarea
                    id="category-description"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Category description..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Thumbnail</Label>
                  <div className="mt-2">
                    {/* Preview */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-sm text-gray-600">Preview:</div>
                      {getThumbnailDisplay({
                        thumbnail_url: categoryForm.thumbnail_url,
                        thumbnail_source: categoryForm.thumbnail_source,
                        thumbnail_color: categoryForm.thumbnail_color,
                        name: categoryForm.name || 'New Category'
                      } as Category, 'lg')}
                    </div>
                    <ThumbnailUpload
                      currentThumbnailUrl={categoryForm.thumbnail_url}
                      thumbnailSource={categoryForm.thumbnail_source}
                      onThumbnailChange={(url, source) => setCategoryForm(prev => ({
                        ...prev,
                        thumbnail_url: url,
                        thumbnail_source: source
                      }))}
                      hideVimeoOption={true}
                    />
                  </div>
                </div>
                {categoryForm.thumbnail_source === 'default' && (
                  <div>
                    <Label htmlFor="category-color">Color</Label>
                    <Input
                      id="category-color"
                      type="color"
                      value={categoryForm.thumbnail_color}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, thumbnail_color: e.target.value }))}
                      className="w-full h-10"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => {
                    setShowCreateCategory(false)
                    resetCategoryForm()
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={createCategory} disabled={!categoryForm.name.trim() || saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Category
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateSubcategory} onOpenChange={setShowCreateSubcategory}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Subcategory
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Subcategory</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="subcategory-category">Parent Category</Label>
                  <Select
                    value={subcategoryForm.category_id}
                    onValueChange={(value) => setSubcategoryForm(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subcategory-name">Name</Label>
                  <Input
                    id="subcategory-name"
                    value={subcategoryForm.name}
                    onChange={(e) => setSubcategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Subcategory name..."
                  />
                </div>
                <div>
                  <Label htmlFor="subcategory-description">Description</Label>
                  <Textarea
                    id="subcategory-description"
                    value={subcategoryForm.description}
                    onChange={(e) => setSubcategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Subcategory description..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Thumbnail</Label>
                  <div className="mt-2">
                    {/* Preview */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-sm text-gray-600">Preview:</div>
                      {getThumbnailDisplay({
                        thumbnail_url: subcategoryForm.thumbnail_url,
                        thumbnail_source: subcategoryForm.thumbnail_source,
                        thumbnail_color: subcategoryForm.thumbnail_color,
                        name: subcategoryForm.name || 'New Subcategory'
                      } as Subcategory, 'lg')}
                    </div>
                    <ThumbnailUpload
                      currentThumbnailUrl={subcategoryForm.thumbnail_url}
                      thumbnailSource={subcategoryForm.thumbnail_source}
                      onThumbnailChange={(url, source) => setSubcategoryForm(prev => ({
                        ...prev,
                        thumbnail_url: url,
                        thumbnail_source: source
                      }))}
                      hideVimeoOption={true}
                    />
                  </div>
                </div>
                {subcategoryForm.thumbnail_source === 'default' && (
                  <div>
                    <Label htmlFor="subcategory-color">Color</Label>
                    <Input
                      id="subcategory-color"
                      type="color"
                      value={subcategoryForm.thumbnail_color}
                      onChange={(e) => setSubcategoryForm(prev => ({ ...prev, thumbnail_color: e.target.value }))}
                      className="w-full h-10"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => {
                    setShowCreateSubcategory(false)
                    resetSubcategoryForm()
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={createSubcategory} 
                    disabled={!subcategoryForm.name.trim() || !subcategoryForm.category_id || saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Subcategory
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Categories</h3>
          <p className="text-gray-600 mb-4">Create your first category to start organizing videos</p>
          <Button onClick={() => setShowCreateCategory(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Category
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {categories.map((category) => (
            <Card key={category.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getThumbnailDisplay(category)}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{category.video_count} videos</Badge>
                    <Button size="sm" variant="ghost" onClick={() => editCategory(category)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => deleteCategory(category.id, category.name)}
                      disabled={deleting === category.id}
                    >
                      {deleting === category.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-600" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {category.subcategories && category.subcategories.length > 0 && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Subcategories</h4>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setSubcategoryForm(prev => ({ ...prev, category_id: category.id }))
                          setShowCreateSubcategory(true)
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {category.subcategories.map((subcategory) => (
                        <div key={subcategory.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {getThumbnailDisplay(subcategory)}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{subcategory.name}</p>
                              <p className="text-xs text-gray-500">{subcategory.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {subcategory.video_count} videos
                            </Badge>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => editSubcategory(subcategory)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0"
                              onClick={() => deleteSubcategory(subcategory.id, subcategory.name)}
                              disabled={deleting === subcategory.id}
                            >
                              {deleting === subcategory.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3 text-red-600" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
              
              {(!category.subcategories || category.subcategories.length === 0) && (
                <CardContent className="pt-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      setSubcategoryForm(prev => ({ ...prev, category_id: category.id }))
                      setShowCreateSubcategory(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subcategory
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Edit Category Dialog */}
      <Dialog open={showEditCategory} onOpenChange={setShowEditCategory}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-category-name">Name</Label>
              <Input
                id="edit-category-name"
                value={editCategoryForm.name}
                onChange={(e) => setEditCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Category name..."
              />
            </div>
            <div>
              <Label htmlFor="edit-category-description">Description</Label>
              <Textarea
                id="edit-category-description"
                value={editCategoryForm.description}
                onChange={(e) => setEditCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Category description..."
                rows={3}
              />
            </div>
            <div>
              <Label>Thumbnail</Label>
              <div className="mt-2">
                {/* Preview */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-sm text-gray-600">Preview:</div>
                  {getThumbnailDisplay({
                    thumbnail_url: editCategoryForm.thumbnail_url,
                    thumbnail_source: editCategoryForm.thumbnail_source,
                    thumbnail_color: editCategoryForm.thumbnail_color,
                    name: editCategoryForm.name || 'Category'
                  } as Category, 'lg')}
                </div>
                <ThumbnailUpload
                  currentThumbnailUrl={editCategoryForm.thumbnail_url}
                  thumbnailSource={editCategoryForm.thumbnail_source}
                  onThumbnailChange={(url, source) => setEditCategoryForm(prev => ({
                    ...prev,
                    thumbnail_url: url,
                    thumbnail_source: source
                  }))}
                  hideVimeoOption={true}
                />
              </div>
            </div>
            {editCategoryForm.thumbnail_source === 'default' && (
              <div>
                <Label htmlFor="edit-category-color">Color</Label>
                <Input
                  id="edit-category-color"
                  type="color"
                  value={editCategoryForm.thumbnail_color}
                  onChange={(e) => setEditCategoryForm(prev => ({ ...prev, thumbnail_color: e.target.value }))}
                  className="w-full h-10"
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditCategory(false)}>
                Cancel
              </Button>
              <Button onClick={updateCategory} disabled={!editCategoryForm.name.trim() || saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Category
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Subcategory Dialog */}
      <Dialog open={showEditSubcategory} onOpenChange={setShowEditSubcategory}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Subcategory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-subcategory-category">Parent Category</Label>
              <Select
                value={editSubcategoryForm.category_id}
                onValueChange={(value) => setEditSubcategoryForm(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-subcategory-name">Name</Label>
              <Input
                id="edit-subcategory-name"
                value={editSubcategoryForm.name}
                onChange={(e) => setEditSubcategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Subcategory name..."
              />
            </div>
            <div>
              <Label htmlFor="edit-subcategory-description">Description</Label>
              <Textarea
                id="edit-subcategory-description"
                value={editSubcategoryForm.description}
                onChange={(e) => setEditSubcategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Subcategory description..."
                rows={3}
              />
            </div>
            <div>
              <Label>Thumbnail</Label>
              <div className="mt-2">
                {/* Preview */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-sm text-gray-600">Preview:</div>
                  {getThumbnailDisplay({
                    thumbnail_url: editSubcategoryForm.thumbnail_url,
                    thumbnail_source: editSubcategoryForm.thumbnail_source,
                    thumbnail_color: editSubcategoryForm.thumbnail_color,
                    name: editSubcategoryForm.name || 'Subcategory'
                  } as Subcategory, 'lg')}
                </div>
                <ThumbnailUpload
                  currentThumbnailUrl={editSubcategoryForm.thumbnail_url}
                  thumbnailSource={editSubcategoryForm.thumbnail_source}
                  onThumbnailChange={(url, source) => setEditSubcategoryForm(prev => ({
                    ...prev,
                    thumbnail_url: url,
                    thumbnail_source: source
                  }))}
                  hideVimeoOption={true}
                />
              </div>
            </div>
            {editSubcategoryForm.thumbnail_source === 'default' && (
              <div>
                <Label htmlFor="edit-subcategory-color">Color</Label>
                <Input
                  id="edit-subcategory-color"
                  type="color"
                  value={editSubcategoryForm.thumbnail_color}
                  onChange={(e) => setEditSubcategoryForm(prev => ({ ...prev, thumbnail_color: e.target.value }))}
                  className="w-full h-10"
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditSubcategory(false)}>
                Cancel
              </Button>
              <Button 
                onClick={updateSubcategory} 
                disabled={!editSubcategoryForm.name.trim() || !editSubcategoryForm.category_id || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Subcategory
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reassignment Dialog */}
      <Dialog open={showReassignDialog} onOpenChange={(open) => {
        if (!open) {
          setShowReassignDialog(false)
          setReassignmentData(null)
          setReassignForm({ newCategoryId: '', newSubcategoryId: '' })
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Reassign Videos
            </DialogTitle>
          </DialogHeader>
          {reassignmentData && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>&quot;{reassignmentData.name}&quot;</strong> contains <strong>{reassignmentData.videoCount}</strong> video{reassignmentData.videoCount === 1 ? '' : 's'}.
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Please choose where to move {reassignmentData.videoCount === 1 ? 'it' : 'them'} before deletion.
                </p>
              </div>

              <div>
                <Label htmlFor="reassign-category">Move videos to category</Label>
                <Select
                  value={reassignForm.newCategoryId}
                  onValueChange={(value) => setReassignForm(prev => ({ 
                    ...prev, 
                    newCategoryId: value,
                    newSubcategoryId: '' // Reset subcategory when category changes
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter(cat => cat.id !== reassignmentData.id) // Don't show the category being deleted
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {reassignForm.newCategoryId && (
                <div>
                  <Label htmlFor="reassign-subcategory">Move to subcategory (optional)</Label>
                  <Select
                    value={reassignForm.newSubcategoryId}
                    onValueChange={(value) => setReassignForm(prev => ({ 
                      ...prev, 
                      newSubcategoryId: value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination subcategory..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No subcategory</SelectItem>
                      {categories
                        .find(cat => cat.id === reassignForm.newCategoryId)
                        ?.subcategories
                        ?.filter(sub => sub.id !== reassignmentData.id) // Don't show the subcategory being deleted
                        ?.map((subcategory) => (
                          <SelectItem key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowReassignDialog(false)
                    setReassignmentData(null)
                    setReassignForm({ newCategoryId: '', newSubcategoryId: '' })
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReassignAndDelete}
                  disabled={!reassignForm.newCategoryId || deleting === reassignmentData.id}
                >
                  {deleting === reassignmentData.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Moving & Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Move Videos & Delete {reassignmentData.type === 'category' ? 'Category' : 'Subcategory'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}