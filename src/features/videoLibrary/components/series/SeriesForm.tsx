'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

interface Series {
  id: string
  name: string
  description?: string
  series_type: 'playlist' | 'course' | 'collection'
  has_seasons: boolean
  thumbnail_url?: string
  thumbnail_source: 'vimeo' | 'upload' | 'url' | 'default'
  thumbnail_color?: string
  is_public: boolean
  content_count: number
  total_duration: number
  tags: string[]
  order_index: number
  created_at: string
  updated_at: string
}

interface SeriesFormProps {
  series?: Series | null
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  name: string
  description: string
  series_type: 'playlist' | 'course' | 'collection'
  has_seasons: boolean
  thumbnail_url: string
  thumbnail_source: 'vimeo' | 'upload' | 'url' | 'default'
  thumbnail_color: string
  is_public: boolean
  tags: string
}

export default function SeriesForm({ series, onClose, onSuccess }: SeriesFormProps) {
  const isEditing = !!series
  const { toast } = useToast()

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    series_type: 'playlist',
    has_seasons: false,
    thumbnail_url: '',
    thumbnail_source: 'default',
    thumbnail_color: '#3b82f6',
    is_public: false,
    tags: '',
  })

  const [errors, setErrors] = useState<Partial<FormData>>({})

  // Initialize form data when editing
  useEffect(() => {
    if (series) {
      setFormData({
        name: series.name,
        description: series.description || '',
        series_type: series.series_type,
        has_seasons: series.has_seasons,
        thumbnail_url: series.thumbnail_url || '',
        thumbnail_source: series.thumbnail_source,
        thumbnail_color: series.thumbnail_color || '#3b82f6',
        is_public: series.is_public,
        tags: series.tags?.join(', ') || '',
      })
    }
  }, [series])

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      }

      const url = isEditing 
        ? `/api/video-library/series/${series!.id}`
        : '/api/video-library/series'
      
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save series')
      }

      return response.json()
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: isEditing ? 'Series updated successfully' : 'Series created successfully',
      })
      onSuccess()
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to save series: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  const validateForm = () => {
    const newErrors: Partial<FormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Series name is required'
    }

    if (formData.thumbnail_source === 'url' && formData.thumbnail_url && 
        !formData.thumbnail_url.match(/^https?:\/\/.+/)) {
      newErrors.thumbnail_url = 'Please enter a valid URL'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    mutation.mutate(formData)
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Series' : 'Create New Series'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">Series Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter series name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="series_type">Series Type</Label>
                <Select 
                  value={formData.series_type} 
                  onValueChange={(value: 'playlist' | 'course' | 'collection') => 
                    handleInputChange('series_type', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="playlist">Playlist</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="collection">Collection</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="has_seasons"
                    checked={formData.has_seasons}
                    onCheckedChange={(checked) => handleInputChange('has_seasons', checked)}
                  />
                  <Label htmlFor="has_seasons">Has Seasons/Modules</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_public"
                    checked={formData.is_public}
                    onCheckedChange={(checked) => handleInputChange('is_public', checked)}
                  />
                  <Label htmlFor="is_public">Make Public</Label>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter series description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="react, tutorial, beginner"
              />
            </div>
          </div>

          {/* Thumbnail Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Thumbnail Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="thumbnail_source">Thumbnail Source</Label>
                <Select 
                  value={formData.thumbnail_source} 
                  onValueChange={(value: 'vimeo' | 'upload' | 'url' | 'default') => 
                    handleInputChange('thumbnail_source', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default (Color)</SelectItem>
                    <SelectItem value="url">Custom URL</SelectItem>
                    <SelectItem value="upload">Upload Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="thumbnail_color">Thumbnail Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="thumbnail_color"
                    type="color"
                    value={formData.thumbnail_color}
                    onChange={(e) => handleInputChange('thumbnail_color', e.target.value)}
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <Input
                    value={formData.thumbnail_color}
                    onChange={(e) => handleInputChange('thumbnail_color', e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {formData.thumbnail_source === 'url' && (
              <div>
                <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                <Input
                  id="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={(e) => handleInputChange('thumbnail_url', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className={errors.thumbnail_url ? 'border-red-500' : ''}
                />
                {errors.thumbnail_url && (
                  <p className="text-sm text-red-600 mt-1">{errors.thumbnail_url}</p>
                )}
              </div>
            )}

            {formData.thumbnail_source === 'upload' && (
              <Alert>
                <AlertDescription>
                  Image upload functionality coming soon. Please use URL or default color for now.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending}
            >
              {mutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isEditing ? 'Update Series' : 'Create Series'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}