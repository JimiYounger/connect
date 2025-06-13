'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Upload, 
  Image as ImageIcon, 
  Link, 
  X, 
  Loader2,
  AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface ThumbnailUploadProps {
  videoId?: string
  currentThumbnailUrl?: string
  thumbnailSource: 'vimeo' | 'upload' | 'url'
  onThumbnailChange: (url: string, source: 'vimeo' | 'upload' | 'url') => void
  vimeoThumbnailUrl?: string
}

export function ThumbnailUpload({ 
  videoId, 
  currentThumbnailUrl, 
  thumbnailSource, 
  onThumbnailChange,
  vimeoThumbnailUrl 
}: ThumbnailUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState(currentThumbnailUrl || '')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${videoId || Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${fileName}`

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('video-thumbnails')
        .upload(filePath, file)

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data } = supabase.storage
        .from('video-thumbnails')
        .getPublicUrl(filePath)

      onThumbnailChange(data.publicUrl, 'upload')
      
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      setError('Please enter a URL')
      return
    }
    
    // Basic URL validation
    try {
      new URL(urlInput)
      setError(null)
      onThumbnailChange(urlInput, 'url')
    } catch {
      setError('Please enter a valid URL')
    }
  }

  const getThumbnailUrl = () => {
    switch (thumbnailSource) {
      case 'upload':
      case 'url':
        return currentThumbnailUrl
      case 'vimeo':
      default:
        return vimeoThumbnailUrl
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Thumbnail Source</Label>
        <Select 
          value={thumbnailSource} 
          onValueChange={(value: 'vimeo' | 'upload' | 'url') => {
            if (value === 'vimeo') {
              onThumbnailChange('', 'vimeo')
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vimeo">Use Vimeo Thumbnail</SelectItem>
            <SelectItem value="upload">Upload Custom Thumbnail</SelectItem>
            <SelectItem value="url">Use External URL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Current Thumbnail Preview */}
      {getThumbnailUrl() && (
        <Card>
          <CardContent className="p-4">
            <Label className="text-sm font-medium">Current Thumbnail</Label>
            <div className="mt-2 relative">
              <Image
                src={getThumbnailUrl() || ''}
                alt="Video thumbnail"
                width={300}
                height={200}
                className="w-full max-w-xs h-auto rounded-lg border"
                onError={() => setError('Failed to load thumbnail')}
              />
              <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                {thumbnailSource === 'vimeo' ? 'Vimeo' : thumbnailSource === 'upload' ? 'Uploaded' : 'External'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Section */}
      {thumbnailSource === 'upload' && (
        <Card>
          <CardContent className="p-4">
            <Label className="text-sm font-medium">Upload Custom Thumbnail</Label>
            <div className="mt-2 space-y-3">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Image
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* URL Section */}
      {thumbnailSource === 'url' && (
        <Card>
          <CardContent className="p-4">
            <Label className="text-sm font-medium">External Thumbnail URL</Label>
            <div className="mt-2 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/thumbnail.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <Button onClick={handleUrlSubmit} variant="outline">
                  <Link className="h-4 w-4 mr-2" />
                  Apply
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-red-800 text-sm">{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto h-auto p-1"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}